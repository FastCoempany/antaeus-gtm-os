/**
 * GTMOS Save Indicator — Phase 4.1
 *
 * Shared save-status chip that works for both auto-save and manual-save modules.
 *
 * Usage:
 *   // In module init:
 *   saveIndicator.mount('#myContainer');        // inserts the chip
 *
 *   // On events:
 *   saveIndicator.saving();                     // "Saving..." (teal pulse)
 *   saveIndicator.saved();                      // "Saved ✓" (green, fades text after 3s)
 *   saveIndicator.saved('Auto-saved');          // "Auto-saved ✓" (for auto-save modules)
 *   saveIndicator.unsaved();                    // "Unsaved changes" (amber)
 *   saveIndicator.error('Network error');       // "Network error" (red)
 *
 * Integration with unsaved-guard:
 *   If unsavedGuard is present, the indicator listens for dirty/clean state
 *   and updates automatically. Module code only needs to call saved()/saving().
 */

(function () {
    'use strict';

    var chipEl = null;
    var fadeTimer = null;
    var STATES = {
        idle:    { text: '',                  cls: 'si-idle',    icon: '' },
        saving:  { text: 'Saving…',          cls: 'si-saving',  icon: '' },
        saved:   { text: 'Saved ✓',          cls: 'si-saved',   icon: '' },
        unsaved: { text: 'Unsaved changes',  cls: 'si-unsaved', icon: '' },
        error:   { text: 'Save failed',      cls: 'si-error',   icon: '' }
    };

    // ── Inject CSS once ─────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('si-styles')) return;
        var style = document.createElement('style');
        style.id = 'si-styles';
        style.textContent = [
            '.si-chip{display:inline-flex;align-items:center;gap:4px;font-size:0.72rem;font-weight:600;padding:3px 10px;border-radius:20px;transition:all 0.25s ease;letter-spacing:0.01em;white-space:nowrap;line-height:1.4;}',
            '.si-idle{opacity:0;pointer-events:none;}',
            '.si-saving{background:rgba(45,212,191,0.1);color:var(--brand-teal,#2dd4bf);animation:si-pulse 1.2s ease-in-out infinite;}',
            '.si-saved{background:rgba(34,197,94,0.1);color:#22c55e;}',
            '.si-unsaved{background:rgba(245,158,11,0.1);color:#f59e0b;}',
            '.si-error{background:rgba(239,68,68,0.1);color:#ef4444;}',
            '.si-faded{opacity:0.5;}',
            '@keyframes si-pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function bindGuardOnce() {
        if (!window.unsavedGuard || window.unsavedGuard.__gtmosSaveIndicatorBound) return;
        var origDirty = unsavedGuard.markDirty;
        window.unsavedGuard.__gtmosSaveIndicatorBound = true;
        if (origDirty) {
            unsavedGuard.markDirty = function () {
                origDirty.call(unsavedGuard);
                indicator.unsaved();
            };
        }
    }

    var indicator = {
        /**
         * Mount the indicator chip into a container element.
         * @param {string|Element} target — CSS selector or DOM element to append into
         * @param {object} opts — { position: 'append'|'prepend'|'after-h1' }
         */
        mount: function (target, opts) {
            injectStyles();
            opts = opts || {};
            var container = typeof target === 'string' ? document.querySelector(target) : target;
            if (!container) return;

            var existing = container.querySelector('.si-chip[data-save-indicator="true"]');
            if (existing) {
                chipEl = existing;
                bindGuardOnce();
                return this;
            }

            chipEl = document.createElement('span');
            chipEl.className = 'si-chip si-idle';
            chipEl.setAttribute('role', 'status');
            chipEl.setAttribute('aria-live', 'polite');
            chipEl.setAttribute('data-save-indicator', 'true');

            if (opts.position === 'prepend') {
                container.insertBefore(chipEl, container.firstChild);
            } else {
                container.appendChild(chipEl);
            }

            bindGuardOnce();
            return this;
        },

        /** Insert chip right after a specific element */
        mountAfter: function (target) {
            injectStyles();
            var el = typeof target === 'string' ? document.querySelector(target) : target;
            if (!el || !el.parentNode) return this;

            var sibling = el.nextElementSibling;
            if (sibling && sibling.matches('.si-chip[data-save-indicator="true"]')) {
                chipEl = sibling;
                bindGuardOnce();
                return this;
            }

            var existing = el.parentNode.querySelector('.si-chip[data-save-indicator="true"]');
            if (existing) {
                chipEl = existing;
                bindGuardOnce();
                return this;
            }

            chipEl = document.createElement('span');
            chipEl.className = 'si-chip si-idle';
            chipEl.setAttribute('role', 'status');
            chipEl.setAttribute('aria-live', 'polite');
            chipEl.setAttribute('data-save-indicator', 'true');
            el.parentNode.insertBefore(chipEl, el.nextSibling);

            bindGuardOnce();
            return this;
        },

        saving: function () {
            this._set('saving');
        },

        saved: function (label) {
            this._set('saved', label);
            clearTimeout(fadeTimer);
            fadeTimer = setTimeout(function () {
                if (chipEl && chipEl.classList.contains('si-saved')) {
                    chipEl.classList.add('si-faded');
                }
            }, 3000);
        },

        unsaved: function () {
            clearTimeout(fadeTimer);
            this._set('unsaved');
        },

        error: function (msg) {
            clearTimeout(fadeTimer);
            this._set('error', msg);
        },

        _set: function (state, customText) {
            if (!chipEl) return;
            var s = STATES[state] || STATES.idle;
            chipEl.className = 'si-chip ' + s.cls;
            chipEl.textContent = customText || s.text;
            // Show a timestamp on hover for saved state
            if (state === 'saved') {
                chipEl.title = 'Last saved: ' + new Date().toLocaleTimeString();
            } else {
                chipEl.title = '';
            }
        },

        /** Get the chip element (for custom positioning) */
        getElement: function () { return chipEl; },

        /** Destroy the chip */
        destroy: function () {
            if (chipEl && chipEl.parentNode) chipEl.parentNode.removeChild(chipEl);
            chipEl = null;
            clearTimeout(fadeTimer);
        }
    };

    window.saveIndicator = indicator;
})();
