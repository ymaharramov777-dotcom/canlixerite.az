import { Pause, Play, Radio } from 'lucide-react';
import type { RainViewerFrame, WeatherLayerId } from '../types/weather';
import { formatUnixTimeLocal } from '../utils/weatherAz';

interface TimelinePlayerProps {
  activeLayer: WeatherLayerId;
  frames: RainViewerFrame[];
  frameIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onChangeIndex: (index: number) => void;
}

export function TimelinePlayer({
  activeLayer,
  frames,
  frameIndex,
  isPlaying,
  onTogglePlay,
  onChangeIndex,
}: TimelinePlayerProps) {
  const showRadarControls =
    (activeLayer === 'precipitation' || activeLayer === 'clouds') &&
    frames.length > 0;

  if (!showRadarControls) {
    return null;
  }

  const currentFrame = frames[frameIndex] ?? frames[frames.length - 1];
  const label =
    activeLayer === 'precipitation'
      ? 'Canlı Radar'
      : 'Peyk Bulud Animasiyası';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800/90 bg-[#0B111E]/92 px-3 py-2 backdrop-blur-md">
      <button
        type="button"
        onClick={onTogglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 transition-colors hover:bg-cyan-500/30"
        aria-label={isPlaying ? 'Dayandır' : 'Oynat'}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 font-medium text-slate-200 whitespace-nowrap">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            {label}
          </span>
          <span className="font-mono-tabular font-semibold text-cyan-300">
            {currentFrame ? formatUnixTimeLocal(currentFrame.time) : '--:--'}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={frameIndex}
          onChange={(e) => onChangeIndex(Number(e.target.value))}
          className="h-1.5 w-36 sm:w-52 cursor-pointer accent-cyan-400"
          aria-label="Radar zaman xətti"
        />
      </div>
    </div>
  );
}
