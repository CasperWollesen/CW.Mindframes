# Mindframes app (feed, editor, arrange, storage)

Documentation ID: `APP-MINDFRAMES`
File revision: `2026_10_r1`
Last reviewed: `2026-10-31`
Related code:
- `App/src/App.tsx` — app state, photo picking, save/delete/undo, order and shuffle
- `App/src/ui/FrameView.tsx` — one frame (photo, scrim, words); used by feed, editor and thumbnails
- `App/src/ui/Feed.tsx`, `App/src/ui/Editor.tsx`, `App/src/ui/ArrangeSheet.tsx` — the three screens
- `App/src/domain/frames.ts`, `App/src/domain/image.ts` — pure logic with Vitest tests
- `App/src/storage/repository.ts` — Dexie (IndexedDB) and the theme preference
- `App/src/photo.ts` — decode and downscale a picked photo
- `App/src/styles/app.css` — frame styles, layout and motion
Related documentation:
- `PLANNING-MINDFRAMES-VISION` — why, decisions D1–D10, milestones

## Short version

- Full-screen frames in a vertical scroll-snap feed; tap a photo to hide the buttons. A dot rail shows the position (a counter above 10).
- `+` opens the system photo picker; the photo is re-encoded to a JPEG of at most 2048 px and opens in the editor. Nothing is stored before Save.
- Editor: live preview with the screen's proportions; tabs Text (line ≤ 80, small line ≤ 48), Style (Serif, Bold, Calm, Note; Top/Middle/Bottom), Photo (drag the preview, zoom 1–3×, reset, change photo). Save needs a line.
- Delete and Shuffle have Undo in a toast. Closing the editor with changes asks Keep editing / Discard.
- Arrange sheet: drag handles or arrow keys to reorder, tap to edit, Shuffle, Add, Dark/Light, version and privacy note.
- Everything is stored in IndexedDB on the device. Clearing site data removes it, by design.

## How a frame is drawn

- The frame is a size container. Text sizes use `--u: min(1cqw, .62cqh)`, so a portrait phone scales by width and a landscape window by height. The same composition shows in a 42 px thumbnail, the editor preview and the full screen.
- The photo uses `object-fit: cover` with `object-position` and a `scale()` around the same focus point. `panFocus` converts a drag in pixels to a focus change in percent of the hidden overflow, so the photo follows the finger exactly.
- `titleSize` sets short lines large and shrinks long lines and long words (`Automatiseringsprojekter`) so they stay inside the frame.
- The frame on screen drifts slowly (scale to 1.07 over 24 s, around the focus point) and fades its words in. Reduced motion turns all animation off.
- Fonts are bundled with `@fontsource`: Fraunces (soft italic), Oswald, Caveat. Only their Latin subsets are precached.

## Things to know

- New frames get an order below the current first one, so they appear first. Reorder and Shuffle renumber 0…n−1 and write only the `order` field.
- Object URLs: one per stored photo (`usePhotoUrls`), revoked when a frame or its photo goes; the editor revokes the URL it made for a picked photo when it lets go.
- After Shuffle the feed scrolls to the top. Undoing a Shuffle keeps the frame you were looking at in view (browser scroll anchoring).
- The update prompt and the storage notice sit under the top buttons, so they never cover the words at the bottom of a frame. Toasts sit at the bottom for 6 s.
- On iPhone, the empty state shows an "add to Home Screen first" tip when not installed, because the Home Screen app has its own storage.

## Verification

Verified 2026-10-31:
- `npm run typecheck` — no errors. `npm test` — 2 files, 21 tests passed. `npm run build` — exit 0, precache 21 entries (661.86 KiB).
- Production preview (`vite preview`, service worker active) in the browser pane at 375×629, dark and light, plus desktop 1024×768. No console errors.
- Picking was simulated by putting generated JPEGs (4000×3000, 3000×4000, 4032×3024) into the file input; stored photos were 2048×1536 / 1536×2048.
- Checked: empty state; editor text, all four styles, three positions, drag to crop, zoom buttons; save; feed snap and dot rail; edit; delete + Undo; unsaved-changes prompt; Arrange drag reorder, arrow-key reorder with focus kept, Shuffle + Undo; theme switch; reload keeps frames, order and theme; update prompt and Update.
- Screenshots: `AI Documentation/[Images]/2026_10_31_*.jpg` (synthetic demo photos only).
- Deployed to https://casperwollesen.github.io/CW.Mindframes/ (GitHub Actions run 41182021840: build and deploy succeeded). The live page loads without console errors, the manifest has name, scope `/CW.Mindframes/` and three icons, and the service worker controls the page after one reload.

Not verified:
- The real photo picker, HEIC photos, installing to the Home Screen, safe areas and swipe feel on an actual iPhone or Android phone.
- That frames survive closing the installed app and a few days of not using it (vision E1).
- Touch dragging of the arrange handles and the preview with a finger (only mouse pointer events in the pane).

## Search Anchor

```text
APP-MINDFRAMES
```
