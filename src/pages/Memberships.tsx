import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import {
  CreditCard, Plus, X, RefreshCw, Search, AlertTriangle,
  Calendar, Users, TrendingUp, Crown, Star, CheckCircle2,
  Coffee, Clock, CalendarDays,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
type PlanId = "basic" | "priority";
type SubStatus = "active" | "expired" | "cancelled";

interface Plan {
  id:              PlanId;
  name:            string;
  priceMonthly:    number;
  cupsPerWindow:   number;
  windowHours:     number;
  stayUnlimited:   boolean;
  description:     string;
  color:           string;
}

interface Subscription {
  id:          string;
  customerId:  string;
  customerName:string;
  customerPhone:string;
  planId:      PlanId;
  planName:    string;
  status:      SubStatus;
  startDate:   string;
  endDate:     string;
  amountPaid:  number;
  notes:       string;
  createdAt:   string;
  createdBy:   string;
}

interface Customer {
  id:    string;
  name:  string;
  phone: string;
}

// ── Helpers ────────────────────────────────────────────────────
const fmt     = (n: number) => `${n.toLocaleString("en-IQ")} IQD`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const addMonths = (date: Date, n: number) => { const d = new Date(date); d.setMonth(d.getMonth() + n); return d; };
const isoDate   = (d: Date) => d.toISOString().slice(0, 10);

const STATUS_STYLE: Record<SubStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: "Active",    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  expired:   { label: "Expired",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  cancelled: { label: "Cancelled", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30"     },
};

const PLAN_VISUAL: Record<PlanId, { gradient: string; icon: React.ReactNode; badge: string }> = {
  basic:    { gradient: "from-blue-600/20 to-blue-900/20",    icon: <Star size={20} className="text-blue-400" />,   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  priority: { gradient: "from-amber-600/20 to-amber-900/20",  icon: <Crown size={20} className="text-amber-400" />, badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
};

// ── Main ───────────────────────────────────────────────────────
export function Memberships() {
  const { user } = useAuth();

  const [plans,       setPlans]       = useState<Plan[]>([]);
  const [subs,        setSubs]        = useState<Subscription[]>([]);
  const [customers,   setCustomers]   = useState<Customer[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter] = useState<"all" | SubStatus>("all");
  const [planFilter,  setPlanFilter]  = useState<"all" | PlanId>("all");

  // Modals
  const [assignOpen,  setAssignOpen]  = useState(false);
  const [cancelId,    setCancelId]    = useState<string | null>(null);
  const [extendId,    setExtendId]    = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  // Assign form
  const [formCustomer, setFormCustomer] = useState("");
  const [formPlan,     setFormPlan]     = useState<PlanId>("basic");
  const [formStart,    setFormStart]    = useState(isoDate(new Date()));
  const [formEnd,      setFormEnd]      = useState(isoDate(addMonths(new Date(), 1)));
  const [formNotes,    setFormNotes]    = useState("");
  const [formAmount,   setFormAmount]   = useState("25000");

  // ── Load ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: plansData }, { data: subsData }, { data: custsData }] = await Promise.all([
        supabase.from("membership_plans").select("*").order("price_monthly"),
        supabase.from("customer_memberships")
          .select(`*, customers(name, phone)`)
          .order("created_at", { ascending: false }),
        supabase.from("customers").select("id, name, phone").order("name"),
      ]);

      if (plansData) {
        setPlans(plansData.map((r: Record<string, unknown>) => ({
          id:            r.id            as PlanId,
          name:          r.name          as string,
          priceMonthly:  Number(r.price_monthly),
          cupsPerWindow: Number(r.cups_per_window),
          windowHours:   Number(r.window_hours),
          stayUnlimited: Boolean(r.stay_unlimited),
          description:   (r.description as string) || "",
          color:         (r.color as string) || "",
        })));
      }

      if (subsData) {
        setSubs(subsData.map((r: Record<string, unknown>) => {
          const cust = (r.customers as Record<string, unknown>) || {};
          return {
            id:           r.id           as string,
            customerId:   r.customer_id  as string,
            customerName: (cust.name  as string) || "—",
            customerPhone:(cust.phone as string) || "",
            planId:       r.plan_id      as PlanId,
            planName:     r.plan_id      as string,
            status:       r.status       as SubStatus,
            startDate:    r.start_date   as string,
            endDate:      r.end_date     as string,
            amountPaid:   Number(r.amount_paid),
            notes:        (r.notes as string) || "",
            createdAt:    r.created_at   as string,
            createdBy:    (r.created_by  as string) || "",
          };
        }));
      }

      if (custsData) {
        setCustomers(custsData.map((r: Record<string, unknown>) => ({
          id:    r.id    as string,
          name:  r.name  as string,
          phone: r.phone as string,
        })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sync amount when plan changes in form
  useEffect(() => {
    const plan = plans.find(p => p.id === formPlan);
    if (plan) setFormAmount(String(plan.priceMonthly));
  }, [formPlan, plans]);

  // Sync end date when start changes
  useEffect(() => {
    if (formStart) setFormEnd(isoDate(addMonths(new Date(formStart), 1)));
  }, [formStart]);

  // ── Assign membership ──────────────────────────────────────────
  const handleAssign = async () => {
    if (!formCustomer) { setError("Select a customer"); return; }
    setSaving(true); setError("");
    try {
      const { error: e } = await supabase.from("customer_memberships").insert({
        customer_id:  formCustomer,
        plan_id:      formPlan,
        status:       "active",
        start_date:   formStart,
        end_date:     formEnd,
        amount_paid:  parseFloat(formAmount) || 0,
        notes:        formNotes.trim() || null,
        created_by:   user?.username ?? "admin",
      });
      if (e) { setError(e.message); return; }
      setAssignOpen(false);
      setFormCustomer(""); setFormNotes(""); setFormPlan("basic");
      setFormStart(isoDate(new Date())); setFormEnd(isoDate(addMonths(new Date(), 1)));
      load();
    } catch (ex) { setError((ex as Error).message); }
    finally { setSaving(false); }
  };

  // ── Cancel subscription ────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelId) return;
    setSaving(true);
    await supabase.from("customer_memberships")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: user?.username ?? "admin" })
      .eq("id", cancelId);
    setSubs(prev => prev.map(s => s.id === cancelId ? { ...s, status: "cancelled" } : s));
    setCancelId(null); setSaving(false);
  };

  // ── Extend subscription by 1 month ────────────────────────────
  const handleExtend = async () => {
    if (!extendId) return;
    const sub = subs.find(s => s.id === extendId);
    if (!sub) return;
    setSaving(true);
    const newEnd = isoDate(addMonths(new Date(sub.endDate), 1));
    await supabase.from("customer_memberships")
      .update({ end_date: newEnd, status: "active" })
      .eq("id", extendId);
    setSubs(prev => prev.map(s => s.id === extendId ? { ...s, endDate: newEnd, status: "active" } : s));
    setExtendId(null); setSaving(false);
  };

  // ── Filtered ──────────────────────────────────────────────────
  const filtered = subs.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.customerName.toLowerCase().includes(q) || s.customerPhone.includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchPlan   = planFilter === "all" || s.planId === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  // ── Stats ─────────────────────────────────────────────────────
  const activeBasic    = subs.filter(s => s.status === "active" && s.planId === "basic").length;
  const activePriority = subs.filter(s => s.status === "active" && s.planId === "priority").length;
  const monthlyRevenue = subs
    .filter(s => s.status === "active")
    .reduce((acc, s) => {
      const plan = plans.find(p => p.id === s.planId);
      return acc + (plan?.priceMonthly ?? 0);
    }, 0);
  const totalActive = subs.filter(s => s.status === "active").length;

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <CreditCard size={22} className="text-amber-400" /> Memberships
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage membership plans and customer subscriptions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:bg-gray-800 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => { setAssignOpen(true); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "#f5a800", color: "#07111f" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#d98f00")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f5a800")}
          >
            <Plus size={15} /> Assign Membership
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {plans.map(plan => {
          const vis = PLAN_VISUAL[plan.id];
          const activeCount = subs.filter(s => s.status === "active" && s.planId === plan.id).length;
          return (
            <div key={plan.id} className={`relative rounded-2xl border border-gray-700 bg-gradient-to-br ${vis.gradient} p-5 overflow-hidden`}>
              {/* Background watermark */}
              <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
                {plan.id === "priority"
                  ? <Crown size={80} className="text-amber-400" />
                  : <Star size={80} className="text-blue-400" />}
              </div>

              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {vis.icon}
                    <h2 className="text-lg font-black text-gray-100">{plan.name}</h2>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${vis.badge}`}>
                    {activeCount} active
                  </span>
                </div>

                <div className="text-3xl font-black text-gray-100 mb-1">
                  {fmt(plan.priceMonthly)}
                  <span className="text-sm font-medium text-gray-400 ml-1">/ month</span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Coffee size={14} className="text-gray-500 shrink-0" />
                    <span>
                      <strong className="text-gray-100">{plan.cupsPerWindow} cups</strong>
                      {" "}every <strong className="text-gray-100">{plan.windowHours} hour{plan.windowHours > 1 ? "s" : ""}</strong>
                      {" "}(coffee, tea, or mix)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock size={14} className="text-gray-500 shrink-0" />
                    <span>
                      {plan.stayUnlimited
                        ? <><strong className="text-gray-100">Unlimited</strong> stay time</>
                        : `Limited stay`}
                    </span>
                  </div>
                  {plan.description && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle2 size={14} className="text-gray-500 shrink-0" />
                      <span>{plan.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Users size={15} />,       label: "Total Active",       value: String(totalActive),      color: "text-blue-400" },
          { icon: <Star size={15} />,         label: "Basic Members",      value: String(activeBasic),      color: "text-blue-400" },
          { icon: <Crown size={15} />,        label: "Priority Members",   value: String(activePriority),   color: "text-amber-400" },
          { icon: <TrendingUp size={15} />,   label: "Monthly Revenue",    value: fmt(monthlyRevenue),      color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
            <div className={`flex items-center gap-2 mb-1 ${s.color}`}>{s.icon}
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{s.label}</span>
            </div>
            <p className="text-xl font-black text-gray-100">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input type="text" placeholder="Search by name or phone…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "active", "expired", "cancelled"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${statusFilter === s ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300"}`}>
              {s === "all" ? "All Status" : STATUS_STYLE[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["all", "basic", "priority"] as const).map(p => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${planFilter === p ? "bg-purple-500/20 text-purple-300 border-purple-500/40" : "bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300"}`}>
              {p === "all" ? "All Plans" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <RefreshCw size={20} className="animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-600">
          <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
          <p>No subscriptions found.</p>
          <button onClick={() => { setAssignOpen(true); setError(""); }}
            className="mt-3 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2">
            Assign a membership
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          {/* Head */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_1fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-900 border-b border-gray-800">
            <span>Customer</span><span>Plan</span><span>Status</span><span>Start</span><span>End</span><span>Amount</span><span>Actions</span>
          </div>
          <div className="divide-y divide-gray-800/60">
            {filtered.map(sub => {
              const ss  = STATUS_STYLE[sub.status];
              const vis = PLAN_VISUAL[sub.planId];
              const planLabel = sub.planId === "priority" ? "Priority" : "Basic";
              const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86_400_000);
              const expiringSoon = sub.status === "active" && daysLeft >= 0 && daysLeft <= 7;
              return (
                <div key={sub.id} className={`bg-gray-900 hover:bg-gray-800/40 transition-colors px-5 py-4 ${expiringSoon ? "border-l-2 border-amber-500" : ""}`}>
                  <div className="grid md:grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_1fr_auto] gap-4 items-center">
                    {/* Customer */}
                    <div>
                      <p className="font-semibold text-gray-200 text-sm">{sub.customerName}</p>
                      <p className="text-xs text-gray-500">{sub.customerPhone}</p>
                      {sub.notes && <p className="text-xs text-gray-600 mt-0.5 italic">{sub.notes}</p>}
                    </div>
                    {/* Plan */}
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${vis.badge}`}>
                        {sub.planId === "priority" ? <Crown size={10} /> : <Star size={10} />}
                        {planLabel}
                      </span>
                    </div>
                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${ss.bg} ${ss.color} ${ss.border}`}>
                        {ss.label}
                      </span>
                      {expiringSoon && (
                        <p className="text-xs text-amber-400 mt-0.5">Expires in {daysLeft}d</p>
                      )}
                    </div>
                    {/* Start */}
                    <div className="text-sm text-gray-400 flex items-center gap-1">
                      <CalendarDays size={12} className="text-gray-600 shrink-0" />
                      {fmtDate(sub.startDate)}
                    </div>
                    {/* End */}
                    <div className={`text-sm flex items-center gap-1 ${expiringSoon ? "text-amber-400 font-semibold" : "text-gray-400"}`}>
                      <CalendarDays size={12} className="text-gray-600 shrink-0" />
                      {fmtDate(sub.endDate)}
                    </div>
                    {/* Amount */}
                    <div className="text-sm font-bold text-gray-200">{fmt(sub.amountPaid)}</div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {sub.status !== "cancelled" && (
                        <button onClick={() => setExtendId(sub.id)} title="Extend 1 month"
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                          <Calendar size={12} /> +1M
                        </button>
                      )}
                      {sub.status === "active" && (
                        <button onClick={() => setCancelId(sub.id)} title="Cancel subscription"
                          className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ASSIGN MODAL ─────────────────────────────────────── */}
      {assignOpen && (
        <Modal title="Assign Membership" onClose={() => setAssignOpen(false)}>
          <div className="space-y-4">

            {/* Customer */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Customer</label>
              <select value={formCustomer} onChange={e => setFormCustomer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500">
                <option value="">— Select customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {/* Plan selection */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Membership Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map(plan => {
                  const vis = PLAN_VISUAL[plan.id];
                  const selected = formPlan === plan.id;
                  return (
                    <button key={plan.id} onClick={() => setFormPlan(plan.id)}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? plan.id === "priority"
                            ? "bg-amber-500/15 border-amber-500/50"
                            : "bg-blue-500/15 border-blue-500/50"
                          : "bg-gray-800 border-gray-700 hover:border-gray-600"
                      }`}>
                      <div className="flex items-center gap-1.5">
                        {vis.icon}
                        <span className="font-bold text-sm text-gray-100">{plan.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{fmt(plan.priceMonthly)}/mo</span>
                      <span className="text-xs text-gray-500">{plan.cupsPerWindow} cups / {plan.windowHours}h</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                <input type="date" value={formStart} onChange={e => setFormStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                <input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {/* Amount paid */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount Paid (IQD)</label>
              <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500" />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes <span className="text-gray-600">(optional)</span></label>
              <input type="text" placeholder="e.g. Renewal, promotion, etc." value={formNotes} onChange={e => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500" />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <span className="text-sm text-amber-300 font-semibold">
                {plans.find(p => p.id === formPlan)?.name ?? "—"}
              </span>
              <span className="text-base font-black text-amber-300">{fmt(parseFloat(formAmount || "0"))}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={handleAssign} disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
                style={{ background: "#f5a800", color: "#07111f" }}
                onMouseEnter={e => !saving && (e.currentTarget.style.background = "#d98f00")}
                onMouseLeave={e => (e.currentTarget.style.background = "#f5a800")}>
                {saving ? "Assigning…" : "Assign Membership"}
              </button>
              <button onClick={() => setAssignOpen(false)} className="px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── EXTEND CONFIRM ───────────────────────────────────── */}
      {extendId && (
        <Modal title="Extend Membership?" onClose={() => setExtendId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/25">
              <Calendar size={15} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">
                This will extend the membership end date by <strong>1 month</strong> and set status to Active if expired.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExtend} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {saving ? "Extending…" : "Extend +1 Month"}
              </button>
              <button onClick={() => setExtendId(null)} className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">Back</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── CANCEL CONFIRM ───────────────────────────────────── */}
      {cancelId && (
        <Modal title="Cancel Membership?" onClose={() => setCancelId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
              <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                This will immediately cancel the customer's membership. This cannot be undone, but you can assign a new membership anytime.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {saving ? "Cancelling…" : "Yes, Cancel Membership"}
              </button>
              <button onClick={() => setCancelId(null)} className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">Back</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h3 className="font-bold text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
