import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { validators } from '../lib/validators.js';
import Hero from '../components/Hero.jsx';
import Stepper from '../components/Stepper.jsx';
import { PasswordField } from '../components/TextField.jsx';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
} from '../components/icons.jsx';

const RULES = [
  { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Incluye una letra', test: (p) => /[A-Za-z]/.test(p) },
  { label: 'Incluye un número', test: (p) => /\d/.test(p) },
];

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState('checking'); // checking | ok | expired | invalid
  const [linkMessage, setLinkMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  // Al abrir el enlace se revisa si sigue vigente
  useEffect(() => {
    api(`/auth/reset/check?token=${encodeURIComponent(token)}`)
      .then(() => setLinkState('ok'))
      .catch((err) => {
        setLinkState(err.status === 410 ? 'expired' : 'invalid');
        setLinkMessage(err.message);
      });
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    const passwordError = validators.password(password);
    if (passwordError) nextErrors.password = passwordError;
    if (confirm !== password) nextErrors.confirm = 'Las contraseñas no coinciden';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSending(true);
    try {
      await api('/auth/reset', { method: 'POST', body: { token, password } });
      navigate('/login', { state: { notice: 'Contraseña actualizada. Ya puedes iniciar sesión' } });
    } catch (err) {
      if (err.status === 410 || err.status === 400) {
        setLinkState(err.status === 410 ? 'expired' : 'invalid');
        setLinkMessage(err.message);
      } else {
        setErrors({ password: err.errors?.password ?? err.message });
      }
    } finally {
      setSending(false);
    }
  }

  const blocked = linkState === 'expired' || linkState === 'invalid';

  return (
    <main className="phone">
      <Hero illustration="lock" tagline="Tus finanzas, un mejor tú" back="/login" />
      <form className="screen-body" onSubmit={handleSubmit} noValidate>
        <Stepper step={2} />
        <h1 className="title">Crea una nueva contraseña</h1>

        {linkState === 'checking' && <p className="subtitle">Revisando tu enlace…</p>}

        {blocked && (
          <div className="alert warn" role="alert">
            <span className="alert-icon">
              <ClockIcon />
            </span>
            <div>
              <strong>{linkMessage}</strong>
              <p>
                {linkState === 'expired'
                  ? 'Este enlace ha expirado, solicita uno nuevo.'
                  : 'No se puede cambiar la contraseña con este enlace, solicita uno nuevo.'}
              </p>
              <Link className="btn outline" to="/recuperar">
                Solicitar un nuevo enlace
              </Link>
            </div>
          </div>
        )}

        {linkState === 'ok' && (
          <>
            <p className="subtitle">
              Tu nueva contraseña debe ser segura y diferente a las anteriores.
            </p>
            <PasswordField
              label="Nueva contraseña"
              name="password"
              autoComplete="new-password"
              icon={<LockIcon />}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({});
              }}
              error={errors.password}
            />
            <ul className="rules">
              {RULES.map((rule) => (
                <li key={rule.label} className={rule.test(password) ? 'ok' : ''}>
                  <span className="rule-dot">
                    <CheckIcon size={11} />
                  </span>
                  {rule.label}
                </li>
              ))}
            </ul>
            <PasswordField
              label="Confirmar nueva contraseña"
              name="confirm"
              autoComplete="new-password"
              icon={<LockIcon />}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrors({});
              }}
              error={errors.confirm}
            />
            <button className="btn" type="submit" disabled={sending}>
              {sending ? 'Guardando…' : 'Actualizar contraseña'}
              {!sending && <ArrowRightIcon size={18} />}
            </button>
          </>
        )}
        <p className="back-link">
          <Link to="/login">
            <ArrowLeftIcon size={18} /> Volver al inicio de sesión
          </Link>
        </p>
      </form>
    </main>
  );
}
