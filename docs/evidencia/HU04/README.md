# Evidencia de Testing — HU04 · Gestión de gastos (CRUD)

Tarjeta: **Construir y probar la gestión de gastos (CRUD)** · Sprint 1
Fecha de ejecución: 12 oct 2026 · Pruebas automáticas: `backend/test/gastos.test.js` (salida en `salida-pruebas.txt`)

| # | Paso | Resultado esperado | Resultado obtenido | Evidencia |
|---|------|--------------------|--------------------|-----------|
| 1 | Entrar con una cuenta sin gastos | Aparece el mensaje guía con el botón "Nuevo gasto" | ✅ Pasó | `01-sin-gastos-mensaje-guia.png`, prueba "Paso 1" |
| 2 | Registrar un gasto válido | Aparece en la lista en menos de 2 segundos | ✅ Pasó. Visible en la lista en 120 ms | `04-gasto-en-la-lista.png`, prueba "Paso 2" |
| 3 | Guardar sin monto | Muestra "Ingresa un monto" y no guarda | ✅ Pasó. Sigue en el formulario y no se crea el gasto | `03-guardar-sin-monto.png`, prueba "Paso 3" |
| 4 | Cambiar la fecha por una anterior y guardar | Se guarda con la fecha elegida | ✅ Pasó. Guardado con 1 oct 2026 | `05`, `06`, prueba "Paso 4" |
| 5 | Editar un gasto existente | El cambio se ve en dashboard | ✅ Pasó. "Tacos con amigos $145" → "Tacos al pastor $160" | `07`, `08`, prueba "Paso 5" |
| 6 | Eliminar un gasto y confirmar | Desaparece del dashboard | ✅ Pasó | `09`, `10`, prueba "Paso 6" |
| 7 | Eliminar un gasto y cancelar | El gasto sigue ahí | ✅ Pasó | `11-eliminacion-cancelada.png`, prueba "Paso 7" |

Verificaciones adicionales: con 12 gastos registrados el dashboard muestra solo los 10 más recientes, del más reciente al más antiguo (`12-ultimos-10-ordenados.png`); monto en cero, negativo o con más de 2 decimales, descripción vacía y fecha futura se rechazan; un usuario no puede ver ni modificar los gastos de otro y sin sesión no hay acceso.

## Criterios de aceptación de la historia

- "Nuevo gasto" pide descripción y monto, con la fecha de hoy preseleccionada → ✅ (`02-formulario-fecha-de-hoy.png`)
- Guardar → el gasto aparece en la lista → ✅
- Guardar sin monto → "Ingresa un monto" y no guarda → ✅
- Dashboard con gastos → últimos 10, del más reciente al más antiguo → ✅
- Editar → se actualiza y se refleja en el dashboard → ✅
- Eliminar y confirmar → se elimina del dashboard → ✅
- Sin gastos → mensaje guía para registrar el primero → ✅

El resultado final coincide con los criterios de aceptación de HU04 en el Backlog Product.

## Notas

- La pantalla de **reportes** se construye en HU06 y HU07 (Sprint 2). Por ahora los cambios se reflejan en el dashboard; los reportes leerán los mismos datos.
- Hasta HU05 (categorización con IA, Sprint 2) todos los gastos se guardan en la categoría **"Otros"**, porque la BD exige una categoría.
