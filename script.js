'use strict';

/* =========================================================================
   1. CONFIGURACIÓN GLOBAL Y CONSTANTES
   ========================================================================= */

/**
 * Número máximo de gráficas simultáneas soportadas por el motor.
 * @type {number}
 */
const MAX_GRAPHS = 10;

/**
 * Paleta de colores institucional para las gráficas.
 * @type {number[]}
 */
const GRAPH_COLORS = [
    0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0x8B5CF6,
    0xEC4899, 0x14B8A6, 0xF97316, 0x6366F1, 0x000000
];

/**
 * Resolución de la malla 3D y curvas 2D. Mayor es más suave pero pesa más.
 * @type {number}
 */
const CURVE_RESOLUTION = 400;

/**
 * Estado global de la aplicación. Centraliza toda la configuración dinámica.
 */
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

// Inicialización de los espacios para las 10 gráficas
for (let i = 0; i < MAX_GRAPHS; i++) {
    AppState.graphData.push({ 
        expr: "", 
        color: GRAPH_COLORS[i],
        visible: true 
    });
}
AppState.graphData[0].expr = "0.5 * sin(x * a + t) + 1";

/**
 * Definición de temas visuales para el lienzo 3D.
 */
const THEMES = {
    light: { 
        bg: 0xf8fafc, 
        paper: 0xffffff, 
        grid: 0xe2e8f0, 
        axes: 0x0f172a, 
        grid3D_center: 0x94a3b8, 
        grid3D_base: 0xe2e8f0 
    },
    dark: { 
        bg: 0x0a0f1d, 
        paper: 0x1e293b, 
        grid: 0x334155, 
        axes: 0x94a3b8, 
        grid3D_center: 0x475569, 
        grid3D_base: 0x334155 
    }
};

/* =========================================================================
   2. REFERENCIAS DOM (CACHE)
   ========================================================================= */

/**
 * Objeto que cachea todas las referencias al DOM para evitar búsquedas repetitivas.
 */
const els = {
    splash: document.getElementById('splash-screen'),
    startBtn: document.getElementById('start-btn'),
    loginForm: document.getElementById('login-form'),
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
    
    graphSelector: document.getElementById('graph-selector'),
    deleteGraphBtn: document.getElementById('delete-graph-btn'),
    
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
    
    colorBtns: document.querySelectorAll('.color-btn'),
    
    // Elementos del Modal de Ayuda
    helpBtn: document.getElementById('help-btn'),
    helpModal: document.getElementById('help-modal'),
    closeHelpBtn: document.getElementById('close-help-btn')
};

/* =========================================================================
   3. MOTOR MATEMÁTICO (MATH ENGINE)
   ========================================================================= */

/**
 * Prepara una expresión matemática en formato cadena para ser evaluada por JavaScript.
 * Maneja ecuaciones implícitas, multiplicación implícita y funciones avanzadas.
 * @param {string} rawExpr - La expresión cruda ingresada por el usuario.
 * @returns {string} Expresión lista para `new Function`.
 */
function prepareExpression(rawExpr) {
    if (!rawExpr) return '0';
    
    let expr = rawExpr.toLowerCase().trim();
    
    // 3.1. Manejo de ecuaciones con '='
    let parts = expr.split('=');
    if (parts.length === 2) {
        let lhs = parts[0].trim();
        let rhs = parts[1].trim();
        
        if (lhs === 'y') {
            expr = rhs; // y = f(x)  -->  f(x)
        } else if (rhs === 'y') {
            expr = lhs; // f(x) = y  -->  f(x)
        } else if (lhs === 'x') {
            expr = rhs; // x = f(y)  -->  f(y) (Menos común, pero soportado)
        } else if (rhs === 'x') {
            expr = lhs;
        } else {
            expr = `(${lhs}) - (${rhs})`; // f(x,y) = g(x,y) --> f(x,y) - g(x,y)
        }
    }

    // 3.2. Sustitución de operadores
    expr = expr.replace(/\^/g, '**'); // Potencias

    // 3.3. Multiplicación implícita
    // 2x -> 2*x, 2( -> 2*(, )( -> )*(, )x -> )*x, xy -> x*y
    expr = expr.replace(/(\d)([a-zA-Z\(])/g, '$1*$2'); 
    expr = expr.replace(/\)([a-zA-Z0-9\(])/g, ')*$1');  
    expr = expr.replace(/([xyz])([xyz\(])/g, '$1*$2');  

    // 3.4. Funciones y Constantes
    expr = expr.replace(/\bln\(/g, 'Math.log(');
    expr = expr.replace(/\blog\(/g, 'Math.log10(');
    
    const mathFuncs = [
        'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
        'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
        'sqrt', 'cbrt', 'abs', 'exp', 'pow', 
        'floor', 'ceil', 'round', 'sign', 'trunc',
        'max', 'min'
    ];
    
    mathFuncs.forEach(f => {
        const regex = new RegExp(`\\b${f}\\(`, 'g');
        expr = expr.replace(regex, `Math.${f}(`);
    });

    expr = expr.replace(/\bpi\b/g, 'Math.PI');
    expr = expr.replace(/(^|[^a-zA-Z0-9\.])e($|[^a-zA-Z0-9])/g, '$1Math.E$2');

    return expr;
}

/**
 * Evalúa la expresión preparada en un punto dado (x, y, t).
 * @param {number} x - Coordenada X.
 * @param {number} y - Coordenada Y (o Z en 3D).
 * @param {number} t - Tiempo (para animaciones).
 * @param {string} expr - Expresión preparada.
 * @returns {number|null} El resultado numérico o null si es inválido.
 */
function evaluateMath(x, y, t, expr) {
    if (!expr) return 0;
    try {
        const f = new Function('x', 'y', 'z', 'a', 'b', 't', `return ${expr};`);
        const r = f(x, y, 0, AppState.a, AppState.b, t);
        return (isNaN(r) || !isFinite(r)) ? null : r;
    } catch (e) { 
        return null; 
    }
}

/**
 * Valida la sintaxis de una expresión sin evaluarla numéricamente.
 * @param {string} rawExpr - Expresión cruda.
 * @returns {boolean} True si la sintaxis es válida.
 */
function validateSyntax(rawExpr) {
    if (!rawExpr || rawExpr.trim() === "") return true;
    try {
        const expr = prepareExpression(rawExpr);
        new Function('x', 'y', 'z', 'a', 'b', 't', `return ${expr};`);
        return true;
    } catch (e) { 
        return false; 
    }
}

/* =========================================================================
   4. FUNCIONES DE EJEMPLO
   ========================================================================= */

const examples = [
    { name: "1. Onda en Movimiento 2D", expr: "a * sin(x * b + t)", mode: "2D" },
    { name: "2. Onda Senoidal 2D", expr: "a * sin(x * b)", mode: "2D" },
    { name: "3. Parábola Cúbica 2D", expr: "a * x^3 - b * x", mode: "2D" },
    { name: "4. Gaussiana (Campana) 2D", expr: "a * exp(-(x^2) / b)", mode: "2D" },
    { name: "5. Ecuación Circular 2D", expr: "x^2 + y^2 = a^2", mode: "2D" },
    { name: "6. Cartón de Huevos 3D", expr: "sin(x * a) * cos(y * b)", mode: "3D" },
    { name: "7. Sombrero Mexicano 3D", expr: "a * exp(-(x^2 + y^2) / b) * cos(sqrt(x^2 + y^2))", mode: "3D" },
    { name: "8. Silla de Montar 3D", expr: "(x^2 - y^2) * a * 0.1", mode: "3D" },
    { name: "9. Onda Dinámica 3D", expr: "sin(x + t) * cos(y + t)", mode: "3D" },
    { name: "10. Esfera 3D", expr: "x^2 + y^2 + z^2 = b^2", mode: "3D" },
    { name: "11. Oscilador 1D", expr: "a * sin(t) * 5", mode: "1D" },
    { name: "12. Valor Fijo 1D", expr: "b * 3", mode: "1D" }
];

/* =========================================================================
   5. VARIABLES GLOBALES DE THREE.JS
   ========================================================================= */

let scene, camera, renderer, controls, raycaster;
let group3D, gridHelper3D, axesHelper3D;
let group2D, paperPlane, grid2DMat, axisMat;
let group1D, axis1DMat;
let curves2D = [], meshes3D = [], pointers1D = [];
let textSprites1D = [];
let ambientLight, dirLight;
let mouse, pointerMesh;
let mediaRecorder; 

/* =========================================================================
   6. AUTENTICACIÓN INSTITUCIONAL
   ========================================================================= */

/**
 * Intenta autenticar al usuario validando el dominio del correo.
 */
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

// Eventos de Login
els.startBtn.addEventListener('click', attemptLogin);
els.loginForm.addEventListener('submit', (e) => { e.preventDefault(); attemptLogin(); });

/* =========================================================================
   7. INICIALIZADOR PRINCIPAL DE LA CALCULADORA
   ========================================================================= */

/**
 * Inicializa todos los componentes de la calculadora gráfica.
 */
function initCalculator() {
    // 7.1. Poblar Selector de Gráficas
    for (let i = 0; i < MAX_GRAPHS; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = `Gráfica ${i + 1}`;
        els.graphSelector.appendChild(opt);
    }

    // 7.2. Eventos del DOM
    setupUIEvents();
    setupPhysicalKeyboard();

    // 7.3. Poblar Ejemplos
    examples.forEach(ex => {
        const item = document.createElement('div');
        item.className = 'examples-item';
        item.innerText = ex.name;
        item.addEventListener('click', () => {
            AppState.graphData[AppState.currentGraphIndex].expr = ex.expr;
            updateDisplay(); 
            updateGraphics(AppState.time); 
            setMode(ex.mode);
            els.examplesDropdown.classList.remove('show');
        });
        els.examplesDropdown.appendChild(item);
    });

    // 7.4. Inicializar Three.js
    setupThreeJS();
    setupScenes();
    updateColorButtonsUI();
    
    // 7.5. Estado Inicial
    setMode('2D');
    updateDisplay();
    updateGraphics();
    animate();
}

/* =========================================================================
   8. CONFIGURACIÓN DE THREE.JS
   ========================================================================= */

/**
 * Configura la escena, cámara, renderizador y luces de Three.js.
 */
function setupThreeJS() {
    const container = document.getElementById('viewport');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(THEMES.light.bg);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10); 
    camera.up.set(0, 1, 0); 
    camera.lookAt(0, 0, 0);

    // preserveDrawingBuffer es vital para permitir capturas de pantalla y video
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;

    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.2;

    // Iluminación
    ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);
    
    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5); 
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; 
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
}

/* =========================================================================
   9. CREACIÓN DE ESCENAS Y OBJETOS 3D
   ========================================================================= */

/**
 * Crea los grupos para 1D, 2D y 3D e inicializa los espacios para las 10 gráficas.
 */
function setupScenes() {
    // --- 3D SCENE ---
    group3D = new THREE.Group(); scene.add(group3D);
    for (let i = 0; i < MAX_GRAPHS; i++) {
        const geo = new THREE.PlaneGeometry(14, 14, 100, 100);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
        const mat = new THREE.MeshStandardMaterial({ 
            vertexColors: true, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.1, 
            flatShading: false, transparent: true, opacity: 0.75 
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        group3D.add(mesh);
        meshes3D.push({ geo, mat, mesh });
    }
    gridHelper3D = new THREE.GridHelper(20, 20, THEMES.light.grid3D_center, THEMES.light.grid3D_base);
    group3D.add(gridHelper3D);
    axesHelper3D = new THREE.AxesHelper(2); group3D.add(axesHelper3D);

    // --- 2D SCENE ---
    group2D = new THREE.Group(); scene.add(group2D);
    const planeMat = new THREE.MeshBasicMaterial({ color: THEMES.light.paper, side: THREE.DoubleSide });
    paperPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), planeMat);
    paperPlane.position.z = -0.1; group2D.add(paperPlane);

    grid2DMat = new THREE.LineBasicMaterial({ color: THEMES.light.grid });
    const grid2DGroup = new THREE.Group();
    for (let i = -6; i <= 6; i++) grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -4, 0), new THREE.Vector3(i, 4, 0)]), grid2DMat));
    for (let i = -4; i <= 4; i++) grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, i, 0), new THREE.Vector3(6, i, 0)]), grid2DMat));
    group2D.add(grid2DGroup);

    axisMat = new THREE.LineBasicMaterial({ color: THEMES.light.axes });
    group2D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, 0, 0), new THREE.Vector3(6, 0, 0)]), axisMat));
    group2D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4, 0), new THREE.Vector3(0, 4, 0)]), axisMat));

    for (let i = 0; i < MAX_GRAPHS; i++) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CURVE_RESOLUTION * 3), 3));
        const mat = new THREE.LineBasicMaterial({ color: GRAPH_COLORS[i] });
        const line = new THREE.Line(geo, mat);
        line.visible = false;
        group2D.add(line);
        curves2D.push({ geo, mat, line });
    }

    // --- 1D SCENE ---
    group1D = new THREE.Group(); scene.add(group1D);
    axis1DMat = new THREE.LineBasicMaterial({ color: THEMES.light.axes });
    group1D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)]), axis1DMat));
    for (let i = -10; i <= 10; i++) {
        const tickGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -0.2, 0), new THREE.Vector3(i, 0.2, 0)]);
        group1D.add(new THREE.Line(tickGeo, axis1DMat));
    }
    rebuild1DLabels("#000000");

    for (let i = 0; i < MAX_GRAPHS; i++) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshBasicMaterial({ color: GRAPH_COLORS[i] }));
        mesh.visible = false;
        group1D.add(mesh);
        pointers1D.push(mesh);
    }

    // Puntero Genérico para Tooltip
    mouse = new THREE.Vector2();
    pointerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
    scene.add(pointerMesh);
    pointerMesh.visible = false;
}

/**
 * Crea un Sprite de texto para usarlo en el lienzo 3D (ej. números en la recta 1D).
 */
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

/**
 * Reconstruye las etiquetas numéricas de la recta 1D al cambiar de tema.
 */
function rebuild1DLabels(color) {
    textSprites1D.forEach(s => { group1D.remove(s); s.material.map.dispose(); s.material.dispose(); });
    textSprites1D = [];
    for (let i = -10; i <= 10; i++) {
        if (i % 2 === 0) {
            const sprite = createTextSprite(i.toString(), color);
            sprite.position.set(i, -0.8, 0);
            sprite.scale.set(1.2, 0.6, 1);
            group1D.add(sprite);
            textSprites1D.push(sprite);
        }
    }
}

/* =========================================================================
   10. ACTUALIZACIÓN DE GRÁFICAS
   ========================================================================= */

/**
 * Evalúa y redibuja todas las gráficas activas en el lienzo.
 * @param {number} t - Tiempo actual (para animaciones).
 */
function updateGraphics(t = 0) {
    for (let i = 0; i < MAX_GRAPHS; i++) {
        const g = AppState.graphData[i];
        if (!g.expr || !g.visible) {
            curves2D[i].line.visible = false;
            meshes3D[i].mesh.visible = false;
            pointers1D[i].visible = false;
            continue;
        }

        let expr;
        try {
            expr = prepareExpression(g.expr);
            // Test de sintaxis
            new Function('x', 'y', 'z', 'a', 'b', 't', `return ${expr};`);
        } catch (e) {
            curves2D[i].line.visible = false;
            meshes3D[i].mesh.visible = false;
            pointers1D[i].visible = false;
            continue;
        }

        // --- 1D ---
        const val1D = evaluateMath(0, 0, t, expr);
        if (val1D !== null) {
            pointers1D[i].position.set(val1D, 0, 0);
            pointers1D[i].visible = (AppState.mode === '1D');
            pointers1D[i].material.color.setHex(g.color);
        } else {
            pointers1D[i].visible = false;
        }

        // --- 2D ---
        const pos2D = curves2D[i].geo.attributes.position;
        for (let j = 0; j < CURVE_RESOLUTION; j++) {
            const x = (j / (CURVE_RESOLUTION - 1)) * 12 - 6;
            const y = evaluateMath(x, 0, t, expr);
            if (y !== null) { pos2D.setXYZ(j, x, y, 0); } 
            else { pos2D.setXYZ(j, x, 0, 0); }
        }
        pos2D.needsUpdate = true;
        curves2D[i].mat.color.setHex(g.color);
        curves2D[i].line.visible = (AppState.mode === '2D');

        // --- 3D ---
        const pos3D = meshes3D[i].geo.attributes.position;
        const col3D = meshes3D[i].geo.attributes.color;
        const cLow = new THREE.Color(g.color);
        const cHigh = new THREE.Color(0xffffff);
        const tempC = new THREE.Color();

        for (let j = 0; j < pos3D.count; j++) {
            const x = pos3D.getX(j), y = pos3D.getZ(j);
            const z = evaluateMath(x, y, t, expr);
            if (z !== null) {
                pos3D.setY(j, z);
                const tCol = THREE.MathUtils.clamp((z + 5) / 10, 0, 1);
                tempC.lerpColors(cLow, cHigh, tCol);
                col3D.setXYZ(j, tempC.r, tempC.g, tempC.b);
            } else { 
                pos3D.setY(j, 0); 
            }
        }
        pos3D.needsUpdate = true; col3D.needsUpdate = true;
        meshes3D[i].geo.computeVertexNormals();
        meshes3D[i].mesh.visible = (AppState.mode === '3D');
    }
}

/* =========================================================================
   11. CONTROLADORES DE INTERFAZ DE USUARIO (UI)
   ========================================================================= */

function setupUIEvents() {
    // --- Teclado Táctil ---
    els.keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button.key');
        if (!btn) return;
        if (btn.dataset.insert) insertText(btn.dataset.insert);
        else if (btn.dataset.action === 'clear') clearDisplay();
        else if (btn.dataset.action === 'backspace') backspace();
        else if (btn.dataset.action === 'calculate') calculate();
        else if (btn.dataset.action === 'next') nextGraph();
    });

    // --- Deslizadores ---
    els.sliderA.addEventListener('input', (e) => { 
        AppState.a = parseFloat(e.target.value); 
        els.valA.innerText = AppState.a.toFixed(1); 
        updateGraphics(AppState.time); 
    });
    
    els.sliderB.addEventListener('input', (e) => { 
        AppState.b = parseFloat(e.target.value); 
        els.valB.innerText = AppState.b.toFixed(1); 
        updateGraphics(AppState.time); 
    });
    
    // --- Modos ---
    els.btn1D.addEventListener('click', () => setMode('1D'));
    els.btn2D.addEventListener('click', () => setMode('2D'));
    els.btn3D.addEventListener('click', () => setMode('3D'));

    // --- Visibilidad Calculadora ---
    function hideCalculator() { els.calc.classList.add('hidden-calc'); els.calcToggleBtn.innerText = "👁️"; }
    function showCalculator() { els.calc.classList.remove('hidden-calc'); els.calcToggleBtn.innerText = "🧮"; }

    els.calcToggleBtn.addEventListener('click', () => { 
        els.calc.classList.contains('hidden-calc') ? showCalculator() : hideCalculator(); 
    });
    els.closeCalcBtn.addEventListener('click', (e) => { 
        e.preventDefault(); e.stopPropagation(); hideCalculator(); 
    });

    // --- Gestor de Gráficas ---
    els.graphSelector.addEventListener('change', (e) => {
        AppState.currentGraphIndex = parseInt(e.target.value);
        updateColorButtonsUI();
        updateDisplay();
        updateGraphics(AppState.time);
    });

    els.deleteGraphBtn.addEventListener('click', () => {
        AppState.graphData[AppState.currentGraphIndex].expr = "";
        updateDisplay();
        updateGraphics(AppState.time);
    });

    // --- Colores ---
    els.colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.graphData[AppState.currentGraphIndex].color = parseInt(btn.dataset.color);
            updateColorButtonsUI();
            updateGraphics(AppState.time);
        });
    });

    // --- Ejemplos ---
    els.examplesBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        els.examplesDropdown.classList.toggle('show'); 
    });
    window.addEventListener('click', (e) => { 
        if (!e.target.closest('.dropdown-container')) els.examplesDropdown.classList.remove('show'); 
    });

    // --- Multimedia ---
    els.playBtn.addEventListener('click', () => {
        AppState.isPlaying = !AppState.isPlaying;
        els.playBtn.innerText = AppState.isPlaying ? "⏸️" : "▶️";
    });

    els.screenshotBtn.addEventListener('click', captureScreenshot);
    els.videoBtn.addEventListener('click', toggleVideoRecording);

    // --- Tema ---
    els.themeBtn.addEventListener('click', toggleTheme);

    // --- Modal de Ayuda ---
    els.helpBtn.addEventListener('click', () => els.helpModal.classList.add('show'));
    els.closeHelpBtn.addEventListener('click', () => els.helpModal.classList.remove('show'));
    els.helpModal.addEventListener('click', (e) => {
        if (e.target === els.helpModal) els.helpModal.classList.remove('show');
    });

    // --- Interacción Gráfica ---
    window.addEventListener('mousemove', (e) => handlePointer(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0 && !e.touches[0].target.closest('.calculator-container')) { 
            handlePointer(e.touches[0].clientX, e.touches[0].clientY); 
        }
    }, { passive: true });

    // --- Resize ---
    window.addEventListener('resize', handleResize);
}

/**
 * Soporte para teclado físico (PC).
 */
function setupPhysicalKeyboard() {
    window.addEventListener('keydown', (e) => {
        if (AppState.hasStarted && !els.emailInput.matches(':focus')) {
            const key = e.key;
            if (/[a-z0-9+\-*/().^=]/i.test(key)) {
                insertText(key);
            } else if (key === 'Backspace') {
                backspace();
            } else if (key === 'Enter') {
                calculate();
            } else if (key === 'Escape') {
                if (els.helpModal.classList.contains('show')) els.helpModal.classList.remove('show');
            }
        }
    });
}

/* =========================================================================
   12. FUNCIONES DE TECLADO Y PANTALLA LCD
   ========================================================================= */

function insertText(char) { 
    AppState.graphData[AppState.currentGraphIndex].expr += char; 
    updateDisplay(); 
    updateGraphics(AppState.time); 
}

function clearDisplay() {
    AppState.graphData[AppState.currentGraphIndex].expr = "";
    updateDisplay(); 
    updateGraphics(AppState.time); 
}

function backspace() { 
    let expr = AppState.graphData[AppState.currentGraphIndex].expr;
    expr = expr.slice(0, -1); 
    AppState.graphData[AppState.currentGraphIndex].expr = expr;
    updateDisplay(); 
    updateGraphics(AppState.time); 
}

/**
 * ENTER: Compila y fija la gráfica actual en la pantalla.
 */
function calculate() {
    const currentExpr = AppState.graphData[AppState.currentGraphIndex].expr;
    if (currentExpr.trim() === "") return;
    
    if (validateSyntax(currentExpr)) {
        updateGraphics(AppState.time); // Fuerza el redibujado
        els.calc.classList.add('pulse');
        setTimeout(() => els.calc.classList.remove('pulse'), 300);
    }
}

/**
 * SGT (Siguiente): Fija la actual y avanza al siguiente espacio.
 */
function nextGraph() {
    if (AppState.currentGraphIndex < MAX_GRAPHS - 1) {
        AppState.currentGraphIndex++;
        els.graphSelector.value = AppState.currentGraphIndex;
        updateColorButtonsUI();
        updateDisplay();
        els.calc.classList.add('pulse');
        setTimeout(() => els.calc.classList.remove('pulse'), 300);
    }
}

/**
 * Actualiza la pantalla LCD de la calculadora.
 */
function updateDisplay() {
    const text = AppState.graphData[AppState.currentGraphIndex].expr || "";
    els.screenLabel.innerText = `f${AppState.currentGraphIndex + 1}(x, y, t) =`;
    
    const displayText = text === "" ? "0" : text;
    const isSyntaxError = !validateSyntax(text);

    if (isSyntaxError && text !== "") {
        els.display.classList.add('error');
        els.display.innerHTML = `Error: ${displayText}<span class="cursor"></span>`;
    } else {
        els.display.classList.remove('error');
        els.display.innerHTML = displayText + '<span class="cursor"></span>';
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

/* =========================================================================
   13. MULTIMEDIA Y TEMA
   ========================================================================= */

function captureScreenshot() {
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
        alert("No se pudo capturar la imagen."); 
    }
}

function toggleVideoRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop(); 
        els.videoBtn.classList.remove('recording'); 
        els.videoBtn.innerText = "🎥";
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
                a.href = url; 
                a.download = `grabacion_calculadora.${ext}`;
                document.body.appendChild(a); 
                a.click(); 
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };
            mediaRecorder.start(); 
            els.videoBtn.classList.add('recording'); 
            els.videoBtn.innerText = "⏹️";
        } catch (e) { 
            alert("Tu navegador no soporta la grabación de video."); 
        }
    }
}

function toggleTheme() {
    AppState.isDarkMode = !AppState.isDarkMode;
    document.documentElement.classList.toggle('dark-mode', AppState.isDarkMode);
    els.themeBtn.innerText = AppState.isDarkMode ? "☀️" : "🌙";
    const theme = AppState.isDarkMode ? THEMES.dark : THEMES.light;
    
    scene.background.setHex(theme.bg);
    paperPlane.material.color.setHex(theme.paper);
    grid2DMat.color.setHex(theme.grid);
    axisMat.color.setHex(theme.axes);
    axis1DMat.color.setHex(theme.axes);
    rebuild1DLabels(AppState.isDarkMode ? "#ffffff" : "#000000");
    
    group3D.remove(gridHelper3D); 
    gridHelper3D.geometry.dispose(); 
    gridHelper3D.material.dispose();
    gridHelper3D = new THREE.GridHelper(20, 20, theme.grid3D_center, theme.grid3D_base);
    group3D.add(gridHelper3D);
}

/* =========================================================================
   14. LÓGICA DE MODO (1D, 2D, 3D)
   ========================================================================= */

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

    // Animación suave de cámara
    const startPos = camera.position.clone(), startUp = camera.up.clone(), startTarget = controls.target.clone();
    let progress = 0;
    
    function animateCamera() {
        progress += 0.025; 
        if (progress > 1) progress = 1;
        const ease = 1 - Math.pow(1 - progress, 3); // EaseOut Cubic
        camera.position.lerpVectors(startPos, targetPos, ease);
        camera.up.lerpVectors(startUp, targetUp, ease);
        controls.target.lerpVectors(startTarget, targetLookAt, ease);
        controls.update();
        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        } else {
            AppState.isAnimating = false; 
            controls.enableRotate = (mode === '3D');
        }
    }
    animateCamera();
}

/* =========================================================================
   15. INTERACCIÓN Y TOOLTIPS
   ========================================================================= */

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
        els.tooltip.style.left = clientX + 'px'; 
        els.tooltip.style.top = clientY + 'px';
        if (AppState.mode === '2D') els.tooltip.innerText = `x: ${point.x.toFixed(2)}, y: ${point.y.toFixed(2)}`;
        else if (AppState.mode === '3D') els.tooltip.innerText = `x: ${point.x.toFixed(2)}, z: ${point.z.toFixed(2)}`;
        else els.tooltip.innerText = `Valor: ${point.x.toFixed(2)}`;
    } else {
        pointerMesh.visible = false; els.tooltip.style.display = 'none';
    }
}

/* =========================================================================
   16. UTILIDADES Y RESIZE
   ========================================================================= */

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    const isNowMobile = window.innerWidth <= 768;
    if (isNowMobile !== AppState.isMobile) location.reload(); 
}

/* =========================================================================
   17. LOOP PRINCIPAL DE ANIMACIÓN
   ========================================================================= */

/**
 * Loop de renderizado infinito. Se ejecuta 60 veces por segundo.
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Si la animación (Play) está activa, incrementar el tiempo
    if (AppState.isPlaying) {
        AppState.time += 0.05;
        if (AppState.time > Math.PI * 2) AppState.time = 0; 
        updateGraphics(AppState.time);
    }
    
    renderer.render(scene, camera);
}
