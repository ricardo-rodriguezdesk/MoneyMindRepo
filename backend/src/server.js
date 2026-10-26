import { createApp } from './app.js';
import { createPool } from './db.js';
import { createMailer } from './mailer.js';
import { config } from './config.js';
import { crearClasificador } from './ia.js';

if (config.jwtSecret.startsWith('dev-secret')) {
  console.warn('JWT_SECRET no está definido: usa un valor propio fuera de tu computadora');
}
const db = createPool();
// Sin llave de IA el servidor arranca igual: los gastos se guardan en "Otros"
const clasificador = config.gemini.apiKey ? crearClasificador(config.gemini) : null;
if (!clasificador) console.warn('GEMINI_API_KEY no está definida: la IA está desactivada');
const app = createApp({ db, mailer: createMailer(), clasificador });

app.listen(config.port, () => {
  console.log(`MoneyMind API escuchando en http://localhost:${config.port}`);
});
