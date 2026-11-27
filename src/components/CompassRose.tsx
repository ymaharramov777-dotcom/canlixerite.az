import { getDirectionAz } from '../utils/weatherAz';

interface CompassRoseProps {
  windDirection?: number;
  windSpeed?: number;
  locationName?: string;
}

export function CompassRose({
  windDirection,
  windSpeed,
  locationName,
}: CompassRoseProps) {
  const dirInfo =
    typeof windDirection === 'number' ? getDirectionAz(windDirection) : null;

  const blowToAngle =
    typeof windDirection === 'number' ? (windDirection + 180) % 360 : 0;

  return (
    <div
      className="select-none rounded-xl border border-slate-800/90 bg-[#0B111E]/90 p-2.5 backdrop-blur-md"
      aria-label="Kompas və külək istiqaməti"
    >
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="rgba(148, 163, 184, 0.22)"
            strokeWidth="1"
          />
          <circle
            cx="50"
            cy="50"
            r="26"
            fill="none"
            stroke="rgba(148, 163, 184, 0.12)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="14"
              x2="50"
              y2={deg % 90 === 0 ? '20' : '17'}
              stroke={deg === 0 ? '#22d3ee' : 'rgba(148, 163, 184, 0.45)'}
              strokeWidth={deg % 90 === 0 ? '1.5' : '1'}
              transform={`rotate(${deg} 50 50)`}
            />
          ))}

          {typeof windDirection === 'number' && (
            <g transform={`rotate(${blowToAngle} 50 50)`}>
              <line
                x1="50"
                y1="72"
                x2="50"
                y2="24"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <polygon points="50,19 45,29 50,26 55,29" fill="#22d3ee" />
              <circle cx="50" cy="50" r="3" fill="#0B111E" stroke="#22d3ee" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        <span
          title="Şimal (0°)"
          className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wider text-cyan-400"
        >
          Ş
        </span>
        <span
          title="Şərq (90°)"
          className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-300"
        >
          Şq
        </span>
        <span
          title="Cənub (180°)"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-300"
        >
          C
        </span>
        <span
          title="Qərb (270°)"
          className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-300"
        >
          Q
        </span>
      </div>

      {dirInfo && (
        <div className="mt-1.5 border-t border-slate-800/80 pt-1.5 text-center">
          <div className="truncate max-w-[112px] text-[10px] text-slate-400 mx-auto">
            {locationName || 'Külək vektoru'}
          </div>
          <div className="font-mono-tabular text-[11px] font-semibold text-slate-100">
            {dirInfo.short} · {dirInfo.degrees}°
          </div>
          {typeof windSpeed === 'number' && (
            <div className="font-mono-tabular text-[10px] text-cyan-400">
              {Math.round(windSpeed)} km/saat
            </div>
          )}
        </div>
      )}
    </div>
  );
}
