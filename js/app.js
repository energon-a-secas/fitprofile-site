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

/**
 * Two ways in, one meaning. `/p/<id>` is the form handed out and the form the
 * address bar keeps, but GitHub Pages answers it with `404.html`, which bounces
 * to `/?p=<id>` so the root page can serve HTTP 200. Accept both, and put the
 * canonical path back before anything renders, so what a visitor copies out of
 * the address bar is what the Copy button gives them.
 *
 * The alphabet is nanoid's, `[a-zA-Z0-9_-]`: a narrower pattern silently fails
 * on roughly a quarter of generated ids.
 */
function shareIdFromLocation() {
  const path = window.location.pathname.match(/^\/p\/([a-zA-Z0-9_-]+)/);
  if (path) return path[1];

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('p');
  if (!fromQuery || !/^[a-zA-Z0-9_-]+$/.test(fromQuery)) return null;

  // Only `p` is consumed; anything else in the query, `?theme=` above all, has
  // to survive into the canonical URL or it is lost on the next reload.
  params.delete('p');
  const rest = params.toString();
  window.history.replaceState({}, '', `/p/${fromQuery}${rest ? `?${rest}` : ''}${window.location.hash}`);
  return fromQuery;
}

async function init() {
  const shareId = shareIdFromLocation();

  if (shareId) {
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
