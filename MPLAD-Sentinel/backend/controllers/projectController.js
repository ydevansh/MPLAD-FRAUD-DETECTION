import Project from '../models/Project.js';
import {
  getProjectIntelligenceData,
  calculateFinancialMetrics,
  calculateProgressSpending,
  calculateTimelineStatus,
} from '../services/projectIntelligenceService.js';
import { detectAnomalies } from '../services/anomalyDetectionService.js';
import { calculateRiskScore } from '../services/riskScoringService.js';
import {
  verifyProjectLocationConsistency,
  validateCoordinates,
  evaluateCoordinateDataQuality,
} from '../services/geospatialService.js';

// GET /api/projects
export const getAllProjects = async (req, res) => {
  try {
    const { search, state, district, constituency, category, status, riskLevel, limit = 100, page = 1 } = req.query;
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

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Project.countDocuments(query);
    const rawProjects = await Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

    // Augment with Phase 3 intelligence + Phase 6 explainable dynamic risk scores
    const projects = await Promise.all(
      rawProjects.map(async (p) => {
        const financial = calculateFinancialMetrics(p);
        const progress  = calculateProgressSpending(p, financial);
        const timeline  = calculateTimelineStatus(p);
        const risk      = await calculateRiskScore(p);

        return {
          ...p,
          expenditurePercentage: financial.expenditurePercentage,
          releasePercentage: financial.releasePercentage,
          remainingAmount: financial.remainingAmount,
          progressSpendingDifference: progress.progressSpendingDifference,
          progressSpendingStatus: progress.progressSpendingStatus,
          timelineStatus: timeline.timelineStatus,
          timelineLabel: timeline.label,
          daysOverdue: timeline.daysOverdue,
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
          riskReasons: risk.reasons,
          recommendedAction: risk.recommendedAction,
        };
      })
    );

    // If filtered by riskLevel in query
    const filteredProjects = riskLevel
      ? projects.filter((p) => p.riskLevel.toLowerCase() === riskLevel.toLowerCase())
      : projects;

    const [states, districts, constituencies, categories] = await Promise.all([
      Project.distinct('state'),
      Project.distinct('district'),
      Project.distinct('constituency'),
      Project.distinct('category'),
    ]);

    res.json({
      success: true,
      total: riskLevel ? filteredProjects.length : total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: filteredProjects,
      filters: {
        states,
        districts,
        constituencies,
        categories,
      },
    });
  } catch (err) {
    console.error('[getAllProjects]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
};

// GET /api/projects/:projectId
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      $or: [
        { projectId: req.params.projectId },
        { _id: req.params.projectId.match(/^[0-9a-fA-F]{24}$/) ? req.params.projectId : null },
      ],
    }).lean();

    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const [intelligence, risk] = await Promise.all([
      getProjectIntelligenceData(project),
      calculateRiskScore(project),
    ]);

    res.json({
      success: true,
      data: {
        ...project,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        risk,
        intelligence,
      },
    });
  } catch (err) {
    console.error('[getProjectById]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
};

// GET /api/projects/:projectId/intelligence
export const getProjectIntelligence = async (req, res) => {
  try {
    const project = await Project.findOne({
      $or: [{ projectId: req.params.projectId }, { _id: req.params.projectId.match(/^[0-9a-fA-F]{24}$/) ? req.params.projectId : null }],
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project '${req.params.projectId}' not found`,
      });
    }

    const intelligence = await getProjectIntelligenceData(project);
    res.json({ success: true, data: intelligence });
  } catch (err) {
    console.error('[getProjectIntelligence]', err);
    res.status(500).json({ success: false, error: 'Failed to compute project intelligence' });
  }
};

// GET /api/projects/:projectId/anomalies
export const getProjectAnomalies = async (req, res) => {
  try {
    const project = await Project.findOne({
      $or: [
        { projectId: req.params.projectId },
        { _id: req.params.projectId.match(/^[0-9a-fA-F]{24}$/) ? req.params.projectId : null },
      ],
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project '${req.params.projectId}' not found`,
      });
    }

    const anomalyReport = await detectAnomalies(project);
    res.json({ success: true, data: anomalyReport });
  } catch (err) {
    console.error('[getProjectAnomalies]', err);
    res.status(500).json({ success: false, error: 'Failed to detect project anomalies' });
  }
};

// GET /api/projects/:projectId/risk
export const getProjectRisk = async (req, res) => {
  try {
    const project = await Project.findOne({
      $or: [
        { projectId: req.params.projectId },
        { _id: req.params.projectId.match(/^[0-9a-fA-F]{24}$/) ? req.params.projectId : null },
      ],
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project '${req.params.projectId}' not found`,
      });
    }

    const riskData = await calculateRiskScore(project);
    res.json({ success: true, data: riskData });
  } catch (err) {
    console.error('[getProjectRisk]', err);
    res.status(500).json({ success: false, error: 'Failed to calculate project risk score' });
  }
};

// GET /api/projects/:projectId/location?latitude=...&longitude=...
export const getProjectLocationVerification = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { latitude, longitude } = req.query;

    if (latitude === undefined || longitude === undefined || latitude === '' || longitude === '') {
      return res.status(400).json({
        success: false,
        error: 'Both latitude and longitude query parameters are required.',
      });
    }

    const val = validateCoordinates(latitude, longitude);
    if (!val.valid) {
      return res.status(400).json({
        success: false,
        error: val.message,
      });
    }

    const project = await Project.findOne({
      $or: [
        { projectId },
        { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null },
      ],
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project '${projectId}' not found`,
      });
    }

    // Check project coordinate data quality
    const projectCoordVal = validateCoordinates(project.latitude, project.longitude);
    if (!projectCoordVal.valid) {
      return res.status(422).json({
        success: false,
        error: 'Project location data is invalid or unavailable.',
        dataQualityWarnings: evaluateCoordinateDataQuality(project),
      });
    }

    const verificationResult = verifyProjectLocationConsistency(project, latitude, longitude);
    return res.json(verificationResult);
  } catch (err) {
    console.error('[getProjectLocationVerification]', err);
    res.status(500).json({ success: false, error: 'Failed to verify project location' });
  }
};
