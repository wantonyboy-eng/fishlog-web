'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function handleLogin() {
    setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr(error.message); return; }
    router.push('/feed');
  }

  return (
    <div>
      <div className="hero">
        <div className="brand">🎣 Fish<span style={{ color: 'var(--accent)' }}>Log</span></div>
        <div className="tag">Sign in to your fishing journal.</div>
      </div>
      <div className="content-pad">
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {err && <div className="err">{err}</div>}
        <button className="btn btn-primary" onClick={handleLogin}>Sign in</button>
        <div className="auth-switch">New here? <button className="link-btn" onClick={() => router.push('/signup')}>Create account</button></div>
      </div>
    </div>
  );
}
