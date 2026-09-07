import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting multi-tenant database seed...');

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.assetAssignment.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // Helper to generate QR data URL
  const genQR = async (orgSlug: string, tag: string, sn: string) => {
    try {
      return await QRCode.toDataURL(`Assetorbit:${orgSlug}:${tag}:${sn}`);
    } catch (e) {
      return '';
    }
  };

  // ==========================================
  // COMPANY 1: Acme Corporation
  // ==========================================
  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      domain: 'acme.com',
      plan: 'Enterprise'
    }
  });

  const acmeAdmin = await prisma.user.create({
    data: {
      organizationId: acme.id,
      name: 'Kadiravan (Acme Admin)',
      email: 'admin@acme.com',
      passwordHash,
      role: 'ADMIN',
      department: 'Executive'
    }
  });

  const acmeIT = await prisma.user.create({
    data: {
      organizationId: acme.id,
      name: 'Alex Vance (Acme IT)',
      email: 'it@acme.com',
      passwordHash,
      role: 'IT_DEPT',
      department: 'IT Support'
    }
  });

  const acmeHR = await prisma.user.create({
    data: {
      organizationId: acme.id,
      name: 'Sarah Jenkins (Acme HR)',
      email: 'hr@acme.com',
      passwordHash,
      role: 'HR_DEPT',
      department: 'Human Resources'
    }
  });

  const acmeManager = await prisma.user.create({
    data: {
      organizationId: acme.id,
      name: 'Marcus Brody (Acme Manager)',
      email: 'manager@acme.com',
      passwordHash,
      role: 'MANAGER',
      department: 'Engineering'
    }
  });

  const acmeEmp = await prisma.user.create({
    data: {
      organizationId: acme.id,
      name: 'Elena Rostova (Acme)',
      email: 'employee@acme.com',
      passwordHash,
      role: 'EMPLOYEE',
      department: 'Engineering'
    }
  });

  // Acme Assets
  const acmeAssetsData = [
    {
      assetTag: 'AST-1001',
      name: 'MacBook Pro 16" M3 Max',
      serialNumber: 'ACME-C02G1234',
      category: 'Laptop',
      status: 'Assigned',
      condition: 'Excellent',
      location: 'Acme HQ - Floor 4',
      purchaseDate: new Date('2025-01-15'),
      purchaseCost: 3499.00,
      expectedYears: 4,
      warrantyExpiry: new Date('2028-01-15')
    },
    {
      assetTag: 'AST-1002',
      name: 'Dell UltraSharp 32" 4K Monitor',
      serialNumber: 'ACME-CN-098765',
      category: 'Monitor',
      status: 'Assigned',
      condition: 'Good',
      location: 'Acme HQ - Floor 4',
      purchaseDate: new Date('2024-06-10'),
      purchaseCost: 799.50,
      expectedYears: 5,
      warrantyExpiry: new Date('2026-08-15') // Expiring soon!
    },
    {
      assetTag: 'AST-1003',
      name: 'ThinkPad X1 Carbon Gen 11',
      serialNumber: 'ACME-TP-39482',
      category: 'Laptop',
      status: 'Maintenance',
      condition: 'Fair',
      location: 'IT Repair Bay',
      purchaseDate: new Date('2023-11-01'),
      purchaseCost: 1850.00,
      expectedYears: 3,
      warrantyExpiry: new Date('2026-11-01')
    },
    {
      assetTag: 'AST-1004',
      name: 'Herman Miller Embody Chair',
      serialNumber: 'ACME-HM-EMB-88392',
      category: 'Furniture',
      status: 'Available',
      condition: 'Excellent',
      location: 'Acme Storage B',
      purchaseDate: new Date('2025-03-01'),
      purchaseCost: 1695.00,
      expectedYears: 10,
      warrantyExpiry: new Date('2035-03-01')
    }
  ];

  for (const item of acmeAssetsData) {
    const qrCodeUrl = await genQR(acme.slug, item.assetTag, item.serialNumber);
    const asset = await prisma.asset.create({
      data: {
        organizationId: acme.id,
        ...item,
        qrCodeUrl
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: acme.id,
        assetId: asset.id,
        userId: acmeAdmin.id,
        userRole: 'ADMIN',
        action: 'ASSET_CREATED',
        details: `Initial creation of asset ${asset.assetTag} (${asset.name}) for Acme Corporation`
      }
    });

    if (item.assetTag === 'AST-1001') {
      await prisma.assetAssignment.create({
        data: {
          organizationId: acme.id,
          assetId: asset.id,
          userId: acmeEmp.id,
          assignedBy: acmeHR.name,
          notes: 'Issued during engineering onboarding.'
        }
      });
    }
  }

  console.log('✅ Acme Corporation tenant created with assets');

  // ==========================================
  // COMPANY 2: Stark Industries
  // ==========================================
  const stark = await prisma.organization.create({
    data: {
      name: 'Stark Industries',
      slug: 'stark-tech',
      domain: 'starktech.com',
      plan: 'Enterprise'
    }
  });

  const starkAdmin = await prisma.user.create({
    data: {
      organizationId: stark.id,
      name: 'Tony Stark (Stark Admin)',
      email: 'tony@starktech.com',
      passwordHash,
      role: 'ADMIN',
      department: 'R&D'
    }
  });

  const starkIT = await prisma.user.create({
    data: {
      organizationId: stark.id,
      name: 'F.R.I.D.A.Y. (Stark IT)',
      email: 'friday@starktech.com',
      passwordHash,
      role: 'IT_DEPT',
      department: 'Artificial Intelligence'
    }
  });

  const starkEmp = await prisma.user.create({
    data: {
      organizationId: stark.id,
      name: 'Peter Parker (Stark)',
      email: 'peter@starktech.com',
      passwordHash,
      role: 'EMPLOYEE',
      department: 'Applied Physics'
    }
  });

  // Stark Assets
  const starkAssetsData = [
    {
      assetTag: 'STARK-001',
      name: 'Arc Reactor Mark VIII Unit',
      serialNumber: 'STARK-ARC-9900',
      category: 'Server',
      status: 'Assigned',
      condition: 'Excellent',
      location: 'Stark Tower Lab 1',
      purchaseDate: new Date('2025-02-10'),
      purchaseCost: 150000.00,
      expectedYears: 10,
      warrantyExpiry: new Date('2035-02-10')
    },
    {
      assetTag: 'STARK-002',
      name: 'Vibranium-Coated Workstation',
      serialNumber: 'STARK-WS-7711',
      category: 'Desktop',
      status: 'Available',
      condition: 'Excellent',
      location: 'Stark Tower Vault',
      purchaseDate: new Date('2025-04-01'),
      purchaseCost: 12500.00,
      expectedYears: 5,
      warrantyExpiry: new Date('2030-04-01')
    }
  ];

  for (const item of starkAssetsData) {
    const qrCodeUrl = await genQR(stark.slug, item.assetTag, item.serialNumber);
    const asset = await prisma.asset.create({
      data: {
        organizationId: stark.id,
        ...item,
        qrCodeUrl
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId: stark.id,
        assetId: asset.id,
        userId: starkAdmin.id,
        userRole: 'ADMIN',
        action: 'ASSET_CREATED',
        details: `Initial creation of asset ${asset.assetTag} (${asset.name}) for Stark Industries`
      }
    });

    if (item.assetTag === 'STARK-001') {
      await prisma.assetAssignment.create({
        data: {
          organizationId: stark.id,
          assetId: asset.id,
          userId: starkEmp.id,
          assignedBy: starkAdmin.name,
          notes: 'Assigned for Peter Parker high-tech suits.'
        }
      });
    }
  }

  console.log('✅ Stark Industries tenant created with assets');
  console.log('🎉 Multi-tenant database seed completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
