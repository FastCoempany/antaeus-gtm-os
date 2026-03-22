(function() {
    function resolveTarget(target) {
        if (!target) return null;
        if (typeof target === 'string') return document.querySelector(target);
        return target;
    }

    function esc(text) {
        var node = document.createElement('div');
        node.textContent = text || '';
        return node.innerHTML;
    }

    function palette(kind) {
        if (kind === 'error') {
            return {
                border: 'rgba(239,68,68,0.28)',
                bg: 'rgba(239,68,68,0.05)',
                eyebrow: '#f87171'
            };
        }
        return {
            border: 'rgba(59,130,246,0.25)',
            bg: 'rgba(59,130,246,0.05)',
            eyebrow: '#60a5fa'
        };
    }

    function buildHtml(kind, options) {
        var colors = palette(kind);
        var html = '<div data-gtmos-boot-card="true" style="padding:18px 20px;border-radius:12px;border:1px solid ' + colors.border + ';background:' + colors.bg + ';margin-bottom:16px;">';
        html += '<div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;color:' + colors.eyebrow + ';margin-bottom:8px;">' + (kind === 'error' ? 'Load failed' : 'Loading module') + '</div>';
        html += '<div style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;">' + esc(options.title || '') + '</div>';
        html += '<div style="font-size:0.84rem;color:var(--text-tertiary);line-height:1.6;">' + esc(options.text || '') + '</div>';
        if (kind === 'error' && options.retryAction) {
            html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">';
            html += '<button type="button" onclick="' + options.retryAction + '()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;border:1px solid var(--border-default);background:transparent;color:var(--text-secondary);font:inherit;font-size:0.76rem;font-weight:700;cursor:pointer;">' + esc(options.retryLabel || 'Retry') + '</button>';
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    window.gtmModuleBootState = {
        show: function(target, options) {
            var node = resolveTarget(target);
            if (!node) return;
            options = options || {};
            node.innerHTML = buildHtml(options.kind === 'error' ? 'error' : 'loading', options);
            node.setAttribute('data-gtmos-boot-state-mounted', 'true');
        },
        clear: function(target) {
            var node = resolveTarget(target);
            if (!node) return;
            if (node.getAttribute('data-gtmos-boot-state-mounted') === 'true') {
                node.innerHTML = '';
                node.removeAttribute('data-gtmos-boot-state-mounted');
            }
        }
    };
})();
