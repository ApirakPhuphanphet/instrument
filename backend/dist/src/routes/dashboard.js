import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { DashboardBorrowingStatsResponseSchema, DashboardOverviewStatsResponseSchema } from '../schemas/dashboard.schema.js';
export const dashboardRoutes = async (fastify) => {
    // GET /dashboard/borrowing-stats - Get borrowing amounts and rates by instrument type
    fastify.get('/dashboard/borrowing-stats', {
        schema: {
            tags: ['Dashboard'],
            summary: 'Get amount of borrowing of each type of instrument (currently borrowed and all-time borrows)',
            response: {
                200: DashboardBorrowingStatsResponseSchema,
                500: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        try {
            // 1. Fetch active instrument groups with their non-deleted, non-retired instruments
            const groups = await prisma.instrumentGroup.findMany({
                where: { deletedAt: null },
                orderBy: { name: 'asc' },
                include: {
                    instruments: {
                        where: { deletedAt: null, status: { not: 'retired' } },
                        select: {
                            id: true,
                            status: true
                        }
                    }
                }
            });
            // 2. Fetch active standalone instruments without a group
            const standaloneInstruments = await prisma.instrument.findMany({
                where: { group_id: null, deletedAt: null, status: { not: 'retired' } },
                select: {
                    id: true,
                    status: true
                }
            });
            // 3. Count borrow transactions per instrument
            const borrowCounts = await prisma.transaction.groupBy({
                by: ['instrument_id'],
                where: {
                    type: 'borrow',
                    deletedAt: null
                },
                _count: {
                    id: true
                }
            });
            const borrowCountByInstrument = new Map();
            let totalBorrowTransactions = 0;
            for (const b of borrowCounts) {
                borrowCountByInstrument.set(b.instrument_id, b._count.id);
                totalBorrowTransactions += b._count.id;
            }
            // 4. Aggregate stats for each instrument group / type
            let totalUnitsCount = 0;
            let totalBorrowedUnitsCount = 0;
            const byType = groups.map((g) => {
                const totalUnits = g.instruments.length;
                let currentlyBorrowed = 0;
                let availableUnits = 0;
                let maintenanceUnits = 0;
                let totalBorrows = 0;
                for (const inst of g.instruments) {
                    if (inst.status === 'borrowed')
                        currentlyBorrowed++;
                    else if (inst.status === 'available')
                        availableUnits++;
                    else if (inst.status === 'maintenance')
                        maintenanceUnits++;
                    totalBorrows += borrowCountByInstrument.get(inst.id) || 0;
                }
                totalUnitsCount += totalUnits;
                totalBorrowedUnitsCount += currentlyBorrowed;
                const borrowRatePercent = totalUnits > 0
                    ? Math.round((currentlyBorrowed / totalUnits) * 1000) / 10
                    : 0;
                return {
                    group_id: g.id,
                    name: g.name,
                    brand: g.brand,
                    model: g.model,
                    image_url: g.image_url,
                    total_units: totalUnits,
                    currently_borrowed: currentlyBorrowed,
                    available_units: availableUnits,
                    maintenance_units: maintenanceUnits,
                    borrow_rate_percent: borrowRatePercent,
                    total_borrows: totalBorrows
                };
            });
            // Include standalone instruments if any exist
            if (standaloneInstruments.length > 0) {
                let currentlyBorrowed = 0;
                let availableUnits = 0;
                let maintenanceUnits = 0;
                let totalBorrows = 0;
                for (const inst of standaloneInstruments) {
                    if (inst.status === 'borrowed')
                        currentlyBorrowed++;
                    else if (inst.status === 'available')
                        availableUnits++;
                    else if (inst.status === 'maintenance')
                        maintenanceUnits++;
                    totalBorrows += borrowCountByInstrument.get(inst.id) || 0;
                }
                totalUnitsCount += standaloneInstruments.length;
                totalBorrowedUnitsCount += currentlyBorrowed;
                const borrowRatePercent = standaloneInstruments.length > 0
                    ? Math.round((currentlyBorrowed / standaloneInstruments.length) * 1000) / 10
                    : 0;
                byType.push({
                    group_id: null,
                    name: 'Standalone Instruments',
                    brand: null,
                    model: null,
                    image_url: null,
                    total_units: standaloneInstruments.length,
                    currently_borrowed: currentlyBorrowed,
                    available_units: availableUnits,
                    maintenance_units: maintenanceUnits,
                    borrow_rate_percent: borrowRatePercent,
                    total_borrows: totalBorrows
                });
            }
            // Sort by currently borrowed descending, then total borrows descending
            byType.sort((a, b) => b.currently_borrowed - a.currently_borrowed || b.total_borrows - a.total_borrows);
            const overallBorrowRate = totalUnitsCount > 0
                ? Math.round((totalBorrowedUnitsCount / totalUnitsCount) * 1000) / 10
                : 0;
            return reply.status(200).send({
                message: 'Borrowing stats by instrument type retrieved successfully',
                summary: {
                    total_groups: groups.length,
                    total_units: totalUnitsCount,
                    currently_borrowed_units: totalBorrowedUnitsCount,
                    total_borrow_transactions: totalBorrowTransactions,
                    overall_borrow_rate: overallBorrowRate
                },
                by_type: byType,
                stats: byType
            });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
    // GET /dashboard/stats - Overview stats for dashboard cards
    fastify.get('/dashboard/stats', {
        schema: {
            tags: ['Dashboard'],
            summary: 'Get overall dashboard statistics',
            response: {
                200: DashboardOverviewStatsResponseSchema,
                500: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        try {
            const now = new Date();
            const [totalActive, availableCount, borrowedCount, maintenanceCount, overdueCount, usersCount, groupsCount, rfidsCount] = await Promise.all([
                prisma.instrument.count({
                    where: { deletedAt: null, status: { not: 'retired' } }
                }),
                prisma.instrument.count({
                    where: { deletedAt: null, status: 'available' }
                }),
                prisma.instrument.count({
                    where: { deletedAt: null, status: 'borrowed' }
                }),
                prisma.instrument.count({
                    where: { deletedAt: null, status: 'maintenance' }
                }),
                prisma.instrument.count({
                    where: {
                        deletedAt: null,
                        status: { notIn: ['maintenance', 'retired'] },
                        next_maintain_date: { not: null, lt: now }
                    }
                }),
                prisma.user.count({
                    where: { deletedAt: null }
                }),
                prisma.instrumentGroup.count({
                    where: { deletedAt: null }
                }),
                prisma.rfid.count({
                    where: { deletedAt: null }
                })
            ]);
            return reply.status(200).send({
                message: 'Dashboard overview stats retrieved successfully',
                stats: {
                    total: totalActive,
                    available: availableCount,
                    borrowed: borrowedCount,
                    maintenance: maintenanceCount,
                    overdue: overdueCount,
                    users: usersCount,
                    groups: groupsCount,
                    rfids: rfidsCount
                }
            });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });
};
