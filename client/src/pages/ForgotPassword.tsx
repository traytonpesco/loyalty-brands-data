import { useState } from 'react';
import AppHeader from '../components/AppHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/auth/request-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    setMsg(res.ok ? 'If the email exists, a reset link was sent or logged.' : 'Request failed');
  }
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Forgot password</h1>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
        {msg && <p className="text-sm text-muted-foreground mt-4">{msg}</p>}
      </main>
    </div>
  );
}
