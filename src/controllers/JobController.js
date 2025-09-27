import { RenderService } from '../services/RenderService.js';

export class JobController {
  constructor() {
    this.renderService = new RenderService();
  }

  getJobStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const job = await this.renderService.getJobStatus(id);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.project.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ job });
    } catch (error) {
      console.error('Error fetching job status:', error);
      res.status(500).json({ error: 'Failed to fetch job status' });
    }
  };
}