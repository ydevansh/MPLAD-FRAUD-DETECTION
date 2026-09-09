import Project from '../models/Project.js';
import {
  calculateFinancialMetrics,
  calculateProgressSpending,
  calculateTimelineStatus,
  calculateDataQualityWarnings,
} from './projectIntelligenceService.js';

/**
 * Phase 4 — Project Monitoring & Authority Analytics Service
 */

/**
 * Evaluates whether a project warrants closer monitoring and assigns human-readable reasons.
 */
export function getAttentionReasons(project, financial, progress, timeline, dataQualityWarnings = []) {
  const reasons = [];
  let priorityScore = 0;

  const isSignificantGap = progress.progressSpendingStatus === 'SIGNIFICANT_GAP';
  const isModerateGap    = progress.progressSpendingStatus === 'MODERATE_GAP';
  const isDelayed        = timeline.timelineStatus === 'DELAYED' || project.status === 'Delayed';

  // 1. Significant progress-spending gap
  if (isSignificantGap) {
    reasons.push({
      code: 'SIGNIFICANT_PROGRESS_SPENDING_GAP',
      label: `Significant progress-spending gap (${progress.progressSpendingDifference} percentage points)`,
    });
    priorityScore += 70 + Math.min(30, progress.progressSpendingDifference);
  } else if (isModerateGap) {
    reasons.push({
      code: 'MODERATE_PROGRESS_SPENDING_GAP',
      label: `Moderate progress-spending gap (${progress.progressSpendingDifference} percentage points)`,
    });
    priorityScore += 25;
  }

  // 2. Delayed project
  if (isDelayed) {
    const overdue = timeline.daysOverdue || 0;
    reasons.push({
      code: 'DELAYED_PROJECT',
      label: overdue > 0 ? `Project is delayed by ${overdue} days` : 'Project has exceeded target completion date',
    });
    priorityScore += 50 + Math.min(25, Math.floor(overdue / 15));
  }

  // 3. Data quality warnings
  if (dataQualityWarnings.length > 0) {
    dataQualityWarnings.forEach((w) => {
      reasons.push({
        code: 'DATA_QUALITY_WARNING',
        label: `Data consistency issue: ${w}`,
      });
    });
    priorityScore += 35;
  }

  // Multiplier if both gap and delay exist
  if (isSignificantGap && isDelayed) {
    priorityScore += 40;
  }

  return {
    attentionRequired: reasons.length > 0,
    reasons,
    priorityScore,
  };
}

/**
 * Aggregates all KPI metrics and charts data across the database.
 */
export async function getAdminSummary() {
  const projects = await Project.find({}).lean();

  let totalSanctioned = 0;
  let totalExpenditure = 0;
  let ongoingCount = 0;
  let completedCount = 0;
  let delayedCount = 0;
  let significantGapCount = 0;
  let moderateGapCount = 0;
  let alignedCount = 0;

  const districtMap = new Map();

  for (const p of projects) {
    const financial = calculateFinancialMetrics(p);
    const progress  = calculateProgressSpending(p, financial);
    const timeline  = calculateTimelineStatus(p);
    const warnings  = calculateDataQualityWarnings(p, financial);
    const attention = getAttentionReasons(p, financial, progress, timeline, warnings);

    totalSanctioned  += financial.sanctionedAmount;
    totalExpenditure += financial.expenditure;

    if (p.status === 'Completed') {
      completedCount++;
    } else if (timeline.timelineStatus === 'DELAYED' || p.status === 'Delayed') {
      delayedCount++;
    } else {
      ongoingCount++;
    }

    if (progress.progressSpendingStatus === 'SIGNIFICANT_GAP') {
      significantGapCount++;
    } else if (progress.progressSpendingStatus === 'MODERATE_GAP') {
      moderateGapCount++;
    } else {
      alignedCount++;
    }

    // District breakdown aggregation
    const dKey = `${p.district}|${p.state}`;
    if (!districtMap.has(dKey)) {
      districtMap.set(dKey, {
        district: p.district,
        state: p.state,
        totalProjects: 0,
        ongoing: 0,
        completed: 0,
        delayed: 0,
        attentionCount: 0,
        totalSanctioned: 0,
        totalExpenditure: 0,
      });
    }

    const dStats = districtMap.get(dKey);
    dStats.totalProjects++;
    dStats.totalSanctioned += financial.sanctionedAmount;
    dStats.totalExpenditure += financial.expenditure;

    if (p.status === 'Completed') dStats.completed++;
    else if (timeline.timelineStatus === 'DELAYED' || p.status === 'Delayed') dStats.delayed++;
    else dStats.ongoing++;

    if (attention.attentionRequired) {
      dStats.attentionCount++;
    }
  }

  const totalRemaining = Math.max(0, totalSanctioned - totalExpenditure);

  const districtSummary = Array.from(districtMap.values())
    .sort((a, b) => b.attentionCount - a.attentionCount || b.totalProjects - a.totalProjects)
    .map((d) => ({
      ...d,
      totalSanctioned: Number(d.totalSanctioned.toFixed(2)),
      totalExpenditure: Number(d.totalExpenditure.toFixed(2)),
    }));

  return {
    totalProjects: projects.length,
    ongoingProjects: ongoingCount,
    completedProjects: completedCount,
    delayedProjects: delayedCount,
    progressSpendingGapProjects: significantGapCount,
    moderateGapProjects: moderateGapCount,
    alignedProjects: alignedCount,

    // Financial totals (in ₹ Lakhs)
    totalSanctionedAmount: Number(totalSanctioned.toFixed(2)),
    totalExpenditure: Number(totalExpenditure.toFixed(2)),
    totalRemainingAmount: Number(totalRemaining.toFixed(2)),

    // Pre-calculated chart datasets for Recharts
    statusDistribution: [
      { name: 'Ongoing',   count: ongoingCount,   fill: '#2563eb' },
      { name: 'Completed', count: completedCount, fill: '#16a34a' },
      { name: 'Delayed',   count: delayedCount,   fill: '#dc2626' },
    ],

    financialOverview: [
      { name: 'Sanctioned',  amount: Number(totalSanctioned.toFixed(2)),  fill: '#3b82f6' },
      { name: 'Expended',    amount: Number(totalExpenditure.toFixed(2)), fill: '#f59e0b' },
      { name: 'Remaining',   amount: Number(totalRemaining.toFixed(2)),   fill: '#10b981' },
    ],

    gapDistribution: [
      { name: 'Balanced',        count: alignedCount,        fill: '#16a34a' },
      { name: 'Moderate Gap',    count: moderateGapCount,    fill: '#eab308' },
      { name: 'Significant Gap', count: significantGapCount, fill: '#ea580c' },
    ],

    districtSummary,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns prioritized list of projects requiring inspection or verification.
 */
export async function getProjectsNeedingAttention() {
  const projects = await Project.find({}).lean();
  const flagged = [];

  for (const p of projects) {
    const financial = calculateFinancialMetrics(p);
    const progress  = calculateProgressSpending(p, financial);
    const timeline  = calculateTimelineStatus(p);
    const warnings  = calculateDataQualityWarnings(p, financial);
    const attention = getAttentionReasons(p, financial, progress, timeline, warnings);

    if (attention.attentionRequired) {
      flagged.push({
        _id: p._id,
        projectId: p.projectId,
        name: p.name,
        state: p.state,
        district: p.district,
        constituency: p.constituency,
        category: p.category,
        sanctionedAmount: financial.sanctionedAmount,
        releasedAmount: financial.releasedAmount,
        expenditure: financial.expenditure,
        expenditurePercentage: financial.expenditurePercentage,
        physicalProgress: progress.physicalProgress,
        progressSpendingDifference: progress.progressSpendingDifference,
        progressSpendingStatus: progress.progressSpendingStatus,
        status: p.status,
        timelineStatus: timeline.timelineStatus,
        timelineLabel: timeline.label,
        daysOverdue: timeline.daysOverdue,
        priorityScore: attention.priorityScore,
        reasons: attention.reasons,
        dataQualityWarnings: warnings,
      });
    }
  }

  // Sort by priorityScore descending so the most concerning monitoring signals appear first
  flagged.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    count: flagged.length,
    projects: flagged,
  };
}

/**
 * Queries monitored projects with full filtering support for the Authority Table.
 */
export async function getMonitoredProjects(filters = {}, pagination = { page: 1, limit: 50 }) {
  const {
    search,
    state,
    district,
    constituency,
    category,
    status,
    timelineStatus,
    progressSpendingStatus,
  } = filters;

  const query = {};

  if (search && search.trim()) {
    query.$or = [
      { name:         { $regex: search, $options: 'i' } },
      { projectId:    { $regex: search, $options: 'i' } },
      { district:     { $regex: search, $options: 'i' } },
      { constituency: { $regex: search, $options: 'i' } },
      { address:      { $regex: search, $options: 'i' } },
    ];
  }
  if (state)        query.state        = { $regex: `^${state}$`,        $options: 'i' };
  if (district)     query.district     = { $regex: `^${district}$`,     $options: 'i' };
  if (constituency) query.constituency = { $regex: `^${constituency}$`, $options: 'i' };
  if (category)     query.category     = { $regex: `^${category}$`,     $options: 'i' };
  if (status)       query.status       = { $regex: `^${status}$`,       $options: 'i' };

  const allProjects = await Project.find(query).sort({ createdAt: -1 }).lean();

  // Compute metrics and filter by timelineStatus or progressSpendingStatus in memory
  let enriched = allProjects.map((p) => {
    const financial = calculateFinancialMetrics(p);
    const progress  = calculateProgressSpending(p, financial);
    const timeline  = calculateTimelineStatus(p);
    const warnings  = calculateDataQualityWarnings(p, financial);
    const attention = getAttentionReasons(p, financial, progress, timeline, warnings);

    return {
      _id: p._id,
      projectId: p.projectId,
      name: p.name,
      state: p.state,
      district: p.district,
      constituency: p.constituency,
      category: p.category,
      sanctionedAmount: financial.sanctionedAmount,
      releasedAmount: financial.releasedAmount,
      expenditure: financial.expenditure,
      expenditurePercentage: financial.expenditurePercentage,
      physicalProgress: progress.physicalProgress,
      progressSpendingDifference: progress.progressSpendingDifference,
      progressSpendingStatus: progress.progressSpendingStatus,
      status: p.status,
      timelineStatus: timeline.timelineStatus,
      timelineLabel: timeline.label,
      daysOverdue: timeline.daysOverdue,
      attentionRequired: attention.attentionRequired,
      reasons: attention.reasons,
      priorityScore: attention.priorityScore,
    };
  });

  if (timelineStatus && timelineStatus !== 'All') {
    enriched = enriched.filter((p) => p.timelineStatus.toLowerCase() === timelineStatus.toLowerCase());
  }

  if (progressSpendingStatus && progressSpendingStatus !== 'All') {
    enriched = enriched.filter((p) => p.progressSpendingStatus.toLowerCase() === progressSpendingStatus.toLowerCase());
  }

  const total = enriched.length;
  const page  = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 50;
  const skip  = (page - 1) * limit;
  const paginated = enriched.slice(skip, skip + limit);

  return {
    total,
    page,
    limit,
    data: paginated,
  };
}
