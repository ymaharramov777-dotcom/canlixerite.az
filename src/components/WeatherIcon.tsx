import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from 'lucide-react';
import { getWeatherInfoAz } from '../utils/weatherAz';

interface WeatherIconProps {
  code: number;
  className?: string;
}

export function WeatherIcon({ code, className = 'w-5 h-5' }: WeatherIconProps) {
  const { type } = getWeatherInfoAz(code);

  switch (type) {
    case 'clear':
      return <Sun className={`${className} text-amber-400`} />;
    case 'partly-cloudy':
      return <CloudSun className={`${className} text-amber-300`} />;
    case 'cloudy':
      return <Cloud className={`${className} text-slate-300`} />;
    case 'fog':
      return <CloudFog className={`${className} text-slate-400`} />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-cyan-300`} />;
    case 'rain':
    case 'heavy-rain':
      return <CloudRain className={`${className} text-cyan-400`} />;
    case 'snow':
    case 'sleet':
      return <CloudSnow className={`${className} text-indigo-200`} />;
    case 'thunderstorm':
      return <CloudLightning className={`${className} text-amber-300`} />;
    default:
      return <CloudSun className={`${className} text-slate-300`} />;
  }
}
