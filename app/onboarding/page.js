'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { SPECIES, US_STATES, compressImage } from '../../lib/constants';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [species, setSpecies] = useState('');
  const [homeState, setHomeState] = useState('');
  const router = useRouter();

  async function handleAvatarPick(e) {
    const file = e.target.files[0];
    if (!file) return;
    const blob = await compressImage(file, 320);
    setAvatarBlob(blob);
    setAvatarPreview(URL.createObjectURL(blob));
  }

  async function finish() {
    const { data: { user } } = await supabase.auth.getUser();
    let avatarUrl = '';
    if (avatarBlob) {
      const path = `avatars/${user.id}.jpg`;
      await supabase.storage.from('photos').upload(path, avatarBlob, { upsert: true, contentType: 'image/jpeg' });
      avatarUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
    }
    await supabase.from('profiles').update({
      display_name: displayName || user.email,
      bio,
      favorite_species: species,
      home_state: homeState,
      avatar_url: avatarUrl,
    }).eq('id', user.id);
    router.push('/upload');
  }

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
            <label>Display name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Jake Miller" />
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bass addict. Fishing every weekend." />
          </div>
          <button className="btn btn-primary" onClick={() => setStep(2)}>Next</button>
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
        <button className="btn btn-primary" onClick={finish}>Finish setup</button>
      </div>
    </div>
  );
}
