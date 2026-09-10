export const PAGE_SECTION_PAGES = ['home', 'about', 'care', 'living'];

export const PAGE_SECTION_PAGE_LABELS = Object.freeze({
  home: 'Home',
  about: 'About',
  care: 'Care & Services',
  living: 'Living Spaces'
});

export const DEFAULT_PAGE_SECTIONS = [
  {
    seedKey: 'home-welcome', page: 'home', name: 'Welcome section', template: 'split-left', sortOrder: 10, system: true,
    eyebrow: 'Welcome to Gracious', title: 'Not an institution. A close-knit community devoted to care.',
    lead: 'Gracious Senior Living offers a thoughtful alternative to large, institutional settings—giving your loved one a peaceful home, familiar rhythms and personal attention.',
    body: 'Our intimate size supports genuine relationships. We take time to understand preferences, routines, health needs and the little things that help each resident feel secure and cherished.',
    noteTitle: 'Family-style living', noteText: 'Care that always feels personal.', buttonLabel: 'Discover our story', buttonHref: '/about',
    items: [
      { title: 'Individualized care that adapts with changing needs' },
      { title: 'Warm communication that keeps families informed' },
      { title: 'Respect for independence, faith and personal choice' }
    ],
    images: [{ label: 'Welcome image', url: '/media/gallery/g10.jpeg', alt: 'Comfortable private room at Gracious Senior Living', visible: true, sortOrder: 0 }]
  },
  {
    seedKey: 'home-life', page: 'home', name: 'Home life gallery section', template: 'dark-gallery', sortOrder: 30, system: true,
    eyebrow: 'Where comfort meets care', title: 'A home designed around everyday wellbeing.',
    body: 'Private bedrooms, comforting meals, outdoor space and a welcoming common area create room for both quiet moments and community connection.',
    buttonLabel: 'Explore Daily Living', buttonHref: '/living',
    items: [
      { icon: 'fa-bed', title: 'Private bedrooms' }, { icon: 'fa-utensils', title: 'Three meals plus snacks' },
      { icon: 'fa-seedling', title: 'Garden & screened porch' }, { icon: 'fa-car-side', title: 'Transportation assistance' }
    ],
    images: [
      { label: 'Conversation image', url: '/media/gallery/g4.jpeg', alt: 'Two women residents enjoying a quiet conversation', visible: true, sortOrder: 0 },
      { label: 'Card game image', url: '/media/gallery/g8.jpeg', alt: 'Women residents enjoying a card game', visible: true, sortOrder: 1 },
      { label: 'Common area image', url: '/media/gallery/g12.jpeg', alt: 'Woman resident relaxing in a sunny common area', visible: true, sortOrder: 2 }
    ]
  },
  {
    seedKey: 'home-visit', page: 'home', name: 'Visit call-to-action', template: 'background-cta', sortOrder: 60, system: true,
    eyebrow: 'See it for yourself', title: 'The best way to understand Gracious is to visit.',
    body: 'Walk through the home, meet the people behind the care and picture the possibilities for your loved one.',
    buttonLabel: 'Schedule a Personal Tour', buttonHref: '/contact',
    images: [{ label: 'Visit background', url: '/media/gallery/g7.jpeg', alt: 'Gracious Senior Living community', visible: true, sortOrder: 0 }]
  },
  {
    seedKey: 'about-story', page: 'about', name: 'Our story', template: 'split-right', sortOrder: 10, system: true,
    eyebrow: 'Our story', title: 'Graceful aging begins with being genuinely known.',
    lead: 'Gracious Senior Living is a warm residential community led by a family of physicians and created for people who deserve care that feels personal.',
    body: 'Unlike large traditional facilities, our six-room home allows caregivers to notice the details: a favorite routine, a meaningful story, a change in appetite, or the simple comfort of a familiar voice. That closeness helps us respond with attentiveness and compassion.',
    secondaryBody: 'Here, residents are not numbers on a schedule. They are individuals with histories, preferences, relationships and purpose—and they are welcomed as part of the Gracious family.',
    noteTitle: 'Six private rooms', noteText: 'Care that never feels crowded.',
    images: [{ label: 'Story image', url: '/media/gallery/g7.jpeg', alt: 'Women residents gathered in the Gracious Senior Living lounge', visible: true, sortOrder: 0 }]
  },
  {
    seedKey: 'about-team', page: 'about', name: 'Our care team', template: 'split-left', sortOrder: 40, system: true,
    eyebrow: 'Our care team', title: 'Professional expertise with a family heart.',
    lead: 'Board-certified physicians, nurses, certified nursing assistants and licensed caregivers work together to provide attentive, coordinated support.',
    body: 'Our administrative team helps personalize care plans, coordinate schedules and keep families informed. Across every role, the standard is the same: empathy, professionalism and genuine concern for the person in our care.',
    buttonLabel: 'Explore Our Care', buttonHref: '/care',
    images: [{ label: 'Care team image', url: '/media/gallery/g5.jpeg', alt: 'Two women residents sharing a happy moment at Gracious Senior Living', visible: true, sortOrder: 0 }]
  },
  {
    seedKey: 'care-specialized', page: 'care', name: 'Specialized support', template: 'split-left', sortOrder: 20, system: true,
    eyebrow: 'Specialized support', title: 'Calm, compassionate help through changing seasons.', badgeText: 'Support 24 hours a day',
    items: [
      { icon: 'fa-brain', title: 'Memory & Dementia Support', text: 'Structured routines, tailored activities and a familiar environment for residents living with cognitive changes.' },
      { icon: 'fa-hand-holding-medical', title: 'Palliative & Comfort Care', text: 'Comfort-focused support that protects dignity and quality of life through serious illness and end-of-life needs.' },
      { icon: 'fa-calendar-day', title: 'Respite Care', text: 'Dependable short-term care that gives family caregivers time to rest, travel or attend to other responsibilities.' }
    ],
    images: [{ label: 'Specialized care image', url: '/media/gallery/g12.jpeg', alt: 'Woman resident relaxing comfortably at Gracious Senior Living', visible: true, sortOrder: 0 }]
  },
  {
    seedKey: 'living-intro', page: 'living', name: 'Family-style living', template: 'collage-left', sortOrder: 10, system: true,
    eyebrow: 'Family-style living', title: 'Familiar comforts make room for confidence.',
    lead: 'Home is more than a bedroom. It is the freedom to settle into a favorite chair, enjoy a meal with familiar faces, spend time outdoors and move through the day without feeling rushed.',
    body: 'Our newly remodeled residence combines private personal space with welcoming common areas. Residents can enjoy companionship when they want it and restful privacy when they need it.',
    items: [
      { title: 'Tastefully arranged private bedrooms' }, { title: 'Inviting kitchen and shared living areas' },
      { title: 'Screened porch, fenced backyard and resident garden' }, { title: 'Secure environment with 24-hour in-home staff' }
    ],
    images: [
      { label: 'Private room image', url: '/media/gallery/g10.jpeg', alt: 'Private bedroom at Gracious Senior Living', visible: true, sortOrder: 0 },
      { label: 'Resident image', url: '/media/gallery/g11.jpeg', alt: 'Smiling woman resident at Gracious Senior Living', visible: true, sortOrder: 1 }
    ]
  },
  {
    seedKey: 'living-spaces', page: 'living', name: 'Spaces showcase', template: 'card-gallery', sortOrder: 20, system: true,
    eyebrow: 'Take a look inside', title: 'Spaces designed to feel easy and familiar.', buttonLabel: 'View the Full Gallery', buttonHref: '/gallery',
    images: [
      { label: 'Community Living', url: '/media/gallery/g7.jpeg', alt: 'Women residents gathered in a shared living area', captionTitle: 'Community Living', captionText: 'Welcoming shared spaces for friendship and conversation.', visible: true, sortOrder: 0 },
      { label: 'Meaningful Activities', url: '/media/gallery/g8.jpeg', alt: 'Women residents enjoying a card activity', captionTitle: 'Meaningful Activities', captionText: 'Familiar games and shared moments that brighten the day.', visible: true, sortOrder: 1 },
      { label: 'Private Rooms', url: '/media/gallery/g10.jpeg', alt: 'Private bedroom', captionTitle: 'Private Rooms', captionText: 'Personal retreats for rest and dignity.', visible: true, sortOrder: 2 }
    ]
  }
];
