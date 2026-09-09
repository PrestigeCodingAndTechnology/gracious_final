import Media from '../models/Media.js';
import Setting from '../models/Setting.js';
import HeroSlide from '../models/HeroSlide.js';
import { DEFAULT_GALLERY, DEFAULT_SETTINGS, DEFAULT_VIDEOS } from './defaultContent.js';
import { DEFAULT_HEROES } from './defaultHeroes.js';

const CONTENT_BUNDLE_KEY = '_contentBundle';
const CONTENT_BUNDLE_VERSION = 'v6.2-hero-gallery-preloader-feedback';
const HERO_BUNDLE_KEY = '_heroBundle';
const HERO_BUNDLE_VERSION = 'v1-all-public-heroes';
const CONTACT_BUNDLE_KEY = '_contactBundle';
const CONTACT_BUNDLE_VERSION = 'v1-weddington-graciouscarenc';

export async function ensureDefaultContent() {
  const approvedMedia = [...DEFAULT_GALLERY, ...DEFAULT_VIDEOS];
  const approvedUrls = approvedMedia.map(item => item.url);
  const installedBundle = await Setting.findOne({ key: CONTENT_BUNDLE_KEY }).lean();

  // Install/upgrade packaged media once per content bundle. After the bundle
  // marker is written, administrator hide/delete decisions persist on restarts.
  if (installedBundle?.value !== CONTENT_BUNDLE_VERSION) {
    await Media.updateMany(
      { $and: [{ url: { $nin: approvedUrls } }, { url: /^\/media\// }] },
      { $set: { active: false } }
    );
    for (const item of approvedMedia) {
      const { active, ...content } = item;
      await Media.findOneAndUpdate(
        { url: item.url },
        { $set: content, $setOnInsert: { active: active !== false } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  // Apply the approved address/email migration once, then preserve later
  // administrator edits across normal restarts and future seed runs.
  const installedContactBundle = await Setting.findOne({ key: CONTACT_BUNDLE_KEY }).lean();
  if (installedContactBundle?.value !== CONTACT_BUNDLE_VERSION) {
    for (const key of ['address', 'email', 'careersEmail']) {
      await Setting.findOneAndUpdate(
        { key },
        { $set: { key, value: DEFAULT_SETTINGS[key], label: key } },
        { upsert: true, new: true }
      );
    }
    await Setting.findOneAndUpdate(
      { key: CONTACT_BUNDLE_KEY },
      { $set: { key: CONTACT_BUNDLE_KEY, value: CONTACT_BUNDLE_VERSION, label: 'Installed contact migration' } },
      { upsert: true, new: true }
    );
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await Setting.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, value, label: key } },
      { upsert: true, new: true }
    );
  }

  const installedHeroBundle = await Setting.findOne({ key: HERO_BUNDLE_KEY }).lean();
  if (installedHeroBundle?.value !== HERO_BUNDLE_VERSION) {
    for (const hero of DEFAULT_HEROES) {
      await HeroSlide.findOneAndUpdate(
        { seedKey: hero.seedKey },
        { $setOnInsert: hero },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    await Setting.findOneAndUpdate(
      { key: HERO_BUNDLE_KEY },
      { $set: { key: HERO_BUNDLE_KEY, value: HERO_BUNDLE_VERSION, label: 'Installed hero bundle' } },
      { upsert: true, new: true }
    );
  }

  await Setting.findOneAndUpdate(
    { key: CONTENT_BUNDLE_KEY },
    { $set: { key: CONTENT_BUNDLE_KEY, value: CONTENT_BUNDLE_VERSION, label: 'Installed content bundle' } },
    { upsert: true, new: true }
  );

  return { photographs: DEFAULT_GALLERY.length, videos: DEFAULT_VIDEOS.length, heroes: DEFAULT_HEROES.length };
}
