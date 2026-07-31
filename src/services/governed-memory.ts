// ============================================================
// Governed Memory v1
//
// D1 is authoritative. Only confirmed, unexpired, evidence-backed assertions
// may enter recall or Vectorize. Queue projection is idempotent because
// Cloudflare Queues provides at-least-once delivery.
// ============================================================

import { log } from '../lib/logger';
import { projectMemoriesForRollback } from './embedding-projection';

export type MemoryAssertionStatus =
	| 'candidate'
	| 'confirmed'
	| 'rejected'
	| 'superseded'
	| 'expired'
	| 'legacy_unverified';

export interface MemoryAssertionRow {
	id: string;
	user_id: number;
	category: string;
	statement: string;
	status: MemoryAssertionStatus;
	confidence: number;
	sensitivity: 'standard' | 'sensitive';
	version: number;
	valid_from: string;
	valid_until: string | null;
	source_kind: string;
	legacy_memory_id: number | null;
	superseded_by: string | null;
	created_at: string;
	updated_at: string;
}

interface EvidenceInput {
	sourceType: string;
	sourceId?: string;
	excerpt: string;
	observedAt?: string;
	extractionConfidence?: number;
}

interface ProjectionOutboxRow {
	id: string;
	assertion_id: string;
	user_id: number;
	assertion_version: number;
	action: 'upsert' | 'delete';
	status: 'pending' | 'processing' | 'completed' | 'failed';
}

const SENSITIVE_CATEGORIES = new Set([
	'health', 'relationship', 'personality_trait', 'implicit_mood',
	'episode_topic', 'pattern', 'trigger', 'avoidance', 'schema', 'coping',
	'insight', 'homework',
]);

/**
 * Capture a model-selected memory from the current user turn. Explicit,
 * standard first-person facts are confirmed; sensitive or inferred claims
 * remain candidates for user review.
 */
export async function captureUserMemory(
	env: Env,
	userId: number,
	category: string,
	statement: string,
	evidence: EvidenceInput,
): Promise<MemoryAssertionRow> {
	const policy = classifyMemoryCapture(category, evidence.excerpt, statement);
	return createAssertion(env, {
		userId,
		category: policy.category,
		statement,
		status: policy.status,
		confidence: policy.explicit ? 0.9 : 0.55,
		sensitivity: policy.sensitivity,
		sourceKind: 'user_turn',
		evidence,
	});
}

/** Pure capture-policy decision used by runtime and regression tests. */
export function classifyMemoryCapture(
	category: string,
	evidenceText: string,
	statement = evidenceText,
): {
	category: string;
	status: 'candidate' | 'confirmed';
	sensitivity: 'standard' | 'sensitive';
	explicit: boolean;
} {
	const normalizedCategory = normalizeCategory(category);
	const sensitive = SENSITIVE_CATEGORIES.has(normalizedCategory);
	const explicit = isExplicitFirstPersonStatement(evidenceText)
		&& isStatementSupportedByEvidence(statement, evidenceText);
	return {
		category: normalizedCategory,
		status: explicit && !sensitive ? 'confirmed' : 'candidate',
		sensitivity: sensitive ? 'sensitive' : 'standard',
		explicit,
	};
}

/** Store a model inference as a reviewable candidate, never as active truth. */
export async function captureInferredMemory(
	env: Env,
	userId: number,
	category: string,
	statement: string,
	evidence: EvidenceInput,
): Promise<MemoryAssertionRow> {
	return createAssertion(env, {
		userId,
		category: normalizeCategory(category),
		statement,
		status: 'candidate',
		confidence: Math.min(0.75, evidence.extractionConfidence ?? 0.5),
		sensitivity: SENSITIVE_CATEGORIES.has(normalizeCategory(category))
			? 'sensitive'
			: 'standard',
		sourceKind: 'model_inference',
		evidence,
	});
}

interface CreateAssertionInput {
	userId: number;
	category: string;
	statement: string;
	status: 'candidate' | 'confirmed';
	confidence: number;
	sensitivity: 'standard' | 'sensitive';
	sourceKind: string;
	evidence: EvidenceInput;
}

async function createAssertion(
	env: Env,
	input: CreateAssertionInput,
): Promise<MemoryAssertionRow> {
	const statement = input.statement.trim().slice(0, 2_000);
	const excerpt = input.evidence.excerpt.trim().slice(0, 2_000);
	if (!statement || !excerpt) throw new Error('Memory statement and evidence are required');

	// Automatic extraction can revisit the same turn or fact. Reuse an active
	// exact match rather than multiplying candidate or confirmed assertions.
	const equivalent = await findEquivalentAssertion(
		env,
		input.userId,
		input.category,
		statement,
	);
	if (equivalent) return equivalent;

	const assertionId = crypto.randomUUID();
	const evidenceId = crypto.randomUUID();
	const outboxId = outboxKey(assertionId, 1, 'upsert');
	const now = input.evidence.observedAt ?? new Date().toISOString();
	const excerptHash = await sha256(excerpt);

	const statements: D1PreparedStatement[] = [
		env.DB.prepare(`
			INSERT INTO memory_assertions (
				id, user_id, category, statement, status, confidence,
				sensitivity, version, source_kind, valid_from
			) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
		`).bind(
			assertionId,
			input.userId,
			input.category,
			statement,
			input.status,
			input.confidence,
			input.sensitivity,
			input.sourceKind,
			now,
		),
		env.DB.prepare(`
			INSERT INTO memory_evidence (
				id, assertion_id, user_id, source_type, source_id, excerpt,
				excerpt_sha256, observed_at, extraction_confidence
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			evidenceId,
			assertionId,
			input.userId,
			input.evidence.sourceType,
			input.evidence.sourceId ?? null,
			excerpt,
			excerptHash,
			now,
			input.evidence.extractionConfidence ?? input.confidence,
		),
	];

	if (input.status === 'confirmed') {
		statements.push(createOutboxStatement(
			env,
			outboxId,
			assertionId,
			input.userId,
			1,
			'upsert',
		));
	}

	await env.DB.batch(statements);
	if (input.status === 'confirmed') await enqueueProjection(env, outboxId);

	return {
		id: assertionId,
		user_id: input.userId,
		category: input.category,
		statement,
		status: input.status,
		confidence: input.confidence,
		sensitivity: input.sensitivity,
		version: 1,
		valid_from: now,
		valid_until: null,
		source_kind: input.sourceKind,
		legacy_memory_id: null,
		superseded_by: null,
		created_at: now,
		updated_at: now,
	};
}

/** Confirm a candidate or legacy row using the user's button press as evidence. */
export async function confirmAssertion(
	env: Env,
	userId: number,
	assertionId: string,
	sourceId: string,
): Promise<boolean> {
	const assertion = await getAssertion(env, userId, assertionId);
	if (!assertion || !['candidate', 'legacy_unverified'].includes(assertion.status)) return false;

	const nextVersion = assertion.version + 1;
	const evidenceId = crypto.randomUUID();
	const excerptHash = await sha256(assertion.statement);
	const outboxId = outboxKey(assertion.id, nextVersion, 'upsert');
	const result = await env.DB.batch([
		env.DB.prepare(`
			UPDATE memory_assertions
			SET status = 'confirmed', confidence = 1.0, version = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ? AND user_id = ? AND status IN ('candidate', 'legacy_unverified')
		`).bind(nextVersion, assertion.id, userId),
		env.DB.prepare(`
			INSERT INTO memory_evidence (
				id, assertion_id, user_id, source_type, source_id, excerpt,
				excerpt_sha256, observed_at, extraction_confidence
			) VALUES (?, ?, ?, 'user_confirmation', ?, ?, ?, CURRENT_TIMESTAMP, 1.0)
		`).bind(evidenceId, assertion.id, userId, sourceId, assertion.statement, excerptHash),
		createOutboxStatement(env, outboxId, assertion.id, userId, nextVersion, 'upsert'),
	]);
	const changed = (result[0]?.meta.changes ?? 0) > 0;
	if (changed) await enqueueProjection(env, outboxId);
	return changed;
}

/** Reject or forget an assertion and tombstone every vector projection. */
export async function rejectAssertion(
	env: Env,
	userId: number,
	assertionId: string,
): Promise<boolean> {
	const assertion = await getAssertion(env, userId, assertionId);
	if (!assertion || ['rejected', 'superseded', 'expired'].includes(assertion.status)) return false;
	const nextVersion = assertion.version + 1;
	const outboxId = outboxKey(assertion.id, nextVersion, 'delete');
	const results = await env.DB.batch([
		env.DB.prepare(`
			UPDATE memory_assertions
			SET status = 'rejected', version = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ? AND user_id = ? AND status NOT IN ('rejected', 'superseded', 'expired')
		`).bind(nextVersion, assertion.id, userId),
		createOutboxStatement(env, outboxId, assertion.id, userId, nextVersion, 'delete'),
	]);
	const changed = (results[0]?.meta.changes ?? 0) > 0;
	if (changed) await enqueueProjection(env, outboxId);
	return changed;
}

/** Permanently forget one assertion and remove every derived projection. */
export async function forgetAssertion(
	env: Env,
	userId: number,
	assertionId: string,
): Promise<boolean> {
	const assertion = await getAssertion(env, userId, assertionId);
	if (!assertion) return false;
	await env.DB.batch([
		// A superseded predecessor may point at this assertion. Detach that
		// audit link before hard deletion so SQLite foreign keys remain valid.
		env.DB.prepare(`
			UPDATE memory_assertions SET superseded_by = NULL, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ? AND superseded_by = ?
		`).bind(userId, assertionId),
		env.DB.prepare('DELETE FROM memory_evidence WHERE assertion_id = ? AND user_id = ?')
			.bind(assertionId, userId),
		env.DB.prepare('DELETE FROM memory_outbox WHERE assertion_id = ? AND user_id = ?')
			.bind(assertionId, userId),
		env.DB.prepare('DELETE FROM memory_projection_registry WHERE assertion_id = ?')
			.bind(assertionId),
		env.DB.prepare('DELETE FROM memory_consolidation_proposals WHERE user_id = ?')
			.bind(userId),
		env.DB.prepare('DELETE FROM memory_assertions WHERE id = ? AND user_id = ?')
			.bind(assertionId, userId),
	]);
	await deleteAssertionVectorsBestEffort(env, [`assert_${assertionId}`]);
	return true;
}

/** Permanently forget governed memory in one category. */
export async function forgetAssertionsByCategory(
	env: Env,
	userId: number,
	category: string,
): Promise<number> {
	const assertions = await listAssertionIdsByCategory(env, userId, category);
	if (!assertions.length) return 0;
	await env.DB.batch([
		env.DB.prepare(`
			UPDATE memory_assertions SET superseded_by = NULL, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ? AND superseded_by IN (
				SELECT id FROM memory_assertions WHERE user_id = ? AND category = ?
			)
		`).bind(userId, userId, category),
		env.DB.prepare(`
			DELETE FROM memory_evidence WHERE user_id = ? AND assertion_id IN (
				SELECT id FROM memory_assertions WHERE user_id = ? AND category = ?
			)
		`).bind(userId, userId, category),
		env.DB.prepare(`
			DELETE FROM memory_outbox WHERE user_id = ? AND assertion_id IN (
				SELECT id FROM memory_assertions WHERE user_id = ? AND category = ?
			)
		`).bind(userId, userId, category),
		env.DB.prepare(`
			DELETE FROM memory_projection_registry WHERE assertion_id IN (
				SELECT id FROM memory_assertions WHERE user_id = ? AND category = ?
			)
		`).bind(userId, category),
		env.DB.prepare('DELETE FROM memory_consolidation_proposals WHERE user_id = ?')
			.bind(userId),
		env.DB.prepare('DELETE FROM memory_assertions WHERE user_id = ? AND category = ?')
			.bind(userId, category),
	]);
	await deleteAssertionVectorsBestEffort(env, assertions.map(row => `assert_${row.id}`));
	return assertions.length;
}

/** Permanently forget every governed assertion for one user. */
export async function forgetAllAssertions(env: Env, userId: number): Promise<number> {
	const { results } = await env.DB.prepare(
		'SELECT id FROM memory_assertions WHERE user_id = ?',
	).bind(userId).all<{ id: string }>();
	const assertions = results ?? [];
	if (!assertions.length) {
		await env.DB.prepare('DELETE FROM memory_consolidation_proposals WHERE user_id = ?')
			.bind(userId).run();
		return 0;
	}
	await env.DB.batch([
		env.DB.prepare(`
			UPDATE memory_assertions SET superseded_by = NULL, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ? AND superseded_by IS NOT NULL
		`).bind(userId),
		env.DB.prepare('DELETE FROM memory_evidence WHERE user_id = ?').bind(userId),
		env.DB.prepare('DELETE FROM memory_outbox WHERE user_id = ?').bind(userId),
		env.DB.prepare(`
			DELETE FROM memory_projection_registry WHERE assertion_id IN (
				SELECT id FROM memory_assertions WHERE user_id = ?
			)
		`).bind(userId),
		env.DB.prepare('DELETE FROM memory_consolidation_proposals WHERE user_id = ?')
			.bind(userId),
		env.DB.prepare('DELETE FROM memory_assertions WHERE user_id = ?').bind(userId),
	]);
	await deleteAssertionVectorsBestEffort(env, assertions.map(row => `assert_${row.id}`));
	return assertions.length;
}

/** Replace an assertion with an explicit user correction while retaining audit history. */
export async function correctAssertion(
	env: Env,
	userId: number,
	assertionId: string,
	correctedStatement: string,
	sourceId: string,
): Promise<MemoryAssertionRow | null> {
	const previous = await getAssertion(env, userId, assertionId);
	const statement = correctedStatement.trim().slice(0, 2_000);
	if (!previous || !statement) return null;

	const replacementId = crypto.randomUUID();
	const evidenceId = crypto.randomUUID();
	const now = new Date().toISOString();
	const excerptHash = await sha256(statement);
	const oldVersion = previous.version + 1;
	const deleteOutbox = outboxKey(previous.id, oldVersion, 'delete');
	const upsertOutbox = outboxKey(replacementId, 1, 'upsert');

	await env.DB.batch([
		env.DB.prepare(`
			INSERT INTO memory_assertions (
				id, user_id, category, statement, status, confidence,
				sensitivity, version, source_kind, valid_from
			) VALUES (?, ?, ?, ?, 'confirmed', 1.0, ?, 1, 'user_correction', ?)
		`).bind(replacementId, userId, previous.category, statement, previous.sensitivity, now),
		env.DB.prepare(`
			UPDATE memory_assertions
			SET status = 'superseded', superseded_by = ?, version = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ? AND user_id = ?
		`).bind(replacementId, oldVersion, previous.id, userId),
		env.DB.prepare(`
			INSERT INTO memory_evidence (
				id, assertion_id, user_id, source_type, source_id, excerpt,
				excerpt_sha256, observed_at, extraction_confidence
			) VALUES (?, ?, ?, 'user_correction', ?, ?, ?, ?, 1.0)
		`).bind(evidenceId, replacementId, userId, sourceId, statement, excerptHash, now),
		createOutboxStatement(env, deleteOutbox, previous.id, userId, oldVersion, 'delete'),
		createOutboxStatement(env, upsertOutbox, replacementId, userId, 1, 'upsert'),
	]);

	await Promise.all([
		enqueueProjection(env, deleteOutbox),
		enqueueProjection(env, upsertOutbox),
	]);
	return getAssertion(env, userId, replacementId);
}

/** Return reviewable assertions without exposing evidence excerpts. */
export async function listAssertions(
	env: Env,
	userId: number,
	statuses: MemoryAssertionStatus[],
	limit = 30,
): Promise<MemoryAssertionRow[]> {
	if (!statuses.length) return [];
	const placeholders = statuses.map(() => '?').join(',');
	const { results } = await env.DB.prepare(`
		SELECT id, user_id, category, statement, status, confidence, sensitivity,
		       version, valid_from, valid_until, source_kind, legacy_memory_id,
		       superseded_by, created_at, updated_at
		FROM memory_assertions
		WHERE user_id = ? AND status IN (${placeholders})
		ORDER BY updated_at DESC
		LIMIT ?
	`).bind(userId, ...statuses, limit).all<MemoryAssertionRow>();
	return results ?? [];
}

/** Format only governed assertions that satisfy every recall gate. */
export async function getGovernedMemoryContext(
	env: Env,
	userId: number,
	limit = 20,
): Promise<string> {
	const { results } = await env.DB.prepare(`
		SELECT a.id, a.category, a.statement
		FROM memory_assertions a
		WHERE a.user_id = ?
		  AND a.status = 'confirmed'
		  AND (a.valid_until IS NULL OR a.valid_until > CURRENT_TIMESTAMP)
		  AND EXISTS (
		      SELECT 1 FROM memory_evidence e WHERE e.assertion_id = a.id
		  )
		ORDER BY a.updated_at DESC
		LIMIT ?
	`).bind(userId, limit).all<{ id: string; category: string; statement: string }>();
	if (!results?.length) return '';
	return `Confirmed memories:\n${results.map(row => `- [${row.category}] ${row.statement}`).join('\n')}`;
}

/** Process one outbox row idempotently. */
export async function processProjectionOutbox(env: Env, outboxId: string): Promise<void> {
	const outbox = await env.DB.prepare(`
		SELECT id, assertion_id, user_id, assertion_version, action, status
		FROM memory_outbox WHERE id = ?
	`).bind(outboxId).first<ProjectionOutboxRow>();
	if (!outbox || outbox.status === 'completed') return;

	await env.DB.prepare(`
		UPDATE memory_outbox
		SET status = 'processing', attempt_count = attempt_count + 1,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND status != 'completed'
	`).bind(outbox.id).run();

	const vectorId = `assert_${outbox.assertion_id}`;
	try {
		if (outbox.action === 'upsert') {
			const assertion = await env.DB.prepare(`
				SELECT a.id, a.user_id, a.category, a.statement, a.version
				FROM memory_assertions a
				WHERE a.id = ? AND a.user_id = ? AND a.status = 'confirmed'
				  AND (a.valid_until IS NULL OR a.valid_until > CURRENT_TIMESTAMP)
				  AND EXISTS (SELECT 1 FROM memory_evidence e WHERE e.assertion_id = a.id)
			`).bind(outbox.assertion_id, outbox.user_id).first<{
				id: string;
				user_id: number;
				category: string;
				statement: string;
				version: number;
			}>();
			if (!assertion || assertion.version !== outbox.assertion_version) {
				await deleteAssertionVector(env, vectorId);
			} else {
				await projectMemoriesForRollback(env, [{
					id: vectorId,
					user_id: assertion.user_id,
					category: assertion.category,
					fact: assertion.statement,
				}]);
				await upsertProjectionRegistry(env, assertion.id, vectorId, assertion.version, 'active');
			}
		} else {
			await deleteAssertionVector(env, vectorId);
			await upsertProjectionRegistry(
				env,
				outbox.assertion_id,
				vectorId,
				outbox.assertion_version,
				'tombstoned',
			);
		}

		await env.DB.prepare(`
			UPDATE memory_outbox
			SET status = 'completed', last_error = NULL, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`).bind(outbox.id).run();
	} catch (error) {
		await env.DB.prepare(`
			UPDATE memory_outbox
			SET status = 'failed', last_error = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`).bind((error as Error).message.slice(0, 1_000), outbox.id).run();
		throw error;
	}
}

/** Re-enqueue pending/failed outbox rows after a producer or Queue outage. */
export async function enqueuePendingProjectionOutbox(env: Env, limit = 25): Promise<number> {
	const { results } = await env.DB.prepare(`
		SELECT id FROM memory_outbox
		WHERE status IN ('pending', 'failed')
		   OR (status = 'processing' AND updated_at < datetime('now', '-15 minutes'))
		ORDER BY updated_at ASC
		LIMIT ?
	`).bind(limit).all<{ id: string }>();
	for (const row of results ?? []) await enqueueProjection(env, row.id);
	return results?.length ?? 0;
}

async function getAssertion(
	env: Env,
	userId: number,
	assertionId: string,
): Promise<MemoryAssertionRow | null> {
	return env.DB.prepare(`
		SELECT id, user_id, category, statement, status, confidence, sensitivity,
		       version, valid_from, valid_until, source_kind, legacy_memory_id,
		       superseded_by, created_at, updated_at
		FROM memory_assertions WHERE id = ? AND user_id = ?
	`).bind(assertionId, userId).first<MemoryAssertionRow>();
}

async function findEquivalentAssertion(
	env: Env,
	userId: number,
	category: string,
	statement: string,
): Promise<MemoryAssertionRow | null> {
	return env.DB.prepare(`
		SELECT id, user_id, category, statement, status, confidence, sensitivity,
		       version, valid_from, valid_until, source_kind, legacy_memory_id,
		       superseded_by, created_at, updated_at
		FROM memory_assertions
		WHERE user_id = ?
		  AND category = ? COLLATE NOCASE
		  AND statement = ? COLLATE NOCASE
		  AND status IN ('candidate', 'confirmed', 'legacy_unverified')
		ORDER BY CASE status
			WHEN 'confirmed' THEN 0
			WHEN 'candidate' THEN 1
			ELSE 2
		END, updated_at DESC
		LIMIT 1
	`).bind(userId, category, statement).first<MemoryAssertionRow>();
}

function createOutboxStatement(
	env: Env,
	id: string,
	assertionId: string,
	userId: number,
	version: number,
	action: 'upsert' | 'delete',
): D1PreparedStatement {
	return env.DB.prepare(`
		INSERT OR IGNORE INTO memory_outbox (
			id, assertion_id, user_id, assertion_version, action, status
		) VALUES (?, ?, ?, ?, ?, 'pending')
	`).bind(id, assertionId, userId, version, action);
}

async function enqueueProjection(env: Env, outboxId: string): Promise<void> {
	if (env.GOVERNED_MEMORY_PROJECTION_ENABLED !== 'true') return;
	try {
		await env.TASK_QUEUE.send({
			type: 'project_memory_assertion',
			userId: 0,
			chatId: 0,
			outboxId,
		});
	} catch (error) {
		log.error('memory_projection_enqueue_failed', {
			outboxId,
			msg: (error as Error).message,
		});
	}
}

async function deleteAssertionVector(env: Env, vectorId: string): Promise<void> {
	await deleteAssertionVectors(env, [vectorId]);
}

async function deleteAssertionVectors(env: Env, vectorIds: string[]): Promise<void> {
	if (!vectorIds.length) return;
	await Promise.all([
		env.VECTORIZE_OPENAI?.deleteByIds(vectorIds),
		env.VECTORIZE?.deleteByIds(vectorIds),
	]);
}

async function deleteAssertionVectorsBestEffort(env: Env, vectorIds: string[]): Promise<void> {
	try {
		await deleteAssertionVectors(env, vectorIds);
	} catch (error) {
		// D1 forgetting is authoritative. Hydration prevents an orphaned vector
		// from re-entering recall, and projection cleanup can run separately.
		log.error('governed_memory_projection_delete_failed', {
			count: vectorIds.length,
			msg: (error as Error).message,
		});
	}
}

async function listAssertionIdsByCategory(
	env: Env,
	userId: number,
	category: string,
): Promise<Array<{ id: string }>> {
	const { results } = await env.DB.prepare(
		'SELECT id FROM memory_assertions WHERE user_id = ? AND category = ?',
	).bind(userId, category).all<{ id: string }>();
	return results ?? [];
}

async function upsertProjectionRegistry(
	env: Env,
	assertionId: string,
	vectorId: string,
	version: number,
	status: 'active' | 'tombstoned',
): Promise<void> {
	await env.DB.batch(['openai', 'cloudflare'].map(projectionName =>
		env.DB.prepare(`
			INSERT INTO memory_projection_registry (
				assertion_id, projection_name, vector_id, assertion_version,
				status, projected_at, updated_at
			) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT(assertion_id, projection_name) DO UPDATE SET
				vector_id = excluded.vector_id,
				assertion_version = excluded.assertion_version,
				status = excluded.status,
				last_error = NULL,
				projected_at = CURRENT_TIMESTAMP,
				updated_at = CURRENT_TIMESTAMP
		`).bind(assertionId, projectionName, vectorId, version, status),
	));
}

function outboxKey(
	assertionId: string,
	version: number,
	action: 'upsert' | 'delete',
): string {
	return `${assertionId}:${version}:${action}`;
}

function normalizeCategory(category: string): string {
	return category.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 50) || 'personal';
}

export function isExplicitFirstPersonStatement(text: string): boolean {
	const normalized = text.trim();
	if (!normalized || normalized.endsWith('?')) return false;
	return /\b(?:i\s+(?:am|have|prefer|like|love|hate|live|work|use|take|need|want|enjoy|avoid)|i['’]m|i['’]ve|my\s+)\b/i.test(normalized);
}

/**
 * Conservatively require the proposed statement to overlap its evidence.
 * False negatives become reviewable candidates; unsupported claims must not
 * become auto-confirmed facts.
 */
export function isStatementSupportedByEvidence(statement: string, evidence: string): boolean {
	const statementTokens = factTokens(statement);
	if (!statementTokens.length) return false;
	const evidenceTokens = new Set(factTokens(evidence));
	const supported = statementTokens.filter(token => evidenceTokens.has(token)).length;
	return supported / statementTokens.length >= 0.6;
}

function factTokens(value: string): string[] {
	const stopWords = new Set([
		'a', 'an', 'and', 'are', 'as', 'at', 'be', 'for', 'from', 'i', 'in',
		'is', 'it', 'me', 'my', 'of', 'on', 'that', 'the', 'to', 'user', 'with',
	]);
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter(token => token.length > 1 && !stopWords.has(token))
		.map(token => token.length > 4 && token.endsWith('s') ? token.slice(0, -1) : token);
}

async function sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return Array.from(new Uint8Array(digest))
		.map(byte => byte.toString(16).padStart(2, '0'))
		.join('');
}
