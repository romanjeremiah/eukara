// GitHub Tools

import { defineTool, ok, err } from './factory';

export const readRepoFile = defineTool(
	'read_repo_file',
	'Read a file from the GitHub repository. Use to check current code before proposing changes.',
	{
		path: { type: 'string', description: 'File path relative to repo root (e.g. src/index.ts)' },
		repo: { type: 'string', description: 'Repo in owner/name format. Default: romanjeremiah/eukara' },
	},
	['path'],
	async (args, env) => {
		if (!env.GITHUB_TOKEN) return err('GitHub token not configured.');
		const repo = (args.repo as string) || 'romanjeremiah/eukara';
		const path = args.path as string;
		try {
			const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
				headers: {
					Authorization: `Bearer ${env.GITHUB_TOKEN}`,
					Accept: 'application/vnd.github.v3.raw',
					'User-Agent': 'Eukara',
				},
			});
			if (!res.ok) return err(`GitHub ${res.status}: ${res.statusText}`);
			const content = await res.text();
			return ok({ path, content: content.slice(0, 10000) });
		} catch (e) {
			return err((e as Error).message);
		}
	}
);

export const patchRepoFile = defineTool(
	'patch_repo_file',
	'Create a commit with a file change on GitHub. ONLY use after explicit user permission.',
	{
		path: { type: 'string', description: 'File path to create/update' },
		content: { type: 'string', description: 'New file content' },
		message: { type: 'string', description: 'Commit message' },
		repo: { type: 'string', description: 'Repo in owner/name format' },
	},
	['path', 'content', 'message'],
	async (args, env, ctx) => {
		if (!env.OWNER_ID || String(ctx.userId) !== String(env.OWNER_ID)) {
			return err('Only the configured owner may modify repository files.');
		}
		if (!env.GITHUB_TOKEN) return err('GitHub token not configured.');
		const repo = (args.repo as string) || 'romanjeremiah/eukara';
		const path = args.path as string;

		try {
			// Get current file SHA if it exists
			const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
				headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'User-Agent': 'Eukara' },
			});
			let sha: string | undefined;
			if (getRes.ok) {
				const data = await getRes.json() as { sha: string };
				sha = data.sha;
			}

			// Create/update file
			const body: Record<string, unknown> = {
				message: args.message,
				content: btoa(unescape(encodeURIComponent(args.content as string))),
			};
			if (sha) body.sha = sha;

			const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${env.GITHUB_TOKEN}`,
					'Content-Type': 'application/json',
					'User-Agent': 'Eukara',
				},
				body: JSON.stringify(body),
			});

			if (!res.ok) return err(`GitHub ${res.status}`);
			const result = await res.json() as { commit?: { html_url?: string } };
			return ok({ path, commit_url: result.commit?.html_url });
		} catch (e) {
			return err((e as Error).message);
		}
	}
);
