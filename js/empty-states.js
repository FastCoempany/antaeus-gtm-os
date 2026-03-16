/**
 * GTMOS Empty States — v27 Phase 4
 * 
 * Provides two utilities:
 *   1) emptyState.render(containerId, config) — inserts [Icon] [Pitch] [Why] [CTA]
 *   2) emptyState.example(containerId, exampleHtml) — adds "See an example" toggle
 * 
 * Config shape:
 *   { icon, pitch, why, cta, ctaLink, ctaOnClick }
 */

(function() {
    'use strict';

    function injectStyles() {
        if (document.getElementById('emptyStateStyles')) return;
        var style = document.createElement('style');
        style.id = 'emptyStateStyles';
        style.textContent = '' +
            '.es-card{text-align:center;padding:48px 32px;max-width:420px;margin:40px auto;}' +
            '.es-icon{font-size:2.5rem;margin-bottom:16px;display:block;}' +
            '.es-pitch{font-family:var(--font-serif,"DM Serif Display",serif);font-size:1.25rem;color:var(--text-primary,#e2e8f0);margin-bottom:8px;line-height:1.3;}' +
            '.es-why{font-size:0.85rem;color:var(--text-tertiary,#94a3b8);margin-bottom:24px;line-height:1.5;}' +
            '.es-cta{display:inline-block;padding:10px 24px;background:var(--brand-gold,#d4a574);color:var(--bg-primary,#0a0e1a);border-radius:8px;font-weight:700;font-size:0.9rem;text-decoration:none;cursor:pointer;border:none;font-family:inherit;transition:opacity 0.2s;}' +
            '.es-cta:hover{opacity:0.9;}' +
            '.es-example-toggle{display:block;margin:16px auto 0;background:none;border:none;color:var(--text-muted,#64748b);font-size:0.8rem;cursor:pointer;padding:6px 12px;font-family:inherit;transition:color 0.2s;}' +
            '.es-example-toggle:hover{color:var(--text-secondary,#cbd5e1);}' +
            '.es-example-panel{display:none;margin-top:20px;padding:20px;background:rgba(255,255,255,0.03);border:1px solid var(--border-default,#2d3748);border-radius:12px;text-align:left;font-size:0.82rem;color:var(--text-secondary,#cbd5e1);line-height:1.5;max-width:480px;margin-left:auto;margin-right:auto;}' +
            '.es-example-panel.open{display:block;animation:esFadeIn 0.3s ease;}' +
            '.es-example-label{display:block;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--brand-gold,#d4a574);margin-bottom:8px;}' +
            '@keyframes esFadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}';
        document.head.appendChild(style);
    }

    // ── Render Empty State ──────────────────────────────────────────
    function render(containerId, config) {
        injectStyles();
        var container = document.getElementById(containerId);
        if (!container) return;

        var ctaHtml = '';
        if (config.ctaLink) {
            ctaHtml = '<a class="es-cta" href="' + config.ctaLink + '">' + (config.cta || 'Get Started') + '</a>';
        } else if (config.ctaOnClick) {
            ctaHtml = '<button class="es-cta" onclick="' + config.ctaOnClick + '">' + (config.cta || 'Get Started') + '</button>';
        }

        container.innerHTML = '' +
            '<div class="es-card">' +
                '<span class="es-icon">' + (config.icon || '📦') + '</span>' +
                '<div class="es-pitch">' + (config.pitch || '') + '</div>' +
                '<div class="es-why">' + (config.why || '') + '</div>' +
                ctaHtml +
            '</div>';

        return container;
    }

    // ── Add "See an example" Toggle ─────────────────────────────────
    function addExample(containerId, exampleHtml) {
        injectStyles();
        var container = document.getElementById(containerId);
        if (!container) return;

        // Find the es-card inside or use container directly
        var card = container.querySelector('.es-card') || container;

        var toggleId = 'esExample_' + Math.random().toString(36).substr(2, 6);
        var panelId = 'esPanel_' + toggleId;

        var toggleBtn = document.createElement('button');
        toggleBtn.className = 'es-example-toggle';
        toggleBtn.textContent = '👁 See an example';
        toggleBtn.onclick = function() {
            var panel = document.getElementById(panelId);
            var isOpen = panel.classList.contains('open');
            panel.classList.toggle('open');
            toggleBtn.textContent = isOpen ? '👁 See an example' : '✕ Hide example';
        };

        var panel = document.createElement('div');
        panel.className = 'es-example-panel';
        panel.id = panelId;
        panel.innerHTML = '<span class="es-example-label">Example</span>' + exampleHtml;

        card.appendChild(toggleBtn);
        card.appendChild(panel);
    }

    // ── Module-Specific Empty State Configs ─────────────────────────
    var MODULE_CONFIGS = {
        'icp-studio': {
            icon: '🎯',
            pitch: 'Define who you sell to.',
            why: 'Your ICP drives every downstream decision — outbound targeting, discovery questions, deal qualification. Start here and the rest of the system gets smarter.',
            cta: 'Build Your First ICP →',
            ctaOnClick: "document.querySelector('.builder-section')&&document.querySelector('.builder-section').scrollIntoView({behavior:'smooth'})",
            example: '<strong>Mid-market fintech, 200-2000 employees</strong><br>Buyer: VP Compliance<br>Pain: Manual audit processes costing 40+ hours/quarter<br>Trigger: New regulatory requirement announced<br>Score: Tier 1 — High intent, fast cycle'
        },
        'outbound-studio': {
            icon: '🚀',
            pitch: 'Turn triggers into conversations.',
            why: 'Every saved angle teaches the system what resonates. After 5+ angles, patterns emerge — which triggers get replies, which personas engage, which messaging converts.',
            cta: 'Build Your First Angle →',
            ctaOnClick: "document.getElementById('in_trigger')&&document.getElementById('in_trigger').focus()",
            example: '<strong>Trigger:</strong> Company just raised Series B<br><strong>Persona:</strong> VP Sales / CRO<br><strong>Angle:</strong> "Post-funding scaling pain"<br><strong>Email:</strong> Congrats on the raise. Most Series B companies triple headcount in 12 months but keep the same sales infrastructure...'
        },
        'deal-workspace': {
            icon: '🤝',
            pitch: 'Your deals, qualified.',
            why: 'Every deal gets a qualification score. Over time, patterns emerge — which qualification signals predict wins, and which deals you should have walked away from sooner.',
            cta: 'Add Your First Deal →',
            ctaOnClick: "document.getElementById('addDealBtn')&&document.getElementById('addDealBtn').click()",
            example: '<strong>Northstar Health — $180K</strong><br>Qual Score: 16/18 STRONG<br>Gates: ✅ Champion ✅ EB Engaged ✅ Timeline ✅ Process<br>Next: Security review Wednesday<br>Last touched: 2 days ago'
        },
        'quota-workback': {
            icon: '🧮',
            pitch: 'Quota is a math problem.',
            why: 'Work backward from your annual target to daily activity requirements. When you know the exact number of calls, emails, and meetings needed per day, pipeline stops being a mystery.',
            cta: 'Set Your Numbers →',
            ctaOnClick: "document.getElementById('annualQuotaInput')&&document.getElementById('annualQuotaInput').focus()"
        },
        'discovery-agenda': {
            icon: '⏱️',
            pitch: 'Never wing a discovery call.',
            why: 'The 10 minutes before a call determine its outcome. Prep your agenda, set qualification gates, and walk in with a hypothesis — not a script.',
            cta: 'Prep Your Next Call →',
            ctaOnClick: "document.getElementById('in_contact')&&document.getElementById('in_contact').focus()",
            example: '<strong>Call with Sarah Chen, VP Ops @ Acme</strong><br>Focus: Operational efficiency post-acquisition<br>Hypothesis: Integration pain creating manual workarounds<br>Gates: ☑ Problem confirmed ☐ Budget holder identified'
        },
        'discovery-studio': {
            icon: '🔍',
            pitch: 'Discovery that advances deals.',
            why: 'Track which questions uncover real pain, which territories lead to next steps, and which calls advance. After 10+ calls, the system shows you your discovery fingerprint.',
            cta: 'Start a Discovery Session →',
            ctaOnClick: "document.getElementById('frameworkSelect')&&document.getElementById('frameworkSelect').focus()"
        },
        'founding-gtm': {
            icon: '🏗️',
            pitch: 'Build a motion someone else can follow.',
            why: 'Every field in this playbook gets auto-populated as you use the other modules. By the time you hit Readiness 80, this document IS your sales hire\'s onboarding manual.',
            cta: 'Start Building →',
            ctaOnClick: "document.querySelector('.gtm-section')&&document.querySelector('.gtm-section').classList.add('open')"
        },
        'cfo-negotiation': {
            icon: '💰',
            pitch: 'Win the procurement fight.',
            why: 'The deal is never closed until the CFO signs. Map the budget conversation, anticipate objections, and build your business case before the negotiation starts.',
            cta: 'Build a Business Case →'
        },
        'poc-framework': {
            icon: '🧪',
            pitch: 'Prove value before the contract.',
            why: 'A structured PoC converts skeptics into champions. Define success criteria upfront so both sides know what "working" looks like.',
            cta: 'Design a PoC →'
        },
        'asset-builder': {
            icon: '📄',
            pitch: 'Create sales collateral that sells.',
            why: 'One-pagers, case study briefs, ROI summaries — the content your buyer needs to sell internally. Built from your actual GTM data, not generic templates.',
            cta: 'Build Your First Asset →'
        },
        'dashboard': {
            icon: '📊',
            pitch: 'Your GTM command center.',
            why: 'Pipeline health, velocity, and patterns — all in one view. This dashboard comes alive as you use the system.',
            cta: 'Start with ICP Studio →',
            ctaLink: '/app/icp-studio/'
        }
    };

    // ── Public API ──────────────────────────────────────────────────
    window.emptyState = {
        render: render,
        addExample: addExample,
        configs: MODULE_CONFIGS
    };

})();
