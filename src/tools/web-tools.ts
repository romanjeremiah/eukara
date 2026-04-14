// Web Search & Fetch Tools

import { defineTool, ok, err } from './factory';

export const readWebpage = defineTool(
	'read_webpage',
	'Fetch and extract text content from a URL. Use when the user shares a link or you need to read web content.',
	{
		url: { type: 'string', description: 'The URL to fetch' },
	},
	['url'],
	async (args) => {
		try {
			const res = await fetch(args.url as string, {
				headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyAIBot/1.0)' },
			});
			if (!res.ok) return err(`HTTP ${res.status}`);
			const html = await res.text();
			// Simple HTML-to-text extraction
			const text = html
				.replace(/<script[\s\S]*?<\/script>/gi, '')
				.replace(/<style[\s\S]*?<\/style>/gi, '')
				.replace(/<[^>]+>/g, ' ')
				.replace(/\s+/g, ' ')
				.trim()
				.slice(0, 8000);
			return ok({ text, url: args.url, length: text.length });
		} catch (e) {
			return err((e as Error).message);
		}
	}
);

export const webSearchTavily = defineTool(
	'web_search_tavily',
	'Search the web using Tavily API for current information. Returns relevant results with summaries.',
	{
		query: { type: 'string', description: 'Search query' },
		depth: { type: 'string', enum: ['basic', 'advanced'], description: 'Search depth. Default basic.' },
	},
	['query'],
	async (args, env) => {
		if (!env.TAVILY_API_KEY) return err('Tavily API key not configured.');
		try {
			const res = await fetch('https://api.tavily.com/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					api_key: env.TAVILY_API_KEY,
					query: args.query,
					search_depth: (args.depth as string) ?? 'basic',
					max_results: 5,
					include_answer: true,
				}),
			});
			const data = await res.json() as {
				answer?: string;
				results?: Array<{ title: string; url: string; content: string }>;
			};
			return ok({
				answer: data.answer,
				results: data.results?.map(r => ({
					title: r.title,
					url: r.url,
					snippet: r.content?.slice(0, 300),
				})),
			});
		} catch (e) {
			return err((e as Error).message);
		}
	}
);
