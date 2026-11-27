export type WeatherLayerId =
  | 'wind'
  | 'temperature'
  | 'precipitation'
  | 'clouds'
  | 'pressure'
  | 'humidity'
  | 'storms';

export type BaseMapId = 'dark' | 'satellite' | 'light';

export interface GridPointWeather {
  id: string;
  name?: string;
  country?: string;
  isMajorCity?: boolean;
  lat: number;
  lon: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  weatherCode: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  weatherCode: number;
  cloudCover: number;
  pressure: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windGustsMax: number;
  windDirectionDominant: number;
  sunrise: string;
  sunset: string;
}

export interface SelectedLocationWeather {
  name: string;
  country?: string;
  lat: number;
  lon: number;
  timezone: string;
  utcOffsetSeconds: number;
  elevation?: number;
  observedAt: string;
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    precipitation: number;
    rain: number;
    snowfall: number;
    weatherCode: number;
    cloudCover: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    isDay: boolean;
  };
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface StormEvent {
  id: string;
  title: string;
  category: 'cyclone' | 'gale' | 'thunderstorm';
  source: 'NASA EONET' | 'Open-Meteo Real-Time';
  lat: number;
  lon: number;
  windSpeed?: number;
  windGusts?: number;
  pressure?: number;
  updatedAt: string;
  track?: Array<{ lat: number; lon: number; date: string }>;
  description: string;
}

export interface RainViewerFrame {
  time: number;
  path: string;
}

export interface RainViewerData {
  host: string;
  radarFrames: RainViewerFrame[];
  satelliteFrames: RainViewerFrame[];
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  population?: number;
}

export interface HoverProbeData {
  lat: number;
  lon: number;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
  snowfall: number;
}
