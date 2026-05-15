import { useState, useMemo, type ReactNode } from "react";
import { useMenu } from "@/data/menuStore";
import { useOrders, type OrderItem } from "@/data/ordersStore";
import { useI18n } from "@/data/i18nStore";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import {
  Plus, Minus, ShoppingCart, ArrowLeft,
  Loader2, Coffee, User, Phone, Hash,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
type AuthMode  = "choose" | "guest" | "login" | "register";
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
    <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Coffee size={18} className="text-amber-400" />
        <span className="font-bold text-gray-100 text-sm">Qurtaas</span>
        <span className="text-gray-600">·</span>
        <span className="text-amber-400 font-semibold text-sm">{t("table")} {tableNumber}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors"
        >
          {lang === "en" ? "عربي" : "EN"}
        </button>
        {showCartBtn && cartCount > 0 && (
          <button
            onClick={onCartClick}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            <ShoppingCart size={13} />{cartCount}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Wrapper with header ────────────────────────────────────────
function Wrapper({
  children, tableNumber, cartCount = 0, onCartClick = () => {}, showCartBtn = false,
}: {
  children:    ReactNode;
  tableNumber: number;
  cartCount?:  number;
  onCartClick?: () => void;
  showCartBtn?: boolean;
}) {
  const { isRTL } = useI18n();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ direction: isRTL ? "rtl" : "ltr" }}>
      <Header tableNumber={tableNumber} cartCount={cartCount} onCartClick={onCartClick} showCartBtn={showCartBtn} />
      {children}
    </div>
  );
}

// ── Main Portal ────────────────────────────────────────────────
export function CustomerPortal({ tableNumber }: { tableNumber: number }) {
  const { items, categories, loading: menuLoading } = useMenu();
  const { createOrder, orders } = useOrders();
  const { t, fmt } = useI18n();

  // Navigation
  const [step,     setStep]     = useState<PortalStep>("auth");
  const [authMode, setAuthMode] = useState<AuthMode>("choose");
  const [session,  setSession]  = useState<CustomerSession | null>(null);

  // Cart
  const [cart,     setCart]     = useState<OrderItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notes,    setNotes]    = useState("");
  const [catFilter, setCatFilter] = useState("__all__");

  // Confirmed
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // Auth form
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [pin,   setPin]   = useState("");
  const [authError,   setAuthError]   = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  // Live order (real-time via ordersStore)
  const liveOrder = useMemo(
    () => (placedOrderId ? orders.find(o => o.id === placedOrderId) : null),
    [orders, placedOrderId],
  );

  // Cart computed
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
      return [...prev, {
        menuItemId: item.id, name: item.name, emoji: item.emoji,
        category: item.category, price: item.price, cost: item.cost, qty: 1,
      }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.menuItemId === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0)
    );
  };

  // ── Auth handlers ──────────────────────────────────────────
  const continueAsGuest = () => {
    setSession({ name: name.trim() || t("walk_in"), isGuest: true });
    setStep("menu");
    setAuthError("");
  };

  const handleLogin = async () => {
    if (!phone.trim() || !pin.trim()) { setAuthError("Please fill all fields"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const { data } = await supabase
        .from("customers").select("*").eq("phone", phone.trim()).eq("pin", pin.trim()).single();
      if (!data) { setAuthError(t("invalid_creds")); return; }
      const row = data as Record<string, unknown>;
      setSession({ name: row.name as string, isGuest: false, customerId: row.id as string });
      setStep("menu");
    } catch { setAuthError(t("invalid_creds")); }
    finally { setAuthLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim())                        { setAuthError(`${t("your_name_req")} is required`); return; }
    if (!phone.trim())                       { setAuthError(`${t("your_phone")} is required`); return; }
    if (pin.length !== 4 || !/^\d+$/.test(pin)) { setAuthError("PIN must be 4 digits"); return; }
    setAuthLoading(true); setAuthError("");
    try {
      const { data, error: e } = await supabase
        .from("customers")
        .insert({ name: name.trim(), phone: phone.trim(), pin: pin.trim() })
        .select().single();
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
      setStep("confirmed");
      setShowCart(false);
      setCart([]);
      setNotes("");
    } catch (e) { console.error(e); }
    finally { setOrderLoading(false); }
  };

  // ── AUTH SCREEN ────────────────────────────────────────────
  if (step === "auth") {
    return (
      <Wrapper tableNumber={tableNumber}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] px-6 py-10">
          {/* Welcome heading */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
              <Coffee size={36} className="text-amber-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">{t("welcome_table")}</p>
            <h1 className="text-5xl font-black text-amber-400">{t("table")} {tableNumber}</h1>
          </div>

          <div className="w-full max-w-xs space-y-3">
            {authMode === "choose" && (
              <>
                <button onClick={() => setAuthMode("guest")}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-gray-900 font-bold text-base transition-all flex items-center justify-center gap-2">
                  <User size={18} /> {t("guest_mode")}
                </button>
                <button onClick={() => setAuthMode("login")}
                  className="w-full py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 active:scale-[0.98] text-gray-100 font-semibold text-base transition-all border border-gray-700 flex items-center justify-center gap-2">
                  <Hash size={18} /> {t("have_account")}
                </button>
                <button onClick={() => setAuthMode("register")}
                  className="w-full py-4 rounded-2xl border border-amber-500/40 hover:border-amber-500 active:scale-[0.98] text-amber-400 font-semibold text-base transition-all flex items-center justify-center gap-2">
                  <Plus size={18} /> {t("new_customer")}
                </button>
              </>
            )}

            {authMode === "guest" && (
              <>
                <button onClick={() => setAuthMode("choose")} className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-300 mb-2 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
                <Input placeholder={t("your_name_opt")} value={name} onChange={e => setName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 text-base h-12 rounded-xl" />
                <button onClick={continueAsGuest}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-gray-900 font-bold text-base transition-all">
                  {t("start_browsing")} →
                </button>
              </>
            )}

            {authMode === "login" && (
              <>
                <button onClick={() => setAuthMode("choose")} className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-300 mb-2 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <Input placeholder={t("your_phone")} value={phone} onChange={e => setPhone(e.target.value)}
                    type="tel" className="pl-9 bg-gray-800 border-gray-700 text-gray-100 text-base h-12 rounded-xl" />
                </div>
                <Input placeholder={t("your_pin")} value={pin} onChange={e => setPin(e.target.value.slice(0, 4))}
                  type="password" maxLength={4}
                  className="bg-gray-800 border-gray-700 text-gray-100 text-base h-12 rounded-xl text-center tracking-[0.4em] text-xl" />
                {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
                <button onClick={handleLogin} disabled={authLoading}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 active:scale-[0.98] text-gray-900 font-bold text-base transition-all flex items-center justify-center gap-2">
                  {authLoading && <Loader2 size={16} className="animate-spin" />}
                  {t("login_btn")}
                </button>
              </>
            )}

            {authMode === "register" && (
              <>
                <button onClick={() => setAuthMode("choose")} className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-300 mb-2 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <Input placeholder={t("your_name_req")} value={name} onChange={e => setName(e.target.value)}
                    className="pl-9 bg-gray-800 border-gray-700 text-gray-100 text-base h-12 rounded-xl" />
                </div>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <Input placeholder={t("your_phone")} value={phone} onChange={e => setPhone(e.target.value)}
                    type="tel" className="pl-9 bg-gray-800 border-gray-700 text-gray-100 text-base h-12 rounded-xl" />
                </div>
                <Input placeholder={t("set_pin")} value={pin} onChange={e => setPin(e.target.value.slice(0, 4))}
                  type="password" maxLength={4}
                  className="bg-gray-800 border-gray-700 text-gray-100 text-base h-12 rounded-xl text-center tracking-[0.4em] text-xl" />
                {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
                <button onClick={handleRegister} disabled={authLoading}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 active:scale-[0.98] text-gray-900 font-bold text-base transition-all flex items-center justify-center gap-2">
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
      pending:   { icon: "⏳", label: t("pending"),      color: "text-amber-400",   bar: "bg-amber-500"   },
      preparing: { icon: "👨‍🍳", label: t("preparing_msg"), color: "text-blue-400",    bar: "bg-blue-500"    },
      ready:     { icon: "🔔", label: t("ready_msg"),     color: "text-emerald-400", bar: "bg-emerald-500" },
      completed: { icon: "✅", label: t("completed_msg"), color: "text-gray-400",    bar: "bg-gray-500"    },
      cancelled: { icon: "❌", label: t("cancelled"),     color: "text-red-400",     bar: "bg-red-500"     },
    };

    if (!liveOrder) {
      return (
        <Wrapper tableNumber={tableNumber}>
          <div className="flex items-center justify-center min-h-[calc(100vh-57px)]">
            <Loader2 size={32} className="text-amber-400 animate-spin" />
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
            {/* Status icon + label */}
            <div className="text-center">
              <div className="text-6xl mb-3">{sm.icon}</div>
              <h2 className={`text-xl font-bold ${sm.color}`}>{sm.label}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {t("table")} {tableNumber} · {t("your_order_num")} #{liveOrder.orderNumber}
              </p>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  i <= currentStepIdx ? sm.bar : "bg-gray-800"
                }`} />
              ))}
            </div>

            {/* Items recap */}
            <div className="bg-gray-900 rounded-2xl p-4 space-y-2 border border-gray-800">
              {liveOrder.items.map(item => (
                <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{item.emoji} {item.name} ×{item.qty}</span>
                  <span className="text-gray-400">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="border-t border-gray-800 pt-2 flex justify-between font-bold">
                <span className="text-gray-400">
                  {liveOrder.items.reduce((s, i) => s + i.qty, 0)} items
                </span>
                <span className="text-amber-400">{fmt(liveOrder.total)}</span>
              </div>
            </div>

            {/* Actions */}
            {(liveOrder.status === "ready" || liveOrder.status === "completed") ? (
              <button onClick={() => { setStep("menu"); setPlacedOrderId(null); }}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-gray-900 font-bold text-base transition-all">
                {t("order_again")}
              </button>
            ) : (
              <p className="text-center text-xs text-gray-600">🔄 This page updates automatically</p>
            )}
          </div>
        </div>
      </Wrapper>
    );
  }

  // ── MENU SCREEN ────────────────────────────────────────────
  return (
    <Wrapper
      tableNumber={tableNumber}
      cartCount={cartCount}
      onCartClick={() => setShowCart(true)}
      showCartBtn={!showCart}
    >
      {/* Greeting bar */}
      {session && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-center">
          <span className="text-amber-400 text-sm font-medium">
            👋 {session.name}
          </span>
        </div>
      )}

      {/* Category tabs */}
      <div className="sticky top-[57px] z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          {[{ id: "__all__", name: t("all") }, ...categories.map(c => ({ id: c.name, name: c.name }))].map(cat => (
            <button key={cat.id} onClick={() => setCatFilter(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                catFilter === cat.id
                  ? "bg-amber-500 text-gray-900"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      {menuLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="text-amber-400 animate-spin" />
        </div>
      ) : (
        <div className="p-3 grid grid-cols-2 gap-3 pb-28">
          {displayItems.map(item => {
            const inCart = cart.find(c => c.menuItemId === item.id);
            return (
              <button key={item.id} onClick={() => addToCart(item)}
                className={`relative text-left p-3 rounded-2xl border transition-all active:scale-[0.97] ${
                  inCart
                    ? "bg-amber-500/15 border-amber-500/50"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}>
                {inCart && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-gray-900 text-[10px] font-black flex items-center justify-center">
                    {inCart.qty}
                  </span>
                )}
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="text-sm font-semibold text-gray-200 leading-tight mb-1">{item.name}</p>
                <p className="text-sm font-bold text-amber-400">{fmt(item.price)}</p>
              </button>
            );
          })}
          {displayItems.length === 0 && (
            <div className="col-span-2 py-16 text-center text-gray-600">
              <p className="text-sm">No items in this category</p>
            </div>
          )}
        </div>
      )}

      {/* Floating cart button */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gray-950/95 backdrop-blur border-t border-gray-800">
          <button onClick={() => setShowCart(true)}
            className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-between px-5 transition-all">
            <span className="w-6 h-6 rounded-full bg-gray-900/30 text-xs flex items-center justify-center font-black">{cartCount}</span>
            <span className="text-base">{t("view_order")}</span>
            <span className="font-black">{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Cart overlay (slide-up) */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-gray-950 overflow-y-auto flex flex-col">
          {/* Cart header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
            <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-200 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <span className="font-bold text-gray-100">{t("current_order")}</span>
            <span className="ml-auto text-xs text-gray-500">{t("table")} {tableNumber}</span>
          </div>

          {/* Cart items */}
          <div className="flex-1 p-4 space-y-3 pb-36 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-gray-600">
                <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t("tap_to_add")}</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center gap-3 bg-gray-900 rounded-2xl p-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200 truncate">{item.name}</p>
                      <p className="text-xs text-amber-400">{fmt(item.price * item.qty)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => changeQty(item.menuItemId, -1)}
                        className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
                        <Minus size={12} className="text-gray-300" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-gray-200">{item.qty}</span>
                      <button onClick={() => changeQty(item.menuItemId, 1)}
                        className="w-7 h-7 rounded-full bg-gray-700 hover:bg-amber-600 flex items-center justify-center transition-colors">
                        <Plus size={12} className="text-gray-300" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Notes */}
                <div className="bg-gray-900 rounded-2xl p-3 border border-gray-800">
                  <textarea
                    placeholder={t("order_notes")}
                    value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    className="w-full bg-transparent text-gray-300 text-sm resize-none focus:outline-none placeholder-gray-600"
                  />
                </div>
              </>
            )}
          </div>

          {/* Place order bar */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/95 backdrop-blur border-t border-gray-800 shrink-0">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
                <span className="text-xl font-black text-amber-400">{fmt(cartTotal)}</span>
              </div>
              <button onClick={placeOrder} disabled={orderLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 active:scale-[0.99] text-gray-900 font-bold py-4 rounded-2xl text-base transition-all flex items-center justify-center gap-2">
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
