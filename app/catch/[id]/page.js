'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useSession } from '../../../lib/useSession';
import { timeAgo, fmtDate, stars } from '../../../lib/constants';

export default function CatchDetail() {
  const session = useSession();
  const router = useRouter();
  const { id } = useParams();

  const [c, setC] = useState(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) { router.replace('/login'); return; }
    load();
  }, [session, id]);

  async function load() {
    const { data } = await supabase.from('catches').select('*, profiles(username, display_name, avatar_url)').eq('id', id).single();
    setC(data);
    const { data: likeRows } = await supabase.from('likes').select('user_id').eq('catch_id', id);
    setLikes((likeRows || []).map(l => l.user_id));
    const { data: commentRows } = await supabase.from('comments').select('*, profiles(username, display_name)').eq('catch_id', id).order('created_at', { ascending: true });
    setComments(commentRows || []);
  }

  async function toggleLike() {
    const liked = likes.includes(session.user.id);
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', session.user.id).eq('catch_id', id);
    } else {
      await supabase.from('likes').insert({ user_id: session.user.id, catch_id: id });
      if (c.owner_id !== session.user.id) {
        await supabase.from('notifications').insert({ user_id: c.owner_id, type: 'like', from_user_id: session.user.id, catch_id: id });
      }
    }
    load();
  }

  async function postComment() {
    const text = commentText.trim();
    if (!text) return;
    await supabase.from('comments').insert({ catch_id: id, user_id: session.user.id, text });
    if (c.owner_id !== session.user.id) {
      await supabase.from('notifications').insert({ user_id: c.owner_id, type: 'comment', from_user_id: session.user.id, catch_id: id, comment_text: text });
    }
    setCommentText('');
    load();
  }

  async function handleDelete() {
    if (!confirm('Delete this catch? This cannot be undone.')) return;
    await supabase.from('catches').delete().eq('id', id);
    router.push(`/profile/${session.user.id === c.owner_id ? c.profiles.username : ''}`);
  }

  if (!c) return <div className="loading">Loading…</div>;
  const isOwner = session && c.owner_id === session.user.id;
  const liked = session && likes.includes(session.user.id);

  return (
    <div>
      <div className="back-row"><button className="back-btn" onClick={() => router.back()}>←</button><h3>Catch</h3></div>
      <img className="detail-photo" src={c.photo_url} alt={c.species} />
      <div className="detail-info">
        <div className="card-head">
          {c.profiles?.avatar_url ? <img className="avatar" src={c.profiles.avatar_url} alt="" /> : <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>}
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => router.push(`/profile/${c.profiles?.username}`)}>
            <div className="name">{c.profiles?.display_name}</div>
            <div className="meta">@{c.profiles?.username}</div>
          </div>
        </div>
        <div className="species-row"><h3>{c.species}</h3><div className="stars">{stars(c.rating)}</div></div>
        {c.caption && <div className="caption">{c.caption}</div>}
        <div className="spec-grid">
          <div className="spec-item"><div className="l">Date caught</div><div className="v">{fmtDate(c.date_caught)}</div></div>
          <div className="spec-item"><div className="l">Location</div><div className="v">{c.location || '—'}</div></div>
          <div className="spec-item"><div className="l">Weight</div><div className="v">{c.weight ? `${c.weight} lb` : '—'}</div></div>
          <div className="spec-item"><div className="l">Length</div><div className="v">{c.length ? `${c.length} in` : '—'}</div></div>
        </div>
        {c.released && <div style={{ marginTop: 12 }}><span className="released-badge">Catch &amp; release</span></div>}
        <div className="action-row" style={{ marginTop: 16 }}>
          <button className={liked ? 'liked' : ''} onClick={toggleLike}>{liked ? '❤️' : '🤍'} {likes.length} likes</button>
          <button>💬 {comments.length} comments</button>
        </div>
      </div>
      {isOwner && (
        <div className="owner-actions">
          <button className="btn btn-outline btn-sm" onClick={() => router.push(`/upload?edit=${c.id}`)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
        </div>
      )}
      <div className="section-label">Comments</div>
      {comments.length === 0 ? (
        <div className="empty" style={{ padding: '24px 20px' }}>No comments yet.</div>
      ) : comments.map(cm => (
        <div className="comment" key={cm.id}>
          <div className="name">{cm.profiles?.display_name}</div>
          <div className="txt">{cm.text}</div>
          <div className="t">{timeAgo(cm.created_at)}</div>
        </div>
      ))}
      <div className="comment-input-row">
        <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." onKeyDown={e => e.key === 'Enter' && postComment()} />
        <button className="btn btn-primary btn-sm" onClick={postComment}>Post</button>
      </div>
    </div>
  );
}
