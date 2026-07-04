'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/useSession';

export default function Home() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === undefined) return;
    router.replace(session ? '/feed' : '/login');
  }, [session]);

  return <div className="loading">Casting off…</div>;
}
