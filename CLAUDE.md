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

ES modules require an HTTP server — `file://` will not work.

## Architecture

**Frontend:** Modular ES modules with interactive SVG body map  
**Backend:** Convex (users, profiles tables)  
**Deployment:** GitHub Pages (frontend) + Convex Cloud (backend)

Convex URL is hardcoded in `js/state.js` — currently `https://adjoining-gnat-230.convex.cloud`.

## Key Concepts

### Shareable Profile URLs

Each profile gets a unique `shareId` (8-char nanoid) generated client-side when first saved. URLs follow the pattern `/p/{shareId}`. Profiles can optionally have password protection (simple hash stored in Convex).

### Body Map Navigation

9 clickable SVG zones: head, torso, waist, legs, feet, hands, accessories, grooming, sets. Clicking a zone opens a slide-in panel from the right with relevant measurement inputs and brand lists.

### Data Model

`profiles` table schema:
- `shareId` (string, indexed) — unique URL identifier
- `passwordHash` (string, optional) — simple hash for password protection
- `userId` (Id<"users">, optional) — if profile is claimed by a logged-in user
- `name`, `pronouns`, `photoUrl` — identity fields
- `data` (any) — flexible JSON containing measurements, categories, hair, sets
- `createdAt`, `updatedAt` (number) — timestamps

## File Organization

### Frontend (ES Modules)
- **app.js** — Entry point, parses URL for shareId, calls loadProfile, renders, binds events
- **state.js** — Convex client, auth helpers, loadProfile/saveProfile
- **data.js** — Body zones array, category schemas, default profile structure
- **render.js** — renderBodyMap (SVG), renderZonePanel (slide-in), renderViewMode, renderEditMode
- **events.js** — Delegated click/input handlers, auth flow, share modal, password modal
- **utils.js** — escHtml, debounce, getNestedValue, setNestedValue, toast, copyToClipboard

### Backend (Convex)
- **schema.ts** — `users` (username, passwordHash), `profiles` (shareId indexed)
- **auth.ts** — register, login (simpleHash, non-cryptographic)
- **profiles.ts** — getByShareId, create, save, list, updatePassword, verifyPassword

## Testing Locally

1. Start Convex backend: `make dev` (or `npx convex dev`)
2. Start frontend: `make serve` (or `python3 -m http.server 8829`)
3. Visit `http://localhost:8829`
4. Create a profile → measurements and brands
5. Click "Save Profile" → generates shareId, URL updates to `/p/{shareId}`
6. Click "Share Profile" → copy URL
7. Open URL in incognito → view mode loads
