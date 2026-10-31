import type { CSSProperties, ReactNode } from 'react';
import { titleSize } from '../domain/frames';
import type { FrameLook } from '../domain/frames';

/**
 * One framed photo. Sizes are container query units, so a thumbnail, the editor preview
 * and the full-screen feed all show exactly the same composition.
 */
export function FrameView({ look, src, active = false, placeholder, onClick, children }: {
  look: FrameLook;
  /** Without a photo the frame shows a painted sunrise (empty state). */
  src?: string;
  /** The frame on screen drifts slowly and fades its words in. */
  active?: boolean;
  /** Shown faintly while the line is still empty (editor). */
  placeholder?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const title = look.title.trim() ? look.title : placeholder ?? '';
  const style = { '--fx': `${look.focusX}%`, '--fy': `${look.focusY}%`, '--zoom': look.zoom, '--title-size': titleSize(title, look.style) } as CSSProperties;
  return <figure className={`frame style-${look.style} at-${look.position}${active ? ' active' : ''}`} style={style} onClick={onClick}>
    <div className="frame-photo">{src ? <img src={src} alt="" draggable={false} /> : <div className="frame-sunrise" />}</div>
    <div className="frame-scrim" />
    {(title || look.subtitle.trim()) && <figcaption className="frame-words">
      {title && <span className={'frame-title' + (look.title.trim() ? '' : ' placeholder')}>{title}</span>}
      {look.subtitle.trim() && <span className="frame-subtitle">{look.subtitle}</span>}
    </figcaption>}
    {children}
  </figure>;
}
