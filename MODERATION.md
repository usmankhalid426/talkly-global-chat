# Production moderation checklist

The backend includes block/report storage. Before a large public launch add:
- private admin authentication and report review dashboard
- temporary/permanent bans
- anti-spam and abuse limits
- audit log and appeals
- age/eligibility controls
- abuse detection with human review
- retention/deletion policies
- Redis + Socket.IO adapter for multiple instances
- TURN server for reliable WebRTC voice
