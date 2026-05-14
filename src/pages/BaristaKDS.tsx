import { useState, useEffect } from "react";
import { useOrders, STATUS_META, type Order } from "@/data/ordersStore";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/data/i18nStore";
import { Clock, CheckCircle, ChefHat, Bell } from "lucide-react";

function elapsed(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function KDSCard({ order, onAction, username }: { order: Order; onAction: () => void; username: string }) {
  const [, setTick] = useState(0);
  const { t } = useI18n();
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const age = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
  const urgent = age > 300; // >5 min
  const meta = STATUS_META[order.status];

  return (
    <div className={`rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
      order.status === "preparing"
        ? "border-blue-500/60 bg-blue-500/5"
        : urgent
          ? "border-red-500/60 bg-red-500/5 animate-pulse"
          : "border-amber-500/40 bg-amber-500/5"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black ${urgent && order.status === "pending" ? "text-red-400" : "text-gray-100"}`}>
            #{order.orderNumber}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <span className={`flex items-center gap-1 text-sm font-mono font-bold ${urgent ? "text-red-400" : "text-gray-400"}`}>
          <Clock size={13} />{elapsed(order.createdAt)}
        </span>
      </div>

      {/* Customer */}
      {order.customerName && order.customerName !== "Walk-in" && (
        <p className="text-sm text-gray-300 font-medium">👤 {order.customerName}</p>
      )}

      {/* Items — big and clear */}
      <div className="space-y-2.5">
        {order.items.map(item => (
          <div key={item.menuItemId} className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
              item.qty > 1 ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
            }`}>{item.qty}</span>
            <span className="text-xl">{item.emoji}</span>
            <span className="text-sm font-semibold text-gray-200">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-300">
          📝 {order.notes}
        </div>
      )}

      {/* Action button */}
      {meta.next && (
        <button onClick={onAction}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
            order.status === "pending"
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }`}>
          {order.status === "pending" ? `▶  ${t("start_preparing")}` : `✓  ${t("mark_ready")}`}
        </button>
      )}
      {order.status === "ready" && (
        <div className="flex items-center justify-center gap-2 py-2 text-emerald-400 text-sm font-semibold">
          <CheckCircle size={16} /> {t("waiting_pickup")}
        </div>
      )}
    </div>
  );
}

export function BaristaKDS() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { orders, updateStatus } = useOrders();
  const [, setTick] = useState(0);

  // Refresh every second for live timers
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const activeOrders = orders.filter(o =>
    o.status === "pending" || o.status === "preparing" || o.status === "ready"
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const pending   = activeOrders.filter(o => o.status === "pending");
  const preparing = activeOrders.filter(o => o.status === "preparing");
  const ready     = activeOrders.filter(o => o.status === "ready");

  const doAction = (order: typeof activeOrders[number]) => {
    const next = order.status === "pending" ? "preparing" : "ready";
    updateStatus(order.id, next, user?.username ?? "barista");
  };

  return (
    <div className="p-4 space-y-4 min-h-full bg-gray-950">
      {/* KDS header bar */}
      <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-3">
          <ChefHat size={20} className="text-amber-400" />
          <span className="font-bold text-gray-200">{t("kitchen_display")}</span>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-400">{user?.fullName}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-400 font-semibold">{pending.length} pending</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-400 font-semibold">{preparing.length} preparing</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-400 font-semibold">{ready.length} ready</span>
          </span>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-700 space-y-3">
          <Bell size={40} className="opacity-30" />
          <p className="text-lg font-semibold">{t("no_active_orders")}</p>
          <p className="text-sm">{t("new_orders_appear")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {/* Pending first, then preparing, then ready */}
          {[...pending, ...preparing, ...ready].map(order => (
            <KDSCard key={order.id} order={order} username={user?.username ?? "barista"}
              onAction={() => doAction(order)} />
          ))}
        </div>
      )}
    </div>
  );
}
