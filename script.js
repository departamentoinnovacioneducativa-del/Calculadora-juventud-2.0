He implementado todas tus solicitudes con un sistema robusto de múltiples gráficas. Ahora puedes graficar hasta 10 funciones simultáneamente, cada una con un color distinto. El botón `=` actúa como "constante", guardando la gráfica actual y pasando automáticamente al siguiente color. Además, las gráficas 1D ahora incluyen numeración para los intervalos.

Aquí tienes los 3 archivos actualizados:

### 1. `index.html`
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

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>

    <div id="splash-screen">
        <div class="splash-content">
            <img src="Calculadora.jpg" alt="Calculadora Institucional" class="splash-img">
            <div class="login-box">
                <h2>Acceso Institucional</h2>
                <p class="login-subtitle">Verificación de dominio</p>
                <input type="email" id="email-input" placeholder="tu.correo@juventud.edu.mx" autocomplete="off">
                <button type="button" id="start-btn" class="start-btn">Ingresar</button>
                <p id="error-msg" class="error-msg">Error: El correo debe terminar exactamente en @juventud.edu.mx</p>
            </div>
        </div>
    </div>

    <div id="viewport"></div>

    <div id="ui-overlay">
        <div class="hud-overlay">
            <div class="mode-badge">
                <div class="mode-dot" id="status-dot"></div>
                <span id="status-text">MODO 2D</span>
            </div>
        </div>

        <button type="button" id="play-btn" class="top-control-btn" aria-label="Animar gráfica">▶️</button>
        <button type="button" id="video-btn" class="top-control-btn" aria-label="Grabar video">🎥</button>
        <button type="button" id="screenshot-btn" class="top-control-btn" aria-label="Captura de pantalla">📸</button>
        <button type="button" id="calc-toggle" class="top-control-btn" aria-label="Mostrar/Ocultar Calculadora">🧮</button>
        <button type="button" id="theme-toggle" class="top-control-btn" aria-label="Cambiar tema">🌙</button>

        <div id="tooltip" class="tooltip"></div>
        <div id="version-tag">versión 2.033</div>
    </div>

    <div class="calculator-container" id="calculator">
        <div class="calc-header" id="calc-header">
            <div class="mobile-drag-handle" id="mobile-handle"></div>
            <button type="button" class="close-calc-btn" id="close-calc-btn" aria-label="Cerrar Calculadora">✖</button>
            <span class="header-title">GRAPH ENGINE PRO</span>
        </div>

        <div class="screen-container">
            <div class="screen-label" id="screen-label">f1(x, y, t) =</div>
            <div class="screen-output" id="display"><span class="cursor"></span></div>
        </div>

        <div class="controls-area">
            <div class="dropdown-container">
                <button type="button" id="examples-btn" class="examples-btn">Ejemplos Rápidos ⌄</button>
                <div id="examples-dropdown" class="examples-dropdown"></div>
            </div>

            <div class="view-toggle">
                <button type="button" class="toggle-btn" id="btn-1d">1D</button>
                <button type="button" class="toggle-btn active" id="btn-2d">2D</button>
                <button type="button" class="toggle-btn" id="btn-3d">3D</button>
            </div>

            <div class="color-selector">
                <span class="color-label">Color:</span>
                <div class="color-options" id="color-options">
                    <button type="button" class="color-btn active" style="background:#EF4444" data-color="0xEF4444"></button>
                    <button type="button" class="color-btn" style="background:#3B82F6" data-color="0x3B82F6"></button>
                    <button type="button" class="color-btn" style="background:#10B981" data-color="0x10B981"></button>
                    <button type="button" class="color-btn" style="background:#F59E0B" data-color="0xF59E0B"></button>
                    <button type="button" class="color-btn" style="background:#8B5CF6" data-color="0x8B5CF6"></button>
                    <button type="button" class="color-btn" style="background:#EC4899" data-color="0xEC4899"></button>
                    <button type="button" class="color-btn" style="background:#14B8A6" data-color="0x14B8A6"></button>
                    <button type="button" class="color-btn" style="background:#F97316" data-color="0xF97316"></button>
                    <button type="button" class="color-btn" style="background:#6366F1" data-color="0x6366F1"></button>
                    <button type="button" class="color-btn" style="background:#000000" data-color="0x000000"></button>
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
            <button type="button" class="key func" data-insert="sin(">sin</button>
            <button type="button" class="key func" data-insert="cos(">cos</button>
            <button type="button" class="key func" data-insert="tan(">tan</button>
            <button type="button" class="key func" data-insert="log(">log</button>
            <button type="button" class="key func" data-insert="ln(">ln</button>

            <button type="button" class="key func" data-insert="x">x</button>
            <button type="button" class="key func" data-insert="y">y</button>
            <button type="button" class="key func" data-insert="z">z</button>
            <button type="button" class="key func" data-insert="t">t</button>
            <button type="button" class="key func" data-insert="(">(</button>

            <button type="button" class="key func" data-insert=")">)</button>
            <button type="button" class="key" data-insert="7">7</button>
            <button type="button" class="key" data-insert="8">8</button>
            <button type="button" class="key" data-insert="9">9</button>
            <button type="button" class="key op" data-insert="/">÷</button>

            <button type="button" class="key op" data-insert="^">xʸ</button>
            <button type="button" class="key" data-insert="4">4</button>
            <button type="button" class="key" data-insert="5">5</button>
            <button type="button" class="key" data-insert="6">6</button>
            <button type="button" class="key op" data-insert="*">×</button>

            <button type="button" class="key op" data-insert="sqrt(">√</button>
            <button type="button" class="key" data-insert="1">1</button>
            <button type="button" class="key" data-insert="2">2</button>
            <button type="button" class="key" data-insert="3">3</button>
            <button type="button" class="key op" data-insert="+">+</button>

            <button type="button" class="key op" data-insert="-">-</button>
            <button type="button" class="key" data-insert="0">0</button>
            <button type="button" class="key" data-insert=".">.</button>
            <button type="button" class="key op" data-insert="pi">π</button>
            <button type="button" class="key op" data-action="backspace">DEL</button>

            <button type="button" class="key clear" data-action="clear">AC</button>
            <button type="button" class="key enter" data-action="calculate" style="grid-column: span 4;">=</button>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

### 2. `style.css`
```css
:root {
    --bg-app: #f1f5f9;
    --calc-width-desktop: 340px;
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

body { font-family: 'Inter', sans-serif; width: 100vw; height: 100vh; background-color: var(--bg-app); overflow: hidden; transition: background-color 0.3s ease; }

#splash-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #0f172a; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; transition: opacity 0.6s ease, visibility 0.6s ease; }
#splash-screen.hidden { opacity: 0; visibility: hidden; }
.splash-content { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; gap: 30px; }
.splash-img { max-width: 90%; max-height: 50vh; width: auto; height: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.login-box { background: rgba(30, 41, 59, 0.8); padding: 25px 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); width: 100%; max-width: 350px; display: flex; flex-direction: column; gap: 12px; backdrop-filter: blur(8px); box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
.login-box h2 { color: #ffffff; text-align: center; font-size: 1.4rem; font-weight: 700; }
.login-subtitle { color: #94a3b8; text-align: center; font-size: 0.8rem; margin-top: -8px; margin-bottom: 5px; }
#email-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #ffffff; font-size: 1rem; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
#email-input:focus { border-color: #006847; }
#email-input::placeholder { color: #64748b; }
.start-btn { padding: 12px 60px; font-size: 1.1rem; font-weight: 700; color: #ffffff; background-color: #006847; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: transform 0.2s, background-color 0.2s; font-family: 'Inter', sans-serif; letter-spacing: 1px; text-transform: uppercase; }
.start-btn:hover { background-color: #004d33; transform: scale(1.02); }
.start-btn:active { transform: scale(0.98); }
.error-msg { color: #ef4444; font-size: 0.85rem; text-align: center; display: none; font-weight: 500; }

#viewport { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1; }
#ui-overlay { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 5; pointer-events: none; }
.hud-overlay { position: absolute; top: 80px; left: 20px; } 
.mode-badge { background: var(--panel-bg); padding: 8px 16px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; backdrop-filter: blur(4px); transition: background 0.3s, color 0.3s; }
.mode-dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; transition: background 0.3s; }

#version-tag { position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); font-size: 10px; color: var(--text-secondary); pointer-events: none; opacity: 0.6; font-family: 'JetBrains Mono', monospace; }

.top-control-btn { position: absolute; top: 20px; width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--panel-bg); color: var(--text-secondary); font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s, background 0.3s; backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; pointer-events: auto; }
.top-control-btn:active { transform: scale(0.9); }

#play-btn { left: 20px; }
#video-btn { left: 70px; }
#screenshot-btn { left: 120px; }
#calc-toggle { left: 170px; }
#theme-toggle { left: 220px; }

#video-btn.recording { background: #ef4444; color: white; animation: pulse-rec 1s infinite; }
@keyframes pulse-rec { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }

.tooltip { position: absolute; background: rgba(15, 23, 42, 0.95); color: white; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; pointer-events: none; z-index: 20; display: none; border: 1px solid rgba(255,255,255,0.1); transform: translate(15px, 15px); }

.calculator-container { position: absolute; top: 0; right: 0; width: var(--calc-width-desktop); height: 100vh; background: var(--calc-bg); display: flex; flex-direction: column; overflow: hidden; border-left: 1px solid rgba(255,255,255,0.1); z-index: 10; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: -10px 0 30px rgba(0,0,0,0.2); }
.calculator-container.hidden-calc { transform: translateX(105%); }
.calculator-container.pulse { animation: pulse-anim 0.3s ease-out; }
@keyframes pulse-anim { 0% { box-shadow: -10px 0 30px rgba(0,0,0,0.2); } 50% { box-shadow: -10px 0 40px rgba(34, 211, 238, 0.5); } 100% { box-shadow: -10px 0 30px rgba(0,0,0,0.2); } }

.calc-header { background: var(--calc-surface); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.2); user-select: none; flex-shrink: 0; position: relative; }
.header-title { color: #94a3b8; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; flex: 1; text-align: center; }
.mobile-drag-handle { display: none; }

.close-calc-btn { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #94a3b8; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s; padding: 0; position: relative; z-index: 10; }
.close-calc-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

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
.examples-dropdown { display: none; position: absolute; bottom: 105%; left: 0; width: 100%; background: #0f172a; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 110; max-height: 250px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); }
.examples-dropdown.show { display: block; }
.examples-dropdown::-webkit-scrollbar { width: 4px; }
.examples-dropdown::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
.examples-item { padding: 10px 16px; color: #cbd5e1; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; transition: background 0.2s, color 0.2s; }
.examples-item:last-child { border-bottom: none; }
.examples-item:hover { background: #1e293b; color: var(--screen-text); }

.view-toggle { display: flex; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 4px; margin-bottom: 12px; gap: 4px; }
.toggle-btn { flex: 1; background: transparent; border: none; color: #94a3b8; padding: 8px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif; }
.toggle-btn.active { background: var(--btn-active); color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

.color-selector { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.8rem; color: #cbd5e1; }
.color-options { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.color-btn { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); cursor: pointer; transition: transform 0.2s, border-color 0.2s; padding: 0; }
.color-btn.active { border-color: white; transform: scale(1.1); }

.slider-group { margin-bottom: 12px; }
.slider-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.8rem; color: #cbd5e1; }
input[type=range] { width: 100%; height: 4px; background: #475569; border-radius: 2px; appearance: none; -webkit-appearance: none; outline: none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--screen-text); cursor: pointer; box-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border: none; border-radius: 50%; background: var(--screen-text); cursor: pointer; }

.keypad { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); grid-auto-rows: minmax(32px, 1fr); gap: 6px; padding: 12px; background: var(--calc-surface); border-top: 1px solid rgba(255,255,255,0.05); min-height: 0; }
.key { background: var(--btn-bg); border: none; border-radius: 6px; color: #f1f5f9; font-size: 0.8rem; cursor: pointer; transition: transform 0.1s, background 0.2s; display: flex; align-items: center; justify-content: center; font-weight: 500; box-shadow: 0 3px 0 var(--btn-shadow); position: relative; top: 0; font-family: 'Inter', sans-serif; }
.key:active { top: 3px; box-shadow: 0 0 0 var(--btn-shadow); background: #334155; }
.key.func { color: #60a5fa; font-size: 0.68rem; }
.key.op { color: #fbbf24; font-size: 0.88rem; }
.key.clear { background: #ef4444; box-shadow: 0 3px 0 #b91c1c; color: white; font-weight: bold; }
.key.clear:active { box-shadow: 0 0 0 #b91c1c; }
.key.enter { background: var(--screen-text); color: #0f172a; box-shadow: 0 3px 0 #0891b2; font-weight: bold; font-size: 0.96rem; }
.key.enter:active { box-shadow: 0 0 0 #0891b2; }

@media (max-width: 768px) {
    .calculator-container { width: 100%; height: 92vh; top: auto; bottom: 0; border-left: none; border-top: 1px solid rgba(255,255,255,0.1); border-radius: 16px 16px 0 0; box-shadow: 0 -10px 30px rgba(0,0,0,0.2); }
    .calculator-container.hidden-calc { transform: translateY(105%); }
    .calc-header { padding: 10px 16px; }
    .mobile-drag-handle { display: block; width: 40px; height: 5px; background: #64748b; border-radius: 3px; position: absolute; top: 8px; left: 50%; transform: translateX(-50%); }
    .header-title { display: none; } 
    .close-calc-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }
    .top-control-btn { top: 15px; width: 35px; height: 35px; font-size: 1rem; }
    #play-btn { left: 15px; } #video-btn { left: 60px; } #screenshot-btn { left: 105px; } #calc-toggle { left: 150px; } #theme-toggle { left: 195px; }
    .hud-overlay { top: 70px; left: 15px; }
    .screen-container { padding: 10px 16px; } .screen-output { font-size: 1.1rem; }
    .controls-area { padding: 8px 12px; } .dropdown-container { margin-bottom: 8px; } .examples-btn { padding: 8px; font-size: 0.85rem; }
    .view-toggle { margin-bottom: 8px; padding: 3px; } .toggle-btn { padding: 6px; font-size: 0.8rem; }
    .color-selector { margin-bottom: 8px; } .slider-group { margin-bottom: 8px; }
    .keypad { gap: 5px; padding: 8px; grid-auto-rows: minmax(28px, 1fr); } .key { font-size: 0.75rem; } .key.func { font-size: 0.65rem; } .key.op { font-size: 0.85rem; } .key.enter { font-size: 0.9rem; }
    .splash-img { max-height: 40vh; } .login-box { padding: 20px; }
}
```

### 3. `script.js`
```javascript
// =========================================
// ESTADO GLOBAL Y CONFIGURACIÓN MULTI-GRÁFICA
// =========================================
const MAX_GRAPHS = 10;
const graphColors = [
    0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0x8B5CF6,
    0xEC4899, 0x14B8A6, 0xF97316, 0x6366F1, 0x000000
];

const AppState = {
    graphData: [],
    currentGraphIndex: 0,
    a: 1.0,
    b: 1.0,
    mode: '2D',
    isMobile: window.innerWidth <= 768,
    isAnimating: false,
    isPlaying: false,
    time: 0,
    isDarkMode: false,
    hasStarted: false
};

// Inicializar datos de gráficas
for(let i=0; i<MAX_GRAPHS; i++) {
    AppState.graphData.push({ expr: "", color: graphColors[i] });
}
AppState.graphData[0].expr = "0.5 * sin(x * a + t) + 1";

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
    screenLabel: document.getElementById('screen-label'),
    valA: document.getElementById('val-a'),
    valB: document.getElementById('val-b'),
    statusText: document.getElementById('status-text'),
    statusDot: document.getElementById('status-dot'),
    tooltip: document.getElementById('tooltip'),
    calc: document.getElementById('calculator'),
    keypad: document.getElementById('keypad'),
    btn1D: document.getElementById('btn-1d'),
    btn2D: document.getElementById('btn-2d'),
    btn3D: document.getElementById('btn-3d'),
    sliderA: document.getElementById('slider-a'),
    sliderB: document.getElementById('slider-b'),
    themeBtn: document.getElementById('theme-toggle'),
    calcToggleBtn: document.getElementById('calc-toggle'),
    closeCalcBtn: document.getElementById('close-calc-btn'),
    screenshotBtn: document.getElementById('screenshot-btn'),
    videoBtn: document.getElementById('video-btn'),
    playBtn: document.getElementById('play-btn'),
    examplesBtn: document.getElementById('examples-btn'),
    examplesDropdown: document.getElementById('examples-dropdown'),
    colorBtns: document.querySelectorAll('.color-btn')
};

// =========================================
// PANTALLA DE INICIO Y VALIDACIÓN ESTRICTA
// =========================================
function attemptLogin() {
    if (AppState.hasStarted) return;
    const email = els.emailInput.value.trim().toLowerCase();
    if (email.endsWith('@juventud.edu.mx')) {
        AppState.hasStarted = true;
        els.errorMsg.style.display = 'none';
        els.splash.classList.add('hidden');
        setTimeout(() => { els.splash.style.display = 'none'; }, 600);
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
    { name: "1. Onda en Movimiento 2D", expr: "a * sin(x * b + t)", mode: "2D" },
    { name: "2. Onda Senoidal 2D", expr: "a * sin(x * b)", mode: "2D" },
    { name: "3. Parábola Cúbica 2D", expr: "a * x^3 - b * x", mode: "2D" },
    { name: "4. Gaussiana (Campana) 2D", expr: "a * exp(-(x^2) / b)", mode: "2D" },
    { name: "5. Cartón de Huevos 3D", expr: "sin(x * a) * cos(y * b)", mode: "3D" },
    { name: "6. Sombrero Mexicano 3D", expr: "a * exp(-(x^2 + y^2) / b) * cos(sqrt(x^2 + y^2))", mode: "3D" },
    { name: "7. Silla de Montar 3D", expr: "(x^2 - y^2) * a * 0.1", mode: "3D" },
    { name: "8. Onda Dinámica 3D", expr: "sin(x + t) * cos(y + t)", mode: "3D" },
    { name: "9. Oscilador 1D", expr: "a * sin(t) * 5", mode: "1D" },
    { name: "10. Valor Fijo 1D", expr: "b * 3", mode: "1D" }
];

let scene, camera, renderer, controls, raycaster;
let group3D, gridHelper3D, axesHelper3D;
let group2D, paperPlane, grid2DMat, axisMat;
let group1D, axis1DMat;
let curves2D = [], meshes3D = [], pointers1D = [];
let textSprites1D = [];
let ambientLight, dirLight;
let mouse, pointerMesh;
let mediaRecorder; 
const curveRes = 400;

// =========================================
// INICIALIZADOR PRINCIPAL
// =========================================
function initCalculator() {
    examples.forEach(ex => {
        const item = document.createElement('div');
        item.className = 'examples-item';
        item.innerText = ex.name;
        item.addEventListener('click', () => {
            AppState.graphData[AppState.currentGraphIndex].expr = ex.expr;
            updateDisplay(); updateGraphics(AppState.time); setMode(ex.mode);
            els.examplesDropdown.classList.remove('show');
        });
        els.examplesDropdown.appendChild(item);
    });

    els.examplesBtn.addEventListener('click', (e) => { e.stopPropagation(); els.examplesDropdown.classList.toggle('show'); });
    window.addEventListener('click', (e) => { if (!e.target.closest('.dropdown-container')) els.examplesDropdown.classList.remove('show'); });

    els.colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.graphData[AppState.currentGraphIndex].color = parseInt(btn.dataset.color);
            updateColorButtonsUI();
            updateGraphics(AppState.time);
        });
    });

    setupThreeJS();
    setupScenes();
    setupEvents();
    updateColorButtonsUI();
    setMode('2D');
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

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
// CREACIÓN DE TEXTOS (SPRITES) PARA 1D
// =========================================
function createTextSprite(text, color = "#000000") {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size; canvas.height = size / 2;
    const context = canvas.getContext('2d');
    context.font = "bold 60px Inter, sans-serif";
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = color;
    context.fillText(text, size / 2, size / 4);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    return sprite;
}

function rebuild1DLabels(color) {
    textSprites1D.forEach(s => { group1D.remove(s); s.material.map.dispose(); s.material.dispose(); });
    textSprites1D = [];
    for(let i = -10; i <= 10; i++) {
        if (i % 2 === 0) {
            const sprite = createTextSprite(i.toString(), color);
            sprite.position.set(i, -0.8, 0);
            sprite.scale.set(1.2, 0.6, 1);
            group1D.add(sprite);
            textSprites1D.push(sprite);
        }
    }
}

// =========================================
// ESCENAS 3D, 2D Y 1D
// =========================================
function setupScenes() {
    // 3D
    group3D = new THREE.Group(); scene.add(group3D);
    for(let i=0; i<MAX_GRAPHS; i++) {
        const geo = new THREE.PlaneGeometry(14, 14, 100, 100);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.1, flatShading: false, transparent: true, opacity: 0.75 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        group3D.add(mesh);
        meshes3D.push({ geo, mat, mesh });
    }
    gridHelper3D = new THREE.GridHelper(20,20, themes.light.grid3D_center, themes.light.grid3D_base);
    group3D.add(gridHelper3D);
    axesHelper3D = new THREE.AxesHelper(2); group3D.add(axesHelper3D);

    // 2D
    group2D = new THREE.Group(); scene.add(group2D);
    const planeMat = new THREE.MeshBasicMaterial({ color: themes.light.paper, side: THREE.DoubleSide });
    paperPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), planeMat);
    paperPlane.position.z = -0.1; group2D.add(paperPlane);

    grid2DMat = new THREE.LineBasicMaterial({ color: themes.light.grid });
    const grid2DGroup = new THREE.Group();
    for (let i = -6; i <= 6; i++) grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -4, 0), new THREE.Vector3(i, 4, 0)]), grid2DMat));
    for (let i = -4; i <= 4; i++) grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, i, 0), new THREE.Vector3(6, i, 0)]), grid2DMat));
    group2D.add(grid2DGroup);

    axisMat = new THREE.LineBasicMaterial({ color: themes.light.axes });
    group2D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, 0, 0), new THREE.Vector3(6, 0, 0)]), axisMat));
    group2D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4, 0), new THREE.Vector3(0, 4, 0)]), axisMat));

    for(let i=0; i<MAX_GRAPHS; i++) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(curveRes * 3), 3));
        const mat = new THREE.LineBasicMaterial({ color: graphColors[i] });
        const line = new THREE.Line(geo, mat);
        line.visible = false;
        group2D.add(line);
        curves2D.push({ geo, mat, line });
    }

    // 1D (Recta numérica)
    group1D = new THREE.Group(); scene.add(group1D);
    axis1DMat = new THREE.LineBasicMaterial({ color: themes.light.axes });
    group1D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)]), axis1DMat));
    for(let i = -10; i <= 10; i++) {
        const tickGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -0.2, 0), new THREE.Vector3(i, 0.2, 0)]);
        group1D.add(new THREE.Line(tickGeo, axis1DMat));
    }
    rebuild1DLabels("#000000");

    for(let i=0; i<MAX_GRAPHS; i++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshBasicMaterial({ color: graphColors[i] }));
        mesh.visible = false;
        group1D.add(mesh);
        pointers1D.push(mesh);
    }

    mouse = new THREE.Vector2();
    pointerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    scene.add(pointerMesh);
    pointerMesh.visible = false;
}

// =========================================
// MOTOR MATEMÁTICO MULTI-GRÁFICA
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

function updateGraphics(t = 0) {
    for(let i=0; i<MAX_GRAPHS; i++) {
        const g = AppState.graphData[i];
        if (!g.expr) {
            curves2D[i].line.visible = false;
            meshes3D[i].mesh.visible = false;
            pointers1D[i].visible = false;
            continue;
        }

        let f;
        try {
            const expr = prepareExpression(g.expr);
            f = new Function('x', 'y', 'z', 'a', 'b', 't', `return ${expr};`);
        } catch (e) {
            curves2D[i].line.visible = false;
            meshes3D[i].mesh.visible = false;
            pointers1D[i].visible = false;
            continue;
        }

        // 1D
        const val1D = f(0, 0, 0, AppState.a, AppState.b, t);
        if (val1D !== null && !isNaN(val1D) && isFinite(val1D)) {
            pointers1D[i].position.set(val1D, 0, 0);
            pointers1D[i].visible = (AppState.mode === '1D');
            pointers1D[i].material.color.setHex(g.color);
        } else {
            pointers1D[i].visible = false;
        }

        // 2D
        const pos2D = curves2D[i].geo.attributes.position;
        for (let j = 0; j < curveRes; j++) {
            const x = (j / (curveRes - 1)) * 12 - 6;
            const y = f(x, 0, 0, AppState.a, AppState.b, t);
            if (y !== null && !isNaN(y) && isFinite(y)) { pos2D.setXYZ(j, x, y, 0); } 
            else { pos2D.setXYZ(j, x, 0, 0); }
        }
        pos2D.needsUpdate = true;
        curves2D[i].mat.color.setHex(g.color);
        curves2D[i].line.visible = (AppState.mode === '2D');

        // 3D
        const pos3D = meshes3D[i].geo.attributes.position;
        const col3D = meshes3D[i].geo.attributes.color;
        const cLow = new THREE.Color(g.color);
        const cHigh = new THREE.Color(0xffffff);
        const tempC = new THREE.Color();

        for (let j = 0; j < pos3D.count; j++) {
            const x = pos3D.getX(j), y = pos3D.getZ(j);
            const z = f(x, y, 0, AppState.a, AppState.b, t);
            if (z !== null && !isNaN(z) && isFinite(z)) {
                pos3D.setY(j, z);
                const tCol = THREE.MathUtils.clamp((z + 5) / 10, 0, 1);
                tempC.lerpColors(cLow, cHigh, tCol);
                col3D.setXYZ(j, tempC.r, tempC.g, tempC.b);
            } else { pos3D.setY(j, 0); }
        }
        pos3D.needsUpdate = true; col3D.needsUpdate = true;
        meshes3D[i].geo.computeVertexNormals();
        meshes3D[i].mesh.visible = (AppState.mode === '3D');
    }
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

    els.sliderA.addEventListener('input', (e) => { AppState.a = parseFloat(e.target.value); els.valA.innerText = AppState.a.toFixed(1); updateGraphics(AppState.time); });
    els.sliderB.addEventListener('input', (e) => { AppState.b = parseFloat(e.target.value); els.valB.innerText = AppState.b.toFixed(1); updateGraphics(AppState.time); });
    
    els.btn1D.addEventListener('click', () => setMode('1D'));
    els.btn2D.addEventListener('click', () => setMode('2D'));
    els.btn3D.addEventListener('click', () => setMode('3D'));

    function hideCalculator() { els.calc.classList.add('hidden-calc'); els.calcToggleBtn.innerText = "👁️"; }
    function showCalculator() { els.calc.classList.remove('hidden-calc'); els.calcToggleBtn.innerText = "🧮"; }

    els.calcToggleBtn.addEventListener('click', () => { els.calc.classList.contains('hidden-calc') ? showCalculator() : hideCalculator(); });
    els.closeCalcBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); hideCalculator(); });

    els.playBtn.addEventListener('click', () => {
        AppState.isPlaying = !AppState.isPlaying;
        els.playBtn.innerText = AppState.isPlaying ? "⏸️" : "▶️";
    });

    els.screenshotBtn.addEventListener('click', () => {
        renderer.render(scene, camera);
        try {
            const dataURL = renderer.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL; link.download = 'grafica_calculadora.png';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            els.screenshotBtn.innerText = "✅"; setTimeout(() => els.screenshotBtn.innerText = "📸", 1500);
        } catch (e) { alert("No se pudo capturar la imagen."); }
    });

    els.videoBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); els.videoBtn.classList.remove('recording'); els.videoBtn.innerText = "🎥";
        } else {
            try {
                const stream = renderer.domElement.captureStream(30);
                let options = { mimeType: 'video/webm' };
                if (!MediaRecorder.isTypeSupported('video/webm')) options = { mimeType: 'video/mp4' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) options = {}; 
                mediaRecorder = new MediaRecorder(stream, options);
                const chunks = [];
                mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
                mediaRecorder.onstop = () => {
                    const ext = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
                    const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `grabacion_calculadora.${ext}`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                };
                mediaRecorder.start(); els.videoBtn.classList.add('recording'); els.videoBtn.innerText = "⏹️";
            } catch (e) { alert("Tu navegador no soporta la grabación de video."); }
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
        axis1DMat.color.setHex(theme.axes);
        rebuild1DLabels(AppState.isDarkMode ? "#ffffff" : "#000000");
        group3D.remove(gridHelper3D); gridHelper3D.geometry.dispose(); gridHelper3D.material.dispose();
        gridHelper3D = new THREE.GridHelper(20, 20, theme.grid3D_center, theme.grid3D_base);
        group3D.add(gridHelper3D);
    });

    window.addEventListener('mousemove', (e) => handlePointer(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0 && !e.touches[0].target.closest('.calculator-container')) { handlePointer(e.touches[0].clientX, e.touches[0].clientY); }
    }, {passive: true});

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
        const isNowMobile = window.innerWidth <= 768;
        if (isNowMobile !== AppState.isMobile) location.reload(); 
    });
}

// =========================================
// FUNCIONES DEL TECLADO Y PANTALLA
// =========================================
function insertText(char) { 
    AppState.graphData[AppState.currentGraphIndex].expr += char; 
    updateDisplay(); updateGraphics(AppState.time); 
}

let lastACTime = 0;
function clearDisplay() {
    const now = Date.now();
    const currentExpr = AppState.graphData[AppState.currentGraphIndex].expr;
    
    // Doble clic en AC estando vacío: limpia todas las gráficas
    if (currentExpr === "" && now - lastACTime < 300) {
        for(let i=0; i<MAX_GRAPHS; i++) { AppState.graphData[i].expr = ""; }
        AppState.currentGraphIndex = 0;
        AppState.graphData[0].color = graphColors[0];
        updateColorButtonsUI();
    } else {
        AppState.graphData[AppState.currentGraphIndex].expr = "";
    }
    lastACTime = now;
    updateDisplay(); updateGraphics(AppState.time); 
}

function backspace() { 
    let expr = AppState.graphData[AppState.currentGraphIndex].expr;
    expr = expr.slice(0, -1); 
    AppState.graphData[AppState.currentGraphIndex].expr = expr;
    updateDisplay(); updateGraphics(AppState.time); 
}

// El botón "=" fija la gráfica actual como constante y pasa a la siguiente
function calculate() {
    const currentExpr = AppState.graphData[AppState.currentGraphIndex].expr;
    if (currentExpr.trim() === "") return;
    
    // Validar sintaxis
    try {
        const expr = prepareExpression(currentExpr);
        new Function('x', 'y', 'z', 'a', 'b', 't', `return ${expr};`);
    } catch (e) { return; }

    if (AppState.currentGraphIndex < MAX_GRAPHS - 1) {
        AppState.currentGraphIndex++;
        AppState.graphData[AppState.currentGraphIndex].color = graphColors[AppState.currentGraphIndex];
        updateColorButtonsUI();
        updateDisplay();
        els.calc.classList.add('pulse');
        setTimeout(() => els.calc.classList.remove('pulse'), 300);
    } else {
        els.calc.classList.add('pulse');
        setTimeout(() => els.calc.classList.remove('pulse'), 300);
    }
}

function updateDisplay() {
    const text = AppState.graphData[AppState.currentGraphIndex].expr || "0";
    els.screenLabel.innerText = `f${AppState.currentGraphIndex + 1}(x, y, t) =`;
    
    let isSyntaxError = false;
    if (text !== "0") {
        try {
            const expr = prepareExpression(text);
            new Function('x', 'y', 'z', 'a', 'b', 't', `return ${expr};`);
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

function updateColorButtonsUI() {
    els.colorBtns.forEach(btn => {
        if (parseInt(btn.dataset.color) === AppState.graphData[AppState.currentGraphIndex].color) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// =========================================
// LÓGICA DE MODO (1D, 2D, 3D)
// =========================================
function setMode(mode) {
    if (AppState.isAnimating && AppState.mode === mode) return;
    AppState.mode = mode; AppState.isAnimating = true;
    
    els.btn1D.classList.toggle('active', mode === '1D');
    els.btn2D.classList.toggle('active', mode === '2D');
    els.btn3D.classList.toggle('active', mode === '3D');
    els.statusText.innerText = `MODO ${mode}`;
    els.statusDot.style.background = mode === '2D' ? "#22c55e" : (mode === '3D' ? "#3b82f6" : "#fbbf24");

    let targetPos, targetLookAt, targetUp;
    if (mode === '1D') {
        group3D.visible = false; group2D.visible = false; group1D.visible = true;
        targetPos = new THREE.Vector3(0, 0, 10); targetLookAt = new THREE.Vector3(0, 0, 0); targetUp = new THREE.Vector3(0, 1, 0);
    } else if (mode === '2D') {
        group3D.visible = false; group2D.visible = true; group1D.visible = false;
        targetPos = new THREE.Vector3(0, 0, 10); targetLookAt = new THREE.Vector3(0, 0, 0); targetUp = new THREE.Vector3(0, 1, 0);
    } else {
        group3D.visible = true; group2D.visible = false; group1D.visible = false;
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

// =========================================
// INTERACCIÓN CON EL GRÁFICO
// =========================================
function handlePointer(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (clientX > rect.right || clientX < rect.left || clientY > rect.bottom || clientY < rect.top) return;

    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    let target;
    if (AppState.mode === '2D') target = group2D;
    else if (AppState.mode === '3D') target = group3D;
    else target = group1D;

    const intersects = raycaster.intersectObject(target, true);
    if (intersects.length > 0) {
        const point = intersects[0].point;
        pointerMesh.position.copy(point); pointerMesh.visible = true;
        els.tooltip.style.display = 'block';
        els.tooltip.style.left = clientX + 'px'; els.tooltip.style.top = clientY + 'px';
        if (AppState.mode === '2D') els.tooltip.innerText = `x: ${point.x.toFixed(2)}, y: ${point.y.toFixed(2)}`;
        else if (AppState.mode === '3D') els.tooltip.innerText = `x: ${point.x.toFixed(2)}, z: ${point.z.toFixed(2)}`;
        else els.tooltip.innerText = `Valor: ${point.x.toFixed(2)}`;
    } else {
        pointerMesh.visible = false; els.tooltip.style.display = 'none';
    }
}

// =========================================
// LOOP PRINCIPAL DE ANIMACIÓN
// =========================================
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (AppState.isPlaying) {
        AppState.time += 0.05;
        if (AppState.time > Math.PI * 2) AppState.time = 0; 
        updateGraphics(AppState.time);
    }
    renderer.render(scene, camera);
}
```
