import type { CitizenReport } from '../types';
import { MapPin, Camera, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { CONDITION_LABELS } from '../utils/riskHelpers';

interface Props { reports: CitizenReport[] }

const statusIcon = { pending: Clock, reviewed: CheckCircle, accepted: CheckCircle, rejected: XCircle };
const statusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  reviewed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  accepted: 'text-green-400 bg-green-500/10 border-green-500/20',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function EvidenceTimeline({ reports }: Props) {
  if (reports.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle size={32} className="text-gray-600" />
        <p className="text-gray-400 font-medium">No citizen reports yet</p>
        <p className="text-gray-600 text-sm">Be the first to report the ground condition of this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div>
          <p className="text-2xl font-bold text-gradient font-mono">{reports.length}</p>
          <p className="text-xs text-gray-500">Total Reports</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-orange-400 font-mono">
            {reports.filter(r => r.reported_condition !== 'as_per_report').length}
          </p>
          <p className="text-xs text-gray-500">Discrepant Reports</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-400 font-mono">
            {reports.filter(r => r.photo_url).length}
          </p>
          <p className="text-xs text-gray-500">With Photos</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-400 font-mono">
            {reports.filter(r => r.lat).length}
          </p>
          <p className="text-xs text-gray-500">With GPS</p>
        </div>
        {reports.some(r => r.evidence_consistency_score !== null) && (
          <div>
            <p className="text-2xl font-bold text-purple-400 font-mono">
              {(reports.reduce((s, r) => s + (r.evidence_consistency_score || 0), 0) / reports.filter(r => r.evidence_consistency_score !== null).length * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">Avg Evidence Score</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
        <div className="space-y-4 pl-12">
          {reports.map(report => {
            const StatusIcon = statusIcon[report.status] || Clock;
            const isDiscrepant = report.reported_condition !== 'as_per_report';
            return (
              <div key={report.id} className="relative animate-fade-in-up">
                <div className={`absolute -left-8 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isDiscrepant ? 'border-orange-400 bg-orange-500/20' : 'border-blue-400 bg-blue-500/20'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isDiscrepant ? 'bg-orange-400' : 'bg-blue-400'}`} />
                </div>
                <div className={`card p-4 ${isDiscrepant ? 'border-orange-500/20 bg-orange-500/5' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`border text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[report.status]}`}>
                          <StatusIcon size={9} className="inline mr-1" />
                          {report.status}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono">{report.id}</span>
                      </div>
                      <p className={`text-xs font-semibold ${isDiscrepant ? 'text-orange-300' : 'text-gray-300'}`}>
                        Condition: {CONDITION_LABELS[report.reported_condition] || report.reported_condition}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">{new Date(report.created_at).toLocaleDateString('en-IN')}</p>
                      {report.evidence_consistency_score !== null && (
                        <p className="text-xs text-purple-400 font-mono">
                          Score: {(report.evidence_consistency_score * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">{report.description}</p>
                  <div className="flex flex-wrap gap-3">
                    {report.lat && report.lng && (
                      <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                        <MapPin size={11} />
                        GPS: {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                      </span>
                    )}
                    {report.photo_url && (
                      <a href={report.photo_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg hover:bg-green-500/20 transition-colors">
                        <Camera size={11} />
                        View Photo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
