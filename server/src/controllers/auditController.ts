import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: orgId },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}
