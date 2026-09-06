import { z } from 'zod';
export const TransactionBodySchema = z.object({
    lfuid: z.string().min(1, 'LFUID is required'),
    hfuid: z.string().min(1, 'HFUID is required'),
    unixTime: z.number().optional()
});
export const RfidBodySchema = z.object({
    LF: z.string().optional(),
    lf: z.string().optional(),
    HF: z.string().optional(),
    hf: z.string().optional(),
    rfid: z.string().optional()
});
export const LoadQuerySchema = z.object({
    timestamp: z.coerce.number().default(0)
});
export const RfidTypeEnum = z.enum(['LF', 'HF']);
export const TransactionTypeEnum = z.enum(['borrow', 'return']);
export const RfidTypeParamSchema = z.object({
    type: z.enum(['LF', 'HF', 'lf', 'hf']).transform((val) => val.toUpperCase())
});
