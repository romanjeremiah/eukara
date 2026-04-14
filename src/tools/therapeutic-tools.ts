// Therapeutic Note Tools

import { defineTool, ok, empty } from './factory';
import { queryAll } from '../lib/db';

export const saveTherapeuticNote = defineTool(
	'save_therapeutic_note',
	'Save a structured therapeutic note. Types: pattern (recurring behaviour), schema (core belief), trigger (emotional trigger), avoidance (avoidance pattern), homework (therapeutic task), session (session summary), growth (positive change).',
	{
		note_type: { type: 'string', enum: ['pattern', 'schema', 'trigger', 'avoidance', 'homework', 'session', 'growth'] },
		content: { type: 'string', description: 'The therapeutic note content' },
		severity: { type: 'integer', description: '1-5 severity/importance scale' },
	},
	['note_type', 'content'],
	async (args, env, ctx) => {
		await env.DB.prepare(
			"INSERT INTO memories (chat_id, category, fact, importance_score) VALUES (?, ?, ?, ?)"
		).bind(ctx.chatId, args.note_type as string, args.content as string, (args.severity as number) ?? 2).run();
		return ok({ note_type: args.note_type });
	}
);

export const getTherapeuticNotes = defineTool(
	'get_therapeutic_notes',
	'Retrieve therapeutic notes for review. Use when discussing patterns, triggers, or therapeutic progress.',
	{
		note_type: { type: 'string', description: 'Filter by type. Omit for all therapeutic notes.' },
		limit: { type: 'integer', description: 'Max results. Default 10.' },
	},
	[],
	async (args, env, ctx) => {
		const categories = ['pattern', 'schema', 'trigger', 'avoidance', 'homework', 'session', 'growth'];
		let query: string;
		const params: (number | string)[] = [ctx.chatId];

		if (args.note_type && categories.includes(args.note_type as string)) {
			query = 'SELECT category, fact, importance_score, created_at FROM memories WHERE chat_id = ? AND category = ? ORDER BY created_at DESC LIMIT ?';
			params.push(args.note_type as string, (args.limit as number) ?? 10);
		} else {
			const placeholders = categories.map(() => '?').join(',');
			query = `SELECT category, fact, importance_score, created_at FROM memories WHERE chat_id = ? AND category IN (${placeholders}) ORDER BY created_at DESC LIMIT ?`;
			params.push(...categories, (args.limit as number) ?? 10);
		}

		const { results } = await env.DB.prepare(query).bind(...params).all();
		if (!results?.length) return empty('No therapeutic notes found.');
		return ok({ count: results.length, notes: results });
	}
);
