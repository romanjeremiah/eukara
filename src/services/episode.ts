// ============================================================
// Episode Service — CoALA Episodic Memory
// All data keyed by user_id for per-user isolation.
// ============================================================

import type { EpisodeRow, Episode } from '../types/db';
import { safeLike, queryAll } from '../lib/db';

interface EpisodeInput {
	type?: string;
	trigger?: string | null;
	emotions?: string[];
	intervention?: string | null;
	outcome?: string | null;
	lesson?: string | null;
	moodScore?: number | null;
	relatedMemoryIds?: number[];
	metadata?: Record<string, unknown>;
}

export async function saveEpisode(env: Env, userId: number, episode: EpisodeInput): Promise<void> {
	const {
		type = 'conversation', trigger = null, emotions = [],
		intervention = null, outcome = null, lesson = null,
		moodScore = null, relatedMemoryIds = [], metadata = {},
	} = episode;

	await env.DB.prepare(`
		INSERT INTO episodes (user_id, episode_type, trigger_context, emotions, intervention, outcome, lesson, mood_score, related_memory_ids, metadata)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).bind(
		userId, type, trigger, JSON.stringify(emotions), intervention,
		outcome, lesson, moodScore, JSON.stringify(relatedMemoryIds),
		JSON.stringify(metadata)
	).run();
}

export async function getRecentEpisodes(
	env: Env, userId: number, limit = 10, type?: string
): Promise<Episode[]> {
	let query = 'SELECT * FROM episodes WHERE user_id = ?';
	const params: (number | string)[] = [userId];
	if (type) { query += ' AND episode_type = ?'; params.push(type); }
	query += ' ORDER BY created_at DESC LIMIT ?';
	params.push(limit);
	const rows = await queryAll<EpisodeRow>(env.DB.prepare(query).bind(...params));
	return rows.map(parseEpisode);
}

export async function searchEpisodes(
	env: Env, userId: number, keyword: string, limit = 5
): Promise<Episode[]> {
	const safe = safeLike(keyword);
	if (!safe) return [];
	const pattern = `%${safe}%`;
	const rows = await queryAll<EpisodeRow>(env.DB.prepare(`
		SELECT * FROM episodes WHERE user_id = ?
		AND (trigger_context LIKE ? OR intervention LIKE ? OR lesson LIKE ? OR emotions LIKE ?)
		ORDER BY created_at DESC LIMIT ?
	`).bind(userId, pattern, pattern, pattern, pattern, limit));
	return rows.map(parseEpisode);
}

export async function updateEpisodeOutcome(
	env: Env, userId: number, episodeId: number, outcome: string, lesson: string
): Promise<void> {
	// Filter by BOTH user_id AND id to prevent cross-user modification
	await env.DB.prepare(
		'UPDATE episodes SET outcome = ?, lesson = ? WHERE id = ? AND user_id = ?'
	).bind(outcome, lesson, episodeId, userId).run();
}

export async function getPendingEpisodes(env: Env, userId: number, limit = 5): Promise<Episode[]> {
	const rows = await queryAll<EpisodeRow>(env.DB.prepare(
		"SELECT * FROM episodes WHERE user_id = ? AND outcome = 'pending' ORDER BY created_at DESC LIMIT ?"
	).bind(userId, limit));
	return rows.map(parseEpisode);
}

export interface ProceduralInsights {
	worked: ProceduralInsight[];
	didntWork: ProceduralInsight[];
}

interface ProceduralInsight {
	intervention: string;
	lesson: string | null;
	emotions: string[];
	type: string;
}

export async function getProceduralInsights(env: Env, userId: number): Promise<ProceduralInsights> {
	const [positive, negative] = await Promise.all([
		env.DB.prepare(`
			SELECT intervention, lesson, emotions, episode_type FROM episodes
			WHERE user_id = ? AND outcome = 'positive' AND intervention IS NOT NULL
			ORDER BY created_at DESC LIMIT 10
		`).bind(userId).all(),
		env.DB.prepare(`
			SELECT intervention, lesson, emotions, episode_type FROM episodes
			WHERE user_id = ? AND outcome = 'negative' AND intervention IS NOT NULL
			ORDER BY created_at DESC LIMIT 10
		`).bind(userId).all(),
	]);

	const mapRow = (r: Record<string, unknown>): ProceduralInsight => ({
		intervention: r.intervention as string,
		lesson: r.lesson as string | null,
		emotions: safeJsonParse(r.emotions as string | null, []),
		type: r.episode_type as string,
	});

	return {
		worked: (positive.results ?? []).map(mapRow),
		didntWork: (negative.results ?? []).map(mapRow),
	};
}

export function formatEpisodesForContext(episodes: Episode[], maxLen = 2000): string {
	if (!episodes.length) return '';
	let ctx = 'PAST EPISODES (what happened before in similar situations):\n';
	for (const ep of episodes) {
		const date = new Date(ep.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
		let line = `[${date}] ${ep.episode_type}`;
		if (ep.trigger_context) line += ` | Trigger: ${ep.trigger_context.slice(0, 80)}`;
		if (ep.emotions.length) line += ` | Emotions: ${ep.emotions.join(', ')}`;
		if (ep.intervention) line += ` | Tried: ${ep.intervention.slice(0, 80)}`;
		if (ep.outcome) line += ` | Outcome: ${ep.outcome}`;
		if (ep.lesson) line += ` | Lesson: ${ep.lesson.slice(0, 80)}`;
		ctx += line + '\n';
		if (ctx.length > maxLen) break;
	}
	return ctx;
}

export function formatProceduralContext(insights: ProceduralInsights): string {
	if (!insights.worked.length && !insights.didntWork.length) return '';
	let ctx = 'PROCEDURAL MEMORY (learned from past experience):\n';
	if (insights.worked.length) {
		ctx += 'What has WORKED:\n';
		for (const w of insights.worked) ctx += `- ${w.intervention} -> ${w.lesson ?? 'positive outcome'}\n`;
	}
	if (insights.didntWork.length) {
		ctx += 'What has NOT WORKED:\n';
		for (const w of insights.didntWork) ctx += `- ${w.intervention} -> ${w.lesson ?? 'negative outcome'}\n`;
	}
	return ctx;
}

function parseEpisode(row: EpisodeRow): Episode {
	return { ...row, emotions: safeJsonParse(row.emotions, []), related_memory_ids: safeJsonParse(row.related_memory_ids, []), metadata: safeJsonParse(row.metadata, {}) };
}

function safeJsonParse<T>(str: string | null, fallback: T): T {
	if (!str) return fallback;
	try { return JSON.parse(str) as T; } catch { return fallback; }
}
