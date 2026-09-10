import { z } from 'zod';

export const InstrumentStatusEnum = z.enum([
  'available',
  'borrowed',
  'maintenance',
  'lost',
  'retired'
]);

export type InstrumentStatus = z.infer<typeof InstrumentStatusEnum>;

export const InstrumentResponseSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid().nullable().optional(),
  name: z.string(),
  status: InstrumentStatusEnum,
  rfid: z.string().nullable(),
  image_url: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  next_maintain_date: z.date().or(z.string()).nullable().optional(),
  is_maintenance_overdue: z.boolean().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  deletedAt: z.date().or(z.string()).nullable(),
  group: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      brand: z.string().nullable().optional(),
      model: z.string().nullable().optional(),
      image_url: z.string().nullable().optional()
    })
    .nullable()
    .optional(),
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

export type InstrumentResponse = z.infer<typeof InstrumentResponseSchema>;

export const CreateInstrumentSchema = z.object({
  group_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Name is required').trim(),
  status: InstrumentStatusEnum.default('available'),
  rfid: z.string().trim().nullable().optional(),
  image_url: z.string().trim().nullable().optional(),
  barcode: z.string().trim().nullable().optional(),
  next_maintain_date: z.preprocess(
    (val) => (val === '' ? null : val),
    z.coerce.date().nullable().optional()
  )
});

export type CreateInstrumentInput = z.infer<typeof CreateInstrumentSchema>;

export const UpdateInstrumentSchema = z.object({
  group_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Name cannot be empty').trim().optional(),
  status: InstrumentStatusEnum.optional(),
  rfid: z.string().trim().nullable().optional(),
  image_url: z.string().trim().nullable().optional(),
  barcode: z.string().trim().nullable().optional(),
  next_maintain_date: z.preprocess(
    (val) => (val === '' ? null : val),
    z.coerce.date().nullable().optional()
  )
});

export type UpdateInstrumentInput = z.infer<typeof UpdateInstrumentSchema>;

export const InstrumentParamsSchema = z.object({
  id: z.string().uuid('Invalid instrument UUID format')
});

export type InstrumentParamsInput = z.infer<typeof InstrumentParamsSchema>;

export const InstrumentQuerySchema = z.object({
  group_id: z.string().uuid().optional(),
  search: z.string().optional(),
  status: InstrumentStatusEnum.optional(),
  excludeStatus: InstrumentStatusEnum.optional(),
  rfid: z.string().optional(),
  barcode: z.string().optional(),
  overdue: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .transform((val) => val === true || val === 'true' || val === '1')
    .optional(),
  includeDeleted: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .transform((val) => val === true || val === 'true' || val === '1')
    .default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type InstrumentQueryInput = z.infer<typeof InstrumentQuerySchema>;

export const DeleteInstrumentQuerySchema = z.object({
  permanent: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .transform((val) => val === true || val === 'true' || val === '1')
    .default(false)
});

export type DeleteInstrumentQueryInput = z.infer<typeof DeleteInstrumentQuerySchema>;
