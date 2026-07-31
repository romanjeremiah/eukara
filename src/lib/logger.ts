// ============================================================
// Structured Logger
//
// JSON-structured logging for Cloudflare Workers observability.
// Each log entry includes timestamp, level, message, and metadata.
// ============================================================

type LogLevel = 'info' | 'warn' | 'error' | 'fatal';

function emit(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
	const entry = {
		ts: new Date().toISOString(),
		level,
		msg,
		...meta,
	};

	switch (level) {
		case 'error':
		case 'fatal':
			console.error(JSON.stringify(entry));
			break;
		case 'warn':
			console.warn(JSON.stringify(entry));
			break;
		default:
			console.log(JSON.stringify(entry));
	}
}

export const log = {
	info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
	warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
	error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta),
	fatal: (msg: string, meta?: Record<string, unknown>) => emit('fatal', msg, meta),
};
