import * as telegram from '../lib/telegram';
import type { TelegramMessage, TelegramCallbackQuery } from '../types/telegram';
import { log } from '../lib/logger';
import { loadHistory } from '../lib/history';
import { createConfiguredProvider } from '../ai/provider-factory';
import { CF_MODELS, OPENAI_MODELS } from '../config/models';
import * as persona from '../services/persona';
import {
	arrayBufferToBase64,
	persistTelegramMedia,
	updateStoredMediaState,
	type StoredMediaRef,
} from '../lib/media';

export interface MoodWizardState {
	step: 'sleep' | 'mood' | 'photo';
	data: {
		sleepHours?: string;
		moodLevel?: string;
		photoRef?: string;
	};
}

const WIZARD_TTL = 3600; // 1 hour timeout

export async function startMoodWizard(chatId: number, threadId: string, userId: number, env: Env): Promise<void> {
	const state: MoodWizardState = { step: 'sleep', data: {} };
	await env.CHAT_KV.put(`mood_wizard_${userId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });

	await telegram.sendMessage(chatId, threadId, 'How many hours did you sleep?', env, {
		markup: {
			force_reply: true,
			input_field_placeholder: 'e.g. 7 or "hardly any"'
		}
	});
}

export async function handleWizardCallback(query: TelegramCallbackQuery, env: Env): Promise<boolean> {
	if (!query.data?.startsWith('wizard_')) return false;
	
	const userId = query.from.id;
	const chatId = query.message?.chat.id;
	const threadId = query.message?.message_thread_id?.toString() || 'default';
	const msgId = query.message?.message_id;
	
	if (!chatId || !msgId) return false;

	const rawState = await env.CHAT_KV.get(`mood_wizard_${userId}`);
	if (!rawState) {
		await telegram.answerCallbackQuery(query.id, env, { text: 'Wizard expired. Run /mood to restart.', showAlert: true });
		return true;
	}
	
	const state = JSON.parse(rawState) as MoodWizardState;
	const action = query.data.replace('wizard_', '');
	
	await telegram.answerCallbackQuery(query.id, env).catch(() => {});

	if (state.step === 'mood' && action.startsWith('mood_')) {
		state.data.moodLevel = action.replace('mood_', '');
		state.step = 'photo';
		await env.CHAT_KV.put(`mood_wizard_${userId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });
		
		await telegram.editMessage(chatId, msgId, 'Do you want to attach a photo to this mood log?', env, {
			inline_keyboard: [[{ text: 'Skip', callback_data: 'wizard_skip_photo' }]]
		});
		return true;
	}

	if (state.step === 'photo' && action === 'skip_photo') {
		await telegram.editMessage(chatId, msgId, 'Skipped photo.', env);
		await finishWizard(chatId, threadId, userId, state, null, null, msgId, env);
		return true;
	}

	return true;
}

export async function handleWizardMessage(message: TelegramMessage, env: Env): Promise<boolean> {
	const userId = message.from?.id;
	const chatId = message.chat.id;
	const threadId = message.message_thread_id?.toString() || 'default';
	
	if (!userId) return false;
	
	const rawState = await env.CHAT_KV.get(`mood_wizard_${userId}`);
	if (!rawState) return false;

	const state = JSON.parse(rawState) as MoodWizardState;
	const text = message.text || '';
	
	if (state.step === 'sleep') {
		state.data.sleepHours = text;
		state.step = 'mood';
		await env.CHAT_KV.put(`mood_wizard_${userId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });
		
		await telegram.sendMessage(chatId, threadId, 'How do you feel?', env, {
			markup: {
				inline_keyboard: [
					[
						{ text: 'Normal 😁', callback_data: 'wizard_mood_Normal 😁' },
						{ text: 'Sad 😔', callback_data: 'wizard_mood_Sad 😔' }
					],
					[
						{ text: 'Unhappy 🙁', callback_data: 'wizard_mood_Unhappy 🙁' },
						{ text: 'Good ☺️', callback_data: 'wizard_mood_Good ☺️' }
					],
					[
						{ text: 'Happy 🙃', callback_data: 'wizard_mood_Happy 🙃' }
					]
				]
			}
		});
		return true;
	}

	if (state.step === 'mood') {
		state.data.moodLevel = text || 'Normal 😁';
		state.step = 'photo';
		await env.CHAT_KV.put(`mood_wizard_${userId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });
		
		await telegram.sendMessage(chatId, threadId, 'Do you want to attach a photo to this mood log?', env, {
			markup: {
				inline_keyboard: [[{ text: 'Skip', callback_data: 'wizard_skip_photo' }]]
			}
		});
		return true;
	}

	if (state.step === 'photo') {
		let photoBuffer: ArrayBuffer | null = null;
		let photoFileId: string | null = null;
		
		if (message.photo && message.photo.length > 0) {
			// Get the largest photo
			const largestPhoto = message.photo.reduce((prev, current) => 
				(prev.file_size || 0) > (current.file_size || 0) ? prev : current
			);
			photoFileId = largestPhoto.file_id;
			photoBuffer = await telegram.downloadFile(largestPhoto.file_id, env);
		}
		
		await finishWizard(
			chatId,
			threadId,
			userId,
			state,
			photoBuffer,
			photoFileId,
			message.message_id,
			env,
		);
		return true;
	}

	return true;
}

async function finishWizard(
	chatId: number,
	threadId: string,
	userId: number,
	state: MoodWizardState,
	photo: ArrayBuffer | null,
	photoFileId: string | null,
	sourceMessageId: number,
	env: Env,
) {
	await env.CHAT_KV.delete(`mood_wizard_${userId}`);
	await telegram.sendChatAction(chatId, threadId, 'typing', env);

	let visionContext = '';
	if (photo && photoFileId) {
		let storedPhoto: StoredMediaRef | undefined;
		try {
			storedPhoto = await persistTelegramMedia(env, {
				fileId: photoFileId,
				kind: 'photo',
				mimeType: 'image/jpeg',
			}, photo, {
				chatId,
				fileId: photoFileId,
				messageId: sourceMessageId,
				threadId,
				userId,
			});
			await updateStoredMediaState(env, storedPhoto, 'processing');
			state.data.photoRef = storedPhoto.key;
		} catch (e) {
			log.error('mood_photo_persistence_failed', { msg: (e as Error).message });
			visionContext = '(Photo could not be saved, so it was not analysed)';
		}

		if (storedPhoto) {
			try {
				visionContext = await analyzeImage(
					'Describe what is in this photo briefly. This photo is attached to a mood log.',
					photo,
					env,
				);
				await updateStoredMediaState(env, storedPhoto, 'ready');
			} catch (e) {
				log.error('vision_analysis_failed', { msg: (e as Error).message });
				visionContext = '(Photo analysis failed)';
				await updateStoredMediaState(
					env,
					storedPhoto,
					'failed',
					(e as Error).message,
				).catch(() => {});
			}
		}
	}

	const now = new Date();
	const date = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' })).toISOString().split('T')[0]!;
	
	const moodStr = state.data.moodLevel || '';
	let moodScore: number | null = 3; // Default neutral
	if (moodStr.includes('Sad') || moodStr.includes('😔')) moodScore = 1;
	if (moodStr.includes('Unhappy') || moodStr.includes('🙁')) moodScore = 2;
	if (moodStr.includes('Normal') || moodStr.includes('😁')) moodScore = 3;
	if (moodStr.includes('Good') || moodStr.includes('☺️')) moodScore = 4;
	if (moodStr.includes('Happy') || moodStr.includes('🙃')) moodScore = 5;

	// Extract sleep hours numerically for DB
	const numericSleep = parseFloat(state.data.sleepHours || '0') || null;

	try {
		await env.DB.prepare(
			`INSERT INTO mood_journal (user_id, date, entry_type, mood_score, emotions, sleep_hours, activities, ai_observation, source) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).bind(
			userId, date, 'checkin', moodScore, '[]', 
			numericSleep, '[]', visionContext, 'manual_command'
		).run();
	} catch (e) {
		log.error('wizard_db_save_failed', { msg: (e as Error).message });
	}

	const history = await getFormattedHistory(env, chatId, threadId, 10);
	
	const systemInstruction = await persona.buildSystemInstruction(
		env,
		userId,
		`Completed guided mood check-in:
- Sleep: ${state.data.sleepHours} hours
- Mood Level: ${state.data.moodLevel}
- Photo Analysis: ${visionContext || 'None'}

Recent Chat History:
${history}`,
		{
			register: 'warm',
			activeConstraints: [
				{ category: 'task', text: 'Reply in one or two sentences.' },
				{ category: 'tone', text: 'Offer a natural, observant reflection rather than a clinical assessment.' },
				{ category: 'boundary', text: 'Do not use medical or psychological terminology.' },
			],
		},
	);

	const provider = createConfiguredProvider(env, {
		cloudflare: CF_MODELS.chat,
		openai: OPENAI_MODELS.chat,
	});
	
	try {
		const aiResponse = await provider.chat(
			[{ role: 'user', content: 'Reflect this check-in back to me naturally.' }],
			[],
			{
				systemInstruction,
				thinkingLevel: 'LOW',
				maxTokens: 300,
				enableGrounding: false,
			},
		);
		
		await telegram.sendMessage(chatId, threadId, aiResponse.text || "Got it, your mood has been logged.", env);

		// Inject the final summary into the conversation history so the AI remembers it
		const entryStr = `[Mood Logged] Sleep: ${state.data.sleepHours}, Mood: ${state.data.moodLevel}. Summary: ${aiResponse.text}`;
		try {
			const historyLib = await import('../lib/history');
			const hist = await historyLib.loadHistory(env, chatId, threadId);
			hist.push({ role: 'system', content: entryStr });
			await historyLib.saveHistory(env, chatId, threadId, hist);
		} catch (error) {
			log.error('append_history_failed', { msg: (error as Error).message });
		}

	} catch (e) {
		log.error('wizard_summary_failed', { msg: (e as Error).message });
		await telegram.sendMessage(chatId, threadId, `Mood logged. Sleep: ${state.data.sleepHours}, Mood: ${state.data.moodLevel}`, env);
	}
}

async function getFormattedHistory(env: Env, chatId: number, threadId: string, limit: number): Promise<string> {
	const messages = await loadHistory(env, chatId, threadId);
	if (!messages || messages.length === 0) return 'No recent history.';
	return messages.slice(-limit).map(m => `[${m.role}] ${typeof m.content === 'string' ? m.content : '[Complex Content]'}`).join('\n');
}

async function analyzeImage(prompt: string, imageBuffer: ArrayBuffer, env: Env): Promise<string> {
	const base64Image = arrayBufferToBase64(imageBuffer);
	const provider = createConfiguredProvider(env, {
		cloudflare: CF_MODELS.vision,
		openai: OPENAI_MODELS.vision,
	});
	const response = await provider.chat([{
		role: 'user',
		content: [
			{ type: 'text', text: prompt },
			{ type: 'inline_data', mimeType: 'image/jpeg', data: base64Image },
		],
	}], undefined, { thinkingLevel: 'LOW', maxTokens: 300 });

	return response.text?.trim() || 'No description generated.';
}
