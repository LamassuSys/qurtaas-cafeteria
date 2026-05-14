import { itemSummary, categorySummary, dailySummary, hourlySummary } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useI18n } from "@/data/i18nStore";

export function Analytics() {
  const { fmt } = useI18n();
  const sorted = [...itemSummary].sort((a,b)=>b.revenue-a.revenue);
  const topPerformers = sorted.slice(0,5);
  const slowMoving = sorted.slice(-4).reverse();
  const marginData = itemSummary.map(item=>({
    name:item.name,
    margin:item.revenue>0?((item.profit/item.revenue)*100):0,
    revenue:item.revenue,
  })).sort((a,b)=>b.margin-a.margin);
  const avgMargin = marginData.reduce((s,i)=>s+i.margin,0)/marginData.length;
  const totalRevenue = dailySummary.reduce((s,d)=>s+d.revenue,0);
  const totalProfit = dailySummary.reduce((s,d)=>s+d.profit,0);
  const totalOrders = dailySummary.reduce((s,d)=>s+d.orders,0);
  const avgDailyRevenue = totalRevenue/dailySummary.length;
  const peakHour = hourlySummary.reduce((max,h)=>h.orders>max.orders?h:max,hourlySummary[0]);
  const slowHour = hourlySummary.reduce((min,h)=>h.orders<min.orders?h:min,hourlySummary[0]);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:"Avg Daily Revenue",value:fmt(avgDailyRevenue),color:"text-blue-400"},
          {label:"Overall Margin",value:`${((totalProfit/totalRevenue)*100).toFixed(1)}%`,color:"text-emerald-400"},
          {label:"Total Orders (35d)",value:totalOrders.toLocaleString(),color:"text-purple-400"},
          {label:"Avg Items/Order",value:(totalOrders>0?(itemSummary.reduce((s,i)=>s+i.qty,0)/totalOrders).toFixed(1):"0"),color:"text-amber-400"},
        ].map(({label,value,color})=>(
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Profit Margin by Item</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={marginData} layout="vertical" margin={{top:0,right:20,left:20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false}/>
                <XAxis type="number" tick={{fill:"#6b7280",fontSize:10}} tickFormatter={v=>`${(v as number).toFixed(0)}%`}/>
                <YAxis type="category" dataKey="name" tick={{fill:"#9ca3af",fontSize:11}} width={65}/>
                <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,fontSize:12}} formatter={(v)=>[`${(v as number).toFixed(1)}%`,"Margin"]}/>
                <Bar dataKey="margin" radius={[0,4,4,0]} fill="#3b82f6" background={{fill:"#1f2937",radius:4}}/>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Average margin: <span className="text-blue-400">{avgMargin.toFixed(1)}%</span></p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Category Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...categorySummary].sort((a,b)=>b.revenue-a.revenue).map(cat=>{
                const margin = (cat.profit/cat.revenue)*100;
                return (
                  <div key={cat.name} className="bg-gray-800/60 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-200">{cat.name}</span>
                      <div className="flex gap-2 text-xs">
                        <span className="text-blue-400">{fmt(cat.revenue)}</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-emerald-400">{margin.toFixed(1)}% margin</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span>{cat.orders.toLocaleString()} items sold</span>
                      <span>Profit: {fmt(cat.profit)}</span>
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
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">Top Performers<Badge className="bg-blue-500/20 text-blue-400 text-xs">Revenue Leaders</Badge></CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {topPerformers.map((item,i)=>(
                <div key={item.name} className="flex items-center gap-3 py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-lg font-bold text-gray-600 w-6">#{i+1}</span>
                  <div className="flex-1"><p className="text-sm text-gray-200 font-medium">{item.name}</p><p className="text-xs text-gray-500">{item.qty.toLocaleString()} units · {item.category}</p></div>
                  <div className="text-right"><p className="text-sm text-blue-400 font-semibold">{fmt(item.revenue)}</p><p className="text-xs text-emerald-400">{fmt(item.profit)} profit</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">Slow Moving Items<Badge className="bg-red-500/20 text-red-400 text-xs">Needs Attention</Badge></CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {slowMoving.map(item=>{
                const margin = item.revenue>0?(item.profit/item.revenue)*100:0;
                return (
                  <div key={item.name} className="flex items-center gap-3 py-1.5 border-b border-gray-800 last:border-0">
                    <div className="flex-1"><p className="text-sm text-gray-200 font-medium">{item.name}</p><p className="text-xs text-gray-500">{item.qty.toLocaleString()} units · {item.category}</p></div>
                    <div className="text-right"><p className="text-sm text-amber-400 font-semibold">{fmt(item.revenue)}</p><p className="text-xs text-gray-500">{margin.toFixed(1)}% margin</p></div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-600 mt-3 italic">Consider promotions or menu adjustments for these items.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Key Insights</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {icon:"🚀",title:"Peak Hour",body:`${peakHour.label} is your busiest hour with ${peakHour.orders.toLocaleString()} total orders. Ensure maximum staffing.`,color:"border-blue-500/30 bg-blue-500/5"},
              {icon:"⚠️",title:"Quiet Period",body:`${slowHour.label} sees only ${slowHour.orders.toLocaleString()} orders. Consider happy-hour promotions.`,color:"border-amber-500/30 bg-amber-500/5"},
              {icon:"💡",title:"Revenue Mix",body:`Mains drive the most revenue per transaction. Upsell beverages to boost average basket size.`,color:"border-emerald-500/30 bg-emerald-500/5"},
            ].map(({icon,title,body,color})=>(
              <div key={title} className={`rounded-xl border p-4 ${color}`}>
                <p className="text-xl mb-2">{icon}</p>
                <p className="text-sm font-semibold text-gray-200 mb-1">{title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
