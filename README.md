# 🎩 Bicente 007 · Misión: Recuperar los Datos

Dinámica rompehielos para el inicio de la reunión mensual de gerencia. Los Ransomwarriors secuestraron nuestros datos y modelos, y el equipo debe ayudar al agente Bicente a recuperarlos resolviendo **tres misiones por celular**:

1. 🔐 **Misión 1 · Descifrar la cerradura**: sudoku de 4×4.
2. 🕵️ **Misión 2 · Rastrear el rastro digital**: sopa de letras de 8×8 con 3 palabras (DATOS, GOBIERNO, MODELOS).
3. 🧩 **Misión 3 · Desenmascarar a los agentes**: crucigrama con los nombres de 5 integrantes y una pista por persona.

**Regla del juego:** cada misión se desbloquea cuando **5 agentes (dispositivos)** completan la anterior. Al completar la Misión 3, el proyector muestra la **bóveda abriéndose** (pixel art) y la clave final.

Los jugadores entran **escaneando un QR** que aparece en el proyector; no necesitan instalar nada.

---

## 🖥️ Cómo se usa en la reunión

| Quién | Dirección | Qué ve |
|---|---|---|
| **Proyector** (laptop) | `https://TU-APP.onrender.com/?host` | 1) **Bienvenida** con el relato de Bicente; 2) al pulsar **Iniciar misión**, el QR y el avance de cada misión; 3) al final, la bóveda con la clave |
| **Jugadores** (celular) | Escanean el QR del proyector (o `https://TU-APP.onrender.com/`) | Intro, mapa de misiones y juegos |

Recomendaciones:

- **Abre el proyector 10 minutos antes.** En el plan gratuito de Render el servicio se "duerme" tras un rato sin visitas y la primera carga puede tardar cerca de 1 minuto.
- Pon el navegador en pantalla completa (`F11`) y **haz un clic en la pantalla** para activar la música (los navegadores no permiten audio automático). **La música es solo del proyector**: los celulares no la descargan ni tienen botón de sonido.
- **Nombre de agente:** al entrar, cada jugador elige un nombre en clave (2 a 20 caracteres, único). En el proyector, toca una misión para ver su **ranking de los más rápidos** y quiénes siguen jugando (🟢 conectado, ⚪ sin conexión reciente).
- **El proyector abre con la bienvenida**: cuenta la historia con esa pantalla de fondo y pulsa **Iniciar misión** cuando quieras que aparezca el QR. Si recargas el proyector en plena partida, no vuelve a la bienvenida.
- Para **repetir la dinámica** (o limpiar una prueba) usa el reinicio: ver más abajo. Si quedó avance de una prueba anterior y no reinicias, el proyector lo mostrará al pasar de la bienvenida.

---

## ▶️ Ejecutar en tu computador

Requiere Node.js 18 o superior. **No hay que instalar paquetes**: el servidor usa solo módulos incluidos en Node.

```bash
cd 2026-11-render
node server.js
```

- Proyector: `http://localhost:3000/?host`
- Jugadores: `http://localhost:3000/`

Para probar con celulares reales en la misma red Wi-Fi, abre el proyector con la IP de tu computador (por ejemplo `http://192.168.1.20:3000/?host`). El QR se genera con la dirección con que abriste la página, así que los celulares podrán conectarse.

Atajo de prueba sin servidor: abrir `public/index.html` directamente en el navegador activa el **modo prueba** (los datos quedan solo en ese navegador y aparecen botones para simular agentes).

---

## 🌐 Publicar en Render (plan gratuito)

### Paso 1: subir el proyecto a GitHub

```bash
cd 2026-11-render
git init
git add .
git commit -m "Bicente 007 - Mision: Recuperar los Datos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/bicente-007.git
git push -u origin main
```

(Crea antes el repositorio vacío `bicente-007` en GitHub; puede ser privado.)

### Paso 2: crear el Web Service en Render

1. Entra a [render.com](https://render.com) y elige **New +** → **Web Service**.
2. Conecta tu repositorio `bicente-007`.
3. Completa el formulario:
   - **Language:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`
   - **Health Check Path** (en *Advanced*): `/healthz`
4. En **Environment Variables** agrega:
   - `CLAVE_FINAL`: la clave que verá el proyector al abrirse la bóveda.
   - `ADMIN_KEY`: una clave tuya para poder reiniciar la partida desde el proyector.
5. Pulsa **Create Web Service** y espera 1-2 minutos.

> Alternativa: el archivo `render.yaml` permite crear el servicio con **New +** → **Blueprint**, con los mismos valores. Render te pedirá `CLAVE_FINAL` y generará `ADMIN_KEY` automáticamente (la verás en el panel del servicio, pestaña *Environment*).

### Paso 3: probar

Abre `https://TU-APP.onrender.com/?host`, escanea el QR con tu celular y juega. Si la dirección del QR muestra `localhost`, estás abriendo el proyector desde tu computador local, no desde Render.

---

## 🔁 Reiniciar la partida

Abre el proyector así (solo en la laptop del proyector):

```
https://TU-APP.onrender.com/?host&clave=TU_ADMIN_KEY
```

Aparece un panel **Administración** al final de la pantalla. El botón **Reiniciar partida** pide doble confirmación (pulsar dos veces) y borra el avance de todos los agentes y el proyector vuelve a la bienvenida. **Los celulares deben recargar la página** después de un reinicio.

⚠ La clave queda en la barra de direcciones y en el historial del navegador: no la compartas en pantalla ni abras ese enlace en otros equipos.

---

## ✏️ Cosas que puedes editar

| Qué | Dónde | Notas |
|---|---|---|
| **Pistas del crucigrama** | `public/pistas-crucigrama.json` | Una descripción breve por nombre. No cambies los nombres. Tras editar, haz `git commit` + `git push` y Render redespliega solo. |
| **Clave final** | Variable `CLAVE_FINAL` en Render | Si no la defines, se usa el marcador `GOBIERNO-DATOS-2026`. |
| **Agentes requeridos** | Variable `REQUERIDOS` (por defecto 5) | El juego se adapta solo. |
| **Canción** | `public/musica/agente-007.mp3` | Mantén el mismo nombre de archivo. |
| **Palabras de la sopa, sudoku, nombres del crucigrama** | `public/index.html` | Ver `PALABRAS`, `PISTAS`/`SOLUCION` y `CRUCI_PALABRAS`. El crucigrama está dibujado para estos 5 nombres: si cambias uno, hay que ajustar su posición. |

Las pistas del crucigrama describen a personas: procura que sean inocuas y que cada persona esté de acuerdo.

---

## ⚙️ Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `PORT` | `3000` | Puerto (Render lo define solo). |
| `CLAVE_FINAL` | `GOBIERNO-DATOS-2026` | Clave que muestra el proyector con la bóveda abierta. **Definir la real.** |
| `ADMIN_KEY` | *(vacía)* | Habilita el reinicio desde el proyector. Sin ella, el reinicio está desactivado. |
| `REQUERIDOS` | `5` | Agentes necesarios para desbloquear cada misión. |
| `DATA_FILE` | `./data/estado.json` | Copia en disco del avance (mejor esfuerzo). |

---

## 🐳 Con Docker (opcional)

```bash
docker build -t bicente-007 .
docker run -d -p 3000:3000 -e CLAVE_FINAL=MI-CLAVE -e ADMIN_KEY=MI-ADMIN --name bicente bicente-007
```

---

## ⚠️ Limitaciones a tener presentes

- **El avance vive en memoria.** En el plan gratuito de Render el disco es efímero: si el servicio se reinicia o se duerme, el avance se pierde. Para una dinámica de 10 minutos con el servicio ya despierto no es un problema.
- **Cada dispositivo cuenta una vez**, identificado por un código anónimo guardado en su navegador. Alguien podría contar más de una vez si borra los datos del navegador o usa otro. No hay autenticación: es un juego de sala, no un sistema de seguridad.
- **Datos que se guardan:** el código anónimo del dispositivo, el nombre en clave que elige cada jugador, qué misiones completó y cuánto tardó. Se piden alias (no nombres reales ni RUT) y se borran con el reinicio.
- **El ranking no es a prueba de trampas:** el tiempo lo mide y envía cada celular. Es para competir en sala, no para premios con valor.
- Si un jugador recarga el celular en plena misión, su tiempo de esa misión se pierde y queda al final del ranking.
- **Requiere internet en el proyector y en los celulares.** El código QR (`cdnjs.cloudflare.com`) y la tipografía pixel de la bóveda (`fonts.googleapis.com`) se cargan desde internet; si fallara la tipografía, se usa una de respaldo, pero sin la librería del QR no se dibuja el código (se muestra la dirección para entrar a mano).
- La canción pesa unos 4,7 MB y cada celular que active el sonido la descarga.

---

## 📁 Estructura

```
2026-11-render/
├── server.js                  # Servidor HTTP + API (sin dependencias)
├── package.json
├── Dockerfile
├── render.yaml                # Opcional: Blueprint de Render
├── README.md
└── public/
    ├── index.html             # Jugador (/) y proyector (/?host)
    ├── pistas-crucigrama.json # Pistas editables del crucigrama
    ├── imagenes/image.png     # Agente Bicente
    └── musica/agente-007.mp3  # Canción de fondo
```

### API (por si necesitas depurar)

- `GET /api/estado?id=<id>` → avance de cada misión (`m1`, `m2`, `m3`) y si ese dispositivo ya completó cada una.
- `POST /api/unirse` `{ "id": "<id>", "nombre": "<alias>" }` → registra el nombre de agente (`409` si ya está en uso).
- `GET /api/detalle` → ranking y jugadores por misión (lo usa el proyector).
- `POST /api/completar` `{ "mision": "m1", "id": "<id>", "ms": 42300 }` → registra una misión completada (rechaza con `409` si aún está bloqueada).
- `POST /api/reiniciar` `{ "clave": "<ADMIN_KEY>" }` → borra el avance.
- `GET /healthz` → comprobación de salud para Render.

---

*Desarrollado con asistencia de IA (Claude Code).*
