import { Link } from 'react-router-dom';
import { HomeIcon, ListIcon, PlusIcon, UserIcon, WalletIcon } from './icons.jsx';

/** Barra inferior. Presupuestos y Perfil llegan en sprints posteriores. */
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <Link className="nav-item" to="/dashboard">
        <HomeIcon size={22} />
        Inicio
      </Link>
      <Link className="nav-item active" to="/dashboard">
        <ListIcon size={22} />
        Gastos
      </Link>
      <Link className="fab" to="/gastos/nuevo" aria-label="Nuevo gasto">
        <PlusIcon size={26} />
      </Link>
      <span className="nav-item soon" title="Próximamente">
        <WalletIcon size={22} />
        Presupuestos
      </span>
      <span className="nav-item soon" title="Próximamente">
        <UserIcon size={22} />
        Perfil
      </span>
    </nav>
  );
}
