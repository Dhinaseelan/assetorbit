import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

export async function getMaintenanceRecords(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const records = await prisma.maintenanceRecord.findMany({
      where: { organizationId: orgId },
      include: { asset: true },
      orderBy: { serviceDate: 'desc' }
    });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
}

export async function createMaintenanceRecord(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { assetId, performedBy, description, cost, status } = req.body;

    if (!assetId || !description || cost === undefined || !orgId) {
      return res.status(400).json({ error: 'assetId, description, and cost are required' });
    }

    const asset = await prisma.asset.findFirst({ where: { id: assetId, organizationId: orgId } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found in organization' });
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        organizationId: orgId,
        assetId,
        performedBy: performedBy || 'Internal IT',
        description,
        cost: parseFloat(cost),
        status: status || 'In_Progress'
      },
      include: { asset: true }
    });

    if (status === 'In_Progress' || !status) {
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: 'Maintenance' }
      });
    }

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId,
          assetId,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'ASSET_SERVICED',
          details: `Logged maintenance for ${asset.assetTag} ($${cost}): ${description}`
        }
      });
    }

    return res.status(201).json(record);
  } catch (error) {
    console.error('createMaintenanceRecord error:', error);
    return res.status(500).json({ error: 'Failed to create maintenance record' });
  }
}

export async function updateMaintenanceStatus(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.maintenanceRecord.findFirst({
      where: { id, organizationId: orgId },
      include: { asset: { include: { assignments: { where: { returnDate: null } } } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    const updated = await prisma.maintenanceRecord.update({
      where: { id },
      data: { status }
    });

    if (status === 'Completed') {
      const hasAssignee = existing.asset.assignments.length > 0;
      await prisma.asset.update({
        where: { id: existing.assetId },
        data: { status: hasAssignee ? 'Assigned' : 'Available' }
      });
    }

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId!,
          assetId: existing.assetId,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'ASSET_SERVICED',
          details: `Updated maintenance status to ${status} for ${existing.asset.assetTag}`
        }
      });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update maintenance status' });
  }
}
