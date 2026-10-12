import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { validators } from '../lib/validators.js';
import { useAuth } from '../auth.jsx';
import TextField from '../components/TextField.jsx';

export default function Login() {
  const navigate = useNavigate();
  const notice = useLocation().state?.notice; // p. ej. "Contraseña actualizada" (HU03)
  const { startSession } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const nextErrors = {};
    if (!values.email.trim()) nextErrors.email = 'Este campo es obligatorio';
    else if (validators.email(values.email)) nextErrors.email = 'Ingresa un correo válido';
    if (!values.password) nextErrors.password = 'Este campo es obligatorio';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSending(true);
    try {
      const session = await api('/auth/login', { method: 'POST', body: values });
      startSession(session);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message); // "Correo o contraseña incorrectos" sin decir cuál falló
      setValues((prev) => ({ ...prev, password: '' }));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="screen">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="logo">MoneyMind</div>
        <h1 className="title">Iniciar sesión</h1>
        <p className="muted">Qué bueno verte de nuevo.</p>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}

        <TextField
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <p className="forgot">
          <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
        </p>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Entrando…' : 'Iniciar sesión'}
        </button>
        <p className="muted center">
          ¿Aún no tienes cuenta? <Link to="/registro">Crear cuenta</Link>
        </p>
      </form>
    </main>
  );
}
