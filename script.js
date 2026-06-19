// =========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// =========================================
const AppState = {
    expression: "0.5 * sin(x * a + t) + 1",
    a: 1.0,
    b: 1.0,
    mode: '2D',
    graphColor: 0x006847,
    isMobile: window.innerWidth <= 768,
    isAnimating: false,
    isPlaying: false,
    time: 0,
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
let group3D, geometry3D, material3D, mesh3D, gridHelper3D, axesHelper3D;
let group2D, paperPlane, grid2DMat, axisMat, curve2DGeo, curve2DMat, curve2D;
let group1D, axis1DMat, pointer1DMesh;
let ambientLight, dirLight;
let mouse, pointerMesh;
let mediaRecorder; 

// =========================================
// INICIALIZADOR PRINCIPAL
// =========================================
function initCalculator