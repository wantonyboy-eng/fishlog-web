'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { timeAgo, fmtDate, stars } from '../lib/constants';

export default function CatchCard({ c, likeCount, commentCount, liked, myId, onLikeToggle }) {
  const router = useRouter();

  async function handleLike() {
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', myId).eq('catch_id', c.id);
    } else {
      await supabase.from('likes').insert({ user_id: myId, catch_id: c.id });
      if (c.owner_id !== myId) {
        await supabase.from('notifications').insert({ user_id: c.owner_id, type: 'like', from_user_id: myId, catch_id: c.id });
      }
    }
    onLikeToggle();
  }

  return (
    <div className="catch-card">
      <div className="card-head">
        {c.profiles?.avatar_url
          ? <img className="avatar" src={c.profiles.avatar_url} alt="" />
          : <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>}
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => router.push(`/profile/${c.profiles?.username}`)}>
          <div className="name">{c.profiles?.display_name}</div>
          <div className="meta">@{c.profiles?.username} · {timeAgo(c.created_at)}</div>
        </div>
      </div>
      <div className="photo-wrap" onClick={() => router.push(`/catch/${c.id}`)}>
        <img src={c.photo_url} alt={c.species} />
        {(c.weight || c.length) && (
          <div className="tag-ticket">
            {c.weight ? `${c.weight} lb` : ''}{c.weight && c.length ? <br /> : ''}{c.length ? `${c.length} in` : ''}
          </div>
        )}
      </div>
      <div className="species-row">
        <h3>{c.species}</h3>
        <div className="stars">{stars(c.rating)}</div>
      </div>
      {c.caption && <div className="caption">{c.caption}</div>}
      <div className="date-loc">{fmtDate(c.date_caught)}{c.location ? ` · ${c.location}` : ''}</div>
      <div className="action-row">
        <button className={liked ? 'liked' : ''} onClick={handleLike}>{liked ? '❤️' : '🤍'} {likeCount}</button>
        <button onClick={() => router.push(`/catch/${c.id}`)}>💬 {commentCount}</button>
      </div>
    </div>
  );
}
