import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { MenuProvider } from "@/data/menuStore";
import { ROLE_CONFIG } from "@/auth/roles";
import { Sidebar } from "@/components/Sidebar";
import type { Page } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { SalesTracker } from "@/pages/SalesTracker";
import { Reports } from "@/pages/Reports";
import { Analytics } from "@/pages/Analytics";
import { Predictions } from "@/pages/Predictions";
import { Drawbacks } from "@/pages/Drawbacks";
import { Marketing } from "@/pages/Marketing";
import { Inventory } from "@/pages/Inventory";
import { UserManagement } from "@/pages/UserManagement";
import { MenuManager } from "@/pages/MenuManager";
import { POSCashier } from "@/pages/POSCashier";
import { Orders } from "@/pages/Orders";
import { BaristaKDS } from "@/pages/BaristaKDS";
import { OrdersProvider } from "@/data/ordersStore";
import { I18nProvider, useI18n } from "@/data/i18nStore";

const PAGE_MAP: Record<Page, React.ReactNode> = {
  dashboard:   <Dashboard />,
  sales:       <SalesTracker />,
  reports:     <Reports />,
  analytics:   <Analytics />,
  predictions: <Predictions />,
  drawbacks:   <Drawbacks />,
  marketing:   <Marketing />,
  inventory:   <Inventory />,
  users:       <UserManagement />,
  menu:        <MenuManager />,
  pos:         <POSCashier />,
  orders:      <Orders />,
  barista_kds: <BaristaKDS />,
};

function AppInner() {
  const { user, initialized } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");

  // Show a centered spinner while Supabase completes the first user load
  if (!initialized) {
    return (
      <div className="h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Connecting to database…</p>
      </div>
    );
  }

  // When user logs in, set page to their first allowed page
  useEffect(() => {
    if (user) {
      const allowed = ROLE_CONFIG[user.role].pages;
      if (!allowed.includes(page)) setPage(allowed[0] as Page);
    }
  }, [user]);

  if (!user) return <Login />;

  const allowed = ROLE_CONFIG[user.role].pages;

  const navigate = (p: Page) => {
    if (allowed.includes(p)) setPage(p);
  };

  const { isRTL } = useI18n();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden" style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <Sidebar current={page} onNavigate={navigate} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar page={page} />
        <main className="flex-1 overflow-y-auto">
          {PAGE_MAP[page]}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <MenuProvider>
          <OrdersProvider>
            <AppInner />
          </OrdersProvider>
        </MenuProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
