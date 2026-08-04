// ── Event handlers ───────────────────────────────────────────
import { state, saveProfile, loadProfile, api, convex, saveAuth, clearAuth } from './state.js';
import { render, renderZonePanel } from './render.js';
import { showToast, copyToClipboard, debounce, $, setNestedValue } from './utils.js';
import { exportProfile, exportTemplate, importProfile } from './export.js';

/** Bind all event listeners */
export function bindEvents() {
  document.addEventListener('click', handleClick);
  document.addEventListener('input', debounce(handleInput, 500));
  document.addEventListener('change', handleChange);
}

/** Handle all click events */
async function handleClick(e) {
  const target = e.target;

  // Zone clicks (body map SVG parts, zone sidebar cards)
  const zone = target.closest('.body-part, .zone-card, [data-zone]');
  if (zone) {
    const zoneId = zone.dataset.zone || zone.getAttribute('data-zone');
    if (zoneId && state.viewMode === 'edit') {
      state.activeZone = zoneId;
      renderZonePanel(zoneId);
      return;
    }
  }

  // Also handle clicks on SVG paths within body parts
  if (target.tagName === 'path' && target.parentElement.classList.contains('body-part')) {
    const zoneId = target.parentElement.dataset.zone;
    if (zoneId && state.viewMode === 'edit') {
      state.activeZone = zoneId;
      renderZonePanel(zoneId);
      return;
    }
  }

  // Action buttons
  const action = target.dataset.action;
  if (action) {
    e.preventDefault();
    await handleAction(action, target);
    return;
  }

  // Save profile
  if (target.id === 'saveProfileBtn') {
    e.preventDefault();
    await handleSaveProfile();
    return;
  }

  // Share profile
  if (target.id === 'shareProfileBtn') {
    e.preventDefault();
    openShareModal();
    return;
  }

  // Switch to edit mode
  if (target.id === 'switchToEditBtn') {
    e.preventDefault();
    state.viewMode = 'edit';
    render();
    return;
  }

  // Request edit access (password)
  if (target.id === 'requestEditBtn') {
    e.preventDefault();
    state.showPasswordModal = true;
    showPasswordModal();
    return;
  }

  // Export/Import
  if (target.id === 'exportProfileBtn') {
    e.preventDefault();
    exportProfile();
    return;
  }
  if (target.id === 'exportTemplateBtn') {
    e.preventDefault();
    exportTemplate();
    return;
  }

  // Auth toggle
  if (target.id === 'authToggle') {
    e.preventDefault();
    state.authPanelOpen = !state.authPanelOpen;
    $('authPanel').classList.toggle('open', state.authPanelOpen);
    return;
  }

  // Auth tabs
  if (target.classList.contains('auth-tab')) {
    handleAuthTab(target);
    return;
  }

  // Auth login
  if (target.id === 'authLoginBtn') {
    e.preventDefault();
    await handleLogin();
    return;
  }

  // Auth register
  if (target.id === 'authRegBtn') {
    e.preventDefault();
    await handleRegister();
    return;
  }

  // Auth logout
  if (target.id === 'authLogoutBtn') {
    e.preventDefault();
    handleLogout();
    return;
  }
}

/** Handle input changes */
function handleInput(e) {
  const target = e.target;

  // Profile name/pronouns
  if (target.id === 'profileName') {
    state.profile.name = target.value;
    return;
  }
  if (target.id === 'profilePronouns') {
    state.profile.pronouns = target.value;
    return;
  }

  // Measurement fields
  if (target.dataset.field) {
    const value = target.value ? parseFloat(target.value) : null;
    setNestedValue(state.profile.measurements, target.dataset.field, value);
    return;
  }

  // Brand fields
  if (target.dataset.brandField) {
    const { category, index, brandField } = target.dataset;
    state.profile.categories[category].brands[index][brandField] = target.value;
    return;
  }

  // Preference fields
  if (target.dataset.prefField) {
    const { category, prefField } = target.dataset;
    const values = target.value.split(',').map(v => v.trim()).filter(Boolean);
    state.profile.categories[category].preferences[prefField] = values;
    return;
  }

  // Hair fields (text inputs only — selects handled in handleChange)
  if (target.dataset.hairField && !target.dataset.selectFor) {
    state.profile.categories.hair[target.dataset.hairField] = target.value;
    return;
  }

  // Custom input for select+custom combos
  if (target.dataset.customFor) {
    if (target.dataset.hairField) {
      state.profile.categories.hair[target.dataset.hairField] = target.value;
    }
    return;
  }

  // Hair product fields
  if (target.dataset.hairProduct) {
    const { index, hairProduct } = target.dataset;
    state.profile.categories.hair.products[index][hairProduct] = target.value;
    return;
  }

  // Set fields
  if (target.dataset.setField) {
    const { index, setField } = target.dataset;
    state.profile.sets[index][setField] = target.value;
    return;
  }

  // Set item fields
  if (target.dataset.setItem) {
    const { setIndex, itemIndex, setItem } = target.dataset;
    state.profile.sets[setIndex].items[itemIndex][setItem] = target.value;
    return;
  }

  // Advanced toggle
  if (target.dataset.toggleAdvanced) {
    const category = target.dataset.toggleAdvanced;
    state.showAdvanced[category] = target.checked;
    renderZonePanel(state.activeZone);
    return;
  }
}

/** Handle select changes (dropdowns) */
function handleChange(e) {
  const target = e.target;

  // Import file input
  if (target.id === 'importFileInput') {
    const file = target.files[0];
    if (file) importProfile(file);
    target.value = '';
    return;
  }

  // Select+custom combo: toggle custom input visibility and update state
  if (target.dataset.selectFor) {
    const fieldId = target.dataset.selectFor;
    const customInput = target.parentElement.querySelector(`[data-custom-for="${fieldId}"]`);

    if (target.value === '__custom') {
      customInput?.classList.add('visible');
      customInput?.focus();
      if (target.dataset.hairField) {
        state.profile.categories.hair[target.dataset.hairField] = customInput?.value || '';
      }
    } else {
      customInput?.classList.remove('visible');
      if (target.dataset.hairField) {
        state.profile.categories.hair[target.dataset.hairField] = target.value;
      }
    }
    return;
  }

  // Advanced toggle (checkboxes fire change too)
  if (target.dataset.toggleAdvanced) {
    const category = target.dataset.toggleAdvanced;
    state.showAdvanced[category] = target.checked;
    renderZonePanel(state.activeZone);
    return;
  }
}

/** Handle action buttons */
async function handleAction(action, target) {
  const data = target.dataset;

  switch (action) {
    case 'closePanel':
      $('zonePanel').classList.remove('open');
      state.activeZone = null;
      break;

    case 'saveZone':
      await handleSaveProfile();
      showToast('Saved!');
      break;

    case 'addBrand': {
      const cat = state.profile.categories[data.category];
      cat.brands.push({ name: '', size: '', notes: '', preferred: false });
      renderZonePanel(state.activeZone);
      break;
    }

    case 'removeBrand': {
      const cat = state.profile.categories[data.category];
      cat.brands.splice(parseInt(data.index), 1);
      renderZonePanel(state.activeZone);
      break;
    }

    case 'addHairProduct':
      state.profile.categories.hair.products.push({ name: '', notes: '' });
      renderZonePanel(state.activeZone);
      break;

    case 'removeHairProduct':
      state.profile.categories.hair.products.splice(parseInt(data.index), 1);
      renderZonePanel(state.activeZone);
      break;

    case 'addSet':
      state.profile.sets.push({ name: '', items: [] });
      renderZonePanel(state.activeZone);
      break;

    case 'removeSet':
      state.profile.sets.splice(parseInt(data.index), 1);
      renderZonePanel(state.activeZone);
      break;

    case 'addSetItem': {
      const setIndex = parseInt(data.setIndex);
      state.profile.sets[setIndex].items.push({ category: '', brand: '', details: '' });
      renderZonePanel(state.activeZone);
      break;
    }

    case 'removeSetItem': {
      const { setIndex, itemIndex } = data;
      state.profile.sets[setIndex].items.splice(parseInt(itemIndex), 1);
      renderZonePanel(state.activeZone);
      break;
    }

    case 'copyShareLink':
      await copyToClipboard(window.location.origin + '/p/' + state.shareId);
      break;

    case 'closeShareModal':
      state.showShareModal = false;
      $('shareModal').remove();
      break;
  }
}

/** Save profile */
async function handleSaveProfile() {
  try {
    await saveProfile();
    showToast('Profile saved!');

    // Update UI if needed
    if ($('shareProfileBtn')) {
      $('shareProfileBtn').disabled = false;
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to save profile');
  }
}

/** Open share modal */
function openShareModal() {
  if (!state.shareId) return;

  const shareUrl = `${window.location.origin}/p/${state.shareId}`;

  const modal = document.createElement('div');
  modal.id = 'shareModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Share Your Profile</h2>
        <button class="close-btn" data-action="closeShareModal" aria-label="Close dialog">✕</button>
      </div>
      <div class="modal-body">
        <div class="share-url">
          <input type="text" value="${shareUrl}" readonly>
          <button class="btn" data-action="copyShareLink">Copy</button>
        </div>
        <div class="qr-code-container" id="qrCodeContainer"></div>
        <div class="password-section">
          <label>
            <input type="checkbox" id="setPasswordToggle"> Set password protection
          </label>
          <div id="passwordInput" style="display:none; margin-top: 12px;">
            <input type="password" placeholder="Enter password" id="sharePassword">
            <button class="btn btn-sm" id="savePasswordBtn">Save Password</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Generate QR code
  import('https://esm.sh/qrcode@1.5.3').then(QRCode => {
    QRCode.toCanvas(shareUrl, { width: 200 }, (err, canvas) => {
      if (!err) $('qrCodeContainer').appendChild(canvas);
    });
  });

  // Password toggle
  $('setPasswordToggle').addEventListener('change', (e) => {
    $('passwordInput').style.display = e.target.checked ? 'block' : 'none';
  });

  // Save password
  $('savePasswordBtn').addEventListener('click', async () => {
    const password = $('sharePassword').value;
    if (!password) return;

    try {
      await convex.mutation(api.profiles.updatePassword, {
        shareId: state.shareId,
        password,
      });
      state.hasPassword = true;
      showToast('Password saved!');
    } catch (err) {
      showToast('Failed to save password');
    }
  });
}

/** Show password modal */
function showPasswordModal() {
  const modal = document.createElement('div');
  modal.id = 'passwordModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Enter Password</h2>
      </div>
      <div class="modal-body">
        <input type="password" id="profilePassword" placeholder="Password">
        <button class="btn btn-primary" id="submitPasswordBtn">Submit</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  $('submitPasswordBtn').addEventListener('click', async () => {
    const password = $('profilePassword').value;
    try {
      await loadProfile(state.shareId, password);
      modal.remove();
      render();
    } catch (err) {
      showToast('Invalid password');
    }
  });
}

/** Auth handlers */
function handleAuthTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  const targetTab = tab.dataset.tab;
  $('authLoginForm').hidden = targetTab !== 'login';
  $('authRegisterForm').hidden = targetTab !== 'register';
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
    showToast(`Welcome back, ${username}!`);
    state.authPanelOpen = false;
    $('authPanel').classList.remove('open');
    render();
  } catch (err) {
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
    showToast(`Account created! Welcome, ${username}!`);
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
