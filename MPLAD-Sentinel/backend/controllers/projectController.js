import Project from '../models/Project.js';
import {
  getProjectIntelligenceData,
  calculateFinancialMetrics,
  calculateProgressSpending,
  calculateTimelineStatus,
} from '../services/projectIntelligenceService.js';

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
    if (riskLevel)    query.riskLevel    = { $regex: `^${riskLevel}$`,    $options: 'i' };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Project.countDocuments(query);
    const rawProjects = await Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

    // Augment with Phase 3 lightweight intelligence summary for project cards
    const projects = rawProjects.map((p) => {
      const financial = calculateFinancialMetrics(p);
      const progress  = calculateProgressSpending(p, financial);
      const timeline  = calculateTimelineStatus(p);

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
      };
    });

    const [states, districts, constituencies, categories] = await Promise.all([
      Project.distinct('state'),
      Project.distinct('district'),
      Project.distinct('constituency'),
      Project.distinct('category'),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: projects,
      filters: { states, districts, constituencies, categories },
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
      $or: [{ projectId: req.params.projectId }, { _id: req.params.projectId.match(/^[0-9a-fA-F]{24}$/) ? req.params.projectId : null }],
    }).lean();

    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const intelligence = await getProjectIntelligenceData(project);

    res.json({
      success: true,
      data: {
        ...project,
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
