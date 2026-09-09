import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertTriangle,
  Building2,
  MapPin,
  ChevronRight,
  ExternalLink,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  ArrowUpRight,
  IndianRupee,
  Info,
  Camera,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  getAdminSummary,
  getAdminAttention,
  getAdminProjects,
  getAdminAnomalies,
  getAdminRisk,
  getAdminCitizenReports,
} from '../services/api';
import type {
  AdminSummaryData,
  AttentionProject,
  Project,
  AdminProjectsFilters,
  AdminAnomaliesSummary,
  PortfolioRiskData,
  RiskScoreLevel,
  CitizenReport,
  AdminCitizenReportsMetrics,
} from '../types';

function fmtCurrency(lakhs: number | undefined | null): string {
  if (lakhs === undefined || lakhs === null || isNaN(lakhs)) return '₹0';
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(2)} Cr`;
  return `₹${lakhs.toFixed(2)} L`;
}

export default function AuthorityDashboard() {
  const [summary, setSummary]       = useState<AdminSummaryData | null>(null);
  const [attention, setAttention]   = useState<AttentionProject[]>([]);
  const [projects, setProjects]     = useState<any[]>([]);
  const [anomaliesSummary, setAnomaliesSummary] = useState<AdminAnomaliesSummary | null>(null);
  const [anomalySeverityFilter, setAnomalySeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioRiskData | null>(null);
  const [riskLevelFilter, setRiskLevelFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [minRiskScore, setMinRiskScore] = useState<number>(0);
  const [adminReports, setAdminReports] = useState<CitizenReport[]>([]);
  const [reportsMetrics, setReportsMetrics] = useState<AdminCitizenReportsMetrics | null>(null);
  const [filtersData, setFiltersData] = useState<{
    states: string[];
    districts: string[];
    categories: string[];
  }>({ states: [], districts: [], categories: [] });

  const [loading, setLoading]       = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Table Filters State
  const [search, setSearch]                                 = useState('');
  const [selectedState, setSelectedState]                   = useState('All');
  const [selectedDistrict, setSelectedDistrict]             = useState('All');
  const [selectedCategory, setSelectedCategory]             = useState('All');
  const [selectedStatus, setSelectedStatus]                 = useState('All');
  const [selectedTimeline, setSelectedTimeline]             = useState('All');
  const [selectedGap, setSelectedGap]                       = useState('All');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sumRes, attRes, projRes, anomRes, riskRes, citRes] = await Promise.all([
        getAdminSummary(),
        getAdminAttention(),
        getAdminProjects(),
        getAdminAnomalies().catch(() => null),
        getAdminRisk().catch(() => null),
        getAdminCitizenReports().catch(() => null),
      ]);

      if (sumRes.data) setSummary(sumRes.data);
      if (attRes.data) setAttention(attRes.data);
      if (projRes.data) setProjects(projRes.data);
      if (anomRes && anomRes.data) setAnomaliesSummary(anomRes.data);
      if (riskRes && riskRes.data) setPortfolioRisk(riskRes.data);
      if (citRes && citRes.data) {
        setAdminReports(citRes.data);
        if (citRes.metrics) setReportsMetrics(citRes.metrics);
      }
      if (projRes.filters) {
        setFiltersData({
          states: projRes.filters.states || [],
          districts: projRes.filters.districts || [],
          categories: projRes.filters.categories || [],
        });
      }
    } catch (err: any) {
      console.error('[AuthorityDashboard:loadData]', err);
      setError(err.message || 'Unable to connect to administrative monitoring services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters to projects table
  const applyTableFilters = useCallback(async () => {
    try {
      setTableLoading(true);
      const query: AdminProjectsFilters = {};
      if (search.trim()) query.search = search.trim();
      if (selectedState !== 'All') query.state = selectedState;
      if (selectedDistrict !== 'All') query.district = selectedDistrict;
      if (selectedCategory !== 'All') query.category = selectedCategory;
      if (selectedStatus !== 'All') query.status = selectedStatus;
      if (selectedTimeline !== 'All') query.timelineStatus = selectedTimeline;
      if (selectedGap !== 'All') query.progressSpendingStatus = selectedGap;

      const res = await getAdminProjects(query);
      if (res.data) setProjects(res.data);
    } catch (err: any) {
      console.error('[applyTableFilters]', err);
    } finally {
      setTableLoading(false);
    }
  }, [search, selectedState, selectedDistrict, selectedCategory, selectedStatus, selectedTimeline, selectedGap]);

  useEffect(() => {
    const handler = setTimeout(() => {
      applyTableFilters();
    }, 250);
    return () => clearTimeout(handler);
  }, [applyTableFilters]);

  const resetFilters = () => {
    setSearch('');
    setSelectedState('All');
    setSelectedDistrict('All');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedTimeline('All');
    setSelectedGap('All');
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 text-slate-500">
        <RefreshCw size={28} className="animate-spin text-blue-700" />
        <span className="text-sm font-medium">Loading Authority Monitoring Intelligence...</span>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Authority Dashboard Error</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* ── 1. HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
              <ShieldAlert size={14} /> Prototype Monitoring System
            </span>
            <span className="text-xs text-slate-400">SIH Problem Statement SIH26102</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Authority Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Monitor MPLADS projects and identify works requiring closer administrative checking or priority field inspection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh database metrics"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* ── 2. SUMMARY KPI CARDS (8 cards) ───────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {/* Total Projects */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">Total Projects</span>
            <span className="text-2xl font-extrabold text-slate-900">{summary.totalProjects}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Across 5 States</span>
          </div>

          {/* Ongoing */}
          <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm bg-blue-50/30">
            <span className="text-xs text-blue-700 font-medium block mb-1">Ongoing</span>
            <span className="text-2xl font-extrabold text-blue-900">{summary.ongoingProjects}</span>
            <span className="text-[10px] text-blue-600 block mt-1">In progress</span>
          </div>

          {/* Completed */}
          <div className="bg-white border border-green-200 rounded-2xl p-4 shadow-sm bg-green-50/30">
            <span className="text-xs text-green-700 font-medium block mb-1">Completed</span>
            <span className="text-2xl font-extrabold text-green-900">{summary.completedProjects}</span>
            <span className="text-[10px] text-green-600 block mt-1">100% delivered</span>
          </div>

          {/* Delayed */}
          <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm bg-red-50/30">
            <span className="text-xs text-red-700 font-medium block mb-1">Delayed</span>
            <span className="text-2xl font-extrabold text-red-900">{summary.delayedProjects}</span>
            <span className="text-[10px] text-red-600 block mt-1">Past deadline</span>
          </div>

          {/* Progress-Spending Gap */}
          <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm bg-orange-50/40">
            <span className="text-xs text-orange-700 font-medium block mb-1">Divergence Gap</span>
            <span className="text-2xl font-extrabold text-orange-900">{summary.progressSpendingGapProjects}</span>
            <span className="text-[10px] text-orange-600 block mt-1">&gt;30 pt spending gap</span>
          </div>

          {/* Sanctioned Amount */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">Sanctioned</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900">{fmtCurrency(summary.totalSanctionedAmount)}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Total allocation</span>
          </div>

          {/* Total Expenditure */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">Expenditure</span>
            <span className="text-lg sm:text-xl font-bold text-amber-900">{fmtCurrency(summary.totalExpenditure)}</span>
            <span className="text-[10px] text-amber-600 block mt-1">Disbursed funds</span>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">Remaining</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-900">{fmtCurrency(summary.totalRemainingAmount)}</span>
            <span className="text-[10px] text-emerald-600 block mt-1">Unspent balance</span>
          </div>
        </div>
      )}

      {/* ── 2B. PROJECT LOCATION COVERAGE (Phase 7 Geospatial) ────────────────── */}
      {summary?.locationCoverage && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Project Location Coverage</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Geospatial Readiness
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official GPS coordinate completeness for field audits and citizen proximity verification.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">
                <strong className="text-slate-900 text-sm font-bold">{summary.locationCoverage.mappedProjects}</strong> projects mapped
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${summary.locationCoverage.missingCoordinatesProjects > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
              <span className="text-slate-600">
                <strong className="text-slate-900 text-sm font-bold">{summary.locationCoverage.missingCoordinatesProjects}</strong> missing coordinates
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-slate-500">Coverage:</span>
              <span className="font-extrabold text-blue-700 text-sm">{summary.locationCoverage.coveragePercentage}%</span>
            </div>

            <Link
              to="/nearby"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              View Geo Map &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ── 3. RISK OVERVIEW & HIGH PRIORITY PROJECTS (Phase 6) ────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    Risk Overview & Verification Priorities
                  </h2>
                  <span className="text-[11px] bg-red-50 text-red-700 border border-red-200 font-bold px-2 py-0.5 rounded-full">
                    Score Scale: 0–100
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Automated explainable monitoring indicator calibrating field inspection priorities based on multi-factor data signals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Dynamic Risk Level Cards */}
        {portfolioRisk && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
              <span className="text-xs text-emerald-800 font-semibold block mb-1">LOW (0–30)</span>
              <span className="text-2xl font-extrabold text-emerald-900">
                {portfolioRisk.riskDistribution.low} Projects
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">Routine monitoring</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
              <span className="text-xs text-amber-800 font-semibold block mb-1">MEDIUM (31–60)</span>
              <span className="text-2xl font-extrabold text-amber-900">
                {portfolioRisk.riskDistribution.medium} Projects
              </span>
              <span className="text-[10px] text-amber-700 block mt-0.5">Closer review advised</span>
            </div>

            <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-4">
              <span className="text-xs text-orange-800 font-semibold block mb-1">HIGH (61–80)</span>
              <span className="text-2xl font-extrabold text-orange-900">
                {portfolioRisk.riskDistribution.high} Projects
              </span>
              <span className="text-[10px] text-orange-700 block mt-0.5">Priority review</span>
            </div>

            <div className="bg-red-50/60 border border-red-200 rounded-2xl p-4">
              <span className="text-xs text-red-800 font-semibold block mb-1">CRITICAL (81–100)</span>
              <span className="text-2xl font-extrabold text-red-900">
                {portfolioRisk.riskDistribution.critical} Projects
              </span>
              <span className="text-[10px] text-red-700 block mt-0.5">Field inspection queue</span>
            </div>
          </div>
        )}

        {/* Visual Chart + Priority Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recharts Chart: Projects by Risk Level */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" />
                Projects by Risk Level
              </h3>
              <p className="text-xs text-slate-400 mb-4">Portfolio distribution across 4 monitoring tiers</p>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Low', count: portfolioRisk?.riskDistribution.low ?? 0, fill: '#10b981' },
                    { name: 'Medium', count: portfolioRisk?.riskDistribution.medium ?? 0, fill: '#f59e0b' },
                    { name: 'High', count: portfolioRisk?.riskDistribution.high ?? 0, fill: '#f97316' },
                    { name: 'Critical', count: portfolioRisk?.riskDistribution.critical ?? 0, fill: '#ef4444' },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(v: any) => [`${v} Projects`, 'Total']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#f97316" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around text-[10px] text-slate-400 pt-2 border-t border-slate-200 mt-2">
              <span className="text-emerald-700 font-semibold">Low (0-30)</span>
              <span className="text-amber-700 font-semibold">Med (31-60)</span>
              <span className="text-orange-700 font-semibold">High (61-80)</span>
              <span className="text-red-700 font-semibold">Crit (81-100)</span>
            </div>
          </div>

          {/* High Priority Projects Surveillance Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setRiskLevelFilter(lvl)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      riskLevelFilter === lvl
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl === 'ALL' ? 'All Tiers' : lvl}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Min Score:</span>
                <select
                  value={minRiskScore}
                  onChange={(e) => setMinRiskScore(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value={0}>All Scores (0+)</option>
                  <option value={31}>Medium+ (31+)</option>
                  <option value={61}>High+ (61+)</option>
                  <option value={81}>Critical Only (81+)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-center">Level</th>
                    <th className="py-2.5 px-3">Primary Factor</th>
                    <th className="py-2.5 px-3">Recommended Action</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {portfolioRisk?.projects
                    .filter((p) => {
                      if (riskLevelFilter !== 'ALL' && p.riskLevel !== riskLevelFilter) return false;
                      if (p.riskScore < minRiskScore) return false;
                      return true;
                    })
                    .slice(0, 7)
                    .map((p) => (
                      <tr key={p.projectId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 max-w-[200px]">
                          <span className="font-mono text-[10px] font-bold text-slate-500 mr-1.5">{p.projectId}</span>
                          <span className="font-semibold text-slate-900 line-clamp-1">{p.name}</span>
                          <span className="text-[10px] text-slate-400">{p.district}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-extrabold text-sm font-mono text-slate-900">{p.riskScore}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            p.riskLevel === 'CRITICAL'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : p.riskLevel === 'HIGH'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : p.riskLevel === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {p.riskLevel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[180px]">
                          <span className="line-clamp-1 font-medium text-slate-800">{p.topReason}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-600 font-medium">{p.recommendedAction}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            to={`/projects/${p.projectId}`}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-semibold"
                          >
                            View <ArrowUpRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Operational Disclaimer */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
          <Info size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Operational Disclaimer: </span>
            <span>
              {portfolioRisk?.disclaimer ||
                'The risk score is an automated monitoring indicator based on available project data. It is not proof of fraud. Final verification and decisions remain with authorities.'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. PRIORITY FIELD VERIFICATION QUEUE ("Projects Needing Attention") ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Projects Needing Attention</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Surfaced by deterministic Phase 3 intelligence rules (significant spending gap, delayed deadline, or data discrepancy).
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-orange-100 text-orange-800 rounded-full border border-orange-200">
            {attention.length} Priority Flagged Works
          </span>
        </div>

        {attention.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-sm">No projects currently require additional monitoring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attention.slice(0, 6).map((item) => (
              <div
                key={item.projectId}
                className="border border-orange-200 bg-orange-50/20 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.projectId}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'Delayed'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1.5">
                    {item.name}
                  </h3>

                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {item.district}, {item.state} ({item.category})
                  </p>

                  {/* Metrics Snapshot */}
                  <div className="grid grid-cols-2 gap-2 bg-white border border-slate-200 rounded-xl p-2.5 mb-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Physical Progress</span>
                      <span className="font-bold text-slate-800">{item.physicalProgress}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Expended Funds</span>
                      <span className="font-bold text-amber-700">{item.expenditurePercentage}%</span>
                    </div>
                  </div>

                  {/* Reasons List */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Monitoring Signals:
                    </span>
                    {item.reasons.map((r, i) => (
                      <div
                        key={i}
                        className="text-xs bg-white text-orange-900 border border-orange-200 px-2.5 py-1 rounded-lg flex items-start gap-1.5 font-medium"
                      >
                        <AlertCircle size={13} className="text-orange-600 flex-shrink-0 mt-0.5" />
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to={`/projects/${item.projectId}`}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Review Project Details <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. AI-POWERED ANOMALY DETECTION ENGINE (Phase 5) ──────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    AI-Assisted Anomaly Detection Engine
                  </h2>
                  <span className="text-[11px] bg-red-50 text-red-700 border border-red-200 font-bold px-2 py-0.5 rounded-full">
                    Surveillance Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Algorithmic integrity checks identifying spending mismatches, timeline delays, cost outliers, data inconsistencies, and duplicate works.
                </p>
              </div>
            </div>
          </div>

          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setAnomalySeverityFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                anomalySeverityFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Flagged ({anomaliesSummary?.projectsWithAnomalies ?? 0})
            </button>
            <button
              onClick={() => setAnomalySeverityFilter('HIGH')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                anomalySeverityFilter === 'HIGH'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-700'
              }`}
            >
              🔴 High ({anomaliesSummary?.highSeveritySignals ?? 0})
            </button>
            <button
              onClick={() => setAnomalySeverityFilter('MEDIUM')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                anomalySeverityFilter === 'MEDIUM'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              🟡 Medium ({anomaliesSummary?.mediumSeveritySignals ?? 0})
            </button>
          </div>
        </div>

        {/* 4 Mini-KPIs for Anomaly Surveillance */}
        {anomaliesSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 font-medium block mb-1">Portfolio Scanned</span>
              <span className="text-xl font-bold text-slate-900">{anomaliesSummary.totalAnalyzed}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Total works checked</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
              <span className="text-xs text-amber-800 font-medium block mb-1">Projects Flagged</span>
              <span className="text-xl font-bold text-amber-900">{anomaliesSummary.projectsWithAnomalies}</span>
              <span className="text-[10px] text-amber-700 block mt-0.5">One or more signals</span>
            </div>

            <div className="bg-red-50/60 border border-red-200 rounded-2xl p-4">
              <span className="text-xs text-red-800 font-medium block mb-1">High Severity Signals</span>
              <span className="text-xl font-bold text-red-700">{anomaliesSummary.highSeveritySignals}</span>
              <span className="text-[10px] text-red-600 block mt-0.5">Immediate inspection</span>
            </div>

            <div className="bg-amber-50/30 border border-amber-200 rounded-2xl p-4">
              <span className="text-xs text-amber-700 font-medium block mb-1">Medium Severity Signals</span>
              <span className="text-xl font-bold text-amber-800">{anomaliesSummary.mediumSeveritySignals}</span>
              <span className="text-[10px] text-amber-600 block mt-0.5">Desk review advised</span>
            </div>
          </div>
        )}

        {/* Anomaly Projects Surveillance Table */}
        {!anomaliesSummary || anomaliesSummary.projects.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-sm">No anomaly monitoring signals currently flagged in the portfolio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Project & Location</th>
                  <th className="py-3 px-4">Category & Status</th>
                  <th className="py-3 px-4 text-center">Progress vs Spent</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4">Flagged Anomalies</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {anomaliesSummary.projects
                  .filter((p) => {
                    if (anomalySeverityFilter === 'ALL') return true;
                    return p.highestSeverity === anomalySeverityFilter;
                  })
                  .map((p) => (
                    <tr key={p.projectId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-slate-600 mb-0.5">{p.projectId}</div>
                        <div className="font-semibold text-slate-900 text-sm line-clamp-1 max-w-xs">{p.projectName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{p.district}, {p.state}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-slate-800">{p.category}</div>
                        <div className="text-slate-400 mt-0.5">{p.status}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-block text-xs">
                          <span className="font-bold text-blue-700">{p.physicalProgress}%</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="font-bold text-amber-700">{p.expenditurePercentage}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Prog / Spend</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          p.highestSeverity === 'HIGH'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : p.highestSeverity === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {p.highestSeverity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-sm">
                          {p.anomalies.slice(0, 2).map((a, aIdx) => (
                            <div key={aIdx} className="text-xs flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                a.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'
                              }`} />
                              <span className="font-medium text-slate-800 line-clamp-1">{a.title}</span>
                            </div>
                          ))}
                          {p.anomalies.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{p.anomalies.length - 2} more signal(s)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/projects/${p.projectId}`}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Audit <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mandatory Disclaimer */}
        <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
          <Info size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Operational Disclaimer: </span>
            <span>
              {anomaliesSummary?.projects[0]?.disclaimer ||
                'These are automated monitoring signals, not proof of fraud. Final verification remains with authorities.'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4B. CITIZEN VERIFICATION & GROUND EVIDENCE SURVEILLANCE (Phase 8 & 9) ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Camera size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Citizen Verification & Ground Evidence Surveillance
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Field Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time ground truth reports submitted by citizens containing photos, GPS proximity, and feedback.
            </p>
          </div>
        </div>

        {/* 4 Citizen Evidence KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-xs">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block mb-1">Total Ground Reports</span>
            <span className="text-2xl font-extrabold text-slate-900">{reportsMetrics?.totalReports || adminReports.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Citizen submissions</span>
          </div>

          <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-200">
            <span className="text-xs text-indigo-700 font-medium block mb-1">Projects Monitored</span>
            <span className="text-2xl font-extrabold text-indigo-900">
              {reportsMetrics?.projectsWithReports || new Set(adminReports.map((r) => r.projectId)).size}
            </span>
            <span className="text-[10px] text-indigo-600 block mt-0.5">With citizen ground reports</span>
          </div>

          <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200">
            <span className="text-xs text-emerald-700 font-medium block mb-1">Reports with GPS</span>
            <span className="text-2xl font-extrabold text-emerald-900">
              {reportsMetrics?.reportsWithGPS || adminReports.filter((r) => r.latitude).length}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Geolocated field checks</span>
          </div>

          <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-200">
            <span className="text-xs text-blue-700 font-medium block mb-1">Reports with Photos</span>
            <span className="text-2xl font-extrabold text-blue-900">
              {reportsMetrics?.reportsWithPhotos || adminReports.filter((r) => r.imageUrl).length}
            </span>
            <span className="text-[10px] text-blue-600 block mt-0.5">Site photographs attached</span>
          </div>
        </div>

        {/* Citizen Evidence Surveillance Table */}
        {adminReports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
            No citizen ground verification reports have been recorded in the database yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Project ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Observation / Feedback</th>
                  <th className="py-3 px-4">GPS Proximity</th>
                  <th className="py-3 px-4">Image Similarity</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminReports.slice(0, 8).map((rep) => (
                  <tr key={rep.reportId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {rep.reportId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <Link to={`/projects/${rep.projectId}`} className="hover:underline font-semibold text-slate-900">
                        {rep.projectId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {rep.category}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      "{rep.description}"
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full border text-[10px] ${
                          rep.locationStatus === 'VERY_CLOSE' || rep.locationStatus === 'CLOSE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rep.locationStatus === 'UNKNOWN'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {rep.locationStatus ? rep.locationStatus.replace(/_/g, ' ') : 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {rep.imageSimilarity && rep.imageSimilarity.result !== 'NONE' ? (
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full border text-[10px] ${
                            rep.imageSimilarity.result === 'HIGH_SIMILARITY'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {rep.imageSimilarity.result.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(rep.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/projects/${rep.projectId}/evidence`}
                        className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-indigo-200/60"
                      >
                        Review Evidence &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mandatory Disclaimer */}
        <div className="mt-5 p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
          <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-blue-950">Evidence Review Notice: </span>
            Citizen reports provide real-time field observation signals to assist monitoring authorities in prioritizing physical inspections. They do not constitute formal judicial verdicts.
          </div>
        </div>
      </div>

      {/* ── 5. VISUAL CHARTS (3 Recharts) ─────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Chart 1: Project Status Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <PieIcon size={16} className="text-blue-600" /> Projects by Status
            </h3>
            <p className="text-xs text-slate-400 mb-4">Distribution of current execution stages</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(v: any) => [`${v} Projects`, 'Total']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {summary.statusDistribution.map((entry, index) => (
                      <Cell key={`status-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Financial Liquidity Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <IndianRupee size={16} className="text-amber-600" /> Financial Liquidity
            </h3>
            <p className="text-xs text-slate-400 mb-4">Sanctioned vs Expended vs Remaining (₹ Lakhs)</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.financialOverview} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(v: any) => [`₹${v} Lakhs`, 'Amount']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {summary.financialOverview.map((entry, index) => (
                      <Cell key={`fin-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Progress vs Spending Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-600" /> Spending Divergence
            </h3>
            <p className="text-xs text-slate-400 mb-4">Projects grouped by progress-spending gap</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.gapDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(v: any) => [`${v} Projects`, 'Count']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {summary.gapDistribution.map((entry, index) => (
                      <Cell key={`gap-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. DISTRICT OVERVIEW ──────────────────────────────────────────────── */}
      {summary?.districtSummary && summary.districtSummary.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" /> District Overview
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated project portfolio performance and attention signals across districts.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4 text-center">Total Works</th>
                  <th className="py-3 px-4 text-center">Ongoing</th>
                  <th className="py-3 px-4 text-center">Completed</th>
                  <th className="py-3 px-4 text-center">Delayed</th>
                  <th className="py-3 px-4 text-center">Needs Attention</th>
                  <th className="py-3 px-4 text-right">Sanctioned (₹)</th>
                  <th className="py-3 px-4 text-right">Expended (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.districtSummary.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.district}</td>
                    <td className="py-3 px-4">{d.state}</td>
                    <td className="py-3 px-4 text-center font-semibold">{d.totalProjects}</td>
                    <td className="py-3 px-4 text-center text-blue-700">{d.ongoing}</td>
                    <td className="py-3 px-4 text-center text-green-700">{d.completed}</td>
                    <td className="py-3 px-4 text-center">
                      {d.delayed > 0 ? (
                        <span className="text-red-700 font-bold">{d.delayed}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {d.attentionCount > 0 ? (
                        <span className="inline-block bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                          {d.attentionCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{fmtCurrency(d.totalSanctioned)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">{fmtCurrency(d.totalExpenditure)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. COMPREHENSIVE PROJECT MONITORING TABLE ───────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-blue-700" /> All Monitored Projects
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by timeline health, progress-spending gaps, district, and project status.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{projects.length}</strong> matching records
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-3">
          {/* Search Row */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Project ID, Name, District, Constituency..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {/* State */}
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="All">All States</option>
                {filtersData.states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="All">All Districts</option>
                {filtersData.districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {filtersData.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Project Status */}
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Project Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
                <option value="Sanctioned">Sanctioned</option>
              </select>
            </div>

            {/* Timeline Status */}
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Timeline Health</label>
              <select
                value={selectedTimeline}
                onChange={(e) => setSelectedTimeline(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="All">All Timelines</option>
                <option value="ON_TRACK">On Track</option>
                <option value="DELAYED">Delayed</option>
                <option value="DUE_SOON">Due Soon</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Progress-Spending Gap */}
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">Spending Divergence</label>
              <select
                value={selectedGap}
                onChange={(e) => setSelectedGap(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="All">All Divergence</option>
                <option value="ALIGNED">Balanced (Gap &le; 15%)</option>
                <option value="MODERATE_GAP">Moderate Gap (16-30%)</option>
                <option value="SIGNIFICANT_GAP">Significant Gap (&gt; 30%)</option>
              </select>
            </div>
          </div>

          {(search || selectedState !== 'All' || selectedDistrict !== 'All' || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedTimeline !== 'All' || selectedGap !== 'All') && (
            <div className="flex justify-end pt-1">
              <button
                onClick={resetFilters}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Project ID</th>
                <th className="py-3 px-3 min-w-[200px]">Project Name & Category</th>
                <th className="py-3 px-3">District & State</th>
                <th className="py-3 px-3 text-right">Sanctioned</th>
                <th className="py-3 px-3 text-center">Spent %</th>
                <th className="py-3 px-3 text-center">Progress %</th>
                <th className="py-3 px-3 text-center">Divergence Gap</th>
                <th className="py-3 px-3 text-center">Timeline</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                    Updating filtered records...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Search size={28} className="mx-auto mb-2 text-slate-300" />
                    No monitored projects matching the selected query or filters.
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const isSignificant = p.progressSpendingStatus === 'SIGNIFICANT_GAP';
                  const isModerate    = p.progressSpendingStatus === 'MODERATE_GAP';
                  const isDelayed     = p.timelineStatus === 'DELAYED' || p.status === 'Delayed';

                  return (
                    <tr key={p.projectId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {p.projectId}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900 block line-clamp-1">{p.name}</span>
                        <span className="text-[11px] text-slate-400">{p.category}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="block font-medium text-slate-800">{p.district}</span>
                        <span className="text-[11px] text-slate-400">{p.state}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {fmtCurrency(p.sanctionedAmount)}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-amber-700">
                        {p.expenditurePercentage}%
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-blue-700">
                        {p.physicalProgress}%
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isSignificant ? (
                          <span className="inline-block bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                            +{p.progressSpendingDifference} pt Gap
                          </span>
                        ) : isModerate ? (
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
                            +{p.progressSpendingDifference} pts
                          </span>
                        ) : (
                          <span className="inline-block bg-green-50 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-green-200">
                            Balanced
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isDelayed ? (
                          <span className="inline-flex items-center gap-1 text-red-700 font-bold text-[11px]">
                            <Clock size={11} /> Delayed
                          </span>
                        ) : p.timelineStatus === 'COMPLETED' ? (
                          <span className="text-green-700 font-medium text-[11px]">Completed</span>
                        ) : p.timelineStatus === 'DUE_SOON' ? (
                          <span className="text-amber-700 font-medium text-[11px]">Due Soon</span>
                        ) : (
                          <span className="text-blue-700 font-medium text-[11px]">On Track</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          p.status === 'Completed'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : p.status === 'Delayed'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Link
                          to={`/projects/${p.projectId}`}
                          className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold text-xs hover:underline whitespace-nowrap"
                        >
                          View Project &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
