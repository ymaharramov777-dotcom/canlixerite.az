import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import type { GridPointWeather, WeatherLayerId } from '../types/weather';
import { sampleGlobalGrid } from '../utils/interpolation';
import {
  getPressureColorRgb,
  getTempColorRgb,
  getWindColorRgb,
} from '../utils/weatherAz';

interface WeatherCanvasOverlayProps {
  map: L.Map | null;
  gridMatrix: GridPointWeather[][];
  activeLayer: WeatherLayerId;
  showWindFlow: boolean;
}

interface WindParticle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  isArrow: boolean;
}

interface CloudPuff {
  x: number;
  y: number;
  radius: number;
  age: number;
  maxAge: number;
}

export function WeatherCanvasOverlay({
  map,
  gridMatrix,
  activeLayer,
  showWindFlow,
}: WeatherCanvasOverlayProps) {
  const fieldCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !fieldCanvasRef.current || gridMatrix.length === 0) return;

    const canvas = fieldCanvasRef.current;

    const renderScalarField = () => {
      const size = map.getSize();
      if (size.x <= 0 || size.y <= 0) return;

      canvas.width = size.x;
      canvas.height = size.y;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, size.x, size.y);

      if (activeLayer === 'storms') return;

      const cell = 10;
      const cols = Math.max(2, Math.ceil(size.x / cell));
      const rows = Math.max(2, Math.ceil(size.y / cell));

      const offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      const img = offCtx.createImageData(cols, rows);
      const data = img.data;

      for (let r = 0; r < rows; r++) {
        const py = Math.min(size.y - 1, r * cell + cell * 0.5);
        for (let c = 0; c < cols; c++) {
          const px = Math.min(size.x - 1, c * cell + cell * 0.5);
          const latlng = map.containerPointToLatLng([px, py]);
          const sample = sampleGlobalGrid(gridMatrix, latlng.lat, latlng.lng);

          let rgb: [number, number, number] = [0, 0, 0];
          let alpha = 0;

          if (activeLayer === 'temperature') {
            rgb = getTempColorRgb(sample.temperature);
            alpha = 95;
          } else if (activeLayer === 'wind') {
            rgb = getWindColorRgb(sample.windSpeed);
            alpha = Math.min(92, Math.max(18, Math.round(sample.windSpeed * 1.15)));
          } else if (activeLayer === 'pressure') {
            rgb = getPressureColorRgb(sample.pressure);
            alpha = 88;
          } else if (activeLayer === 'humidity') {
            const h = Math.max(0, Math.min(100, sample.humidity));
            if (h < 40) {
              rgb = [217, 119, 6];
              alpha = Math.round((45 - h) * 1.4);
            } else {
              const t = (h - 40) / 60;
              rgb = [
                Math.round(16 + (14 - 16) * t),
                Math.round(185 + (165 - 185) * t),
                Math.round(129 + (233 - 129) * t),
              ];
              alpha = Math.round(25 + t * 85);
            }
          } else if (activeLayer === 'clouds') {
            const cc = Math.max(0, Math.min(100, sample.cloudCover));
            rgb = [226, 232, 240];
            alpha = Math.round((cc / 100) * 105);
          } else if (activeLayer === 'precipitation') {
            if (sample.snowfall > 0.05 || (sample.precipitation > 0.08 && sample.temperature <= 1.2)) {
              rgb = [196, 181, 253];
              alpha = Math.min(135, Math.round(35 + (sample.snowfall + sample.precipitation) * 35));
            } else if (sample.precipitation > 0.05) {
              rgb = [6, 182, 212];
              alpha = Math.min(135, Math.round(30 + sample.precipitation * 32));
            } else {
              alpha = 0;
            }
          }

          const idx = (r * cols + c) * 4;
          data[idx] = rgb[0];
          data[idx + 1] = rgb[1];
          data[idx + 2] = rgb[2];
          data[idx + 3] = alpha;
        }
      }

      offCtx.putImageData(img, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offscreen, 0, 0, size.x, size.y);
      ctx.restore();
    };

    renderScalarField();

    const clearOnMove = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    map.on('movestart', clearOnMove);
    map.on('zoomstart', clearOnMove);
    map.on('moveend', renderScalarField);
    map.on('zoomend', renderScalarField);
    map.on('resize', renderScalarField);

    return () => {
      map.off('movestart', clearOnMove);
      map.off('zoomstart', clearOnMove);
      map.off('moveend', renderScalarField);
      map.off('zoomend', renderScalarField);
      map.off('resize', renderScalarField);
    };
  }, [map, gridMatrix, activeLayer]);

  useEffect(() => {
    if (!map || !animCanvasRef.current || gridMatrix.length === 0) return;

    const canvas = animCanvasRef.current;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let isPanning = false;
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const size = map.getSize();
      width = size.x;
      height = size.y;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    const shouldAnimateWind = showWindFlow || activeLayer === 'wind';
    const shouldAnimateClouds = activeLayer === 'clouds';

    const windCount = width < 640 ? 150 : 280;
    const particles: WindParticle[] = Array.from({ length: windCount }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      age: Math.floor(Math.random() * 90),
      maxAge: 70 + Math.floor(Math.random() * 60),
      isArrow: idx % 3 === 0,
    }));

    const cloudCount = width < 640 ? 45 : 85;
    const clouds: CloudPuff[] = Array.from({ length: cloudCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 18 + Math.random() * 26,
      age: Math.floor(Math.random() * 140),
      maxAge: 140 + Math.floor(Math.random() * 100),
    }));

    const drawArrow = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      angle: number,
      len: number,
      color: string,
      alpha: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(-len * 0.55, 0);
      ctx.lineTo(len * 0.45, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(len * 0.65, 0);
      ctx.lineTo(len * 0.15, -3.8);
      ctx.lineTo(len * 0.25, 0);
      ctx.lineTo(len * 0.15, 3.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let lookupCols = 24;
    let lookupRows = 16;
    let vxField = new Float32Array(lookupCols * lookupRows);
    let vyField = new Float32Array(lookupCols * lookupRows);
    let speedField = new Float32Array(lookupCols * lookupRows);
    let cloudField = new Float32Array(lookupCols * lookupRows);

    const rebuildVelocityLookup = () => {
      if (width <= 0 || height <= 0) return;
      lookupCols = Math.max(12, Math.min(36, Math.round(width / 48)));
      lookupRows = Math.max(8, Math.min(24, Math.round(height / 48)));
      vxField = new Float32Array(lookupCols * lookupRows);
      vyField = new Float32Array(lookupCols * lookupRows);
      speedField = new Float32Array(lookupCols * lookupRows);
      cloudField = new Float32Array(lookupCols * lookupRows);

      for (let r = 0; r < lookupRows; r++) {
        const py = (r / (lookupRows - 1)) * height;
        for (let c = 0; c < lookupCols; c++) {
          const px = (c / (lookupCols - 1)) * width;
          const ll = map.containerPointToLatLng([px, py]);
          const s = sampleGlobalGrid(gridMatrix, ll.lat, ll.lng);
          const idx = r * lookupCols + c;
          vxField[idx] = s.u;
          vyField[idx] = -s.v;
          speedField[idx] = s.windSpeed;
          cloudField[idx] = s.cloudCover;
        }
      }
    };

    const sampleLookup = (x: number, y: number) => {
      const fx = Math.max(0, Math.min(lookupCols - 1.001, (x / width) * (lookupCols - 1)));
      const fy = Math.max(0, Math.min(lookupRows - 1.001, (y / height) * (lookupRows - 1)));
      const c0 = Math.floor(fx);
      const r0 = Math.floor(fy);
      const c1 = c0 + 1;
      const r1 = r0 + 1;
      const tx = fx - c0;
      const ty = fy - r0;

      const i00 = r0 * lookupCols + c0;
      const i01 = r0 * lookupCols + c1;
      const i10 = r1 * lookupCols + c0;
      const i11 = r1 * lookupCols + c1;

      const lerp4 = (arr: Float32Array) =>
        arr[i00] * (1 - tx) * (1 - ty) +
        arr[i01] * tx * (1 - ty) +
        arr[i10] * (1 - tx) * ty +
        arr[i11] * tx * ty;

      return {
        vx: lerp4(vxField),
        vy: lerp4(vyField),
        speed: lerp4(speedField),
        cloud: lerp4(cloudField),
      };
    };

    rebuildVelocityLookup();

    const drawStaticArrowsOnce = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      if (!shouldAnimateWind) return;

      const spacing = width < 640 ? 64 : 76;
      for (let y = spacing * 0.5; y < height; y += spacing) {
        for (let x = spacing * 0.5; x < width; x += spacing) {
          const { vx, vy, speed } = sampleLookup(x, y);
          if (speed < 1) continue;
          const angle = Math.atan2(vy, vx);
          const [r, g, b] = getWindColorRgb(speed);
          drawArrow(ctx, x, y, angle, 16, `rgb(${r}, ${g}, ${b})`, 0.85);
        }
      }
    };

    if (prefersReducedMotion) {
      drawStaticArrowsOnce();
    }

    const tick = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || isPanning || width <= 0 || height <= 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      if (shouldAnimateClouds) {
        for (const cl of clouds) {
          const { vx, vy, cloud } = sampleLookup(cl.x, cl.y);
          const speedScale = 0.025;
          cl.x += vx * speedScale;
          cl.y += vy * speedScale;
          cl.age += 1;

          if (
            cl.age >= cl.maxAge ||
            cl.x < -40 ||
            cl.x > width + 40 ||
            cl.y < -40 ||
            cl.y > height + 40
          ) {
            cl.x = Math.random() * width;
            cl.y = Math.random() * height;
            cl.age = 0;
          }

          if (cloud > 18) {
            const lifeFade = Math.sin((cl.age / cl.maxAge) * Math.PI);
            const alpha = Math.min(0.42, (cloud / 100) * 0.42 * lifeFade);
            const grad = ctx.createRadialGradient(cl.x, cl.y, 2, cl.x, cl.y, cl.radius);
            grad.addColorStop(0, `rgba(241, 245, 249, ${alpha})`);
            grad.addColorStop(1, 'rgba(241, 245, 249, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cl.x, cl.y, cl.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (shouldAnimateWind) {
        const speedMultiplier = 0.055;
        for (const p of particles) {
          const { vx, vy, speed } = sampleLookup(p.x, p.y);
          const dx = vx * speedMultiplier;
          const dy = vy * speedMultiplier;

          const prevX = p.x;
          const prevY = p.y;
          p.x += dx;
          p.y += dy;
          p.age += 1;

          if (p.age >= p.maxAge || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
            p.age = 0;
            continue;
          }

          const lifeAlpha = Math.sin((p.age / p.maxAge) * Math.PI);
          const [r, g, b] = getWindColorRgb(speed);
          const colorStr = `rgb(${r}, ${g}, ${b})`;

          if (p.isArrow) {
            const angle = Math.atan2(dy, dx);
            const arrowLen = Math.min(20, Math.max(12, 11 + speed * 0.1));
            drawArrow(
              ctx,
              p.x,
              p.y,
              angle,
              arrowLen,
              colorStr,
              Math.min(0.95, 0.45 + lifeAlpha * 0.5)
            );
          } else {
            const tailScale = 4.2;
            ctx.save();
            ctx.globalAlpha = Math.min(0.75, 0.25 + lifeAlpha * 0.5);
            ctx.strokeStyle = colorStr;
            ctx.lineWidth = speed > 45 ? 2 : 1.4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(prevX - dx * tailScale, prevY - dy * tailScale);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    if (!prefersReducedMotion && (shouldAnimateWind || shouldAnimateClouds)) {
      rafRef.current = requestAnimationFrame(tick);
    }

    const onMoveStart = () => {
      isPanning = true;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, width, height);
    };

    const onMoveEnd = () => {
      isPanning = false;
      resizeCanvas();
      rebuildVelocityLookup();
      if (prefersReducedMotion) drawStaticArrowsOnce();
    };

    map.on('movestart', onMoveStart);
    map.on('zoomstart', onMoveStart);
    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);
    map.on('resize', onMoveEnd);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      map.off('movestart', onMoveStart);
      map.off('zoomstart', onMoveStart);
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
      map.off('resize', onMoveEnd);
    };
  }, [map, gridMatrix, activeLayer, showWindFlow]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[410] overflow-hidden">
      <canvas ref={fieldCanvasRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={animCanvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
