import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

export async function getAssets(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ error: 'Organization context missing' });

    const { search, category, status, condition, expiringSoon } = req.query;

    const whereClause: any = {
      organizationId: orgId
    };

    if (search) {
      const q = String(search).trim();
      whereClause.AND = [
        {
          OR: [
            { name: { contains: q } },
            { assetTag: { contains: q } },
            { serialNumber: { contains: q } },
            { location: { contains: q } }
          ]
        }
      ];
    }

    if (category && category !== 'ALL') {
      whereClause.category = String(category);
    }

    if (status && status !== 'ALL') {
      whereClause.status = String(status);
    }

    if (condition && condition !== 'ALL') {
      whereClause.condition = String(condition);
    }

    if (expiringSoon === 'true') {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      whereClause.warrantyExpiry = {
        gte: now,
        lte: thirtyDaysFromNow
      };
    }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        assignments: {
          where: { returnDate: null },
          include: {
            user: { select: { id: true, name: true, email: true, department: true } }
          }
        },
        _count: {
          select: { maintenance: true, tickets: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = assets.map(asset => {
      const activeAssignment = asset.assignments[0] || null;
      return {
        ...asset,
        currentAssignee: activeAssignment ? activeAssignment.user : null,
        activeAssignmentId: activeAssignment ? activeAssignment.id : null
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('getAssets error:', error);
    return res.status(500).json({ error: 'Failed to fetch assets' });
  }
}

export async function getAssetById(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({
      where: { id, organizationId: orgId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true } }
          },
          orderBy: { assignmentDate: 'desc' }
        },
        maintenance: {
          orderBy: { serviceDate: 'desc' }
        },
        tickets: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found or unauthorized' });
    }

    const activeAssignment = asset.assignments.find(a => a.returnDate === null) || null;

    return res.json({
      ...asset,
      currentAssignee: activeAssignment ? activeAssignment.user : null,
      activeAssignmentId: activeAssignment ? activeAssignment.id : null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch asset details' });
  }
}

export async function createAsset(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ error: 'Organization context missing' });

    const {
      name,
      serialNumber,
      category,
      condition,
      location,
      purchaseDate,
      purchaseCost,
      expectedYears,
      warrantyExpiry
    } = req.body;

    if (!name || !serialNumber || !category || !purchaseCost || !warrantyExpiry) {
      return res.status(400).json({ error: 'Name, serial number, category, purchase cost, and warranty expiry are required' });
    }

    // Auto-generate Asset Tag scoped to org (AST-XXXX)
    const lastAsset = await prisma.asset.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' }
    });

    let nextNum = 1001;
    if (lastAsset && lastAsset.assetTag.startsWith('AST-')) {
      const parsed = parseInt(lastAsset.assetTag.replace('AST-', ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    const assetTag = `AST-${nextNum}`;

    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(`Assetorbit:${req.user?.orgName}:${assetTag}:${serialNumber}`);
    } catch (e) {}

    const newAsset = await prisma.asset.create({
      data: {
        organizationId: orgId,
        assetTag,
        name,
        serialNumber,
        category,
        status: 'Available',
        condition: condition || 'Excellent',
        location: location || 'HQ Storage',
        purchaseDate: new Date(purchaseDate || Date.now()),
        purchaseCost: parseFloat(purchaseCost),
        expectedYears: parseInt(expectedYears || '3', 10),
        warrantyExpiry: new Date(warrantyExpiry),
        qrCodeUrl
      }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId,
          assetId: newAsset.id,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'ASSET_CREATED',
          details: `Created new asset ${assetTag} (${name})`
        }
      });
    }

    return res.status(201).json(newAsset);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Serial number or asset tag already exists in your organization' });
    }
    console.error('createAsset error:', error);
    return res.status(500).json({ error: 'Failed to create asset' });
  }
}

export async function updateAsset(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { id } = req.params;
    const {
      name,
      category,
      status,
      condition,
      location,
      purchaseCost,
      expectedYears,
      warrantyExpiry
    } = req.body;

    const existing = await prisma.asset.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        name: name || existing.name,
        category: category || existing.category,
        status: status || existing.status,
        condition: condition || existing.condition,
        location: location || existing.location,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : existing.purchaseCost,
        expectedYears: expectedYears ? parseInt(expectedYears, 10) : existing.expectedYears,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : existing.warrantyExpiry
      }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId!,
          assetId: updated.id,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'ASSET_UPDATED',
          details: `Updated details for ${updated.assetTag} (${updated.name})`
        }
      });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update asset' });
  }
}

export async function deleteAsset(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { id } = req.params;

    const existing = await prisma.asset.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await prisma.asset.delete({ where: { id } });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId!,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'ASSET_DELETED',
          details: `Deleted asset ${existing.assetTag} (${existing.name})`
        }
      });
    }

    return res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete asset' });
  }
}

export async function retireAsset(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { id } = req.params;
    const { notes } = req.body;

    const existing = await prisma.asset.findFirst({
      where: { id, organizationId: orgId },
      include: { assignments: { where: { returnDate: null } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (existing.assignments.length > 0) {
      await prisma.assetAssignment.update({
        where: { id: existing.assignments[0].id },
        data: { returnDate: new Date(), notes: 'Returned due to asset retirement' }
      });
    }

    const retired = await prisma.asset.update({
      where: { id },
      data: {
        status: 'Retired',
        location: 'E-Waste / Storage'
      }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId!,
          assetId: retired.id,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'ASSET_RETIRED',
          details: `Retired asset ${retired.assetTag}. Notes: ${notes || 'End of life'}`
        }
      });
    }

    return res.json(retired);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retire asset' });
  }
}
