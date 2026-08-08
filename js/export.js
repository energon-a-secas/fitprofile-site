// ── Export & Import ──────────────────────────────────────────
import { state, markDirty } from './state.js';
import { getDefaultProfile, normalizeProfile } from './data.js';
import { showToast } from './utils.js';
import { render } from './render.js';

export function exportProfile() {
  const profile = state.profile;
  const data = {
    fitprofile: '1.0',
    exportedAt: new Date().toISOString(),
    name: profile.name,
    pronouns: profile.pronouns,
    measurements: profile.measurements,
    categories: stripEmptyBrands(profile.categories),
    sets: profile.sets,
  };

  const slug = profile.name
    ? profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'profile';
  download(data, `fitprofile-${slug}.json`);
  showToast('Profile exported');
}

export function exportTemplate() {
  const blank = getDefaultProfile();
  const data = {
    fitprofile: '1.0',
    exportedAt: new Date().toISOString(),
    name: '',
    pronouns: '',
    measurements: blank.measurements,
    categories: blank.categories,
    sets: [],
  };

  download(data, 'fitprofile-template.json');
  showToast('Template exported');
}

export function importProfile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    let data;
    try {
      data = JSON.parse(e.target.result);
    } catch {
      showToast('Invalid JSON file');
      return;
    }

    const check = validateImport(data);
    if (!check.valid) {
      showToast(check.error);
      return;
    }

    state.profile = normalizeProfile({
      name: data.name,
      pronouns: data.pronouns,
      photoUrl: state.profile.photoUrl,
      measurements: data.measurements,
      categories: data.categories,
      sets: data.sets,
    });

    markDirty();
    render();
    showToast('Profile imported');
  };
  reader.readAsText(file);
}

function validateImport(data) {
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'File is not a valid JSON object' };
  }
  if (!data.fitprofile) {
    return { valid: false, error: 'Not a FitProfile export (missing version key)' };
  }
  if (data.measurements && typeof data.measurements !== 'object') {
    return { valid: false, error: 'Invalid measurements format' };
  }
  if (data.categories && typeof data.categories !== 'object') {
    return { valid: false, error: 'Invalid categories format' };
  }
  return { valid: true };
}

/** Drop rows the user added but never filled — a blank row carries no meaning. */
function stripEmptyBrands(categories) {
  const cleaned = {};
  for (const [key, cat] of Object.entries(categories)) {
    if (cat.brands) {
      cleaned[key] = {
        ...cat,
        brands: cat.brands.filter(hasContent),
      };
    } else {
      cleaned[key] = cat;
    }
  }
  return cleaned;
}

function hasContent(item) {
  return Boolean(item.name || item.size || item.fit || item.notes || item.favorite);
}

function download(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
