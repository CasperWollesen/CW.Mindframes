# Mindframes 🌅

Your photos, with a line to live by. A private phone app: pick a photo, write one short line,
choose a style, and swipe through your frames whenever the day gets too busy.

Everything stays on your phone. No account, no cloud, no tracking. The server only delivers the app.

## Run locally

Requires Node.js 22.12+ (on Casper's PC: the copy bundled with Visual Studio, see `AGENTS.md`).

```powershell
cd C:\Development\GitHub\CW.Mindframes\App
npm install
npm run dev
```

Open http://127.0.0.1:5174/CW.Mindframes/ on your PC.

```powershell
npm run typecheck
npm test
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 4174
```

The production preview at http://127.0.0.1:4174/CW.Mindframes/ includes the service worker.
The development server intentionally does not register one.

## Features

- **Frames to swipe:** one full-screen frame per swipe. Tap the photo to hide the buttons.
- **Add from your phone:** `+` opens the phone's own photo picker. The app keeps a copy (at most 2048 px), so deleting the original doesn't matter.
- **Editor:** a live preview with your screen's proportions. Write your line and an optional small line,
  pick a style (Serif, Bold, Calm, Note) and where the words go, drag the photo and zoom to choose what shows.
- **Arrange:** drag frames into your order, or Shuffle. Delete and Shuffle can be undone.
- **Dark by default**, light as a preference.

On iPhone, add Mindframes to the Home Screen before adding photos: the Home Screen app keeps its own storage.
Clearing the site's data or removing the app removes your frames. That's fine — new ones will come.

## Structure

```text
App/                       Source, assets and build configuration
  src/domain/              Pure frame logic and image sizing (tested)
  src/storage/             IndexedDB (Dexie) and preferences
  src/ui/                  Feed, editor, arrange sheet, frame view
  src/styles/              Theme tokens and styles
.github/workflows/         GitHub Pages deployment
AI Documentation/          Vision, feature note, prompts, screenshots
```

## GitHub Pages

In repository Settings → Pages → Source choose **GitHub Actions**. The workflow builds `App/` and deploys
`App/dist` on a push to `main` or a manual run. The base path and PWA scope follow the repository name
(`/CW.Mindframes/`, override with `BASE_PATH`).

PNG icons are committed. Regenerate on Windows with:

```powershell
powershell -ExecutionPolicy Bypass -File App/scripts/generate-icons.ps1
```
