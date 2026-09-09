# Gracious Senior Living — Complete Full-Stack Website v6.2.1

A production-ready Express, MongoDB and EJS website for Gracious Senior Living with a premium public experience, a full administration workspace, moderated reviews, managed galleries, database-driven hero sections and real-time visitor-to-admin chat powered by Socket.IO.

## v6.2.1 highlights

- Every public hero section is now database-driven and manageable from **Admin → Hero Sections** with full create, read, update, visibility and delete controls.
- The homepage hero remains a slider, while every other public page can also become a slider simply by adding more than one active hero record for that page.
- Hero administration includes background image upload or URL, headline, eyebrow, supporting text, icon, image positioning, ordering and primary/secondary CTA controls.
- Photos and videos now have separate administration workspaces at `/admin/photos` and `/admin/videos`.
- The public Photo Gallery and Video Gallery now show **Photos Gallery** / **Videos Gallery** switch buttons immediately below the hero section.
- Review submission now has an AJAX-powered confirmation experience that clearly shows the moderation/publishing flow while retaining a no-JavaScript fallback.
- A polished branded preload experience uses the Gracious Senior Living logo and automatically shortens on repeat navigation within the session.
- The Gracious logo is supplied and used as a transparent PNG across the public header, footer, admin shell, favicon, Apple touch icon and social metadata.
- Site footer copyright is: `© 2026 Gracious Senior Living | Developed by Prestige Coding & Technology Ltd. All rights reserved.`

## Public website

- Complete multi-section homepage with an accessible auto-playing hero slider
- About, Care, Living, Photo Gallery, Video Gallery, Reviews, Careers and Contact pages
- Responsive navigation, scroll animations, accordions, review carousel and back-to-top control
- Clickable photo gallery with full-screen viewer, previous/next controls, captions and keyboard navigation
- Public review submission with UX confirmation, admin moderation and newest-approved-first publishing
- Contact and tour inquiry form
- Guided seven-section employment application based on the official Gracious application
- Secure optional résumé upload with server-side file type and size validation
- Nineteen local photographs (12 current plus 7 archived grand-opening images) and two supplied videos
- Resilient default content and startup repair that preserves later administrator content
- Site-wide address: `5402 Weddington Road, Wesley Chapel NC 28110`
- Site-wide email: `info@graciouscarenc.com`

## Administration workspace

- Responsive admin shell and operational dashboard
- **Hero Sections:** full CRUD, ordering, visibility, background media and content management for all public heroes/sliders
- **Photos Gallery:** independent photo upload/URL, metadata, ordering, edit, visibility and delete controls
- **Videos Gallery:** independent video upload/URL, poster, metadata, ordering, edit, visibility and delete controls
- Real-time live-chat inbox with conversation search, online presence, typing indicators and unread counts
- Review moderation with approval/rejection controls and automatic homepage publishing
- Inquiry workflow with status management and private follow-up notes
- Secure hiring inbox with candidate search, status filters, full application review, private notes and résumé downloads
- Real-time alerts when a new inquiry, review or employment application arrives
- Guided site settings for contact information and chat visibility
- Secure sign-in with bcrypt password hashing and MongoDB-backed sessions

## Local setup

### First-time setup

```bash
cd Gracious-Senior-Living-Complete-v6.2.1
cp .env.example .env
npm install
npm run seed
npm start
```

On Windows Command Prompt, use `copy .env.example .env` instead of `cp .env.example .env`.

Open:

- Public website: `http://localhost:5000`
- Admin login: `http://localhost:5000/admin/login`
- Hero manager: `http://localhost:5000/admin/heroes`
- Photos manager: `http://localhost:5000/admin/photos`
- Videos manager: `http://localhost:5000/admin/videos`

### Normal startup after dependencies are installed

```bash
cd Gracious-Senior-Living-Complete-v6.2.1
npm start
```

### Development mode

```bash
npm run dev
```

## Environment

Install Node.js **20.19 or newer** and MongoDB. Copy `.env.example` to `.env`, then replace at minimum `SESSION_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` with secure production values before hosting.

## Validation

```bash
npm run validate
```

Individual checks:

```bash
npm run validate:ui
npm run validate:realtime
npm run validate:application
npm run validate:backend
```

## Deployment notes

- Set `NODE_ENV=production`.
- Use a strong `SESSION_SECRET` and a production MongoDB connection string.
- Use a host that supports persistent Node.js processes and WebSockets, such as a VPS, Render, Railway or Fly.io.
- GitHub Pages cannot run this Node.js backend, MongoDB workflow or Socket.IO chat.
- Local gallery/hero uploads require persistent disk storage. On stateless hosting, migrate uploads to Cloudinary or S3-compatible storage.
- Uploaded résumés are stored outside the public web directory under `storage/applications`; use persistent private storage in production.
- Admin-edited address/email settings are preserved across restarts after the one-time approved contact migration.
- Use HTTPS in production so secure cookies and WebSocket connections are protected.
"# gracious_final" 
