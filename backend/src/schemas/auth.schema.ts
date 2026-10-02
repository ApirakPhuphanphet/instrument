import { z } from 'zod';

export const LoginBodySchema = z.object({
  email: z.string().email('Invalid email address format').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export type LoginBodyInput = z.infer<typeof LoginBodySchema>;

export const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export type ChangePasswordBodyInput = z.infer<typeof ChangePasswordBodySchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().nullable(),
  role: z.enum(['ADMIN', 'USER']),
  mustChangePassword: z.boolean(),
  rfid: z.string().nullable().optional()
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: AuthUserSchema
});

export const MeResponseSchema = z.object({
  message: z.string(),
  data: AuthUserSchema
});

export const GenericMessageResponseSchema = z.object({
  message: z.string()
});
