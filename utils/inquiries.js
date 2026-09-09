const cleanText = (value, max) => String(value || '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

export function inquiryPayload(body = {}) {
  return {
    firstName: cleanText(body.firstName, 60),
    lastName: cleanText(body.lastName, 60),
    email: cleanText(body.email, 160).toLowerCase(),
    phone: cleanText(body.phone, 30),
    interest: cleanText(body.interest, 120),
    message: cleanText(body.message, 2500)
  };
}

export function validateInquiryPayload(payload) {
  const errors = [];
  if (!payload.firstName) errors.push('Enter your first name.');
  if (!payload.email) errors.push('Enter your email address.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push('Enter a valid email address.');
  if (!payload.message) errors.push('Tell us how we can help.');
  return errors;
}
