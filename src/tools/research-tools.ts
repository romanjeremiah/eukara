// Research Tools — keyed by ctx.userId

import { defineTool, ok, empty, err } from './factory';
import { safeLike, queryAll } from '../lib/db';
import type { MemoryRow } from '../types/db';

export const searchResearch = defineTool(
	'search_research',
	'Search or list previous deep research results.',
	{
		action: { type: 'string', enum: ['list', 'full'] },
		topic: { type: 'string' },
		index: { type: 'integer' },
	},
	['action'],
	async (args, env, ctx) => {
		if (args.action === 'list') {
			const results = await queryAll<MemoryRow>(env.DB.prepare(
				"SELECT id, fact, category, created_at FROM memories WHERE user_id = ? AND fact LIKE 'Deep Research%' ORDER BY created_at DESC LIMIT 10"
			).bind(ctx.userId));
			if (!results.length) return empty('No deep research results found yet.');

			const items = results.map((r, i) => {
				const topicMatch = r.fact.match(/^Deep Research \(([^)]+)\):/);
				const topic = topicMatch?.[1] ?? 'Unknown';
				const date = new Date(r.created_at + 'Z').toLocaleDateString('en-GB', {
					timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
				});
				return `${i + 1}. ${topic} (${date})`;
			});
			return ok({ items, count: items.length });
		}

		if (args.action === 'full') {
			const safe = safeLike(args.topic as string);
			if (!safe) return err('No topic specified.');

			const refs = await queryAll<MemoryRow>(env.DB.prepare(
				"SELECT fact FROM memories WHERE user_id = ? AND category = 'research_ref' AND fact LIKE ? ORDER BY created_at DESC LIMIT 1"
			).bind(ctx.userId, `%${safe}%`));

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

			const summaries = await queryAll<MemoryRow>(env.DB.prepare(
				"SELECT fact FROM memories WHERE user_id = ? AND fact LIKE ? ORDER BY created_at DESC LIMIT 1"
			).bind(ctx.userId, `%Deep Research%${safe}%`));
			if (summaries.length) return ok({ topic: args.topic, text: summaries[0]!.fact, source: 'memory' });
			return empty(`No research found for "${args.topic}".`);
		}
		return err('Unknown action.');
	}
);

export const startDeepResearch = defineTool(
	'start_deep_research',
	'Start a deep research investigation on a topic.',
	{ topic: { type: 'string' } },
	['topic'],
	async (args, env, ctx) => {
		if (!env.RESEARCH_WORKFLOW) return err('Research workflow not available.');
		await env.RESEARCH_WORKFLOW.create({
			id: `research-${Date.now()}`,
			params: { chatId: ctx.chatId, topic: args.topic as string, manual: true },
		});
		return ok({ topic: args.topic }, 'Deep research started. Results in 2-5 minutes.');
	}
);
