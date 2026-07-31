// ============================================================
// Weather Service
//
// Fetches current conditions from Open-Meteo (free, no API key,
// no rate limit for reasonable use) for ambient context in
// Eukara's dynamic prompt. The weather is a ONE-LINE hint, not
// a forecast — it lets the AI casually reference "it's grim in
// London today" instead of being weather-blind.
//
// Results are cached per-user in KV for 30 min so a rapid burst
// of messages doesn't hit the API repeatedly.
// ============================================================

import { coordsForTimezone } from '../config/timezone-coords';
import { log } from '../lib/logger';

/** Trimmed Open-Meteo response, only the fields we use. */
interface OpenMeteoResponse {
	current?: {
		temperature_2m?: number;
		weather_code?: number;
		is_day?: number;
	};
}

/**
 * Weather code → human label. Based on WMO codes that Open-Meteo
 * returns. Grouped by meaningful category so the LLM doesn't have
 * to interpret "code 51". Keys are plain English, AI-ready.
 *
 * Reference: https://open-meteo.com/en/docs (Weather Codes section)
 */
function weatherLabel(code: number, isDay: boolean): string {
	if (code === 0) return isDay ? 'clear and sunny' : 'clear night';
	if (code === 1) return isDay ? 'mostly sunny' : 'mostly clear';
	if (code === 2) return 'partly cloudy';
	if (code === 3) return 'overcast';
	if (code >= 45 && code <= 48) return 'foggy';
	if (code >= 51 && code <= 57) return 'drizzling';
	if (code >= 61 && code <= 67) return 'raining';
	if (code >= 71 && code <= 77) return 'snowing';
	if (code >= 80 && code <= 82) return 'rain showers';
	if (code >= 85 && code <= 86) return 'snow showers';
	if (code >= 95) return 'thunderstorm';
	return 'unsettled';
}

export interface WeatherSummary {
	label: string;        // Human label like "drizzling, 12°C"
	city: string;         // City name for the LLM to reference naturally
	condition: string;    // Just the weather phrase, for composability
	tempC: number;        // Raw temperature for the AI if it needs it
}

/**
 * Fetch current weather for the user's approximate location.
 * Returns null if:
 *   - The user's timezone isn't in the coords lookup
 *   - The Open-Meteo API fails or returns malformed data
 *
 * A null return means "skip the weather line" — the rest of the
 * dynamic context continues normally.
 */
export async function getWeather(
	env: Env, userId: number, timezone: string
): Promise<WeatherSummary | null> {
	const coords = coordsForTimezone(timezone);
	if (!coords) return null;

	// Check KV cache first. Key is scoped per timezone to share cache
	// across hypothetical users in the same place, but we use userId
	// in the key to keep isolation clean for later multi-user.
	const cacheKey = `weather_${userId}_${timezone}`;
	const cached = await env.CHAT_KV.get(cacheKey);
	if (cached) {
		try { return JSON.parse(cached) as WeatherSummary; } catch { /* fall through */ }
	}

	try {
		// Open-Meteo: single request for current conditions. Free tier,
		// no auth. Docs: https://open-meteo.com/en/docs
		const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
		const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
		if (!res.ok) {
			log.warn('weather_api_non_ok', { userId, status: res.status });
			return null;
		}
		const data = await res.json() as OpenMeteoResponse;
		const c = data.current;
		if (!c || typeof c.temperature_2m !== 'number' || typeof c.weather_code !== 'number') {
			log.warn('weather_api_malformed', { userId });
			return null;
		}

		const condition = weatherLabel(c.weather_code, c.is_day !== 0);
		const tempC = Math.round(c.temperature_2m);
		const summary: WeatherSummary = {
			label: `${condition}, ${tempC}°C`,
			city: coords.label,
			condition,
			tempC,
		};

		// Cache 30 min. Weather doesn't change fast enough to justify
		// hitting the API on every message.
		await env.CHAT_KV.put(cacheKey, JSON.stringify(summary), { expirationTtl: 1800 });
		return summary;
	} catch (e) {
		// Timeout, network error, or anything else — weather is optional
		// context, never worth blocking or crashing the message flow.
		log.warn('weather_fetch_error', { userId, msg: (e as Error).message });
		return null;
	}
}

/**
 * Format a WeatherSummary as the one-line context string injected
 * into the system prompt. Kept intentionally spare — the AI decides
 * whether and how to mention it.
 */
export function formatWeatherForContext(weather: WeatherSummary | null): string {
	if (!weather) return '';
	return `\nWeather in ${weather.city}: ${weather.label}`;
}
