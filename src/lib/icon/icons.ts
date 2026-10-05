// The icon set of the design system: line icons on a 24px grid, drawn with
// `stroke="currentColor"`. The shapes come from the design mockups.

/** One element of an icon: a path, circle, rect or ellipse with its attributes. */
export interface IconShape {
  t: 'path' | 'circle' | 'rect' | 'ellipse';
  d?: string;
  cx?: string;
  cy?: string;
  r?: string;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  rx?: string;
  ry?: string;
  fill?: string;
}

/** Every icon name of the kit. */
export type IconName =
  | 'alert'
  | 'archive'
  | 'arrow'
  | 'back'
  | 'bell'
  | 'bold'
  | 'bolt'
  | 'building'
  | 'cal'
  | 'chat'
  | 'check'
  | 'clip'
  | 'clipcheck'
  | 'clipslash'
  | 'clock'
  | 'copy'
  | 'db'
  | 'down'
  | 'download'
  | 'edit'
  | 'euro'
  | 'ext'
  | 'eye'
  | 'eyeslash'
  | 'file'
  | 'fileplus'
  | 'flow'
  | 'form'
  | 'funnel'
  | 'gear'
  | 'globe'
  | 'grid'
  | 'grip'
  | 'half'
  | 'handshake'
  | 'heading'
  | 'history'
  | 'home'
  | 'info'
  | 'italic'
  | 'key'
  | 'landmark'
  | 'left'
  | 'link'
  | 'linkslash'
  | 'list'
  | 'lock'
  | 'logout'
  | 'mail'
  | 'menu'
  | 'minus'
  | 'monitor'
  | 'moon'
  | 'more'
  | 'palette'
  | 'pie'
  | 'pin'
  | 'pinslash'
  | 'play'
  | 'plus'
  | 'power'
  | 'receipt'
  | 'redo'
  | 'repeat'
  | 'right'
  | 'search'
  | 'send'
  | 'shield'
  | 'shieldok'
  | 'sort'
  | 'square'
  | 'sun'
  | 'swap'
  | 'tasks'
  | 'trash'
  | 'tune'
  | 'undo'
  | 'up'
  | 'upload'
  | 'user'
  | 'users'
  | 'vote'
  | 'webhook'
  | 'x'
  | 'add'
  | 'audit'
  | 'chart-pie'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'delete'
  | 'document'
  | 'export'
  | 'eye-slash'
  | 'filter'
  | 'language'
  | 'link-slash'
  | 'members'
  | 'paperclip'
  | 'paperclip-slash'
  | 'parliament'
  | 'remove'
  | 'roles'
  | 'stop';

/** Shapes per drawing. */
const SHAPES: Record<string, readonly IconShape[]> = {
  alert: [{ t: 'path', d: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' }, { t: 'path', d: 'M12 9v4M12 17h.01' }],
  archive: [{ t: 'rect', x: '3', y: '4', width: '18', height: '5', rx: '1' }, { t: 'path', d: 'M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9' }, { t: 'path', d: 'M10 13h4' }],
  arrow: [{ t: 'path', d: 'M5 12h14M13 6l6 6-6 6' }],
  back: [{ t: 'path', d: 'M19 12H5M11 18l-6-6 6-6' }],
  bell: [{ t: 'path', d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' }, { t: 'path', d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' }],
  bold: [{ t: 'path', d: 'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z' }],
  bolt: [{ t: 'path', d: 'M13 2 4 14h7l-1 8 9-12h-7z' }],
  building: [{ t: 'path', d: 'M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M2 10 12 3l10 7z' }],
  cal: [{ t: 'rect', x: '3', y: '4', width: '18', height: '18', rx: '2' }, { t: 'path', d: 'M16 2v4M8 2v4M3 10h18' }],
  chat: [{ t: 'path', d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }],
  check: [{ t: 'path', d: 'M20 6 9 17l-5-5' }],
  clip: [{ t: 'path', d: 'm21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5' }],
  clipcheck: [{ t: 'rect', x: '8', y: '2', width: '8', height: '4', rx: '1' }, { t: 'path', d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' }, { t: 'path', d: 'm9 14 2 2 4-4' }],
  clipslash: [{ t: 'path', d: 'm21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5' }, { t: 'path', d: 'M3 3l18 18' }],
  clock: [{ t: 'circle', cx: '12', cy: '12', r: '9' }, { t: 'path', d: 'M12 7v5l3 2' }],
  copy: [{ t: 'rect', x: '8', y: '8', width: '13', height: '13', rx: '2' }, { t: 'path', d: 'M4 16V5a1 1 0 0 1 1-1h11' }],
  db: [{ t: 'ellipse', cx: '12', cy: '5', rx: '8', ry: '3' }, { t: 'path', d: 'M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5' }, { t: 'path', d: 'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3' }],
  down: [{ t: 'path', d: 'm6 9 6 6 6-6' }],
  download: [{ t: 'path', d: 'M12 3v12' }, { t: 'path', d: 'm7 10 5 5 5-5' }, { t: 'path', d: 'M5 21h14' }],
  edit: [{ t: 'path', d: 'M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z' }],
  euro: [{ t: 'path', d: 'M4 10h11M4 14h9' }, { t: 'path', d: 'M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2' }],
  ext: [{ t: 'path', d: 'M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5' }],
  eye: [{ t: 'path', d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' }, { t: 'circle', cx: '12', cy: '12', r: '3' }],
  eyeslash: [{ t: 'path', d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' }, { t: 'circle', cx: '12', cy: '12', r: '3' }, { t: 'path', d: 'M3 3l18 18' }],
  file: [{ t: 'path', d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z' }, { t: 'path', d: 'M14 3v5h5' }, { t: 'path', d: 'M9 13h6M9 17h6' }],
  fileplus: [{ t: 'path', d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z' }, { t: 'path', d: 'M14 3v5h5M12 12v6M9 15h6' }],
  flow: [{ t: 'rect', x: '3', y: '3', width: '8', height: '8', rx: '2' }, { t: 'path', d: 'M7 11v4a2 2 0 0 0 2 2h4' }, { t: 'rect', x: '13', y: '13', width: '8', height: '8', rx: '2' }],
  form: [{ t: 'rect', x: '5', y: '4', width: '14', height: '18', rx: '2' }, { t: 'path', d: 'M9 2h6v4H9z' }, { t: 'path', d: 'M9 11h6M9 15h4' }],
  funnel: [{ t: 'path', d: 'M22 3H2l8 9.46V19l4 2v-8.54z' }],
  gear: [{ t: 'circle', cx: '12', cy: '12', r: '3' }, { t: 'path', d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' }],
  globe: [{ t: 'circle', cx: '12', cy: '12', r: '9' }, { t: 'path', d: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18' }],
  grid: [{ t: 'rect', x: '3', y: '3', width: '7', height: '7', rx: '2' }, { t: 'rect', x: '14', y: '3', width: '7', height: '7', rx: '2' }, { t: 'rect', x: '3', y: '14', width: '7', height: '7', rx: '2' }, { t: 'rect', x: '14', y: '14', width: '7', height: '7', rx: '2' }],
  grip: [{ t: 'circle', cx: '9', cy: '6', r: '1.2' }, { t: 'circle', cx: '15', cy: '6', r: '1.2' }, { t: 'circle', cx: '9', cy: '12', r: '1.2' }, { t: 'circle', cx: '15', cy: '12', r: '1.2' }, { t: 'circle', cx: '9', cy: '18', r: '1.2' }, { t: 'circle', cx: '15', cy: '18', r: '1.2' }],
  half: [{ t: 'circle', cx: '12', cy: '12', r: '9' }, { t: 'path', d: 'M12 3a9 9 0 0 0 0 18z', fill: 'currentColor' }],
  handshake: [{ t: 'path', d: 'm11 17 2 2a1 1 0 1 0 3-3' }, { t: 'path', d: 'm14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4' }, { t: 'path', d: 'm21 3 1 11h-2' }, { t: 'path', d: 'M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3' }, { t: 'path', d: 'M3 4h8' }],
  heading: [{ t: 'path', d: 'M6 4v16M18 4v16M6 12h12' }],
  history: [{ t: 'path', d: 'M3 12a9 9 0 1 0 3-6.7L3 8' }, { t: 'path', d: 'M3 3v5h5' }, { t: 'path', d: 'M12 7v5l4 2' }],
  home: [{ t: 'path', d: 'M3 10.5 12 3l9 7.5' }, { t: 'path', d: 'M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5' }],
  info: [{ t: 'circle', cx: '12', cy: '12', r: '9' }, { t: 'path', d: 'M12 16v-4M12 8h.01' }],
  italic: [{ t: 'path', d: 'M19 4h-9M14 20H5M15 4 9 20' }],
  key: [{ t: 'circle', cx: '7.5', cy: '15.5', r: '4.5' }, { t: 'path', d: 'm10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2' }],
  landmark: [{ t: 'path', d: 'M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7' }, { t: 'path', d: 'M12 2 20 7H4z' }],
  left: [{ t: 'path', d: 'm15 6-6 6 6 6' }],
  link: [{ t: 'path', d: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7' }, { t: 'path', d: 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7' }],
  linkslash: [{ t: 'path', d: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7' }, { t: 'path', d: 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7' }, { t: 'path', d: 'M3 3l18 18' }],
  list: [{ t: 'path', d: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01' }],
  lock: [{ t: 'rect', x: '4', y: '11', width: '16', height: '10', rx: '2' }, { t: 'path', d: 'M8 11V7a4 4 0 0 1 8 0v4' }],
  logout: [{ t: 'path', d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }, { t: 'path', d: 'm16 17 5-5-5-5M21 12H9' }],
  mail: [{ t: 'rect', x: '2', y: '4', width: '20', height: '16', rx: '2' }, { t: 'path', d: 'm22 7-10 6L2 7' }],
  menu: [{ t: 'path', d: 'M4 6h16M4 12h16M4 18h16' }],
  minus: [{ t: 'path', d: 'M5 12h14' }],
  monitor: [{ t: 'rect', x: '2', y: '3', width: '20', height: '14', rx: '2' }, { t: 'path', d: 'M8 21h8M12 17v4' }],
  moon: [{ t: 'path', d: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' }],
  more: [{ t: 'circle', cx: '12', cy: '5', r: '1.3' }, { t: 'circle', cx: '12', cy: '12', r: '1.3' }, { t: 'circle', cx: '12', cy: '19', r: '1.3' }],
  palette: [{ t: 'circle', cx: '12', cy: '12', r: '9' }, { t: 'circle', cx: '7.5', cy: '10.5', r: '1' }, { t: 'circle', cx: '12', cy: '7.5', r: '1' }, { t: 'circle', cx: '16.5', cy: '10.5', r: '1' }, { t: 'path', d: 'M12 21a3 3 0 0 1 0-6h2a3 3 0 0 0 3-3' }],
  pie: [{ t: 'path', d: 'M21 12A9 9 0 1 1 12 3v9z' }, { t: 'path', d: 'M15 3.5A9 9 0 0 1 20.5 9H15z' }],
  play: [{ t: 'path', d: 'M7 4v16l13-8z' }],
  // A pin: an archive or an entry that stays (it is never pruned or moved away).
  pin: [{ t: 'path', d: 'M12 17v5' }, { t: 'path', d: 'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z' }],
  pinslash: [{ t: 'path', d: 'M12 17v5' }, { t: 'path', d: 'M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89' }, { t: 'path', d: 'm2 2 20 20' }, { t: 'path', d: 'M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12' }],
  plus: [{ t: 'path', d: 'M12 5v14M5 12h14' }],
  power: [{ t: 'path', d: 'M12 2v10' }, { t: 'path', d: 'M18.4 6.6a9 9 0 1 1-12.77.04' }],
  receipt: [{ t: 'path', d: 'M5 3v18l2.5-1.5L10 21l2-1.5 2 1.5 2.5-1.5L19 21V3l-2.5 1.5L14 3l-2 1.5L10 3 7.5 4.5z' }, { t: 'path', d: 'M9 9h6M9 13h6' }],
  redo: [{ t: 'path', d: 'm15 14 5-5-5-5' }, { t: 'path', d: 'M20 9H9a5 5 0 0 0 0 10h3' }],
  repeat: [{ t: 'path', d: 'm17 2 4 4-4 4' }, { t: 'path', d: 'M3 11v-1a4 4 0 0 1 4-4h14' }, { t: 'path', d: 'm7 22-4-4 4-4' }, { t: 'path', d: 'M21 13v1a4 4 0 0 1-4 4H3' }],
  right: [{ t: 'path', d: 'm9 6 6 6-6 6' }],
  search: [{ t: 'circle', cx: '11', cy: '11', r: '7' }, { t: 'path', d: 'm20 20-3.5-3.5' }],
  send: [{ t: 'path', d: 'M22 2 11 13' }, { t: 'path', d: 'M22 2 15 22l-4-9-9-4z' }],
  shield: [{ t: 'path', d: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z' }],
  shieldok: [{ t: 'path', d: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z' }, { t: 'path', d: 'm9 12 2 2 4-4' }],
  sort: [{ t: 'path', d: 'M3 6h18M6 12h12M10 18h4' }],
  square: [{ t: 'rect', x: '5', y: '5', width: '14', height: '14', rx: '2' }],
  sun: [{ t: 'circle', cx: '12', cy: '12', r: '4' }, { t: 'path', d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' }],
  swap: [{ t: 'path', d: 'M4 7h15l-3-3' }, { t: 'path', d: 'M20 17H5l3 3' }],
  tasks: [{ t: 'path', d: 'm3 7 2 2 4-4' }, { t: 'path', d: 'm3 17 2 2 4-4' }, { t: 'path', d: 'M13 7h8M13 17h8' }],
  trash: [{ t: 'path', d: 'M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' }],
  tune: [{ t: 'path', d: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1' }, { t: 'circle', cx: '15', cy: '6', r: '2' }, { t: 'circle', cx: '9', cy: '12', r: '2' }, { t: 'circle', cx: '17', cy: '18', r: '2' }],
  undo: [{ t: 'path', d: 'M9 14 4 9l5-5' }, { t: 'path', d: 'M4 9h11a5 5 0 0 1 0 10h-3' }],
  up: [{ t: 'path', d: 'm6 15 6-6 6 6' }],
  upload: [{ t: 'path', d: 'M12 21V9' }, { t: 'path', d: 'm7 14 5-5 5 5' }, { t: 'path', d: 'M5 3h14' }],
  user: [{ t: 'circle', cx: '12', cy: '8', r: '4' }, { t: 'path', d: 'M4 21a8 8 0 0 1 16 0' }],
  users: [{ t: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }, { t: 'circle', cx: '9', cy: '7', r: '4' }, { t: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' }, { t: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
  vote: [{ t: 'path', d: 'M7 11V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7' }, { t: 'path', d: 'm9.5 7 1.8 1.8L14.5 5.5' }, { t: 'path', d: 'M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z' }, { t: 'path', d: 'M8 15h8' }],
  webhook: [{ t: 'path', d: 'M18 17h-6c-1.1 0-2 .9-2.5 1.9A4 4 0 0 1 2 17c0-.7.2-1.4.6-2' }, { t: 'path', d: 'm6 17 3.1-5.8c.5-1 .1-2.2-.5-3.1a4 4 0 1 1 6.9-4.1' }, { t: 'path', d: 'm12 6 3.1 5.7c.5 1 1.8 1.3 2.9 1.3a4 4 0 0 1 0 8' }],
  x: [{ t: 'path', d: 'M18 6 6 18M6 6l12 12' }],
};

/** Older names of the kit, drawn with a shape of the set above. */
const ALIASES: Record<string, string> = {
  add: 'plus',
  audit: 'clipcheck',
  'chart-pie': 'pie',
  'chevron-down': 'down',
  'chevron-left': 'left',
  'chevron-right': 'right',
  'chevron-up': 'up',
  delete: 'trash',
  document: 'file',
  export: 'download',
  'eye-slash': 'eyeslash',
  filter: 'funnel',
  language: 'globe',
  'link-slash': 'linkslash',
  members: 'users',
  paperclip: 'clip',
  'paperclip-slash': 'clipslash',
  parliament: 'landmark',
  remove: 'x',
  roles: 'shield',
  stop: 'square',
};

/** The shapes of an icon, or `null` for an unknown name. */
export function iconShapes(name: string): readonly IconShape[] | null {
  return SHAPES[ALIASES[name] ?? name] ?? null;
}

/** All icon names, for a gallery or a test. */
export const ICON_NAMES: readonly IconName[] = [
  'alert',
  'archive',
  'arrow',
  'back',
  'bell',
  'bold',
  'bolt',
  'building',
  'cal',
  'chat',
  'check',
  'clip',
  'clipcheck',
  'clipslash',
  'clock',
  'copy',
  'db',
  'down',
  'download',
  'edit',
  'euro',
  'ext',
  'eye',
  'eyeslash',
  'file',
  'fileplus',
  'flow',
  'form',
  'funnel',
  'gear',
  'globe',
  'grid',
  'grip',
  'half',
  'handshake',
  'heading',
  'history',
  'home',
  'info',
  'italic',
  'key',
  'landmark',
  'left',
  'link',
  'linkslash',
  'list',
  'lock',
  'logout',
  'mail',
  'menu',
  'minus',
  'monitor',
  'moon',
  'more',
  'palette',
  'pie',
  'pin',
  'pinslash',
  'play',
  'plus',
  'power',
  'receipt',
  'redo',
  'repeat',
  'right',
  'search',
  'send',
  'shield',
  'shieldok',
  'sort',
  'square',
  'sun',
  'swap',
  'tasks',
  'trash',
  'tune',
  'undo',
  'up',
  'upload',
  'user',
  'users',
  'vote',
  'webhook',
  'x',
  'add',
  'audit',
  'chart-pie',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'delete',
  'document',
  'export',
  'eye-slash',
  'filter',
  'language',
  'link-slash',
  'members',
  'paperclip',
  'paperclip-slash',
  'parliament',
  'remove',
  'roles',
  'stop',
];
