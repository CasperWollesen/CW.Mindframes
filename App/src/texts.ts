import type { FramePosition, FrameStyle } from './domain/frames';

/** Every UI string. Frame texts are the owner's own and never live here. */
export const texts = {
  appName: 'Mindframes',
  tagline: 'Your photos, with a line to live by.',
  example: { title: 'Human before machine.', subtitle: 'Your photo · your line' },
  empty: {
    add: 'Add your first frame',
    privacy: 'Stays on this phone. No accounts, no cloud.',
    installTip: 'Tip: add Mindframes to your Home Screen first — it keeps its own storage.'
  },
  feed: {
    label: 'Your frames',
    add: 'Add a frame',
    edit: 'Edit this frame',
    arrange: 'Your frames and settings',
    position: (index: number, count: number) => `${index + 1} / ${count}`
  },
  editor: {
    newTitle: 'New frame',
    editTitle: 'Edit frame',
    close: 'Close editor',
    save: 'Save',
    delete: 'Delete frame',
    tabs: { text: 'Text', style: 'Style', photo: 'Photo' },
    titleLabel: 'Your line',
    titlePlaceholder: 'Human before machine',
    subtitleLabel: 'Small line',
    subtitleOptional: 'optional',
    subtitlePlaceholder: 'Sunday ride, October',
    needTitle: 'Write a line to save this frame.',
    preview: 'Preview. Drag to move the photo.',
    styleLabel: 'Type',
    positionLabel: 'Place the words',
    dragHint: 'Drag the preview to choose what shows.',
    zoom: 'Zoom',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    reset: 'Reset',
    changePhoto: 'Change photo',
    discardTitle: 'Leave without saving?',
    discardText: 'Your changes to this frame will be lost.',
    keepEditing: 'Keep editing',
    discard: 'Discard changes'
  },
  styles: { serif: 'Serif', bold: 'Bold', calm: 'Calm', note: 'Note' } satisfies Record<FrameStyle, string>,
  positions: { top: 'Top', middle: 'Middle', bottom: 'Bottom' } satisfies Record<FramePosition, string>,
  arrange: {
    title: 'Your frames',
    intro: 'Drag to set the order. Tap a frame to edit it.',
    handle: (title: string) => `Move “${title}”. Use the arrow keys.`,
    shuffle: 'Shuffle',
    add: 'Add a frame',
    appearance: 'Appearance',
    dark: 'Dark',
    light: 'Light',
    footer: 'Everything stays on this phone.\nNo accounts. No tracking. No cloud.\nClearing this site’s data removes your frames.',
    version: (version: string) => `v${version}`
  },
  sheetClose: 'Close',
  preparing: 'Preparing your photo…',
  toast: {
    dismiss: 'Dismiss',
    undo: 'Undo',
    deleted: 'Frame deleted.',
    restored: 'Restored.',
    shuffled: 'Shuffled.',
    photoFailed: 'That photo couldn’t be opened. Try another one.',
    saveFailed: 'Couldn’t save. The phone may be out of storage.',
    orderFailed: 'Couldn’t save the new order.'
  },
  storageUnavailable: 'Storage is unavailable here, so frames won’t be kept.',
  update: { ready: 'A fresh version is ready.', action: 'Update' }
} as const;
