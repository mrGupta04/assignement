import prisma from '../lib/prisma.js';

export class AnalyticsService {
  async logEvent(data) {
    return await prisma.analytics.create({ 
      data,
      include: {
        project: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async getProjectAnalytics(projectId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.analytics.findMany({
      where: { 
        projectId, 
        timestamp: { gte: startDate } 
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  async getAnalyticsSummary(projectId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await prisma.analytics.groupBy({
      by: ['eventType'],
      where: { 
        projectId, 
        timestamp: { gte: startDate } 
      },
      _count: { eventType: true }
    });

    return analytics.reduce((acc, item) => {
      acc[item.eventType] = item._count.eventType;
      return acc;
    }, {});
  }
}