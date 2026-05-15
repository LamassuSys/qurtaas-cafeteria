import { useState, useRef } from "react";
import { useMenu, type MenuItem, type Category } from "@/data/menuStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, X, Check, Tag, ShoppingBag, Search, ImagePlus, Trash } from "lucide-react";
import { useI18n } from "@/data/i18nStore";

// ── Image helpers ──────────────────────────────────────────────
function resizeToBase64(file: File, maxPx = 600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
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

const EMOJI_SUGGESTIONS = ["☕","🍵","🧃","🥤","🍶","🍺","🍪","🍩","🍰","🎂","🧁","🍫","🍬","🥐","🥖","🥨","🧀","🍳","🥚","🥞","🧇","🥓","🥩","🍗","🍖","🌮","🌯","🥙","🧆","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍘","🍥","🥮","🍡","🧁","🍦","🍧","🍨","🍿","🧂","🧈","🥫","🍞"];

// ── Category Form ──────────────────────────────────────────────
function CategoryForm({ initial, onSave, onCancel }: {
  initial?: Partial<Category>;
  onSave: (data: Omit<Category, "id" | "custom">) => void;
  onCancel: () => void;
}) {
  const [name,  setName]  = useState(initial?.name  ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🏷️");
  const [color, setColor] = useState(initial?.color ?? CAT_COLORS[0]);
  const [showEmoji, setShowEmoji] = useState(false);

  const valid = name.trim().length >= 2;

  return (
    <Card className="bg-gray-800 border-blue-500/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          {/* Emoji picker */}
          <div className="relative">
            <button onClick={() => setShowEmoji(v => !v)}
              className="w-11 h-11 text-xl bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center">
              {emoji}
            </button>
            {showEmoji && (
              <div className="absolute top-12 left-0 z-20 bg-gray-800 border border-gray-700 rounded-xl p-2 grid grid-cols-8 gap-1 w-64 shadow-xl">
                {EMOJI_SUGGESTIONS.map(e => (
                  <button key={e} onClick={() => { setEmoji(e); setShowEmoji(false); }}
                    className="text-lg hover:bg-gray-700 rounded p-1 transition-colors">{e}</button>
                ))}
              </div>
            )}
          </div>
          {/* Name */}
          <Input placeholder="Category name" value={name} onChange={e => setName(e.target.value)}
            className="flex-1 bg-gray-700 border-gray-600 text-gray-200 min-w-[160px]" />
        </div>
        {/* Color swatches */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Badge colour</p>
          <div className="flex gap-2 flex-wrap">
            {CAT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${c} ${color === c ? "ring-2 ring-white/40" : "opacity-60 hover:opacity-100"} transition-all`}>
                {c.includes("blue") ? "Blue" : c.includes("emerald") ? "Green" : c.includes("amber") ? "Amber"
                  : c.includes("pink") ? "Pink" : c.includes("orange") ? "Orange" : c.includes("purple") ? "Purple"
                  : c.includes("cyan") ? "Cyan" : "Red"}
              </button>
            ))}
          </div>
        </div>
        {/* Preview */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Preview:</span>
          <Badge className={`${color} text-xs px-2.5 py-0.5`}>{emoji} {name || "Category name"}</Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => valid && onSave({ name: name.trim(), emoji, color })}
            disabled={!valid} className="bg-blue-600 hover:bg-blue-500 text-white text-sm">
            <Check size={14} className="mr-1" /> Save
          </Button>
          <Button onClick={onCancel} variant="ghost" className="text-gray-400 hover:text-gray-200 text-sm">
            <X size={14} className="mr-1" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Item Form ──────────────────────────────────────────────────
function ItemForm({ initial, categories, onSave, onCancel }: {
  initial?: Partial<MenuItem>;
  categories: Category[];
  onSave: (data: Omit<MenuItem, "id" | "custom">) => void;
  onCancel: () => void;
}) {
  const { fmt } = useI18n();
  const [name,      setName]     = useState(initial?.name     ?? "");
  const [category,  setCategory] = useState(initial?.category ?? (categories[0]?.name ?? ""));
  const [price,     setPrice]    = useState(String(initial?.price ?? ""));
  const [cost,      setCost]     = useState(String(initial?.cost  ?? ""));
  const [emoji,     setEmoji]    = useState(initial?.emoji    ?? "🍽️");
  const [active,    setActive]   = useState(initial?.active   ?? true);
  const [imageUrl,  setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [imgLoading, setImgLoading] = useState(false);
  const [showEmoji,  setShowEmoji]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const priceN = parseFloat(price);
  const costN  = parseFloat(cost);
  const valid  = name.trim().length >= 2 && category && priceN > 0 && costN >= 0 && costN < priceN;
  const margin = priceN > 0 ? Math.round(((priceN - costN) / priceN) * 100) : 0;

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgLoading(true);
    try {
      const b64 = await resizeToBase64(file);
      setImageUrl(b64);
    } finally {
      setImgLoading(false);
      e.target.value = "";
    }
  };

  return (
    <Card className="bg-gray-800 border-blue-500/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-3 flex-wrap items-start">
          {/* Emoji */}
          <div className="relative">
            <button onClick={() => setShowEmoji(v => !v)}
              className="w-11 h-11 text-xl bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center">
              {emoji}
            </button>
            {showEmoji && (
              <div className="absolute top-12 left-0 z-20 bg-gray-800 border border-gray-700 rounded-xl p-2 grid grid-cols-8 gap-1 w-64 shadow-xl">
                {EMOJI_SUGGESTIONS.map(e => (
                  <button key={e} onClick={() => { setEmoji(e); setShowEmoji(false); }}
                    className="text-lg hover:bg-gray-700 rounded p-1 transition-colors">{e}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2 min-w-[200px]">
            <Input placeholder="Item name" value={name} onChange={e => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200" />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2">
              {categories.map(c => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── Image upload ── */}
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Product Image <span className="text-gray-600">(optional)</span></p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
          {imageUrl ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-700 group">
              <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <ImagePlus size={13} /> Change
                </button>
                <button
                  onClick={() => setImageUrl(undefined)}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash size={13} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={imgLoading}
              className="w-full h-28 rounded-xl border-2 border-dashed border-gray-700 hover:border-blue-500/60 hover:bg-blue-500/5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-blue-400 transition-all disabled:opacity-50"
            >
              {imgLoading
                ? <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                : <><ImagePlus size={22} /><span className="text-xs font-medium">Click to upload image</span><span className="text-[10px] text-gray-600">JPG, PNG, WEBP — resized to 600px</span></>
              }
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Selling Price (IQD)</label>
            <Input type="number" min="0" step="1" placeholder="0" value={price}
              onChange={e => setPrice(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Cost Price (IQD)</label>
            <Input type="number" min="0" step="1" placeholder="0" value={cost}
              onChange={e => setCost(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-200" />
          </div>
        </div>
        {priceN > 0 && costN >= 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">Margin:</span>
            <span className={margin >= 50 ? "text-emerald-400 font-semibold" : margin >= 30 ? "text-amber-400 font-semibold" : "text-red-400 font-semibold"}>
              {margin}% ({fmt(priceN - costN)} profit/unit)
            </span>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => setActive(v => !v)}
            className={`w-9 h-5 rounded-full transition-colors ${active ? "bg-blue-600" : "bg-gray-600"} relative`}>
            <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all"
              style={{ left: active ? "18px" : "2px" }} />
          </div>
          <span className="text-xs text-gray-400">{active ? "Active — visible in Sales" : "Inactive — hidden from Sales"}</span>
        </label>
        {costN >= priceN && priceN > 0 && (
          <p className="text-xs text-red-400">⚠️ Cost must be less than selling price</p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => valid && onSave({ name: name.trim(), category, price: priceN, cost: costN, emoji, active, imageUrl })}
            disabled={!valid} className="bg-blue-600 hover:bg-blue-500 text-white text-sm">
            <Check size={14} className="mr-1" /> Save Item
          </Button>
          <Button onClick={onCancel} variant="ghost" className="text-gray-400 hover:text-gray-200 text-sm">
            <X size={14} className="mr-1" /> Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export function MenuManager() {
  const { fmt } = useI18n();
  const { items, categories, addItem, updateItem, deleteItem, addCategory, updateCategory, deleteCategory } = useMenu();

  const [tab, setTab] = useState<"items" | "categories">("items");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredItems = items.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const activeCount = items.filter(i => i.active).length;
  const customCount = items.filter(i => i.custom).length;

  return (
    <div className="p-6 space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Items",    value: items.length.toString(),      color: "text-blue-400"    },
          { label: "Active Items",   value: activeCount.toString(),       color: "text-emerald-400" },
          { label: "Custom Items",   value: customCount.toString(),       color: "text-purple-400"  },
          { label: "Categories",     value: categories.length.toString(), color: "text-amber-400"   },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {([["items", ShoppingBag, "Menu Items"], ["categories", Tag, "Categories"]] as const).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id as "items" | "categories")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── ITEMS TAB ── */}
      {tab === "items" && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-8 bg-gray-800 border-gray-700 text-gray-200 text-sm w-48" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {["All", ...categories.map(c => c.name)].map(c => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catFilter === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => { setShowAddItem(true); setEditItemId(null); }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm gap-1.5">
              <Plus size={14} /> Add Item
            </Button>
          </div>

          {/* Add form */}
          {showAddItem && !editItemId && (
            <ItemForm categories={categories}
              onSave={data => { addItem(data); setShowAddItem(false); }}
              onCancel={() => setShowAddItem(false)} />
          )}

          {/* Items grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredItems.map(item => {
              const cat = categories.find(c => c.name === item.category);
              const margin = item.price > 0 ? Math.round(((item.price - item.cost) / item.price) * 100) : 0;
              return editItemId === item.id ? (
                <div key={item.id} className="md:col-span-2 xl:col-span-3">
                  <ItemForm initial={item} categories={categories}
                    onSave={data => { if (item.custom) updateItem(item.id, data); setEditItemId(null); }}
                    onCancel={() => setEditItemId(null)} />
                </div>
              ) : (
                <Card key={item.id} className={`bg-gray-900 border-gray-800 overflow-hidden ${!item.active ? "opacity-50" : ""}`}>
                  {item.imageUrl && (
                    <div className="w-full h-36 overflow-hidden">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {!item.imageUrl && <span className="text-2xl">{item.emoji}</span>}
                        <div>
                          <p className="text-sm font-semibold text-gray-200">{item.name}</p>
                          <Badge className={`text-xs px-2 py-0 mt-0.5 ${cat?.color ?? "bg-gray-700 text-gray-300"}`}>
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {item.custom && (
                          <button onClick={() => setEditItemId(item.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                            <Pencil size={13} />
                          </button>
                        )}
                        {item.custom && (
                          deleteConfirm === item.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => { deleteItem(item.id); setDeleteConfirm(null); }}
                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Check size={13} />
                              </button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="p-1.5 text-gray-500 hover:bg-gray-700 rounded-lg transition-colors">
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(item.id)}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                              <Trash2 size={13} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-3">
                      <div className="bg-gray-800 rounded-lg py-1.5">
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-sm font-bold text-blue-400">{fmt(item.price)}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg py-1.5">
                        <p className="text-xs text-gray-500">Cost</p>
                        <p className="text-sm font-bold text-gray-300">{fmt(item.cost)}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg py-1.5">
                        <p className="text-xs text-gray-500">Margin</p>
                        <p className={`text-sm font-bold ${margin >= 50 ? "text-emerald-400" : margin >= 30 ? "text-amber-400" : "text-red-400"}`}>
                          {margin}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.active ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-700 text-gray-500"}`}>
                        {item.active ? "Active" : "Inactive"}
                      </span>
                      {!item.custom && <span className="text-xs text-gray-600 italic">Seeded</span>}
                      {item.custom && (
                        <button onClick={() => updateItem(item.id, { active: !item.active })}
                          className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2">
                          {item.active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CATEGORIES TAB ── */}
      {tab === "categories" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">{categories.length} categories · {categories.filter(c => c.custom).length} custom</p>
            <Button onClick={() => { setShowAddCat(true); setEditCatId(null); }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm gap-1.5">
              <Plus size={14} /> Add Category
            </Button>
          </div>

          {showAddCat && !editCatId && (
            <CategoryForm
              onSave={data => { addCategory(data); setShowAddCat(false); }}
              onCancel={() => setShowAddCat(false)} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {categories.map(cat => {
              const itemCount = items.filter(i => i.category === cat.name).length;
              return editCatId === cat.id ? (
                <div key={cat.id} className="md:col-span-2 xl:col-span-3">
                  <CategoryForm initial={cat}
                    onSave={data => { if (cat.custom) updateCategory(cat.id, data); setEditCatId(null); }}
                    onCancel={() => setEditCatId(null)} />
                </div>
              ) : (
                <Card key={cat.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-200">{cat.name}</p>
                          <p className="text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${cat.color} text-xs`}>{cat.name}</Badge>
                        {cat.custom && (
                          <div className="flex gap-1">
                            <button onClick={() => setEditCatId(cat.id)}
                              className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                              <Pencil size={13} />
                            </button>
                            {deleteConfirm === cat.id ? (
                              <>
                                <button onClick={() => { deleteCategory(cat.id); setDeleteConfirm(null); }}
                                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                  <Check size={13} />
                                </button>
                                <button onClick={() => setDeleteConfirm(null)}
                                  className="p-1.5 text-gray-500 hover:bg-gray-700 rounded-lg transition-colors">
                                  <X size={13} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => setDeleteConfirm(cat.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                        {!cat.custom && <span className="text-xs text-gray-600 italic">Seeded</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
