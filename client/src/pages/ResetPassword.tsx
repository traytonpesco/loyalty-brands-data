import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const userId = params.get('uid') || '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, userId, password }) });
    if (res.ok) {
      setMsg('Password updated. Redirecting to login...');
      setTimeout(() => navigate('/'), 1200);
    } else {
      setMsg('Reset failed. Link may be invalid or expired.');
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Reset password</h1>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Update password</Button>
        </form>
        {msg && <p className="text-sm text-muted-foreground mt-4">{msg}</p>}
      </main>
    </div>
  );
}
