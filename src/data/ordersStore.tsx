import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────
export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export interface OrderItem {
  menuItemId: string;
  name:       string;
  emoji:      string;
  category:   string;
  price:      number;
  cost:       number;
  qty:        number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  by:     string;
  at:     string;
}

export interface Order {
  id:            string;
  orderNumber:   number;
  items:         OrderItem[];
  customerName:  string;
  notes:         string;
  status:        OrderStatus;
  total:         number;
  createdBy:     string;
  createdAt:     string;
  statusHistory: StatusHistoryEntry[];
  tableNumber?:  number;
}

// ── Status display config ─────────────────────────────────────
export const STATUS_META: Record<OrderStatus, {
  label: string; color: string; bg: string;
  next?: OrderStatus; nextLabel?: string;
}> = {
  pending:   { label:"Pending",    color:"text-amber-400",   bg:"border-amber-500/30",
               next:"preparing", nextLabel:"Start Preparing" },
  preparing: { label:"Preparing",  color:"text-blue-400",    bg:"border-blue-500/30",
               next:"ready",     nextLabel:"Mark Ready"      },
  ready:     { label:"Ready ✓",   color:"text-emerald-400", bg:"border-emerald-500/30",
               next:"completed", nextLabel:"Complete Order"  },
  completed: { label:"Completed",  color:"text-gray-400",    bg:"border-gray-700"      },
  cancelled: { label:"Cancelled",  color:"text-red-400",     bg:"border-red-500/30"    },
};

// ── Row → Order mapping ────────────────────────────────────────
function rowToOrder(row: Record<string, unknown>): Order {
  const rawItems   = (row.order_items           as Record<string,unknown>[]) ?? [];
  const rawHistory = (row.order_status_history  as Record<string,unknown>[]) ?? [];

  return {
    id:           row.id           as string,
    orderNumber:  row.order_number as number,
    customerName: (row.customer_name as string) || "Walk-in",
    notes:        (row.notes        as string)  || "",
    status:       row.status        as OrderStatus,
    total:        Number(row.total),
    createdBy:    row.created_by    as string,
    createdAt:    row.created_at    as string,
    tableNumber:  row.table_number  ? Number(row.table_number) : undefined,
    items: rawItems.map(i => ({
      menuItemId: i.menu_item_id as string,
      name:       i.name         as string,
      emoji:      i.emoji        as string,
      category:   i.category     as string,
      price:      Number(i.price),
      cost:       Number(i.cost),
      qty:        i.qty          as number,
    })),
    statusHistory: rawHistory
      .sort((a, b) =>
        new Date(a.changed_at as string).getTime() -
        new Date(b.changed_at as string).getTime()
      )
      .map(h => ({
        status: h.status     as OrderStatus,
        by:     h.changed_by as string,
        at:     h.changed_at as string,
      })),
  };
}

// ── Context ────────────────────────────────────────────────────
interface OrdersCtx {
  orders:       Order[];
  loading:      boolean;
  createOrder:  (items: OrderItem[], customerName: string, notes: string, createdBy: string, tableNumber?: number) => Promise<Order>;
  updateStatus: (orderId: string, newStatus: OrderStatus, by: string) => Promise<void>;
  cancelOrder:  (orderId: string, by: string) => Promise<void>;
}

const Ctx = createContext<OrdersCtx | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load all orders (nested items + history) ───────────────
  const load = async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*), order_status_history(*)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) setOrders(data.map(r => rowToOrder(r as Record<string, unknown>)));
    } catch (e) {
      console.error("ordersStore load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Real-time: any change to the three tables → full reload
    const ch = supabase.channel("orders_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders"               }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items"          }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_status_history" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Create order ───────────────────────────────────────────
  const createOrder = async (
    items: OrderItem[],
    customerName: string,
    notes: string,
    createdBy: string,
    tableNumber?: number,
  ): Promise<Order> => {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    const { data: orderRow, error: oErr } = await supabase
      .from("orders")
      .insert({ customer_name: customerName || "Walk-in", notes, total, created_by: createdBy, status: "pending", table_number: tableNumber ?? null })
      .select()
      .single();

    if (oErr || !orderRow) throw new Error(oErr?.message ?? "Failed to create order");

    const orderId = (orderRow as Record<string, unknown>).id as string;

    await supabase.from("order_items").insert(
      items.map(i => ({
        order_id: orderId, menu_item_id: i.menuItemId,
        name: i.name, emoji: i.emoji, category: i.category,
        price: i.price, cost: i.cost, qty: i.qty,
      }))
    );

    await supabase.from("order_status_history").insert({
      order_id: orderId, status: "pending", changed_by: createdBy,
    });

    const provisional: Order = {
      id: orderId,
      orderNumber:  (orderRow as Record<string, unknown>).order_number as number,
      customerName: customerName || "Walk-in",
      notes, status: "pending", total, createdBy,
      createdAt: (orderRow as Record<string, unknown>).created_at as string,
      items,
      statusHistory: [{ status: "pending", by: createdBy, at: new Date().toISOString() }],
      tableNumber,
    };
    setOrders(prev => [provisional, ...prev]);
    return provisional;
  };

  // ── Advance status ─────────────────────────────────────────
  const updateStatus = async (orderId: string, newStatus: OrderStatus, by: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    await supabase.from("order_status_history").insert({
      order_id: orderId, status: newStatus, changed_by: by,
    });
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: newStatus,
            statusHistory: [...o.statusHistory, { status: newStatus, by, at: new Date().toISOString() }] }
        : o
    ));
  };

  const cancelOrder = (orderId: string, by: string) => updateStatus(orderId, "cancelled", by);

  return (
    <Ctx.Provider value={{ orders, loading, createOrder, updateStatus, cancelOrder }}>
      {children}
    </Ctx.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrders must be inside OrdersProvider");
  return ctx;
}
