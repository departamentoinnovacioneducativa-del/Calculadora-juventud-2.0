'use strict';

/* =========================================================================
   1. CONFIGURACIÓN GLOBAL Y ESTADO DE LA APLICACIÓN
   ========================================================================= */

const MAX_GRAPHS = 10;

const GRAPH_COLORS = [
    0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0x8B5CF6,
    0xEC4899, 0x14B8A6, 0xF97316, 0x6366F1, 0x0F172A
];

const CURVE_RESOLUTION = 500;
const MESH_SEGMENTS = 85; // Equilibrio óptimo entre nitidez y 60fps en móviles

const AppState = {
    /** @type {Array<{expr: string, color: number, visible: boolean, compiled: Object|null, isImplicit: boolean}>} */
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
    angleMode: 'RAD', // 'RAD' | 'DEG'
    is2ndActive: false,
    nativeKeyboardEnabled: false,
    memory: 0,
    lastAnswer: 0,
    fontScale: 1.0,
    widthScale: 1.0
};

for (let i = 0; i < MAX_GRAPHS; i++) {
    AppState.graphData.push({
        expr: '',
        color: GRAPH_COLORS[i],
        visible: true,
        compiled: null,
        isImplicit: false
    });
}
AppState.graphData[0].expr = '0.5 * sin(x * a + t) + 1';

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
   2. CACHÉ DE REFERENCIAS DOM
   ========================================================================= */

const els = {
    splash: document.getElementById('splash-screen'),
    startBtn: document.getElementById('start-btn'),
    loginForm: document.getElementById('login-form'),
    emailInput: document.getElementById('email-input'),
    errorMsg: document.getElementById('error-msg'),

    display: document.getElementById('display'),
    latexPreview: document.getElementById('latex-preview'),
    evalResult: document.getElementById('eval-result'),
    screenLabel: document.getElementById('screen-label'),
    memoryIndicator: document.getElementById('memory-indicator'),

    valA: document.getElementById('val-a'),
    valB: document.getElementById('val-b'),
    statusText: document.getElementById('status-text'),
    statusDot: document.getElementById('status-dot'),
    hudAngleBadge: document.getElementById('hud-angle-badge'),
    tooltip: document.getElementById('tooltip'),

    calc: document.getElementById('calculator'),
    calcHeader: document.getElementById('calc-header'),
    mobileKbBtn: document.getElementById('mobile-kb-btn'),
    keypad: document.getElementById('keypad'),

    graphSelector: document.getElementById('graph-selector'),
    derivGraphBtn: document.getElementById('deriv-graph-btn'),
    deleteGraphBtn: document.getElementById('delete-graph-btn'),

    btn1D: document.getElementById('btn-1d'),
    btn2D: document.getElementById('btn-2d'),
    btn3D: document.getElementById('btn-3d'),

    sliderA: document.getElementById('slider-a'),
    sliderB: document.getElementById('slider-b'),

    themeBtn: document.getElementById('theme-toggle'),
    calcToggleBtn: document.getElementById('calc-toggle'),
    closeCalcBtn: document.getElementById('close-calc-btn'),
    resetCamBtn: document.getElementById('reset-cam-btn'),
    screenshotBtn: document.getElementById('screenshot-btn'),
    videoBtn: document.getElementById('video-btn'),
    playBtn: document.getElementById('play-btn'),
    resizeUpBtn: document.getElementById('calc-resize-up'),
    resizeDownBtn: document.getElementById('calc-resize-down'),

    examplesBtn: document.getElementById('examples-btn'),
    examplesDropdown: document.getElementById('examples-dropdown'),
    examplesTemplate: document.getElementById('examples-template'),
    colorBtns: document.querySelectorAll('.color-btn'),

    helpBtn: document.getElementById('help-btn'),
    helpModal: document.getElementById('help-modal'),
    closeHelpBtn: document.getElementById('close-help-btn')
};

/* =========================================================================
   3. MOTOR ALGEBRAICO CON MATH.JS Y RENDERIZADO KATEX
   ========================================================================= */

/**
 * Normaliza atajos de usuario para que sean 100% compatibles con el parser de Math.js.
 * @param {string} rawExpr
 * @returns {{cleanExpr: string, isImplicit: boolean}}
 */
function normalizeForMathJS(rawExpr) {
    if (!rawExpr || !rawExpr.trim()) return { cleanExpr: '', isImplicit: false };

    let expr = rawExpr.trim()
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/π/g, 'pi')
        .replace(/φ/g, 'phi')
        .replace(/√\(/g, 'sqrt(')
        .replace(/∛\(/g, 'cbrt(');

    let isImplicit = false;

    // Manejo de signos '='
    if (expr.includes('=')) {
        const parts = expr.split('=');
        if (parts.length === 2) {
            const lhs = parts[0].trim();
            const rhs = parts[1].trim();
            if (/^(y|z|f\s*\(.*\))$/i.test(lhs)) {
                expr = rhs;
            } else if (/^(y|z)$/i.test(rhs)) {
                expr = lhs;
            } else if (lhs && rhs) {
                expr = `(${lhs}) - (${rhs})`;
                isImplicit = true;
            }
        }
    }

    return { cleanExpr: expr, isImplicit };
}

/**
 * Construye el diccionario de funciones y constantes para Math.js respetando RAD/DEG.
 */
function buildEvaluationScope(x = 0, y = 0, t = 0) {
    const isDeg = AppState.angleMode === 'DEG';
    const toRad = (v) => (isDeg ? (v * Math.PI) / 180 : v);
    const fromRad = (v) => (isDeg ? (v * 180) / Math.PI : v);

    return {
        x,
        y,
        z: 0,
        t,
        a: AppState.a,
        b: AppState.b,
        pi: Math.PI,
        e: Math.E,
        phi: (1 + Math.sqrt(5)) / 2,
        ans: AppState.lastAnswer,
        mr: AppState.memory,

        // Trigonometría sensible a RAD / DEG
        sin: (v) => Math.sin(toRad(v)),
        cos: (v) => Math.cos(toRad(v)),
        tan: (v) => Math.tan(toRad(v)),
        asin: (v) => fromRad(Math.asin(v)),
        acos: (v) => fromRad(Math.acos(v)),
        atan: (v) => fromRad(Math.atan(v)),
        atan2: (vy, vx) => fromRad(Math.atan2(vy, vx)),

        // Hiperbólicas
        sinh: Math.sinh,
        cosh: Math.cosh,
        tanh: Math.tanh,
        asinh: Math.asinh,
        acosh: Math.acosh,
        atanh: Math.atanh,

        // Logarítmicas y exponenciales
        ln: Math.log,
        log: Math.log10,
        log10: Math.log10,
        exp: Math.exp,

        // Raíces y utilidades
        sqrt: Math.sqrt,
        cbrt: Math.cbrt,
        nthRoot: (val, root = 2) => {
            if (val < 0 && root % 2 === 0) return NaN;
            return Math.sign(val) * Math.pow(Math.abs(val), 1 / root);
        },
        nthroot: (root, val) => {
            if (val < 0 && root % 2 === 0) return NaN;
            return Math.sign(val) * Math.pow(Math.abs(val), 1 / root);
        },
        abs: Math.abs,
        max: Math.max,
        min: Math.min,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        sign: Math.sign,

        // Combinatoria respaldada por Math.js
        nCr: (n, r) => {
            if (typeof window.math !== 'undefined') {
                try { return window.math.combinations(Math.round(n), Math.round(r)); } catch (_) { return NaN; }
            }
            return NaN;
        },
        nPr: (n, r) => {
            if (typeof window.math !== 'undefined') {
                try { return window.math.permutations(Math.round(n), Math.round(r)); } catch (_) { return NaN; }
            }
            return NaN;
        }
    };
}

/**
 * Compila la expresión de una ranura y la guarda en caché para evaluación ultra-rápida.
 * @param {number} index
 * @returns {boolean} True si la expresión es válida
 */
function compileGraphSlot(index) {
    const slot = AppState.graphData[index];
    const { cleanExpr, isImplicit } = normalizeForMathJS(slot.expr);
    slot.isImplicit = isImplicit;

    if (!cleanExpr) {
        slot.compiled = null;
        return true;
    }

    try {
        if (typeof window.math !== 'undefined') {
            const compiled = window.math.compile(cleanExpr);
            // Prueba rápida de evaluación para detectar identificadores desconocidos
            compiled.evaluate(buildEvaluationScope(1, 1, 0));
            slot.compiled = compiled;
            return true;
        }
    } catch (err) {
        slot.compiled = null;
        return false;
    }
    return false;
}

/**
 * Evalúa una ranura previamente compilada pasando únicamente el objeto scope reutilizable.
 */
function evalCompiledSlot(slot, scope) {
    if (!slot || !slot.compiled) return null;
    try {
        const res = slot.compiled.evaluate(scope);
        const num = typeof res === 'number' ? res : (res && typeof res.re === 'number' ? (Math.abs(res.im) < 1e-9 ? res.re : NaN) : Number(res));
        return (typeof num === 'number' && isFinite(num) && !isNaN(num)) ? num : null;
    } catch (_) {
        return null;
    }
}

/**
 * Renderiza la vista previa en formato LaTeX usando KaTeX y actualiza el badge de evaluación.
 */
function renderLatexAndInstantEval() {
    const slot = AppState.graphData[AppState.currentGraphIndex];
    const raw = (slot.expr || '').trim();

    if (!raw) {
        if (els.latexPreview) els.latexPreview.innerHTML = '<span style="opacity:0.4">Ingresa una expresión…</span>';
        if (els.evalResult) els.evalResult.innerText = `ans = ${formatShortNumber(AppState.lastAnswer)}`;
        return;
    }

    const { cleanExpr } = normalizeForMathJS(raw);

    // 1. Renderizado LaTeX con KaTeX + Math.js
    if (els.latexPreview && typeof window.math !== 'undefined' && typeof window.katex !== 'undefined') {
        try {
            const node = window.math.parse(cleanExpr);
            const tex = node.toTex({ parenthesis: 'keep', implicit: 'hide' });
            window.katex.render(tex, els.latexPreview, {
                throwOnError: false,
                displayMode: false
            });
        } catch (_) {
            els.latexPreview.textContent = raw;
        }
    }

    // 2. Evaluación instantánea en (x=0, y=0, t=AppState.time)
    if (els.evalResult && slot.compiled) {
        const scope = buildEvaluationScope(0, 0, AppState.time);
        const val = evalCompiledSlot(slot, scope);
        if (val !== null) {
            els.evalResult.innerText = `f(0) = ${formatShortNumber(val)}`;
        } else {
            els.evalResult.innerText = `ans = ${formatShortNumber(AppState.lastAnswer)}`;
        }
    }
}

function formatShortNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    if (Math.abs(n) >= 1e5 || (Math.abs(n) > 0 && Math.abs(n) < 1e-3)) {
        return n.toExponential(2);
    }
    return Number(n.toFixed(4)).toString();
}

/**
 * Calcula la derivada simbólica respecto a 'x' de la función actual y la asigna a la siguiente ranura.
 */
function computeSymbolicDerivative() {
    if (typeof window.math === 'undefined') return;
    const currentSlot = AppState.graphData[AppState.currentGraphIndex];
    const { cleanExpr } = normalizeForMathJS(currentSlot.expr);
    if (!cleanExpr) return;

    try {
        const derivNode = window.math.derivative(cleanExpr, 'x');
        const derivStr = derivNode.toString();

        // Buscar siguiente ranura vacía o usar la siguiente inmediata
        let targetIdx = (AppState.currentGraphIndex + 1) % MAX_GRAPHS;
        for (let i = 0; i < MAX_GRAPHS; i++) {
            if (!AppState.graphData[i].expr.trim() && i !== AppState.currentGraphIndex) {
                targetIdx = i;
                break;
            }
        }

        AppState.graphData[targetIdx].expr = derivStr;
        compileGraphSlot(targetIdx);

        AppState.currentGraphIndex = targetIdx;
        els.graphSelector.value = targetIdx;
        updateColorButtonsUI();
        updateDisplay();
        updateGraphics(AppState.time);
        pulseCalculator();
    } catch (err) {
        els.display.classList.add('error');
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

/* =========================================================================
   5. AUTENTICACIÓN INSTITUCIONAL
   ========================================================================= */

function attemptLogin() {
    if (AppState.hasStarted) return;
    const email = (els.emailInput.value || '').trim().toLowerCase();

    if (email.endsWith('@juventud.edu.mx') && email.length > '@juventud.edu.mx'.length) {
        AppState.hasStarted = true;
        els.errorMsg.style.display = 'none';
        els.emailInput.blur(); // Cierra el teclado del móvil al iniciar sesión
        els.splash.classList.add('hidden');
        setTimeout(() => { els.splash.style.display = 'none'; }, 550);
        initCalculator();
    } else {
        els.errorMsg.style.display = 'block';
        els.emailInput.focus();
    }
}

if (els.startBtn) {
    els.startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        attemptLogin();
    });
}
if (els.loginForm) {
    els.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        attemptLogin();
    });
}

/* =========================================================================
   6. INICIALIZACIÓN PRINCIPAL
   ========================================================================= */

function initCalculator() {
    // 6.1. Poblar selector de 10 gráficas
    els.graphSelector.innerHTML = '';
    for (let i = 0; i < MAX_GRAPHS; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = `f${i + 1}(x, y, t)`;
        els.graphSelector.appendChild(opt);
    }

    // 6.2. Poblar catálogo de ejemplos
    if (els.examplesTemplate) {
        els.examplesDropdown.innerHTML = '';
        const items = els.examplesTemplate.content.querySelectorAll('.examples-item');
        items.forEach(item => {
            const clone = item.cloneNode(true);
            clone.addEventListener('click', () => {
                const slot = AppState.graphData[AppState.currentGraphIndex];
                slot.expr = clone.dataset.expr;
                compileGraphSlot(AppState.currentGraphIndex);
                updateDisplay();
                setMode(clone.dataset.mode);
                updateGraphics(AppState.time);
                els.examplesDropdown.classList.remove('show');
            });
            els.examplesDropdown.appendChild(clone);
        });
    }

    // 6.3. Compilar gráfica inicial
    compileGraphSlot(0);

    // 6.4. Eventos de interfaz, teclado y gestos móviles
    setupUIEvents();
    setupPhysicalKeyboard();
    setupDisplayEditable();
    setupMobileSwipeGesture();

    // 6.5. Inicializar motor gráfico Three.js
    setupThreeJS();
    setupScenes();
    updateColorButtonsUI();

    // 6.6. Render inicial
    setMode('2D');
    updateDisplay();
    updateGraphics(0);
    animate();
}

/* =========================================================================
   7. CONFIGURACIÓN DE THREE.JS Y ESCENAS 1D / 2D / 3D
   ========================================================================= */

function setupThreeJS() {
    const container = document.getElementById('viewport');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(THEMES.light.bg);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.screenSpacePanning = true;

    raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.25;

    ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(6, 12, 8);
    scene.add(dirLight);
}

function setupScenes() {
    // --- ESCENA 3D ---
    group3D = new THREE.Group();
    scene.add(group3D);

    for (let i = 0; i < MAX_GRAPHS; i++) {
        const geo = new THREE.PlaneGeometry(14, 14, MESH_SEGMENTS, MESH_SEGMENTS);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            roughness: 0.35,
            metalness: 0.1,
            transparent: true,
            opacity: 0.82
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        group3D.add(mesh);
        meshes3D.push({ geo, mat, mesh });
    }

    gridHelper3D = new THREE.GridHelper(20, 20, THEMES.light.grid3D_center, THEMES.light.grid3D_base);
    group3D.add(gridHelper3D);
    axesHelper3D = new THREE.AxesHelper(3);
    group3D.add(axesHelper3D);

    // --- ESCENA 2D ---
    group2D = new THREE.Group();
    scene.add(group2D);

    const planeMat = new THREE.MeshBasicMaterial({ color: THEMES.light.paper, side: THREE.DoubleSide });
    paperPlane = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), planeMat);
    paperPlane.position.z = -0.05;
    group2D.add(paperPlane);

    grid2DMat = new THREE.LineBasicMaterial({ color: THEMES.light.grid });
    const grid2DGroup = new THREE.Group();
    for (let i = -8; i <= 8; i++) {
        grid2DGroup.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -6, 0), new THREE.Vector3(i, 6, 0)]),
            grid2DMat
        ));
    }
    for (let i = -6; i <= 6; i++) {
        grid2DGroup.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, i, 0), new THREE.Vector3(8, i, 0)]),
            grid2DMat
        ));
    }
    group2D.add(grid2DGroup);

    axisMat = new THREE.LineBasicMaterial({ color: THEMES.light.axes });
    group2D.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)]),
        axisMat
    ));
    group2D.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -6, 0), new THREE.Vector3(0, 6, 0)]),
        axisMat
    ));

    for (let i = 0; i < MAX_GRAPHS; i++) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CURVE_RESOLUTION * 3), 3));
        const mat = new THREE.LineBasicMaterial({ color: GRAPH_COLORS[i], linewidth: 2 });
        const line = new THREE.Line(geo, mat);
        line.frustumCulled = false;
        line.visible = false;
        group2D.add(line);
        curves2D.push({ geo, mat, line });
    }

    // --- ESCENA 1D ---
    group1D = new THREE.Group();
    scene.add(group1D);
    axis1DMat = new THREE.LineBasicMaterial({ color: THEMES.light.axes });
    group1D.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)]),
        axis1DMat
    ));
    for (let i = -10; i <= 10; i++) {
        const tickGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i, -0.2, 0),
            new THREE.Vector3(i, 0.2, 0)
        ]);
        group1D.add(new THREE.Line(tickGeo, axis1DMat));
    }
    rebuild1DLabels('#0f172a');

    for (let i = 0; i < MAX_GRAPHS; i++) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 20, 20),
            new THREE.MeshBasicMaterial({ color: GRAPH_COLORS[i] })
        );
        mesh.visible = false;
        group1D.add(mesh);
        pointers1D.push(mesh);
    }

    // Puntero interactivo para coordenadas
    mouse = new THREE.Vector2();
    pointerMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    pointerMesh.visible = false;
    scene.add(pointerMesh);
}

function createTextSprite(text, color = '#000000') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    return new THREE.Sprite(material);
}

function rebuild1DLabels(color) {
    textSprites1D.forEach(s => {
        group1D.remove(s);
        s.material.map.dispose();
        s.material.dispose();
    });
    textSprites1D = [];
    for (let i = -10; i <= 10; i += 2) {
        const sprite = createTextSprite(i.toString(), color);
        sprite.position.set(i, -0.75, 0);
        sprite.scale.set(1.1, 0.55, 1);
        group1D.add(sprite);
        textSprites1D.push(sprite);
    }
}

/* =========================================================================
   8. ACTUALIZACIÓN OPTIMIZADA DE GRÁFICAS (1D / 2D / 3D)
   ========================================================================= */

function updateGraphics(t = 0) {
    // Reutilizamos un único objeto scope por ciclo para evitar Garbage Collection masivo
    const scope = buildEvaluationScope(0, 0, t);

    for (let i = 0; i < MAX_GRAPHS; i++) {
        const g = AppState.graphData[i];

        if (!g.expr.trim() || !g.visible || !g.compiled) {
            if (curves2D[i]) curves2D[i].line.visible = false;
            if (meshes3D[i]) meshes3D[i].mesh.visible = false;
            if (pointers1D[i]) pointers1D[i].visible = false;
            continue;
        }

        // --- MODO 1D ---
        if (AppState.mode === '1D') {
            scope.x = 0;
            scope.y = 0;
            const val1D = evalCompiledSlot(g, scope);
            if (val1D !== null) {
                pointers1D[i].position.set(THREE.MathUtils.clamp(val1D, -10, 10), 0, 0);
                pointers1D[i].material.color.setHex(g.color);
                pointers1D[i].visible = true;
            } else {
                pointers1D[i].visible = false;
            }
            if (curves2D[i]) curves2D[i].line.visible = false;
            if (meshes3D[i]) meshes3D[i].mesh.visible = false;
        }

        // --- MODO 2D (con filtro de asíntotas) ---
        else if (AppState.mode === '2D') {
            const pos2D = curves2D[i].geo.attributes.position;
            let prevY = null;

            for (let j = 0; j < CURVE_RESOLUTION; j++) {
                const x = (j / (CURVE_RESOLUTION - 1)) * 16 - 8;
                scope.x = x;
                scope.y = 0;
                const y = evalCompiledSlot(g, scope);

                // Filtrar discontinuidades/asíntotas (ej. tan(x), 1/x)
                if (y !== null && Math.abs(y) <= 25 && (prevY === null || Math.abs(y - prevY) < 12)) {
                    pos2D.setXYZ(j, x, THREE.MathUtils.clamp(y, -6, 6), 0);
                    prevY = y;
                } else {
                    pos2D.setXYZ(j, x, prevY !== null ? THREE.MathUtils.clamp(prevY, -6, 6) : 0, 0);
                    prevY = null;
                }
            }
            pos2D.needsUpdate = true;
            curves2D[i].mat.color.setHex(g.color);
            curves2D[i].line.visible = true;
            if (meshes3D[i]) meshes3D[i].mesh.visible = false;
            if (pointers1D[i]) pointers1D[i].visible = false;
        }

        // --- MODO 3D ---
        else if (AppState.mode === '3D') {
            const pos3D = meshes3D[i].geo.attributes.position;
            const col3D = meshes3D[i].geo.attributes.color;
            const cLow = new THREE.Color(g.color);
            const cHigh = new THREE.Color(0xffffff);
            const tempC = new THREE.Color();

            for (let j = 0; j < pos3D.count; j++) {
                const x = pos3D.getX(j);
                const y = pos3D.getZ(j);
                scope.x = x;
                scope.y = y;

                const z = evalCompiledSlot(g, scope);
                if (z !== null) {
                    const clampedZ = THREE.MathUtils.clamp(z, -8, 8);
                    pos3D.setY(j, clampedZ);
                    const tCol = THREE.MathUtils.clamp((clampedZ + 4) / 8, 0, 1);
                    tempC.lerpColors(cLow, cHigh, tCol * 0.65);
                    col3D.setXYZ(j, tempC.r, tempC.g, tempC.b);
                } else {
                    pos3D.setY(j, 0);
                    col3D.setXYZ(j, cLow.r, cLow.g, cLow.b);
                }
            }
            pos3D.needsUpdate = true;
            col3D.needsUpdate = true;
            meshes3D[i].geo.computeVertexNormals();
            meshes3D[i].mesh.visible = true;
            if (curves2D[i]) curves2D[i].line.visible = false;
            if (pointers1D[i]) pointers1D[i].visible = false;
        }
    }

    renderLatexAndInstantEval();
}

/* =========================================================================
   9. EVENTOS DE INTERFAZ Y COMPATIBILIDAD IPHONE / ANDROID / PC
   ========================================================================= */

function setupUIEvents() {
    // Teclado Científico Virtual
    els.keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button.key');
        if (!btn) return;

        const action = btn.dataset.action;
        const insert = btn.dataset.insert;

        if (action) {
            handleAction(action);
        } else if (insert !== undefined) {
            insertText(insert);
        }
    });

    // Botón para activar/desactivar teclado nativo del móvil (útil para pegar en iPhone/Android)
    if (els.mobileKbBtn) {
        els.mobileKbBtn.addEventListener('click', () => {
            AppState.nativeKeyboardEnabled = !AppState.nativeKeyboardEnabled;
            els.display.setAttribute('inputmode', AppState.nativeKeyboardEnabled ? 'text' : 'none');
            els.mobileKbBtn.classList.toggle('active', AppState.nativeKeyboardEnabled);
            if (AppState.nativeKeyboardEnabled) {
                els.display.focus();
            } else {
                els.display.blur();
            }
        });
    }

    // Sliders A y B
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

    // Conmutadores 1D / 2D / 3D
    els.btn1D.addEventListener('click', () => setMode('1D'));
    els.btn2D.addEventListener('click', () => setMode('2D'));
    els.btn3D.addEventListener('click', () => setMode('3D'));

    // Mostrar / Ocultar Calculadora
    els.calcToggleBtn.addEventListener('click', () => {
        els.calc.classList.contains('hidden-calc') ? showCalculator() : hideCalculator();
    });

    els.closeCalcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideCalculator();
    });

    // Centrar cámara
    if (els.resetCamBtn) {
        els.resetCamBtn.addEventListener('click', () => setMode(AppState.mode, true));
    }

    // Escala de calculadora
    els.resizeUpBtn.addEventListener('click', () => adjustCalculatorSize(0.08));
    els.resizeDownBtn.addEventListener('click', () => adjustCalculatorSize(-0.08));

    // Selector de ranura de gráfica
    els.graphSelector.addEventListener('change', (e) => {
        AppState.currentGraphIndex = parseInt(e.target.value, 10);
        compileGraphSlot(AppState.currentGraphIndex);
        updateColorButtonsUI();
        updateDisplay();
        updateGraphics(AppState.time);
    });

    // Botón de derivada simbólica d/dx
    if (els.derivGraphBtn) {
        els.derivGraphBtn.addEventListener('click', computeSymbolicDerivative);
    }

    // Borrar función actual
    els.deleteGraphBtn.addEventListener('click', () => {
        clearDisplay();
    });

    // Selector de color
    els.colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            AppState.graphData[AppState.currentGraphIndex].color = parseInt(btn.dataset.color, 16);
            updateColorButtonsUI();
            updateGraphics(AppState.time);
        });
    });

    // Menú de ejemplos
    els.examplesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        els.examplesDropdown.classList.toggle('show');
    });
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
            els.examplesDropdown.classList.remove('show');
        }
    });

    // Animación temporal (t)
    els.playBtn.addEventListener('click', () => {
        AppState.isPlaying = !AppState.isPlaying;
        els.playBtn.innerHTML = AppState.isPlaying
            ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    });

    els.screenshotBtn.addEventListener('click', captureScreenshot);
    els.videoBtn.addEventListener('click', toggleVideoRecording);
    els.themeBtn.addEventListener('click', toggleTheme);

    // Modal de ayuda
    els.helpBtn.addEventListener('click', () => els.helpModal.classList.add('show'));
    els.closeHelpBtn.addEventListener('click', () => els.helpModal.classList.remove('show'));
    els.helpModal.addEventListener('click', (e) => {
        if (e.target === els.helpModal) els.helpModal.classList.remove('show');
    });

    // Puntero de coordenadas en lienzo
    window.addEventListener('mousemove', (e) => {
        if (!e.target.closest('.calculator-container') && !e.target.closest('.top-controls-bar')) {
            handlePointer(e.clientX, e.clientY);
        } else {
            hideTooltip();
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && !e.touches[0].target.closest('.calculator-container')) {
            handlePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    window.addEventListener('touchend', hideTooltip, { passive: true });
    window.addEventListener('resize', handleResize);
}

function hideCalculator() {
    els.calc.classList.add('hidden-calc');
}

function showCalculator() {
    els.calc.classList.remove('hidden-calc');
}

/**
 * Permite deslizar hacia abajo la cabecera de la calculadora en iPhone y Android para minimizarla.
 */
function setupMobileSwipeGesture() {
    if (!els.calcHeader) return;
    let startY = 0;

    els.calcHeader.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) startY = e.touches[0].clientY;
    }, { passive: true });

    els.calcHeader.addEventListener('touchend', (e) => {
        if (!startY || e.changedTouches.length === 0) return;
        const deltaY = e.changedTouches[0].clientY - startY;
        if (deltaY > 45 && window.innerWidth <= 768) {
            hideCalculator();
        }
        startY = 0;
    }, { passive: true });
}

function adjustCalculatorSize(delta) {
    AppState.fontScale = Math.max(0.8, Math.min(1.45, AppState.fontScale + delta));
    AppState.widthScale = Math.max(0.85, Math.min(1.45, AppState.widthScale + delta));

    document.documentElement.style.setProperty('--calc-font-scale', AppState.fontScale.toFixed(2));
    document.documentElement.style.setProperty('--calc-width-scale', AppState.widthScale.toFixed(2));
}

/* =========================================================================
   10. PANTALLA LCD EDITABLE Y TECLADO FÍSICO (SIN DOBLE ESCRITURA)
   ========================================================================= */

function setupDisplayEditable() {
    els.display.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\r?\n/g, '');
        insertText(text);
    });

    els.display.addEventListener('input', () => {
        syncDisplayToState();
    });

    els.display.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculate();
        }
        // Evitar que el listener global duplique la tecla cuando el usuario edita directamente en #display
        e.stopPropagation();
    });
}

function syncDisplayToState() {
    const rawText = els.display.innerText.replace(/\u200B/g, '').trim();
    const text = rawText === '0' ? '' : rawText;
    AppState.graphData[AppState.currentGraphIndex].expr = text;

    const isValid = compileGraphSlot(AppState.currentGraphIndex);
    els.display.classList.toggle('error', !isValid && text !== '');

    updateGraphics(AppState.time);
}

function setupPhysicalKeyboard() {
    window.addEventListener('keydown', (e) => {
        if (!AppState.hasStarted) return;
        if (document.activeElement === els.emailInput || document.activeElement === els.display) return;
        if (els.helpModal.classList.contains('show')) {
            if (e.key === 'Escape') els.helpModal.classList.remove('show');
            return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const key = e.key;
        if (/^[a-z0-9+\-*/().,^!]$/i.test(key)) {
            e.preventDefault();
            insertText(key);
        } else if (key === 'Backspace') {
            e.preventDefault();
            backspace();
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calculate();
        } else if (key === 'Escape') {
            e.preventDefault();
            clearDisplay();
        }
    });
}

/* =========================================================================
   11. ACCIONES CIENTÍFICAS, MEMORIA Y EDICIÓN DE EXPRESIONES
   ========================================================================= */

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
        case 'MC':
            AppState.memory = 0;
            updateMemoryIndicator();
            break;
        case 'MR':
            insertText(formatShortNumber(AppState.memory));
            break;
        case 'M+': {
            const slot = AppState.graphData[AppState.currentGraphIndex];
            const val = evalCompiledSlot(slot, buildEvaluationScope(0, 0, AppState.time));
            if (val !== null) {
                AppState.memory += val;
                updateMemoryIndicator();
            }
            break;
        }
        case 'M-': {
            const slot = AppState.graphData[AppState.currentGraphIndex];
            const val = evalCompiledSlot(slot, buildEvaluationScope(0, 0, AppState.time));
            if (val !== null) {
                AppState.memory -= val;
                updateMemoryIndicator();
            }
            break;
        }
    }
}

function toggle2ndButtons() {
    const secondBtn = els.keypad.querySelector('[data-action="toggle-2nd"]');
    if (secondBtn) secondBtn.classList.toggle('active-mode', AppState.is2ndActive);

    const trigBtns = els.keypad.querySelectorAll('.trig-btn');
    trigBtns.forEach(btn => {
        if (AppState.is2ndActive) {
            btn.dataset.insert = btn.dataset.secondary;
            btn.innerText = btn.dataset.labelSec;
        } else {
            btn.dataset.insert = btn.dataset.primary;
            btn.innerText = btn.dataset.labelPri;
        }
    });
}

function updateMemoryIndicator() {
    els.memoryIndicator.classList.toggle('active', Math.abs(AppState.memory) > 1e-12);
    els.memoryIndicator.title = `Memoria: ${AppState.memory}`;
}

function updateAngleBadge() {
    const radBtn = els.keypad.querySelector('[data-action="toggle-angle"]');
    if (radBtn) radBtn.innerText = AppState.angleMode;
    if (els.hudAngleBadge) els.hudAngleBadge.innerText = AppState.angleMode;
}

/**
 * Inserta texto en la expresión actual sin disparar el teclado nativo en celulares/iPhone.
 */
function insertText(str) {
    const slot = AppState.graphData[AppState.currentGraphIndex];
    slot.expr = (slot.expr || '') + str;

    const isValid = compileGraphSlot(AppState.currentGraphIndex);
    els.display.classList.toggle('error', !isValid && slot.expr !== '');

    updateDisplay();
    updateGraphics(AppState.time);
}

function clearDisplay() {
    const slot = AppState.graphData[AppState.currentGraphIndex];
    slot.expr = '';
    slot.compiled = null;
    els.display.classList.remove('error');
    updateDisplay();
    updateGraphics(AppState.time);
}

function backspace() {
    const slot = AppState.graphData[AppState.currentGraphIndex];
    if (!slot.expr) return;

    // Borrar tokens completos si termina en función (ej. "sin(", "sqrt(", "asin(")
    const funcMatch = slot.expr.match(/(asinh|acosh|atanh|sinh|cosh|tanh|asin|acos|atan|sqrt|cbrt|nthRoot|log10|sin|cos|tan|exp|abs|nPr|nCr|ln)\($/);
    if (funcMatch) {
        slot.expr = slot.expr.slice(0, -funcMatch[0].length);
    } else {
        slot.expr = slot.expr.slice(0, -1);
    }

    const isValid = compileGraphSlot(AppState.currentGraphIndex);
    els.display.classList.toggle('error', !isValid && slot.expr !== '');

    updateDisplay();
    updateGraphics(AppState.time);
}

function calculate() {
    const slot = AppState.graphData[AppState.currentGraphIndex];
    if (!slot.expr.trim()) return;

    if (compileGraphSlot(AppState.currentGraphIndex)) {
        const val = evalCompiledSlot(slot, buildEvaluationScope(0, 0, AppState.time));
        if (val !== null) {
            AppState.lastAnswer = val;
        }
        updateGraphics(AppState.time);
        pulseCalculator();
    } else {
        els.display.classList.add('error');
    }
}

function nextGraph() {
    AppState.currentGraphIndex = (AppState.currentGraphIndex + 1) % MAX_GRAPHS;
    els.graphSelector.value = AppState.currentGraphIndex;
    compileGraphSlot(AppState.currentGraphIndex);
    updateColorButtonsUI();
    updateDisplay();
    updateGraphics(AppState.time);
    pulseCalculator();
}

function pulseCalculator() {
    els.calc.classList.add('pulse');
    setTimeout(() => els.calc.classList.remove('pulse'), 300);
}

function updateDisplay() {
    const slot = AppState.graphData[AppState.currentGraphIndex];
    const text = slot.expr || '';
    els.screenLabel.innerText = `f${AppState.currentGraphIndex + 1}(x, y, t) =`;

    const displayText = text === '' ? '0' : text;
    if (document.activeElement !== els.display) {
        els.display.textContent = displayText;
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'cursor';
        els.display.appendChild(cursorSpan);
    }
    renderLatexAndInstantEval();
}

function updateColorButtonsUI() {
    const activeColor = AppState.graphData[AppState.currentGraphIndex].color;
    els.colorBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.color, 16) === activeColor);
    });
}

/* =========================================================================
   12. CAPTURA MULTIMEDIA Y TEMAS
   ========================================================================= */

function captureScreenshot() {
    renderer.render(scene, camera);
    try {
        const dataURL = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `grafica_juventud_${AppState.mode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (_) {
        alert('No se pudo exportar la captura de pantalla en este dispositivo.');
    }
}

function toggleVideoRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        els.videoBtn.classList.remove('recording');
    } else {
        try {
            if (!renderer.domElement.captureStream || typeof MediaRecorder === 'undefined') {
                alert('La grabación directa de video WebGL no está habilitada en este navegador móvil.');
                return;
            }
            const stream = renderer.domElement.captureStream(30);
            let options = { mimeType: 'video/webm' };
            if (!MediaRecorder.isTypeSupported('video/webm')) {
                options = MediaRecorder.isTypeSupported('video/mp4') ? { mimeType: 'video/mp4' } : {};
            }

            mediaRecorder = new MediaRecorder(stream, options);
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const isMp4 = options.mimeType && options.mimeType.includes('mp4');
                const ext = isMp4 ? 'mp4' : 'webm';
                const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `animacion_juventud.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };
            mediaRecorder.start();
            els.videoBtn.classList.add('recording');
        } catch (_) {
            alert('Tu navegador no permite grabar el lienzo WebGL directamente.');
        }
    }
}

function toggleTheme() {
    AppState.isDarkMode = !AppState.isDarkMode;
    document.documentElement.classList.toggle('dark-mode', AppState.isDarkMode);

    const theme = AppState.isDarkMode ? THEMES.dark : THEMES.light;
    scene.background.setHex(theme.bg);
    paperPlane.material.color.setHex(theme.paper);
    grid2DMat.color.setHex(theme.grid);
    axisMat.color.setHex(theme.axes);
    axis1DMat.color.setHex(theme.axes);
    rebuild1DLabels(AppState.isDarkMode ? '#f1f5f9' : '#0f172a');

    group3D.remove(gridHelper3D);
    gridHelper3D.geometry.dispose();
    gridHelper3D.material.dispose();
    gridHelper3D = new THREE.GridHelper(20, 20, theme.grid3D_center, theme.grid3D_base);
    group3D.add(gridHelper3D);
}

/* =========================================================================
   13. CAMBIO DE DIMENSIÓN (1D / 2D / 3D) Y CÁMARA
   ========================================================================= */

function setMode(mode, forceReset = false) {
    if (AppState.isAnimating && AppState.mode === mode && !forceReset) return;
    AppState.mode = mode;
    AppState.isAnimating = true;

    els.btn1D.classList.toggle('active', mode === '1D');
    els.btn2D.classList.toggle('active', mode === '2D');
    els.btn3D.classList.toggle('active', mode === '3D');

    els.btn1D.setAttribute('aria-selected', mode === '1D');
    els.btn2D.setAttribute('aria-selected', mode === '2D');
    els.btn3D.setAttribute('aria-selected', mode === '3D');

    els.statusText.innerText = `MODO ${mode}`;
    els.statusDot.style.background = mode === '2D' ? '#22c55e' : (mode === '3D' ? '#3b82f6' : '#fbbf24');

    group1D.visible = (mode === '1D');
    group2D.visible = (mode === '2D');
    group3D.visible = (mode === '3D');

    updateGraphics(AppState.time);

    const targetPos = mode === '3D' ? new THREE.Vector3(9, 7, 9) : new THREE.Vector3(0, 0, 11);
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    const targetUp = new THREE.Vector3(0, 1, 0);

    const startPos = camera.position.clone();
    const startUp = camera.up.clone();
    const startTarget = controls.target.clone();
    let progress = 0;

    function animateCamera() {
        progress += 0.05;
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
   14. RAYCASTER Y TOOLTIP DE COORDENADAS
   ========================================================================= */

function handlePointer(clientX, clientY) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    if (clientX > rect.right || clientX < rect.left || clientY > rect.bottom || clientY < rect.top) {
        hideTooltip();
        return;
    }

    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const targetGroup = AppState.mode === '2D' ? group2D : (AppState.mode === '3D' ? group3D : group1D);

    const intersects = raycaster.intersectObject(targetGroup, true);
    if (intersects.length > 0) {
        const pt = intersects[0].point;
        pointerMesh.position.copy(pt);
        pointerMesh.visible = true;
        els.tooltip.style.display = 'block';
        els.tooltip.style.left = `${Math.min(clientX + 14, window.innerWidth - 150)}px`;
        els.tooltip.style.top = `${Math.max(clientY - 36, 12)}px`;

        if (AppState.mode === '2D') {
            els.tooltip.innerText = `x: ${pt.x.toFixed(2)}, y: ${pt.y.toFixed(2)}`;
        } else if (AppState.mode === '3D') {
            els.tooltip.innerText = `x: ${pt.x.toFixed(2)}, y: ${pt.z.toFixed(2)}, z: ${pt.y.toFixed(2)}`;
        } else {
            els.tooltip.innerText = `Valor: ${pt.x.toFixed(3)}`;
        }
    } else {
        hideTooltip();
    }
}

function hideTooltip() {
    if (pointerMesh) pointerMesh.visible = false;
    if (els.tooltip) els.tooltip.style.display = 'none';
}

/* =========================================================================
   15. REDIMENSIÓN ADAPTATIVA (SIN RECARGAR LA PÁGINA EN MÓVILES)
   ========================================================================= */

function handleResize() {
    AppState.isMobile = window.innerWidth <= 768;
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* =========================================================================
   16. LOOP PRINCIPAL DE RENDERIZADO (60 FPS)
   ========================================================================= */

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();

    if (AppState.isPlaying) {
        AppState.time += 0.04;
        if (AppState.time > Math.PI * 20) AppState.time = 0;
        updateGraphics(AppState.time);
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}
