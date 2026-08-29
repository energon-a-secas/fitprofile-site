// ── Entry point ──────────────────────────────────────────────
import { state, loadProfile, loadDraft } from './state.js';
import { render } from './render.js';
import { bindEvents } from './events.js';
import { showToast } from './utils.js';

function ensureZonePanel() {
  if (document.getElementById('zonePanel')) return;
  const panel = document.createElement('div');
  panel.id = 'zonePanel';
  panel.className = 'zone-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-labelledby', 'zonePanelTitle');
  panel.setAttribute('aria-hidden', 'true');
  document.body.appendChild(panel);
}

async function init() {
  const match = window.location.pathname.match(/^\/p\/([a-zA-Z0-9_-]+)/);

  if (match) {
    const shareId = match[1];
    try {
      await loadProfile(shareId);
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Fall back to whatever this device already holds for that profile
      if (loadDraft(shareId)) {
        state.shareId = shareId;
        state.isOwner = true;
        showToast('Offline: showing the copy stored on this device');
      } else {
        showToast('Could not load that profile');
      }
    }
  } else if (loadDraft()) {
    state.dirty = true;
  }

  ensureZonePanel();
  render();
  bindEvents();
}

init();
