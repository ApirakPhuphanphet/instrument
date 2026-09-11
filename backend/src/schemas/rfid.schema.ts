import { z } from 'zod';

export const TransactionBodySchema = z.object({
  lfuid: z.string().min(1, 'LFUID is required'),
  hfuid: z.string().min(1, 'HFUID is required'),
  unixTime: z.number().optional()
});

export type TransactionBody = z.infer<typeof TransactionBodySchema>;

export const RfidBodySchema = z.object({
  LF: z.string().optional(),
  lf: z.string().optional(),
  HF: z.string().optional(),
  hf: z.string().optional(),
  rfid: z.string().optional(),
  staff: z.string().optional(),
  instrument: z.string().optional(),
  id: z.string().optional()
});

export type RfidBody = z.infer<typeof RfidBodySchema>;

export const CheckRfidBodySchema = z.object({
  rfid: z.coerce.string().optional(),
  staff: z.coerce.string().optional(),
  instrument: z.coerce.string().optional(),
  LF: z.coerce.string().optional(),
  lf: z.coerce.string().optional(),
  HF: z.coerce.string().optional(),
  hf: z.coerce.string().optional(),
  id: z.coerce.string().optional()
});

export type CheckRfidBody = z.infer<typeof CheckRfidBodySchema>;

export const CheckRfidQuerySchema = z.object({
  rfid: z.coerce.string().optional(),
  staff: z.coerce.string().optional(),
  instrument: z.coerce.string().optional(),
  LF: z.coerce.string().optional(),
  lf: z.coerce.string().optional(),
  HF: z.coerce.string().optional(),
  hf: z.coerce.string().optional(),
  id: z.coerce.string().optional()
});

export type CheckRfidQuery = z.infer<typeof CheckRfidQuerySchema>;

export const StaffCheckResponseSchema = z.object({
  message: z.string(),
  checked_rfid: z.string().nullable(),
  type: z.string().nullable().optional(),
  staff: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      rfid: z.string().nullable()
    })
    .optional()
});

export type StaffCheckResponse = z.infer<typeof StaffCheckResponseSchema>;

export const InstrumentCheckResponseSchema = z.object({
  message: z.string(),
  checked_rfid: z.string().nullable(),
  type: z.string().nullable().optional(),
  instrument: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      status: z.string(),
      rfid: z.string().nullable(),
      barcode: z.string().nullable().optional(),
      group_id: z.string().nullable().optional(),
      next_maintain_date: z.date().or(z.string()).nullable().optional(),
      is_maintenance_overdue: z.boolean().optional(),
      group: z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          brand: z.string().nullable().optional(),
          model: z.string().nullable().optional()
        })
        .nullable()
        .optional()
    })
    .optional()
});

export type InstrumentCheckResponse = z.infer<typeof InstrumentCheckResponseSchema>;

export const LoadQuerySchema = z.object({
  timestamp: z.coerce.number().default(0)
});

export type LoadQuery = z.infer<typeof LoadQuerySchema>;

export const RfidTypeEnum = z.enum(['LF', 'HF']);
export type RfidType = z.infer<typeof RfidTypeEnum>;

export const TransactionTypeEnum = z.enum(['borrow', 'return']);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const RfidTypeParamSchema = z.object({
  type: z.enum(['LF', 'HF', 'lf', 'hf']).transform((val) => val.toUpperCase() as 'LF' | 'HF')
});

export const UnassignedRfidQuerySchema = z.object({
  type: z
    .preprocess((val) => (val === '' ? undefined : val), z.enum(['LF', 'HF', 'lf', 'hf']).optional())
    .transform((val) => (val ? (val.toUpperCase() as 'LF' | 'HF') : undefined)),
  currentRfid: z.string().optional()
});

export type UnassignedRfidQuery = z.infer<typeof UnassignedRfidQuerySchema>;

