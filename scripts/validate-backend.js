import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import publicRoutes from '../routes/public.js';
import chatRoutes from '../routes/chat.js';
import authRoutes from '../routes/auth.js';
import adminRoutes from '../routes/admin.js';
import Review from '../models/Review.js';
import Inquiry from '../models/Inquiry.js';
import Media from '../models/Media.js';
import HeroSlide from '../models/HeroSlide.js';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import { DEFAULT_GALLERY, DEFAULT_SETTINGS, LEGACY_GALLERY } from '../utils/defaultContent.js';
import { DEFAULT_HEROES } from '../utils/defaultHeroes.js';
import { PUBLIC_REVIEW_SORT, reviewModerationUpdate, reviewPayload, validateReviewPayload } from '../utils/reviews.js';
import { inquiryPayload, validateInquiryPayload } from '../utils/inquiries.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function routeInventory(router, prefix = '') {
  const result = new Set();
  for (const layer of router.stack) {
    if (!layer.route) continue;
    const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
    for (const routePath of paths) {
      for (const method of Object.keys(layer.route.methods)) result.add(`${method.toUpperCase()} ${prefix}${routePath}`);
    }
  }
  return result;
}

function assertRoutes(router, prefix, expected) {
  const inventory = routeInventory(router, prefix);
  for (const route of expected) assert.ok(inventory.has(route), `Missing backend route: ${route}`);
  return inventory.size;
}

let routeCount = 0;
routeCount += assertRoutes(publicRoutes, '', [
  'GET /', 'GET /about', 'GET /care', 'GET /living', 'GET /gallery', 'GET /video-gallery',
  'GET /apply', 'GET /join-our-team', 'POST /apply', 'GET /reviews', 'POST /reviews',
  'GET /contact', 'POST /contact'
]);
routeCount += assertRoutes(chatRoutes, '/api/chat', ['POST /api/chat/start', 'GET /api/chat/:id/messages']);
routeCount += assertRoutes(authRoutes, '/admin', ['GET /admin/login', 'POST /admin/login', 'POST /admin/logout']);
routeCount += assertRoutes(adminRoutes, '/admin', [
  'GET /admin/', 'GET /admin/chats', 'POST /admin/chats/:id/status', 'DELETE /admin/chats/:id',
  'GET /admin/reviews', 'POST /admin/reviews/:id/status', 'DELETE /admin/reviews/:id',
  'GET /admin/inquiries', 'POST /admin/inquiries/:id', 'DELETE /admin/inquiries/:id',
  'GET /admin/applications', 'GET /admin/applications/:id/resume', 'POST /admin/applications/:id',
  'DELETE /admin/applications/:id',
  'GET /admin/heroes', 'POST /admin/heroes', 'POST /admin/heroes/:id', 'POST /admin/heroes/:id/visibility', 'DELETE /admin/heroes/:id',
  'GET /admin/photos', 'POST /admin/photos', 'POST /admin/photos/:id', 'POST /admin/photos/:id/visibility', 'DELETE /admin/photos/:id',
  'GET /admin/videos', 'POST /admin/videos', 'POST /admin/videos/:id', 'POST /admin/videos/:id/visibility', 'DELETE /admin/videos/:id',
  'GET /admin/media', 'POST /admin/media', 'POST /admin/media/:id', 'POST /admin/media/:id/visibility', 'DELETE /admin/media/:id',
  'GET /admin/settings', 'POST /admin/settings'
]);

assert.deepEqual(PUBLIC_REVIEW_SORT, { approvedAt: -1, createdAt: -1 });
const payload = reviewPayload({ name: '  Grace\u0000 Family  ', relationship: ' Resident   family ', rating: '4', message: '  Wonderful   care.  ' });
assert.deepEqual(payload, { name: 'Grace Family', relationship: 'Resident family', rating: 4, message: 'Wonderful care.' });
assert.deepEqual(validateReviewPayload(payload), []);
assert.ok(validateReviewPayload(reviewPayload({ rating: '99' })).length >= 2, 'Invalid reviews must be rejected before reaching MongoDB.');

const submittedReview = new Review(payload);
await submittedReview.validate();
assert.equal(submittedReview.status, 'pending');
const firstApproval = new Date('2026-08-23T10:00:00.000Z');
const approved = reviewModerationUpdate(submittedReview, 'approved', firstApproval);
assert.equal(approved.status, 'approved');
assert.equal(approved.approvedAt, firstApproval);
const preserved = reviewModerationUpdate({ status: 'approved', approvedAt: firstApproval }, 'approved', new Date('2026-08-24T10:00:00.000Z'));
assert.equal(preserved.approvedAt, firstApproval, 'Saving an approved review must not move it ahead of newer approvals.');
assert.equal(reviewModerationUpdate({ status: 'approved', approvedAt: firstApproval }, 'rejected').approvedAt, null);

await new Inquiry({ firstName: 'Jordan', email: 'jordan@example.com', message: 'Please contact me about a tour.' }).validate();
const inquiry = inquiryPayload({ firstName: '  Jordan ', lastName: ' Taylor ', email: 'JORDAN@EXAMPLE.COM', phone: ' 704-555-0100 ', message: ' Please   contact me. ' });
assert.deepEqual(inquiry, { firstName: 'Jordan', lastName: 'Taylor', email: 'jordan@example.com', phone: '704-555-0100', interest: '', message: 'Please contact me.' });
assert.deepEqual(validateInquiryPayload(inquiry), []);
assert.ok(validateInquiryPayload(inquiryPayload({ firstName: '', email: 'invalid', message: '' })).length >= 3);
await new Media(DEFAULT_GALLERY[0]).validate();
await new HeroSlide(DEFAULT_HEROES[0]).validate();
assert.equal(DEFAULT_HEROES.filter(hero => hero.page === 'home').length, 3, 'Homepage should ship with three managed hero slides.');
const conversationId = new mongoose.Types.ObjectId();
await new ChatConversation({ visitorId: 'visitor-backend-check', name: 'Jordan' }).validate();
await new ChatMessage({ conversation: conversationId, sender: 'visitor', body: 'I would like more information.' }).validate();

assert.equal(DEFAULT_SETTINGS.email, 'info@graciouscarenc.com');
assert.equal(DEFAULT_SETTINGS.careersEmail, 'info@graciouscarenc.com');
assert.deepEqual(DEFAULT_GALLERY.slice(-LEGACY_GALLERY.length).map(item => item.url), LEGACY_GALLERY.map(item => item.url));

const logo = await fs.readFile(path.join(root, 'public/media/brand/gracious-logo.png'));
assert.deepEqual([...logo.subarray(0, 8)], [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 'The company logo must be a valid PNG.');
assert.ok(logo.length > 5_000, 'The transparent company logo is unexpectedly small.');

const sourceFiles = [
  'server.js', '.env.example', 'utils/defaultContent.js', 'utils/defaultHeroes.js', 'utils/ensureContent.js', 'utils/seed.js', 'models/HeroSlide.js', 'routes/public.js',
  'views/partials/head.ejs', 'views/partials/header.ejs', 'views/partials/footer.ejs',
  'views/partials/admin-head.ejs', 'views/partials/public-hero.ejs', 'views/admin/login.ejs', 'views/admin/heroes.ejs', 'views/admin/media-gallery.ejs', 'views/public/contact.ejs',
  'views/public/home.ejs', 'views/public/gallery.ejs', 'views/public/reviews.ejs',
  'views/admin/reviews.ejs', 'views/admin/media.ejs', 'public/js/site.js', 'public/js/chat.js', 'public/js/admin.js', 'public/js/admin-chat.js'
];
const sources = Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, await fs.readFile(path.join(root, file), 'utf8')])));
for (const [file, source] of Object.entries(sources)) {
  assert.doesNotMatch(source, /[A-Za-z0-9._%+-]+@graciousseniorlivingnc\.com/i, `Old email remains in ${file}`);
}
assert.match(sources['views/partials/head.ejs'], /rel="icon"[^>]+gracious-logo\.png/);
assert.match(sources['views/partials/header.ejs'], /class="brand-logo"/);
assert.match(sources['views/partials/admin-head.ejs'], /class="admin-brand-logo"/);
assert.match(sources['views/partials/admin-head.ejs'], /Hero Sections/);
assert.match(sources['views/partials/admin-head.ejs'], /Photos Gallery/);
assert.match(sources['views/partials/admin-head.ejs'], /Videos Gallery/);
assert.match(sources['views/partials/public-hero.ejs'], /data-page-hero-slider/);
assert.match(sources['views/partials/public-hero.ejs'], /slide\.imageUrl/);
assert.match(sources['views/public/home.ejs'], /action="\/reviews"|href="\/reviews#review-form"/);
assert.match(sources['views/public/gallery.ejs'], /gallery-archive-break/);
assert.match(sources['views/public/gallery.ejs'], /data-lightbox/);
assert.match(sources['views/public/gallery.ejs'], /Photos Gallery/);
assert.match(sources['views/public/gallery.ejs'], /Videos Gallery/);
assert.match(sources['views/public/reviews.ejs'], /method="post" action="\/reviews"/);
assert.match(sources['views/public/reviews.ejs'], /data-review-feedback/);
assert.match(sources['public/js/site.js'], /Accept': 'application\/json/);
assert.match(sources['routes/public.js'], /Media\.find\(\{ type, active: true \}\)/, 'Public galleries must query only visible media.');
assert.match(sources['routes/public.js'], /HeroSlide\.find\(\{ page, active: true \}\)/, 'Public heroes must render only active hero records.');
assert.doesNotMatch(sources['routes/public.js'], /media\.length[^\n]+DEFAULT_(?:GALLERY|VIDEOS)/, 'Hiding every item must render an empty public gallery instead of restoring defaults.');
assert.match(sources['views/admin/media.ejs'], /\/media\/<%=m\.id%>\/visibility/);
assert.match(sources['views/admin/media.ejs'], /Hide from website/);
assert.match(sources['views/admin/media.ejs'], /Show on website/);
assert.match(sources['views/admin/media-gallery.ejs'], /config\.route/);
assert.match(sources['views/admin/heroes.ejs'], /Save Hero Changes/);
assert.match(sources['utils/ensureContent.js'], /\$setOnInsert: \{ active:/, 'Startup repair must set visibility only when media is first created.');
assert.doesNotMatch(sources['utils/ensureContent.js'], /\$set:\s*item/, 'Startup repair must never overwrite an administrator visibility choice.');
assert.match(sources['utils/ensureContent.js'], /CONTACT_BUNDLE_KEY/, 'Contact settings need a one-time migration marker.');
assert.match(sources['utils/ensureContent.js'], /installedContactBundle/, 'Contact settings migration must run only when needed.');
assert.doesNotMatch(sources['utils/ensureContent.js'], /\['address', 'email', 'careersEmail'\]\.includes\(key\)/, 'Normal restarts must not overwrite administrator contact-setting edits.');
assert.match(sources['server.js'], /registerChatSocket\(io\)/);
assert.match(sources['server.js'], /app\.use\('\/admin', adminRoutes\)/);
assert.match(sources['public/js/admin-chat.js'], /admin:conversation-update/);
assert.match(sources['public/js/admin.js'], /admin:review-received/);
assert.match(sources['public/js/admin.js'], /admin:inquiry-received/);

console.log(`Backend validation passed: ${routeCount} routed endpoints, review moderation, models, settings, branding and UI-to-backend connections verified.`);
