import { useEffect, useMemo, useState } from 'react';
import AppHeader from '../components/AppHeader';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

type User = { id: string; email: string; firstName?: string; lastName?: string; isActive: boolean; createdAt: string };

export default function AdminUsers() {
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', password: '', roles: 'user' });

  async function load() {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`);
    if (res.status === 403) {
      setItems([]);
      setTotal(0);
      return;
    }
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
  }

  useEffect(() => { load(); }, [q, page, pageSize]);

  async function createUser() {
    const body = { ...form, roles: form.roles.split(',').map(r => r.trim()).filter(Boolean) };
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setOpen(false); setForm({ email: '', firstName: '', lastName: '', password: '', roles: 'user' }); load(); }
  }

  async function toggleActive(user: User) {
    await fetch(`/api/admin/users/${user.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }) });
    load();
  }

  async function removeUser(user: User) {
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    load();
  }

  async function resetPassword(user: User) {
    await fetch(`/api/admin/users/${user.id}/reset`, { method: 'POST' });
    alert('If SMTP is configured, a reset email was sent; otherwise the link was logged on server.');
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Users</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="roles">Roles (comma separated)</Label>
                  <Input id="roles" value={form.roles} onChange={e => setForm({ ...form, roles: e.target.value })} />
                </div>
                <Button onClick={createUser}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mb-4">
          <Input placeholder="Search email..." value={q} onChange={e => { setPage(1); setQ(e.target.value); }} />
        </div>
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-2 font-semibold">Email</th>
                <th className="text-left p-2 font-semibold">Name</th>
                <th className="text-left p-2 font-semibold">Active</th>
                <th className="text-left p-2 font-semibold">Created</th>
                <th className="text-left p-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{`${u.firstName || ''} ${u.lastName || ''}`.trim()}</td>
                  <td className="p-2">{u.isActive ? 'Yes' : 'No'}</td>
                  <td className="p-2">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</Button>
                      <Button size="sm" variant="destructive" onClick={() => removeUser(u)}>Delete</Button>
                      <Button size="sm" onClick={() => resetPassword(u)}>Reset</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • {total} total</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={() => setPage(page-1)} className="px-2 py-1 border rounded">Prev</button>
            <button disabled={page>=Math.max(1, Math.ceil(total / pageSize))} onClick={() => setPage(page+1)} className="px-2 py-1 border rounded">Next</button>
            <select value={pageSize} onChange={e => setPageSize(parseInt(e.target.value,10))} className="border rounded p-1">
              {[10,20,50].map(s => <option key={s} value={s}>{s}/page</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
