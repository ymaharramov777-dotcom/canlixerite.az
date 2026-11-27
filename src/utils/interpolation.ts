import {
  GLOBAL_LAT_BANDS,
  GLOBAL_LON_BANDS,
} from '../services/weatherApi';
import type { GridPointWeather } from '../types/weather';

export interface InterpolatedSample {
  temperature: number;
  u: number;
  v: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
  snowfall: number;
}

function wrapLon(lon: number): number {
  let l = ((lon + 180) % 360 + 360) % 360 - 180;
  if (l === -180) l = 180;
  return l;
}

export function sampleGlobalGrid(
  gridMatrix: GridPointWeather[][],
  lat: number,
  lon: number
): InterpolatedSample {
  if (!gridMatrix.length || !gridMatrix[0]?.length) {
    return {
      temperature: 15,
      u: 0,
      v: 0,
      windSpeed: 0,
      windDirection: 0,
      pressure: 1013,
      humidity: 50,
      cloudCover: 0,
      precipitation: 0,
      snowfall: 0,
    };
  }

  const rows = GLOBAL_LAT_BANDS.length;
  const cols = GLOBAL_LON_BANDS.length;

  const clampedLat = Math.max(
    GLOBAL_LAT_BANDS[0],
    Math.min(GLOBAL_LAT_BANDS[rows - 1], lat)
  );
  const latStep = 20;
  const latFloat = (clampedLat - GLOBAL_LAT_BANDS[0]) / latStep;
  const r0 = Math.min(rows - 2, Math.max(0, Math.floor(latFloat)));
  const r1 = r0 + 1;
  const ty = latFloat - r0;

  const normLon = wrapLon(lon);
  const lonStep = 30;
  let lonFloat = (normLon - GLOBAL_LON_BANDS[0]) / lonStep;
  if (lonFloat < 0) lonFloat += cols;
  const c0 = ((Math.floor(lonFloat) % cols) + cols) % cols;
  const c1 = (c0 + 1) % cols;
  const tx = lonFloat - Math.floor(lonFloat);

  const p00 = gridMatrix[r0][c0];
  const p01 = gridMatrix[r0][c1];
  const p10 = gridMatrix[r1][c0];
  const p11 = gridMatrix[r1][c1];

  const bilerp = (a: number, b: number, c: number, d: number) =>
    a * (1 - tx) * (1 - ty) +
    b * tx * (1 - ty) +
    c * (1 - tx) * ty +
    d * tx * ty;

  const toUV = (pt: GridPointWeather): [number, number] => {
    const rad = (pt.windDirection * Math.PI) / 180;
    const u = -Math.sin(rad) * pt.windSpeed;
    const v = -Math.cos(rad) * pt.windSpeed;
    return [u, v];
  };

  const [u00, v00] = toUV(p00);
  const [u01, v01] = toUV(p01);
  const [u10, v10] = toUV(p10);
  const [u11, v11] = toUV(p11);

  const u = bilerp(u00, u01, u10, u11);
  const v = bilerp(v00, v01, v10, v11);
  const windSpeed = Math.hypot(u, v);
  const windDirection = ((Math.atan2(-u, -v) * 180) / Math.PI + 360) % 360;

  return {
    temperature: bilerp(p00.temperature, p01.temperature, p10.temperature, p11.temperature),
    u,
    v,
    windSpeed,
    windDirection,
    pressure: bilerp(p00.pressure, p01.pressure, p10.pressure, p11.pressure),
    humidity: bilerp(p00.humidity, p01.humidity, p10.humidity, p11.humidity),
    cloudCover: bilerp(p00.cloudCover, p01.cloudCover, p10.cloudCover, p11.cloudCover),
    precipitation: bilerp(
      p00.precipitation,
      p01.precipitation,
      p10.precipitation,
      p11.precipitation
    ),
    snowfall: bilerp(p00.snowfall, p01.snowfall, p10.snowfall, p11.snowfall),
  };
}
