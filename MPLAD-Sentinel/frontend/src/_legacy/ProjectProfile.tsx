import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building2, User, Calendar, IndianRupee, Loader, AlertTriangle, MessageSquarePlus, FileText, Camera, BarChart3, Activity } from 'lucide-react';
import { projectsApi } from '../services/api';
import type { Project, Analysis, CitizenReport } from '../types';
import RiskScoreBadge from '../components/RiskScoreBadge';
import AnomalyReport from '../components/AnomalyReport';
import EvidenceTimeline from '../components/EvidenceTimeline';
import MapView from '../components/MapView';
import { formatAmount, formatDate, STATUS_LABELS, STATUS_COLORS } from '../utils/riskHelpers';

type Tab = 'overview' | 'analysis' | 'photos' | 'reports';

export default function ProjectProfile() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    if (!id) return;
    projectsApi.get(id).then(d => {
      setProject(d.project);
      setAnalysis(d.analysis);
      setReports(d.reports);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleReanalyze() {
    if (!id) return;
    setReanalyzing(true);
    try {
      const { analysis: newAnalysis } = await projectsApi.analyze(id);
      setAnalysis(newAnalysis);
      setProject(p => p ? { ...p, risk_score: newAnalysis.risk_score, risk_level: newAnalysis.risk_level, anomaly_flags: newAnalysis.anomaly_flags } : p);
    } finally {
      setReanalyzing(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader size={32} className="animate-spin text-blue-400" /></div>;
  if (!project) return <div className="text-center py-20 text-gray-500">Project not found.</div>;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analysis', label: 'AI Risk Analysis', icon: AlertTriangle, count: project.anomaly_flags.length || undefined },
    { id: 'photos', label: 'Official Evidence', icon: Camera, count: project.official_photos.length },
    { id: 'reports', label: 'Citizen Reports', icon: MessageSquarePlus, count: reports.length || undefined },
  ];

  const progressGap = project.financial_progress_pct - project.physical_progress_pct;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back */}
      <Link to="/projects" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Projects
      </Link>

      {/* Header */}
      <div className="card p-6 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`border rounded-full text-xs font-semibold px-3 py-1 ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
              <span className="text-gray-600 text-xs font-mono bg-white/5 px-2 py-0.5 rounded-lg">{project.id}</span>
              {project.anomaly_flags.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10} /> {project.anomaly_flags.length} risk flags
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 leading-snug">{project.title}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-400"><User size={13} className="text-gray-600" />{project.mp_name}</div>
              <div className="flex items-center gap-2 text-gray-400"><MapPin size={13} className="text-gray-600" />{project.constituency}, {project.district}</div>
              <div className="flex items-center gap-2 text-gray-400"><Building2 size={13} className="text-gray-600" />{project.work_type}</div>
              <div className="flex items-center gap-2 text-gray-400"><IndianRupee size={13} className="text-gray-600" />{formatAmount(project.sanctioned_amount)}</div>
            </div>
          </div>
          {project.risk_score > 0 && <RiskScoreBadge score={project.risk_score} level={project.risk_level} showDonut size="lg" />}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Sanctioned', value: formatAmount(project.sanctioned_amount), sub: 'Total Budget' },
          { label: 'Expended', value: formatAmount(project.expended_amount), sub: `${project.financial_progress_pct}% of total` },
          { label: 'Physical Progress', value: `${project.physical_progress_pct}%`, sub: 'Reported completion' },
          { label: 'Expected Completion', value: formatDate(project.expected_completion), sub: project.actual_completion ? `Completed ${formatDate(project.actual_completion)}` : 'Target date' },
          { label: 'Citizen Reports', value: reports.length, sub: `${reports.filter(r => r.reported_condition !== 'as_per_report').length} discrepant` },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-lg font-bold font-mono ${s.label === 'Expended' && progressGap > 30 ? 'text-red-400' : 'text-white'}`}>{s.value}</p>
            <p className="text-[10px] text-gray-600">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div className="card p-5 mb-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Activity size={14} className="text-blue-400" /> Progress Comparison
          {progressGap > 30 && <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">⚠ {progressGap}% gap detected</span>}
        </h2>
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-400">Physical Progress</span>
            <span className="text-white font-mono font-semibold">{project.physical_progress_pct}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: `${project.physical_progress_pct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-400">Financial Progress</span>
            <span className={`font-mono font-semibold ${progressGap > 30 ? 'text-red-400' : 'text-white'}`}>{project.financial_progress_pct}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${project.financial_progress_pct}%`, background: progressGap > 30 ? 'linear-gradient(to right, #E53E3E, #FC8181)' : 'linear-gradient(to right, #38A169, #68D391)' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-sentinel-surface border border-white/10 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id ? 'bg-sentinel-blue text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            <tab.icon size={14} />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2"><FileText size={14} />Project Details</h3>
              <dl className="space-y-3 text-sm">
                {[
                  ['MP Name', project.mp_name],
                  ['Constituency', project.constituency],
                  ['State / District', `${project.state} / ${project.district}`],
                  ['Implementing Agency', project.implementing_agency],
                  ['Contractor', project.contractor_name],
                  ['Sanction Date', formatDate(project.sanction_date)],
                  ['Expected Completion', formatDate(project.expected_completion)],
                  ['Actual Completion', project.actual_completion ? formatDate(project.actual_completion) : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4">
                    <dt className="text-gray-500 flex-shrink-0 w-40">{k}</dt>
                    <dd className="text-gray-200 text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">Description</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{project.description}</p>
            </div>
          </div>
          <div className="space-y-5">
            <MapView project={project} height="320px" />
            <div className="card p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-200">Ground Condition Different?</p>
                <p className="text-xs text-gray-500 mt-0.5">Submit field evidence to improve risk accuracy</p>
              </div>
              <Link to={`/report/${project.id}`} className="btn-primary flex items-center gap-2 text-sm">
                <MessageSquarePlus size={14} /> Report
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <AnomalyReport analysis={analysis || { id: 'none', project_id: project.id, risk_score: project.risk_score, risk_level: project.risk_level, anomaly_flags: project.anomaly_flags, contributing_factors: [], narrative_text: 'No analysis available. Click Re-Analyze to run AI analysis.', recommendation: 'Run analysis to get a recommendation.', model_version: 'N/A', triggered_by: 'system', created_at: new Date().toISOString().split('T')[0] }}
          onReanalyze={handleReanalyze} isReanalyzing={reanalyzing} />
      )}

      {activeTab === 'photos' && (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500 flex items-center gap-2"><AlertTriangle size={12} className="text-yellow-400" />Official photographs uploaded by implementing agency. These are used for duplicate detection analysis.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.official_photos.map((url, i) => (
              <div key={i} className="card overflow-hidden group">
                <img src={url} alt={`Official photo ${i + 1}`} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="p-3">
                  <p className="text-xs text-gray-500">Official Photo {i + 1}</p>
                  {i > 0 && url === project.official_photos[0] && (
                    <p className="text-xs text-orange-400 mt-1 flex items-center gap-1"><AlertTriangle size={10} />Duplicate photo detected</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{reports.length} citizen reports submitted for this project</p>
            <Link to={`/report/${project.id}`} className="btn-primary text-sm flex items-center gap-2">
              <MessageSquarePlus size={14} /> Add Report
            </Link>
          </div>
          <EvidenceTimeline reports={reports} />
        </div>
      )}
    </div>
  );
}
