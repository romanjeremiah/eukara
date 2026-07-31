// ============================================================
// Timezone → approximate coordinates lookup
//
// Used by the weather context fetch to avoid asking the user
// for location. The idea is "good enough for ambient weather":
// Salzburg vs Vienna doesn't matter for "it's rainy in Austria
// today". For anything requiring real GPS precision, a proper
// /location command would be needed.
//
// Coordinates picked to match the city the timezone's IANA
// name derives from. If a user's actual city differs (e.g. a
// Londoner in Edinburgh still has Europe/London), they get
// London's weather. That's a known limitation, not a bug.
// ============================================================

export interface Coords {
	lat: number;
	lon: number;
	label: string; // Human-readable label used in the weather line
}

export const TIMEZONE_COORDS: Readonly<Record<string, Coords>> = {
	'Europe/London':       { lat: 51.5074, lon: -0.1278,  label: 'London' },
	'Europe/Dublin':       { lat: 53.3498, lon: -6.2603,  label: 'Dublin' },
	'Europe/Paris':        { lat: 48.8566, lon:  2.3522,  label: 'Paris' },
	'Europe/Berlin':       { lat: 52.5200, lon: 13.4050,  label: 'Berlin' },
	'Europe/Vienna':       { lat: 48.2082, lon: 16.3738,  label: 'Vienna' },
	'Europe/Madrid':       { lat: 40.4168, lon: -3.7038,  label: 'Madrid' },
	'Europe/Athens':       { lat: 37.9838, lon: 23.7275,  label: 'Athens' },
	'Europe/Istanbul':     { lat: 41.0082, lon: 28.9784,  label: 'Istanbul' },
	'Europe/Amsterdam':    { lat: 52.3676, lon:  4.9041,  label: 'Amsterdam' },
	'Europe/Warsaw':       { lat: 52.2297, lon: 21.0122,  label: 'Warsaw' },
	'Europe/Rome':         { lat: 41.9028, lon: 12.4964,  label: 'Rome' },
	'America/New_York':    { lat: 40.7128, lon: -74.0060, label: 'New York' },
	'America/Chicago':     { lat: 41.8781, lon: -87.6298, label: 'Chicago' },
	'America/Denver':      { lat: 39.7392, lon: -104.9903,label: 'Denver' },
	'America/Los_Angeles': { lat: 34.0522, lon: -118.2437,label: 'Los Angeles' },
	'America/Toronto':     { lat: 43.6532, lon: -79.3832, label: 'Toronto' },
	'America/Sao_Paulo':   { lat: -23.5505,lon: -46.6333, label: 'São Paulo' },
	'Asia/Dubai':          { lat: 25.2048, lon: 55.2708,  label: 'Dubai' },
	'Asia/Kolkata':        { lat: 19.0760, lon: 72.8777,  label: 'Mumbai' },
	'Asia/Singapore':      { lat:  1.3521, lon: 103.8198, label: 'Singapore' },
	'Asia/Tokyo':          { lat: 35.6762, lon: 139.6503, label: 'Tokyo' },
	'Asia/Seoul':          { lat: 37.5665, lon: 126.9780, label: 'Seoul' },
	'Asia/Shanghai':       { lat: 31.2304, lon: 121.4737, label: 'Shanghai' },
	'Australia/Sydney':    { lat: -33.8688,lon: 151.2093, label: 'Sydney' },
	'Pacific/Auckland':    { lat: -36.8509,lon: 174.7645, label: 'Auckland' },
};

export function coordsForTimezone(tz: string): Coords | null {
	return TIMEZONE_COORDS[tz] ?? null;
}
