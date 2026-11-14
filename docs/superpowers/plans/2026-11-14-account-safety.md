# Account safety implementation plan

Spec: registration-identity-design.md sequential backlog stage 2; approved execution in chat.
Branch main. No database migration, credentials, deployment or master changes.

- [ ] TDD: member updates/deletion run in Serializable transactions; approved members need a nonempty member ID; removing/demoting the final admin is rejected; self-demotion rejected; conflicting updates return retryable responses.
- [ ] Apply the same approval rule to quick approval and account creation. Return helpful errors rather than a false approval.
- [ ] TDD: password reset invalidates existing JWT-backed server sessions using an internal credential fingerprint; never expose fingerprints/passwords in public sessions. Existing tokens lacking a fingerprint must sign in again once after release.
- [ ] Ensure protected page data also checks the current server session; proxy role snapshots must not permanently block newly promoted admins.
- [ ] Verify focused and full tests, lint, and report blocked build/type generation.

Ruling: self-service password change and deployment testing follow this stage; no guessed secrets or production changes.
