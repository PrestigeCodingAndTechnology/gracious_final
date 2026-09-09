export const HERO_PAGE_LABELS = Object.freeze({
  home: 'Homepage Slider',
  about: 'About Us',
  care: 'Our Care',
  living: 'Senior Living',
  gallery: 'Photos Gallery',
  'video-gallery': 'Videos Gallery',
  reviews: 'Family Reviews',
  contact: 'Contact',
  application: 'Careers'
});

export const HERO_BREADCRUMBS = Object.freeze({
  about: [{ label: 'About Us' }],
  care: [{ label: 'Our Care' }],
  living: [{ label: 'Living' }],
  gallery: [{ label: 'Gallery' }],
  'video-gallery': [{ label: 'Gallery', href: '/gallery' }, { label: 'Videos' }],
  reviews: [{ label: 'Reviews' }],
  contact: [{ label: 'Contact' }],
  application: [{ label: 'Join Our Team' }]
});

export const DEFAULT_HEROES = Object.freeze([
  {
    page: 'home', seedKey: 'home-welcome', eyebrow: 'A gracious place to call home', icon: 'fa-house-chimney-heart',
    title: "You've found a home at Gracious Senior Living.",
    text: 'An intimate, physician-led senior living community where compassionate support, familiar comforts and genuine belonging come together.',
    imageUrl: '/media/gallery/g1.jpeg', imageAlt: 'Residents enjoying time together at Gracious Senior Living', backgroundPosition: 'center center',
    primaryLabel: 'Schedule a Visit', primaryHref: '/contact', secondaryLabel: 'Explore Our Care', secondaryHref: '/care', sortOrder: 1, active: true
  },
  {
    page: 'home', seedKey: 'home-private-rooms', eyebrow: 'Intimate by design', icon: 'fa-door-open',
    title: 'Private rooms. Personal attention. The ease of home.',
    text: 'Our six-room setting gives every resident the space to feel comfortable and the opportunity to be truly known.',
    imageUrl: '/media/gallery/g10.jpeg', imageAlt: 'Private bedroom at Gracious Senior Living', backgroundPosition: 'center center',
    primaryLabel: 'Explore Living Spaces', primaryHref: '/living', secondaryLabel: 'View the Gallery', secondaryHref: '/gallery', sortOrder: 2, active: true
  },
  {
    page: 'home', seedKey: 'home-physician-led', eyebrow: 'Physician-led community', icon: 'fa-user-doctor',
    title: 'Thoughtful care for every dimension of wellbeing.',
    text: 'Personalized daily support, health coordination, companionship and spiritual encouragement—delivered with patience and respect.',
    imageUrl: '/media/gallery/g7.jpeg', imageAlt: 'Gracious Senior Living community', backgroundPosition: 'center center',
    primaryLabel: 'View Care & Services', primaryHref: '/care', secondaryLabel: 'Talk With Our Team', secondaryHref: '/contact', sortOrder: 3, active: true
  },
  {
    page: 'about', seedKey: 'about-main', eyebrow: 'About Gracious', title: 'Home of ageless grace.',
    text: 'A smaller, physician-led community built around dignity, faith, family and the freedom to feel at home.',
    imageUrl: '/media/gallery/g7.jpeg', imageAlt: 'Residents gathered at Gracious Senior Living', backgroundPosition: 'center center', sortOrder: 1, active: true
  },
  {
    page: 'care', seedKey: 'care-main', eyebrow: 'Care & Services', title: 'Flexible care, thoughtfully tailored.',
    text: 'Round-the-clock support shaped around changing needs, familiar routines and the life each resident wants to keep living.',
    imageUrl: '/media/gallery/g11.jpeg', imageAlt: 'Resident receiving thoughtful support at Gracious Senior Living', backgroundPosition: 'center 35%', sortOrder: 1, active: true
  },
  {
    page: 'living', seedKey: 'living-main', eyebrow: 'Life at Gracious', title: 'Comfort, connection and meaningful days.',
    text: 'A calm residential atmosphere where personal routines are honored, shared moments happen naturally and residents feel genuinely at home.',
    imageUrl: '/media/gallery/g10.jpeg', imageAlt: 'Comfortable living space at Gracious Senior Living', backgroundPosition: 'center center', sortOrder: 1, active: true
  },
  {
    page: 'gallery', seedKey: 'gallery-main', eyebrow: 'Photo Gallery', title: 'Inside our gracious community.',
    text: 'Explore the celebrations, living spaces and everyday details that make Gracious feel like home.',
    imageUrl: '/media/gallery/g1.jpeg', imageAlt: 'Residents together in the Gracious Senior Living community', backgroundPosition: 'center center', sortOrder: 1, active: true
  },
  {
    page: 'video-gallery', seedKey: 'video-gallery-main', eyebrow: 'Video Gallery', title: 'See life at Gracious.',
    text: 'Step inside our home-style community and experience the warmth, spaces and connections that shape each day.',
    imageUrl: '/media/gallery/g8.jpeg', imageAlt: 'Residents enjoying an activity at Gracious Senior Living', backgroundPosition: 'center center', sortOrder: 1, active: true
  },
  {
    page: 'reviews', seedKey: 'reviews-main', eyebrow: 'Family Reviews', title: 'Experiences shared with grace.',
    text: 'Hear from families and visitors who have experienced the warmth, attention and home-like spirit of our community.',
    imageUrl: '/media/gallery/g5.jpeg', imageAlt: 'Residents sharing a warm moment at Gracious Senior Living', backgroundPosition: 'center center', sortOrder: 1, active: true
  },
  {
    page: 'contact', seedKey: 'contact-main', eyebrow: 'Contact Gracious', title: 'Let’s begin with a conversation.',
    text: 'Ask about care, current availability or a personal tour. We are here to listen and help your family understand the next step.',
    imageUrl: '/media/gallery/g6.jpeg', imageAlt: 'Welcoming community at Gracious Senior Living', backgroundPosition: 'center center', sortOrder: 1, active: true
  },
  {
    page: 'application', seedKey: 'application-main', eyebrow: 'Careers at Gracious', title: 'Bring your compassion to a place that feels like home.',
    text: 'Join a close-knit team devoted to dignified, attentive care and meaningful everyday moments.',
    imageUrl: '/media/gallery/g11.jpeg', imageAlt: 'Smiling resident at Gracious Senior Living', backgroundPosition: 'center 36%', sortOrder: 1, active: true
  }
]);
