// Body zones for interactive map (mapped to anatomical SVG parts)
export const BODY_ZONES = [
  {
    id: 'head',
    name: 'Head & Hair',
    svgPart: 'head',
    categories: ['hair', 'hats'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2"/></svg>',
  },
  {
    id: 'torso',
    name: 'Torso',
    svgPart: ['shoulder', 'cheast', 'stomach'],
    categories: ['shirts', 'jackets', 'hoodies', 'belts', 'underwear'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46 16 2 12 5 8 2 3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
  },
  {
    id: 'waist-legs',
    name: 'Waist & Legs',
    svgPart: ['legs'],
    categories: ['pants', 'jeans', 'socks'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12l-1 9-2.5 11h-3L10 11 8 22H5L6 2z"/></svg>',
  },
  {
    id: 'feet',
    name: 'Feet',
    svgPart: 'legs',
    categories: ['shoes'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18h5l2-4 3 2 4-6 4 8v2H3z"/></svg>',
  },
  {
    id: 'arm',
    name: 'Arms',
    svgPart: 'arm',
    categories: ['watches', 'bracelets'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  },
  {
    id: 'hands',
    name: 'Hands & Rings',
    svgPart: 'hands',
    categories: ['rings', 'gloves'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-4 0v3M14 10V4a2 2 0 0 0-4 0v7m0 0V4a2 2 0 0 0-4 0v8l-1.5-1.5a2 2 0 0 0-2.83 2.83L8 19.5A6 6 0 0 0 13.73 22H15a6 6 0 0 0 6-6v-5a2 2 0 0 0-4 0v1"/></svg>',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    svgPart: null,
    categories: ['glasses', 'jewelry', 'perfume', 'skincare'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  },
  {
    id: 'sets',
    name: 'Complete Sets',
    svgPart: null,
    categories: ['outfits'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  },
];

// Default profile structure
export function getDefaultProfile() {
  return {
    name: '',
    pronouns: '',
    photoUrl: null,
    measurements: {
      chest: null,
      waist: null,
      hips: null,
      shoulders: null,
      inseam: null,
      footLength: null,
      shoeSize: [],
      hands: {
        ringFinger: null,
        pinky: null,
        palmWidth: null,
        wrist: null,
      },
    },
    categories: {
      hair: {
        type: '',
        cutInstructions: '',
        products: [],
        specialNotes: '',
      },
      shirts: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      jackets: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      hoodies: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      pants: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      jeans: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      belts: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      shoes: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      socks: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      rings: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      watches: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      bracelets: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      gloves: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      glasses: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      jewelry: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      perfume: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      skincare: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      underwear: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
      hats: { brands: [], preferences: { textures: [], styles: [], colors: [], avoidList: [] } },
    },
    sets: [],
  };
}

// Category display names
export const CATEGORY_NAMES = {
  hair: 'Hair',
  shirts: 'Shirts',
  jackets: 'Jackets',
  hoodies: 'Hoodies',
  pants: 'Pants',
  jeans: 'Jeans',
  belts: 'Belts',
  shoes: 'Shoes',
  socks: 'Socks',
  rings: 'Rings',
  watches: 'Watches',
  bracelets: 'Bracelets',
  gloves: 'Gloves',
  glasses: 'Glasses',
  jewelry: 'Jewelry',
  perfume: 'Perfume / Cologne',
  skincare: 'Skincare',
  underwear: 'Underwear',
  hats: 'Hats',
  pants_fit: 'Pants Fit Notes',
  outfits: 'Complete Outfits',
};

// Dropdown options for fields that have common values
export const FIELD_OPTIONS = {
  hairType: [
    'Straight',
    'Wavy',
    'Curly',
    'Coily',
    'Thick straight',
    'Thin straight',
    'Loose waves',
    'Tight curls',
    'Afro',
    'Kinky',
  ],
};

// Zone accent color map (for JS usage)
export const ZONE_COLORS = {
  head: '#a78bfa',
  torso: '#3b82f6',
  'waist-legs': '#14b8a6',
  feet: '#f59e0b',
  arm: '#ef4444',
  hands: '#f97316',
  accessories: '#ec4899',
  sets: '#8b5cf6',
};

// Measurement field definitions
export const MEASUREMENT_FIELDS = {
  head: [],
  torso: [
    { key: 'shoulders', label: 'Shoulders', unit: 'cm', type: 'number' },
    { key: 'chest', label: 'Chest', unit: 'cm', type: 'number' },
    { key: 'waist', label: 'Waist', unit: 'cm', type: 'number' },
  ],
  'waist-legs': [
    { key: 'hips', label: 'Hips', unit: 'cm', type: 'number' },
    { key: 'inseam', label: 'Inseam', unit: 'cm', type: 'number' },
  ],
  feet: [
    { key: 'footLength', label: 'Foot Length', unit: 'cm', type: 'number' },
  ],
  arm: [
    { key: 'hands.wrist', label: 'Wrist', unit: 'cm', type: 'number' },
  ],
  hands: [
    { key: 'hands.ringFinger', label: 'Ring Finger', unit: 'mm', type: 'number' },
    { key: 'hands.pinky', label: 'Pinky', unit: 'mm', type: 'number' },
    { key: 'hands.palmWidth', label: 'Palm Width', unit: 'cm', type: 'number' },
  ],
  accessories: [],
  sets: [],
};
