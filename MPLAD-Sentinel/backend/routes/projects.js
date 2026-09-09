import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  getProjectIntelligence,
  getProjectAnomalies,
  getProjectRisk,
} from '../controllers/projectController.js';

const router = Router();

router.get('/',                       getAllProjects);
router.get('/:projectId',             getProjectById);
router.get('/:projectId/intelligence', getProjectIntelligence);
router.get('/:projectId/anomalies',    getProjectAnomalies);
router.get('/:projectId/risk',         getProjectRisk);

export default router;
