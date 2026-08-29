// Body zones for the interactive map
export const BODY_ZONES = [
  {
    id: 'head',
    name: 'Head & Hair',
    hint: 'Hair type, cut instructions, hat sizes',
    categories: ['hair', 'hats'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2"/></svg>',
  },
  {
    id: 'torso',
    name: 'Torso',
    hint: 'Shirts, jackets, hoodies: the sizes people ask for most',
    categories: ['shirts', 'jackets', 'hoodies', 'belts', 'underwear'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46 16 2 12 5 8 2 3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
  },
  {
    id: 'waist-legs',
    name: 'Waist & Legs',
    hint: 'Pants and jeans: waist × length varies wildly by brand',
    categories: ['pants', 'jeans', 'socks'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12l-1 9-2.5 11h-3L10 11 8 22H5L6 2z"/></svg>',
  },
  {
    id: 'feet',
    name: 'Feet',
    hint: 'Shoe sizes per brand: record every system you know',
    categories: ['shoes'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18h5l2-4 3 2 4-6 4 8v2H3z"/></svg>',
  },
  {
    id: 'arm',
    name: 'Arms & Wrists',
    hint: 'Wrist size for watches and bracelets',
    categories: ['watches', 'bracelets'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  },
  {
    id: 'hands',
    name: 'Hands & Rings',
    hint: 'Ring sizes in mm: the detail nobody remembers',
    categories: ['rings', 'gloves'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-4 0v3M14 10V4a2 2 0 0 0-4 0v7m0 0V4a2 2 0 0 0-4 0v8l-1.5-1.5a2 2 0 0 0-2.83 2.83L8 19.5A6 6 0 0 0 13.73 22H15a6 6 0 0 0 6-6v-5a2 2 0 0 0-4 0v1"/></svg>',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    hint: 'Glasses, jewellery, scent, skincare',
    categories: ['glasses', 'jewelry', 'perfume', 'skincare'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  },
  {
    id: 'sets',
    name: 'Complete Sets',
    hint: 'Outfits that already work, head to toe',
    categories: ['outfits'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  },
];

// Zones drawn on the body map; the rest are reachable from the zone list only
export const MAPPED_ZONES = ['head', 'torso', 'waist-legs', 'feet', 'arm', 'hands'];

// Size systems a stored size can be expressed in
export const SIZE_SYSTEMS = {
  letter: { label: 'Letter', example: 'M, L, XL' },
  numeric: { label: 'Numeric', example: '48, 50' },
  eu: { label: 'EU', example: '42' },
  us: { label: 'US', example: '9.5' },
  uk: { label: 'UK', example: '8.5' },
  wl: { label: 'Waist × Length', example: '32 × 30' },
  cm: { label: 'cm', example: '86' },
  mm: { label: 'mm', example: '18.5' },
  one: { label: 'One size', example: '' },
};

// How an item actually fits — the part a size label never tells you
export const FIT_OPTIONS = [
  { value: 'tight', label: 'Tight' },
  { value: 'perfect', label: 'Perfect' },
  { value: 'loose', label: 'Loose' },
];

// Per-category defaults: preselected size system and an example brand
export const CATEGORY_META = {
  shirts: { system: 'letter', placeholder: 'Uniqlo' },
  jackets: { system: 'letter', placeholder: 'Arc’teryx' },
  hoodies: { system: 'letter', placeholder: 'Champion' },
  underwear: { system: 'letter', placeholder: 'Calvin Klein' },
  hats: { system: 'letter', placeholder: 'New Era' },
  pants: { system: 'wl', placeholder: 'Dockers' },
  jeans: { system: 'wl', placeholder: 'Levi’s 511' },
  socks: { system: 'letter', placeholder: 'Darn Tough' },
  belts: { system: 'cm', placeholder: 'Anderson’s' },
  shoes: { system: 'us', placeholder: 'Nike Air Max' },
  rings: { system: 'mm', placeholder: 'Signet, left pinky' },
  watches: { system: 'mm', placeholder: 'Seiko SKX' },
  bracelets: { system: 'mm', placeholder: 'Beaded' },
  gloves: { system: 'letter', placeholder: 'Hestra' },
  glasses: { system: 'one', placeholder: 'Ray-Ban Clubmaster' },
  jewelry: { system: 'one', placeholder: 'Chain, 50cm' },
  perfume: { system: 'one', placeholder: 'Le Labo Santal 33' },
  skincare: { system: 'one', placeholder: 'CeraVe cleanser' },
};

const ITEM_CATEGORIES = [
  'shirts', 'jackets', 'hoodies', 'belts', 'underwear', 'hats',
  'pants', 'jeans', 'socks', 'shoes',
  'rings', 'watches', 'bracelets', 'gloves',
  'glasses', 'jewelry', 'perfume', 'skincare',
];

let _uidCounter = 0;
/** Stable row identity, so an edit never depends on array position. */
export function uid() {
  _uidCounter += 1;
  return `i${_uidCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A stored item: the brand plus everything a size label leaves out. */
export function createItem(category) {
  return {
    id: uid(),
    name: '',
    size: '',
    sizeSystem: CATEGORY_META[category]?.system || 'letter',
    fit: '',
    favorite: false,
    notes: '',
  };
}

export function createProduct() {
  return { id: uid(), name: '', notes: '' };
}

export function createSet() {
  return { id: uid(), name: '', items: [] };
}

export function createSetItem() {
  return { id: uid(), category: '', brand: '', details: '' };
}

// Default profile structure
export function getDefaultProfile() {
  const categories = {
    hair: {
      type: '',
      cutInstructions: '',
      products: [],
      specialNotes: '',
    },
  };
  for (const key of ITEM_CATEGORIES) {
    categories[key] = {
      brands: [],
      preferences: { textures: [], styles: [], colors: [], avoidList: [] },
    };
  }

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
      hands: {
        ringFinger: null,
        pinky: null,
        palmWidth: null,
        wrist: null,
      },
    },
    categories,
    sets: [],
  };
}

/**
 * Reconcile a loaded profile against the current schema.
 * A profile saved before a category existed must not crash the renderer.
 */
export function normalizeProfile(raw) {
  const base = getDefaultProfile();
  if (!raw || typeof raw !== 'object') return base;

  base.name = typeof raw.name === 'string' ? raw.name : '';
  base.pronouns = typeof raw.pronouns === 'string' ? raw.pronouns : '';
  base.photoUrl = raw.photoUrl || null;

  const m = raw.measurements;
  if (m && typeof m === 'object') {
    for (const key of ['chest', 'waist', 'hips', 'shoulders', 'inseam', 'footLength']) {
      base.measurements[key] = toNumberOrNull(m[key]);
    }
    if (m.hands && typeof m.hands === 'object') {
      for (const key of ['ringFinger', 'pinky', 'palmWidth', 'wrist']) {
        base.measurements.hands[key] = toNumberOrNull(m.hands[key]);
      }
    }
  }

  const cats = raw.categories;
  if (cats && typeof cats === 'object') {
    if (cats.hair && typeof cats.hair === 'object') {
      base.categories.hair.type = str(cats.hair.type);
      base.categories.hair.cutInstructions = str(cats.hair.cutInstructions);
      base.categories.hair.specialNotes = str(cats.hair.specialNotes);
      base.categories.hair.products = asArray(cats.hair.products).map(p => ({
        id: p?.id || uid(),
        name: str(p?.name),
        notes: str(p?.notes),
      }));
    }
    for (const key of ITEM_CATEGORIES) {
      const cat = cats[key];
      if (!cat || typeof cat !== 'object') continue;
      base.categories[key].brands = asArray(cat.brands).map(b => normalizeItem(b, key));
      const prefs = cat.preferences;
      if (prefs && typeof prefs === 'object') {
        for (const p of ['textures', 'styles', 'colors', 'avoidList']) {
          base.categories[key].preferences[p] = asArray(prefs[p]).map(str).filter(Boolean);
        }
      }
    }
  }

  base.sets = asArray(raw.sets).map(s => ({
    id: s?.id || uid(),
    name: str(s?.name),
    items: asArray(s?.items).map(it => ({
      id: it?.id || uid(),
      category: str(it?.category),
      brand: str(it?.brand),
      details: str(it?.details),
    })),
  }));

  return base;
}

/** Upgrade a legacy `{name, size, notes}` row to the current item shape. */
function normalizeItem(raw, category) {
  const item = createItem(category);
  if (!raw || typeof raw !== 'object') return item;
  item.id = raw.id || item.id;
  item.name = str(raw.name);
  item.size = str(raw.size);
  item.sizeSystem = SIZE_SYSTEMS[raw.sizeSystem] ? raw.sizeSystem : item.sizeSystem;
  item.fit = FIT_OPTIONS.some(f => f.value === raw.fit) ? raw.fit : '';
  item.favorite = raw.favorite === true || raw.preferred === true;
  item.notes = str(raw.notes);
  return item;
}

function str(v) {
  return typeof v === 'string' ? v : '';
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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

// Zone accent colours (JS-side mirror of the CSS custom properties)
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
