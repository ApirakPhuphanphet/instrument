import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Check server health',
      response: {
        200: z.object({
          message: z.string()
        })
      }
    }
  }, async (_request, reply) => {
    return reply.status(200).send({ message: 'Server is healthy' });
  });

  fastify.get('/time', {
    schema: {
      tags: ['Health'],
      summary: 'Get current server Unix timestamp',
      response: {
        200: z.string()
      }
    }
  }, async (_request, reply) => {
    const now = new Date();
    const unixTimestamp = Math.floor(now.getTime() / 1000);
    console.log('[GET/time] Current server time: ' + now);
    console.log('[GET/time] Current server time (Unix Timestamp): ' + unixTimestamp);
    return reply.status(200).send(`${unixTimestamp}`);
  });
};
