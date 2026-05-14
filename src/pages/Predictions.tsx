import { useMemo } from "react";
import { dailySummary } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

function linearRegression(data: number[]) {
  const n = data.length;
  const sumX = (n*(n-1))/2, sumX2 = (n*(n-1)*(2*n-1))/6;
  const sumY = data.reduce((s,v)=>s+v,0), sumXY = data.reduce((s,v,i)=>s+i*v,0);
  const slope = (n*sumXY - sumX*sumY)/(n*sumX2 - sumX*sumX);
  return { slope, intercept:(sumY-slope*sumX)/n };
}

export function Predictions() {
  const historicalRevenue = dailySummary.map(d=>d.revenue);
  const { slope, intercept } = useMemo(()=>linearRegression(historicalRevenue),[]);
  const stdDev = useMemo(()=>{
    const predicted = historicalRevenue.map((_,i)=>intercept+slope*i);
    const residuals = historicalRevenue.map((v,i)=>v-predicted[i]);
    const variance = residuals.reduce((s,r)=>s+r*r,0)/residuals.length;
    return Math.sqrt(variance);
  },[slope,intercept]);

  const chartData = useMemo(()=>{
    const hist = dailySummary.map((d,i)=>({
      date:d.date.slice(5), actual:Math.round(d.revenue*100)/100,
      trend:Math.round((intercept+slope*i)*100)/100,
      lower:undefined as number|undefined, upper:undefined as number|undefined, type:"historical",
    }));
    const n = dailySummary.length;
    const future = Array.from({length:30},(_,i)=>{
      const idx = n+i;
      const date = new Date("2026-05-15"); date.setDate(date.getDate()+i);
      const dow = date.getDay();
      const seasonal = (dow===0||dow===6)?-120:dow===1||dow===5?-20:15;
      const base = intercept+slope*idx+seasonal;
      const confFactor = 1+(i/30)*0.3;
      const dateStr = `${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
      return {
        date:dateStr, actual:undefined as number|undefined,
        trend:Math.round(base*100)/100,
        lower:Math.round((base-stdDev*confFactor)*100)/100,
        upper:Math.round((base+stdDev*confFactor)*100)/100,
        type:"forecast",
      };
    });
    return [...hist,...future];
  },[slope,intercept,stdDev]);

  const next7 = chartData.filter(d=>d.type==="forecast").slice(0,7);
  const next30Revenue = chartData.filter(d=>d.type==="forecast").reduce((s,d)=>s+(d.trend||0),0);
  const avgActual = historicalRevenue.reduce((s,v)=>s+v,0)/historicalRevenue.length;

  return (
    <div className="p-6 space-y-4">
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-5 py-3 text-xs text-gray-400 flex flex-wrap gap-4">
        <span>📊 <span className="text-blue-400 font-medium">Model:</span> Linear Regression + Day-of-Week Seasonality</span>
        <span>📈 <span className="text-blue-400 font-medium">Trend:</span> {slope>=0?"+":""}{slope.toFixed(2)}/day</span>
        <span>🎯 <span className="text-blue-400 font-medium">Std Dev:</span> ±${stdDev.toFixed(2)}</span>
        <span>🔮 <span className="text-blue-400 font-medium">30-Day Forecast:</span> ${next30Revenue.toFixed(0)}</span>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">35-Day History + 30-Day Forecast</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{top:10,right:20,left:-10,bottom:0}}>
              <defs><linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="date" tick={{fill:"#6b7280",fontSize:10}} interval={4}/>
              <YAxis tick={{fill:"#6b7280",fontSize:11}}/>
              <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,fontSize:12}} formatter={(v,name)=>{const n=v as number|undefined;return n!==undefined?[`$${n.toFixed(2)}`,name as string]:["—",name as string];}}/>
              <Legend wrapperStyle={{fontSize:12,color:"#9ca3af"}}/>
              <ReferenceLine x={dailySummary[dailySummary.length-1].date.slice(5)} stroke="#374151" strokeDasharray="4 2" label={{value:"Today",fill:"#6b7280",fontSize:10}}/>
              <Area dataKey="upper" fill="url(#confGrad)" stroke="transparent" name="Upper CI" legendType="none"/>
              <Area dataKey="lower" fill="#0a0f1a" stroke="transparent" name="Lower CI" legendType="none"/>
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={false} name="Actual" connectNulls={false}/>
              <Line type="monotone" dataKey="trend" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="6 3" name="Forecast" connectNulls={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Next 7-Day Forecast</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-800">
                  {["Date","Forecast Revenue","Low Estimate","High Estimate","vs Avg","Confidence"].map(h=>(
                    <th key={h} className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {next7.map((d,idx)=>{
                  const vs = ((d.trend!-avgActual)/avgActual)*100;
                  const confidence = Math.max(60,95-idx*4);
                  return (
                    <tr key={d.date} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-300 font-medium">2026-{d.date}</td>
                      <td className="px-4 py-3 text-blue-400 font-bold">${d.trend!.toFixed(2)}</td>
                      <td className="px-4 py-3 text-red-400">${d.lower!.toFixed(2)}</td>
                      <td className="px-4 py-3 text-emerald-400">${d.upper!.toFixed(2)}</td>
                      <td className="px-4 py-3"><span className={vs>=0?"text-emerald-400":"text-red-400"}>{vs>=0?"+":""}{vs.toFixed(1)}%</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${confidence}%`}}/></div>
                          <span className="text-xs text-gray-400">{confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {label:"Exam Season Boost",value:"+22%",desc:"May–June exam prep drives coffee & snack sales",icon:"📚"},
          {label:"Weekend Dip",value:"−58%",desc:"Weekends see ~42% of weekday volume",icon:"📅"},
          {label:"Lunch Rush",value:"×3.2x",desc:"12–14:00 generates 3.2× off-peak revenue",icon:"🍽️"},
        ].map(({label,value,desc,icon})=>(
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2"><span className="text-xl">{icon}</span><span className="text-sm font-semibold text-gray-300">{label}</span></div>
              <p className="text-2xl font-bold text-blue-400">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
