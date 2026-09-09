import { Router } from 'express';
import {
  getSummary,
  getAttention,
  getProjects,
} from '../controllers/adminController.js';

const router = Router();

router.get('/summary',   getSummary);
router.get('/attention', getAttention);
router.get('/projects',  getProjects);

export default router;
