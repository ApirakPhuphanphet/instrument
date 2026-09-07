import { prisma } from '../lib/prisma.js';
export class InstrumentServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'InstrumentServiceError';
        this.statusCode = statusCode;
    }
}
export class InstrumentService {
    /**
     * Create a new instrument with optional RFID assignment.
     */
    async createInstrument(data) {
        const { name, status, rfid, image_url } = data;
        if (rfid) {
            const rfidRecord = await prisma.rfid.findUnique({
                where: { id: rfid }
            });
            if (!rfidRecord) {
                throw new InstrumentServiceError(`RFID tag '${rfid}' does not exist. Please register the RFID tag first.`, 404);
            }
            const existingInstrumentWithRfid = await prisma.instrument.findFirst({
                where: {
                    rfid,
                    deletedAt: null
                }
            });
            if (existingInstrumentWithRfid) {
                throw new InstrumentServiceError(`RFID tag '${rfid}' is already assigned to instrument '${existingInstrumentWithRfid.name}'.`, 409);
            }
        }
        return prisma.instrument.create({
            data: {
                name,
                status: status || 'available',
                rfid: rfid || null,
                image_url: image_url || null
            },
            include: {
                rfidRef: true
            }
        });
    }
    /**
     * List instruments with search, status filtering, and pagination.
     */
    async getInstruments(query) {
        const { search, status, excludeStatus, rfid, includeDeleted, page, limit } = query;
        const where = {};
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive'
            };
        }
        if (status) {
            where.status = status;
        }
        else if (excludeStatus) {
            where.status = { not: excludeStatus };
        }
        if (rfid) {
            where.rfid = {
                contains: rfid,
                mode: 'insensitive'
            };
        }
        const skip = (page - 1) * limit;
        const [total, instruments] = await Promise.all([
            prisma.instrument.count({ where }),
            prisma.instrument.findMany({
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
            instruments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get a single instrument by UUID.
     */
    async getInstrumentById(id, includeDeleted = false) {
        const instrument = await prisma.instrument.findUnique({
            where: { id },
            include: {
                rfidRef: true
            }
        });
        if (!instrument) {
            throw new InstrumentServiceError(`Instrument with ID '${id}' not found.`, 404);
        }
        if (!includeDeleted && instrument.deletedAt !== null) {
            throw new InstrumentServiceError(`Instrument with ID '${id}' has been deleted.`, 404);
        }
        return instrument;
    }
    /**
     * Update an existing instrument.
     */
    async updateInstrument(id, data) {
        const instrument = await prisma.instrument.findUnique({
            where: { id }
        });
        if (!instrument) {
            throw new InstrumentServiceError(`Instrument with ID '${id}' not found.`, 404);
        }
        if (instrument.deletedAt !== null) {
            throw new InstrumentServiceError(`Cannot update deleted instrument '${id}'. Restore the instrument first.`, 400);
        }
        const { name, status, rfid, image_url } = data;
        if (rfid !== undefined && rfid !== null && rfid !== instrument.rfid) {
            const rfidRecord = await prisma.rfid.findUnique({
                where: { id: rfid }
            });
            if (!rfidRecord) {
                throw new InstrumentServiceError(`RFID tag '${rfid}' does not exist. Please register the RFID tag first.`, 404);
            }
            const existingInstrumentWithRfid = await prisma.instrument.findFirst({
                where: {
                    rfid,
                    id: { not: id },
                    deletedAt: null
                }
            });
            if (existingInstrumentWithRfid) {
                throw new InstrumentServiceError(`RFID tag '${rfid}' is already assigned to instrument '${existingInstrumentWithRfid.name}'.`, 409);
            }
        }
        return prisma.instrument.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(status !== undefined && { status }),
                ...(rfid !== undefined && { rfid }),
                ...(image_url !== undefined && { image_url }),
                updatedAt: new Date()
            },
            include: {
                rfidRef: true
            }
        });
    }
    /**
     * Delete an instrument (soft delete by default, or permanent delete).
     */
    async deleteInstrument(id, permanent = false) {
        const instrument = await prisma.instrument.findUnique({
            where: { id }
        });
        if (!instrument) {
            throw new InstrumentServiceError(`Instrument with ID '${id}' not found.`, 404);
        }
        if (permanent) {
            return prisma.instrument.delete({
                where: { id }
            });
        }
        if (instrument.deletedAt !== null) {
            throw new InstrumentServiceError(`Instrument with ID '${id}' is already deleted.`, 400);
        }
        return prisma.instrument.update({
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
     * Restore a soft-deleted instrument.
     */
    async restoreInstrument(id) {
        const instrument = await prisma.instrument.findUnique({
            where: { id }
        });
        if (!instrument) {
            throw new InstrumentServiceError(`Instrument with ID '${id}' not found.`, 404);
        }
        if (instrument.deletedAt === null) {
            throw new InstrumentServiceError(`Instrument with ID '${id}' is not deleted.`, 400);
        }
        if (instrument.rfid) {
            const existingInstrumentWithRfid = await prisma.instrument.findFirst({
                where: {
                    rfid: instrument.rfid,
                    id: { not: id },
                    deletedAt: null
                }
            });
            if (existingInstrumentWithRfid) {
                throw new InstrumentServiceError(`Cannot restore instrument: RFID '${instrument.rfid}' is currently assigned to instrument '${existingInstrumentWithRfid.name}'.`, 409);
            }
        }
        return prisma.instrument.update({
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
export const instrumentService = new InstrumentService();
