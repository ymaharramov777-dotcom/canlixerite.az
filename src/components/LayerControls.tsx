import {
  Cloud,
  CloudRain,
  Droplets,
  Gauge,
  Layers,
  Navigation,
  Satellite,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import type { BaseMapId, WeatherLayerId } from '../types/weather';

interface LayerControlsProps {
  activeLayer: WeatherLayerId;
  onChangeLayer: (layer: WeatherLayerId) => void;
  showWindFlow: boolean;
  onToggleWindFlow: () => void;
  baseMap: BaseMapId;
  onChangeBaseMap: (map: BaseMapId) => void;
  stormCount: number;
}

const LAYER_OPTIONS: Array<{
  id: WeatherLayerId;
  label: string;
  icon: typeof Wind;
}> = [
  { id: 'wind', label: 'Külək', icon: Wind },
  { id: 'temperature', label: 'Temperatur', icon: Thermometer },
  { id: 'precipitation', label: 'Yağış və Qar', icon: CloudRain },
  { id: 'clouds', label: 'Buludlar', icon: Cloud },
  { id: 'pressure', label: 'Təzyiq', icon: Gauge },
  { id: 'humidity', label: 'Rütubət', icon: Droplets },
  { id: 'storms', label: 'Fırtınalar', icon: Zap },
];

export function LayerControls({
  activeLayer,
  onChangeLayer,
  showWindFlow,
  onToggleWindFlow,
  baseMap,
  onChangeBaseMap,
  stormCount,
}: LayerControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="hidden md:flex flex-col gap-1 rounded-xl border border-slate-800/90 bg-[#0B111E]/90 p-1.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
          <Layers className="h-3.5 w-3.5 text-cyan-400" />
          <span>Hava qatları</span>
        </div>

        {LAYER_OPTIONS.map((layer) => {
          const Icon = layer.icon;
          const active = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => onChangeLayer(layer.id)}
              className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 ${
                    active ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <span>{layer.label}</span>
              </span>
              {layer.id === 'storms' && stormCount > 0 && (
                <span className="font-mono-tabular text-[11px] font-semibold text-amber-400">
                  {stormCount}
                </span>
              )}
            </button>
          );
        })}

        <div className="my-1 border-t border-slate-800/80" />

        <button
          type="button"
          onClick={onToggleWindFlow}
          className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
            showWindFlow || activeLayer === 'wind'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <Navigation className="h-3.5 w-3.5" />
            <span>Külək oxları</span>
          </span>
          <span className="font-mono-tabular text-[10px]">
            {showWindFlow || activeLayer === 'wind' ? 'Açıq' : 'Bağlı'}
          </span>
        </button>
      </div>

      <div className="hidden md:flex flex-col gap-1 rounded-xl border border-slate-800/90 bg-[#0B111E]/90 p-1.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
          <Satellite className="h-3.5 w-3.5 text-cyan-400" />
          <span>Xəritə görünüşü</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              { id: 'dark', label: 'Tünd' },
              { id: 'satellite', label: 'Peyk' },
              { id: 'light', label: 'Açıq' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeBaseMap(item.id)}
              className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                baseMap === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-800/90 bg-[#0B111E]/92 p-1.5 backdrop-blur-md weather-scroll">
        {LAYER_OPTIONS.map((layer) => {
          const Icon = layer.icon;
          const active = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => onChangeLayer(layer.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{layer.label}</span>
            </button>
          );
        })}

        <div className="h-5 w-px shrink-0 bg-slate-800" />

        <button
          type="button"
          onClick={() =>
            onChangeBaseMap(
              baseMap === 'dark'
                ? 'satellite'
                : baseMap === 'satellite'
                  ? 'light'
                  : 'dark'
            )
          }
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/70 whitespace-nowrap"
        >
          <Satellite className="h-3.5 w-3.5 text-cyan-400" />
          <span>
            {baseMap === 'dark'
              ? 'Tünd'
              : baseMap === 'satellite'
                ? 'Peyk'
                : 'Açıq'}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleWindFlow}
          className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
            showWindFlow || activeLayer === 'wind'
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'text-slate-400'
          }`}
        >
          <Navigation className="h-3.5 w-3.5" />
          <span>Oxlar</span>
        </button>
      </div>
    </div>
  );
}
