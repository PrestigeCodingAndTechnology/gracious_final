import express from 'express';
import mongoose from 'mongoose';
import { requireAdmin } from '../middleware/auth.js';
import HeroSlide from '../models/HeroSlide.js';

const router = express.Router();
router.use(requireAdmin);

router.post('/heroes/:id/image-visibility', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect('/admin/heroes');
    const imageVisible = req.body.imageVisible === 'true';
    const hero = await HeroSlide.findByIdAndUpdate(req.params.id, { imageVisible }, { new: true });
    if (!hero) return res.redirect('/admin/heroes');
    req.session.success = `Hero background image ${imageVisible ? 'shown' : 'hidden'} while keeping the hero content available.`;
    res.redirect(`/admin/heroes?page=${encodeURIComponent(hero.page)}#hero-${hero.id}`);
  } catch (error) { next(error); }
});

export default router;
