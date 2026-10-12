# Evidencia de Testing — HU03 · Recuperar contraseña

Tarjeta: **Construir y probar la recuperación de contraseña** · Sprint 1
Fecha de ejecución: 12 oct 2026 · Pruebas automáticas: `backend/test/password.test.js` (salida en `salida-pruebas.txt`)
El correo se probó en modo simulado (sin SMTP configurado, el backend imprime el correo): ver `correo-recibido.txt`.

| # | Paso | Resultado esperado | Resultado obtenido | Evidencia |
|---|------|--------------------|--------------------|-----------|
| 1 | Solicitar recuperación con un correo registrado | Llega el correo con el enlace | ✅ Pasó. Correo con enlace `/restablecer?token=…` | `03-correo-registrado-mensaje.png`, `correo-recibido.txt`, prueba "Paso 1" |
| 2 | Solicitar con un correo no registrado | Mensaje genérico, sin confirmar si el correo existe | ✅ Pasó. Mismo mensaje que con un correo real y no se envía correo | `02-correo-no-registrado-mensaje-generico.png`, prueba "Paso 2" |
| 3 | Abrir el enlace antes de 30 minutos y definir nueva contraseña | Se actualiza y puede iniciar sesión con ella | ✅ Pasó. Con la nueva contraseña entra al dashboard; la anterior ya no funciona | `04`, `05`, `06`, prueba "Paso 3" |
| 4 | Abrir un enlace vencido (se forzó la expiración) | Muestra "Este enlace ha expirado" y no permite el cambio | ✅ Pasó. Sin campo de contraseña y con opción de pedir otro enlace | `07-enlace-expirado.png`, prueba "Paso 4" |

Verificaciones adicionales (pruebas automáticas): la vigencia es de 30 minutos, el enlace solo sirve una vez, solo el más reciente funciona, en la BD solo se guarda el hash del token y si falla el envío del correo no queda un enlace activo.

## Criterios de aceptación de la historia

- "¿Olvidaste tu contraseña?" pide el correo → ✅ (`01-pide-correo.png`)
- Correo registrado + "Enviar" → enlace válido por 30 minutos → ✅
- Correo no registrado → mensaje genérico → ✅
- Enlace dentro de 30 minutos + nueva contraseña → se actualiza y permite iniciar sesión → ✅
- Enlace después de 30 minutos → indica que expiró y no permite el cambio → ✅

El resultado final coincide con los criterios de aceptación de HU03 en el Backlog Product.

> Cambio de BD de esta tarjeta: tabla nueva `tokens_recuperacion` (ya incluida en `db/schema.sql`; migración en `db/migrations/001_tokens_recuperacion.sql`).
