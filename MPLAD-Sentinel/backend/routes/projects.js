import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  getProjectIntelligence,
  getProjectAnomalies,
  getProjectRisk,
  getProjectLocationVerification,
} from '../controllers/projectController.js';

const router = Router();

router.get('/',                       getAllProjects);
router.get('/:projectId',             getProjectById);
router.get('/:projectId/intelligence', getProjectIntelligence);
router.get('/:projectId/anomalies',    getProjectAnomalies);
router.get('/:projectId/risk',         getProjectRisk);
router.get('/:projectId/location',     getProjectLocationVerification);

export default router;
