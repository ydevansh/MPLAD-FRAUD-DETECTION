import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Upload,
  LocateFixed,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ShieldAlert,
  Info,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';
import { getProjectById, submitCitizenReport } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import type { Project, CitizenReportCategory, CitizenReport } from '../types';

const CATEGORIES: CitizenReportCategory[] = [
  'Project Progress',
  'Project Not Found',
  'Work Quality',
  'Project Status',
  'Project Location',
  'Project Information',
  'Other',
];

export default function CitizenReportForm() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState<CitizenReportCategory>('Project Progress');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geolocation hook
  const { state: geoState, requestLocation } = useGeolocation();

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<CitizenReport | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch project context
  useEffect(() => {
    if (!projectId) return;
    setLoadingProject(true);
    getProjectById(projectId)
      .then((res) => {
        if (res.data) setProject(res.data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load project context');
      })
      .finally(() => setLoadingProject(false));
  }, [projectId]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('The selected image exceeds the 5 MB prototype limit. Please choose a smaller photo.');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setSubmitError('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    setSubmitError(null);
    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!description.trim() || description.trim().length < 5) {
      setSubmitError('Please provide detailed feedback or a description (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description.trim());

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      if (geoState.status === 'success') {
        formData.append('latitude', String(geoState.location.latitude));
        formData.append('longitude', String(geoState.location.longitude));
        formData.append('gpsAccuracy', String(geoState.location.accuracy));
      }

      const res = await submitCitizenReport(project.projectId, formData);
      if (res.success && res.data) {
        setSubmissionSuccess(res.data);
      } else {
        throw new Error(res.error || 'Failed to submit report');
      }
    } catch (err: any) {
      console.error('[submitCitizenReport]', err);
      setSubmitError(err.message || 'Error submitting citizen report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="flex flex-col items-center justify-center py-36 gap-3 text-slate-500">
        <Loader2 size={28} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading project verification workspace...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={44} className="text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Project Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{error || 'Could not find the requested project record.'}</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          &larr; Back to Projects Directory
        </Link>
      </div>
    );
  }

  // ── Success State Screen ──────────────────────────────────────────────────
  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Thank you for helping verify this project.
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-8">
            Your ground observation creates valuable verification signals for monitoring authorities.
          </p>

          {/* Evidence Receipt Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mb-6 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs text-slate-500 font-medium">Report Reference ID</span>
              <span className="font-mono font-bold text-blue-700 text-sm bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                {submissionSuccess.reportId}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">Evidence Received:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-slate-700">{submissionSuccess.imageUrl ? 'Photo' : 'Feedback only'}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">{submissionSuccess.locationStatus !== 'UNKNOWN' ? '✓' : '—'}</span>
                  <span className="text-slate-700">{submissionSuccess.locationStatus !== 'UNKNOWN' ? 'GPS' : 'No GPS'}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-slate-700">Timestamp</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-slate-700">Feedback</span>
                </div>
              </div>
            </div>

            {/* Location Status Signal */}
            {submissionSuccess.locationStatus && submissionSuccess.locationStatus !== 'UNKNOWN' && (
              <div className="border-t border-slate-200/80 pt-3">
                <span className="text-xs text-slate-500 font-medium block mb-1">Location Proximity Signal:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      submissionSuccess.locationStatus === 'VERY_CLOSE' || submissionSuccess.locationStatus === 'CLOSE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {submissionSuccess.locationStatus.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-600">
                    ({submissionSuccess.locationDistanceMeters !== undefined && submissionSuccess.locationDistanceMeters < 1000
                      ? `${submissionSuccess.locationDistanceMeters}m from official coordinates`
                      : `${submissionSuccess.locationDistanceKm} km from official coordinates`})
                  </span>
                </div>
                {submissionSuccess.locationSignal && (
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {submissionSuccess.locationSignal}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Mandatory Disclaimer */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-blue-900 text-left mb-8">
            <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="leading-relaxed">
              <span className="font-bold text-blue-950">Important Notice: </span>
              Your report is an automated verification signal. Final assessment and case actions are performed by monitoring authorities.
            </div>
          </div>

          <button
            onClick={() => navigate(`/projects/${project.projectId}`)}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm shadow-md"
          >
            Back to Project Details
          </button>
        </div>
      </div>
    );
  }

  // ── Reporting Form View ───────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Back button */}
      <Link
        to={`/projects/${project.projectId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to {project.name}</span>
      </Link>

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200/80 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Camera size={14} />
          <span>Citizen Ground Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Verify This Project
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Submit genuine ground-level feedback with photo evidence and optional GPS to help keep MPLADS development accountable.
        </p>

        {/* Project snippet */}
        <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">{project.projectId}</span>
            <span className="font-bold text-slate-900 line-clamp-1">{project.name}</span>
            <span className="text-slate-500 text-[11px]">📍 {project.district}, {project.state}</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
            {project.status}
          </span>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 1. Category */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            1. Feedback Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs font-medium p-2.5 rounded-xl border text-left transition-all ${
                  category === cat
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold shadow-sm ring-1 ring-blue-600/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Description */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            2. Ground Observation / Feedback <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you observe on site (e.g., current stage of physical construction, material availability, board visibility, or if work appears incomplete)."
            className="w-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">Please be objective and factual.</p>
        </div>

        {/* 3. Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            3. Current Site Photo (Recommended)
          </label>

          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-w-sm">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3">
                <span className="text-[11px] text-white font-medium truncate max-w-[200px]">
                  {selectedFile?.name}
                </span>
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow"
                >
                  <Trash2 size={12} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Camera size={22} />
              </div>
              <p className="text-xs font-bold text-slate-800 mb-0.5">Click to Take or Upload Photo</p>
              <p className="text-[11px] text-slate-400">Supports JPG, PNG, WEBP up to 5 MB</p>
            </div>
          )}
        </div>

        {/* 4. GPS Location */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            4. Current GPS Location
          </label>

          {geoState.status === 'success' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">GPS Coordinates Captured</span>
                  <p className="text-xs font-mono text-emerald-800 mt-0.5">
                    Lat: {geoState.location.latitude.toFixed(4)}, Lng: {geoState.location.longitude.toFixed(4)}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                    Accuracy: ±{Math.round(geoState.location.accuracy)} meters
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={requestLocation}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline"
              >
                Re-check
              </button>
            </div>
          ) : geoState.status === 'loading' ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <Loader2 size={20} className="animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">Detecting your location...</p>
              <p className="text-[11px] text-slate-400">Please allow browser location permission.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={requestLocation}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <LocateFixed size={16} className="text-blue-600" />
                <span>Use My Current Location</span>
              </button>
              {geoState.status === 'error' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-xl">
                  ⚠️ {geoState.message} You can still submit feedback without GPS.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Disclaimer Notice */}
        <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-blue-900 leading-relaxed">
          <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-blue-950">Verification Signal Notice: </span>
            Citizen evidence creates a ground verification signal. Final investigation and decisions remain with authorized officials.
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Analyzing & Submitting Evidence...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>Submit Citizen Verification Report</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
