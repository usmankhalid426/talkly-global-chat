TALKLY FULL-STACK GLOBAL CHAT
=============================

This package is a real full-stack MVP, not only a static mockup.

WORKING BACKEND
- One-click Quick Match server queue
- Realtime text chat with Socket.IO
- PostgreSQL storage
- JWT guest sessions
- Match and message persistence
- Block/report endpoints
- Optional AUDIO voice via WebRTC signaling
- No video
- Helmet security headers
- Rate limiting
- Responsive professional frontend
- SEO topic/language pages
- Database tables auto-created on startup

YOU MUST PROVIDE
1. A PostgreSQL database (Supabase is an easy choice).
2. A deployment account (Render is a simple Node hosting option).
3. Your own JWT_SECRET.
4. Your real domain later.

DEPLOY
1. Create a Supabase project.
2. Supabase Dashboard -> Connect -> copy the PostgreSQL connection string.
3. Create a GitHub repository and upload this entire folder.
4. In Render, create a Web Service from that repository.
5. Build command: npm install
6. Start command: npm start
7. Add environment variables:
   NODE_ENV=production
   NODE_VERSION=22
   DATABASE_URL=your Supabase PostgreSQL connection string
   JWT_SECRET=long random secret
   ALLOWED_ORIGIN=https://your-final-domain
8. Deploy.
9. Open the deployed site.
10. Open the site in two browsers/windows.
11. Click Chat to Someone in both.
12. Both browsers should be matched and can exchange messages.

VOICE
Click Voice after a match. The browser requests microphone permission. The server relays WebRTC signaling only; audio is peer-to-peer. No camera/video is requested. For production reliability, add a TURN service as well as STUN.

IMPORTANT SCALE LIMIT
The current matcher and Socket.IO presence are in memory and are intended for a strong single-instance MVP. For high traffic, add Redis + Socket.IO Redis adapter, then run multiple instances.

SAFETY
Replace placeholder Privacy and Terms pages with legally reviewed production policies before launch. Add moderation/admin review before opening the service widely.
