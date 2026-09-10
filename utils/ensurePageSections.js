import PageSection from '../models/PageSection.js';
import Setting from '../models/Setting.js';
import { DEFAULT_PAGE_SECTIONS } from './defaultPageSections.js';

const PAGE_SECTION_BUNDLE_KEY = '_pageSectionBundle';
const PAGE_SECTION_BUNDLE_VERSION = 'v1-image-section-cms';

export async function ensurePageSections() {
  const installed = await Setting.findOne({ key: PAGE_SECTION_BUNDLE_KEY }).lean();
  if (installed?.value === PAGE_SECTION_BUNDLE_VERSION) return;

  for (const section of DEFAULT_PAGE_SECTIONS) {
    await PageSection.findOneAndUpdate(
      { seedKey: section.seedKey },
      { $setOnInsert: section },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await Setting.findOneAndUpdate(
    { key: PAGE_SECTION_BUNDLE_KEY },
    { $set: { key: PAGE_SECTION_BUNDLE_KEY, value: PAGE_SECTION_BUNDLE_VERSION, label: 'Installed page-section CMS bundle' } },
    { upsert: true, new: true }
  );
}
