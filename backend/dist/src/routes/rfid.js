import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { RfidBodySchema, LoadQuerySchema, UnassignedRfidQuerySchema, CheckRfidBodySchema, CheckRfidQuerySchema, StaffCheckResponseSchema, InstrumentCheckResponseSchema, LoadResponseSchema } from '../schemas/rfid.schema.js';
export const rfidRoutes = async (fastify) => {
    // Helper logic for inserting RFID
    const handleInsertRfid = async (type, body, reply) => {
        const rfidId = body[type] || body[type.toLowerCase()] || body.rfid;
        if (!rfidId) {
            return reply.status(400).send({
                message: `Missing ${type} RFID`,
                data: body
            });
        }
        try {
            const result = await prisma.rfid.upsert({
                where: { id: String(rfidId) },
                update: {
                    type: type,
                    updatedAt: new Date(),
                    deletedAt: null
                },
                create: {
                    id: String(rfidId),
                    type: type
                }
            });
            console.log(`[POST /${type}] RFID saved:`, result);
            return reply.status(200).send({
                message: `${type} RFID saved successfully`,
                data: result
            });
        }
        catch (error) {
            console.error(`[POST /${type}] Error saving RFID:`, error.message);
            return reply.status(500).send({ message: 'Internal server error', error: error.message });
        }
    };
    // Helper logic for checking staff (User) by RFID tag (LF or HF)
    const handleCheckStaff = async (rfidId, reply, routeName) => {
        if (!rfidId) {
            return reply.status(400).send({
                message: 'Missing RFID',
                checked_rfid: null
            });
        }
        try {
            const user = await prisma.user.findFirst({
                where: {
                    rfid: String(rfidId),
                    deletedAt: null
                },
                include: {
                    rfidRef: true
                }
            });
            if (!user) {
                return reply.status(404).send({
                    message: 'Staff not found',
                    checked_rfid: null
                });
            }
            return reply.status(200).send({
                message: 'Staff found',
                checked_rfid: user.rfid,
                type: user.rfidRef?.type || null,
                staff: {
                    id: user.id,
                    name: user.name,
                    rfid: user.rfid
                }
            });
        }
        catch (error) {
            console.error(`[${routeName}] Error checking staff RFID:`, error.message);
            return reply.status(500).send({ message: 'Internal server error', checked_rfid: null });
        }
    };
    // Helper logic for checking instrument by RFID tag (HF or LF)
    const handleCheckInstrument = async (rfidId, reply, routeName) => {
        if (!rfidId) {
            return reply.status(400).send({
                message: 'Missing RFID',
                checked_rfid: null
            });
        }
        try {
            const instrument = await prisma.instrument.findFirst({
                where: {
                    rfid: String(rfidId),
                    deletedAt: null
                },
                include: {
                    rfidRef: true,
                    group: {
                        select: {
                            id: true,
                            name: true,
                            brand: true,
                            model: true
                        }
                    }
                }
            });
            if (!instrument) {
                return reply.status(404).send({
                    message: 'Instrument not found',
                    checked_rfid: null
                });
            }
            const is_maintenance_overdue = Boolean(instrument.next_maintain_date &&
                new Date(instrument.next_maintain_date) < new Date() &&
                instrument.status !== 'maintenance' &&
                instrument.status !== 'retired' &&
                !instrument.deletedAt);
            return reply.status(200).send({
                message: 'Instrument found',
                checked_rfid: instrument.rfid,
                type: instrument.rfidRef?.type || null,
                instrument: {
                    id: instrument.id,
                    name: instrument.name,
                    status: instrument.status,
                    rfid: instrument.rfid,
                    barcode: instrument.barcode,
                    group_id: instrument.group_id,
                    next_maintain_date: instrument.next_maintain_date,
                    is_maintenance_overdue,
                    group: instrument.group || null
                }
            });
        }
        catch (error) {
            console.error(`[${routeName}] Error checking instrument RFID:`, error.message);
            return reply.status(500).send({ message: 'Internal server error', checked_rfid: null });
        }
    };
    // Helper logic for loading staff RFID records (LF or HF)
    const handleLoadStaff = async (timestamp, reply, routeName = 'GET /staff/load') => {
        if (!Number.isFinite(timestamp)) {
            return reply.status(400).send({
                message: 'timestamp must be a valid Unix timestamp',
                data: []
            });
        }
        try {
            const dateFilter = new Date(timestamp * 1000);
            const rows = await prisma.rfid.findMany({
                where: {
                    deletedAt: null,
                    users: {
                        some: {
                            deletedAt: null
                        }
                    },
                    OR: [
                        { updatedAt: { gt: dateFilter } },
                        { users: { some: { deletedAt: null, updatedAt: { gt: dateFilter } } } }
                    ]
                },
                orderBy: { updatedAt: 'asc' },
                select: {
                    id: true,
                    type: true,
                    updatedAt: true,
                    users: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            console.log(`[${routeName}] Loaded staff RFID records:`, rows);
            return reply.status(200).send({
                ids: rows.map((rfid) => rfid.id),
                data: rows
            });
        }
        catch (error) {
            console.error(`[${routeName}] Error loading staff RFID:`, error.message);
            return reply.status(500).send({ message: 'Internal server error', data: [] });
        }
    };
    // Helper logic for loading instrument RFID records (HF or LF)
    const handleLoadInstrument = async (timestamp, reply, routeName = 'GET /instrument/load') => {
        if (!Number.isFinite(timestamp)) {
            return reply.status(400).send({
                message: 'timestamp must be a valid Unix timestamp',
                data: []
            });
        }
        try {
            const dateFilter = new Date(timestamp * 1000);
            const rows = await prisma.rfid.findMany({
                where: {
                    deletedAt: null,
                    instruments: {
                        some: {
                            deletedAt: null
                        }
                    },
                    OR: [
                        { updatedAt: { gt: dateFilter } },
                        { instruments: { some: { deletedAt: null, updatedAt: { gt: dateFilter } } } }
                    ]
                },
                orderBy: { updatedAt: 'asc' },
                select: {
                    id: true,
                    type: true,
                    updatedAt: true,
                    instruments: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            name: true,
                            status: true
                        }
                    }
                }
            });
            console.log(`[${routeName}] Loaded instrument RFID records:`, rows);
            return reply.status(200).send({
                ids: rows.map((rfid) => rfid.id),
                data: rows
            });
        }
        catch (error) {
            console.error(`[${routeName}] Error loading instrument RFID:`, error.message);
            return reply.status(500).send({ message: 'Internal server error', data: [] });
        }
    };
    // Helper logic for loading deleted staff RFID records
    const handleLoadDeletedStaff = async (timestamp, reply, routeName = 'GET /staff/load-deleted') => {
        if (!Number.isFinite(timestamp)) {
            return reply.status(400).send({
                message: 'timestamp must be a valid Unix timestamp',
                data: []
            });
        }
        try {
            const dateFilter = new Date(timestamp * 1000);
            const [deletedRfids, deletedUsers] = await Promise.all([
                prisma.rfid.findMany({
                    where: {
                        deletedAt: { not: null, gt: dateFilter },
                        users: { some: {} }
                    },
                    orderBy: { deletedAt: 'asc' },
                    select: { id: true, type: true, deletedAt: true }
                }),
                prisma.user.findMany({
                    where: {
                        deletedAt: { not: null, gt: dateFilter },
                        rfid: { not: null }
                    },
                    orderBy: { deletedAt: 'asc' },
                    select: { rfid: true, deletedAt: true }
                })
            ]);
            const uidMap = new Map();
            for (const r of deletedRfids) {
                uidMap.set(r.id, { id: r.id, deletedAt: r.deletedAt, type: r.type });
            }
            for (const u of deletedUsers) {
                if (u.rfid && !uidMap.has(u.rfid)) {
                    uidMap.set(u.rfid, { id: u.rfid, deletedAt: u.deletedAt });
                }
            }
            const rows = Array.from(uidMap.values());
            console.log(`[${routeName}] Loaded deleted staff RFID records:`, rows);
            return reply.status(200).send({
                ids: rows.map((r) => r.id),
                data: rows
            });
        }
        catch (error) {
            console.error(`[${routeName}] Error loading deleted staff RFID:`, error.message);
            return reply.status(500).send({ message: 'Internal server error', data: [] });
        }
    };
    // Helper logic for loading deleted instrument RFID records
    const handleLoadDeletedInstrument = async (timestamp, reply, routeName = 'GET /instrument/load-deleted') => {
        if (!Number.isFinite(timestamp)) {
            return reply.status(400).send({
                message: 'timestamp must be a valid Unix timestamp',
                data: []
            });
        }
        try {
            const dateFilter = new Date(timestamp * 1000);
            const [deletedRfids, deletedInstruments] = await Promise.all([
                prisma.rfid.findMany({
                    where: {
                        deletedAt: { not: null, gt: dateFilter },
                        instruments: { some: {} }
                    },
                    orderBy: { deletedAt: 'asc' },
                    select: { id: true, type: true, deletedAt: true }
                }),
                prisma.instrument.findMany({
                    where: {
                        deletedAt: { not: null, gt: dateFilter },
                        rfid: { not: null }
                    },
                    orderBy: { deletedAt: 'asc' },
                    select: { rfid: true, deletedAt: true }
                })
            ]);
            const uidMap = new Map();
            for (const r of deletedRfids) {
                uidMap.set(r.id, { id: r.id, deletedAt: r.deletedAt, type: r.type });
            }
            for (const inst of deletedInstruments) {
                if (inst.rfid && !uidMap.has(inst.rfid)) {
                    uidMap.set(inst.rfid, { id: inst.rfid, deletedAt: inst.deletedAt });
                }
            }
            const rows = Array.from(uidMap.values());
            console.log(`[${routeName}] Loaded deleted instrument RFID records:`, rows);
            return reply.status(200).send({
                ids: rows.map((r) => r.id),
                data: rows
            });
        }
        catch (error) {
            console.error(`[${routeName}] Error loading deleted instrument RFID:`, error.message);
            return reply.status(500).send({ message: 'Internal server error', data: [] });
        }
    };
    // POST /LF
    fastify.post('/LF', {
        schema: {
            tags: ['RFID'],
            summary: 'Insert or update LF RFID',
            body: RfidBodySchema,
            response: {
                200: z.object({ message: z.string(), data: z.unknown() }),
                400: z.object({ message: z.string(), data: z.unknown() }),
                500: z.object({ message: z.string(), error: z.string().optional() })
            }
        }
    }, async (request, reply) => {
        const body = request.body;
        console.log('[POST /LF] Body received:', body);
        return handleInsertRfid('LF', body, reply);
    });
    // POST /HF
    fastify.post('/HF', {
        schema: {
            tags: ['RFID'],
            summary: 'Insert or update HF RFID',
            body: RfidBodySchema,
            response: {
                200: z.object({ message: z.string(), data: z.unknown() }),
                400: z.object({ message: z.string(), data: z.unknown() }),
                500: z.object({ message: z.string(), error: z.string().optional() })
            }
        }
    }, async (request, reply) => {
        const body = request.body;
        console.log('[POST /HF] Body received:', body);
        return handleInsertRfid('HF', body, reply);
    });
    // POST /staff/check - Check staff (User) by RFID tag (LF or HF)
    fastify.post('/staff/check', {
        schema: {
            tags: ['Staff', 'RFID'],
            summary: 'Check staff existence and details by RFID tag (LF or HF)',
            body: CheckRfidBodySchema,
            response: {
                200: StaffCheckResponseSchema,
                400: z.object({ message: z.string(), checked_rfid: z.null() }),
                404: z.object({ message: z.string(), checked_rfid: z.null() }),
                500: z.object({ message: z.string(), checked_rfid: z.null() })
            }
        }
    }, async (request, reply) => {
        const body = (request.body || {});
        const rfidId = body.staff || body.rfid || body.LF || body.lf || body.HF || body.hf || body.id;
        console.log('[POST /staff/check] Body received:', body);
        return handleCheckStaff(rfidId, reply, 'POST /staff/check');
    });
    // GET /staff/check - Check staff (User) by RFID tag query parameter
    fastify.get('/staff/check', {
        schema: {
            tags: ['Staff', 'RFID'],
            summary: 'Check staff existence and details by RFID tag query parameter',
            querystring: CheckRfidQuerySchema,
            response: {
                200: StaffCheckResponseSchema,
                400: z.object({ message: z.string(), checked_rfid: z.null() }),
                404: z.object({ message: z.string(), checked_rfid: z.null() }),
                500: z.object({ message: z.string(), checked_rfid: z.null() })
            }
        }
    }, async (request, reply) => {
        const query = (request.query || {});
        const rfidId = query.staff || query.rfid || query.LF || query.lf || query.HF || query.hf || query.id;
        console.log('[GET /staff/check] Query received:', query);
        return handleCheckStaff(rfidId, reply, 'GET /staff/check');
    });
    // POST /instrument/check - Check instrument by RFID tag (HF or LF)
    fastify.post('/instrument/check', {
        schema: {
            tags: ['Instruments', 'RFID'],
            summary: 'Check instrument existence and details by RFID tag (HF or LF)',
            body: CheckRfidBodySchema,
            response: {
                200: InstrumentCheckResponseSchema,
                400: z.object({ message: z.string(), checked_rfid: z.null() }),
                404: z.object({ message: z.string(), checked_rfid: z.null() }),
                500: z.object({ message: z.string(), checked_rfid: z.null() })
            }
        }
    }, async (request, reply) => {
        const body = (request.body || {});
        const rfidId = body.instrument || body.rfid || body.HF || body.hf || body.LF || body.lf || body.id;
        console.log('[POST /instrument/check] Body received:', body);
        return handleCheckInstrument(rfidId, reply, 'POST /instrument/check');
    });
    // GET /instrument/check - Check instrument by RFID tag query parameter
    fastify.get('/instrument/check', {
        schema: {
            tags: ['Instruments', 'RFID'],
            summary: 'Check instrument existence and details by RFID tag query parameter',
            querystring: CheckRfidQuerySchema,
            response: {
                200: InstrumentCheckResponseSchema,
                400: z.object({ message: z.string(), checked_rfid: z.null() }),
                404: z.object({ message: z.string(), checked_rfid: z.null() }),
                500: z.object({ message: z.string(), checked_rfid: z.null() })
            }
        }
    }, async (request, reply) => {
        const query = (request.query || {});
        const rfidId = query.instrument || query.rfid || query.HF || query.hf || query.LF || query.lf || query.id;
        console.log('[GET /instrument/check] Query received:', query);
        return handleCheckInstrument(rfidId, reply, 'GET /instrument/check');
    });
    // POST /LF/check - Legacy alias for checking staff (checks staff without fixing LF/HF)
    fastify.post('/LF/check', {
        schema: {
            tags: ['RFID'],
            summary: 'Check staff by RFID tag (Legacy alias for /staff/check)',
            body: RfidBodySchema,
            response: {
                200: z.object({
                    message: z.string(),
                    checked_rfid: z.string().nullable(),
                    type: z.string().nullable().optional(),
                    staff: z.unknown().optional()
                }),
                400: z.object({ message: z.string(), checked_rfid: z.null() }),
                404: z.object({ message: z.string(), checked_rfid: z.null() }),
                500: z.object({ message: z.string(), checked_rfid: z.null() })
            }
        }
    }, async (request, reply) => {
        const body = (request.body || {});
        const rfidId = body.LF || body.lf || body.staff || body.rfid || body.HF || body.hf || body.id;
        console.log('[POST /LF/check] Legacy body received:', body);
        return handleCheckStaff(rfidId, reply, 'POST /LF/check');
    });
    // POST /HF/check - Legacy alias for checking instrument (checks instrument without fixing LF/HF)
    fastify.post('/HF/check', {
        schema: {
            tags: ['RFID'],
            summary: 'Check instrument by RFID tag (Legacy alias for /instrument/check)',
            body: RfidBodySchema,
            response: {
                200: z.object({
                    message: z.string(),
                    checked_rfid: z.string().nullable(),
                    type: z.string().nullable().optional(),
                    instrument: z.unknown().optional()
                }),
                400: z.object({ message: z.string(), checked_rfid: z.null() }),
                404: z.object({ message: z.string(), checked_rfid: z.null() }),
                500: z.object({ message: z.string(), checked_rfid: z.null() })
            }
        }
    }, async (request, reply) => {
        const body = (request.body || {});
        const rfidId = body.HF || body.hf || body.instrument || body.rfid || body.LF || body.lf || body.id;
        console.log('[POST /HF/check] Legacy body received:', body);
        return handleCheckInstrument(rfidId, reply, 'POST /HF/check');
    });
    // GET /staff/load - Load staff RFID records updated after timestamp (LF or HF)
    fastify.get('/staff/load', {
        schema: {
            tags: ['Staff', 'RFID'],
            summary: 'Load staff RFID records updated after timestamp (LF or HF)',
            querystring: LoadQuerySchema,
            response: {
                200: LoadResponseSchema,
                400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
                500: z.object({ message: z.string(), data: z.array(z.unknown()) })
            }
        }
    }, async (request, reply) => {
        const query = request.query;
        console.log('[GET /staff/load] Loading data after timestamp: ' + query.timestamp);
        return handleLoadStaff(query.timestamp, reply, 'GET /staff/load');
    });
    // GET /staff/load-deleted - Load deleted staff RFID records after timestamp (LF or HF)
    fastify.get('/staff/load-deleted', {
        schema: {
            tags: ['Staff', 'RFID'],
            summary: 'Load deleted staff RFID records after timestamp (LF or HF)',
            querystring: LoadQuerySchema,
            response: {
                200: LoadResponseSchema,
                400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
                500: z.object({ message: z.string(), data: z.array(z.unknown()) })
            }
        }
    }, async (request, reply) => {
        const query = request.query;
        console.log('[GET /staff/load-deleted] Loading data after timestamp: ' + query.timestamp);
        return handleLoadDeletedStaff(query.timestamp, reply, 'GET /staff/load-deleted');
    });
    // GET /instrument/load - Load instrument RFID records updated after timestamp (HF or LF)
    fastify.get('/instrument/load', {
        schema: {
            tags: ['Instruments', 'RFID'],
            summary: 'Load instrument RFID records updated after timestamp (HF or LF)',
            querystring: LoadQuerySchema,
            response: {
                200: LoadResponseSchema,
                400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
                500: z.object({ message: z.string(), data: z.array(z.unknown()) })
            }
        }
    }, async (request, reply) => {
        const query = request.query;
        console.log('[GET /instrument/load] Loading data after timestamp: ' + query.timestamp);
        return handleLoadInstrument(query.timestamp, reply, 'GET /instrument/load');
    });
    // GET /instrument/load-deleted - Load deleted instrument RFID records after timestamp (HF or LF)
    fastify.get('/instrument/load-deleted', {
        schema: {
            tags: ['Instruments', 'RFID'],
            summary: 'Load deleted instrument RFID records after timestamp (HF or LF)',
            querystring: LoadQuerySchema,
            response: {
                200: LoadResponseSchema,
                400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
                500: z.object({ message: z.string(), data: z.array(z.unknown()) })
            }
        }
    }, async (request, reply) => {
        const query = request.query;
        console.log('[GET /instrument/load-deleted] Loading data after timestamp: ' + query.timestamp);
        return handleLoadDeletedInstrument(query.timestamp, reply, 'GET /instrument/load-deleted');
    });
    // GET /LF/load - Legacy alias for /staff/load
    fastify.get('/LF/load', {
        schema: {
            tags: ['RFID'],
            summary: 'Load staff RFID records updated after timestamp (Legacy alias for /staff/load)',
            querystring: LoadQuerySchema,
            response: {
                200: LoadResponseSchema,
                400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
                500: z.object({ message: z.string(), data: z.array(z.unknown()) })
            }
        }
    }, async (request, reply) => {
        const query = request.query;
        console.log('[GET /LF/load] Loading data after timestamp: ' + query.timestamp);
        return handleLoadStaff(query.timestamp, reply, 'GET /LF/load');
    });
    // GET /HF/load - Legacy alias for /instrument/load
    fastify.get('/HF/load', {
        schema: {
            tags: ['RFID'],
            summary: 'Load instrument RFID records updated after timestamp (Legacy alias for /instrument/load)',
            querystring: LoadQuerySchema,
            response: {
                200: LoadResponseSchema,
                400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
                500: z.object({ message: z.string(), data: z.array(z.unknown()) })
            }
        }
    }, async (request, reply) => {
        const query = request.query;
        console.log('[GET /HF/load] Loading data after timestamp: ' + query.timestamp);
        return handleLoadInstrument(query.timestamp, reply, 'GET /HF/load');
    });
    // GET /LF/load-deleted - Legacy alias for /staff/load-deleted
    fastify.get('/LF/load-deleted', {
        schema: {
            tags: ['RFID'],
            summary: 'Load deleted staff RFID records after timestamp (Legacy alias for /staff/load-deleted)',
            querystring: LoadQuerySchema,
            response: {
                200: LoadResponseSchema,
                400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
                500: z.object({ message: z.string(), data: z.array(z.unknown()) })
            }
        }
    }, async (request, reply) => {
        const query = request.query;
        console.log('[GET /LF/load-deleted] Loading data after timestamp: ' + query.timestamp);
        return handleLoadDeletedStaff(query.timestamp, reply, 'GET /LF/load-deleted');
    });
    // GET /HF/load-deleted - Legacy alias for /instrument/load-deleted
    fastify.get('/HF/load-deleted', {
        schema: {
            tags: ['RFID'],
            summary: 'Load deleted instrument RFID records after timestamp (Legacy alias for /instrument/load-deleted)',
            querystring: LoadQuerySchema,
            response: {
                200: LoadResponseSchema,
                400: z.object({ message: z.string(), data: z.array(z.unknown()) }),
                500: z.object({ message: z.string(), data: z.array(z.unknown()) })
            }
        }
    }, async (request, reply) => {
        const query = request.query;
        console.log('[GET /HF/load-deleted] Loading data after timestamp: ' + query.timestamp);
        return handleLoadDeletedInstrument(query.timestamp, reply, 'GET /HF/load-deleted');
    });
    // GET /rfid/unassigned - Get RFIDs not connected to any active user or instrument
    fastify.get('/rfid/unassigned', {
        schema: {
            tags: ['RFID'],
            summary: 'Get RFIDs not connected to any active user or instrument',
            querystring: UnassignedRfidQuerySchema,
            response: {
                200: z.object({
                    message: z.string(),
                    data: z.array(z.object({
                        id: z.string(),
                        type: z.enum(['LF', 'HF']),
                        createdAt: z.date().or(z.string()),
                        updatedAt: z.date().or(z.string())
                    }))
                }),
                500: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        try {
            const { type, currentRfid } = request.query;
            const where = {
                deletedAt: null,
                AND: [
                    {
                        // Not connected to any active user (unless it equals currentRfid)
                        users: {
                            none: {
                                deletedAt: null,
                                ...(currentRfid ? { rfid: { not: currentRfid } } : {})
                            }
                        }
                    },
                    {
                        // Not connected to any active instrument (unless it equals currentRfid)
                        instruments: {
                            none: {
                                deletedAt: null,
                                ...(currentRfid ? { rfid: { not: currentRfid } } : {})
                            }
                        }
                    }
                ]
            };
            if (type) {
                where.type = type;
            }
            const rfids = await prisma.rfid.findMany({
                where,
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    type: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return reply.status(200).send({
                message: 'Unassigned RFIDs retrieved successfully',
                data: rfids
            });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
};
