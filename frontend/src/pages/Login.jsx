import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { validators } from '../lib/validators.js';
import { useAuth } from '../auth.jsx';
import Hero from '../components/Hero.jsx';
import TextField, { PasswordField } from '../components/TextField.jsx';
import { AlertIcon, ArrowRightIcon, LockIcon, MailIcon } from '../components/icons.jsx';

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
    <main className="phone">
      <Hero illustration="chart" tagline="Tus finanzas, un mejor tú" />
      <form className="screen-body" onSubmit={handleSubmit} noValidate>
        <h1 className="title">Bienvenido de vuelta</h1>
        <p className="subtitle">Inicia sesión para continuar con tus finanzas en MoneyMind</p>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}

        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          icon={<MailIcon />}
          placeholder="tucorreo@ejemplo.com"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          icon={<LockIcon />}
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <p className="forgot">
          <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
        </p>

        {formError && (
          <div className="alert error" role="alert">
            <span className="alert-icon">
              <AlertIcon />
            </span>
            <span className="form-error-text">{formError}</span>
          </div>
        )}
        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Entrando…' : 'Iniciar sesión'}
          {!sending && <ArrowRightIcon size={18} />}
        </button>

        <div className="divider">
          <span>o</span>
        </div>
        <p className="switch">
          ¿Aún no tienes una cuenta? <Link to="/registro">Crear cuenta</Link>
        </p>
      </form>
    </main>
  );
}
