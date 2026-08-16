export interface RawSessionConfig {
  id: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  color: string;
  textColor: string;
  accentColor: string;
  // Standard Forex trading hours in local city time:
  // Sydney: 08:00 to 17:00 (which corresponds to 22:00-07:00 UTC with DST/AEST)
  // Tokyo: 09:00 to 18:00 (00:00 to 09:00 UTC, no DST)
  // London: 08:00 to 17:00 (07:00 to 16:00 UTC with BST, 08:00-17:00 UTC GMT)
  // New York: 08:00 to 17:00 (12:00 to 21:00 UTC with EDT, 13:00-22:00 UTC EST)
  localStartHour: number;
  localEndHour: number;
  longitudeMin: number;
  longitudeMax: number;
  centerLng: number;
  centerLat: number;
}

export const RAW_SESSIONS: RawSessionConfig[] = [
  {
    id: 'sydney',
    name: 'Sydney',
    city: 'Сидней',
    country: 'Australia',
    timezone: 'Australia/Sydney',
    color: '#3b82f6', // blue
    textColor: 'text-blue-400',
    accentColor: 'border-blue-500/50 bg-blue-500/10',
    localStartHour: 8,
    localEndHour: 17,
    longitudeMin: 110,
    longitudeMax: 180,
    centerLng: 151.2093,
    centerLat: -33.8688,
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    city: 'Токио',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    color: '#ef4444', // red
    textColor: 'text-red-400',
    accentColor: 'border-red-500/50 bg-red-500/10',
    localStartHour: 9,
    localEndHour: 18,
    longitudeMin: 85,
    longitudeMax: 145,
    centerLng: 139.6917,
    centerLat: 35.6895,
  },
  {
    id: 'london',
    name: 'London',
    city: 'Лондон',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    color: '#22c55e', // green
    textColor: 'text-emerald-400',
    accentColor: 'border-emerald-500/50 bg-emerald-500/10',
    localStartHour: 8,
    localEndHour: 17,
    longitudeMin: -25,
    longitudeMax: 35,
    centerLng: -0.1278,
    centerLat: 51.5074,
  },
  {
    id: 'new_york',
    name: 'New York',
    city: 'Нью-Йорк',
    country: 'United States',
    timezone: 'America/New_York',
    color: '#eab308', // yellow
    textColor: 'text-amber-400',
    accentColor: 'border-amber-500/50 bg-amber-500/10',
    localStartHour: 8,
    localEndHour: 17,
    longitudeMin: -105,
    longitudeMax: -45,
    centerLng: -74.006,
    centerLat: 40.7128,
  },
];

export interface RawKillzoneConfig {
  id: string;
  name: string;
  alias: string;
  description: string;
  nyStartHour: number;
  nyStartMinute: number;
  nyEndHour: number;
  nyEndMinute: number;
  color: string;
  borderColor: string;
  associatedSessionId: string;
  longitudeMin: number;
  longitudeMax: number;
  centerLng: number;
  centerLat: number;
}

export const RAW_KILLZONES: RawKillzoneConfig[] = [
  {
    id: 'asian_kz',
    name: 'Asian Killzone',
    alias: 'Азиатская Killzone',
    description: 'Формирование внутридневного диапазона (Judas swing / манипуляция)',
    nyStartHour: 19,
    nyStartMinute: 0,
    nyEndHour: 22,
    nyEndMinute: 0,
    color: '#06b6d4', // Cyan
    borderColor: '#22d3ee',
    associatedSessionId: 'tokyo',
    longitudeMin: 100,
    longitudeMax: 155,
    centerLng: 135.0,
    centerLat: 34.0,
  },
  {
    id: 'london_kz',
    name: 'London Killzone',
    alias: 'Лондонская Killzone',
    description: 'Инициация основного тренда дня, формирование High/Low дня (HOD/LOD)',
    nyStartHour: 2,
    nyStartMinute: 0,
    nyEndHour: 5,
    nyEndMinute: 0,
    color: '#10b981', // Emerald
    borderColor: '#34d399',
    associatedSessionId: 'london',
    longitudeMin: -15,
    longitudeMax: 25,
    centerLng: 0.0,
    centerLat: 50.0,
  },
  {
    id: 'ny_kz',
    name: 'New York Killzone',
    alias: 'Нью-Йорк Killzone',
    description: 'Открытие NYSE, выход макростатистики США, всплеск волатильности BTC',
    nyStartHour: 7,
    nyStartMinute: 0,
    nyEndHour: 10,
    nyEndMinute: 0,
    color: '#f59e0b', // Amber
    borderColor: '#fbbf24',
    associatedSessionId: 'new_york',
    longitudeMin: -90,
    longitudeMax: -55,
    centerLng: -74.0,
    centerLat: 40.0,
  },
  {
    id: 'london_close_kz',
    name: 'London Close Killzone',
    alias: 'London Close Killzone',
    description: 'Фиксация позиций европейскими фондами, разворотные паттерны или продолжение',
    nyStartHour: 10,
    nyStartMinute: 0,
    nyEndHour: 12,
    nyEndMinute: 0,
    color: '#a855f7', // Purple
    borderColor: '#c084fc',
    associatedSessionId: 'london',
    longitudeMin: -45,
    longitudeMax: 10,
    centerLng: -15.0,
    centerLat: 45.0,
  },
];
