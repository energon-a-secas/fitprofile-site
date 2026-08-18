// Generic helpers come from the DOM Kit (js/neorgon-dom.js, vendored from
// packages/neorgon-ui/dom/). They are re-exported so every existing
// `import { escHtml } from './utils.js'` keeps working.
//
// Do not edit js/neorgon-dom.js. Edit the canonical source and run
// packages/neorgon-ui/sync-dom.sh.
import { escHtml, debounce, showToast as kitToast } from './neorgon-dom.js';
export { escHtml, debounce };

// ── Shared utilities ─────────────────────────────────────────
// Small, pure helper functions used across multiple modules.

/**
 * Element lookup by ID.
 * Deliberately uncached — `render()` replaces whole subtrees, so a cached
 * node can outlive the DOM it belonged to and silently swallow writes.
 */
export function $(id) {
  return document.getElementById(id);
}


/** Show a temporary toast notification. */
/** This site's own toast contract, rendered by the kit. */
export function showToast(msg) {
  return kitToast(msg, { id: 'app-toast', className: 'toast',
    visibleClass: 'visible', duration: 2000 });
}



// Get nested property value
export function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Set nested property value
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy');
  }
}
