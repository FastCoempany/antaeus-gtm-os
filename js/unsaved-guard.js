/**
 * GTMOS Unsaved-Changes Guard — Phase 1.2
 *
 * Prevents data loss on manual-save modules by warning before navigation.
 *
 * Usage:
 *   unsavedGuard.watch(containerSelector)  — watch all inputs in a container
 *   unsavedGuard.markClean()               — call after a successful save
 *   unsavedGuard.markDirty()               — force dirty state (e.g. programmatic changes)
 *   unsavedGuard.isDirty()                 — check state
 *
 * Auto-skips on pages that auto-save (checks for data-autosave attribute on body).
 */

(function () {
    'use strict';

    var dirty = false;
    var watching = false;
    var initialValues = {};

    function snapshot(container) {
        var inputs = container.querySelectorAll('input, textarea, select');
        var snap = {};
        inputs.forEach(function (el, i) {
            var key = el.id || el.name || ('__idx_' + i);
            snap[key] = el.type === 'checkbox' ? el.checked : el.value;
        });
        return snap;
    }

    function checkDirty(container) {
        var inputs = container.querySelectorAll('input, textarea, select');
        for (var i = 0; i < inputs.length; i++) {
            var el = inputs[i];
            var key = el.id || el.name || ('__idx_' + i);
            var current = el.type === 'checkbox' ? el.checked : el.value;
            if (initialValues[key] !== undefined && initialValues[key] !== current) {
                return true;
            }
        }
        return false;
    }

    function onBeforeUnload(e) {
        if (dirty) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    }

    // Intercept sidebar nav clicks
    function interceptNavClicks() {
        document.addEventListener('click', function (e) {
            if (!dirty) return;
            var link = e.target.closest('a[href]');
            if (!link) return;
            var href = link.getAttribute('href');
            // Only intercept internal navigation (starts with / or is relative)
            if (!href || href.charAt(0) === '#' || href.indexOf('://') > -1) return;
            if (!confirm('You have unsaved changes. Leave without saving?')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }

    var guard = {
        // Plan-compatible alias: unsavedGuard.track(selector)
        track: function (selector) {
            this.watch(selector || '.app-main');
        },

        /**
         * Watch all inputs inside a container for changes.
         * @param {string} selector - CSS selector for the container (e.g. '.app-main', '#playbookForm')
         */
        watch: function (selector) {
            // Skip if page declares itself as auto-save
            if (document.body && document.body.hasAttribute('data-autosave')) return;

            var container = document.querySelector(selector);
            if (!container) return;

            // Take initial snapshot
            initialValues = snapshot(container);

            // Listen for changes
            container.addEventListener('input', function () {
                dirty = checkDirty(container);
            });
            container.addEventListener('change', function () {
                dirty = checkDirty(container);
            });

            if (!watching) {
                window.addEventListener('beforeunload', onBeforeUnload);
                interceptNavClicks();
                watching = true;
            }
        },

        markClean: function () {
            dirty = false;
            // Re-snapshot current state as the new baseline
            var container = document.querySelector('[data-unsaved-watch]') ||
                document.querySelector('.app-main');
            if (container) {
                initialValues = snapshot(container);
            }
        },

        markDirty: function () {
            dirty = true;
        },

        isDirty: function () {
            return dirty;
        }
    };

    window.unsavedGuard = guard;
})();
