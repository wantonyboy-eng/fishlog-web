'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/useSession';
import { supabase } from '../lib/supabase';

export default function Home() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { router.replace('/login'); return; }
    supabase.from('profiles').select('onboarded').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      router.replace(data?.onboarded ? '/feed' : '/onboarding');
    });
  }, [session]);

  return <div className="loading">Casting off…</div>;
}
