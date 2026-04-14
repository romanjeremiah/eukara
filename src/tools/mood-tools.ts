// Mood Journal Tools

import { defineTool, ok, empty } from './factory';

export const logMoodEntry = defineTool(
	'log_mood_entry',
	'Log a mood journal entry. Bipolar scale: 0-1 severe depression, 2-3 mild depression, 4-6 balanced, 7-8 hypomania, 9-10 mania. Partial updates supported. If score is 0-1 or 9-10, acknowledge compassionately and suggest professional contact.',
	{
		entry_type: { type: 'string', enum: ['morning', 'midday', 'evening'] },
		mood_score: { type: 'integer', description: 'Bipolar mood scale 0-10' },
		emotions: { type: 'array', items: { type: 'string' }, description: 'Identified emotions' },
		sleep_hours: { type: 'number', description: 'Hours of sleep' },
		sleep_quality: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
		medication_taken: { type: 'boolean' },
		medication_notes: { type: 'string' },
		activities: { type: 'array', items: { type: 'string' } },
		note: { type: 'string', description: 'Free-text journal note' },
		ai_observation: { type: 'string', description: 'Your clinical observation about the user\'s state' },
	},
	['entry_type'],
	async (args, env, ctx) => {
		const now = new Date();
		const date = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
			.toISOString().split('T')[0]!;
		const entryType = (args.entry_type as string) || 'evening';

		const data: Record<string, unknown> = {};
		if (args.mood_score != null) data.mood_score = args.mood_score;
		if (args.emotions) data.emotions = JSON.stringify(args.emotions);
		if (args.sleep_hours != null) data.sleep_hours = args.sleep_hours;
		if (args.sleep_quality) data.sleep_quality = args.sleep_quality;
		if (args.medication_taken != null) data.medication_taken = args.medication_taken ? 1 : 0;
		if (args.medication_notes) data.medication_notes = args.medication_notes;
		if (args.activities) data.activities = JSON.stringify(args.activities);
		if (args.note) data.note = args.note;
		if (args.ai_observation) data.ai_observation = args.ai_observation;

		// Upsert: check if entry exists, update or insert
		const existing = await env.DB.prepare(
			'SELECT id FROM mood_journal WHERE chat_id = ? AND date = ? AND entry_type = ?'
		).bind(ctx.chatId, date, entryType).first<{ id: number }>();

		if (existing) {
			const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
			if (sets) {
				await env.DB.prepare(`UPDATE mood_journal SET ${sets} WHERE id = ?`)
					.bind(...Object.values(data), existing.id).run();
			}
		} else {
			const keys = ['chat_id', 'date', 'entry_type', ...Object.keys(data)];
			const placeholders = keys.map(() => '?').join(', ');
			await env.DB.prepare(`INSERT INTO mood_journal (${keys.join(', ')}) VALUES (${placeholders})`)
				.bind(ctx.chatId, date, entryType, ...Object.values(data)).run();
		}

		return ok({ date, entry_type: entryType, mood_score: args.mood_score });
	}
);

export const getMoodHistory = defineTool(
	'get_mood_history',
	'Retrieve mood journal history for analysis. Use when user asks about mood trends, patterns, or "how have I been doing?"',
	{
		days: { type: 'integer', description: 'Days of history to retrieve. Default 14.' },
		entry_type: { type: 'string', enum: ['morning', 'midday', 'evening'], description: 'Filter by type. Omit for all.' },
	},
	[],
	async (args, env, ctx) => {
		const days = (args.days as number) || 14;
		const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!;

		let query = 'SELECT * FROM mood_journal WHERE chat_id = ? AND date >= ?';
		const params: (number | string)[] = [ctx.chatId, since];
		if (args.entry_type) {
			query += ' AND entry_type = ?';
			params.push(args.entry_type as string);
		}
		query += ' ORDER BY date DESC, entry_type';

		const { results } = await env.DB.prepare(query).bind(...params).all();
		if (!results?.length) return empty('No mood data recorded yet.');

		return ok({ count: results.length, entries: results });
	}
);
