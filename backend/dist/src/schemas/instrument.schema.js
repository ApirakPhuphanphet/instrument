import { z } from 'zod';
export const InstrumentStatusEnum = z.enum([
    'available',
    'borrowed',
    'maintenance',
    'lost',
    'retired'
]);
export const InstrumentResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    status: InstrumentStatusEnum,
    rfid: z.string().nullable(),
    image_url: z.string().nullable().optional(),
    barcode: z.string().nullable().optional(),
    createdAt: z.date().or(z.string()),
    updatedAt: z.date().or(z.string()),
    deletedAt: z.date().or(z.string()).nullable(),
    rfidRef: z
        .object({
        id: z.string(),
        type: z.enum(['LF', 'HF']),
        createdAt: z.date().or(z.string()),
        updatedAt: z.date().or(z.string()),
        deletedAt: z.date().or(z.string()).nullable()
    })
        .nullable()
        .optional()
});
export const CreateInstrumentSchema = z.object({
    name: z.string().min(1, 'Name is required').trim(),
    status: InstrumentStatusEnum.default('available'),
    rfid: z.string().trim().nullable().optional(),
    image_url: z.string().trim().nullable().optional(),
    barcode: z.string().trim().nullable().optional()
});
export const UpdateInstrumentSchema = z.object({
    name: z.string().min(1, 'Name cannot be empty').trim().optional(),
    status: InstrumentStatusEnum.optional(),
    rfid: z.string().trim().nullable().optional(),
    image_url: z.string().trim().nullable().optional(),
    barcode: z.string().trim().nullable().optional()
});
export const InstrumentParamsSchema = z.object({
    id: z.string().uuid('Invalid instrument UUID format')
});
export const InstrumentQuerySchema = z.object({
    search: z.string().optional(),
    status: InstrumentStatusEnum.optional(),
    excludeStatus: InstrumentStatusEnum.optional(),
    rfid: z.string().optional(),
    barcode: z.string().optional(),
    includeDeleted: z
        .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
        .transform((val) => val === true || val === 'true' || val === '1')
        .default(false),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
});
export const DeleteInstrumentQuerySchema = z.object({
    permanent: z
        .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
        .transform((val) => val === true || val === 'true' || val === '1')
        .default(false)
});
