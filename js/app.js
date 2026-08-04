// ── Entry point ──────────────────────────────────────────────
import { state, loadProfile } from './state.js';
import { render } from './render.js';
import { bindEvents } from './events.js';

async function init() {
  // Parse URL for shareId
  const path = window.location.pathname;
  const match = path.match(/^\/p\/([a-zA-Z0-9]+)/);

  if (match) {
    // Load existing profile
    const shareId = match[1];
    try {
      await loadProfile(shareId);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  // Render and bind events
  render();
  bindEvents();

  // Create zone panel container if it doesn't exist
  if (!document.getElementById('zonePanel')) {
    const panel = document.createElement('div');
    panel.id = 'zonePanel';
    panel.className = 'zone-panel';
    document.body.appendChild(panel);
  }
}

init();
