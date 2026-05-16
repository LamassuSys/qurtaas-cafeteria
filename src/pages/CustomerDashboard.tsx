import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useOrders, type Order } from "@/data/ordersStore";
import {
  ArrowLeft, Home, Star, TrendingUp, ShoppingBag,
  Clock, ChefHat, Bell, CheckCircle, XCircle,
  Trophy, Zap, History, RefreshCw,
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
  name: string;
  phone: string;
  tier: string;
  points: number;
  totalSpent: number;
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
  tableNumber,
  onBack,
}: {
  customerId:   string;
  initialName:  string;
  tableNumber?: number;
  onBack:       () => void;
}) {
  const { orders } = useOrders();

  const [profile, setProfile]       = useState<CustomerProfile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const prevStatusRef               = useRef<Record<string, string>>({});

  // My orders (filtered by customerId from the global store)
  const myOrders = orders.filter(o => o.customerId === customerId);
  const activeOrders  = myOrders.filter(o => !["completed", "cancelled"].includes(o.status));
  const historyOrders = myOrders.filter(o => ["completed", "cancelled"].includes(o.status));

  // ── Fetch customer profile ─────────────────────────────────
  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("customers")
        .select("name, phone, membership_tier, points, total_spent")
        .eq("id", customerId)
        .single();
      if (data) {
        const r = data as Record<string, unknown>;
        setProfile({
          name:       r.name            as string,
          phone:      r.phone           as string,
          tier:       r.membership_tier as string,
          points:     Number(r.points),
          totalSpent: Number(r.total_spent),
        });
      }
    } finally {
      setLoading(false);
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

      {/* ── Content ─────────────────────────────────────── */}
      <div className="px-4 py-5 max-w-lg mx-auto space-y-5 pb-20">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw size={28} className="animate-spin" style={{ color: C.gold }} />
            <p className="text-sm" style={{ color: C.muted }}>Loading your profile…</p>
          </div>
        ) : (
          <>
            {/* ── Membership card ─────────────────────── */}
            <MembershipCard
              profile={profile}
              initialName={initialName}
              tier={tier}
              tierProgress={tierProgress}
              tierSpent={tierSpent}
            />

            {/* ── Stats grid ──────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<TrendingUp size={16} />}
                label="Total Spent"
                value={fmt(profile?.totalSpent ?? 0)}
                color={C.gold}
              />
              <StatCard
                icon={<ShoppingBag size={16} />}
                label="Orders Placed"
                value={String(totalOrders)}
                color="#60a5fa"
              />
              <StatCard
                icon={<Zap size={16} />}
                label="Points Earned"
                value={`${(profile?.points ?? 0).toLocaleString()} pts`}
                sub={`≈ ${fmt(pointsValue)} redeemable`}
                color="#a78bfa"
              />
              <StatCard
                icon={<Star size={16} />}
                label="Avg Order"
                value={avgOrderValue ? fmt(avgOrderValue) : "—"}
                color="#34d399"
              />
            </div>

            {/* ── Active orders ───────────────────────── */}
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: C.muted }}>
                  Active Orders
                </h2>
                <div className="space-y-3">
                  {activeOrders.map(order => (
                    <ActiveOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Order history ───────────────────────── */}
            {historyOrders.length > 0 && (
              <section>
                <button
                  onClick={() => setHistoryOpen(o => !o)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h2 className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: C.muted }}>
                    <History size={12} className="inline mr-1.5 -mt-0.5" />
                    Order History ({historyOrders.length})
                  </h2>
                  <span className="text-xs" style={{ color: C.faint }}>
                    {historyOpen ? "▲ hide" : "▼ show"}
                  </span>
                </button>

                {historyOpen && (
                  <div className="mt-3 space-y-2">
                    {historyOrders.slice(0, 20).map(order => (
                      <HistoryOrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Empty state ─────────────────────────── */}
            {myOrders.length === 0 && !loading && (
              <div className="py-12 text-center rounded-2xl"
                style={{ border: `1px dashed ${C.faint}` }}>
                <ShoppingBag size={32} className="mx-auto mb-3 opacity-25" style={{ color: C.gold }} />
                <p className="font-semibold" style={{ color: C.text }}>No orders yet</p>
                <p className="text-sm mt-1" style={{ color: C.muted }}>
                  {tableNumber
                    ? "Browse the menu and place your first order!"
                    : "Visit a table to start ordering."}
                </p>
                {tableNumber && (
                  <button
                    onClick={onBack}
                    className="mt-4 px-5 py-2.5 rounded-full text-sm font-bold transition-all"
                    style={{ background: C.gold, color: C.bg }}
                  >
                    Browse Menu →
                  </button>
                )}
              </div>
            )}

            {/* ── Tier benefits info ──────────────────── */}
            <TierBenefitsCard currentTier={profile?.tier ?? "bronze"} />
          </>
        )}
      </div>
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
