import { useState, useMemo } from "react";
import { transactions } from "@/data/mockData";
import { useMenu } from "@/data/menuStore";
import type { Transaction } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_CONFIG } from "@/auth/roles";
import { useI18n } from "@/data/i18nStore";

const CAT_COLORS: Record<string,string> = {
  Beverages:"bg-blue-500/20 text-blue-400", Snacks:"bg-amber-500/20 text-amber-400",
  Healthy:"bg-emerald-500/20 text-emerald-400", Desserts:"bg-pink-500/20 text-pink-400", Mains:"bg-orange-500/20 text-orange-400",
};

export function SalesTracker() {
  const { user } = useAuth();
  const { fmt } = useI18n();
  const canRecord = user ? ROLE_CONFIG[user.role].canRecordSales : false;
  const { items: MENU_ITEMS, categories } = useMenu();
  const CATEGORIES = categories.map(c => c.name);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("2026-05-14");
  const [showForm, setShowForm] = useState(false);
  const [localTx, setLocalTx] = useState<Transaction[]>([]);
  const activeItems = MENU_ITEMS.filter(m => m.active);
  const [form, setForm] = useState({ item: activeItems[0]?.name ?? "", qty: 1 });

  const allTx = useMemo(() => [...localTx, ...transactions], [localTx]);
  const filtered = useMemo(() => allTx.filter(t => {
    const matchDate = !dateFilter || t.date === dateFilter;
    const matchCat = catFilter === "All" || t.category === catFilter;
    const matchSearch = !search || t.item.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchDate && matchCat && matchSearch;
  }).slice(0, 100), [allTx, dateFilter, catFilter, search]);

  const totals = useMemo(() => ({
    revenue: filtered.reduce((s,t)=>s+t.revenue,0),
    profit: filtered.reduce((s,t)=>s+t.profit,0),
    orders: filtered.length,
  }), [filtered]);

  const addSale = () => {
    const menuItem = activeItems.find(m => m.name === form.item)!;
    if (!menuItem) return;
    const qty = form.qty;
    const now = new Date();
    const pad = (n:number) => String(n).padStart(2,"0");
    setLocalTx(prev => [{
      id:`TX-NEW-${Date.now()}`, date:"2026-05-14",
      time:`${pad(now.getHours())}:${pad(now.getMinutes())}`,
      item: menuItem.name, category: menuItem.category, qty,
      price: menuItem.price, cost: menuItem.cost,
      revenue: menuItem.price*qty, profit:(menuItem.price-menuItem.cost)*qty, hour:now.getHours(),
    }, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
            <Input placeholder="Search item or ID..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 bg-gray-800 border-gray-700 text-gray-200 text-sm w-48"/>
          </div>
          <Input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="bg-gray-800 border-gray-700 text-gray-200 text-sm w-40"/>
          <div className="flex gap-1 flex-wrap">
            {["All",...CATEGORIES].map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${catFilter===c?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{c}</button>
            ))}
          </div>
        </div>
        {canRecord && (
          <Button onClick={()=>setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 text-white text-sm gap-1.5">
            <Plus size={14}/> Add Sale
          </Button>
        )}
      </div>

      {showForm && canRecord && (
        <Card className="bg-gray-800 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Item</label>
                <select value={form.item} onChange={e=>setForm({...form,item:e.target.value})} className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2">
                  {activeItems.map(m=><option key={m.id} value={m.name}>{m.emoji} {m.name} — {fmt(m.price)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Qty</label>
                <input type="number" min={1} max={10} value={form.qty} onChange={e=>setForm({...form,qty:parseInt(e.target.value)||1})} className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 w-20"/>
              </div>
              <Button onClick={addSale} className="bg-blue-600 hover:bg-blue-500 text-white text-sm">Record Sale</Button>
              <button onClick={()=>setShowForm(false)} className="text-gray-500 hover:text-gray-300"><X size={16}/></button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[{label:"Filtered Orders",value:totals.orders.toLocaleString()},{label:"Revenue",value:fmt(totals.revenue)},{label:"Profit",value:fmt(totals.profit)}].map(({label,value})=>(
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-lg font-bold text-blue-400">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="text-left">
                  {["ID","Date","Time","Item","Category","Qty","Price","Revenue","Profit"].map(h=>(
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(tx=>(
                  <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{tx.id.slice(0,16)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{tx.date}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{tx.time}</td>
                    <td className="px-4 py-2.5 text-gray-200 font-medium whitespace-nowrap">{tx.item}</td>
                    <td className="px-4 py-2.5"><Badge className={`text-xs px-2 py-0 ${CAT_COLORS[tx.category]||"bg-gray-700 text-gray-300"}`}>{tx.category}</Badge></td>
                    <td className="px-4 py-2.5 text-gray-300">{tx.qty}</td>
                    <td className="px-4 py-2.5 text-gray-300">{fmt(tx.price)}</td>
                    <td className="px-4 py-2.5 text-blue-400 font-semibold">{fmt(tx.revenue)}</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-semibold">{fmt(tx.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
