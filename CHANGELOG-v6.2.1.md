# Gracious Senior Living v6.2.1 — Verification & Persistence Fix

- Full v6.2 feature audit completed against gallery switching, review feedback, hero CRUD, split media management, footer branding, preloader and transparent logo usage.
- Fixed Site Settings persistence so administrator changes to address/contact email/careers email are no longer overwritten on every normal restart. The approved Weddington Road / graciouscarenc.com values are applied once through a migration marker, then later admin edits persist.
- Hardened cleanup of locally uploaded hero/gallery assets so only files inside `public/uploads` are removed.
- All JavaScript source files pass Node syntax checks and the targeted static feature audit passes 29/29 checks.

## v6.2 Feature Update Summary

## Public UI

- Added a Photos Gallery / Videos Gallery switch directly below both gallery hero sections.
- Replaced hard-coded public hero markup with database-driven hero/sliders for Home, About, Care, Living, Photos Gallery, Videos Gallery, Reviews, Contact and Careers.
- Added a polished review-submission confirmation experience showing Submitted → Moderation → Published after approval, with AJAX submission and progressive fallback.
- Added a branded full-screen preload experience with first-visit/repeat-visit timing, reduced-motion compatibility and no-JavaScript fallback.
- Replaced the former black-background logo asset with one transparent high-resolution PNG throughout the public and admin interfaces.
- Updated footer copyright to: © 2026 Gracious Senior Living | Developed by Prestige Coding & Technology Ltd. All rights reserved.

## Administration

- Added `/admin/heroes` with full CRUD for hero/sliders, including page assignment, background upload/URL, background position, headline, kicker, body copy, icon, CTA buttons, sort order and visibility.
- Added independent `/admin/photos` and `/admin/videos` workspaces.
- Photo/video managers support add, preview, metadata editing, media replacement by upload or URL, ordering, hide/show and permanent deletion.
- Updated the admin sidebar and dashboard quick actions to expose Hero Sections, Photos Gallery and Videos Gallery separately.
- Moved hero editing out of generic Site Settings to prevent conflicting sources of truth.
- Administrator media deletions now remain deleted after normal application restarts once the v6.2 content bundle has been installed.

## Technical

- Added `HeroSlide` Mongoose model and v6.2 default hero seed bundle.
- Public routes query only active hero records and active media.
- Added slider behavior for non-home page heroes whenever multiple active slides exist.
- Retained the legacy `/admin/media` routes for backward compatibility, but removed them from the normal administration navigation.
