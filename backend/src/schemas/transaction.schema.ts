import { z } from 'zod';
import { TransactionBodySchema, TransactionTypeEnum } from './rfid.schema.js';

export { TransactionBodySchema } from './rfid.schema.js';
export type { TransactionBody, TransactionType } from './rfid.schema.js';

export const TransactionQuerySchema = z.object({
  type: TransactionTypeEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional()
});

export type TransactionQueryInput = z.infer<typeof TransactionQuerySchema>;

export const TransactionResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  instrument_id: z.string().uuid(),
  type: TransactionTypeEnum,
  timestamp: z.date().or(z.string()),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  deletedAt: z.date().or(z.string()).nullable(),
  user: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      rfid: z.string().nullable()
    })
    .nullable()
    .optional(),
  instrument: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      status: z.string(),
      rfid: z.string().nullable(),
      image_url: z.string().nullable().optional()
    })
    .nullable()
    .optional()
});

export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;

export const TransactionListResponseSchema = z.object({
  message: z.string(),
  data: z.array(TransactionResponseSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number()
  })
});

export type TransactionListResponse = z.infer<typeof TransactionListResponseSchema>;
