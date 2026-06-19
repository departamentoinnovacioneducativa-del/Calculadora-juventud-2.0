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
function initCalculator() {
    examples.forEach(ex => {
        const item = document.createElement('div');
        item.className = 'examples-item';
        item.innerText = ex.name;
        item.addEventListener('click', () => {
            AppState.expression = ex.expr;
            updateDisplay(); updateGraphics(AppState.time); setMode(ex.mode);
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
            updateGraphics(AppState.time);
        });
    });

    setupThreeJS();
    setupScenes();
    setupEvents();

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
    camera.position.set(0, 0, 10); 
    camera.up.set(0, 1, 0); 
    camera.lookAt(0, 0, 0);

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

    ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5); dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
}

// =========================================
// ESCENAS 3D, 2D Y 1D
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
    for (let i = -6; i <= 6; i++) grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -4, 0), new THREE.Vector3(i, 4, 0)]), grid2DMat));
    for (let i = -4; i <= 4; i++) grid2DGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, i, 0), new THREE.Vector3(6, i, 0)]), grid2DMat));
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

    // 1D (Recta numérica)
    group1D = new THREE.Group(); scene.add(group1D);
    axis1DMat = new THREE.LineBasicMaterial({ color: themes.light.axes });
    group1D.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 0, 0), new THREE.Vector3(10, 0, 0)]), axis1DMat));
    
    for(let i = -10; i <= 10; i++) {
        const tickGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -0.2, 0), new THREE.Vector3(i, 0.2, 0)]);
        group1D.add(new THREE.Line(tickGeo, axis1DMat));
    }
    
    pointer1DMesh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshBasicMaterial({ color: AppState.graphColor }));
    group1D.add(pointer1DMesh);
    group1D.visible = false;

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

function evaluate(x, y, t) {
    if (!AppState.expression) return 0;
    try {
        const expr = prepareExpression(AppState.expression);
        const f = new Function('x', 'y', 'z', 'a', 'b', 't', `return ${expr};`);
        const r = f(x, y, 0, AppState.a, AppState.b, t);
        return (isNaN(r) || !isFinite(r)) ? null : r;
    } catch (e) { return null; }
}

function updateGraphics(t = 0) {
    if (!curve2DMat || !geometry3D) return; 
    
    if (AppState.mode === '1D') {
        const val = evaluate(0, 0, t);
        if (val !== null) {
            pointer1DMesh.position.set(val, 0, 0);
            pointer1DMesh.visible = true;
            pointer1DMesh.material.color.setHex(AppState.graphColor);
        } else {
            pointer1DMesh.visible = false;
        }
        return;
    }

    curve2DMat.color.setHex(AppState.graphColor);
    const pos3D = geometry3D.attributes.position;
    const col3D = geometry3D.attributes.color;
    const cLow = new THREE.Color(AppState.graphColor);
    const cHigh = new THREE.Color(0xffffff);
    const tempC = new THREE.Color();

    for (let i = 0; i < pos3D.count; i++) {
        const x = pos3D.getX(i), y = pos3D.getZ(i);
        const z = evaluate(x, y, t);
        if (z !== null) {
            pos3D.setY(i, z);
            const tCol = THREE.MathUtils.clamp((z + 5) / 10, 0, 1);
            tempC.lerpColors(cLow, cHigh, tCol);
            col3D.setXYZ(i, tempC.r, tempC.g, tempC.b);
        } else { pos3D.setY(i, 0); }
    }
    pos3D.needsUpdate = true; col3D.needsUpdate = true;
    geometry3D.computeVertexNormals();

    const pos2D = curve2DGeo.attributes.position;
    for (let i = 0; i < pos2D.count; i++) {
        const x = (i / (pos2D.count - 1)) * 12 - 6;
        const y = evaluate(x, 0, t);
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

    els.sliderA.addEventListener('input', (e) => { AppState.a = parseFloat(e.target.value); els.valA.innerText = AppState.a.toFixed(1); updateGraphics(AppState.time); });
    els.sliderB.addEventListener('input', (e) => { AppState.b = parseFloat(e.target.value); els.valB.innerText = AppState.b.toFixed(1); updateGraphics(AppState.time); });
    
    els.btn1D.addEventListener('click', () => setMode('1D'));
    els.btn2D.addEventListener('click', () => setMode('2D'));
    els.btn3D.addEventListener('click', () => setMode('3D'));

    // Lógica unificada para ocultar/mostrar la calculadora
    function toggleCalculatorVisibility(forceHide = false) {
        if (forceHide) {
            els.calc.classList.add('hidden-calc');
        } else {
            els.calc.classList.toggle('hidden-calc');
        }
        const isHidden = els.calc.classList.contains('hidden-calc');
        els.calcToggleBtn.innerText = isHidden ? "👁️" : "🧮";
    }

    // Botón principal (fuera de la calculadora)
    els.calcToggleBtn.addEventListener('click', () => toggleCalculatorVisibility(false));

    // Botón de cerrar (dentro de la calculadora)
    els.closeCalcBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el clic afecte a otros elementos
        toggleCalculatorVisibility(true);
    });

    // Botón Animación Play/Pause
    els.playBtn.addEventListener('click', () => {
        AppState.isPlaying = !AppState.isPlaying;
        els.playBtn.innerText = AppState.isPlaying ? "⏸️" : "▶️";
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
                    a.href = url; a.download = `grabacion_calculadora.${ext}`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
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

    // Botón Tema
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
        group3D.remove(gridHelper3D);
        gridHelper3D.geometry.dispose(); gridHelper3D.material.dispose();
        gridHelper3D = new THREE.GridHelper(20, 20, theme.grid3D_center, theme.grid3D_base);
        group3D.add(gridHelper3D);
    });

    // Interacción con el gráfico
    window.addEventListener('mousemove', (e) => handlePointer(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0 && !e.touches[0].target.closest('.calculator-container')) {
            handlePointer(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, {passive: true});

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        const isNowMobile = window.innerWidth <= 768;
        if (isNowMobile !== AppState.isMobile) location.reload(); 
    });
}

// =========================================
// FUNCIONES DEL TECLADO Y PANTALLA
// =========================================
function insertText(char) { AppState.expression += char; updateDisplay(); updateGraphics(AppState.time); }
function clearDisplay() { AppState.expression = ""; updateDisplay(); updateGraphics(AppState.time); }
function backspace() { AppState.expression = AppState.expression.slice(0, -1); updateDisplay(); updateGraphics(AppState.time); }
function calculate() { updateGraphics(AppState.time); }

function updateDisplay() {
    const text = AppState.expression || "0";
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
        group3D.visible = false; group2D.visible = false; group1D.visible = true; mesh3D.visible = false;
        targetPos = new THREE.Vector3(0, 0, 10); targetLookAt = new THREE.Vector3(0, 0, 0); targetUp = new THREE.Vector3(0, 1, 0);
    } else if (mode === '2D') {
        group3D.visible = false; group2D.visible = true; group1D.visible = false; mesh3D.visible = false;
        targetPos = new THREE.Vector3(0, 0, 10); targetLookAt = new THREE.Vector3(0, 0, 0); targetUp = new THREE.Vector3(0, 1, 0);
    } else {
        group3D.visible = true; group2D.visible = false; group1D.visible = false; mesh3D.visible = true;
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
    if (AppState.mode === '2D') target = curve2D;
    else if (AppState.mode === '3D') target = mesh3D;
    else target = pointer1DMesh;

    const intersects = raycaster.intersectObject(target);
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