'use client';
import { useRouter } from 'next/navigation';

export default function BottomNav({ active, myUsername }) {
  const router = useRouter();
  return (
    <div className="bottom-nav">
      <button className={`nav-btn ${active === 'feed' ? 'active' : ''}`} onClick={() => router.push('/feed')}>🏠</button>
      <button className={`nav-btn ${active === 'search' ? 'active' : ''}`} onClick={() => router.push('/search')}>🔍</button>
      <button className="nav-btn plus" onClick={() => router.push('/upload')}>＋</button>
      <button className={`nav-btn ${active === 'notifications' ? 'active' : ''}`} onClick={() => router.push('/notifications')}>🔔</button>
      <button className={`nav-btn ${active === 'profile' ? 'active' : ''}`} onClick={() => router.push(`/profile/${myUsername}`)}>👤</button>
    </div>
  );
}
