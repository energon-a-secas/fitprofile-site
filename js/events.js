// ── Event handlers ───────────────────────────────────────────
import {
  state, saveProfile, loadProfile, api, convex, saveAuth, clearAuth, markDirty,
} from './state.js';
import {
  render, renderZonePanel, refreshCategory, refreshHair, refreshSets,
  refreshZoneCounts, refreshSaveState, refreshSearch, syncZoneActive,
} from './render.js';
import { showToast, copyToClipboard, debounce, $, setNestedValue } from './utils.js';
import { exportProfile, exportTemplate, importProfile } from './export.js';
import { createItem, createProduct, createSet, createSetItem } from './data.js';

/** Bind all event listeners. */
export function bindEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('beforeunload', warnIfUnsaved);
}

/* ── Clicks ──────────────────────────────────────────────── */

async function handleClick(e) {
  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    e.preventDefault();
    await handleAction(actionEl.dataset.action, actionEl);
    return;
  }

  // A search hit jumps straight to the zone that holds it
  const hit = e.target.closest('.search-hit');
  if (hit?.dataset.zone) {
    openZone(hit.dataset.zone);
    return;
  }

  // Body-map region or zone card
  const zoneEl = e.target.closest('.hit-zone, .zone-card');
  if (zoneEl && state.viewMode === 'edit') {
    openZone(zoneEl.dataset.zone);
    return;
  }

  const id = e.target.id;

  if (id === 'saveProfileBtn') { e.preventDefault(); await handleSaveProfile(); return; }
  if (id === 'shareProfileBtn') { e.preventDefault(); openShareModal(); return; }
  if (id === 'switchToEditBtn') { e.preventDefault(); state.viewMode = 'edit'; render(); return; }
  if (id === 'requestEditBtn') { e.preventDefault(); showPasswordModal(); return; }
  if (id === 'exportProfileBtn') { e.preventDefault(); exportProfile(); return; }
  if (id === 'exportTemplateBtn') { e.preventDefault(); exportTemplate(); return; }

  if (id === 'authToggle') {
    e.preventDefault();
    state.authPanelOpen = !state.authPanelOpen;
    $('authPanel')?.classList.toggle('open', state.authPanelOpen);
    return;
  }
  if (e.target.classList.contains('auth-tab')) { handleAuthTab(e.target); return; }
  if (id === 'authLoginBtn') { e.preventDefault(); await handleLogin(); return; }
  if (id === 'authRegBtn') { e.preventDefault(); await handleRegister(); return; }
  if (id === 'authLogoutBtn') { e.preventDefault(); handleLogout(); return; }
}

function openZone(zoneId) {
  if (!zoneId) return;
  state.activeZone = zoneId;
  renderZonePanel(zoneId);
}

function closePanel() {
  const panel = $('zonePanel');
  panel?.classList.remove('open');
  panel?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('panel-open');
  state.activeZone = null;
  syncZoneActive(null);
  refreshZoneCounts();
}

/* ── Keyboard ────────────────────────────────────────────── */

function handleKeydown(e) {
  if (e.key === 'Escape') {
    if ($('zonePanel')?.classList.contains('open')) {
      closePanel();
      return;
    }
    document.querySelector('.modal')?.remove();
    return;
  }

  // SVG regions are not native buttons — give them button semantics
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('hit-zone')) {
    e.preventDefault();
    openZone(e.target.dataset.zone);
    return;
  }

  // Enter in a row's last field adds the next row
  if (e.key === 'Enter' && e.target.dataset?.itemField === 'notes') {
    e.preventDefault();
    addItem(e.target.dataset.category);
    return;
  }
  if (e.key === 'Enter' && e.target.dataset?.hairProduct === 'notes') {
    e.preventDefault();
    addHairProduct();
  }
}

/* ── Input ───────────────────────────────────────────────────
   Typing updates state immediately and only repaints the save badge; the
   debounced pass does the bookkeeping, so keystrokes never rebuild a form
   (which is what used to steal focus mid-word). */

function handleInput(e) {
  const t = e.target;

  if (t.id === 'globalSearch') {
    state.query = t.value;
    debouncedSearch();
    return;
  }

  if (t.id === 'profileName') { state.profile.name = t.value; afterEdit(); return; }
  if (t.id === 'profilePronouns') { state.profile.pronouns = t.value; afterEdit(); return; }

  if (t.dataset.field) {
    const parsed = t.value === '' ? null : parseFloat(t.value);
    setNestedValue(state.profile.measurements, t.dataset.field, Number.isFinite(parsed) ? parsed : null);
    afterEdit();
    return;
  }

  if (t.dataset.itemField) {
    const item = findItem(t.dataset.category, t.dataset.id);
    if (item) {
      item[t.dataset.itemField] = t.value;
      afterEdit();
    }
    return;
  }

  if (t.dataset.prefField) {
    const { category, prefField } = t.dataset;
    state.profile.categories[category].preferences[prefField] =
      t.value.split(',').map(v => v.trim()).filter(Boolean);
    afterEdit();
    return;
  }

  if (t.dataset.hairField && !t.dataset.selectFor) {
    state.profile.categories.hair[t.dataset.hairField] = t.value;
    afterEdit();
    return;
  }

  if (t.dataset.customFor && t.dataset.hairField) {
    state.profile.categories.hair[t.dataset.hairField] = t.value;
    afterEdit();
    return;
  }

  if (t.dataset.hairProduct) {
    const product = state.profile.categories.hair.products.find(p => p.id === t.dataset.id);
    if (product) {
      product[t.dataset.hairProduct] = t.value;
      afterEdit();
    }
    return;
  }

  if (t.dataset.setField) {
    const set = findSet(t.dataset.id);
    if (set) {
      set[t.dataset.setField] = t.value;
      afterEdit();
    }
    return;
  }

  if (t.dataset.setItem) {
    const item = findSet(t.dataset.setId)?.items.find(i => i.id === t.dataset.id);
    if (item) {
      item[t.dataset.setItem] = t.value;
      afterEdit();
    }
  }
}

const debouncedSearch = debounce(() => refreshSearch(), 180);

const debouncedPersist = debounce(() => {
  markDirty();
  refreshSaveState();
  refreshZoneCounts();
}, 400);

function afterEdit() {
  state.dirty = true;
  refreshSaveState();
  debouncedPersist();
}

/* ── Change (selects, checkboxes, file) ──────────────────── */

function handleChange(e) {
  const t = e.target;

  if (t.id === 'importFileInput') {
    const file = t.files[0];
    if (file) importProfile(file);
    t.value = '';
    return;
  }

  if (t.dataset.itemField === 'sizeSystem') {
    const item = findItem(t.dataset.category, t.dataset.id);
    if (item) {
      item.sizeSystem = t.value;
      if (t.value === 'one') item.size = '';
      afterEdit();
      refreshCategory(t.dataset.category);
    }
    return;
  }

  if (t.dataset.selectFor) {
    const customInput = t.parentElement.querySelector(`[data-custom-for="${t.dataset.selectFor}"]`);
    if (t.value === '__custom') {
      customInput?.classList.add('visible');
      customInput?.focus();
      if (t.dataset.hairField) {
        state.profile.categories.hair[t.dataset.hairField] = customInput?.value || '';
      }
    } else {
      customInput?.classList.remove('visible');
      if (t.dataset.hairField) {
        state.profile.categories.hair[t.dataset.hairField] = t.value;
      }
    }
    afterEdit();
    return;
  }

  if (t.dataset.toggleAdvanced) {
    const category = t.dataset.toggleAdvanced;
    state.showAdvanced[category] = t.checked;
    refreshCategory(category);
  }
}

/* ── Actions ─────────────────────────────────────────────── */

async function handleAction(action, el) {
  const d = el.dataset;

  switch (action) {
    case 'closePanel':
      closePanel();
      break;

    case 'clearSearch': {
      state.query = '';
      const input = $('globalSearch');
      if (input) input.value = '';
      refreshSearch();
      break;
    }

    case 'addBrand':
      addItem(d.category);
      break;

    case 'removeBrand': {
      const cat = state.profile.categories[d.category];
      cat.brands = cat.brands.filter(b => b.id !== d.id);
      afterEdit();
      refreshCategory(d.category);
      break;
    }

    case 'toggleFavorite': {
      const item = findItem(d.category, d.id);
      if (item) {
        item.favorite = !item.favorite;
        afterEdit();
        refreshCategory(d.category);
      }
      break;
    }

    case 'setFit': {
      const item = findItem(d.category, d.id);
      if (item) {
        item.fit = item.fit === d.fit ? '' : d.fit;
        afterEdit();
        refreshCategory(d.category);
      }
      break;
    }

    case 'addHairProduct':
      addHairProduct();
      break;

    case 'removeHairProduct':
      state.profile.categories.hair.products =
        state.profile.categories.hair.products.filter(p => p.id !== d.id);
      afterEdit();
      refreshHair();
      break;

    case 'addSet': {
      const set = createSet();
      state.profile.sets.push(set);
      afterEdit();
      refreshSets();
      focusRow(set.id);
      break;
    }

    case 'removeSet':
      state.profile.sets = state.profile.sets.filter(s => s.id !== d.id);
      afterEdit();
      refreshSets();
      break;

    case 'addSetItem': {
      const set = findSet(d.setId);
      if (set) {
        const item = createSetItem();
        set.items.push(item);
        afterEdit();
        refreshSets();
        focusRow(item.id);
      }
      break;
    }

    case 'removeSetItem': {
      const set = findSet(d.setId);
      if (set) {
        set.items = set.items.filter(i => i.id !== d.id);
        afterEdit();
        refreshSets();
      }
      break;
    }

    case 'copyShareLink':
      await copyToClipboard(`${window.location.origin}/p/${state.shareId}`);
      break;

    case 'closeShareModal':
      state.showShareModal = false;
      document.getElementById('shareModal')?.remove();
      break;
  }
}

/** Add a row and put the cursor in it — no hunting for the new field. */
function addItem(category) {
  const cat = state.profile.categories[category];
  if (!cat) return;
  const item = createItem(category);
  cat.brands.push(item);
  afterEdit();
  refreshCategory(category);
  focusRow(item.id);
}

function addHairProduct() {
  const product = createProduct();
  state.profile.categories.hair.products.push(product);
  afterEdit();
  refreshHair();
  focusRow(product.id);
}

function focusRow(itemId) {
  const row = document.querySelector(`[data-item-id="${itemId}"]`);
  row?.querySelector('input')?.focus();
}

function findItem(category, id) {
  return state.profile.categories[category]?.brands.find(b => b.id === id);
}

function findSet(id) {
  return state.profile.sets.find(s => s.id === id);
}

/* ── Save & share ────────────────────────────────────────── */

async function handleSaveProfile() {
  const btn = $('saveProfileBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    await saveProfile();
    showToast('Profile saved');
    refreshSaveState();
    const shareBtn = $('shareProfileBtn');
    if (shareBtn) shareBtn.disabled = false;
  } catch (err) {
    console.error(err);
    showToast('Could not reach the server: changes are stored on this device');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save & get link'; }
  }
}

function warnIfUnsaved(e) {
  if (!state.dirty) return;
  e.preventDefault();
  e.returnValue = '';
}

function openShareModal() {
  if (!state.shareId) return;
  const shareUrl = `${window.location.origin}/p/${state.shareId}`;

  document.getElementById('shareModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'shareModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Share Your Profile</h2>
        <button class="close-btn" data-action="closeShareModal" aria-label="Close dialog">&times;</button>
      </div>
      <div class="modal-body">
        <div class="share-url">
          <input type="text" value="${shareUrl}" readonly aria-label="Share link">
          <button class="btn" data-action="copyShareLink">Copy</button>
        </div>
        <div class="qr-code-container"></div>
        <div class="password-section">
          <label>
            <input type="checkbox" id="setPasswordToggle"> Set password protection
          </label>
          <div class="password-input" hidden>
            <input type="password" placeholder="Enter password" id="sharePassword">
            <button class="btn btn-sm" id="savePasswordBtn">Save Password</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Query within the modal — a cached id lookup would resolve to a removed node
  const qrHost = modal.querySelector('.qr-code-container');
  import('https://esm.sh/qrcode@1.5.3')
    .then(QRCode => QRCode.toCanvas(shareUrl, { width: 200 }, (err, canvas) => {
      if (!err && canvas) qrHost.appendChild(canvas);
    }))
    .catch(() => { qrHost.textContent = 'QR code unavailable offline.'; });

  const passwordInput = modal.querySelector('.password-input');
  modal.querySelector('#setPasswordToggle').addEventListener('change', (e) => {
    passwordInput.hidden = !e.target.checked;
  });

  modal.querySelector('#savePasswordBtn').addEventListener('click', async () => {
    const password = modal.querySelector('#sharePassword').value;
    if (!password) return;
    try {
      await convex.mutation(api.profiles.updatePassword, { shareId: state.shareId, password });
      state.hasPassword = true;
      showToast('Password saved');
    } catch {
      showToast('Failed to save password');
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

function showPasswordModal() {
  const modal = document.createElement('div');
  modal.id = 'passwordModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header"><h2>Enter Password</h2></div>
      <div class="modal-body">
        <input type="password" id="profilePassword" placeholder="Password" aria-label="Password">
        <button class="btn btn-primary" id="submitPasswordBtn">Submit</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#profilePassword').focus();

  modal.querySelector('#submitPasswordBtn').addEventListener('click', async () => {
    const password = modal.querySelector('#profilePassword').value;
    try {
      await loadProfile(state.shareId, password);
      modal.remove();
      render();
    } catch {
      showToast('Invalid password');
    }
  });
}

/* ── Auth ────────────────────────────────────────────────── */

function handleAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  $('authLoginForm').hidden = tab.dataset.tab !== 'login';
  $('authRegisterForm').hidden = tab.dataset.tab !== 'register';
}

async function handleLogin() {
  const username = $('authLoginUser').value;
  const password = $('authLoginPass').value;
  if (!username || !password) {
    showToast('Please enter username and password');
    return;
  }
  try {
    const result = await convex.mutation(api.auth.login, { username, password });
    saveAuth(result);
    showToast(`Welcome back, ${username}`);
    state.authPanelOpen = false;
    $('authPanel').classList.remove('open');
    render();
  } catch {
    showToast('Login failed');
  }
}

async function handleRegister() {
  const username = $('authRegUser').value;
  const password = $('authRegPass').value;
  if (!username || !password) {
    showToast('Please enter username and password');
    return;
  }
  try {
    const result = await convex.mutation(api.auth.register, { username, password });
    saveAuth(result);
    showToast(`Account created: welcome, ${username}`);
    state.authPanelOpen = false;
    $('authPanel').classList.remove('open');
    render();
  } catch (err) {
    showToast(err.message || 'Registration failed');
  }
}

function handleLogout() {
  clearAuth();
  showToast('Logged out');
  state.authPanelOpen = false;
  $('authPanel').classList.remove('open');
  render();
}
