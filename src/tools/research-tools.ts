// Research Tools

import { defineTool, ok, empty, err } from './factory';
import { safeLike, queryAll } from '../lib/db';
import type { MemoryRow } from '../types/db';

export const searchResearch = defineTool(
	'search_research',
	'Search or list previous deep research results. Actions: list (show all), full (get full report by topic/index).',
	{
		action: { type: 'string', enum: ['list', 'full'], description: 'list=show all, full=get specific report' },
		topic: { type: 'string', description: 'Topic to search for (for full action)' },
		index: { type: 'integer', description: 'Index number from the list (for full action)' },
	},
	['action'],
	async (args, env, ctx) => {
		if (args.action === 'list') {
			const results = await queryAll<MemoryRow>(env.DB.prepare(
				"SELECT id, fact, category, created_at FROM memories WHERE chat_id = ? AND fact LIKE 'Deep Research%' ORDER BY created_at DESC LIMIT 10"
			).bind(ctx.chatId));

			if (!results.length) return empty('No deep research results found yet.');

			const items = results.map((r, i) => {
				const topicMatch = r.fact.match(/^Deep Research \(([^)]+)\):/);
				const topic = topicMatch?.[1] ?? 'Unknown';
				const date = new Date(r.created_at + 'Z').toLocaleDateString('en-GB', {
					timeZone: 'Europe/London', day: 'numeric', month: 'short',
					hour: '2-digit', minute: '2-digit',
				});
				return `${i + 1}. ${topic} (${date})`;
			});

			return ok({ items, count: items.length });
		}

		if (args.action === 'full') {
			const safe = safeLike(args.topic as string);
			if (!safe) return err('No topic specified.');

			// Try R2 full report first
			const refs = await queryAll<MemoryRow>(env.DB.prepare(
				"SELECT fact FROM memories WHERE chat_id = ? AND category = 'research_ref' AND fact LIKE ? ORDER BY created_at DESC LIMIT 1"
			).bind(ctx.chatId, `%${safe}%`));

			if (refs.length && env.MEDIA_BUCKET) {
				const r2Match = refs[0]!.fact.match(/\[R2:([^\]]+)\]/);
				if (r2Match?.[1]) {
					const obj = await env.MEDIA_BUCKET.get(r2Match[1]);
					if (obj) {
						const fullText = await obj.text();
						return ok({ topic: args.topic, text: fullText.slice(0, 6000), source: 'r2' });
					}
				}
			}

			// Fallback: search memory summaries
			const summaries = await queryAll<MemoryRow>(env.DB.prepare(
				"SELECT fact FROM memories WHERE chat_id = ? AND fact LIKE ? ORDER BY created_at DESC LIMIT 1"
			).bind(ctx.chatId, `%Deep Research%${safe}%`));

			if (summaries.length) {
				return ok({ topic: args.topic, text: summaries[0]!.fact, source: 'memory' });
			}

			return empty(`No research found for "${args.topic}".`);
		}

		return err('Unknown action.');
	}
);

export const startDeepResearch = defineTool(
	'start_deep_research',
	'Start a deep research investigation on a topic. Returns results asynchronously (2-5 minutes).',
	{
		topic: { type: 'string', description: 'The topic to research' },
	},
	['topic'],
	async (args, env, ctx) => {
		// TODO Phase 6: Trigger research Workflow
		return ok({ topic: args.topic }, 'Deep research will be available after Workflow integration (Phase 6).');
	}
);
