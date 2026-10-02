import { z } from 'zod';

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable().optional(),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  mustChangePassword: z.boolean().default(false),
  rfid: z.string().nullable(),
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

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address format').trim().toLowerCase().nullable().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'USER']).default('USER').optional(),
  rfid: z.string().trim().nullable().optional()
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').trim().optional(),
  email: z.string().email('Invalid email address format').trim().toLowerCase().nullable().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  mustChangePassword: z.boolean().optional(),
  rfid: z.string().trim().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const UserParamsSchema = z.object({
  id: z.string().uuid('Invalid user UUID format')
});

export type UserParamsInput = z.infer<typeof UserParamsSchema>;

export const UserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  rfid: z.string().optional(),
  includeDeleted: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .transform((val) => val === true || val === 'true' || val === '1')
    .default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type UserQueryInput = z.infer<typeof UserQuerySchema>;

export const DeleteUserQuerySchema = z.object({
  permanent: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .transform((val) => val === true || val === 'true' || val === '1')
    .default(false)
});

export type DeleteUserQueryInput = z.infer<typeof DeleteUserQuerySchema>;
