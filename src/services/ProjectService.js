import prisma from '../lib/prisma.js';
import { AssetType } from '@prisma/client';

export class ProjectService {
  async createProject(data) {
    return await prisma.project.create({ 
      data,
      include: {
        assets: true,
        jobs: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async getProjectById(id) {
    return await prisma.project.findUnique({
      where: { id },
      include: { 
        assets: true, 
        jobs: {
          orderBy: { createdAt: 'desc' }
        }, 
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
    });
  }

  async uploadAsset(data) {
    return await prisma.asset.create({ 
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

  async getUserProjects(userId) {
    return await prisma.project.findMany({
      where: { userId },
      include: { 
        assets: true, 
        jobs: {
          orderBy: { createdAt: 'desc' }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async projectBelongsToUser(projectId, userId) {
    const project = await prisma.project.findFirst({ 
      where: { id: projectId, userId } 
    });
    return !!project;
  }
}