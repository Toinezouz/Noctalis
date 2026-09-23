/**
 * Small line icons drawn for NOCTALIS, in `currentColor`. They replace emoji,
 * whose look depends on the device and clashes with the star-chart style.
 */
export type IconName =
  | 'sun'
  | 'moon'
  | 'auto'
  | 'sound'
  | 'mute'
  | 'help'
  | 'leave'
  | 'chart'
  | 'star'
  | 'eye'
  | 'eye-off'
  | 'place'
  | 'gauge'
  | 'turn'
  | 'link'
  | 'crown'
  | 'dice'
  | 'plug'
  | 'copy'
  | 'heart'
  | 'close';

const PATHS: Record<IconName, JSX.Element> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  moon: <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z" />,
  auto: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" stroke="none" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a7.8 7.8 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6" />
      <circle cx="12" cy="16.9" r=".6" fill="currentColor" />
    </>
  ),
  leave: (
    <>
      <path d="M13.5 4.5h-7a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h7" />
      <path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),
  chart: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9.5h16M4 14.5h16M9.5 4v16M14.5 4v16" />
    </>
  ),
  star: <path d="M12 3.2l2.1 6.7 6.7 2.1-6.7 2.1L12 20.8l-2.1-6.7L3.2 12l6.7-2.1Z" />,
  eye: (
    <>
      <path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12Z" />
      <path d="M4.5 19.5l15-15" />
    </>
  ),
  place: (
    <>
      <path d="M3.5 17h17" />
      <path d="M6 17v-6M10 17V9M18 17v-8" />
      <path d="M14 5.5v6.5M11.5 9.5 14 12l2.5-2.5" />
    </>
  ),
  gauge: (
    <>
      <path d="M12 4.5v15M6 19.5h12" />
      <path d="M4 8.5h16" />
      <path d="M4 8.5 2.5 13a3 3 0 0 0 3 0ZM20 8.5 18.5 13a3 3 0 0 0 3 0Z" />
    </>
  ),
  turn: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.8 4.2v3.6h-3.6" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  crown: <path d="M4 17.5h16M5 17.5 3.5 7.5l5 4L12 5l3.5 6.5 5-4-1.5 10Z" />,
  dice: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
      <circle cx="9" cy="9" r=".9" fill="currentColor" />
      <circle cx="15" cy="15" r=".9" fill="currentColor" />
      <circle cx="12" cy="12" r=".9" fill="currentColor" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3.5v4M15 3.5v4M7 7.5h10v3a5 5 0 0 1-10 0Z" />
      <path d="M12 15.5v5" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  heart: <path d="M12 19.5s-7.5-4.4-7.5-9.8A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.4c0 5.4-7.5 9.8-7.5 9.8Z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = '' }: IconProps): JSX.Element {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
