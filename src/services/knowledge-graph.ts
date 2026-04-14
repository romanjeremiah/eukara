// ============================================================
// Knowledge Graph Service — GraphRAG
//
// Stores Subject-Predicate-Object triples for relational reasoning.
// Enables: "Roman enjoys coffee" + "coffee is stimulant" = context.
// ============================================================

import type { KnowledgeGraphRow } from '../types/db';
import { safeLike, queryAll } from '../lib/db';

export async function saveTriple(
	env: Env,
	chatId: number,
	subject: string,
	predicate: string,
	object: string,
	context: string | null = null,
	source = 'observation'
): Promise<number> {
	// Deduplicate: skip if this exact triple exists
	const existing = await env.DB.prepare(
		'SELECT id FROM knowledge_graph WHERE chat_id = ? AND subject = ? AND predicate = ? AND object = ? LIMIT 1'
	).bind(chatId, subject, predicate, object).first<{ id: number }>();
	if (existing) return existing.id;

	const { meta } = await env.DB.prepare(
		'INSERT INTO knowledge_graph (chat_id, subject, predicate, object, context, source) VALUES (?, ?, ?, ?, ?, ?)'
	).bind(chatId, subject, predicate, object, context, source).run();
	return meta.last_row_id;
}

export async function queryBySubject(
	env: Env, chatId: number, subject: string, limit = 10
): Promise<KnowledgeGraphRow[]> {
	const safe = safeLike(subject);
	if (!safe) return [];
	return queryAll<KnowledgeGraphRow>(env.DB.prepare(
		'SELECT * FROM knowledge_graph WHERE chat_id = ? AND subject LIKE ? ORDER BY created_at DESC LIMIT ?'
	).bind(chatId, `%${safe}%`, limit));
}

export async function queryRelated(
	env: Env, chatId: number, concept: string, limit = 15
): Promise<KnowledgeGraphRow[]> {
	const safe = safeLike(concept);
	if (!safe) return [];
	const pattern = `%${safe}%`;
	return queryAll<KnowledgeGraphRow>(env.DB.prepare(
		'SELECT * FROM knowledge_graph WHERE chat_id = ? AND (subject LIKE ? OR object LIKE ?) ORDER BY confidence DESC, created_at DESC LIMIT ?'
	).bind(chatId, pattern, pattern, limit));
}

export async function findPath(
	env: Env, chatId: number, conceptA: string, conceptB: string, maxHops = 2
): Promise<KnowledgeGraphRow[]> {
	const fromA = await queryRelated(env, chatId, conceptA, 20);
	const bLower = conceptB.toLowerCase();

	// Direct connection?
	const direct = fromA.filter(t =>
		t.object?.toLowerCase().includes(bLower) ||
		t.subject?.toLowerCase().includes(bLower)
	);
	if (direct.length) return direct;
	if (maxHops < 2) return [];

	// Hop 2: follow objects from A
	const intermediates = [...new Set(fromA.map(t => t.object))];
	for (const mid of intermediates.slice(0, 5)) {
		const hop2 = await queryRelated(env, chatId, mid, 10);
		const found = hop2.filter(t =>
			t.object?.toLowerCase().includes(bLower) ||
			t.subject?.toLowerCase().includes(bLower)
		);
		if (found.length) {
			return [...fromA.filter(t => t.object === mid), ...found];
		}
	}
	return [];
}

export function formatGraphContext(triples: KnowledgeGraphRow[], maxLen = 1500): string {
	if (!triples.length) return '';
	let ctx = 'KNOWLEDGE GRAPH (relational facts):\n';
	for (const t of triples) {
		const line = `${t.subject} -> ${t.predicate} -> ${t.object}${t.context ? ` (${t.context})` : ''}\n`;
		if (ctx.length + line.length > maxLen) break;
		ctx += line;
	}
	return ctx;
}
