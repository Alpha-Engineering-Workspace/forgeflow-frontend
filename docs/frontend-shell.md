# Phase 1B — Frontend shell preview

This preview is **not an authenticated workspace**. URLs /preview, /preview/projects and /preview/issues contain no private data and use only hardcoded sample content. Do not add sensitive customer information here.

- App Router layout is a server component; AppShell, dialog and form are client components.
- QueryProvider prepares the future API cache; no API calls exist in this slice.
- React Hook Form + Zod validate a local-only example. There is no persistence yet.
- Sidebar navigates between three real preview routes; mobile navigation is dismissible.
- Shared Button/Input/Card/Dialog/Empty/Error/Loading components will be reused later.
- Plan to move AppShell to the authenticated workspace route after Auth.js and workspace permission checks exist.

See the phase instructions in chat for install commands and PR workflow.
