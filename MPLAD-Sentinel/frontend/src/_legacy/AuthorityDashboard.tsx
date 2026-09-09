import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogIn, Loader, AlertTriangle, CheckCircle, ArrowRight, Users, Clock } from 'lucide-react';
import { authApi, reportsApi } from '../services/api';
import { useProjects } from '../hooks/useProjects';
import RiskScoreBadge from '../components/RiskScoreBadge';
import { formatAmount, formatDate, STATUS_COLORS, STATUS_LABELS, CONDITION_LABELS } from '../utils/riskHelpers';
import type { CitizenReport } from '../types';

export default function AuthorityDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('sentinel_token');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [pendingReports, setPendingReports] = useState<CitizenReport[]>([]);
  const { data: criticalProjects } = useProjects({ sort: 'risk_score', limit: 20 });
  const highRisk = criticalProjects?.data.filter(p => p.risk_score > 25) || [];

  useEffect(() => {
    if (token) {
      reportsApi.list({ status: 'pending', limit: 50 }).then(r => setPendingReports(r.data));
    }
  }, [token]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const { token: t } = await authApi.login(loginData.username, loginData.password);
      localStorage.setItem('sentinel_token', t);
      navigate(0); // reload page
    } catch {
      setLoginError('Invalid credentials. Use: authority / sentinel2024');
    } finally {
      setLoginLoading(false);
    }
  }

  // Login Page
  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Authority Login</h1>
            <p className="text-gray-500 text-sm">Secure access for government officers</p>
          </div>
          <div className="card p-6">
            {loginError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{loginError}</div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input type="text" value={loginData.username} onChange={e => setLoginData(d => ({ ...d, username: e.target.value }))} className="input" placeholder="authority" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input type="password" value={loginData.password} onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))} className="input" placeholder="sentinel2024" required />
              </div>
              <button type="submit" disabled={loginLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loginLoading ? <Loader size={16} className="animate-spin" /> : <LogIn size={16} />}
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-600 mt-4">Demo credentials: authority / sentinel2024</p>
          </div>
        </div>
      </div>
    );
  }

  // Authority Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-label mb-1">Authority Portal</p>
          <h1 className="text-2xl font-bold text-white">Risk Investigation Queue</h1>
          <p className="text-gray-500 text-sm mt-1">Manage flagged projects and pending citizen reports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
            <CheckCircle size={12} /> Authenticated
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'High-Risk Projects', value: highRisk.length, icon: AlertTriangle, color: 'text-red-400', bg: 'from-red-500/10' },
          { label: 'Pending Reports', value: pendingReports.length, icon: Clock, color: 'text-yellow-400', bg: 'from-yellow-500/10' },
          { label: 'Flagged Projects', value: criticalProjects?.data.filter(p => p.anomaly_flags.length > 0).length || 0, icon: Shield, color: 'text-orange-400', bg: 'from-orange-500/10' },
          { label: 'With Citizen Evidence', value: criticalProjects?.data.filter(p => p.citizen_report_count > 0).length || 0, icon: Users, color: 'text-blue-400', bg: 'from-blue-500/10' },
        ].map(c => (
          <div key={c.label} className={`card p-4 bg-gradient-to-br ${c.bg} to-transparent`}>
            <c.icon size={18} className={`${c.color} mb-2`} />
            <p className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* High Risk Projects Queue */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" /> Risk Investigation Queue
            </h2>
            <Link to="/projects?sort=risk_score" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {highRisk.slice(0, 8).map(p => (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="flex items-center gap-3 p-3 bg-white/3 rounded-xl hover:bg-white/6 transition-colors border border-white/5 hover:border-white/10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-gray-600">{p.id}</span>
                    <span className={`border rounded-full text-[9px] font-semibold px-1.5 py-0.5 ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-200 line-clamp-1">{p.title}</p>
                  <p className="text-[10px] text-gray-600">{p.constituency} · {formatAmount(p.sanctioned_amount)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <RiskScoreBadge score={p.risk_score} level={p.risk_level} size="sm" />
                  {p.citizen_report_count > 0 && (
                    <span className="text-[9px] text-purple-400 flex items-center gap-0.5"><Users size={8} />{p.citizen_report_count} reports</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending Citizen Reports */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Clock size={14} className="text-yellow-400" /> Pending Citizen Reports
            </h2>
            <span className="text-xs text-yellow-400 font-mono">{pendingReports.length} pending</span>
          </div>
          {pendingReports.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">No pending reports.</div>
          ) : (
            <div className="space-y-2">
              {pendingReports.slice(0, 8).map(r => (
                <div key={r.id} className={`p-3 rounded-xl border transition-colors ${r.reported_condition !== 'as_per_report' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/3 border-white/5'}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link to={`/projects/${r.project_id}`} className="text-xs font-mono text-blue-400 hover:text-blue-300">{r.project_id}</Link>
                    <div className="flex items-center gap-1.5">
                      {r.lat && <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">GPS</span>}
                      {r.photo_url && <span className="text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Photo</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-1">{r.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium ${r.reported_condition !== 'as_per_report' ? 'text-orange-400' : 'text-green-400'}`}>
                      {CONDITION_LABELS[r.reported_condition] || r.reported_condition}
                    </span>
                    <span className="text-[10px] text-gray-600">{formatDate(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
