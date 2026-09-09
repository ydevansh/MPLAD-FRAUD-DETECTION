import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building2, IndianRupee, Loader } from 'lucide-react';
import { projectsApi } from '../services/api';
import type { Project } from '../types';
import CitizenReportForm from '../components/CitizenReportForm';
import RiskScoreBadge from '../components/RiskScoreBadge';
import { formatAmount, STATUS_LABELS, STATUS_COLORS } from '../utils/riskHelpers';

export default function CitizenReport() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    projectsApi.get(projectId).then(d => setProject(d.project)).finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader size={28} className="animate-spin text-blue-400" /></div>;
  if (!project) return <div className="text-center py-20 text-gray-500">Project not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Project
      </Link>

      {/* Project Summary Card */}
      <div className="card p-5 mb-6 border-l-2 border-sentinel-blue">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`border rounded-full text-xs font-semibold px-2 py-0.5 ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
              <span className="text-gray-600 text-xs font-mono">{project.id}</span>
            </div>
            <h2 className="text-base font-bold text-white mb-2 leading-snug">{project.title}</h2>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin size={11} />{project.constituency}, {project.state}</span>
              <span className="flex items-center gap-1"><Building2 size={11} />{project.work_type}</span>
              <span className="flex items-center gap-1"><IndianRupee size={11} />{formatAmount(project.sanctioned_amount)}</span>
            </div>
          </div>
          {project.risk_score > 0 && <RiskScoreBadge score={project.risk_score} level={project.risk_level} size="sm" />}
        </div>
      </div>

      {/* Form Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Submit Field Report</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Have you visited this project site? Your ground-level observation helps AI verify official claims and improves the risk score accuracy.
        </p>
      </div>

      <CitizenReportForm project={project} />
    </div>
  );
}
