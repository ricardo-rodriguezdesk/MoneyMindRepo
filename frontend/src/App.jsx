import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import GastoForm from './pages/GastoForm.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inicio from './pages/Inicio.jsx';
import Reportes from './pages/Reportes.jsx';

/** Pantallas que exigen sesión. */
function Private({ children }) {
  const { user, checking } = useAuth();
  if (checking) return null;
  return user ? children : <Navigate to="/login" replace />;
}

/** Login y registro: si ya hay sesión, se salta directo al dashboard. */
function Public({ children }) {
  const { user, checking } = useAuth();
  if (checking) return null;
  return user ? <Navigate to="/inicio" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <Public>
              <Login />
            </Public>
          }
        />
        <Route
          path="/registro"
          element={
            <Public>
              <Register />
            </Public>
          }
        />
        <Route
          path="/recuperar"
          element={
            <Public>
              <ForgotPassword />
            </Public>
          }
        />
        <Route path="/restablecer" element={<ResetPassword />} />
        <Route
          path="/inicio"
          element={
            <Private>
              <Inicio />
            </Private>
          }
        />
        <Route
          path="/reportes"
          element={
            <Private>
              <Reportes />
            </Private>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Private>
              <Dashboard />
            </Private>
          }
        />
        <Route
          path="/gastos/nuevo"
          element={
            <Private>
              <GastoForm />
            </Private>
          }
        />
        <Route
          path="/gastos/:id/editar"
          element={
            <Private>
              <GastoForm />
            </Private>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
