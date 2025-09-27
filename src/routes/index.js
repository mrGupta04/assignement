import express from 'express';
import authRoutes from './auth.js';
import projectRoutes from './projects.js';
import jobRoutes from './jobs.js';
import analyticsRoutes from './analytics.js';

const router = express.Router();

// Mount individual route files with their base paths
router.use('/auth', authRoutes);        // → /api/auth/register, /api/auth/login
router.use('/projects', projectRoutes); // → /api/projects, /api/projects/:id/assets, etc.
router.use('/jobs', jobRoutes);         // → /api/jobs/:id
router.use('/analytics', analyticsRoutes); // → /api/analytics, /api/analytics/project/:projectId

export default router;