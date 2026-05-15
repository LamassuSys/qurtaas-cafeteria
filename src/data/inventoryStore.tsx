import { createContext, useContext, useState, type ReactNode } from "react";
import { inventoryData } from "@/data/mockData";

// ── Types ──────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
  stock: number;
  reorderLevel: number;
  dailyAvg: number;
  cost: number;
  // computed
  daysLeft: number;
  status: "low" | "medium" | "ok";
}

function computeDerived(item: Omit<InventoryItem, "daysLeft" | "status">): InventoryItem {
  const daysLeft = item.dailyAvg > 0 ? Math.round(item.stock / item.dailyAvg) : 99;
  const status: InventoryItem["status"] =
    item.stock <= item.reorderLevel ? "low"
    : item.stock <= item.reorderLevel * 2 ? "medium"
    : "ok";
  return { ...item, daysLeft, status };
}

// ── Seed from mockData once ────────────────────────────────────
const STORAGE_KEY = "ink_inventory";

function loadItems(): InventoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as InventoryItem[];
  } catch { /* ignore */ }
  // First run — seed from mock
  return inventoryData.map(i => computeDerived({
    id:           String(i.id),
    name:         i.name,
    emoji:        i.emoji,
    category:     i.category,
    stock:        i.stock,
    reorderLevel: i.reorderLevel,
    dailyAvg:     i.dailyAvg,
    cost:         i.cost,
  }));
}

function persist(items: InventoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── Context ────────────────────────────────────────────────────
interface InventoryCtx {
  items: InventoryItem[];
  addItem:    (item: Omit<InventoryItem, "id" | "daysLeft" | "status">) => void;
  updateItem: (id: string, patch: Partial<Omit<InventoryItem, "id" | "daysLeft" | "status">>) => void;
  deleteItem: (id: string) => void;
  adjustStock:(id: string, delta: number) => void;
}

const Ctx = createContext<InventoryCtx | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(loadItems);

  const save = (next: InventoryItem[]) => { setItems(next); persist(next); };

  const addItem = (raw: Omit<InventoryItem, "id" | "daysLeft" | "status">) => {
    const item = computeDerived({ ...raw, id: `inv_${Date.now()}` });
    save([...items, item]);
  };

  const updateItem = (id: string, patch: Partial<Omit<InventoryItem, "id" | "daysLeft" | "status">>) => {
    save(items.map(i => i.id === id ? computeDerived({ ...i, ...patch }) : i));
  };

  const deleteItem = (id: string) => save(items.filter(i => i.id !== id));

  const adjustStock = (id: string, delta: number) => {
    save(items.map(i => {
      if (i.id !== id) return i;
      const newStock = Math.max(0, i.stock + delta);
      return computeDerived({ ...i, stock: newStock });
    }));
  };

  return <Ctx.Provider value={{ items, addItem, updateItem, deleteItem, adjustStock }}>{children}</Ctx.Provider>;
}

export function useInventory() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInventory must be inside InventoryProvider");
  return ctx;
}
