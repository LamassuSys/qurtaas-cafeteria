import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, ShoppingCart, BarChart3, TrendingUp,
  Brain, AlertTriangle, Megaphone, Package, ChevronLeft,
  ChevronRight, Users, UtensilsCrossed, MonitorSmartphone,
  ClipboardList, ChefHat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoFull } from "@/components/Logo";
import { ROLE_CONFIG } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";

export type Page =
  | "dashboard" | "sales" | "reports" | "analytics"
  | "predictions" | "drawbacks" | "marketing" | "inventory"
  | "users" | "menu" | "pos" | "orders" | "barista_kds";

const ALL_NAV: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: "dashboard",   label: "Dashboard",     icon: LayoutDashboard },
  { id: "pos",         label: "POS / Order",   icon: MonitorSmartphone },
  { id: "orders",      label: "Orders",        icon: ClipboardList },
  { id: "barista_kds", label: "Kitchen Display", icon: ChefHat },
  { id: "sales",       label: "Sales Tracker", icon: ShoppingCart },
  { id: "reports",     label: "Reports",       icon: BarChart3 },
  { id: "analytics",   label: "Analytics",     icon: TrendingUp },
  { id: "predictions", label: "Predictions",   icon: Brain },
  { id: "drawbacks",   label: "Drawbacks",     icon: AlertTriangle },
  { id: "marketing",   label: "Marketing",     icon: Megaphone },
  { id: "inventory",   label: "Inventory",     icon: Package },
  { id: "users",       label: "Users",         icon: Users },
  { id: "menu",        label: "Menu Manager",  icon: UtensilsCrossed },
];

interface SidebarProps {
  current: Page;
  onNavigate: (p: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ current, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const allowedPages = user ? ROLE_CONFIG[user.role].pages : [];
  const navItems = ALL_NAV.filter(item => allowedPages.includes(item.id));

  return (
    <aside className={cn(
      "flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center border-b border-gray-800 transition-all", collapsed ? "px-3 py-4 justify-center" : "px-4 py-4")}>
        <LogoFull collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            title={collapsed ? label : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              current === id
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent",
              collapsed && "justify-center"
            )}
          >
            <Icon size={17} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
            {!collapsed && (id === "users" || id === "menu") && (
              <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5 font-bold">SA</span>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center p-3 border-t border-gray-800 text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors"
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </aside>
  );
}
