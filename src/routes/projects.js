import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
const projectController = new ProjectController();

// Apply auth middleware to all project routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My Playable Ad"
 *               description:
 *                 type: string
 *                 example: "A description of my playable ad"
 *     responses:
 *       201:
 *         description: Project created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', projectController.createProject);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', projectController.getUserProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a specific project by ID
 *     tags: [Projects]
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
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/:id', projectController.getProject);

/**
 * @swagger
 * /projects/{id}/assets:
 *   post:
 *     summary: Upload an asset for a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               asset:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Asset uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 */
router.post('/:id/assets', upload.single('asset'), projectController.uploadAsset);

/**
 * @swagger
 * /projects/{id}/render:
 *   post:
 *     summary: Enqueue a render job for a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Render job enqueued successfully
 *       400:
 *         description: No video assets found for rendering
 */
router.post('/:id/render', projectController.enqueueRender);

export default router;