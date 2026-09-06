import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  RfidBodySchema,
  LoadQuerySchema,
  UnassignedRfidQuerySchema,
  RfidBody,
  LoadQuery,
  UnassignedRfidQuery,
  RfidType
} from '../schemas/rfid.schema.js';

export const rfidRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Helper logic for inserting RFID
  const handleInsertRfid = async (type: 'LF' | 'HF', body: RfidBody, reply: any) => {
    const rfidId = body[type] || body[type.toLowerCase() as 'lf' | 'hf'] || body.rfid;

    if (!rfidId) {
      return reply.status(400).send({
        message: `Missing ${type} RFID`,
        data: body
      });
    }

    try {
      const result = await prisma.rfid.upsert({
        where: { id: String(rfidId) },
        update: {
          type: type as RfidType,
          updatedAt: new Date(),
          deletedAt: null
        },
        create: {
          id: String(rfidId),
          type: type as RfidType
        }
      });

      console.log(`[POST /${type}] RFID saved:`, result);
      return reply.status(200).send({
        message: `${type} RFID saved successfully`,
        data: result
      });
    } catch (error: any) {
      console.error(`[POST /${type}] Error saving RFID:`, error.message);
      return reply.status(500).send({ message: 'Internal server error', error: error.message });
    }
  };

  // Helper logic for checking RFID
  const handleCheckRfid = async (type: 'LF' | 'HF', body: RfidBody, reply: any) => {
    const rfidId = body[type] || body[type.toLowerCase() as 'lf' | 'hf'] || body.rfid;

    if (!rfidId) {
      return reply.status(400).send({
        message: `Missing ${type} RFID`,
        checked_rfid: null
      });
    }

    try {
      const result = await prisma.rfid.findFirst({
        where: {
          id: String(rfidId),
          type: type as RfidType,
          deletedAt: null,
          OR: [
            { users: { some: {} } },
            { instruments: { some: {} } }
          ]
        },
        select: { id: true, type: true }
      });

      if (!result) {
        return reply.status(404).send({
          message: `${type} RFID not found`,
          checked_rfid: null
        });
      }

      return reply.status(200).send({
        message: `${type} RFID found`,
        checked_rfid: result.id,
        type: result.type
      });
    } catch (error: any) {
      console.error(`[POST /${type}/check] Error checking RFID:`, error.message);
      return reply.status(500).send({ message: 'Internal server error', checked_rfid: null });
    }
  };

  // Helper logic for loading RFID
  const handleLoadRfid = async (type: 'LF' | 'HF', timestamp: number, reply: any) => {
    if (!Number.isFinite(timestamp)) {
      return reply.status(400).send({
        message: 'timestamp must be a valid Unix timestamp',
        data: []
      });
    }

    try {
      const dateFilter = new Date(timestamp * 1000);
      const rows = await prisma.rfid.findMany({
        where: {
          type: type as RfidType,
          updatedAt: { gt: dateFilter },
          deletedAt: null,
          OR: [
            { users: { some: {} } },
            { instruments: { some: {} } }
          ]
        },
        orderBy: { updatedAt: 'asc' },
        select: { id: true, type: true, updatedAt: true }
      });

      console.log(`[GET /${type}/load] Loaded RFID records:`, rows);
      return reply.status(200).send({
        ids: rows.map((rfid: { id: string }) => rfid.id),
        data: rows
      });
    } catch (error: any) {
      console.error(`[GET /${type}/load] Error loading RFID:`, error.message);
      return reply.status(500).send({ message: 'Internal server error', data: [] });
    }
  };

  // Helper logic for loading deleted RFID
  const handleLoadDeletedRfid = async (type: 'LF' | 'HF', timestamp: number, reply: any) => {
    if (!Number.isFinite(timestamp)) {
      return reply.status(400).send({
        message: 'timestamp must be a valid Unix timestamp',
        data: []
      });
    }

    try {
      const dateFilter = new Date(timestamp * 1000);
      const rows = await prisma.rfid.findMany({
        where: {
          type: type as RfidType,
          deletedAt: {
            not: null,
            gt: dateFilter
          },
          OR: [
            { users: { some: {} } },
            { instruments: { some: {} } }
          ]
        },
        orderBy: { deletedAt: 'asc' },
        select: { id: true, type: true, deletedAt: true }
      });

      console.log(`[GET /${type}/load-deleted] Loaded deleted RFID records:`, rows);
      return reply.status(200).send({
        ids: rows.map((rfid: { id: string }) => rfid.id),
        data: rows
      });
    } catch (error: any) {
      console.error(`[GET /${type}/load-deleted] Error loading deleted RFID:`, error.message);
      return reply.status(500).send({ message: 'Internal server error', data: [] });
    }
  };

  // POST /LF
  fastify.post('/LF', {
    schema: {
      tags: ['RFID'],
      summary: 'Insert or update LF RFID',
      body: RfidBodySchema,
      response: {
        200: z.object({ message: z.string(), data: z.unknown() }),
        400: z.object({ message: z.string(), data: z.unknown() }),
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    const body = request.body as RfidBody;
    console.log('[POST /LF] Body received:', body);
    return handleInsertRfid('LF', body, reply);
  });

  // POST /HF
  fastify.post('/HF', {
    schema: {
      tags: ['RFID'],
      summary: 'Insert or update HF RFID',
      body: RfidBodySchema,
      response: {
        200: z.object({ message: z.string(), data: z.unknown() }),
        400: z.object({ message: z.string(), data: z.unknown() }),
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    const body = request.body as RfidBody;
    console.log('[POST /HF] Body received:', body);
    return handleInsertRfid('HF', body, reply);
  });

  // POST /LF/check
  fastify.post('/LF/check', {
    schema: {
      tags: ['RFID'],
      summary: 'Check LF RFID existence and association',
      body: RfidBodySchema,
      response: {
        200: z.object({ message: z.string(), checked_rfid: z.string().nullable(), type: z.string().optional() }),
        400: z.object({ message: z.string(), checked_rfid: z.null() }),
        404: z.object({ message: z.string(), checked_rfid: z.null() }),
        500: z.object({ message: z.string(), checked_rfid: z.null() })
      }
    }
  }, async (request, reply) => {
    const body = request.body as RfidBody;
    console.log('[POST /LF/check] Body received:', body);
    return handleCheckRfid('LF', body, reply);
  });

  // POST /HF/check
  fastify.post('/HF/check', {
    schema: {
      tags: ['RFID'],
      summary: 'Check HF RFID existence and association',
      body: RfidBodySchema,
      response: {
        200: z.object({ message: z.string(), checked_rfid: z.string().nullable(), type: z.string().optional() }),
        400: z.object({ message: z.string(), checked_rfid: z.null() }),
        404: z.object({ message: z.string(), checked_rfid: z.null() }),
        500: z.object({ message: z.string(), checked_rfid: z.null() })
      }
    }
  }, async (request, reply) => {
    const body = request.body as RfidBody;
    console.log('[POST /HF/check] Body received:', body);
    return handleCheckRfid('HF', body, reply);
  });

  // GET /LF/load
  fastify.get('/LF/load', {
    schema: {
      tags: ['RFID'],
      summary: 'Load LF RFID records updated after timestamp',
      querystring: LoadQuerySchema,
      response: {
        200: z.object({ ids: z.array(z.string()), data: z.array(z.unknown()) }),
        400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
        500: z.object({ message: z.string(), data: z.array(z.unknown()) })
      }
    }
  }, async (request, reply) => {
    const query = request.query as LoadQuery;
    console.log('[GET /LF/load] Loading data after timestamp: ' + query.timestamp);
    return handleLoadRfid('LF', query.timestamp, reply);
  });

  // GET /HF/load
  fastify.get('/HF/load', {
    schema: {
      tags: ['RFID'],
      summary: 'Load HF RFID records updated after timestamp',
      querystring: LoadQuerySchema,
      response: {
        200: z.object({ ids: z.array(z.string()), data: z.array(z.unknown()) }),
        400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
        500: z.object({ message: z.string(), data: z.array(z.unknown()) })
      }
    }
  }, async (request, reply) => {
    const query = request.query as LoadQuery;
    console.log('[GET /HF/load] Loading data after timestamp: ' + query.timestamp);
    return handleLoadRfid('HF', query.timestamp, reply);
  });

  // GET /LF/load-deleted
  fastify.get('/LF/load-deleted', {
    schema: {
      tags: ['RFID'],
      summary: 'Load deleted LF RFID records after timestamp',
      querystring: LoadQuerySchema,
      response: {
        200: z.object({ ids: z.array(z.string()), data: z.array(z.unknown()) }),
        400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
        500: z.object({ message: z.string(), data: z.array(z.unknown()) })
      }
    }
  }, async (request, reply) => {
    const query = request.query as LoadQuery;
    console.log('[GET /LF/load-deleted] Loading data after timestamp: ' + query.timestamp);
    return handleLoadDeletedRfid('LF', query.timestamp, reply);
  });

  // GET /HF/load-deleted
  fastify.get('/HF/load-deleted', {
    schema: {
      tags: ['RFID'],
      summary: 'Load deleted HF RFID records after timestamp',
      querystring: LoadQuerySchema,
      response: {
        200: z.object({ ids: z.array(z.string()), data: z.array(z.unknown()) }),
        400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
        500: z.object({ message: z.string(), data: z.array(z.unknown()) })
      }
    }
  }, async (request, reply) => {
    const query = request.query as LoadQuery;
    console.log('[GET /HF/load-deleted] Loading data after timestamp: ' + query.timestamp);
    return handleLoadDeletedRfid('HF', query.timestamp, reply);
  });

  // GET /rfid/unassigned - Get RFIDs not connected to any active user or instrument
  fastify.get('/rfid/unassigned', {
    schema: {
      tags: ['RFID'],
      summary: 'Get RFIDs not connected to any active user or instrument',
      querystring: UnassignedRfidQuerySchema,
      response: {
        200: z.object({
          message: z.string(),
          data: z.array(z.object({
            id: z.string(),
            type: z.enum(['LF', 'HF']),
            createdAt: z.date().or(z.string()),
            updatedAt: z.date().or(z.string())
          }))
        }),
        500: z.object({ message: z.string() })
      }
    }
  }, async (request, reply) => {
    try {
      const { type, currentRfid } = request.query as UnassignedRfidQuery;

      const where: any = {
        deletedAt: null,
        AND: [
          {
            // Not connected to any active user (unless it equals currentRfid)
            users: {
              none: {
                deletedAt: null,
                ...(currentRfid ? { rfid: { not: currentRfid } } : {})
              }
            }
          },
          {
            // Not connected to any active instrument (unless it equals currentRfid)
            instruments: {
              none: {
                deletedAt: null,
                ...(currentRfid ? { rfid: { not: currentRfid } } : {})
              }
            }
          }
        ]
      };

      if (type) {
        where.type = type;
      }

      const rfids = await prisma.rfid.findMany({
        where,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          type: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return reply.status(200).send({
        message: 'Unassigned RFIDs retrieved successfully',
        data: rfids
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  });
};
