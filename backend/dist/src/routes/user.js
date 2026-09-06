import { z } from 'zod';
import { userService, UserServiceError } from '../services/user.service.js';
import { CreateUserSchema, UpdateUserSchema, UserParamsSchema, UserQuerySchema, DeleteUserQuerySchema, UserResponseSchema } from '../schemas/user.schema.js';
export const userRoutes = async (fastify) => {
    // POST /users - Create a new user
    fastify.post('/users', {
        schema: {
            tags: ['Users'],
            summary: 'Create a new user',
            body: CreateUserSchema,
            response: {
                201: z.object({
                    message: z.string(),
                    data: UserResponseSchema
                }),
                400: z.object({ message: z.string() }),
                404: z.object({ message: z.string() }),
                409: z.object({ message: z.string() }),
                500: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        try {
            const user = await userService.createUser(request.body);
            return reply.status(201).send({
                message: 'User created successfully',
                data: user
            });
        }
        catch (error) {
            if (error instanceof UserServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
    // GET /users - List users with filters and pagination
    fastify.get('/users', {
        schema: {
            tags: ['Users'],
            summary: 'List users with search, filtering, and pagination',
            querystring: UserQuerySchema,
            response: {
                200: z.object({
                    message: z.string(),
                    data: z.array(UserResponseSchema),
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
            const result = await userService.getUsers(request.query);
            return reply.status(200).send({
                message: 'Users retrieved successfully',
                data: result.users,
                pagination: result.pagination
            });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
    // GET /users/:id - Get a user by ID
    fastify.get('/users/:id', {
        schema: {
            tags: ['Users'],
            summary: 'Get user by UUID',
            params: UserParamsSchema,
            response: {
                200: z.object({
                    message: z.string(),
                    data: UserResponseSchema
                }),
                404: z.object({ message: z.string() }),
                500: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = await userService.getUserById(id);
            return reply.status(200).send({
                message: 'User retrieved successfully',
                data: user
            });
        }
        catch (error) {
            if (error instanceof UserServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
    // PATCH /users/:id - Update user details
    fastify.patch('/users/:id', {
        schema: {
            tags: ['Users'],
            summary: 'Update user by UUID',
            params: UserParamsSchema,
            body: UpdateUserSchema,
            response: {
                200: z.object({
                    message: z.string(),
                    data: UserResponseSchema
                }),
                400: z.object({ message: z.string() }),
                404: z.object({ message: z.string() }),
                409: z.object({ message: z.string() }),
                500: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = await userService.updateUser(id, request.body);
            return reply.status(200).send({
                message: 'User updated successfully',
                data: user
            });
        }
        catch (error) {
            if (error instanceof UserServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
    // DELETE /users/:id - Soft-delete or permanently delete a user
    fastify.delete('/users/:id', {
        schema: {
            tags: ['Users'],
            summary: 'Delete user by UUID (soft delete by default)',
            params: UserParamsSchema,
            querystring: DeleteUserQuerySchema,
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
            const { id } = request.params;
            const { permanent } = request.query;
            const deletedUser = await userService.deleteUser(id, permanent);
            return reply.status(200).send({
                message: permanent ? 'User permanently deleted' : 'User soft-deleted successfully',
                data: deletedUser
            });
        }
        catch (error) {
            if (error instanceof UserServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
    // POST /users/:id/restore - Restore a soft-deleted user
    fastify.post('/users/:id/restore', {
        schema: {
            tags: ['Users'],
            summary: 'Restore a soft-deleted user',
            params: UserParamsSchema,
            response: {
                200: z.object({
                    message: z.string(),
                    data: UserResponseSchema
                }),
                400: z.object({ message: z.string() }),
                404: z.object({ message: z.string() }),
                409: z.object({ message: z.string() }),
                500: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const restoredUser = await userService.restoreUser(id);
            return reply.status(200).send({
                message: 'User restored successfully',
                data: restoredUser
            });
        }
        catch (error) {
            if (error instanceof UserServiceError) {
                return reply.status(error.statusCode).send({ message: error.message });
            }
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
};
