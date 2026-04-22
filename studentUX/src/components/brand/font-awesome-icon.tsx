import React from 'react';

// FontAwesome icon mapping with semantic names
export const fontAwesomeIcons = {
  // Navigation
  home: 'fa-home',
  bell: 'fa-bell',
  compass: 'fa-compass',
  globe: 'fa-globe',
  heart: 'fa-heart',
  doorOpen: 'fa-door-open',
  calendar: 'fa-calendar',
  building: 'fa-building',
  buildingCircleCheck: 'fa-building-circle-check',
  users: 'fa-users',
  graduationCap: 'fa-graduation-cap',
  clock: 'fa-clock',
  hourglassEnd: 'fa-hourglass-end',
  book: 'fa-book',
  bookOpen: 'fa-book-open',
  lifeRing: 'fa-life-ring',
  gear: 'fa-gear',
  circleQuestion: 'fa-circle-question',
  // Data & layout
  'layer-group': 'fa-layer-group',
  'chart-bar': 'fa-chart-bar',
  // Communication
  inbox: 'fa-inbox',
  // Legacy aliases
  'door-open': 'fa-door-open',
  'graduation-cap': 'fa-graduation-cap',
  'book-open': 'fa-book-open',
  'life-buoy': 'fa-life-ring',
  'settings-2': 'fa-gear',
  // AI
  starChristmas: 'fa-star-christmas',
  // Actions & UI
  bars: 'fa-bars',
  plus: 'fa-plus',
  edit: 'fa-pen',
  trash: 'fa-trash',
  copy: 'fa-copy',
  check: 'fa-check',
  x: 'fa-xmark',
  search: 'fa-magnifying-glass',
  filter: 'fa-filter',
  lock: 'fa-lock',
  lockOpen: 'fa-lock-open',
  // Arrows & chevrons
  chevronRight: 'fa-chevron-right',
  chevronLeft: 'fa-chevron-left',
  chevronDown: 'fa-chevron-down',
  chevronUp: 'fa-chevron-up',
  chevronsUpDown: 'fa-chevrons-up-down',
  anglesUpDown: 'fa-angles-up-down',
  arrowRight: 'fa-arrow-right',
  arrowLeft: 'fa-arrow-left',
  arrowUp: 'fa-arrow-up',
  arrowUpRight: 'fa-arrow-up-right',
  // Status & alerts
  alertCircle: 'fa-circle-exclamation',
  checkCircle: 'fa-circle-check',
  circleInfo: 'fa-circle-info',
  alertTriangle: 'fa-triangle-exclamation',
  circleXmark: 'fa-circle-xmark',
  circle: 'fa-circle',
  // User & people
  user: 'fa-user',
  userPlus: 'fa-user-plus',
  userMinus: 'fa-user-minus',
  userCheck: 'fa-user-check',
  userX: 'fa-user-xmark',
  badgeCheck: 'fa-badge-check',
  // Business & documents
  shield: 'fa-shield',
  upload: 'fa-upload',
  creditCard: 'fa-credit-card',
  fileText: 'fa-file-lines',
  fileLines: 'fa-file-lines',
  filePdf: 'fa-file-pdf',
  ellipsisVertical: 'fa-ellipsis-vertical',
  fileBarChart: 'fa-chart-column',
  fileWarning: 'fa-file-exclamation',
  clipboard: 'fa-clipboard',
  clipboardCheck: 'fa-clipboard-check',
  squareCheck: 'fa-square-check',
  // Charts & analytics
  chartPie: 'fa-chart-pie',
  chartLine: 'fa-chart-line',
  chartBar: 'fa-chart-bar',
  trendingUp: 'fa-arrow-trend-up',
  trendingDown: 'fa-arrow-trend-down',
  // Misc
  star: 'fa-star',
  zap: 'fa-bolt',
  timer: 'fa-clock',
  target: 'fa-bullseye',
  award: 'fa-award',
  bookmark: 'fa-bookmark',
  building2: 'fa-building',
  eye: 'fa-eye',
  refreshCw: 'fa-rotate',
  image: 'fa-image',
  camera: 'fa-camera',
  school: 'fa-school',
  sparkles: 'fa-sparkles',
  activity: 'fa-diagram-project',
  archive: 'fa-box-archive',
  rocketLaunch: 'fa-rocket',
  flagCheckered: 'fa-flag-checkered',
  mapPin: 'fa-location-dot',
  route: 'fa-route',
  moreHorizontal: 'fa-ellipsis',
  percent: 'fa-percent',
  listChecks: 'fa-list-check',
  table2: 'fa-table',
  kanban: 'fa-table-columns',
  download: 'fa-download',
  calendarDays: 'fa-calendar-days',
  stethoscope: 'fa-stethoscope',
  heartPulse: 'fa-heart-pulse',
  planeDeparture: 'fa-plane-departure',
  laptopMedical: 'fa-laptop-medical',
  child: 'fa-child',
  hospitalUser: 'fa-hospital-user',
  faceGrinStars: 'fa-face-grin-stars',
  faceSmile: 'fa-face-smile',
  handHoldingHeart: 'fa-hand-holding-heart',
  sackDollar: 'fa-sack-dollar',
  phone: 'fa-phone',
  sortAsc: 'fa-sort-up',
  sortDesc: 'fa-sort-down',
  pinOff: 'fa-thumbtack',
  gripHorizontal: 'fa-grip',
  gripVertical: 'fa-grip-vertical',
  share: 'fa-share-nodes',
  messageSquare: 'fa-comment',
  moon: 'fa-moon',
  sun: 'fa-sun',
  monitor: 'fa-desktop',
  palette: 'fa-palette',
  logOut: 'fa-right-from-bracket',
  paperclip: 'fa-paperclip',
  images: 'fa-images',
  panelLeft: 'fa-panel-left',
  sidebar: 'fa-sidebar',
  minus: 'fa-minus',
  pin: 'fa-thumbtack',
  snowflake: 'fa-snowflake',
  arrowUpDown: 'fa-arrows-up-down',
  arrowDown: 'fa-arrow-down',
  grid3x3: 'fa-th',
  grid2: 'fa-grid-2',
  calculator: 'fa-calculator',
  eyeOff: 'fa-eye-slash',
  wrapText: 'fa-align-left',
  bold: 'fa-bold',
  italic: 'fa-italic',
  listUl: 'fa-list-ul',
  listOl: 'fa-list-ol',
  rotateCcw: 'fa-rotate-left',
  briefcase: 'fa-briefcase',
  'id-badge': 'fa-id-badge',
  idCardClip: 'fa-id-card-clip',
  certificate: 'fa-certificate',
  handshake: 'fa-handshake',
  mail: 'fa-envelope',
  // Additional aliases used in design system tabs
  lightbulb: 'fa-lightbulb',
  calendarPlus: 'fa-calendar-plus',
  circleCheck: 'fa-circle-check',
  magnifyingGlass: 'fa-magnifying-glass',
  triangleExclamation: 'fa-triangle-exclamation',
  expand: 'fa-expand',
  compress: 'fa-compress',
  circleNodes: 'fa-circle-nodes',
} as const;

export type IconName = keyof typeof fontAwesomeIcons;
export type IconWeight = 'light' | 'regular' | 'solid' | 'duotone' | 'thin';

interface FontAwesomeIconProps extends Omit<React.ComponentPropsWithoutRef<"i">, "className"> {
  name: IconName;
  weight?: IconWeight;
  spin?: boolean;
  pulse?: boolean;
  className?: string;
}

const weightPrefixes: Record<IconWeight, string> = {
  light: 'fal',
  regular: 'far',
  solid: 'fas',
  duotone: 'fad',
  thin: 'fat',
};

export function FontAwesomeIcon({
  name,
  weight = 'regular',
  spin = false,
  pulse = false,
  className = '',
  ...rest
}: FontAwesomeIconProps) {
  const iconClass = fontAwesomeIcons[name] ?? 'fa-circle-question';
  const prefix = weightPrefixes[weight];
  const animationClass = spin ? 'fa-spin' : pulse ? 'fa-pulse' : '';

  return (
    <i
      className={`${prefix} ${iconClass} ${animationClass} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        lineHeight: 1,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}
