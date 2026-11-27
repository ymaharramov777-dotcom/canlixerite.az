import { useEffect, useRef, useState } from 'react';
import { Globe2, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { searchLocations } from '../services/weatherApi';
import type { GeocodingResult } from '../types/weather';

interface SearchBarProps {
  onSelectLocation: (lat: number, lon: number, name: string, country?: string) => void;
  onResetWorldView: () => void;
  onLocateUser: () => void;
  isLocating: boolean;
}

const POPULAR_CITIES: Array<{
  name: string;
  country: string;
  lat: number;
  lon: number;
}> = [
  { name: 'Bakı', country: 'Azərbaycan', lat: 40.4093, lon: 49.8671 },
  { name: 'Gəncə', country: 'Azərbaycan', lat: 40.6828, lon: 46.3606 },
  { name: 'İstanbul', country: 'Türkiyə', lat: 41.0082, lon: 28.9784 },
  { name: 'London', country: 'Böyük Britaniya', lat: 51.5074, lon: -0.1278 },
  { name: 'Nyu-York', country: 'ABŞ', lat: 40.7128, lon: -74.006 },
  { name: 'Tokio', country: 'Yaponiya', lat: 35.6762, lon: 139.6503 },
  { name: 'Dubay', country: 'BƏƏ', lat: 25.2048, lon: 55.2708 },
];

export function SearchBar({
  onSelectLocation,
  onResetWorldView,
  onLocateUser,
  isLocating,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchLocations(trimmed);
        if (!cancelled) {
          setResults(res);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handlePick = (lat: number, lon: number, name: string, country?: string) => {
    onSelectLocation(lat, lon, name, country);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex w-full items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Ölkə və ya şəhər axtarın (məs: Bakı, Paris, Tokio)..."
          className="h-10 w-full rounded-lg border border-slate-700/80 bg-[#0D1424]/95 pl-9 pr-8 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          aria-label="Ölkə və ya şəhər axtar"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-200"
            aria-label="Axtarışı təmizlə"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {isOpen && (
          <div className="weather-scroll absolute left-0 right-0 top-11 z-[1000] max-h-80 overflow-y-auto rounded-lg border border-slate-700/90 bg-[#0B111E]/98 py-1.5 shadow-2xl backdrop-blur-md">
            {query.trim().length < 2 ? (
              <div>
                <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-400">
                  Məşhur istiqamətlər
                </div>
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() =>
                      handlePick(city.lat, city.lon, city.name, city.country)
                    }
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      {city.name}
                    </span>
                    <span className="text-xs text-slate-400">{city.country}</span>
                  </button>
                ))}
              </div>
            ) : isSearching ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                Axtarılır...
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400">
                Nəticə tapılmadı. Başqa şəhər və ya ölkə adı sınayın.
              </div>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handlePick(
                      item.latitude,
                      item.longitude,
                      item.name,
                      item.country
                    )
                  }
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70"
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-medium text-slate-100">
                      {item.name}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {[item.admin1, item.country].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span className="font-mono-tabular shrink-0 text-[11px] text-slate-400">
                    {item.latitude.toFixed(1)}°, {item.longitude.toFixed(1)}°
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onLocateUser}
        disabled={isLocating}
        title="Mənim yerim"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0D1424]/95 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/60 hover:text-cyan-300 disabled:opacity-60 whitespace-nowrap"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
        ) : (
          <LocateFixed className="h-4 w-4 text-cyan-400" />
        )}
        <span className="hidden sm:inline">Mənim yerim</span>
      </button>

      <button
        type="button"
        onClick={onResetWorldView}
        title="Bütün dünyanı göstər"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0D1424]/95 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/60 hover:text-cyan-300 whitespace-nowrap"
      >
        <Globe2 className="h-4 w-4 text-cyan-400" />
        <span className="hidden md:inline">Tam dünya</span>
      </button>
    </div>
  );
}
