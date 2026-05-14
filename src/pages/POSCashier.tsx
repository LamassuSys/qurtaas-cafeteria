import { useState } from "react";
import { useMenu } from "@/data/menuStore";
import { useOrders, type OrderItem } from "@/data/ordersStore";
import { useAuth } from "@/auth/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, ShoppingCart, CheckCircle, Search, User, FileText } from "lucide-react";

export function POSCashier() {
  const { user } = useAuth();
  const { items, categories } = useMenu();
  const { createOrder } = useOrders();

  const [catFilter, setCatFilter]     = useState("All");
  const [search, setSearch]           = useState("");
  const [cart, setCart]               = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes]             = useState("");
  const [success, setSuccess]         = useState<{ num: number } | null>(null);

  const activeItems = items.filter(i => i.active);
  const displayItems = activeItems.filter(i => {
    const matchCat  = catFilter === "All" || i.category === catFilter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (item: typeof activeItems[number]) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) return prev.map(c => c.menuItemId === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, emoji: item.emoji, category: item.category, price: item.price, cost: item.cost, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.menuItemId === id ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  };

  const total   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const submitOrder = () => {
    if (!cart.length) return;
    const order = createOrder(cart, customerName, notes, user?.username ?? "cashier");
    setSuccess({ num: order.orderNumber });
    setCart([]);
    setCustomerName("");
    setNotes("");
    setTimeout(() => setSuccess(null), 3500);
  };

  const catColor = (name: string) => categories.find(c => c.name === name)?.color ?? "bg-gray-700 text-gray-300";

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* ── Left: Menu Grid ── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-800">
        {/* Search + filter */}
        <div className="p-4 border-b border-gray-800 space-y-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input placeholder="Search menu…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 bg-gray-800 border-gray-700 text-gray-200 text-sm" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["All", ...categories.map(c => c.name)].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catFilter === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {displayItems.map(item => {
              const inCart = cart.find(c => c.menuItemId === item.id);
              return (
                <button key={item.id} onClick={() => addToCart(item)}
                  className={`relative text-left p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    inCart ? "bg-blue-500/15 border-blue-500/40" : "bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/60"
                  }`}>
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {inCart.qty}
                    </span>
                  )}
                  <div className="text-2xl mb-2">{item.emoji}</div>
                  <p className="text-sm font-semibold text-gray-200 leading-tight mb-1">{item.name}</p>
                  <Badge className={`text-[10px] px-1.5 py-0 mb-2 ${catColor(item.category)}`}>{item.category}</Badge>
                  <p className="text-base font-bold text-blue-400">${item.price.toFixed(2)}</p>
                </button>
              );
            })}
            {displayItems.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-600">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No items match</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Cart / Order ── */}
      <div className="w-80 xl:w-96 flex flex-col bg-gray-900 shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-gray-200">Current Order</span>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Clear</button>
          )}
        </div>

        {/* Customer + notes */}
        <div className="p-3 border-b border-gray-800 space-y-2 shrink-0">
          <div className="relative">
            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input placeholder="Customer name (optional)" value={customerName} onChange={e => setCustomerName(e.target.value)}
              className="pl-8 bg-gray-800 border-gray-700 text-gray-200 text-xs h-8" />
          </div>
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-3 text-gray-500" />
            <textarea placeholder="Order notes…" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 text-xs resize-none focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <ShoppingCart size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs">Tap menu items to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.menuItemId} className="flex items-center gap-2 bg-gray-800 rounded-xl p-2.5">
                <span className="text-lg shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{item.name}</p>
                  <p className="text-xs text-blue-400">${(item.price * item.qty).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => updateQty(item.menuItemId, -1)}
                    className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
                    {item.qty === 1 ? <Trash2 size={10} className="text-red-400" /> : <Minus size={10} className="text-gray-300" />}
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-gray-200">{item.qty}</span>
                  <button onClick={() => updateQty(item.menuItemId, 1)}
                    className="w-6 h-6 rounded-full bg-gray-700 hover:bg-blue-600 flex items-center justify-center transition-colors">
                    <Plus size={10} className="text-gray-300" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total + submit */}
        <div className="p-4 border-t border-gray-800 shrink-0 space-y-3">
          {/* Success flash */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3 py-2.5 animate-pulse">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-400 font-medium">Order #{success.num} placed!</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            <span className="text-gray-400 font-medium">Total</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-gray-500">SAR / USD</span>
            <span className="text-2xl font-bold text-blue-400">${total.toFixed(2)}</span>
          </div>
          <Button onClick={submitOrder} disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm h-11 rounded-xl">
            Place Order →
          </Button>
        </div>
      </div>
    </div>
  );
}
