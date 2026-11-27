import type {
  GeocodingResult,
  GridPointWeather,
  HourlyForecastItem,
  RainViewerData,
  SelectedLocationWeather,
  StormEvent,
} from '../types/weather';

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';
const NASA_EONET_STORMS =
  'https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms&status=open&limit=25';

export const GLOBAL_LAT_BANDS = [-55, -35, -15, 5, 25, 45, 65] as const;
export const GLOBAL_LON_BANDS = [
  -165, -135, -105, -75, -45, -15, 15, 45, 75, 105, 135, 165,
] as const;

export interface MajorCitySeed {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export const MAJOR_WORLD_CITIES: MajorCitySeed[] = [
  { id: 'baku', name: 'Bakı', country: 'Azərbaycan', lat: 40.4093, lon: 49.8671 },
  { id: 'ganja', name: 'Gəncə', country: 'Azərbaycan', lat: 40.6828, lon: 46.3606 },
  { id: 'istanbul', name: 'İstanbul', country: 'Türkiyə', lat: 41.0082, lon: 28.9784 },
  { id: 'london', name: 'London', country: 'Böyük Britaniya', lat: 51.5074, lon: -0.1278 },
  { id: 'paris', name: 'Paris', country: 'Fransa', lat: 48.8566, lon: 2.3522 },
  { id: 'berlin', name: 'Berlin', country: 'Almaniya', lat: 52.52, lon: 13.405 },
  { id: 'madrid', name: 'Madrid', country: 'İspaniya', lat: 40.4168, lon: -3.7038 },
  { id: 'moscow', name: 'Moskva', country: 'Rusiya', lat: 55.7558, lon: 37.6173 },
  { id: 'reykjavik', name: 'Reykyavik', country: 'İslandiya', lat: 64.1466, lon: -21.9426 },
  { id: 'cairo', name: 'Qahirə', country: 'Misir', lat: 30.0444, lon: 31.2357 },
  { id: 'dubai', name: 'Dubay', country: 'BƏƏ', lat: 25.2048, lon: 55.2708 },
  { id: 'riyadh', name: 'Ər-Riyad', country: 'Səudiyyə Ərəbistanı', lat: 24.7136, lon: 46.6753 },
  { id: 'delhi', name: 'Yeni Dehli', country: 'Hindistan', lat: 28.6139, lon: 77.209 },
  { id: 'beijing', name: 'Pekin', country: 'Çin', lat: 39.9042, lon: 116.4074 },
  { id: 'tokyo', name: 'Tokio', country: 'Yaponiya', lat: 35.6762, lon: 139.6503 },
  { id: 'singapore', name: 'Sinqapur', country: 'Sinqapur', lat: 1.3521, lon: 103.8198 },
  { id: 'sydney', name: 'Sidney', country: 'Avstraliya', lat: -33.8688, lon: 151.2093 },
  { id: 'capetown', name: 'Keyptaun', country: 'CAR', lat: -33.9249, lon: 18.4241 },
  { id: 'newyork', name: 'Nyu-York', country: 'ABŞ', lat: 40.7128, lon: -74.006 },
  { id: 'chicago', name: 'Çikaqo', country: 'ABŞ', lat: 41.8781, lon: -87.6298 },
  { id: 'losangeles', name: 'Los-Anceles', country: 'ABŞ', lat: 34.0522, lon: -118.2437 },
  { id: 'mexico', name: 'Mexiko', country: 'Meksika', lat: 19.4326, lon: -99.1332 },
  { id: 'rio', name: 'Rio-de-Janeyro', country: 'Braziliya', lat: -22.9068, lon: -43.1729 },
  { id: 'buenosaires', name: 'Buenos-Ayres', country: 'Argentina', lat: -34.6037, lon: -58.3816 },
];

interface RawCurrentResponse {
  latitude: number;
  longitude: number;
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
}

interface PointRequestMeta {
  id: string;
  lat: number;
  lon: number;
  name?: string;
  country?: string;
  isMajorCity?: boolean;
}

async function fetchBatchCurrentWeather(
  points: PointRequestMeta[]
): Promise<GridPointWeather[]> {
  const lats = points.map((p) => p.lat.toFixed(4)).join(',');
  const lons = points.map((p) => p.lon.toFixed(4)).join(',');
  const params = new URLSearchParams({
    latitude: lats,
    longitude: lons,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    wind_speed_unit: 'kmh',
    timezone: 'UTC',
  });

  const res = await fetch(`${OPEN_METEO_FORECAST}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Open-Meteo xətası: ${res.status}`);
  }
  const raw = await res.json();
  const list: RawCurrentResponse[] = Array.isArray(raw) ? raw : [raw];

  return list.map((item, idx) => {
    const meta = points[idx];
    const c = item.current;
    return {
      id: meta.id,
      name: meta.name,
      country: meta.country,
      isMajorCity: meta.isMajorCity,
      lat: meta.lat,
      lon: meta.lon,
      temperature: c?.temperature_2m ?? 0,
      apparentTemperature: c?.apparent_temperature ?? 0,
      humidity: c?.relative_humidity_2m ?? 50,
      precipitation: c?.precipitation ?? 0,
      rain: c?.rain ?? 0,
      snowfall: c?.snowfall ?? 0,
      weatherCode: c?.weather_code ?? 0,
      cloudCover: c?.cloud_cover ?? 0,
      pressure: c?.pressure_msl ?? 1013,
      windSpeed: c?.wind_speed_10m ?? 0,
      windDirection: c?.wind_direction_10m ?? 0,
      windGusts: c?.wind_gusts_10m ?? 0,
    };
  });
}

export async function fetchGlobalWeatherGrid(): Promise<{
  gridMatrix: GridPointWeather[][];
  allPoints: GridPointWeather[];
  cities: GridPointWeather[];
}> {
  const gridMeta: PointRequestMeta[] = [];
  for (let r = 0; r < GLOBAL_LAT_BANDS.length; r++) {
    for (let c = 0; c < GLOBAL_LON_BANDS.length; c++) {
      const lat = GLOBAL_LAT_BANDS[r];
      const lon = GLOBAL_LON_BANDS[c];
      gridMeta.push({
        id: `grid_${r}_${c}`,
        lat,
        lon,
      });
    }
  }

  const cityMeta: PointRequestMeta[] = MAJOR_WORLD_CITIES.map((city) => ({
    ...city,
    isMajorCity: true,
  }));

  const combined = [...gridMeta, ...cityMeta];
  const chunkSize = 36;
  const chunks: PointRequestMeta[][] = [];
  for (let i = 0; i < combined.length; i += chunkSize) {
    chunks.push(combined.slice(i, i + chunkSize));
  }

  const chunkResults = await Promise.all(chunks.map(fetchBatchCurrentWeather));
  const allPoints = chunkResults.flat();

  const rows = GLOBAL_LAT_BANDS.length;
  const cols = GLOBAL_LON_BANDS.length;
  const gridMatrix: GridPointWeather[][] = [];
  for (let r = 0; r < rows; r++) {
    gridMatrix.push(allPoints.slice(r * cols, (r + 1) * cols));
  }

  const cities = allPoints.slice(rows * cols);
  return { gridMatrix, allPoints, cities };
}

export async function fetchLocationWeather(
  lat: number,
  lon: number,
  knownName?: string,
  knownCountry?: string
): Promise<SelectedLocationWeather> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'rain',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
      'sunrise',
      'sunset',
    ].join(','),
    wind_speed_unit: 'kmh',
    timezone: 'auto',
    forecast_days: '7',
  });

  const [weatherRes, geoInfo] = await Promise.all([
    fetch(`${OPEN_METEO_FORECAST}?${params.toString()}`),
    knownName
      ? Promise.resolve({ name: knownName, country: knownCountry })
      : reverseGeocodeLocation(lat, lon),
  ]);

  if (!weatherRes.ok) {
    throw new Error(`Hava məlumatı alınmadı (${weatherRes.status})`);
  }

  const data = await weatherRes.json();
  const c = data.current;
  const h = data.hourly;
  const d = data.daily;

  const currentIso: string = c?.time ?? new Date().toISOString();
  const currentPrefix = currentIso.slice(0, 13);
  let startHourIdx = (h?.time as string[] | undefined)?.findIndex((t) =>
    t.startsWith(currentPrefix)
  ) ?? 0;
  if (startHourIdx < 0) startHourIdx = 0;

  const hourly: HourlyForecastItem[] = [];
  const totalHours = h?.time?.length ?? 0;
  for (let i = startHourIdx; i < Math.min(startHourIdx + 24, totalHours); i++) {
    hourly.push({
      time: h.time[i],
      temperature: h.temperature_2m[i],
      apparentTemperature: h.apparent_temperature[i],
      precipitationProbability: h.precipitation_probability?.[i] ?? 0,
      precipitation: h.precipitation?.[i] ?? 0,
      rain: h.rain?.[i] ?? 0,
      snowfall: h.snowfall?.[i] ?? 0,
      weatherCode: h.weather_code[i],
      cloudCover: h.cloud_cover[i],
      pressure: h.pressure_msl[i],
      humidity: h.relative_humidity_2m[i],
      windSpeed: h.wind_speed_10m[i],
      windDirection: h.wind_direction_10m[i],
      windGusts: h.wind_gusts_10m?.[i] ?? h.wind_speed_10m[i],
    });
  }

  const daily = (d?.time ?? []).slice(0, 7).map((dateStr: string, idx: number) => ({
    date: dateStr,
    weatherCode: d.weather_code[idx],
    tempMax: d.temperature_2m_max[idx],
    tempMin: d.temperature_2m_min[idx],
    precipitationSum: d.precipitation_sum?.[idx] ?? 0,
    precipitationProbabilityMax: d.precipitation_probability_max?.[idx] ?? 0,
    windSpeedMax: d.wind_speed_10m_max[idx],
    windGustsMax: d.wind_gusts_10m_max?.[idx] ?? d.wind_speed_10m_max[idx],
    windDirectionDominant: d.wind_direction_10m_dominant?.[idx] ?? 0,
    sunrise: d.sunrise?.[idx] ?? '',
    sunset: d.sunset?.[idx] ?? '',
  }));

  return {
    name: geoInfo.name,
    country: geoInfo.country,
    lat: data.latitude ?? lat,
    lon: data.longitude ?? lon,
    timezone: data.timezone ?? 'UTC',
    utcOffsetSeconds: data.utc_offset_seconds ?? 0,
    elevation: data.elevation,
    observedAt: currentIso,
    current: {
      temperature: c.temperature_2m,
      apparentTemperature: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      rain: c.rain,
      snowfall: c.snowfall,
      weatherCode: c.weather_code,
      cloudCover: c.cloud_cover,
      pressure: c.pressure_msl,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      windGusts: c.wind_gusts_10m,
      isDay: c.is_day === 1,
    },
    hourly,
    daily,
  };
}

export async function reverseGeocodeLocation(
  lat: number,
  lon: number
): Promise<{ name: string; country?: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat.toFixed(
        4
      )}&lon=${lon.toFixed(4)}&zoom=10&accept-language=az`
    );
    if (res.ok) {
      const json = await res.json();
      const addr = json.address;
      if (addr) {
        const place =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.state ||
          addr.region ||
          json.name;
        if (place) {
          return {
            name: place,
            country: addr.country,
          };
        }
      }
      if (json.display_name) {
        const parts = String(json.display_name).split(',').map((s) => s.trim());
        return {
          name: parts[0] || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
          country: parts[parts.length - 1],
        };
      }
    }
  } catch {
    // Fallback
  }
  const latLabel = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'Ş' : 'C'}`;
  const lonLabel = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'Şq' : 'Q'}`;
  return { name: `${latLabel}, ${lonLabel}`, country: 'Açıq dəniz / Bölgə' };
}

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const paramsAz = new URLSearchParams({
    name: trimmed,
    count: '8',
    language: 'az',
    format: 'json',
  });

  const resAz = await fetch(`${OPEN_METEO_GEOCODING}?${paramsAz.toString()}`);
  if (resAz.ok) {
    const dataAz = await resAz.json();
    if (Array.isArray(dataAz.results) && dataAz.results.length > 0) {
      return dataAz.results;
    }
  }

  const paramsEn = new URLSearchParams({
    name: trimmed,
    count: '8',
    language: 'en',
    format: 'json',
  });
  const resEn = await fetch(`${OPEN_METEO_GEOCODING}?${paramsEn.toString()}`);
  if (!resEn.ok) return [];
  const dataEn = await resEn.json();
  return Array.isArray(dataEn.results) ? dataEn.results : [];
}

export async function fetchRainViewerMaps(): Promise<RainViewerData | null> {
  try {
    const res = await fetch(RAINVIEWER_API);
    if (!res.ok) return null;
    const data = await res.json();
    const host = data.host || 'https://tilecache.rainviewer.com';
    const radarFrames = [
      ...(data.radar?.past ?? []),
      ...(data.radar?.nowcast ?? []),
    ];
    const satelliteFrames = data.satellite?.infrared ?? [];
    return { host, radarFrames, satelliteFrames };
  } catch {
    return null;
  }
}

interface EonetEvent {
  id: string;
  title: string;
  geometry?: Array<{
    date: string;
    type: string;
    coordinates: [number, number];
  }>;
}

export async function fetchActiveStorms(
  gridPoints: GridPointWeather[]
): Promise<StormEvent[]> {
  const storms: StormEvent[] = [];

  try {
    const res = await fetch(NASA_EONET_STORMS);
    if (res.ok) {
      const json = await res.json();
      const events: EonetEvent[] = json.events ?? [];
      for (const ev of events) {
        const geoms = ev.geometry ?? [];
        if (geoms.length === 0) continue;
        const latest = geoms[geoms.length - 1];
        if (!Array.isArray(latest.coordinates) || latest.coordinates.length < 2) {
          continue;
        }
        const [lon, lat] = latest.coordinates;
        storms.push({
          id: `eonet_${ev.id}`,
          title: ev.title,
          category: 'cyclone',
          source: 'NASA EONET',
          lat,
          lon,
          updatedAt: latest.date,
          track: geoms
            .filter((g) => Array.isArray(g.coordinates))
            .map((g) => ({
              lon: g.coordinates[0],
              lat: g.coordinates[1],
              date: g.date,
            })),
          description: 'NASA EONET canlı tropik siklon / fırtına izlənməsi',
        });
      }
    }
  } catch {
    // Continue
  }

  for (const pt of gridPoints) {
    const isThunder = pt.weatherCode >= 95;
    const isDeepLow = pt.pressure <= 994;
    const isGale = pt.windGusts >= 58 || pt.windSpeed >= 48;

    if (!isThunder && !isDeepLow && !isGale) continue;

    const nearExisting = storms.some(
      (s) => Math.hypot(s.lat - pt.lat, s.lon - pt.lon) < 6
    );
    if (nearExisting) continue;

    const category: StormEvent['category'] = isDeepLow
      ? 'cyclone'
      : isThunder
        ? 'thunderstorm'
        : 'gale';

    const locationTitle = pt.name
      ? `${pt.name} yaxınlığında`
      : `${Math.abs(pt.lat).toFixed(0)}°${pt.lat >= 0 ? 'Ş' : 'C'}, ${Math.abs(
          pt.lon
        ).toFixed(0)}°${pt.lon >= 0 ? 'Şq' : 'Q'}`;

    const kindLabel =
      category === 'cyclone'
        ? 'Alçaq təzyiqli siklon mərkəzi'
        : category === 'thunderstorm'
          ? 'Şimşəkli fırtına ocağı'
          : 'Güclü qasırğa küləkləri';

    storms.push({
      id: `meteo_${pt.id}`,
      title: `${kindLabel} · ${locationTitle}`,
      category,
      source: 'Open-Meteo Real-Time',
      lat: pt.lat,
      lon: pt.lon,
      windSpeed: pt.windSpeed,
      windGusts: pt.windGusts,
      pressure: pt.pressure,
      updatedAt: new Date().toISOString(),
      description: `Təzyiq: ${Math.round(pt.pressure)} hPa · Şiddət: ${Math.round(
        pt.windGusts
      )} km/saat`,
    });
  }

  return storms;
}
