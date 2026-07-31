// ============================================================
// AI Module — Public API
//
// Usage:
//   import { getProvider, routeMessage, background } from './ai';
//   const { provider, route } = getProvider(ctx, env);
//   const response = await provider.chat(messages, tools, config);
// ============================================================

export { CloudflareProvider } from './cloudflare';
export { OpenAIProvider, UnsupportedOpenAIMediaError } from './openai';
export {
	createOpenAISpecialistService,
	OpenAISpecialistService,
} from './openai-specialists';
export {
	createConfiguredProvider,
	createOpenAIProvider,
	createRouteProvider,
	getAIProviderMode,
} from './provider-factory';
export { routeMessage, createProvider, getProvider } from './router';
export type { AIProviderMode } from './provider-factory';
export type { RouterContext } from './router';
export * as background from './background';
