import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Playable Ads SaaS API',
      version: '1.0.0',
      description: 'Backend API for Playable Ads SaaS Platform - Handle playable ad creation, video rendering, and analytics',
      contact: {
        name: 'API Support',
        email: 'support@playableads.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            email: { 
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: { 
              type: 'string',
              example: 'John Doe'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z'
            }
          }
        },
        Project: {
          type: 'object',
          required: ['title', 'userId'],
          properties: {
            id: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            title: { 
              type: 'string',
              example: 'My Playable Ad Campaign'
            },
            description: { 
              type: 'string',
              example: 'Summer promotion playable ad',
              nullable: true
            },
            userId: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z'
            },
            assets: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Asset'
              }
            },
            jobs: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Job'
              }
            }
          }
        },
        Asset: {
          type: 'object',
          properties: {
            id: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            filename: { 
              type: 'string',
              example: 'video.mp4'
            },
            path: { 
              type: 'string',
              example: '/uploads/video-123456789.mp4'
            },
            type: { 
              type: 'string',
              enum: ['image', 'video', 'audio'],
              example: 'video'
            },
            projectId: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z'
            }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            projectId: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
              example: 'PENDING'
            },
            inputPath: { 
              type: 'string',
              example: '/uploads/video-123456789.mp4',
              nullable: true
            },
            outputPath: { 
              type: 'string',
              example: '/outputs/rendered-123456789.mp4',
              nullable: true
            },
            error: { 
              type: 'string',
              nullable: true
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z'
            }
          }
        },
        Analytics: {
          type: 'object',
          required: ['projectId', 'eventType'],
          properties: {
            id: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            projectId: { 
              type: 'string',
              example: 'clx6a9z8q0000abc123def456'
            },
            eventType: { 
              type: 'string', 
              enum: ['play', 'click', 'impression'],
              example: 'play'
            },
            metadata: {
              type: 'object',
              nullable: true,
              example: { duration: 30, userId: 'user123' }
            },
            timestamp: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-01-01T00:00:00.000Z'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message'
            },
            message: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Unauthorized',
                message: 'Access denied. No token provided.'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation failed',
                message: 'Title is required'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Not found',
                message: 'Project not found'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Correct path for your project structure
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };