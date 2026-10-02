import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export type UserRole = 'ADMIN' | 'USER';

export interface TokenPayload {
  id: string;
  email: string | null;
  name: string;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

const authPluginCallback: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const jwtSecret = process.env.JWT_SECRET || 'eshub-instrument-tracking-secret-key-2026';

  await fastify.register(fastifyJwt, {
    secret: jwtSecret
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err: any) {
      return reply.status(401).send({ message: 'Unauthorized: Invalid or expired token' });
    }
  });

  fastify.decorate('authorize', (roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload | undefined;
      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized: Authentication required' });
      }
      if (!roles.includes(user.role)) {
        return reply.status(403).send({
          message: `Forbidden: Requires one of [${roles.join(', ')}] role`
        });
      }
    };
  });
};

export const authPlugin = fp(authPluginCallback, {
  name: 'auth-plugin'
});
