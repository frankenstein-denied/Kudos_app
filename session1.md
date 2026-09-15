# Kudos — Session 1 Notes

Development log for the first build session of the Kudos app, covering everything from initial Firebase wiring through @mention autocomplete.

## Project Overview

**Kudos** ("Celebrate. Share. Inspire.") is a lightweight social app for close friend groups: 24-hour text stories, one-tap reactions, 1:1 chat, friend requests, group chats ("communities"), and @mentions — built as an installable PWA with a Firebase backend. The UI scaffold (page layout, Tailwind styling, component shells) originated from a v0.app generation before this session began; this session took it from a static mock UI to a fully wired, real-time, multi-user application.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3.3 (App Router, Turbopack) |
| UI | React 19, TypeScript 5.7, Tailwind CSS 4 |
| Component primitives | @base-ui/react, class-variance-authority, tw-animate-css |
| Icons | lucide-react |
| Backend | Firebase: Authentication, Firestore, Storage |
| Analytics | @vercel/analytics |
| Deployment | Vercel |
| Package manager | pnpm (project-pinned; npm used locally once as a fallback when pnpm wasn't available) |

## Tools Used

- **Git / GitHub** — version control, pushed to `peterpaulpoloan/Kudos_app`
- **Vercel** — hosting and build pipeline (including diagnosing `pnpm` lockfile and install-script build failures)
- **Firebase Console** — Authentication providers, Firestore rules deployment
- **Python (3.12) + Pillow + scipy** — one-off local image processing: chroma-keying checkerboard artifacts out of brand assets and generating the full PWA icon set (favicon, 192/512/maskable, apple-touch-icon) from source art
- **graphify** — ran once early in the session to build a knowledge-graph report of the codebase (`graphify-out/`, not part of the shipped app)

## AI Tools Used

- **Claude Code (Claude Sonnet 5)** — pair-programmed the entire session: architecture decisions, all application code, Firestore security rules, debugging, image processing scripts, and this document.
- **v0.app** — generated the original static UI scaffold this session built on top of (visible in `app/layout.tsx`'s `generator: 'v0.app'` metadata).

## Session Time

Based on git commit history (first commit → most recent commit):

- **First commit:** 2026-09-15, 19:58
- **Latest commit (this doc):** 2026-09-16, ~00:45+
- **Span:** roughly **5–6 hours**

Some setup work (the graphify pipeline run, initial Firebase project wiring, landing page draft) happened before `git init`, so actual session start was somewhat earlier than the first commit timestamp — the range above is a lower bound from available evidence, not a stopwatch figure.

## Total Token Usage

Not precisely available — this session doesn't expose a cumulative token counter I can report accurately, so no number is given here rather than an invented one. Qualitatively: this was a long, single continuous session (27 commits, ~20 feature/fix rounds) with substantial back-and-forth debugging (auth redirect issues, service worker caching, Firestore rules).

## Core Features Built

**Auth & accounts**
- Firebase Auth: Google (popup in installed PWAs, redirect elsewhere) + email/password
- Persistent sessions (IndexedDB → localStorage → sessionStorage fallback)
- In-app-browser detection with a warning (Google blocks OAuth in embedded WebViews)
- Editable profile: name, bio, and a unique `@username` handle with live availability checking
- Account deletion that actually cleans up Firestore data, not just the Auth record

**Stories**
- 24-hour-style text posts with categories, emoji, and reactions
- Threaded replies, each up to 500 characters
- `@mentions` with live autocomplete (friends-first, then prefix search) and clickable rendering

**Social graph**
- Friend requests (send/accept/decline), search by unique ID or `@username`
- Public/friends-only profile visibility, enforced on the profile page
- Live "who's online in your circle" style unread badges in the sidebar

**Messaging**
- Real-time 1:1 chat with unread-message auto-scroll and a "N new messages" catch-up pill
- **Communities**: group chats where any member can add or remove any other member, with live member search

**Notifications**
- In-app notification feed (messages, mentions, replies) with per-category preferences
- Browser `Notification` API integration for backgrounded-tab alerts

**Platform**
- Installable PWA (manifest, service worker, full icon set)
- Light / dark / system theme
- Fully responsive, mobile-first layout
