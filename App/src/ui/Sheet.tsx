import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { texts } from '../texts';

/** A modal sheet: bottom sheet on phones, a card on wider screens. Escape and the backdrop close it. */
export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className="sheet" aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sheet-inner">
      <div className="sheet-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label={texts.sheetClose}><X size={22} /></button></div>
      {children}
    </div>
  </dialog>;
}
