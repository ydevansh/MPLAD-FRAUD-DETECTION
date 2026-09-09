import Project from '../models/Project.js';
import {
  getAdminSummary,
  getProjectsNeedingAttention,
  getMonitoredProjects,
} from '../services/projectMonitoringService.js';

// GET /api/admin/summary
export const getSummary = async (req, res) => {
  try {
    const summary = await getAdminSummary();
    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error('[admin:getSummary]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to compute administrative summary',
    });
  }
};

// GET /api/admin/attention
export const getAttention = async (req, res) => {
  try {
    const result = await getProjectsNeedingAttention();
    res.json({
      success: true,
      count: result.count,
      data: result.projects,
    });
  } catch (err) {
    console.error('[admin:getAttention]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve priority attention projects',
    });
  }
};

// GET /api/admin/projects
export const getProjects = async (req, res) => {
  try {
    const {
      search,
      state,
      district,
      constituency,
      category,
      status,
      timelineStatus,
      progressSpendingStatus,
      page = 1,
      limit = 50,
    } = req.query;

    const result = await getMonitoredProjects(
      {
        search,
        state,
        district,
        constituency,
        category,
        status,
        timelineStatus,
        progressSpendingStatus,
      },
      { page, limit }
    );

    const [states, districts, categories] = await Promise.all([
      Project.distinct('state'),
      Project.distinct('district'),
      Project.distinct('category'),
    ]);

    res.json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      data: result.data,
      filters: {
        states,
        districts,
        categories,
        statuses: ['Sanctioned', 'Ongoing', 'Completed', 'Delayed'],
        timelineStatuses: ['ON_TRACK', 'DELAYED', 'DUE_SOON', 'COMPLETED'],
        progressSpendingStatuses: ['ALIGNED', 'MODERATE_GAP', 'SIGNIFICANT_GAP'],
      },
    });
  } catch (err) {
    console.error('[admin:getProjects]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monitored projects',
    });
  }
};
