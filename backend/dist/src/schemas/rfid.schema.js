import { z } from 'zod';
export const TransactionBodySchema = z.object({
    staffuid: z.string().min(1, 'Staff UID is required'),
    instrumentuid: z.string().min(1, 'Instrument UID is required'),
    unixTime: z.number().optional()
});
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
export const LoadQuerySchema = z.object({
    timestamp: z.coerce.number().default(0)
});
export const LoadResponseSchema = z.object({
    ids: z.array(z.string()),
    data: z.array(z.unknown())
});
export const RfidTypeEnum = z.enum(['LF', 'HF']);
export const TransactionTypeEnum = z.enum(['borrow', 'return']);
export const RfidTypeParamSchema = z.object({
    type: z.enum(['LF', 'HF', 'lf', 'hf']).transform((val) => val.toUpperCase())
});
export const UnassignedRfidQuerySchema = z.object({
    type: z
        .preprocess((val) => (val === '' ? undefined : val), z.enum(['LF', 'HF', 'lf', 'hf']).optional())
        .transform((val) => (val ? val.toUpperCase() : undefined)),
    currentRfid: z.string().optional()
});
