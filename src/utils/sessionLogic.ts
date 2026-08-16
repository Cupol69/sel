import { RAW_SESSIONS } from './constants';
import { SessionInfo, LiquidityLevel } from '../types';

/**
 * Returns the parts of date in a specific IANA timezone:
 * year, month, day, hour, minute, second, dayOfWeek
 */
export function getTimePartsInZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: map.year || 2026,
    month: map.month || 1,
    day: map.day || 1,
    hour: map.hour === 24 ? 0 : (map.hour || 0),
    minute: map.minute || 0,
    second: map.second || 0,
  };
}

/**
 * Converts a specific local date+time in a given timezone into an exact UTC Date object.
 */
export function createDateInZone(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  // Construct ISO-like target string: "YYYY-MM-DDTHH:mm:ss"
  const pad = (n: number) => n.toString().padStart(2, '0');
  const targetStr = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;

  // Approximate as UTC then measure offset
  let utcGuess = new Date(`${targetStr}Z`);
  
  // Refine using offset
  for (let i = 0; i < 3; i++) {
    const parts = getTimePartsInZone(utcGuess, timeZone);
    const guessDateAsLocal = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));
    const targetDateAsLocal = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const diff = targetDateAsLocal.getTime() - guessDateAsLocal.getTime();
    if (diff === 0) break;
    utcGuess = new Date(utcGuess.getTime() + diff);
  }

  return utcGuess;
}

/**
 * Checks if DST is active in a timezone for a given date
 */
export function isDstInZone(date: Date, timeZone: string): { isDst: boolean; name: string } {
  try {
    // January vs July offset comparison
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);

    const getOffset = (d: Date) => {
      const parts = getTimePartsInZone(d, timeZone);
      const asLocal = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
      return (asLocal - d.getTime()) / (1000 * 60);
    };

    const currentOffset = getOffset(date);
    const janOffset = getOffset(jan);
    const julOffset = getOffset(jul);
    const stdOffset = Math.min(janOffset, julOffset);

    const isDst = currentOffset > stdOffset;
    
    // Formatter for short timeZoneName (e.g. EDT vs EST, BST vs GMT, AEDT vs AEST)
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    });
    const tzName = tzFormatter.formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';

    return { isDst, name: tzName };
  } catch {
    return { isDst: false, name: '' };
  }
}

/**
 * Formats a duration in seconds into HH:MM:SS
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculates current status for all standard market sessions
 */
export function calculateSessions(now: Date): SessionInfo[] {
  return RAW_SESSIONS.map((raw) => {
    const localParts = getTimePartsInZone(now, raw.timezone);
    const dstInfo = isDstInZone(now, raw.timezone);

    // Current local seconds from midnight
    const localSecondsOfDay = localParts.hour * 3600 + localParts.minute * 60 + localParts.second;
    const sessionStartSeconds = raw.localStartHour * 3600;
    const sessionEndSeconds = raw.localEndHour * 3600;
    const sessionDurationSeconds = sessionEndSeconds - sessionStartSeconds;

    const isOpen = localSecondsOfDay >= sessionStartSeconds && localSecondsOfDay < sessionEndSeconds;

    let timeRemainingSeconds = 0;
    let progressPercent = 0;

    if (isOpen) {
      // Time until close
      timeRemainingSeconds = sessionEndSeconds - localSecondsOfDay;
      const elapsed = localSecondsOfDay - sessionStartSeconds;
      progressPercent = Math.min(100, Math.max(0, (elapsed / sessionDurationSeconds) * 100));
    } else {
      // Time until open
      if (localSecondsOfDay < sessionStartSeconds) {
        timeRemainingSeconds = sessionStartSeconds - localSecondsOfDay;
      } else {
        // After close, opens tomorrow at sessionStartSeconds
        timeRemainingSeconds = (86400 - localSecondsOfDay) + sessionStartSeconds;
      }
      progressPercent = 0;
    }

    // Determine today's UTC start and end times
    const startUtcDate = createDateInZone(
      localParts.year,
      localParts.month,
      localParts.day,
      raw.localStartHour,
      0,
      0,
      raw.timezone
    );
    const endUtcDate = createDateInZone(
      localParts.year,
      localParts.month,
      localParts.day,
      raw.localEndHour,
      0,
      0,
      raw.timezone
    );

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startUtcStr = `${pad(startUtcDate.getUTCHours())}:${pad(startUtcDate.getUTCMinutes())}`;
    const endUtcStr = `${pad(endUtcDate.getUTCHours())}:${pad(endUtcDate.getUTCMinutes())}`;

    const localTimeFormatted = `${pad(localParts.hour)}:${pad(localParts.minute)}:${pad(localParts.second)}`;
    const utcTimeFormatted = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;

    return {
      id: raw.id,
      name: raw.name,
      city: raw.city,
      country: raw.country,
      timezone: raw.timezone,
      color: raw.color,
      textColor: raw.textColor,
      accentColor: raw.accentColor,
      startHourLocal: raw.localStartHour,
      endHourLocal: raw.localEndHour,
      startUtc: startUtcStr,
      endUtc: endUtcStr,
      isOpen,
      timeRemainingSeconds,
      progressPercent,
      localTimeFormatted,
      utcTimeFormatted,
      longitudeMin: raw.longitudeMin,
      longitudeMax: raw.longitudeMax,
      centerLng: raw.centerLng,
      centerLat: raw.centerLat,
      dstActive: dstInfo.isDst,
      dstName: dstInfo.name,
    };
  });
}
