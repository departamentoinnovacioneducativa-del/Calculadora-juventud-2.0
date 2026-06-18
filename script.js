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
    resizeHandle: document.getElementById('resize-handle'),
    examplesBtn: document.getElementById('examples-btn'),
    examplesDropdown: document.getElementById('examples-dropdown'),
    colorBtns: document.querySelectorAll('.color-btn')
};

// =========================================
// PANTALLA DE INICIO (SPLASH SCREEN)
// =========================================
// No inicializamos nada hasta que se haga clic
els.startBtn.addEventListener('click', () => {
    if (AppState.hasStarted) return;
    AppState.hasStarted = true;
    
    // Ocultar splash
    els.splash.classList.add('hidden');
    setTimeout(() => els.splash.style.display = 'none', 600);

    // Iniciar la calculadora
    initCalculator();
});

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

// Variables globales de Three.js (se declaran aquí, se inicializan en initCalculator)
let scene, camera, renderer, controls, raycaster;
let group3D, geometry3D, material3D, mesh3D, gridHelper3D, axesHelper3D;
let group2D, paperPlane, grid2DMat, axisMat, curve2DGeo, curve2DMat, curve2D;
let ambientLight, dirLight;
let mouse, pointerMesh;

// =========================================
// INICIALIZADOR PRINCIPAL
// =========================================
function initCalculator() {
    // Poblar ejemplos
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

    // Selector de Color
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

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
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
    // 3D
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

    // 2D
    group2D = new THREE.Group(); scene.add(group2D);
    const planeMat = new THREE.MeshBasicMaterial({ color: themes.light.paper, side: THREE.DoubleSide });
    paperPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), planeMat);
    paperPlane.position.z = -0.1; group2D.add(paperPlane);

    grid2DMat = new THREE.LineBasicMaterial({ color: themes.light.grid });
    const grid2DGroup = new THREE.Group();
    
    // CORRECCIÓN: Añadido new THREE.Line correctamente
    for (let i = -6; i <= 6; i++) {
        grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -
