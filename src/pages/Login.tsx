import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useI18n } from "@/data/i18nStore";

export function Login() {
  const { login } = useAuth();
  const { t, isRTL } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (!result.ok) setError(result.error ?? "Login failed");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <Logo size={160} />
            <div className="mt-4 text-center">
              <p className="text-gray-300 text-sm font-medium">Management System</p>
              <p className="text-gray-600 text-xs mt-0.5">{t("sign_in")}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                {t("username")}
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? t("signing_in") : t("sign_in")}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 border-t border-gray-800 pt-5">
            <p className="text-xs text-gray-600 text-center mb-3 uppercase tracking-wide font-semibold">{t("demo_creds")}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: "Super Admin",    user: "super_admin",  pass: "Admin@1234" },
                { role: "Admin",          user: "admin",        pass: "Admin@1234" },
                { role: "Cashier",        user: "cashier1",     pass: "Cashier@1234" },
                { role: "Accountant",     user: "accountant1",  pass: "Acct@1234" },
                { role: "Supply Mgr",     user: "supply1",      pass: "Supply@1234" },
                { role: "Barista",        user: "barista1",     pass: "Barista@1234" },
              ].map(c => (
                <button
                  key={c.user}
                  type="button"
                  onClick={() => { setUsername(c.user); setPassword(c.pass); }}
                  className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-2 transition-colors"
                >
                  <p className="text-xs font-semibold text-gray-300">{c.role}</p>
                  <p className="text-xs text-gray-600 font-mono">{c.user}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">
          Qurtaas Ink &amp; Drink · Management System v2.0
        </p>
      </div>
    </div>
  );
}
