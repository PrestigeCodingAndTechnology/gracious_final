import express from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    req.session.error = 'Too many sign-in attempts. Please wait 15 minutes and try again.';
    res.redirect('/admin/login');
  }
});

router.get('/login', (req, res) => {
  if (req.session?.user) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login' });
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email, active: true }).select('+password');
    if (!user || !(await user.matchesPassword(password))) {
      req.session.error = 'Invalid email or password.';
      return res.redirect('/admin/login');
    }
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    const target = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(target);
  } catch (error) {
    console.error(error);
    req.session.error = 'Unable to sign in.';
    res.redirect('/admin/login');
  }
});

router.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/admin/login')));
export default router;
