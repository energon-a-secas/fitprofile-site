# Body Map: Design Record

Why the map is built the way it is, and what breaks if you change it back. Code lives in `js/bodymap.js` and the `Body map` block of `css/style.css`.

## The problem this replaced

The first map was **eight separately-positioned SVGs**, absolutely placed inside a `.human-body` container and layered with z-index. Each one was a rectangular element sitting over the figure, so hovering anywhere inside a rectangle's bounds lit that zone up. The shape you got never matched the body part you were pointing at. The reported "weird hover shape".

Two things made it unfixable by tweaking:

- The legs artwork is **one path**, shared by `waist-legs` and `feet`. One element cannot carry two tints.
- Arms and hands are **two disjoint shapes each**. Neither zone can be expressed as a single box.

Mobile made it worse: the whole container was scaled `0.8`, which scaled the mismatch along with the art.

## The architecture

One SVG, `viewBox="-8 -14 223 516"`, two sibling layers.

```
<svg class="body-map">
  <defs>            shared legs path + two clipPaths (userSpaceOnUse)
  <g class="body-art" aria-hidden="true">     decoration, pointer-events: none
  <g class="body-hit">                        every hit test lives here
```

**`.body-art`** holds the anatomical paths (`head`, `shoulder`, `cheast`, `stomach`, `arm`, `hands`) plus the legs path drawn twice. Each part gets a `zone-*` class so it can be tinted by the zone it belongs to. It is `aria-hidden` and never receives a pointer event.

**`.body-hit`** holds one `<g class="hit-zone" data-zone role="button" tabindex="0" aria-pressed>` per mapped zone, containing rounded rects (or one hand-authored torso path). Regions are sized so every one clears the 44px touch-target guideline at the map's rendered size. `arm` and `hands` are two rects each.

### Hit regions are invisible

This is the fix, and it is deliberate:

```css
.hit-zone { fill: transparent; stroke: transparent; }
.hit-zone:focus-visible { stroke: #fff; stroke-dasharray: 5 4; }
```

The region is a fat rounded box because that is what makes pointing reliable. Drawing it puts a shape on screen that does not match the body underneath, which *is* the bug. The feedback is the art beneath lighting up instead, selected from the parent:

```css
.body-map:has(.hit-zone.is-active) .art-part { opacity: 0.28; }
.body-map:has(.hit-zone[data-zone="head"].is-active) .art-part.zone-head,
/* …five more… */ { opacity: 1; filter: drop-shadow(0 0 10px var(--glow)); }
```

Keyboard focus is the one exception. A dashed outline appears on `:focus-visible` because a keyboard user needs to know where they are, and by then the box is the honest answer to "what will Enter activate".

## Three traps

**1. `drop-shadow` inside `clip-path` is cut at the clip edge.**

The legs path is drawn twice, clipped above and below the ankle line, so `waist-legs` and `feet` can be tinted separately. If the styled element carries the clip, its glow is clipped too and reads as a hard rectangle. The styled element must **wrap** the clip:

```html
<g class="art-part zone-feet">        <!-- styled: fill, glow -->
  <g clip-path="url(#fp-clip-feet)">  <!-- clipped -->
    <use href="#fp-legs"/>
```

`clipPathUnits="userSpaceOnUse"` matters: the clip paths are authored in the same user units as the art, not as 0–1 fractions.

**2. `drop-shadow` needs an explicit colour.** `currentColor` resolves to inherited text colour and glows white. Each part sets its own `--glow`, which also lets all six lit rules share a single declaration block instead of repeating per zone.

**3. Hover must be gated to pointing devices.**

```css
@media (hover: hover) { /* hover variants only */ }
```

On touch there is no un-hover, so an ungated rule leaves the last-tapped region lit in a state nobody chose. Gating the affordance is the fix; overriding it back inside `@media (hover: none)` loses the specificity fight.

## Zone mapping

Eight zones in `BODY_ZONES`; six drawn (`MAPPED_ZONES`).

| Zone ID | Art parts | Categories | Measurements |
|---|---|---|---|
| `head` | head | hair, hats | none |
| `torso` | shoulder + cheast + stomach | shirts, jackets, hoodies, belts, underwear | shoulders, chest, waist (cm) |
| `waist-legs` | legs, clipped above the ankle | pants, jeans, socks | hips, inseam (cm) |
| `feet` | legs, clipped below the ankle | shoes | foot length (cm) |
| `arm` | arm | watches, bracelets | wrist (cm) |
| `hands` | hands | rings, gloves | ring finger, pinky (mm), palm width (cm) |
| `accessories` | *not drawn* | glasses, jewelry, perfume, skincare | none |
| `sets` | *not drawn* | outfits | none |

`torso` owns the waist measurement: shirts, jackets and belts all need it. `waist-legs` carries hips and inseam for pants. `feet` is split from the legs so shoe sizing stands alone. `accessories` and `sets` have no anatomical home and live in the zone list only; giving them floating buttons beside the figure only added two more boxes that were not the body.

## Responsive

No container scaling. The SVG scales as an SVG (`max-width` tuned at 380px), so hit regions stay aligned to the art at every width. The old `transform: scale(0.8)` scaled the mismatch too.

Under 700px the right-hand panel becomes a bottom sheet and the zone list becomes a horizontal scroll-snap chip strip placed **above** the figure (`order: -1`): on a phone the chips are the fast path, and a full-height figure would push every zone below the fold.

## Verified

Browser-measured at 1280×1000 and 390×844:

- 15-point hit probe correct, including the **thigh gap** (belongs to `waist-legs`) and the empty corners beside the figure (must hit nothing).
- Each of the six zones lights exactly its own art, silhouette-shaped, with no drawn box.
- Enter on a focused region opens that zone; Escape closes.
- Mobile: sheet spans the full width to the viewport floor, chip strip scrolls, zero horizontal overflow.

## Regression checklist

- [ ] Hover each zone: the glow traces the silhouette, no rectangle anywhere, especially on legs and feet.
- [ ] Hover the thigh gap and the empty corners: gap lights the legs, corners light nothing.
- [ ] Tab through the map: dashed outline follows focus, Enter opens the right panel.
- [ ] Tap a zone on a touch device, then tap elsewhere: nothing stays lit.
- [ ] Resize through 700px: chip strip and sheet swap in cleanly, no horizontal scrollbar.

## Not done

- Gender / body-shape variants (would need a second art set and a second hit-region table).
- Highlighting related parts when hovering a category name in the panel.
- Measurement labels drawn on the body.

`human-body-svg-with-js/` is the reference the art was adapted from. It is not imported by anything at runtime.
