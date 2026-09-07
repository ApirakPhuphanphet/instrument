import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  instrumentGroupService,
  InstrumentGroupServiceError
} from '../services/instrument-group.service.js';
import {
  CreateInstrumentGroupSchema,
  UpdateInstrumentGroupSchema,
  InstrumentGroupParamsSchema,
  InstrumentGroupQuerySchema,
  DeleteInstrumentGroupQuerySchema,
  InstrumentGroupResponseSchema,
  CreateInstrumentGroupInput,
  UpdateInstrumentGroupInput,
  InstrumentGroupParamsInput,
  InstrumentGroupQueryInput,
  DeleteInstrumentGroupQueryInput
} from '../schemas/instrument-group.schema.js';

export const instrumentGroupRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // POST /instrument-groups - Create a new instrument group
  fastify.post('/instrument-groups', {
    schema: {
      tags: ['Instrument Groups'],
      summary: 'Create a new instrument group',
      body: CreateInstrumentGroupSchema,
      response: {
        201: z.object({
          message: z.string(),
          data: InstrumentGroupResponseSchema
        }),
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const group = await instrumentGroupService.createGroup(
        request.body as CreateInstrumentGroupInput
      );
      return reply.status(201).send({
        message: 'Instrument group created successfully',
        data: group
      });
    } catch (error: any) {
      if (error instanceof InstrumentGroupServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // GET /instrument-groups - List instrument groups
  fastify.get('/instrument-groups', {
    schema: {
      tags: ['Instrument Groups'],
      summary: 'List instrument groups with stats and nested units',
      querystring: InstrumentGroupQuerySchema,
      response: {
        200: z.object({
          message: z.string(),
          data: z.array(InstrumentGroupResponseSchema),
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
      const result = await instrumentGroupService.getGroups(
        request.query as InstrumentGroupQueryInput
      );
      return reply.status(200).send({
        message: 'Instrument groups retrieved successfully',
        data: result.groups,
        pagination: result.pagination
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // GET /instrument-groups/:id - Get an instrument group by ID
  fastify.get('/instrument-groups/:id', {
    schema: {
      tags: ['Instrument Groups'],
      summary: 'Get instrument group by UUID',
      params: InstrumentGroupParamsSchema,
      response: {
        200: z.object({
          message: z.string(),
          data: InstrumentGroupResponseSchema
        }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as InstrumentGroupParamsInput;
      const group = await instrumentGroupService.getGroupById(id);
      return reply.status(200).send({
        message: 'Instrument group retrieved successfully',
        data: group
      });
    } catch (error: any) {
      if (error instanceof InstrumentGroupServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // PATCH /instrument-groups/:id - Update group details
  fastify.patch('/instrument-groups/:id', {
    schema: {
      tags: ['Instrument Groups'],
      summary: 'Update instrument group by UUID',
      params: InstrumentGroupParamsSchema,
      body: UpdateInstrumentGroupSchema,
      response: {
        200: z.object({
          message: z.string(),
          data: InstrumentGroupResponseSchema
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as InstrumentGroupParamsInput;
      const group = await instrumentGroupService.updateGroup(
        id,
        request.body as UpdateInstrumentGroupInput
      );
      return reply.status(200).send({
        message: 'Instrument group updated successfully',
        data: group
      });
    } catch (error: any) {
      if (error instanceof InstrumentGroupServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // DELETE /instrument-groups/:id - Soft-delete or permanent delete group
  fastify.delete('/instrument-groups/:id', {
    schema: {
      tags: ['Instrument Groups'],
      summary: 'Delete instrument group by UUID',
      params: InstrumentGroupParamsSchema,
      querystring: DeleteInstrumentGroupQuerySchema,
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
      const { id } = request.params as InstrumentGroupParamsInput;
      const { permanent } = request.query as DeleteInstrumentGroupQueryInput;
      const deletedGroup = await instrumentGroupService.deleteGroup(id, permanent);
      return reply.status(200).send({
        message: permanent
          ? 'Instrument group permanently deleted'
          : 'Instrument group soft-deleted successfully',
        data: deletedGroup
      });
    } catch (error: any) {
      if (error instanceof InstrumentGroupServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });

  // POST /instrument-groups/:id/restore - Restore a soft-deleted group
  fastify.post('/instrument-groups/:id/restore', {
    schema: {
      tags: ['Instrument Groups'],
      summary: 'Restore a soft-deleted instrument group',
      params: InstrumentGroupParamsSchema,
      response: {
        200: z.object({
          message: z.string(),
          data: InstrumentGroupResponseSchema
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as InstrumentGroupParamsInput;
      const restoredGroup = await instrumentGroupService.restoreGroup(id);
      return reply.status(200).send({
        message: 'Instrument group restored successfully',
        data: restoredGroup
      });
    } catch (error: any) {
      if (error instanceof InstrumentGroupServiceError) {
        return reply.status(error.statusCode as any).send({ message: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });
};
