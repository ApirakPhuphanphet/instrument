import { prisma } from '../lib/prisma.js';
export class InstrumentGroupServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'InstrumentGroupServiceError';
        this.statusCode = statusCode;
    }
}
export class InstrumentGroupService {
    /**
     * Helper to calculate status stats for a list of instruments.
     */
    calculateStats(instruments) {
        const activeInstruments = instruments.filter((i) => i.deletedAt === null && i.status !== 'retired');
        const retiredCount = instruments.filter((i) => i.deletedAt === null && i.status === 'retired').length;
        const stats = {
            total: activeInstruments.length,
            available: 0,
            borrowed: 0,
            maintenance: 0,
            retired: retiredCount,
            lost: 0
        };
        for (const inst of activeInstruments) {
            if (inst.status in stats) {
                stats[inst.status]++;
            }
        }
        return stats;
    }
    /**
     * Create a new instrument group.
     */
    async createGroup(data) {
        const { name, brand, model, description, image_url } = data;
        const group = await prisma.instrumentGroup.create({
            data: {
                name,
                brand: brand || null,
                model: model || null,
                description: description || null,
                image_url: image_url || null
            },
            include: {
                instruments: {
                    where: { deletedAt: null },
                    include: { rfidRef: true },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        return {
            ...group,
            stats: this.calculateStats(group.instruments),
            instruments: group.instruments.filter((u) => u.status !== 'retired')
        };
    }
    /**
     * List instrument groups with search, brand filtering, pagination, and calculated stats.
     */
    async getGroups(query) {
        const { search, brand, includeDeleted, includeUnits, page, limit } = query;
        const where = {};
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (brand) {
            where.brand = { contains: brand, mode: 'insensitive' };
        }
        const skip = (page - 1) * limit;
        const [total, groups] = await Promise.all([
            prisma.instrumentGroup.count({ where }),
            prisma.instrumentGroup.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    instruments: {
                        where: includeDeleted ? undefined : { deletedAt: null },
                        include: { rfidRef: true },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            })
        ]);
        const formattedGroups = groups.map((g) => {
            const stats = this.calculateStats(g.instruments);
            const activeUnits = g.instruments.filter((u) => u.status !== 'retired');
            return {
                ...g,
                stats,
                instruments: includeUnits ? activeUnits : undefined
            };
        });
        return {
            groups: formattedGroups,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get a single instrument group by ID with its instruments and stats.
     */
    async getGroupById(id, includeDeleted = false) {
        const group = await prisma.instrumentGroup.findUnique({
            where: { id },
            include: {
                instruments: {
                    where: includeDeleted ? undefined : { deletedAt: null },
                    include: { rfidRef: true },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!group) {
            throw new InstrumentGroupServiceError(`Instrument group '${id}' not found.`, 404);
        }
        if (!includeDeleted && group.deletedAt !== null) {
            throw new InstrumentGroupServiceError(`Instrument group '${id}' has been deleted.`, 404);
        }
        return {
            ...group,
            stats: this.calculateStats(group.instruments),
            instruments: group.instruments.filter((u) => u.status !== 'retired')
        };
    }
    /**
     * Update an instrument group.
     */
    async updateGroup(id, data) {
        const group = await prisma.instrumentGroup.findUnique({
            where: { id }
        });
        if (!group) {
            throw new InstrumentGroupServiceError(`Instrument group '${id}' not found.`, 404);
        }
        if (group.deletedAt !== null) {
            throw new InstrumentGroupServiceError(`Cannot update deleted group '${id}'. Restore the group first.`, 400);
        }
        const { name, brand, model, description, image_url } = data;
        const updated = await prisma.instrumentGroup.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(brand !== undefined && { brand }),
                ...(model !== undefined && { model }),
                ...(description !== undefined && { description }),
                ...(image_url !== undefined && { image_url }),
                updatedAt: new Date()
            },
            include: {
                instruments: {
                    where: { deletedAt: null },
                    include: { rfidRef: true },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        return {
            ...updated,
            stats: this.calculateStats(updated.instruments)
        };
    }
    /**
     * Delete an instrument group (soft delete or permanent).
     */
    async deleteGroup(id, permanent = false) {
        const group = await prisma.instrumentGroup.findUnique({
            where: { id }
        });
        if (!group) {
            throw new InstrumentGroupServiceError(`Instrument group '${id}' not found.`, 404);
        }
        if (permanent) {
            return prisma.instrumentGroup.delete({
                where: { id }
            });
        }
        if (group.deletedAt !== null) {
            throw new InstrumentGroupServiceError(`Instrument group '${id}' is already deleted.`, 400);
        }
        return prisma.instrumentGroup.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
        });
    }
    /**
     * Restore a soft-deleted instrument group.
     */
    async restoreGroup(id) {
        const group = await prisma.instrumentGroup.findUnique({
            where: { id }
        });
        if (!group) {
            throw new InstrumentGroupServiceError(`Instrument group '${id}' not found.`, 404);
        }
        if (group.deletedAt === null) {
            throw new InstrumentGroupServiceError(`Instrument group '${id}' is not deleted.`, 400);
        }
        return prisma.instrumentGroup.update({
            where: { id },
            data: {
                deletedAt: null,
                updatedAt: new Date()
            },
            include: {
                instruments: {
                    where: { deletedAt: null },
                    include: { rfidRef: true }
                }
            }
        });
    }
}
export const instrumentGroupService = new InstrumentGroupService();
