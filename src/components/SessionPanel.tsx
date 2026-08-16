import React from 'react';
import { SessionInfo } from '../types';
import { formatDuration } from '../utils/sessionLogic';
import { Clock, Globe, MapPin, Sparkles } from 'lucide-react';

interface SessionPanelProps {
  sessions: SessionInfo[];
  onSelectSession?: (sessionId: string) => void;
  selectedSessionId?: string | null;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({
  sessions,
  onSelectSession,
  selectedSessionId,
}) => {
  return (
    <div className="w-full space-y-3" id="sessions-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            Основные торговые сессии (Forex / Crypto Market Hours)
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Широкие диапазоны активности мировых бирж
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sessions.map((session) => {
          const isSelected = selectedSessionId === session.id;
          const isOpen = session.isOpen;

          return (
            <div
              key={session.id}
              id={`session-card-${session.id}`}
              onClick={() => onSelectSession?.(session.id)}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 cursor-pointer backdrop-blur-md ${
                isOpen
                  ? 'bg-slate-900/80 border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                  : 'bg-slate-950/50 border-slate-800/60 opacity-85 hover:opacity-100 hover:border-slate-700'
              } ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-[#0d1117] ring-blue-500 scale-[1.01]'
                  : ''
              }`}
            >
              {/* Top Accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-all"
                style={{
                  backgroundColor: session.color,
                  opacity: isOpen ? 1 : 0.4,
                  boxShadow: isOpen ? `0 0 12px ${session.color}` : 'none',
                }}
              />

              {/* Header: City, Name and Status */}
              <div className="flex items-start justify-between gap-2 mt-1">
                <div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {session.city}
                    </span>
                    {session.dstActive && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        {session.dstName || 'DST'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                    {session.name}
                  </h3>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isOpen
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span>{isOpen ? 'АКТИВНА' : 'ЗАКРЫТА'}</span>
                </div>
              </div>

              {/* Working Hours UTC */}
              <div className="mt-3 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-500" />
                  Часы работы (UTC):
                </span>
                <span className="font-mono text-slate-200 font-medium">
                  {session.startUtc} – {session.endUtc} UTC
                </span>
              </div>

              {/* Local Clock */}
              <div className="mt-1.5 text-xs text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Время в городе:
                </span>
                <span className="font-mono text-white font-semibold">
                  {session.localTimeFormatted}
                </span>
              </div>

              {/* Countdown Timer */}
              <div
                className={`mt-3 p-2.5 rounded-lg border flex items-center justify-between ${
                  isOpen
                    ? 'bg-slate-800/40 border-slate-700/60'
                    : 'bg-black/30 border-slate-800/50'
                }`}
              >
                <span className="text-xs text-slate-400 font-medium">
                  {isOpen ? 'Закрытие через:' : 'Откроется через:'}
                </span>
                <span
                  className={`font-mono text-sm font-bold ${
                    isOpen ? 'text-emerald-300' : 'text-slate-300'
                  }`}
                >
                  {formatDuration(session.timeRemainingSeconds)}
                </span>
              </div>

              {/* Active Progress Bar */}
              {isOpen && (
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Прогресс сессии</span>
                    <span className="font-mono">{Math.round(session.progressPercent)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${session.progressPercent}%`,
                        backgroundColor: session.color,
                        boxShadow: `0 0 8px ${session.color}`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
