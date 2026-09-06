import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { instrumentService, InstrumentServiceError } from '../services/instrument.service.js';
import {
  CreateInstrumentSchema,
  UpdateInstrumentSchema,
  InstrumentParamsSchema,
  InstrumentQuerySchema,
  DeleteInstrumentQuerySchema,
  InstrumentResponseSchema,
  CreateInstrumentInput,
  UpdateInstrumentInput,
  InstrumentParamsInput,
  InstrumentQueryInput,
  DeleteInstrumentQueryInput
} from '../schemas/instrument.schema.js';

export const instrumentRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // POST /instruments - Create a new instrument
  fastify.post('/instruments', {
    schema: {
      tags: ['Instruments'],
      summary: 'Create a new instrument',
      body: CreateInstrumentSchema,
      response: {
        201: z.object({
          message: z.string(),
          data: InstrumentResponseSchema
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const instrument = await instrumentService.createInstrument(
        request.body as CreateInstrumentInput
      );
      return reply.status(201).send({
        message: 'Instrument created successfully',
        data: instrument
      });
    } catch (error: any) {
      if (error instanceof InstrumentServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // GET /instruments - List instruments with filters and pagination
  fastify.get('/instruments', {
    schema: {
      tags: ['Instruments'],
      summary: 'List instruments with search, status filtering, and pagination',
      querystring: InstrumentQuerySchema,
      response: {
        200: z.object({
          message: z.string(),
          data: z.array(InstrumentResponseSchema),
          pagination: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            totalPages: z.number()
          })
        }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const result = await instrumentService.getInstruments(
        request.query as InstrumentQueryInput
      );
      return reply.status(200).send({
        message: 'Instruments retrieved successfully',
        data: result.instruments,
        pagination: result.pagination
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // GET /instruments/:id - Get an instrument by ID
  fastify.get('/instruments/:id', {
    schema: {
      tags: ['Instruments'],
      summary: 'Get instrument by UUID',
      params: InstrumentParamsSchema,
      response: {
        200: z.object({
          message: z.string(),
          data: InstrumentResponseSchema
        }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as InstrumentParamsInput;
      const instrument = await instrumentService.getInstrumentById(id);
      return reply.status(200).send({
        message: 'Instrument retrieved successfully',
        data: instrument
      });
    } catch (error: any) {
      if (error instanceof InstrumentServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // PATCH /instruments/:id - Update instrument details
  fastify.patch('/instruments/:id', {
    schema: {
      tags: ['Instruments'],
      summary: 'Update instrument by UUID',
      params: InstrumentParamsSchema,
      body: UpdateInstrumentSchema,
      response: {
        200: z.object({
          message: z.string(),
          data: InstrumentResponseSchema
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as InstrumentParamsInput;
      const instrument = await instrumentService.updateInstrument(
        id,
        request.body as UpdateInstrumentInput
      );
      return reply.status(200).send({
        message: 'Instrument updated successfully',
        data: instrument
      });
    } catch (error: any) {
      if (error instanceof InstrumentServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // DELETE /instruments/:id - Soft-delete or permanently delete an instrument
  fastify.delete('/instruments/:id', {
    schema: {
      tags: ['Instruments'],
      summary: 'Delete instrument by UUID (soft delete by default)',
      params: InstrumentParamsSchema,
      querystring: DeleteInstrumentQuerySchema,
      response: {
        200: z.object({
          message: z.string(),
          data: z.unknown().optional()
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as InstrumentParamsInput;
      const { permanent } = request.query as DeleteInstrumentQueryInput;
      const deletedInstrument = await instrumentService.deleteInstrument(id, permanent);
      return reply.status(200).send({
        message: permanent
          ? 'Instrument permanently deleted'
          : 'Instrument soft-deleted successfully',
        data: deletedInstrument
      });
    } catch (error: any) {
      if (error instanceof InstrumentServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // POST /instruments/:id/restore - Restore a soft-deleted instrument
  fastify.post('/instruments/:id/restore', {
    schema: {
      tags: ['Instruments'],
      summary: 'Restore a soft-deleted instrument',
      params: InstrumentParamsSchema,
      response: {
        200: z.object({
          message: z.string(),
          data: InstrumentResponseSchema
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as InstrumentParamsInput;
      const restoredInstrument = await instrumentService.restoreInstrument(id);
      return reply.status(200).send({
        message: 'Instrument restored successfully',
        data: restoredInstrument
      });
    } catch (error: any) {
      if (error instanceof InstrumentServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });
};
