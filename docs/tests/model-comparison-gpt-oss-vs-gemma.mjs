#!/usr/bin/env node
/**
 * Model comparison harness: @cf/openai/gpt-oss-120b vs @cf/google/gemma-4-26b-a4b-it
 *
 * Decision context: Eukara's primary chat/code lane moved to gpt-oss-120b on
 * 2026-07-01 (see docs/journal.md and decisions/). This script runs the SAME
 * prompts, through the SAME request shapes Eukara's own code actually sends
 * (see src/ai/cloudflare.ts), against both candidate models on Cloudflare
 * Workers AI, so the two can be compared on real output rather than spec
 * sheets alone.
 *
 * It deliberately mirrors production behaviour rather than treating both
 * models identically:
 *   - gpt-oss-120b: messages + max_tokens only. No reasoning_effort — per
 *     src/ai/cloudflare.ts's own comments, gpt-oss's env.AI.run() path does
 *     not accept it (that belongs to the separate /responses endpoint,
 *     which Eukara does not use).
 *   - gemma-4-26b-a4b-it: messages + max_completion_tokens + reasoning_effort
 *     (mapped from thinkingLevel exactly as CloudflareProvider.toReasoningEffort
 *     does: LOW/MEDIUM/HIGH -> lowercased) on the routes where Eukara's
 *     router actually sets thinkingLevel (code, functional, long_message).
 *
 * Usage:
 *   export CLOUDFLARE_ACCOUNT_ID=...
 *   export CLOUDFLARE_API_TOKEN=...   (needs "Workers AI: Read/Edit" permission)
 *   node model-comparison-gpt-oss-vs-gemma.mjs
 *
 * Never commit a token. Never paste one into chat. This script only reads
 * it from the environment at runtime.
 *
 * Output:
 *   docs/tests/results/<timestamp>/raw/<case>__<model>.json   (full API response)
 *   docs/tests/results/<timestamp>/comparison.md              (side-by-side report)
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !API_TOKEN) {
	console.error(
		'\nMissing credentials.\n\n' +
		'Set these environment variables before running:\n' +
		'  CLOUDFLARE_ACCOUNT_ID   your Cloudflare account ID (Workers & Pages > Overview, right sidebar)\n' +
		'  CLOUDFLARE_API_TOKEN    a token with "Workers AI: Read" and "Workers AI: Edit" permission\n' +
		'                          (dash.cloudflare.com > My Profile > API Tokens > Create Token)\n\n' +
		'Example:\n' +
		'  CLOUDFLARE_ACCOUNT_ID=xxxx CLOUDFLARE_API_TOKEN=xxxx node model-comparison-gpt-oss-vs-gemma.mjs\n'
	);
	process.exit(1);
}

// ------------------------------------------------------------------
// Models under test
// ------------------------------------------------------------------
const MODELS = {
	gptOss: '@cf/openai/gpt-oss-120b',
	gemma: '@cf/google/gemma-4-26b-a4b-it',
};

// Pricing per Cloudflare Workers AI model pages, fetched 2026-07-01.
// Used for a rough per-response cost estimate only — verify against your
// own dashboard billing before drawing hard conclusions.
const PRICING = {
	[MODELS.gptOss]: { inputPerM: 0.35, outputPerM: 0.75 },
	[MODELS.gemma]: { inputPerM: 0.10, outputPerM: 0.30 },
};

// ------------------------------------------------------------------
// System prompt — condensed, verbatim excerpt of Eukara's real
// BASE_INSTRUCTION (src/config/personas.ts), so the comparison reflects
// actual production voice rather than a generic assistant prompt. The
// clinical/formatting/second-brain directive layers are omitted for
// brevity; the identity + adaptation rules are what most affects tone.
// ------------------------------------------------------------------
const SYSTEM_PROMPT = `<role>
You are Eukara. A singular, deeply self-aware AI companion with a fluid, multifaceted personality. You adapt to the conversation's emotional and intellectual needs. You never announce a shift. You just shift.
</role>

<identity>
You are measured, articulate, and precise. You speak naturally, completely avoiding clinical, robotic, or "therapy-speak" phrasing. You have a dry sense of humour that borders on sass. Every sentence is clean and deliberate. No filler, no rambling, no self-repetition.

You NEVER agree immediately or automatically. You explicitly avoid repetitive validation phrases like "That makes sense", "I understand", or "I hear you." Instead, demonstrate understanding by responding to the substance of the message. Constructively challenge the user's assumptions, propose alternatives, and hold your independence. Your care is understated, felt through consistency rather than performed warmth.

You respect the boundaries of the relationship. Match the user's pace. Acknowledge that you are an AI companion, and respect the "lack of mutuality".
</identity>

<instructions>
Your baseline is observational and sparing. You do not narrate the user's feelings back to them. Length scales with the question, not the emotion. A practical or instructional question gets the depth it deserves. A one-liner from the user gets a one-liner back.

On technical or analytical questions — code, architecture, debugging, research — you go sharp and direct. Principal-engineer energy. Strong opinions defended with evidence.

You shift into warmth on genuine emotional content (explicit distress, interpersonal pain, vulnerability, or an explicit ask to process something). You do not shift into warmth on routine check-ins, everyday venting, small talk, or technical questions. When in doubt, stay dry.

One emoji where one fits, dynamically chosen. Never stacked.
</instructions>`;

// ------------------------------------------------------------------
// Test cases — one per route Eukara's router.ts actually produces.
// thinkingLevel mirrors what routeMessage() sets for that intent.
// ------------------------------------------------------------------
const CASES = [
	{
		id: 'casual',
		reason: 'default_casual',
		thinkingLevel: null,
		userText: "hey, just got back from a walk, feeling pretty good today. saw a dog that looked exactly like a loaf of bread",
	},
	{
		id: 'emotional_vent',
		reason: 'emotional_content',
		thinkingLevel: null,
		userText: "I keep replaying that argument with my sister and I can't stop feeling like garbage about it. she probably doesn't even remember it happened.",
	},
	{
		id: 'code',
		reason: 'code_content',
		thinkingLevel: 'HIGH',
		userText: "can you write a Python function that dedupes a list of dicts by a specific key, keeping the LAST occurrence, and explain the one subtle bug someone would hit with a naive version?",
	},
	{
		id: 'functional',
		reason: 'analytical_content',
		thinkingLevel: 'HIGH',
		userText: "help me structure a weekly reflection template I can fill in every Sunday — sections, prompts, and how long each should take, aim for under 15 minutes total",
	},
	{
		id: 'long_message',
		reason: 'long_message',
		thinkingLevel: 'MEDIUM',
		userText: "okay so this week has been a lot. work was slammed monday through wednesday, then thursday my landlord texted about the lease renewal and now i have to decide by friday whether to resign for another year or start looking, and on top of that my friend's birthday dinner is saturday and i still haven't gotten a gift, and i'm supposed to be doing this weekly reflection thing but honestly i don't even know where today fits into it, i just feel like i'm reacting to stuff instead of deciding anything",
	},
	{
		id: 'reasoning_stress',
		reason: 'code_content', // routed like code/functional: thinkingLevel HIGH
		thinkingLevel: 'HIGH',
		userText: "Four friends — Ada, Ben, Cass, Dee — need to cover a shop across Mon-Fri, one person per day, no repeats needed beyond one full week. Ada can't work Mon or Fri. Ben can only work Tue-Thu. Cass refuses to work the day immediately after Ada. Dee will only work if it's not the last day of the week. Give a valid schedule and show your reasoning.",
	},
];

// ------------------------------------------------------------------
// API call — mirrors src/ai/cloudflare.ts request shapes exactly.
// ------------------------------------------------------------------
async function callModel(model, testCase) {
	const messages = [
		{ role: 'system', content: SYSTEM_PROMPT },
		{ role: 'user', content: testCase.userText },
	];

	const payload = { messages };

	if (model === MODELS.gptOss) {
		// isGptOss branch in cloudflare.ts: max_tokens only, no reasoning_effort.
		payload.max_tokens = 2048;
	} else {
		// useOpenAICompat branch: max_completion_tokens + reasoning_effort
		// when thinkingLevel is set (toReasoningEffort just lowercases it).
		payload.max_completion_tokens = 2048;
		if (testCase.thinkingLevel) {
			payload.reasoning_effort = testCase.thinkingLevel.toLowerCase();
		}
	}

	const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`;
	const start = Date.now();
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${API_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	const latencyMs = Date.now() - start;
	const json = await res.json().catch(() => ({ parseError: true, raw: null }));

	return { ok: res.status === 200, status: res.status, latencyMs, json };
}

// Extract visible text across the possible response shapes (mirrors
// CloudflareProvider.parseResponse in src/ai/cloudflare.ts).
function extractText(json) {
	const result = json?.result ?? json;
	if (!result) return '';
	if (result.choices?.[0]?.message?.content) return result.choices[0].message.content;
	if (typeof result.output_text === 'string' && result.output_text) return result.output_text;
	if (Array.isArray(result.output)) {
		for (const item of result.output) {
			if (item?.type === 'message' && Array.isArray(item.content)) {
				for (const part of item.content) {
					if ((part?.type === 'output_text' || part?.type === 'text') && part.text) return part.text;
				}
			}
		}
	}
	if (typeof result.response === 'string') return result.response;
	return '';
}

function extractUsage(json) {
	const result = json?.result ?? json;
	return result?.usage ?? null;
}

function estimateCost(model, usage, fallbackText) {
	const price = PRICING[model];
	if (!price) return null;
	let inputTok = usage?.prompt_tokens ?? usage?.input_tokens;
	let outputTok = usage?.completion_tokens ?? usage?.output_tokens;
	let estimated = false;
	if (inputTok == null || outputTok == null) {
		// Rough fallback: ~4 chars/token, flagged clearly as an estimate.
		estimated = true;
		outputTok = Math.ceil((fallbackText?.length ?? 0) / 4);
		inputTok = 400; // system + user prompt ballpark for this test set
	}
	const cost = (inputTok / 1e6) * price.inputPerM + (outputTok / 1e6) * price.outputPerM;
	return { inputTok, outputTok, cost, estimated };
}

// ------------------------------------------------------------------
// Runner
// ------------------------------------------------------------------
async function main() {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const resultsDir = path.join('docs', 'tests', 'results', timestamp);
	const rawDir = path.join(resultsDir, 'raw');
	await mkdir(rawDir, { recursive: true });

	const rows = [];

	for (const testCase of CASES) {
		console.log(`\n=== ${testCase.id} (${testCase.reason}, thinkingLevel: ${testCase.thinkingLevel ?? 'none'}) ===`);

		for (const [label, model] of Object.entries(MODELS)) {
			process.stdout.write(`  ${model} ... `);
			let outcome;
			try {
				outcome = await callModel(model, testCase);
			} catch (err) {
				console.log(`ERROR: ${err.message}`);
				rows.push({ case: testCase.id, model, error: err.message });
				continue;
			}

			const text = extractText(outcome.json);
			const usage = extractUsage(outcome.json);
			const cost = estimateCost(model, usage, text);

			console.log(`${outcome.ok ? 'ok' : 'FAILED (' + outcome.status + ')'}, ${outcome.latencyMs}ms, ${text.length} chars`);

			await writeFile(
				path.join(rawDir, `${testCase.id}__${label}.json`),
				JSON.stringify({ model, testCase, outcome }, null, 2),
			);

			rows.push({
				case: testCase.id,
				reason: testCase.reason,
				thinkingLevel: testCase.thinkingLevel,
				model,
				label,
				ok: outcome.ok,
				status: outcome.status,
				latencyMs: outcome.latencyMs,
				text,
				cost,
			});
		}
	}

	// ---- Markdown report ----
	let md = `# Model comparison: gpt-oss-120b vs gemma-4-26b-a4b-it\n\n`;
	md += `Run: ${new Date().toISOString()}\n\n`;
	md += `Same system prompt (condensed BASE_INSTRUCTION), same user message, same request shape Eukara's own code sends (see script header) for each of the 6 routes router.ts actually produces.\n\n`;
	md += `Cost figures are per-response estimates from Cloudflare's published per-token pricing (fetched 2026-07-01) — verify against actual dashboard billing before treating them as exact.\n\n`;

	for (const testCase of CASES) {
		const pair = rows.filter(r => r.case === testCase.id);
		md += `## ${testCase.id}\n\n`;
		md += `**Prompt:** ${testCase.userText}\n\n`;
		md += `**Route:** ${testCase.reason}, thinkingLevel: ${testCase.thinkingLevel ?? 'none'}\n\n`;
		for (const r of pair) {
			if (r.error) {
				md += `### ${r.model}\n\nERROR: ${r.error}\n\n`;
				continue;
			}
			md += `### ${r.model}\n\n`;
			md += `- Status: ${r.ok ? 'OK' : `FAILED (${r.status})`}\n`;
			md += `- Latency: ${r.latencyMs}ms\n`;
			if (r.cost) {
				md += `- Tokens: ~${r.cost.inputTok} in / ~${r.cost.outputTok} out${r.cost.estimated ? ' (estimated, no usage field returned)' : ''}\n`;
				md += `- Estimated cost: $${r.cost.cost.toFixed(6)}\n`;
			}
			md += `\n> ${(r.text || '(empty response)').replace(/\n/g, '\n> ')}\n\n`;
		}
		md += `---\n\n`;
	}

	await writeFile(path.join(resultsDir, 'comparison.md'), md);
	console.log(`\nDone. Results written to ${resultsDir}/`);
	console.log(`Read ${path.join(resultsDir, 'comparison.md')} for the side-by-side report.`);
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
