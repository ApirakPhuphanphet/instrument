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
  rfid: z.string().optional()
});

export type RfidBody = z.infer<typeof RfidBodySchema>;

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
  type: z.enum(['LF', 'HF', 'lf', 'hf']).optional().transform((val) => val ? (val.toUpperCase() as 'LF' | 'HF') : undefined),
  currentRfid: z.string().optional()
});

export type UnassignedRfidQuery = z.infer<typeof UnassignedRfidQuerySchema>;

