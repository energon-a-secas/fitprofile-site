// Raw localStorage throws in private browsing, where the object exists but
// every access raises. These wrappers return a fallback instead. Storage
// keys and formats are unchanged, so existing saved data still loads.
import { safeGet, safeRemove, safeSet } from './neorgon-persist.js';

// ── State management ─────────────────────────────────────────
import { ConvexHttpClient } from "https://esm.sh/convex@1.16.2/browser";
import { getDefaultProfile, normalizeProfile } from './data.js';

export const convex = new ConvexHttpClient("https://adjoining-gnat-230.convex.cloud");

export const api = {
  auth: {
    register: "auth:register",
    login: "auth:login",
  },
  profiles: {
    getByShareId: "profiles:getByShareId",
    create: "profiles:create",
    save: "profiles:save",
    list: "profiles:list",
    updatePassword: "profiles:updatePassword",
    verifyPassword: "profiles:verifyPassword",
  },
};

const DRAFT_KEY = 'fitprofile-draft';
const AUTH_KEY = 'fitprofile-user';

// Mutable app state
export const state = {
  user: null,

  profile: getDefaultProfile(),
  shareId: null,
  hasPassword: false,
  isOwner: false,

  viewMode: 'edit',
  activeZone: null,
  showAdvanced: {},
  query: '',
  dirty: false,

  showPasswordModal: false,
  showShareModal: false,
  authPanelOpen: false,
};

/* ── Local draft ─────────────────────────────────────────────
   The profile survives a refresh whether or not Convex is reachable,
   keyed per shareId so two profiles never overwrite each other. */

function draftKey(shareId) {
  return shareId ? `${DRAFT_KEY}:${shareId}` : DRAFT_KEY;
}

export function saveDraft() {
  try {
    localStorage.setItem(draftKey(state.shareId), JSON.stringify({
      savedAt: Date.now(),
      profile: state.profile,
    }));
  } catch (err) {
    console.warn('Could not store draft locally:', err);
  }
}

/** Apply a locally stored draft. Returns true when one was found. */
export function loadDraft(shareId = null) {
  try {
    const raw = localStorage.getItem(draftKey(shareId));
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed?.profile) return false;
    state.profile = normalizeProfile(parsed.profile);
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(shareId = null) {
  safeRemove(draftKey(shareId));
}

/** A draft started before the first save moves under the new shareId. */
function migrateDraft(newShareId) {
  const anon = safeGet(DRAFT_KEY);
  if (anon) {
    safeSet(draftKey(newShareId), anon);
    safeRemove(DRAFT_KEY);
  }
}

export function markDirty() {
  state.dirty = true;
  saveDraft();
}

/* ── Remote profile ──────────────────────────────────────── */

export async function loadProfile(shareId, password = null) {
  const profile = await convex.query(api.profiles.getByShareId, { shareId });

  if (!profile) {
    state.shareId = shareId;
    state.profile = getDefaultProfile();
    state.isOwner = true;
    state.viewMode = 'edit';
    return;
  }

  state.shareId = shareId;
  state.hasPassword = profile.hasPassword;

  if (profile.hasPassword && !password) {
    state.viewMode = 'view';
    state.showPasswordModal = true;
    return;
  }

  if (password) {
    const result = await convex.mutation(api.profiles.verifyPassword, { shareId, password });
    if (!result.valid) throw new Error('Invalid password');
    state.isOwner = true;
  }

  // Reconcile against the current schema — a profile stored before a category
  // existed must not leave the renderer with missing branches.
  state.profile = normalizeProfile({
    name: profile.name,
    pronouns: profile.pronouns,
    photoUrl: profile.photoUrl,
    ...(profile.data || {}),
  });

  if (state.user && profile.userId === state.user.userId) {
    state.isOwner = true;
  }

  state.viewMode = state.isOwner ? 'edit' : 'view';
}

export async function saveProfile() {
  const data = {
    measurements: state.profile.measurements,
    categories: state.profile.categories,
    sets: state.profile.sets,
  };

  if (state.shareId) {
    await convex.mutation(api.profiles.save, {
      shareId: state.shareId,
      userId: state.user?.userId,
      name: state.profile.name,
      pronouns: state.profile.pronouns,
      photoUrl: state.profile.photoUrl,
      data,
    });
  } else {
    const { nanoid } = await import('https://esm.sh/nanoid@5.0.4');
    const shareId = nanoid(8);

    await convex.mutation(api.profiles.create, {
      shareId,
      userId: state.user?.userId,
      name: state.profile.name,
      pronouns: state.profile.pronouns,
      photoUrl: state.profile.photoUrl,
      data,
    });

    state.shareId = shareId;
    state.isOwner = true;
    migrateDraft(shareId);
    window.history.pushState({}, '', `/p/${shareId}`);
  }

  state.dirty = false;
  saveDraft();
  return state.shareId;
}

/* ── Auth ────────────────────────────────────────────────── */

export function loadAuth() {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      state.user = JSON.parse(stored);
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
  }
}

export function saveAuth(user) {
  state.user = user;
  safeSet(AUTH_KEY, JSON.stringify(user));
}

export function clearAuth() {
  state.user = null;
  safeRemove(AUTH_KEY);
}

loadAuth();
