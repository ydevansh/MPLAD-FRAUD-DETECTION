import { Router } from 'express';
import {
  getSummary,
  getAttention,
  getProjects,
  getAnomalies,
  getPortfolioRisk,
} from '../controllers/adminController.js';

const router = Router();

router.get('/summary',   getSummary);
router.get('/attention', getAttention);
router.get('/projects',  getProjects);
router.get('/anomalies', getAnomalies);
router.get('/risk',      getPortfolioRisk);

export default router;
