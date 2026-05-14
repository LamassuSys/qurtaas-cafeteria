import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "en" | "ar";
export type Currency = "USD" | "IQD";

// 1 USD = X IQD
const IQD_RATE = 1310;

// ── Translations ───────────────────────────────────────────────
const T = {
  en: {
    // Nav
    nav_dashboard:   "Dashboard",
    nav_pos:         "POS / Order",
    nav_orders:      "Orders",
    nav_barista_kds: "Kitchen Display",
    nav_sales:       "Sales Tracker",
    nav_reports:     "Reports",
    nav_analytics:   "Analytics",
    nav_predictions: "Predictions",
    nav_drawbacks:   "Drawbacks",
    nav_marketing:   "Marketing",
    nav_inventory:   "Inventory",
    nav_users:       "Users",
    nav_menu:        "Menu Manager",
    // Auth
    sign_in:         "Sign In",
    sign_out:        "Sign Out",
    username:        "Username",
    password:        "Password",
    signing_in:      "Signing in…",
    demo_creds:      "Demo Credentials",
    invalid_creds:   "Invalid username or password.",
    inactive_user:   "User not found or inactive.",
    // Common
    save:            "Save",
    cancel:          "Cancel",
    add:             "Add",
    delete:          "Delete",
    edit:            "Edit",
    search:          "Search",
    active:          "Active",
    inactive:        "Inactive",
    all:             "All",
    close:           "Close",
    confirm:         "Confirm",
    // Dashboard
    todays_revenue:  "Today's Revenue",
    orders_today:    "Orders Today",
    avg_order_value: "Avg. Order Value",
    revenue_30d:     "30-Day Revenue",
    revenue_trend:   "7-Day Revenue Trend",
    top_items:       "Top Items (30 days)",
    orders_by_hour:  "Orders by Hour",
    live_feed:       "Live Sales Feed",
    vs_yesterday:    "vs yesterday",
    per_tx:          "per transaction today",
    total_orders:    "total orders",
    // POS
    current_order:   "Current Order",
    place_order:     "Place Order",
    order_placed:    "Order placed!",
    customer_name:   "Customer name (optional)",
    order_notes:     "Order notes…",
    tap_to_add:      "Tap menu items to add",
    clear:           "Clear",
    // Orders
    pending:         "Pending",
    preparing:       "Preparing",
    ready:           "Ready ✓",
    completed:       "Completed",
    cancelled:       "Cancelled",
    start_preparing: "Start Preparing",
    mark_ready:      "Mark Ready",
    complete_order:  "Complete Order",
    cancel_order:    "Cancel",
    today_orders:    "Today Orders",
    today_revenue:   "Today Revenue",
    walk_in:         "Walk-in",
    waiting_pickup:  "Waiting for pickup",
    no_orders:       "No orders found",
    // Inventory
    total_skus:      "Total SKUs",
    low_stock:       "Low Stock",
    moderate:        "Moderate",
    in_stock:        "In Stock",
    stock_value:     "Stock Value",
    reorder:         "Reorder Checklist",
    // Analytics
    avg_daily_rev:   "Avg Daily Revenue",
    overall_margin:  "Overall Margin",
    total_orders_35: "Total Orders (35d)",
    // Reports
    last_7:          "Last 7 days",
    last_30:         "Last 30 days",
    export_csv:      "Export CSV",
    // Settings
    language:        "Language",
    currency:        "Currency",
    // Kitchen
    kitchen_display: "Kitchen Display",
    no_active_orders:"No active orders",
    new_orders_appear:"New orders will appear here automatically",
  },
  ar: {
    // Nav
    nav_dashboard:   "لوحة التحكم",
    nav_pos:         "نقطة البيع",
    nav_orders:      "الطلبات",
    nav_barista_kds: "شاشة المطبخ",
    nav_sales:       "تتبع المبيعات",
    nav_reports:     "التقارير",
    nav_analytics:   "التحليلات",
    nav_predictions: "التوقعات",
    nav_drawbacks:   "نقاط الضعف",
    nav_marketing:   "التسويق",
    nav_inventory:   "المخزون",
    nav_users:       "المستخدمون",
    nav_menu:        "إدارة القائمة",
    // Auth
    sign_in:         "تسجيل الدخول",
    sign_out:        "تسجيل الخروج",
    username:        "اسم المستخدم",
    password:        "كلمة المرور",
    signing_in:      "جارٍ الدخول…",
    demo_creds:      "بيانات تجريبية",
    invalid_creds:   "اسم المستخدم أو كلمة المرور غير صحيحة.",
    inactive_user:   "المستخدم غير موجود أو غير نشط.",
    // Common
    save:            "حفظ",
    cancel:          "إلغاء",
    add:             "إضافة",
    delete:          "حذف",
    edit:            "تعديل",
    search:          "بحث",
    active:          "نشط",
    inactive:        "غير نشط",
    all:             "الكل",
    close:           "إغلاق",
    confirm:         "تأكيد",
    // Dashboard
    todays_revenue:  "إيرادات اليوم",
    orders_today:    "طلبات اليوم",
    avg_order_value: "متوسط قيمة الطلب",
    revenue_30d:     "إيرادات 30 يوم",
    revenue_trend:   "اتجاه الإيرادات (7 أيام)",
    top_items:       "أفضل المنتجات (30 يوم)",
    orders_by_hour:  "الطلبات حسب الساعة",
    live_feed:       "المبيعات المباشرة",
    vs_yesterday:    "مقارنة بالأمس",
    per_tx:          "لكل معاملة اليوم",
    total_orders:    "إجمالي الطلبات",
    // POS
    current_order:   "الطلب الحالي",
    place_order:     "تأكيد الطلب",
    order_placed:    "تم تسجيل الطلب!",
    customer_name:   "اسم العميل (اختياري)",
    order_notes:     "ملاحظات الطلب…",
    tap_to_add:      "اضغط على العناصر للإضافة",
    clear:           "مسح",
    // Orders
    pending:         "قيد الانتظار",
    preparing:       "قيد التحضير",
    ready:           "جاهز ✓",
    completed:       "مكتمل",
    cancelled:       "ملغى",
    start_preparing: "ابدأ التحضير",
    mark_ready:      "جاهز للاستلام",
    complete_order:  "إتمام الطلب",
    cancel_order:    "إلغاء",
    today_orders:    "طلبات اليوم",
    today_revenue:   "إيرادات اليوم",
    walk_in:         "زبون عادي",
    waiting_pickup:  "بانتظار الاستلام",
    no_orders:       "لا توجد طلبات",
    // Inventory
    total_skus:      "إجمالي الأصناف",
    low_stock:       "مخزون منخفض",
    moderate:        "متوسط",
    in_stock:        "متوفر",
    stock_value:     "قيمة المخزون",
    reorder:         "قائمة إعادة الطلب",
    // Analytics
    avg_daily_rev:   "متوسط الإيراد اليومي",
    overall_margin:  "إجمالي الهامش",
    total_orders_35: "إجمالي الطلبات (35 يوم)",
    // Reports
    last_7:          "آخر 7 أيام",
    last_30:         "آخر 30 يوم",
    export_csv:      "تصدير CSV",
    // Settings
    language:        "اللغة",
    currency:        "العملة",
    // Kitchen
    kitchen_display: "شاشة المطبخ",
    no_active_orders:"لا توجد طلبات نشطة",
    new_orders_appear:"الطلبات الجديدة ستظهر هنا تلقائياً",
  },
} as const;

export type TKey = keyof typeof T.en;

// ── Context ────────────────────────────────────────────────────
interface I18nCtx {
  lang:        Lang;
  currency:    Currency;
  isRTL:       boolean;
  setLang:     (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  t:           (key: TKey) => string;
  fmt:         (usd: number, compact?: boolean) => string;
}

const Ctx = createContext<I18nCtx | null>(null);
const LS_LANG = "ink_lang";
const LS_CUR  = "ink_currency";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang,     setLangState]     = useState<Lang>(()     => (localStorage.getItem(LS_LANG)  as Lang)     ?? "en");
  const [currency, setCurrencyState] = useState<Currency>(() => (localStorage.getItem(LS_CUR)   as Currency) ?? "USD");

  const isRTL = lang === "ar";

  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem(LS_LANG, l); };
  const setCurrency = (c: Currency) => { setCurrencyState(c); localStorage.setItem(LS_CUR, c); };

  // Apply dir + font to <html>
  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.style.fontFamily = isRTL
      ? "'Segoe UI', 'Tahoma', 'Arial', 'Noto Sans Arabic', sans-serif"
      : "";
  }, [isRTL, lang]);

  const t = (key: TKey): string => T[lang][key] ?? T.en[key] ?? key;

  const fmt = (usd: number, compact = false): string => {
    if (currency === "IQD") {
      const iqd = usd * IQD_RATE;
      if (compact && iqd >= 1_000_000) return `${(iqd / 1_000_000).toFixed(1)}M د.ع`;
      if (compact && iqd >= 1_000)     return `${(iqd / 1_000).toFixed(0)}K د.ع`;
      return `${Math.round(iqd).toLocaleString()} د.ع`;
    }
    if (compact && usd >= 1000) return `$${(usd / 1000).toFixed(1)}k`;
    return `$${usd.toFixed(2)}`;
  };

  return (
    <Ctx.Provider value={{ lang, currency, isRTL, setLang, setCurrency, t, fmt }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
