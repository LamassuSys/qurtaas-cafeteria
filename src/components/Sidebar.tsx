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
import { useI18n, type TKey } from "@/data/i18nStore";

export type Page =
  | "dashboard" | "sales" | "reports" | "analytics"
  | "predictions" | "drawbacks" | "marketing" | "inventory"
  | "users" | "menu" | "pos" | "orders" | "barista_kds";

const ALL_NAV: { id: Page; labelKey: TKey; icon: LucideIcon }[] = [
  { id: "dashboard",   labelKey: "nav_dashboard",   icon: LayoutDashboard },
  { id: "pos",         labelKey: "nav_pos",         icon: MonitorSmartphone },
  { id: "orders",      labelKey: "nav_orders",      icon: ClipboardList },
  { id: "barista_kds", labelKey: "nav_barista_kds", icon: ChefHat },
  { id: "sales",       labelKey: "nav_sales",       icon: ShoppingCart },
  { id: "reports",     labelKey: "nav_reports",     icon: BarChart3 },
  { id: "analytics",   labelKey: "nav_analytics",   icon: TrendingUp },
  { id: "predictions", labelKey: "nav_predictions", icon: Brain },
  { id: "drawbacks",   labelKey: "nav_drawbacks",   icon: AlertTriangle },
  { id: "marketing",   labelKey: "nav_marketing",   icon: Megaphone },
  { id: "inventory",   labelKey: "nav_inventory",   icon: Package },
  { id: "users",       labelKey: "nav_users",       icon: Users },
  { id: "menu",        labelKey: "nav_menu",        icon: UtensilsCrossed },
];

interface SidebarProps {
  current: Page;
  onNavigate: (p: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ current, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useI18n();
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
        {navItems.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            title={collapsed ? t(labelKey) : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              current === id
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent",
              collapsed && "justify-center"
            )}
          >
            <Icon size={17} className="shrink-0" />
            {!collapsed && <span>{t(labelKey)}</span>}
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
