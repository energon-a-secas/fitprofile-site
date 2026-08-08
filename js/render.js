// ── DOM rendering ────────────────────────────────────────────
import { state } from './state.js';
import { escHtml, getNestedValue } from './utils.js';
import { renderBodyMap } from './bodymap.js';
import {
  BODY_ZONES, CATEGORY_NAMES, MEASUREMENT_FIELDS, ZONE_COLORS,
  FIELD_OPTIONS, SIZE_SYSTEMS, FIT_OPTIONS, CATEGORY_META,
} from './data.js';

const TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>';
const STAR_ICON = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3.1-5.8 3.1 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>';
const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

export function render() {
  if (state.viewMode === 'view') {
    renderViewMode();
  } else {
    renderEditMode();
  }
}

function renderEditMode() {
  const main = document.getElementById('main');
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
          <input type="text" id="profileName" placeholder="Your name" value="${escHtml(state.profile.name)}" class="profile-name-input" autocomplete="name">
          <input type="text" id="profilePronouns" placeholder="Pronouns (optional)" value="${escHtml(state.profile.pronouns)}" class="profile-pronouns-input">
        </div>
        <div class="profile-meta">
          ${renderCompleteness()}
          <span class="save-state" id="saveState" data-state="${state.dirty ? 'unsaved' : 'saved'}">
            ${state.dirty ? 'Unsaved changes' : 'All changes stored'}
          </span>
        </div>
      </div>

      <div class="search-bar">
        <span class="search-icon" aria-hidden="true">${SEARCH_ICON}</span>
        <input type="search" id="globalSearch" placeholder="Search any brand, size or note…"
               value="${escHtml(state.query)}" autocomplete="off"
               aria-label="Search everything in this profile">
        ${state.query ? '<button class="search-clear" data-action="clearSearch" aria-label="Clear search">&times;</button>' : ''}
      </div>
      <div id="searchResults" class="search-results">${state.query ? renderSearchResults() : ''}</div>

      <div class="body-map-section"${state.query ? ' hidden' : ''}>
        <div class="body-map-container">
          <div class="body-map-title">Choose a zone</div>
          ${renderBodyMap(state.activeZone)}
        </div>
        <div class="zone-sidebar" role="list">
          ${renderZoneSidebar()}
        </div>
      </div>

      <div class="action-bar">
        <button class="btn btn-primary" id="saveProfileBtn">Save &amp; get link</button>
        <button class="btn" id="shareProfileBtn" ${!state.shareId ? 'disabled' : ''}>Share Profile</button>
      </div>
      <div class="action-bar export-bar">
        <button class="btn btn-sm" id="exportProfileBtn">Export JSON</button>
        <button class="btn btn-sm" id="exportTemplateBtn">Export Template</button>
        <label class="btn btn-sm import-label" tabindex="0">
          Import JSON
          <input type="file" accept=".json,application/json" id="importFileInput" hidden>
        </label>
      </div>
    </div>
  `;
}

/** Profile completeness — which zones still hold nothing. */
function renderCompleteness() {
  const filled = BODY_ZONES.filter(z => getZoneItemCount(z) > 0).length;
  const pct = Math.round((filled / BODY_ZONES.length) * 100);
  return `
    <div class="completeness" title="${filled} of ${BODY_ZONES.length} zones have data">
      <div class="completeness-track"><div class="completeness-fill" style="width:${pct}%"></div></div>
      <span class="completeness-label">${filled}/${BODY_ZONES.length} zones</span>
    </div>
  `;
}

function renderZoneSidebar() {
  return BODY_ZONES.map(z => {
    const count = getZoneItemCount(z);
    const isActive = state.activeZone === z.id;
    return `
      <button type="button" class="zone-card${isActive ? ' active' : ''}${count === 0 ? ' is-empty' : ''}"
              data-zone="${z.id}" role="listitem" aria-pressed="${isActive}">
        <span class="zone-card-icon">${z.icon}</span>
        <span class="zone-card-text">
          <span class="zone-card-label">${z.name}</span>
          <span class="zone-card-hint">${escHtml(z.hint)}</span>
        </span>
        <span class="zone-card-count">${count > 0 ? count : '+'}</span>
      </button>
    `;
  }).join('');
}

function getZoneItemCount(zone) {
  let count = 0;
  for (const catKey of zone.categories) {
    if (catKey === 'hair') {
      const h = state.profile.categories.hair;
      if (h.type || h.cutInstructions || h.specialNotes || h.products.length > 0) count++;
    } else if (catKey === 'outfits') {
      count += state.profile.sets.length;
    } else {
      const cat = state.profile.categories[catKey];
      if (cat?.brands) count += cat.brands.filter(b => b.name).length;
    }
  }
  for (const f of MEASUREMENT_FIELDS[zone.id] || []) {
    if (getNestedValue(state.profile.measurements, f.key)) count++;
  }
  return count;
}

/* ── Global search ───────────────────────────────────────────
   Finds a stored detail without having to remember its zone. */
function renderSearchResults() {
  const q = state.query.trim().toLowerCase();
  if (!q) return '';

  const hits = [];
  const zoneOf = cat => BODY_ZONES.find(z => z.categories.includes(cat));

  for (const [catKey, cat] of Object.entries(state.profile.categories)) {
    if (catKey === 'hair') {
      const h = cat;
      const haystack = [h.type, h.cutInstructions, h.specialNotes].join(' ');
      if (haystack.toLowerCase().includes(q)) {
        hits.push({ zone: zoneOf('hair'), category: 'hair', title: h.type || 'Hair notes', detail: h.cutInstructions || h.specialNotes });
      }
      for (const p of h.products) {
        if (`${p.name} ${p.notes}`.toLowerCase().includes(q)) {
          hits.push({ zone: zoneOf('hair'), category: 'hair', title: p.name, detail: p.notes });
        }
      }
      continue;
    }
    for (const item of cat.brands || []) {
      if (`${item.name} ${item.size} ${item.notes}`.toLowerCase().includes(q)) {
        hits.push({
          zone: zoneOf(catKey),
          category: catKey,
          title: item.name || '(unnamed)',
          detail: [formatSize(item), item.fit && `fits ${item.fit}`, item.notes].filter(Boolean).join(' · '),
          favorite: item.favorite,
        });
      }
    }
  }

  for (const set of state.profile.sets) {
    const haystack = [set.name, ...set.items.flatMap(i => [i.category, i.brand, i.details])].join(' ');
    if (haystack.toLowerCase().includes(q)) {
      hits.push({ zone: zoneOf('outfits'), category: 'outfits', title: set.name || 'Untitled set', detail: `${set.items.length} pieces` });
    }
  }

  if (hits.length === 0) {
    return `<p class="search-empty">Nothing stored matches “${escHtml(state.query)}”.</p>`;
  }

  return `
    <p class="search-count">${hits.length} match${hits.length === 1 ? '' : 'es'}</p>
    <ul class="search-list">
      ${hits.map(h => `
        <li>
          <button type="button" class="search-hit" data-zone="${h.zone?.id || ''}">
            <span class="search-hit-title">${escHtml(h.title)}${h.favorite ? ' <span class="fav-dot" aria-label="favorite">★</span>' : ''}</span>
            <span class="search-hit-detail">${escHtml(h.detail || '')}</span>
            <span class="search-hit-zone">${CATEGORY_NAMES[h.category] || h.category} · ${escHtml(h.zone?.name || '')}</span>
          </button>
        </li>
      `).join('')}
    </ul>
  `;
}

function formatSize(item) {
  if (!item.size) return '';
  const sys = SIZE_SYSTEMS[item.sizeSystem];
  if (!sys || item.sizeSystem === 'one') return item.size;
  if (item.sizeSystem === 'cm' || item.sizeSystem === 'mm') return `${item.size} ${item.sizeSystem}`;
  if (item.sizeSystem === 'letter' || item.sizeSystem === 'numeric') return item.size;
  return `${sys.label} ${item.size}`;
}

/* ── View mode ───────────────────────────────────────────── */
function renderViewMode() {
  const main = document.getElementById('main');
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
  if (m.hands?.pinky) items.push({ label: 'Pinky', value: `${m.hands.pinky} mm` });
  if (m.hands?.palmWidth) items.push({ label: 'Palm Width', value: `${m.hands.palmWidth} cm` });

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
    if (key === 'hair') continue;
    const filled = (data.brands || []).filter(b => b.name);
    if (filled.length === 0) continue;
    html += `
      <div class="category-section">
        <h4>${CATEGORY_NAMES[key] || key}</h4>
        <ul>
          ${filled.map(b => `
            <li${b.favorite ? ' class="is-fav"' : ''}>
              ${b.favorite ? '<span class="fav-dot" aria-label="favorite">★</span> ' : ''}
              <strong>${escHtml(b.name)}</strong>${formatSize(b) ? ` — ${escHtml(formatSize(b))}` : ''}${b.fit ? ` <em>(${escHtml(b.fit)})</em>` : ''}${b.notes ? ` · ${escHtml(b.notes)}` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  const hair = state.profile.categories.hair;
  if (hair.type || hair.cutInstructions || hair.specialNotes || hair.products.length) {
    html += `
      <div class="category-section">
        <h4>Hair</h4>
        <ul>
          ${hair.type ? `<li><strong>Type</strong> — ${escHtml(hair.type)}</li>` : ''}
          ${hair.cutInstructions ? `<li><strong>Cut</strong> — ${escHtml(hair.cutInstructions)}</li>` : ''}
          ${hair.specialNotes ? `<li><strong>Notes</strong> — ${escHtml(hair.specialNotes)}</li>` : ''}
          ${hair.products.filter(p => p.name).map(p => `<li>${escHtml(p.name)}${p.notes ? ` · ${escHtml(p.notes)}` : ''}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  for (const set of state.profile.sets) {
    if (!set.name && set.items.length === 0) continue;
    html += `
      <div class="category-section">
        <h4>${escHtml(set.name) || 'Outfit'}</h4>
        <ul>
          ${set.items.map(i => `<li>${escHtml([i.category, i.brand, i.details].filter(Boolean).join(' · '))}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  return html;
}

/* ── Zone panel ──────────────────────────────────────────── */

/** Render the zone panel and open it. */
export function renderZonePanel(zoneId) {
  const zone = BODY_ZONES.find(z => z.id === zoneId);
  const panel = document.getElementById('zonePanel');
  if (!zone || !panel) return;

  const color = ZONE_COLORS[zoneId] || '#14b8a6';
  panel.style.setProperty('--panel-accent', color);
  panel.dataset.zone = zoneId;

  panel.innerHTML = `
    <div class="panel-grip" data-action="closePanel" aria-hidden="true"></div>
    <div class="panel-header">
      <div class="panel-header-icon">${zone.icon}</div>
      <div class="panel-header-text">
        <h2 id="zonePanelTitle">${zone.name}</h2>
        <p class="panel-header-hint">${escHtml(zone.hint)}</p>
      </div>
      <button class="close-btn" data-action="closePanel" aria-label="Close panel">&times;</button>
    </div>
    <div class="panel-body">${renderPanelBody(zone)}</div>
  `;

  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('panel-open');
  syncZoneActive(zoneId);
}

function renderPanelBody(zone) {
  const measurements = MEASUREMENT_FIELDS[zone.id] || [];
  let html = '';

  if (measurements.length > 0) {
    html += `<div class="section"><h3>Measurements</h3><div class="measure-grid">`;
    for (const field of measurements) {
      const value = getNestedValue(state.profile.measurements, field.key);
      html += `
        <div class="form-group measure-field">
          <label for="m-${field.key}">${field.label}</label>
          <div class="input-unit">
            <input type="number" inputmode="decimal" step="0.1" min="0" id="m-${field.key}"
                   data-field="${field.key}" value="${value ?? ''}" placeholder="—">
            <span class="unit">${field.unit}</span>
          </div>
        </div>
      `;
    }
    html += `</div></div>`;
  }

  for (const catKey of zone.categories) {
    if (catKey === 'hair') html += renderHairSection();
    else if (catKey === 'outfits') html += renderSetsSection();
    else html += renderCategorySection(catKey);
  }

  return html;
}

/** Re-render only one category, so typing elsewhere keeps focus. */
export function refreshCategory(catKey) {
  const node = document.querySelector(`.section[data-category="${catKey}"]`);
  if (!node) return;
  node.outerHTML = renderCategorySection(catKey);
}

function renderCategorySection(catKey) {
  const cat = state.profile.categories[catKey];
  if (!cat) return '';

  const isAdvanced = state.showAdvanced[catKey] || false;
  const meta = CATEGORY_META[catKey] || {};
  const filled = cat.brands.filter(b => b.name).length;

  return `
    <div class="section" data-category="${catKey}">
      <div class="section-header">
        <h3>${CATEGORY_NAMES[catKey] || catKey}${filled ? ` <span class="section-count">${filled}</span>` : ''}</h3>
        <label class="toggle">
          <input type="checkbox" ${isAdvanced ? 'checked' : ''} data-toggle-advanced="${catKey}">
          <span>Preferences</span>
        </label>
      </div>

      <div class="brands-list">
        ${cat.brands.map(item => renderItemRow(catKey, item, meta)).join('')}
        ${cat.brands.length === 0 ? `<p class="empty-hint">No ${(CATEGORY_NAMES[catKey] || catKey).toLowerCase()} stored yet.</p>` : ''}
        <button class="btn btn-sm add-row" data-action="addBrand" data-category="${catKey}">+ Add item</button>
      </div>

      ${isAdvanced ? renderPreferences(catKey, cat) : ''}
    </div>
  `;
}

/** One stored item: brand, the size *and its system*, how it fits, notes. */
function renderItemRow(catKey, item, meta) {
  const sysOptions = Object.entries(SIZE_SYSTEMS)
    .map(([key, sys]) => `<option value="${key}"${item.sizeSystem === key ? ' selected' : ''}>${sys.label}</option>`)
    .join('');

  return `
    <div class="item-row${item.favorite ? ' is-fav' : ''}" data-item-id="${item.id}" data-category="${catKey}">
      <div class="item-row-main">
        <input type="text" class="item-name" placeholder="${escHtml(meta.placeholder || 'Brand')}"
               value="${escHtml(item.name)}" data-item-field="name"
               data-category="${catKey}" data-id="${item.id}" aria-label="Brand or product">
        <button type="button" class="fav-btn" data-action="toggleFavorite"
                data-category="${catKey}" data-id="${item.id}"
                aria-pressed="${item.favorite}" aria-label="Mark as favourite">${STAR_ICON}</button>
        <button class="btn-icon" data-action="removeBrand" data-category="${catKey}"
                data-id="${item.id}" aria-label="Remove item">${TRASH_ICON}</button>
      </div>

      <div class="item-row-detail">
        <div class="field-pair">
          <input type="text" class="item-size" placeholder="Size" value="${escHtml(item.size)}"
                 data-item-field="size" data-category="${catKey}" data-id="${item.id}"
                 aria-label="Size" ${item.sizeSystem === 'one' ? 'disabled' : ''}>
          <select class="item-system" data-item-field="sizeSystem" data-category="${catKey}"
                  data-id="${item.id}" aria-label="Size system">${sysOptions}</select>
        </div>

        <div class="fit-group" role="radiogroup" aria-label="How it fits">
          ${FIT_OPTIONS.map(f => `
            <button type="button" class="fit-chip${item.fit === f.value ? ' selected' : ''}"
                    data-action="setFit" data-fit="${f.value}" data-category="${catKey}"
                    data-id="${item.id}" role="radio" aria-checked="${item.fit === f.value}">${f.label}</button>
          `).join('')}
        </div>
      </div>

      <input type="text" class="item-notes" placeholder="What the size doesn’t tell you — sleeves short, runs big…"
             value="${escHtml(item.notes)}" data-item-field="notes"
             data-category="${catKey}" data-id="${item.id}" aria-label="Notes">
    </div>
  `;
}

function renderPreferences(catKey, cat) {
  const rows = [
    { key: 'textures', label: 'Preferred textures', placeholder: 'cotton, linen, denim…' },
    { key: 'styles', label: 'Preferred styles', placeholder: 'slim fit, crew neck…' },
    { key: 'colors', label: 'Preferred colours', placeholder: 'navy, olive, off-white…' },
    { key: 'avoidList', label: 'Avoid', placeholder: 'polyester, cropped…' },
  ];
  return `
    <div class="preferences-section">
      <h4>Preferences</h4>
      ${rows.map(r => `
        <div class="form-group">
          <label>${r.label}</label>
          <input type="text" placeholder="${r.placeholder}"
                 value="${escHtml(cat.preferences[r.key].join(', '))}"
                 data-pref-field="${r.key}" data-category="${catKey}">
        </div>
      `).join('')}
      <p class="field-note">Comma separated.</p>
    </div>
  `;
}

function renderSelectWithCustom(fieldId, options, currentValue, dataAttr) {
  const isCustom = currentValue && !options.some(o => o.toLowerCase() === currentValue.toLowerCase());
  return `
    <div class="select-with-custom">
      <select data-select-for="${fieldId}" ${dataAttr}>
        <option value="">Select…</option>
        ${options.map(o => `<option value="${escHtml(o)}" ${currentValue && o.toLowerCase() === currentValue.toLowerCase() ? 'selected' : ''}>${escHtml(o)}</option>`).join('')}
        <option value="__custom" ${isCustom ? 'selected' : ''}>Other…</option>
      </select>
      <input type="text" class="custom-input${isCustom ? ' visible' : ''}" placeholder="Type your own…" value="${isCustom ? escHtml(currentValue) : ''}" data-custom-for="${fieldId}" ${dataAttr}>
    </div>
  `;
}

export function refreshHair() {
  const node = document.querySelector('.section[data-category="hair"]');
  if (node) node.outerHTML = renderHairSection();
}

function renderHairSection() {
  const hair = state.profile.categories.hair;
  return `
    <div class="section" data-category="hair">
      <h3>Hair</h3>
      <div class="form-group">
        <label>Type</label>
        ${renderSelectWithCustom('hairType', FIELD_OPTIONS.hairType, hair.type, 'data-hair-field="type"')}
      </div>
      <div class="form-group">
        <label>Cut instructions</label>
        <textarea placeholder="Clipper number, how much off the top, how you part it…" data-hair-field="cutInstructions">${escHtml(hair.cutInstructions)}</textarea>
      </div>
      <div class="form-group">
        <label>Special notes</label>
        <textarea placeholder="Double crown, cowlick, sensitive scalp…" data-hair-field="specialNotes">${escHtml(hair.specialNotes)}</textarea>
      </div>
      <div class="products-list">
        <h4>Products</h4>
        ${hair.products.map(p => `
          <div class="product-item" data-item-id="${p.id}">
            <input type="text" placeholder="Product" value="${escHtml(p.name)}" data-hair-product="name" data-id="${p.id}" aria-label="Product name">
            <input type="text" placeholder="Notes" value="${escHtml(p.notes)}" data-hair-product="notes" data-id="${p.id}" aria-label="Product notes">
            <button class="btn-icon" data-action="removeHairProduct" data-id="${p.id}" aria-label="Remove product">${TRASH_ICON}</button>
          </div>
        `).join('')}
        <button class="btn btn-sm add-row" data-action="addHairProduct">+ Add product</button>
      </div>
    </div>
  `;
}

export function refreshSets() {
  const node = document.querySelector('.section[data-category="outfits"]');
  if (node) node.outerHTML = renderSetsSection();
}

function renderSetsSection() {
  return `
    <div class="section" data-category="outfits">
      <h3>Complete Sets</h3>
      <p class="field-note">An outfit that already works, so you can repeat it without rethinking it.</p>
      <div class="sets-list">
        ${state.profile.sets.map(set => `
          <div class="set-item" data-item-id="${set.id}">
            <div class="set-item-head">
              <input type="text" placeholder="Set name — “interview”, “wedding”" value="${escHtml(set.name)}"
                     data-set-field="name" data-id="${set.id}" aria-label="Set name">
              <button class="btn-icon" data-action="removeSet" data-id="${set.id}" aria-label="Remove set">${TRASH_ICON}</button>
            </div>
            <div class="set-items">
              ${set.items.map(item => `
                <div class="set-subitem" data-item-id="${item.id}">
                  <input type="text" placeholder="Piece" value="${escHtml(item.category)}" data-set-item="category" data-set-id="${set.id}" data-id="${item.id}" aria-label="Piece">
                  <input type="text" placeholder="Brand" value="${escHtml(item.brand)}" data-set-item="brand" data-set-id="${set.id}" data-id="${item.id}" aria-label="Brand">
                  <input type="text" placeholder="Details" value="${escHtml(item.details)}" data-set-item="details" data-set-id="${set.id}" data-id="${item.id}" aria-label="Details">
                  <button class="btn-icon" data-action="removeSetItem" data-set-id="${set.id}" data-id="${item.id}" aria-label="Remove piece">${TRASH_ICON}</button>
                </div>
              `).join('')}
              <button class="btn btn-xs add-row" data-action="addSetItem" data-set-id="${set.id}">+ Add piece</button>
            </div>
          </div>
        `).join('')}
        <button class="btn btn-sm add-row" data-action="addSet">+ Add set</button>
      </div>
    </div>
  `;
}

/** Keep the map, the zone list and the panel agreeing on the active zone. */
export function syncZoneActive(zoneId) {
  document.querySelectorAll('.hit-zone').forEach(el => {
    const on = el.dataset.zone === zoneId;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-pressed', String(on));
  });
  document.querySelectorAll('.zone-card').forEach(el => {
    const on = el.dataset.zone === zoneId;
    el.classList.toggle('active', on);
    el.setAttribute('aria-pressed', String(on));
  });
}

/** Update the zone counters and completeness without a full re-render. */
export function refreshZoneCounts() {
  for (const zone of BODY_ZONES) {
    const card = document.querySelector(`.zone-card[data-zone="${zone.id}"]`);
    if (!card) continue;
    const count = getZoneItemCount(zone);
    card.classList.toggle('is-empty', count === 0);
    const badge = card.querySelector('.zone-card-count');
    if (badge) badge.textContent = count > 0 ? String(count) : '+';
  }
  const meta = document.querySelector('.profile-meta .completeness');
  if (meta) meta.outerHTML = renderCompleteness();
}

/** Reflect saved/unsaved without redrawing the form. */
export function refreshSaveState() {
  const el = document.getElementById('saveState');
  if (!el) return;
  el.dataset.state = state.dirty ? 'unsaved' : 'saved';
  el.textContent = state.dirty ? 'Unsaved changes' : 'All changes stored';
}

/** Redraw only the search area, leaving the search input's focus intact. */
export function refreshSearch() {
  const results = document.getElementById('searchResults');
  const section = document.querySelector('.body-map-section');
  if (results) results.innerHTML = state.query ? renderSearchResults() : '';
  if (section) section.hidden = Boolean(state.query);

  const bar = document.querySelector('.search-bar');
  const clear = bar?.querySelector('.search-clear');
  if (state.query && !clear && bar) {
    bar.insertAdjacentHTML('beforeend', '<button class="search-clear" data-action="clearSearch" aria-label="Clear search">&times;</button>');
  } else if (!state.query && clear) {
    clear.remove();
  }
}
