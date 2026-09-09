import { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/ProjectCard';
import type { ProjectFilters, ProjectStatus, RiskLevel } from '../types';

const STATUSES: ProjectStatus[]  = ['Sanctioned', 'Ongoing', 'Completed', 'Delayed'];
const RISK_LEVELS: RiskLevel[]   = ['Low', 'Medium', 'High', 'Critical'];

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function Projects() {
  const [search, setSearch]   = useState('');
  const [filters, setFilters] = useState<Omit<ProjectFilters, 'search'>>({});
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters: ProjectFilters = { ...filters, ...(search ? { search } : {}) };
  const { projects, filters: filterOptions, total, loading, error } = useProjects(activeFilters);

  const setFilter = useCallback((key: keyof typeof filters, val: string) => {
    setFilters(f => ({ ...f, [key]: val || undefined }));
  }, []);

  const clearAll = () => { setSearch(''); setFilters({}); };
  const hasActive = search || Object.values(filters).some(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Explore MPLADS Projects</h1>
        <p className="text-slate-500">Find projects, check their progress and see how public funds are being used.</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            ⚠️ Prototype Data — not real government records
          </span>
        </div>
      </div>

      {/* Search + filter toggle row */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by project name, ID, district or location..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(s => !s)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}`}>
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
        </button>
        {hasActive && (
          <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition-colors">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Select label="State"        value={filters.state || ''}        options={filterOptions?.states        || []} onChange={v => setFilter('state', v)}        />
          <Select label="District"     value={filters.district || ''}     options={filterOptions?.districts     || []} onChange={v => setFilter('district', v)}     />
          <Select label="Constituency" value={filters.constituency || ''} options={filterOptions?.constituencies|| []} onChange={v => setFilter('constituency', v)} />
          <Select label="Category"     value={filters.category || ''}     options={filterOptions?.categories    || []} onChange={v => setFilter('category', v)}     />
          <Select label="Status"       value={filters.status || ''}       options={STATUSES}                          onChange={v => setFilter('status', v)}        />
          <Select label="Risk Level"   value={filters.riskLevel || ''}    options={RISK_LEVELS}                       onChange={v => setFilter('riskLevel', v)}     />
        </div>
      )}

      {/* Results count */}
      {!loading && !error && (
        <p className="text-sm text-slate-500 mb-4">
          {total === 0 ? 'No projects found' : `${total} project${total !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin text-blue-600" />
          Loading projects...
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-red-600 font-medium">Unable to load projects.</p>
          <p className="text-slate-400 text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <Search size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="font-medium">No projects found.</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(p => <ProjectCard key={p._id} project={p} />)}
        </div>
      )}
    </div>
  );
}
