const REVIEW_STATUSES = Object.freeze(['pending', 'approved', 'rejected']);

export const PUBLIC_REVIEW_SORT = Object.freeze({ approvedAt: -1, createdAt: -1 });

const cleanText = (value, max) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

export function reviewPayload(body = {}) {
  const rating = Number.parseInt(body.rating, 10);
  return {
    name: cleanText(body.name, 80),
    relationship: cleanText(body.relationship, 100),
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
    message: cleanText(body.message, 1200)
  };
}

export function validateReviewPayload(payload) {
  const errors = [];
  if (!payload.name) errors.push('Enter your name.');
  if (!payload.message) errors.push('Share a few words about your experience.');
  if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) errors.push('Choose a rating from 1 to 5 stars.');
  return errors;
}

export function reviewModerationUpdate(review, requestedStatus, now = new Date()) {
  const status = REVIEW_STATUSES.includes(requestedStatus) ? requestedStatus : 'pending';
  const wasApproved = review?.status === 'approved';
  return {
    status,
    approvedAt: status === 'approved' ? (wasApproved && review.approvedAt ? review.approvedAt : now) : null
  };
}
