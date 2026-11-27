import type { WeatherLayerId } from '../types/weather';

interface LayerLegendProps {
  activeLayer: WeatherLayerId;
}

export function LayerLegend({ activeLayer }: LayerLegendProps) {
  if (activeLayer === 'storms') {
    return (
      <div className="rounded-xl border border-slate-800/90 bg-[#0B111E]/90 px-3 py-2 text-[11px] text-slate-300 backdrop-blur-md">
        <div className="mb-1 font-semibold text-slate-200">
          Fırtına və Siklon İzlənməsi
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Siklon / Qasırğa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Şimşək / Güclü külək
          </span>
        </div>
      </div>
    );
  }

  let title = '';
  let gradient = '';
  let ticks: string[] = [];

  switch (activeLayer) {
    case 'temperature':
      title = 'Temperatur (°C)';
      gradient =
        'linear-gradient(90deg, #6366f1 0%, #3b82f6 18%, #22d3ee 36%, #10b981 55%, #facc15 72%, #f97316 86%, #e11d48 100%)';
      ticks = ['-35°', '-10°', '0°', '15°', '25°', '40°+'];
      break;
    case 'wind':
      title = 'Külək sürəti (km/saat)';
      gradient =
        'linear-gradient(90deg, #38bdf8 0%, #22d3ee 25%, #34d399 45%, #facc15 65%, #f97316 82%, #f43f5e 100%)';
      ticks = ['0', '20', '40', '60', '85', '120+'];
      break;
    case 'precipitation':
      title = 'Yağış (mavi) və Qar (bənövşəyi-ağ)';
      gradient =
        'linear-gradient(90deg, #06b6d4 0%, #3b82f6 45%, #818cf8 75%, #e0e7ff 100%)';
      ticks = ['Yüngül', 'Orta', 'Güclü', 'Qar / Dolu'];
      break;
    case 'clouds':
      title = 'Bulud örtüyü (%)';
      gradient =
        'linear-gradient(90deg, rgba(148,163,184,0.1) 0%, rgba(203,213,225,0.55) 50%, #f8fafc 100%)';
      ticks = ['0%', '25%', '50%', '75%', '100%'];
      break;
    case 'pressure':
      title = 'Atmosfer təzyiqi (hPa)';
      gradient =
        'linear-gradient(90deg, #e11d48 0%, #f97316 25%, #22d3ee 55%, #3b82f6 80%, #8b5cf6 100%)';
      ticks = ['970 (A)', '995', '1013', '1025', '1040 (Y)'];
      break;
    case 'humidity':
      title = 'Nisbi rütubət (%)';
      gradient =
        'linear-gradient(90deg, #d97706 0%, #10b981 45%, #06b6d4 75%, #0284c7 100%)';
      ticks = ['10%', '35%', '60%', '85%', '100%'];
      break;
  }

  return (
    <div className="w-56 sm:w-64 rounded-xl border border-slate-800/90 bg-[#0B111E]/90 px-3 py-2 backdrop-blur-md">
      <div className="mb-1.5 text-[11px] font-semibold text-slate-200">
        {title}
      </div>
      <div
        className="h-2 w-full rounded-full"
        style={{ background: gradient }}
      />
      <div className="font-mono-tabular mt-1 flex items-center justify-between text-[10px] text-slate-400">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
