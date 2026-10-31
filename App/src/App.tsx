import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, LayoutGrid, PenLine, Plus, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { defaultLook, firstOrder, lookOf, moveItem, shuffled, sortByOrder, withOrder } from './domain/frames';
import type { Frame, FrameLook } from './domain/frames';
import { deleteFrame, loadFrames, putFrame, readPreferences, requestPersistence, saveOrder, savePreferences } from './storage/repository';
import type { Preferences } from './storage/repository';
import { preparePhoto } from './photo';
import type { PreparedPhoto } from './photo';
import { ArrangeSheet } from './ui/ArrangeSheet';
import { Editor } from './ui/Editor';
import { Feed } from './ui/Feed';
import { FrameView } from './ui/FrameView';
import { texts } from './texts';
import { version } from '../package.json';

interface EditorState {
  /** null while creating a new frame. */
  frameId: string | null;
  initial: FrameLook;
  photo: PreparedPhoto;
  src: string;
  /** The editor created this object URL and must revoke it. */
  ownsSrc: boolean;
  photoChanged: boolean;
}
interface Toast { message: string; undo?: () => void }

const TOAST_MS = 6000;
const newId = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInstalled = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

function useScreenRatio() {
  const read = () => window.innerWidth / Math.max(1, window.innerHeight);
  const [ratio, setRatio] = useState(read);
  useEffect(() => {
    const update = () => setRatio(read());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return ratio;
}

/** One object URL per stored photo, created once and revoked when the frame or its photo goes away. */
function usePhotoUrls(frames: Frame[] | null) {
  const cache = useRef(new Map<string, { image: Blob; url: string }>());
  return useMemo(() => {
    const urls = new Map<string, string>();
    for (const frame of frames ?? []) {
      let entry = cache.current.get(frame.id);
      if (!entry || entry.image !== frame.image) {
        if (entry) URL.revokeObjectURL(entry.url);
        entry = { image: frame.image, url: URL.createObjectURL(frame.image) };
        cache.current.set(frame.id, entry);
      }
      urls.set(frame.id, entry.url);
    }
    for (const [id, entry] of cache.current) if (!urls.has(id)) { URL.revokeObjectURL(entry.url); cache.current.delete(id); }
    return urls;
  }, [frames]);
}

export default function App() {
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  const [active, setActive] = useState(0);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const ratio = useScreenRatio();
  const urls = usePhotoUrls(frames);
  const feedRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickFor = useRef<'new' | 'replace'>('new');
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  const list = frames ?? [];
  const current = list[Math.min(active, list.length - 1)];

  useEffect(() => { loadFrames().then(setFrames, () => { setFrames([]); setStorageOk(false); }); }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    savePreferences(preferences);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
  }, [preferences]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), TOAST_MS); return () => clearTimeout(id); }, [toast]);
  // An object URL made for a picked photo is released once the editor lets go of it.
  const ownedUrl = useRef<string | null>(null);
  useEffect(() => {
    const next = editor?.ownsSrc ? editor.src : null;
    if (ownedUrl.current && ownedUrl.current !== next) URL.revokeObjectURL(ownedUrl.current);
    ownedUrl.current = next;
  }, [editor?.src, editor?.ownsSrc]);

  const scrollToIndex = (index: number) => requestAnimationFrame(() => {
    (feedRef.current?.children[index] as HTMLElement | undefined)?.scrollIntoView({ block: 'start' });
  });
  const pickPhoto = (purpose: 'new' | 'replace') => {
    pickFor.current = purpose;
    const input = fileRef.current;
    if (!input) return;
    input.value = '';
    input.click();
  };
  const onPhotoPicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const photo = await preparePhoto(file);
      const src = URL.createObjectURL(photo.image);
      if (pickFor.current === 'replace') setEditor(open => open ? { ...open, photo, src, ownsSrc: true, photoChanged: true } : open);
      else setEditor({ frameId: null, initial: defaultLook, photo, src, ownsSrc: true, photoChanged: false });
    } catch {
      setToast({ message: texts.toast.photoFailed });
    } finally {
      setBusy(false);
    }
  };
  const openEditor = (frame: Frame) => {
    setArrangeOpen(false);
    setEditor({ frameId: frame.id, initial: lookOf(frame), photo: { image: frame.image, width: frame.imageWidth, height: frame.imageHeight }, src: urls.get(frame.id) ?? '', ownsSrc: false, photoChanged: false });
  };
  const saveEditor = async (look: FrameLook) => {
    if (!editor) return;
    const now = Date.now();
    const existing = list.find(frame => frame.id === editor.frameId);
    const photo = { image: editor.photo.image, imageWidth: editor.photo.width, imageHeight: editor.photo.height };
    const frame: Frame = existing
      ? { ...existing, ...look, ...photo, updatedAt: now }
      : { ...look, ...photo, id: newId(), order: firstOrder(list), createdAt: now, updatedAt: now };
    try { await putFrame(frame); } catch { setToast({ message: texts.toast.saveFailed }); return; }
    const next = sortByOrder(existing ? list.map(item => item.id === frame.id ? frame : item) : [frame, ...list]);
    setFrames(next);
    setEditor(null);
    setChromeHidden(false);
    scrollToIndex(next.findIndex(item => item.id === frame.id));
    if (!existing) void requestPersistence();
  };
  const removeFrame = async (frame: Frame) => {
    try { await deleteFrame(frame.id); } catch { setToast({ message: texts.toast.saveFailed }); return; }
    setFrames(items => (items ?? []).filter(item => item.id !== frame.id));
    setEditor(null);
    setToast({
      message: texts.toast.deleted,
      undo: async () => {
        try { await putFrame(frame); } catch { setToast({ message: texts.toast.saveFailed }); return; }
        setFrames(items => sortByOrder([...(items ?? []), frame]));
        setToast({ message: texts.toast.restored });
      }
    });
  };
  const applyOrder = (next: Frame[]) => {
    setFrames(next);
    saveOrder(next).catch(() => setToast({ message: texts.toast.orderFailed }));
  };
  const moveFrame = (from: number, to: number) => applyOrder(withOrder(moveItem(list, from, to)));
  const shuffleFrames = () => {
    const previous = list;
    applyOrder(withOrder(shuffled(list)));
    scrollToIndex(0);
    setToast({ message: texts.toast.shuffled, undo: () => { applyOrder(withOrder(previous)); setToast(null); } });
  };
  const onActiveChange = useCallback((index: number) => setActive(index), []);

  const toastView = toast && <div className="toast" role="status">
    <span>{toast.message}</span>
    {toast.undo && <button className="toast-action" onClick={toast.undo}>{texts.toast.undo}</button>}
    <button className="icon-button" aria-label={texts.toast.dismiss} onClick={() => setToast(null)}><X size={16} /></button>
  </div>;
  const menuButton = <button className="glass-button" onClick={() => setArrangeOpen(true)} aria-label={texts.feed.arrange}><LayoutGrid size={19} /></button>;

  return <>
    {frames === null && <div className="loading" aria-busy="true" />}
    {frames !== null && list.length === 0 && <main className="empty-state">
      <FrameView look={{ ...defaultLook, title: texts.example.title, subtitle: texts.example.subtitle, position: 'top' }} active />
      <header className="feed-chrome"><span className="brand"><em>mind</em>frames<i>.</i></span><div className="chrome-actions">{menuButton}</div></header>
      <div className="welcome">
        <p className="welcome-tagline">{texts.tagline}</p>
        <button className="primary" onClick={() => pickPhoto('new')}><ImagePlus size={20} />{texts.empty.add}</button>
        <small>{texts.empty.privacy}</small>
        {isIos() && !isInstalled() && <small className="welcome-tip">{texts.empty.installTip}</small>}
      </div>
    </main>}
    {list.length > 0 && <main>
      <Feed frames={list} urls={urls} active={Math.min(active, list.length - 1)} chromeHidden={chromeHidden} scrollRef={feedRef} onActiveChange={onActiveChange} onToggleChrome={() => setChromeHidden(hidden => !hidden)} />
      <header className={'feed-chrome' + (chromeHidden ? ' hidden' : '')}>
        <span className="brand"><em>mind</em>frames<i>.</i></span>
        <div className="chrome-actions">
          {current && <button className="glass-button" onClick={() => openEditor(current)} aria-label={texts.feed.edit}><PenLine size={19} /></button>}
          <button className="glass-button" onClick={() => pickPhoto('new')} aria-label={texts.feed.add}><Plus size={21} /></button>
          {menuButton}
        </div>
      </header>
    </main>}
    {editor && <Editor key={editor.frameId ?? 'new'} isNew={editor.frameId === null} initial={editor.initial} photo={{ src: editor.src, width: editor.photo.width, height: editor.photo.height }}
      photoChanged={editor.photoChanged} ratio={ratio} onSave={look => void saveEditor(look)} onClose={() => setEditor(null)} onChangePhoto={() => pickPhoto('replace')}
      onDelete={editor.frameId ? () => { const frame = list.find(item => item.id === editor.frameId); if (frame) void removeFrame(frame); } : undefined} />}
    {arrangeOpen && <ArrangeSheet frames={list} urls={urls} ratio={ratio} theme={preferences.theme} version={version} toast={toastView}
      onClose={() => setArrangeOpen(false)} onEdit={openEditor} onMove={moveFrame} onShuffle={shuffleFrames}
      onAdd={() => { setArrangeOpen(false); pickPhoto('new'); }} onTheme={theme => setPreferences(p => ({ ...p, theme }))} />}
    <input ref={fileRef} type="file" accept="image/*" hidden onChange={event => void onPhotoPicked(event)} />
    {busy && <div className="busy" role="status"><div><span className="spinner" />{texts.preparing}</div></div>}
    {!storageOk && <div className="notice" role="alert">{texts.storageUnavailable}</div>}
    {needRefresh && !editor && <div className="notice update">{texts.update.ready}<button className="toast-action" onClick={() => void updateServiceWorker(true)}>{texts.update.action}</button></div>}
    {!arrangeOpen && toastView}
  </>;
}
