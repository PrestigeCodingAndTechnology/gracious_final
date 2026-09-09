import express from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import Review from '../models/Review.js';
import Inquiry from '../models/Inquiry.js';
import Media from '../models/Media.js';
import Setting from '../models/Setting.js';
import HeroSlide from '../models/HeroSlide.js';
import JobApplication from '../models/JobApplication.js';
import { DEFAULT_SETTINGS } from '../utils/defaultContent.js';
import { HERO_BREADCRUMBS } from '../utils/defaultHeroes.js';
import { PUBLIC_REVIEW_SORT, reviewPayload, validateReviewPayload } from '../utils/reviews.js';
import { inquiryPayload, validateInquiryPayload } from '../utils/inquiries.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const applicationDir = path.join(__dirname, '..', 'storage', 'applications');
await fs.mkdir(applicationDir, { recursive: true });

const allowedApplicationFiles = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx']
]);
const applicationUpload = multer({
  storage: multer.diskStorage({
    destination: (_, __, callback) => callback(null, applicationDir),
    filename: (_, file, callback) => callback(null, `${crypto.randomUUID()}${allowedApplicationFiles.get(file.mimetype) || ''}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_, file, callback) => {
    if (!allowedApplicationFiles.has(file.mimetype)) return callback(new Error('Upload a PDF, DOC or DOCX résumé.'));
    callback(null, true);
  }
});
const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many applications were submitted from this connection. Please try again later.'
});
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 6,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    const message = 'Too many reviews were submitted from this connection. Please try again later.';
    if (req.get('accept')?.includes('application/json')) return res.status(429).json({ ok: false, message });
    req.session.error = message;
    return res.redirect('/reviews#review-form');
  }
});
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    req.session.error = 'Too many inquiries were submitted from this connection. Please try again later.';
    res.redirect('/contact');
  }
});

async function commonData() {
  const settings = await Setting.find();
  const populated = settings
    .filter(item => item.key in DEFAULT_SETTINGS && String(item.value || '').trim())
    .map(item => [item.key, item.value]);
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(populated) };
}

async function activeMedia(type) {
  const media = await Media.find({ type, active: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  if (type !== 'image') return media;
  const isLegacy = item => String(item.url || '').startsWith('/media/gallery/legacy/');
  return [...media.filter(item => !isLegacy(item)), ...media.filter(isLegacy)];
}

const cleanText = (value, max = 500) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .trim()
  .slice(0, max);
const cleanChoice = (value, allowed, fallback = '') => allowed.includes(value) ? value : fallback;
const toRows = value => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

function applicationPayload(body, file) {
  const education = toRows(body.education).slice(0, 4).map((item = {}) => ({
    level: cleanText(item.level, 40),
    school: cleanText(item.school, 160),
    cityState: cleanText(item.cityState, 120),
    from: cleanText(item.from, 30),
    to: cleanText(item.to, 30),
    graduated: cleanChoice(item.graduated, ['', 'yes', 'no']),
    credential: cleanText(item.credential, 120)
  }));
  const employmentHistory = toRows(body.employmentHistory).slice(0, 2).map((item = {}) => ({
    employer: cleanText(item.employer, 160),
    email: cleanText(item.email, 160).toLowerCase(),
    phone: cleanText(item.phone, 40),
    address: cleanText(item.address, 200),
    city: cleanText(item.city, 80),
    state: cleanText(item.state, 50),
    zip: cleanText(item.zip, 20),
    startingPay: cleanText(item.startingPay, 40),
    startingPayType: cleanChoice(item.startingPayType, ['', 'hourly', 'salary']),
    endingPay: cleanText(item.endingPay, 40),
    endingPayType: cleanChoice(item.endingPayType, ['', 'hourly', 'salary']),
    jobTitle: cleanText(item.jobTitle, 120),
    responsibilities: cleanText(item.responsibilities, 1200),
    startDate: cleanText(item.startDate, 30),
    endDate: cleanText(item.endDate, 30),
    reasonForLeaving: cleanText(item.reasonForLeaving, 500)
  }));
  const references = toRows(body.references).slice(0, 2).map((item = {}) => ({
    name: cleanText(item.name, 120),
    relationship: cleanText(item.relationship, 80),
    company: cleanText(item.company, 140),
    title: cleanText(item.title, 100),
    email: cleanText(item.email, 160).toLowerCase(),
    phone: cleanText(item.phone, 40)
  }));

  return {
    fullName: cleanText(body.fullName, 140),
    address: cleanText(body.address, 200),
    city: cleanText(body.city, 80),
    state: cleanText(body.state, 50),
    zip: cleanText(body.zip, 20),
    email: cleanText(body.email, 160).toLowerCase(),
    phone: cleanText(body.phone, 40),
    dateAvailable: cleanText(body.dateAvailable, 30),
    desiredPay: cleanText(body.desiredPay, 40),
    desiredPayType: cleanChoice(body.desiredPayType, ['', 'hourly', 'salary']),
    position: cleanText(body.position, 120),
    employmentType: cleanChoice(body.employmentType, ['full-time', 'part-time', 'seasonal']),
    usCitizen: cleanChoice(body.usCitizen, ['yes', 'no']),
    allowedToWork: cleanChoice(body.allowedToWork, ['', 'yes', 'no']),
    previouslyWorked: cleanChoice(body.previouslyWorked, ['yes', 'no']),
    priorEmploymentDates: cleanText(body.priorEmploymentDates, 160),
    felonyConviction: cleanChoice(body.felonyConviction, ['yes', 'no']),
    felonyExplanation: cleanText(body.felonyExplanation, 1200),
    education,
    employmentHistory,
    references,
    veteran: cleanChoice(body.veteran, ['yes', 'no']),
    militaryBranch: cleanText(body.militaryBranch, 100),
    rankAtDischarge: cleanText(body.rankAtDischarge, 100),
    militaryStartDate: cleanText(body.militaryStartDate, 30),
    militaryEndDate: cleanText(body.militaryEndDate, 30),
    dischargeType: cleanText(body.dischargeType, 100),
    dischargeExplanation: cleanText(body.dischargeExplanation, 1000),
    backgroundCheckConsent: cleanChoice(body.backgroundCheckConsent, ['yes', 'no']),
    certificationAccepted: body.certificationAccepted === 'on',
    signature: cleanText(body.signature, 140),
    signatureDate: cleanText(body.signatureDate, 30),
    resumePath: file?.filename || '',
    resumeOriginalName: cleanText(file?.originalname, 240),
    resumeMimeType: cleanText(file?.mimetype, 120)
  };
}

function validateApplication(payload) {
  const errors = [];
  const required = [
    ['fullName', 'Enter your full name.'], ['address', 'Enter your current address.'],
    ['city', 'Enter your city.'], ['state', 'Enter your state.'], ['zip', 'Enter your ZIP code.'],
    ['email', 'Enter your email address.'], ['phone', 'Enter your phone number.'],
    ['dateAvailable', 'Select the date you are available to start.'], ['position', 'Enter the position you are applying for.'],
    ['employmentType', 'Choose the type of employment you want.'], ['usCitizen', 'Answer the U.S. citizenship question.'],
    ['previouslyWorked', 'Tell us whether you have worked for Gracious before.'],
    ['felonyConviction', 'Answer the conviction question.'], ['veteran', 'Answer the veteran question.'],
    ['backgroundCheckConsent', 'Answer the background-check consent question.'],
    ['signature', 'Type your legal name as your signature.'], ['signatureDate', 'Enter the certification date.']
  ];
  for (const [field, message] of required) if (!payload[field]) errors.push({ field, message });
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push({ field: 'email', message: 'Enter a valid email address.' });
  if (payload.usCitizen === 'no' && !payload.allowedToWork) errors.push({ field: 'allowedToWork', message: 'Confirm whether you are authorized to work in the United States.' });
  if (payload.previouslyWorked === 'yes' && !payload.priorEmploymentDates) errors.push({ field: 'priorEmploymentDates', message: 'Enter your previous Gracious employment dates.' });
  if (payload.felonyConviction === 'yes' && !payload.felonyExplanation) errors.push({ field: 'felonyExplanation', message: 'Provide the requested explanation.' });
  if (payload.veteran === 'yes' && !payload.militaryBranch) errors.push({ field: 'militaryBranch', message: 'Enter your branch of service.' });
  if (!payload.references.some(item => item.name && (item.email || item.phone))) errors.push({ field: 'references', message: 'Provide at least one professional reference with an email or phone number.' });
  if (!payload.certificationAccepted) errors.push({ field: 'certificationAccepted', message: 'Accept the applicant certification before submitting.' });
  return errors;
}

function handleApplicationUpload(req, res, next) {
  applicationUpload.single('resume')(req, res, error => {
    if (!error) return next();
    req.applicationUploadError = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      ? 'Your résumé must be 5 MB or smaller.'
      : error.message;
    next();
  });
}

const HERO_ROUTE_MAP = Object.freeze({
  '/': 'home',
  '/about': 'about',
  '/care': 'care',
  '/living': 'living',
  '/gallery': 'gallery',
  '/video-gallery': 'video-gallery',
  '/reviews': 'reviews',
  '/contact': 'contact',
  '/apply': 'application',
  '/join-our-team': 'application'
});

router.use(async (req, res, next) => {
  try {
    const page = HERO_ROUTE_MAP[req.path];
    if (!page) return next();
    res.locals.heroPage = page;
    res.locals.heroBreadcrumbs = HERO_BREADCRUMBS[page] || [];
    res.locals.heroes = await HeroSlide.find({ page, active: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    return next();
  } catch (error) { return next(error); }
});

router.get('/', async (req, res, next) => { try {
  const [reviews, settings] = await Promise.all([
    Review.find({ status: 'approved' }).sort(PUBLIC_REVIEW_SORT),
    commonData()
  ]);
  res.render('public/home', { title: 'Gracious Senior Living', reviews, settings });
} catch (error) { next(error); } });

router.get('/about', async (req, res, next) => { try { res.render('public/about', { title: 'About Us', settings: await commonData() }); } catch (error) { next(error); } });
router.get('/care', async (req, res, next) => { try { res.render('public/care', { title: 'Our Care', settings: await commonData() }); } catch (error) { next(error); } });
router.get('/living', async (req, res, next) => { try { res.render('public/living', { title: 'Senior Living', settings: await commonData() }); } catch (error) { next(error); } });
router.get('/gallery', async (req, res, next) => { try { res.render('public/gallery', { title: 'Gallery', settings: await commonData(), media: await activeMedia('image') }); } catch (error) { next(error); } });
router.get('/video-gallery', async (req, res, next) => { try { res.render('public/video-gallery', { title: 'Video Gallery', settings: await commonData(), media: await activeMedia('video') }); } catch (error) { next(error); } });

router.get(['/apply', '/join-our-team'], async (req, res, next) => { try {
  res.render('public/application', {
    title: 'Join Our Team', settings: await commonData(), form: {}, validationErrors: [], submitted: cleanText(req.query.submitted, 40)
  });
} catch (error) { next(error); } });

router.post('/apply', applicationLimiter, handleApplicationUpload, async (req, res, next) => {
  const settings = await commonData().catch(() => DEFAULT_SETTINGS);
  try {
    const submittedForm = req.body || {};
    if (submittedForm.website) {
      if (req.file) await fs.unlink(path.join(applicationDir, req.file.filename)).catch(() => {});
      return res.redirect('/apply?submitted=received');
    }
    const payload = applicationPayload(submittedForm, req.file);
    const validationErrors = validateApplication(payload);
    if (req.applicationUploadError) validationErrors.push({ field: 'resume', message: req.applicationUploadError });
    if (validationErrors.length) {
      if (req.file) await fs.unlink(path.join(applicationDir, req.file.filename)).catch(() => {});
      return res.status(422).render('public/application', {
        title: 'Join Our Team', settings, form: submittedForm, validationErrors, submitted: ''
      });
    }
    const date = new Date();
    const stamp = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('');
    const applicationNumber = `GSL-${stamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await JobApplication.create({ applicationNumber, ...payload });
    req.app.get('io')?.to('admins').emit('admin:application-received', {
      applicationNumber, fullName: payload.fullName, position: payload.position, createdAt: date.toISOString()
    });
    return res.redirect(`/apply?submitted=${encodeURIComponent(applicationNumber)}#application-form`);
  } catch (error) {
    if (req.file) await fs.unlink(path.join(applicationDir, req.file.filename)).catch(() => {});
    next(error);
  }
});

router.get('/reviews', async (req, res, next) => { try {
  res.render('public/reviews', { title: 'Reviews', settings: await commonData(), reviews: await Review.find({ status: 'approved' }).sort(PUBLIC_REVIEW_SORT) });
} catch (error) { next(error); } });
router.post('/reviews', reviewLimiter, async (req, res, next) => { try {
  const wantsJson = req.get('accept')?.includes('application/json');
  const payload = reviewPayload(req.body);
  const errors = validateReviewPayload(payload);
  if (errors.length) {
    if (wantsJson) return res.status(422).json({ ok: false, message: errors[0] });
    req.session.error = errors[0];
    return res.redirect('/reviews#review-form');
  }
  await Review.create(payload);
  const message = 'Thank you for sharing your experience. Your review was received and is now awaiting administrator approval.';
  req.app.get('io')?.to('admins').emit('admin:review-received', { name: payload.name, rating: payload.rating });
  if (wantsJson) return res.status(201).json({ ok: true, message, name: payload.name, rating: payload.rating });
  req.session.success = message;
  return res.redirect('/reviews?submitted=review#review-feedback');
} catch (error) { next(error); } });

router.get('/contact', async (req, res, next) => { try { res.render('public/contact', { title: 'Contact Us', settings: await commonData() }); } catch (error) { next(error); } });
router.post('/contact', inquiryLimiter, async (req, res, next) => { try {
  if (req.body.website) return res.redirect('/contact');
  const payload = inquiryPayload(req.body);
  const errors = validateInquiryPayload(payload);
  if (errors.length) {
    req.session.error = errors[0];
    return res.redirect('/contact');
  }
  await Inquiry.create(payload);
  req.session.success = 'Your message has been received. Our team will contact you soon.';
  req.app.get('io')?.to('admins').emit('admin:inquiry-received', { name: [payload.firstName, payload.lastName].filter(Boolean).join(' '), interest: payload.interest });
  return res.redirect('/contact');
} catch (error) { next(error); } });

export default router;
