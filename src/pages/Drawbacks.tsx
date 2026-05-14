import { itemSummary, categorySummary, dailySummary, hourlySummary } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Clock, Package, DollarSign, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";
import { useI18n } from "@/data/i18nStore";

export function Drawbacks() {
  const { fmt } = useI18n();
  const sorted = [...itemSummary].sort((a, b) => a.revenue - b.revenue);
  const slowItems = sorted.slice(0, 4);

  const totalRevenue = dailySummary.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = totalRevenue / dailySummary.length;
  const belowAvgDays = dailySummary.filter(d => d.revenue < avgDaily * 0.85);
  const weekendDays = dailySummary.filter(d => {
    const dow = new Date(d.date).getDay();
    return dow === 0 || dow === 6;
  });
  const weekdayDays = dailySummary.filter(d => {
    const dow = new Date(d.date).getDay();
    return dow !== 0 && dow !== 6;
  });
  const avgWeekend = weekendDays.reduce((s, d) => s + d.revenue, 0) / (weekendDays.length || 1);
  const avgWeekday = weekdayDays.reduce((s, d) => s + d.revenue, 0) / (weekdayDays.length || 1);
  const weekendDip = ((avgWeekday - avgWeekend) / avgWeekday) * 100;

  const peakHour = hourlySummary.reduce((max, h) => h.orders > max.orders ? h : max, hourlySummary[0]);
  const slowHour = hourlySummary.reduce((min, h) => h.orders < min.orders ? h : min, hourlySummary[0]);
  const avgHourly = hourlySummary.reduce((s, h) => s + h.orders, 0) / hourlySummary.length;

  const totalProfit = dailySummary.reduce((s, d) => s + d.profit, 0);
  const overallMargin = (totalProfit / totalRevenue) * 100;
  const lowMarginItems = itemSummary.filter(i => i.revenue > 0 && (i.profit / i.revenue) * 100 < overallMargin * 0.7);

  const revenueVolatility = (() => {
    const mean = avgDaily;
    const variance = dailySummary.reduce((s, d) => s + Math.pow(d.revenue - mean, 2), 0) / dailySummary.length;
    return Math.sqrt(variance);
  })();
  const cv = (revenueVolatility / avgDaily) * 100;

  const issues = [
    {
      icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20",
      severity: "High", title: "Weekend Revenue Drop",
      value: `-${weekendDip.toFixed(0)}%`, desc: `Weekend avg (${fmt(avgWeekend)}) is ${weekendDip.toFixed(0)}% below weekday avg (${fmt(avgWeekday)}). Significant revenue loss on Sat/Sun.`,
      action: "Consider weekend-only promotions or reduced operating hours to cut fixed costs.",
    },
    {
      icon: Package, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
      severity: "Medium", title: "Slow-Moving Menu Items",
      value: `${slowItems.length} items`, desc: `${slowItems.map(i => i.name).join(", ")} generate under ${fmt(slowItems[slowItems.length-1]?.revenue ?? 0)} total revenue over 35 days.`,
      action: "Bundle slow items with bestsellers as combo deals, or replace with higher-demand alternatives.",
    },
    {
      icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20",
      severity: "Medium", title: "Off-Peak Dead Zones",
      value: `${slowHour.label}`, desc: `${slowHour.label} generates only ${slowHour.orders} orders vs peak ${peakHour.orders} orders (${Math.round((slowHour.orders/peakHour.orders)*100)}% of peak).`,
      action: "Introduce happy-hour pricing or study-break combos during slow windows.",
    },
    {
      icon: DollarSign, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20",
      severity: "Low", title: "Revenue Volatility",
      value: `CV ${cv.toFixed(1)}%`, desc: `Daily revenue coefficient of variation is ${cv.toFixed(1)}%, meaning unpredictable income. ${belowAvgDays.length} days fell below 85% of average.`,
      action: "Introduce loyalty subscriptions or pre-orders to smooth revenue peaks and valleys.",
    },
    {
      icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
      severity: "Low", title: "Low-Margin Items Diluting Profit",
      value: `${lowMarginItems.length} items`, desc: `${lowMarginItems.length} items have margins 30%+ below average (${overallMargin.toFixed(1)}%). These erode overall profitability.`,
      action: "Review cost structure or increase prices on low-margin items by 5–10%.",
    },
  ];

  const revenueData = dailySummary.map(d => ({
    date: d.date.slice(5),
    revenue: Math.round(d.revenue),
    avg: Math.round(avgDaily),
  }));

  const marginData = itemSummary.map(item => ({
    name: item.name,
    margin: item.revenue > 0 ? Math.round((item.profit / item.revenue) * 100) : 0,
  })).sort((a, b) => a.margin - b.margin);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Issues Detected", value: issues.length.toString(), color: "text-red-400" },
          { label: "High Severity", value: issues.filter(i => i.severity === "High").length.toString(), color: "text-red-400" },
          { label: "Weekend Dip", value: `-${weekendDip.toFixed(0)}%`, color: "text-amber-400" },
          { label: "Revenue CV", value: `${cv.toFixed(1)}%`, color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {issues.map(({ icon: Icon, color, bg, severity, title, value, desc, action }) => (
          <Card key={title} className={`border ${bg} bg-gray-900`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${bg} shrink-0`}><Icon size={18} className={color} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-gray-200">{title}</span>
                    <Badge className={`text-xs px-2 py-0 ${severity === "High" ? "bg-red-500/20 text-red-400" : severity === "Medium" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>{severity}</Badge>
                    <span className={`text-sm font-bold ${color} ml-auto`}>{value}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                  <div className="mt-2 flex items-start gap-1.5">
                    <AlertTriangle size={11} className="text-gray-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500 italic">{action}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Revenue vs Average (35 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} formatter={(v) => [fmt(v as number)]} />
                <ReferenceLine y={Math.round(avgDaily)} stroke="#ef4444" strokeDasharray="4 2" label={{ value: "Avg", fill: "#ef4444", fontSize: 10 }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Profit Margin by Item (Low → High)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={marginData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => `${(v as number)}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} width={65} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${(v as number)}%`, "Margin"]} />
                <ReferenceLine x={Math.round(overallMargin)} stroke="#f59e0b" strokeDasharray="4 2" />
                <Bar dataKey="margin" radius={[0, 4, 4, 0]} fill="#3b82f6" background={{ fill: "#1f2937", radius: 4 }} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-1">Dashed line = avg margin ({overallMargin.toFixed(1)}%)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Category Health Check</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categorySummary.map(cat => {
              const margin = (cat.profit / cat.revenue) * 100;
              const share = (cat.revenue / totalRevenue) * 100;
              const isLow = margin < overallMargin * 0.8;
              return (
                <div key={cat.name} className="bg-gray-800/60 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-200">{cat.name}</span>
                    <div className="flex gap-2 items-center">
                      {isLow && <Badge className="bg-red-500/20 text-red-400 text-xs">Low Margin</Badge>}
                      <span className="text-xs text-gray-400">{share.toFixed(1)}% of revenue</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${share}%`, background: isLow ? "#ef4444" : "#3b82f6" }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                    <span>{fmt(cat.revenue)} revenue</span>
                    <span className={isLow ? "text-red-400" : "text-emerald-400"}>{margin.toFixed(1)}% margin</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
