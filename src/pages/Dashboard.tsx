import { useMemo } from "react";
import { transactions, dailySummary, itemSummary, hourlySummary } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, ShoppingBag, DollarSign, Users } from "lucide-react";
import { useI18n } from "@/data/i18nStore";

export function Dashboard() {
  const { t, fmt } = useI18n();
  const todayStr = "2026-05-14";
  const yesterdayStr = "2026-05-13";
  const todayTx = useMemo(() => transactions.filter(t => t.date === todayStr), []);
  const yesterdayTx = useMemo(() => transactions.filter(t => t.date === yesterdayStr), []);
  const todayRevenue = todayTx.reduce((s, t) => s + t.revenue, 0);
  const yesterdayRevenue = yesterdayTx.reduce((s, t) => s + t.revenue, 0);
  const revenueChange = yesterdayRevenue ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
  const avgOrder = todayTx.length ? todayRevenue / todayTx.length : 0;
  const last7 = dailySummary.slice(-7);
  const last30 = dailySummary.slice(-30);
  const totalRevenue30 = last30.reduce((s, d) => s + d.revenue, 0);
  const topItems = itemSummary.slice(0, 5);
  const recentTx = transactions.filter(t => t.date === todayStr).slice(-8).reverse();

  const KPIs = [
    { label: t("todays_revenue"), value: fmt(todayRevenue), sub: `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}% ${t("vs_yesterday")}`, icon: DollarSign, positive: revenueChange >= 0, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: t("orders_today"), value: todayTx.length.toString(), sub: `${yesterdayTx.length} yesterday`, icon: ShoppingBag, positive: todayTx.length >= yesterdayTx.length, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: t("avg_order_value"), value: fmt(avgOrder), sub: t("per_tx"), icon: TrendingUp, positive: true, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: t("revenue_30d"), value: fmt(totalRevenue30, true), sub: `${last30.reduce((s,d)=>s+d.orders,0).toLocaleString()} ${t("total_orders")}`, icon: Users, positive: true, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-5 py-3 flex flex-wrap gap-3 text-xs text-gray-400">
        <span className="text-gray-500 font-semibold uppercase tracking-wider mr-1">Stack:</span>
        {[["Frontend","React + TypeScript + Tailwind + shadcn/ui"],["Backend","Node.js + Express + PostgreSQL"],["Analytics","Python FastAPI + scikit-learn"],["Auth","JWT + bcrypt"],["Deploy","Docker + Netlify/Railway"]].map(([k,v])=>(
          <span key={k}><span className="text-gray-500">{k}:</span> <span className="text-blue-400 font-medium">{v}</span></span>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIs.map(({ label, value, sub, icon: Icon, color, bg, positive }) => (
          <Card key={label} className={`border ${bg} bg-gray-900`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                  <p className={`text-xs mt-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>{sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}><Icon size={18} className={color} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">{t("revenue_trend")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={last7} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:"#6b7280",fontSize:11}}/>
                <YAxis tick={{fill:"#6b7280",fontSize:11}}/>
                <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,fontSize:12}} formatter={(v)=>[fmt(v as number),"Revenue"]}/>
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} dot={{fill:"#3b82f6",r:3}}/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">{t("top_items")}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItems.map((item, i) => {
                const pct = (item.revenue / topItems[0].revenue) * 100;
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5"><span className="text-gray-500">#{i+1}</span><span className="text-gray-300 font-medium">{item.name}</span></span>
                      <span className="text-blue-400 font-semibold">{fmt(item.revenue, true)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">{t("orders_by_hour")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlySummary} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis dataKey="label" tick={{fill:"#6b7280",fontSize:10}}/>
                <YAxis tick={{fill:"#6b7280",fontSize:11}}/>
                <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,fontSize:12}}/>
                <Bar dataKey="orders" fill="#3b82f6" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-300">{t("live_feed")}</CardTitle>
              <span className="flex items-center gap-1.5 text-xs text-blue-400"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>Today</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-mono w-10">{tx.time}</span>
                    <span className="text-xs text-gray-300 font-medium">{tx.item}</span>
                    <Badge variant="secondary" className="bg-gray-800 text-gray-500 text-xs px-1.5 py-0">×{tx.qty}</Badge>
                  </div>
                  <span className="text-xs text-blue-400 font-semibold">{fmt(tx.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
