import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
const authPluginCallback = async (fastify) => {
    const jwtSecret = process.env.JWT_SECRET || 'eshub-instrument-tracking-secret-key-2026';
    await fastify.register(fastifyJwt, {
        secret: jwtSecret
    });
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            return reply.status(401).send({ message: 'Unauthorized: Invalid or expired token' });
        }
    });
    fastify.decorate('authorize', (roles) => {
        return async (request, reply) => {
            const user = request.user;
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
