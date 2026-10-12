import nodemailer from 'nodemailer';

/**
 * Crea el enviador de correos. Con SMTP_HOST configurado envía correos reales;
 * sin él, el correo se imprime en la consola del backend (útil en desarrollo).
 */
export function createMailer(env = process.env) {
  const useSmtp = Boolean(env.SMTP_HOST);
  const transport = useSmtp
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT ?? 587),
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });
  const from = env.SMTP_FROM ?? 'MoneyMind <no-reply@moneymind.app>';

  return {
    async send({ to, subject, text }) {
      const info = await transport.sendMail({ from, to, subject, text });
      if (!useSmtp) {
        console.log(`[correo simulado] Para: ${to}\nAsunto: ${subject}\n${text}\n`);
      }
      return info;
    },
  };
}
