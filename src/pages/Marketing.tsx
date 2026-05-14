import { itemSummary, categorySummary, dailySummary, hourlySummary } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Gift, Star, Zap, Calendar, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

export function Marketing() {
  const totalRevenue = dailySummary.reduce((s, d) => s + d.revenue, 0);
  const topItems = [...itemSummary].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const slowItems = [...itemSummary].sort((a, b) => a.revenue - b.revenue).slice(0, 3);
  const peakHour = hourlySummary.reduce((max, h) => h.orders > max.orders ? h : max, hourlySummary[0]);

  const weekendDays = dailySummary.filter(d => { const dow = new Date(d.date).getDay(); return dow === 0 || dow === 6; });
  const weekdayDays = dailySummary.filter(d => { const dow = new Date(d.date).getDay(); return dow !== 0 && dow !== 6; });
  const avgWeekend = weekendDays.reduce((s, d) => s + d.revenue, 0) / (weekendDays.length || 1);
  const avgWeekday = weekdayDays.reduce((s, d) => s + d.revenue, 0) / (weekdayDays.length || 1);

  const campaigns = [
    {
      icon: Gift, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20",
      title: "Weekend Warrior Bundle",
      tag: "Revenue Boost",
      tagColor: "bg-pink-500/20 text-pink-400",
      impact: "+35% weekend",
      desc: "Pair top beverages with a snack at 15% off every Saturday & Sunday. Targets the −58% weekend dip.",
      tactics: ["Coffee + Croissant combo at $4.50", "Buy 2 get 1 free on snacks Sat 10–12", "Weekend loyalty double-stamp"],
      effort: "Low",
      timeline: "1 week",
    },
    {
      icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
      title: "Happy Hour Activation",
      tag: "Traffic Driver",
      tagColor: "bg-amber-500/20 text-amber-400",
      impact: "+50% off-peak",
      desc: `Off-peak hours (outside ${peakHour.label}) have 3× fewer orders. Flash 20-min deals via WhatsApp/notice board.`,
      tactics: ["15:00–16:00 flash deal: 20% off cold drinks", "Study-break combo (drink + snack) $3.99", "First 10 orders each slow hour get a free upgrade"],
      effort: "Low",
      timeline: "Immediate",
    },
    {
      icon: Star, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
      title: "Loyalty Stamp Card",
      tag: "Retention",
      tagColor: "bg-blue-500/20 text-blue-400",
      impact: "+20% repeat visits",
      desc: "Digital or paper stamp card: buy 9 items, get the 10th free. Drives repeat purchase and builds habit.",
      tactics: ["Physical card for beverages (most purchased)", "App-based digital option via WhatsApp QR", "Double-stamp days on Mondays to kick-start the week"],
      effort: "Medium",
      timeline: "2 weeks",
    },
    {
      icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Exam Season Special",
      tag: "Seasonal",
      tagColor: "bg-emerald-500/20 text-emerald-400",
      impact: "+22% May–June",
      desc: "Target high-stress exam periods with energy-focused bundles. Brain food + caffeine positioning.",
      tactics: ["'Fuel Your Focus' combo: espresso + energy bar", "Free coffee refill during 8–10 AM exam weeks", "Study group order: 4+ items = free dessert"],
      effort: "Low",
      timeline: "1 week",
    },
    {
      icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20",
      title: "Upsell & Cross-sell Script",
      tag: "Margin Growth",
      tagColor: "bg-purple-500/20 text-purple-400",
      impact: "+12% avg basket",
      desc: "Train staff to suggest add-ons at POS. 'Would you like a cookie with that?' can add $0.50–$1 per transaction.",
      tactics: ["Suggest beverages with every main course order", "Display 'Customers also bought' at counter", "Combo price anchoring on menu board"],
      effort: "Low",
      timeline: "Immediate",
    },
    {
      icon: Megaphone, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20",
      title: "Slow Item Revival Campaign",
      tag: "Menu Optimization",
      tagColor: "bg-orange-500/20 text-orange-400",
      impact: "+80% on slow SKUs",
      desc: `${slowItems.map(i => i.name).join(", ")} underperform. Reposition them with creative naming and bundling before dropping from menu.`,
      tactics: ["Rename items with descriptive/fun names", "Feature in 'Staff Pick of the Week' signage", "Bundle with bestseller at slight discount"],
      effort: "Low",
      timeline: "1–2 weeks",
    },
  ];

  const effortImpactData = [
    { name: "Weekend Bundle", effort: 2, impact: 35 },
    { name: "Happy Hour", effort: 1, impact: 50 },
    { name: "Loyalty Card", effort: 5, impact: 20 },
    { name: "Exam Special", effort: 2, impact: 22 },
    { name: "Upsell Script", effort: 1, impact: 12 },
    { name: "Slow Revival", effort: 2, impact: 80 },
  ];

  const radarData = categorySummary.map(cat => ({
    subject: cat.name,
    growth: Math.round(Math.random() * 30 + 10),
    potential: Math.round(Math.random() * 40 + 30),
  }));

  const projectedRevenue = totalRevenue / dailySummary.length;
  const projWith = projectedRevenue * 1.18;

  return (
    <div className="p-6 space-y-4">
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-5 py-3 text-xs text-gray-400 flex flex-wrap gap-4">
        <span>🎯 <span className="text-blue-400 font-medium">6 Campaigns</span> ready to launch</span>
        <span>📈 <span className="text-blue-400 font-medium">Projected Uplift:</span> +18% avg daily revenue (~${projWith.toFixed(0)}/day)</span>
        <span>⚡ <span className="text-blue-400 font-medium">3 campaigns</span> can start immediately (zero cost)</span>
        <span>🏆 <span className="text-blue-400 font-medium">Top Opportunity:</span> Slow Item Revival (+80%)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {campaigns.map(({ icon: Icon, color, bg, title, tag, tagColor, impact, desc, tactics, effort, timeline }) => (
          <Card key={title} className={`border ${bg} bg-gray-900`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${bg} shrink-0`}><Icon size={16} className={color} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-200">{title}</span>
                    <Badge className={`text-xs px-2 py-0 ${tagColor}`}>{tag}</Badge>
                    <span className={`text-xs font-bold ${color} ml-auto`}>{impact}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{desc}</p>
                  <ul className="space-y-1 mb-3">
                    {tactics.map(t => (
                      <li key={t} className="text-xs text-gray-500 flex items-start gap-1.5">
                        <span className="text-gray-600 mt-0.5">•</span>{t}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>Effort: <span className="text-gray-300">{effort}</span></span>
                    <span>Timeline: <span className="text-gray-300">{timeline}</span></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Campaign Impact vs Effort</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={effortImpactData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="impact" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Impact %" />
                <Bar dataKey="effort" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Effort (1–5)" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-1 italic">Blue = expected revenue lift %. Amber = implementation effort (1 = easiest).</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">Category Growth Potential</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="#1f2937" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <Radar name="Current Growth" dataKey="growth" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Radar name="Potential" dataKey="potential" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1"><span className="w-3 h-1 bg-blue-500 rounded inline-block"/>Current</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1 bg-emerald-500 rounded inline-block"/>With Campaigns</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-300">30-Day Marketing Calendar</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { week: "Week 1 (Now)", color: "border-blue-500/30 bg-blue-500/5", items: ["Launch upsell training for cashiers", "Deploy Happy Hour signage at counter", "Print Weekend Bundle posters"] },
              { week: "Week 2", color: "border-amber-500/30 bg-amber-500/5", items: ["Roll out stamp card program", "Begin slow-item renaming on menu board", "Test WhatsApp flash deal (1 per day)"] },
              { week: "Week 3", color: "border-emerald-500/30 bg-emerald-500/5", items: ["Run first full Weekend Warrior weekend", "Review slow item sales — bundle vs. cut decision", "Collect stamp card feedback from students"] },
              { week: "Week 4", color: "border-purple-500/30 bg-purple-500/5", items: ["Exam Season prep: design 'Fuel Your Focus' menu", "Measure uplift vs baseline across all campaigns", "Plan menu refresh for next month"] },
            ].map(({ week, color, items }) => (
              <div key={week} className={`rounded-xl border p-4 ${color}`}>
                <p className="text-sm font-semibold text-gray-200 mb-2">{week}</p>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item} className="text-xs text-gray-400 flex items-start gap-1.5">
                      <span className="text-gray-600 mt-0.5 shrink-0">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
