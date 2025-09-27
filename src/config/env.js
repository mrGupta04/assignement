import { config } from 'dotenv';

config();

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate file paths
  if (!process.env.UPLOAD_PATH || !process.env.OUTPUT_PATH) {
    console.warn('File paths not set, using defaults');
  }

  console.log(' Environment variables validated successfully');
};
