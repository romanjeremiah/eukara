import { CF_MODELS, OPENAI_MODELS } from '../config/models';
import { createConfiguredProvider } from './provider-factory';
import { log } from '../lib/logger';

export interface CuratorResult {
	intent: 'casual' | 'emotional_vent' | 'crisis' | 'code' | 'functional';
	isCrisis: boolean;
}

/**
 * Layer A1: The Curator
 * LLM-powered triage to determine the message intent and check for crisis conditions.
 */
export async function evaluateIntent(userText: string, env: Env): Promise<CuratorResult> {
	const prompt = `You are a highly reliable internal routing system. Analyze the user's message and classify its intent.
Return ONLY valid JSON matching this exact schema:
{
  "intent": "casual" | "emotional_vent" | "crisis" | "code" | "functional",
  "isCrisis": boolean
}

Classification Rules:
- "crisis": Imminent threat of self-harm, suicide references, violence, or extreme immediate danger. (isCrisis MUST be true).
- "emotional_vent": Deep emotional distress, anxiety, depression, sadness, or therapy-like venting, but NO imminent threat. (isCrisis must be false).
- "code": Programming, debugging, architecture, software development, HTML, CSS, algorithms.
- "functional": System commands, setting timers, simple tasks, direct factual queries.
- "casual": Everyday conversation, general questions, greetings, jokes, and everything else.

User message:
"${userText}"
`;

	try {
		const provider = createConfiguredProvider(env, {
			openai: OPENAI_MODELS.curator,
			cloudflare: CF_MODELS.observation,
		});
		const response = await provider.chat(
			[{ role: 'user', content: prompt }],
			[],
			{
				systemInstruction: 'Return only the requested routing JSON.',
				thinkingLevel: 'LOW',
				maxTokens: 150,
				enableGrounding: false,
			},
		);

		const resultStr = response.text ?? '';

		const jsonStart = resultStr.indexOf('{');
		const jsonEnd = resultStr.lastIndexOf('}');
		
		if (jsonStart !== -1 && jsonEnd !== -1) {
			const jsonStr = resultStr.slice(jsonStart, jsonEnd + 1);
			const parsed = JSON.parse(jsonStr) as Partial<CuratorResult>;
			const intents: CuratorResult['intent'][] = [
				'casual', 'emotional_vent', 'crisis', 'code', 'functional',
			];
			return {
				intent: intents.includes(parsed.intent as CuratorResult['intent'])
					? parsed.intent as CuratorResult['intent']
					: 'casual',
				isCrisis: parsed.isCrisis === true
			};
		}
	} catch (err) {
		log.error('curator_eval_failed', { error: (err as Error).message });
	}

	// Fail open to casual so the conversation can continue
	return { intent: 'casual', isCrisis: false };
}
