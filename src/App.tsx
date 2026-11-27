import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CompassRose } from './components/CompassRose';
import { ForecastPanel } from './components/ForecastPanel';
import { LayerControls } from './components/LayerControls';
import { LayerLegend } from './components/LayerLegend';
import { SearchBar } from './components/SearchBar';
import { TimelinePlayer } from './components/TimelinePlayer';
import { WorldWeatherMap } from './components/WorldWeatherMap';
import {
  fetchActiveStorms,
  fetchGlobalWeatherGrid,
  fetchLocationWeather,
  fetchRainViewerMaps,
} from './services/weatherApi';
import type {
  BaseMapId,
  GridPointWeather,
  HoverProbeData,
  RainViewerData,
  SelectedLocationWeather,
  StormEvent,
  WeatherLayerId,
} from './types/weather';
import { getDirectionAz } from './utils/weatherAz';

export default function App() {
  const [activeLayer, setActiveLayer] = useState<WeatherLayerId>('wind');
  const [showWindFlow, setShowWindFlow] = useState<boolean>(true);
  const [baseMap, setBaseMap] = useState<BaseMapId>('dark');

  const [gridMatrix, setGridMatrix] = useState<GridPointWeather[][]>([]);
  const [cities, setCities] = useState<GridPointWeather[]>([]);
  const [storms, setStorms] = useState<StormEvent[]>([]);
  const [rainViewer, setRainViewer] = useState<RainViewerData | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [radarFrameIndex, setRadarFrameIndex] = useState<number>(0);
  const [satelliteFrameIndex, setSatelliteFrameIndex] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(true);

  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lon: number;
    name?: string;
  }>({ lat: 40.4093, lon: 49.8671, name: 'Bakı' });
  const [selectedWeather, setSelectedWeather] =
    useState<SelectedLocationWeather | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const [hoverProbe, setHoverProbe] = useState<HoverProbeData | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lon: number;
    zoom: number;
    nonce: number;
    fitWorld?: boolean;
  } | null>(null);

  const locationReqCounter = useRef(0);

  const loadGlobalData = useCallback(async () => {
    setIsGlobalLoading(true);
    setGlobalError(null);
    try {
      const [gridRes, rvRes] = await Promise.all([
        fetchGlobalWeatherGrid(),
        fetchRainViewerMaps(),
      ]);
      setGridMatrix(gridRes.gridMatrix);
      setCities(gridRes.cities);
      if (rvRes) {
        setRainViewer(rvRes);
        if (rvRes.radarFrames.length > 0) {
          setRadarFrameIndex(rvRes.radarFrames.length - 1);
        }
        if (rvRes.satelliteFrames.length > 0) {
          setSatelliteFrameIndex(rvRes.satelliteFrames.length - 1);
        }
      }
      const activeStorms = await fetchActiveStorms(gridRes.allPoints);
      setStorms(activeStorms);
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : 'Qlobal hava məlumatları yüklənərkən xəta baş verdi.'
      );
    } finally {
      setIsGlobalLoading(false);
    }
  }, []);

  const loadLocationDetail = useCallback(
    async (
      lat: number,
      lon: number,
      name?: string,
      country?: string,
      openPanel = true
    ) => {
      const reqId = ++locationReqCounter.current;
      setSelectedCoords({ lat, lon, name });
      setIsLocationLoading(true);
      setLocationError(null);
      if (openPanel) {
        setIsPanelOpen(true);
      }

      try {
        const detail = await fetchLocationWeather(lat, lon, name, country);
        if (reqId === locationReqCounter.current) {
          setSelectedWeather(detail);
          setSelectedCoords({ lat: detail.lat, lon: detail.lon, name: detail.name });
        }
      } catch (err) {
        if (reqId === locationReqCounter.current) {
          setLocationError(
            err instanceof Error
              ? err.message
              : 'Seçilmiş məkan üçün proqnoz alınmadı.'
          );
        }
      } finally {
        if (reqId === locationReqCounter.current) {
          setIsLocationLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadGlobalData();
    loadLocationDetail(40.4093, 49.8671, 'Bakı', 'Azərbaycan', false);
  }, [loadGlobalData, loadLocationDetail]);

  useEffect(() => {
    if (!isPlayingTimeline || !rainViewer) return;
    if (activeLayer !== 'precipitation' && activeLayer !== 'clouds') return;

    const timer = setInterval(() => {
      if (activeLayer === 'precipitation' && rainViewer.radarFrames.length > 1) {
        setRadarFrameIndex(
          (prev) => (prev + 1) % rainViewer.radarFrames.length
        );
      } else if (
        activeLayer === 'clouds' &&
        rainViewer.satelliteFrames.length > 1
      ) {
        setSatelliteFrameIndex(
          (prev) => (prev + 1) % rainViewer.satelliteFrames.length
        );
      }
    }, 850);

    return () => clearInterval(timer);
  }, [isPlayingTimeline, activeLayer, rainViewer]);

  const handleSelectSearchLocation = useCallback(
    (lat: number, lon: number, name: string, country?: string) => {
      setFlyToTarget({ lat, lon, zoom: 7, nonce: Date.now() });
      loadLocationDetail(lat, lon, name, country);
    },
    [loadLocationDetail]
  );

  const handleMapClick = useCallback(
    (lat: number, lon: number, name?: string, country?: string) => {
      loadLocationDetail(lat, lon, name, country);
    },
    [loadLocationDetail]
  );

  const handleSelectStorm = useCallback(
    (storm: StormEvent) => {
      setActiveLayer('storms');
      setFlyToTarget({
        lat: storm.lat,
        lon: storm.lon,
        zoom: 5,
        nonce: Date.now(),
      });
      loadLocationDetail(storm.lat, storm.lon, storm.title, storm.source);
    },
    [loadLocationDetail]
  );

  const handleResetWorldView = useCallback(() => {
    setIsPanelOpen(false);
    setFlyToTarget({
      lat: 20,
      lon: 10,
      zoom: 2,
      nonce: Date.now(),
      fitWorld: true,
    });
  }, []);

  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setFlyToTarget({
          lat: latitude,
          lon: longitude,
          zoom: 8,
          nonce: Date.now(),
        });
        loadLocationDetail(latitude, longitude);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [loadLocationDetail]);

  const activeTimelineFrames =
    activeLayer === 'precipitation'
      ? rainViewer?.radarFrames ?? []
      : activeLayer === 'clouds'
        ? rainViewer?.satelliteFrames ?? []
        : [];
  const activeTimelineIdx =
    activeLayer === 'precipitation' ? radarFrameIndex : satelliteFrameIndex;

  const activeCompassWindDir =
    hoverProbe?.windDirection ?? selectedWeather?.current.windDirection;
  const activeCompassWindSpeed =
    hoverProbe?.windSpeed ?? selectedWeather?.current.windSpeed;
  const activeCompassName = hoverProbe
    ? `${hoverProbe.lat.toFixed(1)}°, ${hoverProbe.lon.toFixed(1)}°`
    : selectedWeather?.name;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#070B12] text-slate-100">
      <header className="fixed inset-x-0 top-0 z-[950] border-b border-slate-800/80 bg-[#070B12]/92 px-3 py-2 backdrop-blur-xl md:h-14 md:px-4 md:py-0">
        <div className="flex flex-col gap-2 md:h-full md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-sm font-bold tracking-tight text-slate-100 sm:text-base whitespace-nowrap shrink-0">
              DÜNYA CANLI HAVA XƏRİTƏSİ
            </h1>

            <button
              type="button"
              onClick={loadGlobalData}
              disabled={isGlobalLoading}
              className="flex md:hidden h-8 items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0D1424] px-2.5 text-xs font-medium text-slate-200 disabled:opacity-60"
              aria-label="Məlumatları yenilə"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-cyan-400 ${
                  isGlobalLoading ? 'animate-spin' : ''
                }`}
              />
              <span>Yenilə</span>
            </button>
          </div>

          <div className="flex-1 md:max-w-xl">
            <SearchBar
              onSelectLocation={handleSelectSearchLocation}
              onResetWorldView={handleResetWorldView}
              onLocateUser={handleLocateUser}
              isLocating={isLocating}
            />
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadGlobalData}
              disabled={isGlobalLoading}
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-700/80 bg-[#0D1424] px-3.5 text-xs font-medium text-slate-100 transition-colors hover:border-cyan-500/60 hover:text-cyan-300 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-cyan-400 ${
                  isGlobalLoading ? 'animate-spin' : ''
                }`}
              />
              <span>{isGlobalLoading ? 'Yenilənir...' : 'Yenilə'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="h-full w-full pt-[92px] md:pt-14">
        <WorldWeatherMap
          baseMap={baseMap}
          activeLayer={activeLayer}
          showWindFlow={showWindFlow}
          gridMatrix={gridMatrix}
          cities={cities}
          storms={storms}
          rainViewer={rainViewer}
          radarFrameIndex={radarFrameIndex}
          satelliteFrameIndex={satelliteFrameIndex}
          selectedCoords={selectedCoords}
          flyToTarget={flyToTarget}
          onMapClick={handleMapClick}
          onHoverProbe={setHoverProbe}
          onSelectStorm={handleSelectStorm}
        />
      </main>

      {globalError && (
        <div className="fixed left-1/2 top-24 z-[960] -translate-x-1/2 rounded-xl border border-rose-500/40 bg-rose-950/90 px-4 py-2 text-xs text-rose-100 shadow-xl backdrop-blur-md">
          {globalError}
        </div>
      )}

      <div className="fixed left-3 right-3 top-[98px] z-[860] md:left-4 md:right-auto md:top-16">
        <LayerControls
          activeLayer={activeLayer}
          onChangeLayer={setActiveLayer}
          showWindFlow={showWindFlow}
          onToggleWindFlow={() => setShowWindFlow((prev) => !prev)}
          baseMap={baseMap}
          onChangeBaseMap={setBaseMap}
          stormCount={storms.length}
        />
      </div>

      {hoverProbe && (
        <div className="pointer-events-none fixed left-[228px] top-16 z-[840] hidden lg:flex items-center gap-3 rounded-xl border border-slate-800/90 bg-[#0B111E]/90 px-3 py-2 text-xs backdrop-blur-md">
          <span className="font-mono-tabular text-slate-400">
            {hoverProbe.lat.toFixed(2)}°, {hoverProbe.lon.toFixed(2)}°
          </span>
          <span className="text-slate-700">|</span>
          <span className="font-mono-tabular font-semibold text-amber-300">
            {hoverProbe.temperature.toFixed(1)}°C
          </span>
          <span className="font-mono-tabular text-cyan-300">
            {Math.round(hoverProbe.windSpeed)} km/s ({getDirectionAz(hoverProbe.windDirection).short})
          </span>
          <span className="font-mono-tabular text-slate-300">
            {Math.round(hoverProbe.pressure)} hPa
          </span>
          <span className="font-mono-tabular text-emerald-300">
            {Math.round(hoverProbe.humidity)}%
          </span>
        </div>
      )}

      <div className="fixed bottom-4 left-3 z-[850] flex items-end gap-2.5 md:left-4">
        <CompassRose
          windDirection={activeCompassWindDir}
          windSpeed={activeCompassWindSpeed}
          locationName={activeCompassName}
        />
        <div className="hidden sm:block">
          <LayerLegend activeLayer={activeLayer} />
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 z-[860] -translate-x-1/2 hidden md:block">
        <TimelinePlayer
          activeLayer={activeLayer}
          frames={activeTimelineFrames}
          frameIndex={activeTimelineIdx}
          isPlaying={isPlayingTimeline}
          onTogglePlay={() => setIsPlayingTimeline((p) => !p)}
          onChangeIndex={(idx) => {
            setIsPlayingTimeline(false);
            if (activeLayer === 'precipitation') setRadarFrameIndex(idx);
            else if (activeLayer === 'clouds') setSatelliteFrameIndex(idx);
          }}
        />
      </div>

      <ForecastPanel
        weather={selectedWeather}
        isLoading={isLocationLoading}
        error={locationError}
        storms={storms}
        onSelectStorm={handleSelectStorm}
        isOpen={isPanelOpen}
        onToggleOpen={() => setIsPanelOpen((prev) => !prev)}
        onCloseMobile={() => setIsPanelOpen(false)}
      />
    </div>
  );
}
