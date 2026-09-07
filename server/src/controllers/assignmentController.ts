import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

export async function assignAsset(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { assetId, userId, notes } = req.body;

    if (!assetId || !userId || !orgId) {
      return res.status(400).json({ error: 'assetId, userId, and organization context required' });
    }

    const asset = await prisma.asset.findFirst({
      where: { id: assetId, organizationId: orgId },
      include: { assignments: { where: { returnDate: null } } }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found in organization' });
    }

    if (asset.status === 'Retired') {
      return res.status(400).json({ error: 'Cannot assign a retired asset' });
    }

    if (asset.assignments.length > 0) {
      return res.status(400).json({ error: 'Asset is currently assigned to another user' });
    }

    const user = await prisma.user.findFirst({ where: { id: userId, organizationId: orgId } });
    if (!user) {
      return res.status(404).json({ error: 'Target user not found in organization' });
    }

    const assignedByName = req.user ? req.user.name : 'System';

    const assignment = await prisma.assetAssignment.create({
      data: {
        organizationId: orgId,
        assetId,
        userId,
        assignedBy: assignedByName,
        notes: notes || null
      },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        asset: true
      }
    });

    await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'Assigned' }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId,
          assetId,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'ASSET_ASSIGNED',
          details: `Assigned asset ${asset.assetTag} (${asset.name}) to ${user.name} (${user.department})`
        }
      });
    }

    return res.status(201).json(assignment);
  } catch (error) {
    console.error('assignAsset error:', error);
    return res.status(500).json({ error: 'Failed to assign asset' });
  }
}

export async function returnAsset(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { assignmentId } = req.params;
    const { notes } = req.body;

    const assignment = await prisma.assetAssignment.findFirst({
      where: { id: assignmentId, organizationId: orgId },
      include: { asset: true, user: true }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment record not found' });
    }

    if (assignment.returnDate !== null) {
      return res.status(400).json({ error: 'Asset has already been returned' });
    }

    const updatedAssignment = await prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: {
        returnDate: new Date(),
        notes: notes ? `${assignment.notes || ''} [Return Notes: ${notes}]` : assignment.notes
      }
    });

    await prisma.asset.update({
      where: { id: assignment.assetId },
      data: { status: 'Available' }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId!,
          assetId: assignment.assetId,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'ASSET_RETURNED',
          details: `Returned asset ${assignment.asset.assetTag} from ${assignment.user.name}`
        }
      });
    }

    return res.json(updatedAssignment);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to return asset' });
  }
}

export async function getAssignments(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const assignments = await prisma.assetAssignment.findMany({
      where: { organizationId: orgId },
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true, department: true, role: true } }
      },
      orderBy: { assignmentDate: 'desc' }
    });

    return res.json(assignments);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch assignments' });
  }
}
