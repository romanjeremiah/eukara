// ============================================================
// Timezone Presets
//
// Curated list of common timezones offered as buttons in the
// /timezone command. Covers major population centres across
// all continents with a single button per timezone.
//
// The labels are short enough to fit two per row in Telegram's
// inline keyboard. The tz string is the full IANA identifier,
// which is what Intl.DateTimeFormat and Date.toLocaleString
// expect.
// ============================================================

export interface TimezonePreset {
	label: string;
	tz: string;
	flag: string;
}

export const TIMEZONE_PRESETS: readonly TimezonePreset[] = [
	{ label: 'London', tz: 'Europe/London', flag: '🇬🇧' },
	{ label: 'Dublin', tz: 'Europe/Dublin', flag: '🇮🇪' },
	{ label: 'Paris', tz: 'Europe/Paris', flag: '🇫🇷' },
	{ label: 'Berlin', tz: 'Europe/Berlin', flag: '🇩🇪' },
	{ label: 'Salzburg', tz: 'Europe/Vienna', flag: '🇦🇹' },
	{ label: 'Madrid', tz: 'Europe/Madrid', flag: '🇪🇸' },
	{ label: 'Athens', tz: 'Europe/Athens', flag: '🇬🇷' },
	{ label: 'Istanbul', tz: 'Europe/Istanbul', flag: '🇹🇷' },
	{ label: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
	{ label: 'Chicago', tz: 'America/Chicago', flag: '🇺🇸' },
	{ label: 'Denver', tz: 'America/Denver', flag: '🇺🇸' },
	{ label: 'Los Angeles', tz: 'America/Los_Angeles', flag: '🇺🇸' },
	{ label: 'Toronto', tz: 'America/Toronto', flag: '🇨🇦' },
	{ label: 'São Paulo', tz: 'America/Sao_Paulo', flag: '🇧🇷' },
	{ label: 'Dubai', tz: 'Asia/Dubai', flag: '🇦🇪' },
	{ label: 'Mumbai', tz: 'Asia/Kolkata', flag: '🇮🇳' },
	{ label: 'Singapore', tz: 'Asia/Singapore', flag: '🇸🇬' },
	{ label: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
	{ label: 'Seoul', tz: 'Asia/Seoul', flag: '🇰🇷' },
	{ label: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
] as const;

export function findPresetByTz(tz: string): TimezonePreset | undefined {
	return TIMEZONE_PRESETS.find(p => p.tz === tz);
}

/**
 * Validate an IANA timezone string against the runtime's list.
 * Workerd supports Intl.supportedValuesOf — if it doesn't on some
 * version, we fall back to a try/catch on toLocaleString.
 */
export function isValidTimezone(tz: string): boolean {
	// Primary check: supportedValuesOf is available in modern runtimes
	try {
		if (typeof Intl.supportedValuesOf === 'function') {
			return (Intl.supportedValuesOf('timeZone') as string[]).includes(tz);
		}
	} catch { /* fall through */ }

	// Fallback: attempt to format a date in the given tz. Invalid tz
	// throws a RangeError.
	try {
		new Date().toLocaleString('en-US', { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}
