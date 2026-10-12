import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { validators } from '../lib/validators.js';
import TextField from '../components/TextField.jsx';

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
    <main className="screen">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="logo">MoneyMind</div>
        <h1 className="title">Recuperar contraseña</h1>
        <p className="muted">Escribe tu correo y te enviaremos un enlace válido por 30 minutos.</p>

        {sent ? (
          <p className="notice" role="status">
            {sent}
          </p>
        ) : (
          <>
            <TextField
              label="Correo"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={error}
            />
            <button className="btn" type="submit" disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar'}
            </button>
          </>
        )}
        <p className="muted center">
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </form>
    </main>
  );
}
