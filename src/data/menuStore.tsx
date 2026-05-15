import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { MENU_ITEMS as SEED_ITEMS, CATEGORIES as SEED_CATS } from "@/data/mockData";

// ── Types ──────────────────────────────────────────────────────
export interface MenuItem {
  id:       string;
  name:     string;
  category: string;
  price:    number;   // IQD
  cost:     number;   // IQD
  emoji:    string;
  active:   boolean;
  custom:   boolean;
}

export interface Category {
  id:     string;
  name:   string;
  emoji:  string;
  color:  string;
  custom: boolean;
}

// ── Fallback seed data (used when Supabase is unreachable) ─────
const CAT_COLORS = [
  "bg-blue-500/20 text-blue-400",   "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400", "bg-pink-500/20 text-pink-400",
  "bg-orange-500/20 text-orange-400","bg-purple-500/20 text-purple-400",
];
const FALLBACK_CATS: Category[] = SEED_CATS.map((name, i) => ({
  id: `seed-cat-${i}`, name, emoji: ["☕","🍿","🥗","🍰","🍽️"][i] ?? "🏷️",
  color: CAT_COLORS[i % CAT_COLORS.length], custom: false,
}));
const FALLBACK_ITEMS: MenuItem[] = SEED_ITEMS.map(item => ({
  id: `seed-${item.id}`, name: item.name, category: item.category,
  price: item.price, cost: item.cost, emoji: item.emoji, active: true, custom: false,
}));

// ── Helpers ────────────────────────────────────────────────────
function rowToItem(r: Record<string, unknown>): MenuItem {
  return {
    id: r.id as string, name: r.name as string,
    category: r.category as string,
    price: Number(r.price), cost: Number(r.cost),
    emoji: r.emoji as string, active: r.active as boolean, custom: true,
  };
}
function rowToCat(r: Record<string, unknown>): Category {
  return {
    id: r.id as string, name: r.name as string,
    emoji: r.emoji as string, color: r.color as string, custom: true,
  };
}

// ── Context ────────────────────────────────────────────────────
interface MenuCtx {
  items:          MenuItem[];
  categories:     Category[];
  loading:        boolean;
  addItem:        (item: Omit<MenuItem, "id" | "custom">) => Promise<void>;
  updateItem:     (id: string, patch: Partial<Omit<MenuItem, "id" | "custom">>) => Promise<void>;
  deleteItem:     (id: string) => Promise<void>;
  addCategory:    (cat:  Omit<Category, "id" | "custom">) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id" | "custom">>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const Ctx = createContext<MenuCtx | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [items,      setItems]      = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ── Load ──────────────────────────────────────────────────
  const load = async () => {
    try {
      const [{ data: cats }, { data: items }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*").order("created_at"),
      ]);
      if (cats && cats.length > 0) {
        setCategories(cats.map(rowToCat));
        setItems((items ?? []).map(rowToItem));
      } else {
        setCategories(FALLBACK_CATS);
        setItems(FALLBACK_ITEMS);
      }
    } catch {
      setCategories(FALLBACK_CATS);
      setItems(FALLBACK_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Real-time: reload whenever any menu row changes
    const ch = supabase.channel("menu_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items"  }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories"  }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Menu item CRUD ────────────────────────────────────────
  const addItem = async (item: Omit<MenuItem, "id" | "custom">) => {
    const { data } = await supabase.from("menu_items").insert({
      name: item.name, category: item.category,
      price: item.price, cost: item.cost,
      emoji: item.emoji, active: item.active,
    }).select().single();
    if (data) setItems(prev => [...prev, rowToItem(data as Record<string, unknown>)]);
  };

  const updateItem = async (id: string, patch: Partial<Omit<MenuItem, "id" | "custom">>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name     !== undefined) dbPatch.name     = patch.name;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.price    !== undefined) dbPatch.price    = patch.price;
    if (patch.cost     !== undefined) dbPatch.cost     = patch.cost;
    if (patch.emoji    !== undefined) dbPatch.emoji    = patch.emoji;
    if (patch.active   !== undefined) dbPatch.active   = patch.active;
    await supabase.from("menu_items").update(dbPatch).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const deleteItem = async (id: string) => {
    await supabase.from("menu_items").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ── Category CRUD ─────────────────────────────────────────
  const addCategory = async (cat: Omit<Category, "id" | "custom">) => {
    const sortOrder = categories.length + 1;
    const { data } = await supabase.from("categories").insert({
      name: cat.name, emoji: cat.emoji, color: cat.color, sort_order: sortOrder,
    }).select().single();
    if (data) setCategories(prev => [...prev, rowToCat(data as Record<string, unknown>)]);
  };

  const updateCategory = async (id: string, patch: Partial<Omit<Category, "id" | "custom">>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name  !== undefined) dbPatch.name  = patch.name;
    if (patch.emoji !== undefined) dbPatch.emoji = patch.emoji;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    await supabase.from("categories").update(dbPatch).eq("id", id);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <Ctx.Provider value={{
      items, categories, loading,
      addItem, updateItem, deleteItem,
      addCategory, updateCategory, deleteCategory,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMenu must be inside MenuProvider");
  return ctx;
}
