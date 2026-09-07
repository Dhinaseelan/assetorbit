import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Roles a non-ADMIN creator (e.g. HR_DEPT) is allowed to grant.
// Only ADMIN may grant elevated roles.
const VALID_ROLES = ['ADMIN', 'IT_DEPT', 'HR_DEPT', 'MANAGER', 'EMPLOYEE'];
const NON_ADMIN_GRANTABLE_ROLES = ['EMPLOYEE', 'MANAGER'];

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        _count: {
          select: {
            assignments: { where: { returnDate: null } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function createEmployeeAccount(req: AuthRequest, res: Response) {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(401).json({ error: 'Organization context missing' });

    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Employee Full Name, Work Email, and Temporary Password are required' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Temporary password must be at least 8 characters long' });
    }

    const requestedRole = role || 'EMPLOYEE';
    if (!VALID_ROLES.includes(requestedRole)) {
      return res.status(400).json({ error: `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}` });
    }

    // Prevent privilege escalation: only ADMIN can grant elevated roles
    if (req.user?.role !== 'ADMIN' && !NON_ADMIN_GRANTABLE_ROLES.includes(requestedRole)) {
      return res.status(403).json({ error: 'Only ADMIN can create accounts with elevated roles' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Work email address is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: requestedRole,
        department: department || 'Engineering'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId: req.user!.userId,
        userRole: req.user!.role,
        action: 'EMPLOYEE_CREATED',
        details: `Created new employee account for ${newUser.name} (${newUser.email}) with role ${newUser.role} in ${newUser.department}`
      }
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error('createEmployeeAccount error:', error);
    return res.status(500).json({ error: 'Failed to create employee account' });
  }
}
