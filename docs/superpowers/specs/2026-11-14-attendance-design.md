# Automatic attendance proposal

User correction: attendance is automatic, using a dedicated form opened/closed for specific times and a special code. Do not implement manual admin-only awarding as the primary workflow.

A signed-in, approved member opens the attendance form, selects an active event and enters the event's code. The server checks the authenticated member, explicit admin open/closed state, opening/closing timestamps and code. It creates attendance, increments the member's attendance count and grants the configured coins in a single transaction. A unique (eventId,userId) database constraint guarantees one credit even with retries or simultaneous requests.

Admin controls: set the time window in WIB, coin reward, generate/rotate a cryptographically random code, and close immediately. Display event, time window and reward clearly. Store only a keyed code digest; never include the code in public event data or analytics. A code is shared with attendees through the event, not discoverable from the public form.

Use shared persistent rate limits on invalid submissions; never rely solely on process memory. Record an audit trail of rotations, manual reopening and corrections. Idempotent repeat submission returns the original attendance confirmation without awarding again. Closed, future, expired and invalid-code submissions do not alter attendance or coins. Revoked sessions fail before writing. The dedicated flow replaces unverified attendance mission claims; other mission categories need explicit eligibility rules.

Dependency: additive database tables/migration and verified preview database access. Do not deploy untested schema or alter production. Main-only implementation, followed by preview validation before any production release.
