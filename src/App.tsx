import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ActiveLayer, MarketState } from './types';
import { getMarketState } from './utils/killzoneLogic';
import { WorldMap } from './components/WorldMap';
import { LiquidityBanner } from './components/LiquidityBanner';
import { SessionPanel } from './components/SessionPanel';
import { KillzonePanel } from './components/KillzonePanel';
import { Timeline24h } from './components/Timeline24h';
import {
  Clock,
  Globe,
  Radio,
  Sparkles,
  HelpCircle,
  BarChart3,
  Calendar,
  Activity,
  Flame,
  Zap,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function App() {
  // State for simulated time (null means live real-time)
  const [simulatedUtcHour, setSimulatedUtcHour] = useState<number | null>(null);
  
  // Real-time clock tick
  const [liveDate, setLiveDate] = useState<Date>(new Date());
  
  // Active map layer: 'sessions' | 'killzones' | 'both'
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('both');

  // Selected session/killzone for spotlight
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedKillzoneId, setSelectedKillzoneId] = useState<string | null>(null);

  // Guide accordion toggle
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute effective date (real-time or simulated hour)
  const effectiveDate = useMemo(() => {
    if (simulatedUtcHour === null) {
      return liveDate;
    }
    const d = new Date(liveDate);
    const hours = Math.floor(simulatedUtcHour);
    const minutes = Math.floor((simulatedUtcHour % 1) * 60);
    const seconds = Math.floor((((simulatedUtcHour % 1) * 60) % 1) * 60);
    d.setUTCHours(hours, minutes, seconds, 0);
    return d;
  }, [liveDate, simulatedUtcHour]);

  // Compute full market state
  const marketState = useMemo<MarketState>(() => {
    return getMarketState(effectiveDate);
  }, [effectiveDate]);

  // Compute float UTC hour for timeline
  const currentUtcHourFloat = useMemo(() => {
    return (
      effectiveDate.getUTCHours() +
      effectiveDate.getUTCMinutes() / 60 +
      effectiveDate.getUTCSeconds() / 3600
    );
  }, [effectiveDate]);

  // Handle timeline seek
  const handleSeekUtcHour = useCallback((hour: number | null) => {
    setSimulatedUtcHour(hour);
  }, []);

  // User browser timezone
  const browserTimezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Локальное';
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 antialiased selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ========================================================= */}
        {/* APP HEADER & GLOBAL CLOCKS                                */}
        {/* ========================================================= */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Crypto/Forex Session & Killzone Map
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
                    LIVE MYFXBOOK STYLE
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Мониторинг торговых сессий и окон высокой ликвидности BTC/Crypto в реальном времени
                </p>
              </div>
            </div>
          </div>

          {/* Clocks Bar: UTC + Local Browser + New York */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
            {/* UTC Clock */}
            <div className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/70 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <Globe className="w-3 h-3 text-blue-400" />
                UTC (Мировое)
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-white tracking-wider mt-0.5">
                {marketState.utcTimeFormatted}
              </div>
            </div>

            {/* Browser Local Clock */}
            <div className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/70 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <Clock className="w-3 h-3 text-emerald-400" />
                Ваше время
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-emerald-300 tracking-wider mt-0.5">
                {marketState.localTimeFormatted}
              </div>
            </div>

            {/* New York Clock (ICT Anchor) */}
            <div className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900/90 border border-purple-900/50 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-purple-300">
                <Shield className="w-3 h-3 text-purple-400" />
                New York (EST/EDT)
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-purple-200 tracking-wider mt-0.5">
                {marketState.nyTimeFormatted}
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* TOP LIQUIDITY BANNER (BTC Status & Overlap Alert)         */}
        {/* ========================================================= */}
        <LiquidityBanner marketState={marketState} />

        {/* ========================================================= */}
        {/* MAIN INTERACTIVE WORLD MAP                                */}
        {/* ========================================================= */}
        <section className="space-y-2">
          <WorldMap
            marketState={marketState}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            selectedSessionId={selectedSessionId}
            selectedKillzoneId={selectedKillzoneId}
            onSelectSession={(id) => setSelectedSessionId(id === selectedSessionId ? null : id)}
            onSelectKillzone={(id) => setSelectedKillzoneId(id === selectedKillzoneId ? null : id)}
          />
        </section>

        {/* ========================================================= */}
        {/* 24-HOUR TIMELINE BAR & SCRUBBER                           */}
        {/* ========================================================= */}
        <section>
          <Timeline24h
            marketState={marketState}
            activeLayer={activeLayer}
            currentUtcHourFloat={currentUtcHourFloat}
            onSeekUtcHour={handleSeekUtcHour}
            isSimulated={simulatedUtcHour !== null}
          />
        </section>

        {/* ========================================================= */}
        {/* SESSIONS & KILLZONES PANELS (Below Map)                    */}
        {/* ========================================================= */}
        <div className="space-y-6 pt-2">
          {/* Layer 1: Sessions Panel */}
          {(activeLayer === 'sessions' || activeLayer === 'both') && (
            <SessionPanel
              sessions={marketState.sessions}
              selectedSessionId={selectedSessionId}
              onSelectSession={(id) => setSelectedSessionId(id === selectedSessionId ? null : id)}
            />
          )}

          {/* Layer 2: ICT Killzones Panel */}
          {(activeLayer === 'killzones' || activeLayer === 'both') && (
            <KillzonePanel
              killzones={marketState.killzones}
              selectedKillzoneId={selectedKillzoneId}
              onSelectKillzone={(id) => setSelectedKillzoneId(id === selectedKillzoneId ? null : id)}
            />
          )}
        </div>

        {/* ========================================================= */}
        {/* EDUCATIONAL GUIDE & ICT SMART MONEY REFERENCE             */}
        {/* ========================================================= */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md overflow-hidden">
          <button
            onClick={() => setShowGuide((prev) => !prev)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-white">
                Как использовать карту для торговли BTC и Крипторынком?
              </span>
            </div>
            {showGuide ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showGuide && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1.5">
                  <Flame className="w-4 h-4" />
                  London + NY Пересечение
                </div>
                <p>
                  12:00 – 16:00 UTC (08:00 – 12:00 NY) — период максимального объёма и волатильности в BTC. В эти часы работают одновременно европейские и американские институциональные фонды.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1.5">
                  <Zap className="w-4 h-4" />
                  ICT Killzones (Smart Money)
                </div>
                <p>
                  Узкие окна 2–3 часа, в которые алгоритмы маркетмейкеров (IPDA) снимают ликвидность (свипы High/Low) и задают направление дня. Все Killzones строго привязаны к времени <strong>America/New_York</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1.5">
                  <BarChart3 className="w-4 h-4" />
                  Крипта 24/7 vs Сессии
                </div>
                <p>
                  Биткоин торгуется непрерывно, но реальные сильные движения происходят в ритме традиционных мировых бирж. Вне сессий (Low Liquidity) часты ложные пробои и низколиквидный боковик.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pt-4 pb-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Crypto/Forex Session & Killzone Map • Myfxbook Style</span>
          <span className="font-mono text-slate-400">
            Точный математический расчёт IANA Timezones + DST (EST/EDT, BST, AEDT)
          </span>
        </footer>
      </div>
    </div>
  );
}
