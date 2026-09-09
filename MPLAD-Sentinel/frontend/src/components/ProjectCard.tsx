import { Link } from 'react-router-dom';
import { MapPin, TrendingUp, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import type { Project, RiskLevel, ProjectStatus } from '../types';

const RISK: Record<RiskLevel, { label: string; badge: string }> = {
  Low:      { label: '🟢 Low Risk',      badge: 'bg-green-50 text-green-700 border-green-200'   },
  Medium:   { label: '🟡 Medium Risk',   badge: 'bg-yellow-50 text-yellow-700 border-yellow-200'},
  High:     { label: '🟠 High Risk',     badge: 'bg-orange-50 text-orange-700 border-orange-200'},
  Critical: { label: '🔴 Critical Risk', badge: 'bg-red-50 text-red-700 border-red-200'         },
};

const STATUS: Record<ProjectStatus, string> = {
  Sanctioned: 'bg-slate-100 text-slate-600 border-slate-200',
  Ongoing:    'bg-blue-50 text-blue-700 border-blue-200',
  Completed:  'bg-green-50 text-green-700 border-green-200',
  Delayed:    'bg-red-50 text-red-700 border-red-200',
};

function fmt(l: number) {
  if (l >= 100) return `₹${(l / 100).toFixed(2)} Cr`;
  return `₹${l.toFixed(2)} L`;
}

interface Props {
  project: Project;
  distance?: number;
}

export default function ProjectCard({ project, distance }: Props) {
  const risk   = RISK[project.riskLevel]   ?? RISK.Low;
  const status = STATUS[project.status]    ?? STATUS.Sanctioned;

  const spentPct = project.expenditurePercentage !== undefined
    ? project.expenditurePercentage
    : (project.sanctionedAmount > 0 ? Number(((project.expenditure / project.sanctionedAmount) * 100).toFixed(1)) : 0);

  const isSignificantGap =
    project.progressSpendingStatus === 'SIGNIFICANT_GAP' ||
    (spentPct - project.physicalProgress > 30);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:border-slate-300 transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status}`}>
              {project.status}
            </span>
            {isSignificantGap && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">
                <AlertCircle size={10} /> Progress-Spending Gap
              </span>
            )}
            {project.isPrototypeData && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Prototype
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
            {project.name}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{project.projectId}</p>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${risk.badge}`}>
          {risk.label}
        </span>
      </div>

      {/* Location & Distance */}
      <div className="flex items-start gap-1.5 text-xs text-slate-500">
        <MapPin size={13} className="mt-0.5 flex-shrink-0 text-slate-400" />
        <span className="truncate">{project.address || `${project.district}, ${project.state}`}</span>
        {distance !== undefined && (
          <span className="ml-auto flex-shrink-0 font-semibold text-blue-600 flex items-center gap-1">
            <TrendingUp size={11} />
            {distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`}
          </span>
        )}
      </div>

      {/* Financial Snapshot */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          <p className="text-slate-400 mb-0.5">Sanctioned</p>
          <p className="font-semibold text-slate-800">{fmt(project.sanctionedAmount)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span>Expended</span>
            <span className="font-medium text-slate-600 text-[10px]">{spentPct}%</span>
          </div>
          <p className="font-semibold text-slate-800">{fmt(project.expenditure)}</p>
        </div>
      </div>

      {/* Progress & Spending Comparison */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Physical Progress</span>
            <span className="font-semibold text-slate-800">{project.physicalProgress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, project.physicalProgress)}%`,
                backgroundColor: project.physicalProgress === 100 ? '#16a34a' : '#2563eb',
              }}
            />
          </div>
        </div>

        {/* Spent Progress Bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-400">Funds Expended</span>
            <span className="font-medium text-slate-600">{spentPct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.min(100, spentPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category & Timeline info */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
          {project.category}
        </span>
        {project.timelineLabel ? (
          <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock size={10} className="text-slate-400" />
            <span>{project.timelineLabel}</span>
          </span>
        ) : (
          project.status === 'Delayed' && (
            <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock size={10} />
              <span>Delayed Timeline</span>
            </span>
          )
        )}
      </div>

      <Link
        to={`/projects/${project.projectId}`}
        className="mt-auto flex items-center justify-center gap-2 w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        View Project Details <ChevronRight size={15} />
      </Link>
    </div>
  );
}
