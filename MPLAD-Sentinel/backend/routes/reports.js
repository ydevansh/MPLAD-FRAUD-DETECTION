import { Router } from 'express';
import { listReports, getReport, createReport, updateReportStatus, getRecentReports } from '../controllers/reportController.js';
import { upload } from '../middleware/upload.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();
router.get('/', listReports);
router.get('/recent', getRecentReports);
router.get('/:id', getReport);
router.post('/', upload.single('photo'), createReport);
router.patch('/:id/status', verifyToken, updateReportStatus);
export default router;
