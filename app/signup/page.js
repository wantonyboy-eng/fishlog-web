'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function handleSignup() {
    setErr('');
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (!clean) { setErr('Pick a username.'); return; }
    if (password.length < 6) { setErr('Password must be at least 6 characters.'); return; }

    const { data: existing } = await supabase.from('profiles').select('username').eq('username', clean).maybeSingle();
    if (existing) { setErr('That username is taken.'); return; }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setErr(error.message); return; }
    if (!data.session) {
      // Email confirmation is turned on in your Supabase project.
      setErr('Check your email to confirm your account, then come back and sign in.');
      return;
    }

    const { error: profileErr } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: clean,
      display_name: clean,
    });
    if (profileErr) { setErr(profileErr.message); return; }

    router.push('/onboarding');
  }

  return (
    <div>
      <div className="back-row"><button className="back-btn" onClick={() => router.push('/login')}>←</button><h3>Create account</h3></div>
      <div className="content-pad">
        <div className="field">
          <label>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="jakemiller" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {err && <div className="err">{err}</div>}
        <button className="btn btn-primary" onClick={handleSignup}>Continue</button>
      </div>
    </div>
  );
}
