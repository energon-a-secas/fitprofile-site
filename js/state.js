// ── State management ─────────────────────────────────────────
import { ConvexHttpClient } from "https://esm.sh/convex@1.16.2/browser";
import { getDefaultProfile } from './data.js';

// Convex client
export const convex = new ConvexHttpClient("https://adjoining-gnat-230.convex.cloud");

// API function references
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

// Mutable app state
export const state = {
  // Auth
  user: null, // { userId, username }

  // Current profile
  profile: getDefaultProfile(),
  shareId: null,
  hasPassword: false,
  isOwner: false, // true if user created this profile or entered correct password

  // UI state
  viewMode: 'edit', // 'edit' | 'view'
  activeZone: null,
  showAdvanced: {}, // { [category]: boolean }

  // Modals
  showPasswordModal: false,
  showShareModal: false,

  // Auth panel
  authPanelOpen: false,
};

// Load profile from shareId
export async function loadProfile(shareId, password = null) {
  try {
    const profile = await convex.query(api.profiles.getByShareId, { shareId });

    if (!profile) {
      // New profile
      state.shareId = shareId;
      state.profile = getDefaultProfile();
      state.isOwner = true;
      state.viewMode = 'edit';
      return;
    }

    // Existing profile
    state.shareId = shareId;
    state.hasPassword = profile.hasPassword;

    if (profile.hasPassword && !password) {
      // Requires password
      state.viewMode = 'view';
      state.showPasswordModal = true;
      return;
    }

    if (password) {
      // Verify password
      const result = await convex.mutation(api.profiles.verifyPassword, { shareId, password });
      if (!result.valid) {
        throw new Error('Invalid password');
      }
      state.isOwner = true;
    }

    // Load profile data
    state.profile.name = profile.name || '';
    state.profile.pronouns = profile.pronouns || '';
    state.profile.photoUrl = profile.photoUrl || null;
    Object.assign(state.profile, profile.data);

    // Check if user owns this profile
    if (state.user && profile.userId === state.user.userId) {
      state.isOwner = true;
    }

    state.viewMode = state.isOwner ? 'edit' : 'view';
  } catch (err) {
    console.error('Failed to load profile:', err);
    throw err;
  }
}

// Save profile
export async function saveProfile() {
  try {
    const data = {
      measurements: state.profile.measurements,
      categories: state.profile.categories,
      sets: state.profile.sets,
    };

    if (state.shareId) {
      // Update existing
      await convex.mutation(api.profiles.save, {
        shareId: state.shareId,
        userId: state.user?.userId,
        name: state.profile.name,
        pronouns: state.profile.pronouns,
        photoUrl: state.profile.photoUrl,
        data,
      });
    } else {
      // Create new - generate shareId client-side
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

      // Update URL without reload
      const newUrl = `/p/${shareId}`;
      window.history.pushState({}, '', newUrl);
    }

    return state.shareId;
  } catch (err) {
    console.error('Failed to save profile:', err);
    throw err;
  }
}

// Auth helpers
export function loadAuth() {
  const stored = localStorage.getItem('fitprofile-user');
  if (stored) {
    try {
      state.user = JSON.parse(stored);
    } catch (err) {
      localStorage.removeItem('fitprofile-user');
    }
  }
}

export function saveAuth(user) {
  state.user = user;
  localStorage.setItem('fitprofile-user', JSON.stringify(user));
}

export function clearAuth() {
  state.user = null;
  localStorage.removeItem('fitprofile-user');
}

// Initialize on load
loadAuth();
