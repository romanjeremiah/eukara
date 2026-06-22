import * as telegram from '../lib/telegram';
import type { TelegramMessage, TelegramCallbackQuery } from '../types/telegram';
import { log } from '../lib/logger';
import { loadHistory } from '../lib/history';
import { CloudflareProvider } from '../ai/cloudflare';
import { CF_MODELS } from '../config/models';
import { arrayBufferToBase64 } from '../lib/media';

export interface MoodWizardState {
	step: 'sleep' | 'mood' | 'feelings' | 'activities' | 'photo';
	data: {
		sleepHours?: string;
		moodLevel?: string;
		feelings?: string;
		activities?: string;
	};
}

const WIZARD_TTL = 3600; // 1 hour timeout

export async function startMoodWizard(chatId: number, threadId: string, userId: number, env: Env): Promise<void> {
	const state: MoodWizardState = { step: 'sleep', data: {} };
	await env.CHAT_KV.put(`mood_wizard_${userId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });

	await telegram.sendMessage(chatId, threadId, 'How many hours did you sleep?', env, {
		markup: {
			force_reply: true,
			input_field_placeholder: 'e.g. 7'
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
		state.step = 'feelings';
		await env.CHAT_KV.put(`mood_wizard_${userId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });
		
		await telegram.editMessage(chatId, msgId, 'How do you feel?', env, {
			inline_keyboard: [[{ text: 'Custom Feeling', callback_data: 'wizard_custom_feeling' }]]
		});
		await promptFeelings(chatId, threadId, env);
		return true;
	}
	
	if (state.step === 'feelings' && action === 'custom_feeling') {
		await promptFeelings(chatId, threadId, env);
		return true;
	}
	
	if (state.step === 'activities' && action === 'custom_activity') {
		await promptActivities(chatId, threadId, env);
		return true;
	}

	if (state.step === 'photo' && action === 'skip_photo') {
		await telegram.editMessage(chatId, msgId, 'Skipped photo.', env);
		await finishWizard(chatId, threadId, userId, state, null, env);
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
	
	if (state.step === 'feelings') {
		state.data.feelings = text;
		state.step = 'activities';
		await env.CHAT_KV.put(`mood_wizard_${userId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });
		
		await promptActivities(chatId, threadId, env);
		return true;
	}
	
	if (state.step === 'activities') {
		state.data.activities = text;
		state.step = 'photo';
		await env.CHAT_KV.put(`mood_wizard_${userId}`, JSON.stringify(state), { expirationTtl: WIZARD_TTL });
		
		await telegram.sendMessage(chatId, threadId, 'Do you want to send a photo to attach to this mood log?', env, {
			markup: {
				inline_keyboard: [[{ text: 'Skip', callback_data: 'wizard_skip_photo' }]]
			}
		});
		return true;
	}

	if (state.step === 'photo') {
		let photoBuffer: ArrayBuffer | null = null;
		
		if (message.photo && message.photo.length > 0) {
			// Get the largest photo
			const largestPhoto = message.photo.reduce((prev, current) => 
				(prev.file_size || 0) > (current.file_size || 0) ? prev : current
			);
			photoBuffer = await telegram.downloadFile(largestPhoto.file_id, env);
		}
		
		await finishWizard(chatId, threadId, userId, state, photoBuffer, env);
		return true;
	}

	return true;
}

async function promptFeelings(chatId: number, threadId: string, env: Env) {
	await telegram.sendMessage(chatId, threadId, 'Which word can describe your feelings?', env, {
		markup: {
			force_reply: true,
			input_field_placeholder: 'Type your feeling...'
		}
	});
}

async function promptActivities(chatId: number, threadId: string, env: Env) {
	await telegram.sendMessage(chatId, threadId, 'What have you been up to?', env, {
		markup: {
			force_reply: true,
			input_field_placeholder: 'Type your activities...'
		}
	});
}

async function finishWizard(chatId: number, threadId: string, userId: number, state: MoodWizardState, photo: ArrayBuffer | null, env: Env) {
	await env.CHAT_KV.delete(`mood_wizard_${userId}`);
	await telegram.sendChatAction(chatId, threadId, 'typing', env);

	let visionContext = '';
	if (photo) {
		try {
			visionContext = await analyzeImage(
				"Describe what is in this photo briefly. This photo is attached to a mood log.",
				photo,
				env
			);
		} catch (e) {
			log.error('vision_analysis_failed', { msg: (e as Error).message });
			visionContext = '(Photo analysis failed)';
		}
		
		// Optional: Save to R2 history if needed
		// await env.MEDIA_BUCKET.put(\`mood_photo_\${Date.now()}.jpg\`, photo);
	}

	const history = await getFormattedHistory(env, chatId, threadId, 10);
	
	const prompt = `
You are a highly perceptive, concise friend. Review the following mood check-in data and recent chat history to write an extremely concise, natural summary of how the user is doing.

Rules:
1. Be extremely concise (2-3 sentences max).
2. Sound like a friend's observation, not a clinical assessment. Do not use medical or psychological terminology.
3. Automatically allocate suitable emojis to their feelings and activities if they aren't included.
4. Incorporate context from the recent chat history and the photo (if analyzed) to make the summary insightful.

Mood Check Data:
- Sleep: ${state.data.sleepHours} hours
- Mood Level: ${state.data.moodLevel}
- Feelings: ${state.data.feelings}
- Activities: ${state.data.activities}
- Photo Analysis: ${visionContext || 'None'}

Recent Chat History:
${history}
`;

	try {
		const summary = await generateText(prompt, env);
		await telegram.sendMessage(chatId, threadId, summary, env);
	} catch (e) {
		log.error('wizard_summary_failed', { msg: (e as Error).message });
		await telegram.sendMessage(chatId, threadId, "Mood logged successfully, but I couldn't generate a summary right now.", env);
	}
}

async function analyzeImage(prompt: string, photoBuffer: ArrayBuffer, env: Env): Promise<string> {
	const provider = new CloudflareProvider(env.AI, CF_MODELS.vision);
	const base64 = arrayBufferToBase64(photoBuffer);
	const response = await provider.chat([{
		role: 'user',
		content: [
			{ type: 'text', text: prompt },
			{ type: 'inline_data', mimeType: 'image/jpeg', data: base64 }
		]
	}]);
	return response.text || '';
}

async function getFormattedHistory(env: Env, chatId: number, threadId: string, limit: number): Promise<string> {
	const messages = await loadHistory(env, chatId, threadId);
	return messages.slice(-limit).map(m => `${m.role}: ${Array.isArray(m.content) ? '[media]' : m.content}`).join('\n');
}

async function generateText(prompt: string, env: Env): Promise<string> {
	const provider = new CloudflareProvider(env.AI, CF_MODELS.chat);
	const response = await provider.chat([{ role: 'user', content: prompt }]);
	return response.text || '';
}
