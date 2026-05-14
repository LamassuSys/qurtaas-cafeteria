import { useState } from "react";
import { inventoryData } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, Package, CheckCircle, TrendingDown } from "lucide-react";
import { useI18n } from "@/data/i18nStore";

const STATUS_CONFIG = {
  low:    { label: "Low Stock",  color: "bg-red-500/20 text-red-400",     icon: AlertTriangle, bar: "bg-red-500"    },
  medium: { label: "Moderate",   color: "bg-amber-500/20 text-amber-400", icon: TrendingDown,  bar: "bg-amber-500"  },
  ok:     { label: "In Stock",   color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle, bar: "bg-emerald-500" },
};

// Derive a sensible "max capacity" = reorderLevel * 5 (reorderLevel = 2× daily avg, so max ≈ 10× daily avg)
function maxOf(item: typeof inventoryData[number]) { return Math.max(item.reorderLevel * 5, item.stock + 1); }

export function Inventory() {
  const { fmt } = useI18n();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<"all"|"low"|"medium"|"ok">("all");
  const [sortBy, setSortBy]         = useState<"name"|"stock"|"value">("stock");

  const filtered = inventoryData
    .filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name")  return a.name.localeCompare(b.name);
      if (sortBy === "value") return (b.stock * b.cost) - (a.stock * a.cost);
      return a.stock - b.stock;
    });

  const lowCount    = inventoryData.filter(i => i.status === "low").length;
  const medCount    = inventoryData.filter(i => i.status === "medium").length;
  const totalValue  = inventoryData.reduce((s, i) => s + i.stock * i.cost, 0);

  return (
    <div className="p-6 space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total SKUs",  value: inventoryData.length.toString(), color: "text-blue-400",    icon: Package      },
          { label: "Low Stock",   value: lowCount.toString(),             color: "text-red-400",     icon: AlertTriangle },
          { label: "Moderate",    value: medCount.toString(),             color: "text-amber-400",   icon: TrendingDown  },
          { label: "Stock Value", value: fmt(totalValue, true),           color: "text-emerald-400", icon: CheckCircle   },
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

      {/* Alert banner */}
      {lowCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400 mb-0.5">Reorder Required</p>
            <p className="text-xs text-gray-400">
              {inventoryData.filter(i => i.status === "low").map(i => i.name).join(", ")} {lowCount > 1 ? "are" : "is"} running critically low. Place orders immediately to avoid stockouts.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Search item or category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 bg-gray-800 border-gray-700 text-gray-200 text-sm w-52" />
        </div>
        <div className="flex gap-1">
          {(["all","low","medium","ok"] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter===s?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <span className="text-xs text-gray-500 self-center mr-1">Sort:</span>
          {(["stock","name","value"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${sortBy===s?"bg-gray-700 text-white":"bg-gray-800 text-gray-500 hover:bg-gray-700"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="text-left">
                  {["Item","Category","Stock","Daily Avg","Days Left","Unit Cost","Value","Fill Level","Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(item => {
                  const cfg     = STATUS_CONFIG[item.status];
                  const StatusIcon = cfg.icon;
                  const max     = maxOf(item);
                  const fillPct = Math.min(100, Math.round((item.stock / max) * 100));
                  return (
                    <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-200 font-medium whitespace-nowrap">{item.emoji} {item.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{item.category}</td>
                      <td className="px-4 py-3 text-gray-300 font-semibold">{item.stock}</td>
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
              {inventoryData.map(item => {
                const cfg     = STATUS_CONFIG[item.status];
                const fillPct = Math.min(100, Math.round((item.stock / maxOf(item)) * 100));
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{item.name}</span>
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
              {inventoryData
                .filter(i => i.status !== "ok")
                .sort((a, b) => a.daysLeft - b.daysLeft)
                .map(item => {
                  const cfg     = STATUS_CONFIG[item.status];
                  const needed  = Math.max(0, maxOf(item) - item.stock);
                  const cost    = needed * item.cost;
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
              {inventoryData.filter(i => i.status !== "ok").length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500/40" />
                  <p className="text-sm">All items are well stocked!</p>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs">
              <span className="text-gray-500">Estimated reorder cost:</span>
              <span className="text-blue-400 font-semibold">
                {fmt(inventoryData.filter(i => i.status !== "ok").reduce((s, i) => s + Math.max(0, maxOf(i) - i.stock) * i.cost, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
