import { CF_MODELS } from '../config/models';
import { runAI } from '../lib/ai-gateway';
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
		const response = await runAI<{ response: string } | { choices: Array<{ message: { content: string } }> }>(
			env.AI,
			CF_MODELS.observation as unknown as keyof AiModels,
			{
				messages: [{ role: 'user', content: prompt }],
				max_tokens: 150
			}
		);

		let resultStr = '';
		if ('response' in response) {
			resultStr = response.response;
		} else if ('choices' in response && response.choices?.length > 0) {
			resultStr = response.choices[0]?.message?.content || '';
		}

		const jsonStart = resultStr.indexOf('{');
		const jsonEnd = resultStr.lastIndexOf('}');
		
		if (jsonStart !== -1 && jsonEnd !== -1) {
			const jsonStr = resultStr.slice(jsonStart, jsonEnd + 1);
			const parsed = JSON.parse(jsonStr) as Partial<CuratorResult>;
			return {
				intent: (parsed.intent as CuratorResult['intent']) || 'casual',
				isCrisis: parsed.isCrisis === true
			};
		}
	} catch (err) {
		log.error('curator_eval_failed', { error: (err as Error).message });
	}

	// Fail open to casual so the conversation can continue
	return { intent: 'casual', isCrisis: false };
}
