# EduMen (React + Vite, front-end only)

    npm install
    npm run dev      # http://localhost:5173
    npm run build    # production build in /dist

No backend: login/sign up, bookings, messages and saves live in memory and reset on refresh.
The theme choice is remembered in localStorage.

Structure: `src/Landing.jsx` (home + login/sign up), `src/Shell.jsx` (app layout: bottom nav on phones, sidebar on desktop), `src/pages/*` (Home, Sessions, Messages, Saved, Profile).

## Changes in this version
- New logo (`components/Logo.jsx`, `public/favicon.svg`): a "C" with a yellow hub dot.
- Profile rebuilt: banner, centered photo, Edit Profile (upload photo / pick avatar / name / email / headline), credits with Top Up, settings with switches. Booking now deducts credits.
- Mobile: minimal flat styling, tighter spacing, centered layout, no horizontal overflow on 320px screens, scroll lock under sheets, chat fits above the nav and auto-scrolls.
