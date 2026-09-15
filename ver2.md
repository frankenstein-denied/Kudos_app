# Version 2 Notes

Changes since the initial commit (`648e012`).

## Live chat confirmed (no code change needed)

Investigated adding WebSocket-based live chat to the Chats page. The
existing implementation (`lib/firestore.ts` → `subscribeConversations` /
`subscribeMessages`, used in `app/(app)/chats/page.tsx` and
`app/(app)/chats/[conversationId]/page.tsx`) already uses Firestore's
`onSnapshot`, which holds a persistent streaming connection and pushes new
messages to every open client instantly. This already satisfies "live
chat" — no separate WebSocket server was added.

A dedicated WebSocket server (e.g. socket.io) was considered and declined:
this project is set up for Vercel (`@vercel/analytics`), and Vercel's
default Next.js hosting doesn't support a long-lived WebSocket server —
that would require a custom Node server or a managed realtime service
(Pusher/Ably) as a second backend alongside Firebase.

## Not yet implemented (available on request)

- Typing indicators — a small `typing/{uid}` doc per conversation.
- Online/last-seen presence — better suited to Firebase Realtime Database
  (`.info/connected` + `onDisconnect()`) than Firestore.
- Read receipts — a `readBy` field updated when a conversation is opened.
