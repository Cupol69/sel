import React from 'react';
import { MarketState } from '../types';
import { Flame, Zap, Moon, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

interface LiquidityBannerProps {
  marketState: MarketState;
}

export const LiquidityBanner: React.FC<LiquidityBannerProps> = ({ marketState }) => {
  const { liquidityLevel, liquidityReason, activeSessions, activeKillzones, isLondonNyOverlap } = marketState;

  const getBadgeStyle = () => {
    switch (liquidityLevel) {
      case 'high':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          glow: 'shadow-[0_0_25px_rgba(244,63,94,0.25)]',
          icon: <Flame className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />,
          title: 'ВЫСОКАЯ ЛИКВИДНОСТЬ BTC & FOREX',
          accent: 'border-rose-500',
          dot: 'bg-rose-400 animate-ping',
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.18)]',
          icon: <Zap className="w-5 h-5 text-amber-400 shrink-0" />,
          title: 'СРЕДНЯЯ ЛИКВИДНОСТЬ BTC & FOREX',
          accent: 'border-amber-500',
          dot: 'bg-amber-400',
        };
      case 'low':
      default:
        return {
          bg: 'bg-blue-950/40 border-blue-800/40 text-blue-300',
          glow: 'shadow-[0_0_15px_rgba(59,130,246,0.08)]',
          icon: <Moon className="w-5 h-5 text-blue-400 shrink-0" />,
          title: 'НИЗКАЯ ЛИКВИДНОСТЬ (МЕЖСЕССИОННЫЙ ПЕРИОД)',
          accent: 'border-blue-700',
          dot: 'bg-blue-400 opacity-60',
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div
      id="liquidity-banner"
      className={`w-full rounded-xl border px-4 py-3.5 transition-all duration-500 backdrop-blur-md ${style.bg} ${style.glow} flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center p-2 rounded-lg bg-black/40 border border-white/10">
          {style.icon}
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${style.dot}`} />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white">
              {style.title}
            </span>
            {isLondonNyOverlap && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                London + NY Overlap (Golden Hours)
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-200 mt-1 flex items-center gap-1.5">
            <span>{liquidityReason}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-300 self-end md:self-center shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Активные сессии:</span>
          <span className="font-semibold text-white">
            {activeSessions.length > 0
              ? activeSessions.map((s) => s.name).join(', ')
              : 'Нет'}
          </span>
        </div>

        {activeKillzones.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Killzone:</span>
            <span className="font-semibold text-purple-300">
              {activeKillzones.map((k) => k.name).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
