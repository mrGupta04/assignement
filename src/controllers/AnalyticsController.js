import { AnalyticsService } from '../services/AnalyticsService.js';

export class AnalyticsController {
  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  logEvent = async (req, res) => {
    try {
      const { projectId, eventType, metadata } = req.body;

      if (!projectId || !eventType) {
        return res.status(400).json({ error: 'projectId and eventType are required' });
      }

      if (!['play', 'click', 'impression'].includes(eventType)) {
        return res.status(400).json({ error: 'eventType must be one of: play, click, impression' });
      }

      const event = await this.analyticsService.logEvent({
        projectId,
        eventType,
        metadata: metadata || {}
      });

      res.status(201).json({
        message: 'Analytics event logged successfully',
        event
      });
    } catch (error) {
      console.error('Error logging analytics event:', error);
      res.status(500).json({ error: 'Failed to log analytics event' });
    }
  };

  getProjectAnalytics = async (req, res) => {
    try {
      const { projectId } = req.params;
      const days = parseInt(req.query.days) || 30;

      const analytics = await this.analyticsService.getProjectAnalytics(projectId, days);
      const summary = await this.analyticsService.getAnalyticsSummary(projectId, days);

      res.json({
        projectId,
        period: `${days} days`,
        totalEvents: analytics.length,
        summary,
        events: analytics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  };
}