import { useState } from "react";
import { useInventory, type InventoryItem } from "@/data/inventoryStore";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_CONFIG } from "@/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, AlertTriangle, Package, CheckCircle, TrendingDown,
  Plus, Pencil, Trash2, Minus, X, Save,
} from "lucide-react";
import { useI18n } from "@/data/i18nStore";

const STATUS_CONFIG = {
  low:    { label: "Low Stock",  color: "bg-red-500/20 text-red-400",          icon: AlertTriangle, bar: "bg-red-500"    },
  medium: { label: "Moderate",   color: "bg-amber-500/20 text-amber-400",      icon: TrendingDown,  bar: "bg-amber-500"  },
  ok:     { label: "In Stock",   color: "bg-emerald-500/20 text-emerald-400",  icon: CheckCircle,   bar: "bg-emerald-500" },
};

function maxOf(item: InventoryItem) { return Math.max(item.reorderLevel * 5, item.stock + 1); }

// ── Item Form Modal ────────────────────────────────────────────
type FormData = {
  name: string; emoji: string; category: string;
  stock: string; reorderLevel: string; dailyAvg: string; cost: string;
};

const EMPTY_FORM: FormData = { name: "", emoji: "📦", category: "", stock: "0", reorderLevel: "0", dailyAvg: "0", cost: "0" };

function itemToForm(item: InventoryItem): FormData {
  return {
    name: item.name, emoji: item.emoji, category: item.category,
    stock: String(item.stock), reorderLevel: String(item.reorderLevel),
    dailyAvg: String(item.dailyAvg), cost: String(item.cost),
  };
}

function ItemModal({
  title, initial, onSave, onClose,
}: {
  title: string;
  initial: FormData;
  onSave: (data: FormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const valid = form.name.trim() && form.category.trim() &&
    Number(form.stock) >= 0 && Number(form.cost) >= 0 &&
    Number(form.reorderLevel) >= 0 && Number(form.dailyAvg) >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name + Emoji row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Item Name *</label>
              <Input value={form.name} onChange={set("name")} placeholder="e.g. Coffee Beans"
                className="bg-gray-800 border-gray-700 text-gray-200 text-sm" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Emoji</label>
              <Input value={form.emoji} onChange={set("emoji")} placeholder="☕"
                className="bg-gray-800 border-gray-700 text-gray-200 text-sm text-center" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category *</label>
            <Input value={form.category} onChange={set("category")} placeholder="e.g. Beverages"
              className="bg-gray-800 border-gray-700 text-gray-200 text-sm" />
          </div>

          {/* Numeric fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Current Stock</label>
              <Input type="number" min={0} value={form.stock} onChange={set("stock")}
                className="bg-gray-800 border-gray-700 text-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Reorder Level</label>
              <Input type="number" min={0} value={form.reorderLevel} onChange={set("reorderLevel")}
                className="bg-gray-800 border-gray-700 text-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Daily Avg (units)</label>
              <Input type="number" min={0} value={form.dailyAvg} onChange={set("dailyAvg")}
                className="bg-gray-800 border-gray-700 text-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Unit Cost (IQD)</label>
              <Input type="number" min={0} value={form.cost} onChange={set("cost")}
                className="bg-gray-800 border-gray-700 text-gray-200 text-sm" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 text-sm transition-colors">
            Cancel
          </button>
          <button onClick={() => valid && onSave(form)} disabled={!valid}
            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ───────────────────────────────────────
function DeleteModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-gray-100 font-semibold text-sm">Delete Item</p>
            <p className="text-gray-400 text-xs mt-0.5">Remove <span className="text-gray-200 font-medium">"{name}"</span> from inventory?</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 text-sm transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export function Inventory() {
  const { items, addItem, updateItem, deleteItem, adjustStock } = useInventory();
  const { user } = useAuth();
  const { fmt } = useI18n();

  const role = user?.role ?? "cashier";
  const canEdit = ROLE_CONFIG[role]?.canManageInventory ?? false;

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatus]       = useState<"all"|"low"|"medium"|"ok">("all");
  const [sortBy,       setSortBy]       = useState<"name"|"stock"|"value">("stock");
  const [addModal,     setAddModal]     = useState(false);
  const [editItem,     setEditItem]     = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const filtered = items
    .filter(item => {
      const matchSearch = !search
        || item.name.toLowerCase().includes(search.toLowerCase())
        || item.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name")  return a.name.localeCompare(b.name);
      if (sortBy === "value") return (b.stock * b.cost) - (a.stock * a.cost);
      return a.stock - b.stock;
    });

  const lowCount   = items.filter(i => i.status === "low").length;
  const medCount   = items.filter(i => i.status === "medium").length;
  const totalValue = items.reduce((s, i) => s + i.stock * i.cost, 0);

  // Save handlers
  const handleAdd = (form: FormData) => {
    addItem({
      name: form.name.trim(), emoji: form.emoji.trim() || "📦",
      category: form.category.trim(),
      stock: Number(form.stock), reorderLevel: Number(form.reorderLevel),
      dailyAvg: Number(form.dailyAvg), cost: Number(form.cost),
    });
    setAddModal(false);
  };

  const handleEdit = (form: FormData) => {
    if (!editItem) return;
    updateItem(editItem.id, {
      name: form.name.trim(), emoji: form.emoji.trim() || "📦",
      category: form.category.trim(),
      stock: Number(form.stock), reorderLevel: Number(form.reorderLevel),
      dailyAvg: Number(form.dailyAvg), cost: Number(form.cost),
    });
    setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteItem(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 space-y-4">

      {/* Modals */}
      {addModal  && <ItemModal title="Add Inventory Item" initial={EMPTY_FORM} onSave={handleAdd} onClose={() => setAddModal(false)} />}
      {editItem  && <ItemModal title="Edit Item" initial={itemToForm(editItem)} onSave={handleEdit} onClose={() => setEditItem(null)} />}
      {deleteTarget && <DeleteModal name={deleteTarget.name} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total SKUs",  value: items.length.toString(), color: "text-blue-400",    icon: Package       },
          { label: "Low Stock",   value: lowCount.toString(),     color: "text-red-400",     icon: AlertTriangle },
          { label: "Moderate",    value: medCount.toString(),     color: "text-amber-400",   icon: TrendingDown  },
          { label: "Stock Value", value: fmt(totalValue, true),   color: "text-emerald-400", icon: CheckCircle   },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
                <Icon size={20} className={`${color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low stock alert */}
      {lowCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400 mb-0.5">Reorder Required</p>
            <p className="text-xs text-gray-400">
              {items.filter(i => i.status === "low").map(i => i.name).join(", ")} {lowCount > 1 ? "are" : "is"} running critically low.
            </p>
          </div>
        </div>
      )}

      {/* Filters + Add button */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Search item or category…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 bg-gray-800 border-gray-700 text-gray-200 text-sm w-52" />
        </div>
        <div className="flex gap-1">
          {(["all","low","medium","ok"] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter===s?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <span className="text-xs text-gray-500 self-center mr-1">Sort:</span>
          {(["stock","name","value"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${sortBy===s?"bg-gray-700 text-white":"bg-gray-800 text-gray-500 hover:bg-gray-700"}`}>{s}</button>
          ))}
        </div>
        {canEdit && (
          <button onClick={() => setAddModal(true)}
            className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            <Plus size={15} /> Add Item
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="text-left">
                  {["Item","Category","Stock","Daily Avg","Days Left","Unit Cost","Value","Fill Level","Status",
                    ...(canEdit ? ["Actions"] : [])
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-600 text-sm">No items found</td></tr>
                ) : filtered.map(item => {
                  const cfg      = STATUS_CONFIG[item.status];
                  const StatusIcon = cfg.icon;
                  const max      = maxOf(item);
                  const fillPct  = Math.min(100, Math.round((item.stock / max) * 100));
                  return (
                    <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-200 font-medium whitespace-nowrap">{item.emoji} {item.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{item.category}</td>
                      {/* Stock with inline ±1 buttons */}
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => adjustStock(item.id, -1)}
                              className="w-6 h-6 rounded-md bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors">
                              <Minus size={10} />
                            </button>
                            <span className="text-gray-300 font-semibold w-8 text-center">{item.stock}</span>
                            <button onClick={() => adjustStock(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-gray-800 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 flex items-center justify-center transition-colors">
                              <Plus size={10} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-semibold">{item.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.dailyAvg}/day</td>
                      <td className={`px-4 py-3 text-xs font-semibold ${item.daysLeft <= 2 ? "text-red-400" : item.daysLeft <= 5 ? "text-amber-400" : "text-emerald-400"}`}>
                        {item.daysLeft}d
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{fmt(item.cost)}</td>
                      <td className="px-4 py-3 text-blue-400 font-semibold">{fmt(item.stock * item.cost)}</td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${fillPct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{fillPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs px-2 py-0.5 flex items-center gap-1 w-fit ${cfg.color}`}>
                          <StatusIcon size={10} />{cfg.label}
                        </Badge>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditItem(item)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stock level bars */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Stock Level Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map(item => {
                const cfg     = STATUS_CONFIG[item.status];
                const fillPct = Math.min(100, Math.round((item.stock / maxOf(item)) * 100));
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{item.emoji} {item.name}</span>
                      <span className="text-gray-500">{item.stock} units · {item.daysLeft}d left</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reorder checklist */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Reorder Checklist</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {items
                .filter(i => i.status !== "ok")
                .sort((a, b) => a.daysLeft - b.daysLeft)
                .map(item => {
                  const cfg    = STATUS_CONFIG[item.status];
                  const needed = Math.max(0, maxOf(item) - item.stock);
                  const cost   = needed * item.cost;
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${item.status === "low" ? "bg-red-400" : "bg-amber-400"}`} />
                        <div>
                          <p className="text-sm text-gray-200 font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">Order ~{needed} units · {item.daysLeft}d remaining</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-400 font-semibold">{fmt(cost)}</p>
                        <Badge className={`text-xs px-1.5 py-0 ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              {items.filter(i => i.status !== "ok").length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500/40" />
                  <p className="text-sm">All items are well stocked!</p>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs">
              <span className="text-gray-500">Estimated reorder cost:</span>
              <span className="text-blue-400 font-semibold">
                {fmt(items.filter(i => i.status !== "ok").reduce((s, i) => s + Math.max(0, maxOf(i) - i.stock) * i.cost, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
