import { authService, AuthServiceError } from '../services/auth.service.js';
import { LoginBodySchema, ChangePasswordBodySchema, LoginResponseSchema, MeResponseSchema, GenericMessageResponseSchema } from '../schemas/auth.schema.js';
export const authRoutes = async (fastify) => {
    // POST /auth/login - Authenticate with email & password
    fastify.post('/auth/login', {
        schema: {
            tags: ['Authentication'],
            summary: 'Authenticate with email and password to receive a JWT token',
            body: LoginBodySchema,
            response: {
                200: LoginResponseSchema,
                400: GenericMessageResponseSchema,
                401: GenericMessageResponseSchema,
                500: GenericMessageResponseSchema
            }
        }
    }, async (request, reply) => {
        try {
            const user = await authService.login(request.body);
            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }, {
                expiresIn: '7d'
            });
            return reply.status(200).send({
                message: 'Login successful',
                token,
                user
            });
        }
        catch (error) {
            if (error instanceof AuthServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error during login' });
        }
    });
    // GET /auth/me - Retrieve current authenticated user profile
    fastify.get('/auth/me', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Authentication'],
            summary: 'Get details of the currently authenticated user',
            security: [{ bearerAuth: [] }],
            response: {
                200: MeResponseSchema,
                401: GenericMessageResponseSchema,
                404: GenericMessageResponseSchema,
                500: GenericMessageResponseSchema
            }
        }
    }, async (request, reply) => {
        try {
            const currentUser = request.user;
            const user = await authService.getCurrentUser(currentUser.id);
            return reply.status(200).send({
                message: 'Current user retrieved successfully',
                data: user
            });
        }
        catch (error) {
            if (error instanceof AuthServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
    // POST /auth/change-password - Change current user's password
    fastify.post('/auth/change-password', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Authentication'],
            summary: 'Change password for currently authenticated user',
            security: [{ bearerAuth: [] }],
            body: ChangePasswordBodySchema,
            response: {
                200: GenericMessageResponseSchema,
                400: GenericMessageResponseSchema,
                401: GenericMessageResponseSchema,
                404: GenericMessageResponseSchema,
                500: GenericMessageResponseSchema
            }
        }
    }, async (request, reply) => {
        try {
            const currentUser = request.user;
            await authService.changePassword(currentUser.id, request.body);
            return reply.status(200).send({
                message: 'Password changed successfully'
            });
        }
        catch (error) {
            if (error instanceof AuthServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
    // POST /auth/logout - Sign out current session
    fastify.post('/auth/logout', {
        schema: {
            tags: ['Authentication'],
            summary: 'Sign out and invalidate current session client-side',
            response: {
                200: GenericMessageResponseSchema
            }
        }
    }, async (_request, reply) => {
        return reply.status(200).send({ message: 'Logged out successfully' });
    });
};
