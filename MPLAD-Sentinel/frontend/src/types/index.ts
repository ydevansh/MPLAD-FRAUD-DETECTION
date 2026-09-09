// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus = 'Sanctioned' | 'Ongoing' | 'Completed' | 'Delayed';
export type RiskLevel     = 'Low' | 'Medium' | 'High' | 'Critical';

export type ProgressSpendingStatus = 'ALIGNED' | 'MODERATE_GAP' | 'SIGNIFICANT_GAP';

export type TimelineStatus =
  | 'COMPLETED'
  | 'DELAYED'
  | 'DUE_SOON'
  | 'ON_TRACK'
  | 'NOT_STARTED'
  | 'UNKNOWN';

export interface FinancialMetrics {
  sanctionedAmount: number;
  releasedAmount: number;
  expenditure: number;
  expenditurePercentage: number;
  releasePercentage: number;
  remainingAmount: number;
  unspentReleasedAmount: number;
}

export interface ProgressMetrics {
  physicalProgress: number;
  expenditurePercentage: number;
  progressSpendingDifference: number;
  progressSpendingStatus: ProgressSpendingStatus;
  statusDescription: string;
}

export interface TimelineMetrics {
  timelineStatus: TimelineStatus;
  daysOverdue: number;
  daysRemaining: number | null;
  label: string;
  description: string;
}

export interface ComparableMetrics {
  hasBenchmark: boolean;
  averageComparableCost: number;
  costDifferenceFromAverage: number;
  sampleCount: number;
  minCost?: number;
  maxCost?: number;
  percentageOfAverage?: number;
  message: string;
}

export interface ProjectIntelligence {
  projectId: string;
  financial: FinancialMetrics;
  progress: ProgressMetrics;
  timeline: TimelineMetrics;
  comparable: ComparableMetrics;
  dataQualityWarnings: string[];
  isPrototypeData: boolean;
  lastComputed: string;
}

export interface Project {
  _id: string;
  projectId: string;
  name: string;
  description: string;
  state: string;
  district: string;
  constituency: string;
  category: string;

  // Financial (in Lakhs ₹)
  sanctionedAmount: number;
  releasedAmount: number;
  expenditure: number;

  // Progress
  physicalProgress: number; // 0–100
  status: ProjectStatus;

  // Phase 3 Timeline Dates
  sanctionDate?: string | null;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  financialYear?: string;
  lastUpdated?: string;

  implementingAgency: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];

  // Prototype risk placeholders
  riskScore: number;
  riskLevel: RiskLevel;
  isPrototypeData: boolean;

  // Phase 3 Intelligence summary
  expenditurePercentage?: number;
  releasePercentage?: number;
  remainingAmount?: number;
  progressSpendingDifference?: number;
  progressSpendingStatus?: ProgressSpendingStatus;
  timelineStatus?: TimelineStatus | string;
  timelineLabel?: string;
  daysOverdue?: number;
  intelligence?: ProjectIntelligence;

  createdAt: string;
  updatedAt: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ProjectListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: Project[];
  filters: {
    states: string[];
    districts: string[];
    constituencies: string[];
    categories: string[];
  };
}

export interface ProjectDetailResponse {
  success: boolean;
  data: Project;
}

export interface ProjectIntelligenceResponse {
  success: boolean;
  data: ProjectIntelligence;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ProjectFilters {
  search?: string;
  state?: string;
  district?: string;
  constituency?: string;
  category?: string;
  status?: string;
  riskLevel?: string;
}

// ─── Geolocation ──────────────────────────────────────────────────────────────

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ProjectWithDistance extends Project {
  distance: number; // km
}

// ─── Phase 4 Authority Dashboard ──────────────────────────────────────────────

export interface AttentionReason {
  code: string;
  label: string;
}

export interface AttentionProject {
  _id: string;
  projectId: string;
  name: string;
  state: string;
  district: string;
  constituency: string;
  category: string;
  sanctionedAmount: number;
  releasedAmount: number;
  expenditure: number;
  expenditurePercentage: number;
  physicalProgress: number;
  progressSpendingDifference: number;
  progressSpendingStatus: ProgressSpendingStatus;
  status: ProjectStatus;
  timelineStatus: TimelineStatus | string;
  timelineLabel: string;
  daysOverdue: number;
  priorityScore: number;
  reasons: AttentionReason[];
  dataQualityWarnings?: string[];
}

export interface DistrictSummaryItem {
  district: string;
  state: string;
  totalProjects: number;
  ongoing: number;
  completed: number;
  delayed: number;
  attentionCount: number;
  totalSanctioned: number;
  totalExpenditure: number;
}

export interface AdminSummaryData {
  totalProjects: number;
  ongoingProjects: number;
  completedProjects: number;
  delayedProjects: number;
  progressSpendingGapProjects: number;
  moderateGapProjects: number;
  alignedProjects: number;
  totalSanctionedAmount: number;
  totalExpenditure: number;
  totalRemainingAmount: number;
  statusDistribution: { name: string; count: number; fill: string }[];
  financialOverview: { name: string; amount: number; fill: string }[];
  gapDistribution: { name: string; count: number; fill: string }[];
  districtSummary: DistrictSummaryItem[];
  lastUpdated: string;
}

export interface AdminSummaryResponse {
  success: boolean;
  data: AdminSummaryData;
}

export interface AdminAttentionResponse {
  success: boolean;
  count: number;
  data: AttentionProject[];
}

export interface AdminProjectsFilters {
  search?: string;
  state?: string;
  district?: string;
  constituency?: string;
  category?: string;
  status?: string;
  timelineStatus?: string;
  progressSpendingStatus?: string;
  page?: number;
  limit?: number;
}

export interface AdminProjectsResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: (Project & {
    reasons?: AttentionReason[];
    priorityScore?: number;
    attentionRequired?: boolean;
  })[];
  filters: {
    states: string[];
    districts: string[];
    categories: string[];
    statuses: string[];
    timelineStatuses: string[];
    progressSpendingStatuses: string[];
  };
}

// ─── Phase 5: AI-Powered Anomaly Detection Engine ─────────────────────────────

export type AnomalySeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export type AnomalyType =
  | 'PROGRESS_SPENDING_MISMATCH'
  | 'EXPENDITURE_RELEASE_INCONSISTENCY'
  | 'TIMELINE_DELAY'
  | 'UNUSUAL_PROJECT_COST'
  | 'DATA_QUALITY'
  | 'SIMILAR_PROJECT';

export interface RelatedSimilarProject {
  relatedProjectId: string;
  relatedProjectName: string;
  district: string;
  category: string;
  sanctionedAmount: number;
  similarityScore: number;
}

export interface AnomalyRecord {
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  message: string;
  recommendation: string;
  values?: {
    physicalProgress?: number;
    expenditurePercentage?: number;
    difference?: number;
    spent?: number;
    released?: number;
    sanctioned?: number;
    daysOverdue?: number;
    expectedCompletionDate?: string;
    actualCompletionDate?: string;
    sanctionedAmount?: number;
    districtCategoryAverage?: number;
    ratio?: number;
    variance?: number;
    issue?: string;
  };
  relatedProjects?: RelatedSimilarProject[];
}

export interface ProjectAnomaliesData {
  projectId: string;
  projectName: string;
  district: string;
  state: string;
  category: string;
  status: string;
  sanctionedAmount: number;
  expenditurePercentage: number;
  physicalProgress: number;
  anomalyCount: number;
  highestSeverity: AnomalySeverity;
  anomalies: AnomalyRecord[];
  analyzedAt: string;
  disclaimer: string;
}

export interface ProjectAnomaliesResponse {
  success: boolean;
  data: ProjectAnomaliesData;
}

export interface AdminAnomaliesSummary {
  totalAnalyzed: number;
  projectsWithAnomalies: number;
  highSeveritySignals: number;
  mediumSeveritySignals: number;
  lowSeveritySignals: number;
  projects: ProjectAnomaliesData[];
  analyzedAt: string;
}

export interface AdminAnomaliesResponse {
  success: boolean;
  data: AdminAnomaliesSummary;
}

// ─── Phase 6: Explainable Risk Score & Priority Engine ────────────────────────

export type RiskScoreLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskScoreReason {
  type: string;
  points: number;
  title: string;
  explanation: string;
  values?: any;
  relatedProjects?: RelatedSimilarProject[];
}

export interface ProjectRiskData {
  projectId: string;
  projectName: string;
  district: string;
  state: string;
  category: string;
  status: string;
  sanctionedAmount: number;
  expenditurePercentage: number;
  physicalProgress: number;
  riskScore: number;
  riskLevel: RiskScoreLevel;
  reasons: RiskScoreReason[];
  recommendedAction: string;
  disclaimer: string;
  analyzedAt: string;
}

export interface ProjectRiskResponse {
  success: boolean;
  data: ProjectRiskData;
}

export interface PortfolioRiskProjectItem {
  projectId: string;
  name: string;
  district: string;
  state: string;
  category: string;
  status: string;
  sanctionedAmount: number;
  expenditurePercentage: number;
  physicalProgress: number;
  riskScore: number;
  riskLevel: RiskScoreLevel;
  topReason: string;
  reasonsCount: number;
  reasons: RiskScoreReason[];
  recommendedAction: string;
}

export interface PortfolioRiskData {
  totalProjects: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  projects: PortfolioRiskProjectItem[];
  disclaimer: string;
  analyzedAt: string;
}

export interface AdminRiskResponse {
  success: boolean;
  data: PortfolioRiskData;
}
