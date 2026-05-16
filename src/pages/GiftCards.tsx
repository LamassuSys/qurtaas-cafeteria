import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";
import {
  Gift, Plus, Copy, Check, X, RefreshCw, Search,
  AlertTriangle, Calendar, Banknote, Tag, Hash,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
type CardStatus = "active" | "used" | "expired" | "cancelled";

interface GiftCard {
  id:          string;
  code:        string;
  value:       number;
  balance:     number;
  status:      CardStatus;
  note:        string;
  createdBy:   string;
  createdAt:   string;
  expiresAt:   string | null;
  redeemedBy:  string | null;
  redeemedAt:  string | null;
}

// ── Helpers ────────────────────────────────────────────────────
const fmt      = (n: number) => `${n.toLocaleString("en-IQ")} IQD`;
const fmtDate  = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg   = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `INK-${seg(4)}-${seg(4)}-${seg(4)}`;
}

const STATUS_STYLE: Record<CardStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: "Active",    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  used:      { label: "Used",      color: "text-gray-400",    bg: "bg-gray-500/10",    border: "border-gray-600"       },
  expired:   { label: "Expired",   color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  cancelled: { label: "Cancelled", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30"     },
};

// ── Main ───────────────────────────────────────────────────────
export function GiftCards() {
  const { user } = useAuth();

  const [cards,       setCards]       = useState<GiftCard[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter] = useState<"all" | CardStatus>("all");
  const [createOpen,  setCreateOpen]  = useState(false);
  const [cancelId,    setCancelId]    = useState<string | null>(null);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  // Create form state
  const [formValue,    setFormValue]    = useState("25000");
  const [formQty,      setFormQty]      = useState("1");
  const [formNote,     setFormNote]     = useState("");
  const [formExpires,  setFormExpires]  = useState("");
  const [formCodes,    setFormCodes]    = useState<string[]>([generateCode()]);

  const refreshCodes = (qty: number) =>
    setFormCodes(Array.from({ length: Math.max(1, Math.min(qty, 20)) }, generateCode));

  // ── Load ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        setCards(data.map((r: Record<string, unknown>) => ({
          id:         r.id          as string,
          code:       r.code        as string,
          value:      Number(r.value),
          balance:    Number(r.balance),
          status:     r.status      as CardStatus,
          note:       (r.note as string) || "",
          createdBy:  r.created_by  as string,
          createdAt:  r.created_at  as string,
          expiresAt:  r.expires_at  as string | null,
          redeemedBy: r.redeemed_by as string | null,
          redeemedAt: r.redeemed_at as string | null,
        })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create cards ──────────────────────────────────────────────
  const handleCreate = async () => {
    const value = parseFloat(formValue);
    if (!value || value <= 0) { setError("Enter a valid value"); return; }
    setSaving(true); setError("");
    try {
      const rows = formCodes.map(code => ({
        code,
        value,
        balance:    value,
        status:     "active",
        note:       formNote.trim() || null,
        created_by: user?.username ?? "admin",
        expires_at: formExpires ? new Date(formExpires).toISOString() : null,
      }));
      const { error: e } = await supabase.from("gift_cards").insert(rows);
      if (e) { setError(e.message); return; }
      setCreateOpen(false);
      setFormValue("25000"); setFormQty("1"); setFormNote(""); setFormExpires("");
      setFormCodes([generateCode()]);
      load();
    } catch (ex) { setError((ex as Error).message); }
    finally { setSaving(false); }
  };

  // ── Cancel card ───────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelId) return;
    setSaving(true);
    await supabase.from("gift_cards").update({ status: "cancelled" }).eq("id", cancelId);
    setCards(prev => prev.map(c => c.id === cancelId ? { ...c, status: "cancelled" } : c));
    setCancelId(null); setSaving(false);
  };

  // ── Copy code ─────────────────────────────────────────────────
  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Filtered ──────────────────────────────────────────────────
  const filtered = cards.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.code.toLowerCase().includes(q) || c.note.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────
  const totalValue   = cards.filter(c => c.status === "active").reduce((s, c) => s + c.balance, 0);
  const totalIssued  = cards.length;
  const activeCount  = cards.filter(c => c.status === "active").length;
  const usedCount    = cards.filter(c => c.status === "used").length;

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Gift size={22} className="text-amber-400" /> Gift Cards
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage gift card codes for your customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:bg-gray-800 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => { setCreateOpen(true); setFormCodes([generateCode()]); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "#f5a800", color: "#07111f" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#d98f00")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f5a800")}
          >
            <Plus size={15} /> Create Gift Card
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Hash size={15} />,     label: "Total Issued",    value: String(totalIssued),  color: "text-blue-400" },
          { icon: <Banknote size={15} />, label: "Active Balance",  value: fmt(totalValue),       color: "text-amber-400" },
          { icon: <Check size={15} />,    label: "Active Cards",    value: String(activeCount),   color: "text-emerald-400" },
          { icon: <Tag size={15} />,      label: "Used / Redeemed", value: String(usedCount),     color: "text-gray-400" },
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
          <input type="text" placeholder="Search by code or note…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "active", "used", "expired", "cancelled"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${statusFilter === s ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300"}`}>
              {s === "all" ? "All" : STATUS_STYLE[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <RefreshCw size={20} className="animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-600">
          <Gift size={32} className="mx-auto mb-3 opacity-30" />
          <p>No gift cards found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          {/* Head */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-900 border-b border-gray-800">
            <span>Code</span><span>Value</span><span>Balance</span><span>Status</span><span>Expires</span><span>Actions</span>
          </div>
          <div className="divide-y divide-gray-800/60">
            {filtered.map(card => {
              const ss = STATUS_STYLE[card.status];
              return (
                <div key={card.id} className="bg-gray-900 hover:bg-gray-800/40 transition-colors px-5 py-4">
                  <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr_auto] gap-4 items-center">
                    {/* Code + note */}
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-bold text-amber-300">{card.code}</code>
                        <button onClick={() => copyCode(card.id, card.code)} className="text-gray-600 hover:text-amber-400 transition-colors">
                          {copiedId === card.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                      {card.note && <p className="text-xs text-gray-500 mt-0.5">{card.note}</p>}
                      <p className="text-xs text-gray-600 mt-0.5">By {card.createdBy} · {fmtDate(card.createdAt)}</p>
                    </div>
                    {/* Value */}
                    <div className="text-sm font-bold text-gray-200">{fmt(card.value)}</div>
                    {/* Balance */}
                    <div>
                      <span className={`text-sm font-bold ${card.balance < card.value ? "text-amber-400" : "text-emerald-400"}`}>{fmt(card.balance)}</span>
                      {card.balance < card.value && (
                        <p className="text-xs text-gray-600">{Math.round((1 - card.balance / card.value) * 100)}% used</p>
                      )}
                    </div>
                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${ss.bg} ${ss.color} ${ss.border}`}>
                        {ss.label}
                      </span>
                    </div>
                    {/* Expires */}
                    <div className="text-sm text-gray-500">
                      {card.expiresAt ? fmtDate(card.expiresAt) : <span className="text-gray-700">No expiry</span>}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => copyCode(card.id, card.code)} title="Copy code"
                        className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        {copiedId === card.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      {card.status === "active" && (
                        <button onClick={() => setCancelId(card.id)} title="Cancel card"
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

      {/* ── CREATE MODAL ─────────────────────────────────────── */}
      {createOpen && (
        <Modal title="Create Gift Cards" onClose={() => setCreateOpen(false)}>
          <div className="space-y-4">
            {/* Value */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Card Value (IQD)</label>
              <div className="flex gap-2 flex-wrap">
                {["10000","25000","50000","100000"].map(v => (
                  <button key={v} onClick={() => setFormValue(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${formValue === v ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200"}`}>
                    {fmt(Number(v))}
                  </button>
                ))}
                <input type="number" value={formValue} onChange={e => setFormValue(e.target.value)}
                  placeholder="Custom…"
                  className="flex-1 min-w-24 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Quantity (max 20)</label>
              <div className="flex gap-2 items-center">
                <input type="number" min={1} max={20} value={formQty}
                  onChange={e => {
                    const q = Math.max(1, Math.min(20, Number(e.target.value)));
                    setFormQty(String(q));
                    refreshCodes(q);
                  }}
                  className="w-24 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm text-center focus:outline-none focus:border-amber-500" />
                <button onClick={() => refreshCodes(Number(formQty))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 text-xs transition-colors">
                  <RefreshCw size={12} /> Re-generate codes
                </button>
              </div>
            </div>

            {/* Preview codes */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Generated Codes</label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {formCodes.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
                    <code className="font-mono text-xs text-amber-300 flex-1">{c}</code>
                    <button onClick={() => { navigator.clipboard.writeText(c); }} className="text-gray-600 hover:text-amber-400">
                      <Copy size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Expiry Date <span className="text-gray-600">(optional)</span></label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="date" value={formExpires} onChange={e => setFormExpires(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Note / Issued To <span className="text-gray-600">(optional)</span></label>
              <input type="text" placeholder="e.g. Birthday gift for Ahmed…" value={formNote} onChange={e => setFormNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500" />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <span className="text-sm text-amber-300 font-semibold">Total issuance value</span>
              <span className="text-base font-black text-amber-300">{fmt(parseFloat(formValue || "0") * formCodes.length)}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
                style={{ background: "#f5a800", color: "#07111f" }}
                onMouseEnter={e => !saving && (e.currentTarget.style.background = "#d98f00")}
                onMouseLeave={e => (e.currentTarget.style.background = "#f5a800")}>
                {saving ? "Creating…" : `Create ${formCodes.length} Card${formCodes.length > 1 ? "s" : ""}`}
              </button>
              <button onClick={() => setCreateOpen(false)} className="px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── CANCEL CONFIRM ───────────────────────────────────── */}
      {cancelId && (
        <Modal title="Cancel Gift Card?" onClose={() => setCancelId(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
              <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">This card will be permanently cancelled and can no longer be redeemed. This cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors">
                {saving ? "Cancelling…" : "Yes, Cancel Card"}
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
