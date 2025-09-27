import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const analyticsController = new AnalyticsController();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics logging endpoints
 */

/**
 * @swagger
 * /analytics:
 *   post:
 *     summary: Log an analytics event
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - eventType
 *             properties:
 *               projectId:
 *                 type: string
 *                 example: "clx6a9z8q0000abc123def456"
 *               eventType:
 *                 type: string
 *                 enum: [play, click, impression]
 *                 example: "play"
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event logged successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/', analyticsController.logEvent);

/**
 * @swagger
 * /analytics/project/{projectId}:
 *   get:
 *     summary: Get analytics for a project
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Analytics data
 *       403:
 *         description: Access denied
 */
router.get('/project/:projectId', authMiddleware, analyticsController.getProjectAnalytics);

export default router;