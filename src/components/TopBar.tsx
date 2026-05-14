import { useState } from "react";
import { Bell, X, LogOut, ChevronDown, Globe, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_CONFIG } from "@/auth/roles";
import { useI18n } from "@/data/i18nStore";

const ALERTS = [
  { id: 1, type: "warning", text: "Coffee stock running low — 2 days remaining", time: "10 min ago" },
  { id: 2, type: "info",    text: "Peak lunch hour starting in 30 min — prep staff", time: "28 min ago" },
  { id: 3, type: "success", text: "Today's revenue already at 78% of daily target", time: "1 hr ago" },
];

const PAGE_LABEL_KEY: Record<string, string> = {
  dashboard:   "nav_dashboard",
  pos:         "nav_pos",
  orders:      "nav_orders",
  barista_kds: "nav_barista_kds",
  sales:       "nav_sales",
  reports:     "nav_reports",
  analytics:   "nav_analytics",
  predictions: "nav_predictions",
  drawbacks:   "nav_drawbacks",
  marketing:   "nav_marketing",
  inventory:   "nav_inventory",
  users:       "nav_users",
  menu:        "nav_menu",
};

interface TopBarProps { page: string; }

export function TopBar({ page }: TopBarProps) {
  const { user, logout } = useAuth();
  const { t, lang, setLang, currency, setCurrency, exchangeRate, setExchangeRate, isRTL } = useI18n();
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const [settOpen,   setSettOpen]   = useState(false);
  const [dismissed,  setDismissed]  = useState<number[]>([]);
  const [rateInput,  setRateInput]  = useState(String(exchangeRate));

  const isSuperAdmin = user?.role === "super_admin";
  const visible = ALERTS.filter(a => !dismissed.includes(a.id));

  const roleCfg = user ? ROLE_CONFIG[user.role] : null;
  const initials = user?.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  const closeAll = () => { setNotifOpen(false); setUserOpen(false); setSettOpen(false); };

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-5 shrink-0">
      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        <span className="text-gray-600 text-sm">/</span>
        <span className="text-gray-200 font-semibold text-sm">
          {t((PAGE_LABEL_KEY[page] ?? "nav_dashboard") as Parameters<typeof t>[0])}
        </span>
      </div>

      <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
        <span className="text-gray-600 text-xs hidden sm:block">Wed, May 15 2026</span>

        {/* Language + Currency toggle */}
        <div className="relative">
          <button onClick={() => { setSettOpen(o => !o); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors text-xs font-medium">
            <Globe size={14} />
            <span className="hidden sm:inline">{lang === "ar" ? "عربي" : "EN"}</span>
            <span className="text-gray-600">·</span>
            <span className="hidden sm:inline">{currency}</span>
          </button>

          {settOpen && (
            <div className={cn("absolute top-11 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50", isRTL ? "left-0" : "right-0")}>
              <div className="p-3 space-y-3">
                {/* Language */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t("language")}</p>
                  <div className="flex gap-1.5">
                    {([["en","English"],["ar","العربية"]] as const).map(([l, label]) => (
                      <button key={l} onClick={() => setLang(l)}
                        className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          lang === l ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600")}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Currency */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t("currency")}</p>
                  <div className="flex gap-1.5">
                    {([["USD","$ USD"],["IQD","د.ع IQD"]] as const).map(([c, label]) => (
                      <button key={c} onClick={() => setCurrency(c)}
                        className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          currency === c ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600")}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {currency === "IQD" && (
                    <p className="text-[10px] text-gray-600 mt-1.5 text-center">1 USD = {exchangeRate.toLocaleString()} د.ع</p>
                  )}
                </div>

                {/* Exchange Rate — Super Admin only */}
                {isSuperAdmin && (
                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <RefreshCw size={10} /> Exchange Rate
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 shrink-0">1 USD =</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={rateInput}
                        onChange={e => setRateInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            const r = parseFloat(rateInput);
                            if (r > 0) setExchangeRate(r);
                          }
                        }}
                        className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-gray-500 shrink-0">د.ع</span>
                      <button
                        onClick={() => {
                          const r = parseFloat(rateInput);
                          if (r > 0) setExchangeRate(r);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors shrink-0 font-medium"
                      >
                        Set
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5">Applies system-wide · saved automatically</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setNotifOpen(o => !o); setUserOpen(false); setSettOpen(false); }}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <Bell size={17} />
            {visible.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
          </button>

          {notifOpen && (
            <div className={cn("absolute top-11 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50", isRTL ? "left-0" : "right-0")}>
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-200">Notifications</span>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">{visible.length}</Badge>
              </div>
              <div className="divide-y divide-gray-700/50">
                {visible.length === 0 && <p className="text-center text-gray-500 text-sm py-6">All caught up!</p>}
                {visible.map(alert => (
                  <div key={alert.id} className="px-4 py-3 flex gap-3 hover:bg-gray-700/50 transition-colors">
                    <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                      alert.type === "warning" ? "bg-amber-400" : alert.type === "success" ? "bg-emerald-400" : "bg-blue-400")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 leading-snug">{alert.text}</p>
                      <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
                    </div>
                    <button onClick={() => setDismissed(d => [...d, alert.id])} className="text-gray-600 hover:text-gray-400 shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => { setUserOpen(o => !o); setNotifOpen(false); setSettOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-300 leading-none">{user?.fullName}</p>
              {roleCfg && <p className={`text-[10px] font-medium leading-none mt-0.5 ${roleCfg.color}`}>{roleCfg.label}</p>}
            </div>
            <ChevronDown size={13} className="text-gray-500 hidden sm:block" />
          </button>

          {userOpen && (
            <div className={cn("absolute top-11 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50", isRTL ? "left-0" : "right-0")}>
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-semibold text-gray-200">{user?.fullName}</p>
                <p className="text-xs text-gray-500 font-mono">{user?.username}</p>
                {roleCfg && <Badge className={`mt-1.5 text-xs border ${roleCfg.bg} ${roleCfg.color}`}>{roleCfg.label}</Badge>}
              </div>
              <div className="p-1">
                <button onClick={() => { logout(); closeAll(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut size={14} />{t("sign_out")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
