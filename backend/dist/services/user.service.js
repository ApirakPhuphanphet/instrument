import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';
export class UserServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'UserServiceError';
        this.statusCode = statusCode;
    }
}
const DEFAULT_USER_PASSWORD = 'User1234!';
export class UserService {
    /**
     * Create a new user with optional email/password credentials and RFID assignment.
     */
    async createUser(data) {
        const { name, email, password, role = 'USER', rfid } = data;
        // Check duplicate email if email provided
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: {
                    email: {
                        equals: email,
                        mode: 'insensitive'
                    },
                    deletedAt: null
                }
            });
            if (existingEmail) {
                throw new UserServiceError(`Email '${email}' is already in use.`, 409);
            }
        }
        // Determine password hash and mustChangePassword flag
        let passwordHash = null;
        let mustChangePassword = false;
        if (password) {
            passwordHash = await hashPassword(password);
            mustChangePassword = true; // User can change it later
        }
        else if (email) {
            // If email provided without password, provision with default password
            passwordHash = await hashPassword(DEFAULT_USER_PASSWORD);
            mustChangePassword = true;
        }
        if (rfid) {
            let rfidRecord = await prisma.rfid.findUnique({
                where: { id: rfid }
            });
            if (!rfidRecord) {
                rfidRecord = await prisma.rfid.create({
                    data: {
                        id: rfid,
                        type: 'LF'
                    }
                });
            }
            else if (rfidRecord.deletedAt !== null) {
                await prisma.rfid.update({
                    where: { id: rfid },
                    data: { deletedAt: null }
                });
            }
            const existingUserWithRfid = await prisma.user.findFirst({
                where: {
                    rfid,
                    deletedAt: null
                }
            });
            if (existingUserWithRfid) {
                throw new UserServiceError(`RFID tag '${rfid}' is already assigned to user '${existingUserWithRfid.name}'.`, 409);
            }
        }
        const user = await prisma.user.create({
            data: {
                name,
                email: email || null,
                passwordHash,
                role: role || 'USER',
                mustChangePassword,
                rfid: rfid || null
            },
            include: {
                rfidRef: true
            }
        });
        // Omit sensitive passwordHash from returned object
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    }
    /**
     * List users with search, filtering, role filtering, and pagination.
     */
    async getUsers(query) {
        const { search, role, rfid, includeDeleted, page, limit } = query;
        const where = {};
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role) {
            where.role = role;
        }
        if (rfid) {
            where.rfid = {
                contains: rfid,
                mode: 'insensitive'
            };
        }
        const skip = (page - 1) * limit;
        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    mustChangePassword: true,
                    rfid: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    rfidRef: true
                }
            })
        ]);
        return {
            users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get a single user by UUID.
     */
    async getUserById(id, includeDeleted = false) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                mustChangePassword: true,
                rfid: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                rfidRef: true
            }
        });
        if (!user) {
            throw new UserServiceError(`User with ID '${id}' not found.`, 404);
        }
        if (!includeDeleted && user.deletedAt !== null) {
            throw new UserServiceError(`User with ID '${id}' has been deleted.`, 404);
        }
        return user;
    }
    /**
     * Update an existing user.
     */
    async updateUser(id, data) {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            throw new UserServiceError(`User with ID '${id}' not found.`, 404);
        }
        if (user.deletedAt !== null) {
            throw new UserServiceError(`Cannot update deleted user '${id}'. Restore the user first.`, 400);
        }
        const { name, email, password, role, mustChangePassword, rfid } = data;
        // Check duplicate email if changed
        if (email && email !== user.email) {
            const existingEmail = await prisma.user.findFirst({
                where: {
                    email: {
                        equals: email,
                        mode: 'insensitive'
                    },
                    id: { not: id },
                    deletedAt: null
                }
            });
            if (existingEmail) {
                throw new UserServiceError(`Email '${email}' is already in use by another user.`, 409);
            }
        }
        let passwordHash = undefined;
        if (password) {
            passwordHash = await hashPassword(password);
        }
        if (rfid !== undefined && rfid !== null && rfid !== user.rfid) {
            let rfidRecord = await prisma.rfid.findUnique({
                where: { id: rfid }
            });
            if (!rfidRecord) {
                rfidRecord = await prisma.rfid.create({
                    data: {
                        id: rfid,
                        type: 'LF'
                    }
                });
            }
            else if (rfidRecord.deletedAt !== null) {
                await prisma.rfid.update({
                    where: { id: rfid },
                    data: { deletedAt: null }
                });
            }
            const existingUserWithRfid = await prisma.user.findFirst({
                where: {
                    rfid,
                    id: { not: id },
                    deletedAt: null
                }
            });
            if (existingUserWithRfid) {
                throw new UserServiceError(`RFID tag '${rfid}' is already assigned to user '${existingUserWithRfid.name}'.`, 409);
            }
        }
        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
                ...(passwordHash !== undefined && { passwordHash, mustChangePassword: true }),
                ...(role !== undefined && { role }),
                ...(mustChangePassword !== undefined && { mustChangePassword }),
                ...(rfid !== undefined && { rfid }),
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                mustChangePassword: true,
                rfid: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                rfidRef: true
            }
        });
        return updated;
    }
    /**
     * Delete a user (soft delete by default, or permanent delete).
     */
    async deleteUser(id, permanent = false) {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            throw new UserServiceError(`User with ID '${id}' not found.`, 404);
        }
        if (permanent) {
            return prisma.user.delete({
                where: { id }
            });
        }
        if (user.deletedAt !== null) {
            throw new UserServiceError(`User with ID '${id}' is already deleted.`, 400);
        }
        return prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                rfid: null // Unassign RFID upon soft deletion
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                mustChangePassword: true,
                rfid: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                rfidRef: true
            }
        });
    }
    /**
     * Restore a soft-deleted user.
     */
    async restoreUser(id) {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            throw new UserServiceError(`User with ID '${id}' not found.`, 404);
        }
        if (user.deletedAt === null) {
            throw new UserServiceError(`User with ID '${id}' is not deleted.`, 400);
        }
        if (user.rfid) {
            const existingUserWithRfid = await prisma.user.findFirst({
                where: {
                    rfid: user.rfid,
                    id: { not: id },
                    deletedAt: null
                }
            });
            if (existingUserWithRfid) {
                throw new UserServiceError(`Cannot restore user: RFID '${user.rfid}' is currently assigned to user '${existingUserWithRfid.name}'.`, 409);
            }
        }
        return prisma.user.update({
            where: { id },
            data: {
                deletedAt: null,
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                mustChangePassword: true,
                rfid: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                rfidRef: true
            }
        });
    }
}
export const userService = new UserService();
