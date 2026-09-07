import { z } from 'zod';
export const MaintenanceStatusEnum = z.enum(['in_progress', 'completed', 'cancelled']);
export const SendMaintenanceSchema = z.object({
    instrument_id: z.string().uuid('Invalid instrument ID format'),
    reason: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional(),
    maintainer: z.string().trim().max(200).optional(),
    sent_at: z.coerce.date().optional()
});
export const ReturnMaintenanceSchema = z.object({
    returned_at: z.coerce.date().optional(),
    notes: z.string().trim().max(1000).optional(),
    maintainer: z.string().trim().max(200).optional()
}).optional().default({});
export const MaintenanceParamsSchema = z.object({
    id: z.string().uuid('Invalid maintenance ID format')
});
export const MaintenanceQuerySchema = z.object({
    instrument_id: z.string().uuid().optional(),
    status: MaintenanceStatusEnum.optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    includeDeleted: z
        .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
        .transform((val) => val === true || val === 'true' || val === '1')
        .default(false)
});
export const MaintenanceItemSchema = z.object({
    id: z.string().uuid(),
    instrument_id: z.string().uuid(),
    status: MaintenanceStatusEnum,
    sent_at: z.date().or(z.string()),
    returned_at: z.date().or(z.string()).nullable(),
    reason: z.string().nullable(),
    notes: z.string().nullable(),
    maintainer: z.string().nullable(),
    createdAt: z.date().or(z.string()),
    updatedAt: z.date().or(z.string()),
    deletedAt: z.date().or(z.string()).nullable(),
    instrument: z
        .object({
        id: z.string().uuid(),
        name: z.string(),
        status: z.string(),
        rfid: z.string().nullable(),
        image_url: z.string().nullable().optional()
    })
        .optional()
});
export const MaintenanceResponseSchema = z.object({
    message: z.string(),
    data: MaintenanceItemSchema
});
export const MaintenanceListResponseSchema = z.object({
    message: z.string(),
    data: z.array(MaintenanceItemSchema),
    pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number()
    })
});
