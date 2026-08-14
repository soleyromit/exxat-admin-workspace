/* Inline SVG icon set (Lucide-style) — faithful port of the Claude Design
   icons.jsx. Reliable, no external font dependency; keeps the Icon({name}) API
   used across every assessment-creation screen. */
import type { CSSProperties } from 'react'

export const ICON_PATHS: Record<string, string> = {
  // shell / nav
  'house': '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  'calendar-days': '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/>',
  'calendar': '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>',
  'users': '<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="3.2"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.8M16 3.7a4 4 0 0 1 0 6.6"/>',
  'user': '<circle cx="12" cy="8" r="3.4"/><path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1"/>',
  'user-tie': '<circle cx="12" cy="7" r="3.2"/><path d="M8 11.5 6 20h12l-2-8.5M12 11.5l-1.5 3 1.5 5 1.5-5-1.5-3"/>',
  'user-plus': '<circle cx="9" cy="8" r="3.4"/><path d="M3 20v-1a5 5 0 0 1 5-5h2.5"/><path d="M17 11v6M20 14h-6"/>',
  'chalkboard-user': '<rect x="3" y="3.5" width="18" height="10" rx="1.5"/><path d="M7 19a3 3 0 0 1 6 0M10 14.5a2 2 0 1 0 0-.01M15 19h5"/>',
  'presentation': '<rect x="3" y="3.5" width="18" height="11" rx="1.5"/><path d="M2 3.5h20M12 14.5V18M9 21l3-3 3 3"/>',
  'file-pen': '<path d="M5 3.5h8l5 5v6"/><path d="M13 3.5V9h5"/><path d="M19.5 14.5 14 20l-3 .7.7-3 5.5-5.5a1.4 1.4 0 0 1 2 2z"/><path d="M5 3.5v17h6"/>',
  'rectangle-list': '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7.5 9h.01M7.5 14h.01M11 9h6M11 14h6"/>',
  'book-open': '<path d="M12 6.5C10.5 5 8 4.5 4 4.5V18c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2V4.5c-4 0-6.5.5-8 2z"/><path d="M12 6.5V20"/>',
  'book': '<path d="M5 3.5h13a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 19.5z"/><path d="M5 17.5h14"/>',
  'chart-simple': '<path d="M5 20V12M10 20V5M15 20v-6M20 20V9"/>',
  'chart-line': '<path d="M4 4v16h16"/><path d="m7 14 3-3 3 3 5-6"/>',
  'shield-halved': '<path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="M12 3v18"/>',
  'shield-check': '<path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="m9 11.5 2 2 4-4"/>',
  'gear': '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6"/>',
  'bars': '<path d="M3 6h18M3 12h18M3 18h18"/>',
  'sidebar': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  'chevron-left': '<path d="m15 5-7 7 7 7"/>',
  'chevron-down': '<path d="m5 9 7 7 7-7"/>',
  'chevron-up': '<path d="m5 15 7-7 7 7"/>',
  'ellipsis-vertical': '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  'ellipsis': '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  'magnifying-glass': '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  'bell': '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'xmark': '<path d="M6 6l12 12M18 6 6 18"/>',
  'check': '<path d="m5 12 5 5L20 6"/>',
  'check-double': '<path d="m2 12 5 5M11 12l-3.5 3.5M13 7l-6 6M22 7l-9 9"/>',
  'arrow-left': '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
  'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
  'arrow-trend-up': '<path d="M3 17 10 10l4 4 7-7M15 6h6v6"/>',
  'arrows-up-down': '<path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/>',
  'right-left': '<path d="M8 4 4 8l4 4M4 8h12M16 20l4-4-4-4M20 16H8"/>',
  'circle': '<circle cx="12" cy="12" r="8.5"/>',
  'circle-check': '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.3 2.3 4.7-4.6"/>',
  'circle-dot': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
  'circle-info': '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  'circle-question': '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4 2c0 1.5-2 2-2 3M12 16h.01"/>',
  'circle-exclamation': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5M12 16h.01"/>',
  'triangle-exclamation': '<path d="M10.3 3.8 2.4 18a1.8 1.8 0 0 0 1.6 2.7h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.8a1.8 1.8 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  'square-check': '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 2.5 2.5L16 9"/>',
  'square': '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/>',
  'file-lines': '<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5H6A.5.5 0 0 1 5.5 20V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V8H18M9 12h6M9 15.5h6"/>',
  'file-shield': '<path d="M6 3.5h7l4 4V11M5.5 4v16a.5.5 0 0 0 .5.5h5"/><path d="M13 3.5V8h4"/><path d="M18 13.5 15 15v2.5c0 1.8 1.3 2.8 3 3.5 1.7-.7 3-1.7 3-3.5V15z"/>',
  'file-pdf': '<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5H6A.5.5 0 0 1 5.5 20V4a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.5V8H18"/><path d="M8.5 17v-3.5h1.2a1 1 0 0 1 0 2H8.5M13 13.5V17h.8a1.6 1.6 0 0 0 0-3.5z"/>',
  'file-import': '<path d="M9 3.5h5l4 4V20a.5.5 0 0 1-.5.5H9"/><path d="M13.5 3.5V8H18"/><path d="M3 12h8M8 9l3 3-3 3"/>',
  'file-export': '<path d="M14 3.5H6.5A.5.5 0 0 0 6 4v16a.5.5 0 0 0 .5.5H11"/><path d="M14 3.5V8h4"/><path d="M13 12h8M18 9l3 3-3 3"/>',
  'filter': '<path d="M3 5h18l-7 8v5l-4 2v-7z"/>',
  'recycle': '<path d="M7 7 5 10l-2.5-1M7 7l2.5 4M7 7l2-3.2a1.4 1.4 0 0 1 2.3 0L13 6.5M21 13l-1.2 3.4a1.4 1.4 0 0 1-1.3.9H14M21 13l-3 1M21 13l-1.7-3M3.5 13.5 2.6 17a1.4 1.4 0 0 0 1.3 1.9H8M3.5 13.5 6 15M3.5 13.5 1.5 15"/>',
  'table-cells-large': '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M12 4v16M3.5 12h17"/>',
  'hammer': '<path d="m14 7 4-4 3 3-4 4z"/><path d="m14 7-8.5 8.5a2 2 0 0 0 0 2.8l.2.2a2 2 0 0 0 2.8 0L17 10"/>',
  'grip-vertical': '<circle cx="9" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="15" cy="18" r="1.3"/>',
  'trash': '<path d="M4 6.5h16M9 6.5V4.5h6v2M6 6.5 7 20a.5.5 0 0 0 .5.5h9A.5.5 0 0 0 17 20l1-13.5M10 10v6.5M14 10v6.5"/>',
  'pen': '<path d="M16.5 3.5 20.5 7.5 8 20l-4.5 1 1-4.5z"/><path d="m14.5 5.5 4 4"/>',
  'pen-line': '<path d="M16.5 3.5 20.5 7.5 9 19l-4 1 1-4z"/><path d="M14 21h7"/>',
  'copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
  'clone': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
  'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  'eye-slash': '<path d="M3 3l18 18M10.5 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.3 4M6.2 6.3A16 16 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4-.8M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  'lock': '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  'lock-open': '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 7.5-2"/>',
  'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  'flag': '<path d="M5 21V4M5 4.5h11l-2 3.5 2 3.5H5"/>',
  'wand-magic-sparkles': '<path d="m4 20 9-9M13.5 6.5 17 10M14.5 4.5 16 3l1 1.5L18.5 6 17 6.5 16 8l-1-1.5L13.5 6zM6 4l.6 1.4L8 6l-1.4.6L6 8l-.6-1.4L4 6l1.4-.6zM18 14l.6 1.4L20 16l-1.4.6L18 18l-.6-1.4L16 16l1.4-.6z"/>',
  'gauge-high': '<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 14 4-4"/><circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none"/>',
  'calculator': '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8 7.5h8M8 11.5h.01M12 11.5h.01M16 11.5h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h4"/>',
  'highlighter': '<path d="m9 13 6-6 3 3-6 6H9z"/><path d="M9 16H6l-2 4h7l1-2"/>',
  'note-sticky': '<path d="M5 4.5h14a.5.5 0 0 1 .5.5v10L14 20.5H5.5A.5.5 0 0 1 5 20z"/><path d="M19 15h-5v5"/>',
  'scissors': '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 8l12 8M8 16 20 8"/>',
  'volume': '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12"/>',
  'play': '<path d="M7 4.5v15l12-7.5z"/>',
  'paper-plane': '<path d="M21 3 3 10.5l7 2.5M21 3l-6 18-4.8-8L21 3z"/>',
  'paperclip': '<path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-7.8 7.8a1.6 1.6 0 0 1-2.3-2.3l7-7"/>',
  'download': '<path d="M12 3.5v11M8 11l4 4 4-4M5 20.5h14"/>',
  'print': '<path d="M7 8.5V3.5h10v5M7 18.5H5.5A1.5 1.5 0 0 1 4 17v-5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 12v5a1.5 1.5 0 0 1-1.5 1.5H17"/><rect x="7" y="14.5" width="10" height="6" rx="1"/>',
  'ban': '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
  'percent': '<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
  'scale-balanced': '<path d="M12 4v16M7 20h10M5 8l-3 6a3 3 0 0 0 6 0L5 8zM19 8l-3 6a3 3 0 0 0 6 0L19 8zM5 8h14M5 8 8 6M19 8l-3-2"/>',
  'clipboard-check': '<rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9 4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5v1H9z"/><path d="m9.5 13 2 2 3.5-4"/>',
  'list-check': '<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 1.5-2M4 12l1 1 1.5-2M4 18l1 1 1.5-2"/>',
  'layer-group': '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 17l9 5 9-5" opacity="0.5"/>',
  'bolt': '<path d="M13 3 4 13h6l-1 8 9-11h-6z"/>',
  'graduation-cap': '<path d="m2 9 10-4 10 4-10 4z"/><path d="M6 11v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5M22 9v5"/>',
  'thumbs-up': '<path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 2 2v3h5.5a1.8 1.8 0 0 1 1.8 2.1l-1 6A2 2 0 0 1 17.3 20H7"/>',
  'message': '<path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4 3.5V17a1 1 0 0 1-1-1z"/>',
  'location-crosshairs': '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  'i-cursor': '<path d="M10 4h4M10 20h4M12 4v16"/>',
  'rotate': '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4"/>',
  'toggle-on': '<rect x="2.5" y="7" width="19" height="10" rx="5"/><circle cx="16.5" cy="12" r="3" fill="currentColor" stroke="none"/>',
  'wave-square': '<path d="M3 12h4V5h6v14h6v-7h2"/>',
  'diagram-project': '<rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="15" width="6" height="5" rx="1"/><path d="M6 9v3a2 2 0 0 0 2 2h7"/>',
  'star': '<path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17l-5.3 2.6 1.1-6L3.4 9.4l6-.8z"/>',
  'heart': '<path d="M12 20s-7-4.5-9.2-9C1.5 8 3 4.5 6.5 4.5 9 4.5 12 7 12 7s3-2.5 5.5-2.5C21 4.5 22.5 8 21.2 11 19 15.5 12 20 12 20z"/>',
  'key': '<circle cx="8" cy="8" r="4"/><path d="m11 11 9 9M17 17l2-2M14 14l2-2"/>',
  'envelope': '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  'hand': '<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2.5-4a1.6 1.6 0 0 1 2.7-1.7L8 13"/>',
  'circle-half-stroke': '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none"/>',
  'circle-plus': '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  'hourglass-half': '<path d="M6 3.5h12M6 20.5h12M7 3.5c0 4 4 5.5 5 8.5 1-3 5-4.5 5-8.5M7 20.5c0-4 4-5.5 5-8.5 1 3 5 4.5 5 8.5"/>',
  'shuffle': '<path d="M16 3.5h4.5V8M20.5 3.5 14 10M3.5 4.5h3l4 5M16 20.5h4.5V16M20.5 20.5 14 14M3.5 19.5h3l4-5"/>',
  'box-archive': '<rect x="3" y="4" width="18" height="4.5" rx="1"/><path d="M5 8.5v10a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18.5v-10M9.5 12.5h5"/>',
  'rotate-left': '<path d="M4 9a8 8 0 1 1-1.5 6M4 4v5h5"/>',
  'clock-rotate-left': '<path d="M4 9a8 8 0 1 1-1.5 6M4 4v5h5M12 8v4.5l3 1.8"/>',
}

type IconWeight = 'light' | 'solid'

export function Icon({
  name,
  w,
  className = '',
  style,
}: {
  name: string
  w?: IconWeight
  className?: string
  style?: CSSProperties
}) {
  const path = ICON_PATHS[name] || ICON_PATHS['circle']
  return (
    <svg
      viewBox="0 0 24 24"
      fill={w === 'solid' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={w === 'solid' ? 1.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`om-icon ${className}`}
      style={{ width: '1em', height: '1em', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  )
}

export function LeoStar({ style, className = '' }: { style?: CSSProperties; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--brand-color-dark)"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`leo-star ${className}`}
      style={{ width: '1em', height: '1em', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS['wand-magic-sparkles'] }}
    />
  )
}
