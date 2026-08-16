import React, { useEffect, useState, useMemo, useRef } from 'react';
import { geoEquirectangular, geoPath, geoGraticule } from 'd3-geo';
import * as topojson from 'topojson-client';
import { MarketState, ActiveLayer, SessionInfo, KillzoneInfo } from '../types';
import {
  Layers,
  Sun,
  Moon,
  Sparkles,
  MapPin,
  Clock,
  Zap,
  Info,
  Maximize2,
  Minimize2,
  Flame,
} from 'lucide-react';

interface WorldMapProps {
  marketState: MarketState;
  activeLayer: ActiveLayer;
  setActiveLayer: (layer: ActiveLayer) => void;
  selectedSessionId?: string | null;
  selectedKillzoneId?: string | null;
  onSelectSession?: (id: string | null) => void;
  onSelectKillzone?: (id: string | null) => void;
}

// Fallback basic world countries geo feature if CDN is unavailable or loading
const WORLD_TOPOLOGY_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export const WorldMap: React.FC<WorldMapProps> = ({
  marketState,
  activeLayer,
  setActiveLayer,
  selectedSessionId,
  selectedKillzoneId,
  onSelectSession,
  onSelectKillzone,
}) => {
  const [worldData, setWorldData] = useState<any | null>(null);
  const [showDayNight, setShowDayNight] = useState<boolean>(true);
  const [showCityLabels, setShowCityLabels] = useState<boolean>(true);
  const [hoveredItem, setHoveredItem] = useState<{
    type: 'session' | 'killzone' | 'city';
    item: SessionInfo | KillzoneInfo | any;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 960,
    height: 480,
  });

  // Observe container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          // Keep 2:1 aspect ratio for equirectangular map
          setDimensions({
            width: w,
            height: Math.max(340, Math.min(580, w / 2)),
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch TopoJSON
  useEffect(() => {
    let isMounted = true;
    fetch(WORLD_TOPOLOGY_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((topology) => {
        if (isMounted && topology.objects?.countries) {
          const countriesGeo = topojson.feature(topology, topology.objects.countries);
          setWorldData(countriesGeo);
        }
      })
      .catch((err) => {
        console.warn('Using default world render fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Set up D3 Equirectangular Projection
  const { projection, pathGenerator, graticulePath } = useMemo(() => {
    const proj = geoEquirectangular()
      .scale((dimensions.width / (2 * Math.PI)))
      .translate([dimensions.width / 2, dimensions.height / 2]);

    const pathGen = geoPath().projection(proj);
    const grat = geoGraticule().step([30, 30]);
    const gratPath = pathGen(grat()) || '';

    return { projection: proj, pathGenerator: pathGen, graticulePath: gratPath };
  }, [dimensions]);

  // Convert longitude to X coordinate in SVG
  const lngToX = (lng: number) => {
    const coords = projection([lng, 0]);
    return coords ? coords[0] : 0;
  };

  // Convert lat/lng to [x, y]
  const geoToXY = (lng: number, lat: number) => {
    return projection([lng, lat]) || [0, 0];
  };

  // Calculate Sun Sub-Solar Point for Day/Night Terminator
  const subSolarLng = useMemo(() => {
    const now = marketState.currentDate;
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
    // Subsolar point longitude in degrees (-180 to +180)
    // At 12:00 UTC, sun is at 0° longitude
    return -((utcHours - 12) * 15);
  }, [marketState.currentDate]);

  const { sessions, killzones } = marketState;

  return (
    <div
      ref={containerRef}
      id="world-map-container"
      className="relative w-full rounded-2xl border border-slate-800 bg-[#0d1117] shadow-[0_8px_30px_rgb(0,0,0,0.6)] overflow-hidden"
    >
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Layer Switcher (Sessions / Killzones / Both) */}
        <div className="pointer-events-auto flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
          <button
            id="layer-btn-sessions"
            onClick={() => setActiveLayer('sessions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLayer === 'sessions'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Сессии (Sessions)
          </button>

          <button
            id="layer-btn-killzones"
            onClick={() => setActiveLayer('killzones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLayer === 'killzones'
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            ICT Killzones
          </button>

          <button
            id="layer-btn-both"
            onClick={() => setActiveLayer('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLayer === 'both'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Оба слоя (Both)
          </button>
        </div>

        {/* Display Controls (Day/Night, Cities) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setShowDayNight((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition-all flex items-center gap-1.5 ${
              showDayNight
                ? 'bg-slate-800/90 text-amber-300 border-slate-700'
                : 'bg-slate-950/70 text-slate-400 border-slate-800'
            }`}
            title="Переключить отображение зоны дня и ночи (Day/Night Solar Terminator)"
          >
            {showDayNight ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">День/Ночь</span>
          </button>

          <button
            onClick={() => setShowCityLabels((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-md transition-all flex items-center gap-1.5 ${
              showCityLabels
                ? 'bg-slate-800/90 text-blue-300 border-slate-700'
                : 'bg-slate-950/70 text-slate-400 border-slate-800'
            }`}
            title="Показать/скрыть маркеры городов"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Города</span>
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <svg
        id="world-map-svg"
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-auto block select-none"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <defs>
          {/* Radial glow filter for active markers */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients for Sessions */}
          {sessions.map((s) => (
            <linearGradient key={`grad-${s.id}`} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={s.isOpen ? 0.35 : 0.12} />
              <stop offset="50%" stopColor={s.color} stopOpacity={s.isOpen ? 0.28 : 0.08} />
              <stop offset="100%" stopColor={s.color} stopOpacity={s.isOpen ? 0.35 : 0.12} />
            </linearGradient>
          ))}

          {/* Gradients for Killzones */}
          {killzones.map((kz) => (
            <linearGradient key={`grad-kz-${kz.id}`} id={`grad-kz-${kz.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={kz.color} stopOpacity={kz.isActive ? 0.65 : 0.2} />
              <stop offset="50%" stopColor={kz.color} stopOpacity={kz.isActive ? 0.45 : 0.12} />
              <stop offset="100%" stopColor={kz.color} stopOpacity={kz.isActive ? 0.65 : 0.2} />
            </linearGradient>
          ))}

          {/* Day / Night Gradient */}
          <radialGradient id="day-light" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Ocean Background */}
        <rect width={dimensions.width} height={dimensions.height} fill="#0d1117" />

        {/* Graticule Grid Lines */}
        <path d={graticulePath} fill="none" stroke="#1e293b" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.6" />

        {/* Day/Night Shadow Band if enabled */}
        {showDayNight && (
          <g className="day-night-layer pointer-events-none transition-opacity duration-700">
            {/* Sun indicator line at top */}
            <line
              x1={lngToX(subSolarLng)}
              y1={0}
              x2={lngToX(subSolarLng)}
              y2={dimensions.height}
              stroke="#eab308"
              strokeWidth="0.8"
              strokeDasharray="2 4"
              opacity="0.3"
            />
            {/* Night hemisphere shading (180 deg away from subsolar point) */}
            {(() => {
              const nightCenterLng = subSolarLng > 0 ? subSolarLng - 180 : subSolarLng + 180;
              const xStart = lngToX(nightCenterLng - 90);
              const xEnd = lngToX(nightCenterLng + 90);
              
              if (xEnd > xStart) {
                return (
                  <rect
                    x={xStart}
                    y={0}
                    width={xEnd - xStart}
                    height={dimensions.height}
                    fill="#020617"
                    opacity="0.32"
                  />
                );
              } else {
                return (
                  <>
                    <rect x={0} y={0} width={xEnd} height={dimensions.height} fill="#020617" opacity="0.32" />
                    <rect x={xStart} y={0} width={dimensions.width - xStart} height={dimensions.height} fill="#020617" opacity="0.32" />
                  </>
                );
              }
            })()}
          </g>
        )}

        {/* World Landmass / Countries */}
        {worldData ? (
          <g className="countries-layer pointer-events-none">
            {worldData.features.map((feature: any, idx: number) => (
              <path
                key={idx}
                d={pathGenerator(feature) || ''}
                fill="#161f2e"
                stroke="#334155"
                strokeWidth="0.6"
                strokeOpacity="0.8"
                className="transition-colors duration-300"
              />
            ))}
          </g>
        ) : (
          /* Fallback subtle world grid */
          <g className="world-fallback pointer-events-none">
            <rect x="0" y="0" width={dimensions.width} height={dimensions.height} fill="#0d1117" />
          </g>
        )}

        {/* ========================================================= */}
        {/* LAYER 1: MAJOR TRADING SESSIONS (Vertical Longitudinal Bands) */}
        {/* ========================================================= */}
        {(activeLayer === 'sessions' || activeLayer === 'both') && (
          <g className="sessions-layer" style={{ mixBlendMode: 'screen' }}>
            {sessions.map((session) => {
              const x1 = lngToX(session.longitudeMin);
              const x2 = lngToX(session.longitudeMax);
              const width = Math.abs(x2 - x1);
              const isSelected = selectedSessionId === session.id;

              return (
                <g
                  key={`session-band-${session.id}`}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => onSelectSession?.(session.id)}
                  onMouseEnter={(e) =>
                    setHoveredItem({
                      type: 'session',
                      item: session,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Main Session Vertical Band */}
                  <rect
                    x={Math.min(x1, x2)}
                    y={0}
                    width={width}
                    height={dimensions.height}
                    fill={`url(#grad-${session.id})`}
                    stroke={session.isOpen ? session.color : 'transparent'}
                    strokeWidth={session.isOpen ? 1.5 : 0.5}
                    strokeDasharray={session.isOpen ? 'none' : '4 4'}
                    opacity={session.isOpen ? 0.95 : 0.45}
                    className="transition-all duration-500"
                  />

                  {/* Highlight Header Banner at top of band */}
                  <rect
                    x={Math.min(x1, x2)}
                    y={0}
                    width={width}
                    height={22}
                    fill={session.color}
                    opacity={session.isOpen ? 0.3 : 0.12}
                  />

                  <text
                    x={Math.min(x1, x2) + width / 2}
                    y={15}
                    textAnchor="middle"
                    fill={session.isOpen ? '#ffffff' : '#94a3b8'}
                    fontSize="11"
                    fontWeight={session.isOpen ? 'bold' : 'normal'}
                    className="select-none tracking-wider"
                  >
                    {session.name.toUpperCase()} {session.isOpen ? '●' : ''}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ========================================================= */}
        {/* LAYER 2: ICT KILLZONES (Narrower, Bright Inset Bands)     */}
        {/* ========================================================= */}
        {(activeLayer === 'killzones' || activeLayer === 'both') && (
          <g className="killzones-layer">
            {killzones.map((kz) => {
              const x1 = lngToX(kz.longitudeMin);
              const x2 = lngToX(kz.longitudeMax);
              const width = Math.abs(x2 - x1);
              const isSelected = selectedKillzoneId === kz.id;

              return (
                <g
                  key={`kz-band-${kz.id}`}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => onSelectKillzone?.(kz.id)}
                  onMouseEnter={(e) =>
                    setHoveredItem({
                      type: 'killzone',
                      item: kz,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Killzone Inset Band ("Zone in Zone") */}
                  <rect
                    x={Math.min(x1, x2)}
                    y={0}
                    width={width}
                    height={dimensions.height}
                    fill={`url(#grad-kz-${kz.id})`}
                    stroke={kz.borderColor}
                    strokeWidth={kz.isActive ? 2 : 1}
                    strokeDasharray="4 4"
                    opacity={kz.isActive ? 0.95 : 0.4}
                    className="transition-all duration-500"
                  />

                  {/* Top Badge for Killzone */}
                  <rect
                    x={Math.min(x1, x2)}
                    y={dimensions.height - 24}
                    width={width}
                    height={24}
                    fill="#0f172a"
                    stroke={kz.borderColor}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity={kz.isActive ? 0.95 : 0.6}
                  />

                  <text
                    x={Math.min(x1, x2) + width / 2}
                    y={dimensions.height - 8}
                    textAnchor="middle"
                    fill={kz.isActive ? '#f8fafc' : '#cbd5e1'}
                    fontSize="10"
                    fontWeight="bold"
                    className="select-none font-mono"
                  >
                    ⚡ {kz.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ========================================================= */}
        {/* CITY MARKERS & STATUS PULSES                              */}
        {/* ========================================================= */}
        {showCityLabels && (
          <g className="cities-layer">
            {sessions.map((s) => {
              const [cx, cy] = geoToXY(s.centerLng, s.centerLat);
              const isOpen = s.isOpen;

              return (
                <g
                  key={`city-${s.id}`}
                  className="cursor-pointer group"
                  onClick={() => onSelectSession?.(s.id)}
                  onMouseEnter={(e) =>
                    setHoveredItem({
                      type: 'city',
                      item: s,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Radar Ripple Animation for Active Cities */}
                  {isOpen && (
                    <>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="14"
                        fill="none"
                        stroke={s.color}
                        strokeWidth="1.5"
                        opacity="0.7"
                        className="animate-ping"
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r="8"
                        fill={s.color}
                        opacity="0.3"
                      />
                    </>
                  )}

                  {/* Core City Dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isOpen ? 5 : 3.5}
                    fill={isOpen ? s.color : '#64748b'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter={isOpen ? 'url(#glow)' : 'none'}
                    className="transition-all duration-300"
                  />

                  {/* City Label Box */}
                  <g
                    transform={`translate(${cx + 8}, ${cy - 12})`}
                    className="transition-all duration-200"
                  >
                    <rect
                      x="-2"
                      y="-12"
                      width={s.name.length * 7 + 16}
                      height="18"
                      rx="4"
                      fill="#090d16"
                      fillOpacity="0.85"
                      stroke={isOpen ? s.color : '#334155'}
                      strokeWidth="0.8"
                    />
                    <text
                      x="4"
                      y="1"
                      fill={isOpen ? '#ffffff' : '#94a3b8'}
                      fontSize="10"
                      fontWeight={isOpen ? 'bold' : '500'}
                      className="font-sans select-none"
                    >
                      {s.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Hover Floating Tooltip */}
      {hoveredItem && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3.5 py-2.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs text-white"
          style={{
            left: `${Math.min(
              dimensions.width - 120,
              Math.max(120, lngToX(hoveredItem.item.centerLng || 0))
            )}px`,
            top: `${Math.max(
              70,
              geoToXY(hoveredItem.item.centerLng || 0, hoveredItem.item.centerLat || 0)[1] - 15
            )}px`,
          }}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: hoveredItem.item.color }}
            />
            <span>{hoveredItem.item.name}</span>
            {hoveredItem.item.isOpen !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  hoveredItem.item.isOpen
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hoveredItem.item.isOpen ? 'АКТИВНА' : 'ЗАКРЫТА'}
              </span>
            )}
            {hoveredItem.item.isActive !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  hoveredItem.item.isActive
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hoveredItem.item.isActive ? 'KILLZONE АКТИВНА' : 'ОЖИДАНИЕ'}
              </span>
            )}
          </div>

          {hoveredItem.item.city && (
            <div className="text-slate-300 mt-1 flex justify-between gap-4">
              <span className="text-slate-400">Локальное время:</span>
              <span className="font-mono font-semibold">{hoveredItem.item.localTimeFormatted}</span>
            </div>
          )}

          {hoveredItem.item.startUtc && (
            <div className="text-slate-300 mt-0.5 flex justify-between gap-4">
              <span className="text-slate-400">Окно UTC:</span>
              <span className="font-mono text-amber-300">
                {hoveredItem.item.startUtc} – {hoveredItem.item.endUtc} UTC
              </span>
            </div>
          )}

          {hoveredItem.item.description && (
            <div className="text-[11px] text-purple-200 mt-1.5 pt-1.5 border-t border-slate-800 max-w-[240px]">
              {hoveredItem.item.description}
            </div>
          )}
        </div>
      )}

      {/* Map Footer Legend */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-slate-300 font-medium">Сессии:</span>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession?.(s.id)}
              className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className={s.isOpen ? 'text-white font-bold' : 'text-slate-400'}>
                {s.name} {s.isOpen ? '●' : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-purple-300 font-medium">ICT Killzones:</span>
          {killzones.map((kz) => (
            <div
              key={kz.id}
              onClick={() => onSelectKillzone?.(kz.id)}
              className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm border border-dashed"
                style={{
                  backgroundColor: kz.color,
                  borderColor: kz.borderColor,
                }}
              />
              <span className={kz.isActive ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                {kz.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
