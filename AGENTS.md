# Working on Mindframes

Instructions for anyone changing this repository, human or AI. Two minutes to read.

Mindframes is a private, offline-first phone PWA: the owner's own photos, each framed with one
short line, to swipe through when the day gets too busy. React 19 + TypeScript + Vite + vite-plugin-pwa,
static GitHub Pages, no backend, accounts, analytics, CDN fonts or runtime network dependencies.

General rules for all of Casper's repos: `C:\Development\GitHub\CW.Workshop\AI Documentation\README.md`.
This file wins where they differ.

## Layout

```text
App/                          everything that ships
  src/domain/                 pure logic (frames, crop maths, image sizing) — Vitest
  src/storage/repository.ts   the only module that touches IndexedDB (Dexie) and localStorage
  src/photo.ts                decodes a picked photo and re-encodes it on a canvas
  src/texts.ts                every UI string
  src/ui/                     components
  src/styles/                 tokens.css (dark + light) and app.css
  scripts/generate-icons.ps1  regenerates the PNG icons
AI Documentation/             vision, feature notes, verbatim prompts
.github/workflows/deploy.yml  GitHub Pages build
```

## Ground rules

1. Read `AI Documentation/[Planning]/Mindframes Vision & Plan v1.md` first; work its open checkboxes in order.
2. Photos and texts never leave the device. No upload, no sync, no analytics.
3. Never break stored frames: add fields with defaults, bump the Dexie version, write an upgrade step.
4. Keep the boundaries: `domain/` is pure; only `storage/repository.ts` touches storage.
5. English code, comments, UI and docs. UI strings live in `src/texts.ts`. Frame texts are the owner's own (any language).
6. Dark first, light as a preference; nothing may flash white. The theme is set before first paint.
7. Visual quality is a requirement: gentle motion, good type, no utility look. Respect reduced motion.
8. Undo instead of confirm (delete, shuffle). Losing data on a cache clear is accepted — no backup nagging.
9. Fonts are bundled with `@fontsource`, never loaded from a CDN. No new dependency without a decision in the vision.
10. No real personal photos in the repo, tests or screenshots. Demo visuals are gradients.
11. Say what was not verified (photo picker, install, storage survival need a real phone).

## The loop for a change

```powershell
$env:PATH = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs;" + $env:PATH
cd App
npm run typecheck
npm test
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 4174   # http://127.0.0.1:4174/CW.Mindframes/
```

## Things that will bite you

- The dev server does not register the service worker; check offline behaviour with `vite preview`.
- The feed relies on `100dvh` and scroll-snap. Check at 375×629 (iPhone 13 mini Safari) and in an installed app (safe areas).
- Frame text sizes use container query units (`cqw`), so the editor preview and the full-screen frame match. Keep it that way.
- Safari decodes HEIC; Chrome on Windows does not. A failed decode must show a toast and store nothing.

## When a change is done

- Feature note in `AI Documentation/` updated (Verified / Not verified), vision checkbox ticked.
- Version in `App/package.json` bumped for user-visible changes.

## Commits

Commit only when the owner says so. Pushing to `main` deploys to GitHub Pages.

## Conversation language

Casper writes Danish (often dictated — read the intent). Answer in Danish; write everything in the repo in English.
