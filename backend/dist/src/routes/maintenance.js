import { z } from 'zod';
import { maintenanceService, MaintenanceServiceError } from '../services/maintenance.service.js';
import { SendMaintenanceSchema, ReturnMaintenanceSchema, MaintenanceParamsSchema, MaintenanceQuerySchema, MaintenanceResponseSchema, MaintenanceListResponseSchema } from '../schemas/maintenance.schema.js';
export const maintenanceRoutes = async (fastify) => {
    // GET /maintenance - list maintenance records with pagination and filters
    fastify.get('/maintenance', {
        schema: {
            tags: ['Maintenance'],
            summary: 'List maintenance records with pagination and filtering',
            querystring: MaintenanceQuerySchema,
            response: {
                200: MaintenanceListResponseSchema,
                500: z.object({ message: z.string(), error: z.string().optional() })
            }
        }
    }, async (request, reply) => {
        try {
            const query = request.query;
            const result = await maintenanceService.getMaintenances(query);
            return reply.status(200).send({
                message: 'Maintenance records retrieved successfully',
                ...result
            });
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({
                message: 'Internal server error while fetching maintenance records',
                error: error.message
            });
        }
    });
    // POST /maintenance/send - send instrument to maintenance
    fastify.post('/maintenance/send', {
        schema: {
            tags: ['Maintenance'],
            summary: 'Send an instrument to maintenance',
            body: SendMaintenanceSchema,
            response: {
                201: MaintenanceResponseSchema,
                400: z.object({ message: z.string() }),
                404: z.object({ message: z.string() }),
                409: z.object({ message: z.string() }),
                500: z.object({ message: z.string(), error: z.string().optional() })
            }
        }
    }, async (request, reply) => {
        try {
            const body = request.body;
            const data = await maintenanceService.sendToMaintenance(body);
            return reply.status(201).send({
                message: 'Instrument sent to maintenance successfully',
                data
            });
        }
        catch (error) {
            if (error instanceof MaintenanceServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            request.log.error(error);
            return reply.status(500).send({
                message: 'Internal server error while sending instrument to maintenance',
                error: error.message
            });
        }
    });
    // POST /maintenance/:id/return - return instrument from maintenance
    fastify.post('/maintenance/:id/return', {
        schema: {
            tags: ['Maintenance'],
            summary: 'Bring back / return an instrument from maintenance',
            params: MaintenanceParamsSchema,
            body: ReturnMaintenanceSchema,
            response: {
                200: MaintenanceResponseSchema,
                400: z.object({ message: z.string() }),
                404: z.object({ message: z.string() }),
                500: z.object({ message: z.string(), error: z.string().optional() })
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = request.body;
            const data = await maintenanceService.returnFromMaintenance(id, body);
            return reply.status(200).send({
                message: 'Instrument returned from maintenance successfully',
                data
            });
        }
        catch (error) {
            if (error instanceof MaintenanceServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            request.log.error(error);
            return reply.status(500).send({
                message: 'Internal server error while returning instrument from maintenance',
                error: error.message
            });
        }
    });
    // GET /maintenance/:id - get maintenance record by ID
    fastify.get('/maintenance/:id', {
        schema: {
            tags: ['Maintenance'],
            summary: 'Get maintenance record by ID',
            params: MaintenanceParamsSchema,
            response: {
                200: MaintenanceResponseSchema,
                404: z.object({ message: z.string() }),
                500: z.object({ message: z.string(), error: z.string().optional() })
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const data = await maintenanceService.getMaintenanceById(id);
            return reply.status(200).send({
                message: 'Maintenance record retrieved successfully',
                data
            });
        }
        catch (error) {
            if (error instanceof MaintenanceServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            request.log.error(error);
            return reply.status(500).send({
                message: 'Internal server error while fetching maintenance record',
                error: error.message
            });
        }
    });
};
