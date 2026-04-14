// Memory & Episode Tools

import { defineTool, ok } from './factory';
import * as memory from '../services/memory';
import * as episodeSvc from '../services/episode';

export const saveMemory = defineTool(
	'save_memory',
	"Save an important fact about the user. Always use the person's actual first name. Categories: preference, personal, work, hobby, identity, relationship, health, habit, pattern, trigger, avoidance, schema, growth, coping, insight, idea, brain_dump, discovery. Set importance 2-3 for therapeutic breakthroughs.",
	{
		category: { type: 'string', description: 'Memory category' },
		fact: { type: 'string', description: "The fact to remember. Use the person's real name." },
		importance: { type: 'integer', description: '1=normal, 2=notable, 3=breakthrough' },
	},
	['category', 'fact'],
	async (args, env, ctx) => {
		await memory.saveMemory(env, ctx.chatId, args.category as string, args.fact as string, (args.importance as number) ?? 1);
		return ok({ category: args.category, importance: args.importance ?? 1 });
	}
);

export const saveEpisode = defineTool(
	'save_episode',
	'Record a structured episode from a significant interaction. Captures trigger, emotions, intervention, outcome, and lesson for future reference.',
	{
		type: { type: 'string', enum: ['crisis', 'breakthrough', 'pattern', 'checkin', 'conversation'] },
		trigger: { type: 'string', description: 'What prompted this episode' },
		emotions: { type: 'array', items: { type: 'string' }, description: 'Emotions present' },
		intervention: { type: 'string', description: 'What you did/suggested' },
		outcome: { type: 'string', enum: ['positive', 'negative', 'neutral', 'pending'] },
		lesson: { type: 'string', description: 'What was learned' },
		mood_score: { type: 'integer', description: 'Mood score at time (0-10)' },
	},
	['type', 'trigger'],
	async (args, env, ctx) => {
		await episodeSvc.saveEpisode(env, ctx.chatId, {
			type: args.type as string,
			trigger: args.trigger as string,
			emotions: args.emotions as string[] ?? [],
			intervention: args.intervention as string,
			outcome: args.outcome as string,
			lesson: args.lesson as string,
			moodScore: args.mood_score as number,
		});
		return ok();
	}
);

export const updateEpisodeOutcome = defineTool(
	'update_episode_outcome',
	'Update a previous episode with its outcome and lesson learned. Use after following up on a pending episode.',
	{
		episode_id: { type: 'integer', description: 'The episode ID to update' },
		outcome: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
		lesson: { type: 'string', description: 'What was learned from this episode' },
	},
	['episode_id', 'outcome', 'lesson'],
	async (args, env) => {
		await episodeSvc.updateEpisodeOutcome(env, args.episode_id as number, args.outcome as string, args.lesson as string);
		return ok();
	}
);
