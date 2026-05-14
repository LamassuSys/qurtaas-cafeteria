import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { AppUser } from "./roles";
import { DEFAULT_USERS, DEFAULT_PASSWORDS } from "./roles";

interface AuthContextValue {
  user: AppUser | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  users: AppUser[];
  passwords: Record<string, string>;
  addUser: (u: Omit<AppUser, "id" | "createdAt"> & { password: string }) => void;
  updateUser: (id: string, patch: Partial<AppUser> & { password?: string }) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "ink_users";
const PASS_KEY  = "ink_passwords";
const SESSION_KEY = "ink_session";

function loadUsers(): AppUser[] {
  try {
    const stored: AppUser[] = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
    // Merge any new default users that don't exist in storage yet
    const existingUsernames = new Set(stored.map(u => u.username));
    const merged = [...stored, ...DEFAULT_USERS.filter(u => !existingUsernames.has(u.username))];
    localStorage.setItem(USERS_KEY, JSON.stringify(merged));
    return merged;
  } catch { return DEFAULT_USERS; }
}

function loadPasswords(): Record<string, string> {
  try {
    const stored: Record<string, string> = JSON.parse(localStorage.getItem(PASS_KEY) ?? "{}");
    // Merge any new default passwords that don't exist yet
    const merged = { ...DEFAULT_PASSWORDS, ...stored };
    localStorage.setItem(PASS_KEY, JSON.stringify(merged));
    return merged;
  } catch { return DEFAULT_PASSWORDS; }
}

function saveUsers(u: AppUser[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function savePasswords(p: Record<string, string>) { localStorage.setItem(PASS_KEY, JSON.stringify(p)); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(loadUsers);
  const [passwords, setPasswords] = useState<Record<string, string>>(loadPasswords);
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });


  const login = async (username: string, password: string) => {
    const found = users.find(u => u.username === username && u.active);
    if (!found) return { ok: false, error: "User not found or inactive." };
    if (passwords[username] !== password) return { ok: false, error: "Incorrect password." };
    const updated = { ...found, lastLogin: new Date().toISOString() };
    const newUsers = users.map(u => u.id === updated.id ? updated : u);
    setUsers(newUsers);
    saveUsers(newUsers);
    setUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const addUser = ({ password, ...data }: Omit<AppUser, "id" | "createdAt"> & { password: string }) => {
    const newUser: AppUser = {
      ...data,
      id: String(Date.now()),
      createdAt: new Date().toISOString().split("T")[0],
    };
    const newUsers = [...users, newUser];
    const newPasswords = { ...passwords, [data.username]: password };
    setUsers(newUsers);
    setPasswords(newPasswords);
    saveUsers(newUsers);
    savePasswords(newPasswords);
  };

  const updateUser = (id: string, { password, ...patch }: Partial<AppUser> & { password?: string }) => {
    const newUsers = users.map(u => u.id === id ? { ...u, ...patch } : u);
    setUsers(newUsers);
    saveUsers(newUsers);
    if (password) {
      const target = users.find(u => u.id === id);
      if (target) {
        const newPasswords = { ...passwords, [target.username]: password };
        setPasswords(newPasswords);
        savePasswords(newPasswords);
      }
    }
  };

  const deleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    saveUsers(newUsers);
    if (target) {
      const { [target.username]: _, ...rest } = passwords;
      setPasswords(rest);
      savePasswords(rest);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, users, passwords, addUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
