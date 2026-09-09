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
