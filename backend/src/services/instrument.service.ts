import { prisma } from '../lib/prisma.js';
import { imageService } from './image.service.js';
import {
  CreateInstrumentInput,
  UpdateInstrumentInput,
  InstrumentQueryInput
} from '../schemas/instrument.schema.js';

export class InstrumentServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'InstrumentServiceError';
    this.statusCode = statusCode;
  }
}

export class InstrumentService {
  /**
   * Helper to append is_maintenance_overdue status.
   */
  private formatInstrument<T extends { next_maintain_date?: Date | null; status: string; deletedAt?: Date | null }>(inst: T) {
    const is_maintenance_overdue = Boolean(
      inst.next_maintain_date &&
      new Date(inst.next_maintain_date) < new Date() &&
      inst.status !== 'maintenance' &&
      inst.status !== 'retired' &&
      !inst.deletedAt
    );
    return {
      ...inst,
      is_maintenance_overdue
    };
  }

  /**
   * Create a new instrument with optional RFID assignment.
   */
  async createInstrument(data: CreateInstrumentInput) {
    const { group_id, name, status, rfid, image_url, barcode, next_maintain_date } = data;

    if (rfid) {
      const rfidRecord = await prisma.rfid.findUnique({
        where: { id: rfid }
      });

      if (!rfidRecord) {
        throw new InstrumentServiceError(
          `RFID tag '${rfid}' does not exist. Please register the RFID tag first.`,
          404
        );
      }

      const existingInstrumentWithRfid = await prisma.instrument.findFirst({
        where: {
          rfid,
          deletedAt: null
        }
      });

      if (existingInstrumentWithRfid) {
        throw new InstrumentServiceError(
          `RFID tag '${rfid}' is already assigned to instrument '${existingInstrumentWithRfid.name}'.`,
          409
        );
      }
    }

    const instrument = await prisma.instrument.create({
      data: {
        group_id: group_id || null,
        name,
        status: status || 'available',
        rfid: rfid || null,
        image_url: image_url || null,
        barcode: barcode || null,
        next_maintain_date: next_maintain_date || null
      },
      include: {
        group: true,
        rfidRef: true
      }
    });

    return this.formatInstrument(instrument);
  }

  /**
   * List instruments with search, status filtering, and pagination.
   */
  async getInstruments(query: InstrumentQueryInput) {
    const { group_id, search, status, excludeStatus, rfid, barcode, overdue, includeDeleted, page, limit } = query;

    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (group_id) {
      where.group_id = group_id;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { rfid: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { group: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    } else if (excludeStatus) {
      where.status = { not: excludeStatus };
    }

    if (overdue) {
      where.next_maintain_date = { lt: new Date() };
      where.status = { notIn: ['maintenance', 'retired'] };
    }

    if (rfid) {
      where.rfid = {
        contains: rfid,
        mode: 'insensitive'
      };
    }

    if (barcode) {
      where.barcode = {
        contains: barcode,
        mode: 'insensitive'
      };
    }

    const skip = (page - 1) * limit;

    const [total, instruments] = await Promise.all([
      prisma.instrument.count({ where }),
      prisma.instrument.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          group: true,
          rfidRef: true
        }
      })
    ]);

    return {
      instruments: instruments.map((inst) => this.formatInstrument(inst)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a single instrument by UUID.
   */
  async getInstrumentById(id: string, includeDeleted = false) {
    const instrument = await prisma.instrument.findUnique({
      where: { id },
      include: {
        group: true,
        rfidRef: true
      }
    });

    if (!instrument) {
      throw new InstrumentServiceError(`Instrument with ID '${id}' not found.`, 404);
    }

    if (!includeDeleted && instrument.deletedAt !== null) {
      throw new InstrumentServiceError(`Instrument with ID '${id}' has been deleted.`, 404);
    }

    return this.formatInstrument(instrument);
  }

  /**
   * Update an existing instrument.
   */
  async updateInstrument(id: string, data: UpdateInstrumentInput) {
    const instrument = await prisma.instrument.findUnique({
      where: { id }
    });

    if (!instrument) {
      throw new InstrumentServiceError(`Instrument with ID '${id}' not found.`, 404);
    }

    if (instrument.deletedAt !== null) {
      throw new InstrumentServiceError(
        `Cannot update deleted instrument '${id}'. Restore the instrument first.`,
        400
      );
    }

    const { group_id, name, status, rfid, image_url, barcode, next_maintain_date } = data;

    if (rfid !== undefined && rfid !== null && rfid !== instrument.rfid) {
      const rfidRecord = await prisma.rfid.findUnique({
        where: { id: rfid }
      });

      if (!rfidRecord) {
        throw new InstrumentServiceError(
          `RFID tag '${rfid}' does not exist. Please register the RFID tag first.`,
          404
        );
      }

      const existingInstrumentWithRfid = await prisma.instrument.findFirst({
        where: {
          rfid,
          id: { not: id },
          deletedAt: null
        }
      });

      if (existingInstrumentWithRfid) {
        throw new InstrumentServiceError(
          `RFID tag '${rfid}' is already assigned to instrument '${existingInstrumentWithRfid.name}'.`,
          409
        );
      }
    }

    if (image_url !== undefined && image_url !== instrument.image_url && instrument.image_url) {
      const [otherInst, otherGroup] = await Promise.all([
        prisma.instrument.findFirst({
          where: { id: { not: id }, image_url: instrument.image_url, deletedAt: null }
        }),
        prisma.instrumentGroup.findFirst({
          where: { image_url: instrument.image_url, deletedAt: null }
        })
      ]);
      if (!otherInst && !otherGroup) {
        await imageService.deleteImageByUrl(instrument.image_url);
      }
    }

    const updated = await prisma.instrument.update({
      where: { id },
      data: {
        ...(group_id !== undefined && { group_id }),
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(rfid !== undefined && { rfid }),
        ...(image_url !== undefined && { image_url }),
        ...(barcode !== undefined && { barcode }),
        ...(next_maintain_date !== undefined && { next_maintain_date }),
        updatedAt: new Date()
      },
      include: {
        group: true,
        rfidRef: true
      }
    });

    return this.formatInstrument(updated);
  }

  /**
   * Delete an instrument (soft delete by default, or permanent delete).
   */
  async deleteInstrument(id: string, permanent = false) {
    const instrument = await prisma.instrument.findUnique({
      where: { id }
    });

    if (!instrument) {
      throw new InstrumentServiceError(`Instrument with ID '${id}' not found.`, 404);
    }

    // Delete image file when instrument is deleted
    if (instrument.image_url) {
      const [otherInst, otherGroup] = await Promise.all([
        prisma.instrument.findFirst({
          where: { id: { not: id }, image_url: instrument.image_url, deletedAt: null }
        }),
        prisma.instrumentGroup.findFirst({
          where: { image_url: instrument.image_url, deletedAt: null }
        })
      ]);
      if (!otherInst && !otherGroup) {
        await imageService.deleteImageByUrl(instrument.image_url);
      }
    }

    if (permanent) {
      return prisma.instrument.delete({
        where: { id }
      });
    }

    if (instrument.deletedAt !== null) {
      throw new InstrumentServiceError(`Instrument with ID '${id}' is already deleted.`, 400);
    }

    return prisma.instrument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        image_url: null
      },
      include: {
        group: true,
        rfidRef: true
      }
    });
  }

  /**
   * Restore a soft-deleted instrument.
   */
  async restoreInstrument(id: string) {
    const instrument = await prisma.instrument.findUnique({
      where: { id }
    });

    if (!instrument) {
      throw new InstrumentServiceError(`Instrument with ID '${id}' not found.`, 404);
    }

    if (instrument.deletedAt === null) {
      throw new InstrumentServiceError(`Instrument with ID '${id}' is not deleted.`, 400);
    }

    if (instrument.rfid) {
      const existingInstrumentWithRfid = await prisma.instrument.findFirst({
        where: {
          rfid: instrument.rfid,
          id: { not: id },
          deletedAt: null
        }
      });

      if (existingInstrumentWithRfid) {
        throw new InstrumentServiceError(
          `Cannot restore instrument: RFID '${instrument.rfid}' is currently assigned to instrument '${existingInstrumentWithRfid.name}'.`,
          409
        );
      }
    }

    return prisma.instrument.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date()
      },
      include: {
        group: true,
        rfidRef: true
      }
    });
  }
}

export const instrumentService = new InstrumentService();
