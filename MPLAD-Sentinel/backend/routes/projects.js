import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  getProjectIntelligence,
  getProjectAnomalies,
  getProjectRisk,
  getProjectLocationVerification,
} from '../controllers/projectController.js';
import {
  createReport,
  getProjectReports,
  getProjectEvidence,
} from '../controllers/citizenReportController.js';
import { citizenPhotoUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/',                        getAllProjects);
router.get('/:projectId',              getProjectById);
router.get('/:projectId/intelligence',  getProjectIntelligence);
router.get('/:projectId/anomalies',     getProjectAnomalies);
router.get('/:projectId/risk',          getProjectRisk);
router.get('/:projectId/location',      getProjectLocationVerification);

// Phase 8/9: Citizen verification & evidence routes
router.post('/:projectId/reports',     citizenPhotoUpload.single('image'), createReport);
router.get('/:projectId/reports',      getProjectReports);
router.get('/:projectId/evidence',     getProjectEvidence);

export default router;
