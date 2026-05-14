import { useState } from "react";
import { Bell, X, LogOut, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_CONFIG } from "@/auth/roles";

const ALERTS = [
  { id: 1, type: "warning", text: "Coffee stock running low — 2 days remaining", time: "10 min ago" },
  { id: 2, type: "info",    text: "Peak lunch hour starting in 30 min — prep staff", time: "28 min ago" },
  { id: 3, type: "success", text: "Today's revenue already at 78% of daily target", time: "1 hr ago" },
];

const PAGE_LABEL: Record<string, string> = {
  dashboard: "Dashboard", sales: "Sales Tracker", reports: "Reports",
  analytics: "Analytics", predictions: "Predictions", drawbacks: "Drawbacks Finder",
  marketing: "Marketing Planner", inventory: "Inventory", users: "User Management",
};

interface TopBarProps { page: string; }

export function TopBar({ page }: TopBarProps) {
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const visible = ALERTS.filter(a => !dismissed.includes(a.id));

  const roleCfg = user ? ROLE_CONFIG[user.role] : null;
  const initials = user?.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-gray-600 text-sm">/</span>
        <span className="text-gray-200 font-semibold text-sm">{PAGE_LABEL[page]}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-gray-600 text-xs hidden sm:block">Wed, May 14 2026</span>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <Bell size={17} />
            {visible.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-200">Notifications</span>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">{visible.length}</Badge>
              </div>
              <div className="divide-y divide-gray-700/50">
                {visible.length === 0 && <p className="text-center text-gray-500 text-sm py-6">All caught up!</p>}
                {visible.map(alert => (
                  <div key={alert.id} className="px-4 py-3 flex gap-3 hover:bg-gray-700/50 transition-colors">
                    <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                      alert.type === "warning" ? "bg-amber-400" : alert.type === "success" ? "bg-emerald-400" : "bg-blue-400"
                    )} />
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
          <button
            onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-300 leading-none">{user?.fullName}</p>
              {roleCfg && (
                <p className={`text-[10px] font-medium leading-none mt-0.5 ${roleCfg.color}`}>{roleCfg.label}</p>
              )}
            </div>
            <ChevronDown size={13} className="text-gray-500 hidden sm:block" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-11 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="text-sm font-semibold text-gray-200">{user?.fullName}</p>
                <p className="text-xs text-gray-500 font-mono">{user?.username}</p>
                {roleCfg && (
                  <Badge className={`mt-1.5 text-xs border ${roleCfg.bg} ${roleCfg.color}`}>{roleCfg.label}</Badge>
                )}
              </div>
              <div className="p-1">
                <button
                  onClick={() => { logout(); setUserOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
