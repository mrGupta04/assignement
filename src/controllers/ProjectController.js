import { ProjectService } from '../services/ProjectService.js';
import { RenderService } from '../services/RenderService.js';
import { AssetType } from '@prisma/client';

export class ProjectController {
  constructor() {
    this.projectService = new ProjectService();
    this.renderService = new RenderService();
  }

  createProject = async (req, res) => {
    try {
      const { title, description } = req.body;
      const userId = req.user.id;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const project = await this.projectService.createProject({
        title,
        description: description || '',
        userId,
      });

      res.status(201).json({
        message: 'Project created successfully',
        project
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  };

  getProject = async (req, res) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ project });
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  };

  getUserProjects = async (req, res) => {
    try {
      const userId = req.user.id;
      const projects = await this.projectService.getUserProjects(userId);
      
      res.json({
        count: projects.length,
        projects
      });
    } catch (error) {
      console.error('Error fetching user projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  };

  uploadAsset = async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const project = await this.projectService.getProjectById(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      let assetType = AssetType.image;
      if (file.mimetype.startsWith('video/')) assetType = AssetType.video;
      else if (file.mimetype.startsWith('audio/')) assetType = AssetType.audio;

      const asset = await this.projectService.uploadAsset({
        projectId: id,
        filename: file.originalname,
        path: file.path,
        type: assetType,
      });

      res.status(201).json({
        message: 'Asset uploaded successfully',
        asset
      });
    } catch (error) {
      console.error('Error uploading asset:', error);
      res.status(500).json({ error: 'Failed to upload asset' });
    }
  };

  enqueueRender = async (req, res) => {
    try {
      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const job = await this.renderService.enqueueRenderJob(id);
      
      res.status(202).json({
        message: 'Render job enqueued successfully',
        job
      });
    } catch (error) {
      console.error('Error enqueuing render job:', error);
      res.status(400).json({ error: error.message });
    }
  };
}