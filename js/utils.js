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

/** Escape HTML special characters. */
export function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Show a temporary toast notification. */
let _toastTimer = null;
export function showToast(msg) {
  let el = document.getElementById('app-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  // Announced by screen readers. Without these the toast is
  // invisible to anyone not looking at that corner of the screen.
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), 2000);
}

/** Simple debounce. */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
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
