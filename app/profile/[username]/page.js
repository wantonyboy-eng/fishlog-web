'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useSession } from '../../../lib/useSession';
import BottomNav from '../../../components/BottomNav';

export default function Profile() {
  const session = useSession();
  const router = useRouter();
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [catches, setCatches] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [iFollow, setIFollow] = useState(false);
  const [stats, setStats] = useState({ avg: '—', fav: '—', largest: null });

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) { router.replace('/login'); return; }
    load();
  }, [session, username]);

  async function load() {
    const { data: p } = await supabase.from('profiles').select('*').eq('username', username).single();
    if (!p) { setProfile(false); return; }
    setProfile(p);

    const { data: mp } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setMyProfile(mp);

    const { data: theirCatches } = await supabase.from('catches').select('*').eq('owner_id', p.id).order('created_at', { ascending: false });
    setCatches(theirCatches || []);

    const total = (theirCatches || []).length;
    if (total) {
      const avg = (theirCatches.reduce((a, c) => a + c.rating, 0) / total).toFixed(1);
      const counts = {};
      theirCatches.forEach(c => { counts[c.species] = (counts[c.species] || 0) + 1; });
      const fav = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const withWeight = theirCatches.filter(c => c.weight);
      const largest = withWeight.length ? withWeight.reduce((a, b) => (parseFloat(a.weight) > parseFloat(b.weight) ? a : b)) : null;
      setStats({ avg, fav, largest });
    }

    const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id);
    const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    const { data: myFollow } = await supabase.from('follows').select('*').eq('follower_id', session.user.id).eq('following_id', p.id).maybeSingle();
    setIFollow(!!myFollow);
  }

  async function toggleFollow() {
    if (iFollow) {
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', profile.id);
    } else {
      await supabase.from('follows').insert({ follower_id: session.user.id, following_id: profile.id });
      await supabase.from('notifications').insert({ user_id: profile.id, type: 'follow', from_user_id: session.user.id });
    }
    load();
  }

  if (profile === false) return <div className="empty"><h3>User not found</h3></div>;
  if (!profile || !myProfile) return <div className="loading">Loading…</div>;
  const isMe = profile.id === session.user.id;

  return (
    <div>
      <div className="topbar">
        <h1 style={{ fontSize: 17 }}>@{profile.username}</h1>
        {isMe && <button className="back-btn" onClick={() => router.push('/settings')}>⚙️</button>}
      </div>
      <div className="profile-head">
        {profile.avatar_url ? <img className="avatar-lg" src={profile.avatar_url} alt="" /> : <div className="avatar-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 30 }}>👤</div>}
        <div className="name">{profile.display_name}</div>
        <div className="uname">@{profile.username}{profile.home_state ? ` · ${profile.home_state}` : ''}</div>
        {profile.bio && <div className="bio">{profile.bio}</div>}
      </div>
      <div className="stat-strip">
        <div className="stat"><div className="n">{catches.length}</div><div className="l">Catches</div></div>
        <div className="stat"><div className="n">{followingCount}</div><div className="l">Following</div></div>
        <div className="stat"><div className="n">{followerCount}</div><div className="l">Followers</div></div>
      </div>
      <div className="profile-actions">
        {isMe
          ? <button className="btn btn-outline" onClick={() => router.push('/edit-profile')}>Edit profile</button>
          : <button className={`btn ${iFollow ? 'btn-outline' : 'btn-primary'}`} onClick={toggleFollow}>{iFollow ? 'Following' : 'Follow'}</button>}
      </div>
      <div className="stats-grid">
        <div className="stats-box"><div className="l">Avg rating</div><div className="v">{stats.avg} ★</div></div>
        <div className="stats-box"><div className="l">Favorite species</div><div className="v">{stats.fav}</div></div>
        <div className="stats-box"><div className="l">Largest fish</div><div className="v">{stats.largest ? `${stats.largest.weight} lb` : '—'}</div></div>
        <div className="stats-box"><div className="l">Member since</div><div className="v">{new Date(profile.join_date).getFullYear()}</div></div>
      </div>
      <div className="section-label">{isMe ? 'My catches' : 'Catches'}</div>
      {catches.length === 0 ? (
        <div className="empty"><h3>No catches logged</h3>{isMe && <div>Tap the + button to log your first one.</div>}</div>
      ) : (
        <div className="grid-catches">
          {catches.map(c => <div className="cell" key={c.id} onClick={() => router.push(`/catch/${c.id}`)}><img src={c.photo_url} alt="" /></div>)}
        </div>
      )}
      <BottomNav active="profile" myUsername={myProfile.username} />
    </div>
  );
}
