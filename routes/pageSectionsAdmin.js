import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';
import PageSection from '../models/PageSection.js';
import { PAGE_SECTION_PAGES, PAGE_SECTION_PAGE_LABELS } from '../utils/defaultPageSections.js';

const router = express.Router();
router.use(requireAdmin);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`)
});
const imageUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, file, cb) => file.mimetype.startsWith('image/')
    ? cb(null, true)
    : cb(new Error('Upload a valid image file.'))
});

const clean = (value, max = 2000) => String(value || '').trim().slice(0, max);
const safePage = value => PAGE_SECTION_PAGES.includes(value) ? value : 'home';
const safeTemplate = value => ['split-left', 'split-right', 'dark-gallery', 'background-cta', 'collage-left', 'card-gallery'].includes(value) ? value : 'split-left';
const uploadedUrl = file => file ? `/uploads/${file.filename}` : '';

async function removeUploaded(url) {
  const value = String(url || '');
  if (!value.startsWith('/uploads/')) return;
  const filename = path.basename(value.split(/[?#]/, 1)[0]);
  if (filename) await fs.unlink(path.join(uploadDir, filename)).catch(() => {});
}

function parseItems(value) {
  return clean(value, 12000).split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 20).map(line => {
    const [title = '', text = '', icon = ''] = line.split('|').map(part => part.trim());
    return { title: title.slice(0, 180), text: text.slice(0, 800), icon: icon.slice(0, 80) };
  }).filter(item => item.title);
}

function formatItems(items = []) {
  return items.map(item => [item.title || '', item.text || '', item.icon || ''].join(' | ').replace(/\s+\|\s+\|\s*$/, '')).join('\n');
}

function sectionPayload(body) {
  return {
    page: safePage(body.page),
    name: clean(body.name, 160) || 'Website section',
    template: safeTemplate(body.template),
    eyebrow: clean(body.eyebrow, 160),
    title: clean(body.title, 300),
    lead: clean(body.lead, 1200),
    body: clean(body.body, 3000),
    secondaryBody: clean(body.secondaryBody, 3000),
    noteTitle: clean(body.noteTitle, 180),
    noteText: clean(body.noteText, 500),
    badgeText: clean(body.badgeText, 180),
    buttonLabel: clean(body.buttonLabel, 120),
    buttonHref: clean(body.buttonHref, 500),
    items: parseItems(body.itemsText),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0
  };
}

function handleImage(req, res, next) {
  imageUpload.single('image')(req, res, error => {
    if (!error) return next();
    req.session.error = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      ? 'Images must be 15 MB or smaller.'
      : error.message;
    return res.redirect('/admin/sections');
  });
}

router.get('/sections', async (req, res, next) => {
  try {
    const pageFilter = PAGE_SECTION_PAGES.includes(req.query.page) ? req.query.page : 'all';
    const query = pageFilter === 'all' ? {} : { page: pageFilter };
    const sections = await PageSection.find(query).sort({ page: 1, sortOrder: 1, createdAt: 1 }).lean();
    const counts = Object.fromEntries(await Promise.all(PAGE_SECTION_PAGES.map(async page => [page, await PageSection.countDocuments({ page })])));
    res.render('admin/sections', {
      title: 'Page Content', sections, pageFilter, pageLabels: PAGE_SECTION_PAGE_LABELS,
      pages: PAGE_SECTION_PAGES, counts, formatItems
    });
  } catch (error) { next(error); }
});

router.post('/sections', handleImage, async (req, res, next) => {
  try {
    const payload = sectionPayload(req.body);
    const url = uploadedUrl(req.file) || clean(req.body.imageUrl, 1000);
    const images = url ? [{ label: clean(req.body.imageLabel, 160) || 'Section image', url, alt: clean(req.body.imageAlt, 220), visible: true, sortOrder: 0 }] : [];
    const section = await PageSection.create({ ...payload, images, active: true, custom: true, system: false });
    req.session.success = 'Page section created.';
    res.redirect(`/admin/sections?page=${encodeURIComponent(section.page)}#section-${section.id}`);
  } catch (error) {
    if (req.file) await removeUploaded(uploadedUrl(req.file));
    next(error);
  }
});

router.post('/sections/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/sections');
    const section = await PageSection.findById(req.params.id);
    if (!section) return res.redirect('/admin/sections');
    section.set(sectionPayload(req.body));
    await section.save();
    req.session.success = 'Section content updated.';
    res.redirect(`/admin/sections?page=${encodeURIComponent(section.page)}#section-${section.id}`);
  } catch (error) { next(error); }
});

router.post('/sections/:id/visibility', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/sections');
    const active = req.body.active === 'true';
    const section = await PageSection.findByIdAndUpdate(req.params.id, { active }, { new: true });
    if (!section) return res.redirect('/admin/sections');
    req.session.success = `Section ${active ? 'shown on' : 'hidden from'} the public website.`;
    res.redirect(`/admin/sections?page=${encodeURIComponent(section.page)}#section-${section.id}`);
  } catch (error) { next(error); }
});

router.delete('/sections/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/sections');
    const section = await PageSection.findById(req.params.id);
    if (!section) return res.redirect('/admin/sections');
    const page = section.page;
    await Promise.all((section.images || []).map(image => removeUploaded(image.url)));
    await section.deleteOne();
    req.session.success = 'Section permanently deleted.';
    res.redirect(`/admin/sections?page=${encodeURIComponent(page)}`);
  } catch (error) { next(error); }
});

router.post('/sections/:id/images', handleImage, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      if (req.file) await removeUploaded(uploadedUrl(req.file));
      return res.redirect('/admin/sections');
    }
    const section = await PageSection.findById(req.params.id);
    if (!section) {
      if (req.file) await removeUploaded(uploadedUrl(req.file));
      return res.redirect('/admin/sections');
    }
    const url = uploadedUrl(req.file) || clean(req.body.imageUrl, 1000);
    if (!url) {
      req.session.error = 'Upload an image or provide an image URL.';
      return res.redirect(`/admin/sections?page=${encodeURIComponent(section.page)}#section-${section.id}`);
    }
    section.images.push({
      label: clean(req.body.label, 160) || 'Section image', url, alt: clean(req.body.alt, 220),
      visible: true, captionTitle: clean(req.body.captionTitle, 180), captionText: clean(req.body.captionText, 500),
      sortOrder: Number(req.body.sortOrder) || 0
    });
    await section.save();
    req.session.success = 'Image added to the section.';
    res.redirect(`/admin/sections?page=${encodeURIComponent(section.page)}#section-${section.id}`);
  } catch (error) {
    if (req.file) await removeUploaded(uploadedUrl(req.file));
    next(error);
  }
});

router.post('/sections/:id/images/:imageId', handleImage, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.imageId)) {
      if (req.file) await removeUploaded(uploadedUrl(req.file));
      return res.redirect('/admin/sections');
    }
    const section = await PageSection.findById(req.params.id);
    const image = section?.images.id(req.params.imageId);
    if (!section || !image) {
      if (req.file) await removeUploaded(uploadedUrl(req.file));
      return res.redirect('/admin/sections');
    }
    const oldUrl = image.url;
    const replacement = uploadedUrl(req.file) || clean(req.body.imageUrl, 1000);
    if (replacement) image.url = replacement;
    image.label = clean(req.body.label, 160) || 'Section image';
    image.alt = clean(req.body.alt, 220);
    image.captionTitle = clean(req.body.captionTitle, 180);
    image.captionText = clean(req.body.captionText, 500);
    image.sortOrder = Number(req.body.sortOrder) || 0;
    await section.save();
    if (oldUrl !== image.url) await removeUploaded(oldUrl);
    req.session.success = 'Section image updated.';
    res.redirect(`/admin/sections?page=${encodeURIComponent(section.page)}#section-${section.id}`);
  } catch (error) {
    if (req.file) await removeUploaded(uploadedUrl(req.file));
    next(error);
  }
});

router.post('/sections/:id/images/:imageId/visibility', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.imageId)) return res.redirect('/admin/sections');
    const section = await PageSection.findById(req.params.id);
    const image = section?.images.id(req.params.imageId);
    if (!section || !image) return res.redirect('/admin/sections');
    image.visible = req.body.visible === 'true';
    await section.save();
    req.session.success = `Image ${image.visible ? 'shown on' : 'hidden from'} the public website.`;
    res.redirect(`/admin/sections?page=${encodeURIComponent(section.page)}#section-${section.id}`);
  } catch (error) { next(error); }
});

router.delete('/sections/:id/images/:imageId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.imageId)) return res.redirect('/admin/sections');
    const section = await PageSection.findById(req.params.id);
    const image = section?.images.id(req.params.imageId);
    if (!section || !image) return res.redirect('/admin/sections');
    const url = image.url;
    image.deleteOne();
    await section.save();
    await removeUploaded(url);
    req.session.success = 'Section image deleted.';
    res.redirect(`/admin/sections?page=${encodeURIComponent(section.page)}#section-${section.id}`);
  } catch (error) { next(error); }
});

export default router;
