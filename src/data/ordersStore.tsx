import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export interface OrderItem {
  menuItemId: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
  cost: number;
  qty: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  profit: number;
  status: OrderStatus;
  customerName: string;
  notes: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  statusHistory: { status: OrderStatus; at: string; by: string }[];
}

export const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; next?: OrderStatus; nextLabel?: string }> = {
  pending:    { label: "Pending",    color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30",   next: "preparing", nextLabel: "Start Preparing" },
  preparing:  { label: "Preparing",  color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/30",     next: "ready",     nextLabel: "Mark Ready" },
  ready:      { label: "Ready ✓",    color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", next: "completed", nextLabel: "Complete Order" },
  completed:  { label: "Completed",  color: "text-gray-400",    bg: "bg-gray-700/50 border-gray-600",        },
  cancelled:  { label: "Cancelled",  color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",       },
};

const LS_ORDERS  = "ink_orders";
const LS_COUNTER = "ink_order_counter";

function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

interface OrdersCtx {
  orders: Order[];
  createOrder: (items: OrderItem[], customerName: string, notes: string, createdBy: string) => Order;
  updateStatus: (id: string, status: OrderStatus, by: string) => void;
  cancelOrder: (id: string, by: string) => void;
}

const Ctx = createContext<OrdersCtx | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders,  setOrders]  = useState<Order[]>(() => load<Order[]>(LS_ORDERS, []));
  const [counter, setCounter] = useState<number>(() => load<number>(LS_COUNTER, 1000));

  useEffect(() => { localStorage.setItem(LS_ORDERS,  JSON.stringify(orders));  }, [orders]);
  useEffect(() => { localStorage.setItem(LS_COUNTER, JSON.stringify(counter)); }, [counter]);

  const now = () => new Date().toISOString();

  const createOrder = (items: OrderItem[], customerName: string, notes: string, createdBy: string): Order => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const profit   = items.reduce((s, i) => s + (i.price - i.cost) * i.qty, 0);
    const num = counter + 1;
    setCounter(num);
    const order: Order = {
      id: `ORD-${Date.now()}`,
      orderNumber: num,
      items,
      subtotal,
      total: subtotal,
      profit,
      status: "pending",
      customerName: customerName || "Walk-in",
      notes,
      createdAt: now(),
      createdBy,
      updatedAt: now(),
      updatedBy: createdBy,
      statusHistory: [{ status: "pending", at: now(), by: createdBy }],
    };
    setOrders(prev => [order, ...prev]);
    return order;
  };

  const updateStatus = (id: string, status: OrderStatus, by: string) => {
    setOrders(prev => prev.map(o => o.id !== id ? o : {
      ...o, status, updatedAt: now(), updatedBy: by,
      statusHistory: [...o.statusHistory, { status, at: now(), by }],
    }));
  };

  const cancelOrder = (id: string, by: string) => updateStatus(id, "cancelled", by);

  return (
    <Ctx.Provider value={{ orders, createOrder, updateStatus, cancelOrder }}>
      {children}
    </Ctx.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrders must be used inside OrdersProvider");
  return ctx;
}
