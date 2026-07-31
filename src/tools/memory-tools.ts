// Memory & Episode Tools — all data keyed by ctx.userId

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
		await memory.saveMemory(env, ctx.userId, args.category as string, args.fact as string, (args.importance as number) ?? 1);
		return ok({ category: args.category, importance: args.importance ?? 1 });
	}
);

export const supersedeMemory = defineTool(
	'supersede_memory',
	"Mark an outdated memory as superseded when the user explicitly reports a change that contradicts it (e.g. 'I prefer dry wine now, not sweet', 'I moved to London'). The row is retained in the database for audit but excluded from default retrieval. Always pair with a save_memory call for the new fact. Do NOT use during emotional turns. Do NOT use on inferred contradictions — only on explicit user-stated changes.",
	{
		memory_id: { type: 'integer', description: 'The id of the outdated memory to supersede. Get this from the memory context block where each fact is listed.' },
	},
	['memory_id'],
	async (args, env, ctx) => {
		await memory.supersedeMemory(env, ctx.userId, args.memory_id as number);
		return ok({ memory_id: args.memory_id });
	}
);

export const saveEpisode = defineTool(
	'save_episode',
	'Record a structured episode from a significant interaction.',
	{
		type: { type: 'string', enum: ['crisis', 'breakthrough', 'pattern', 'checkin', 'conversation'] },
		trigger: { type: 'string', description: 'What prompted this episode' },
		emotions: { type: 'array', items: { type: 'string' } },
		intervention: { type: 'string', description: 'What you did/suggested' },
		outcome: { type: 'string', enum: ['positive', 'negative', 'neutral', 'pending'] },
		lesson: { type: 'string', description: 'What was learned' },
		mood_score: { type: 'integer' },
	},
	['type', 'trigger'],
	async (args, env, ctx) => {
		await episodeSvc.saveEpisode(env, ctx.userId, {
			type: args.type as string, trigger: args.trigger as string,
			emotions: args.emotions as string[] ?? [], intervention: args.intervention as string,
			outcome: args.outcome as string, lesson: args.lesson as string,
			moodScore: args.mood_score as number,
		});
		return ok();
	}
);

export const updateEpisodeOutcome = defineTool(
	'update_episode_outcome',
	'Update a previous episode with its outcome and lesson learned.',
	{
		episode_id: { type: 'integer' },
		outcome: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
		lesson: { type: 'string' },
	},
	['episode_id', 'outcome', 'lesson'],
	async (args, env, ctx) => {
		// Uses userId + episodeId to prevent cross-user modification
		await episodeSvc.updateEpisodeOutcome(env, ctx.userId, args.episode_id as number, args.outcome as string, args.lesson as string);
		return ok();
	}
);
