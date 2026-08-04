// ── DOM rendering ────────────────────────────────────────────
import { state } from './state.js';
import { escHtml, $ } from './utils.js';
import { BODY_ZONES, CATEGORY_NAMES, MEASUREMENT_FIELDS, ZONE_COLORS, FIELD_OPTIONS } from './data.js';

const TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>';

export function render() {
  if (state.viewMode === 'view') {
    renderViewMode();
  } else {
    renderEditMode();
  }
}

function renderEditMode() {
  const main = $('main');
  if (!main) return;

  main.innerHTML = `
    <div class="container">
      <div class="profile-header">
        <div class="profile-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.5 20.12a8.25 8.25 0 0 1 15 0"/>
          </svg>
        </div>
        <div class="profile-fields">
          <input type="text" id="profileName" placeholder="Your name" value="${escHtml(state.profile.name)}" class="profile-name-input">
          <input type="text" id="profilePronouns" placeholder="Pronouns (optional)" value="${escHtml(state.profile.pronouns)}" class="profile-pronouns-input">
        </div>
      </div>

      <div class="body-map-section">
        <div class="body-map-container">
          <div class="body-map-title">Tap a zone to edit</div>
          ${renderBodyMap()}
        </div>
        <div class="zone-sidebar">
          ${renderZoneSidebar()}
        </div>
      </div>

      <div class="action-bar">
        <button class="btn btn-primary" id="saveProfileBtn">Save Profile</button>
        <button class="btn" id="shareProfileBtn" ${!state.shareId ? 'disabled' : ''}>Share Profile</button>
      </div>
      <div class="action-bar export-bar">
        <button class="btn btn-sm" id="exportProfileBtn">Export JSON</button>
        <button class="btn btn-sm" id="exportTemplateBtn">Export Template</button>
        <label class="btn btn-sm import-label" tabindex="0">
          Import JSON
          <input type="file" accept=".json" id="importFileInput" hidden>
        </label>
      </div>
    </div>
  `;
}

function renderViewMode() {
  const main = $('main');
  if (!main) return;

  main.innerHTML = `
    <div class="container">
      <div class="profile-card">
        <div class="profile-card-header">
          <h1>${escHtml(state.profile.name) || 'Profile'}</h1>
          ${state.profile.pronouns ? `<p class="pronouns">${escHtml(state.profile.pronouns)}</p>` : ''}
        </div>

        <div class="profile-card-body">
          ${renderMeasurementsView()}
          ${renderCategorySummary()}
        </div>

        ${state.hasPassword && !state.isOwner ? `
          <button class="btn btn-primary" id="requestEditBtn">Request Edit Access</button>
        ` : state.isOwner ? `
          <button class="btn" id="switchToEditBtn">Switch to Edit Mode</button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderMeasurementsView() {
  const m = state.profile.measurements;
  const items = [];

  if (m.chest) items.push({ label: 'Chest', value: `${m.chest} cm` });
  if (m.waist) items.push({ label: 'Waist', value: `${m.waist} cm` });
  if (m.hips) items.push({ label: 'Hips', value: `${m.hips} cm` });
  if (m.shoulders) items.push({ label: 'Shoulders', value: `${m.shoulders} cm` });
  if (m.inseam) items.push({ label: 'Inseam', value: `${m.inseam} cm` });
  if (m.footLength) items.push({ label: 'Foot', value: `${m.footLength} cm` });
  if (m.hands?.wrist) items.push({ label: 'Wrist', value: `${m.hands.wrist} cm` });
  if (m.hands?.ringFinger) items.push({ label: 'Ring Finger', value: `${m.hands.ringFinger} mm` });

  if (items.length === 0) return '';

  return `
    <h3>Measurements</h3>
    <div class="measurement-grid">
      ${items.map(i => `
        <div class="measurement-item">
          <div class="label">${i.label}</div>
          <div class="value">${i.value}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCategorySummary() {
  let html = '';
  for (const [key, data] of Object.entries(state.profile.categories)) {
    if (!data.brands || data.brands.length === 0) continue;
    const filledBrands = data.brands.filter(b => b.name);
    if (filledBrands.length === 0) continue;
    html += `
      <div class="category-section">
        <h4>${CATEGORY_NAMES[key] || key}</h4>
        <ul>
          ${filledBrands.map(b => `<li>${escHtml(b.name)}${b.size ? `, ${escHtml(b.size)}` : ''}${b.notes ? ` (${escHtml(b.notes)})` : ''}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  return html;
}

function renderZoneSidebar() {
  return BODY_ZONES.map(z => {
    const count = getZoneItemCount(z);
    const isActive = state.activeZone === z.id;
    return `
      <div class="zone-card${isActive ? ' active' : ''}" data-zone="${z.id}">
        <div class="zone-card-icon">${z.icon}</div>
        <span class="zone-card-label">${z.name}</span>
        ${count > 0 ? `<span class="zone-card-count">${count}</span>` : ''}
      </div>
    `;
  }).join('');
}

function getZoneItemCount(zone) {
  let count = 0;
  for (const catKey of zone.categories) {
    if (catKey === 'hair') {
      const h = state.profile.categories.hair;
      if (h.type || h.cutInstructions || h.products.length > 0) count++;
    } else if (catKey === 'outfits') {
      count += state.profile.sets.length;
    } else {
      const cat = state.profile.categories[catKey];
      if (cat?.brands) count += cat.brands.filter(b => b.name).length;
    }
  }
  // Count measurements too
  const fields = MEASUREMENT_FIELDS[zone.id] || [];
  for (const f of fields) {
    const val = getNestedValue(state.profile.measurements, f.key);
    if (val) count++;
  }
  return count;
}

function renderBodyMap() {
  const activeZone = state.activeZone;
  const activeClass = (zone) => activeZone === zone ? ' zone-active' : '';

  return `
    <div class="human-body">
      <svg data-zone="head" class="body-part head${activeClass('head')}" xmlns="http://www.w3.org/2000/svg" width="56.594" height="95.031" viewBox="0 0 56.594 95.031">
        <path d="M15.92 68.5l8.8 12.546 3.97 13.984-9.254-7.38-4.622-15.848zm27.1 0l-8.8 12.546-3.976 13.988 9.254-7.38 4.622-15.848zm6.11-27.775l.108-11.775-21.16-14.742L8.123 26.133 8.09 40.19l-3.24.215 1.462 9.732 5.208 1.81 2.36 11.63 9.72 11.018 10.856-.324 9.56-10.37 1.918-11.952 5.207-1.81 1.342-9.517zm-43.085-1.84l-.257-13.82L28.226 11.9l23.618 15.755-.216 10.37 4.976-17.085L42.556 2.376 25.49 0 10.803 3.673.002 24.415z"/>
      </svg>

      <svg data-zone="torso" class="body-part shoulder zone-torso${activeClass('torso')}" xmlns="http://www.w3.org/2000/svg" width="109.532" height="46.594" viewBox="0 0 109.532 46.594">
        <path d="M38.244-.004l1.98 9.232-11.653 2.857-7.474-2.637zm33.032 0l-1.98 9.232 11.653 2.857 7.474-2.637zm21.238 10.54l4.044-2.187 12.656 14 .07 5.33S92.76 10.66 92.515 10.535zm-1.285.58c-.008.28 17.762 18.922 17.762 18.922l.537 16.557-6.157-10.55L91.5 30.988 83.148 15.6zm-74.224-.58L12.962 8.35l-12.656 14-.062 5.325s16.52-17.015 16.764-17.14zm1.285.58C18.3 11.396.528 30.038.528 30.038L-.01 46.595l6.157-10.55 11.87-5.056L26.374 15.6z"/>
      </svg>

      <svg data-zone="torso" class="body-part cheast zone-torso${activeClass('torso')}" xmlns="http://www.w3.org/2000/svg" width="86.594" height="45.063" viewBox="0 0 86.594 45.063">
        <path d="M19.32 0l-9.225 16.488-10.1 5.056 6.15 4.836 4.832 14.07 11.2 4.616 17.85-8.828-4.452-34.7zm47.934 0l9.225 16.488 10.1 5.056-6.15 4.836-4.833 14.07-11.2 4.616-17.844-8.828 4.45-34.7z"/>
      </svg>

      <svg data-zone="torso" class="body-part stomach zone-torso${activeClass('torso')}" xmlns="http://www.w3.org/2000/svg" width="75.25" height="107.594" viewBox="0 0 75.25 107.594">
        <path d="M19.25 7.49l16.6-7.5-.5 12.16-14.943 7.662zm-10.322 8.9l6.9 3.848-.8-9.116zm5.617-8.732L1.32 2.15 6.3 15.6zm-8.17 9.267l9.015 5.514 1.54 11.028-8.795-5.735zm15.53 5.89l.332 8.662 12.286-2.665.664-11.826zm14.61 84.783L33.28 76.062l-.08-20.53-11.654-5.736-1.32 37.5zM22.735 35.64L22.57 46.3l11.787 3.166.166-16.657zm-14.16-5.255L16.49 35.9l1.1 11.25-8.8-7.06zm8.79 22.74l-9.673-7.28-.84 9.78L-.006 68.29l10.564 14.594 5.5.883 1.98-20.735zM56 7.488l-16.6-7.5.5 12.16 14.942 7.66zm10.32 8.9l-6.9 3.847.8-9.116zm-5.617-8.733L73.93 2.148l-4.98 13.447zm8.17 9.267l-9.015 5.514-1.54 11.03 8.8-5.736zm-15.53 5.89l-.332 8.662-12.285-2.665-.664-11.827zm-14.61 84.783l3.234-31.536.082-20.532 11.65-5.735 1.32 37.5zm13.78-71.957l.166 10.66-11.786 3.168-.166-16.657zm14.16-5.256l-7.915 5.514-1.1 11.25 8.794-7.06zm-8.79 22.743l9.673-7.28.84 9.78 6.862 12.66-10.564 14.597-5.5.883-1.975-20.74z"/>
      </svg>

      <svg data-zone="waist-legs" class="body-part legs zone-waist-legs${activeClass('waist-legs')}" xmlns="http://www.w3.org/2000/svg" width="93.626" height="286.625" viewBox="0 0 93.626 286.625">
        <path d="M17.143 138.643l-.664 5.99 4.647 5.77 1.55 9.1 3.1 1.33 2.655-13.755 1.77-4.88-1.55-3.107zm20.582.444l-3.32 9.318-7.082 13.755 1.77 12.647 5.09-14.2 4.205-7.982zm-26.557-12.645l5.09 27.29-3.32-1.777-2.656 8.875zm22.795 42.374l-1.55 4.88-3.32 20.634-.442 27.51 4.65 26.847-.223-34.39 4.87-13.754.663-15.087zM23.34 181.24l1.106 41.267 8.853 33.28-9.628-4.55-16.045-57.8 5.533-36.384zm15.934 80.536l-.664 18.415-1.55 6.435h-4.647l-1.327-4.437-1.55-.222.332 4.437-5.864-1.778-1.55-.887-6.64-1.442-.22-5.214 6.418-10.87 4.426-5.548 10.844-4.437zM13.63 3.076v22.476l15.71 31.073 9.923 30.85L38.23 66.1zm25.49 30.248l.118-.148-.793-2.024L21.9 12.992l-1.242-.44L31.642 40.93zM32.865 44.09l6.812 17.6 2.274-21.596-1.344-3.43zM6.395 61.91l.827 25.34 12.816 35.257-3.928 10.136L3.5 88.133zM30.96 74.69l.345.826 6.47 15.48-4.177 38.342-6.594-3.526 5.715-35.7zm45.5 63.953l.663 5.99-4.647 5.77-1.55 9.1-3.1 1.33-2.655-13.755-1.77-4.88 1.55-3.107zm-20.582.444l3.32 9.318 7.08 13.755-1.77 12.647-5.09-14.2-4.2-7.987zm3.762 29.73l1.55 4.88 3.32 20.633.442 27.51-4.648 26.847.22-34.39-4.867-13.754-.67-15.087zm10.623 12.424l-1.107 41.267-8.852 33.28 9.627-4.55 16.046-57.8-5.533-36.384zM54.33 261.777l.663 18.415 1.546 6.435h4.648l1.328-4.437 1.55-.222-.333 4.437 5.863-1.778 1.55-.887 6.638-1.442.222-5.214-6.418-10.868-4.426-5.547-10.844-4.437zm25.643-258.7v22.476L64.26 56.625l-9.923 30.85L55.37 66.1zM54.48 33.326l-.118-.15.793-2.023L71.7 12.993l1.24-.44L61.96 40.93zm6.255 10.764l-6.812 17.6-2.274-21.595 1.344-3.43zm26.47 17.82l-.827 25.342-12.816 35.256 3.927 10.136 12.61-44.51zM62.64 74.693l-.346.825-6.47 15.48 4.178 38.342 6.594-3.527-5.715-35.7zm19.792 51.75l-5.09 27.29 3.32-1.776 2.655 8.875zM9.495-.007l.827 21.373-7.028 42.308-3.306-34.155zm2.068 27.323L26.24 59.707l3.307 26-6.2 36.58L9.91 85.046l-.827-38.342zM84.103-.01l-.826 21.375 7.03 42.308 3.306-34.155zm-2.066 27.325L67.36 59.707l-3.308 26 6.2 36.58 13.436-37.24.827-38.34z"/>
      </svg>

      <svg data-zone="feet" class="body-part feet${activeClass('feet')}" xmlns="http://www.w3.org/2000/svg" width="93.626" height="286.625" viewBox="0 0 93.626 286.625">
        <path d="M17.143 138.643l-.664 5.99 4.647 5.77 1.55 9.1 3.1 1.33 2.655-13.755 1.77-4.88-1.55-3.107zm20.582.444l-3.32 9.318-7.082 13.755 1.77 12.647 5.09-14.2 4.205-7.982zm-26.557-12.645l5.09 27.29-3.32-1.777-2.656 8.875zm22.795 42.374l-1.55 4.88-3.32 20.634-.442 27.51 4.65 26.847-.223-34.39 4.87-13.754.663-15.087zM23.34 181.24l1.106 41.267 8.853 33.28-9.628-4.55-16.045-57.8 5.533-36.384zm15.934 80.536l-.664 18.415-1.55 6.435h-4.647l-1.327-4.437-1.55-.222.332 4.437-5.864-1.778-1.55-.887-6.64-1.442-.22-5.214 6.418-10.87 4.426-5.548 10.844-4.437zM13.63 3.076v22.476l15.71 31.073 9.923 30.85L38.23 66.1zm25.49 30.248l.118-.148-.793-2.024L21.9 12.992l-1.242-.44L31.642 40.93zM32.865 44.09l6.812 17.6 2.274-21.596-1.344-3.43zM6.395 61.91l.827 25.34 12.816 35.257-3.928 10.136L3.5 88.133zM30.96 74.69l.345.826 6.47 15.48-4.177 38.342-6.594-3.526 5.715-35.7zm45.5 63.953l.663 5.99-4.647 5.77-1.55 9.1-3.1 1.33-2.655-13.755-1.77-4.88 1.55-3.107zm-20.582.444l3.32 9.318 7.08 13.755-1.77 12.647-5.09-14.2-4.2-7.987zm3.762 29.73l1.55 4.88 3.32 20.633.442 27.51-4.648 26.847.22-34.39-4.867-13.754-.67-15.087zm10.623 12.424l-1.107 41.267-8.852 33.28 9.627-4.55 16.046-57.8-5.533-36.384zM54.33 261.777l.663 18.415 1.546 6.435h4.648l1.328-4.437 1.55-.222-.333 4.437 5.863-1.778 1.55-.887 6.638-1.442.222-5.214-6.418-10.868-4.426-5.547-10.844-4.437zm25.643-258.7v22.476L64.26 56.625l-9.923 30.85L55.37 66.1zM54.48 33.326l-.118-.15.793-2.023L71.7 12.993l1.24-.44L61.96 40.93zm6.255 10.764l-6.812 17.6-2.274-21.595 1.344-3.43zm26.47 17.82l-.827 25.342-12.816 35.256 3.927 10.136 12.61-44.51zM62.64 74.693l-.346.825-6.47 15.48 4.178 38.342 6.594-3.527-5.715-35.7zm19.792 51.75l-5.09 27.29 3.32-1.776 2.655 8.875zM9.495-.007l.827 21.373-7.028 42.308-3.306-34.155zm2.068 27.323L26.24 59.707l3.307 26-6.2 36.58L9.91 85.046l-.827-38.342zM84.103-.01l-.826 21.375 7.03 42.308 3.306-34.155zm-2.066 27.325L67.36 59.707l-3.308 26 6.2 36.58 13.436-37.24.827-38.34z"/>
      </svg>

      <svg data-zone="arm" class="body-part arm${activeClass('arm')}" xmlns="http://www.w3.org/2000/svg" width="156.344" height="119.25" viewBox="0 0 156.344 119.25">
        <path d="M21.12 56.5a1.678 1.678 0 0 1-.427.33l.935 8.224 12.977-13.89 1.2-8.958A168.2 168.2 0 0 0 21.12 56.5zm1.387 12.522l-18.07 48.91 5.757 1.333 19.125-39.44 3.518-22.047zm-5.278-18.96l2.638 18.74-17.2 46.023L.01 113.05l6.644-35.518zm118.015 6.44a1.678 1.678 0 0 0 .426.33l-.934 8.222-12.977-13.89-1.2-8.958A168.2 168.2 0 0 1 135.24 56.5zm-1.39 12.52l18.073 48.91-5.758 1.333-19.132-39.44-3.52-22.05zm5.28-18.96l-2.64 18.74 17.2 46.023 2.658-1.775-6.643-35.518zm-103.1-12.323a1.78 1.78 0 0 1 .407-.24l3.666-27.345L33.07.015l-7.258 10.58-6.16 37.04.566 4.973a151.447 151.447 0 0 1 15.808-14.87zm84.3 0a1.824 1.824 0 0 0-.407-.24l-3.666-27.345L123.3.015l7.258 10.58 6.16 37.04-.566 4.973a151.447 151.447 0 0 0-15.822-14.87zM22.288 8.832l-3.3 35.276-2.2-26.238zm111.79 0l3.3 35.276 2.2-26.238z"/>
      </svg>

      <svg data-zone="hands" class="body-part hands${activeClass('hands')}" xmlns="http://www.w3.org/2000/svg" width="205" height="38.938" viewBox="0 0 205 38.938">
        <path d="M21.255-.002l2.88 6.9 8.412 1.335.664 12.458-4.427 17.8-2.878-.22 2.8-11.847-2.99-.084-4.676 12.6-3.544-.446 4.4-12.736-3.072-.584-5.978 13.543-4.428-.445 6.088-14.1-2.1-1.25-7.528 12.012-3.764-.445L12.4 12.9l-1.107-1.78L.665 15.57 0 13.124l8.635-7.786zm162.49 0l-2.88 6.9-8.412 1.335-.664 12.458 4.427 17.8 2.878-.22-2.8-11.847 2.99-.084 4.676 12.6 3.544-.446-4.4-12.736 3.072-.584 5.978 13.543 4.428-.445-6.088-14.1 2.1-1.25 7.528 12.012 3.764-.445L192.6 12.9l1.107-1.78 10.628 4.45.665-2.447-8.635-7.786z"/>
      </svg>
    </div>
  `;
}

/** Render zone detail panel */
export function renderZonePanel(zoneId) {
  const zone = BODY_ZONES.find(z => z.id === zoneId);
  if (!zone) return;

  const panel = $('zonePanel');
  if (!panel) return;

  const color = ZONE_COLORS[zoneId] || '#14b8a6';
  panel.style.setProperty('--panel-accent', color);

  const measurements = MEASUREMENT_FIELDS[zoneId] || [];
  const categories = zone.categories || [];

  let html = `
    <div class="panel-header">
      <div class="panel-header-icon" style="background: ${color}22">${zone.icon.replace('currentColor', color)}</div>
      <h2>${zone.name}</h2>
      <button class="close-btn" data-action="closePanel" aria-label="Close panel">&times;</button>
    </div>
    <div class="panel-body">
  `;

  if (measurements.length > 0) {
    html += `<div class="section"><h3>Measurements</h3>`;
    measurements.forEach(field => {
      const value = getNestedValue(state.profile.measurements, field.key) || '';
      html += `
        <div class="form-group">
          <label>${field.label} (${field.unit})</label>
          <input type="${field.type}" data-field="${field.key}" value="${escHtml(value)}" placeholder="0" />
        </div>
      `;
    });
    html += `</div>`;
  }

  categories.forEach(catKey => {
    if (catKey === 'hair') {
      html += renderHairSection();
    } else if (catKey === 'outfits') {
      html += renderSetsSection();
    } else {
      html += renderCategorySection(catKey);
    }
  });

  html += `
      <button class="btn btn-primary" data-action="saveZone" style="width: 100%; margin-top: 8px;">Save Changes</button>
    </div>
  `;

  panel.innerHTML = html;
  panel.classList.add('open');

  highlightActiveZone(zoneId);
  updateSidebarActive(zoneId);
}

function highlightActiveZone(zoneId) {
  document.querySelectorAll('.human-body .body-part').forEach(el => {
    el.classList.remove('zone-active');
  });
  document.querySelectorAll(`.human-body .body-part[data-zone="${zoneId}"]`).forEach(el => {
    el.classList.add('zone-active');
  });
}

function updateSidebarActive(zoneId) {
  document.querySelectorAll('.zone-card').forEach(el => {
    el.classList.toggle('active', el.dataset.zone === zoneId);
  });
}

function renderCategorySection(catKey) {
  const cat = state.profile.categories[catKey];
  if (!cat) return '';

  const isAdvanced = state.showAdvanced[catKey] || false;

  let html = `
    <div class="section">
      <div class="section-header">
        <h3>${CATEGORY_NAMES[catKey] || catKey}</h3>
        <label class="toggle">
          <input type="checkbox" ${isAdvanced ? 'checked' : ''} data-toggle-advanced="${catKey}">
          <span>Advanced</span>
        </label>
      </div>

      <div class="brands-list">
        ${cat.brands.map((brand, i) => `
          <div class="brand-item" data-brand-index="${i}">
            <input type="text" placeholder="Brand" value="${escHtml(brand.name)}" data-brand-field="name" data-category="${catKey}" data-index="${i}">
            <input type="text" placeholder="Size" value="${escHtml(brand.size)}" data-brand-field="size" data-category="${catKey}" data-index="${i}">
            <input type="text" placeholder="Notes" value="${escHtml(brand.notes)}" data-brand-field="notes" data-category="${catKey}" data-index="${i}">
            <button class="btn-icon" data-action="removeBrand" data-category="${catKey}" data-index="${i}" aria-label="Remove brand">${TRASH_ICON}</button>
          </div>
        `).join('')}
        <button class="btn btn-sm" data-action="addBrand" data-category="${catKey}">+ Add Brand</button>
      </div>

      ${isAdvanced ? `
        <div class="preferences-section">
          <h4>Preferences</h4>
          <div class="form-group">
            <label>Preferred Textures</label>
            <input type="text" placeholder="cotton, linen, denim..." value="${cat.preferences.textures.join(', ')}" data-pref-field="textures" data-category="${catKey}">
          </div>
          <div class="form-group">
            <label>Preferred Styles</label>
            <input type="text" placeholder="slim fit, crew neck..." value="${cat.preferences.styles.join(', ')}" data-pref-field="styles" data-category="${catKey}">
          </div>
          <div class="form-group">
            <label>Avoid List</label>
            <input type="text" placeholder="Brands or styles to avoid" value="${cat.preferences.avoidList.join(', ')}" data-pref-field="avoidList" data-category="${catKey}">
          </div>
        </div>
      ` : ''}
    </div>
  `;

  return html;
}

function renderSelectWithCustom(fieldId, options, currentValue, dataAttr) {
  const isCustom = currentValue && !options.some(o => o.toLowerCase() === currentValue.toLowerCase());
  return `
    <div class="select-with-custom">
      <select data-select-for="${fieldId}" ${dataAttr}>
        <option value="">Select...</option>
        ${options.map(o => `<option value="${escHtml(o)}" ${currentValue && o.toLowerCase() === currentValue.toLowerCase() ? 'selected' : ''}>${escHtml(o)}</option>`).join('')}
        <option value="__custom" ${isCustom ? 'selected' : ''}>Other...</option>
      </select>
      <input type="text" class="custom-input${isCustom ? ' visible' : ''}" placeholder="Type your own..." value="${isCustom ? escHtml(currentValue) : ''}" data-custom-for="${fieldId}" ${dataAttr}>
    </div>
  `;
}

function renderHairSection() {
  const hair = state.profile.categories.hair;
  return `
    <div class="section">
      <h3>Hair</h3>
      <div class="form-group">
        <label>Type</label>
        ${renderSelectWithCustom('hairType', FIELD_OPTIONS.hairType, hair.type, 'data-hair-field="type"')}
      </div>
      <div class="form-group">
        <label>Cut Instructions</label>
        <textarea placeholder="How you like your hair cut" data-hair-field="cutInstructions">${escHtml(hair.cutInstructions)}</textarea>
      </div>
      <div class="form-group">
        <label>Special Notes</label>
        <textarea placeholder="Double crown, sensitive scalp..." data-hair-field="specialNotes">${escHtml(hair.specialNotes)}</textarea>
      </div>
      <div class="products-list">
        <h4>Products</h4>
        ${hair.products.map((p, i) => `
          <div class="product-item">
            <input type="text" placeholder="Product name" value="${escHtml(p.name)}" data-hair-product="name" data-index="${i}">
            <input type="text" placeholder="Notes" value="${escHtml(p.notes)}" data-hair-product="notes" data-index="${i}">
            <button class="btn-icon" data-action="removeHairProduct" data-index="${i}" aria-label="Remove product">${TRASH_ICON}</button>
          </div>
        `).join('')}
        <button class="btn btn-sm" data-action="addHairProduct">+ Add Product</button>
      </div>
    </div>
  `;
}

function renderSetsSection() {
  return `
    <div class="section">
      <h3>Complete Sets</h3>
      <div class="sets-list">
        ${state.profile.sets.map((set, i) => `
          <div class="set-item" data-set-index="${i}">
            <input type="text" placeholder="Set name" value="${escHtml(set.name)}" data-set-field="name" data-index="${i}" style="flex:1">
            <button class="btn-icon" data-action="removeSet" data-index="${i}" aria-label="Remove set">${TRASH_ICON}</button>
            <div class="set-items" style="width:100%">
              ${set.items.map((item, j) => `
                <div class="set-subitem">
                  <input type="text" placeholder="Category" value="${escHtml(item.category)}" data-set-item="category" data-set-index="${i}" data-item-index="${j}">
                  <input type="text" placeholder="Brand" value="${escHtml(item.brand)}" data-set-item="brand" data-set-index="${i}" data-item-index="${j}">
                  <input type="text" placeholder="Details" value="${escHtml(item.details)}" data-set-item="details" data-set-index="${i}" data-item-index="${j}">
                  <button class="btn-icon" data-action="removeSetItem" data-set-index="${i}" data-item-index="${j}" aria-label="Remove item">${TRASH_ICON}</button>
                </div>
              `).join('')}
              <button class="btn btn-xs" data-action="addSetItem" data-set-index="${i}">+ Add Item</button>
            </div>
          </div>
        `).join('')}
        <button class="btn btn-sm" data-action="addSet">+ Add Set</button>
      </div>
    </div>
  `;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
