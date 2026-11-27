import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudRain,
  Compass,
  Droplets,
  Gauge,
  Loader2,
  Navigation,
  Sunrise,
  Sunset,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import type { SelectedLocationWeather, StormEvent } from '../types/weather';
import {
  formatDateShortAz,
  formatHourAz,
  formatWeekdayAz,
  getDirectionAz,
  getWeatherInfoAz,
  getWindStrengthAz,
} from '../utils/weatherAz';
import { WeatherIcon } from './WeatherIcon';

interface ForecastPanelProps {
  weather: SelectedLocationWeather | null;
  isLoading: boolean;
  error: string | null;
  storms: StormEvent[];
  onSelectStorm: (storm: StormEvent) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onCloseMobile?: () => void;
}

type PanelTab = 'hourly' | 'daily' | 'storms';

export function ForecastPanel({
  weather,
  isLoading,
  error,
  storms,
  onSelectStorm,
  isOpen,
  onToggleOpen,
  onCloseMobile,
}: ForecastPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('hourly');
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number | null>(null);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        className="fixed bottom-4 right-4 z-[900] flex items-center gap-2 rounded-xl border border-slate-700/90 bg-[#0B111E]/95 px-4 py-2.5 text-xs font-semibold text-slate-100 shadow-2xl backdrop-blur-md transition-colors hover:border-cyan-500/60"
      >
        {weather ? (
          <>
            <WeatherIcon code={weather.current.weatherCode} className="h-4 w-4" />
            <span>{weather.name}</span>
            <span className="font-mono-tabular text-cyan-300">
              {Math.round(weather.current.temperature)}°C
            </span>
          </>
        ) : (
          <span>Hava Proqnozu</span>
        )}
        <ChevronUp className="h-4 w-4 text-slate-400" />
      </button>
    );
  }

  const renderHourlyChart = (data: SelectedLocationWeather) => {
    const hours = data.hourly;
    if (!hours.length) return null;

    const w = 340;
    const h = 112;
    const padX = 12;
    const padTop = 18;
    const padBottom = 22;
    const innerW = w - padX * 2;
    const innerH = h - padTop - padBottom;

    const temps = hours.map((item) => item.temperature);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const spanT = Math.max(2, maxT - minT);

    const points = hours.map((item, idx) => {
      const x = padX + (idx / Math.max(1, hours.length - 1)) * innerW;
      const y =
        padTop + innerH - ((item.temperature - minT) / spanT) * innerH;
      return { x, y, item, idx };
    });

    const linePath = points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
      h - padBottom
    ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(h - padBottom).toFixed(1)} Z`;

    const activeIdx = hoveredHourIdx ?? 0;
    const activePoint = points[activeIdx];

    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-2.5">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">24 saatlıq temperatur və yağıntı</span>
          {activePoint && (
            <span className="font-mono-tabular font-semibold text-cyan-300">
              {formatHourAz(activePoint.item.time)} ·{' '}
              {activePoint.item.temperature.toFixed(1)}°C ·{' '}
              {activePoint.item.precipitationProbability}% yağış
            </span>
          )}
        </div>

        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-28 w-full select-none overflow-visible"
          onMouseLeave={() => setHoveredHourIdx(null)}
        >
          <defs>
            <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>

          {points.map((p) => {
            const prob = p.item.precipitationProbability;
            const barH = (prob / 100) * (innerH * 0.65);
            return (
              <rect
                key={`bar-${p.idx}`}
                x={p.x - 4}
                y={h - padBottom - barH}
                width={8}
                height={barH}
                rx={1.5}
                fill="rgba(56, 189, 248, 0.25)"
              />
            );
          })}

          <path d={areaPath} fill="url(#tempAreaGrad)" />
          <path
            d={linePath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p) => (
            <g key={`pt-${p.idx}`}>
              {p.idx % 4 === 0 && (
                <text
                  x={p.x}
                  y={h - 5}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px] font-mono-tabular"
                >
                  {formatHourAz(p.item.time)}
                </text>
              )}
              {activeIdx === p.idx && (
                <>
                  <line
                    x1={p.x}
                    y1={padTop - 4}
                    x2={p.x}
                    y2={h - padBottom}
                    stroke="rgba(34, 211, 238, 0.4)"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={3.5}
                    fill="#0B111E"
                    stroke="#22d3ee"
                    strokeWidth="2"
                  />
                </>
              )}
              <rect
                x={p.x - innerW / hours.length / 2}
                y={0}
                width={innerW / hours.length}
                height={h}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredHourIdx(p.idx)}
              />
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <aside
      aria-label="Seçilmiş məkanın hava proqnozu"
      className="fixed inset-x-0 bottom-0 z-[920] flex max-h-[68vh] flex-col rounded-t-2xl border-t border-slate-800 bg-[#0B111E]/96 shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-4 md:right-4 md:top-16 md:max-h-none md:w-[390px] md:rounded-2xl md:border"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/90 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-100">
              {weather ? weather.name : 'Məkan yüklənir...'}
            </h2>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            {weather?.country && <span>{weather.country}</span>}
            {weather?.country && <span aria-hidden="true">·</span>}
            {weather && (
              <span className="font-mono-tabular">
                {weather.lat.toFixed(2)}°, {weather.lon.toFixed(2)}°
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleOpen}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            title="Paneli yığ"
            aria-label="Paneli yığ"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCloseMobile ?? onToggleOpen}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label="Bağla"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="weather-scroll flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
            <p className="mt-2.5 text-xs text-slate-400">
              Real vaxtlı meteoroloji məlumatlar yüklənir...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200">
            {error}
          </div>
        ) : weather ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono-tabular text-4xl font-bold tracking-tight text-white">
                    {Math.round(weather.current.temperature)}
                  </span>
                  <span className="text-lg font-medium text-slate-400">°C</span>
                </div>
                <div className="mt-0.5 text-sm font-medium text-slate-200">
                  {getWeatherInfoAz(weather.current.weatherCode).label}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Hiss olunan:{' '}
                  <span className="font-mono-tabular text-slate-200">
                    {Math.round(weather.current.apparentTemperature)}°C
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <WeatherIcon
                  code={weather.current.weatherCode}
                  className="h-12 w-12"
                />
                <span className="font-mono-tabular mt-1 text-[11px] text-slate-400">
                  Müşahidə: {formatHourAz(weather.observedAt)}
                </span>
              </div>
            </div>

            {(() => {
              const dir = getDirectionAz(weather.current.windDirection);
              const strength = getWindStrengthAz(weather.current.windSpeed);
              const blowToAngle = (weather.current.windDirection + 180) % 360;
              return (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Wind className="h-3.5 w-3.5 text-cyan-400" />
                        Külək sürəti
                      </span>
                      <Navigation
                        className="h-3.5 w-3.5 text-cyan-400"
                        style={{ transform: `rotate(${blowToAngle - 45}deg)` }}
                      />
                    </div>
                    <div className="font-mono-tabular mt-1 text-base font-semibold text-slate-100">
                      {Math.round(weather.current.windSpeed)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        km/saat
                      </span>
                    </div>
                    <div className={`mt-0.5 text-[11px] ${strength.colorClass}`}>
                      {strength.label} (Bofort {strength.beaufort})
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Compass className="h-3.5 w-3.5 text-cyan-400" />
                      İstiqamət və Şiddət
                    </div>
                    <div className="font-mono-tabular mt-1 text-base font-semibold text-slate-100">
                      {dir.full}
                    </div>
                    <div className="font-mono-tabular mt-0.5 text-[11px] text-slate-400">
                      {dir.degrees}° · Şiddət {Math.round(weather.current.windGusts)} km/s
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                      Təzyiq
                    </div>
                    <div className="font-mono-tabular mt-1 text-base font-semibold text-slate-100">
                      {Math.round(weather.current.pressure)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        hPa
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                      Rütubət
                    </div>
                    <div className="font-mono-tabular mt-1 text-base font-semibold text-slate-100">
                      {Math.round(weather.current.humidity)}
                      <span className="text-xs font-normal text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                      Buludluluq
                    </div>
                    <div className="font-mono-tabular mt-1 text-base font-semibold text-slate-100">
                      {Math.round(weather.current.cloudCover)}
                      <span className="text-xs font-normal text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
                      Yağıntı
                    </div>
                    <div className="font-mono-tabular mt-1 text-base font-semibold text-slate-100">
                      {weather.current.precipitation.toFixed(1)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        mm
                      </span>
                    </div>
                    {weather.current.snowfall > 0 && (
                      <div className="font-mono-tabular text-[10px] text-indigo-200">
                        Qar: {weather.current.snowfall.toFixed(1)} sm
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-[#070B12] p-1">
              {(
                [
                  { id: 'hourly', label: '24 Saatlıq' },
                  { id: 'daily', label: '7 Günlük' },
                  { id: 'storms', label: `Fırtınalar (${storms.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'hourly' && (
              <div className="space-y-3">
                {renderHourlyChart(weather)}

                <div className="weather-scroll flex gap-2 overflow-x-auto pb-1">
                  {weather.hourly.map((hour) => {
                    const dir = getDirectionAz(hour.windDirection);
                    const blowTo = (hour.windDirection + 180) % 360;
                    return (
                      <div
                        key={hour.time}
                        className="flex w-16 shrink-0 flex-col items-center rounded-xl border border-slate-800/80 bg-[#070B12]/70 px-2 py-2 text-center"
                      >
                        <span className="font-mono-tabular text-[11px] text-slate-400">
                          {formatHourAz(hour.time)}
                        </span>
                        <WeatherIcon
                          code={hour.weatherCode}
                          className="my-1.5 h-5 w-5"
                        />
                        <span className="font-mono-tabular text-sm font-semibold text-slate-100">
                          {Math.round(hour.temperature)}°
                        </span>
                        <span className="font-mono-tabular mt-0.5 text-[10px] text-cyan-300">
                          {hour.precipitationProbability}%
                        </span>
                        <div className="mt-1 flex items-center gap-0.5 text-[10px] text-slate-400">
                          <Navigation
                            className="h-2.5 w-2.5 text-cyan-400"
                            style={{ transform: `rotate(${blowTo - 45}deg)` }}
                          />
                          <span className="font-mono-tabular">
                            {Math.round(hour.windSpeed)}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500">
                          {dir.short}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'daily' && (() => {
              const minAll = Math.min(...weather.daily.map((d) => d.tempMin));
              const maxAll = Math.max(...weather.daily.map((d) => d.tempMax));
              const span = Math.max(1, maxAll - minAll);

              return (
                <div className="space-y-2">
                  {weather.daily.map((day, idx) => {
                    const leftPct = ((day.tempMin - minAll) / span) * 100;
                    const widthPct = Math.max(
                      8,
                      ((day.tempMax - day.tempMin) / span) * 100
                    );
                    const info = getWeatherInfoAz(day.weatherCode);

                    return (
                      <div
                        key={day.date}
                        className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100">
                              {formatWeekdayAz(day.date, idx)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatDateShortAz(day.date)} · {info.label}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {day.precipitationProbabilityMax > 0 && (
                              <span className="font-mono-tabular text-[11px] text-cyan-300">
                                {day.precipitationProbabilityMax}%
                              </span>
                            )}
                            <WeatherIcon
                              code={day.weatherCode}
                              className="h-5 w-5"
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2.5">
                          <span className="font-mono-tabular w-8 text-xs text-slate-400">
                            {Math.round(day.tempMin)}°
                          </span>
                          <div className="relative h-1.5 flex-1 rounded-full bg-slate-800">
                            <div
                              className="absolute top-0 h-full rounded-full"
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                background:
                                  'linear-gradient(90deg, #38bdf8 0%, #f59e0b 100%)',
                              }}
                            />
                          </div>
                          <span className="font-mono-tabular w-8 text-right text-xs font-semibold text-slate-100">
                            {Math.round(day.tempMax)}°
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono-tabular">
                          <span>
                            Külək: {Math.round(day.windSpeedMax)} km/s (
                            {getDirectionAz(day.windDirectionDominant).short})
                          </span>
                          <span className="flex items-center gap-2">
                            {day.sunrise && (
                              <span className="flex items-center gap-0.5">
                                <Sunrise className="h-3 w-3 text-amber-400" />
                                {formatHourAz(day.sunrise)}
                              </span>
                            )}
                            {day.sunset && (
                              <span className="flex items-center gap-0.5">
                                <Sunset className="h-3 w-3 text-orange-400" />
                                {formatHourAz(day.sunset)}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {activeTab === 'storms' && (
              <div className="space-y-2">
                {storms.length === 0 ? (
                  <div className="rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-4 text-center text-xs text-slate-400">
                    Hazırda qlobal şəbəkədə aktiv güclü siklon və ya fırtına ocağı qeydə alınmayıb.
                  </div>
                ) : (
                  storms.map((storm) => (
                    <button
                      key={storm.id}
                      type="button"
                      onClick={() => onSelectStorm(storm)}
                      className="flex w-full items-start gap-2.5 rounded-xl border border-slate-800/80 bg-[#070B12]/70 p-3 text-left transition-colors hover:border-amber-500/50 hover:bg-slate-900/80"
                    >
                      <Zap
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          storm.category === 'cyclone'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-slate-100">
                          {storm.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {storm.description}
                        </div>
                        <div className="font-mono-tabular mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                          <span>
                            {storm.lat.toFixed(1)}°, {storm.lon.toFixed(1)}°
                          </span>
                          <span>·</span>
                          <span>{storm.source}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
