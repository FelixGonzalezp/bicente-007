'use strict';
// Servidor de la dinámica "Bicente 007". Sin dependencias externas: solo módulos de Node.
// - Sirve la carpeta public/ (con soporte de rangos para que el audio funcione en iOS/Safari).
// - Lleva la cuenta de agentes (dispositivos) que completaron cada misión.
// - Una misión solo se desbloquea cuando REQUERIDOS agentes completaron la anterior.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR || path.join(__dirname, 'public'));
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'estado.json');
const REQUERIDOS = parseInt(process.env.REQUERIDOS, 10) || 5;
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const CLAVE_FINAL = process.env.CLAVE_FINAL || 'GOBIERNO-DATOS-2026';   // PLACEHOLDER: definir la real en Render
const MISIONES = ['m1', 'm2', 'm3'];
const MAX_AGENTES = 1000;                  // tope de dispositivos por misión
const ID_VALIDO = /^[A-Za-z0-9_-]{6,80}$/;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2'
};

/* ---------- Estado (en memoria, con copia en disco "mejor esfuerzo") ---------- */
const estado = { m1: new Set(), m2: new Set(), m3: new Set() };

function cargar() {
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    MISIONES.forEach(m => (d[m] || []).forEach(id => estado[m].add(id)));
    console.log('Estado recuperado desde', DATA_FILE);
  } catch (e) { /* primera ejecución o disco efímero */ }
}

let temporizador = null;
function guardar() {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      const tmp = DATA_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({ m1: [...estado.m1], m2: [...estado.m2], m3: [...estado.m3] }));
      fs.renameSync(tmp, DATA_FILE);
    } catch (e) { /* el disco puede ser de solo lectura: no es crítico */ }
  }, 500);
}

function resumen(id) {
  const r = {
    m1: estado.m1.size, m2: estado.m2.size, m3: estado.m3.size,
    requeridos: REQUERIDOS,
    yo: { m1: false, m2: false, m3: false }
  };
  if (id && ID_VALIDO.test(id)) MISIONES.forEach(m => { r.yo[m] = estado[m].has(id); });
  if (estado.m3.size >= REQUERIDOS) r.clave = CLAVE_FINAL;   // la clave solo se entrega con la bóveda abierta
  return r;
}

/* ---------- Utilidades HTTP ---------- */
function json(res, codigo, cuerpo) {
  const datos = JSON.stringify(cuerpo);
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(datos);
}

function leerCuerpo(req, limite = 2048) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const trozos = [];
    req.on('data', t => {
      total += t.length;
      if (total > limite) {
        const e = new Error('cuerpo demasiado grande');
        e.codigo = 413;
        req.pause();
        reject(e);
        return;
      }
      trozos.push(t);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(trozos).toString('utf8') || '{}')); }
      catch (e) { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

// Responde el error de lectura del cuerpo; si era demasiado grande, cierra la conexión tras responder
function errorCuerpo(req, res, e) {
  if (e.codigo === 413) {
    res.setHeader('Connection', 'close');
    res.on('finish', () => req.destroy());
  }
  return json(res, e.codigo || 400, { error: e.message });
}

function mismaClave(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

/* ---------- API ---------- */
async function api(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/estado') {
    return json(res, 200, resumen(url.searchParams.get('id')));
  }

  if (req.method === 'POST' && url.pathname === '/api/completar') {
    let b;
    try { b = await leerCuerpo(req); } catch (e) { return errorCuerpo(req, res, e); }
    if (!MISIONES.includes(b.mision)) return json(res, 400, { error: 'misión inválida' });
    if (typeof b.id !== 'string' || !ID_VALIDO.test(b.id)) return json(res, 400, { error: 'id inválido' });
    const i = MISIONES.indexOf(b.mision);
    if (i > 0 && estado[MISIONES[i - 1]].size < REQUERIDOS) return json(res, 409, { error: 'misión bloqueada' });
    if (!estado[b.mision].has(b.id)) {
      if (estado[b.mision].size >= MAX_AGENTES) return json(res, 429, { error: 'límite alcanzado' });
      estado[b.mision].add(b.id);
      guardar();
      console.log(`✔ ${b.mision} completada (${estado[b.mision].size}/${REQUERIDOS})`);
    }
    return json(res, 200, resumen(b.id));
  }

  if (req.method === 'POST' && url.pathname === '/api/reiniciar') {
    let b;
    try { b = await leerCuerpo(req); } catch (e) { return errorCuerpo(req, res, e); }
    if (!ADMIN_KEY) return json(res, 403, { error: 'ADMIN_KEY no está configurada en el servidor' });
    if (!mismaClave(b.clave || '', ADMIN_KEY)) return json(res, 403, { error: 'clave incorrecta' });
    MISIONES.forEach(m => estado[m].clear());
    guardar();
    console.log('↺ Partida reiniciada');
    return json(res, 200, resumen(null));
  }

  return json(res, 404, { error: 'no encontrado' });
}

/* ---------- Archivos estáticos ---------- */
function estatico(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (rel.includes('\0')) { res.writeHead(400); return res.end(); }
  if (rel === '/') rel = '/index.html';

  const abs = path.resolve(PUBLIC_DIR, '.' + rel);
  if (abs !== PUBLIC_DIR && !abs.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403); return res.end(); }

  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    const ext = path.extname(abs).toLowerCase();
    const cabeceras = {
      'Content-Type': TIPOS[ext] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': (ext === '.html' || ext === '.json') ? 'no-cache' : 'public, max-age=86400'
    };

    let inicio = 0, fin = st.size - 1, codigo = 200;
    const rango = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (rango && (rango[1] || rango[2])) {
      if (rango[1] === '') { inicio = Math.max(0, st.size - parseInt(rango[2], 10)); }
      else { inicio = parseInt(rango[1], 10); if (rango[2]) fin = Math.min(fin, parseInt(rango[2], 10)); }
      if (inicio > fin || inicio >= st.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${st.size}` });
        return res.end();
      }
      codigo = 206;
      cabeceras['Content-Range'] = `bytes ${inicio}-${fin}/${st.size}`;
    }
    cabeceras['Content-Length'] = fin - inicio + 1;
    res.writeHead(codigo, cabeceras);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(abs, { start: inicio, end: fin })
      .on('error', () => res.destroy())
      .pipe(res);
  });
}

/* ---------- Servidor ---------- */
const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (url.pathname.startsWith('/api/')) {
    return api(req, res, url).catch(() => json(res, 500, { error: 'error interno' }));
  }
  estatico(req, res, url);
});

cargar();
servidor.listen(PORT, () => {
  console.log('===================================================');
  console.log(`🎩 BICENTE 007 · servidor en el puerto ${PORT}`);
  console.log(`📺 Proyector:  http://localhost:${PORT}/?host`);
  console.log(`📱 Jugadores:  http://localhost:${PORT}/   (se entra escaneando el QR del proyector)`);
  console.log(`🔓 Agentes requeridos por misión: ${REQUERIDOS}`);
  if (!process.env.CLAVE_FINAL) console.log('⚠ CLAVE_FINAL no definida: se usa el marcador por defecto.');
  if (!ADMIN_KEY) console.log('ℹ ADMIN_KEY no definida: el reinicio de partida desde el proyector está desactivado.');
  console.log('===================================================');
});
