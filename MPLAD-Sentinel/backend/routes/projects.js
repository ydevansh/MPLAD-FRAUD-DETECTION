import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  getProjectIntelligence,
} from '../controllers/projectController.js';

const router = Router();

router.get('/',                       getAllProjects);
router.get('/:projectId',             getProjectById);
router.get('/:projectId/intelligence', getProjectIntelligence);

export default router;
