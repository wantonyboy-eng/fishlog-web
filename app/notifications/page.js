'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/useSession';
import { timeAgo } from '../../lib/constants';
import BottomNav from '../../components/BottomNav';

export default function Notifications() {
  const session = useSession();
  const router = useRouter();
  const [myProfile, setMyProfile] = useState(null);
  const [notifs, setNotifs] = useState(null);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) { router.replace('/login'); return; }
    load();
  }, [session]);

  async function load() {
    const { data: mp } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setMyProfile(mp);
    const { data } = await supabase.from('notifications').select('*, from_profile:profiles!notifications_from_user_id_fkey(username, display_name, avatar_url)').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(100);
    setNotifs(data || []);
    const unreadIds = (data || []).filter(n => !n.read).map(n => n.id);
    if (unreadIds.length) await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
  }

  function textFor(n) {
    const name = n.from_profile?.display_name || 'Someone';
    if (n.type === 'like') return <><b>{name}</b> liked your catch</>;
    if (n.type === 'comment') return <><b>{name}</b> commented: "{(n.comment_text || '').slice(0, 60)}"</>;
    if (n.type === 'follow') return <><b>{name}</b> started following you</>;
    return name;
  }

  if (!myProfile || notifs === null) return <div className="loading">Loading…</div>;

  return (
    <div>
      <div className="topbar"><h1>Notifications</h1></div>
      {notifs.length === 0 ? (
        <div className="empty"><h3>No notifications yet</h3><div>Likes, comments, and new followers show up here.</div></div>
      ) : notifs.map(n => (
        <div key={n.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'var(--accent-soft)', cursor: 'pointer' }}
          onClick={() => router.push(n.catch_id ? `/catch/${n.catch_id}` : `/profile/${n.from_profile?.username}`)}>
          {n.from_profile?.avatar_url ? <img className="avatar" src={n.from_profile.avatar_url} alt="" /> : <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>}
          <div style={{ flex: 1, fontSize: 14 }}>
            {textFor(n)}
            <div style={{ color: 'var(--text-dim)', fontSize: 11.5, marginTop: 2 }}>{timeAgo(n.created_at)}</div>
          </div>
        </div>
      ))}
      <BottomNav active="notifications" myUsername={myProfile.username} />
    </div>
  );
}
