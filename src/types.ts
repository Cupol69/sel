export type LiquidityLevel = 'low' | 'medium' | 'high';

export type ActiveLayer = 'sessions' | 'killzones' | 'both';

export interface SessionInfo {
  id: string;
  name: string;
  city: string;
  country: string;
  timezone: string; // IANA
  color: string;
  textColor: string;
  accentColor: string;
  startHourLocal: number; // e.g. 8 (08:00 local)
  endHourLocal: number;   // e.g. 17 (17:00 local)
  startUtc: string;      // Formatted HH:mm UTC for today
  endUtc: string;        // Formatted HH:mm UTC for today
  isOpen: boolean;
  timeRemainingSeconds: number; // To close if open, to open if closed
  progressPercent: number; // 0-100% of current session progress
  localTimeFormatted: string; // e.g. "14:32:05"
  utcTimeFormatted: string;
  longitudeMin: number;
  longitudeMax: number;
  centerLng: number;
  centerLat: number;
  dstActive: boolean;
  dstName: string;
}

export interface KillzoneInfo {
  id: string;
  name: string;
  alias: string;
  description: string;
  nyStartTime: string; // "19:00"
  nyEndTime: string;   // "22:00"
  nyStartHour: number;
  nyEndHour: number;
  startUtc: string;
  endUtc: string;
  isActive: boolean;
  timeRemainingSeconds: number;
  progressPercent: number;
  color: string;
  borderColor: string;
  associatedSessionId: string;
  longitudeMin: number;
  longitudeMax: number;
  centerLng: number;
  centerLat: number;
}

export interface MarketState {
  currentDate: Date;
  utcTimeFormatted: string;
  localTimeFormatted: string;
  nyTimeFormatted: string;
  liquidityLevel: LiquidityLevel;
  liquidityScore: number; // 1 (low), 2 (med), 3 (high)
  liquidityReason: string;
  activeSessions: SessionInfo[];
  activeKillzones: KillzoneInfo[];
  sessions: SessionInfo[];
  killzones: KillzoneInfo[];
  isLondonNyOverlap: boolean;
}
