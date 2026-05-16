import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useOrders } from "@/data/ordersStore";
import {
  Search, UserCircle2, Trophy, TrendingUp, Users,
  Edit2, Trash2, Plus, Minus, X, ChevronDown, ChevronUp,
  RefreshCw, Phone, Star, ShoppingBag, AlertTriangle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface Customer {
  id:            string;
  name:          string;
  phone:         string;
  tier:          "bronze" | "silver" | "gold" | "platinum";
  points:        number;
  totalSpent:    number;
  createdAt:     string;
}

// ── Tier config ───────────────────────────────────────────────
const TIER = {
  bronze:   { label: "Bronze",   emoji: "🥉", color: "text-amber-700",   bg: "bg-amber-900/30",  border: "border-amber-700/40" },
  silver:   { label: "Silver",   emoji: "🥈", color: "text-slate-300",   bg: "bg-slate-700/30",  border: "border-slate-500/40" },
  gold:     { label: "Gold",     emoji: "🥇", color: "text-amber-400",   bg: "bg-amber-500/20",  border: "border-amber-500/40" },
  platinum: { label: "Platinum", emoji: "💎", color: "text-purple-400",  bg: "bg-purple-500/20", border: "border-purple-500/40" },
} as const;

const fmt = (n: number) => `${n.toLocaleString("en-IQ")} IQD`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// ── Main component ────────────────────────────────────────────
export function Customers() {
  const { orders } = useOrders();

  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | Customer["tier"]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editModal,  setEditModal]  = useState<Customer | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [pointsModal, setPointsModal] = useState<Customer | null>(null);
  const [pointsDelta, setPointsDelta] = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  // Edit form state
  const [editName,  setEditName]  = useState("");
  const [editPhone, setEditPhone] = useState("");

  // ── Load customers ──────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("customers")
        .select("id, name, phone, membership_tier, points, total_spent, created_at")
        .order("total_spent", { ascending: false });
      if (data) {
        setCustomers(data.map((r: Record<string, unknown>) => ({
          id:         r.id            as string,
          name:       r.name          as string,
          phone:      r.phone         as string,
          tier:       (r.membership_tier as Customer["tier"]) ?? "bronze",
          points:     Number(r.points),
          totalSpent: Number(r.total_spent),
          createdAt:  r.created_at    as string,
        })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Real-time updates (loyalty trigger fires on order completion)
    const ch = supabase.channel("customers_mgmt_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  // ── Derived stats ──────────────────────────────────────────
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const tierCounts   = customers.reduce<Record<string, number>>((acc, c) => {
    acc[c.tier] = (acc[c.tier] ?? 0) + 1; return acc;
  }, {});

  // ── Filtered list ──────────────────────────────────────────
  const filtered = customers.filter(c => {
    const matchSearch = !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search.trim());
    const matchTier = tierFilter === "all" || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  // Orders per customer (from global store)
  const ordersByCustomer = (customerId: string) =>
    orders.filter(o => o.customerId === customerId);

  // ── Edit customer ──────────────────────────────────────────
  const openEdit = (c: Customer) => {
    setEditName(c.name); setEditPhone(c.phone);
    setEditModal(c); setError("");
  };
  const saveEdit = async () => {
    if (!editModal) return;
    if (!editName.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      await supabase.from("customers")
        .update({ name: editName.trim(), phone: editPhone.trim() })
        .eq("id", editModal.id);
      setCustomers(prev => prev.map(c =>
        c.id === editModal.id ? { ...c, name: editName.trim(), phone: editPhone.trim() } : c
      ));
      setEditModal(null);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  // ── Delete customer ────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await supabase.from("customers").delete().eq("id", deleteId);
      setCustomers(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // ── Adjust points ──────────────────────────────────────────
  const openPoints = (c: Customer) => {
    setPointsDelta(0); setPointsModal(c); setError("");
  };
  const savePoints = async () => {
    if (!pointsModal) return;
    const newPoints = Math.max(0, pointsModal.points + pointsDelta);
    setSaving(true); setError("");
    try {
      await supabase.from("customers")
        .update({ points: newPoints })
        .eq("id", pointsModal.id);
      setCustomers(prev => prev.map(c =>
        c.id === pointsModal.id ? { ...c, points: newPoints } : c
      ));
      setPointsModal(null);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  // ── Reset PIN ──────────────────────────────────────────────
  const resetPin = async (c: Customer) => {
    const newPin = prompt(`Reset PIN for ${c.name}?\n\nEnter new 4-digit PIN:`);
    if (!newPin) return;
    if (!/^\d{4}$/.test(newPin)) { alert("PIN must be exactly 4 digits."); return; }
    await supabase.from("customers").update({ pin: newPin }).eq("id", c.id);
    alert(`PIN reset successfully for ${c.name}.`);
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <UserCircle2 size={22} className="text-amber-400" /> Customer Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {customers.length} registered members · real-time loyalty sync
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-700 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Stats row ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<Users size={16} />} label="Total Members" value={String(customers.length)} color="text-blue-400" />
        <StatCard icon={<TrendingUp size={16} />} label="Total Revenue" value={fmt(totalRevenue)} color="text-amber-400" />
        <StatCard icon={<span className="text-base">🥉</span>} label="Bronze" value={String(tierCounts.bronze ?? 0)} color="text-amber-700" />
        <StatCard icon={<span className="text-base">🥇</span>} label="Gold" value={String(tierCounts.gold ?? 0)} color="text-amber-400" />
        <StatCard icon={<span className="text-base">💎</span>} label="Platinum" value={String(tierCounts.platinum ?? 0)} color="text-purple-400" />
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tier filter pills */}
        <div className="flex gap-1.5">
          {(["all", "bronze", "silver", "gold", "platinum"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                tierFilter === t
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  : "bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300"
              }`}
            >
              {t === "all" ? "All Tiers" : `${TIER[t].emoji} ${TIER[t].label}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
          <RefreshCw size={20} className="animate-spin" /> Loading customers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-600">
          <UserCircle2 size={32} className="mx-auto mb-3 opacity-30" />
          <p>No customers found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          {/* Table head */}
          <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_1.2fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-900 border-b border-gray-800">
            <span>Customer</span>
            <span>Tier</span>
            <span>Points</span>
            <span>Total Spent</span>
            <span>Member Since</span>
            <span>Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-800/60">
            {filtered.map(c => {
              const tc = TIER[c.tier] ?? TIER.bronze;
              const myOrders = ordersByCustomer(c.id);
              const isExpanded = expandedId === c.id;

              return (
                <div key={c.id} className="bg-gray-900 hover:bg-gray-800/40 transition-colors">
                  {/* Main row */}
                  <div className="grid md:grid-cols-[2fr_1.2fr_1fr_1.2fr_1.2fr_auto] gap-4 px-5 py-4 items-center">
                    {/* Name + phone */}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-100 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {c.phone}
                      </p>
                    </div>

                    {/* Tier badge */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${tc.bg} ${tc.color} ${tc.border}`}>
                        {tc.emoji} {tc.label}
                      </span>
                    </div>

                    {/* Points */}
                    <div>
                      <p className="font-bold text-purple-300">{c.points.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">pts</p>
                    </div>

                    {/* Spent */}
                    <div>
                      <p className="font-bold text-amber-400">{fmt(c.totalSpent)}</p>
                      <p className="text-xs text-gray-600">{myOrders.length} orders</p>
                    </div>

                    {/* Date */}
                    <div className="text-sm text-gray-500">{fmtDate(c.createdAt)}</div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Expand orders */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        title="View orders"
                        className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      {/* Adjust points */}
                      <button
                        onClick={() => openPoints(c)}
                        title="Adjust points"
                        className="p-1.5 rounded-md text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                      >
                        <Star size={15} />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(c)}
                        title="Edit customer"
                        className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      {/* Reset PIN */}
                      <button
                        onClick={() => resetPin(c)}
                        title="Reset PIN"
                        className="p-1.5 rounded-md text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-xs font-bold"
                      >
                        PIN
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setDeleteId(c.id)}
                        title="Delete customer"
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: order history ─────────────── */}
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-gray-800">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 mb-2 flex items-center gap-1.5">
                        <ShoppingBag size={11} /> Order History ({myOrders.length})
                      </p>
                      {myOrders.length === 0 ? (
                        <p className="text-sm text-gray-600 py-2">No orders yet from this customer.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {myOrders.slice(0, 30).map(o => {
                            const STATUS_COLOR: Record<string, string> = {
                              pending: "text-amber-400", preparing: "text-blue-400",
                              ready: "text-emerald-400", completed: "text-gray-400", cancelled: "text-red-400",
                            };
                            return (
                              <div key={o.id} className="flex items-center justify-between text-xs rounded-lg px-3 py-2 bg-gray-800/50 border border-gray-700/50">
                                <span className="text-gray-400">#{o.orderNumber} · {o.items.length} item{o.items.length !== 1 ? "s" : ""}</span>
                                <span className={`font-semibold capitalize ${STATUS_COLOR[o.status] ?? "text-gray-400"}`}>{o.status}</span>
                                <span className="text-amber-400 font-bold">{fmt(o.total)}</span>
                                <span className="text-gray-600">{new Date(o.createdAt).toLocaleDateString("en-GB")}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Edit modal ────────────────────────────────────── */}
      {editModal && (
        <Modal title={`Edit — ${editModal.name}`} onClose={() => setEditModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name</label>
              <input
                value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone</label>
              <input
                value={editPhone} onChange={e => setEditPhone(e.target.value)} type="tel"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setEditModal(null)}
                className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Adjust points modal ───────────────────────────── */}
      {pointsModal && (
        <Modal title={`Adjust Points — ${pointsModal.name}`} onClose={() => setPointsModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <p className="text-2xl font-black text-purple-300">{pointsModal.points.toLocaleString()}</p>
              </div>
              <span className="text-gray-600 text-xl">{pointsDelta >= 0 ? "+" : ""}{pointsDelta}</span>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">New Total</p>
                <p className="text-2xl font-black text-amber-400">{Math.max(0, pointsModal.points + pointsDelta).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setPointsDelta(d => d - 100)}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                <Minus size={16} />
              </button>
              <input
                type="number" value={pointsDelta}
                onChange={e => setPointsDelta(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm text-center focus:outline-none focus:border-blue-500"
              />
              <button onClick={() => setPointsDelta(d => d + 100)}
                className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center">Enter a positive number to add, negative to subtract.</p>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button onClick={savePoints} disabled={saving || pointsDelta === 0}
                className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm disabled:opacity-40 transition-colors">
                {saving ? "Saving…" : "Apply"}
              </button>
              <button onClick={() => setPointsModal(null)}
                className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ────────────────────────────────── */}
      {deleteId && (
        <Modal title="Delete Customer?" onClose={() => setDeleteId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                This will permanently remove the customer and unlink their orders. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={confirmDelete} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {saving ? "Deleting…" : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Reusable subcomponents ────────────────────────────────────
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
      <div className={`flex items-center gap-2 mb-1 ${color}`}>{icon}
        <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="text-xl font-black text-gray-100">{value}</p>
    </div>
  );
}

function Modal({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-gray-100 text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
