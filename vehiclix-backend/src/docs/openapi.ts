export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Vehiclix API',
    version: '0.1.0',
    description: 'Vehicle & Fuel Intelligence Platform — Modular Monolith REST API',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Root',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Service health and dependency status',
        tags: ['System'],
        responses: {
          '200': { description: 'Service health status', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
        },
      },
    },
    '/calculator/estimate': {
      post: {
        summary: 'Calculate estimated trip fuel cost (Public)',
        tags: ['Calculator'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['distance', 'mileage', 'fuelPrice', 'fuelType'],
                properties: {
                  distance: { type: 'number', example: 500 },
                  mileage: { type: 'number', example: 15 },
                  fuelPrice: { type: 'number', example: 105.5 },
                  fuelType: { type: 'string', enum: ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'OTHER'], example: 'PETROL' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Calculation result' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/dashboard': {
      get: {
        summary: 'Get consolidated user dashboard metrics',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Dashboard metrics summary' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/users/profile': {
      get: {
        summary: 'Get authenticated user profile',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'User profile details' },
          '401': { description: 'Unauthorized' },
        },
      },
      patch: {
        summary: 'Update authenticated user profile',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  profileImagePath: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
        },
      },
    },
    '/users/account': {
      delete: {
        summary: 'Transactional account data deletion',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Account deleted' },
        },
      },
    },
    '/vehicles': {
      get: {
        summary: 'List user garage vehicles',
        tags: ['Vehicles'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'List of vehicles' },
        },
      },
      post: {
        summary: 'Add a new vehicle to user garage',
        tags: ['Vehicles'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'vehicleType', 'fuelType'],
                properties: {
                  name: { type: 'string', example: 'Honda City' },
                  make: { type: 'string', example: 'Honda' },
                  model: { type: 'string', example: 'City' },
                  year: { type: 'integer', example: 2022 },
                  licensePlate: { type: 'string', example: 'MH01AB1234' },
                  vehicleType: { type: 'string', enum: ['CAR', 'BIKE', 'TRUCK', 'OTHER'] },
                  fuelType: { type: 'string', enum: ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'OTHER'] },
                  initialOdometer: { type: 'number', example: 1000 },
                  rcDocumentPath: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Vehicle created' },
        },
      },
    },
    '/vehicles/{id}': {
      get: {
        summary: 'Get vehicle details by ID',
        tags: ['Vehicles'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Vehicle details' }, '404': { description: 'Vehicle not found' } },
      },
      patch: {
        summary: 'Update vehicle details',
        tags: ['Vehicles'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Vehicle updated' } },
      },
      delete: {
        summary: 'Delete vehicle and associated records',
        tags: ['Vehicles'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Vehicle deleted' } },
      },
    },
    '/fuel': {
      get: {
        summary: 'List fuel entries (optional vehicleId filter)',
        tags: ['Fuel'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'vehicleId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'List of fuel logs' } },
      },
      post: {
        summary: 'Log a fuel or EV charging purchase',
        tags: ['Fuel'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicleId', 'quantity', 'unit', 'pricePerUnit', 'fuelType'],
                properties: {
                  vehicleId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'number', example: 35.5 },
                  unit: { type: 'string', enum: ['LITRE', 'GALLON', 'KG', 'KWH'] },
                  pricePerUnit: { type: 'number', example: 104.5 },
                  fuelType: { type: 'string', enum: ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'OTHER'] },
                  odometer: { type: 'number', example: 5200 },
                  stationName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Fuel entry created' } },
      },
    },
    '/fuel/stats': {
      get: {
        summary: 'Get aggregated fuel and energy expenditure statistics',
        tags: ['Fuel'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'vehicleId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Fuel statistics' } },
      },
    },
    '/services': {
      get: {
        summary: 'List vehicle maintenance service records',
        tags: ['Services'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'vehicleId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'List of service records' } },
      },
      post: {
        summary: 'Create a maintenance service record with itemized parts',
        tags: ['Services'],
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Service record created' } },
      },
    },
    '/trips': {
      get: {
        summary: 'List user road trips',
        tags: ['Trips'],
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'List of trips' } },
      },
      post: {
        summary: 'Create a new trip with participants and split configuration',
        tags: ['Trips'],
        security: [{ BearerAuth: [] }],
        responses: { '201': { description: 'Trip created' } },
      },
    },
    '/trips/{id}': {
      get: {
        summary: 'Get full trip details including participants and itemized expenses',
        tags: ['Trips'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Trip details' } },
      },
      patch: {
        summary: 'Update trip (read-only if trip is completed)',
        tags: ['Trips'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Trip updated' } },
      },
      delete: {
        summary: 'Delete trip',
        tags: ['Trips'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Trip deleted' } },
      },
    },
    '/trips/{id}/split': {
      get: {
        summary: 'Calculate deterministic equal split and net participant balances',
        tags: ['Trips'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Split calculation summary' } },
      },
    },
    '/reports/vehicle/{vehicleId}': {
      get: {
        summary: 'Generate and stream vehicle summary PDF report on demand',
        tags: ['Reports'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'vehicleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'PDF stream', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
        },
      },
    },
    '/reports/trip/{tripId}': {
      get: {
        summary: 'Generate and stream trip split breakdown PDF report on demand',
        tags: ['Reports'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'tripId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'PDF stream', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } },
        },
      },
    },
    '/admin/overview': {
      get: {
        summary: 'System-wide operational overview (Admin only)',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Admin overview metrics' }, '403': { description: 'Forbidden' } },
      },
    },
    '/admin/users': {
      get: {
        summary: 'User directory with vehicle counts (Admin only)',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'User directory list' }, '403': { description: 'Forbidden' } },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok', 'degraded'], example: 'ok' },
              timestamp: { type: 'string', format: 'date-time' },
              uptimeSeconds: { type: 'number' },
              environment: { type: 'string' },
              version: { type: 'string' },
              services: { type: 'object' },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid vehicle data' },
              details: { type: 'object' },
            },
            required: ['code', 'message'],
          },
        },
        required: ['success', 'error'],
      },
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT access token',
      },
    },
  },
};
