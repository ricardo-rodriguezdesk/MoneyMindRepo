// Íconos de línea (estilo del diseño). Se heredan del color del texto (currentColor).
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};
const Svg = ({ size, children }) => (
  <svg {...base} {...(size ? { width: size, height: size } : {})}>
    {children}
  </svg>
);

export const MailIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 7l8.5 6 8.5-6" />
  </Svg>
);
export const LockIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9.5" rx="2.5" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </Svg>
);
export const UserIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
  </Svg>
);
export const EyeIcon = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const EyeOffIcon = (p) => (
  <Svg {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6A9.8 9.8 0 0112 5.5C18.4 5.5 22 12 22 12a17 17 0 01-3.2 4M6.5 7.2A17 17 0 002 12s3.6 6.5 10 6.5a9.6 9.6 0 004-.9" />
    <path d="M9.9 10a3 3 0 004.1 4.1" />
  </Svg>
);
export const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const ArrowLeftIcon = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const AlertIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.1" />
  </Svg>
);
export const ClockIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" />
  </Svg>
);
export const DocIcon = (p) => (
  <Svg {...p}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M9 11h7M9 15h7M9 7h3" />
  </Svg>
);
export const DollarIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9.2c-.4-1-1.4-1.6-2.8-1.6-1.6 0-2.7.8-2.7 2 0 3 5.6 1.3 5.6 4.3 0 1.2-1.1 2.1-2.9 2.1-1.5 0-2.6-.7-3-1.8M12 6v1.6M12 16.4V18" />
  </Svg>
);
export const TagIcon = (p) => (
  <Svg {...p}>
    <path d="M3 12.2V4a1 1 0 011-1h8.2a1 1 0 01.7.3l7.8 7.8a1 1 0 010 1.4l-7.2 7.2a1 1 0 01-1.4 0L3.3 12.9a1 1 0 01-.3-.7z" />
    <circle cx="8" cy="8" r="1.4" />
  </Svg>
);
export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
export const PencilIcon = (p) => (
  <Svg {...p}>
    <path d="M4 20l4.2-1 10-10a2.1 2.1 0 00-3-3l-10 10z" />
    <path d="M13.5 7.5l3 3" />
  </Svg>
);
export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 008.5 21h7a1.5 1.5 0 001.5-1.5L18 7M9 7V4.5h6V7" />
  </Svg>
);
export const PlusIcon = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const HomeIcon = (p) => (
  <Svg {...p}>
    <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" />
  </Svg>
);
export const ListIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2.5" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </Svg>
);
export const WalletIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7.5A2.5 2.5 0 016.5 5H18v3" />
    <path d="M4 7.5V17a2 2 0 002 2h13a1 1 0 001-1V9a1 1 0 00-1-1H6.5A2.5 2.5 0 014 7.5z" />
    <circle cx="16.5" cy="13.5" r="1.1" />
  </Svg>
);
export const LogoutIcon = (p) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 8l-4 4 4 4M6 12h10" />
  </Svg>
);
export const ForkIcon = (p) => (
  <Svg {...p}>
    <path d="M7 3v7a2 2 0 002 2v9M5 3v6M9 3v6M17 21V3c-2.2 1.3-3 4-3 7s1 4 3 4" />
  </Svg>
);
export const BusIcon = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="13" rx="3" />
    <path d="M4 11h16M8 20v-3M16 20v-3" />
    <circle cx="8" cy="14" r=".6" />
    <circle cx="16" cy="14" r=".6" />
  </Svg>
);
export const GameIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="11" rx="5" />
    <path d="M8 10.5v4M6 12.5h4M16 11.5v.1M18 13.5v.1" />
  </Svg>
);
export const HeartIcon = (p) => (
  <Svg {...p}>
    <path d="M12 20.5s-8-4.9-8-10.6A4.6 4.6 0 0112 7.4a4.6 4.6 0 018 2.5c0 5.7-8 10.6-8 10.6z" />
  </Svg>
);
export const BookIcon = (p) => (
  <Svg {...p}>
    <path d="M5 4.5A1.5 1.5 0 016.5 3H19v15H6.5A1.5 1.5 0 005 19.5z" />
    <path d="M5 19.5A1.5 1.5 0 006.5 21H19v-3" />
  </Svg>
);

/** Ícono según el nombre guardado en categorias.icono */
export function CategoryIcon({ name, ...props }) {
  const map = {
    burger: ForkIcon,
    car: BusIcon,
    movie: GameIcon,
    heart: HeartIcon,
    home: HomeIcon,
    book: BookIcon,
    wallet: WalletIcon,
  };
  const Icon = map[name] ?? TagIcon;
  return <Icon {...props} />;
}
