use strict';

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
 * Resolución de la malla 3D y curvas 2D. 
 * Mayor es más suave pero consume más GPU.
 * @type {number}
 */
const CURVE_RESOLUTION = 400;

/**
 * Estado global de la aplicación. Centraliza toda la configuración dinámica.
 * @type {Object}
 */
const AppState = {
    /** @type {Array<{expr: string, color: number, visible: boolean}>} */
    graphData: [],
    currentGraphIndex: 0,
    a: 1.0,
    b: 1.0,
    mode: '2D', // '1D', '2D', '3D'
    isMobile: window.innerWidth <= 768,
    isAnimating: false,
    isPlaying: false,
    time: 0,
    isDarkMode: false,
    hasStarted: false,
    angleMode: 'RAD', // 'RAD' o 'DEG'
    is2ndActive: false, // Función secundaria para hiperbólicas
    memory: 0,
    lastAnswer: 0,
    showGrid: true,
    showAxes: true,
    renderQuality: 'high', // 'high', 'medium', 'low'
    fontScale: 1.0, // Escala de redimensión de fuente
    widthScale: 1.0 // Escala de redimensión de ancho
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
 * @type {Object}
 */
const els = {
    // Splash & Login
    splash: document.getElementById('splash-screen'),
    startBtn: document.getElementById('start-btn'),
    loginForm: document.getElementById('login-form'),
    emailInput: document.getElementById('email-input'),
    errorMsg: document.getElementById('error-msg'),
    
    // Display
    display: document.getElementById('display'),
    screenLabel: document.getElementById('screen-label'),
    memoryIndicator: document.getElementById('memory-indicator'),
    
    // Controls
    valA: document.getElementById('val-a'),
    valB: document.getElementById('val-b'),
    statusText: document.getElementById('status-text'),
    statusDot: document.getElementById('status-dot'),
    tooltip: document.getElementById('tooltip'),
    
    // Calculator Panel
    calc: document.getElementById('calculator'),
    keypad: document.getElementById('keypad'),
    
    // Graph Manager
    graphSelector: document.getElementById('graph-selector'),
    deleteGraphBtn: document.getElementById('delete-graph-btn'),
    
    // Mode Toggles
    btn1D: document.getElementById('btn-1d'),
    btn2D: document.getElementById('btn-2d'),
    btn3D: document.getElementById('btn-3d'),
    
    // Sliders
    sliderA: document.getElementById('slider-a'),
    sliderB: document.getElementById('slider-b'),
    
    // Top Bar Buttons
    themeBtn: document.getElementById('theme-toggle'),
    calcToggleBtn: document.getElementById('calc-toggle'),
    closeCalcBtn: document.getElementById('close-calc-btn'),
    screenshotBtn: document.getElementById('screenshot-btn'),
    videoBtn: document.getElementById('video-btn'),
    playBtn: document.getElementById('play-btn'),
    resizeUpBtn: document.getElementById('calc-resize-up'),
    resizeDownBtn: document.getElementById('calc-resize-down'),
    
    // Examples & Settings
    examplesBtn: document.getElementById('examples-btn'),
    examplesDropdown: document.getElementById('examples-dropdown'),
    examplesTemplate: document.getElementById('examples-template'),
    colorBtns: document.querySelectorAll('.color-btn'),
    
    // Modals
    helpBtn: document.getElementById('help-btn'),
    helpModal: document.getElementById('help-modal'),
    closeHelpBtn: document.getElementById('close-help-btn')
};

/* =========================================================================
   3. MOTOR MATEMÁTICO (MATH ENGINE)
   ========================================================================= */

/**
 * Calcula el factorial de un número entero no negativo.
 * @param {number} n 
 * @returns {number}
 */
function mathFactorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

/**
 * Calcula permutaciones nPr = n! / (n-r)!.
 * @param {number} n 
 * @param {number} r 
 * @returns {number}
 */
function mathPermutation(n, r) {
    if (n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r) || r > n) return NaN;
    return mathFactorial(n) / mathFactorial(n - r);
}

/**
 * Calcula combinaciones nCr = n! / (r! * (n-r)!).
 * @param {number} n 
 * @param {number} r 
 * @returns {number}
 */
function mathCombination(n, r) {
    if (n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r) || r > n) return NaN;
    return mathFactorial(n) / (mathFactorial(r) * mathFactorial(n - r));
}

/**
 * Calcula la raíz n-ésima de un número.
 * @param {number} n 
 * @param {number} x 
 * @returns {number}
 */
function mathNthRoot(n, x) {
    if (x < 0 && n % 2 === 0) return NaN;
    return Math.sign(x) * Math.pow(Math.abs(x), 1 / n);
}

/**
 * Crea el contexto matemático (Scope) que se inyectará en la evaluación.
 * Esto permite manejar DEG/RAD dinámicamente sin alterar la cadena original.
 * @returns {Object} Objeto con todas las funciones matemáticas disponibles.
 */
function createMathScope() {
    const isDeg = AppState.angleMode === 'DEG';
    const toRad = (x) => isDeg ? x * Math.PI / 180 : x;
    const toDeg = (x) => isDeg ? x * 180 / Math.PI : x;

    return {
        // Trigonometría Básica
        sin: (x) => Math.sin(toRad(x)),
        cos: (x) => Math.cos(toRad(x)),
        tan: (x) => Math.tan(toRad(x)),
        
        // Trigonometría Inversa
        asin: (x) => toDeg(Math.asin(x)),
        acos: (x) => toDeg(Math.acos(x)),
        atan: (x) => toDeg(Math.atan(x)),
        atan2: (y, x) => toDeg(Math.atan2(y, x)),
        
        // Hiperbólicas
        sinh: Math.sinh,
        cosh: Math.cosh,
        tanh: Math.tanh,
        asinh: Math.asinh,
        acosh: Math.acosh,
        atanh: Math.atanh,
        
        // Logarítmicas y Exponenciales
        log: (x) => Math.log10(x),
        ln: (x) => Math.log(x),
        exp: (x) => Math.exp(x),
        
        // Potencias y Raíces
        sqrt: Math.sqrt,
        cbrt: Math.cbrt,
        nthroot: mathNthRoot,
        abs: Math.abs,
        
        // Combinatoria
        fact: mathFactorial,
        nPr: mathPermutation,
        nCr: mathCombination,
        
        // Constantes
        pi: Math.PI,
        e: Math.E,
        phi: (1 + Math.sqrt(5)) / 2,
        
        // Memoria y Respuestas
        ans: AppState.lastAnswer,
        mr: AppState.memory,
        
        // Utilidades
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        sign: Math.sign
    };
}

/**
 * Prepara una expresión matemática en formato cadena para ser evaluada por JavaScript.
 * Maneja ecuaciones implícitas, multiplicación implícita y funciones avanzadas.
 * @param {string} rawExpr - La expresión cruda ingresada por el usuario.
 * @returns {string} Expresión lista para `new Function`.
 */
function prepareExpression(rawExpr) {
    if (!rawExpr) return '0';
    
    let expr = rawExpr.toLowerCase().trim();
    
    // 3.1. Manejo de ecuaciones con '=' (Implícitas)
    let parts = expr.split('=');
    if (parts.length === 2) {
        let lhs = parts[0].trim();
        let rhs = parts[1].trim();
        
        if (lhs === 'y') {
            expr = rhs; // y = f(x)  -->  f(x)
        } else if (rhs === 'y') {
            expr = lhs; // f(x) = y  -->  f(x)
        } else if (lhs === 'x') {
            expr = rhs;
        } else if (rhs === 'x') {
            expr = lhs;
        } else {
            expr = `(${lhs}) - (${rhs})`; // f(x,y) = g(x,y) --> f(x,y) - g(x,y)
        }
    }

    // 3.2. Sustitución de operadores
    expr = expr.replace(/\^/g, '**'); // Potencias
    expr = expr.replace(/√/g, 'sqrt(');
    expr = expr.replace(/∛/g, 'cbrt(');
    
    // 3.3. Multiplicación implícita
    // Casos: 2x -> 2*x, 2( -> 2*(, )( -> )*(, )x -> )*x, xy -> x*y, 2pi -> 2*pi
    expr = expr.replace(/(\d)([a-zA-Z\_\(])/g, '$1*$2'); 
    expr = expr.replace(/\)([a-zA-Z0-9\_\(])/g, ')*$1');  
    expr = expr.replace(/([xyz])([xyz\(])/g, '$1*$2');  
    expr = expr.replace(/([a-zA-Z0-9\)])(pi|e|phi|ans|mr)/g, '$1*$2');

    // 3.4. Factorial
    // Reemplaza n! por fact(n)
    expr = expr.replace(/(\d+)!/g, 'fact($1)');
    expr = expr.replace(/\)!/g, ')!'); // Proteger parentesis, se manejará en el scope si fuera necesario.

    // 3.5. Notación científica EXP
    // 3EXP4 -> 3*10**4
    expr = expr.replace(/exp(?!\()/g, '*10**');

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
    if (!expr || expr === '0') return 0;
    try {
        const scope = createMathScope();
        // Usamos destructuring para inyectar el scope en el contexto de la función
        const keys = Object.keys(scope);
        const values = Object.values(scope);
        
        const f = new Function('x', 'y', 'z', 'a', 'b', 't', ...keys, `return ${expr};`);
        
        const r = f(x, y, 0, AppState.a, AppState.b, t, ...values);
        
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
        const scope = createMathScope();
        const keys = Object.keys(scope);
        new Function('x', 'y', 'z', 'a', 'b', 't', ...keys, `return ${expr};`);
        return true;
    } catch (e) { 
        return false; 
    }
}

/* =========================================================================
   4. VARIABLES GLOBALES DE THREE.JS
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
let animationFrameId;

/* =========================================================================
   5. AUTENTICACIÓN INSTITUCIONAL
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

// Eventos de Login robustos (Click y Submit)
if (els.startBtn) {
    els.startBtn.addEventListener('click', attemptLogin);
}
if (els.loginForm) {
    els.loginForm.addEventListener('submit', (e) => { 
        e.preventDefault(); 
        attemptLogin(); 
    });
}

/* =========================================================================
   6. INICIALIZADOR PRINCIPAL DE LA CALCULADORA
   ========================================================================= */

/**
 * Inicializa todos los componentes de la calculadora gráfica.
 */
function initCalculator() {
    // 6.1. Poblar Selector de Gráficas
    for (let i = 0; i < MAX_GRAPHS; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = `Gráfica ${i + 1}`;
        els.graphSelector.appendChild(opt);
    }

    // 6.2. Poblar Ejemplos desde la Plantilla HTML
    if (els.examplesTemplate) {
        const items = els.examplesTemplate.content.querySelectorAll('.examples-item');
        items.forEach(item => {
            const clone = item.cloneNode(true);
            clone.addEventListener('click', () => {
                AppState.graphData[AppState.currentGraphIndex].expr = clone.dataset.expr;
                updateDisplay(); 
                updateGraphics(AppState.time); 
                setMode(clone.dataset.mode);
                els.examplesDropdown.classList.remove('show');
            });
            els.examplesDropdown.appendChild(clone);
        });
    }

    // 6.3. Eventos del DOM
    setupUIEvents();
    setupPhysicalKeyboard();
    setupDisplayEditable();

    // 6.4. Inicializar Three.js
    setupThreeJS();
    setupScenes();
    updateColorButtonsUI();
    
    // 6.5. Estado Inicial
    setMode('2D');
    updateDisplay();
    updateGraphics();
    animate();
}

/* =========================================================================
   7. CONFIGURACIÓN DE THREE.JS
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
   8. CREACIÓN DE ESCENAS Y OBJETOS 3D
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
   9. ACTUALIZACIÓN DE GRÁFICAS
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
            const scope = createMathScope();
            const keys = Object.keys(scope);
            new Function('x', 'y', 'z', 'a', 'b', 't', ...keys, `return ${expr};`);
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
   10. CONTROLADORES DE INTERFAZ DE USUARIO (UI)
   ========================================================================= */

function setupUIEvents() {
    // --- Teclado Táctil ---
    els.keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button.key');
        if (!btn) return;
        
        const action = btn.dataset.action;
        const insert = btn.dataset.insert;

        if (action) {
            handleAction(action);
        } else if (insert) {
            insertText(insert);
        }
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
    function hideCalculator() { 
        els.calc.classList.add('hidden-calc'); 
        els.calcToggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'; 
    }
    function showCalculator() { 
        els.calc.classList.remove('hidden-calc'); 
        els.calcToggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.11-.9-2-2-2zm0 14H4V8h16v10zm-8-2c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>'; 
    }

    els.calcToggleBtn.addEventListener('click', () => { 
        els.calc.classList.contains('hidden-calc') ? showCalculator() : hideCalculator(); 
    });
    els.closeCalcBtn.addEventListener('click', (e) => { 
        e.preventDefault(); e.stopPropagation(); hideCalculator(); 
    });

    // --- Botones de Redimensión ---
    els.resizeUpBtn.addEventListener('click', () => adjustCalculatorSize(0.1));
    els.resizeDownBtn.addEventListener('click', () => adjustCalculatorSize(-0.1));

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
        els.display.focus();
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
        els.playBtn.innerHTML = AppState.isPlaying 
            ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' 
            : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    });

    els.screenshotBtn.addEventListener('click', captureScreenshot);
    els.videoBtn.addEventListener('click', toggleVideoRecording);

    // --- Tema ---
    els.themeBtn.addEventListener('click', toggleTheme);

    // --- Modales ---
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
 * Ajusta el tamaño de la fuente y el ancho de la calculadora.
 * @param {number} delta - Incremento o decremento (ej. 0.1 o -0.1).
 */
function adjustCalculatorSize(delta) {
    AppState.fontScale = Math.max(0.8, Math.min(1.6, AppState.fontScale + delta));
    AppState.widthScale = Math.max(0.8, Math.min(1.6, AppState.widthScale + delta));
    
    document.documentElement.style.setProperty('--calc-font-scale', AppState.fontScale);
    document.documentElement.style.setProperty('--calc-width-scale', AppState.widthScale);
}

/**
 * Configura los eventos para la pantalla editable (contenteditable).
 */
function setupDisplayEditable() {
    // Sanitizar al pegar
    els.display.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(text));
        selection.collapseToEnd();
        syncDisplayToState();
    });

    // Sincronizar al escribir
    els.display.addEventListener('input', () => {
        syncDisplayToState();
        updateGraphics(AppState.time);
    });

    // Prevenir formato raro (Enter, etc)
    els.display.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculate();
        }
    });

    // Mostrar cursor nativo y ocultar el visual
    els.display.addEventListener('focus', () => {
        const cursor = els.display.querySelector('.cursor');
        if (cursor) cursor.style.display = 'none';
    });
    
    els.display.addEventListener('blur', () => {
        const cursor = els.display.querySelector('.cursor');
        if (cursor) cursor.style.display = 'inline-block';
    });
}

/**
 * Sincroniza el texto del DOM editable hacia el Estado de la App.
 */
function syncDisplayToState() {
    let text = els.display.innerText;
    // Limpiar caracteres invisibles
    text = text.replace(/\u200B/g, ''); 
    AppState.graphData[AppState.currentGraphIndex].expr = text;
    
    // Validar sintaxis en tiempo real
    if (!validateSyntax(text) && text !== "") {
        els.display.classList.add('error');
    } else {
        els.display.classList.remove('error');
    }
}

/**
 * Maneja las acciones de los botones científicos y de control.
 * @param {string} action 
 */
function handleAction(action) {
    switch (action) {
        case 'clear':
            clearDisplay();
            break;
        case 'backspace':
            backspace();
            break;
        case 'calculate':
            calculate();
            break;
        case 'next':
            nextGraph();
            break;
        case 'toggle-2nd':
            AppState.is2ndActive = !AppState.is2ndActive;
            toggle2ndButtons();
            break;
        case 'toggle-angle':
            AppState.angleMode = AppState.angleMode === 'RAD' ? 'DEG' : 'RAD';
            updateAngleBadge();
            updateGraphics(AppState.time);
            break;
        default:
            // Manejo de Memoria MC, MR, M+, M-
            if (action.startsWith('MC')) { 
                AppState.memory = 0; 
                updateMemoryIndicator(); 
            } else if (action.startsWith('MR')) { 
                insertText(AppState.memory.toString()); 
            } else if (action.startsWith('M+')) { 
                const currentExpr = AppState.graphData[AppState.currentGraphIndex].expr;
                const val = evaluateMath(0,0,0, prepareExpression(currentExpr));
                if (val !== null) { AppState.memory += val; updateMemoryIndicator(); }
            } else if (action.startsWith('M-')) {
                const currentExpr = AppState.graphData[AppState.currentGraphIndex].expr;
                const val = evaluateMath(0,0,0, prepareExpression(currentExpr));
                if (val !== null) { AppState.memory -= val; updateMemoryIndicator(); }
            }
            els.display.focus();
            break;
    }
}

/**
 * Altera el texto de los botones trigonométricos para mostrar funciones hiperbólicas.
 */
function toggle2ndButtons() {
    const buttons = els.keypad.querySelectorAll('.key.sci');
    const map = {
        'sin': 'sinh(', 'sin⁻¹': 'asinh(',
        'cos': 'cosh(', 'cos⁻¹': 'acosh(',
        'tan': 'tanh(', 'tan⁻¹': 'atanh('
    };

    buttons.forEach(btn => {
        const original = btn.dataset.insert;
        const text = btn.innerText;

        if (AppState.is2ndActive) {
            if (map[text]) {
                btn.dataset.insert = map[text];
                btn.innerText = map[text].replace('(', '').replace('⁻¹', '⁻¹');
            }
            btn.style.background = '#3b82f6'; 
            btn.style.color = '#fff';
        } else {
            if (original.includes('sinh') || original.includes('cosh') || original.includes('tanh')) {
                if (original.startsWith('asinh')) { btn.dataset.insert = 'asin('; btn.innerText = 'sin⁻¹'; }
                else if (original.startsWith('acosh')) { btn.dataset.insert = 'acos('; btn.innerText = 'cos⁻¹'; }
                else if (original.startsWith('atanh')) { btn.dataset.insert = 'atan('; btn.innerText = 'tan⁻¹'; }
                else if (original.startsWith('sinh')) { btn.dataset.insert = 'sin('; btn.innerText = 'sin'; }
                else if (original.startsWith('cosh')) { btn.dataset.insert = 'cos('; btn.innerText = 'cos'; }
                else if (original.startsWith('tanh')) { btn.dataset.insert = 'tan('; btn.innerText = 'tan'; }
            }
            btn.style.background = ''; 
            btn.style.color = '';
        }
    });
}

/**
 * Actualiza el indicador visual de memoria.
 */
function updateMemoryIndicator() {
    if (AppState.memory !== 0) {
        els.memoryIndicator.classList.add('active');
    } else {
        els.memoryIndicator.classList.remove('active');
    }
}

/**
 * Actualiza el texto del botón RAD/DEG.
 */
function updateAngleBadge() {
    const radBtn = els.keypad.querySelector('[data-action="toggle-angle"]');
    if (radBtn) radBtn.innerText = AppState.angleMode;
}

/**
 * Soporte para teclado físico (PC).
 */
function setupPhysicalKeyboard() {
    window.addEventListener('keydown', (e) => {
        if (AppState.hasStarted && !els.emailInput.matches(':focus') && !els.helpModal.classList.contains('show')) {
            const key = e.key;
            if (/[a-z0-9+\-*/().^=!]/i.test(key)) {
                insertText(key);
                e.preventDefault();
            } else if (key === 'Backspace') {
                backspace();
                e.preventDefault();
            } else if (key === 'Enter') {
                calculate();
                e.preventDefault();
            }
        }
    });
}

/* =========================================================================
   11. FUNCIONES DE TECLADO Y PANTALLA LCD
   ========================================================================= */

function insertText(char) { 
    // Insertar en la posición del cursor
    els.display.focus();
    const selection = window.getSelection();
    if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(char));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        AppState.graphData[AppState.currentGraphIndex].expr += char; 
    }
    syncDisplayToState();
    updateGraphics(AppState.time); 
}

function clearDisplay() {
    AppState.graphData[AppState.currentGraphIndex].expr = "";
    updateDisplay(); 
    updateGraphics(AppState.time); 
    els.display.focus();
}

function backspace() { 
    // Simular retroceso en contenteditable
    els.display.focus();
    const selection = window.getSelection();
    if (selection.rangeCount && selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        if (range.startOffset > 0) {
            range.setStart(range.startContainer, range.startOffset - 1);
            range.deleteContents();
        }
    } else if (selection.rangeCount) {
        selection.deleteFromDocument();
    }
    syncDisplayToState();
    updateGraphics(AppState.time); 
}

/**
 * ENTER: Compila y fija la gráfica actual en la pantalla.
 */
function calculate() {
    const currentExpr = AppState.graphData[AppState.currentGraphIndex].expr;
    if (currentExpr.trim() === "") return;
    
    if (validateSyntax(currentExpr)) {
        // Guardar como última respuesta si es una expresión evaluable en 1D
        const val = evaluateMath(0,0,0, prepareExpression(currentExpr));
        if (val !== null) AppState.lastAnswer = val;

        updateGraphics(AppState.time); 
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
        els.display.focus();
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
    } else {
        els.display.classList.remove('error');
    }

    // Preservar el foco y la posición del cursor si se está editando
    const isFocused = document.activeElement === els.display;
    if (!isFocused) {
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
   12. MULTIMEDIA Y TEMA
   ========================================================================= */

function captureScreenshot() {
    renderer.render(scene, camera);
    try {
        const dataURL = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL; 
        link.download = 'grafica_cientifica.png';
        document.body.appendChild(link); 
        link.click(); 
        document.body.removeChild(link);
        els.screenshotBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        setTimeout(() => {
            els.screenshotBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 10.5l4.77-8.26C13.47 2.09 12.75 2 12 2c-2.4 0-4.6.85-6.32 2.25l3.66 6.35.06-.1zM21.54 9c-.92-2.92-3.15-5.26-6-6.34L11.88 9h9.66zm.26 1h-7.49l.29.5 4.76 8.25C21 16.97 22 14.61 22 12c0-.69-.07-1.35-.2-2zM8.54 12l-3.9-6.75C3.01 7.03 2 9.39 2 12c0 .69.07 1.35.2 2h7.49l-1.15-2zm-6.08 3c.92 2.92 3.15 5.26 6 6.34L12.12 15H2.46zm11.27 0l-3.9 6.76c.7.15 1.42.24 2.17.24 2.4 0 4.6-.85 6.32-2.25l-3.66-6.35-.93 1.6z"/></svg>';
        }, 1500);
    } catch (e) { 
        alert("No se pudo capturar la imagen."); 
    }
}

function toggleVideoRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop(); 
        els.videoBtn.classList.remove('recording'); 
        els.videoBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
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
                a.download = `grabacion_cientifica.${ext}`;
                document.body.appendChild(a); 
                a.click(); 
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };
            mediaRecorder.start(); 
            els.videoBtn.classList.add('recording'); 
            els.videoBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>';
        } catch (e) { 
            alert("Tu navegador no soporta la grabación de video."); 
        }
    }
}

function toggleTheme() {
    AppState.isDarkMode = !AppState.isDarkMode;
    document.documentElement.classList.toggle('dark-mode', AppState.isDarkMode);
    els.themeBtn.innerHTML = AppState.isDarkMode 
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13l2 .01c.55 0 1-.45 1-1s-.45-1-1-1L2 11c-.55 0-1 .45-1 1s.45 1 1 1zm18 0l2 .01c.55 0 1-.45 1-1s-.45-1-1-1l-2 .01c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4C14.92 2.04 14.46 2 14 2h-2z"/></svg>';
    
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
   13. LÓGICA DE MODO (1D, 2D, 3D)
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
        targetPos = new THREE.Vector3(0,0,10); targetLookAt = new THREE.Vector3(0, 0, 0); targetUp = new THREE.Vector3(0, 1, 0);
    } else {
        group3D.visible = true; group2D.visible = false; group1D.visible = false;
        targetPos = new THREE.Vector3(8, 6, 8); targetLookAt = new THREE.Vector3(0, 0, 0); targetUp = new THREE.Vector3(0, 1, 0);
    }

    const startPos = camera.position.clone(), startUp = camera.up.clone(), startTarget = controls.target.clone();
    let progress = 0;
    
    function animateCamera() {
        progress += 0.025; 
        if (progress > 1) progress = 1;
        const ease = 1 - Math.pow(1 - progress, 3); 
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
   14. INTERACCIÓN Y TOOLTIPS
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
   15. UTILIDADES Y RESIZE
   ========================================================================= */

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    const isNowMobile = window.innerWidth <= 768;
    if (isNowMobile !== AppState.isMobile) location.reload(); 
}

/* =========================================================================
   16. LOOP PRINCIPAL DE ANIMACIÓN
   ========================================================================= */

/**
 * Loop de renderizado infinito. Se ejecuta 60 veces por segundo.
 */
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    controls.update();
    
    if (AppState.isPlaying) {
        AppState.time += 0.05;
        if (AppState.time > Math.PI * 2) AppState.time = 0; 
        updateGraphics(AppState.time);
    }
    
    renderer.render(scene, camera);
}

/* =========================================================================
   17. MANEJO DE ERRORES GLOBAL
   ========================================================================= */
window.onerror = function(message, source, lineno, colno, error) {
    console.error("Error capturado:", message, "en línea:", lineno);
    // Prevenir que la app se congele por errores de sintaxis del usuario
    if (message.includes("Unexpected token") || message.includes("is not defined")) {
        els.display.classList.add('error');
    }
    return true;
};
```
