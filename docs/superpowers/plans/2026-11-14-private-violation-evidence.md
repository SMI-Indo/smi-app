# Private violation evidence implementation plan

Main only. Preserve the existing SMI palette and administrative functions. User confirmed only administrators may access evidence.

- [ ] Add tested image validation: PNG/JPEG/WebP content signatures, at most 3 images, 1 MiB each. Reject SVG and invalid content regardless of filename.
- [ ] Implement server-only Supabase Storage access using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, private bucket violation-evidence. Do not expose service credentials or public URLs.
- [ ] Add evidence metadata relation and additive SQL migration. No migration is executed without working preview access.
- [ ] Accept multipart uploads while preserving JSON clients; create evidence metadata together with violation/points; clean uploaded objects on transaction failure.
- [ ] Add an admin-authenticated evidence download route that checks violation/evidence association and sends private/no-store headers.
- [ ] Improve phone form: gallery/camera input, preview/removal, file limits, pending/error states; keep form values on failure. Add mobile history layout.
- [ ] Run tests, lint and Hallmark sweep; explicitly record that database/storage integration remains unverified if credentials/network are absent.
