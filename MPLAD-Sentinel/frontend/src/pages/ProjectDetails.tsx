import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  TrendingUp,
  IndianRupee,
  Camera,
  AlertTriangle,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Scale,
  Check,
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
} from 'recharts';
import { getProjectById, getProjectIntelligence } from '../services/api';
import type { Project, RiskLevel, ProjectStatus, ProjectIntelligence } from '../types';

const RISK_CONFIG: Record<RiskLevel, { label: string; badge: string; bar: string }> = {
  Low:      { label: '🟢 Low Risk',      badge: 'bg-green-50 text-green-700 border-green-200',   bar: '#16a34a' },
  Medium:   { label: '🟡 Medium Risk',   badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', bar: '#ca8a04' },
  High:     { label: '🟠 High Risk',     badge: 'bg-orange-50 text-orange-700 border-orange-200', bar: '#ea580c' },
  Critical: { label: '🔴 Critical Risk', badge: 'bg-red-50 text-red-700 border-red-200',           bar: '#dc2626' },
};

const STATUS_CONFIG: Record<ProjectStatus, string> = {
  Sanctioned: 'bg-slate-100 text-slate-600 border-slate-200',
  Ongoing:    'bg-blue-50 text-blue-700 border-blue-200',
  Completed:  'bg-green-50 text-green-700 border-green-200',
  Delayed:    'bg-red-50 text-red-700 border-red-200',
};

function fmtLakhs(l: number | undefined | null): string {
  if (l === undefined || l === null || isNaN(l)) return '₹0.00 L';
  if (l >= 100) return `₹${(l / 100).toFixed(2)} Cr`;
  return `₹${l.toFixed(2)} Lakh`;
}

function fmtDate(dStr: string | null | undefined): string {
  if (!dStr) return 'Not recorded';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return 'Not recorded';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'Not recorded';
  }
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Icon size={18} />
            </div>
          )}
          <div>
            <h2 className="font-bold text-slate-900 text-base">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {badge && <div>{badge}</div>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [intel, setIntel]     = useState<ProjectIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getProjectById(projectId),
      getProjectIntelligence(projectId).catch(() => null),
    ])
      .then(([projRes, intelRes]) => {
        setProject(projRes.data);
        if (intelRes && intelRes.data) {
          setIntel(intelRes.data);
        } else if (projRes.data?.intelligence) {
          setIntel(projRes.data.intelligence);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-36 gap-3 text-slate-500">
        <Loader2 size={28} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading project intelligence...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Project Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{error || `No project found with ID "${projectId}"`}</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          <ArrowLeft size={16} /> Back to Projects Directory
        </Link>
      </div>
    );
  }

  const risk = RISK_CONFIG[project.riskLevel] ?? RISK_CONFIG.Low;
  const statusBadge = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.Sanctioned;

  // Financial derived metrics
  const sanctioned = intel?.financial.sanctionedAmount ?? project.sanctionedAmount;
  const released   = intel?.financial.releasedAmount ?? project.releasedAmount;
  const expended   = intel?.financial.expenditure ?? project.expenditure;
  const remaining  = intel?.financial.remainingAmount ?? Math.max(0, sanctioned - expended);
  const spentPct   = intel?.financial.expenditurePercentage ?? (sanctioned > 0 ? Number(((expended / sanctioned) * 100).toFixed(1)) : 0);
  const relPct     = intel?.financial.releasePercentage ?? (sanctioned > 0 ? Number(((released / sanctioned) * 100).toFixed(1)) : 0);
  const physicalPct = intel?.progress.physicalProgress ?? project.physicalProgress;
  const gapDiff    = intel?.progress.progressSpendingDifference ?? Number((spentPct - physicalPct).toFixed(1));
  const gapStatus  = intel?.progress.progressSpendingStatus ?? (gapDiff > 30 ? 'SIGNIFICANT_GAP' : (gapDiff > 15 ? 'MODERATE_GAP' : 'ALIGNED'));

  // Timeline
  const timelineStatus = intel?.timeline.timelineStatus ?? project.status;
  const daysOverdue    = intel?.timeline.daysOverdue ?? 0;
  const timelineLabel  = intel?.timeline.label ?? (project.status === 'Completed' ? 'Completed' : 'Ongoing');

  // Chart data for Recharts
  const chartData = [
    { name: 'Physical Progress', value: physicalPct, fill: '#2563eb' },
    { name: 'Funds Expended',    value: spentPct,    fill: gapStatus === 'SIGNIFICANT_GAP' ? '#ea580c' : '#f59e0b' },
  ];

  const warnings = intel?.dataQualityWarnings ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb & Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="flex items-center gap-2">
          {project.isPrototypeData && (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
              Prototype Data Only
            </span>
          )}
        </div>
      </div>

      {/* Project Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusBadge}`}>
            {project.status}
          </span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${risk.badge}`}>
            {risk.label}
          </span>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
            {project.category}
          </span>
          {project.financialYear && (
            <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full font-mono">
              FY {project.financialYear}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          {project.name}
        </h1>
        <p className="text-slate-500 font-mono text-xs sm:text-sm mb-4">
          ID: {project.projectId}
        </p>

        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl mb-4">
          {project.description || 'Public works project sanctioned under the MPLADS development framework.'}
        </p>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-blue-600 flex-shrink-0" />
            <span>{project.district}, {project.state} ({project.constituency} Constituency)</span>
          </div>
          {project.implementingAgency && (
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-slate-400 flex-shrink-0" />
              <span>Agency: <strong>{project.implementingAgency}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Data Quality Notice (if warnings exist) */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-6 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">Data Quality Diagnostic Notice</h3>
              <p className="text-xs text-amber-800 mb-2">
                Automated consistency checking identified reporting entries that warrant administrative review:
              </p>
              <ul className="list-disc list-inside text-xs space-y-1 text-amber-900 font-medium">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* LEFT 2 COLS: Financial & Progress Intelligence */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. FINANCIAL OVERVIEW */}
          <Section title="Financial Overview & Liquidity" subtitle="Sanctioned vs Released vs Expended Funds" icon={IndianRupee}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <p className="text-xs text-slate-500 mb-1 font-medium">Sanctioned</p>
                <p className="text-base sm:text-lg font-bold text-slate-900">{fmtLakhs(sanctioned)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Approved budget</p>
              </div>

              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5">
                <p className="text-xs text-blue-700 mb-1 font-medium">Released</p>
                <p className="text-base sm:text-lg font-bold text-blue-900">{fmtLakhs(released)}</p>
                <p className="text-[10px] text-blue-600 mt-0.5 font-semibold">{relPct}% of sanctioned</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5">
                <p className="text-xs text-amber-700 mb-1 font-medium">Expended</p>
                <p className="text-base sm:text-lg font-bold text-amber-900">{fmtLakhs(expended)}</p>
                <p className="text-[10px] text-amber-600 mt-0.5 font-semibold">{spentPct}% of sanctioned</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5">
                <p className="text-xs text-emerald-700 mb-1 font-medium">Remaining</p>
                <p className="text-base sm:text-lg font-bold text-emerald-900">{fmtLakhs(remaining)}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Unutilized balance</p>
              </div>
            </div>

            {/* Visual Budget Progression */}
            <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Fund Utilization Rate (Expenditure / Sanctioned)</span>
                  <span className="font-bold text-slate-800">{spentPct}%</span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, spentPct)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Fund Disbursal Rate (Released / Sanctioned)</span>
                  <span className="font-bold text-slate-800">{relPct}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, relPct)}%` }}
                  />
                </div>
              </div>

              {intel?.financial.unspentReleasedAmount !== undefined && (
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-200">
                  <span>Unspent funds currently lying with agency:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {fmtLakhs(intel.financial.unspentReleasedAmount)}
                  </span>
                </div>
              )}
            </div>
          </Section>

          {/* 2. PROGRESS VS SPENDING ANALYSIS & CHART */}
          <Section
            title="Progress vs. Spending Intelligence"
            subtitle="Comparing Physical Milestone Completion against Financial Disbursal"
            icon={BarChart3}
            badge={
              gapStatus === 'SIGNIFICANT_GAP' ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
                  <AlertCircle size={13} /> Significant Gap ({gapDiff} pts)
                </span>
              ) : gapStatus === 'MODERATE_GAP' ? (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                  Moderate Gap ({gapDiff} pts)
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Balanced ({gapDiff} pts)
                </span>
              )
            }
          >
            {/* Context callout */}
            <div className={`p-4 rounded-xl mb-5 text-xs sm:text-sm ${
              gapStatus === 'SIGNIFICANT_GAP'
                ? 'bg-orange-50/70 border border-orange-200 text-orange-900'
                : gapStatus === 'MODERATE_GAP'
                ? 'bg-yellow-50/70 border border-yellow-200 text-yellow-900'
                : 'bg-green-50/70 border border-green-200 text-green-900'
            }`}>
              <div className="flex items-start gap-2.5">
                <TrendingUp size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">
                    {intel?.progress.statusDescription ||
                      (gapStatus === 'SIGNIFICANT_GAP'
                        ? 'Expenditure percentage is significantly ahead of verified physical completion.'
                        : 'Progress and expenditure metrics are operating within expected tolerance.')}
                  </p>
                  <p className="opacity-80 text-xs">
                    This divergence metric indicates potential billing delays, milestone verification lags, or front-loaded material procurement. It is an analytical signal for closer inspection.
                  </p>
                </div>
              </div>
            </div>

            {/* Recharts Bar Visualization */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Comparison Metric (% of Total)
              </h4>
              <div className="h-48 sm:h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Percentage']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={26}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Physical Progress</span>
                  <span className="font-bold text-blue-700 text-base">{physicalPct}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Funds Expended</span>
                  <span className="font-bold text-amber-700 text-base">{spentPct}%</span>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT 1 COL: Timeline & District Benchmarks */}
        <div className="space-y-6">
          {/* 3. TIMELINE TRACKER */}
          <Section title="Project Timeline" subtitle="Milestones & Deadline Health" icon={Clock}>
            {/* Timeline status indicator */}
            <div className={`p-3.5 rounded-xl mb-5 flex items-center justify-between border ${
              timelineStatus === 'DELAYED'
                ? 'bg-red-50 border-red-200 text-red-800'
                : timelineStatus === 'COMPLETED'
                ? 'bg-green-50 border-green-200 text-green-800'
                : timelineStatus === 'DUE_SOON'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span className="font-bold text-xs sm:text-sm">{timelineLabel}</span>
              </div>
              {daysOverdue > 0 && (
                <span className="text-xs bg-red-100 text-red-900 px-2.5 py-0.5 rounded-full font-bold border border-red-300">
                  +{daysOverdue}d overdue
                </span>
              )}
            </div>

            {/* Milestones Flow */}
            <div className="relative pl-6 space-y-5 border-l-2 border-slate-200 ml-2 py-1 text-xs">
              {/* Sanction Date */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center">
                  <Check size={9} className="text-white" />
                </div>
                <p className="font-semibold text-slate-800">1. Sanctioned</p>
                <p className="text-slate-500">{fmtDate(project.sanctionDate)}</p>
              </div>

              {/* Start Date */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center">
                  <Check size={9} className="text-white" />
                </div>
                <p className="font-semibold text-slate-800">2. Work Commenced</p>
                <p className="text-slate-500">{fmtDate(project.startDate)}</p>
              </div>

              {/* Expected Completion Date */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  timelineStatus === 'DELAYED' ? 'bg-red-500' : 'bg-blue-400'
                }`} />
                <p className="font-semibold text-slate-800">3. Expected Target</p>
                <p className={timelineStatus === 'DELAYED' ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                  {fmtDate(project.expectedCompletionDate)}
                </p>
              </div>

              {/* Actual Completion */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  project.status === 'Completed' ? 'bg-green-600' : 'bg-slate-300'
                }`} />
                <p className="font-semibold text-slate-800">4. Final Completion</p>
                <p className="text-slate-500">
                  {project.actualCompletionDate ? fmtDate(project.actualCompletionDate) : 'In Progress (Pending Final Delivery)'}
                </p>
              </div>
            </div>
          </Section>

          {/* 4. DISTRICT COMPARABLE BENCHMARK */}
          <Section title="District Cost Benchmark" subtitle="Contextual Comparison" icon={Scale}>
            {intel?.comparable && intel.comparable.hasBenchmark ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  {intel.comparable.message}
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">District Avg Sanctioned:</span>
                    <span className="font-bold text-slate-800">{fmtLakhs(intel.comparable.averageComparableCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">This Project:</span>
                    <span className="font-bold text-blue-700">{fmtLakhs(sanctioned)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Variance from Avg:</span>
                    <span className={`font-bold ${
                      intel.comparable.costDifferenceFromAverage > 0
                        ? 'text-amber-700'
                        : 'text-green-700'
                    }`}>
                      {intel.comparable.costDifferenceFromAverage > 0 ? '+' : ''}
                      {fmtLakhs(intel.comparable.costDifferenceFromAverage)}
                      {intel.comparable.percentageOfAverage && ` (${intel.comparable.percentageOfAverage}%)`}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Benchmarking assists monitoring authorities to identify cost anomalies across similar civic works in the same geography.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Insufficient comparable project data in this district for category '{project.category}'.
              </p>
            )}
          </Section>
        </div>
      </div>

      {/* LOWER SECTION: Location & Photos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Location Info */}
        <Section title="Location & Administrative Details" icon={MapPin}>
          <div className="divide-y divide-slate-100">
            <Row label="Address"   value={project.address || '—'} />
            <Row label="District"  value={project.district} />
            <Row label="State"     value={project.state} />
            <Row label="Latitude"  value={<span className="font-mono">{project.latitude}</span>} />
            <Row label="Longitude" value={<span className="font-mono">{project.longitude}</span>} />
          </div>
          <div className="mt-4">
            <Link
              to="/nearby"
              className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 font-semibold"
            >
              Inspect nearby development projects on Interactive Map &rarr;
            </Link>
          </div>
        </Section>

        {/* Official Photos */}
        <Section title="Official Project Site Photographs" icon={Camera}>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-3">
            ⚠️ Representative prototype photographs. Official geo-tagged site images will be integrated in Phase 4.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(project.images && project.images.length > 0 ? project.images : [
              'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&q=80',
              'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&q=80',
            ]).slice(0, 2).map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={img} alt={`Site evidence ${i + 1}`} className="w-full h-32 object-cover" />
                <div className="px-2.5 py-1.5 text-[11px] text-slate-500">Site Record #{i + 1}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
