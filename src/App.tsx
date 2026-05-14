import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
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
};

function AppInner() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");

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

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
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
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
