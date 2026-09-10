import { prisma } from '../lib/prisma.js';
import {
  SendMaintenanceInput,
  ReturnMaintenanceInput,
  MaintenanceQueryInput
} from '../schemas/maintenance.schema.js';

export class MaintenanceServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'MaintenanceServiceError';
    this.statusCode = statusCode;
  }
}

export class MaintenanceService {
  /**
   * Send an instrument to maintenance.
   * Updates instrument status to 'maintenance' and logs sent_at timestamp.
   */
  async sendToMaintenance(data: SendMaintenanceInput) {
    const { instrument_id, reason, notes, maintainer, sent_at } = data;

    const instrument = await prisma.instrument.findFirst({
      where: { id: instrument_id, deletedAt: null }
    });

    if (!instrument) {
      throw new MaintenanceServiceError('Instrument not found', 404);
    }

    if (instrument.status === 'maintenance') {
      throw new MaintenanceServiceError('Instrument is already in maintenance.', 409);
    }

    if (instrument.status === 'borrowed') {
      throw new MaintenanceServiceError(
        'Instrument is currently borrowed. Please return it before sending to maintenance.',
        400
      );
    }

    if (instrument.status === 'retired') {
      throw new MaintenanceServiceError('Cannot send a retired instrument to maintenance.', 400);
    }

    const activeMaintenance = await prisma.maintenance.findFirst({
      where: {
        instrument_id,
        status: 'in_progress',
        deletedAt: null
      }
    });

    if (activeMaintenance) {
      throw new MaintenanceServiceError(
        'An active in-progress maintenance record already exists for this instrument.',
        409
      );
    }

    const [record] = await prisma.$transaction([
      prisma.maintenance.create({
        data: {
          instrument_id,
          status: 'in_progress',
          sent_at: sent_at || new Date(),
          reason: reason || null,
          notes: notes || null,
          maintainer: maintainer || null
        },
        include: {
          instrument: {
            select: { id: true, name: true, status: true, rfid: true, image_url: true }
          }
        }
      }),
      prisma.instrument.update({
        where: { id: instrument_id },
        data: { status: 'maintenance' }
      })
    ]);

    return record;
  }

  /**
   * Return an instrument from maintenance.
   * Updates maintenance record with returned_at, notes, status 'completed',
   * and restores instrument status to 'available'.
   */
  async returnFromMaintenance(id: string, data: ReturnMaintenanceInput = {}) {
    const { returned_at, notes, maintainer, next_maintain_date } = data || {};

    const maintenance = await prisma.maintenance.findFirst({
      where: { id, deletedAt: null },
      include: { instrument: true }
    });

    if (!maintenance) {
      throw new MaintenanceServiceError('Maintenance record not found', 404);
    }

    if (maintenance.status !== 'in_progress') {
      throw new MaintenanceServiceError(
        `Cannot return instrument: maintenance is already marked as '${maintenance.status}'.`,
        400
      );
    }

    const updatedNotes = notes
      ? maintenance.notes
        ? `${maintenance.notes}\n[Resolution]: ${notes}`
        : notes
      : maintenance.notes;

    const [, record] = await prisma.$transaction([
      prisma.instrument.update({
        where: { id: maintenance.instrument_id },
        data: {
          status: 'available',
          ...(next_maintain_date !== undefined && { next_maintain_date })
        }
      }),
      prisma.maintenance.update({
        where: { id },
        data: {
          status: 'completed',
          returned_at: returned_at || new Date(),
          notes: updatedNotes,
          maintainer: maintainer || maintenance.maintainer,
          updatedAt: new Date()
        },
        include: {
          instrument: {
            select: { id: true, name: true, status: true, rfid: true, image_url: true }
          }
        }
      })
    ]);

    return record;
  }

  /**
   * List maintenance records with status/instrument filtering, search, and pagination.
   */
  async getMaintenances(query: MaintenanceQueryInput) {
    const { instrument_id, status, search, page, limit, includeDeleted } = query;

    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (instrument_id) {
      where.instrument_id = instrument_id;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { instrument: { name: { contains: search, mode: 'insensitive' } } },
        { instrument: { rfid: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { maintainer: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, maintenances] = await Promise.all([
      prisma.maintenance.count({ where }),
      prisma.maintenance.findMany({
        where,
        include: {
          instrument: {
            select: { id: true, name: true, status: true, rfid: true, image_url: true }
          }
        },
        orderBy: { sent_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return {
      data: maintenances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get single maintenance record by ID.
   */
  async getMaintenanceById(id: string) {
    const record = await prisma.maintenance.findFirst({
      where: { id, deletedAt: null },
      include: {
        instrument: {
          select: { id: true, name: true, status: true, rfid: true, image_url: true }
        }
      }
    });

    if (!record) {
      throw new MaintenanceServiceError('Maintenance record not found', 404);
    }

    return record;
  }
}

export const maintenanceService = new MaintenanceService();
