import Project from '../models/Project.js';
import { detectAnomalies } from './anomalyDetectionService.js';
import {
  calculateFinancialMetrics,
  calculateProgressSpending,
  calculateTimelineStatus,
  calculateDataQualityWarnings,
  calculateComparableCost,
} from './projectIntelligenceService.js';

/**
 * Phase 6 — Explainable Risk Score & Priority Engine
 * 
 * Score Scale: 0 -> 100
 * The score represents monitoring and inspection priority based strictly on data signals.
 * Core Principle: Detection ≠ Proof of Fraud.
 * Never describe the score as a probability of fraud.
 */

export const RISK_WEIGHTS = {
  SIGNIFICANT_PROGRESS_SPENDING_MISMATCH: 25,
  MODERATE_PROGRESS_SPENDING_MISMATCH: 15,
  SEVERE_TIMELINE_DELAY: 15,
  MODERATE_TIMELINE_DELAY: 10,
  UNUSUAL_PROJECT_COST: 15,
  FINANCIAL_INCONSISTENCY_EXPENDITURE: 20,
  FINANCIAL_INCONSISTENCY_RELEASE: 10,
  DATA_QUALITY_ISSUE: 5,
  SIMILAR_PROJECT: 15,
};

export const ACTION_RECOMMENDATIONS = {
  LOW: 'Routine monitoring.',
  MEDIUM: 'Closer review recommended.',
  HIGH: 'Priority review recommended.',
  CRITICAL: 'Priority field verification recommended.',
};

export const RISK_DISCLAIMER =
  'The risk score is an automated monitoring indicator based on available project data. It is not proof of fraud. Final verification and decisions remain with authorities.';

/**
 * Calculates deterministic, explainable risk score (0-100) for an individual project.
 * Designed modularly for future citizen evidence compatibility.
 */
export async function calculateRiskScore(project, anomalyReport = null) {
  // If anomalies not pre-provided, compute them
  const anomalies = anomalyReport || (await detectAnomalies(project));

  // Compute baseline metrics
  const financial = calculateFinancialMetrics(project);
  const progress  = calculateProgressSpending(project, financial);
  const timeline  = calculateTimelineStatus(project);
  const warnings  = calculateDataQualityWarnings(project, financial);
  const costDiff  = project.sanctionedAmount && project.category ? await calculateComparableCost(project) : null;

  const reasons = [];
  let rawScore = 0;

  // ── 1. Progress-Spending Mismatch (mutually exclusive) ──────────────────────
  const gap = progress.progressSpendingDifference;
  if (gap > 30) {
    reasons.push({
      type: 'PROGRESS_SPENDING_MISMATCH',
      points: RISK_WEIGHTS.SIGNIFICANT_PROGRESS_SPENDING_MISMATCH,
      title: 'Significant Progress-Spending Mismatch',
      explanation: `Expenditure is ${financial.expenditurePercentage}% while physical progress is ${progress.physicalProgress}%, creating a ${gap} percentage point gap.`,
      values: {
        physicalProgress: progress.physicalProgress,
        expenditurePercentage: financial.expenditurePercentage,
        gap,
      },
    });
    rawScore += RISK_WEIGHTS.SIGNIFICANT_PROGRESS_SPENDING_MISMATCH;
  } else if (gap > 15) {
    reasons.push({
      type: 'PROGRESS_SPENDING_MISMATCH',
      points: RISK_WEIGHTS.MODERATE_PROGRESS_SPENDING_MISMATCH,
      title: 'Moderate Progress-Spending Mismatch',
      explanation: `Expenditure (${financial.expenditurePercentage}%) moderately exceeds physical progress (${progress.physicalProgress}%) by ${gap} percentage points.`,
      values: {
        physicalProgress: progress.physicalProgress,
        expenditurePercentage: financial.expenditurePercentage,
        gap,
      },
    });
    rawScore += RISK_WEIGHTS.MODERATE_PROGRESS_SPENDING_MISMATCH;
  }

  // ── 2. Timeline Delay (mutually exclusive) ──────────────────────────────────
  if (timeline.timelineStatus === 'DELAYED' && timeline.daysOverdue > 0) {
    if (timeline.daysOverdue > 30) {
      reasons.push({
        type: 'TIMELINE_DELAY',
        points: RISK_WEIGHTS.SEVERE_TIMELINE_DELAY,
        title: 'Severe Timeline Delay',
        explanation: `Project has exceeded target completion date by ${timeline.daysOverdue} days.`,
        values: {
          daysOverdue: timeline.daysOverdue,
          expectedCompletionDate: project.expectedCompletionDate,
        },
      });
      rawScore += RISK_WEIGHTS.SEVERE_TIMELINE_DELAY;
    } else {
      reasons.push({
        type: 'TIMELINE_DELAY',
        points: RISK_WEIGHTS.MODERATE_TIMELINE_DELAY,
        title: 'Moderate Timeline Delay',
        explanation: `Project is ${timeline.daysOverdue} days past scheduled delivery date.`,
        values: {
          daysOverdue: timeline.daysOverdue,
          expectedCompletionDate: project.expectedCompletionDate,
        },
      });
      rawScore += RISK_WEIGHTS.MODERATE_TIMELINE_DELAY;
    }
  }

  // ── 3. Financial Release / Expenditure Inconsistency ────────────────────────
  if (project.expenditure > (project.releasedAmount || 0) && (project.releasedAmount || 0) > 0) {
    reasons.push({
      type: 'EXPENDITURE_RELEASE_INCONSISTENCY',
      points: RISK_WEIGHTS.FINANCIAL_INCONSISTENCY_EXPENDITURE,
      title: 'Expenditure Exceeds Released Funds',
      explanation: `Reported expenditure (₹${project.expenditure.toFixed(2)} Lakh) exceeds officially released funds (₹${(project.releasedAmount || 0).toFixed(2)} Lakh).`,
      values: {
        expenditure: project.expenditure,
        releasedAmount: project.releasedAmount,
      },
    });
    rawScore += RISK_WEIGHTS.FINANCIAL_INCONSISTENCY_EXPENDITURE;
  } else if ((project.releasedAmount || 0) > project.sanctionedAmount && project.sanctionedAmount > 0) {
    reasons.push({
      type: 'EXPENDITURE_RELEASE_INCONSISTENCY',
      points: RISK_WEIGHTS.FINANCIAL_INCONSISTENCY_RELEASE,
      title: 'Released Funds Exceed Sanctioned Budget',
      explanation: `Released amount (₹${(project.releasedAmount || 0).toFixed(2)} Lakh) exceeds approved sanctioned budget (₹${project.sanctionedAmount.toFixed(2)} Lakh).`,
      values: {
        releasedAmount: project.releasedAmount,
        sanctionedAmount: project.sanctionedAmount,
      },
    });
    rawScore += RISK_WEIGHTS.FINANCIAL_INCONSISTENCY_RELEASE;
  }

  // ── 4. Unusual Project Cost ─────────────────────────────────────────────────
  if (costDiff && costDiff.hasBenchmark && costDiff.costDifferenceFromAverage >= 10.0) {
    const ratio = costDiff.percentageOfAverage ? costDiff.percentageOfAverage / 100 : 0;
    if (ratio >= 1.4) {
      reasons.push({
        type: 'UNUSUAL_PROJECT_COST',
        points: RISK_WEIGHTS.UNUSUAL_PROJECT_COST,
        title: 'Unusual Project Cost Outlier',
        explanation: `Project sanctioned budget (₹${project.sanctionedAmount.toFixed(2)} Lakh) is ${costDiff.percentageOfAverage}% of district average for '${project.category}' (+₹${costDiff.costDifferenceFromAverage.toFixed(2)} Lakh variance).`,
        values: {
          sanctionedAmount: project.sanctionedAmount,
          averageComparableCost: costDiff.averageComparableCost,
          difference: costDiff.costDifferenceFromAverage,
          percentageOfAverage: costDiff.percentageOfAverage,
        },
      });
      rawScore += RISK_WEIGHTS.UNUSUAL_PROJECT_COST;
    }
  }

  // ── 5. Similar Project / Duplicate Work Signal ──────────────────────────────
  const similarAnomaly = anomalies.anomalies?.find((a) => a.type === 'SIMILAR_PROJECT');
  if (similarAnomaly && similarAnomaly.relatedProjects && similarAnomaly.relatedProjects.length > 0) {
    reasons.push({
      type: 'SIMILAR_PROJECT',
      points: RISK_WEIGHTS.SIMILAR_PROJECT,
      title: 'Highly Similar Project Detected',
      explanation: `Identified ${similarAnomaly.relatedProjects.length} existing project(s) in ${project.district} with overlapping scope or site description.`,
      relatedProjects: similarAnomaly.relatedProjects,
    });
    rawScore += RISK_WEIGHTS.SIMILAR_PROJECT;
  }

  // ── 6. Data Quality Consistency ────────────────────────────────────────────
  if (warnings.length > 0 && !reasons.some((r) => r.type === 'EXPENDITURE_RELEASE_INCONSISTENCY')) {
    reasons.push({
      type: 'DATA_QUALITY',
      points: RISK_WEIGHTS.DATA_QUALITY_ISSUE,
      title: 'Data Quality / Reporting Discrepancy',
      explanation: warnings[0],
      values: { warnings },
    });
    rawScore += RISK_WEIGHTS.DATA_QUALITY_ISSUE;
  }

  // Strict clamp: 0 <= score <= 100
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Risk Level determination
  let riskLevel = 'LOW';
  if (finalScore >= 81) {
    riskLevel = 'CRITICAL';
  } else if (finalScore >= 61) {
    riskLevel = 'HIGH';
  } else if (finalScore >= 31) {
    riskLevel = 'MEDIUM';
  }

  const recommendedAction = ACTION_RECOMMENDATIONS[riskLevel];

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
    riskScore: finalScore,
    riskLevel,
    reasons,
    recommendedAction,
    disclaimer: RISK_DISCLAIMER,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Analyzes risk across all projects in the portfolio and produces dynamic aggregations.
 */
export async function calculatePortfolioRisk() {
  const projects = await Project.find({}).lean();
  const scoredProjects = [];

  const riskDistribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const p of projects) {
    const riskData = await calculateRiskScore(p);

    if (riskData.riskLevel === 'CRITICAL') riskDistribution.critical++;
    else if (riskData.riskLevel === 'HIGH') riskDistribution.high++;
    else if (riskData.riskLevel === 'MEDIUM') riskDistribution.medium++;
    else riskDistribution.low++;

    scoredProjects.push({
      projectId: riskData.projectId,
      name: riskData.projectName,
      district: riskData.district,
      state: riskData.state,
      category: riskData.category,
      status: riskData.status,
      sanctionedAmount: riskData.sanctionedAmount,
      expenditurePercentage: riskData.expenditurePercentage,
      physicalProgress: riskData.physicalProgress,
      riskScore: riskData.riskScore,
      riskLevel: riskData.riskLevel,
      topReason: riskData.reasons.length > 0 ? riskData.reasons[0].title : 'Routine monitoring parameters within normal limits',
      reasonsCount: riskData.reasons.length,
      reasons: riskData.reasons,
      recommendedAction: riskData.recommendedAction,
    });
  }

  // Sort by highest risk score first, then by reasonsCount descending
  scoredProjects.sort((a, b) => {
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
    return b.reasonsCount - a.reasonsCount;
  });

  return {
    totalProjects: projects.length,
    riskDistribution,
    projects: scoredProjects,
    disclaimer: RISK_DISCLAIMER,
    analyzedAt: new Date().toISOString(),
  };
}
