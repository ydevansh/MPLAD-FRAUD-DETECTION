import { Project } from '../models/Project.js';
import { Report } from '../models/Report.js';
import { Analysis } from '../models/Analysis.js';

export function getDashboardStats(req, res) {
  const stats = Project.getStats();
  const topRisk = Project.getTopRisk(10);
  const stateRisk = Project.getStateRiskMap();
  const recentReports = Report.getRecentReports(8);
  const allAnalyses = Analysis.getAll();

  // Risk score distribution for chart
  const allProjects = Project.findAll({ limit: 9999 }).data;
  const scoreDistribution = [
    { range: '0-25 (Low)', count: allProjects.filter(p => p.risk_score <= 25).length, color: '#38A169' },
    { range: '26-50 (Medium)', count: allProjects.filter(p => p.risk_score > 25 && p.risk_score <= 50).length, color: '#D69E2E' },
    { range: '51-75 (High)', count: allProjects.filter(p => p.risk_score > 50 && p.risk_score <= 75).length, color: '#DD6B20' },
    { range: '76-100 (Critical)', count: allProjects.filter(p => p.risk_score > 75).length, color: '#E53E3E' },
  ];

  // Expenditure vs progress scatter sample (top 30 by risk)
  const scatterData = allProjects
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 50)
    .map(p => ({
      id: p.id,
      title: p.title.substring(0, 30),
      financial_pct: p.financial_progress_pct,
      physical_pct: p.physical_progress_pct,
      risk_score: p.risk_score,
      risk_level: p.risk_level,
    }));

  // Flag frequency
  const flagFrequency = {};
  allProjects.forEach(p => {
    (p.anomaly_flags || []).forEach(f => {
      flagFrequency[f] = (flagFrequency[f] || 0) + 1;
    });
  });

  res.json({
    summary: {
      total_projects: stats.total,
      total_sanctioned_cr: parseFloat((stats.totalSanctioned / 100).toFixed(2)),
      total_expended_cr: parseFloat((stats.totalExpended / 100).toFixed(2)),
      high_risk_projects: stats.byRisk.high + stats.byRisk.critical,
      critical_projects: stats.byRisk.critical,
      citizen_reports: Report.getRecentReports(9999).length,
    },
    by_risk: stats.byRisk,
    by_status: stats.byStatus,
    by_state: stats.byState,
    top_risk_projects: topRisk,
    state_risk_map: stateRisk,
    recent_citizen_reports: recentReports,
    score_distribution: scoreDistribution,
    scatter_data: scatterData,
    flag_frequency: flagFrequency,
  });
}
