'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../lib/useSession';

export default function Settings() {
  const session = useSession();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function deleteAccount() {
    if (!confirm('Delete your account and all your catches? This cannot be undone.')) return;
    // Deletes cascade via foreign keys (catches, likes, comments, follows, notifications all reference profiles.id on delete cascade).
    await supabase.from('profiles').delete().eq('id', session.user.id);
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div>
      <div className="back-row"><button className="back-btn" onClick={() => router.back()}>←</button><h3>Settings</h3></div>
      <div className="content-pad">
        <button className="btn btn-outline" onClick={() => router.push('/edit-profile')}>Edit profile</button>
        <div style={{ height: 12 }} />
        <button className="btn btn-outline" onClick={logout}>Log out</button>
        <div style={{ height: 12 }} />
        <button className="btn btn-danger" onClick={deleteAccount}>Delete account</button>
      </div>
    </div>
  );
}
