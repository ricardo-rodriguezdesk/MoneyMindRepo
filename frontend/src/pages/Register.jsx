import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { validators, MONEDAS } from '../lib/validators.js';
import { useAuth } from '../auth.jsx';
import Hero from '../components/Hero.jsx';
import TextField, { PasswordField } from '../components/TextField.jsx';
import { ArrowRightIcon, DollarIcon, LockIcon, MailIcon, UserIcon } from '../components/icons.jsx';

const EMPTY = { nombre: '', email: '', password: '', moneda: 'MXN' };

export default function Register() {
  const navigate = useNavigate();
  const { startSession } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  const localErrors = {
    nombre: validators.nombre(values.nombre),
    email: validators.email(values.email),
    password: validators.password(values.password),
  };
  const errorOf = (field) =>
    touched[field] ? (localErrors[field] ?? '') || serverErrors[field] || '' : '';
  const isValid = (field) => touched[field] && !localErrors[field] && !serverErrors[field];

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setServerErrors((prev) => ({ ...prev, [name]: '' }));
  }
  const handleBlur = (event) => setTouched((prev) => ({ ...prev, [event.target.name]: true }));

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setTouched({ nombre: true, email: true, password: true });
    if (Object.values(localErrors).some(Boolean)) return; // hay campos en rojo: no se envía

    setSending(true);
    try {
      const session = await api('/auth/register', { method: 'POST', body: values });
      startSession(session);
      navigate('/dashboard');
    } catch (err) {
      setServerErrors(err.errors ?? {});
      setFormError(err.status === 409 || err.status === 422 ? '' : err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="phone">
      <Hero illustration="chart" tagline="Tus finanzas, un mejor tú" />
      <form className="screen-body" onSubmit={handleSubmit} noValidate>
        <h1 className="title">Crea tu cuenta</h1>
        <p className="subtitle">Empieza a controlar tus gastos en un minuto.</p>

        <TextField
          label="Nombre"
          name="nombre"
          autoComplete="name"
          icon={<UserIcon />}
          placeholder="Tu nombre"
          value={values.nombre}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errorOf('nombre')}
          valid={isValid('nombre')}
        />
        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          icon={<MailIcon />}
          placeholder="tucorreo@ejemplo.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errorOf('email')}
          valid={isValid('email')}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          icon={<LockIcon />}
          placeholder="Mínimo 8 caracteres"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errorOf('password')}
          valid={isValid('password')}
        />

        <div className="field">
          <label htmlFor="moneda">Moneda</label>
          <div className="input-wrap">
            <span className="input-icon">
              <DollarIcon />
            </span>
            <select id="moneda" name="moneda" value={values.moneda} onChange={handleChange}>
              {MONEDAS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Creando cuenta…' : 'Crear cuenta'}
          {!sending && <ArrowRightIcon size={18} />}
        </button>

        <div className="divider">
          <span>o</span>
        </div>
        <p className="switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </main>
  );
}
