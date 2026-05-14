import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { MENU_ITEMS as SEED_ITEMS, CATEGORIES as SEED_CATS } from "@/data/mockData";

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  emoji: string;
  active: boolean;
  custom: boolean; // false = seeded from mockData, true = created by admin
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;   // tailwind bg+text pair, e.g. "bg-blue-500/20 text-blue-400"
  custom: boolean;
}

const CAT_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-pink-500/20 text-pink-400",
  "bg-orange-500/20 text-orange-400",
  "bg-purple-500/20 text-purple-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-red-500/20 text-red-400",
];

// Seed categories from mockData
const SEED_CATEGORIES: Category[] = SEED_CATS.map((name, i) => ({
  id: `seed-cat-${i}`,
  name,
  emoji: ["☕","🍿","🥗","🍰","🍽️"][i] ?? "🏷️",
  color: CAT_COLORS[i % CAT_COLORS.length],
  custom: false,
}));

// Seed menu items from mockData
const SEED_MENU_ITEMS: MenuItem[] = SEED_ITEMS.map(item => ({
  id: `seed-${item.id}`,
  name: item.name,
  category: item.category,
  price: item.price,
  cost: item.cost,
  emoji: item.emoji,
  active: true,
  custom: false,
}));

const LS_ITEMS = "ink_menu_items";
const LS_CATS  = "ink_menu_cats";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

interface MenuCtx {
  items:      MenuItem[];
  categories: Category[];
  addItem:    (item: Omit<MenuItem, "id" | "custom">) => void;
  updateItem: (id: string, patch: Partial<Omit<MenuItem, "id" | "custom">>) => void;
  deleteItem: (id: string) => void;
  addCategory:    (cat: Omit<Category, "id" | "custom">) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id" | "custom">>) => void;
  deleteCategory: (id: string) => void;
}

const Ctx = createContext<MenuCtx | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [customItems, setCustomItems] = useState<MenuItem[]>(() =>
    load<MenuItem[]>(LS_ITEMS, [])
  );
  const [customCats, setCustomCats] = useState<Category[]>(() =>
    load<Category[]>(LS_CATS, [])
  );

  useEffect(() => { localStorage.setItem(LS_ITEMS, JSON.stringify(customItems)); }, [customItems]);
  useEffect(() => { localStorage.setItem(LS_CATS,  JSON.stringify(customCats));  }, [customCats]);

  const items      = [...SEED_MENU_ITEMS, ...customItems];
  const categories = [...SEED_CATEGORIES, ...customCats];

  const addItem = (item: Omit<MenuItem, "id" | "custom">) =>
    setCustomItems(prev => [...prev, { ...item, id: `custom-${Date.now()}`, custom: true }]);

  const updateItem = (id: string, patch: Partial<Omit<MenuItem, "id" | "custom">>) =>
    setCustomItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const deleteItem = (id: string) =>
    setCustomItems(prev => prev.filter(i => i.id !== id));

  const addCategory = (cat: Omit<Category, "id" | "custom">) =>
    setCustomCats(prev => [...prev, { ...cat, id: `custom-cat-${Date.now()}`, custom: true }]);

  const updateCategory = (id: string, patch: Partial<Omit<Category, "id" | "custom">>) =>
    setCustomCats(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const deleteCategory = (id: string) =>
    setCustomCats(prev => prev.filter(c => c.id !== id));

  return (
    <Ctx.Provider value={{ items, categories, addItem, updateItem, deleteItem, addCategory, updateCategory, deleteCategory }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMenu must be used inside MenuProvider");
  return ctx;
}
