import type { Analysis } from '../types';
import { FLAG_ICONS, FLAG_LABELS, RISK_COLORS, RISK_BG } from '../utils/riskHelpers';
import { AlertTriangle, Info, CheckCircle, Zap } from 'lucide-react';
import RiskScoreBadge from './RiskScoreBadge';

interface Props {
  analysis: Analysis;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
}

export default function AnomalyReport({ analysis, onReanalyze, isReanalyzing }: Props) {
  const riskColor = RISK_COLORS[analysis.risk_level];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Risk Score */}
      <div className={`card p-6 bg-gradient-to-br ${analysis.risk_level === 'critical' ? 'from-red-500/10' : analysis.risk_level === 'high' ? 'from-orange-500/10' : 'from-yellow-500/10'} to-transparent`}>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <RiskScoreBadge score={analysis.risk_score} level={analysis.risk_level} showDonut />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="section-label">AI Risk Assessment</span>
              <span className="text-gray-600 text-xs font-mono">v{analysis.model_version}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{analysis.narrative_text}</p>
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${RISK_BG[analysis.risk_level]}`}>
              <Zap size={16} className="mt-0.5 flex-shrink-0" style={{ color: riskColor }} />
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: riskColor }}>Recommendation</p>
                <p className="text-sm">{analysis.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Flags */}
      {analysis.anomaly_flags.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-orange-400" />
            Detected Anomalies ({analysis.anomaly_flags.length})
          </h3>
          <div className="space-y-3">
            {analysis.contributing_factors.map((factor) => (
              <div key={factor.flag} className="flex items-start gap-4 p-4 bg-white/3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-9 h-9 flex items-center justify-center bg-red-500/10 rounded-lg flex-shrink-0 text-lg">
                  {FLAG_ICONS[factor.flag]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-200">{FLAG_LABELS[factor.flag]}</span>
                    <span className="text-xs text-red-400 font-mono font-semibold">+{factor.weight} pts</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{factor.explanation}</p>
                  {factor.details && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(factor.details).map(([k, v]) => (
                        <span key={k} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-gray-400">
                          <span className="text-gray-600">{k.replace(/_/g, ' ')}: </span>
                          <span className="text-gray-300 font-mono">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.anomaly_flags.length === 0 && (
        <div className="card p-5 flex items-center gap-4">
          <CheckCircle size={24} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-200">No Anomalies Detected</p>
            <p className="text-xs text-gray-500 mt-0.5">This project passes all automated risk checks.</p>
          </div>
        </div>
      )}

      {/* Footer meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Info size={12} />
          Analysis triggered by: <span className="text-gray-400">{analysis.triggered_by}</span>
          <span>·</span>
          <span>{new Date(analysis.created_at).toLocaleDateString('en-IN')}</span>
        </div>
        {onReanalyze && (
          <button onClick={onReanalyze} disabled={isReanalyzing} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-2">
            {isReanalyzing ? <span className="animate-spin">⟳</span> : <Zap size={12} />}
            {isReanalyzing ? 'Analyzing...' : 'Re-Analyze'}
          </button>
        )}
      </div>
    </div>
  );
}
