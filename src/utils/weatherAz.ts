export interface DirectionInfo {
  short: string;
  full: string;
  degrees: number;
}

const DIRECTIONS_AZ = [
  { short: 'Ş', full: 'Şimal' },
  { short: 'Ş-Şq', full: 'Şimal-Şərq' },
  { short: 'Şq', full: 'Şərq' },
  { short: 'C-Şq', full: 'Cənub-Şərq' },
  { short: 'C', full: 'Cənub' },
  { short: 'C-Q', full: 'Cənub-Qərb' },
  { short: 'Q', full: 'Qərb' },
  { short: 'Ş-Q', full: 'Şimal-Qərb' },
];

export function getDirectionAz(degrees: number): DirectionInfo {
  const normalized = ((degrees % 360) + 360) % 360;
  const idx = Math.round(normalized / 45) % 8;
  return {
    ...DIRECTIONS_AZ[idx],
    degrees: Math.round(normalized),
  };
}

export interface WindStrengthInfo {
  label: string;
  beaufort: number;
  level: 'calm' | 'moderate' | 'strong' | 'gale' | 'storm';
  colorClass: string;
}

export function getWindStrengthAz(kmh: number): WindStrengthInfo {
  if (kmh < 6) {
    return { label: 'Sakit', beaufort: 1, level: 'calm', colorClass: 'text-slate-300' };
  }
  if (kmh < 20) {
    return { label: 'Zəif külək', beaufort: 3, level: 'calm', colorClass: 'text-cyan-300' };
  }
  if (kmh < 39) {
    return { label: 'Mülayim külək', beaufort: 5, level: 'moderate', colorClass: 'text-emerald-400' };
  }
  if (kmh < 62) {
    return { label: 'Güclü külək', beaufort: 7, level: 'strong', colorClass: 'text-amber-400' };
  }
  if (kmh < 89) {
    return { label: 'Fırtına küləyi', beaufort: 9, level: 'gale', colorClass: 'text-orange-400' };
  }
  return { label: 'Qasırğa / Siklon', beaufort: 11, level: 'storm', colorClass: 'text-rose-400' };
}

export type WeatherVisualType =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'snow'
  | 'sleet'
  | 'thunderstorm';

export function getWeatherInfoAz(code: number): {
  label: string;
  type: WeatherVisualType;
} {
  switch (code) {
    case 0:
      return { label: 'Açıq səma', type: 'clear' };
    case 1:
      return { label: 'Əsasən açıq', type: 'clear' };
    case 2:
      return { label: 'Dəyişkən buludlu', type: 'partly-cloudy' };
    case 3:
      return { label: 'Tutqun buludlu', type: 'cloudy' };
    case 45:
    case 48:
      return { label: 'Dumanlı', type: 'fog' };
    case 51:
    case 53:
    case 55:
      return { label: 'Çiskinli yağış', type: 'drizzle' };
    case 56:
    case 57:
      return { label: 'Buzlu çiskin', type: 'sleet' };
    case 61:
    case 63:
      return { label: 'Yağışlı', type: 'rain' };
    case 65:
      return { label: 'Güclü leysan yağışı', type: 'heavy-rain' };
    case 66:
    case 67:
      return { label: 'Buzlu yağış', type: 'sleet' };
    case 71:
    case 73:
      return { label: 'Qar yağışı', type: 'snow' };
    case 75:
    case 77:
      return { label: 'Güclü qar yağışı', type: 'snow' };
    case 80:
    case 81:
      return { label: 'Qısamüddətli yağış', type: 'rain' };
    case 82:
      return { label: 'Şiddətli leysan', type: 'heavy-rain' };
    case 85:
    case 86:
      return { label: 'Qar fırtınası', type: 'snow' };
    case 95:
      return { label: 'Şimşəkli fırtına', type: 'thunderstorm' };
    case 96:
    case 99:
      return { label: 'Dolu və şimşəkli fırtına', type: 'thunderstorm' };
    default:
      return { label: 'Dəyişkən hava', type: 'partly-cloudy' };
  }
}

const WEEKDAYS_AZ = [
  'Bazar',
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
];

const WEEKDAYS_SHORT_AZ = ['Baz', 'B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən'];

const MONTHS_AZ = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'İyun',
  'İyul',
  'Avqust',
  'Sentyabr',
  'Oktyabr',
  'Noyabr',
  'Dekabr',
];

export function formatWeekdayAz(isoDate: string, index: number): string {
  if (index === 0) return 'Bu gün';
  if (index === 1) return 'Sabah';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return WEEKDAYS_AZ[dt.getUTCDay()] ?? isoDate;
}

export function formatDateShortAz(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number);
  const month = MONTHS_AZ[(m ?? 1) - 1] ?? '';
  return `${d} ${month.slice(0, 3)}`;
}

export function formatDayShortAz(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return WEEKDAYS_SHORT_AZ[dt.getUTCDay()] ?? isoDate;
}

export function formatHourAz(isoDateTime: string): string {
  const parts = isoDateTime.split('T');
  return parts[1]?.slice(0, 5) ?? isoDateTime;
}

export function formatUnixTimeLocal(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function getTempColorRgb(tempC: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [-35, [99, 102, 241]],
    [-15, [59, 130, 246]],
    [0, [34, 211, 238]],
    [12, [16, 185, 129]],
    [22, [250, 204, 21]],
    [32, [249, 115, 22]],
    [45, [225, 29, 72]],
  ];

  if (tempC <= stops[0][0]) return stops[0][1];
  if (tempC >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];

  for (let i = 0; i < stops.length - 1; i++) {
    const [t1, c1] = stops[i];
    const [t2, c2] = stops[i + 1];
    if (tempC >= t1 && tempC <= t2) {
      const ratio = (tempC - t1) / (t2 - t1);
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * ratio),
        Math.round(c1[1] + (c2[1] - c1[1]) * ratio),
        Math.round(c1[2] + (c2[2] - c1[2]) * ratio),
      ];
    }
  }
  return [250, 204, 21];
}

export function getWindColorRgb(kmh: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [56, 189, 248]],
    [20, [34, 211, 238]],
    [40, [52, 211, 153]],
    [60, [250, 204, 21]],
    [85, [249, 115, 22]],
    [120, [244, 63, 94]],
  ];
  if (kmh <= stops[0][0]) return stops[0][1];
  if (kmh >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [v1, c1] = stops[i];
    const [v2, c2] = stops[i + 1];
    if (kmh >= v1 && kmh <= v2) {
      const r = (kmh - v1) / (v2 - v1);
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * r),
        Math.round(c1[1] + (c2[1] - c1[1]) * r),
        Math.round(c1[2] + (c2[2] - c1[2]) * r),
      ];
    }
  }
  return [244, 63, 94];
}

export function getPressureColorRgb(hpa: number): [number, number, number] {
  const stops: Array<[number, [number, number, number]]> = [
    [970, [225, 29, 72]],
    [995, [249, 115, 22]],
    [1013, [34, 211, 238]],
    [1025, [59, 130, 246]],
    [1040, [139, 92, 246]],
  ];
  if (hpa <= stops[0][0]) return stops[0][1];
  if (hpa >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [p1, c1] = stops[i];
    const [p2, c2] = stops[i + 1];
    if (hpa >= p1 && hpa <= p2) {
      const r = (hpa - p1) / (p2 - p1);
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * r),
        Math.round(c1[1] + (c2[1] - c1[1]) * r),
        Math.round(c1[2] + (c2[2] - c1[2]) * r),
      ];
    }
  }
  return [34, 211, 238];
}
