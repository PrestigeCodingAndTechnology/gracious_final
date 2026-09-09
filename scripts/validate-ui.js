import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import ejs from 'ejs';
import { HtmlValidate } from 'html-validate';
import { parse as parseCss } from 'css-tree';
import { DEFAULT_GALLERY, DEFAULT_SETTINGS, DEFAULT_VIDEOS } from '../utils/defaultContent.js';
import { DEFAULT_HEROES, HERO_BREADCRUMBS, HERO_PAGE_LABELS } from '../utils/defaultHeroes.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const views = path.join(root, 'views');
const now = new Date();
const id = '64b64b64b64b64b64b64b64b';
const secondId = '65c65c65c65c65c65c65c65c';
const review = { id, _id: id, name: 'Family Member', relationship: 'Resident family', rating: 5, message: 'A thoughtful review used for template validation.', status: 'approved', approvedAt: now, createdAt: now };
const inquiry = { id, _id: id, firstName: 'Jordan', lastName: 'Taylor', email: 'jordan@example.com', phone: '704-555-0100', interest: 'Scheduling a personal tour', message: 'I would like to learn more about the residence.', notes: '', status: 'new', createdAt: now };
const conversation = { id, _id: id, name: 'Jordan Taylor', email: 'jordan@example.com', phone: '704-555-0100', status: 'open', lastMessage: 'Hello, I have a question.', lastMessageAt: now, createdAt: now, unreadAdmin: 1, visitorOnline: true };
const message = { id, _id: id, sender: 'visitor', body: 'Hello, I have a question.', createdAt: now };
const application = {
  id, _id: id, applicationNumber: 'GSL-20260823-A1B2C3', fullName: 'Alex Morgan',
  address: '100 Example Lane', city: 'Wesley Chapel', state: 'NC', zip: '28110',
  email: 'alex@example.com', phone: '704-555-0110', dateAvailable: '2026-09-01',
  desiredPay: '20', desiredPayType: 'hourly', position: 'Caregiver', employmentType: 'full-time',
  usCitizen: 'yes', allowedToWork: '', previouslyWorked: 'no', priorEmploymentDates: '',
  felonyConviction: 'no', felonyExplanation: '', veteran: 'no', backgroundCheckConsent: 'yes',
  education: [{ level: 'High school', school: 'Example High School', cityState: 'Charlotte, NC', from: '2010', to: '2014', graduated: 'yes', credential: 'Diploma' }],
  employmentHistory: [{ employer: 'Example Care Home', email: 'supervisor@example.com', phone: '704-555-0120', address: '1 Main Street', city: 'Charlotte', state: 'NC', zip: '28202', jobTitle: 'Care Assistant', startDate: '2022', endDate: '2026', responsibilities: 'Supported residents with daily routines.', reasonForLeaving: 'Career growth' }],
  references: [{ name: 'Taylor Jordan', relationship: 'Supervisor', company: 'Example Care Home', title: 'Director', email: 'taylor@example.com', phone: '704-555-0130' }],
  certificationAccepted: true, signature: 'Alex Morgan', signatureDate: '2026-08-23',
  resumePath: 'sample.pdf', resumeOriginalName: 'alex-morgan-resume.pdf', status: 'reviewing', adminNotes: '', createdAt: now, reviewedAt: now
};
const storedSettings = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value, label: key }));
const base = { settings: DEFAULT_SETTINGS, success: null, error: null, currentUser: { name: 'Gracious Administrator', email: 'admin@example.com', role: 'admin' }, currentPath: '/', adminUnreadChat: 1, adminNewApplications: 1, adminPendingReviews: 1, adminNewInquiries: 1 };
const htmlValidate = new HtmlValidate({ extends: ['html-validate:recommended'], rules: { 'no-inline-style': 'off', 'tel-non-breaking': 'off', 'no-trailing-whitespace': 'off', 'hidden-focusable': 'off', 'no-implicit-input-type': 'off' } });

const withHero = (locals, page) => ({ ...locals, heroPage: page, heroBreadcrumbs: HERO_BREADCRUMBS[page] || [], heroes: DEFAULT_HEROES.filter(hero => hero.page === page) });
const heroMock = { ...DEFAULT_HEROES[0], id, _id: id, active: true };

const cases = [
  ['public/home', withHero({ ...base, title: 'Gracious Senior Living', reviews: [review] }, 'home'), 'data-hero-slider'],
  ['public/about', withHero({ ...base, title: 'About Us', currentPath: '/about' }, 'about'), 'Home of ageless grace'],
  ['public/care', withHero({ ...base, title: 'Our Care', currentPath: '/care' }, 'care'), 'data-accordion'],
  ['public/living', withHero({ ...base, title: 'Senior Living', currentPath: '/living' }, 'living'), 'A day at Gracious'],
  ['public/gallery', withHero({ ...base, title: 'Gallery', currentPath: '/gallery', media: DEFAULT_GALLERY }, 'gallery'), 'Photos Gallery'],
  ['public/video-gallery', withHero({ ...base, title: 'Video Gallery', currentPath: '/video-gallery', media: DEFAULT_VIDEOS }, 'video-gallery'), 'Videos Gallery'],
  ['public/reviews', withHero({ ...base, title: 'Reviews', currentPath: '/reviews', reviews: [review] }, 'reviews'), 'data-review-form'],
  ['public/contact', withHero({ ...base, title: 'Contact Us', currentPath: '/contact' }, 'contact'), 'Request information or a tour'],
  ['public/application', withHero({ ...base, title: 'Join Our Team', currentPath: '/apply', form: {}, validationErrors: [], submitted: '' }, 'application'), 'Employment / Job Application'],
  ['public/application', withHero({ ...base, title: 'Join Our Team', currentPath: '/apply', form: {}, validationErrors: [], submitted: 'GSL-20260823-A1B2C3' }, 'application'), 'Application received'],
  ['public/404', { ...base, title: 'Page Not Found', currentPath: '/missing' }, 'Page not found'],
  ['public/500', { ...base, title: 'Server Error', currentPath: '/error' }, 'Something went wrong'],
  ['admin/dashboard', { ...base, title: 'Dashboard', currentPath: '/admin', stats: { chats: 1, unreadChat: 1, reviews: 1, inquiries: 1, applications: 1, media: 14 } }, 'Needs your attention'],
  ['admin/reviews', { ...base, title: 'Manage Reviews', currentPath: '/admin/reviews', reviews: [review] }, 'Review moderation'],
  ['admin/inquiries', { ...base, title: 'Contact Inquiries', currentPath: '/admin/inquiries', inquiries: [inquiry] }, 'Family inquiries'],
  ['admin/applications', { ...base, title: 'Job Applications', currentPath: '/admin/applications', applications: [application], selected: application, status: 'all', search: '', counts: { new: 0, reviewing: 1, interview: 0, hired: 0, 'not-selected': 0 } }, 'Hiring workflow'],
  ['admin/media', { ...base, title: 'Media Library', currentPath: '/admin/media', media: [{ ...DEFAULT_GALLERY[0], id, _id: id, active: true }, { ...DEFAULT_VIDEOS[0], id: secondId, _id: secondId, active: false }] }, 'Show on website'],
  ['admin/media-gallery', { ...base, title: 'Photos Gallery', currentPath: '/admin/photos', media: [{ ...DEFAULT_GALLERY[0], id, _id: id, active: true }], mediaType: 'image', config: { title: 'Photos Gallery', route: 'photos', singular: 'photograph', plural: 'photographs' } }, 'Photos Gallery'],
  ['admin/media-gallery', { ...base, title: 'Videos Gallery', currentPath: '/admin/videos', media: [{ ...DEFAULT_VIDEOS[0], id, _id: id, active: true }], mediaType: 'video', config: { title: 'Videos Gallery', route: 'videos', singular: 'video', plural: 'videos' } }, 'Videos Gallery'],
  ['admin/heroes', { ...base, title: 'Hero Sections', currentPath: '/admin/heroes', heroes: [heroMock], heroPages: Object.keys(HERO_PAGE_LABELS), pageLabels: HERO_PAGE_LABELS, pageFilter: 'all', counts: Object.fromEntries(Object.keys(HERO_PAGE_LABELS).map(page => [page, page === 'home' ? 1 : 0])) }, 'Add Hero Slide'],
  ['admin/settings', { ...base, title: 'Site Settings', currentPath: '/admin/settings', settings: storedSettings }, 'Save All Settings'],
  ['admin/chats', { ...base, title: 'Live Chat', currentPath: '/admin/chats', conversations: [conversation], selected: conversation, messages: [message], status: 'open' }, 'adminChatForm'],
  ['admin/login', { error: null }, 'Sign In Securely'],
  ['public/home', withHero({ ...base, title: 'Gracious Senior Living', reviews: [] }, 'home'), 'Family stories belong here'],
  ['public/gallery', withHero({ ...base, title: 'Gallery', currentPath: '/gallery', media: [] }, 'gallery'), 'Our gallery is being prepared'],
  ['public/video-gallery', withHero({ ...base, title: 'Video Gallery', currentPath: '/video-gallery', media: [] }, 'video-gallery'), 'New community videos are coming'],
  ['public/reviews', withHero({ ...base, title: 'Reviews', currentPath: '/reviews', reviews: [] }, 'reviews'), 'Be the first to share an experience'],
  ['admin/reviews', { ...base, title: 'Manage Reviews', currentPath: '/admin/reviews', reviews: [] }, 'No reviews yet'],
  ['admin/inquiries', { ...base, title: 'Contact Inquiries', currentPath: '/admin/inquiries', inquiries: [] }, 'No inquiries yet'],
  ['admin/applications', { ...base, title: 'Job Applications', currentPath: '/admin/applications', applications: [], selected: null, status: 'all', search: '', counts: { new: 0, reviewing: 0, interview: 0, hired: 0, 'not-selected': 0 } }, 'No applications found'],
  ['admin/media', { ...base, title: 'Media Library', currentPath: '/admin/media', media: [] }, 'Your media library is empty'],
  ['admin/media-gallery', { ...base, title: 'Photos Gallery', currentPath: '/admin/photos', media: [], mediaType: 'image', config: { title: 'Photos Gallery', route: 'photos', singular: 'photograph', plural: 'photographs' } }, 'No photographs yet'],
  ['admin/heroes', { ...base, title: 'Hero Sections', currentPath: '/admin/heroes', heroes: [], heroPages: Object.keys(HERO_PAGE_LABELS), pageLabels: HERO_PAGE_LABELS, pageFilter: 'all', counts: Object.fromEntries(Object.keys(HERO_PAGE_LABELS).map(page => [page, 0])) }, 'No hero slides in this section'],
  ['admin/chats', { ...base, title: 'Live Chat', currentPath: '/admin/chats', conversations: [], selected: null, messages: [], status: 'open' }, 'Your live chat inbox']
];

let rendered = 0;
const referencedAssets = new Set();
for (const [template, locals, marker] of cases) {
  const html = await ejs.renderFile(path.join(views, template + '.ejs'), locals, { async: false });
  if (!html.toLowerCase().includes('<!doctype html>')) throw new Error(template + ': missing document shell');
  if (!html.includes(marker)) throw new Error(template + ': expected marker not rendered: ' + marker);
  if (html.includes('<%')) throw new Error(template + ': unrendered EJS token found');
  for (const match of html.matchAll(/(?:src|poster|href)="(\/(?:css|js|media)\/[^"#?]+)"/g)) referencedAssets.add(match[1]);
  const report = await htmlValidate.validateString(html, template + '.html');
  if (!report.valid) {
    const details = report.results.flatMap(result => result.messages).map(message => message.ruleId + ' at ' + message.line + ':' + message.column + ' — ' + message.message).join('\n');
    throw new Error(template + ': HTML validation failed\n' + details);
  }
  rendered += 1;
}

for (const asset of referencedAssets) {
  const file = path.join(root, 'public', asset.slice(1));
  const stats = await fs.stat(file).catch(() => null);
  if (!stats?.isFile()) throw new Error(`Rendered page references a missing asset: ${asset}`);
}

for (const stylesheet of ['site.css', 'admin.css']) {
  const css = await fs.readFile(path.join(root, 'public', 'css', stylesheet), 'utf8');
  parseCss(css, { filename: stylesheet, positions: true });
}

console.log('UI validation passed: ' + rendered + ' complete pages rendered, ' + referencedAssets.size + ' local assets resolved and both stylesheets parsed successfully.');
