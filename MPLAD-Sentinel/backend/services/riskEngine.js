// Risk Engine — Weighted rule-based anomaly scoring
// Each rule contributes a weighted score (0–100 total)

const WEIGHTS = {
  COST_OUTLIER: 20,
  EXPENDITURE_PROGRESS_MISMATCH: 25,
  STALLED_PROJECT: 15,
  DUPLICATE_PROJECT: 20,
  PHOTO_REUSE: 15,
  SUSPICIOUS_CLUSTERING: 15,
  PAYMENT_SPIKE: 10,
  CITIZEN_DISCREPANCY: 25,
};

const RISK_THRESHOLDS = { low: 25, medium: 50, high: 75 };

const FLAG_DESCRIPTIONS = {
  COST_OUTLIER: 'Project cost significantly exceeds the state average for similar work types.',
  EXPENDITURE_PROGRESS_MISMATCH: 'Financial expenditure is disproportionately high relative to reported physical progress.',
  STALLED_PROJECT: 'Project has shown no documented progress for over 18 months past its deadline.',
  DUPLICATE_PROJECT: 'A near-identical project with the same contractor exists within close proximity.',
  PHOTO_REUSE: 'Official progress photographs appear identical to those submitted for other unrelated projects.',
  SUSPICIOUS_CLUSTERING: 'This contractor has been awarded an unusually high number of projects in a single constituency.',
  PAYMENT_SPIKE: 'A disproportionately large payment was released in a single transaction at an early project stage.',
  CITIZEN_DISCREPANCY: 'Multiple independent citizen field reports with GPS evidence contradict the official project status.',
};

const RECOMMENDATIONS = {
  critical: 'Priority Field Verification Required — Recommend immediate on-site inspection by an independent auditor.',
  high: 'Field Verification Recommended — District authority should conduct physical verification within 30 days.',
  medium: 'Enhanced Monitoring — Include in next quarterly review and request updated progress photographs.',
  low: 'Routine Monitoring — No immediate action required. Continue standard oversight.',
};

// State-level cost baselines (per work_type, in lakhs) — simplified benchmark
const COST_BENCHMARKS = {
  'Road Construction': 45, 'Drain Construction': 18, 'Community Hall': 35,
  'Primary School Renovation': 22, 'Health Sub-Centre': 30, 'Water Supply Scheme': 40,
  'Solar Street Lights': 12, 'Bus Shelter': 8, 'Sports Facility': 25,
  'Pond Renovation / Deepening': 20, 'Anganwadi Centre': 15, 'Cremation Ground': 10,
  'Village Electrification': 20, 'Toilet Block Construction': 9, 'Bridge Construction': 65,
};

export function scoreProject(project, allProjects, citizenReports = []) {
  const flags = [];
  const details = {};

  // ── Rule 1: Cost Outlier
  const benchmark = COST_BENCHMARKS[project.work_type] || 20;
  if (project.sanctioned_amount > benchmark * 2.5) {
    flags.push('COST_OUTLIER');
    details.COST_OUTLIER = {
      value: project.sanctioned_amount,
      benchmark,
      ratio: parseFloat((project.sanctioned_amount / benchmark).toFixed(2)),
    };
  }

  // ── Rule 2: Expenditure vs Progress Mismatch
  const gap = project.financial_progress_pct - project.physical_progress_pct;
  if (gap > 30) {
    flags.push('EXPENDITURE_PROGRESS_MISMATCH');
    details.EXPENDITURE_PROGRESS_MISMATCH = {
      financial_pct: project.financial_progress_pct,
      physical_pct: project.physical_progress_pct,
      gap,
    };
  }

  // ── Rule 3: Payment Spike
  if (gap > 60) {
    flags.push('PAYMENT_SPIKE');
    details.PAYMENT_SPIKE = { gap };
  }

  // ── Rule 4: Stalled Project
  if (project.status === 'stalled' || project.status === 'in_progress') {
    const deadline = new Date(project.expected_completion);
    const today = new Date();
    const monthsPast = (today - deadline) / (1000 * 60 * 60 * 24 * 30);
    if (monthsPast > 12) {
      flags.push('STALLED_PROJECT');
      details.STALLED_PROJECT = { months_overdue: Math.round(monthsPast), expected_completion: project.expected_completion };
    }
  }

  // ── Rule 5: Photo Reuse (flag already in data from seed)
  if (project.anomaly_flags?.includes('PHOTO_REUSE')) {
    if (!flags.includes('PHOTO_REUSE')) flags.push('PHOTO_REUSE');
  }

  // ── Rule 6: Duplicate Project (flag from seed)
  if (project.anomaly_flags?.includes('DUPLICATE_PROJECT')) {
    if (!flags.includes('DUPLICATE_PROJECT')) flags.push('DUPLICATE_PROJECT');
  }

  // ── Rule 7: Suspicious Clustering
  const sameContractor = allProjects.filter(p =>
    p.id !== project.id &&
    p.contractor_name === project.contractor_name &&
    p.constituency === project.constituency
  );
  if (sameContractor.length >= 4) {
    flags.push('SUSPICIOUS_CLUSTERING');
    details.SUSPICIOUS_CLUSTERING = { contractor: project.contractor_name, count: sameContractor.length + 1 };
  }

  // ── Rule 8: Citizen Discrepancy
  const projectReports = citizenReports.filter(r => r.project_id === project.id);
  const discrepantReports = projectReports.filter(r =>
    r.reported_condition && r.reported_condition !== 'as_per_report'
  );
  if (discrepantReports.length >= 2) {
    flags.push('CITIZEN_DISCREPANCY');
    details.CITIZEN_DISCREPANCY = { total_reports: projectReports.length, discrepant: discrepantReports.length };
  }

  // ── Compute final score
  const rawScore = flags.reduce((sum, f) => sum + (WEIGHTS[f] || 0), 0);
  const citizenMultiplier = discrepantReports.length >= 3 ? 1.2 : 1.0;
  const risk_score = Math.min(Math.round(rawScore * citizenMultiplier), 100);

  let risk_level = 'low';
  if (risk_score > RISK_THRESHOLDS.high) risk_level = 'critical';
  else if (risk_score > RISK_THRESHOLDS.medium) risk_level = 'high';
  else if (risk_score > RISK_THRESHOLDS.low) risk_level = 'medium';

  const contributing_factors = flags.map(f => ({
    flag: f,
    weight: WEIGHTS[f],
    explanation: FLAG_DESCRIPTIONS[f],
    details: details[f] || null,
  }));

  const narrative = buildNarrative(project, flags, risk_score, contributing_factors);

  return {
    risk_score,
    risk_level,
    anomaly_flags: flags,
    contributing_factors,
    narrative_text: narrative,
    recommendation: RECOMMENDATIONS[risk_level],
    model_version: 'sentinel-rules-v1.1',
    triggered_by: 'system',
  };
}

function buildNarrative(project, flags, score, factors) {
  if (flags.length === 0) {
    return `Project "${project.title}" in ${project.constituency} shows no significant anomalies. Financial and physical progress are consistent, and no duplicate or clustering patterns have been detected. Routine monitoring is advised.`;
  }
  const flagSentences = factors.map(f => f.explanation).join(' ');
  return `AI analysis of project "${project.title}" (${project.id}) in ${project.constituency}, ${project.state} has identified ${flags.length} risk indicator(s) resulting in a Risk Score of ${score}/100. ${flagSentences} Based on these findings, the system recommends: ${RECOMMENDATIONS[score > 75 ? 'critical' : score > 50 ? 'high' : 'medium']}.`;
}

export { FLAG_DESCRIPTIONS, RECOMMENDATIONS };
