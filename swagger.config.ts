import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bright.Blue Brand Portal API',
      version: '1.0.0',
      description: 'API documentation for the Bright.Blue Brand Portal',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3720',
        description: 'Development server',
      },
      {
        url: 'https://api.production.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Campaign: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            machineId: { type: 'string' },
            tenantId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            totalProductsDispensed: { type: 'integer' },
            totalUserInteractions: { type: 'integer' },
            totalFreeSamplesRedeemed: { type: 'integer' },
            totalProductClicks: { type: 'integer' },
            uniqueCustomers: { type: 'integer' },
            averageEngagementTime: { type: 'number' },
            totalAdPlays: { type: 'integer' },
            machineUptimePercent: { type: 'number' },
            restockTimes: { type: 'integer' },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            primaryColor: { type: 'string' },
            secondaryColor: { type: 'string' },
            logoUrl: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.ts', './routes/*.js'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

