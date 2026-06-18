He encontrado el problema de los botones en PC: al tener un tamaño mínimo de calculadora y muchos botones, la cuadrícula se desbordaba y los ocultaba. He corregido el CSS para que el teclado se adapte y muestre una barra de scroll si es necesario. 

Además, he añadido el botón de grabación de video (🎥). Al presionarlo, empezará a grabar la gráfica en tiempo real (formato WebM). Al volver a presionarlo, se detendrá y descargará el video automáticamente.

Aquí tienes los 3 archivos actualizados:

### 1. `index.html`
*(Añadí el botón `#video-btn` en la esquina superior derecha)*
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Calculadora Gráfica Institucional</title>
    
    <link rel="preload" as="image" href="Calculadora.jpg">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="style.css">

    <!-- Three.js versión clásica -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>

    <!-- Pantalla de Inicio -->
    <div id="splash-screen">
        <div class="splash-content">
            <img src="Calculadora.jpg" alt="Calculadora Institucional" class="splash-img">
            <div class="login-box">
                <h2>Acceso Institucional</h2>
                <p class="login-subtitle">Verificación de dominio</p>
                <input type="email" id="email-input" placeholder="tu.correo@juventud.edu.mx" autocomplete="off">
                <button id="start-btn" class="start-btn">Ingresar</button>
                <p id="error-msg" class="error-msg">Solo se permiten correos @juventud.edu.mx</p>
            </div>
        </div>
    </div>

    <!-- HUD -->
    <div class="hud-overlay">
        <div class="mode-badge">
            <div class="mode-dot" id="status-dot"></div>
            <span id="status-text">MODO 2D</span>
        </div>
    </div>

    <!-- Botones Superiores Derechos -->
    <button id="video-btn" class="top-control-btn" aria-label="Grabar video">🎥</button>
    <button id="screenshot-btn" class="top-control-btn" aria-label="Captura de pantalla">📸</button>
    <button id="calc-toggle" class="top-control-btn" aria-label="Mostrar/Ocultar Calculadora">🧮</button>
    <button id="theme-toggle" class="top-control-btn" aria-label="Cambiar tema">🌙</button>

    <div id="tooltip" class="tooltip"></div>
    <div id="viewport"></div>

    <div class="calculator-container" id="calculator">
        <div class="calc-header" id="calc-header">
            <div class="header-inner">
                <div class="mobile-drag-handle" id="mobile-handle"></div>
                <span class="header-title">GRAPH ENGINE PRO</span>
            </div>
            <div class="header-controls">
                <button class="win-btn" id="btn-minimize" aria-label="Minimizar"></button>
            </div>
        </div>

        <div class="screen-container">
            <div class="screen-label">f(x, y) =</div>
            <div class="screen-output" id="display"><span class="cursor"></span></div>
        </div>

        <div class="controls-area">
            <div class="dropdown-container">
                <button id="examples-btn" class="examples-btn">Ejemplos Rápidos ⌄</button>
                <div id="examples-dropdown" class="examples-dropdown"></div>
            </div>

            <div class="view-toggle">
                <button class="toggle-btn active" id="btn-2d">2D GRÁFICO</button>
                <button class="toggle-btn" id="btn-3d">3D SUPERFICIE</button>
            </div>

            <div class="color-selector">
                <span class="color-label">Color Gráfica:</span>
                <div class="color-options">
                    <button class="color-btn green active" data-color="0x006847" title="Verde Bandera"></button>
                    <button class="color-btn yellow" data-color="0xFFD700" title="Amarillo"></button>
                    <button class="color-btn blue" data-color="0x0033A0" title="Azul"></button>
                </div>
            </div>

            <div class="slider-group">
                <div class="slider-row">
                    <span>Parámetro A</span>
                    <span id="val-a">1.0</span>
                </div>
                <input type="range" id="slider-a" min="-5" max="5" step="0.1" value="1">
            </div>

            <div class="slider-group">
                <div class="slider-row">
                    <span>Parámetro B</span>
                    <span id="val-b">1.0</span>
                </div>
                <input type="range" id="slider-b" min="0.1" max="10" step="0.1" value="1">
            </div>
        </div>

        <div class="keypad" id="keypad">
            <button class="key func" data-insert="sin(">sin</button>
            <button class="key func" data-insert="cos(">cos</button>
            <button class="key func" data-insert="tan(">tan</button>
            <button class="key func" data-insert="log(">log</button>
            <button class="key func" data-insert="ln(">ln</button>

            <button class="key func" data-insert="x">x</button>
            <button class="key func" data-insert="y">y</button>
            <button class="key func" data-insert="z">z</button>
            <button class="key func" data-insert="(">(</button>
            <button class="key func" data-insert=")">)</button>

            <button class="key" data-insert="7">7</button>
            <button class="key" data-insert="8">8</button>
            <button class="key" data-insert="9">9</button>
            <button class="key op" data-insert="/">÷</button>
            <button class="key op" data-insert="^">xʸ</button>

            <button class="key" data-insert="4">4</button>
            <button class="key" data-insert="5">5</button>
            <button class="key" data-insert="6">6</button>
            <button class="key op" data-insert="*">×</button>
            <button class="key op" data-insert="sqrt(">√</button>

            <button class="key" data-insert="1">1</button>
            <button class="key" data-insert="2">2</button>
            <button class="key" data-insert="3">3</button>
            <button class="key op" data-insert="+">+</button>
            <button class="key op" data-insert="-">-</button>

            <button class="key" data-insert="0">0</button>
            <button class="key" data-insert=".">.</button>
            <button class="key op" data-insert="pi">π</button>
            <button class="key op" data-action="backspace">DEL</button>
            <button class="key clear" data-action="clear">AC</button>

            <button class="key enter" data-action="calculate" style="grid-column: span 5;">=</button>
        </div>
        
        <div class="resize-handle" id="resize-handle"></div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

### 2. `style.css`
*(Corregí el desbordamiento del teclado en PC y añadí el posicionamiento del nuevo botón de video)*
```css
:root {
    --bg-app: #f1f5f9;
    --calc-width-desktop: 340px;
    --calc-height-mobile-collapsed: 60px;
    --calc-bg: #1e293b;
    --calc-surface: #334155;
    --screen-bg: #0f172a;
    --screen-text: #22d3ee;
    --btn-bg: #475569;
    --btn-shadow: #1e293b;
    --btn-active: #0ea5e9;
    --text-primary: #0f172a;
    --text-secondary: #334155;
    --panel-bg: rgba(255, 255, 255, 0.9);
}

:root.dark-mode {
    --bg-app: #0f172a;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --panel-bg: rgba(30, 41, 59, 0.9);
}

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

body {
    font-family: 'Inter', sans-serif; width: 100vw; height: 100vh;
    background-color: var(--bg-app); overflow: hidden; display: flex;
    position: relative; transition: background-color 0.3s ease;
}

/* PANTALLA DE INICIO */
#splash-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #0f172a; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; transition: opacity 0.6s ease, visibility 0.6s ease; }
#splash-screen.hidden { opacity: 0; visibility: hidden; }
.splash-content { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; gap: 30px; }
.splash-img { max-width: 90%; max-height: 50vh; width: auto; height: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.login-box { background: rgba(30, 41, 59, 0.8); padding: 25px 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 350px; display: flex; flex-direction: column; gap: 12px; backdrop-filter: blur(8px); box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
.login-box h2 { color: #ffffff; text-align: center; font-size: 1.4rem; font-weight: 700; }
.login-subtitle { color: #94a3b8; text-align: center; font-size: 0.85rem; margin-top: -8px; margin-bottom: 5px; }
#email-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #ffffff; font-size: 1rem; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
#email-input:focus { border-color: #006847; }
#email-input::placeholder { color: #64748b; }
.start-btn { padding: 12px 60px; font-size: 1.1rem; font-weight: 700; color: #ffffff; background-color: #006847; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: transform 0.2s, background-color 0.2s; font-family: 'Inter', sans-serif; letter-spacing: 1px; text-transform: uppercase; }
.start-btn:hover { background-color: #004d33; transform: scale(1.02); }
.start-btn:active { transform: scale(0.98); }
.error-msg { color: #ef4444; font-size: 0.85rem; text-align: center; display: none; font-weight: 500; }

/* LIENZO Y HUD */
#viewport { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
.hud-overlay { position: absolute; top: 20px; left: 20px; z-index: 5; pointer-events: none; }
.mode-badge { background: var(--panel-bg); padding: 8px 16px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; backdrop-filter: blur(4px); transition: background 0.3s, color 0.3s; }
.mode-dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; transition: background 0.3s; }

/* Botones Superiores */
.top-control-btn { position: absolute; top: 20px; z-index: 10; width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--panel-bg); color: var(--text-secondary); font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s, background 0.3s; backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.top-control-btn:active { transform: scale(0.9); }
#theme-toggle { right: 20px; }
#calc-toggle { right: 70px; }
#screenshot-btn { right: 120px; }
#video-btn { right: 170px; }
#video-btn.recording { background: #ef4444; color: white; animation: pulse-rec 1s infinite; }
@keyframes pulse-rec { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }

.tooltip { position: absolute; background: rgba(15, 23, 42, 0.95); color: white; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; pointer-events: none; z-index: 20; display: none; border: 1px solid rgba(255,255,255,0.1); transform: translate(15px, 15px); }

/* CALCULADORA */
.calculator-container { position: absolute; width: var(--calc-width-desktop); min-width: 300px; min-height: 500px; max-width: 95vw; max-height: 95vh; background: var(--calc-bg); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); z-index: 100; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); top: 20px; right: 220px; transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s ease, opacity 0.4s ease; }
.calculator-container.pulse { animation: pulse-anim 0.3s ease-out; }
@keyframes pulse-anim { 0% { box-shadow: 0 20px 50px rgba(0,0,0,0.3); } 50% { box-shadow: 0 20px 60px rgba(34, 211, 238, 0.5); } 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.3); } }
.calculator-container.hidden-calc { opacity: 0; visibility: hidden; pointer-events: none; transform: translateX(50px) scale(0.9); }

.calc-header { background: var(--calc-surface); padding: 12px 16px; cursor: grab; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.2); user-select: none; flex-shrink: 0; }
.calc-header:active { cursor: grabbing; }
.header-inner { display: flex; align-items: center; gap: 10px; width: 100%; justify-content: center; }
.header-title { color: #94a3b8; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.header-controls { display: flex; gap: 8px; }
.win-btn { width: 12px; height: 12px; border-radius: 50%; background: #ef4444; border: none; cursor: pointer; }

.screen-container { padding: 16px; background: var(--screen-bg); border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
.screen-label { color: #64748b; font-size: 0.7rem; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace; }
.screen-output { color: var(--screen-text); font-family: 'JetBrains Mono', monospace; font-size: 1.2rem; min-height: 1.4em; max-height: 4.2em; overflow-y: auto; word-break: break-all; text-shadow: 0 0 10px rgba(34, 211, 238, 0.3); }
.screen-output::-webkit-scrollbar { display: none; }
.screen-output.error { color: #f87171; text-shadow: none; }
.cursor { display: inline-block; width: 2px; height: 1.2em; background: var(--screen-text); animation: blink 1s step-end infinite; vertical-align: text-bottom; margin-left: 2px; }
@keyframes blink { 50% { opacity: 0; } }

.controls-area { padding: 12px 16px; flex-shrink: 0; }
.dropdown-container { position: relative; margin-bottom: 12px; width: 100%; }
.examples-btn { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; text-align: center; font-family: 'Inter', sans-serif; font-size: 0.9rem; transition: background 0.2s; }
.examples-btn:hover { background: rgba(0,0,0,0.5); }
.examples-dropdown { display: none; position: absolute; top: 105%; left: 0; width: 100%; background: #0f172a; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 110; max-height: 250px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); }
.examples-dropdown.show { display: block; }
.examples-dropdown::-webkit-scrollbar { width: 4px; }
.examples-dropdown::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
.examples-item { padding: 10px 16px; color: #cbd5e1; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; transition: background 0.2s, color 0.2s; }
.examples-item:last-child { border-bottom: none; }
.examples-item:hover { background: #1e293b; color: var(--screen-text); }

.view-toggle { display: flex; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 4px; margin-bottom: 12px; }
.toggle-btn { flex: 1; background: transparent; border: none; color: #94a3b8; padding: 8px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; }
.toggle-btn.active { background: var(--btn-active); color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

.color-selector { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.8rem; color: #cbd5e1; }
.color-options { display: flex; gap: 8px; }
.color-btn { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); cursor: pointer; transition: transform 0.2s, border-color 0.2s; }
.color-btn.active { border-color: white; transform: scale(1.1); }
.color-btn.green { background: #006847; }
.color-btn.yellow { background: #FFD700; }
.color-btn.blue { background: #0033A0; }

.slider-group { margin-bottom: 12px; }
.slider-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.8rem; color: #cbd5e1; }
input[type=range] { width: 100%; height: 4px; background: #475569; border-radius: 2px; appearance: none; -webkit-appearance: none; outline: none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--screen-text); cursor: pointer; box-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border: none; border-radius: 50%; background: var(--screen-text); cursor: pointer; }

/* TECLADO CORREGIDO PARA PC */
.keypad { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); grid-auto-rows: minmax(40px, 1fr); gap: 8px; padding: 16px; background: var(--calc-surface); border-top: 1px solid rgba(255,255,255,0.05); min-height: 0; overflow-y: auto; }
.keypad::-webkit-scrollbar { width: 6px; }
.keypad::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
.key { background: var(--btn-bg); border: none; border-radius: 8px; color: #f1f5f9; font-size: 1rem; cursor: pointer; transition: transform 0.1s, background 0.2s; display: flex; align-items: center; justify-content: center; font-weight: 500; box-shadow: 0 4px 0 var(--btn-shadow); position: relative; top: 0; font-family: 'Inter', sans-serif; }
.key:active { top: 4px; box-shadow: 0 0 0 var(--btn-shadow); background: #334155; }
.key.func { color: #60a5fa; font-size: 0.85rem; }
.key.op { color: #fbbf24; font-size: 1.1rem; }
.key.clear { background: #ef4444; box-shadow: 0 4px 0 #b91c1c; color: white; font-weight: bold; }
.key.clear:active { box-shadow: 0 0 0 #b91c1c; }
.key.enter { background: var(--screen-text); color: #0f172a; box-shadow: 0 4px 0 #0891b2; font-weight: bold; font-size: 1.2rem; }
.key.enter:active { box-shadow: 0 0 0 #0891b2; }

.resize-handle { position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; z-index: 101; display: none; }
.resize-handle::after { content: ''; position: absolute; bottom: 4px; right: 4px; width: 8px; height: 8px; border-right: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8; }
@media (min-width: 769px) { .resize-handle { display: block; } }

/* RESPONSIVE MÓVIL */
@media (max-width: 768px) {
    body { flex-direction: column; }
    .calculator-container { width: 100%; height: var(--calc-height-mobile-collapsed); min-width: 100%; min-height: 60px; max-height: 100vh; top: auto; bottom: 0; right: 0; left: 0; border-radius: 16px 16px 0 0; transform: none !important; }
    .calculator-container.expanded { height: 92vh; }
    .calculator-container.hidden-calc { transform: translateY(100%) !important; opacity: 1; visibility: hidden; pointer-events: none; }

    .calc-header { cursor: default; justify-content: center; position: relative; padding: 10px 16px; }
    .mobile-drag-handle { display: block !important; width: 40px; height: 5px; background: #64748b; border-radius: 3px; margin-bottom: 4px; }
    .header-title { display: none; }
    .header-controls { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); }
    
    .top-control-btn { top: 15px; width: 35px; height: 35px; font-size: 1rem; }
    #theme-toggle { right: 15px; }
    #calc-toggle { right: 60px; }
    #screenshot-btn { right: 105px; }
    #video-btn { right: 150px; }

    .screen-container { padding: 10px 16px; }
    .screen-output { font-size: 1.1rem; }
    .controls-area { padding: 8px 12px; }
    .dropdown-container { margin-bottom: 8px; }
    .examples-btn { padding: 8px; font-size: 0.85rem; }
    .view-toggle { margin-bottom: 8px; padding: 3px; }
    .toggle-btn { padding: 6px; font-size: 0.8rem; }
    .color-selector { margin-bottom: 8px; }
    .slider-group { margin-bottom: 8px; }
    .keypad { flex: 1; min-height: 0; gap: 6px; padding: 10px; grid-auto-rows: 1fr; overflow-y: auto; }
    .key { min-height: 35px; font-size: 0.9rem; }
    .key.func { font-size: 0.8rem; }
    .key.op { font-size: 1rem; }
    .key.enter { font-size: 1.1rem; }
    
    .splash-img { max-height: 40vh; }
    .login-box { padding: 20px; }
}
```

### 3. `script.js`
*(Añadí la lógica de grabación de video usando `MediaRecorder` y `captureStream`)*
```javascript
// =========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// =========================================
const AppState = {
    expression: "0.5 * sin(x * a) + 1",
    a: 1.0,
    b: 1.0,
    mode: '2D',
    graphColor: 0x006847,
    isMobile: window.innerWidth <= 768,
    isDraggingCalc: false,
    isAnimating: false,
    calcExpanded: false,
    isDarkMode: false,
    hasStarted: false
};

const themes = {
    light: { bg: 0xf8fafc, paper: 0xffffff, grid: 0xe2e8f0, axes: 0x0f172a, grid3D_center: 0x94a3b8, grid3D_base: 0xe2e8f0 },
    dark: { bg: 0x0a0f1d, paper: 0x1e293b, grid: 0x334155, axes: 0x94a3b8, grid3D_center: 0x475569, grid3D_base: 0x334155 }
};

const els = {
    splash: document.getElementById('splash-screen'),
    startBtn: document.getElementById('start-btn'),
    emailInput: document.getElementById('email-input'),
    errorMsg: document.getElementById('error-msg'),
    display: document.getElementById('display'),
    valA: document.getElementById('val-a'),
    valB: document.getElementById('val-b'),
    statusText: document.getElementById('status-text'),
    statusDot: document.getElementById('status-dot'),
    tooltip: document.getElementById('tooltip'),
    calc: document.getElementById('calculator'),
    calcHeader: document.getElementById('calc-header'),
    btnMinimize: document.getElementById('btn-minimize'),
    keypad: document.getElementById('keypad'),
    btn2D: document.getElementById('btn-2d'),
    btn3D: document.getElementById('btn-3d'),
    sliderA: document.getElementById('slider-a'),
    sliderB: document.getElementById('slider-b'),
    themeBtn: document.getElementById('theme-toggle'),
    calcToggleBtn: document.getElementById('calc-toggle'),
    screenshotBtn: document.getElementById('screenshot-btn'),
    videoBtn: document.getElementById('video-btn'),
    resizeHandle: document.getElementById('resize-handle'),
    examplesBtn: document.getElementById('examples-btn'),
    examplesDropdown: document.getElementById('examples-dropdown'),
    colorBtns: document.querySelectorAll('.color-btn')
};

// =========================================
// PANTALLA DE INICIO Y VALIDACIÓN
// =========================================
function attemptLogin() {
    if (AppState.hasStarted) return;
    const email = els.emailInput.value.trim().toLowerCase();
    
    if (email.endsWith('@juventud.edu.mx')) {
        AppState.hasStarted = true;
        els.errorMsg.style.display = 'none';
        els.splash.classList.add('hidden');
        setTimeout(() => els.splash.style.display = 'none', 600);
        initCalculator();
    } else {
        els.errorMsg.style.display = 'block';
        els.emailInput.value = '';
        els.emailInput.focus();
    }
}

els.startBtn.addEventListener('click', attemptLogin);
els.emailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptLogin(); });

// =========================================
// FUNCIONES DE EJEMPLO
// =========================================
const examples = [
    { name: "1. Onda Senoidal 2D", expr: "a * sin(x * b)", mode: "2D" },
    { name: "2. Parábola Cúbica 2D", expr: "a * x^3 - b * x", mode: "2D" },
    { name: "3. Función Logarítmica 2D", expr: "a * log(abs(x) * b)", mode: "2D" },
    { name: "4. Gaussiana (Campana) 2D", expr: "a * exp(-(x^2) / b)", mode: "2D" },
    { name: "5. Onda Senoidal 3D", expr: "sin(x) * a + cos(y) * b", mode: "3D" },
    { name: "6. Cartón de Huevos 3D", expr: "sin(x * a) * cos(y * b)", mode: "3D" },
    { name: "7. Onda Radial (Agua) 3D", expr: "sin(sqrt(x^2 + y^2) * a) * 2", mode: "3D" },
    { name: "8. Sombrero Mexicano 3D", expr: "a * exp(-(x^2 + y^2) / b) * cos(sqrt(x^2 + y^2))", mode: "3D" },
    { name: "9. Silla de Montar 3D", expr: "(x^2 - y^2) * a * 0.1", mode: "3D" },
    { name: "10. Silla de Mono 3D", expr: "(x^3 - 3*x*y^2) * a * 0.05", mode: "3D" },
    { name: "11. Olas Entrelazadas 3D", expr: "sin(x * a + y) * cos(y * b - x)", mode: "3D" },
    { name: "12. Cráter Volcánico 3D", expr: "-a * exp(-(x^2 + y^2) / b)", mode: "3D" }
];

let scene, camera, renderer, controls, raycaster;
let group3D, geometry3D, material3D, mesh3D, gridHelper3D, axesHelper3D;
let group2D, paperPlane, grid2DMat, axisMat, curve2DGeo, curve2DMat, curve2D;
let ambientLight, dirLight;
let mouse, pointerMesh;
let mediaRecorder; // Variable para grabación de video

// =========================================
// INICIALIZADOR PRINCIPAL
// =========================================
function initCalculator() {
    examples.forEach(ex => {
        const item = document.createElement('div');
        item.className = 'examples-item';
        item.innerText = ex.name;
        item.addEventListener('click', () => {
            AppState.expression = ex.expr;
            updateDisplay(); updateGraphics(); setMode(ex.mode);
            els.examplesDropdown.classList.remove('show');
        });
        els.examplesDropdown.appendChild(item);
    });

    els.examplesBtn.addEventListener('click', (e) => { e.stopPropagation(); els.examplesDropdown.classList.toggle('show'); });
    window.addEventListener('click', (e) => { if (!e.target.closest('.dropdown-container')) els.examplesDropdown.classList.remove('show'); });

    els.colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.graphColor = parseInt(btn.dataset.color);
            updateGraphics();
        });
    });

    setupThreeJS();
    setupScenes();
    setupEvents();

    if (AppState.isMobile) { setMode('2D'); expandMobile(); } else { setMode('2D'); }

    updateDisplay();
    updateGraphics();
    animate();
}

// =========================================
// SETUP THREE.JS
// =========================================
function setupThreeJS() {
    const container = document.getElementById('viewport');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(themes.light.bg);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0);

    // preserveDrawingBuffer: true ES NECESARIO PARA PODER TOMAR CAPTURAS Y VIDEO
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.05;

    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.2;

    ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5); dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
}

// =========================================
// ESCENAS 3D Y 2D
// =========================================
function setupScenes() {
    group3D = new THREE.Group(); scene.add(group3D);
    geometry3D = new THREE.PlaneGeometry(14, 14, 100, 100); geometry3D.rotateX(-Math.PI / 2);
    const count = geometry3D.attributes.position.count;
    geometry3D.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

    material3D = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.1, flatShading: false });
    mesh3D = new THREE.Mesh(geometry3D, material3D);
    mesh3D.castShadow = true; mesh3D.receiveShadow = true; mesh3D.visible = false;
    group3D.add(mesh3D);

    gridHelper3D = new THREE.GridHelper(20,20, themes.light.grid3D_center, themes.light.grid3D_base);
    group3D.add(gridHelper3D);
    axesHelper3D = new THREE.AxesHelper(2); group3D.add(axesHelper3D);

    group2D = new THREE.Group(); scene.add(group2D);
    const planeMat = new THREE.MeshBasicMaterial({ color: themes.light.paper, side: THREE.DoubleSide });
    paperPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), planeMat);
    paperPlane.position.z = -0.1; group2D.add(paperPlane);

    grid2DMat = new THREE.LineBasicMaterial({ color: themes.light.grid });
    const grid2DGroup = new THREE.Group();
    for (let i = -6; i <= 6; i++) {
        grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -4, 0), new THREE.Vector3(i, 4, 0)]), grid2DMat));
    }
    for (let i = -4; i <= 4; i++) {
        grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, i, 0), new THREE.Vector3(6, i, 0)]), grid2DMat));
    }
    group2D.add(grid2DGroup);

    axisMat = new THREE.LineBasicMaterial({ color: themes.light.axes });
    group2D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, 0, 0), new THREE.Vector3(6, 0, 0)]), axisMat));
    group2D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4, 0), new THREE.Vector3(0, 4, 0)]), axisMat));

    const curveRes = 400;
    curve2DGeo = new THREE.BufferGeometry();
    curve2DGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(curveRes * 3), 3));
    curve2DMat = new THREE.LineBasicMaterial({ color: AppState.graphColor });
    curve2D = new THREE.Line(curve2DGeo, curve2DMat);
    group2D.add(curve2D);

    mouse = new THREE.Vector2();
    pointerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    scene.add(pointerMesh);
    pointerMesh.visible = false;
}

// =========================================
// MOTOR MATEMÁTICO
// =========================================
function prepareExpression(rawExpr) {
    let expr = rawExpr.toLowerCase();
    expr = expr.replace(/\^/g, '**');
    expr = expr.replace(/(\d)([a-zA-Z\(])/g, '$1*$2'); 
    expr = expr.replace(/\)([a-zA-Z0-9\(])/g, ')*$1');  
    expr = expr.replace(/([xyz])([xyz\(])/g, '$1*$2');  
    expr = expr.replace(/\bln\(/g, 'Math.log(');
    expr = expr.replace(/\blog\(/g, 'Math.log10(');
    const funcs = ['sin','cos','tan','asin','acos','atan','sqrt','abs','exp','pow','floor','ceil','round'];
    funcs.forEach(f => { expr = expr.replace(new RegExp(`\\b${f}\\(`, 'g'), `Math.${f}(`); });
    expr = expr.replace(/\bpi\b/g, 'Math.PI');
    expr = expr.replace(/\be\b/g, 'Math.E'); 
    return expr;
}

function evaluate(x, y = 0) {
    if (!AppState.expression) return 0;
    try {
        const expr = prepareExpression(AppState.expression);
        const f = new Function('x', 'y', 'z', 'a', 'b', `return ${expr};`);
        const r = f(x, y, 0, AppState.a, AppState.b);
        return (isNaN(r) || !isFinite(r)) ? null : r;
    } catch (e) { return null; }
}

function updateGraphics() {
    if (!curve2DMat || !geometry3D) return; 
    curve2DMat.color.setHex(AppState.graphColor);
    const pos3D = geometry3D.attributes.position;
    const col3D = geometry3D.attributes.color;
    const cLow = new THREE.Color(AppState.graphColor);
    const cHigh = new THREE.Color(0xffffff);
    const tempC = new THREE.Color();

    for (let i = 0; i < pos3D.count; i++) {
        const x = pos3D.getX(i), y = pos3D.getZ(i);
        const z = evaluate(x, y);
        if (z !== null) {
            pos3D.setY(i, z);
            const t = THREE.MathUtils.clamp((z + 5) / 10, 0, 1);
            tempC.lerpColors(cLow, cHigh, t);
            col3D.setXYZ(i, tempC.r, tempC.g, tempC.b);
        } else { pos3D.setY(i, 0); }
    }
    pos3D.needsUpdate = true; col3D.needsUpdate = true;
    geometry3D.computeVertexNormals();

    const pos2D = curve2DGeo.attributes.position;
    for (let i = 0; i < pos2D.count; i++) {
        const x = (i / (pos2D.count - 1)) * 12 - 6;
        const y = evaluate(x, 0);
        if (y !== null) { pos2D.setXYZ(i, x, y, 0); } else { pos2D.setXYZ(i, x, 0, 0); }
    }
    pos2D.needsUpdate = true;
}

// =========================================
// EVENTOS DE UI
// =========================================
function setupEvents() {
    els.keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button.key');
        if (!btn) return;
        if (btn.dataset.insert) insertText(btn.dataset.insert);
        else if (btn.dataset.action === 'clear') clearDisplay();
        else if (btn.dataset.action === 'backspace') backspace();
        else if (btn.dataset.action === 'calculate') calculate();
    });

    els.sliderA.addEventListener('input', (e) => { AppState.a = parseFloat(e.target.value); els.valA.innerText = AppState.a.toFixed(1); updateGraphics(); });
    els.sliderB.addEventListener('input', (e) => { AppState.b = parseFloat(e.target.value); els.valB.innerText = AppState.b.toFixed(1); updateGraphics(); });
    
    els.btn2D.addEventListener('click', () => setMode('2D'));
    els.btn3D.addEventListener('click', () => setMode('3D'));

    // Botón Ocultar/Mostrar Calculadora
    els.calcToggleBtn.addEventListener('click', () => {
        const isHidden = els.calc.classList.toggle('hidden-calc');
        els.calcToggleBtn.innerText = isHidden ? "👁️" : "🧮";
    });

    // Botón Captura de Pantalla
    els.screenshotBtn.addEventListener('click', () => {
        renderer.render(scene, camera);
        try {
            const dataURL = renderer.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'grafica_calculadora.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            els.screenshotBtn.innerText = "✅";
            setTimeout(() => els.screenshotBtn.innerText = "📸", 1500);
        } catch (e) {
            console.error("Error al tomar captura:", e);
            alert("No se pudo capturar la imagen.");
        }
    });

    // Botón Grabar Video
    els.videoBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            // Detener grabación
            mediaRecorder.stop();
            els.videoBtn.classList.remove('recording');
            els.videoBtn.innerText = "🎥";
        } else {
            // Iniciar grabación
            try {
                const stream = renderer.domElement.captureStream(30); // 30 FPS
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                const chunks = [];
                
                mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'grabacion_calculadora.webm';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                };
                
                mediaRecorder.start();
                els.videoBtn.classList.add('recording');
                els.videoBtn.innerText = "⏹️";
            } catch (e) {
                console.error("Error al grabar:", e);
                alert("Tu navegador no soporta la grabación de video.");
            }
        }
    });

    els.themeBtn.addEventListener('click', () => {
        AppState.isDarkMode = !AppState.isDarkMode;
        document.documentElement.classList.toggle('dark-mode', AppState.isDarkMode);
        els.themeBtn.innerText = AppState.isDarkMode ? "☀️" : "🌙";
        const theme = AppState.isDarkMode ? themes.dark : themes.light;
        scene.background.setHex(theme.bg);
        paperPlane.material.color.setHex(theme.paper);
        grid2DMat.color.setHex(theme.grid);
        axisMat.color.setHex(theme.axes);
        group3D.remove(gridHelper3D);
        gridHelper3D.geometry.dispose(); gridHelper3D.material.dispose();
        gridHelper3D = new THREE.GridHelper(20, 20, theme.grid3D_center, theme.grid3D_base);
        group3D.add(gridHelper3D);
    });

    let dragOffset = { x: 0, y: 0 };
    els.calcHeader.addEventListener('mousedown', (e) => {
        if (AppState.isMobile) return;
        AppState.isDraggingCalc = true;
        dragOffset.x = e.clientX - els.calc.offsetLeft; dragOffset.y = e.clientY - els.calc.offsetTop;
        els.calcHeader.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => { AppState.isDraggingCalc = false; els.calcHeader.style.cursor = AppState.isMobile ? 'default' : 'grab'; });
    window.addEventListener('mousemove', (e) => {
        if (AppState.isDraggingCalc && !AppState.isMobile) {
            let newX = e.clientX - dragOffset.x, newY = e.clientY - dragOffset.y;
            newX = Math.max(0, Math.min(window.innerWidth - els.calc.offsetWidth, newX));
            newY = Math.max(0, Math.min(window.innerHeight - els.calc.offsetHeight, newY));
            els.calc.style.left = newX + 'px'; els.calc.style.top = newY + 'px'; els.calc.style.right = 'auto';
        }
    });

    let isResizing = false;
    els.resizeHandle.addEventListener('mousedown', (e) => { if (AppState.isMobile) return; isResizing = true; e.preventDefault(); });
    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        let newWidth = e.clientX - els.calc.offsetLeft, newHeight = e.clientY - els.calc.offsetTop;
        newWidth = Math.max(300, Math.min(window.innerWidth - els.calc.offsetLeft - 10, newWidth));
        newHeight = Math.max(400, Math.min(window.innerHeight - els.calc.offsetTop - 10, newHeight));
        els.calc.style.width = newWidth + 'px'; els.calc.style.height = newHeight + 'px';
    });

    els.btnMinimize.addEventListener('click', () => { if (AppState.calcExpanded) minimizeMobile(); else expandMobile(); });
    let touchStartY = 0;
    els.calcHeader.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, {passive: true});
    els.calcHeader.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY, diff = touchStartY - touchY;
        if (diff > 50 && !AppState.calcExpanded) expandMobile();
        if (diff < -50 && AppState.calcExpanded) minimizeMobile();
    }, {passive: true});

    window.addEventListener('mousemove', (e) => handlePointer(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0 && !e.touches[0].target.closest('.calculator-container')) {
            handlePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, {passive: true});

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        const isNowMobile = window.innerWidth <= 768;
        if (isNowMobile !== AppState.isMobile) location.reload(); 
    });
}

function insertText(char) { AppState.expression += char; updateDisplay(); updateGraphics(); }
function clearDisplay() { AppState.expression = ""; updateDisplay(); updateGraphics(); }
function backspace() { AppState.expression = AppState.expression.slice(0, -1); updateDisplay(); updateGraphics(); }
function calculate() {
    els.calc.classList.remove('pulse');
    void els.calc.offsetWidth; 
    els.calc.classList.add('pulse');
    updateGraphics();
}

function updateDisplay() {
    const text = AppState.expression || "0";
    let isSyntaxError = false;
    if (text !== "0") {
        try {
            const expr = prepareExpression(text);
            new Function('x', 'y', 'z', 'a', 'b', `return ${expr};`);
        } catch (e) { isSyntaxError = true; }
    }
    if (isSyntaxError) {
        els.display.classList.add('error');
        els.display.innerHTML = `Error: ${text}<span class="cursor"></span>`;
    } else {
        els.display.classList.remove('error');
        els.display.innerHTML = text + '<span class="cursor"></span>';
    }
}

function setMode(mode) {
    if (AppState.isAnimating && AppState.mode === mode) return;
    AppState.mode = mode; AppState.isAnimating = true;
    
    els.btn2D.classList.toggle('active', mode === '2D');
    els.btn3D.classList.toggle('active', mode === '3D');
    els.statusText.innerText = mode === '2D' ? "MODO 2D" : "MODO 3D";
    els.statusDot.style.background = mode === '2D' ? "#22c55e" : "#3b82f6";

    let targetPos, targetLookAt, targetUp;
    if (mode === '2D') {
        group3D.visible = false; group2D.visible = true; mesh3D.visible = false;
        targetPos = new THREE.Vector3(0, 0, 10); targetLookAt = new THREE.Vector3(0, 0, 0); targetUp = new THREE.Vector3(0, 1, 0);
    } else {
        group3D.visible = true; group2D.visible = false; mesh3D.visible = true;
        targetPos = new THREE.Vector3(8, 6, 8); targetLookAt = new THREE.Vector3(0, 0, 0); targetUp = new THREE.Vector3(0, 1, 0);
    }

    const startPos = camera.position.clone(), startUp = camera.up.clone(), startTarget = controls.target.clone();
    let progress = 0;
    function animateCamera() {
        progress += 0.025; if (progress > 1) progress = 1;
        const ease = 1 - Math.pow(1 - progress, 3); 
        camera.position.lerpVectors(startPos, targetPos, ease);
        camera.up.lerpVectors(startUp, targetUp, ease);
        controls.target.lerpVectors(startTarget, targetLookAt, ease);
        controls.update();
        if (progress < 1) requestAnimationFrame(animateCamera);
        else { AppState.isAnimating = false; controls.enableRotate = (mode === '3D'); }
    }
    animateCamera();
}

function expandMobile() { els.calc.classList.add('expanded'); AppState.calcExpanded = true; els.btnMinimize.style.background = '#94a3b8'; }
function minimizeMobile() { els.calc.classList.remove('expanded'); AppState.calcExpanded = false; els.btnMinimize.style.background = '#ef4444'; }

function handlePointer(clientX, clientY) {
    if (clientX > window.innerWidth - els.calc.offsetWidth && !AppState.isMobile) return;
    if (AppState.isMobile && clientY > window.innerHeight - els.calc.offsetHeight) return;
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const target = AppState.mode === '2D' ? curve2D : mesh3D;
    const intersects = raycaster.intersectObject(target);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        pointerMesh.position.copy(point); pointerMesh.visible = true;
        els.tooltip.style.display = 'block';
        els.tooltip.style.left = clientX + 'px'; els.tooltip.style.top = clientY + 'px';
        if (AppState.mode === '2D') els.tooltip.innerText = `x: ${point.x.toFixed(2)}, y: ${point.y.toFixed(2)}`;
        else els.tooltip.innerText = `x: ${point.x.toFixed(2)}, z: ${point.z.toFixed(2)}`;
    } else {
        pointerMesh.visible = false; els.tooltip.style.display = 'none';
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
```
