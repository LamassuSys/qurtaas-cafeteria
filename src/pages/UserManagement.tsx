import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_CONFIG, DEFAULT_USERS } from "@/auth/roles";
import type { Role, AppUser } from "@/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, X, Check, RotateCcw, Shield, Eye, EyeOff } from "lucide-react";

const ROLES: Role[] = ["super_admin", "admin", "cashier", "accountant", "supply_manager"];

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  return <Badge className={`text-xs border ${cfg.bg} ${cfg.color} font-semibold`}>{cfg.label}</Badge>;
}

interface UserFormData {
  username: string; fullName: string; role: Role; active: boolean; password: string;
}

const emptyForm = (): UserFormData => ({
  username: "", fullName: "", role: "cashier", active: true, password: ""
});

export function UserManagement() {
  const { users, passwords, addUser, updateUser, deleteUser, user: me } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm());
  const [showPass, setShowPass] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  const filtered = users.filter(u => {
    const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.fullName.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); setShowPass(false); };
  const openEdit = (u: AppUser) => {
    setForm({ username: u.username, fullName: u.fullName, role: u.role, active: u.active, password: "" });
    setEditId(u.id); setShowForm(true); setShowPass(false);
  };

  const handleSave = () => {
    if (!form.username.trim() || !form.fullName.trim()) return;
    if (editId) {
      updateUser(editId, {
        fullName: form.fullName, role: form.role, active: form.active,
        ...(form.password ? { password: form.password } : {}),
      });
    } else {
      if (!form.password) return;
      addUser({ username: form.username.trim(), fullName: form.fullName.trim(), role: form.role, active: form.active, password: form.password });
    }
    setShowForm(false); setEditId(null);
  };

  const handleReset = (id: string) => {
    const u = users.find(u => u.id === id);
    if (!u) return;
    const defaultPw = DEFAULT_USERS.find(d => d.username === u.username) ? (u.role === "cashier" ? "Cashier@1234" : u.role === "accountant" ? "Acct@1234" : u.role === "supply_manager" ? "Supply@1234" : "Admin@1234") : "Reset@1234";
    updateUser(id, { password: defaultPw });
    alert(`Password reset to: ${defaultPw}`);
  };

  const counts = { total: users.length, active: users.filter(u => u.active).length, inactive: users.filter(u => !u.active).length };

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: counts.total, color: "text-gray-200" },
          { label: "Active", value: counts.active, color: "text-emerald-400" },
          { label: "Inactive", value: counts.inactive, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 pr-8 w-44 focus:outline-none focus:border-blue-500"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"><X size={12}/></button>}
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setRoleFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roleFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>All</button>
            {ROLES.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roleFilter === r ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                {ROLE_CONFIG[r].label}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-500 text-white text-sm gap-1.5">
          <Plus size={14} /> Add User
        </Button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <Card className="bg-gray-800 border-blue-500/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Shield size={15} className="text-blue-400" />
              {editId ? "Edit User" : "Add New User"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Full Name *</label>
                <input value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
                  placeholder="e.g. Mohamed Ali"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Username *</label>
                <input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))}
                  disabled={!!editId} placeholder="e.g. cashier3"
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as Role}))}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">{editId ? "New Password (leave blank to keep)" : "Password *"}</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={e => setForm(f => ({...f, password: e.target.value}))}
                    placeholder={editId ? "Leave blank to keep current" : "Min 8 characters"}
                    className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 pr-9 focus:outline-none focus:border-blue-500" />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={13}/> : <Eye size={13}/>}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))}
                    className="w-4 h-4 accent-blue-500" />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white text-sm gap-1.5">
                <Check size={14}/> {editId ? "Save Changes" : "Create User"}
              </Button>
              <Button onClick={() => { setShowForm(false); setEditId(null); }} variant="outline" className="border-gray-600 text-gray-400 text-sm gap-1.5">
                <X size={14}/> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-left">
                  {["User", "Username", "Role", "Status", "Created", "Last Login", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-800/40 transition-colors ${!u.active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                          {u.fullName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-gray-200 font-medium">{u.fullName}</span>
                        {u.id === me?.id && <Badge className="text-xs bg-gray-700 text-gray-400">You</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${u.active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700 text-gray-500"}`}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.createdAt}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} title="Edit" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                          <Pencil size={13}/>
                        </button>
                        <button onClick={() => handleReset(u.id)} title="Reset password" className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                          <RotateCcw size={13}/>
                        </button>
                        {u.id !== me?.id && u.role !== "super_admin" && (
                          confirmDelete === u.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => { deleteUser(u.id); setConfirmDelete(null); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium">Confirm</button>
                              <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-700 transition-colors"><X size={12}/></button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(u.id)} title="Delete" className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 size={13}/>
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Matrix */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-300">Role Permissions Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase tracking-wide">Permission</th>
                  {ROLES.map(r => <th key={r} className="text-center py-2 px-3 whitespace-nowrap"><RoleBadge role={r}/></th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {[
                  { label: "Manage Users", key: "canManageUsers" },
                  { label: "Record Sales", key: "canRecordSales" },
                  { label: "View Financials", key: "canViewFinancials" },
                  { label: "Manage Inventory", key: "canManageInventory" },
                ].map(({ label, key }) => (
                  <tr key={key} className="hover:bg-gray-800/30">
                    <td className="py-2.5 px-3 text-gray-400 font-medium">{label}</td>
                    {ROLES.map(r => (
                      <td key={r} className="py-2.5 px-3 text-center">
                        {ROLE_CONFIG[r][key as keyof typeof ROLE_CONFIG[typeof r]]
                          ? <span className="text-emerald-400 font-bold">✓</span>
                          : <span className="text-gray-700">✗</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="hover:bg-gray-800/30">
                  <td className="py-2.5 px-3 text-gray-400 font-medium">Pages Accessible</td>
                  {ROLES.map(r => (
                    <td key={r} className="py-2.5 px-3 text-center text-gray-300 font-semibold">{ROLE_CONFIG[r].pages.length}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
