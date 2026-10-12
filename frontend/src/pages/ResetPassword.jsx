import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { validators } from '../lib/validators.js';
import TextField from '../components/TextField.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState('checking'); // checking | ok | expired | invalid
  const [linkMessage, setLinkMessage] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
    setError('');
    const passwordError = validators.password(password);
    if (passwordError) return setError(passwordError);

    setSending(true);
    try {
      await api('/auth/reset', { method: 'POST', body: { token, password } });
      navigate('/login', { state: { notice: 'Contraseña actualizada. Ya puedes iniciar sesión' } });
    } catch (err) {
      if (err.status === 410 || err.status === 400) {
        setLinkState(err.status === 410 ? 'expired' : 'invalid');
        setLinkMessage(err.message);
      } else {
        setError(err.errors?.password ?? err.message);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="screen">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="logo">MoneyMind</div>
        <h1 className="title">Nueva contraseña</h1>

        {linkState === 'checking' && <p className="muted">Revisando tu enlace…</p>}

        {(linkState === 'expired' || linkState === 'invalid') && (
          <>
            <p className="form-error" role="alert">
              {linkMessage}
            </p>
            <p className="muted">No se puede cambiar la contraseña con este enlace.</p>
            <Link className="btn link-btn" to="/recuperar">
              Solicitar un enlace nuevo
            </Link>
          </>
        )}

        {linkState === 'ok' && (
          <>
            <p className="muted">Elige una contraseña nueva para tu cuenta.</p>
            <TextField
              label="Nueva contraseña"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              error={error}
            />
            <button className="btn" type="submit" disabled={sending}>
              {sending ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
