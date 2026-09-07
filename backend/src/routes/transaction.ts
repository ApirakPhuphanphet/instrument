import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  TransactionBodySchema,
  TransactionBody,
  TransactionType,
  TransactionQuerySchema,
  TransactionQueryInput,
  TransactionListResponseSchema
} from '../schemas/transaction.schema.js';

export const transactionRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/transactions', {
    schema: {
      tags: ['Transactions'],
      summary: 'List transactions with type filter and pagination',
      querystring: TransactionQuerySchema,
      response: {
        200: TransactionListResponseSchema,
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    const query = request.query as TransactionQueryInput;
    const { type, page, limit, search } = query;

    try {
      const where: any = {
        deletedAt: null
      };

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { instrument: { name: { contains: search, mode: 'insensitive' } } },
          { user: { rfid: { contains: search, mode: 'insensitive' } } },
          { instrument: { rfid: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [total, transactions] = await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, rfid: true }
            },
            instrument: {
              select: { id: true, name: true, status: true, rfid: true, image_url: true }
            }
          },
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        })
      ]);

      return reply.status(200).send({
        message: 'Transactions retrieved successfully',
        data: transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1
        }
      });
    } catch (error: any) {
      console.error('[GET /transactions] Error:', error.message);
      return reply.status(500).send({ message: 'Internal server error', error: error.message });
    }
  });

  const processTransaction = async (
    type: 'borrow' | 'return',
    body: TransactionBody,
    reply: any
  ) => {
    const { lfuid, hfuid, unixTime } = body;

    try {
      const user = await prisma.user.findFirst({
        where: { rfid: String(lfuid) },
        select: { id: true }
      });
      if (!user) {
        console.log(`[POST /${type}] User RFID not found: ${lfuid}`);
        return reply.status(404).send({ message: 'User RFID not found', data: body });
      }

      const instrument = await prisma.instrument.findFirst({
        where: { rfid: String(hfuid) },
        select: { id: true, status: true }
      });
      if (!instrument) {
        console.log(`[POST /${type}] Instrument RFID not found: ${hfuid}`);
        return reply.status(404).send({ message: 'Instrument RFID not found', data: body });
      }

      if (instrument.status != 'borrowed' && instrument.status != 'available') {
        console.log(`[POST /${type}] Instrument is not available for ${type}: ${hfuid}`);
        return reply.status(400).send({ message: `Instrument is not available for ${type}`, data: body });
      }

      const transaction = await prisma.transaction.create({
        data: {
          user_id: user.id,
          instrument_id: instrument.id,
          type: type as TransactionType,
          timestamp: unixTime ? new Date(unixTime * 1000) : undefined
        }
      });

      // set the instrument's status based on the transaction type
      const newStatus = type === 'borrow' ? 'borrowed' : 'available';
      await prisma.instrument.update({
        where: { id: instrument.id },
        data: { status: newStatus }
      });

      console.log(`[POST /${type}] Transaction recorded:`, transaction);
      return reply.status(200).send({
        message: `${type.charAt(0).toUpperCase()}${type.slice(1)} POST success`,
        data: transaction
      });
    } catch (error: any) {
      console.error(`[POST /${type}] Error processing request:`, error.message);
      return reply.status(500).send({ message: 'Internal server error', error: error.message });
    }
  };

  fastify.post('/borrow', {
    schema: {
      tags: ['Transactions'],
      summary: 'Borrow an instrument',
      body: TransactionBodySchema,
      response: {
        200: z.object({ message: z.string(), data: z.unknown() }),
        400: z.object({ message: z.string(), data: z.unknown() }),
        404: z.object({ message: z.string(), data: z.unknown() }),
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    const body = request.body as TransactionBody;
    console.log('[POST /borrow] Body received:', body);
    return processTransaction('borrow', body, reply);
  });

  fastify.post('/return', {
    schema: {
      tags: ['Transactions'],
      summary: 'Return an instrument',
      body: TransactionBodySchema,
      response: {
        200: z.object({ message: z.string(), data: z.unknown() }),
        400: z.object({ message: z.string(), data: z.unknown() }),
        404: z.object({ message: z.string(), data: z.unknown() }),
        500: z.object({ message: z.string(), error: z.string().optional() })
      }
    }
  }, async (request, reply) => {
    const body = request.body as TransactionBody;
    console.log('[POST /return] Body received:', body);
    return processTransaction('return', body, reply);
  });
};
