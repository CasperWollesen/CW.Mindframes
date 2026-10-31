import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { GripVertical, Moon, Plus, Shuffle, Sun } from 'lucide-react';
import type { Frame } from '../domain/frames';
import type { Theme } from '../storage/repository';
import { FrameView } from './FrameView';
import { Sheet } from './Sheet';
import { texts } from '../texts';

const t = texts.arrange;
const ROW_GAP = 8;

interface Drag { id: string; pointer: number; from: number; startY: number; dy: number; step: number }

/** The frames as a sortable list, plus the few settings the app has. */
export function ArrangeSheet({ frames, urls, ratio, theme, version, toast, onClose, onEdit, onMove, onShuffle, onAdd, onTheme }: {
  frames: Frame[];
  urls: ReadonlyMap<string, string>;
  ratio: number;
  theme: Theme;
  version: string;
  toast?: ReactNode;
  onClose: () => void;
  onEdit: (frame: Frame) => void;
  onMove: (from: number, to: number) => void;
  onShuffle: () => void;
  onAdd: () => void;
  onTheme: (theme: Theme) => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const last = frames.length - 1;
  const target = drag ? Math.min(last, Math.max(0, drag.from + Math.round(drag.dy / drag.step))) : -1;

  // Keyboard moves keep the focus on the moved frame's handle.
  useEffect(() => { if (focusId) handles.current.get(focusId)?.focus(); }, [frames, focusId]);

  const offset = (index: number) => {
    if (!drag) return 0;
    if (index === drag.from) return drag.dy;
    if (drag.from < target && index > drag.from && index <= target) return -drag.step;
    if (drag.from > target && index < drag.from && index >= target) return drag.step;
    return 0;
  };
  const startDrag = (event: PointerEvent<HTMLButtonElement>, frame: Frame, index: number) => {
    const row = event.currentTarget.closest('li');
    if (!row) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id: frame.id, pointer: event.pointerId, from: index, startY: event.clientY, dy: 0, step: row.offsetHeight + ROW_GAP });
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const dy = Math.min((last - drag.from) * drag.step, Math.max(-drag.from * drag.step, event.clientY - drag.startY));
    setDrag({ ...drag, dy });
  };
  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (target !== drag.from) onMove(drag.from, target);
    setDrag(null);
  };
  const keyMove = (event: KeyboardEvent<HTMLButtonElement>, frame: Frame, index: number) => {
    const to = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : null;
    if (to === null) return;
    event.preventDefault();
    if (to < 0 || to > last) return;
    setFocusId(frame.id);
    onMove(index, to);
  };

  return <Sheet title={t.title} onClose={onClose}>
    {frames.length > 0 && <>
      <p className="panel-intro">{t.intro}</p>
      <ol className={'arrange-list' + (drag ? ' dragging' : '')} style={{ '--ratio': ratio } as CSSProperties}>
        {frames.map((frame, index) => <li key={frame.id} className={'arrange-row' + (drag?.id === frame.id ? ' lifted' : '')} style={{ transform: `translateY(${offset(index)}px)` }}>
          <button className="arrange-open" onClick={() => onEdit(frame)}>
            <span className="thumb"><FrameView look={{ ...frame, subtitle: '' }} src={urls.get(frame.id)} /></span>
            <span className="arrange-copy"><strong>{frame.title}</strong>{frame.subtitle && <small>{frame.subtitle}</small>}</span>
          </button>
          <button className="arrange-handle" aria-label={t.handle(frame.title)}
            ref={element => { if (element) handles.current.set(frame.id, element); else handles.current.delete(frame.id); }}
            onPointerDown={event => startDrag(event, frame, index)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
            onKeyDown={event => keyMove(event, frame, index)} onBlur={() => setFocusId(null)}>
            <GripVertical size={20} />
          </button>
        </li>)}
      </ol>
    </>}
    <div className="sheet-actions">
      {frames.length > 1 && <button className="secondary" onClick={onShuffle}><Shuffle size={17} />{t.shuffle}</button>}
      <button className="secondary" onClick={onAdd}><Plus size={17} />{t.add}</button>
    </div>
    <h3>{t.appearance}</h3>
    <div className="segmented" role="radiogroup" aria-label={t.appearance}>
      <button role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'selected' : ''} onClick={() => onTheme('dark')}><Moon size={17} />{t.dark}</button>
      <button role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'selected' : ''} onClick={() => onTheme('light')}><Sun size={17} />{t.light}</button>
    </div>
    <div className="menu-footer">
      <span className="brand"><em>mind</em>frames<i>.</i></span>
      <small>{t.version(version)}</small>
      <p>{t.footer}</p>
    </div>
    {toast}
  </Sheet>;
}
