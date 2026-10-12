import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from './icons.jsx';

/** Barras verdes del logotipo */
function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <defs>
        <linearGradient id="barGreen" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect x="2" y="19" width="8" height="13" rx="2.5" fill="url(#barGreen)" />
      <rect x="13" y="11" width="8" height="21" rx="2.5" fill="url(#barGreen)" />
      <rect x="24" y="2" width="8" height="30" rx="2.5" fill="url(#barGreen)" />
    </svg>
  );
}

const Coin = ({ x, y, r = 22 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#10b981" />
    <circle cx={x} cy={y} r={r - 4} fill="#34d399" opacity=".55" />
    <text
      x={x}
      y={y + r * 0.38}
      textAnchor="middle"
      fontSize={r * 1.15}
      fontWeight="800"
      fill="#fff"
    >
      $
    </text>
  </g>
);

/** Ilustraciones de cada pantalla (esquina derecha del encabezado) */
const ILLUSTRATIONS = {
  chart: (
    <svg viewBox="0 0 180 130" aria-hidden="true">
      <path d="M18 82c34-6 52-34 84-44" stroke="#4f7fa8" strokeWidth="2" fill="none" opacity=".7" />
      <rect x="6" y="88" width="30" height="36" rx="3" fill="#3f6b95" />
      <rect x="6" y="88" width="30" height="7" rx="3" fill="#6f9cc4" />
      <rect x="46" y="68" width="32" height="56" rx="3" fill="#3f6b95" />
      <rect x="46" y="68" width="32" height="7" rx="3" fill="#6f9cc4" />
      <rect x="88" y="44" width="34" height="80" rx="3" fill="#3f6b95" />
      <rect x="88" y="44" width="34" height="7" rx="3" fill="#6f9cc4" />
      <Coin x={150} y={74} r={26} />
      <path
        d="M150 48c0-10-2-18-12-24 12-2 20 6 22 16 2-8 8-14 18-14-2 12-10 20-28 22z"
        fill="#2f7f86"
      />
    </svg>
  ),
  envelope: (
    <svg viewBox="0 0 180 130" aria-hidden="true">
      <path d="M30 60l70-30 56 28-10 56-80 6z" fill="#dce8f7" />
      <path d="M30 60l62 34 64-36" fill="#b9cde8" />
      <path d="M30 60l62 34-12 28-50-8z" fill="#eaf2fc" />
      <circle cx="146" cy="98" r="24" fill="#10b981" />
      <path d="M136 98l22-10-8 22-4-8z" fill="#fff" />
      <path
        d="M150 24l6-10M164 34l10-5M136 18l-2-9"
        stroke="#34d399"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 180 130" aria-hidden="true">
      <path
        d="M76 66V50a24 24 0 0148 0v16"
        stroke="#dce8f7"
        strokeWidth="11"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="62" y="64" width="76" height="58" rx="14" fill="#eaf2fc" />
      <rect x="62" y="64" width="76" height="14" rx="7" fill="#fff" opacity=".7" />
      <circle cx="100" cy="92" r="7" fill="#2b5a8a" />
      <rect x="97" y="94" width="6" height="14" rx="3" fill="#2b5a8a" />
      <path
        d="M150 28l6-10M164 40l10-5M140 18l-1-10"
        stroke="#34d399"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  receipt: (
    <svg viewBox="0 0 180 130" aria-hidden="true">
      <rect
        x="56"
        y="12"
        width="76"
        height="104"
        rx="10"
        fill="#eaf2fc"
        transform="rotate(8 94 64)"
      />
      <g transform="rotate(8 94 64)" fill="#b4c9e4">
        <rect x="68" y="34" width="46" height="7" rx="3.5" />
        <rect x="68" y="52" width="52" height="7" rx="3.5" />
        <rect x="68" y="70" width="34" height="7" rx="3.5" />
      </g>
      <circle cx="136" cy="96" r="25" fill="#10b981" />
      <path d="M136 84v24M124 96h24" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <path d="M40 40l-10-6M34 62l-12 2" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * Encabezado azul con onda, logo, lema e ilustración.
 * back: ruta del botón "←"; title: título centrado de la barra superior; action: botón a la derecha.
 */
export default function Hero({ illustration = 'chart', tagline, back, title, action }) {
  return (
    <header className="hero">
      {(back || title || action) && (
        <div className="hero-bar">
          {back ? (
            <Link className="hero-icon" to={back} aria-label="Volver">
              <ArrowLeftIcon />
            </Link>
          ) : (
            <span className="hero-icon ghost" />
          )}
          <span className="hero-title">{title}</span>
          {action ?? <span className="hero-icon ghost" />}
        </div>
      )}
      <div className="hero-brand">
        <LogoMark />
        <span className="wordmark">
          Money<em>Mind</em>
        </span>
      </div>
      <p className="hero-tagline">{tagline}</p>
      <div className="hero-art">{ILLUSTRATIONS[illustration]}</div>
      <svg className="hero-wave" viewBox="0 0 430 56" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 14C130 66 300 44 430 0V56H0Z" />
      </svg>
    </header>
  );
}

/** Ilustración suelta (estado vacío de gastos) */
Hero.Receipt = function Receipt() {
  return ILLUSTRATIONS.receipt;
};
