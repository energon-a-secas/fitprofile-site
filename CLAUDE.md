# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Commands

```bash
make serve        # Start dev server at http://localhost:8829
make kill         # Kill the server on port 8829
make dev          # Run Convex backend (npx convex dev)
make setup        # Initial setup: npm install + convex deploy
make deploy       # Deploy to Convex production
make login        # Convex CLI login
```

ES modules require an HTTP server: `file://` will not work.

## Architecture

**Frontend:** Modular ES modules with an interactive SVG body map
**Backend:** Convex (users, profiles tables)
**Deployment:** GitHub Pages (frontend) + Convex Cloud (backend)

Convex URL is hardcoded in `js/state.js`: currently `https://adjoining-gnat-230.convex.cloud`.

## The product thesis

A measurement is not an answer. "Chest 98cm" does not tell you what to buy; "Uniqlo AIRism, L, perfect, runs short in the body" does. Every part of this app exists to store the second kind of fact, so the measurement is context rather than the point.

That is why a stored size always carries **the system it is expressed in**, `L`, `32 × 30`, `9.5 US` and `15.7mm` are all "size" and are not comparable without it, and why `fit` and `notes` sit at the same level as the size itself.

## Key Concepts

### Shareable Profile URLs

Each profile gets a unique `shareId` (8-char nanoid) generated client-side when first saved. URLs follow the pattern `/p/{shareId}`. Profiles can optionally have password protection (simple hash stored in Convex).

The URL parser in `app.js` accepts `[a-zA-Z0-9_-]+`: nanoid's alphabet includes `-` and `_`, so a narrower pattern silently fails on roughly a quarter of generated ids.

### Body map: two layers, one SVG

Built entirely in `js/bodymap.js`. See `BODY_MAP_UPGRADE.md` for the full rationale and the traps that shaped it.

- **`.body-art`** is decoration. It is `pointer-events: none` and never hit-tested.
- **`.body-hit`** sits above it and owns every hit test: rounded regions per zone, each clearing 44px at the rendered size, some zones made of two shapes (arms, hands).
- Hit regions are **invisible at all times** except keyboard `:focus-visible`. Drawing one puts a box on screen that does not match the body underneath. That mismatch was the original "weird hover shape". The feedback is the art beneath lighting up, selected with `:has()` in `css/style.css`.

Two constraints that will bite anyone editing this:

1. **`drop-shadow` inside `clip-path` is cut at the clip edge.** The legs artwork is one path drawn twice (above/below the ankle line) so `waist-legs` and `feet` can carry different tints. The styled `.art-part` element must *wrap* the clip, put the clip on the styled element and the glow becomes a hard rectangle.
2. **Hover variants live inside `@media (hover: hover)`.** On touch there is no un-hover, so an ungated hover rule leaves the last-tapped zone lit in a state nobody chose. Gate the affordance; do not try to override it back inside `@media (hover: none)`.

Each `.art-part` sets its own `--glow` custom property, so all six lit rules share one declaration block instead of repeating per zone. `drop-shadow` needs an explicit colour, `currentColor` resolves to inherited text and glows white.

### Zones

Eight zones in `BODY_ZONES` (`js/data.js`). **Six are drawn on the map** (`MAPPED_ZONES`: head, torso, waist-legs, feet, arm, hands); `accessories` and `sets` have no anatomical home and are reachable from the zone list only.

`torso` deliberately owns the waist measurement. It is what shirts, jackets and belts need. `waist-legs` carries hips and inseam for pants. `feet` is split from the legs so shoe sizing is independent.

### Zone panel

Clicking a zone opens `#zonePanel`. The panel element is created by `app.js` **before** the first `render()`, so a click that lands early always finds it.

- ≥700px: a slide-in panel from the right (440px at tablet widths).
- <700px: a **bottom sheet**: grip, `86dvh` cap, `overscroll-behavior: contain`, `body { overflow: hidden }` while open, safe-area bottom padding. The zone list becomes a horizontal scroll-snap chip strip placed *above* the figure (`order: -1`), because on a phone the chips are the fast path and a full-height figure would push every zone below the fold.

### Data entry

- **Never lose data.** Every edit calls `markDirty()`, which writes a localStorage draft keyed per `shareId`. A draft started before the first save migrates under the new `shareId` rather than being orphaned. `beforeunload` guards unsaved work, and a failed remote load falls back to the on-device copy instead of showing an empty profile.
- **Focus survives typing.** Editing re-renders only the affected subtree (`refreshCategory`, `refreshHair`, `refreshSets`), never the whole panel. State writes are immediate; bookkeeping (counts, completeness, save badge) is debounced.
- **Rows are mutated by `id`, never by array index.** `uid()` gives every item stable identity, so a delete or reorder cannot corrupt a neighbouring edit.
- **Search** (`#globalSearch`) matches brand, size and note text across every category and hides the body map while active.
- **Completeness** counts zones holding anything. Per-zone hints disappear once the zone has content, guidance, not permanent chrome.

### Schema reconciliation

`normalizeProfile()` in `js/data.js` is the **single gate every load path goes through**, remote fetch, local draft, and JSON import. It coerces types, drops unknown categories, and fills missing fields.

Do not merge raw input into the profile. An earlier `deepMerge` on import absorbed unknown keys silently, which masked schema drift instead of surfacing it.

### Data Model

`profiles` table schema:
- `shareId` (string, indexed): unique URL identifier
- `passwordHash` (string, optional): simple hash for password protection
- `userId` (Id<"users">, optional): if profile is claimed by a logged-in user
- `name`, `pronouns`, `photoUrl`: identity fields
- `data` (any): flexible JSON containing measurements, categories, hair, sets
- `createdAt`, `updatedAt` (number): timestamps

A stored item (`createItem`): `{ id, name, size, sizeSystem, fit, favorite, notes }`. `sizeSystem` defaults from `CATEGORY_META[category].system`, jeans open on `Waist × Length`, shoes on `US`, rings on `mm`.

## File Organization

### Frontend (ES Modules)
- **app.js**: Entry point. Parses the URL for a shareId, loads remote or draft, creates the zone panel, renders, binds events
- **state.js**: Convex client, mutable `state`, auth helpers, draft save/load/migrate, `loadProfile`/`saveProfile`
- **data.js**: `BODY_ZONES`, `MAPPED_ZONES`, `SIZE_SYSTEMS`, `FIT_OPTIONS`, `CATEGORY_META`, `MEASUREMENT_FIELDS`, `ZONE_COLORS`, factories (`uid`, `createItem`, `createSet`), `getDefaultProfile`, `normalizeProfile`
- **bodymap.js**: The body map SVG: art paths, clipped legs, hit regions
- **render.js**: `render` (edit/view), `renderZonePanel`, and the targeted refreshers (`refreshCategory`, `refreshHair`, `refreshSets`, `refreshZoneCounts`, `refreshSaveState`, `refreshSearch`, `syncZoneActive`)
- **events.js**: Delegated `data-action` handlers, auth flow, share modal, password modal
- **export.js**: JSON export, blank template export, import through `normalizeProfile`
- **utils.js**: `$`, `escHtml`, `showToast`, `debounce`, `getNestedValue`, `setNestedValue`, `copyToClipboard`

### Backend (Convex)
- **schema.ts**: `users` (username, passwordHash), `profiles` (shareId indexed)
- **auth.ts**: register, login (simpleHash, non-cryptographic)
- **profiles.ts**: getByShareId, create, save, list, updatePassword, verifyPassword

## Conventions

- No inline `onclick`. Every interaction is a `data-action` attribute resolved by delegation in `events.js`.
- Never edit `css/neorgon-header.css`, `css/neorgon-footer.css`, `js/neorgon-header.js` or `js/neorgon-footer.js`: they are vendored from `packages/neorgon-ui/` and are overwritten by the sync scripts.
- No site-local header CSS.

## Testing Locally

1. Start Convex backend: `make dev` (or `npx convex dev`)
2. Start frontend: `make serve` (or `python3 -m http.server 8829`)
3. Visit `http://localhost:8829`
4. Create a profile → measurements and brands
5. Click "Save & get link" → generates shareId, URL updates to `/p/{shareId}`
6. Click "Share Profile" → copy URL
7. Open URL in incognito → view mode loads

Worth checking by hand after touching the map or the panel:

- Point at the thigh gap and at the empty corners beside the figure. The gap belongs to `waist-legs`, the corners must hit nothing.
- Tab to the map, press Enter: the focused zone's panel opens; Escape closes it.
- Type in a brand field and keep typing: focus must not jump.
- Reload mid-edit: the draft comes back.
- At 390px wide: the sheet reaches the viewport floor, the chip strip scrolls, and the page has zero horizontal overflow.
