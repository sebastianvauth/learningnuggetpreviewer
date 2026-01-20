/**
 * INTERACTIVE FIXES FOR SEMANTIC SEGMENTATION LESSONS
 * This file provides polyfills and utilities to fix common issues
 * Include this BEFORE the lesson-specific scripts
 */

(function() {
    'use strict';

    // ========================================
    // 1. POLYFILL FOR roundRect (Safari/older browsers)
    // ========================================
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radii) {
            // Handle various radius formats
            let r = radii;
            if (typeof radii === 'number') {
                r = [radii, radii, radii, radii];
            } else if (Array.isArray(radii)) {
                if (radii.length === 1) r = [radii[0], radii[0], radii[0], radii[0]];
                else if (radii.length === 2) r = [radii[0], radii[1], radii[0], radii[1]];
                else if (radii.length === 4) r = radii;
            }

            const [tl, tr, br, bl] = r;

            this.beginPath();
            this.moveTo(x + tl, y);
            this.lineTo(x + width - tr, y);
            this.quadraticCurveTo(x + width, y, x + width, y + tr);
            this.lineTo(x + width, y + height - br);
            this.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
            this.lineTo(x + bl, y + height);
            this.quadraticCurveTo(x, y + height, x, y + height - bl);
            this.lineTo(x, y + tl);
            this.quadraticCurveTo(x, y, x + tl, y);
            this.closePath();
        };
    }

    // ========================================
    // 2. CANVAS HELPER - Proper DPI & Resize
    // ========================================
    window.CanvasHelper = {
        /**
         * Setup canvas with proper DPI and dimensions
         */
        setupCanvas: function(canvas, logicalWidth, logicalHeight) {
            if (!canvas) return null;

            const dpr = window.devicePixelRatio || 1;
            const width = logicalWidth || canvas.parentElement?.clientWidth || 600;
            const height = logicalHeight || 300;

            // Set display size
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            // Set actual size in memory (scaled for DPI)
            canvas.width = width * dpr;
            canvas.height = height * dpr;

            // Get context and scale
            const ctx = canvas.getContext('2d');
            if (ctx.resetTransform) {
                ctx.resetTransform();
            } else {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
            ctx.scale(dpr, dpr);

            return { ctx, width, height, dpr };
        },

        /**
         * Wait for element to be visible before initializing
         */
        whenVisible: function(element, callback) {
            if (!element) return;

            const check = () => {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;

                if (isVisible) {
                    callback();
                    return true;
                }
                return false;
            };

            // Try immediately
            if (check()) return;

            // Watch for section visibility changes
            const section = element.closest('section');
            if (section) {
                const observer = new MutationObserver(() => {
                    if (section.classList.contains('visible')) {
                        setTimeout(() => {
                            if (check()) observer.disconnect();
                        }, 100);
                    }
                });
                observer.observe(section, { attributes: true, attributeFilter: ['class'] });
            }

            // Fallback: wait for window load
            if (document.readyState === 'loading') {
                window.addEventListener('load', () => setTimeout(check, 100));
            }
        },

        /**
         * Create a resize handler with debouncing
         */
        createResizeHandler: function(callback, delay = 150) {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(callback, delay);
            };
        }
    };

    // ========================================
    // 3. SECTION VISIBILITY MANAGER
    // ========================================
    window.SectionVisibilityManager = {
        callbacks: new Map(),

        /**
         * Register a callback for when a section becomes visible
         */
        onSectionVisible: function(sectionId, callback) {
            if (!this.callbacks.has(sectionId)) {
                this.callbacks.set(sectionId, []);
            }
            this.callbacks.get(sectionId).push(callback);

            // Check if already visible
            const section = document.getElementById(sectionId);
            if (section && section.classList.contains('visible')) {
                setTimeout(callback, 0);
            }
        },

        /**
         * Initialize observer for section visibility
         */
        init: function() {
            if (this.initialized) return;
            this.initialized = true;

            // Override showNextSection to trigger callbacks
            const originalShowNextSection = window.showNextSection;
            if (originalShowNextSection) {
                window.showNextSection = (nextSectionId) => {
                    originalShowNextSection(nextSectionId);

                    const sectionKey = `section${nextSectionId}`;
                    const callbacks = this.callbacks.get(sectionKey);
                    if (callbacks) {
                        setTimeout(() => {
                            callbacks.forEach(cb => cb());
                        }, 100);
                    }
                };
            }
        }
    };

    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SectionVisibilityManager.init();
        });
    } else {
        window.SectionVisibilityManager.init();
    }

    // ========================================
    // 4. SAFE ELEMENT GETTER
    // ========================================
    window.safeGetElement = function(id, context = document) {
        const el = context.getElementById ? context.getElementById(id) : context.querySelector(`#${id}`);
        if (!el) {
            console.warn(`Element not found: ${id}`);
        }
        return el;
    };

    // ========================================
    // 5. MOUSE/TOUCH POSITION HELPER
    // ========================================
    window.getCanvasPointerPos = function(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;

        // Return in logical coordinates (not scaled by DPR)
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    console.log('Interactive fixes loaded successfully');
})();
