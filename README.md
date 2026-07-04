# FishLog — mobile web MVP

Next.js + Supabase. See the walkthrough in your Claude conversation for full setup steps. Quick version:

1. Create a Supabase project at supabase.com.
2. Run `supabase/schema.sql` in the SQL Editor.
3. Turn off "Confirm email" under Authentication → Providers → Email (for fast testing; turn back on before real launch).
4. Copy `.env.local.example` to `.env.local` and fill in your Project URL + anon key (Settings → API).
5. `npm install`
6. `npm run dev` → open http://localhost:3000
7. Deploy: push to GitHub, import into Vercel, add the same two env vars there.
