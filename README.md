# EduMen (React + Vite + Supabase)

    npm install
    npm run dev      # http://localhost:5173
    npm run build    # production build in /dist

Create a Supabase project, then add its project URL and publishable/anon key to
the local `.env` file:

    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key

For a new database, apply the SQL files in `supabase/migrations/` in timestamp
order in the Supabase SQL Editor, or initialize and link a Supabase CLI project
before running `supabase db push`. If `public.profiles` already exists, do not
rerun the initial schema; apply
`supabase/migrations/20261007010000_persist_existing_profiles.sql` to add avatar
storage, then
`supabase/migrations/20261007020000_ensure_profile_rows.sql` to repair missing
profiles and enable automatic repair on sign-in, and
`supabase/migrations/20261007030000_update_my_profile_rpc.sql` to enable
profile/avatar updates, followed by
`supabase/migrations/20261007040000_return_saved_profile_json.sql` for explicit
saved-profile verification. Configure the Supabase Auth site URL and redirect
allowlist for the local and deployed site URLs. New Auth users automatically
receive a learner profile. Expert access must be granted from a trusted
admin/server process; never trust a client-supplied role.

## Supabase database

Profiles are stored in `profiles`. The prototype's saved expert IDs, session
cards, and chat threads/messages are stored together in an owner-protected
`app_state` row and restored after sign-in. The expert catalog is still bundled
demo data.

The SQL schema also defines normalized expert, session, messaging, payment, and
credit-ledger tables. Client access to payments and credit transactions is
read-only, and session/payment/credit writes are intentionally not exposed to
the browser. The current booking and top-up UI remains a demo; implement these
flows through a trusted backend or Supabase Edge Function before accepting real
bookings or payments. Never expose the `service_role` key in the client. Prices
and credit amounts are stored as integer paise. The theme choice is remembered
in localStorage.

Structure: `src/Landing.jsx` (home + login/sign up), `src/Shell.jsx` (app layout: bottom nav on phones, sidebar on desktop), `src/pages/*` (Home, Sessions, Messages, Saved, Profile).

## Changes in this version
- New logo (`components/Logo.jsx`, `public/favicon.svg`): a "C" with a yellow hub dot.
- Profile rebuilt: banner, centered photo, Edit Profile (upload photo / pick avatar / name / email / headline), credits with Top Up, settings with switches. Booking now deducts credits.
- Mobile: minimal flat styling, tighter spacing, centered layout, no horizontal overflow on 320px screens, scroll lock under sheets, chat fits above the nav and auto-scrolls.
