import { useEffect } from 'react';
import type { RefObject } from 'react';
import { FrameView } from './FrameView';
import type { Frame } from '../domain/frames';
import { texts } from '../texts';

/** Full-screen frames, one per swipe. Reports which one is on screen. */
export function Feed({ frames, urls, active, chromeHidden, scrollRef, onActiveChange, onToggleChrome }: {
  frames: Frame[];
  urls: ReadonlyMap<string, string>;
  active: number;
  chromeHidden: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onActiveChange: (index: number) => void;
  onToggleChrome: () => void;
}) {
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) onActiveChange(Number((entry.target as HTMLElement).dataset.index));
    }, { root, threshold: 0.6 });
    root.querySelectorAll('[data-index]').forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [frames, scrollRef, onActiveChange]);

  return <>
    <div className="feed" ref={scrollRef} tabIndex={0} aria-label={texts.feed.label}>
      {frames.map((frame, index) => <section className="feed-item" key={frame.id} data-index={index}>
        <FrameView look={frame} src={urls.get(frame.id)} active={index === active} onClick={onToggleChrome} />
      </section>)}
    </div>
    {frames.length > 1 && <div className={'dot-rail' + (chromeHidden ? ' hidden' : '')} aria-hidden="true">
      {frames.length <= 10 ? frames.map((frame, index) => <span key={frame.id} className={index === active ? 'on' : ''} />) : <small>{texts.feed.position(active, frames.length)}</small>}
    </div>}
  </>;
}
