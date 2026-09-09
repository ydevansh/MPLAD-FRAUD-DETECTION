import { Router } from 'express';
import {
  getSummary,
  getAttention,
  getProjects,
  getAnomalies,
  getPortfolioRisk,
} from '../controllers/adminController.js';
import {
  getAdminCitizenReports,
  getAdminProjectEvidence,
} from '../controllers/citizenReportController.js';

const router = Router();

router.get('/summary',                      getSummary);
router.get('/attention',                    getAttention);
router.get('/projects',                     getProjects);
router.get('/anomalies',                    getAnomalies);
router.get('/risk',                         getPortfolioRisk);
router.get('/citizen-reports',             getAdminCitizenReports);
router.get('/projects/:projectId/evidence', getAdminProjectEvidence);

export default router;
