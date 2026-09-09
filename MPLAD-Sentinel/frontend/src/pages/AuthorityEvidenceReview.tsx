import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  MapPin,
  Camera,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Layers,
  TrendingUp,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { getAdminProjectEvidence } from '../services/api';
import type { AdminProjectEvidenceData } from '../types';
import MapView from '../components/MapView';

export default function AuthorityEvidenceReview() {
  const { projectId } = useParams<{ projectId: string }>();
  const [data, setData] = useState<AdminProjectEvidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getAdminProjectEvidence(projectId)
      .then((res) => {
        if (res.data) setData(res.data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch evidence review data');
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-36 gap-3 text-slate-500">
        <Loader2 size={28} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading citizen evidence inspection cockpit...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={44} className="text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Evidence Data Unavailable</h2>
        <p className="text-slate-500 text-sm mb-6">{error || 'Could not load project evidence records.'}</p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          &larr; Back to Authority Dashboard
        </Link>
      </div>
    );
  }

  const { project, evidenceSummary, reports } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Authority Dashboard</span>
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-xs text-slate-500 font-medium">Evidence Review</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Camera size={14} />
              <span>Authority Evidence Review Cockpit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Inspection of citizen-submitted ground evidence, GPS location consistency, and photo comparison.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to={`/projects/${project.projectId}`}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <span>Public Page</span>
              <ExternalLink size={13} />
            </Link>
            <Link
              to={`/projects/${project.projectId}/report`}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <span>Submit Ground Report</span>
            </Link>
          </div>
        </div>

        {/* Project Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-slate-400 block text-[10px]">Project ID</span>
            <span className="font-mono font-bold text-slate-800 text-xs">{project.projectId}</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-slate-400 block text-[10px]">Sanctioned / Expended</span>
            <span className="font-bold text-slate-800">₹{project.sanctionedAmount}L / ₹{project.expenditure}L</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-slate-400 block text-[10px]">Physical Progress</span>
            <span className="font-bold text-blue-700">{project.physicalProgress}%</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-slate-400 block text-[10px]">Status & Category</span>
            <span className="font-bold text-slate-800">{project.status} • {project.category}</span>
          </div>
        </div>
      </div>

      {/* Evidence Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block mb-1">Total Ground Reports</span>
          <span className="text-2xl font-extrabold text-slate-900">{evidenceSummary.reportCount}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Submitted by citizens</span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-emerald-700 font-medium block mb-1">Location Consistent</span>
          <span className="text-2xl font-extrabold text-emerald-900">{evidenceSummary.locationSignals.consistent}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Near official coordinates</span>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/30 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-amber-700 font-medium block mb-1">Location Discrepancy</span>
          <span className="text-2xl font-extrabold text-amber-900">{evidenceSummary.locationSignals.distant}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">Distant GPS coordinates</span>
        </div>

        <div className="bg-white border border-blue-200 bg-blue-50/30 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-blue-700 font-medium block mb-1">Image Similarity Signals</span>
          <span className="text-2xl font-extrabold text-blue-900">{evidenceSummary.imageSignals.highSimilarity}</span>
          <span className="text-[10px] text-blue-600 block mt-0.5">&ge;85% resemblance to photos</span>
        </div>
      </div>

      {/* Official Project Location Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <MapPin size={18} className="text-blue-600" />
          <span>Official Project Location</span>
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Designated site coordinates recorded in the MPLADS project sanction order.
        </p>

        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-4">
          <MapView
            projects={[project as any]}
            height="260px"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px]">District & State</span>
            <span className="font-medium text-slate-800">{project.district}, {project.state}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Site Address</span>
            <span className="font-medium text-slate-800 truncate block">{project.address || 'Designated constituency site'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Latitude</span>
            <span className="font-mono font-medium text-slate-800">{project.latitude}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Longitude</span>
            <span className="font-mono font-medium text-slate-800">{project.longitude}</span>
          </div>
        </div>
      </div>

      {/* Visual Separation: Official Site Photos vs Citizen Evidence Photos */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ImageIcon size={18} className="text-blue-600" />
          <span>Photo Evidence Comparison</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Official Photos */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Official Project Site Photographs
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                OFFICIAL
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(project.images && project.images.length > 0 ? project.images : [
                'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&q=80',
                'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=600&q=80',
              ]).slice(0, 2).map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img src={img} alt={`Official site ${i + 1}`} className="w-full h-36 object-cover" />
                  <div className="p-2 text-[10px] font-medium text-slate-500 bg-white">
                    Official Record #{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen Evidence Photos */}
          <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Citizen Submitted Evidence Photos
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                GROUND EVIDENCE
              </span>
            </div>
            {reports.filter((r) => r.imageUrl).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No citizen photographs submitted for this project yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {reports
                  .filter((r) => r.imageUrl)
                  .slice(0, 4)
                  .map((rep) => (
                    <div key={rep.reportId} className="rounded-xl overflow-hidden border border-indigo-200 bg-white shadow-sm">
                      <img src={rep.imageUrl} alt={rep.reportId} className="w-full h-36 object-cover" />
                      <div className="p-2 text-[10px] text-slate-600 bg-white flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-700">{rep.reportId}</span>
                        <span className="text-slate-400">{rep.category}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Individual Citizen Reports Detailed Audit Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Submitted Citizen Ground Reports ({reports.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized inspection record showing raw feedback, distance metrics, GPS accuracy, and image similarity.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No citizen verification reports have been recorded for this project yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.reportId}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs bg-blue-100/70 text-blue-800 px-2.5 py-0.5 rounded-md">
                      {rep.reportId}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{rep.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={12} />
                    <span>{new Date(rep.submittedAt).toLocaleDateString()}</span>
                    <Clock size={12} className="ml-1" />
                    <span>{new Date(rep.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Observation Text */}
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-slate-800 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-200/80">
                      "{rep.description}"
                    </p>

                    {/* Verification Signals Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {rep.verificationSignals &&
                        rep.verificationSignals.map((sig, sIdx) => (
                          <span
                            key={sIdx}
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              sig.severity === 'MEDIUM' || sig.severity === 'HIGH'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {sig.title}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Technical Coordinates & Similarity Box */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">GPS Proximity Status</span>
                      <span
                        className={`font-bold inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] ${
                          rep.locationStatus === 'VERY_CLOSE' || rep.locationStatus === 'CLOSE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rep.locationStatus === 'UNKNOWN'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {rep.locationStatus.replace(/_/g, ' ')}
                      </span>
                      {rep.locationDistanceMeters !== undefined && (
                        <span className="text-slate-500 ml-1.5 font-medium">
                          ({rep.locationDistanceMeters < 1000 ? `${rep.locationDistanceMeters}m` : `${rep.locationDistanceKm} km`})
                        </span>
                      )}
                    </div>

                    {rep.latitude && rep.longitude && (
                      <div>
                        <span className="text-slate-400 block text-[10px]">Citizen GPS (Authorized View)</span>
                        <span className="font-mono text-slate-700">
                          {rep.latitude.toFixed(4)}, {rep.longitude.toFixed(4)}
                        </span>
                        {rep.gpsAccuracy ? (
                          <span className="text-slate-400 ml-1">(±{Math.round(rep.gpsAccuracy)}m)</span>
                        ) : null}
                      </div>
                    )}

                    {rep.imageSimilarity && rep.imageSimilarity.result !== 'NONE' && (
                      <div className="border-t border-slate-100 pt-1.5">
                        <span className="text-slate-400 block text-[10px]">Image Similarity</span>
                        <span className="font-semibold text-slate-800">
                          {rep.imageSimilarity.result.replace(/_/g, ' ')}
                        </span>
                        {rep.imageSimilarity.similarityScore > 0 && (
                          <span className="text-slate-500 ml-1">
                            ({Math.round(rep.imageSimilarity.similarityScore * 100)}%)
                          </span>
                        )}
                        {rep.imageSimilarity.message && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{rep.imageSimilarity.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mandatory Authority Disclaimer Banner */}
        <div className="mt-8 p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
          <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <span className="font-bold">Official Verification Principle: </span>
            Citizen evidence creates automated verification signals; it does not automatically confirm fraud or foul play. Final inquiry, formal audit, and physical site inspections remain the sole prerogative of competent authorities.
          </div>
        </div>
      </div>
    </div>
  );
}
