'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/useSession';
import { SPECIES, US_STATES, compressImage } from '../../lib/constants';

export default function EditProfile() {
  const session = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarBlob, setAvatarBlob] = useState(null);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) { router.replace('/login'); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
  }, [session]);

  async function handleAvatarPick(e) {
    const file = e.target.files[0];
    if (!file) return;
    const blob = await compressImage(file, 320);
    setAvatarBlob(blob);
    setAvatarPreview(URL.createObjectURL(blob));
  }

  async function save() {
    let avatarUrl = profile.avatar_url;
    if (avatarBlob) {
      const path = `avatars/${session.user.id}.jpg`;
      await supabase.storage.from('photos').upload(path, avatarBlob, { upsert: true, contentType: 'image/jpeg' });
      avatarUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl + `?t=${Date.now()}`;
    }
    await supabase.from('profiles').update({
      display_name: profile.display_name,
      bio: profile.bio,
      favorite_species: profile.favorite_species,
      home_state: profile.home_state,
      avatar_url: avatarUrl,
    }).eq('id', session.user.id);
    router.push(`/profile/${profile.username}`);
  }

  if (!profile) return <div className="loading">Loading…</div>;

  return (
    <div>
      <div className="back-row"><button className="back-btn" onClick={() => router.back()}>←</button><h3>Edit profile</h3></div>
      <div className="content-pad">
        <label className="avatar-pick">
          {(avatarPreview || profile.avatar_url) ? <img src={avatarPreview || profile.avatar_url} alt="" /> : '📷'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarPick} />
        </label>
        <div className="field"><label>Display name</label><input type="text" value={profile.display_name} onChange={e => setProfile({ ...profile, display_name: e.target.value })} /></div>
        <div className="field"><label>Bio</label><textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></div>
        <div className="field">
          <label>Favorite species</label>
          <select value={profile.favorite_species || ''} onChange={e => setProfile({ ...profile, favorite_species: e.target.value })}>
            <option value="">Not sure yet</option>
            {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Home state</label>
          <select value={profile.home_state || ''} onChange={e => setProfile({ ...profile, home_state: e.target.value })}>
            <option value="">Select state</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={save}>Save changes</button>
      </div>
    </div>
  );
}
