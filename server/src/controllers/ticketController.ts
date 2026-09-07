import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

export async function getTickets(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { status, userId } = req.query;

    const whereClause: any = { organizationId: orgId };
    if (status && status !== 'ALL') whereClause.status = String(status);
    if (userId) whereClause.userId = String(userId);

    if (req.user && req.user.role === 'EMPLOYEE') {
      whereClause.userId = req.user.userId;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true, department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
}

export async function createTicket(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { assetId, title, description, priority } = req.body;

    if (!assetId || !title || !description || !orgId) {
      return res.status(400).json({ error: 'assetId, title, description, and organization context required' });
    }

    const userId = req.user ? req.user.userId : req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Tenant isolation: the asset must belong to the caller's organization
    const asset = await prisma.asset.findFirst({ where: { id: assetId, organizationId: orgId } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found in your organization' });
    }

    const ticket = await prisma.ticket.create({
      data: {
        organizationId: orgId,
        assetId,
        userId,
        title,
        description,
        priority: priority || 'Medium',
        status: 'Open'
      },
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId,
          assetId,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'TICKET_CREATED',
          details: `Filed support ticket: ${title} (${priority || 'Medium'} priority)`
        }
      });
    }

    return res.status(201).json(ticket);
  } catch (error) {
    console.error('createTicket error:', error);
    return res.status(500).json({ error: 'Failed to create repair ticket' });
  }
}

export async function updateTicketStatus(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.ticket.findFirst({ where: { id, organizationId: orgId } });
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: { status },
      include: { asset: true, user: true }
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: orgId!,
          assetId: updated.assetId,
          userId: req.user.userId,
          userRole: req.user.role,
          action: 'TICKET_UPDATED',
          details: `Updated ticket "${updated.title}" status to ${status}`
        }
      });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update ticket status' });
  }
}
