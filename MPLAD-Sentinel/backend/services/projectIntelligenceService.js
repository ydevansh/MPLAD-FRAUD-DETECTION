import Project from '../models/Project.js';

/**
 * Phase 3 — Data, Financial & Progress Intelligence Service
 * Computes deterministic, objective monitoring indicators without declaring fraud.
 */

/**
 * A. Financial Calculations
 * Safe arithmetic avoiding NaN/Infinity and division by zero.
 */
export function calculateFinancialMetrics(project) {
  const sanctioned = Number(project.sanctionedAmount) || 0;
  const released   = Number(project.releasedAmount)   || 0;
  const spent      = Number(project.expenditure)      || 0;

  const expenditurePercentage = sanctioned > 0
    ? Number(((spent / sanctioned) * 100).toFixed(1))
    : 0;

  const releasePercentage = sanctioned > 0
    ? Number(((released / sanctioned) * 100).toFixed(1))
    : 0;

  const remainingAmount = Number((sanctioned - spent).toFixed(2));
  const unspentReleasedAmount = Number((released - spent).toFixed(2));

  return {
    sanctionedAmount: sanctioned,
    releasedAmount: released,
    expenditure: spent,
    expenditurePercentage,
    releasePercentage,
    remainingAmount: Math.max(0, remainingAmount),
    unspentReleasedAmount,
  };
}

/**
 * B. Progress vs Spending Analysis
 * Evaluates the divergence between expenditure percentage and physical progress.
 */
export function calculateProgressSpending(project, financial) {
  const physical = Number(project.physicalProgress) || 0;
  const expenditurePct = financial.expenditurePercentage;
  const difference = Number((expenditurePct - physical).toFixed(1));

  let progressSpendingStatus = 'ALIGNED';
  let statusDescription = 'Expenditure and physical progress are reasonably balanced.';

  if (difference > 30) {
    progressSpendingStatus = 'SIGNIFICANT_GAP';
    statusDescription = 'Significant gap: Recorded expenditure is substantially ahead of physical completion.';
  } else if (difference > 15) {
    progressSpendingStatus = 'MODERATE_GAP';
    statusDescription = 'Moderate gap: Expenditure is pacing ahead of verified physical progress.';
  } else if (difference < -25) {
    statusDescription = 'Physical progress is significantly ahead of disbursed expenditure.';
  }

  return {
    physicalProgress: physical,
    expenditurePercentage: expenditurePct,
    progressSpendingDifference: difference,
    progressSpendingStatus,
    statusDescription,
  };
}

/**
 * C. Timeline Analysis
 * Evaluates completion deadlines vs current status.
 */
export function calculateTimelineStatus(project) {
  if (project.status === 'Completed' || project.actualCompletionDate) {
    return {
      timelineStatus: 'COMPLETED',
      daysOverdue: 0,
      daysRemaining: 0,
      label: 'Completed',
      description: 'Project has been marked as fully completed.',
    };
  }

  if (!project.expectedCompletionDate) {
    return {
      timelineStatus: 'UNKNOWN',
      daysOverdue: 0,
      daysRemaining: null,
      label: 'Timeline Unknown',
      description: 'No expected completion date has been recorded.',
    };
  }

  const now = new Date();
  const expectedDate = new Date(project.expectedCompletionDate);
  const diffTime = expectedDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      timelineStatus: 'DELAYED',
      daysOverdue: overdue,
      daysRemaining: 0,
      label: `Delayed (${overdue} days overdue)`,
      description: `Target completion date (${expectedDate.toISOString().slice(0, 10)}) has passed by ${overdue} days.`,
    };
  }

  if (diffDays <= 30) {
    return {
      timelineStatus: 'DUE_SOON',
      daysOverdue: 0,
      daysRemaining: diffDays,
      label: `Due Soon (${diffDays} days left)`,
      description: `Scheduled for completion within the next ${diffDays} days.`,
    };
  }

  if (project.startDate && new Date(project.startDate) > now) {
    return {
      timelineStatus: 'NOT_STARTED',
      daysOverdue: 0,
      daysRemaining: diffDays,
      label: 'Not Started',
      description: 'Scheduled start date has not yet arrived.',
    };
  }

  return {
    timelineStatus: 'ON_TRACK',
    daysOverdue: 0,
    daysRemaining: diffDays,
    label: `On Track (${diffDays} days remaining)`,
    description: `Project is within its sanctioned timeline (${diffDays} days remaining).`,
  };
}

/**
 * D. Data Quality Warnings
 * Diagnoses reporting discrepancies or illogical data combinations neutrally.
 */
export function calculateDataQualityWarnings(project, financial) {
  const warnings = [];

  if (financial.expenditure > financial.releasedAmount && financial.releasedAmount > 0) {
    warnings.push('Expenditure exceeds officially released amount');
  }

  if (financial.releasedAmount > financial.sanctionedAmount) {
    warnings.push('Released amount exceeds total sanctioned budget');
  }

  if (project.physicalProgress > 100) {
    warnings.push('Physical progress reported greater than 100%');
  }

  if (financial.sanctionedAmount < 0 || financial.expenditure < 0 || financial.releasedAmount < 0) {
    warnings.push('Negative financial amounts present');
  }

  if (!project.sanctionDate) {
    warnings.push('Official sanction date is missing');
  }

  if (!project.expectedCompletionDate && project.status !== 'Completed') {
    warnings.push('Expected completion target date is not defined');
  }

  return warnings;
}

/**
 * E. Comparable Project Benchmark
 * Computes average cost of projects in the same district & category for context.
 */
export async function calculateComparableCost(project) {
  try {
    const stats = await Project.aggregate([
      {
        $match: {
          district: project.district,
          category: project.category,
        },
      },
      {
        $group: {
          _id: null,
          avgCost: { $avg: '$sanctionedAmount' },
          count: { $sum: 1 },
          minCost: { $min: '$sanctionedAmount' },
          maxCost: { $max: '$sanctionedAmount' },
        },
      },
    ]);

    if (!stats || stats.length === 0) {
      return {
        hasBenchmark: false,
        averageComparableCost: project.sanctionedAmount,
        costDifferenceFromAverage: 0,
        sampleCount: 1,
        message: 'No comparable projects found in this district yet.',
      };
    }

    const avg = Number(stats[0].avgCost.toFixed(2));
    const diff = Number((project.sanctionedAmount - avg).toFixed(2));

    return {
      hasBenchmark: true,
      averageComparableCost: avg,
      costDifferenceFromAverage: diff,
      sampleCount: stats[0].count,
      minCost: stats[0].minCost,
      maxCost: stats[0].maxCost,
      percentageOfAverage: avg > 0 ? Number(((project.sanctionedAmount / avg) * 100).toFixed(0)) : 100,
      message: `${stats[0].count} similar ${project.category} projects in ${project.district}`,
    };
  } catch (err) {
    console.error('[calculateComparableCost]', err);
    return {
      hasBenchmark: false,
      averageComparableCost: project.sanctionedAmount,
      costDifferenceFromAverage: 0,
      sampleCount: 1,
      message: 'Benchmark calculation unavailable.',
    };
  }
}

/**
 * Aggregated Intelligence payload
 */
export async function getProjectIntelligenceData(project) {
  const financial = calculateFinancialMetrics(project);
  const progress  = calculateProgressSpending(project, financial);
  const timeline  = calculateTimelineStatus(project);
  const dataQualityWarnings = calculateDataQualityWarnings(project, financial);
  const comparable = await calculateComparableCost(project);

  return {
    projectId: project.projectId,
    financial,
    progress,
    timeline,
    comparable,
    dataQualityWarnings,
    isPrototypeData: project.isPrototypeData ?? true,
    lastComputed: new Date().toISOString(),
  };
}
