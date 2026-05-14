import { useState } from "react";
import { useOrders, STATUS_META, type OrderStatus, type Order } from "@/data/ordersStore";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_CONFIG } from "@/auth/roles";
import { useI18n } from "@/data/i18nStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, Clock, User } from "lucide-react";

const STATUS_TABS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all",       label: "All"        },
  { id: "pending",   label: "Pending"    },
  { id: "preparing", label: "Preparing"  },
  { id: "ready",     label: "Ready"      },
  { id: "completed", label: "Completed"  },
  { id: "cancelled", label: "Cancelled"  },
];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function OrderCard({ order, canAdvance, canCancel, onAdvance, onCancel }: {
  order: Order;
  canAdvance: boolean;
  canCancel: boolean;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[order.status];
  const { fmt } = useI18n();

  return (
    <Card className={`border ${meta.bg} bg-gray-900 transition-all`}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-200">#{order.orderNumber}</span>
            <Badge className={`text-xs px-2 py-0 ${meta.bg} ${meta.color} border-0`}>{meta.label}</Badge>
            {order.customerName && order.customerName !== "Walk-in" && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <User size={11} />{order.customerName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={11} />{timeAgo(order.createdAt)}</span>
            <button onClick={() => setExpanded(v => !v)} className="text-gray-600 hover:text-gray-300 transition-colors">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Items summary */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {order.items.map(item => (
            <span key={item.menuItemId} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
              {item.emoji} {item.name} ×{item.qty}
            </span>
          ))}
        </div>

        {/* Total + actions */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-blue-400">{fmt(order.total)}</span>
          <div className="flex gap-2">
            {canCancel && order.status !== "completed" && order.status !== "cancelled" && (
              <button onClick={onCancel}
                className="px-2.5 py-1 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
                Cancel
              </button>
            )}
            {canAdvance && meta.next && (
              <button onClick={onAdvance}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                {meta.nextLabel}
              </button>
            )}
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
            {order.notes && (
              <p className="text-xs text-gray-400 italic">📝 {order.notes}</p>
            )}
            <div className="space-y-1.5">
              {order.items.map(item => (
                <div key={item.menuItemId} className="flex justify-between text-xs">
                  <span className="text-gray-400">{item.emoji} {item.name} ×{item.qty}</span>
                  <span className="text-gray-300">{fmt(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-semibold border-t border-gray-800 pt-1">
                <span className="text-gray-400">Total</span>
                <span className="text-blue-400">{fmt(order.total)}</span>
              </div>
            </div>
            {/* Status history */}
            <div className="space-y-1 pt-1">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[h.status].color.replace("text-","bg-")}`} />
                  <span className={STATUS_META[h.status].color}>{STATUS_META[h.status].label}</span>
                  <span>by {h.by}</span>
                  <span className="ml-auto">{formatTime(h.at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Orders() {
  const { user } = useAuth();
  const { fmt } = useI18n();
  const { orders, updateStatus, cancelOrder } = useOrders();
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  const role = user?.role ?? "cashier";
  const canAdvance = role === "barista" || role === "super_admin" || role === "admin" || role === "cashier";
  const canCancel  = role === "super_admin" || role === "admin" || role === "cashier";

  // barista only sees pending/preparing/ready
  const isBarista = role === "barista";

  const filtered = orders.filter(o => {
    if (isBarista && o.status === "cancelled") return false;
    if (isBarista && o.status === "completed") return false;
    const matchTab    = tab === "all" || o.status === tab;
    const matchSearch = !search || o.orderNumber.toString().includes(search)
      || o.customerName.toLowerCase().includes(search.toLowerCase())
      || o.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  // KPIs
  const todayOrders  = orders.filter(o => o.createdAt.startsWith(new Date().toISOString().slice(0,10)));
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const preparingCount = orders.filter(o => o.status === "preparing").length;
  const todayRevenue = todayOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  const canSeeRevenue = ROLE_CONFIG[role].canViewFinancials || role === "cashier";

  return (
    <div className="p-6 space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pending",      value: pendingCount.toString(),        color: "text-amber-400"   },
          { label: "Preparing",    value: preparingCount.toString(),      color: "text-blue-400"    },
          { label: "Today Orders", value: todayOrders.length.toString(),  color: "text-purple-400"  },
          { label: "Today Revenue",value: canSeeRevenue ? fmt(todayRevenue) : "—", color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.filter(t => !isBarista || !["all","completed","cancelled"].includes(t.id)).map(t => {
            const count = t.id === "all" ? orders.length : orders.filter(o => o.status === t.id).length;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  tab === t.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                {t.label}
                {count > 0 && <span className={`text-[10px] px-1 rounded ${tab === t.id ? "bg-blue-500" : "bg-gray-700"}`}>{count}</span>}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 bg-gray-800 border-gray-700 text-gray-200 text-sm w-48 h-8" />
        </div>
      </div>

      {/* Orders grid */}
      {filtered.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center text-gray-600">
            <p className="text-sm">No orders found</p>
            {orders.length === 0 && <p className="text-xs mt-1">Orders placed from the POS will appear here</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order}
              canAdvance={canAdvance}
              canCancel={canCancel}
              onAdvance={() => STATUS_META[order.status].next && updateStatus(order.id, STATUS_META[order.status].next!, user?.username ?? "staff")}
              onCancel={() => cancelOrder(order.id, user?.username ?? "staff")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
