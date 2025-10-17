// Visual Pathway Diagram - generated SVG with animated contralateral flow
// Responsible for injecting the SVG, wiring controls, and animating steps

(function () {
    const container = document.getElementById('vp-diagram');
    if (!container) return;

    // Config
    const CONFIG = {
        width: 720,
        height: 420,
        speed: 1,
        // durations per storyboard step (ms)
        stepDurations: [600, 700, 800, 800, 700, 800],
        // color palette matches CSS classes
        blue: '#3b82f6',
        red: '#ef4444',
        neutralStroke: '#cbd5e1',
        textFill: '#6b7280'
    };

    // State
    const state = {
        step: 0, // 0..6 (0 = idle)
        playing: false,
        mode: 'both', // 'left' | 'both' | 'right'
        timers: [],
        paths: {},
        pathLengths: {},
        prefersReducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    function clearTimers() {
        state.timers.forEach(t => clearTimeout(t));
        state.timers = [];
    }

    function announce(msg) {
        const sr = document.getElementById('vp-status');
        if (sr) sr.textContent = msg;
    }

    // Helper to create SVG elements
    function el(name, attrs = {}, children = []) {
        const n = document.createElementNS('http://www.w3.org/2000/svg', name);
        Object.keys(attrs).forEach(k => {
            if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, String(attrs[k]));
        });
        children.forEach(c => n.appendChild(c));
        return n;
    }

    function addLabel(svg, text, x, y, anchor = 'middle') {
        const t = el('text', { x, y, 'text-anchor': anchor, class: 'vp-text', fill: CONFIG.textFill, 'font-size': 12, 'font-weight': 600 });
        t.textContent = text;
        svg.appendChild(t);
    }

    function initSvg() {
        const svg = el('svg', {
            viewBox: `0 0 ${CONFIG.width} ${CONFIG.height}`,
            role: 'img',
            'aria-labelledby': 'vp-title vp-desc'
        });
        const title = el('title', { id: 'vp-title' });
        title.textContent = 'Visual pathway diagram showing contralateral routing of visual fields.';
        const desc = el('desc', { id: 'vp-desc' });
        desc.textContent = 'Left visual field (blue) routes to right hemisphere; Right visual field (red) routes to left hemisphere via the optic chiasm.';
        svg.appendChild(title);
        svg.appendChild(desc);

        // Brain outline (schematic)
        const brain = el('path', {
            d: 'M120,120 C120,60 220,30 300,60 C330,20 390,20 420,60 C500,30 600,60 600,120 C650,180 650,260 600,320 C600,380 520,400 420,370 C380,400 320,400 280,370 C180,400 120,380 120,320 C70,260 70,180 120,120',
            class: 'vp-neutral',
            fill: 'none',
            stroke: CONFIG.neutralStroke,
            'stroke-width': 2
        });
        svg.appendChild(brain);

        // Eyes
        const leftEye = el('circle', { cx: 220, cy: 170, r: 26, class: 'vp-node', fill: '#ffffff', stroke: CONFIG.neutralStroke, 'stroke-width': 2 });
        const rightEye = el('circle', { cx: 500, cy: 170, r: 26, class: 'vp-node', fill: '#ffffff', stroke: CONFIG.neutralStroke, 'stroke-width': 2 });
        svg.appendChild(leftEye);
        svg.appendChild(rightEye);

        // Visual field wedges above
        const wedgeBlue = el('path', {
            d: 'M180,80 A180,60 0 0 1 360,80 L360,60 A200,80 0 0 0 160,60 Z',
            fill: CONFIG.blue,
            'fill-opacity': 0.25,
            stroke: 'none'
        });
        const wedgeRed = el('path', {
            d: 'M360,80 A180,60 0 0 1 540,80 L540,60 A200,80 0 0 0 360,60 Z',
            fill: CONFIG.red,
            'fill-opacity': 0.25,
            stroke: 'none'
        });
        svg.appendChild(wedgeBlue);
        svg.appendChild(wedgeRed);

        addLabel(svg, 'Left visual field', 230, 50);
        addLabel(svg, 'Right visual field', 490, 50);

        // Key nodes: chiasm, LGN, V1
        const chiasm = el('circle', { cx: 360, cy: 220, r: 6, class: 'vp-node', fill: '#ffffff', stroke: CONFIG.neutralStroke, 'stroke-width': 2 });
        svg.appendChild(chiasm);
        const lgnLeft = el('circle', { cx: 270, cy: 260, r: 6, class: 'vp-node', fill: '#ffffff', stroke: CONFIG.neutralStroke, 'stroke-width': 2 });
        const lgnRight = el('circle', { cx: 450, cy: 260, r: 6, class: 'vp-node', fill: '#ffffff', stroke: CONFIG.neutralStroke, 'stroke-width': 2 });
        svg.appendChild(lgnLeft);
        svg.appendChild(lgnRight);
        const v1Left = el('circle', { cx: 170, cy: 330, r: 8, class: 'vp-node', fill: '#ffffff', stroke: CONFIG.neutralStroke, 'stroke-width': 2 });
        const v1Right = el('circle', { cx: 550, cy: 330, r: 8, class: 'vp-node', fill: '#ffffff', stroke: CONFIG.neutralStroke, 'stroke-width': 2 });
        svg.appendChild(v1Left);
        svg.appendChild(v1Right);

        // Labels
        addLabel(svg, 'Optic chiasm', 360, 240);
        addLabel(svg, 'LGN', 270, 280);
        addLabel(svg, 'LGN', 450, 280);
        addLabel(svg, 'Primary visual cortex (V1)', 170, 355, 'middle');
        addLabel(svg, 'Primary visual cortex (V1)', 550, 355, 'middle');
        addLabel(svg, 'Eye', 220, 200);
        addLabel(svg, 'Eye', 500, 200);

        // Paths (blue: left visual field → right hemisphere)
        // 1) retina highlight (left eye temporal, right eye nasal)
        const blueRetinaLeft = el('path', {
            id: 'blue-retina-left',
            d: 'M200,168 C205,158 215,156 226,168',
            class: 'vp-path-blue vp-draw',
            fill: 'none'
        });
        const blueRetinaRight = el('path', {
            id: 'blue-retina-right',
            d: 'M486,168 C495,158 505,158 514,170',
            class: 'vp-path-blue vp-draw',
            fill: 'none'
        });

        // 2) optic nerves to chiasm
        const blueNerveLeft = el('path', {
            id: 'blue-nerve-left',
            d: 'M236,178 C270,200 300,210 340,216',
            class: 'vp-path-blue vp-draw',
            fill: 'none'
        });
        const blueNerveRight = el('path', {
            id: 'blue-nerve-right',
            d: 'M510,178 C476,200 440,210 380,216',
            class: 'vp-path-blue vp-draw',
            fill: 'none'
        });

        // 3) crossing at chiasm (blue goes to right side)
        const blueCross = el('path', {
            id: 'blue-cross',
            d: 'M360,220 C380,230 410,240 440,252',
            class: 'vp-path-blue vp-draw',
            fill: 'none'
        });

        // 4) chiasm → right LGN
        const blueToLGN = el('path', {
            id: 'blue-to-lgn',
            d: 'M440,252 C448,255 453,258 450,260',
            class: 'vp-path-blue vp-draw',
            fill: 'none'
        });

        // 5) LGN → right V1
        const blueToV1 = el('path', {
            id: 'blue-to-v1',
            d: 'M450,260 C500,290 530,305 550,330',
            class: 'vp-path-blue vp-draw',
            fill: 'none'
        });

        // Paths (red: right visual field → left hemisphere)
        const redRetinaRight = el('path', {
            id: 'red-retina-right',
            d: 'M514,168 C509,158 499,156 488,168',
            class: 'vp-path-red vp-draw',
            fill: 'none'
        });
        const redRetinaLeft = el('path', {
            id: 'red-retina-left',
            d: 'M226,168 C217,158 207,158 198,170',
            class: 'vp-path-red vp-draw',
            fill: 'none'
        });
        const redNerveRight = el('path', {
            id: 'red-nerve-right',
            d: 'M504,178 C470,200 440,210 380,216',
            class: 'vp-path-red vp-draw',
            fill: 'none'
        });
        const redNerveLeft = el('path', {
            id: 'red-nerve-left',
            d: 'M232,178 C266,200 300,210 340,216',
            class: 'vp-path-red vp-draw',
            fill: 'none'
        });
        const redCross = el('path', {
            id: 'red-cross',
            d: 'M360,220 C340,230 310,240 280,252',
            class: 'vp-path-red vp-draw',
            fill: 'none'
        });
        const redToLGN = el('path', {
            id: 'red-to-lgn',
            d: 'M280,252 C272,255 267,258 270,260',
            class: 'vp-path-red vp-draw',
            fill: 'none'
        });
        const redToV1 = el('path', {
            id: 'red-to-v1',
            d: 'M270,260 C220,290 190,305 170,330',
            class: 'vp-path-red vp-draw',
            fill: 'none'
        });

        // Add in draw order (background to foreground)
        svg.appendChild(blueRetinaLeft);
        svg.appendChild(blueRetinaRight);
        svg.appendChild(blueNerveLeft);
        svg.appendChild(blueNerveRight);
        svg.appendChild(blueCross);
        svg.appendChild(blueToLGN);
        svg.appendChild(blueToV1);

        svg.appendChild(redRetinaRight);
        svg.appendChild(redRetinaLeft);
        svg.appendChild(redNerveRight);
        svg.appendChild(redNerveLeft);
        svg.appendChild(redCross);
        svg.appendChild(redToLGN);
        svg.appendChild(redToV1);

        container.innerHTML = '';
        container.appendChild(svg);

        // Store references
        const ids = [
            'blue-retina-left','blue-retina-right','blue-nerve-left','blue-nerve-right','blue-cross','blue-to-lgn','blue-to-v1',
            'red-retina-right','red-retina-left','red-nerve-right','red-nerve-left','red-cross','red-to-lgn','red-to-v1'
        ];
        ids.forEach(id => {
            state.paths[id] = svg.getElementById ? svg.getElementById(id) : container.querySelector('#' + id);
            if (!state.paths[id]) state.paths[id] = svg.querySelector('#' + id);
        });

        // Initialize stroke-dash for draw animation
        Object.entries(state.paths).forEach(([id, p]) => {
            if (!(p && p.getTotalLength)) return;
            const len = p.getTotalLength();
            state.pathLengths[id] = len;
            p.style.strokeDasharray = String(len);
            p.style.strokeDashoffset = String(len);
        });
    }

    // Mode dimming
    function applyMode() {
        const isLeft = state.mode === 'left';
        const isRight = state.mode === 'right';
        const blueIds = ['blue-retina-left','blue-retina-right','blue-nerve-left','blue-nerve-right','blue-cross','blue-to-lgn','blue-to-v1'];
        const redIds = ['red-retina-right','red-retina-left','red-nerve-right','red-nerve-left','red-cross','red-to-lgn','red-to-v1'];
        const dim = (ids, shouldDim) => ids.forEach(id => { const p = state.paths[id]; if (p) p.classList.toggle('vp-dim', shouldDim); });
        // Blue corresponds to left visual field (keep when mode is left or both)
        dim(blueIds, isRight);
        // Red corresponds to right visual field
        dim(redIds, isLeft);
    }

    // Utility animate draw for a set of IDs
    function drawPaths(ids, duration) {
        ids.forEach(id => {
            const p = state.paths[id];
            if (!p) return;
            p.classList.add('vp-active');
            if (state.prefersReducedMotion) {
                p.style.strokeDashoffset = '0';
                return;
            }
            const length = state.pathLengths[id] || 0;
            p.style.transition = `stroke-dashoffset ${duration}ms ease`;
            // restart transition
            // eslint-disable-next-line no-unused-expressions
            p.getBoundingClientRect();
            p.style.strokeDashoffset = '0';
        });
    }

    function resetPaths() {
        Object.entries(state.paths).forEach(([id, p]) => {
            if (!p) return;
            p.classList.remove('vp-active');
            p.classList.remove('vp-flow');
            const len = state.pathLengths[id];
            if (len !== undefined) {
                p.style.transition = 'none';
                p.style.strokeDasharray = String(len);
                p.style.strokeDashoffset = String(len);
            }
        });
    }

    // Storyboard steps
    const STEPS = [
        // 1: initial, nothing drawn (handled by reset)
        () => {},
        // 2: retina highlight
        () => drawPaths(['blue-retina-left','blue-retina-right','red-retina-left','red-retina-right'].filter(id => allowId(id)), dur(0)),
        // 3: optic nerves
        () => drawPaths(['blue-nerve-left','blue-nerve-right','red-nerve-left','red-nerve-right'].filter(id => allowId(id)), dur(1)),
        // 4: crossing
        () => drawPaths(['blue-cross','red-cross'].filter(id => allowId(id)), dur(2)),
        // 5: to LGN
        () => drawPaths(['blue-to-lgn','red-to-lgn'].filter(id => allowId(id)), dur(3)),
        // 6: to V1
        () => drawPaths(['blue-to-v1','red-to-v1'].filter(id => allowId(id)), dur(4))
    ];

    function allowId(id) {
        // Filter IDs based on mode
        if (state.mode === 'both') return true;
        const isBlue = id.startsWith('blue');
        if (state.mode === 'left') return isBlue; // left visual field (blue only)
        if (state.mode === 'right') return !isBlue; // red only
        return true;
    }

    function dur(idx) {
        return Math.round(CONFIG.stepDurations[idx] * CONFIG.speed);
    }

    function playFromCurrent() {
        clearTimers();
        state.playing = true;
        announce(`Playing ${state.mode} at ${CONFIG.speed.toFixed(2)}×`);
        // Chain timeouts to step sequentially using current step duration
        const tick = () => {
            if (!state.playing) return;
            if (state.step >= 6) { state.playing = false; return; }
            const prevStep = state.step;
            stepTo(state.step + 1);
            const durForJustRan = CONFIG.stepDurations[prevStep] || 700;
            const t = setTimeout(tick, Math.round(durForJustRan * CONFIG.speed));
            state.timers.push(t);
        };
        tick();
    }

    function pause() {
        state.playing = false;
        clearTimers();
        announce(`Paused at step ${state.step}/6`);
    }

    function stepOnce() {
        pause();
        stepTo(Math.min(6, state.step + 1));
        announce(`Stepped to ${state.step}/6`);
    }

    function reset() {
        pause();
        state.step = 0;
        resetPaths();
        applyMode();
        announce('Reset');
    }

    function stepTo(next) {
        if (next <= state.step) return;
        state.step = next;
        const fn = STEPS[next];
        if (fn) fn();
        applyMode();
    }

    function bindControls() {
        const playBtn = document.getElementById('vp-play');
        const pauseBtn = document.getElementById('vp-pause');
        const stepBtn = document.getElementById('vp-step');
        const resetBtn = document.getElementById('vp-reset');
        const modeLeft = document.getElementById('vp-mode-left');
        const modeBoth = document.getElementById('vp-mode-both');
        const modeRight = document.getElementById('vp-mode-right');
        const speedBtns = Array.from(document.querySelectorAll('.vp-speed'));

        if (playBtn) playBtn.addEventListener('click', () => { playFromCurrent(); });
        if (pauseBtn) pauseBtn.addEventListener('click', () => { pause(); });
        if (stepBtn) stepBtn.addEventListener('click', () => { stepOnce(); });
        if (resetBtn) resetBtn.addEventListener('click', () => { reset(); });

        function setMode(newMode) {
            state.mode = newMode;
            modeLeft && modeLeft.setAttribute('aria-pressed', String(newMode === 'left'));
            modeBoth && modeBoth.setAttribute('aria-pressed', String(newMode === 'both'));
            modeRight && modeRight.setAttribute('aria-pressed', String(newMode === 'right'));
            applyMode();
            announce(`Mode: ${newMode}`);
        }
        if (modeLeft) modeLeft.addEventListener('click', () => setMode('left'));
        if (modeBoth) modeBoth.addEventListener('click', () => setMode('both'));
        if (modeRight) modeRight.addEventListener('click', () => setMode('right'));

        speedBtns.forEach(btn => btn.addEventListener('click', () => {
            const sp = Number(btn.getAttribute('data-speed')) || 1;
            CONFIG.speed = sp;
            announce(`Speed ${sp}×`);
            if (state.playing) playFromCurrent();
        }));
    }

    // Initialize
    initSvg();
    bindControls();
    reset();
    // Show first step immediately so users see the diagram is interactive
    stepTo(1);

    // Expose minimal imperative API for inline onclick fallbacks
    window.VP = {
        play: () => playFromCurrent(),
        pause: () => pause(),
        step: () => stepOnce(),
        reset: () => reset(),
        mode: (m) => { const el = document.getElementById(m === 'left' ? 'vp-mode-left' : m === 'right' ? 'vp-mode-right' : 'vp-mode-both'); if (el) el.click(); },
        speed: (s) => { CONFIG.speed = Number(s) || 1; announce(`Speed ${CONFIG.speed}×`); if (state.playing) playFromCurrent(); }
    };
})();


