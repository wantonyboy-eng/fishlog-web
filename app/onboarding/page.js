'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/useSession';
import { SPECIES, US_STATES, compressImage } from '../../lib/constants';

export default function Onboarding() {
  const session = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [species, setSpecies] = useState('');
  const [homeState, setHomeState] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { router.replace('/login'); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      if (data) {
        // If the username still looks like the auto-generated stub, leave the field
        // blank so the person picks a real one; otherwise keep what they already claimed.
        setUsername(data.username?.startsWith('angler_') ? '' : (data.username || ''));
        setDisplayName(data.display_name?.startsWith('angler') ? '' : (data.display_name || ''));
        setBio(data.bio || '');
        setSpecies(data.favorite_species || '');
        setHomeState(data.home_state || '');
        setAvatarPreview(data.avatar_url || '');
      }
      setLoaded(true);
    });
  }, [session]);

  async function handleAvatarPick(e) {
    const file = e.target.files[0];
    if (!file) return;
    const blob = await compressImage(file, 320);
    setAvatarBlob(blob);
    setAvatarPreview(URL.createObjectURL(blob));
  }

  async function goToStep2() {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (!clean) { setErr('Pick a username.'); return; }
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', clean).neq('id', session.user.id).maybeSingle();
    if (existing) { setErr('That username is taken.'); return; }
    setUsername(clean);
    setErr('');
    setStep(2);
  }

  async function finish() {
    let avatarUrl = avatarPreview.startsWith('blob:') ? '' : avatarPreview;
    if (avatarBlob) {
      const path = `avatars/${session.user.id}.jpg`;
      await supabase.storage.from('photos').upload(path, avatarBlob, { upsert: true, contentType: 'image/jpeg' });
      avatarUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from('profiles').update({
      username: username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''),
      display_name: displayName || username,
      bio,
      favorite_species: species,
      home_state: homeState,
      avatar_url: avatarUrl,
      onboarded: true,
    }).eq('id', session.user.id);
    if (error) { setErr(error.message); return; }
    router.push('/upload');
  }

  if (!loaded) return <div className="loading">Loading…</div>;

  if (step === 1) {
    return (
      <div>
        <div className="content-pad">
          <h2 style={{ marginTop: 20 }}>Set up your profile</h2>
          <div style={{ height: 18 }} />
          <label className="avatar-pick">
            {avatarPreview ? <img src={avatarPreview} alt="" /> : '📷'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarPick} />
          </label>
          <div className="field">
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="jakemiller" />
          </div>
          <div className="field">
            <label>Display name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Jake Miller" />
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bass addict. Fishing every weekend." />
          </div>
          {err && <div className="err">{err}</div>}
          <button className="btn btn-primary" onClick={goToStep2}>Next</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="content-pad">
        <h2 style={{ marginTop: 20 }}>Almost there</h2>
        <div style={{ height: 8 }} />
        <div className="field">
          <label>Favorite species (optional)</label>
          <select value={species} onChange={e => setSpecies(e.target.value)}>
            <option value="">Not sure yet</option>
            {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Home state</label>
          <select value={homeState} onChange={e => setHomeState(e.target.value)}>
            <option value="">Select state</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {err && <div className="err">{err}</div>}
        <button className="btn btn-primary" onClick={finish}>Finish setup</button>
      </div>
    </div>
  );
}
