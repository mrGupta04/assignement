import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { RenderService } from '../services/RenderService.js';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { JobStatus } from '@prisma/client';
import dotenv from 'dotenv';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('Connecting to Redis:', redisUrl);

const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
});

// Handle Redis connection events
redis.on('connect', () => console.log(' Connected to Redis'));
redis.on('error', (err) => console.error(' Redis connection error:', err));
redis.on('close', () => console.log('🔌 Redis connection closed'));

const renderService = new RenderService();

// Enhanced worker configuration
const worker = new Worker(
  'render',
  async (job) => {
    console.log(` Processing render job: ${job.id}`);
    console.log('Job data:', job.data);

    const { jobId, projectId, inputPath } = job.data;

    // Validate required data
    if (!jobId || !projectId || !inputPath) {
      throw new Error(`Missing required job data: jobId=${jobId}, projectId=${projectId}, inputPath=${inputPath}`);
    }

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    try {
      // Update job status to PROCESSING
      await renderService.updateJobStatus(jobId, JobStatus.PROCESSING);
      console.log(` Job ${jobId} status updated to PROCESSING`);

      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), 'outputs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created output directory: ${outputDir}`);
      }

      const outputFileName = `rendered-${jobId}-${Date.now()}.mp4`;
      const outputPath = path.join(outputDir, outputFileName);

      console.log(` Input: ${inputPath}`);
      console.log(` Output: ${outputPath}`);

      // FFmpeg processing with overlay text and error handling
      await new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-crf 23',
            '-preset fast',
            '-movflags faststart',
            '-y' // Overwrite output file if it exists
          ])
          .complexFilter([
            {
              filter: 'drawtext',
              options: {
                text: `Playable Ad - Project: ${projectId.slice(-8)}`,
                fontsize: 24,
                fontcolor: 'white',
                x: '(w-text_w)/2',
                y: 'h-60',
                box: 1,
                boxcolor: 'black@0.5',
                boxborderw: 5,
              },
            },
          ])
          .on('start', (commandLine) => {
            console.log(' FFmpeg command started');
            console.log('Command:', commandLine);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(` Processing: ${progress.percent.toFixed(2)}% done`);
            }
          })
          .on('end', () => {
            console.log(' FFmpeg processing finished successfully');
            
            // Verify output file was created
            if (fs.existsSync(outputPath)) {
              const stats = fs.statSync(outputPath);
              console.log(` Output file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
              resolve();
            } else {
              reject(new Error('Output file was not created'));
            }
          })
          .on('error', (err) => {
            console.error(' FFmpeg error:', err);
            reject(new Error(`FFmpeg processing failed: ${err.message}`));
          })
          .on('stderr', (stderrLine) => {
            console.log('FFmpeg stderr:', stderrLine);
          });

        command.save(outputPath);
      });

      // Update job status to COMPLETED
      await renderService.updateJobStatus(jobId, JobStatus.COMPLETED, outputPath);
      console.log(` Render job completed: ${job.id}`);

      return { 
        success: true, 
        outputPath,
        jobId,
        projectId 
      };

    } catch (error) {
      console.error(` Render job failed: ${job.id}`, error);

      // Update job status to FAILED with error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await renderService.updateJobStatus(jobId, JobStatus.FAILED, undefined, errorMessage);

      throw error;
    }
  },
  { 
    connection: redis,
    concurrency: 2, // Process 2 jobs concurrently
    removeOnComplete: {
      age: 3600, // keep up to 1 hour
      count: 100, // keep up to 100 jobs
    },
    removeOnFail: {
      age: 24 * 3600, // keep up to 24 hours
    },
    lockDuration: 300000, // 5 minutes lock duration
    stallInterval: 30000, // Check for stalled jobs every 30 seconds
  }
);

// Worker event handlers
worker.on('ready', () => {
  console.log(' Render worker is ready and waiting for jobs...');
});

worker.on('active', (job) => {
  console.log(` Job ${job.id} is now active`);
});

worker.on('completed', (job, result) => {
  console.log(` Job ${job.id} completed successfully`);
  console.log('Result:', result);
});

worker.on('failed', (job, err) => {
  console.error(` Job ${job?.id} failed with error:`, err.message);
  if (job) {
    console.log('Failed job data:', job.data);
  }
});

worker.on('stalled', (jobId) => {
  console.warn(` Job ${jobId} has stalled`);
});

worker.on('error', (err) => {
  console.error(' Worker error:', err);
});

worker.on('closing', () => {
  console.log(' Worker is closing...');
});

worker.on('closed', () => {
  console.log(' Worker closed');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(' Received SIGINT. Shutting down worker gracefully...');
  await worker.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(' Received SIGTERM. Shutting down worker gracefully...');
  await worker.close();
  await redis.quit();
  process.exit(0);
});

console.log(' Render worker started successfully!');
console.log(' Worker options:', {
  concurrency: worker.opts.concurrency,
  lockDuration: worker.opts.lockDuration,
  stallInterval: worker.opts.stallInterval
});