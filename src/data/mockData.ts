// All prices stored natively in IQD
export const MENU_ITEMS = [
  { id: 1, name: "Coffee",   category: "Beverages", price: 3500,  cost: 800,  emoji: "☕" },
  { id: 2, name: "Tea",      category: "Beverages", price: 2500,  cost: 400,  emoji: "🍵" },
  { id: 3, name: "Juice",    category: "Beverages", price: 4000,  cost: 1000, emoji: "🍊" },
  { id: 4, name: "Water",    category: "Beverages", price: 1500,  cost: 200,  emoji: "💧" },
  { id: 5, name: "Sandwich", category: "Snacks",    price: 6000,  cost: 2000, emoji: "🥪" },
  { id: 6, name: "Salad",    category: "Healthy",   price: 7500,  cost: 2500, emoji: "🥗" },
  { id: 7, name: "Cake",     category: "Desserts",  price: 5000,  cost: 1500, emoji: "🍰" },
  { id: 8, name: "Pasta",    category: "Mains",     price: 10000, cost: 3500, emoji: "🍝" },
  { id: 9, name: "Burger",   category: "Mains",     price: 10500, cost: 3500, emoji: "🍔" },
  { id: 10, name: "Pizza",   category: "Mains",     price: 12000, cost: 4500, emoji: "🍕" },
];

export const CATEGORIES = ["Beverages", "Snacks", "Healthy", "Desserts", "Mains"];

const PEAK_HOURS = [8, 9, 12, 13, 15, 16];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function weightedItemPick(dayIndex: number, hour: number): typeof MENU_ITEMS[0] {
  const weights = MENU_ITEMS.map((item, i) => {
    let w = 1;
    if (hour < 10) w = item.category === "Beverages" ? 4 : 1;
    else if (hour >= 12 && hour <= 14) w = item.category === "Mains" ? 5 : item.category === "Beverages" ? 2 : 1;
    else if (hour >= 15 && hour <= 17) w = item.category === "Snacks" || item.category === "Desserts" ? 3 : 1;
    return w + seededRandom(dayIndex * 100 + i * 7 + hour) * 0.5;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const r = seededRandom(dayIndex * 999 + hour * 37) * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r <= acc) return MENU_ITEMS[i];
  }
  return MENU_ITEMS[0];
}

export interface Transaction {
  id: string; date: string; time: string; item: string; category: string;
  qty: number; price: number; cost: number; revenue: number; profit: number; hour: number;
}

export const transactions: Transaction[] = [];

const today = new Date(2026, 4, 14);
const pad = (n: number) => String(n).padStart(2, "0");

for (let d = 0; d < 35; d++) {
  const date = new Date(today);
  date.setDate(today.getDate() - (34 - d));
  const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const baseOrders = isWeekend ? 80 : 280 + Math.floor(seededRandom(d * 7) * 60);
  let txId = 0;
  for (const hour of [7,8,9,10,11,12,13,14,15,16,17,18]) {
    const isPeak = PEAK_HOURS.includes(hour);
    const hourFactor = isPeak ? 0.18 : 0.04;
    const ordersThisHour = Math.max(1, Math.floor(baseOrders * hourFactor * (1 + seededRandom(d * 24 + hour) * 0.3)));
    for (let o = 0; o < ordersThisHour; o++) {
      const item = weightedItemPick(d * 24 + hour, hour);
      const qty = seededRandom(d * 1000 + hour * 100 + o) > 0.85 ? 2 : 1;
      const revenue = item.price * qty;
      const cost = item.cost * qty;
      const min = Math.floor(seededRandom(d * 500 + hour * 60 + o) * 59);
      transactions.push({
        id: `TX-${dateStr}-${String(txId++).padStart(4,"0")}`,
        date: dateStr, time: `${pad(hour)}:${pad(min)}`,
        item: item.name, category: item.category, qty,
        price: item.price, cost: item.cost, revenue, profit: revenue - cost, hour,
      });
    }
  }
}

export const dailySummary = (() => {
  const map: Record<string,{date:string;revenue:number;profit:number;orders:number}> = {};
  for (const tx of transactions) {
    if (!map[tx.date]) map[tx.date] = { date: tx.date, revenue: 0, profit: 0, orders: 0 };
    map[tx.date].revenue += tx.revenue;
    map[tx.date].profit  += tx.profit;
    map[tx.date].orders++;
  }
  return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
})();

export const hourlySummary = (() => {
  const map: Record<number,{hour:number;label:string;orders:number;revenue:number}> = {};
  for (const tx of transactions) {
    if (!map[tx.hour]) map[tx.hour] = { hour: tx.hour, label: `${tx.hour}:00`, orders: 0, revenue: 0 };
    map[tx.hour].orders++;
    map[tx.hour].revenue += tx.revenue;
  }
  return Object.values(map).sort((a,b) => a.hour - b.hour);
})();

export const itemSummary = (() => {
  const map: Record<string,{name:string;category:string;qty:number;revenue:number;profit:number;cost:number}> = {};
  for (const tx of transactions) {
    if (!map[tx.item]) map[tx.item] = { name: tx.item, category: tx.category, qty: 0, revenue: 0, profit: 0, cost: 0 };
    map[tx.item].qty     += tx.qty;
    map[tx.item].revenue += tx.revenue;
    map[tx.item].profit  += tx.profit;
    map[tx.item].cost    += tx.cost;
  }
  return Object.values(map).sort((a,b) => b.revenue - a.revenue);
})();

export const categorySummary = (() => {
  const map: Record<string,{name:string;revenue:number;profit:number;orders:number}> = {};
  for (const tx of transactions) {
    if (!map[tx.category]) map[tx.category] = { name: tx.category, revenue: 0, profit: 0, orders: 0 };
    map[tx.category].revenue += tx.revenue;
    map[tx.category].profit  += tx.profit;
    map[tx.category].orders  += tx.qty;
  }
  return Object.values(map);
})();

export const inventoryData = MENU_ITEMS.map(item => {
  const sold = itemSummary.find(s => s.name === item.name)?.qty || 0;
  const dailyAvg = sold / 35;
  const stock = Math.floor(dailyAvg * (3 + Math.random() * 4));
  const reorderLevel = Math.floor(dailyAvg * 2);
  return {
    ...item, stock, reorderLevel,
    dailyAvg: Math.round(dailyAvg),
    daysLeft: stock > 0 ? Math.round(stock / dailyAvg) : 0,
    status: (stock <= reorderLevel ? "low" : stock <= reorderLevel * 2 ? "medium" : "ok") as "low"|"medium"|"ok",
  };
});
