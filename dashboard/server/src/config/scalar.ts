import { PORT } from './constants';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Nayarta Docker Dashboard API',
    version: '1.0.0',
    description: 'API documentation for Nayarta Docker Dashboard - A web-based dashboard for monitoring and managing Docker containers.',
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'General', description: 'General API endpoints' },
    { name: 'Profiles', description: 'Docker Compose profile management' },
    { name: 'Containers', description: 'Container management and monitoring' },
    { name: 'Compose', description: 'Docker Compose operations' },
    { name: 'Images', description: 'Docker image management' },
    { name: 'Volumes', description: 'Docker volume management' },
    { name: 'Config', description: 'Project configuration files (.env, MediaMTX)' },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Health check',
        description: 'Get API health status and available profiles',
        tags: ['General'],
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    version: { type: 'string' },
                    profiles: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/profiles': {
      get: {
        summary: 'Get all available profiles',
        description: 'Returns a list of all available Docker Compose profiles',
        tags: ['Profiles'],
        responses: {
          '200': {
            description: 'List of profiles',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    profiles: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/containers': {
      get: {
        summary: 'Get containers',
        description: 'Get list of containers, optionally filtered by profile',
        tags: ['Containers'],
        parameters: [
          {
            name: 'profile',
            in: 'query',
            description: 'Profile filter',
            required: false,
            schema: {
              type: 'string',
              enum: ['appstack', 'analytics-tools', 'app', 'stream', 'stream-camera'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of containers',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    containers: { type: 'array' },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/containers/{id}': {
      get: {
        summary: 'Get container details',
        description: 'Get detailed information about a specific container',
        tags: ['Containers'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Container details',
          },
        },
      },
    },
    '/api/containers/{id}/stats': {
      get: {
        summary: 'Get container stats',
        description: 'Get real-time statistics for a container',
        tags: ['Containers'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Container statistics',
          },
        },
      },
    },
    '/api/containers/{id}/logs': {
      get: {
        summary: 'Get container logs',
        description: 'Get logs from a container',
        tags: ['Containers'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'tail',
            in: 'query',
            description: 'Number of lines to return',
            required: false,
            schema: { type: 'integer', default: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Container logs',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
    '/api/containers/stats/aggregate': {
      post: {
        summary: 'Get aggregate stats',
        description: 'Get aggregated statistics for multiple containers',
        tags: ['Containers'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  containerIds: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['containerIds'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Aggregate statistics',
          },
        },
      },
    },
    '/api/containers/{id}/{action}': {
      post: {
        summary: 'Container action',
        description: 'Perform an action on a container (start, stop, restart, remove)',
        tags: ['Containers'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'action',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['start', 'stop', 'restart', 'remove'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Action executed successfully',
          },
        },
      },
    },
    '/api/compose/{profile}/{action}': {
      post: {
        summary: 'Execute docker compose command',
        description: 'Execute docker compose up or down command for a specific profile',
        tags: ['Compose'],
        parameters: [
          {
            name: 'profile',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'action',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['up', 'down'] },
          },
        ],
        responses: {
          '200': {
            description: 'Command executed successfully',
          },
        },
      },
    },
    '/api/images': {
      get: {
        summary: 'Get all images',
        description: 'Get list of all Docker images',
        tags: ['Images'],
        responses: {
          '200': {
            description: 'List of images',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    images: { type: 'array' },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/images/pull': {
      post: {
        summary: 'Pull image',
        description: 'Pull a Docker image from registry with progress tracking',
        tags: ['Images'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  imageName: { type: 'string' },
                },
                required: ['imageName'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Pull started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    progressId: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/images/pull/progress/{progressId}': {
      get: {
        summary: 'Get pull progress',
        description: 'Get progress of an image pull operation',
        tags: ['Images'],
        parameters: [
          {
            name: 'progressId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Pull progress',
          },
        },
      },
    },
    '/api/images/pull/cancel/{progressId}': {
      post: {
        summary: 'Cancel pull',
        description: 'Cancel an ongoing image pull operation',
        tags: ['Images'],
        parameters: [
          {
            name: 'progressId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Pull cancelled',
          },
        },
      },
    },
    '/api/images/{id}': {
      delete: {
        summary: 'Delete image',
        description: 'Delete a Docker image',
        tags: ['Images'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Image deleted successfully',
          },
        },
      },
    },
    '/api/volumes': {
      get: {
        summary: 'Get all volumes',
        description: 'Get list of all Docker volumes',
        tags: ['Volumes'],
        responses: {
          '200': {
            description: 'List of volumes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    volumes: { type: 'array' },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/volumes/{name}': {
      get: {
        summary: 'Get volume details',
        description: 'Get detailed information about a specific volume',
        tags: ['Volumes'],
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Volume details',
          },
          '404': {
            description: 'Volume not found',
          },
        },
      },
      delete: {
        summary: 'Delete volume',
        description: 'Delete a Docker volume',
        tags: ['Volumes'],
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Volume deleted successfully',
          },
          '400': {
            description: 'Failed to delete volume',
          },
        },
      },
    },
    '/api/config/env': {
      get: {
        summary: 'Get .env file content',
        description: 'Read .env file content from project root',
        tags: ['Config'],
        responses: {
          '200': {
            description: '.env content',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update .env file',
        description: 'Overwrite .env file content at project root',
        tags: ['Config'],
        requestBody: {
          required: true,
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
            },
          },
        },
        responses: {
          '200': {
            description: '.env updated successfully',
          },
        },
      },
    },
    '/api/config/mediamtx': {
      get: {
        summary: 'Get MediaMTX config',
        description: 'Read stream/config/mediamtx.yml content',
        tags: ['Config'],
        responses: {
          '200': {
            description: 'mediamtx.yml content',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '404': {
            description: 'mediamtx.yml not found',
          },
        },
      },
      put: {
        summary: 'Update MediaMTX config',
        description: 'Overwrite stream/config/mediamtx.yml content',
        tags: ['Config'],
        requestBody: {
          required: true,
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'mediamtx.yml updated successfully',
          },
        },
      },
    },
    '/api/config/host-ip': {
      put: {
        summary: 'Update HOST_IP, SSE_ALLOW_ORIGINS, BASE_URL, and HOMEPAGE_URL',
        description: 'Update HOST_IP variable, add IP to SSE_ALLOW_ORIGINS, and replace localhost with IP in BASE_URL and HOMEPAGE_URL in .env file',
        tags: ['Config'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ip: {
                    type: 'string',
                    description: 'IP address to set as HOST_IP, add to SSE_ALLOW_ORIGINS, and replace localhost in BASE_URL and HOMEPAGE_URL',
                    example: '192.168.1.100',
                  },
                },
                required: ['ip'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'HOST_IP, SSE_ALLOW_ORIGINS, BASE_URL, and HOMEPAGE_URL updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request (missing or invalid IP address)',
          },
          '500': {
            description: 'Server error',
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health check endpoint',
        description: 'Simple health check endpoint to verify API is running',
        tags: ['General'],
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

