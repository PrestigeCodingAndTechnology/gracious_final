import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JobApplication from '../models/JobApplication.js';
import { DEFAULT_GALLERY, DEFAULT_SETTINGS, DEFAULT_VIDEOS, LEGACY_GALLERY, SUPPLIED_GALLERY } from '../utils/defaultContent.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const approvedMedia = [...DEFAULT_GALLERY, ...DEFAULT_VIDEOS];

assert.equal(DEFAULT_SETTINGS.address, '5402 Weddington Road, Wesley Chapel NC 28110');
assert.equal(DEFAULT_SETTINGS.email, 'info@graciouscarenc.com');
assert.equal(SUPPLIED_GALLERY.length, 12, 'Every supplied photograph must be present.');
assert.equal(LEGACY_GALLERY.length, 7, 'Every archived website photograph must be present.');
assert.equal(DEFAULT_GALLERY.length, 19, 'The complete gallery must include current and archived photographs.');
assert.equal(DEFAULT_VIDEOS.length, 2, 'Every supplied video must be present.');
assert.equal(new Set(approvedMedia.map(item => item.url)).size, approvedMedia.length, 'Media URLs must be unique.');
assert.deepEqual(DEFAULT_GALLERY.slice(-7).map(item => item.url), LEGACY_GALLERY.map(item => item.url), 'Archived photographs must always appear last.');

for (const item of approvedMedia) {
  assert.ok(item.url.startsWith('/media/'), `${item.url} must use the local media library.`);
  const file = path.join(projectRoot, 'public', item.url);
  const content = await fs.readFile(file);
  assert.ok(content.length > 1_000, `${item.url} is unexpectedly small.`);
  if (item.type === 'image') {
    assert.deepEqual([...content.subarray(0, 3)], [0xff, 0xd8, 0xff], `${item.url} is not a valid JPEG.`);
  } else {
    assert.equal(content.subarray(4, 8).toString('ascii'), 'ftyp', `${item.url} is not a valid MP4.`);
  }
}

const application = new JobApplication({
  applicationNumber: 'GSL-20260823-ABC123',
  fullName: 'Sample Applicant',
  address: '100 Example Lane',
  city: 'Wesley Chapel',
  state: 'NC',
  zip: '28110',
  email: 'applicant@example.com',
  phone: '704-555-0100',
  dateAvailable: '2026-09-01',
  position: 'Caregiver',
  employmentType: 'full-time',
  usCitizen: 'yes',
  previouslyWorked: 'no',
  felonyConviction: 'no',
  references: [{ name: 'Professional Reference', email: 'reference@example.com' }],
  veteran: 'no',
  backgroundCheckConsent: 'yes',
  certificationAccepted: true,
  signature: 'Sample Applicant',
  signatureDate: '2026-08-23'
});
await application.validate();
assert.equal(JobApplication.schema.path('ssn'), undefined, 'Social Security numbers must not be collected online.');

const [galleryView, videoView, applicationView] = await Promise.all([
  fs.readFile(path.join(projectRoot, 'views/public/gallery.ejs'), 'utf8'),
  fs.readFile(path.join(projectRoot, 'views/public/video-gallery.ejs'), 'utf8'),
  fs.readFile(path.join(projectRoot, 'views/public/application.ejs'), 'utf8')
]);
assert.match(galleryView, /data-lightbox/, 'Gallery images must open in the full-size lightbox.');
assert.match(videoView, /controls/, 'Video gallery must provide playback controls.');
assert.match(applicationView, /data-application-form/, 'The employment application form is missing.');
assert.match(applicationView, /multipart\/form-data/, 'Résumé uploads must use multipart form submission.');

console.log('Application validation passed: form schema, privacy boundary, 19 photographs and 2 videos verified.');
