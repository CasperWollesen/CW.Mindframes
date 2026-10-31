# Vision & Plan: Mindframes (your photos, with a line to live by)

Documentation ID: `PLANNING-MINDFRAMES-VISION`
File revision: `2026_10_r1`
Last reviewed: `2026-10-31`
Status: Revision 1 (2026-10-31, from the first prompt and the Q1–Q6 answers) — Milestone 1 built and browser-checked (`APP-MINDFRAMES`); not yet committed or on a phone.
Original prompt: `AI Documentation/[Prompts]/2026_10_31_New_idea_prompt.md`
Related repositories (inspiration, not dependencies):
- `C:\Development\GitHub\CW.ShowerTimer` — skeleton (Vite + PWA config, Pages workflow, icon script), sheet/toast patterns, the "lovely to open" bar
- `C:\Development\GitHub\Conrad` — Dexie/IndexedDB pattern

## Short version

- **Problem:** in a busy, machine-heavy day the owner loses sight of the direction he wants to go.
- **Idea:** a private phone app with a handful of own photos, each framed with one short line ("Human before machine"), to swipe through in a few seconds.
- **First version:** add a photo from the phone, write the line, pick a style and the crop, swipe through full-screen frames, edit, delete, reorder, shuffle.
- **Not doing:** accounts, cloud, sync, reminders, backup, export as an image (Q5/Q6 on hold).
- **Next step:** Milestone 2 — try it on the owner's iPhone and publish on GitHub Pages.

## 1. Why this exists

"Når der så går for meget maskine i det, kan jeg lige åbne appen og se, hvad er det nu hvilken retning jeg vil gå." The owner wants positive mindset frames to scroll past: his own photos (for example from a bike ride) with his own words.

One user, on his own phone (iPhone first). Typically five good frames, swapped out over time. Losing them is acceptable: "er det væk, så kommer der nye ting man kan minde sig selv om".

Non-goals:
- Sharing frames with others, social features, cloud.
- A full image editor (filters, free text placement, colour pickers).

## 2. The idea in one paragraph

A home-screen app that opens straight onto the first frame: a full-screen photo with a line of text set in a beautiful type style. Swipe up for the next one. A small `+` picks a new photo from the phone, then a compact editor shows a live preview with three tabs — Text, Style, Photo. Everything is stored on the phone.

Scenario: Tuesday 14:10, three meetings in a row about automation. The owner opens Mindframes, sees the bike ride at sunrise with "Human before machine", swipes once more, closes the app.

## 3. Principles

1. **Local only.** The server only delivers the app. Photos and texts never leave the phone.
2. **Lovely to open.** Visual quality on the level of CW.ShowerTimer, not a utility look. Motion is gentle and respects reduced motion.
3. **Small and calm.** Few choices, good presets, undo instead of confirm, no badges.
4. **Disposable.** Clearing site data removes the frames, and that is fine. No backup nagging.

## 4. What was found (research)

| ID | Question | Finding | Source |
|---|---|---|---|
| R1 | Can a web app browse the photo gallery? | No. `<input type="file" accept="image/*">` opens the system photo picker (iOS and Android); the app receives a copy of the chosen file. | Inferred — platform knowledge, verify on the phone (M2) |
| R2 | Where can photos be stored? | `localStorage` is limited to about 5 MB, too small. IndexedDB stores Blobs; downscaled JPEGs of ~0.3–0.8 MB each fit easily. | Inferred — platform knowledge |
| R3 | iPhone storage specifics | A Home Screen web app has its own storage, separate from Safari. Install first, then add photos. Removing the app removes its data. | Inferred — platform knowledge, verify on the phone (M2) |

Experiments: none yet. E1 (M2) — add 10 phone photos on the owner's iPhone, close and reopen the app, check that all frames survive.

## 5. User-facing behaviour

- **Feed (home):** full-screen frames in a vertical scroll-snap list, one per screen. A soft scrim keeps the text readable. The active frame drifts slowly (subtle zoom) and its text fades in. Small round buttons at the top: arrange, add, edit this frame. Tapping the photo hides/shows the buttons. A dot rail on the right shows the position (a counter above 10 frames).
- **Empty state:** an example frame (gradient, no photo) with "Human before machine." and a large "Add your first frame" button.
- **Add:** `+` opens the system picker → the photo is downscaled → the editor opens with a draft. Nothing is stored before Save.
- **Editor:** a live preview with the same proportions as the screen, then three tabs:
  - *Text* — the line (max 80 characters) and an optional small line (max 48).
  - *Style* — four styles (Serif, Bold, Calm, Note) and position (Top, Middle, Bottom).
  - *Photo* — drag the preview to move the crop, zoom 1–3×, change photo.
  - Header: close, title, delete (existing frames, with Undo in a toast), Save. Closing with changes asks Discard / Keep editing.
- **Arrange (sheet):** list of frames with thumbnail and line; drag the handle (or arrow keys) to reorder; Shuffle (with Undo); tap a frame to edit it. Theme switch (dark default, light) and a short privacy note with the version.

## 6. Data model and storage

IndexedDB database `mindframes` via Dexie, one table `frames`:

```text
Frame { id, title, subtitle, style: serif|bold|calm|note, position: top|middle|bottom,
        focusX 0–100, focusY 0–100, zoom 1–3, order, createdAt, updatedAt,
        image: Blob (JPEG), imageWidth, imageHeight }
```

- Schema version 1. Add fields with defaults; bump the Dexie version with an upgrade step.
- Imported photos are re-encoded to JPEG, longest side at most 2048 px, quality 0.86. Originals are never modified.
- Preferences (theme only) in `localStorage` key `cw-mindframes.v1`.
- `navigator.storage.persist()` is requested silently after the first save. Nothing else protects the data (D8).

## 7. Architecture

```text
App/src/
  domain/frames.ts      pure: types, normalisation, crop/pan maths, title sizing, ordering, shuffle (Vitest)
  domain/image.ts       pure: target size for downscaling (Vitest)
  storage/repository.ts the only module that touches IndexedDB and localStorage
  photo.ts              browser-only: decode a picked file and re-encode it on a canvas
  texts.ts              every UI string
  ui/                   FrameView, Feed, Editor, ArrangeSheet, Sheet, Toast
  styles/               tokens.css (dark + light), app.css
```

What can go wrong: decoding fails (unsupported format) → toast, nothing stored. IndexedDB unavailable (private mode) → a persistent notice; the app still shows the empty state. Quota exceeded on save → toast, the draft stays open.

## 8. Harness and verification

- `cd App`, `npm run typecheck`, `npm test`, `npm run build`.
- Production preview (`vite preview`) in the browser pane at 375×629 (iPhone 13 mini Safari) and desktop, dark and light, no console errors.
- Real photo picking, storage survival and installation on the iPhone are device QA (M2).

## 9. Rejected alternatives (and why)

- `localStorage` with data URLs — too small (≈5 MB) and slow for photos.
- A free-form editor (drag text, colours, any font) — more choice, less beauty; presets keep every frame good-looking.
- Fonts from a CDN — runtime network dependency; bundled fonts (`@fontsource`) are precached and work offline.
- System fonts only — iPhone, Android and Windows would show different frames; a few bundled faces give one consistent look.
- Rendering frames to images on save — not needed for viewing; text stays editable. Revisit with Q5.

## 10. Plan

### Milestone 1 – First lovely version (v0.1)
- [x] Repo, AGENTS.md, vision, skeleton from CW.ShowerTimer, icons
- [x] Domain: frame model, crop/pan maths, title sizing, ordering, shuffle — with tests
- [x] Storage: Dexie repository, theme preference
- [x] Feed with scroll-snap, drift, dot rail, chrome toggle, empty state
- [x] Add flow with downscaling; editor with Text / Style / Photo tabs
- [x] Delete with Undo; Arrange sheet with drag reorder and Shuffle with Undo; theme switch
- [x] Typecheck, tests, build; browser check at 375×629 and desktop, dark and light

### Milestone 2 – On the phone
- [ ] Commit and push; enable GitHub Pages (owner's go)
- [ ] Install on the owner's iPhone; E1 storage survival; check picker, HEIC photos, safe areas and swipe feel

### Ideas parked (not planned)
- Save a frame as an image via the share sheet, e.g. as a lock screen (Q5, on hold).
- Backup / restore to a file (Q6, on hold).
- Pinch to zoom in the editor.
- Open on a random frame.

## 11. Decisions and open questions

| ID | Decision | Who / when |
|---|---|---|
| D1 | Name **Mindframes**, repo `CW.Mindframes`, public, GitHub Pages like CW.ShowerTimer | owner, 2026-10-31 |
| D2 | React 19 + TypeScript + Vite 7 + vite-plugin-pwa, copied from CW.ShowerTimer | agent (playbook default), 2026-10-31 |
| D3 | Photos in IndexedDB via Dexie 4, downscaled to 2048 px JPEG on import | agent, 2026-10-31 |
| D4 | One line + optional small line, four preset styles, three positions | owner (Q2), 2026-10-31 |
| D5 | The photo fills the screen; drag for the crop, zoom slider | owner (Q3), 2026-10-31 |
| D6 | Own order with drag-to-sort plus Shuffle | owner (Q4), 2026-10-31 |
| D7 | Display fonts bundled with `@fontsource` (Fraunces, Oswald, Caveat); UI uses the system font | agent, 2026-10-31 |
| D8 | No backup and no export in v1; losing data on a cache clear is acceptable | owner (Q5/Q6 on hold), 2026-10-31 |
| D9 | English UI, dark default, light as a preference; frame texts are free (Danish is fine) | agent (playbook default), 2026-10-31 |
| D10 | "More ShowerTimer than SnackTrainer": visual quality is a requirement | owner, 2026-10-31 |

Open questions (only the owner can answer):
1. **Q5** — Save a frame as an image (lock screen)? *(2026-10-31: on hold)*
2. **Q6** — Backup / restore? *(2026-10-31: on hold)*

## 12. Verification checklist

- [x] Builds, tests pass (real count in the feature note)
- [x] Rendered in dark and light — screenshots in `[Images]`
- [x] No real personal data anywhere in the repo

## Search Anchor

```text
PLANNING-MINDFRAMES-VISION
```
