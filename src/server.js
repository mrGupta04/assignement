import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import routes from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload and output directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const outputDir = path.join(process.cwd(), 'outputs');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadDir}`);
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(` Created outputs directory: ${outputDir}`);
}

// Serve static files
app.use('/uploads', express.static(uploadDir));
app.use('/outputs', express.static(outputDir));

// API Routes - Use the index route that combines all routes
app.use('/api', routes);

// Enhanced Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Playable Ads SaaS API Documentation',
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Playable Ads SaaS API',
    version: '1.0.0',
    description: 'Backend service for creating and rendering playable ads',
    endpoints: {
      documentation: '/api-docs',
      health: '/health',
      api: {
        base: '/api',
        auth: '/api/auth',
        projects: '/api/projects',
        jobs: '/api/jobs',
        analytics: '/api/analytics'
      },
      static: {
        uploads: '/uploads',
        outputs: '/outputs'
      }
    }
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthInfo = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Playable Ads SaaS API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'Connected',
      uploadsDirectory: fs.existsSync(uploadDir) ? 'OK' : 'Missing',
      outputsDirectory: fs.existsSync(outputDir) ? 'OK' : 'Missing',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    
    res.json(healthInfo);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'Playable Ads SaaS API',
      database: 'Connection failed',
      error: error.message
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login'
      ],
      projects: [
        'POST /api/projects',
        'GET /api/projects',
        'GET /api/projects/:id',
        'POST /api/projects/:id/assets',
        'POST /api/projects/:id/render'
      ],
      jobs: [
        'GET /api/jobs/:id'
      ],
      analytics: [
        'POST /api/analytics',
        'GET /api/analytics/project/:projectId'
      ]
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'Maximum file size is 100MB'
    });
  }

  if (err.message.includes('Invalid file type')) {
    return res.status(415).json({
      error: 'Unsupported media type',
      message: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication token is invalid'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Authentication token has expired'
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A record with this value already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      message: 'The requested resource was not found'
    });
  }

  // Default error response
  const statusCode = err.status || 500;
  const errorResponse = {
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack,
      details: err
    })
  };

  // Remove stack trace in production
  if (process.env.NODE_ENV !== 'development') {
    delete errorResponse.stack;
    delete errorResponse.details;
  }

  res.status(statusCode).json(errorResponse);
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api-docs',
      'GET /api/*',
      'GET /uploads/*',
      'GET /outputs/*'
    ]
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n Received ${signal}. Shutting down gracefully...`);
  
  try {
    await prisma.$disconnect();
    console.log(' Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error(' Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start Server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
 Playable Ads SaaS API Server Started!
 Port: ${PORT}
 API Documentation: http://localhost:${PORT}/api-docs
 Health Check: http://localhost:${PORT}/health
 Base URL: http://localhost:${PORT}/api
 Uploads: http://localhost:${PORT}/uploads
 Outputs: http://localhost:${PORT}/outputs

 JWT Secret: ${process.env.JWT_SECRET ? ' Set' : ' Missing!'}
 Database: ${process.env.DATABASE_URL ? ' Configured' : ' Missing!'}
 Redis: ${process.env.REDIS_URL ? ' Configured' : '  Missing (using default)'}
 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

export default app;