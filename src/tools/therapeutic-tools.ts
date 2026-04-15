// Therapeutic Note Tools — keyed by ctx.userId

import { defineTool, ok, empty } from './factory';

export const saveTherapeuticNote = defineTool(
	'save_therapeutic_note',
	'Save a structured therapeutic note.',
	{
		note_type: { type: 'string', enum: ['pattern', 'schema', 'trigger', 'avoidance', 'homework', 'session', 'growth'] },
		content: { type: 'string' },
		severity: { type: 'integer', description: '1-5 severity/importance scale' },
	},
	['note_type', 'content'],
	async (args, env, ctx) => {
		await env.DB.prepare(
			'INSERT INTO memories (user_id, category, fact, importance_score) VALUES (?, ?, ?, ?)'
		).bind(ctx.userId, args.note_type as string, args.content as string, (args.severity as number) ?? 2).run();
		return ok({ note_type: args.note_type });
	}
);

export const getTherapeuticNotes = defineTool(
	'get_therapeutic_notes',
	'Retrieve therapeutic notes for review.',
	{
		note_type: { type: 'string' },
		limit: { type: 'integer', description: 'Max results. Default 10.' },
	},
	[],
	async (args, env, ctx) => {
		const categories = ['pattern', 'schema', 'trigger', 'avoidance', 'homework', 'session', 'growth'];
		let query: string;
		const params: (number | string)[] = [ctx.userId];

		if (args.note_type && categories.includes(args.note_type as string)) {
			query = 'SELECT category, fact, importance_score, created_at FROM memories WHERE user_id = ? AND category = ? ORDER BY created_at DESC LIMIT ?';
			params.push(args.note_type as string, (args.limit as number) ?? 10);
		} else {
			const placeholders = categories.map(() => '?').join(',');
			query = `SELECT category, fact, importance_score, created_at FROM memories WHERE user_id = ? AND category IN (${placeholders}) ORDER BY created_at DESC LIMIT ?`;
			params.push(...categories, (args.limit as number) ?? 10);
		}

		const { results } = await env.DB.prepare(query).bind(...params).all();
		if (!results?.length) return empty('No therapeutic notes found.');
		return ok({ count: results.length, notes: results });
	}
);
