(function(){
    const KEY = 'studio_theme';
    const LEGACY_KEY = 'canvas_theme';
    const SCALE_KEY = 'studio_ui_scale_mode';
    const SCALE_OPTIONS = ['auto', '100', '115', '125', '140'];

    function currentTheme(){
        return localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || 'light';
    }

    function applyTheme(theme){
        const next = theme === 'dark' ? 'dark' : 'light';
        const dark = next === 'dark';
        document.documentElement.classList.toggle('studio-theme-dark', dark);
        document.documentElement.classList.toggle('theme-dark', dark);
        if(document.body){
            document.body.classList.toggle('studio-theme-dark', dark);
            document.body.classList.toggle('theme-dark', dark);
        }
        window.dispatchEvent(new CustomEvent('studio-theme-change', { detail: { theme: next } }));
    }

    function ensureScaleStyle(){
        if(document.getElementById('studio-scale-style')) return;
        const style = document.createElement('style');
        style.id = 'studio-scale-style';
        style.textContent = `
            html.studio-scale-managed {
                --studio-ui-scale: 1;
            }
            html.studio-ui-scaled body:not(.studio-scale-host) {
                width: calc(100% / var(--studio-ui-scale)) !important;
                min-height: calc(100vh / var(--studio-ui-scale)) !important;
                zoom: var(--studio-ui-scale);
            }
            html.studio-ui-scaled body.studio-scale-viewport:not(.studio-scale-host) {
                height: calc(100vh / var(--studio-ui-scale)) !important;
            }
            html.studio-ui-scaled body:not(.studio-scale-host) > .app-shell,
            html.studio-ui-scaled body:not(.studio-scale-host) > .shell,
            html.studio-ui-scaled body:not(.studio-scale-host) > .asset-page {
                width: calc(100% / var(--studio-ui-scale)) !important;
            }
            html.studio-ui-scaled body:not(.studio-scale-host) > .app-shell,
            html.studio-ui-scaled body:not(.studio-scale-host) > .shell {
                height: calc(100vh / var(--studio-ui-scale)) !important;
            }
            html.studio-ui-scaled body:not(.studio-scale-host) > .asset-page {
                min-height: calc(100vh / var(--studio-ui-scale)) !important;
            }
            @supports not (zoom: 1) {
                html.studio-ui-scaled body:not(.studio-scale-host) {
                    zoom: 1;
                    transform: scale(var(--studio-ui-scale));
                    transform-origin: 0 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function isFramed(){
        try {
            return window.self !== window.top;
        } catch(e) {
            return true;
        }
    }

    function normalizeScaleMode(mode){
        return SCALE_OPTIONS.includes(mode) ? mode : 'auto';
    }

    function currentScaleMode(){
        try {
            return normalizeScaleMode(localStorage.getItem(SCALE_KEY) || 'auto');
        } catch(e) {
            return 'auto';
        }
    }

    function autoScale(){
        const dpr = Math.max(1, Number(window.devicePixelRatio || 1));
        const screenLong = Math.max(window.screen?.width || 0, window.screen?.height || 0);
        const viewportLong = Math.max(window.innerWidth || 0, window.innerHeight || 0);
        const longEdge = Math.max(screenLong, viewportLong);
        if(dpr >= 1.35) return 1;
        if(longEdge >= 3600) return 1.22;
        if(longEdge >= 3000) return 1.16;
        if(longEdge >= 2500 && dpr <= 1.15) return 1.1;
        return 1;
    }

    function scaleForMode(mode){
        const next = normalizeScaleMode(mode);
        if(next === 'auto') return autoScale();
        return Math.max(1, Math.min(1.4, Number(next) / 100));
    }

    function updateScaleBodyClasses(){
        if(!document.body) return;
        const hasFrameHost = !!document.querySelector('.app-shell iframe, iframe.active');
        document.body.classList.toggle('studio-scale-host', hasFrameHost && !isFramed());
        const computed = window.getComputedStyle(document.body);
        const viewportLocked = computed.overflow === 'hidden' || computed.overflowY === 'hidden' || !!document.querySelector('.app-shell, .shell');
        document.body.classList.toggle('studio-scale-viewport', viewportLocked);
    }

    function scaleOptedOut(){
        return document.documentElement.dataset.studioScale === 'off';
    }

    function applyScale(mode){
        ensureScaleStyle();
        const next = normalizeScaleMode(mode);
        const optedOut = scaleOptedOut();
        const value = optedOut ? 1 : scaleForMode(next);
        const scaled = !optedOut && Math.abs(value - 1) > 0.01;
        document.documentElement.classList.add('studio-scale-managed');
        document.documentElement.classList.toggle('studio-ui-scaled', scaled);
        document.documentElement.style.setProperty('--studio-ui-scale', value.toFixed(3));
        updateScaleBodyClasses();
        window.dispatchEvent(new CustomEvent('studio-ui-scale-change', { detail: { mode: next, scale: value } }));
    }

    function broadcastScale(mode){
        document.querySelectorAll('iframe').forEach(frame => {
            try {
                frame.contentWindow?.postMessage({ type: 'studio-ui-scale', mode }, '*');
            } catch(e) {}
        });
    }

    function setScaleMode(mode, shouldBroadcast = true){
        const next = normalizeScaleMode(mode);
        try {
            localStorage.setItem(SCALE_KEY, next);
        } catch(e) {}
        applyScale(next);
        if(shouldBroadcast) broadcastScale(next);
    }

    let resizeTimer = null;
    function scheduleAutoScaleRefresh(){
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if(currentScaleMode() === 'auto') {
                applyScale('auto');
                broadcastScale('auto');
            }
        }, 160);
    }

    const GLOW_SELECTOR = [
        'button',
        '[role="button"]',
        '.nav-item',
        '.side-pill',
        '.action-btn',
        '.primary-btn',
        '.ghost-btn',
        '.tool-btn',
        '.asset-btn',
        '.icon-btn',
        '.preview-icon-btn',
        '.menu-btn',
        '.canvas-asset-icon-btn',
        '.workflow-transfer-btn'
    ].join(',');

    const GLOW_STYLE_ID = 'studio-button-glow-style';
    const GLOW_STYLE = `
.studio-glow-button {
    --studio-glow-x: 50%;
    --studio-glow-y: 50%;
    --studio-glow-edge: 0;
    --studio-glow-ring: rgba(216, 222, 233, 0);
    --studio-glow-fill: rgba(216, 222, 233, 0);
    --studio-glow-shadow: rgba(216, 222, 233, 0);
    transition:
        background-color .16s ease,
        border-color .16s ease,
        color .16s ease,
        box-shadow .16s ease,
        transform .16s ease;
}
.studio-glow-button:hover,
.studio-glow-button:focus-visible {
    background-image: radial-gradient(
        circle at var(--studio-glow-x) var(--studio-glow-y),
        var(--studio-glow-fill) 0%,
        transparent 48%
    );
    background-blend-mode: screen;
    border-color: var(--studio-glow-ring) !important;
    box-shadow:
        0 0 0 1px var(--studio-glow-ring),
        inset 0 0 calc(10px + (18px * var(--studio-glow-edge))) var(--studio-glow-fill),
        0 0 calc(12px + (22px * var(--studio-glow-edge))) var(--studio-glow-shadow) !important;
}
.studio-glow-button:active {
    transform: translateY(1px) scale(.99);
}
.studio-glow-button:disabled,
.studio-glow-button[disabled],
.studio-glow-button[aria-disabled="true"] {
    box-shadow: none !important;
    transform: none;
}`;
    let glowInitialized = false;

    function ensureButtonGlowStyles(){
        if(document.getElementById(GLOW_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = GLOW_STYLE_ID;
        style.textContent = GLOW_STYLE;
        document.head.appendChild(style);
    }

    function shouldGlow(el){
        return !!(
            el &&
            el instanceof HTMLElement &&
            el.matches(GLOW_SELECTOR) &&
            el.id !== 'project-version-badge' &&
            !el.closest('[data-studio-glow="off"]') &&
            !el.classList.contains('studio-glow-ignore')
        );
    }

    function applyButtonGlow(root = document){
        root.querySelectorAll?.('#project-version-badge.studio-glow-button').forEach(el => {
            el.classList.remove('studio-glow-button');
            el.removeAttribute('style');
        });
        root.querySelectorAll?.(GLOW_SELECTOR).forEach(el => {
            if(shouldGlow(el)) el.classList.add('studio-glow-button');
        });
    }

    function updateGlowFromPointer(event){
        const el = event.target?.closest?.('.studio-glow-button');
        if(!shouldGlow(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
        const rect = el.getBoundingClientRect();
        if(!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
        const edgeDistance = Math.min(x, y, rect.width - x, rect.height - y);
        const edgeLimit = Math.max(18, Math.min(rect.width, rect.height) * .48);
        const edge = Math.max(0, Math.min(1, 1 - edgeDistance / edgeLimit));
        const opacity = Math.max(.16, edge);
        el.style.setProperty('--studio-glow-x', `${((x / rect.width) * 100).toFixed(2)}%`);
        el.style.setProperty('--studio-glow-y', `${((y / rect.height) * 100).toFixed(2)}%`);
        el.style.setProperty('--studio-glow-edge', edge.toFixed(3));
        el.style.setProperty('--studio-glow-ring', `rgba(216, 222, 233, ${(0.18 + opacity * 0.42).toFixed(3)})`);
        el.style.setProperty('--studio-glow-fill', `rgba(216, 222, 233, ${(0.04 + opacity * 0.12).toFixed(3)})`);
        el.style.setProperty('--studio-glow-shadow', `rgba(216, 222, 233, ${(0.08 + opacity * 0.16).toFixed(3)})`);
    }

    function resetGlow(event){
        const el = event.target?.closest?.('.studio-glow-button');
        if(!el) return;
        el.style.setProperty('--studio-glow-edge', '0');
        el.style.setProperty('--studio-glow-ring', 'rgba(216, 222, 233, 0)');
        el.style.setProperty('--studio-glow-fill', 'rgba(216, 222, 233, 0)');
        el.style.setProperty('--studio-glow-shadow', 'rgba(216, 222, 233, 0)');
    }

    function initButtonGlow(){
        if(glowInitialized) return;
        glowInitialized = true;
        ensureButtonGlowStyles();
        applyButtonGlow();
        document.addEventListener('pointermove', updateGlowFromPointer, { passive: true });
        document.addEventListener('pointerleave', resetGlow, true);
        document.addEventListener('pointercancel', resetGlow, true);
        if(window.MutationObserver) {
            const observer = new MutationObserver(records => {
                records.forEach(record => {
                    record.addedNodes.forEach(node => {
                        if(!(node instanceof HTMLElement)) return;
                        if(shouldGlow(node)) node.classList.add('studio-glow-button');
                        applyButtonGlow(node);
                    });
                });
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    window.StudioTheme = {
        key: KEY,
        get: currentTheme,
        apply: applyTheme,
        set(theme){
            const next = theme === 'dark' ? 'dark' : 'light';
            localStorage.setItem(KEY, next);
            localStorage.setItem(LEGACY_KEY, next);
            applyTheme(next);
        }
    };

    window.StudioScale = {
        key: SCALE_KEY,
        options: SCALE_OPTIONS.slice(),
        getMode: currentScaleMode,
        getScale: () => scaleForMode(currentScaleMode()),
        apply: applyScale,
        set: setScaleMode
    };

    applyTheme(currentTheme());
    applyScale(currentScaleMode());

    function initDomFeatures(){
        applyTheme(currentTheme());
        applyScale(currentScaleMode());
        initButtonGlow();
    }

    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDomFeatures);
    } else {
        initDomFeatures();
    }
    window.addEventListener('message', event => {
        if(event.data?.type === 'studio-theme') applyTheme(event.data.theme);
        if(event.data?.type === 'studio-ui-scale') setScaleMode(event.data.mode, false);
    });
    window.addEventListener('storage', event => {
        if(event.key === KEY || event.key === LEGACY_KEY) applyTheme(currentTheme());
        if(event.key === SCALE_KEY) applyScale(currentScaleMode());
    });
    window.addEventListener('resize', scheduleAutoScaleRefresh);
})();
