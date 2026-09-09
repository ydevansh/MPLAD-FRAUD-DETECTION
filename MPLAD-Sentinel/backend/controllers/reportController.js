import { Report } from '../models/Report.js';
import { Project } from '../models/Project.js';
import { Analysis } from '../models/Analysis.js';
import { computeEvidenceConsistencyScore } from '../services/imageAnalyzer.js';
import { scoreProject } from '../services/riskEngine.js';

export function listReports(req, res) {
  const result = Report.findAll(req.query);
  res.json(result);
}

export function getReport(req, res) {
  const report = Report.findById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ report });
}

export function createReport(req, res) {
  const { project_id, reporter_name, reporter_contact, description, reported_condition, discrepancy_type, lat, lng } = req.body;
  if (!project_id || !description || !reported_condition) {
    return res.status(400).json({ error: 'project_id, description, and reported_condition are required' });
  }
  const project = Project.findById(project_id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

  const reportData = {
    project_id,
    reporter_name: reporter_name || null,
    reporter_contact: reporter_contact || null,
    description,
    reported_condition,
    discrepancy_type: discrepancy_type || 'general',
    photo_url,
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
  };

  const report = Report.create(reportData);

  // Compute evidence consistency score
  const consistencyScore = computeEvidenceConsistencyScore(report, project);
  Report.update(report.id, { evidence_consistency_score: consistencyScore });

  // Update project citizen report count
  const totalReports = Report.countByProject(project_id);
  Project.update(project_id, { citizen_report_count: totalReports });

  // Trigger risk re-analysis asynchronously
  setImmediate(async () => {
    try {
      const allProjects = Project.findAll({ limit: 9999 }).data;
      const allReports = Report.findByProject(project_id);
      const result = scoreProject(project, allProjects, allReports);
      Analysis.create({ project_id, ...result, triggered_by: 'citizen_report' });
      Project.update(project_id, { risk_score: result.risk_score, risk_level: result.risk_level, anomaly_flags: result.anomaly_flags });
    } catch (err) {
      console.error('[RiskEngine] Re-analysis failed:', err.message);
    }
  });

  res.status(201).json({ report: { ...report, evidence_consistency_score: consistencyScore }, message: 'Report submitted successfully. AI analysis triggered.' });
}

export function updateReportStatus(req, res) {
  const { status, is_verified } = req.body;
  const report = Report.update(req.params.id, { status, is_verified });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ report });
}

export function getRecentReports(req, res) {
  const reports = Report.getRecentReports(parseInt(req.query.limit) || 10);
  res.json({ reports });
}
