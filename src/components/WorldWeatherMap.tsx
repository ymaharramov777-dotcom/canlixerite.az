import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Minus, Plus } from 'lucide-react';
import type {
  BaseMapId,
  GridPointWeather,
  HoverProbeData,
  RainViewerData,
  StormEvent,
  WeatherLayerId,
} from '../types/weather';
import { sampleGlobalGrid } from '../utils/interpolation';
import { getDirectionAz } from '../utils/weatherAz';
import { WeatherCanvasOverlay } from './WeatherCanvasOverlay';

interface WorldWeatherMapProps {
  baseMap: BaseMapId;
  activeLayer: WeatherLayerId;
  showWindFlow: boolean;
  gridMatrix: GridPointWeather[][];
  cities: GridPointWeather[];
  storms: StormEvent[];
  rainViewer: RainViewerData | null;
  radarFrameIndex: number;
  satelliteFrameIndex: number;
  selectedCoords: { lat: number; lon: number; name?: string } | null;
  flyToTarget: {
    lat: number;
    lon: number;
    zoom: number;
    nonce: number;
    fitWorld?: boolean;
  } | null;
  onMapClick: (lat: number, lon: number, name?: string, country?: string) => void;
  onHoverProbe: (probe: HoverProbeData | null) => void;
  onSelectStorm: (storm: StormEvent) => void;
}

export function WorldWeatherMap({
  baseMap,
  activeLayer,
  showWindFlow,
  gridMatrix,
  cities,
  storms,
  rainViewer,
  radarFrameIndex,
  satelliteFrameIndex,
  selectedCoords,
  flyToTarget,
  onMapClick,
  onHoverProbe,
  onSelectStorm,
}: WorldWeatherMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState<L.Map | null>(null);

  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const cityGroupRef = useRef<L.LayerGroup | null>(null);
  const stormGroupRef = useRef<L.LayerGroup | null>(null);
  const pressureGroupRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onHoverProbeRef = useRef(onHoverProbe);
  onHoverProbeRef.current = onHoverProbe;
  const gridMatrixRef = useRef(gridMatrix);
  gridMatrixRef.current = gridMatrix;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 10],
      zoom: 2,
      minZoom: 1,
      maxZoom: 13,
      zoomControl: false,
      worldCopyJump: true,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      maxBounds: [
        [-82, -240],
        [82, 240],
      ],
      maxBoundsViscosity: 0.6,
    });

    map.fitBounds(
      [
        [-56, -172],
        [72, 172],
      ],
      { padding: [12, 12], animate: false }
    );

    cityGroupRef.current = L.layerGroup().addTo(map);
    stormGroupRef.current = L.layerGroup().addTo(map);
    pressureGroupRef.current = L.layerGroup().addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const gm = gridMatrixRef.current;
      if (!gm.length) return;
      const sample = sampleGlobalGrid(gm, e.latlng.lat, e.latlng.lng);
      onHoverProbeRef.current({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
        temperature: sample.temperature,
        windSpeed: sample.windSpeed,
        windDirection: sample.windDirection,
        pressure: sample.pressure,
        humidity: sample.humidity,
        cloudCover: sample.cloudCover,
        precipitation: sample.precipitation,
        snowfall: sample.snowfall,
      });
    });

    map.on('mouseout', () => {
      onHoverProbeRef.current(null);
    });

    mapRef.current = map;
    setMapReady(map);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(null);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (baseMap === 'satellite') {
      baseLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '© Esri, Earthstar Geographics',
          maxZoom: 17,
        }
      ).addTo(map);

      labelsLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
          pane: 'overlayPane',
        }
      ).addTo(map);
    } else if (baseMap === 'light') {
      baseLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '© OpenStreetMap, © CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      baseLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '© OpenStreetMap, © CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);
    }
  }, [baseMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (!rainViewer) return;

    if (
      activeLayer === 'precipitation' &&
      rainViewer.radarFrames.length > 0
    ) {
      const frame =
        rainViewer.radarFrames[
          Math.min(radarFrameIndex, rainViewer.radarFrames.length - 1)
        ];
      if (frame) {
        radarLayerRef.current = L.tileLayer(
          `${rainViewer.host}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`,
          {
            opacity: 0.7,
            maxNativeZoom: 7,
            maxZoom: 13,
            zIndex: 350,
            attribution: '© RainViewer',
          }
        ).addTo(map);
      }
    } else if (
      activeLayer === 'clouds' &&
      rainViewer.satelliteFrames.length > 0
    ) {
      const frame =
        rainViewer.satelliteFrames[
          Math.min(satelliteFrameIndex, rainViewer.satelliteFrames.length - 1)
        ];
      if (frame) {
        radarLayerRef.current = L.tileLayer(
          `${rainViewer.host}${frame.path}/256/{z}/{x}/{y}/0/0_0.png`,
          {
            opacity: 0.56,
            maxNativeZoom: 7,
            maxZoom: 13,
            zIndex: 350,
            attribution: '© RainViewer Peyk',
          }
        ).addTo(map);
      }
    }
  }, [activeLayer, rainViewer, radarFrameIndex, satelliteFrameIndex]);

  useEffect(() => {
    const group = cityGroupRef.current;
    if (!group) return;
    group.clearLayers();

    for (const city of cities) {
      let metricText = `${Math.round(city.temperature)}°`;
      if (activeLayer === 'wind') {
        metricText = `${Math.round(city.windSpeed)} km/s`;
      } else if (activeLayer === 'pressure') {
        metricText = `${Math.round(city.pressure)}`;
      } else if (activeLayer === 'humidity') {
        metricText = `${Math.round(city.humidity)}%`;
      } else if (activeLayer === 'clouds') {
        metricText = `${Math.round(city.cloudCover)}%`;
      } else if (activeLayer === 'precipitation') {
        metricText =
          city.snowfall > 0
            ? `${city.snowfall.toFixed(1)} sm`
            : `${city.precipitation.toFixed(1)} mm`;
      }

      const dir = getDirectionAz(city.windDirection);
      const html = `
        <div class="group flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-[#0B111E]/88 px-2 py-0.5 text-[11px] shadow-md backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer whitespace-nowrap">
          <span class="font-medium text-slate-200">${city.name}</span>
          <span class="font-mono-tabular font-semibold text-cyan-300">${metricText}</span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'weather-city-marker',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 10],
      });

      const marker = L.marker([city.lat, city.lon], { icon });
      marker.bindTooltip(
        `${city.name} (${city.country ?? ''}) · ${Math.round(
          city.temperature
        )}°C · Külək: ${Math.round(city.windSpeed)} km/saat (${dir.short})`,
        { direction: 'top', offset: [0, -8] }
      );
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onMapClickRef.current(city.lat, city.lon, city.name, city.country);
      });
      marker.addTo(group);
    }
  }, [cities, activeLayer]);

  useEffect(() => {
    const group = pressureGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (activeLayer !== 'pressure' || !gridMatrix.length) return;

    const rows = gridMatrix.length;
    const cols = gridMatrix[0].length;

    for (let r = 1; r < rows - 1; r++) {
      for (let c = 0; c < cols; c++) {
        const pt = gridMatrix[r][c];
        const left = gridMatrix[r][(c - 1 + cols) % cols].pressure;
        const right = gridMatrix[r][(c + 1) % cols].pressure;
        const up = gridMatrix[r - 1][c].pressure;
        const down = gridMatrix[r + 1][c].pressure;

        const isLocalHigh =
          pt.pressure >= 1022 &&
          pt.pressure >= left &&
          pt.pressure >= right &&
          pt.pressure >= up &&
          pt.pressure >= down;

        const isLocalLow =
          pt.pressure <= 1002 &&
          pt.pressure <= left &&
          pt.pressure <= right &&
          pt.pressure <= up &&
          pt.pressure <= down;

        if (!isLocalHigh && !isLocalLow) continue;

        const letter = isLocalHigh ? 'Y' : 'A';
        const colorClass = isLocalHigh
          ? 'text-blue-300 border-blue-400/60 bg-blue-950/80'
          : 'text-rose-300 border-rose-400/60 bg-rose-950/80';

        const icon = L.divIcon({
          className: 'weather-pressure-marker',
          html: `
            <div class="flex flex-col items-center pointer-events-none select-none">
              <div class="flex h-7 w-7 items-center justify-center rounded-full border ${colorClass} text-sm font-bold shadow-lg">${letter}</div>
              <span class="font-mono-tabular mt-0.5 rounded bg-[#070B12]/80 px-1 text-[10px] text-slate-200">${Math.round(
                pt.pressure
              )}</span>
            </div>
          `,
          iconSize: [28, 42],
          iconAnchor: [14, 21],
        });

        L.marker([pt.lat, pt.lon], { icon, interactive: false }).addTo(group);
      }
    }
  }, [gridMatrix, activeLayer]);

  useEffect(() => {
    const group = stormGroupRef.current;
    if (!group) return;
    group.clearLayers();

    for (const storm of storms) {
      if (storm.track && storm.track.length > 1) {
        const latlngs = storm.track.map((t) => [t.lat, t.lon] as [number, number]);
        L.polyline(latlngs, {
          color: '#f43f5e',
          weight: 2,
          dashArray: '4 4',
          opacity: 0.75,
        }).addTo(group);
      }

      const isCyclone = storm.category === 'cyclone';
      const ringColor = isCyclone ? 'border-rose-500 bg-rose-500/25' : 'border-amber-400 bg-amber-400/25';
      const coreColor = isCyclone ? 'bg-rose-500' : 'bg-amber-400';

      const icon = L.divIcon({
        className: 'weather-storm-marker',
        html: `
          <div class="relative flex h-8 w-8 items-center justify-center cursor-pointer" title="${storm.title}">
            <span class="absolute inset-0 animate-ping rounded-full ${coreColor} opacity-35"></span>
            <span class="relative flex h-5 w-5 items-center justify-center rounded-full border-2 ${ringColor} backdrop-blur-sm">
              <span class="h-2 w-2 rounded-full ${coreColor}"></span>
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([storm.lat, storm.lon], { icon });
      marker.bindTooltip(`${storm.title} · ${storm.description}`, {
        direction: 'top',
        offset: [0, -10],
      });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectStorm(storm);
      });
      marker.addTo(group);
    }
  }, [storms, onSelectStorm]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    if (!selectedCoords) return;

    selectedMarkerRef.current = L.circleMarker(
      [selectedCoords.lat, selectedCoords.lon],
      {
        radius: 7,
        color: '#22d3ee',
        weight: 2.5,
        fillColor: '#0B111E',
        fillOpacity: 0.9,
      }
    ).addTo(map);
  }, [selectedCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;

    if (flyToTarget.fitWorld) {
      map.fitBounds(
        [
          [-56, -172],
          [72, 172],
        ],
        { padding: [12, 12], animate: true, duration: 0.9 }
      );
      return;
    }

    map.flyTo([flyToTarget.lat, flyToTarget.lon], flyToTarget.zoom, {
      duration: 0.9,
    });
  }, [flyToTarget]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070B12]">
      <div
        ref={containerRef}
        className="h-full w-full cursor-crosshair"
        aria-label="İnteraktiv dünya hava xəritəsi"
      />

      <WeatherCanvasOverlay
        map={mapReady}
        gridMatrix={gridMatrix}
        activeLayer={activeLayer}
        showWindFlow={showWindFlow}
      />

      <div className="pointer-events-none absolute left-1/2 top-2 z-[750] -translate-x-1/2 rounded bg-[#070B12]/70 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300/90 backdrop-blur-sm">
        ŞİMAL
      </div>
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-[750] -translate-x-1/2 rounded bg-[#070B12]/70 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300/85 backdrop-blur-sm md:hidden">
        CƏNUB
      </div>
      <div className="pointer-events-none absolute left-2 top-1/2 z-[750] hidden -translate-y-1/2 rounded bg-[#070B12]/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300/85 backdrop-blur-sm md:block">
        QƏRB
      </div>
      <div className="pointer-events-none absolute right-2 top-1/2 z-[750] hidden -translate-y-1/2 rounded bg-[#070B12]/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300/85 backdrop-blur-sm md:block">
        ŞƏRQ
      </div>

      <div className="absolute right-3 top-36 z-[800] flex flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0B111E]/90 backdrop-blur-md md:left-[176px] md:right-auto md:top-16">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center border-b border-slate-800/80 text-slate-200 transition-colors hover:bg-slate-800 hover:text-cyan-300"
          title="Yaxınlaşdır"
          aria-label="Yaxınlaşdır"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center text-slate-200 transition-colors hover:bg-slate-800 hover:text-cyan-300"
          title="Uzaqlaşdır"
          aria-label="Uzaqlaşdır"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
