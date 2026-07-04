'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/useSession';
import BottomNav from '../../components/BottomNav';
import CatchCard from '../../components/CatchCard';

export default function Feed() {
  const session = useSession();
  const router = useRouter();
  const [tab, setTab] = useState('everyone');
  const [myProfile, setMyProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [catches, setCatches] = useState(null);
  const [likesByCatch, setLikesByCatch] = useState({});
  const [commentCounts, setCommentCounts] = useState({});

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) { router.replace('/login'); return; }
    load();
  }, [session, tab]);

  async function load() {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (error || !profile) {
      setLoadError(true);
      return;
    }
    setMyProfile(profile);

    let rows = [];
    if (tab === 'everyone') {
      const { data } = await supabase.from('catches').select('*, profiles!catches_owner_id_fkey(username, display_name, avatar_url)').eq('is_public', true).order('created_at', { ascending: false }).limit(50);
      rows = data || [];
    } else {
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
      const ids = (follows || []).map(f => f.following_id);
      if (ids.length) {
        const { data } = await supabase.from('catches').select('*, profiles!catches_owner_id_fkey(username, display_name, avatar_url)').eq('is_public', true).in('owner_id', ids).order('created_at', { ascending: false }).limit(50);
        rows = data || [];
      }
    }
    setCatches(rows);

    if (rows.length) {
      const ids = rows.map(r => r.id);
      const { data: likeRows } = await supabase.from('likes').select('user_id, catch_id').in('catch_id', ids);
      const { data: commentRows } = await supabase.from('comments').select('catch_id').in('catch_id', ids);
      const lm = {};
      (likeRows || []).forEach(l => { lm[l.catch_id] = lm[l.catch_id] || []; lm[l.catch_id].push(l.user_id); });
      const cm = {};
      (commentRows || []).forEach(c => { cm[c.catch_id] = (cm[c.catch_id] || 0) + 1; });
      setLikesByCatch(lm);
      setCommentCounts(cm);
    }
  }

  if (loadError) {
    return (
      <div className="empty">
        <h3>Couldn't load your profile</h3>
        <div>This usually means your account is missing a profile row. Try finishing setup again.</div>
        <div style={{ height: 16 }} />
        <button className="btn btn-primary" onClick={() => router.push('/onboarding')}>Go to setup</button>
      </div>
    );
  }
  if (session === undefined || catches === null || !myProfile) {
    return <div className="loading">Casting off…</div>;
  }

  return (
    <div>
      <div className="topbar"><h1>🎣 FishLog</h1></div>
      <div className="tabs">
        <button className={`tab ${tab === 'everyone' ? 'active' : ''}`} onClick={() => setTab('everyone')}>Everyone</button>
        <button className={`tab ${tab === 'following' ? 'active' : ''}`} onClick={() => setTab('following')}>Following</button>
      </div>
      {catches.length === 0 ? (
        <div className="empty">
          <h3>{tab === 'everyone' ? 'No catches yet' : 'Nobody you follow has posted yet'}</h3>
          <div>{tab === 'everyone' ? 'Be the first to log a catch.' : 'Follow some anglers or check the Everyone tab.'}</div>
        </div>
      ) : (
        catches.map(c => (
          <CatchCard
            key={c.id}
            c={c}
            myId={session.user.id}
            likeCount={(likesByCatch[c.id] || []).length}
            commentCount={commentCounts[c.id] || 0}
            liked={(likesByCatch[c.id] || []).includes(session.user.id)}
            onLikeToggle={load}
          />
        ))
      )}
      <BottomNav active="feed" myUsername={myProfile.username} />
    </div>
  );
}
