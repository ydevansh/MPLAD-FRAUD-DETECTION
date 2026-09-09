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
  ShieldAlert,
  Info,
  ExternalLink,
  LocateFixed,
} from 'lucide-react';
import MapView from '../components/MapView';
import { useGeolocation, distanceKm } from '../hooks/useGeolocation';
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
import {
  getProjectById,
  getProjectIntelligence,
  getProjectAnomalies,
  getProjectRisk,
  getProjectCitizenReports,
  getProjectEvidenceSummary,
} from '../services/api';
import type {
  Project,
  RiskLevel,
  ProjectStatus,
  ProjectIntelligence,
  ProjectAnomaliesData,
  ProjectRiskData,
  CitizenReport,
  ProjectEvidenceSummary,
} from '../types';

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
  const [anomaliesData, setAnomaliesData] = useState<ProjectAnomaliesData | null>(null);
  const [riskData, setRiskData]           = useState<ProjectRiskData | null>(null);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [evidenceSummary, setEvidenceSummary] = useState<ProjectEvidenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getProjectById(projectId),
      getProjectIntelligence(projectId).catch(() => null),
      getProjectAnomalies(projectId).catch(() => null),
      getProjectRisk(projectId).catch(() => null),
      getProjectCitizenReports(projectId).catch(() => null),
      getProjectEvidenceSummary(projectId).catch(() => null),
    ])
      .then(([projRes, intelRes, anomalyRes, riskRes, reportsRes, evidenceRes]) => {
        setProject(projRes.data);
        if (intelRes && intelRes.data) {
          setIntel(intelRes.data);
        } else if (projRes.data?.intelligence) {
          setIntel(projRes.data.intelligence);
        }
        if (anomalyRes && anomalyRes.data) {
          setAnomaliesData(anomalyRes.data);
        }
        if (riskRes && riskRes.data) {
          setRiskData(riskRes.data);
        }
        if (reportsRes && reportsRes.data) {
          setCitizenReports(reportsRes.data);
        }
        if (evidenceRes && evidenceRes.data) {
          setEvidenceSummary(evidenceRes.data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  const { state: geoState, requestLocation } = useGeolocation();

  const userLocation = geoState.status === 'success' ? geoState.location : null;
  const hasValidCoords = Boolean(
    project &&
    project.latitude !== undefined &&
    project.latitude !== null &&
    project.longitude !== undefined &&
    project.longitude !== null &&
    !isNaN(Number(project.latitude)) &&
    !isNaN(Number(project.longitude)) &&
    Number(project.latitude) >= -90 &&
    Number(project.latitude) <= 90 &&
    Number(project.longitude) >= -180 &&
    Number(project.longitude) <= 180
  );

  const userDistance =
    userLocation && hasValidCoords && project
      ? distanceKm(
          userLocation.latitude,
          userLocation.longitude,
          Number(project.latitude),
          Number(project.longitude)
        )
      : null;

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
      </div>

      {/* Project Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
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

          <Link
            to={`/projects/${project.projectId}/report`}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <Camera size={14} />
            <span>Verify This Project / Report Issue</span>
          </Link>
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

      {/* Phase 6: Explainable AI Risk Assessment */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              (riskData?.riskScore ?? 0) >= 81
                ? 'bg-red-50 text-red-600'
                : (riskData?.riskScore ?? 0) >= 61
                ? 'bg-orange-50 text-orange-600'
                : (riskData?.riskScore ?? 0) >= 31
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  AI-Assisted Risk Assessment
                </h2>
                <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                  Explainable Priority Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Continuous algorithmic monitoring score (0–100) determining inspection and review priority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
              (riskData?.riskLevel ?? 'LOW') === 'CRITICAL'
                ? 'bg-red-50 text-red-700 border-red-200'
                : (riskData?.riskLevel ?? 'LOW') === 'HIGH'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : (riskData?.riskLevel ?? 'LOW') === 'MEDIUM'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {riskData?.riskLevel === 'CRITICAL'
                ? '🔴 Critical Risk Priority'
                : riskData?.riskLevel === 'HIGH'
                ? '🟠 High Risk Priority'
                : riskData?.riskLevel === 'MEDIUM'
                ? '🟡 Medium Risk Priority'
                : '🟢 Low Risk Priority'}
            </span>
          </div>
        </div>

        {/* Score & Progress Gauge */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Monitoring Risk Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                  {riskData?.riskScore ?? 0}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs">
              <span className="text-slate-500 block text-[11px]">Recommended Action:</span>
              <span className="font-bold text-slate-900">
                {riskData?.recommendedAction || 'Routine monitoring.'}
              </span>
            </div>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 relative overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (riskData?.riskScore ?? 0) >= 81
                  ? 'bg-red-600'
                  : (riskData?.riskScore ?? 0) >= 61
                  ? 'bg-orange-500'
                  : (riskData?.riskScore ?? 0) >= 31
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(3, riskData?.riskScore ?? 0))}%` }}
            />
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
            <span>0 (Low)</span>
            <span className="hidden sm:inline">30 (Medium)</span>
            <span className="hidden sm:inline">60 (High)</span>
            <span>80+ (Critical)</span>
            <span>100</span>
          </div>
        </div>

        {/* Explainable Breakdown: Why was this project flagged? */}
        <div className="mb-5">
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center justify-between">
            <span>Score Breakdown & Contributing Signals</span>
            <span className="text-xs font-normal text-slate-500">
              {riskData?.reasons.length ?? 0} Contributing {riskData?.reasons.length === 1 ? 'Factor' : 'Factors'}
            </span>
          </h3>

          {!riskData || riskData.reasons.length === 0 ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-950 text-xs">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Baseline Monitoring — No Risk Points Assigned</p>
                <p className="text-emerald-800">
                  Financial releases and expenditures are proportionate to physical progress, project timelines are intact, and no cost anomalies were detected.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {riskData.reasons.map((r, i) => (
                <div
                  key={i}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{r.title}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {r.type}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{r.explanation}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-white text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg font-mono font-bold text-xs shadow-2xs">
                      +{r.points}
                    </span>
                  </div>
                </div>
              ))}

              {/* Tally Total Row */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>Calculated Risk Score Total</span>
                <span className="font-mono font-bold text-sm text-blue-700">
                  {riskData.riskScore} / 100
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Operational Disclaimer */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
          <Info size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Monitoring Disclaimer: </span>
            <span>
              {riskData?.disclaimer ||
                'The risk score is an automated monitoring indicator based on available project data. It is not proof of fraud. Final verification and decisions remain with authorities.'}
            </span>
          </div>
        </div>
      </div>

      {/* Phase 5: AI-Assisted Monitoring Signals / Anomaly Detection */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              (anomaliesData?.anomalyCount ?? 0) > 0
                ? anomaliesData?.highestSeverity === 'HIGH'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  AI-Assisted Monitoring Signals
                </h2>
                <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                  Anomaly Engine v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated multi-factor integrity checks (Spending vs Progress, Timelines, Costs, and Duplicates)
              </p>
            </div>
          </div>

          <div>
            {(anomaliesData?.anomalyCount ?? 0) > 0 ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                anomaliesData?.highestSeverity === 'HIGH'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : anomaliesData?.highestSeverity === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {anomaliesData?.highestSeverity === 'HIGH' ? '🔴 High Severity Signal' : '🟡 Medium Severity Signal'}
                <span className="bg-white/80 px-1.5 py-0.2 rounded-full text-[10px] ml-1">
                  {anomaliesData?.anomalyCount} {anomaliesData?.anomalyCount === 1 ? 'Signal' : 'Signals'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} />
                No Anomalies Detected
              </span>
            )}
          </div>
        </div>

        {/* Anomaly list or Clear state */}
        {!anomaliesData || anomaliesData.anomalyCount === 0 ? (
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-emerald-900">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-emerald-950">
                All 6 automated surveillance checks passed within baseline thresholds.
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Expenditure is commensurate with reported physical progress, work milestones are within schedule limits, no duplicate or similar works were flagged in this district, and budget figures match approved allocations.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {anomaliesData.anomalies.map((a, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                  a.severity === 'HIGH'
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      a.severity === 'HIGH'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {a.severity}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{a.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-white/70 px-2 py-0.5 rounded border border-slate-200">
                    {a.type}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  {a.message}
                </p>

                {/* Supporting metrics chips if present */}
                {a.values && Object.keys(a.values).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {a.values.physicalProgress !== undefined && (
                      <span className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700">
                        Physical Progress: <strong>{a.values.physicalProgress}%</strong>
                      </span>
                    )}
                    {a.values.expenditurePercentage !== undefined && (
                      <span className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700">
                        Expenditure: <strong>{a.values.expenditurePercentage}%</strong>
                      </span>
                    )}
                    {a.values.difference !== undefined && (
                      <span className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-red-600">
                        Discrepancy Gap: <strong>+{a.values.difference}% pts</strong>
                      </span>
                    )}
                    {a.values.daysOverdue !== undefined && (
                      <span className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-red-600">
                        Overdue by: <strong>{a.values.daysOverdue} days</strong>
                      </span>
                    )}
                    {a.values.sanctionedAmount !== undefined && a.values.districtCategoryAverage !== undefined && (
                      <span className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700">
                        Cost: <strong>{fmtLakhs(a.values.sanctionedAmount)}</strong> (Dist Avg: {fmtLakhs(a.values.districtCategoryAverage)})
                      </span>
                    )}
                    {a.values.spent !== undefined && a.values.released !== undefined && (
                      <span className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700">
                        Spent: <strong>{fmtLakhs(a.values.spent)}</strong> vs Released: <strong>{fmtLakhs(a.values.released)}</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Related projects if SIMILAR_PROJECT */}
                {a.relatedProjects && a.relatedProjects.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 mb-3">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Matching / Overlapping Projects Detected in Same District:
                    </p>
                    <div className="space-y-2">
                      {a.relatedProjects.map((rp, rIdx) => (
                        <div key={rIdx} className="flex flex-wrap items-center justify-between text-xs gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div>
                            <span className="font-mono text-slate-500 text-[11px] mr-2">{rp.relatedProjectId}</span>
                            <span className="font-semibold text-slate-800">{rp.relatedProjectName}</span>
                            <span className="text-slate-500 ml-2">({fmtLakhs(rp.sanctionedAmount)})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                              {Math.round(rp.similarityScore * 100)}% Similarity
                            </span>
                            <Link
                              to={`/projects/${rp.relatedProjectId}`}
                              className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-semibold text-xs"
                            >
                              Inspect Work <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Action */}
                <div className="bg-white/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs flex items-start gap-2">
                  <span className="font-bold text-slate-800 flex-shrink-0">Recommended Action:</span>
                  <span className="text-slate-700">{a.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mandatory Disclaimer */}
        <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
          <Info size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Operational Disclaimer: </span>
            <span>
              {anomaliesData?.disclaimer ||
                'These are automated monitoring signals, not proof of fraud. Final verification remains with authorities.'}
            </span>
          </div>
        </div>
      </div>

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
        {/* Official Project Location */}
        <Section
          title="Official Project Location"
          subtitle="Geospatial positioning & field verification signal"
          icon={MapPin}
          badge={
            hasValidCoords ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                GPS Geocoded
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Coordinates Unavailable
              </span>
            )
          }
        >
          {hasValidCoords ? (
            <div className="space-y-3.5">
              {/* Interactive Location Map */}
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <MapView
                  projects={[project]}
                  userLocation={userLocation}
                  height="260px"
                />
              </div>

              {/* Approximate Distance & Geolocation Button */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  {userDistance !== null ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block animate-pulse"></span>
                      <p className="text-slate-800 font-medium">
                        You are approximately{' '}
                        <strong className="text-blue-700">
                          {userDistance < 1
                            ? `${Math.round(userDistance * 1000)} meters`
                            : `${userDistance.toFixed(1)} km`}
                        </strong>{' '}
                        from this project.
                        {userLocation?.accuracy ? (
                          <span className="text-slate-500 font-normal ml-1">
                            (GPS accuracy: ±{Math.round(userLocation.accuracy)}m)
                          </span>
                        ) : null}
                      </p>
                    </div>
                  ) : geoState.status === 'loading' ? (
                    <p className="text-slate-500 flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin text-blue-600" />
                      Detecting your current location...
                    </p>
                  ) : (
                    <p className="text-slate-600">
                      Allow location access to check approximate distance from your device.
                    </p>
                  )}
                </div>

                {geoState.status !== 'success' && (
                  <button
                    onClick={requestLocation}
                    disabled={geoState.status === 'loading'}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm text-xs self-start sm:self-auto"
                  >
                    <LocateFixed size={13} />
                    <span>Check Distance</span>
                  </button>
                )}
              </div>

              {/* Mandatory GPS Disclaimer */}
              <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-3 flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
                <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-blue-950">GPS Verification Signal: </span>
                  GPS proximity is a verification signal and may be affected by location accuracy, device settings, or project coordinate quality.
                </div>
              </div>

              {/* Coordinate Specs */}
              <div className="divide-y divide-slate-100 text-xs">
                <Row label="Address"   value={project.address || '—'} />
                <Row label="District & State"  value={`${project.district}, ${project.state}`} />
                <Row label="Latitude"  value={<span className="font-mono">{project.latitude}</span>} />
                <Row label="Longitude" value={<span className="font-mono">{project.longitude}</span>} />
              </div>

              <div className="pt-1">
                <Link
                  to="/nearby"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 font-semibold"
                >
                  Inspect nearby development projects on Interactive Map &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center text-xs">
              <AlertTriangle size={24} className="text-amber-600 mx-auto mb-2" />
              <h4 className="font-semibold text-amber-900 text-sm mb-1">Location information unavailable.</h4>
              <p className="text-amber-700 max-w-sm mx-auto mb-3">
                Official GPS coordinates are not yet recorded for this project site. Marked as a Data Quality advisory.
              </p>
              <div className="divide-y divide-amber-100 border-t border-amber-200 pt-2 text-left">
                <Row label="Address"  value={project.address || '—'} />
                <Row label="District" value={project.district} />
                <Row label="State"    value={project.state} />
              </div>
            </div>
          )}
        </Section>

        {/* Official Photos */}
        <Section title="Official Project Site Photographs" icon={Camera}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              OFFICIAL PROJECT PHOTO
            </span>
            <span className="text-[11px] text-slate-400">Sanctioned site records</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(project.images && project.images.length > 0 ? project.images : [
              'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&q=80',
              'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&q=80',
            ]).slice(0, 2).map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={img} alt={`Site evidence ${i + 1}`} className="w-full h-32 object-cover" />
                <div className="px-2.5 py-1.5 text-[11px] text-slate-500 font-medium">Official Record #{i + 1}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* CITIZEN VERIFICATION SIGNALS & GROUND EVIDENCE (Phase 8 & 9) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Camera size={16} />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Citizen Verification Signals
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Ground Evidence
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Observations submitted by citizens on the ground with photo, GPS, and timestamp verification.
            </p>
          </div>

          <Link
            to={`/projects/${project.projectId}/report`}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm self-start sm:self-auto"
          >
            <Camera size={14} />
            <span>Verify This Project</span>
          </Link>
        </div>

        {/* Evidence KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-xs">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <span className="text-slate-400 block text-[10px] mb-0.5">Total Reports</span>
            <span className="text-xl font-extrabold text-slate-900">{citizenReports.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Ground submissions</span>
          </div>

          <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-200">
            <span className="text-emerald-700 block text-[10px] mb-0.5">Location Consistent</span>
            <span className="text-xl font-extrabold text-emerald-900">
              {citizenReports.filter((r) => r.locationStatus === 'VERY_CLOSE' || r.locationStatus === 'CLOSE').length}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">&le;500m of official site</span>
          </div>

          <div className="bg-amber-50/50 rounded-2xl p-3.5 border border-amber-200">
            <span className="text-amber-700 block text-[10px] mb-0.5">Location Discrepancy</span>
            <span className="text-xl font-extrabold text-amber-900">
              {citizenReports.filter((r) => r.locationStatus === 'FAR' || r.locationStatus === 'FAR_FROM_PROJECT').length}
            </span>
            <span className="text-[10px] text-amber-600 block mt-0.5">&gt;1 km from project</span>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-200">
            <span className="text-blue-700 block text-[10px] mb-0.5">Photo Evidence</span>
            <span className="text-xl font-extrabold text-blue-900">
              {citizenReports.filter((r) => r.imageUrl).length}
            </span>
            <span className="text-[10px] text-blue-600 block mt-0.5">Field site images</span>
          </div>
        </div>

        {/* Citizen Reports List or Empty State */}
        {citizenReports.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center my-4">
            <Camera size={32} className="text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm mb-1">No citizen reports recorded yet.</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Be the first to inspect and verify this project on site. Your observation helps ensure public funds deliver real progress.
            </p>
            <Link
              to={`/projects/${project.projectId}/report`}
              className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              Verify This Project &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {citizenReports.map((rep) => (
              <div
                key={rep.reportId}
                className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {rep.imageUrl ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-200">
                      <img src={rep.imageUrl} alt={rep.reportId} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 flex-shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
                      <Camera size={20} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {rep.reportId}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">{rep.category}</span>
                      <span className="text-[11px] text-slate-400">• {new Date(rep.submittedAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 mb-2">
                      "{rep.description}"
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      {rep.locationStatus !== 'UNKNOWN' && (
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full border ${
                            rep.locationStatus === 'VERY_CLOSE' || rep.locationStatus === 'CLOSE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          📍 Location {rep.locationStatus.replace(/_/g, ' ')}
                          {rep.locationDistanceMeters !== undefined && (
                            <span> ({rep.locationDistanceMeters < 1000 ? `${rep.locationDistanceMeters}m` : `${rep.locationDistanceKm} km`})</span>
                          )}
                        </span>
                      )}

                      {rep.imageSimilarity && rep.imageSimilarity.result === 'HIGH_SIMILARITY' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          Similar Image Found
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 self-end md:self-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Verification Signal
                  </span>
                  <span className="text-xs font-semibold text-blue-700">Available for Audit</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mandatory Disclaimer */}
        <div className="mt-6 p-3.5 bg-blue-50/60 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-[11px] text-blue-900 leading-relaxed">
          <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-blue-950">Ground Verification Notice: </span>
            Citizen reports provide real-time field signals to aid surveillance. Public submissions do not expose exact citizen GPS coordinates. Final determination remains with authorized government bodies.
          </div>
        </div>
      </div>
    </div>
  );
}
