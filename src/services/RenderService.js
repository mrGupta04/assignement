import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../lib/prisma.js';
import { JobStatus, AssetType } from '@prisma/client';

export class RenderService {
  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    
    this.queue = new Queue('render', { 
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    // Set up queue event listeners
    this.setupQueueEvents();
  }

  setupQueueEvents() {
    this.queue.on('error', (err) => {
      console.error('Queue error:', err);
    });

    this.queue.on('waiting', (jobId) => {
      console.log(`Job ${jobId} is waiting`);
    });

    this.queue.on('active', (job) => {
      console.log(`Job ${job.id} is now active`);
    });

    this.queue.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
  }

  async enqueueRenderJob(projectId) {
    const assets = await prisma.asset.findMany({ 
      where: { projectId, type: AssetType.video } 
    });
    
    if (assets.length === 0) {
      throw new Error('No video assets found for rendering');
    }

    const inputPath = assets[0].path;

    // Create job record in database
    const job = await prisma.job.create({
      data: { 
        projectId, 
        status: JobStatus.PENDING, 
        inputPath 
      },
    });

    // Add to BullMQ queue
    await this.queue.add(
      'render-video',
      { 
        jobId: job.id, 
        projectId, 
        inputPath 
      },
      { 
        jobId: job.id,
        delay: 1000, // 1 second delay before processing
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    console.log(`📥 Render job enqueued: ${job.id} for project: ${projectId}`);
    return job;
  }

  async getJobStatus(jobId) {
    return await prisma.job.findUnique({
      where: { id: jobId },
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
      },
    });
  }

  async updateJobStatus(jobId, status, outputPath = null, error = null) {
    const updateData = { status };
    
    if (outputPath) updateData.outputPath = outputPath;
    if (error) updateData.error = error;

    return await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });
  }

  // Clean up method
  async disconnect() {
    await this.connection.quit();
  }
}