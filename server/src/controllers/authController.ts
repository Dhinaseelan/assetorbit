import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8;
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password, companyName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      include: { organization: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid company name, email or password' });
    }

    // If companyName provided, validate it matches the user's organization (case-insensitive)
    if (companyName && companyName.trim().toLowerCase() !== user.organization.name.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid company name, email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid company name, email or password' });
    }

    const tokenPayload = {
      userId: user.id,
      orgId: user.organizationId,
      orgName: user.organization.name,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    };

    const token = generateToken(tokenPayload);

    return res.json({
      message: 'Login successful',
      token,
      user: tokenPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

export async function registerOrg(req: Request, res: Response) {
  try {
    const { companyName, companyDomain, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ error: 'Company Name, Admin Name, Email, and Password are required' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'User email is already registered' });
    }

    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 1. Create Organization
    const org = await prisma.organization.create({
      data: {
        name: companyName,
        slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
        domain: companyDomain || null,
        plan: 'Enterprise'
      }
    });

    // 2. Create Admin User for new Organization
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'ADMIN',
        department: 'Executive'
      }
    });

    // 3. Log initial audit event
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        userRole: 'ADMIN',
        action: 'ORGANIZATION_CREATED',
        details: `Organization ${org.name} registered by ${user.name}`
      }
    });

    const tokenPayload = {
      userId: user.id,
      orgId: org.id,
      orgName: org.name,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    };

    const token = generateToken(tokenPayload);

    return res.status(201).json({
      message: 'Company registered successfully',
      token,
      user: tokenPayload
    });
  } catch (error) {
    console.error('registerOrg error:', error);
    return res.status(500).json({ error: 'Failed to onboard new company' });
  }
}

export async function getMe(req: Request & { user?: any }, res: Response) {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        userId: user.id,
        orgId: user.organizationId,
        orgName: user.organization.name,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
}
