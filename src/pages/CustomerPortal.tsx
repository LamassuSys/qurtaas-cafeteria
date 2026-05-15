import { useState, useMemo, type ReactNode } from "react";
import { useMenu } from "@/data/menuStore";
import { useOrders, type OrderItem } from "@/data/ordersStore";
import { useI18n } from "@/data/i18nStore";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import {
  Plus, Minus, ShoppingCart, ArrowLeft,
  Loader2, User, Phone, Hash, Home,
} from "lucide-react";

// ── Brand tokens (matches landing page & logo) ─────────────────
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

// ── Types ──────────────────────────────────────────────────────
type AuthMode   = "choose" | "guest" | "login" | "register";
type PortalStep = "auth" | "menu" | "confirmed";

interface CustomerSession {
  name:       string;
  isGuest:    boolean;
  customerId?: string;
}

// ── Shared brand header ────────────────────────────────────────
function Header({
  tableNumber, cartCount, onCartClick, showCartBtn,
}: {
  tableNumber: number;
  cartCount:   number;
  onCartClick: () => void;
  showCartBtn: boolean;
}) {
  const { t, lang, setLang } = useI18n();
  return (
    <div
      className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-md"
      style={{ background: "rgba(7,17,31,0.92)", borderBottom: `1px solid ${C.border}` }}
    >
      {/* Left: home + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { window.location.href = "/"; }}
          className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors"
          style={{ color: C.muted, border: `1px solid ${C.border}` }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = C.gold;
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.goldBorder;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = C.muted;
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
          }}
          title="Back to home"
        >
          <Home size={15} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-7 w-auto"
            onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
          <span style={{ color: C.border }} className="text-sm">·</span>
          <span className="font-bold text-sm" style={{ color: C.gold }}>{t("table")} {tableNumber}</span>
        </div>
      </div>

      {/* Right: lang + cart */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ color: C.muted, border: `1px solid ${C.border}` }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = C.text)}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = C.muted)}
        >
          {lang === "en" ? "عربي" : "EN"}
        </button>
        {showCartBtn && cartCount > 0 && (
          <button
            onClick={onCartClick}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            style={{ background: C.gold, color: C.bg }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
          >
            <ShoppingCart size={13} />{cartCount}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Wrapper ────────────────────────────────────────────────────
function Wrapper({
  children, tableNumber, cartCount = 0, onCartClick = () => {}, showCartBtn = false,
}: {
  children:     ReactNode;
  tableNumber:  number;
  cartCount?:   number;
  onCartClick?:  () => void;
  showCartBtn?: boolean;
}) {
  const { isRTL } = useI18n();
  return (
    <div
      className="min-h-screen"
      style={{ background: C.bg, color: C.text, direction: isRTL ? "rtl" : "ltr" }}
    >
      <Header tableNumber={tableNumber} cartCount={cartCount} onCartClick={onCartClick} showCartBtn={showCartBtn} />
      {children}
    </div>
  );
}

// ── Reusable styled input ──────────────────────────────────────
function PortalInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      style={{ background: C.surface, borderColor: C.border, color: C.text, ...props.style }}
      className={`text-base h-12 rounded-xl focus:ring-1 placeholder:text-[#344f72] ${props.className ?? ""}`}
    />
  );
}

// ── Main Portal ────────────────────────────────────────────────
export function CustomerPortal({ tableNumber }: { tableNumber: number }) {
  const { items, categories, loading: menuLoading } = useMenu();
  const { createOrder, orders } = useOrders();
  const { t, fmt } = useI18n();

  const [step,      setStep]      = useState<PortalStep>("auth");
  const [authMode,  setAuthMode]  = useState<AuthMode>("choose");
  const [session,   setSession]   = useState<CustomerSession | null>(null);

  const [cart,      setCart]      = useState<OrderItem[]>([]);
  const [showCart,  setShowCart]  = useState(false);
  const [notes,     setNotes]     = useState("");
  const [catFilter, setCatFilter] = useState("__all__");
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [pin,   setPin]   = useState("");
  const [authError,    setAuthError]    = useState("");
  const [authLoading,  setAuthLoading]  = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const liveOrder = useMemo(
    () => (placedOrderId ? orders.find(o => o.id === placedOrderId) : null),
    [orders, placedOrderId],
  );

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const activeItems  = items.filter(i => i.active);
  const displayItems = catFilter === "__all__"
    ? activeItems
    : activeItems.filter(i => i.category === catFilter);

  // ── Cart ops ───────────────────────────────────────────────
  const addToCart = (item: typeof activeItems[number]) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item.id);
      if (ex) return prev.map(c => c.menuItemId === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, emoji: item.emoji, category: item.category, price: item.price, cost: item.cost, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.menuItemId === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  };

  // ── Auth handlers ──────────────────────────────────────────
  const continueAsGuest = () => {
    setSession({ name: name.trim() || t("walk_in"), isGuest: true });
    setStep("menu"); setAuthError("");
  };

  const handleLogin = async () => {
    if (!phone.trim() || !pin.trim()) { setAuthError("Please fill all fields"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const { data } = await supabase.from("customers").select("*").eq("phone", phone.trim()).eq("pin", pin.trim()).single();
      if (!data) { setAuthError(t("invalid_creds")); return; }
      const row = data as Record<string, unknown>;
      setSession({ name: row.name as string, isGuest: false, customerId: row.id as string });
      setStep("menu");
    } catch { setAuthError(t("invalid_creds")); }
    finally { setAuthLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim())                             { setAuthError(`${t("your_name_req")} is required`); return; }
    if (!phone.trim())                            { setAuthError(`${t("your_phone")} is required`); return; }
    if (pin.length !== 4 || !/^\d+$/.test(pin))  { setAuthError("PIN must be 4 digits"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const { data, error: e } = await supabase.from("customers").insert({ name: name.trim(), phone: phone.trim(), pin: pin.trim() }).select().single();
      if (e) { setAuthError(e.code === "23505" ? t("phone_exists") : e.message); return; }
      const row = data as Record<string, unknown>;
      setSession({ name: row.name as string, isGuest: false, customerId: row.id as string });
      setStep("menu");
    } catch (err: unknown) { setAuthError((err as Error).message); }
    finally { setAuthLoading(false); }
  };

  const placeOrder = async () => {
    if (!cart.length || !session) return;
    setOrderLoading(true);
    try {
      const order = await createOrder(cart, session.name, notes, `table-${tableNumber}`, tableNumber);
      setPlacedOrderId(order.id);
      setStep("confirmed"); setShowCart(false); setCart([]); setNotes("");
    } catch (e) { console.error(e); }
    finally { setOrderLoading(false); }
  };

  // ── AUTH SCREEN ────────────────────────────────────────────
  if (step === "auth") {
    const backBtn = (mode: AuthMode) => (
      <button
        onClick={() => setAuthMode(mode)}
        className="flex items-center gap-1 text-sm mb-3 transition-colors"
        style={{ color: C.muted }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = C.text)}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = C.muted)}
      >
        <ArrowLeft size={14} /> Back
      </button>
    );

    return (
      <Wrapper tableNumber={tableNumber}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-6 py-10">
          {/* Welcome heading */}
          <div className="text-center mb-10">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: C.goldDim, border: `1px solid ${C.goldBorder}` }}
            >
              <img src="/logo.png" alt="" className="w-14 h-14 object-contain"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("style");
                }} />
              <span style={{ display: "none", fontSize: 32 }}>☕</span>
            </div>
            <p className="text-sm mb-1" style={{ color: C.muted }}>{t("welcome_table")}</p>
            <h1 className="text-5xl font-black" style={{ color: C.gold }}>{t("table")} {tableNumber}</h1>
          </div>

          <div className="w-full max-w-xs space-y-3">
            {authMode === "choose" && (
              <>
                {/* Primary CTA */}
                <button
                  onClick={() => setAuthMode("guest")}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ background: C.gold, color: C.bg }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
                >
                  <User size={18} /> {t("guest_mode")}
                </button>
                {/* Secondary */}
                <button
                  onClick={() => setAuthMode("login")}
                  className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}` }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = C.goldBorder)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = C.border)}
                >
                  <Hash size={18} /> {t("have_account")}
                </button>
                <button
                  onClick={() => setAuthMode("register")}
                  className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ color: C.gold, border: `1px solid ${C.goldBorder}` }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = C.gold)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = C.goldBorder)}
                >
                  <Plus size={18} /> {t("new_customer")}
                </button>
              </>
            )}

            {authMode === "guest" && (
              <>
                {backBtn("choose")}
                <PortalInput placeholder={t("your_name_opt")} value={name} onChange={e => setName(e.target.value)} />
                <button
                  onClick={continueAsGuest}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
                  style={{ background: C.gold, color: C.bg }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
                >
                  {t("start_browsing")} →
                </button>
              </>
            )}

            {authMode === "login" && (
              <>
                {backBtn("choose")}
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
                  <PortalInput placeholder={t("your_phone")} value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="pl-9" />
                </div>
                <PortalInput
                  placeholder={t("your_pin")} value={pin} onChange={e => setPin(e.target.value.slice(0, 4))}
                  type="password" maxLength={4} className="text-center tracking-[0.4em] text-xl"
                />
                {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
                <button
                  onClick={handleLogin} disabled={authLoading}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: C.gold, color: C.bg }}
                  onMouseEnter={e => !authLoading && ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
                >
                  {authLoading && <Loader2 size={16} className="animate-spin" />}
                  {t("login_btn")}
                </button>
              </>
            )}

            {authMode === "register" && (
              <>
                {backBtn("choose")}
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
                  <PortalInput placeholder={t("your_name_req")} value={name} onChange={e => setName(e.target.value)} className="pl-9" />
                </div>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
                  <PortalInput placeholder={t("your_phone")} value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="pl-9" />
                </div>
                <PortalInput
                  placeholder={t("set_pin")} value={pin} onChange={e => setPin(e.target.value.slice(0, 4))}
                  type="password" maxLength={4} className="text-center tracking-[0.4em] text-xl"
                />
                {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
                <button
                  onClick={handleRegister} disabled={authLoading}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: C.gold, color: C.bg }}
                  onMouseEnter={e => !authLoading && ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
                >
                  {authLoading && <Loader2 size={16} className="animate-spin" />}
                  {t("register_btn")}
                </button>
              </>
            )}
          </div>
        </div>
      </Wrapper>
    );
  }

  // ── ORDER CONFIRMED SCREEN ─────────────────────────────────
  if (step === "confirmed") {
    const STATUS_STEPS = ["pending", "preparing", "ready", "completed"] as const;
    const statusMeta = {
      pending:   { icon: "⏳", label: t("pending"),       color: "#f5a800", bar: C.gold         },
      preparing: { icon: "👨‍🍳", label: t("preparing_msg"), color: "#60a5fa", bar: "#3b82f6"      },
      ready:     { icon: "🔔", label: t("ready_msg"),      color: "#34d399", bar: "#10b981"      },
      completed: { icon: "✅", label: t("completed_msg"),  color: C.muted,   bar: C.faint        },
      cancelled: { icon: "❌", label: t("cancelled"),      color: "#f87171", bar: "#ef4444"      },
    };

    if (!liveOrder) {
      return (
        <Wrapper tableNumber={tableNumber}>
          <div className="flex items-center justify-center min-h-[calc(100vh-57px)]">
            <Loader2 size={32} className="animate-spin" style={{ color: C.gold }} />
          </div>
        </Wrapper>
      );
    }

    const sm = statusMeta[liveOrder.status];
    const currentStepIdx = STATUS_STEPS.indexOf(liveOrder.status as typeof STATUS_STEPS[number]);

    return (
      <Wrapper tableNumber={tableNumber}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-5 py-10">
          <div className="w-full max-w-sm space-y-6">
            {/* Status */}
            <div className="text-center">
              <div className="text-6xl mb-3">{sm.icon}</div>
              <h2 className="text-xl font-bold" style={{ color: sm.color }}>{sm.label}</h2>
              <p className="text-sm mt-1" style={{ color: C.muted }}>
                {t("table")} {tableNumber} · {t("your_order_num")} #{liveOrder.orderNumber}
              </p>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5">
              {STATUS_STEPS.map((s, i) => (
                <div
                  key={s}
                  className="h-2 flex-1 rounded-full transition-all duration-500"
                  style={{ background: i <= currentStepIdx ? sm.bar : C.surface }}
                />
              ))}
            </div>

            {/* Items recap */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              {liveOrder.items.map(item => (
                <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                  <span style={{ color: C.text }}>{item.emoji} {item.name} ×{item.qty}</span>
                  <span style={{ color: C.muted }}>{fmt(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                <span style={{ color: C.muted }}>{liveOrder.items.reduce((s, i) => s + i.qty, 0)} items</span>
                <span style={{ color: C.gold }}>{fmt(liveOrder.total)}</span>
              </div>
            </div>

            {/* Action */}
            {(liveOrder.status === "ready" || liveOrder.status === "completed") ? (
              <button
                onClick={() => { setStep("menu"); setPlacedOrderId(null); }}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
                style={{ background: C.gold, color: C.bg }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
              >
                {t("order_again")}
              </button>
            ) : (
              <p className="text-center text-xs" style={{ color: C.faint }}>🔄 This page updates automatically</p>
            )}
          </div>
        </div>
      </Wrapper>
    );
  }

  // ── MENU SCREEN ────────────────────────────────────────────
  return (
    <Wrapper tableNumber={tableNumber} cartCount={cartCount} onCartClick={() => setShowCart(true)} showCartBtn={!showCart}>

      {/* Greeting bar */}
      {session && (
        <div className="px-4 py-2 text-center text-sm font-medium border-b"
          style={{ background: C.goldDim, borderColor: C.goldBorder, color: C.gold }}>
          👋 {session.name}
        </div>
      )}

      {/* Category tabs */}
      <div
        className="sticky top-[57px] z-30 px-3 py-2 backdrop-blur-md"
        style={{ background: `${C.bg}f0`, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          {[{ id: "__all__", name: t("all") }, ...categories.map(c => ({ id: c.name, name: c.name }))].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(cat.id)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={
                catFilter === cat.id
                  ? { background: C.gold, color: C.bg }
                  : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      {menuLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: C.gold }} />
        </div>
      ) : (
        <div className="p-3 grid grid-cols-2 gap-3 pb-28">
          {displayItems.map(item => {
            const inCart = cart.find(c => c.menuItemId === item.id);
            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="relative text-left p-3 rounded-2xl transition-all active:scale-[0.97]"
                style={{
                  background: inCart ? C.goldDim : C.surface,
                  border: `1px solid ${inCart ? C.goldBorder : C.border}`,
                }}
              >
                {inCart && (
                  <span
                    className="absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                    style={{ background: C.gold, color: C.bg }}
                  >
                    {inCart.qty}
                  </span>
                )}
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="text-sm font-semibold leading-tight mb-1" style={{ color: C.text }}>{item.name}</p>
                <p className="text-sm font-bold" style={{ color: C.gold }}>{fmt(item.price)}</p>
              </button>
            );
          })}
          {displayItems.length === 0 && (
            <div className="col-span-2 py-16 text-center text-sm" style={{ color: C.faint }}>
              No items in this category
            </div>
          )}
        </div>
      )}

      {/* Floating cart bar */}
      {cartCount > 0 && !showCart && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 p-4 backdrop-blur-md"
          style={{ background: `${C.bg}f0`, borderTop: `1px solid ${C.border}` }}
        >
          <button
            onClick={() => setShowCart(true)}
            className="w-full font-bold py-4 rounded-2xl flex items-center justify-between px-5 transition-all active:scale-[0.99]"
            style={{ background: C.gold, color: C.bg }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
          >
            <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-black"
              style={{ background: "rgba(0,0,0,0.2)" }}>{cartCount}</span>
            <span className="text-base">{t("view_order")}</span>
            <span className="font-black">{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Cart overlay */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col" style={{ background: C.bg }}>
          {/* Cart header */}
          <div
            className="sticky top-0 px-4 py-3 flex items-center gap-3 shrink-0 backdrop-blur-md"
            style={{ background: `${C.bg}f0`, borderBottom: `1px solid ${C.border}` }}
          >
            <button
              onClick={() => setShowCart(false)}
              className="transition-colors"
              style={{ color: C.muted }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = C.text)}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = C.muted)}
            >
              <ArrowLeft size={20} />
            </button>
            <span className="font-bold" style={{ color: C.text }}>{t("current_order")}</span>
            <span className="ml-auto text-xs" style={{ color: C.muted }}>{t("table")} {tableNumber}</span>
          </div>

          {/* Cart items */}
          <div className="flex-1 p-4 space-y-3 pb-36 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingCart size={32} className="mx-auto mb-3 opacity-20" style={{ color: C.gold }} />
                <p className="text-sm" style={{ color: C.faint }}>{t("tap_to_add")}</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{item.name}</p>
                      <p className="text-xs" style={{ color: C.gold }}>{fmt(item.price * item.qty)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => changeQty(item.menuItemId, -1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: C.elevated }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)")}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.elevated)}
                      >
                        <Minus size={12} style={{ color: C.muted }} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold" style={{ color: C.text }}>{item.qty}</span>
                      <button
                        onClick={() => changeQty(item.menuItemId, 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: C.elevated }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = C.goldDim)}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.elevated)}
                      >
                        <Plus size={12} style={{ color: C.muted }} />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Notes */}
                <div className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <textarea
                    placeholder={t("order_notes")}
                    value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    className="w-full bg-transparent text-sm resize-none focus:outline-none"
                    style={{ color: C.text, placeholder: C.faint } as React.CSSProperties}
                  />
                </div>
              </>
            )}
          </div>

          {/* Place order bar */}
          {cart.length > 0 && (
            <div
              className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md shrink-0"
              style={{ background: `${C.bg}f0`, borderTop: `1px solid ${C.border}` }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm" style={{ color: C.muted }}>{cartCount} {cartCount === 1 ? "item" : "items"}</span>
                <span className="text-xl font-black" style={{ color: C.gold }}>{fmt(cartTotal)}</span>
              </div>
              <button
                onClick={placeOrder} disabled={orderLoading}
                className="w-full font-bold py-4 rounded-2xl text-base transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: C.gold, color: C.bg }}
                onMouseEnter={e => !orderLoading && ((e.currentTarget as HTMLButtonElement).style.background = C.goldDark)}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = C.gold)}
              >
                {orderLoading && <Loader2 size={18} className="animate-spin" />}
                {t("place_order_now")}
              </button>
            </div>
          )}
        </div>
      )}
    </Wrapper>
  );
}
