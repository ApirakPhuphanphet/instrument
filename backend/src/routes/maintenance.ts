import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  maintenanceService,
  MaintenanceServiceError
} from '../services/maintenance.service.js';
import {
  SendMaintenanceSchema,
  SendMaintenanceInput,
  ReturnMaintenanceSchema,
  ReturnMaintenanceInput,
  MaintenanceParamsSchema,
  MaintenanceParamsInput,
  MaintenanceQuerySchema,
  MaintenanceQueryInput,
  MaintenanceResponseSchema,
  MaintenanceListResponseSchema
} from '../schemas/maintenance.schema.js';

export const maintenanceRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /maintenance - list maintenance records with pagination and filters (Authenticated)
  fastify.get('/maintenance', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Maintenance'],
      summary: 'List maintenance records with pagination and filtering',
      security: [{ bearerAuth: [] }],
      querystring: MaintenanceQuerySchema,
      response: {
        200: MaintenanceListResponseSchema,
        401: z.object({ message: z.string() }),
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    try {
      const query = request.query as MaintenanceQueryInput;
      const result = await maintenanceService.getMaintenances(query);
      return reply.status(200).send({
        message: 'Maintenance records retrieved successfully',
        ...result
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        message: 'Internal server error while fetching maintenance records',
        error: error.message
      });
    }
  });

  // POST /maintenance/send - send instrument to maintenance (Admin only)
  fastify.post('/maintenance/send', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      tags: ['Maintenance'],
      summary: 'Send an instrument to maintenance (Admin only)',
      security: [{ bearerAuth: [] }],
      body: SendMaintenanceSchema,
      response: {
        201: MaintenanceResponseSchema,
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as SendMaintenanceInput;
      const data = await maintenanceService.sendToMaintenance(body);
      return reply.status(201).send({
        message: 'Instrument sent to maintenance successfully',
        data
      });
    } catch (error: any) {
      if (error instanceof MaintenanceServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({
        message: 'Internal server error while sending instrument to maintenance',
        error: error.message
      });
    }
  });

  // POST /maintenance/:id/return - return instrument from maintenance (Admin only)
  fastify.post('/maintenance/:id/return', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      tags: ['Maintenance'],
      summary: 'Bring back / return an instrument from maintenance (Admin only)',
      security: [{ bearerAuth: [] }],
      params: MaintenanceParamsSchema,
      body: ReturnMaintenanceSchema,
      response: {
        200: MaintenanceResponseSchema,
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as MaintenanceParamsInput;
      const body = request.body as ReturnMaintenanceInput;
      const data = await maintenanceService.returnFromMaintenance(id, body);
      return reply.status(200).send({
        message: 'Instrument returned from maintenance successfully',
        data
      });
    } catch (error: any) {
      if (error instanceof MaintenanceServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({
        message: 'Internal server error while returning instrument from maintenance',
        error: error.message
      });
    }
  });

  // GET /maintenance/:id - get maintenance record by ID (Authenticated)
  fastify.get('/maintenance/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Maintenance'],
      summary: 'Get maintenance record by ID',
      security: [{ bearerAuth: [] }],
      params: MaintenanceParamsSchema,
      response: {
        200: MaintenanceResponseSchema,
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as MaintenanceParamsInput;
      const data = await maintenanceService.getMaintenanceById(id);
      return reply.status(200).send({
        message: 'Maintenance record retrieved successfully',
        data
      });
    } catch (error: any) {
      if (error instanceof MaintenanceServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      request.log.error(error);
      return reply.status(500).send({
        message: 'Internal server error while fetching maintenance record',
        error: error.message
      });
    }
  });
};
