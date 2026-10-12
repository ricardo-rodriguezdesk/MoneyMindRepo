import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { validateEmail, validatePassword } from '../validators.js';

const VIGENCIA_MINUTOS = 30;
const MENSAJE_GENERICO =
  'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export function passwordRoutes({ db, mailer }) {
  const router = Router();

  /**
   * Busca el token y dice en qué estado está.
   * La comparación de fechas se hace en la BD para usar un solo reloj.
   */
  async function findToken(token) {
    if (typeof token !== 'string' || token.length === 0) return { status: 'invalid' };
    const [rows] = await db.query(
      `SELECT id_token, id_usuario, usado, fecha_expiracion < NOW() AS vencido
         FROM tokens_recuperacion WHERE token_hash = ?`,
      [hashToken(token)]
    );
    const row = rows[0];
    if (!row || row.usado) return { status: 'invalid' };
    if (row.vencido) return { status: 'expired' };
    return { status: 'ok', row };
  }

  // HU03 — Paso 1: el usuario pide el enlace con su correo
  router.post('/forgot', async (req, res, next) => {
    try {
      const email = String(req.body?.email ?? '')
        .trim()
        .toLowerCase();
      const emailError = validateEmail(email);
      if (emailError) {
        return res.status(422).json({ message: emailError, errors: { email: emailError } });
      }

      const [users] = await db.query('SELECT id_usuario, nombre FROM usuarios WHERE email = ?', [
        email,
      ]);
      const user = users[0];
      // Correo no registrado: misma respuesta, sin enviar nada y sin confirmar si existe
      if (!user) return res.json({ message: MENSAJE_GENERICO });

      // Solo el enlace más reciente funciona
      await db.query('UPDATE tokens_recuperacion SET usado = TRUE WHERE id_usuario = ?', [
        user.id_usuario,
      ]);
      const token = randomBytes(32).toString('hex');
      const [result] = await db.query(
        `INSERT INTO tokens_recuperacion (id_usuario, token_hash, fecha_expiracion)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ${VIGENCIA_MINUTOS} MINUTE))`,
        [user.id_usuario, hashToken(token)]
      );

      try {
        await mailer.send({
          to: email,
          subject: 'Restablece tu contraseña de MoneyMind',
          text:
            `Hola ${user.nombre.split(' ')[0]},\n\n` +
            `Para crear una nueva contraseña entra a este enlace (vale ${VIGENCIA_MINUTOS} minutos):\n` +
            `${config.appUrl}/restablecer?token=${token}\n\n` +
            'Si no lo pediste tú, ignora este correo.',
        });
      } catch (err) {
        console.error('Fallo al enviar el correo de recuperación:', err.message);
        await db.query('DELETE FROM tokens_recuperacion WHERE id_token = ?', [result.insertId]);
        return res.status(503).json({ message: 'No pudimos enviar el correo, intenta más tarde' });
      }
      return res.json({ message: MENSAJE_GENERICO });
    } catch (err) {
      return next(err);
    }
  });

  // HU03 — Paso 2: la app revisa el enlace al abrirlo (para avisar si ya expiró)
  router.get('/reset/check', async (req, res, next) => {
    try {
      const { status } = await findToken(req.query.token);
      if (status === 'expired') return res.status(410).json({ message: 'Este enlace ha expirado' });
      if (status === 'invalid') return res.status(400).json({ message: 'El enlace no es válido' });
      return res.json({ valid: true });
    } catch (err) {
      return next(err);
    }
  });

  // HU03 — Paso 3: define la nueva contraseña con un enlace vigente
  router.post('/reset', async (req, res, next) => {
    try {
      const passwordError = validatePassword(req.body?.password);
      if (passwordError) {
        return res
          .status(422)
          .json({ message: passwordError, errors: { password: passwordError } });
      }
      const { status, row } = await findToken(req.body?.token);
      if (status === 'expired') return res.status(410).json({ message: 'Este enlace ha expirado' });
      if (status === 'invalid') return res.status(400).json({ message: 'El enlace no es válido' });

      const passwordHash = await bcrypt.hash(req.body.password, 12);
      await db.query('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [
        passwordHash,
        row.id_usuario,
      ]);
      await db.query('UPDATE tokens_recuperacion SET usado = TRUE WHERE id_usuario = ?', [
        row.id_usuario,
      ]);
      return res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión' });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
