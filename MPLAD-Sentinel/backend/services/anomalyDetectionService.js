import Project from '../models/Project.js';
import {
  calculateFinancialMetrics,
  calculateProgressSpending,
  calculateTimelineStatus,
  calculateDataQualityWarnings,
  calculateComparableCost,
} from './projectIntelligenceService.js';

/**
 * Phase 5 — AI-Powered Anomaly Detection Engine
 * Deterministic, explainable, rule-and-similarity-based anomaly detection.
 * Strictly adheres to: Detection ≠ Proof of Fraud.
 */

// ── Tokenizer & Jaccard Similarity for Check F ─────────────────────────────────
const STOP_WORDS = new Set([
  'and', 'the', 'of', 'at', 'in', 'for', 'with', 'to', 'a', 'an', 'on',
  'near', 'from', 'across', 'ward', 'sector', 'block', 'pradesh', 'uttar',
  'madhya', 'bihar', 'rajasthan', 'maharashtra',
]);

function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function computeSimilarity(projA, projB) {
  // Combine title, description, category, district
  const textA = `${projA.name} ${projA.category} ${projA.district} ${projA.address || ''}`;
  const textB = `${projB.name} ${projB.category} ${projB.district} ${projB.address || ''}`;

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? Number((intersection / union).toFixed(2)) : 0;
}

/**
 * Evaluates an individual project across 6 explainable checks.
 */
export async function detectAnomalies(project, allProjects = null) {
  const anomalies = [];

  // Compute baseline metrics
  const financial = calculateFinancialMetrics(project);
  const progress  = calculateProgressSpending(project, financial);
  const timeline  = calculateTimelineStatus(project);
  const warnings  = calculateDataQualityWarnings(project, financial);
  const comparable = await calculateComparableCost(project);

  // ── CHECK A: Progress vs Spending Anomaly ──────────────────────────────────
  if (progress.progressSpendingDifference > 30) {
    anomalies.push({
      type: 'PROGRESS_SPENDING_MISMATCH',
      severity: 'HIGH',
      title: 'Significant Progress-Spending Mismatch',
      message: `Disbursed expenditure (${financial.expenditurePercentage}%) is substantially higher than reported physical progress (${progress.physicalProgress}%), creating a ${progress.progressSpendingDifference} percentage point gap.`,
      recommendation: 'Priority field inspection recommended to verify physical ground progress.',
      values: {
        physicalProgress: progress.physicalProgress,
        expenditurePercentage: financial.expenditurePercentage,
        difference: progress.progressSpendingDifference,
      },
    });
  } else if (progress.progressSpendingDifference > 15) {
    anomalies.push({
      type: 'PROGRESS_SPENDING_MISMATCH',
      severity: 'MEDIUM',
      title: 'Moderate Progress-Spending Mismatch',
      message: `Expenditure (${financial.expenditurePercentage}%) is pacing ahead of verified physical completion (${progress.physicalProgress}%) by ${progress.progressSpendingDifference} percentage points.`,
      recommendation: 'Closer monitoring required on upcoming milestone deliverables.',
      values: {
        physicalProgress: progress.physicalProgress,
        expenditurePercentage: financial.expenditurePercentage,
        difference: progress.progressSpendingDifference,
      },
    });
  }

  // ── CHECK B: Financial Release / Expenditure Inconsistency ─────────────────
  if (financial.expenditure > financial.releasedAmount && financial.releasedAmount > 0) {
    const diff = Number((financial.expenditure - financial.releasedAmount).toFixed(2));
    anomalies.push({
      type: 'EXPENDITURE_RELEASE_INCONSISTENCY',
      severity: 'HIGH',
      title: 'Expenditure Exceeds Released Amount',
      message: `Recorded expenditure (₹${financial.expenditure}L) exceeds officially released funds (₹${financial.releasedAmount}L) by ₹${diff}L.`,
      recommendation: 'Reconcile treasury disbursal statements with implementing agency books.',
      values: {
        sanctionedAmount: financial.sanctionedAmount,
        releasedAmount: financial.releasedAmount,
        expenditure: financial.expenditure,
        excessAmount: diff,
      },
    });
  }

  if (financial.releasedAmount > financial.sanctionedAmount) {
    anomalies.push({
      type: 'RELEASE_SANCTION_INCONSISTENCY',
      severity: 'MEDIUM',
      title: 'Released Funds Exceed Total Sanctioned Budget',
      message: `Total released amount (₹${financial.releasedAmount}L) exceeds the sanctioned project allocation (₹${financial.sanctionedAmount}L).`,
      recommendation: 'Verify revised administrative sanction or supplementary budget orders.',
      values: {
        sanctionedAmount: financial.sanctionedAmount,
        releasedAmount: financial.releasedAmount,
      },
    });
  }

  // ── CHECK C: Timeline Anomaly ─────────────────────────────────────────────
  if (timeline.timelineStatus === 'DELAYED') {
    const overdue = timeline.daysOverdue || 0;
    anomalies.push({
      type: 'TIMELINE_DELAY',
      severity: overdue > 30 ? 'HIGH' : 'MEDIUM',
      title: overdue > 30 ? 'Severe Timeline Delay' : 'Project Timeline Delay',
      message: `Target completion date has passed by ${overdue} days while the work remains incomplete (physical progress at ${progress.physicalProgress}%).`,
      recommendation: 'Issue inquiry notice regarding work stoppage or contractor mobilization delays.',
      values: {
        daysOverdue: overdue,
        physicalProgress: progress.physicalProgress,
        expectedCompletionDate: project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toISOString().slice(0, 10) : null,
      },
    });
  }

  // ── CHECK D: Cost Comparison Outlier ───────────────────────────────────────
  if (comparable.hasBenchmark && comparable.sampleCount >= 2) {
    const thresholdCost = comparable.averageComparableCost * 1.4; // 40%+ above average
    const diffLakhs = project.sanctionedAmount - comparable.averageComparableCost;

    if (project.sanctionedAmount > thresholdCost && diffLakhs >= 10) {
      anomalies.push({
        type: 'UNUSUAL_PROJECT_COST',
        severity: 'MEDIUM',
        title: 'Project Cost Exceeds District Average',
        message: `Sanctioned cost of ₹${project.sanctionedAmount}L is ${comparable.percentageOfAverage}% of the district average (₹${comparable.averageComparableCost}L) for ${project.category} works (+₹${diffLakhs.toFixed(2)}L variance).`,
        recommendation: 'Review detailed project report (DPR) cost estimates and bill of quantities.',
        values: {
          projectCost: project.sanctionedAmount,
          comparableAverage: comparable.averageComparableCost,
          differenceLakhs: Number(diffLakhs.toFixed(2)),
          percentageOfAverage: comparable.percentageOfAverage,
        },
      });
    }
  }

  // ── CHECK E: Data Quality Anomaly ──────────────────────────────────────────
  if (warnings.length > 0) {
    anomalies.push({
      type: 'DATA_QUALITY',
      severity: 'MEDIUM',
      title: 'Data Consistency Discrepancy',
      message: 'Project record exhibits one or more administrative data quality issues.',
      recommendation: 'Review data entry records with the district project management unit.',
      details: warnings,
    });
  }

  // ── CHECK F: Similar / Duplicate Project Anomaly ────────────────────────────
  if (!allProjects) {
    allProjects = await Project.find({}).lean();
  }

  const similarProjects = [];
  for (const other of allProjects) {
    if (other.projectId === project.projectId) continue;

    // Fast pre-filter: must share category or district
    if (other.category === project.category || other.district === project.district) {
      const sim = computeSimilarity(project, other);
      if (sim >= 0.70) {
        similarProjects.push({
          relatedProjectId: other.projectId,
          relatedProjectName: other.name,
          district: other.district,
          category: other.category,
          sanctionedAmount: other.sanctionedAmount,
          similarityScore: sim,
        });
      }
    }
  }

  if (similarProjects.length > 0) {
    similarProjects.sort((a, b) => b.similarityScore - a.similarityScore);
    const topMatches = similarProjects.slice(0, 3);

    anomalies.push({
      type: 'SIMILAR_PROJECT',
      severity: 'MEDIUM',
      title: 'Highly Similar Project Detected',
      message: `Identified ${topMatches.length} existing project(s) in ${project.district} with overlapping scope, title, or site description.`,
      recommendation: 'Verify ground coordinates to confirm works are not duplicative.',
      relatedProjects: topMatches,
    });
  }

  // Calculate highest severity
  let highestSeverity = 'NONE';
  if (anomalies.some((a) => a.severity === 'HIGH')) {
    highestSeverity = 'HIGH';
  } else if (anomalies.some((a) => a.severity === 'MEDIUM')) {
    highestSeverity = 'MEDIUM';
  } else if (anomalies.some((a) => a.severity === 'LOW')) {
    highestSeverity = 'LOW';
  }

  return {
    projectId: project.projectId,
    projectName: project.name,
    district: project.district,
    state: project.state,
    category: project.category,
    status: project.status,
    sanctionedAmount: project.sanctionedAmount,
    expenditurePercentage: financial.expenditurePercentage,
    physicalProgress: progress.physicalProgress,
    anomalyCount: anomalies.length,
    highestSeverity,
    anomalies,
    analyzedAt: new Date().toISOString(),
    disclaimer: 'These are automated monitoring signals, not proof of fraud. Final verification remains with authorities.',
  };
}

/**
 * Analyzes all projects in the database and returns a prioritized portfolio summary.
 */
export async function analyzeAllProjects() {
  const projects = await Project.find({}).lean();
  const projectReports = [];

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const p of projects) {
    const report = await detectAnomalies(p, projects);
    if (report.anomalyCount > 0) {
      if (report.highestSeverity === 'HIGH') highCount++;
      else if (report.highestSeverity === 'MEDIUM') mediumCount++;
      else if (report.highestSeverity === 'LOW') lowCount++;

      projectReports.push(report);
    }
  }

  // Sort by severity (HIGH > MEDIUM > LOW) then by anomalyCount descending
  const severityRank = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
  projectReports.sort((a, b) => {
    const rankDiff = (severityRank[b.highestSeverity] || 0) - (severityRank[a.highestSeverity] || 0);
    if (rankDiff !== 0) return rankDiff;
    return b.anomalyCount - a.anomalyCount;
  });

  return {
    totalAnalyzed: projects.length,
    projectsWithAnomalies: projectReports.length,
    highSeveritySignals: highCount,
    mediumSeveritySignals: mediumCount,
    lowSeveritySignals: lowCount,
    projects: projectReports,
    analyzedAt: new Date().toISOString(),
  };
}
