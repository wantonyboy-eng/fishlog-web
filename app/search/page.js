'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/useSession';
import BottomNav from '../../components/BottomNav';

export default function Search() {
  const session = useSession();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [myFollowing, setMyFollowing] = useState([]);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) { router.replace('/login'); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setMyProfile(data));
    supabase.from('follows').select('following_id').eq('follower_id', session.user.id).then(({ data }) => setMyFollowing((data || []).map(f => f.following_id)));
  }, [session]);

  useEffect(() => {
    const t = setTimeout(runSearch, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function runSearch() {
    if (!q.trim()) { setResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(25);
    setResults(data || []);
  }

  async function toggleFollow(target) {
    const following = myFollowing.includes(target.id);
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', target.id);
      setMyFollowing(myFollowing.filter(id => id !== target.id));
    } else {
      await supabase.from('follows').insert({ follower_id: session.user.id, following_id: target.id });
      await supabase.from('notifications').insert({ user_id: target.id, type: 'follow', from_user_id: session.user.id });
      setMyFollowing([...myFollowing, target.id]);
    }
  }

  if (!myProfile) return <div className="loading">Loading…</div>;

  return (
    <div>
      <div className="topbar"><h1>Search</h1></div>
      <div className="content-pad" style={{ paddingBottom: 0 }}>
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search anglers..."
          style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 999, padding: '12px 16px', color: 'var(--text)', outline: 'none' }} />
      </div>
      {q.trim() && results.length === 0 && <div className="empty">No anglers found.</div>}
      {results.map(u => (
        <div className="user-row" key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          {u.avatar_url ? <img className="avatar" src={u.avatar_url} alt="" /> : <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>}
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => router.push(`/profile/${u.username}`)}>
            <div className="name">{u.display_name}</div>
            <div className="meta">@{u.username}</div>
          </div>
          {u.id !== session.user.id && (
            <button className={`btn btn-sm ${myFollowing.includes(u.id) ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggleFollow(u)}>
              {myFollowing.includes(u.id) ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      ))}
      <BottomNav active="search" myUsername={myProfile.username} />
    </div>
  );
}
