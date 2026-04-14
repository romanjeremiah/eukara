// ============================================================
// AI Module — Public API
//
// Usage:
//   import { getProvider, routeMessage, background } from './ai';
//   const { provider, route } = getProvider(ctx, env);
//   const response = await provider.chat(messages, tools, config);
// ============================================================

export { CloudflareProvider } from './cloudflare';
export { GeminiProvider } from './gemini';
export { routeMessage, createProvider, getProvider } from './router';
export type { RouterContext } from './router';
export * as background from './background';
