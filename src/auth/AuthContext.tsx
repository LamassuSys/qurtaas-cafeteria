import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { AppUser } from "./roles";
import { DEFAULT_USERS, DEFAULT_PASSWORDS } from "./roles";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  user:        AppUser | null;
  initialized: boolean;          // true once the first load from Supabase is done
  login:       (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout:      () => void;
  users:       AppUser[];
  passwords:   Record<string, string>;
  addUser:     (u: Omit<AppUser, "id" | "createdAt"> & { password: string }) => Promise<void>;
  updateUser:  (id: string, patch: Partial<AppUser> & { password?: string }) => Promise<void>;
  deleteUser:  (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "ink_session";

// ── Mapping helpers ────────────────────────────────────────────
function rowToUser(row: Record<string, unknown>): AppUser {
  return {
    id:        row.id        as string,
    username:  row.username  as string,
    fullName:  row.full_name as string,
    role:      row.role      as AppUser["role"],
    active:    row.active    as boolean,
    createdAt: (row.created_at as string | null)?.split("T")[0] ?? "",
    lastLogin: (row.last_login as string | undefined) ?? undefined,
  };
}

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [users,       setUsers]       = useState<AppUser[]>([]);
  const [passwords,   setPasswords]   = useState<Record<string, string>>({});
  const [user,        setUser]        = useState<AppUser | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); }
    catch { return null; }
  });

  // ── Initial load ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [{ data: userRows }, { data: passRows }] = await Promise.all([
          supabase.from("app_users").select("*").order("created_at"),
          supabase.from("app_passwords").select("*"),
        ]);

        if (userRows && userRows.length > 0) {
          setUsers(userRows.map(rowToUser));
          const map: Record<string, string> = {};
          (passRows ?? []).forEach((p: Record<string, unknown>) => {
            map[p.username as string] = p.password as string;
          });
          setPasswords(map);
        } else {
          // Supabase not yet seeded or unreachable – fall back to defaults
          setUsers(DEFAULT_USERS);
          setPasswords(DEFAULT_PASSWORDS);
        }
      } catch {
        setUsers(DEFAULT_USERS);
        setPasswords(DEFAULT_PASSWORDS);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  // ── Auth actions ────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    const found = users.find(u => u.username === username && u.active);
    if (!found)                         return { ok: false, error: "User not found or inactive." };
    if (passwords[username] !== password) return { ok: false, error: "Incorrect password." };

    const updated = { ...found, lastLogin: new Date().toISOString() };
    // Persist last-login time (best-effort)
    supabase.from("app_users")
      .update({ last_login: updated.lastLogin })
      .eq("username", username)
      .then(() => {});

    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // ── User CRUD (Supabase-backed) ──────────────────────────────
  const addUser = async ({ password, ...data }: Omit<AppUser, "id" | "createdAt"> & { password: string }) => {
    const { data: row, error } = await supabase.from("app_users").insert({
      username:  data.username,
      full_name: data.fullName,
      role:      data.role,
      active:    data.active,
    }).select().single();

    if (error || !row) {
      console.error("addUser failed:", error);
      return;
    }

    await supabase.from("app_passwords").insert({ username: data.username, password });
    setUsers(prev  => [...prev, rowToUser(row as Record<string, unknown>)]);
    setPasswords(prev => ({ ...prev, [data.username]: password }));
  };

  const updateUser = async (id: string, { password, ...patch }: Partial<AppUser> & { password?: string }) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.fullName !== undefined) dbPatch.full_name = patch.fullName;
    if (patch.role     !== undefined) dbPatch.role      = patch.role;
    if (patch.active   !== undefined) dbPatch.active    = patch.active;
    if (patch.username !== undefined) dbPatch.username  = patch.username;

    if (Object.keys(dbPatch).length > 0) {
      await supabase.from("app_users").update(dbPatch).eq("id", id);
    }

    const target = users.find(u => u.id === id);
    if (password && target) {
      await supabase.from("app_passwords")
        .upsert({ username: target.username, password }, { onConflict: "username" });
      setPasswords(prev => ({ ...prev, [target.username]: password }));
    }

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  };

  const deleteUser = async (id: string) => {
    // app_passwords is deleted by CASCADE on the DB side
    await supabase.from("app_users").delete().eq("id", id);
    const target = users.find(u => u.id === id);
    if (target) setPasswords(prev => { const r = { ...prev }; delete r[target.username]; return r; });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AuthContext.Provider value={{
      user, initialized, login, logout,
      users, passwords, addUser, updateUser, deleteUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
