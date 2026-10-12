import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { validators } from '../lib/validators.js';
import Hero from '../components/Hero.jsx';
import Stepper from '../components/Stepper.jsx';
import TextField from '../components/TextField.jsx';
import { ArrowLeftIcon, ArrowRightIcon, MailIcon } from '../components/icons.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const emailError = validators.email(email);
    if (emailError) return setError(emailError);

    setSending(true);
    try {
      const { message } = await api('/auth/forgot', { method: 'POST', body: { email } });
      setSent(message); // mensaje genérico: no confirma si el correo existe
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="phone">
      <Hero illustration="envelope" tagline="Tus finanzas, un mejor tú" back="/login" />
      <form className="screen-body" onSubmit={handleSubmit} noValidate>
        <Stepper step={1} />
        <h1 className="title">Recupera tu contraseña</h1>
        <p className="subtitle">
          Te enviaremos un enlace a tu correo electrónico para que puedas restablecer tu contraseña.
          Vale 30 minutos.
        </p>

        {sent ? (
          <p className="notice" role="status">
            {sent}
          </p>
        ) : (
          <>
            <TextField
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              icon={<MailIcon />}
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={error}
            />
            <button className="btn" type="submit" disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar enlace'}
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
