import { Router } from 'express';
import { JobController } from '../controllers/JobController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const jobController = new JobController();

// Apply auth middleware to all job routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job management endpoints
 */

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get job status
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *       404:
 *         description: Job not found
 */
router.get('/:id', jobController.getJobStatus);

export default router;