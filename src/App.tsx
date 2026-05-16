import { useState, useEffect } from "react";
import { CustomerPortal } from "@/pages/CustomerPortal";
import { CustomerDashboard } from "@/pages/CustomerDashboard";
import { LandingPage } from "@/pages/LandingPage";
import { supabase } from "@/lib/supabase";
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
import { Customers } from "@/pages/Customers";
import { OrdersProvider } from "@/data/ordersStore";
import { InventoryProvider } from "@/data/inventoryStore";
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
  customers:   <Customers />,
};

function AppInner({ onBackToHome }: { onBackToHome?: () => void }) {
  const { user, initialized } = useAuth();
  const { isRTL } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");

  // ALL hooks must come before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (user) {
      const config = ROLE_CONFIG[user.role];
      if (!config) return; // unknown role — don't crash, Login will handle logout
      const allowed = config.pages;
      if (!allowed.includes(page)) setPage(allowed[0] as Page);
    }
  }, [user]);

  // Show a centered spinner while Supabase completes the first user load
  if (!initialized) {
    return (
      <div className="h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Connecting to database…</p>
      </div>
    );
  }

  if (!user) return <Login onBack={onBackToHome} />;

  // Guard: if the role from DB is unrecognised, treat as logged-out
  if (!ROLE_CONFIG[user.role]) return <Login />;

  const allowed = ROLE_CONFIG[user.role].pages;

  const navigate = (p: Page) => {
    if (allowed.includes(p)) setPage(p);
  };

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

// ── Standalone customer login → dashboard ─────────────────────
function CustomerRoute() {
  const [session, setSession] = useState<{ id: string; name: string } | null>(() => {
    try {
      const raw = localStorage.getItem("ink_customer_session");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [phone, setPhone]   = useState("");
  const [pin, setPin]       = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const C = { bg: "#07111f", surface: "#0d1e3c", border: "rgba(26,58,110,0.4)", text: "#e8f0ff", muted: "#6b83a8", gold: "#f5a800", goldDark: "#e09600", goldBorder: "rgba(245,168,0,0.25)" };

  const handleLogin = async () => {
    if (!phone.trim() || !pin.trim()) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await supabase.from("customers").select("id, name").eq("phone", phone.trim()).eq("pin", pin.trim()).single();
      if (!data) { setError("Invalid phone or PIN"); return; }
      const row = data as Record<string, unknown>;
      const s = { id: row.id as string, name: row.name as string };
      localStorage.setItem("ink_customer_session", JSON.stringify(s));
      setSession(s);
    } catch { setError("Login failed. Please try again."); }
    finally { setLoading(false); }
  };

  if (session) {
    return (
      <CustomerDashboard
        customerId={session.id}
        initialName={session.name}
        onBack={() => {
          localStorage.removeItem("ink_customer_session");
          setSession(null);
          setPhone(""); setPin("");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: C.bg, color: C.text }}>
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Qurtaas" className="w-20 h-20 object-contain mx-auto mb-4"
            onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
          <h1 className="text-2xl font-black" style={{ color: C.gold }}>My Account</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Sign in to view your dashboard</p>
        </div>
        <div className="space-y-3">
          <input
            type="tel" placeholder="Phone number" value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full h-12 px-4 rounded-xl text-base outline-none"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          />
          <input
            type="password" placeholder="4-digit PIN" value={pin} maxLength={4}
            onChange={e => setPin(e.target.value.slice(0, 4))}
            className="w-full h-12 px-4 rounded-xl text-base text-center tracking-[0.4em] outline-none"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleLogin} disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: C.gold, color: C.bg }}
            onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
          >
            {loading && <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />}
            Sign In
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="w-full py-3 rounded-2xl text-sm transition-colors"
            style={{ color: C.muted }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

// ── URL-based router: /table/:n → CustomerPortal, /customer → CustomerRoute, else landing or staff app ──
function Router() {
  const [mode, setMode] = useState<"landing" | "staff">("landing");
  const path = window.location.pathname;
  const tableMatch = path.match(/^\/table\/(\d+)$/);
  if (tableMatch) return <CustomerPortal tableNumber={parseInt(tableMatch[1])} />;
  if (path === "/customer") return <CustomerRoute />;
  if (mode === "staff") return <AppInner onBackToHome={() => setMode("landing")} />;
  return <LandingPage onStaffLogin={() => setMode("staff")} />;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <MenuProvider>
          <OrdersProvider>
            <InventoryProvider>
              <Router />
            </InventoryProvider>
          </OrdersProvider>
        </MenuProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
