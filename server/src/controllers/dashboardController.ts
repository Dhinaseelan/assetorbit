import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ error: 'Organization context missing' });

    const totalAssets = await prisma.asset.count({ where: { organizationId: orgId } });
    const availableAssets = await prisma.asset.count({ where: { organizationId: orgId, status: 'Available' } });
    const assignedAssets = await prisma.asset.count({ where: { organizationId: orgId, status: 'Assigned' } });
    const maintenanceAssets = await prisma.asset.count({ where: { organizationId: orgId, status: 'Maintenance' } });
    const retiredAssets = await prisma.asset.count({ where: { organizationId: orgId, status: 'Retired' } });

    // Financial valuation & straight-line depreciation
    const allAssets = await prisma.asset.findMany({ where: { organizationId: orgId } });
    const totalPurchaseValue = allAssets.reduce((sum, a) => sum + a.purchaseCost, 0);

    const now = new Date();
    let currentBookValue = 0;
    allAssets.forEach(asset => {
      if (asset.status === 'Retired') return;
      const ageYears = (now.getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const lifespan = asset.expectedYears || 3;
      if (ageYears >= lifespan) {
        currentBookValue += asset.purchaseCost * 0.1;
      } else {
        const depreciated = asset.purchaseCost * (1 - (ageYears / lifespan));
        currentBookValue += Math.max(depreciated, asset.purchaseCost * 0.1);
      }
    });

    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    const expiringWarranties = await prisma.asset.findMany({
      where: {
        organizationId: orgId,
        warrantyExpiry: {
          gte: now,
          lte: ninetyDaysFromNow
        },
        status: { not: 'Retired' }
      },
      orderBy: { warrantyExpiry: 'asc' },
      take: 10
    });

    const categoriesGroup = await prisma.asset.groupBy({
      by: ['category'],
      where: { organizationId: orgId },
      _count: { id: true },
      _sum: { purchaseCost: true }
    });

    const categoryStats = categoriesGroup.map(c => ({
      category: c.category,
      count: c._count.id,
      totalCost: c._sum.purchaseCost || 0
    }));

    const statusStats = [
      { status: 'Available', count: availableAssets, color: '#10B981' },
      { status: 'Assigned', count: assignedAssets, color: '#3B82F6' },
      { status: 'Maintenance', count: maintenanceAssets, color: '#F59E0B' },
      { status: 'Retired', count: retiredAssets, color: '#6B7280' }
    ];

    const openTicketsCount = await prisma.ticket.count({
      where: { organizationId: orgId, status: { in: ['Open', 'In_Progress'] } }
    });

    const maintenanceSpend = await prisma.maintenanceRecord.aggregate({
      where: { organizationId: orgId },
      _sum: { cost: true }
    });

    const recentActivity = await prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        asset: { select: { assetTag: true, name: true } }
      }
    });

    return res.json({
      organization: {
        id: orgId,
        name: req.user?.orgName
      },
      summary: {
        totalAssets,
        availableAssets,
        assignedAssets,
        maintenanceAssets,
        retiredAssets,
        totalPurchaseValue,
        currentBookValue: Math.round(currentBookValue * 100) / 100,
        openTicketsCount,
        totalMaintenanceSpend: maintenanceSpend._sum.cost || 0
      },
      statusStats,
      categoryStats,
      expiringWarranties,
      recentActivity
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ error: 'Failed to compute dashboard analytics' });
  }
}
