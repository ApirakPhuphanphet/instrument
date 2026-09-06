import { prisma } from '../lib/prisma.js';
import { CreateUserInput, UpdateUserInput, UserQueryInput } from '../schemas/user.schema.js';

export class UserServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'UserServiceError';
    this.statusCode = statusCode;
  }
}

export class UserService {
  /**
   * Create a new user with optional RFID assignment.
   */
  async createUser(data: CreateUserInput) {
    const { name, rfid } = data;

    if (rfid) {
      const rfidRecord = await prisma.rfid.findUnique({
        where: { id: rfid }
      });

      if (!rfidRecord) {
        throw new UserServiceError(`RFID tag '${rfid}' does not exist. Please register the RFID tag first.`, 404);
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

    return prisma.user.create({
      data: {
        name,
        rfid: rfid || null
      },
      include: {
        rfidRef: true
      }
    });
  }

  /**
   * List users with search, filtering, and pagination.
   */
  async getUsers(query: UserQueryInput) {
    const { search, rfid, includeDeleted, page, limit } = query;

    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
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
        include: {
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
  async getUserById(id: string, includeDeleted = false) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
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
  async updateUser(id: string, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new UserServiceError(`User with ID '${id}' not found.`, 404);
    }

    if (user.deletedAt !== null) {
      throw new UserServiceError(`Cannot update deleted user '${id}'. Restore the user first.`, 400);
    }

    const { name, rfid } = data;

    if (rfid !== undefined && rfid !== null && rfid !== user.rfid) {
      const rfidRecord = await prisma.rfid.findUnique({
        where: { id: rfid }
      });

      if (!rfidRecord) {
        throw new UserServiceError(`RFID tag '${rfid}' does not exist. Please register the RFID tag first.`, 404);
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

    return prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(rfid !== undefined && { rfid }),
        updatedAt: new Date()
      },
      include: {
        rfidRef: true
      }
    });
  }

  /**
   * Delete a user (soft delete by default, or permanent delete).
   */
  async deleteUser(id: string, permanent = false) {
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
        deletedAt: new Date()
      },
      include: {
        rfidRef: true
      }
    });
  }

  /**
   * Restore a soft-deleted user.
   */
  async restoreUser(id: string) {
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
        throw new UserServiceError(
          `Cannot restore user: RFID '${user.rfid}' is currently assigned to user '${existingUserWithRfid.name}'.`,
          409
        );
      }
    }

    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date()
      },
      include: {
        rfidRef: true
      }
    });
  }
}

export const userService = new UserService();
