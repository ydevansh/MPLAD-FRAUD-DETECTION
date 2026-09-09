import { useState, useEffect, useMemo } from 'react';
import { LocateFixed, MapPin, AlertCircle, RefreshCw, Layers, Compass, ExternalLink } from 'lucide-react';
import { useGeolocation, distanceKm } from '../hooks/useGeolocation';
import { getProjects } from '../services/api';
import type { Project, ProjectWithDistance, UserLocation } from '../types';
import MapView from '../components/MapView';
import ProjectCard from '../components/ProjectCard';

const PRESET_LOCATIONS: { name: string; state: string; lat: number; lng: number }[] = [
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
];

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '15 km', value: 15 },
  { label: '50 km', value: 50 },
  { label: '150 km', value: 150 },
  { label: 'All', value: 99999 },
];

export default function Nearby() {
  const { state: geoState, requestLocation } = useGeolocation();
  const [manualLocation, setManualLocation] = useState<UserLocation | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');

  // Load all projects on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingProjects(true);
        const res = await getProjects({ limit: 100 } as any);
        if (!cancelled && res.data) {
          setProjects(res.data);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Effective location: either manual override or detected geolocation
  const effectiveLocation: UserLocation | null = useMemo(() => {
    if (manualLocation) return manualLocation;
    if (geoState.status === 'success') return geoState.location;
    return null;
  }, [manualLocation, geoState]);

  // Compute distances and sort projects
  const sortedProjectsWithDistance: ProjectWithDistance[] = useMemo(() => {
    if (!effectiveLocation || projects.length === 0) return [];

    return projects
      .map((proj) => {
        const dist = distanceKm(
          effectiveLocation.latitude,
          effectiveLocation.longitude,
          proj.latitude,
          proj.longitude
        );
        return { ...proj, distance: dist };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [effectiveLocation, projects]);

  // Filter by selected radius
  const filteredProjects = useMemo(() => {
    return sortedProjectsWithDistance.filter((p) => p.distance <= selectedRadius);
  }, [sortedProjectsWithDistance, selectedRadius]);

  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setManualLocation({
      latitude: preset.lat,
      longitude: preset.lng,
      accuracy: 50,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
          <Compass size={16} />
          <span>Geo-Spatial Transparency</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Find MPLADS Projects Near You
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl text-sm sm:text-base">
          Detect sanctioned works and civic development projects around your current location or explore key districts across India.
        </p>
      </div>

      {/* Geolocation Prompt / Status Bar */}
      {!effectiveLocation && geoState.status === 'idle' && (
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 mb-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-medium mb-4">
              <LocateFixed size={14} className="text-blue-300" />
              <span>Location-Aware Verification</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Discover Development in Your Neighborhood
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
              Allow location access to view verified project sites near you with exact distances. Your device coordinates remain in your browser and are never uploaded or tracked.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                onClick={requestLocation}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 flex items-center gap-2 text-sm"
              >
                <LocateFixed size={16} />
                <span>Use My Current Location</span>
              </button>
            </div>

            <div className="border-t border-slate-700/60 pt-5">
              <p className="text-xs text-slate-400 mb-3 font-medium">
                Or test with sample constituency coordinates:
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleSelectPreset(loc)}
                    className="bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <MapPin size={12} className="text-blue-400" />
                    <span>{loc.name}, {loc.state}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Geo */}
      {geoState.status === 'loading' && (
        <div className="bg-white border border-blue-100 rounded-2xl p-8 mb-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 text-base mb-1">Detecting GPS Coordinates...</h3>
          <p className="text-xs text-slate-500">Please grant browser permission to read your location.</p>
        </div>
      )}

      {/* Error Geo */}
      {geoState.status === 'error' && !manualLocation && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Location Detection Unavailable</h3>
              <p className="text-xs text-amber-800 mb-4">{geoState.message}</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={requestLocation}
                  className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  <span>Retry Detection</span>
                </button>
                <span className="text-xs text-amber-700">or select a representative district:</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleSelectPreset(loc)}
                    className="bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <MapPin size={12} className="text-amber-600" />
                    <span>{loc.name} ({loc.state})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* When Location is Available */}
      {effectiveLocation && (
        <>
          {/* Active Location Info & Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <LocateFixed size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Reference Point Set
                  </span>
                  {manualLocation ? (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                      Preset Location
                    </span>
                  ) : (
                    <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full border border-green-200">
                      Live GPS
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Lat: {effectiveLocation.latitude.toFixed(4)}, Lng: {effectiveLocation.longitude.toFixed(4)}
                  {effectiveLocation.accuracy ? ` (±${Math.round(effectiveLocation.accuracy)}m)` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Radius filter buttons */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedRadius(opt.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedRadius === opt.value
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Reset or Change */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setManualLocation(null);
                    requestLocation();
                  }}
                  title="Detect GPS again"
                  className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preset quick switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap">Switch location:</span>
            {PRESET_LOCATIONS.map((loc) => (
              <button
                key={loc.name}
                onClick={() => handleSelectPreset(loc)}
                className={`px-2.5 py-1 rounded-full border text-xs whitespace-nowrap transition-colors ${
                  manualLocation &&
                  Math.abs(manualLocation.latitude - loc.lat) < 0.01 &&
                  Math.abs(manualLocation.longitude - loc.lng) < 0.01
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-800">
              Found{' '}
              <span className="text-blue-700 font-bold">{filteredProjects.length}</span>{' '}
              {filteredProjects.length === 1 ? 'project' : 'projects'}{' '}
              {selectedRadius < 90000 ? `within ${selectedRadius} km` : 'in total'}
            </p>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setViewMode('both')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'both' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-500'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {filteredProjects.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center my-6">
              <MapPin size={36} className="text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base mb-1">No Projects Within {selectedRadius} km</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                There are no prototype projects within this radius of your selected coordinates. Try widening your search radius or exploring another state.
              </p>
              <button
                onClick={() => setSelectedRadius(99999)}
                className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                View All Projects Sorted by Distance
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Map Section */}
              {(viewMode === 'both' || viewMode === 'map') && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                  <MapView
                    userLocation={effectiveLocation}
                    projects={filteredProjects}
                    height={viewMode === 'map' ? '600px' : '420px'}
                  />
                  <div className="mt-2.5 px-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Your Location
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> Low Risk
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span> Medium
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> High
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Critical
                      </span>
                    </div>
                    <span>Click on any marker to see details</span>
                  </div>
                </div>
              )}

              {/* Cards List Section */}
              {(viewMode === 'both' || viewMode === 'list') && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4">
                    Closest Projects by Distance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProjects.map((proj) => (
                      <ProjectCard
                        key={proj._id || proj.projectId}
                        project={proj}
                        distance={proj.distance}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
