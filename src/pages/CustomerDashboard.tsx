import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useOrders, type Order, type OrderItem } from "@/data/ordersStore";
import { useMenu } from "@/data/menuStore";
import {
  ArrowLeft, Home, Star, TrendingUp, ShoppingBag,
  Clock, ChefHat, Bell, CheckCircle, XCircle,
  Trophy, Zap, History, RefreshCw,
  UtensilsCrossed, Plus, Minus, Loader2, Hash,
  Wallet, Gift, ArrowDownCircle, ArrowUpCircle, AlertTriangle, X,
} from "lucide-react";

// ── Brand tokens ───────────────────────────────────────────────
const C = {
  bg:        "#07111f",
  surface:   "#0d1e3c",
  elevated:  "#112447",
  border:    "rgba(26,58,110,0.4)",
  borderHi:  "rgba(245,168,0,0.35)",
  text:      "#e8f0ff",
  muted:     "#6b83a8",
  faint:     "#344f72",
  gold:      "#f5a800",
  goldDark:  "#e09600",
  goldDim:   "rgba(245,168,0,0.12)",
  goldBorder:"rgba(245,168,0,0.25)",
};

// ── Tier config ────────────────────────────────────────────────
const TIER_CONFIG: Record<string, {
  label: string; emoji: string; color: string;
  bg: string; border: string;
  nextAt: number | null; nextLabel: string | null;
}> = {
  bronze:   {
    label: "Bronze",   emoji: "🥉", color: "#cd7f32",
    bg: "rgba(205,127,50,0.12)",  border: "rgba(205,127,50,0.35)",
    nextAt: 50000,   nextLabel: "Silver",
  },
  silver:   {
    label: "Silver",   emoji: "🥈", color: "#9fb3c8",
    bg: "rgba(159,179,200,0.12)", border: "rgba(159,179,200,0.35)",
    nextAt: 150000,  nextLabel: "Gold",
  },
  gold:     {
    label: "Gold",     emoji: "🥇", color: "#f5a800",
    bg: "rgba(245,168,0,0.12)",   border: "rgba(245,168,0,0.35)",
    nextAt: 300000,  nextLabel: "Platinum",
  },
  platinum: {
    label: "Platinum", emoji: "💎", color: "#c084fc",
    bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.35)",
    nextAt: null,    nextLabel: null,
  },
};

// ── Formatters ─────────────────────────────────────────────────
const fmt = (n: number) => `${n.toLocaleString("en-IQ")} IQD`;
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

// ── Order status display ───────────────────────────────────────
const STATUS_META: Record<string, { icon: React.ReactNode; label: string; color: string; barColor: string }> = {
  pending:   { icon: <Clock size={14} />,       label: "Pending",    color: "#f5a800", barColor: "#f5a800" },
  preparing: { icon: <ChefHat size={14} />,     label: "Preparing",  color: "#60a5fa", barColor: "#3b82f6" },
  ready:     { icon: <Bell size={14} />,         label: "Ready! 🔔", color: "#34d399", barColor: "#10b981" },
  completed: { icon: <CheckCircle size={14} />, label: "Completed",  color: "#6b83a8", barColor: "#344f72" },
  cancelled: { icon: <XCircle size={14} />,     label: "Cancelled",  color: "#f87171", barColor: "#ef4444" },
};
const STATUS_STEPS = ["pending", "preparing", "ready", "completed"] as const;

// ── Customer profile type ──────────────────────────────────────
interface CustomerProfile {
  name:          string;
  phone:         string;
  tier:          string;
  points:        number;
  totalSpent:    number;
  walletBalance: number;
}

// ── Wallet transaction type ────────────────────────────────────
interface WalletTx {
  id:          string;
  amount:      number;
  type:        "credit" | "debit";
  source:      string;
  referenceId: string | null;
  note:        string | null;
  createdAt:   string;
}

// ── Notification toast type ────────────────────────────────────
interface Toast {
  id: string;
  message: string;
  color: string;
  icon: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════
export function CustomerDashboard({
  customerId,
  initialName,
  tableNumber: initialTableNumber,
  onBack,
}: {
  customerId:   string;
  initialName:  string;
  tableNumber?: number;
  onBack:       () => void;
}) {
  const { orders, createOrder } = useOrders();
  const { items, categories, loading: menuLoading } = useMenu();

  const [tab, setTab]               = useState<"account" | "menu" | "wallet">("account");
  const [profile, setProfile]       = useState<CustomerProfile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const prevStatusRef               = useRef<Record<string, string>>({});

  // Wallet state
  const [walletTxs,     setWalletTxs]     = useState<WalletTx[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [redeemOpen,    setRedeemOpen]    = useState(false);
  const [redeemCode,    setRedeemCode]    = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError,   setRedeemError]   = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");

  // ── Menu / ordering state ──────────────────────────────────
  const [tableNumber, setTableNumber] = useState<number | undefined>(initialTableNumber);
  const [tableInput,  setTableInput]  = useState("");
  const [catFilter,   setCatFilter]   = useState("__all__");
  const [cart,        setCart]        = useState<OrderItem[]>([]);
  const [showCart,    setShowCart]    = useState(false);
  const [orderNotes,  setOrderNotes]  = useState("");
  const [placing,     setPlacing]     = useState(false);
  const [orderedId,   setOrderedId]   = useState<string | null>(null);

  // My orders (filtered by customerId from the global store)
  const myOrders = orders.filter(o => o.customerId === customerId);
  const activeOrders  = myOrders.filter(o => !["completed", "cancelled"].includes(o.status));
  const historyOrders = myOrders.filter(o => ["completed", "cancelled"].includes(o.status));

  // ── Fetch customer profile ─────────────────────────────────
  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("customers")
        .select("name, phone, membership_tier, points, total_spent, wallet_balance")
        .eq("id", customerId)
        .single();
      if (data) {
        const r = data as Record<string, unknown>;
        setProfile({
          name:          r.name            as string,
          phone:         r.phone           as string,
          tier:          r.membership_tier as string,
          points:        Number(r.points),
          totalSpent:    Number(r.total_spent),
          walletBalance: Number(r.wallet_balance ?? 0),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch wallet transactions ──────────────────────────────
  const fetchWalletTxs = useCallback(async () => {
    setWalletLoading(true);
    try {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        setWalletTxs(data.map((r: Record<string, unknown>) => ({
          id:          r.id           as string,
          amount:      Number(r.amount),
          type:        r.type         as "credit" | "debit",
          source:      r.source       as string,
          referenceId: r.reference_id as string | null,
          note:        r.note         as string | null,
          createdAt:   r.created_at   as string,
        })));
      }
    } finally {
      setWalletLoading(false);
    }
  }, [customerId]);

  // ── Redeem gift card ───────────────────────────────────────
  const handleRedeem = async () => {
    const code = redeemCode.trim().toUpperCase();
    if (!code) { setRedeemError("Enter a gift card code"); return; }
    setRedeemLoading(true); setRedeemError(""); setRedeemSuccess("");
    try {
      // 1. Look up gift card
      const { data: card, error: cardErr } = await supabase
        .from("gift_cards")
        .select("*")
        .eq("code", code)
        .single();

      if (cardErr || !card) { setRedeemError("Gift card code not found."); return; }
      const gc = card as Record<string, unknown>;

      if (gc.status !== "active")  { setRedeemError("This gift card is no longer active."); return; }
      if (Number(gc.balance) <= 0) { setRedeemError("This gift card has no remaining balance."); return; }
      if (gc.expires_at && new Date(gc.expires_at as string) < new Date()) {
        setRedeemError("This gift card has expired."); return;
      }

      const amount = Number(gc.balance);

      // 2. Credit wallet + mark card as used (in parallel)
      const [walletRes, cardRes] = await Promise.all([
        supabase.rpc
          ? supabase.from("customers").update({ wallet_balance: (profile?.walletBalance ?? 0) + amount }).eq("id", customerId)
          : supabase.from("customers").update({ wallet_balance: (profile?.walletBalance ?? 0) + amount }).eq("id", customerId),
        supabase.from("gift_cards").update({
          status:      "used",
          balance:     0,
          redeemed_by: customerId,
          redeemed_at: new Date().toISOString(),
        }).eq("id", gc.id as string),
      ]);

      if (walletRes.error) { setRedeemError(walletRes.error.message); return; }
      if (cardRes.error)   { setRedeemError(cardRes.error.message);   return; }

      // 3. Log transaction
      await supabase.from("wallet_transactions").insert({
        customer_id:  customerId,
        amount,
        type:         "credit",
        source:       "gift_card",
        reference_id: gc.id as string,
        note:         `Gift card ${code} redeemed`,
        created_by:   profile?.name ?? "customer",
      });

      // 4. Update local state & show success
      setProfile(prev => prev ? { ...prev, walletBalance: prev.walletBalance + amount } : prev);
      fetchWalletTxs();
      setRedeemCode("");
      setRedeemSuccess(`✅ ${fmt(amount)} added to your wallet!`);
      setTimeout(() => { setRedeemOpen(false); setRedeemSuccess(""); }, 2500);
    } catch (ex) {
      setRedeemError((ex as Error).message);
    } finally {
      setRedeemLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Real-time: refresh when loyalty trigger updates this customer row
    const ch = supabase.channel(`cust_profile_${customerId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "customers",
        filter: `id=eq.${customerId}`,
      }, fetchProfile)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [customerId]);

  // ── Order status notifications ─────────────────────────────
  useEffect(() => {
    const prev = prevStatusRef.current;
    const current: Record<string, string> = {};

    myOrders.forEach(order => {
      current[order.id] = order.status;
      if (prev[order.id] && prev[order.id] !== order.status) {
        const sm = STATUS_META[order.status];
        const messages: Record<string, string> = {
          preparing: `Order #${order.orderNumber} is being prepared 👨‍🍳`,
          ready:     `Order #${order.orderNumber} is ready — come get it! 🔔`,
          completed: `Order #${order.orderNumber} complete. Enjoy! ✅`,
          cancelled: `Order #${order.orderNumber} was cancelled.`,
        };
        const msg = messages[order.status];
        if (msg && sm) {
          const toastId = `${order.id}-${order.status}`;
          const toast: Toast = {
            id: toastId,
            message: msg,
            color: sm.color,
            icon: sm.icon,
          };
          setToasts(t => [toast, ...t].slice(0, 5));
          setTimeout(() => setToasts(t => t.filter(x => x.id !== toastId)), 6000);
        }
      }
    });

    prevStatusRef.current = { ...prev, ...current };
  }, [myOrders.map(o => `${o.id}:${o.status}`).join("|")]);

  const dismissToast = (id: string) => setToasts(t => t.filter(x => x.id !== id));

  // ── Menu / cart helpers ────────────────────────────────────
  const activeItems   = items.filter(i => i.active);
  const displayItems  = catFilter === "__all__"
    ? activeItems
    : activeItems.filter(i => i.category === catFilter);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (item: typeof activeItems[number]) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item.id);
      if (ex) return prev.map(c => c.menuItemId === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, {
        menuItemId: item.id, name: item.name, emoji: item.emoji,
        category: item.category, price: item.price, cost: item.cost, qty: 1,
      }];
    });
  };
  const changeQty = (id: string, delta: number) =>
    setCart(prev => prev.map(c => c.menuItemId === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));

  const placeOrder = async () => {
    if (!cart.length || !tableNumber) return;
    setPlacing(true);
    try {
      const order = await createOrder(
        cart, profile?.name ?? initialName, orderNotes,
        `table-${tableNumber}`, tableNumber, customerId,
      );
      setOrderedId(order.id);
      setCart([]); setOrderNotes(""); setShowCart(false);
      setTab("account");
      // Show a toast confirming placement
      const t: Toast = {
        id: `placed-${order.id}`,
        message: `Order #${order.orderNumber} placed! We'll notify you when it's ready. 🎉`,
        color: C.gold,
        icon: <CheckCircle size={14} />,
      };
      setToasts(prev => [t, ...prev].slice(0, 5));
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 8000);
    } catch (e) { console.error(e); }
    finally { setPlacing(false); }
  };

  // ── Tier calc ──────────────────────────────────────────────
  const tier = profile ? (TIER_CONFIG[profile.tier] ?? TIER_CONFIG.bronze) : TIER_CONFIG.bronze;
  const tierSpent = profile?.totalSpent ?? 0;

  let tierMin = 0;
  let tierMax = tier.nextAt ?? tierSpent;
  if (tier.nextAt === null) { tierMin = 300000; tierMax = 300000; }
  else {
    const tierKeys = ["bronze", "silver", "gold", "platinum"];
    const idx = tierKeys.indexOf(profile?.tier ?? "bronze");
    tierMin = idx === 0 ? 0 : [0, 50000, 150000, 300000][idx];
  }
  const tierProgress = tier.nextAt
    ? Math.min(100, Math.round(((tierSpent - tierMin) / (tierMax - tierMin)) * 100))
    : 100;

  // ── Stats ──────────────────────────────────────────────────
  const totalOrders  = myOrders.length;
  const pointsValue  = profile?.points ?? 0;   // 1 point = 1 IQD redeemable
  const completedOrders = historyOrders.filter(o => o.status === "completed");
  const avgOrderValue = completedOrders.length
    ? Math.round(completedOrders.reduce((s, o) => s + o.total, 0) / completedOrders.length)
    : 0;

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>

      {/* ── Notification toasts ──────────────────────────── */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl pointer-events-auto cursor-pointer"
            style={{ background: C.elevated, border: `1px solid ${toast.color}55` }}
            onClick={() => dismissToast(toast.id)}
          >
            <span style={{ color: toast.color, marginTop: 1 }}>{toast.icon}</span>
            <p className="text-sm flex-1 leading-snug" style={{ color: C.text }}>{toast.message}</p>
          </div>
        ))}
      </div>

      {/* ── Header ──────────────────────────────────────── */}
      <div
        className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 backdrop-blur-md"
        style={{ background: "rgba(7,17,31,0.92)", borderBottom: `1px solid ${C.border}` }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors shrink-0"
          style={{ color: C.muted, border: `1px solid ${C.border}` }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = C.gold;
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.goldBorder;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = C.muted;
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
          }}
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img src="/logo.png" alt="" className="h-7 w-auto shrink-0"
            onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
          <span className="font-bold text-sm truncate" style={{ color: C.text }}>
            {profile?.name ?? initialName}
          </span>
        </div>
        <button
          onClick={() => { window.location.href = "/"; }}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors shrink-0"
          style={{ color: C.muted, border: `1px solid ${C.border}` }}
          title="Home"
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = C.gold;
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.goldBorder;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = C.muted;
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
          }}
        >
          <Home size={15} />
        </button>
      </div>

      {/* ── Tab bar ─────────────────────────────────────── */}
      <div className="flex border-b" style={{ borderColor: C.border, background: C.surface }}>
        {([
          { id: "account", label: "Account",  icon: <Trophy size={14} /> },
          { id: "wallet",  label: "Wallet",   icon: <Wallet size={14} /> },
          { id: "menu",    label: "Order",     icon: <UtensilsCrossed size={14} /> },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === "wallet") fetchWalletTxs();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors"
            style={tab === t.id
              ? { color: C.gold, borderBottom: `2px solid ${C.gold}` }
              : { color: C.muted, borderBottom: "2px solid transparent" }}
          >
            {t.icon} {t.label}
            {t.id === "menu" && cartCount > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                style={{ background: C.gold, color: C.bg }}>{cartCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── ACCOUNT TAB ─────────────────────────────────── */}
      {tab === "account" && (
        <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <RefreshCw size={28} className="animate-spin" style={{ color: C.gold }} />
              <p className="text-sm" style={{ color: C.muted }}>Loading your profile…</p>
            </div>
          ) : (
            <>
              <MembershipCard profile={profile} initialName={initialName} tier={tier} tierProgress={tierProgress} tierSpent={tierSpent} />
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<TrendingUp size={16} />} label="Total Spent"    value={fmt(profile?.totalSpent ?? 0)} color={C.gold} />
                <StatCard icon={<ShoppingBag size={16} />} label="Orders Placed" value={String(totalOrders)}            color="#60a5fa" />
                <StatCard icon={<Zap size={16} />}         label="Points Earned" value={`${(profile?.points ?? 0).toLocaleString()} pts`} sub={`≈ ${fmt(pointsValue)} redeemable`} color="#a78bfa" />
                <StatCard icon={<Star size={16} />}        label="Avg Order"     value={avgOrderValue ? fmt(avgOrderValue) : "—"}           color="#34d399" />
              </div>

              {/* Wallet quick link */}
              <button
                onClick={() => { setTab("wallet"); fetchWalletTxs(); }}
                className="w-full flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98] text-left"
                style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.25)" }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(52,211,153,0.5)")}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(52,211,153,0.25)")}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.12)" }}>
                  <Wallet size={20} style={{ color: "#34d399" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "#34d399" }}>My Wallet</p>
                  <p className="text-xs" style={{ color: C.muted }}>Balance: <strong style={{ color: C.text }}>{fmt(profile?.walletBalance ?? 0)}</strong> — redeem gift cards</p>
                </div>
              </button>

              {/* Quick link to menu */}
              <button
                onClick={() => setTab("menu")}
                className="w-full flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98] text-left"
                style={{ background: C.goldDim, border: `1px solid ${C.goldBorder}` }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = C.gold)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = C.goldBorder)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: C.gold + "22" }}>☕</div>
                <div>
                  <p className="font-bold text-sm" style={{ color: C.gold }}>Browse Menu &amp; Order</p>
                  <p className="text-xs" style={{ color: C.muted }}>View our full menu and place an order from your table</p>
                </div>
              </button>

              {activeOrders.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Active Orders</h2>
                  <div className="space-y-3">{activeOrders.map(o => <ActiveOrderCard key={o.id} order={o} />)}</div>
                </section>
              )}

              {historyOrders.length > 0 && (
                <section>
                  <button onClick={() => setHistoryOpen(o => !o)} className="flex items-center justify-between w-full text-left">
                    <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                      <History size={12} className="inline mr-1.5 -mt-0.5" />Order History ({historyOrders.length})
                    </h2>
                    <span className="text-xs" style={{ color: C.faint }}>{historyOpen ? "▲ hide" : "▼ show"}</span>
                  </button>
                  {historyOpen && (
                    <div className="mt-3 space-y-2">{historyOrders.slice(0, 20).map(o => <HistoryOrderCard key={o.id} order={o} />)}</div>
                  )}
                </section>
              )}

              {myOrders.length === 0 && (
                <div className="py-12 text-center rounded-2xl" style={{ border: `1px dashed ${C.faint}` }}>
                  <ShoppingBag size={32} className="mx-auto mb-3 opacity-25" style={{ color: C.gold }} />
                  <p className="font-semibold" style={{ color: C.text }}>No orders yet</p>
                  <p className="text-sm mt-1" style={{ color: C.muted }}>Browse the menu and place your first order!</p>
                  <button onClick={() => setTab("menu")} className="mt-4 px-5 py-2.5 rounded-full text-sm font-bold transition-all" style={{ background: C.gold, color: C.bg }}>
                    Browse Menu →
                  </button>
                </div>
              )}

              <TierBenefitsCard currentTier={profile?.tier ?? "bronze"} />
            </>
          )}
        </div>
      )}

      {/* ── WALLET TAB ──────────────────────────────────────── */}
      {tab === "wallet" && (
        <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-20">

          {/* Balance card */}
          <div className="rounded-3xl p-6 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(16,185,129,0.08) 100%)", border: "1px solid rgba(52,211,153,0.3)" }}>
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)" }} />
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#34d399" }}>
              <Wallet size={11} className="inline mr-1 -mt-0.5" />Wallet Balance
            </p>
            <p className="text-4xl font-black mb-1" style={{ color: C.text }}>
              {fmt(profile?.walletBalance ?? 0)}
            </p>
            <p className="text-xs" style={{ color: C.muted }}>Use your balance to pay for orders at the counter</p>

            <button
              onClick={() => { setRedeemOpen(true); setRedeemCode(""); setRedeemError(""); setRedeemSuccess(""); }}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.97]"
              style={{ background: "#34d399", color: C.bg }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "#10b981")}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "#34d399")}
            >
              <Gift size={15} /> Redeem Gift Card
            </button>
          </div>

          {/* How it works */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>How it works</p>
            {[
              { icon: "🎁", text: "Receive a gift card code from Qurtaas or as a gift" },
              { icon: "✏️", text: "Tap Redeem Gift Card and enter the code" },
              { icon: "💳", text: "The card's full value is instantly added to your wallet" },
              { icon: "☕", text: "Tell the cashier to use your wallet balance when you order" },
            ].map(s => (
              <div key={s.text} className="flex items-center gap-3 text-sm" style={{ color: C.text }}>
                <span className="text-lg shrink-0">{s.icon}</span>
                <span style={{ color: C.muted }}>{s.text}</span>
              </div>
            ))}
          </div>

          {/* Transaction history */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.muted }}>
              Transaction History
            </p>

            {walletLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={20} className="animate-spin" style={{ color: C.muted }} />
              </div>
            ) : walletTxs.length === 0 ? (
              <div className="py-10 text-center rounded-2xl" style={{ border: `1px dashed ${C.faint}` }}>
                <Wallet size={28} className="mx-auto mb-3 opacity-25" style={{ color: "#34d399" }} />
                <p className="text-sm" style={{ color: C.muted }}>No transactions yet</p>
                <p className="text-xs mt-1" style={{ color: C.faint }}>Redeem a gift card to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {walletTxs.map(tx => {
                  const isCredit = tx.type === "credit";
                  const sourceLabel: Record<string, string> = {
                    gift_card:     "Gift Card",
                    order_payment: "Order Payment",
                    manual:        "Manual Adjustment",
                    refund:        "Refund",
                  };
                  return (
                    <div key={tx.id} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isCredit ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)" }}>
                        {isCredit
                          ? <ArrowDownCircle size={18} style={{ color: "#34d399" }} />
                          : <ArrowUpCircle   size={18} style={{ color: "#f87171" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: C.text }}>
                          {sourceLabel[tx.source] ?? tx.source}
                        </p>
                        <p className="text-xs truncate" style={{ color: C.muted }}>
                          {tx.note ?? "—"} · {fmtDate(tx.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm font-black shrink-0"
                        style={{ color: isCredit ? "#34d399" : "#f87171" }}>
                        {isCredit ? "+" : "−"}{fmt(Math.abs(tx.amount))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REDEEM MODAL ─────────────────────────────────────── */}
      {redeemOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <Gift size={16} style={{ color: "#34d399" }} />
                <span className="font-bold" style={{ color: C.text }}>Redeem Gift Card</span>
              </div>
              <button onClick={() => setRedeemOpen(false)} style={{ color: C.muted }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              {redeemSuccess ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="text-lg font-black" style={{ color: "#34d399" }}>{redeemSuccess}</p>
                  <p className="text-sm mt-1" style={{ color: C.muted }}>Your wallet has been updated</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: C.muted }}>Gift Card Code</label>
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                      placeholder="INK-XXXX-XXXX-XXXX"
                      className="w-full mt-1.5 px-4 py-3 rounded-2xl text-center font-mono text-base font-bold tracking-widest focus:outline-none"
                      style={{ background: C.surface, border: `1px solid ${redeemError ? "rgba(239,68,68,0.5)" : C.border}`, color: C.text }}
                      onKeyDown={e => { if (e.key === "Enter") handleRedeem(); }}
                    />
                  </div>

                  {redeemError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                      <AlertTriangle size={13} className="text-red-400 shrink-0" />
                      <p className="text-xs text-red-300">{redeemError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleRedeem}
                    disabled={redeemLoading || !redeemCode.trim()}
                    className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    style={{ background: "#34d399", color: C.bg }}
                    onMouseEnter={e => !redeemLoading && ((e.currentTarget as HTMLButtonElement).style.background = "#10b981")}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "#34d399")}
                  >
                    {redeemLoading
                      ? <><Loader2 size={16} className="animate-spin" /> Checking…</>
                      : <><Gift size={16} /> Add to Wallet</>}
                  </button>

                  <p className="text-xs text-center" style={{ color: C.faint }}>
                    The full gift card balance will be credited instantly
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MENU TAB ────────────────────────────────────────── */}
      {tab === "menu" && (
        <div className="max-w-lg mx-auto pb-36">

          {/* Table number selector (when no table is known) */}
          {!tableNumber && (
            <div className="mx-4 mt-4 p-4 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: C.text }}>
                <Hash size={14} style={{ color: C.gold }} /> Enter your table number to order
              </p>
              <div className="flex gap-2">
                <input
                  type="number" min={1} max={99} placeholder="Table no."
                  value={tableInput} onChange={e => setTableInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { const n = parseInt(tableInput); if (n > 0) setTableNumber(n); }}}
                  className="flex-1 px-3 py-2 rounded-xl text-sm text-center font-bold focus:outline-none"
                  style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.text }}
                />
                <button
                  onClick={() => { const n = parseInt(tableInput); if (n > 0) setTableNumber(n); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{ background: C.gold, color: C.bg }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
                >
                  Set
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: C.faint }}>You can still browse the menu without a table number.</p>
            </div>
          )}

          {/* Table confirmed banner */}
          {tableNumber && (
            <div className="mx-4 mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{ background: C.goldDim, border: `1px solid ${C.goldBorder}` }}>
              <span className="text-sm font-semibold" style={{ color: C.gold }}>🪑 Table {tableNumber}</span>
              <button onClick={() => { setTableNumber(undefined); setTableInput(""); }}
                className="text-xs" style={{ color: C.muted }}>Change</button>
            </div>
          )}

          {/* Category filter */}
          {!menuLoading && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {[{ id: "__all__", name: "All" }, ...categories.map(c => ({ id: c.name, name: c.name }))].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCatFilter(cat.id)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={catFilter === cat.id
                      ? { background: C.gold, color: C.bg }
                      : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Menu grid */}
          {menuLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: C.gold }} /></div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3">
              {displayItems.map(item => {
                const inCart = cart.find(c => c.menuItemId === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="relative text-left rounded-2xl overflow-hidden transition-all active:scale-[0.97]"
                    style={{ background: inCart ? C.goldDim : C.surface, border: `1px solid ${inCart ? C.goldBorder : C.border}` }}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shadow-md"
                        style={{ background: C.gold, color: C.bg }}>{inCart.qty}</span>
                    )}
                    {item.imageUrl ? (
                      <div className="w-full h-28 overflow-hidden">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="px-3 pt-3 text-3xl">{item.emoji}</div>
                    )}
                    <div className="p-3 pt-2">
                      <p className="text-sm font-semibold leading-tight mb-1" style={{ color: C.text }}>{item.name}</p>
                      <p className="text-sm font-bold" style={{ color: C.gold }}>{fmt(item.price)}</p>
                    </div>
                  </button>
                );
              })}
              {displayItems.length === 0 && (
                <div className="col-span-2 py-12 text-center text-sm" style={{ color: C.faint }}>No items in this category</div>
              )}
            </div>
          )}

          {/* Floating cart bar */}
          {cartCount > 0 && !showCart && (
            <div className="fixed bottom-0 left-0 right-0 z-40 p-4 backdrop-blur-md" style={{ background: `${C.bg}f0`, borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={() => setShowCart(true)}
                className="w-full font-bold py-4 rounded-2xl flex items-center justify-between px-5 transition-all active:scale-[0.99]"
                style={{ background: C.gold, color: C.bg }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
              >
                <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-black" style={{ background: "rgba(0,0,0,0.2)" }}>{cartCount}</span>
                <span>View Order</span>
                <span className="font-black">{fmt(cartTotal)}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Cart overlay ─────────────────────────────────────── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: C.bg }}>
          {/* Cart header */}
          <div className="sticky top-0 px-4 py-3 flex items-center gap-3 shrink-0 backdrop-blur-md" style={{ background: `${C.bg}f0`, borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => setShowCart(false)} style={{ color: C.muted }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = C.text)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = C.muted)}>
              <ArrowLeft size={20} />
            </button>
            <span className="font-bold" style={{ color: C.text }}>Your Order</span>
            {tableNumber && <span className="ml-auto text-xs" style={{ color: C.muted }}>Table {tableNumber}</span>}
          </div>

          {/* No table warning */}
          {!tableNumber && (
            <div className="mx-4 mt-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <Hash size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">Please set your table number on the menu screen before placing an order.</p>
            </div>
          )}

          {/* Items */}
          <div className="flex-1 p-4 space-y-3 pb-40 overflow-y-auto">
            {cart.map(item => (
              <div key={item.menuItemId} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{item.name}</p>
                  <p className="text-xs" style={{ color: C.gold }}>{fmt(item.price * item.qty)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => changeQty(item.menuItemId, -1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.elevated }}>
                    <Minus size={12} style={{ color: C.muted }} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold" style={{ color: C.text }}>{item.qty}</span>
                  <button onClick={() => changeQty(item.menuItemId, 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.elevated }}>
                    <Plus size={12} style={{ color: C.muted }} />
                  </button>
                </div>
              </div>
            ))}
            <div className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <textarea placeholder="Special requests or notes…" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2}
                className="w-full bg-transparent text-sm resize-none focus:outline-none" style={{ color: C.text }} />
            </div>
          </div>

          {/* Place order bar */}
          <div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md" style={{ background: `${C.bg}f0`, borderTop: `1px solid ${C.border}` }}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm" style={{ color: C.muted }}>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
              <span className="text-xl font-black" style={{ color: C.gold }}>{fmt(cartTotal)}</span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placing || !tableNumber}
              className="w-full font-bold py-4 rounded-2xl text-base transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: C.gold, color: C.bg }}
              onMouseEnter={e => !placing && tableNumber && ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
            >
              {placing && <Loader2 size={18} className="animate-spin" />}
              {!tableNumber ? "Set table number first" : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

function MembershipCard({
  profile, initialName, tier, tierProgress, tierSpent,
}: {
  profile:      CustomerProfile | null;
  initialName:  string;
  tier:         typeof TIER_CONFIG[string];
  tierProgress: number;
  tierSpent:    number;
}) {
  return (
    <div
      className="rounded-3xl p-5 relative overflow-hidden"
      style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
    >
      {/* Decorative glow */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${tier.color}22 0%, transparent 70%)` }}
      />

      {/* Top row: tier badge + emoji */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{tier.emoji}</span>
            <span className="text-lg font-black" style={{ color: tier.color }}>{tier.label}</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
            Membership
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: tier.color }}>
            {(profile?.points ?? 0).toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: C.muted }}>points</p>
        </div>
      </div>

      {/* Name */}
      <p className="font-bold text-base mb-4" style={{ color: C.text }}>
        {profile?.name ?? initialName}
      </p>

      {/* Progress to next tier */}
      {tier.nextAt !== null ? (
        <>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: C.muted }}>
            <span>{fmt(tierSpent)} spent</span>
            <span>{tier.nextAt ? fmt(tier.nextAt) : ""} for {tier.nextLabel}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${tierProgress}%`, background: tier.color }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: C.faint }}>
            {fmt((tier.nextAt ?? 0) - tierSpent)} more to reach {tier.nextLabel}
          </p>
        </>
      ) : (
        <div className="flex items-center gap-2 mt-2">
          <Trophy size={14} style={{ color: tier.color }} />
          <p className="text-xs font-semibold" style={{ color: tier.color }}>
            You've reached the highest tier — Platinum!
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon:   React.ReactNode;
  label:  string;
  value:  string;
  sub?:   string;
  color:  string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.muted }}>
          {label}
        </span>
      </div>
      <p className="font-black text-base leading-tight" style={{ color: C.text }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5 leading-snug" style={{ color: C.faint }}>{sub}</p>}
    </div>
  );
}

function ActiveOrderCard({ order }: { order: Order }) {
  const sm = STATUS_META[order.status] ?? STATUS_META.pending;
  const currentStepIdx = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
    >
      {/* Status header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: `${sm.barColor}18`, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2" style={{ color: sm.color }}>
          {sm.icon}
          <span className="font-bold text-sm">{sm.label}</span>
        </div>
        <span className="text-xs font-mono" style={{ color: C.muted }}>
          #{order.orderNumber}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-1">
          {STATUS_STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= currentStepIdx ? sm.barColor : C.elevated }}
            />
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pb-4 space-y-1.5 pt-2">
        {order.items.map(item => (
          <div key={item.menuItemId} className="flex justify-between text-xs">
            <span style={{ color: C.text }}>{item.emoji} {item.name} ×{item.qty}</span>
            <span style={{ color: C.muted }}>{fmt(item.price * item.qty)}</span>
          </div>
        ))}
        <div
          className="flex justify-between text-sm font-bold pt-2"
          style={{ borderTop: `1px solid ${C.border}`, color: C.gold }}
        >
          <span style={{ color: C.muted }}>Total</span>
          <span>{fmt(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

function HistoryOrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const sm = STATUS_META[order.status] ?? STATUS_META.completed;

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: sm.color }}>{sm.icon}</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>
              Order #{order.orderNumber}
            </p>
            <p className="text-xs" style={{ color: C.muted }}>
              {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: C.gold }}>{fmt(order.total)}</p>
          <p className="text-xs" style={{ color: sm.color }}>{sm.label}</p>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-3 space-y-1 border-t" style={{ borderColor: C.border }}>
          <div className="pt-2 space-y-1">
            {order.items.map(item => (
              <div key={item.menuItemId} className="flex justify-between text-xs">
                <span style={{ color: C.muted }}>{item.emoji} {item.name} ×{item.qty}</span>
                <span style={{ color: C.faint }}>{fmt(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TierBenefitsCard({ currentTier }: { currentTier: string }) {
  const benefits: Record<string, string[]> = {
    bronze:   ["Earn 1 point per 1,000 IQD", "Order history tracking", "Status notifications"],
    silver:   ["All Bronze benefits", "Priority queue", "5% birthday bonus points"],
    gold:     ["All Silver benefits", "Free delivery on large orders", "Exclusive menu previews"],
    platinum: ["All Gold benefits", "Dedicated support line", "Monthly VIP event invites", "Complimentary item each visit"],
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.muted }}>
        <Trophy size={11} className="inline mr-1.5 -mt-0.5" />
        Your Benefits
      </h3>
      <ul className="space-y-1.5">
        {(benefits[currentTier] ?? benefits.bronze).map(b => (
          <li key={b} className="flex items-center gap-2 text-sm">
            <CheckCircle size={13} style={{ color: TIER_CONFIG[currentTier]?.color ?? C.gold, flexShrink: 0 }} />
            <span style={{ color: C.text }}>{b}</span>
          </li>
        ))}
      </ul>

      {/* Tier ladder */}
      <div className="mt-4 pt-4 flex justify-between" style={{ borderTop: `1px solid ${C.border}` }}>
        {["bronze", "silver", "gold", "platinum"].map(t => {
          const tc = TIER_CONFIG[t];
          const isActive = t === currentTier;
          const isPast   = ["bronze", "silver", "gold", "platinum"].indexOf(t) <
                           ["bronze", "silver", "gold", "platinum"].indexOf(currentTier);
          return (
            <div key={t} className="flex flex-col items-center gap-1">
              <span className="text-lg" style={{ opacity: isActive ? 1 : isPast ? 0.6 : 0.25 }}>
                {tc.emoji}
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: isActive ? tc.color : C.faint }}
              >
                {tc.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
