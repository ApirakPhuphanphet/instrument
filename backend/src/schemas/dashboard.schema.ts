import { z } from 'zod';

export const BorrowingStatByTypeSchema = z.object({
  group_id: z.string().uuid().nullable(),
  name: z.string(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  total_units: z.number(),
  currently_borrowed: z.number(),
  available_units: z.number(),
  maintenance_units: z.number(),
  borrow_rate_percent: z.number(),
  total_borrows: z.number()
});

export type BorrowingStatByType = z.infer<typeof BorrowingStatByTypeSchema>;

export const DashboardBorrowingStatsResponseSchema = z.object({
  message: z.string(),
  summary: z.object({
    total_groups: z.number(),
    total_units: z.number(),
    currently_borrowed_units: z.number(),
    total_borrow_transactions: z.number(),
    overall_borrow_rate: z.number()
  }),
  by_type: z.array(BorrowingStatByTypeSchema),
  stats: z.array(BorrowingStatByTypeSchema).optional()
});

export type DashboardBorrowingStatsResponse = z.infer<typeof DashboardBorrowingStatsResponseSchema>;

export const DashboardOverviewStatsResponseSchema = z.object({
  message: z.string(),
  stats: z.object({
    total: z.number(),
    available: z.number(),
    borrowed: z.number(),
    maintenance: z.number(),
    overdue: z.number(),
    users: z.number(),
    groups: z.number(),
    rfids: z.number()
  })
});

export type DashboardOverviewStatsResponse = z.infer<typeof DashboardOverviewStatsResponseSchema>;
