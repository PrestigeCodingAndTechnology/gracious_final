export const DEFAULT_SETTINGS = Object.freeze({
  siteName: 'Gracious Senior Living',
  address: '5402 Weddington Road, Wesley Chapel NC 28110',
  phone: '704-218-2424',
  mobile: '980-347-9474',
  email: 'info@graciouscarenc.com',
  careersEmail: 'info@graciouscarenc.com',
  liveChatEnabled: 'true'
});

export const SUPPLIED_GALLERY = Object.freeze([
  {
    type: 'image', title: 'Together at Home', caption: 'Friendship, comfort and belonging in our close-knit residence.',
    url: '/media/gallery/g1.jpeg', alt: 'Women residents gathered together in the Gracious Senior Living lounge', sortOrder: 1, active: true
  },
  {
    type: 'image', title: 'A Bright Gracious Day', caption: 'Personal style and joyful moments are always welcome here.',
    url: '/media/gallery/g2.jpeg', alt: 'Smiling woman resident wearing a colorful jacket', sortOrder: 2, active: true
  },
  {
    type: 'image', title: 'Comfort and Calm', caption: 'Quiet moments in familiar surroundings make every day feel like home.',
    url: '/media/gallery/g3.jpeg', alt: 'Woman resident relaxing in a comfortable chair', sortOrder: 3, active: true
  },
  {
    type: 'image', title: 'Meaningful Conversation', caption: 'Time together creates connection and lasting friendship.',
    url: '/media/gallery/g4.jpeg', alt: 'Two women residents enjoying a conversation', sortOrder: 4, active: true
  },
  {
    type: 'image', title: 'Friends Make a Home', caption: 'Warm smiles shared in a welcoming, family-style setting.',
    url: '/media/gallery/g5.jpeg', alt: 'Two smiling women residents seated together', sortOrder: 5, active: true
  },
  {
    type: 'image', title: 'Everyday Companionship', caption: 'Supportive relationships are part of daily life at Gracious.',
    url: '/media/gallery/g6.jpeg', alt: 'Two women residents spending time together', sortOrder: 6, active: true
  },
  {
    type: 'image', title: 'Our Gracious Community', caption: 'An intimate home where everyone is known and valued.',
    url: '/media/gallery/g7.jpeg', alt: 'Women residents gathered for a community activity', sortOrder: 7, active: true
  },
  {
    type: 'image', title: 'Game Time Together', caption: 'Familiar games keep minds active and bring plenty of laughter.',
    url: '/media/gallery/g8.jpeg', alt: 'Two women residents playing cards at a table', sortOrder: 8, active: true
  },
  {
    type: 'image', title: 'A Winning Hand', caption: 'Simple pleasures become meaningful memories when shared.',
    url: '/media/gallery/g9.jpeg', alt: 'Woman resident smiling while playing cards', sortOrder: 9, active: true
  },
  {
    type: 'image', title: 'Private Bedroom', caption: 'A peaceful personal retreat arranged for rest and dignity.',
    url: '/media/gallery/g10.jpeg', alt: 'Comfortable private bedroom at Gracious Senior Living', sortOrder: 10, active: true
  },
  {
    type: 'image', title: 'A Gracious Smile', caption: 'Every resident is treated with warmth, patience and respect.',
    url: '/media/gallery/g11.jpeg', alt: 'Smiling woman resident in the Gracious Senior Living lounge', sortOrder: 11, active: true
  },
  {
    type: 'image', title: 'Feeling at Home', caption: 'Familiar comforts and attentive support through every season.',
    url: '/media/gallery/g12.jpeg', alt: 'Woman resident relaxing beside a sunny window', sortOrder: 12, active: true
  }
]);

export const LEGACY_GALLERY = Object.freeze([
  {
    type: 'image', title: 'Grand Opening Ribbon Cutting', caption: 'Celebrating the beginning of Gracious Senior Living with community leaders and guests.',
    url: '/media/gallery/legacy/legacy-01.jpg', alt: 'Community members and the Gracious Senior Living team gathered for a grand-opening ribbon cutting', sortOrder: 101, active: true
  },
  {
    type: 'image', title: 'A Gracious Grand Opening', caption: 'A joyful ribbon-cutting moment shared with friends and supporters.',
    url: '/media/gallery/legacy/legacy-02.jpg', alt: 'Guests holding a ribbon and ceremonial scissors outside Gracious Senior Living', sortOrder: 102, active: true
  },
  {
    type: 'image', title: 'Community Celebration', caption: 'Neighbors, leaders and the Gracious team gathered to mark opening day.',
    url: '/media/gallery/legacy/legacy-03.jpg', alt: 'Community guests gathered beside the ribbon at the Gracious Senior Living grand opening', sortOrder: 103, active: true
  },
  {
    type: 'image', title: 'Mayor Robert Burns', caption: 'Mayor Robert Burns of Monroe joined the Gracious Senior Living grand-opening celebration.',
    url: '/media/gallery/legacy/legacy-04.jpg', alt: 'Mayor Robert Burns of Monroe at the Gracious Senior Living grand opening', sortOrder: 104, active: true
  },
  {
    type: 'image', title: 'A Warm Welcome', caption: 'Warm greetings and meaningful connection at the grand-opening celebration.',
    url: '/media/gallery/legacy/legacy-05.jpg', alt: 'Two guests sharing a warm greeting during the Gracious Senior Living grand opening', sortOrder: 105, active: true
  },
  {
    type: 'image', title: 'The Gracious Team', caption: 'Team members and supporters together on a memorable opening day.',
    url: '/media/gallery/legacy/legacy-06.jpg', alt: 'Gracious Senior Living team members and supporters walking together on opening day', sortOrder: 106, active: true
  },
  {
    type: 'image', title: 'Grand Opening Guests', caption: 'Friends, community partners and the Gracious team gathered inside the residence.',
    url: '/media/gallery/legacy/legacy-07.jpg', alt: 'Friends, community partners and team members gathered inside Gracious Senior Living', sortOrder: 107, active: true
  }
]);

export const DEFAULT_GALLERY = Object.freeze([...SUPPLIED_GALLERY, ...LEGACY_GALLERY]);

export const DEFAULT_VIDEOS = Object.freeze([
  {
    type: 'video', title: 'Joy in the Everyday',
    url: '/media/videos/v1.mp4', posterUrl: '/media/gallery/g6.jpeg',
    caption: 'A joyful community moment shared around the table.', sortOrder: 1, active: true
  },
  {
    type: 'video', title: 'Game Day at Gracious',
    url: '/media/videos/v2.mp4', posterUrl: '/media/gallery/g8.jpeg',
    caption: 'Laughter, conversation and friendly competition in our home.', sortOrder: 2, active: true
  }
]);
