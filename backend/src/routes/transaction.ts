import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { TransactionType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { TransactionBodySchema, TransactionBody } from '../schemas/rfid.schema.js';

export const transactionRoutes: FastifyPluginAsyncZod = async (fastify) => {
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
        select: { id: true }
      });
      if (!instrument) {
        console.log(`[POST /${type}] Instrument RFID not found: ${hfuid}`);
        return reply.status(404).send({ message: 'Instrument RFID not found', data: body });
      }

      const transaction = await prisma.transaction.create({
        data: {
          user_id: user.id,
          instrument_id: instrument.id,
          type: type as TransactionType,
          timestamp: unixTime ? new Date(unixTime * 1000) : undefined
        }
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
