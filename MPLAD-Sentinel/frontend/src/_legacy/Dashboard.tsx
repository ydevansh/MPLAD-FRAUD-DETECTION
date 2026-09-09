import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, AlertTriangle, Users, TrendingUp, IndianRupee, Loader, ArrowRight, MapPin } from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { DashboardData } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, ScatterChart, Scatter, CartesianGrid } from 'recharts';
import RiskScoreBadge from '../components/RiskScoreBadge';
import { formatAmount, formatDate, FLAG_LABELS, FLAG_ICONS, STATUS_LABELS, STATUS_COLORS } from '../utils/riskHelpers';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader size={32} className="animate-spin text-blue-400" />
    </div>
  );
  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load dashboard data.</div>;

  const { summary, by_risk, top_risk_projects, state_risk_map, recent_citizen_reports, score_distribution, scatter_data, flag_frequency, by_status } = data;

  const statusChartData = Object.entries(by_status).map(([s, c]) => ({ name: STATUS_LABELS[s] || s, value: c }));
  const flagData = Object.entries(flag_frequency).sort((a, b) => b[1] - a[1]).map(([flag, count]) => ({
    name: FLAG_LABELS[flag as keyof typeof FLAG_LABELS] || flag,
    icon: FLAG_ICONS[flag as keyof typeof FLAG_ICONS] || '⚠️',
    count,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="section-label mb-1">National Overview</p>
        <h1 className="text-3xl font-bold text-white">MPLADS Intelligence Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time AI risk analysis across 150+ MPLADS projects</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Projects', value: summary.total_projects, icon: BarChart3, color: 'text-blue-400', bg: 'from-blue-500/10' },
          { label: 'Sanctioned', value: `₹${summary.total_sanctioned_cr}Cr`, icon: IndianRupee, color: 'text-cyan-400', bg: 'from-cyan-500/10' },
          { label: 'Expended', value: `₹${summary.total_expended_cr}Cr`, icon: TrendingUp, color: 'text-purple-400', bg: 'from-purple-500/10' },
          { label: 'High Risk', value: summary.high_risk_projects, icon: AlertTriangle, color: 'text-orange-400', bg: 'from-orange-500/10' },
          { label: 'Critical', value: summary.critical_projects, icon: AlertTriangle, color: 'text-red-400', bg: 'from-red-500/10' },
          { label: 'Citizen Reports', value: summary.citizen_reports, icon: Users, color: 'text-green-400', bg: 'from-green-500/10' },
        ].map(card => (
          <div key={card.label} className={`card p-4 bg-gradient-to-br ${card.bg} to-transparent`}>
            <card.icon size={18} className={`${card.color} mb-2`} />
            <p className={`text-2xl font-bold font-mono ${card.color}`}>{card.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Risk Distribution Pie */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={score_distribution} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={({ range, count }) => count > 0 ? count : ''} labelLine={false}>
                {score_distribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {score_distribution.map(d => (
              <div key={d.range} className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span>{d.range}: <span className="text-gray-300 font-mono">{d.count}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Status Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Projects by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={90} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="#1B4FFF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly Flags Frequency */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Top Anomaly Flags</h2>
          <div className="space-y-2.5">
            {flagData.slice(0, 6).map(f => (
              <div key={f.name} className="flex items-center gap-3">
                <span className="text-base w-6 flex-shrink-0">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 truncate">{f.name}</span>
                    <span className="text-red-400 font-mono ml-2">{f.count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${(f.count / flagData[0].count) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenditure vs Progress Scatter */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-200 mb-1">Expenditure vs Physical Progress</h2>
        <p className="text-xs text-gray-500 mb-4">Points above the diagonal indicate potential mismatches (higher spend than progress)</p>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="physical_pct" name="Physical %" tick={{ fontSize: 11, fill: '#6b7280' }} label={{ value: 'Physical Progress (%)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#6b7280' }} />
            <YAxis dataKey="financial_pct" name="Financial %" tick={{ fontSize: 11, fill: '#6b7280' }} label={{ value: 'Financial (%)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6b7280' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return <div className="bg-sentinel-card border border-white/10 p-3 rounded-xl text-xs"><p className="text-white font-medium mb-1">{d.title}</p><p className="text-gray-400">Physical: {d.physical_pct}% | Financial: {d.financial_pct}%</p><p className="text-orange-400 mt-1">Risk: {d.risk_score}/100</p></div>;
              }} />
            <Scatter data={scatter_data} fill="#1B4FFF"
              shape={(props: { cx?: number; cy?: number; payload?: { risk_level: string } }) => {
                const colors: Record<string, string> = { low: '#38A169', medium: '#D69E2E', high: '#DD6B20', critical: '#E53E3E' };
                return <circle cx={props.cx} cy={props.cy} r={5} fill={colors[props.payload?.risk_level || 'low']} fillOpacity={0.8} />;
              }} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* State Risk Map + Top Risk Table */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* State Risk */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Risk by State</h2>
          <div className="space-y-3">
            {state_risk_map.sort((a, b) => b.avg_risk - a.avg_risk).map(s => (
              <div key={s.state} className="flex items-center gap-3">
                <MapPin size={13} className="text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{s.state}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-400 font-mono">{s.high_risk} high-risk</span>
                      <span className="text-gray-400 font-mono">avg {s.avg_risk}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.avg_risk}%`, background: s.avg_risk > 50 ? '#E53E3E' : s.avg_risk > 25 ? '#DD6B20' : '#38A169' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Citizen Reports */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Recent Citizen Reports</h2>
            <Link to="/projects" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recent_citizen_reports.slice(0, 6).map(r => (
              <div key={r.id} className="flex items-start gap-3 p-3 bg-white/3 rounded-xl">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${r.reported_condition !== 'as_per_report' ? 'bg-orange-400' : 'bg-green-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 line-clamp-2">{r.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-600">{r.id}</span>
                    {r.lat && <span className="text-[10px] text-blue-500">📍 GPS</span>}
                    {r.photo_url && <span className="text-[10px] text-green-500">📷 Photo</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Risk Projects Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" /> Top Risk Projects
          </h2>
          <Link to="/projects?sort=risk_score&risk_level=high" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            See all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500">
                <th className="text-left pb-3 font-medium">Project</th>
                <th className="text-left pb-3 font-medium">State</th>
                <th className="text-left pb-3 font-medium">Amount</th>
                <th className="text-left pb-3 font-medium">Progress</th>
                <th className="text-left pb-3 font-medium">Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {top_risk_projects.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-3 pr-4">
                    <Link to={`/projects/${p.id}`} className="text-gray-200 hover:text-white font-medium line-clamp-1 text-xs">{p.title}</Link>
                    <p className="text-gray-600 text-[10px] mt-0.5">{p.constituency} · {p.mp_name}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-400">{p.state}</td>
                  <td className="py-3 pr-4 text-xs font-mono text-gray-300">{formatAmount(p.sanctioned_amount)}</td>
                  <td className="py-3 pr-4">
                    <div className="text-xs text-gray-400">
                      <span>Phy: {p.physical_progress_pct}%</span>
                      <span className="mx-1 text-gray-700">|</span>
                      <span className={p.financial_progress_pct - p.physical_progress_pct > 30 ? 'text-red-400' : ''}>Fin: {p.financial_progress_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <RiskScoreBadge score={p.risk_score} level={p.risk_level} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
