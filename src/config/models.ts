// ============================================================
// AI Model Configuration
//
// Centralised model identifiers and routing rules.
// Change models here, not scattered across service files.
// ============================================================

// --- Cloudflare AI Models (free tier, 10,000 neurons/day) ---
export const CF_MODELS = {
	/** Primary conversational model: function calling, thinking, 256K context, vision */
	chat: '@cf/google/gemma-4-26b-a4b-it',
	/** Strong reasoning MoE for complex analysis, function calling, 32K context */
	reasoning: '@cf/qwen/qwen3-30b-a3b-fp8',
	/** Fast observation extraction, 8B params */
	observation: '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
	/** Cheapest: tagging, sentiment, classification */
	classify: '@cf/meta/llama-3.2-1b-instruct',
	/** 131K context: summarisation, memory consolidation */
	summarise: '@cf/zai-org/glm-4.7-flash',
	/** Embeddings: 1024 dims, 4096 input tokens */
	embedding: '@cf/qwen/qwen3-embedding-0.6b',
	/** Reranker for search result scoring */
	reranker: '@cf/baai/bge-reranker-base',
	/** Speech-to-text */
	stt: '@cf/openai/whisper-large-v3-turbo',
} as const;

// --- Gemini Models (paid, used only for irreplaceable features) ---
export const GEMINI_MODELS = {
	/** Deep therapeutic reasoning, unmatched nuance */
	pro: 'gemini-3.1-pro-preview',
	/** Fallback for when Pro is rate-limited */
	flash: 'gemini-3-flash-preview',
	/** Image generation */
	image: 'gemini-3-pro-image-preview',
	/** Image generation fallback */
	imageFallback: 'gemini-3.1-flash-image-preview',
	/** Text-to-speech */
	tts: 'gemini-2.5-pro-preview-tts',
	/** Deep Research agent */
	research: 'deep-research-pro-preview-12-2025',
} as const;

// --- Complexity detection keywords ---
export const COMPLEXITY_PATTERNS = {
	emotional: /\b(anxious|depressed|panic|overwhelm|scared|lonely|empty|hopeless|angry|frustrated|sad|grief|trigger|manic|racing|numb|crying|breakdown|struggling|worried|stressed|therapy|schema|attachment|IFS|parts work)\b/i,
	code: /\b(code|function|bug|error|deploy|refactor|typescript|javascript|python|api|endpoint|database|query|sql|commit|PR|merge|git)\b/i,
	analytical: /\b(analy[sz]e|compare|strategy|plan|deep dive|research|investigate|review|evaluate|assess)\b/i,
	codeBlock: /```[\s\S]+```/,
} as const;
