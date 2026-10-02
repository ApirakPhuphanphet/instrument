import { z } from 'zod';
import { InstrumentResponseSchema } from './instrument.schema.js';
export const InstrumentGroupStatsSchema = z.object({
    total: z.number().int().default(0),
    available: z.number().int().default(0),
    borrowed: z.number().int().default(0),
    maintenance: z.number().int().default(0),
    retired: z.number().int().default(0),
    lost: z.number().int().default(0),
    overdue_maintenance: z.number().int().default(0)
});
export const InstrumentGroupResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    brand: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    createdAt: z.date().or(z.string()),
    updatedAt: z.date().or(z.string()),
    deletedAt: z.date().or(z.string()).nullable(),
    stats: InstrumentGroupStatsSchema.optional(),
    instruments: z.array(InstrumentResponseSchema).optional()
});
export const CreateInstrumentGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required').trim(),
    brand: z.string().trim().nullable().optional(),
    model: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    image_url: z.string().trim().nullable().optional()
});
export const UpdateInstrumentGroupSchema = z.object({
    name: z.string().min(1, 'Group name cannot be empty').trim().optional(),
    brand: z.string().trim().nullable().optional(),
    model: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    image_url: z.string().trim().nullable().optional()
});
export const InstrumentGroupParamsSchema = z.object({
    id: z.string().uuid('Invalid group UUID format')
});
export const InstrumentGroupQuerySchema = z.object({
    search: z.string().optional(),
    brand: z.string().optional(),
    includeDeleted: z
        .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
        .transform((val) => val === true || val === 'true' || val === '1')
        .default(false),
    includeUnits: z
        .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
        .transform((val) => val === true || val === 'true' || val === '1')
        .default(true),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50)
});
export const DeleteInstrumentGroupQuerySchema = z.object({
    permanent: z
        .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
        .transform((val) => val === true || val === 'true' || val === '1')
        .default(false)
});
