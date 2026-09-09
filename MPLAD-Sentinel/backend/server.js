import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Phase 2
import projectRoutes from './routes/projects.js';

// Future phases (uncomment when needed)
// import reportRoutes    from './routes/reports.js';
// import dashboardRoutes from './routes/dashboard.js';
// import authRoutes      from './routes/auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MPLAD-Sentinel backend is running' });
});

// ── Phase 2: Public project routes ────────────────────────────────────────────
app.use('/api/projects', projectRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🛡️  MPLAD-Sentinel API running on http://localhost:${PORT}`);
  console.log(`   Health:   GET /api/health`);
  console.log(`   Projects: GET /api/projects`);
  console.log(`   Project:  GET /api/projects/:projectId\n`);
});

export default app;