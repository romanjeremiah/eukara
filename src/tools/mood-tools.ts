// Mood Journal Tools — keyed by ctx.userId

import { defineTool, ok, empty } from './factory';

export const logMoodEntry = defineTool(
	'log_mood_entry',
	'Log a mood journal entry. Scale is 1-5 where: 1=Sad, 2=Unhappy, 3=Normal, 4=Good, 5=Happy. Use this when the user mentions their mood naturally. Partial updates supported.',
	{
		entry_type: { type: 'string', enum: ['morning', 'midday', 'evening'] },
		mood_score: { type: 'integer', description: 'Mood scale 1-5' },
		emotions: { type: 'array', items: { type: 'string' } },
		sleep_hours: { type: 'number' },
		sleep_quality: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
		medication_taken: { type: 'boolean' },
		medication_notes: { type: 'string' },
		activities: { type: 'array', items: { type: 'string' } },
		note: { type: 'string' },
		ai_observation: { type: 'string' },
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

		const existing = await env.DB.prepare(
			'SELECT id FROM mood_journal WHERE user_id = ? AND date = ? AND entry_type = ?'
		).bind(ctx.userId, date, entryType).first<{ id: number }>();

		if (existing) {
			const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
			if (sets) {
				await env.DB.prepare(`UPDATE mood_journal SET ${sets} WHERE id = ? AND user_id = ?`)
					.bind(...Object.values(data), existing.id, ctx.userId).run();
			}
		} else {
			const keys = ['user_id', 'date', 'entry_type', ...Object.keys(data)];
			const placeholders = keys.map(() => '?').join(', ');
			await env.DB.prepare(`INSERT INTO mood_journal (${keys.join(', ')}) VALUES (${placeholders})`)
				.bind(ctx.userId, date, entryType, ...Object.values(data)).run();
		}

		return ok({ date, entry_type: entryType, mood_score: args.mood_score });
	}
);

export const getMoodHistory = defineTool(
	'get_mood_history',
	'Retrieve mood journal history for analysis.',
	{
		days: { type: 'integer', description: 'Days of history. Default 14.' },
		entry_type: { type: 'string', enum: ['morning', 'midday', 'evening'] },
	},
	[],
	async (args, env, ctx) => {
		const days = (args.days as number) || 14;
		const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!;

		let query = 'SELECT * FROM mood_journal WHERE user_id = ? AND date >= ?';
		const params: (number | string)[] = [ctx.userId, since];
		if (args.entry_type) { query += ' AND entry_type = ?'; params.push(args.entry_type as string); }
		query += ' ORDER BY date DESC, entry_type';

		const { results } = await env.DB.prepare(query).bind(...params).all();
		if (!results?.length) return empty('No mood data recorded yet.');
		return ok({ count: results.length, entries: results });
	}
);
