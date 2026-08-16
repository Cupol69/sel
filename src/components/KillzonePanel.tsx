import React from 'react';
import { KillzoneInfo } from '../types';
import { formatDuration } from '../utils/sessionLogic';
import { ShieldAlert, Zap, Clock, Info, Target } from 'lucide-react';

interface KillzonePanelProps {
  killzones: KillzoneInfo[];
  onSelectKillzone?: (kzId: string) => void;
  selectedKillzoneId?: string | null;
}

export const KillzonePanel: React.FC<KillzonePanelProps> = ({
  killzones,
  onSelectKillzone,
  selectedKillzoneId,
}) => {
  return (
    <div className="w-full space-y-3" id="killzones-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            ICT Killzones (Внутренние окна максимальной ликвидности)
          </h2>
        </div>
        <span className="text-xs text-purple-400/90 font-mono">
          Все тайминги рассчитаны от America/New_York (EST/EDT)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {killzones.map((kz) => {
          const isSelected = selectedKillzoneId === kz.id;
          const isActive = kz.isActive;

          return (
            <div
              key={kz.id}
              id={`kz-card-${kz.id}`}
              onClick={() => onSelectKillzone?.(kz.id)}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 cursor-pointer backdrop-blur-md ${
                isActive
                  ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_4px_25px_rgba(168,85,247,0.25)]'
                  : 'bg-slate-950/50 border-slate-800/60 opacity-85 hover:opacity-100 hover:border-slate-700'
              } ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-[#0d1117] ring-purple-400 scale-[1.01]'
                  : ''
              }`}
            >
              {/* Top dashed accent stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-all"
                style={{
                  backgroundColor: kz.color,
                  opacity: isActive ? 1 : 0.4,
                  boxShadow: isActive ? `0 0 12px ${kz.color}` : 'none',
                }}
              />

              {/* Header: Title and Active Status */}
              <div className="flex items-start justify-between gap-2 mt-1">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-purple-300/80 font-semibold">
                    <Target className="w-3.5 h-3.5 text-purple-400" />
                    <span>ICT Smart Money</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                    {kz.name}
                  </h3>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-200 border-purple-400/50 shadow-[0_0_12px_rgba(192,132,252,0.3)]'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-purple-300 animate-ping' : 'bg-slate-500'
                    }`}
                  />
                  <span>{isActive ? 'KILLZONE' : 'ОЖИДАНИЕ'}</span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-2 text-xs text-slate-300/90 leading-relaxed bg-black/30 p-2 rounded-md border border-white/5 line-clamp-2">
                {kz.description}
              </p>

              {/* Timing (NY + UTC) */}
              <div className="mt-3 space-y-1 text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">NY Время:</span>
                  <span className="text-amber-300 font-semibold">
                    {kz.nyStartTime} – {kz.nyEndTime} NY
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UTC Время:</span>
                  <span className="text-slate-200">
                    {kz.startUtc} – {kz.endUtc} UTC
                  </span>
                </div>
              </div>

              {/* Countdown Timer */}
              <div
                className={`mt-3 p-2.5 rounded-lg border flex items-center justify-between ${
                  isActive
                    ? 'bg-purple-900/30 border-purple-500/40'
                    : 'bg-black/30 border-slate-800/50'
                }`}
              >
                <span className="text-xs text-slate-400 font-medium">
                  {isActive ? 'Завершение через:' : 'Старт через:'}
                </span>
                <span
                  className={`font-mono text-sm font-bold ${
                    isActive ? 'text-purple-300' : 'text-slate-300'
                  }`}
                >
                  {formatDuration(kz.timeRemainingSeconds)}
                </span>
              </div>

              {/* Progress Bar when Active */}
              {isActive && (
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-purple-300/90 mb-1">
                    <span>Активная фаза Killzone</span>
                    <span className="font-mono">{Math.round(kz.progressPercent)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${kz.progressPercent}%`,
                        backgroundColor: kz.color,
                        boxShadow: `0 0 10px ${kz.color}`,
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
