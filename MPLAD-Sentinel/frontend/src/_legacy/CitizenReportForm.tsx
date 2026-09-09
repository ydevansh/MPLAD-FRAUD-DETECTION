import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';
import { MapPin, Camera, Send, AlertCircle, CheckCircle, Loader, Navigation } from 'lucide-react';
import { reportsApi } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { CONDITION_LABELS } from '../utils/riskHelpers';

interface Props { project: Project }

export default function CitizenReportForm({ project }: Props) {
  const navigate = useNavigate();
  const { lat, lng, error: geoError, loading: geoLoading, getLocation, clear } = useGeolocation();
  const [formData, setFormData] = useState({ reporter_name: '', description: '', reported_condition: '', discrepancy_type: 'general' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.description || !formData.reported_condition) {
      setError('Please fill in the description and observed condition.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('project_id', project.id);
      fd.append('description', formData.description);
      fd.append('reported_condition', formData.reported_condition);
      fd.append('discrepancy_type', formData.discrepancy_type);
      if (formData.reporter_name) fd.append('reporter_name', formData.reporter_name);
      if (lat !== null) fd.append('lat', String(lat));
      if (lng !== null) fd.append('lng', String(lng));
      if (photo) fd.append('photo', photo);
      await reportsApi.submit(fd);
      setSubmitted(true);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center gap-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Report Submitted!</h3>
          <p className="text-gray-400 text-sm max-w-sm">Your report has been received and will contribute to the AI risk analysis for this project. Thank you for helping improve public accountability.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/projects/${project.id}`)} className="btn-primary">
            Back to Project
          </button>
          <button onClick={() => { setSubmitted(false); setFormData({ reporter_name: '', description: '', reported_condition: '', discrepancy_type: 'general' }); setPhoto(null); setPhotoPreview(null); clear(); }} className="btn-ghost">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Reporter Name (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Your Name <span className="text-gray-600">(Optional)</span></label>
        <input type="text" placeholder="Anonymous" value={formData.reporter_name}
          onChange={e => setFormData(f => ({ ...f, reporter_name: e.target.value }))}
          className="input" />
      </div>

      {/* Observed Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Observed Condition <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(CONDITION_LABELS).map(([value, label]) => (
            <button type="button" key={value}
              onClick={() => setFormData(f => ({ ...f, reported_condition: value }))}
              className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                formData.reported_condition === value
                  ? 'bg-sentinel-blue/20 border-sentinel-blue/60 text-blue-300'
                  : 'bg-white/3 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description <span className="text-red-400">*</span></label>
        <textarea rows={4} placeholder="Describe what you observed at the project site..."
          value={formData.description}
          onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
          className="input resize-none" />
        <p className="text-xs text-gray-600 mt-1">{formData.description.length}/500 characters</p>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Camera size={14} className="inline mr-1.5" />
          Upload Photo <span className="text-gray-600">(Optional, max 10MB)</span>
        </label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        {photoPreview ? (
          <div className="relative">
            <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-white/10" />
            <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-lg">
              Remove
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-sentinel-blue/50 hover:text-blue-400 transition-all">
            <Camera size={24} />
            <span className="text-sm">Click to upload a photo</span>
          </button>
        )}
      </div>

      {/* GPS Location */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <MapPin size={14} className="inline mr-1.5" />
          Location <span className="text-gray-600">(Optional, for GPS verification)</span>
        </label>
        {lat && lng ? (
          <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Navigation size={14} />
              <span>GPS captured: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
            </div>
            <button type="button" onClick={clear} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
          </div>
        ) : (
          <button type="button" onClick={getLocation} disabled={geoLoading}
            className="btn-ghost w-full flex items-center justify-center gap-2 py-3">
            {geoLoading ? <Loader size={15} className="animate-spin" /> : <Navigation size={15} />}
            {geoLoading ? 'Getting Location...' : 'Capture My Location'}
          </button>
        )}
        {geoError && <p className="text-red-400 text-xs mt-1.5">{geoError}</p>}
      </div>

      {/* Submit */}
      <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
        {submitting ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        {submitting ? 'Submitting...' : 'Submit Report'}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Your report will be reviewed and may contribute to the AI risk score for this project.
        Anonymous submissions are accepted.
      </p>
    </form>
  );
}
