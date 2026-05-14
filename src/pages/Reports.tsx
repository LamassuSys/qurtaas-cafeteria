import { useState } from "react";
import { dailySummary, categorySummary, hourlySummary } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Download } from "lucide-react";

const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#ec4899","#f97316"];

export function Reports() {
  const [range, setRange] = useState<7|30>(30);
  const data = dailySummary.slice(-range);

  const weeklyData = (() => {
    const weeks: Record<string,{week:string;revenue:number;profit:number;orders:number}> = {};
    for (const d of dailySummary) {
      const date = new Date(d.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split("T")[0];
      if (!weeks[key]) weeks[key] = { week:`W${Object.keys(weeks).length+1}`, revenue:0, profit:0, orders:0 };
      weeks[key].revenue += d.revenue; weeks[key].profit += d.profit; weeks[key].orders += d.orders;
    }
    return Object.values(weeks);
  })();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {([7,30] as const).map(r=>(
            <button key={r} onClick={()=>setRange(r)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${range===r?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>Last {r} days</button>
          ))}
        </div>
        <Button variant="outline" className="border-gray-700 text-gray-400 hover:text-gray-200 text-sm gap-1.5"><Download size={14}/> Export CSV</Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Daily Revenue &amp; Profit</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{top:5,right:20,left:-10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:"#6b7280",fontSize:11}}/>
              <YAxis tick={{fill:"#6b7280",fontSize:11}}/>
              <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,fontSize:12}} formatter={(v,name)=>[`$${(v as number).toFixed(2)}`,name as string]}/>
              <Legend wrapperStyle={{fontSize:12,color:"#9ca3af"}}/>
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} name="Revenue"/>
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} name="Profit"/>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Weekly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis dataKey="week" tick={{fill:"#6b7280",fontSize:11}}/>
                <YAxis tick={{fill:"#6b7280",fontSize:11}}/>
                <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,fontSize:12}} formatter={(v)=>[`$${(v as number).toFixed(2)}`]}/>
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]}/>
                <Bar dataKey="profit" fill="#10b981" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Revenue by Category</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie data={categorySummary} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {categorySummary.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,fontSize:12}} formatter={(v)=>[`$${(v as number).toFixed(2)}`]}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categorySummary.map((cat,i)=>(
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/><span className="text-gray-300">{cat.name}</span></div>
                  <span className="text-gray-400 font-medium">${cat.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Peak Hours Heatmap</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {hourlySummary.map(h=>{
              const max = Math.max(...hourlySummary.map(x=>x.orders));
              const intensity = h.orders/max;
              const bg = intensity>0.75?"bg-blue-500":intensity>0.5?"bg-blue-600/70":intensity>0.25?"bg-blue-900/60":"bg-gray-800";
              return (
                <div key={h.hour} className={`${bg} rounded-lg p-3 text-center min-w-[70px] flex-1`}>
                  <p className="text-xs text-gray-300">{h.label}</p>
                  <p className="text-sm font-bold text-white mt-1">{h.orders.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">orders</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
