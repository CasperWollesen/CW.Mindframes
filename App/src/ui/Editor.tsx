import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { AlignVerticalJustifyCenter, ArrowDownToLine, ArrowUpToLine, Check, ImagePlus, Move, RotateCcw, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { canSave, finalLook, framePositions, frameStyles, lookChanged, normalizeLook, panFocus, SUBTITLE_MAX, TITLE_MAX, ZOOM_MAX, ZOOM_MIN } from '../domain/frames';
import type { FrameLook, FramePosition, Size } from '../domain/frames';
import { FrameView } from './FrameView';
import { Sheet } from './Sheet';
import { texts } from '../texts';

type Tab = 'text' | 'style' | 'photo';
const t = texts.editor;
const positionIcons: Record<FramePosition, ReactNode> = { top: <ArrowUpToLine size={17} />, middle: <AlignVerticalJustifyCenter size={17} />, bottom: <ArrowDownToLine size={17} /> };

/** Full-screen editor: a live preview with the screen's proportions, and three small tabs below it. */
export function Editor({ isNew, initial, photo, photoChanged, ratio, onSave, onClose, onDelete, onChangePhoto }: {
  isNew: boolean;
  initial: FrameLook;
  photo: Size & { src: string };
  /** A replaced photo counts as an unsaved change. */
  photoChanged: boolean;
  /** Screen width / height, so the preview matches the feed. */
  ratio: number;
  onSave: (look: FrameLook) => void;
  onClose: () => void;
  onDelete?: () => void;
  onChangePhoto: () => void;
}) {
  const [look, setLook] = useState(initial);
  const [tab, setTab] = useState<Tab>('text');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const drag = useRef<{ pointer: number; x: number; y: number } | null>(null);
  const shownPhoto = useRef(photo.src);
  const dirty = photoChanged || lookChanged(initial, look);
  const patch = (values: Partial<FrameLook>) => setLook(current => normalizeLook({ ...current, ...values }));
  const close = () => { if (dirty) setConfirmLeave(true); else onClose(); };

  // A new photo starts centred again.
  useEffect(() => {
    if (shownPhoto.current === photo.src) return;
    shownPhoto.current = photo.src;
    setLook(current => ({ ...current, focusX: 50, focusY: 50, zoom: 1 }));
  }, [photo.src]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !confirmLeave) { event.preventDefault(); close(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const last = drag.current;
    if (!last || last.pointer !== event.pointerId) return;
    const box = event.currentTarget.getBoundingClientRect();
    const delta = { x: event.clientX - last.x, y: event.clientY - last.y };
    drag.current = { ...last, x: event.clientX, y: event.clientY };
    setLook(current => {
      const focus = panFocus({ x: current.focusX, y: current.focusY }, delta, photo, box, current.zoom);
      return { ...current, focusX: focus.x, focusY: focus.y };
    });
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => { if (drag.current?.pointer === event.pointerId) drag.current = null; };
  const zoomFill = `${(look.zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN) * 100}%`;

  return <div className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
    <header className="editor-header">
      <button className="icon-button" onClick={close} aria-label={t.close}><X size={22} /></button>
      <h1 id="editor-title">{isNew ? t.newTitle : t.editTitle}</h1>
      {onDelete && <button className="icon-button" onClick={onDelete} aria-label={t.delete}><Trash2 size={20} /></button>}
      <button className="save-button" disabled={!canSave(look)} onClick={() => onSave(finalLook(look))} title={canSave(look) ? undefined : t.needTitle}><Check size={18} />{t.save}</button>
    </header>
    <div className="preview-zone">
      <div className="preview-card" style={{ '--ratio': ratio } as CSSProperties} aria-label={t.preview}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
        onWheel={event => patch({ zoom: look.zoom - event.deltaY / 500 })}>
        <FrameView look={look} src={photo.src} placeholder={t.titlePlaceholder} />
      </div>
    </div>
    <div className="editor-controls">
      <div className="segmented tabs" role="tablist">
        {(['text', 'style', 'photo'] as const).map(id => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}>{t.tabs[id]}</button>)}
      </div>
      <div className="tab-panel" role="tabpanel">
        {tab === 'text' && <>
          <label className="field"><span>{t.titleLabel}<small>{look.title.length}/{TITLE_MAX}</small></span>
            <input value={look.title} maxLength={TITLE_MAX} placeholder={t.titlePlaceholder} enterKeyHint="next" autoComplete="off" onChange={event => patch({ title: event.target.value })} /></label>
          <label className="field"><span>{t.subtitleLabel}<small>{t.subtitleOptional}</small></span>
            <input value={look.subtitle} maxLength={SUBTITLE_MAX} placeholder={t.subtitlePlaceholder} enterKeyHint="done" autoComplete="off" onChange={event => patch({ subtitle: event.target.value })} /></label>
        </>}
        {tab === 'style' && <>
          <div className="style-grid" role="radiogroup" aria-label={t.styleLabel}>
            {frameStyles.map(style => <button key={style} role="radio" aria-checked={look.style === style} className="style-choice" onClick={() => patch({ style })}>
              <span className={'style-sample sample-' + style}>Aa</span><small>{texts.styles[style]}</small>
            </button>)}
          </div>
          <div className="segmented" role="radiogroup" aria-label={t.positionLabel}>
            {framePositions.map(position => <button key={position} role="radio" aria-checked={look.position === position} className={look.position === position ? 'selected' : ''} onClick={() => patch({ position })}>{positionIcons[position]}{texts.positions[position]}</button>)}
          </div>
        </>}
        {tab === 'photo' && <>
          <p className="hint"><Move size={15} />{t.dragHint}</p>
          <div className="zoom-row">
            <button className="icon-button" onClick={() => patch({ zoom: look.zoom - 0.25 })} aria-label={t.zoomOut}><ZoomOut size={20} /></button>
            <input type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={0.01} value={look.zoom} aria-label={t.zoom} style={{ '--fill': zoomFill } as CSSProperties} onChange={event => patch({ zoom: Number(event.target.value) })} />
            <button className="icon-button" onClick={() => patch({ zoom: look.zoom + 0.25 })} aria-label={t.zoomIn}><ZoomIn size={20} /></button>
          </div>
          <div className="photo-actions">
            <button className="secondary" onClick={() => patch({ focusX: 50, focusY: 50, zoom: 1 })}><RotateCcw size={16} />{t.reset}</button>
            <button className="secondary" onClick={onChangePhoto}><ImagePlus size={16} />{t.changePhoto}</button>
          </div>
        </>}
      </div>
    </div>
    {confirmLeave && <Sheet title={t.discardTitle} onClose={() => setConfirmLeave(false)}>
      <p className="panel-intro">{t.discardText}</p>
      <button className="primary" onClick={() => setConfirmLeave(false)}>{t.keepEditing}</button>
      <button className="text-button danger center" onClick={onClose}>{t.discard}</button>
    </Sheet>}
  </div>;
}
