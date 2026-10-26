// HU05A — Cliente de Gemini: se prueba con un fetch falso (sin internet ni cuota)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearClasificador } from '../src/ia.js';

const entrada = { descripcion: 'Super Walmart', monto: 350, categorias: ['Comida', 'Otros'] };
const respuestaGemini = (texto, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => ({ candidates: [{ content: { parts: [{ text: texto }] } }] }),
});

describe('HU05A · cliente de IA (Gemini)', () => {
  it('arma la petición con modelo, llave en el encabezado y solo los datos del gasto', async () => {
    let url;
    let opciones;
    const clasificar = crearClasificador({
      apiKey: 'llave-de-prueba',
      model: 'gemini-flash-latest',
      fetchFn: async (u, o) => {
        url = u;
        opciones = o;
        return respuestaGemini('{"categoria":"Comida","confianza":0.91}');
      },
    });
    const resultado = await clasificar(entrada);
    assert.deepEqual(resultado, { nombre: 'Comida', confianza: 0.91 });
    assert.ok(url.endsWith('/models/gemini-flash-latest:generateContent'));
    assert.equal(opciones.headers['x-goog-api-key'], 'llave-de-prueba');
    assert.ok(!url.includes('llave-de-prueba'), 'la llave no va en la URL');
    assert.ok(!opciones.body.includes('llave-de-prueba'), 'la llave no va en el cuerpo');
    const cuerpo = JSON.parse(opciones.body);
    assert.deepEqual(cuerpo.generationConfig.responseSchema.properties.categoria.enum, [
      'Comida',
      'Otros',
    ]);
    assert.ok(opciones.body.includes('Super Walmart'));
  });

  it('error HTTP (límite de uso, llave inválida) → lanza error', async () => {
    const clasificar = crearClasificador({
      apiKey: 'x',
      model: 'm',
      fetchFn: async () => respuestaGemini('', false, 429),
    });
    await assert.rejects(clasificar(entrada), /429/);
  });

  it('respuesta que no es JSON o con formato inesperado → lanza error', async () => {
    const noJson = crearClasificador({
      apiKey: 'x',
      model: 'm',
      fetchFn: async () => respuestaGemini('hola'),
    });
    await assert.rejects(noJson(entrada));
    const incompleta = crearClasificador({
      apiKey: 'x',
      model: 'm',
      fetchFn: async () => respuestaGemini('{"categoria":"Comida"}'),
    });
    await assert.rejects(incompleta(entrada), /formato/);
  });

  it('la IA no responde → se corta al llegar al tiempo máximo', async () => {
    const clasificar = crearClasificador({
      apiKey: 'x',
      model: 'm',
      timeoutMs: 30,
      fetchFn: (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('abortado')));
        }),
    });
    const inicio = Date.now();
    await assert.rejects(clasificar(entrada), /abortado/);
    assert.ok(Date.now() - inicio < 1000);
  });
});
