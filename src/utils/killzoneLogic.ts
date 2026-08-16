import { RAW_KILLZONES } from './constants';
import { KillzoneInfo, SessionInfo, LiquidityLevel, MarketState } from '../types';
import { getTimePartsInZone, createDateInZone, calculateSessions } from './sessionLogic';

const NY_TIMEZONE = 'America/New_York';

/**
 * Calculates current status for all ICT Killzones anchored in America/New_York timezone
 */
export function calculateKillzones(now: Date): KillzoneInfo[] {
  const nyParts = getTimePartsInZone(now, NY_TIMEZONE);
  const nySecondsOfDay = nyParts.hour * 3600 + nyParts.minute * 60 + nyParts.second;

  return RAW_KILLZONES.map((raw) => {
    const startSec = raw.nyStartHour * 3600 + raw.nyStartMinute * 60;
    const endSec = raw.nyEndHour * 3600 + raw.nyEndMinute * 60;
    const durationSec = endSec - startSec;

    const isActive = nySecondsOfDay >= startSec && nySecondsOfDay < endSec;

    let timeRemainingSeconds = 0;
    let progressPercent = 0;

    if (isActive) {
      // Time to end of killzone
      timeRemainingSeconds = endSec - nySecondsOfDay;
      const elapsed = nySecondsOfDay - startSec;
      progressPercent = Math.min(100, Math.max(0, (elapsed / durationSec) * 100));
    } else {
      // Time to start of killzone
      if (nySecondsOfDay < startSec) {
        timeRemainingSeconds = startSec - nySecondsOfDay;
      } else {
        timeRemainingSeconds = (86400 - nySecondsOfDay) + startSec;
      }
      progressPercent = 0;
    }

    // Convert NY start and end hours to UTC strings
    const startUtcDate = createDateInZone(
      nyParts.year,
      nyParts.month,
      nyParts.day,
      raw.nyStartHour,
      raw.nyStartMinute,
      0,
      NY_TIMEZONE
    );
    const endUtcDate = createDateInZone(
      nyParts.year,
      nyParts.month,
      nyParts.day,
      raw.nyEndHour,
      raw.nyEndMinute,
      0,
      NY_TIMEZONE
    );

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startUtcStr = `${pad(startUtcDate.getUTCHours())}:${pad(startUtcDate.getUTCMinutes())}`;
    const endUtcStr = `${pad(endUtcDate.getUTCHours())}:${pad(endUtcDate.getUTCMinutes())}`;
    const nyStartTimeStr = `${pad(raw.nyStartHour)}:${pad(raw.nyStartMinute)}`;
    const nyEndTimeStr = `${pad(raw.nyEndHour)}:${pad(raw.nyEndMinute)}`;

    return {
      id: raw.id,
      name: raw.name,
      alias: raw.alias,
      description: raw.description,
      nyStartTime: nyStartTimeStr,
      nyEndTime: nyEndTimeStr,
      nyStartHour: raw.nyStartHour,
      nyEndHour: raw.nyEndHour,
      startUtc: startUtcStr,
      endUtc: endUtcStr,
      isActive,
      timeRemainingSeconds,
      progressPercent,
      color: raw.color,
      borderColor: raw.borderColor,
      associatedSessionId: raw.associatedSessionId,
      longitudeMin: raw.longitudeMin,
      longitudeMax: raw.longitudeMax,
      centerLng: raw.centerLng,
      centerLat: raw.centerLat,
    };
  });
}

/**
 * Calculates complete unified market state including BTC liquidity levels
 */
export function getMarketState(now: Date = new Date()): MarketState {
  const sessions = calculateSessions(now);
  const killzones = calculateKillzones(now);

  const activeSessions = sessions.filter((s) => s.isOpen);
  const activeKillzones = killzones.filter((k) => k.isActive);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const utcTimeFormatted = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
  
  const localParts = getTimePartsInZone(now, Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const localTimeFormatted = `${pad(localParts.hour)}:${pad(localParts.minute)}:${pad(localParts.second)}`;

  const nyParts = getTimePartsInZone(now, NY_TIMEZONE);
  const nyTimeFormatted = `${pad(nyParts.hour)}:${pad(nyParts.minute)}:${pad(nyParts.second)}`;

  // Overlap checks
  const isLondonOpen = sessions.find((s) => s.id === 'london')?.isOpen ?? false;
  const isNyOpen = sessions.find((s) => s.id === 'new_york')?.isOpen ?? false;
  const isLondonNyOverlap = isLondonOpen && isNyOpen;

  // Determine Liquidity Level for BTC/Crypto:
  // - low: 0 active sessions
  // - medium: 1 active session
  // - high: 2+ active sessions simultaneously OR any killzone is active
  let liquidityLevel: LiquidityLevel = 'low';
  let liquidityScore = 1;
  let liquidityReason = 'Межсессионное затишье — низкая волатильность BTC';

  if (activeKillzones.length > 0) {
    liquidityLevel = 'high';
    liquidityScore = 3;
    const kzNames = activeKillzones.map((k) => k.name).join(' + ');
    const sessNames = activeSessions.map((s) => s.name).join(' & ');
    liquidityReason = sessNames 
      ? `Активна ${kzNames} + Сессия ${sessNames}`
      : `Идёт ${kzNames}`;
  } else if (activeSessions.length >= 2) {
    liquidityLevel = 'high';
    liquidityScore = 3;
    const sessNames = activeSessions.map((s) => s.name).join(' + ');
    liquidityReason = `Пересечение сессий (${sessNames}) — пиковый объём BTC`;
  } else if (activeSessions.length === 1) {
    liquidityLevel = 'medium';
    liquidityScore = 2;
    liquidityReason = `Активна сессия ${activeSessions[0].name} — средний объём`;
  }

  return {
    currentDate: now,
    utcTimeFormatted,
    localTimeFormatted,
    nyTimeFormatted,
    liquidityLevel,
    liquidityScore,
    liquidityReason,
    activeSessions,
    activeKillzones,
    sessions,
    killzones,
    isLondonNyOverlap,
  };
}
