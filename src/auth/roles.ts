export type Role =
  | "super_admin"
  | "admin"
  | "cashier"
  | "accountant"
  | "supply_manager"
  | "barista";

export type PageId =
  | "dashboard" | "sales" | "reports" | "analytics"
  | "predictions" | "drawbacks" | "marketing" | "inventory"
  | "users" | "customers" | "menu" | "pos" | "orders" | "barista_kds";

export interface RoleConfig {
  label: string;
  color: string;
  bg: string;
  pages: PageId[];
  canManageUsers: boolean;
  canManageCustomers: boolean;
  canRecordSales: boolean;
  canViewFinancials: boolean;
  canManageInventory: boolean;
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  super_admin: {
    label: "Super Admin",
    color: "text-red-400",
    bg: "bg-red-500/20 border-red-500/30",
    pages: ["dashboard","pos","orders","sales","reports","analytics","predictions","drawbacks","marketing","inventory","users","customers","menu","barista_kds"],
    canManageUsers: true,
    canManageCustomers: true,
    canRecordSales: true,
    canViewFinancials: true,
    canManageInventory: true,
  },
  admin: {
    label: "Admin",
    color: "text-purple-400",
    bg: "bg-purple-500/20 border-purple-500/30",
    pages: ["dashboard","pos","orders","sales","reports","analytics","predictions","drawbacks","marketing","inventory","customers","barista_kds"],
    canManageUsers: false,
    canManageCustomers: true,
    canRecordSales: true,
    canViewFinancials: true,
    canManageInventory: true,
  },
  cashier: {
    label: "Cashier",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/30",
    pages: ["dashboard","pos","orders"],
    canManageUsers: false,
    canManageCustomers: false,
    canRecordSales: true,
    canViewFinancials: false,
    canManageInventory: false,
  },
  accountant: {
    label: "Accountant",
    color: "text-blue-400",
    bg: "bg-blue-500/20 border-blue-500/30",
    pages: ["dashboard","orders","reports","analytics","predictions"],
    canManageUsers: false,
    canManageCustomers: false,
    canRecordSales: false,
    canViewFinancials: true,
    canManageInventory: false,
  },
  supply_manager: {
    label: "Supply Manager",
    color: "text-amber-400",
    bg: "bg-amber-500/20 border-amber-500/30",
    pages: ["dashboard","inventory","analytics"],
    canManageUsers: false,
    canManageCustomers: false,
    canRecordSales: false,
    canViewFinancials: false,
    canManageInventory: true,
  },
  barista: {
    label: "Barista",
    color: "text-orange-400",
    bg: "bg-orange-500/20 border-orange-500/30",
    pages: ["orders","barista_kds"],
    canManageUsers: false,
    canManageCustomers: false,
    canRecordSales: false,
    canViewFinancials: false,
    canManageInventory: false,
  },
};

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Default users seeded into localStorage
export const DEFAULT_USERS: AppUser[] = [
  { id: "1", username: "super_admin",   fullName: "Ammar Kamel",       role: "super_admin",   active: true, createdAt: "2026-01-01" },
  { id: "2", username: "admin",         fullName: "Sara Hassan",        role: "admin",         active: true, createdAt: "2026-01-05" },
  { id: "3", username: "cashier1",      fullName: "Mohamed Ali",        role: "cashier",       active: true, createdAt: "2026-02-01" },
  { id: "4", username: "cashier2",      fullName: "Nour Ibrahim",       role: "cashier",       active: true, createdAt: "2026-02-10" },
  { id: "5", username: "accountant1",   fullName: "Layla Mahmoud",      role: "accountant",    active: true, createdAt: "2026-01-15" },
  { id: "6", username: "supply1",       fullName: "Khaled Samir",       role: "supply_manager",active: true, createdAt: "2026-01-20" },
  { id: "7", username: "barista1",      fullName: "Hana Yousef",        role: "barista",       active: true, createdAt: "2026-01-22" },
];

// Passwords stored separately (in real app: hashed in DB)
export const DEFAULT_PASSWORDS: Record<string, string> = {
  super_admin:  "Admin@1234",
  admin:        "Admin@1234",
  cashier1:     "Cashier@1234",
  cashier2:     "Cashier@1234",
  accountant1:  "Acct@1234",
  supply1:      "Supply@1234",
  barista1:     "Barista@1234",
};
