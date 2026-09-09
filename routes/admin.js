import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';
import Review from '../models/Review.js';
import Inquiry from '../models/Inquiry.js';
import Media from '../models/Media.js';
import Setting from '../models/Setting.js';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import JobApplication from '../models/JobApplication.js';
import HeroSlide, { HERO_PAGES } from '../models/HeroSlide.js';
import { DEFAULT_SETTINGS } from '../utils/defaultContent.js';
import { HERO_PAGE_LABELS } from '../utils/defaultHeroes.js';
import { reviewModerationUpdate } from '../utils/reviews.js';

const router = express.Router();
router.use(requireAdmin);
router.use(async (req, res, next) => {
  try {
    const [unread, newApplications, pendingReviews, newInquiries] = await Promise.all([
      ChatConversation.aggregate([{ $group: { _id: null, total: { $sum: '$unreadAdmin' } } }]),
      JobApplication.countDocuments({ status: 'new' }),
      Review.countDocuments({ status: 'pending' }),
      Inquiry.countDocuments({ status: 'new' })
    ]);
    res.locals.adminUnreadChat = unread[0]?.total || 0;
    res.locals.adminNewApplications = newApplications;
    res.locals.adminPendingReviews = pendingReviews;
    res.locals.adminNewInquiries = newInquiries;
    next();
  } catch (error) { next(error); }
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
const applicationDir = path.join(__dirname, '..', 'storage', 'applications');
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => /^(image|video)\//.test(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Upload a valid image or video file.'))
});
const heroUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, file, cb) => file.mimetype.startsWith('image/')
    ? cb(null, true)
    : cb(new Error('Hero backgrounds must be image files.'))
});

function handleMediaUpload(req, res, next) {
  upload.single('file')(req, res, error => {
    if (!error) return next();
    req.session.error = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      ? 'Media uploads must be 50 MB or smaller.'
      : error.message;
    const returnPath = req.path.startsWith('/photos') ? '/admin/photos#add-media'
      : req.path.startsWith('/videos') ? '/admin/videos#add-media'
        : '/admin/media#add-media';
    return res.redirect(returnPath);
  });
}

function handleHeroUpload(req, res, next) {
  heroUpload.single('image')(req, res, error => {
    if (!error) return next();
    req.session.error = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      ? 'Hero background images must be 15 MB or smaller.'
      : error.message;
    return res.redirect('/admin/heroes#add-hero');
  });
}

const cleanAdminText = (value, max = 500) => String(value || '').trim().slice(0, max);
const safeHeroPage = value => HERO_PAGES.includes(value) ? value : 'home';
const uploadedUrl = file => file ? `/uploads/${file.filename}` : '';
async function removeUploadedAsset(url) {
  const value = String(url || '');
  if (!value.startsWith('/uploads/')) return;
  const filename = path.basename(value.split(/[?#]/, 1)[0]);
  if (!filename) return;
  await fs.unlink(path.join(uploadDir, filename)).catch(() => {});
}
function heroPayload(body, imageUrl) {
  return {
    page: safeHeroPage(body.page),
    eyebrow: cleanAdminText(body.eyebrow, 120),
    icon: cleanAdminText(body.icon, 80),
    title: cleanAdminText(body.title, 220),
    text: cleanAdminText(body.text, 700),
    imageUrl: cleanAdminText(imageUrl, 1000),
    imageAlt: cleanAdminText(body.imageAlt, 220),
    backgroundPosition: cleanAdminText(body.backgroundPosition, 80) || 'center center',
    primaryLabel: cleanAdminText(body.primaryLabel, 80),
    primaryHref: cleanAdminText(body.primaryHref, 300),
    secondaryLabel: cleanAdminText(body.secondaryLabel, 80),
    secondaryHref: cleanAdminText(body.secondaryHref, 300),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0
  };
}

router.get('/', async (req, res, next) => { try {
  const [reviews, inquiries, applications, media, chats, unreadChat] = await Promise.all([
    Review.countDocuments({ status: 'pending' }),
    Inquiry.countDocuments({ status: 'new' }),
    JobApplication.countDocuments({ status: 'new' }),
    Media.countDocuments({ active: true }),
    ChatConversation.countDocuments({ status: 'open' }),
    ChatConversation.aggregate([{ $group: { _id: null, total: { $sum: '$unreadAdmin' } } }])
  ]);
  res.render('admin/dashboard', { title: 'Dashboard', stats: { reviews, inquiries, applications, media, chats, unreadChat: unreadChat[0]?.total || 0 } });
} catch (e) { next(e); } });

router.get('/chats', async (req, res, next) => { try {
  const status = ['open', 'closed'].includes(req.query.status) ? req.query.status : 'open';
  const conversations = await ChatConversation.find({ status }).sort({ lastMessageAt: -1, createdAt: -1 }).lean();
  const selectedId = req.query.id && mongoose.isValidObjectId(req.query.id) ? req.query.id : conversations[0]?._id?.toString();
  const selected = selectedId ? await ChatConversation.findById(selectedId).lean() : null;
  const messages = selected ? await ChatMessage.find({ conversation: selected._id }).sort({ createdAt: 1 }).limit(500).lean() : [];
  if (selected) {
    await Promise.all([
      ChatMessage.updateMany({ conversation: selected._id, sender: 'visitor', readAt: null }, { $set: { readAt: new Date() } }),
      ChatConversation.updateOne({ _id: selected._id }, { $set: { unreadAdmin: 0 } })
    ]);
  }
  res.render('admin/chats', { title: 'Live Chat', conversations, selected, messages, status });
} catch (e) { next(e); } });

router.post('/chats/:id/status', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/chats');
  const status = req.body.status === 'closed' ? 'closed' : 'open';
  await ChatConversation.findByIdAndUpdate(req.params.id, { status, closedAt: status === 'closed' ? new Date() : null });
  req.session.success = status === 'closed' ? 'Conversation closed.' : 'Conversation reopened.';
  res.redirect(`/admin/chats?status=${status}&id=${req.params.id}`);
} catch (e) { next(e); } });

router.delete('/chats/:id', async (req, res, next) => { try {
  if (mongoose.isValidObjectId(req.params.id)) {
    await Promise.all([ChatMessage.deleteMany({ conversation: req.params.id }), ChatConversation.findByIdAndDelete(req.params.id)]);
  }
  res.redirect('/admin/chats');
} catch (e) { next(e); } });

router.get('/reviews', async (req, res, next) => { try { res.render('admin/reviews', { title: 'Manage Reviews', reviews: await Review.find().sort({ createdAt: -1 }) }); } catch (e) { next(e); } });
router.post('/reviews/:id/status', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) {
    req.session.error = 'That review could not be found.';
    return res.redirect('/admin/reviews');
  }
  const review = await Review.findById(req.params.id);
  if (!review) {
    req.session.error = 'That review could not be found.';
    return res.redirect('/admin/reviews');
  }
  review.set(reviewModerationUpdate(review, req.body.status));
  await review.save();
  req.session.success = 'Review updated.';
  return res.redirect('/admin/reviews');
} catch (e) { next(e); } });
router.delete('/reviews/:id', async (req, res, next) => { try {
  if (mongoose.isValidObjectId(req.params.id)) await Review.findByIdAndDelete(req.params.id);
  res.redirect('/admin/reviews');
} catch (e) { next(e); } });

router.get('/inquiries', async (req, res, next) => { try { res.render('admin/inquiries', { title: 'Contact Inquiries', inquiries: await Inquiry.find().sort({ createdAt: -1 }) }); } catch (e) { next(e); } });
router.post('/inquiries/:id', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/inquiries');
  const status = ['new', 'contacted', 'closed'].includes(req.body.status) ? req.body.status : 'new';
  await Inquiry.findByIdAndUpdate(req.params.id, { status, notes: String(req.body.notes || '').slice(0, 2500) });
  req.session.success = 'Inquiry updated.';
  res.redirect('/admin/inquiries');
} catch (e) { next(e); } });
router.delete('/inquiries/:id', async (req, res, next) => { try {
  if (mongoose.isValidObjectId(req.params.id)) await Inquiry.findByIdAndDelete(req.params.id);
  res.redirect('/admin/inquiries');
} catch (e) { next(e); } });

router.get('/applications', async (req, res, next) => { try {
  const allowedStatuses = ['all', 'new', 'reviewing', 'interview', 'hired', 'not-selected'];
  const status = allowedStatuses.includes(req.query.status) ? req.query.status : 'all';
  const search = String(req.query.q || '').trim().slice(0, 100);
  const query = {};
  if (status !== 'all') query.status = status;
  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = ['applicationNumber', 'fullName', 'email', 'position'].map(field => ({ [field]: { $regex: safeSearch, $options: 'i' } }));
  }
  const applications = await JobApplication.find(query).sort({ createdAt: -1 }).limit(250).lean();
  const selectedId = req.query.id && mongoose.isValidObjectId(req.query.id)
    ? req.query.id
    : applications[0]?._id?.toString();
  let selected = selectedId ? await JobApplication.findById(selectedId).lean() : null;
  if (selected?.status === 'new') {
    await JobApplication.updateOne({ _id: selected._id }, { $set: { status: 'reviewing', reviewedAt: new Date() } });
    selected = { ...selected, status: 'reviewing', reviewedAt: new Date() };
    const item = applications.find(application => String(application._id) === String(selected._id));
    if (item) item.status = 'reviewing';
  }
  const counts = Object.fromEntries(await Promise.all(
    ['new', 'reviewing', 'interview', 'hired', 'not-selected'].map(async itemStatus => [itemStatus, await JobApplication.countDocuments({ status: itemStatus })])
  ));
  res.locals.adminNewApplications = counts.new;
  res.render('admin/applications', { title: 'Job Applications', applications, selected, status, search, counts });
} catch (error) { next(error); } });

router.get('/applications/:id/resume', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/applications');
  const application = await JobApplication.findById(req.params.id).lean();
  if (!application?.resumePath) {
    req.session.error = 'This application does not include a résumé.';
    return res.redirect(`/admin/applications?id=${req.params.id}`);
  }
  const safeName = path.basename(application.resumePath);
  res.download(path.join(applicationDir, safeName), application.resumeOriginalName || `resume-${application.applicationNumber}`);
} catch (error) { next(error); } });

router.post('/applications/:id', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/applications');
  const allowedStatuses = ['new', 'reviewing', 'interview', 'hired', 'not-selected'];
  const status = allowedStatuses.includes(req.body.status) ? req.body.status : 'reviewing';
  await JobApplication.findByIdAndUpdate(req.params.id, {
    status,
    adminNotes: String(req.body.adminNotes || '').trim().slice(0, 5000),
    reviewedAt: new Date()
  });
  req.session.success = 'Application updated.';
  res.redirect(`/admin/applications?status=${encodeURIComponent(req.body.returnStatus || 'all')}&id=${req.params.id}`);
} catch (error) { next(error); } });

router.delete('/applications/:id', async (req, res, next) => { try {
  if (mongoose.isValidObjectId(req.params.id)) {
    const application = await JobApplication.findById(req.params.id);
    if (application?.resumePath) await fs.unlink(path.join(applicationDir, path.basename(application.resumePath))).catch(() => {});
    await application?.deleteOne();
  }
  req.session.success = 'Application permanently deleted.';
  res.redirect('/admin/applications');
} catch (error) { next(error); } });

router.get('/heroes', async (req, res, next) => { try {
  const pageFilter = HERO_PAGES.includes(req.query.page) ? req.query.page : 'all';
  const query = pageFilter === 'all' ? {} : { page: pageFilter };
  const heroes = await HeroSlide.find(query).sort({ page: 1, sortOrder: 1, createdAt: 1 }).lean();
  const counts = Object.fromEntries(await Promise.all(HERO_PAGES.map(async page => [page, await HeroSlide.countDocuments({ page })])));
  res.render('admin/heroes', { title: 'Hero Sections', heroes, heroPages: HERO_PAGES, pageLabels: HERO_PAGE_LABELS, pageFilter, counts });
} catch (error) { next(error); } });

router.post('/heroes', handleHeroUpload, async (req, res, next) => { try {
  const imageUrl = uploadedUrl(req.file) || cleanAdminText(req.body.imageUrl, 1000);
  const payload = heroPayload(req.body, imageUrl);
  if (!payload.title || !payload.imageUrl) {
    if (req.file) await removeUploadedAsset(uploadedUrl(req.file));
    req.session.error = 'A hero title and background image are required.';
    return res.redirect('/admin/heroes#add-hero');
  }
  await HeroSlide.create({ ...payload, active: true });
  req.session.success = `${HERO_PAGE_LABELS[payload.page] || payload.page} hero slide added.`;
  return res.redirect(`/admin/heroes?page=${encodeURIComponent(payload.page)}#hero-list`);
} catch (error) { next(error); } });

router.post('/heroes/:id', handleHeroUpload, async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/heroes');
  const hero = await HeroSlide.findById(req.params.id);
  if (!hero) {
    if (req.file) await removeUploadedAsset(uploadedUrl(req.file));
    req.session.error = 'That hero slide could not be found.';
    return res.redirect('/admin/heroes');
  }
  const oldImage = hero.imageUrl;
  const imageUrl = uploadedUrl(req.file) || cleanAdminText(req.body.imageUrl, 1000) || oldImage;
  const payload = heroPayload(req.body, imageUrl);
  if (!payload.title || !payload.imageUrl) {
    if (req.file) await removeUploadedAsset(uploadedUrl(req.file));
    req.session.error = 'A hero title and background image are required.';
    return res.redirect(`/admin/heroes?page=${encodeURIComponent(hero.page)}#hero-${hero.id}`);
  }
  hero.set(payload);
  await hero.save();
  if (req.file && oldImage !== hero.imageUrl) await removeUploadedAsset(oldImage);
  req.session.success = 'Hero slide updated.';
  return res.redirect(`/admin/heroes?page=${encodeURIComponent(hero.page)}#hero-${hero.id}`);
} catch (error) { next(error); } });

router.post('/heroes/:id/visibility', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/heroes');
  if (!['true', 'false'].includes(req.body.active)) {
    req.session.error = 'Choose whether this hero slide should be shown or hidden.';
    return res.redirect('/admin/heroes');
  }
  const hero = await HeroSlide.findByIdAndUpdate(req.params.id, { active: req.body.active === 'true' }, { new: true });
  if (!hero) {
    req.session.error = 'That hero slide could not be found.';
    return res.redirect('/admin/heroes');
  }
  req.session.success = `Hero slide ${hero.active ? 'shown on' : 'hidden from'} the public website.`;
  return res.redirect(`/admin/heroes?page=${encodeURIComponent(hero.page)}#hero-${hero.id}`);
} catch (error) { next(error); } });

router.delete('/heroes/:id', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/heroes');
  const hero = await HeroSlide.findById(req.params.id);
  if (!hero) return res.redirect('/admin/heroes');
  const page = hero.page;
  const imageUrl = hero.imageUrl;
  await hero.deleteOne();
  await removeUploadedAsset(imageUrl);
  req.session.success = 'Hero slide permanently deleted.';
  return res.redirect(`/admin/heroes?page=${encodeURIComponent(page)}`);
} catch (error) { next(error); } });

const mediaAdminConfig = Object.freeze({
  image: { title: 'Photos Gallery', route: 'photos', singular: 'photograph', plural: 'photographs' },
  video: { title: 'Videos Gallery', route: 'videos', singular: 'video', plural: 'videos' }
});

async function renderMediaGallery(req, res, next, type) {
  try {
    const config = mediaAdminConfig[type];
    const media = await Media.find({ type }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    res.render('admin/media-gallery', { title: config.title, media, mediaType: type, config });
  } catch (error) { next(error); }
}

function addMediaForType(type) {
  return async (req, res, next) => { try {
    const config = mediaAdminConfig[type];
    if (req.file && (type === 'image' ? !req.file.mimetype.startsWith('image/') : !req.file.mimetype.startsWith('video/'))) {
      await removeUploadedAsset(uploadedUrl(req.file));
      req.session.error = `Upload a valid ${config.singular} file.`;
      return res.redirect(`/admin/${config.route}#add-media`);
    }
    const url = uploadedUrl(req.file) || cleanAdminText(req.body.url, 1000);
    if (!url) {
      req.session.error = `Upload a ${config.singular} or provide a direct URL.`;
      return res.redirect(`/admin/${config.route}#add-media`);
    }
    await Media.create({
      type,
      title: cleanAdminText(req.body.title, 120),
      caption: cleanAdminText(req.body.caption, 300),
      url,
      posterUrl: type === 'video' ? cleanAdminText(req.body.posterUrl, 1000) : '',
      alt: cleanAdminText(req.body.alt, 180),
      sortOrder: Number(req.body.sortOrder) || 0,
      active: true
    });
    req.session.success = `${type === 'image' ? 'Photograph' : 'Video'} added to the public gallery.`;
    return res.redirect(`/admin/${config.route}`);
  } catch (error) { next(error); } };
}

function updateMediaForType(type) {
  return async (req, res, next) => { try {
    const config = mediaAdminConfig[type];
    if (!mongoose.isValidObjectId(req.params.id)) {
      if (req.file) await removeUploadedAsset(uploadedUrl(req.file));
      return res.redirect(`/admin/${config.route}`);
    }
    if (req.file && (type === 'image' ? !req.file.mimetype.startsWith('image/') : !req.file.mimetype.startsWith('video/'))) {
      await removeUploadedAsset(uploadedUrl(req.file));
      req.session.error = `Upload a valid ${config.singular} file.`;
      return res.redirect(`/admin/${config.route}#media-${req.params.id}`);
    }
    const item = await Media.findOne({ _id: req.params.id, type });
    if (!item) {
      if (req.file) await removeUploadedAsset(uploadedUrl(req.file));
      req.session.error = `That ${config.singular} could not be found.`;
      return res.redirect(`/admin/${config.route}`);
    }
    const oldUrl = item.url;
    const replacementUrl = uploadedUrl(req.file) || cleanAdminText(req.body.url, 1000);
    if (replacementUrl) item.url = replacementUrl;
    item.title = cleanAdminText(req.body.title, 120);
    item.caption = cleanAdminText(req.body.caption, 300);
    item.alt = type === 'image' ? cleanAdminText(req.body.alt, 180) : '';
    item.sortOrder = Number(req.body.sortOrder) || 0;
    if (type === 'video') item.posterUrl = cleanAdminText(req.body.posterUrl, 1000);
    await item.save();
    if (item.url !== oldUrl) await removeUploadedAsset(oldUrl);
    req.session.success = `${type === 'image' ? 'Photograph' : 'Video'} updated.`;
    return res.redirect(`/admin/${config.route}#media-${item.id}`);
  } catch (error) {
    if (req.file) await removeUploadedAsset(uploadedUrl(req.file));
    next(error);
  } };
}

function setMediaVisibilityForType(type) {
  return async (req, res, next) => { try {
    const config = mediaAdminConfig[type];
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect(`/admin/${config.route}`);
    if (!['true', 'false'].includes(req.body.active)) {
      req.session.error = 'Choose whether this item should be shown or hidden.';
      return res.redirect(`/admin/${config.route}`);
    }
    const item = await Media.findOneAndUpdate({ _id: req.params.id, type }, { active: req.body.active === 'true' }, { new: true });
    if (!item) {
      req.session.error = `That ${config.singular} could not be found.`;
      return res.redirect(`/admin/${config.route}`);
    }
    req.session.success = `${type === 'image' ? 'Photograph' : 'Video'} ${item.active ? 'is now visible on' : 'is now hidden from'} the public website.`;
    return res.redirect(`/admin/${config.route}#media-${item.id}`);
  } catch (error) { next(error); } };
}

function deleteMediaForType(type) {
  return async (req, res, next) => { try {
    const config = mediaAdminConfig[type];
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect(`/admin/${config.route}`);
    const item = await Media.findOne({ _id: req.params.id, type });
    if (item) {
      const url = item.url;
      await item.deleteOne();
      await removeUploadedAsset(url);
    }
    req.session.success = `${type === 'image' ? 'Photograph' : 'Video'} deleted.`;
    return res.redirect(`/admin/${config.route}`);
  } catch (error) { next(error); } };
}

router.get('/photos', (req, res, next) => renderMediaGallery(req, res, next, 'image'));
router.post('/photos', handleMediaUpload, addMediaForType('image'));
router.post('/photos/:id', handleMediaUpload, updateMediaForType('image'));
router.post('/photos/:id/visibility', setMediaVisibilityForType('image'));
router.delete('/photos/:id', deleteMediaForType('image'));

router.get('/videos', (req, res, next) => renderMediaGallery(req, res, next, 'video'));
router.post('/videos', handleMediaUpload, addMediaForType('video'));
router.post('/videos/:id', handleMediaUpload, updateMediaForType('video'));
router.post('/videos/:id/visibility', setMediaVisibilityForType('video'));
router.delete('/videos/:id', deleteMediaForType('video'));

router.get('/media', async (req, res, next) => { try { res.render('admin/media', { title: 'Media Library', media: await Media.find().sort({ type: 1, sortOrder: 1 }) }); } catch (e) { next(e); } });
router.post('/media', handleMediaUpload, async (req, res, next) => { try {
  let url = String(req.body.url || '').trim();
  if (req.file) url = `/uploads/${req.file.filename}`;
  if (!url) { req.session.error = 'Upload a file or provide a media URL.'; return res.redirect('/admin/media'); }
  const type = req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : (req.body.type === 'video' ? 'video' : 'image');
  await Media.create({ type, title: req.body.title, caption: req.body.caption, url, posterUrl: req.body.posterUrl, alt: req.body.alt, sortOrder: Number(req.body.sortOrder) || 0, active: true });
  req.session.success = 'Media item added.';
  res.redirect('/admin/media');
} catch (e) { next(e); } });
router.post('/media/:id', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/media');
  await Media.findByIdAndUpdate(req.params.id, { title: req.body.title, caption: req.body.caption, posterUrl: req.body.posterUrl, alt: req.body.alt, sortOrder: Number(req.body.sortOrder) || 0 });
  req.session.success = 'Media item updated.';
  res.redirect('/admin/media');
} catch (e) { next(e); } });
router.post('/media/:id/visibility', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/media');
  if (!['true', 'false'].includes(req.body.active)) {
    req.session.error = 'Choose whether this media item should be shown or hidden.';
    return res.redirect('/admin/media');
  }
  const active = req.body.active === 'true';
  const item = await Media.findByIdAndUpdate(req.params.id, { active }, { new: true });
  if (!item) {
    req.session.error = 'That media item could not be found.';
    return res.redirect('/admin/media');
  }
  req.session.success = `${item.type === 'video' ? 'Video' : 'Photograph'} ${active ? 'is now visible on' : 'is now hidden from'} the public website.`;
  return res.redirect(`/admin/media#media-${item.id}`);
} catch (e) { next(e); } });
router.delete('/media/:id', async (req, res, next) => { try {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/media');
  const item = await Media.findById(req.params.id);
  if (item) await removeUploadedAsset(item.url);
  await Media.findByIdAndDelete(req.params.id);
  res.redirect('/admin/media');
} catch (e) { next(e); } });

router.get('/settings', async (req, res, next) => { try {
  const stored = await Setting.find().sort({ key: 1 }).lean();
  const storedByKey = new Map(stored.map(item => [item.key, item]));
  const defaults = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => {
    const saved = storedByKey.get(key);
    return saved && String(saved.value || '').trim() ? saved : { key, value, label: key };
  });
  const extra = stored.filter(item => !(item.key in DEFAULT_SETTINGS) && !item.key.startsWith('_') && !['heroTitle', 'heroText'].includes(item.key));
  res.render('admin/settings', { title: 'Site Settings', settings: [...defaults, ...extra] });
} catch (e) { next(e); } });
router.post('/settings', async (req, res, next) => { try {
  for (const [key, value] of Object.entries(req.body)) await Setting.findOneAndUpdate({ key }, { value: String(value).slice(0, 3000) }, { upsert: true, new: true });
  req.session.success = 'Settings saved.';
  res.redirect('/admin/settings');
} catch (e) { next(e); } });

export default router;
