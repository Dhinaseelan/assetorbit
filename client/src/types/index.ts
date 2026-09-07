export type Role = 'ADMIN' | 'IT_DEPT' | 'HR_DEPT' | 'MANAGER' | 'EMPLOYEE';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  plan: string;
}

export interface User {
  id: string;
  userId?: string;
  orgId: string;
  orgName: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  createdAt?: string;
  _count?: {
    assignments: number;
  };
}

export type AssetCategory = 'Laptop' | 'Desktop' | 'Monitor' | 'Mobile' | 'Software' | 'Furniture' | 'Peripherals' | 'Server';
export type AssetStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Retired';
export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface Asset {
  id: string;
  organizationId: string;
  assetTag: string;
  name: string;
  serialNumber: string;
  category: AssetCategory;
  status: AssetStatus;
  condition: AssetCondition;
  location: string;
  purchaseDate: string;
  purchaseCost: number;
  expectedYears: number;
  warrantyExpiry: string;
  qrCodeUrl?: string;
  currentAssignee?: User | null;
  activeAssignmentId?: string | null;
  assignments?: AssetAssignment[];
  maintenance?: MaintenanceRecord[];
  tickets?: Ticket[];
  auditLogs?: AuditLog[];
  _count?: {
    maintenance: number;
    tickets: number;
  };
  createdAt: string;
}

export interface AssetAssignment {
  id: string;
  organizationId: string;
  assetId: string;
  userId: string;
  assignedBy: string;
  assignmentDate: string;
  returnDate?: string | null;
  notes?: string | null;
  asset?: Asset;
  user?: User;
}

export interface MaintenanceRecord {
  id: string;
  organizationId: string;
  assetId: string;
  performedBy: string;
  serviceDate: string;
  description: string;
  cost: number;
  status: 'Scheduled' | 'In_Progress' | 'Completed';
  asset?: Asset;
}

export interface Ticket {
  id: string;
  organizationId: string;
  assetId: string;
  userId: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In_Progress' | 'Resolved';
  createdAt: string;
  asset?: Asset;
  user?: User;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  assetId?: string | null;
  userId: string;
  userRole: string;
  action: string;
  details: string;
  createdAt: string;
  asset?: {
    id: string;
    assetTag: string;
    name: string;
  } | null;
}

export interface DashboardStats {
  organization: {
    id: string;
    name: string;
  };
  summary: {
    totalAssets: number;
    availableAssets: number;
    assignedAssets: number;
    maintenanceAssets: number;
    retiredAssets: number;
    totalPurchaseValue: number;
    currentBookValue: number;
    openTicketsCount: number;
    totalMaintenanceSpend: number;
  };
  statusStats: Array<{ status: string; count: number; color: string }>;
  categoryStats: Array<{ category: string; count: number; totalCost: number }>;
  expiringWarranties: Asset[];
  recentActivity: AuditLog[];
}
