import React from 'react';
import { MarketState, ActiveLayer } from '../types';
import { Clock, Eye } from 'lucide-react';

interface Timeline24hProps {
  marketState: MarketState;
  activeLayer: ActiveLayer;
  currentUtcHourFloat: number; // 0.00 to 24.00
  onSeekUtcHour?: (hour: number | null) => void;
  isSimulated?: boolean;
}

export const Timeline24h: React.FC<Timeline24hProps> = ({
  marketState,
  activeLayer,
  currentUtcHourFloat,
  onSeekUtcHour,
  isSimulated = false,
}) => {
  const { sessions, killzones } = marketState;

  // Helper to convert HH:MM string to float hour (0-24)
  const parseTimeToFloat = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  // Convert hours to percentage position (0% - 100%)
  const hourToPercent = (hour: number) => {
    const normalized = ((hour % 24) + 24) % 24;
    return (normalized / 24) * 100;
  };

  // Build segments for spans that might wrap around midnight
  const getSegments = (startFloat: number, endFloat: number) => {
    if (endFloat > startFloat) {
      return [{ left: hourToPercent(startFloat), width: hourToPercent(endFloat - startFloat) }];
    } else {
      // Wraps around midnight (e.g., 22:00 to 07:00)
      return [
        { left: hourToPercent(startFloat), width: hourToPercent(24 - startFloat) },
        { left: 0, width: hourToPercent(endFloat) },
      ];
    }
  };

  const cursorPercent = hourToPercent(currentUtcHourFloat);

  const hoursList = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="w-full rounded-xl border border-slate-800/80 bg-slate-950/70 backdrop-blur-md p-4 space-y-3" id="timeline-24h">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            24-Часовая шкала ликвидности (UTC Market Hours & Overlaps)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {isSimulated && (
            <button
              onClick={() => onSeekUtcHour?.(null)}
              className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-all flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Вернуться в Real-Time
            </button>
          )}
          <span className="text-slate-400 font-mono">
            Текущее положение: <strong className="text-white">{marketState.utcTimeFormatted} UTC</strong>
          </span>
        </div>
      </div>

      {/* Timeline Bar Container */}
      <div className="relative pt-2 pb-1 select-none">
        {/* Hour tick marks */}
        <div className="relative w-full h-5 flex justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 mb-1.5">
          {hoursList.filter((h) => h % 3 === 0).map((hour) => {
            const leftPercent = (hour / 24) * 100;
            return (
              <div
                key={hour}
                className="absolute transform -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${leftPercent}%` }}
              >
                <span>{hour.toString().padStart(2, '0')}:00</span>
                <span className="w-0.5 h-1.5 bg-slate-700 mt-0.5" />
              </div>
            );
          })}
        </div>

        {/* Tracks Container */}
        <div
          className="relative w-full rounded-lg bg-slate-900/90 border border-slate-800/80 p-2 space-y-1.5 cursor-crosshair overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const hourClicked = Math.max(0, Math.min(23.99, (clickX / rect.width) * 24));
            onSeekUtcHour?.(hourClicked);
          }}
        >
          {/* Overlap Zone Highlight: London + NY Golden Hours (12:00 to 16:00 UTC) */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/10 border-x border-emerald-500/30 pointer-events-none z-0"
            style={{
              left: `${hourToPercent(12)}%`,
              width: `${hourToPercent(4)}%`,
            }}
            title="London + NY Overlap (Golden Trading Hours)"
          />

          {/* SESSIONS TRACKS (if visible) */}
          {(activeLayer === 'sessions' || activeLayer === 'both') && (
            <div className="space-y-1 relative z-10">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                Сессии (Sessions)
              </div>
              {sessions.map((s) => {
                const startF = parseTimeToFloat(s.startUtc);
                const endF = parseTimeToFloat(s.endUtc);
                const segments = getSegments(startF, endF);

                return (
                  <div key={s.id} className="relative h-5 rounded bg-slate-950/60 overflow-hidden">
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className={`absolute top-0 bottom-0 rounded flex items-center px-2 transition-all ${
                          s.isOpen
                            ? 'opacity-90 shadow-[0_0_10px_rgba(255,255,255,0.15)] font-semibold text-white'
                            : 'opacity-40 text-slate-300'
                        }`}
                        style={{
                          left: `${seg.left}%`,
                          width: `${seg.width}%`,
                          backgroundColor: s.color,
                        }}
                      >
                        <span className="text-[10px] truncate drop-shadow-md">
                          {s.name} ({s.startUtc}–{s.endUtc})
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* KILLZONES TRACKS (if visible) */}
          {(activeLayer === 'killzones' || activeLayer === 'both') && (
            <div className="space-y-1 relative z-10 pt-1">
              <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                <span>ICT Killzones (Smart Money Windows)</span>
              </div>
              {killzones.map((kz) => {
                const startF = parseTimeToFloat(kz.startUtc);
                const endF = parseTimeToFloat(kz.endUtc);
                const segments = getSegments(startF, endF);

                return (
                  <div key={kz.id} className="relative h-5 rounded bg-slate-950/60 overflow-hidden">
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        className={`absolute top-0 bottom-0 rounded border-y border-dashed flex items-center px-2 transition-all ${
                          kz.isActive
                            ? 'opacity-100 shadow-[0_0_15px_rgba(168,85,247,0.4)] font-bold text-white ring-1 ring-white/50'
                            : 'opacity-50 text-slate-200'
                        }`}
                        style={{
                          left: `${seg.left}%`,
                          width: `${seg.width}%`,
                          backgroundColor: kz.color,
                          borderColor: kz.borderColor,
                        }}
                      >
                        <span className="text-[10px] truncate drop-shadow-md">
                          {kz.name} ({kz.startUtc}–{kz.endUtc} UTC)
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Current UTC Time Cursor Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-30 pointer-events-none transition-all duration-300 shadow-[0_0_10px_#f43f5e]"
            style={{ left: `${cursorPercent}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_8px_#f43f5e]" />
            <div className="absolute -bottom-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>💡 Кликните по шкале для проверки активности в любое время суток</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-400 inline-block" />
            London+NY Overlap
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
            Live UTC Маркер
          </span>
        </div>
      </div>
    </div>
  );
};
