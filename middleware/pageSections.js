import PageSection from '../models/PageSection.js';

const PAGE_BY_PATH = Object.freeze({
  '/': 'home',
  '/about': 'about',
  '/care': 'care',
  '/living': 'living'
});

export async function exposePageSections(req, res, next) {
  try {
    const page = PAGE_BY_PATH[req.path];
    res.locals.pageSections = [];
    if (!page) return next();
    const sections = await PageSection.find({ page, active: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    res.locals.pageSections = sections.map(section => ({
      ...section,
      images: [...(section.images || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }));
    return next();
  } catch (error) {
    return next(error);
  }
}
