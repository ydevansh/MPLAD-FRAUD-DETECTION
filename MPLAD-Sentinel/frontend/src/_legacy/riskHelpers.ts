import type { RiskLevel, AnomalyFlag } from '../types';

export const RISK_COLORS: Record<string, string> = {
  low: '#38A169',
  medium: '#D69E2E',
  high: '#DD6B20',
  critical: '#E53E3E',
  Low: '#38A169',
  Medium: '#D69E2E',
  High: '#DD6B20',
  Critical: '#E53E3E',
};

export const RISK_BG: Record<string, string> = {
  low: 'bg-green-500/15 border-green-500/30 text-green-400',
  medium: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  high: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  critical: 'bg-red-500/15 border-red-500/30 text-red-400',
  Low: 'bg-green-500/15 border-green-500/30 text-green-400',
  Medium: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  High: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  Critical: 'bg-red-500/15 border-red-500/30 text-red-400',
};

export const FLAG_LABELS: Record<AnomalyFlag, string> = {
  COST_OUTLIER: 'Cost Outlier',
  EXPENDITURE_PROGRESS_MISMATCH: 'Expenditure-Progress Mismatch',
  STALLED_PROJECT: 'Stalled Project',
  DUPLICATE_PROJECT: 'Duplicate Project',
  PHOTO_REUSE: 'Photo Reuse',
  SUSPICIOUS_CLUSTERING: 'Suspicious Clustering',
  PAYMENT_SPIKE: 'Payment Spike',
  CITIZEN_DISCREPANCY: 'Citizen Discrepancy',
};

export const FLAG_ICONS: Record<AnomalyFlag, string> = {
  COST_OUTLIER: '💰',
  EXPENDITURE_PROGRESS_MISMATCH: '📊',
  STALLED_PROJECT: '🔴',
  DUPLICATE_PROJECT: '🔁',
  PHOTO_REUSE: '📷',
  SUSPICIOUS_CLUSTERING: '🔗',
  PAYMENT_SPIKE: '⚡',
  CITIZEN_DISCREPANCY: '👥',
};

export const STATUS_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  sanctioned: 'Sanctioned',
  in_progress: 'In Progress',
  completed: 'Completed',
  stalled: 'Stalled',
};

export const STATUS_COLORS: Record<string, string> = {
  recommended: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  sanctioned: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  in_progress: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  completed: 'bg-green-500/15 border-green-500/30 text-green-400',
  stalled: 'bg-red-500/15 border-red-500/30 text-red-400',
};

export const CONDITION_LABELS: Record<string, string> = {
  as_per_report: 'As Per Official Report',
  partially_complete: 'Partially Complete',
  not_started: 'Not Started',
  damaged: 'Damaged / Deteriorated',
  non_existent: 'Non-Existent',
};

export function formatAmount(lakhs: number): string {
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(2)} Cr`;
  return `₹${lakhs.toFixed(2)} L`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getRiskGradient(level: RiskLevel): string {
  const gradients: Record<string, string> = {
    low: 'from-green-500/20 to-green-500/5',
    medium: 'from-yellow-500/20 to-yellow-500/5',
    high: 'from-orange-500/20 to-orange-500/5',
    critical: 'from-red-500/20 to-red-500/5',
    Low: 'from-green-500/20 to-green-500/5',
    Medium: 'from-yellow-500/20 to-yellow-500/5',
    High: 'from-orange-500/20 to-orange-500/5',
    Critical: 'from-red-500/20 to-red-500/5',
  };
  return gradients[level] || 'from-slate-500/20 to-slate-500/5';
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
