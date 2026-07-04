'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Returns undefined while loading, null when signed out, or the session object when signed in.
export function useSession() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  return session;
}
