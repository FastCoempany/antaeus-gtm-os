(function() {
    'use strict';

    if (window.TourGuide && window.TourGuide.__gtmosPhase23) return;

    function esc(value) {
        var node = document.createElement('div');
        node.textContent = value == null ? '' : String(value);
        return node.innerHTML;
    }

    function parse(raw, fallback) {
        if (raw == null || raw === '') return fallback;
        try { return JSON.parse(raw); } catch (e) { return fallback; }
    }

    function getScoped(key, fallback) {
        if (window.gtmLocalState && typeof window.gtmLocalState.get === 'function') {
            return window.gtmLocalState.get(key, fallback, { scope: 'user' });
        }
        try { return parse(localStorage.getItem(key), fallback); } catch (e) { return fallback; }
    }

    function setScoped(key, value) {
        if (window.gtmLocalState && typeof window.gtmLocalState.set === 'function') {
            window.gtmLocalState.set(key, value, { scope: 'user' });
            return;
        }
        try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch (e) {}
    }

    function removeScoped(key) {
        if (window.gtmLocalState && typeof window.gtmLocalState.remove === 'function') {
            window.gtmLocalState.remove(key, { scope: 'user' });
            return;
        }
        try { localStorage.removeItem(key); } catch (e) {}
    }

    function roleValue(summary) {
        var profile = summary && summary.profile ? summary.profile : {};
        var onboarding = summary && summary.onboarding && summary.onboarding.answers ? summary.onboarding.answers : {};
        return String(profile.role || onboarding.role || 'founder').trim().toLowerCase();
    }

    function roleLabel(role) {
        var raw = String(role || 'founder').replace(/[_-]+/g, ' ').trim();
        return raw.split(/\s+/).filter(Boolean).map(function(part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join(' ') || 'Founder';
    }

    function readJson(key, fallback) {
        try { return parse(localStorage.getItem(key), fallback); } catch (e) { return fallback; }
    }

    function fallbackSummary() {
        return {
            profile: readJson('gtmos_profile', {}),
            onboarding: readJson('gtmos_onboarding', {}),
            icpAnalytics: readJson('gtmos_icp_analytics', {}),
            deals: readJson('gtmos_active_deals', []),
            discovery: readJson('gtmos_discovery', {}),
            sequences: readJson('gtmos_sequences', {}),
            signalConsole: { accounts: readJson('gtmos_signal_accounts', []) }
        };
    }

    function buildCounts(summary) {
        var icps = summary && summary.icpAnalytics && Array.isArray(summary.icpAnalytics.icps) ? summary.icpAnalytics.icps : [];
        var deals = summary && Array.isArray(summary.deals) ? summary.deals : [];
        var accounts = summary && summary.signalConsole && Array.isArray(summary.signalConsole.accounts) ? summary.signalConsole.accounts : [];
        var signals = accounts.reduce(function(total, account) {
            return total + ((account && Array.isArray(account.signals)) ? account.signals.length : 0);
        }, 0);
        var discovery = summary && summary.discovery && summary.discovery.stats ? summary.discovery.stats : {};
        var sequences = summary && summary.sequences ? summary.sequences : {};
        var touches = (Array.isArray(sequences.outboundTouches && sequences.outboundTouches.touches) ? sequences.outboundTouches.touches.length : 0) +
            (Array.isArray(sequences.linkedinLog && sequences.linkedinLog.actions) ? sequences.linkedinLog.actions.length : 0);
        var calls = Number(discovery.totalCalls || 0) || 0;
        return { icps: icps.length, deals: deals.length, accounts: accounts.length, signals: signals, touches: touches, calls: calls, motions: touches + calls };
    }

    var TourGuide = {
        __gtmosPhase23: true,
        AUTO_TOUR_KEY: 'gtmos_tour_autostart',
        STATE_KEY: 'gtmos_tour_state',
        DONE_KEY: 'gtmos_tour_completed',
        PROMPTED_KEY: 'gtmos_tour_prompted',
        PENDING_KEY: 'gtmos_tour_pending',
        currentPathKey: null,
        currentStep: 0,
        currentSteps: [],
        summaryCache: null,
        isActive: false,

        async loadSummary(force) {
            if (!force && this.summaryCache) return this.summaryCache;
            if (window.gtmPersistence && window.gtmPersistence.workspace && typeof window.gtmPersistence.workspace.loadSummary === 'function') {
                try {
                    var result = await window.gtmPersistence.workspace.loadSummary(null, force ? { force: true } : {});
                    this.summaryCache = result && result.data ? result.data : fallbackSummary();
                    return this.summaryCache;
                } catch (error) {
                    console.error('Tour summary preload failed:', error);
                }
            }
            this.summaryCache = fallbackSummary();
            return this.summaryCache;
        },

        readState: function() { return getScoped(this.STATE_KEY, null); },
        writeState: function(next) { setScoped(this.STATE_KEY, next); this.syncButtons(); },
        clearState: function() { removeScoped(this.STATE_KEY); this.syncButtons(); },
        hasSeenTour: function() { return getScoped(this.DONE_KEY, 'false') === 'true'; },
        markSeen: function() { setScoped(this.DONE_KEY, 'true'); },
        hasPromptedTour: function() { return getScoped(this.PROMPTED_KEY, 'false') === 'true'; },
        markPromptedTour: function() { setScoped(this.PROMPTED_KEY, 'true'); },
        readPending: function() { return getScoped(this.PENDING_KEY, null); },
        writePending: function(next) { setScoped(this.PENDING_KEY, next); },
        clearPending: function() { removeScoped(this.PENDING_KEY); },

        syncButtons: function() {
            var state = this.readState();
            var label = this.isActive ? 'Pause Tour' : (state && state.paused ? 'Resume Tour' : 'Tour the App');
            document.querySelectorAll('.nav-tour-glow, [data-tour-button]').forEach(function(btn) {
                btn.textContent = label;
            });
        },

        consumeAutoLaunch: function() {
            try {
                var params = new URLSearchParams(window.location.search || '');
                var queryFlag = params.get('tour') === '1';
                var sessionFlag = sessionStorage.getItem(this.AUTO_TOUR_KEY) === '1';
                if (queryFlag || sessionFlag) {
                    sessionStorage.removeItem(this.AUTO_TOUR_KEY);
                    return true;
                }
            } catch (e) {}
            return false;
        },

        hasDemoSeed: function() {
            try { return !!(localStorage.getItem('gtmos_demo__gtmos_demo_seed_meta') || localStorage.getItem('gtmos_demo_seed_meta')); }
            catch (e) { return false; }
        },

        resumePendingOrState: function() {
            var pending = this.readPending();
            if (pending && pending.pathKey) {
                this.clearPending();
                return this.beginPath(pending.pathKey, {
                    startStep: Number(pending.currentStep || 0) || 0,
                    resume: true
                });
            }
            var state = this.readState();
            if (state && state.pathKey) {
                return this.beginPath(state.pathKey, {
                    startStep: Number(state.currentStep || 0) || 0,
                    resume: !!state.paused
                });
            }
            return this.launch({ auto: true, resumePreferred: true });
        },

        inferPath: function(summary) {
            var value = roleValue(summary);
            return (value.indexOf('founder') !== -1 || value.indexOf('ceo') !== -1) ? 'founder' : 'operator';
        },

        getNextThing: function(counts) {
            if (!counts.icps) return { target:'[data-nav="icp-studio"]', title:'Start with ICP Studio', text:'One saved ICP turns the rest of the app from opinion into targeting truth.', unlock:'[data-nav="signal-console"]', why:'That unlocks real account research and makes outbound more believable.' };
            if (!(counts.accounts || counts.signals)) return { target:'[data-nav="signal-console"]', title:'Research one live account', text:'Signal Console is where the app stops being abstract and starts operating on live context.', unlock:'[data-nav="outbound-studio"]', why:'That context gives outbound and discovery something real to work from.' };
            if (!counts.deals) return { target:'[data-nav="deal-workspace"]', title:'Create the first live deal', text:'A real opportunity activates the dashboard, proof lanes, and handoff logic.', unlock:'[data-nav="dashboard"]', why:'Once a deal exists, the dashboard stops briefing an empty workspace.' };
            if (!counts.motions) return { target:'[data-nav="outbound-studio"]', title:'Log the first live motion', text:'Touches and calls are the difference between setup and operating memory.', unlock:'[data-nav="discovery-agenda"]', why:'From there the app can help with the next real conversation.' };
            if (!counts.calls) return { target:'[data-nav="discovery-agenda"]', title:'Prep the next discovery call', text:'This is how call quality becomes deliberate instead of improvised.', unlock:'[data-nav="discovery-studio"]', why:'Then the live discovery lane becomes useful in the room.' };
            return { target:'[data-nav="founding-gtm"]', title:'Turn the work into the handoff kit', text:'You now have enough truth for the supreme output to matter.', unlock:'[data-nav="readiness"]', why:'That is what lets readiness answer whether a new hire would inherit a real system.' };
        },

        buildSteps: function(summary, pathKey) {
            var counts = buildCounts(summary);
            var intro = (window.gtmEnvironment && window.gtmEnvironment.isDemo) ? [{
                target: '.sidebar-data-notice',
                title: 'This is sample data, not a fake product',
                text: 'The records are seeded. The workflows, persistence, and module handshakes are the real app.',
                position: 'right'
            }] : [];
            if (pathKey === 'founder') {
                return intro.concat([
                    { target:'[data-nav="dashboard"]', title:'Run GTM from one command view', text:'The dashboard should become the weekly picture of what is real, what is drifting, and what happens next.', position:'right' },
                    { target:'[data-nav="icp-studio"]', title:'Define who deserves your time', text:'ICP Studio exists so founder-led selling stops relying on fuzzy market memory.', position:'right' },
                    { target:'[data-nav="signal-console"]', title:'Find live accounts and reasons to care now', text:'This is where the market stops being theoretical and turns into real external context.', position:'right' },
                    { target:'[data-nav="deal-workspace"]', title:'Force every real opportunity into the system', text:'If the deal does not live here, the rest of the app cannot reason honestly about pipeline or next moves.', position:'right' },
                    { target:'[data-nav="discovery-agenda"]', title:'Plan the next call before it happens', text:'Discovery quality is one of the fastest ways to become hire-ready.', position:'right' },
                    { target:'[data-nav="readiness"]', title:'Keep asking the hiring question', text:'Readiness is the meta score: is this a system yet, or is the founder still the system?', position:'right' },
                    { target:'[data-nav="founding-gtm"]', title:'This is the supreme output', text:'Every module is supposed to compound into the playbook and handoff kit your first AE can run on day one.', position:'right' }
                ]);
            }
            if (pathKey === 'next') {
                var next = this.getNextThing(counts);
                return intro.concat([
                    { target:next.target, title:'This is the next thing that matters', text:next.text, position:'right' },
                    { target:next.unlock, title:'What that unlocks next', text:next.why, position:'right' },
                    { target:'[data-nav="founding-gtm"]', title:'Why it compounds', text:'The job is not to fill modules. The job is to build toward the handoff kit.', position:'right' }
                ]);
            }
            return intro.concat([
                { target:'[data-nav="dashboard"]', title:'Run execution from one operating view', text:'An operator should be able to start here and know what matters this week.', position:'right' },
                { target:'[data-nav="signal-console"]', title:'Pull context before touching outbound', text:'Signal Console exists so outreach starts from account truth, not generic scripts.', position:'right' },
                { target:'[data-nav="territory-architect"]', title:'Translate ICP into a targetable territory', text:'Territory turns targeting into a real account map.', position:'right' },
                { target:'[data-nav="outbound-studio"]', title:'Make weekly outbound repeatable', text:'This is where targeting becomes motion instead of founder improv.', position:'right' },
                { target:'[data-nav="discovery-agenda"]', title:'Prep the next conversation deliberately', text:'Signal, targeting, and deal context should carry into the next call.', position:'right' },
                { target:'[data-nav="poc-framework"]', title:'Structure late-stage proof', text:'Validation work should feel like a lane, not a scramble after interest appears.', position:'right' },
                { target:'[data-nav="founding-gtm"]', title:'Make the work survive you', text:'The playbook matters because execution should leave behind a system another person can inherit.', position:'right' }
            ]);
        },

        ensureButton: function() {
            var footer = document.querySelector('.sidebar-footer');
            if (!footer || footer.querySelector('.nav-tour-glow, [data-tour-button]')) return;
            var btn = document.createElement('button');
            btn.className = 'btn btn-ghost btn-sm btn-block mt-sm';
            btn.setAttribute('data-tour-button', 'true');
            btn.textContent = 'Tour the App';
            btn.onclick = () => this.launch();
            footer.insertBefore(btn, footer.firstChild);
        },

        init: function() {
            this.ensureButton();
            this.syncButtons();
            if (this.consumeAutoLaunch()) {
                setTimeout(() => this.resumePendingOrState(), 900);
            } else if (!this.hasSeenTour() && !this.hasPromptedTour()) {
                this.markPromptedTour();
                setTimeout(() => this.launch({ auto: true }), 1000);
            }
        },

        launch: async function(options) {
            options = options || {};
            if (this.isActive) return this.pause();
            var state = this.readState();
            if ((options.resumePreferred || !options.auto) && state && state.pathKey) return this.resume();
            var summary = await this.loadSummary(false);
            this.createFrame();
            this.renderChooser(summary, options.auto === true);
        },

        resume: async function() {
            var state = this.readState();
            if (!state || !state.pathKey) return this.launch({ auto: false });
            return this.beginPath(state.pathKey, { startStep: Number(state.currentStep || 0) || 0, resume: true });
        },

        beginPath: async function(pathKey, options) {
            options = options || {};
            var summary = await this.loadSummary(false);
            var counts = buildCounts(summary);
            this.currentPathKey = pathKey;
            this.currentSteps = this.buildSteps(summary, pathKey);
            this.currentStep = Math.max(0, Math.min(options.startStep || 0, this.currentSteps.length - 1));
            this.writeState({ pathKey: pathKey, currentStep: this.currentStep, paused: false, updatedAt: new Date().toISOString() });

            if (!(window.gtmEnvironment && window.gtmEnvironment.isDemo && this.hasDemoSeed())) {
                var scenario = pathKey === 'operator' ? 'ent' : ((pathKey === 'next' && counts.deals > 0) ? 'ent' : 'mm');
                this.writePending({ pathKey: pathKey, currentStep: this.currentStep, createdAt: new Date().toISOString() });
                try { sessionStorage.setItem(this.AUTO_TOUR_KEY, '1'); } catch (e) {}
                if (window.gtmAnalytics) gtmAnalytics.track('tour_branch_selected', { path: pathKey, demo_redirect: true, scenario: scenario, role: roleLabel(roleValue(summary)) });
                window.location.href = '/demo-seed.html?autoseed=' + encodeURIComponent(scenario) + '&tour=1&return=' + encodeURIComponent('/app/dashboard/?demo=1&tour=1');
                return;
            }

            this.isActive = true;
            this.clearPending();
            this.createFrame();
            this.syncButtons();
            this.showStep();
            if (window.gtmAnalytics) gtmAnalytics.track(options.resume ? 'tour_resumed' : 'tour_started', { path: pathKey, step_count: this.currentSteps.length, start_step: this.currentStep + 1, role: roleLabel(roleValue(summary)) });
        },

        pause: function() {
            if (!this.currentPathKey) return;
            this.writeState({ pathKey: this.currentPathKey, currentStep: this.currentStep, paused: true, updatedAt: new Date().toISOString() });
            this.isActive = false;
            this.removeFrame();
            if (window.gtmAnalytics) gtmAnalytics.track('tour_paused', { path: this.currentPathKey, step: this.currentStep + 1 });
        },

        showNextThingPath: function() {
            this.isActive = false;
            this.removeFrame();
            return this.beginPath('next', { startStep: 0 });
        },

        createFrame: function() {
            this.removeFrame();
            var overlay = document.createElement('div');
            overlay.className = 'tour-overlay active';
            overlay.onclick = (e) => { if (e.target === overlay) this.pause(); };
            document.body.appendChild(overlay);
            var tooltip = document.createElement('div');
            tooltip.className = 'tour-tooltip active';
            tooltip.id = 'tourTooltip';
            document.body.appendChild(tooltip);
        },

        removeFrame: function() {
            document.querySelectorAll('.tour-overlay, .tour-tooltip').forEach(function(el) { el.remove(); });
            document.querySelectorAll('.tour-highlight').forEach(function(el) { el.classList.remove('tour-highlight'); });
            this.syncButtons();
        },

        renderChooser: function(summary, isAuto) {
            var tooltip = document.getElementById('tourTooltip');
            if (!tooltip) return;
            var state = this.readState();
            var recommended = this.inferPath(summary);
            var note = (window.gtmEnvironment && window.gtmEnvironment.isDemo) ? 'Sample data is already live.' : 'The tour will load sample data first. Your real workspace stays intact.';
            tooltip.className = 'tour-tooltip active tour-tooltip-wide';
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            tooltip.innerHTML =
                '<div class="tour-tooltip-title">How do you want to understand the product?</div>' +
                '<div class="tour-tooltip-text">You are signed in as ' + esc(roleLabel(roleValue(summary))) + '. Pick the lens that makes the system easiest to believe.</div>' +
                '<div class="tour-chip-row"><span class="tour-chip">' + esc(note) + '</span><span class="tour-chip">' + esc(isAuto ? 'first launch' : 'manual launch') + '</span></div>' +
                '<div class="tour-chooser-grid">' +
                    '<button class="tour-choice' + (recommended === 'founder' ? ' recommended' : '') + '" onclick="TourGuide.beginPath(\'founder\')"><div class="tour-choice-label">Founder path</div><div class="tour-choice-copy">See how the app turns founder-led GTM into a real operating system.</div><div class="tour-choice-meta">' + esc(recommended === 'founder' ? 'Recommended for your current role' : 'Best if you still carry GTM personally') + '</div></button>' +
                    '<button class="tour-choice' + (recommended === 'operator' ? ' recommended' : '') + '" onclick="TourGuide.beginPath(\'operator\')"><div class="tour-choice-label">First AE / operator path</div><div class="tour-choice-copy">See how the system supports targeting, motion, discovery, and execution.</div><div class="tour-choice-meta">' + esc(recommended === 'operator' ? 'Recommended for your current role' : 'Best if you think in execution loops') + '</div></button>' +
                    '<button class="tour-choice" onclick="TourGuide.beginPath(\'next\')"><div class="tour-choice-label">Show me the next thing that matters</div><div class="tour-choice-copy">Use my current workspace state and point me to the single next move that will make the app more believable.</div><div class="tour-choice-meta">Adaptive to saved ICPs, signals, deals, and motions</div></button>' +
                    (state && state.paused && state.pathKey ? '<button class="tour-choice" onclick="TourGuide.resume()"><div class="tour-choice-label">Resume previous tour</div><div class="tour-choice-copy">Continue where you left off in the ' + esc(state.pathKey) + ' path.</div><div class="tour-choice-meta">Step ' + esc((Number(state.currentStep || 0) || 0) + 1) + ' waiting</div></button>' : '') +
                '</div>' +
                '<div class="tour-tooltip-actions"><span class="tour-progress">Phase 23 tour rebuild</span><div class="tour-action-row"><button class="btn btn-ghost btn-sm" onclick="TourGuide.end({ markSeen: true, reason: \'chooser_skip\' })">Skip for now</button></div></div>';
            this.isActive = true;
            this.syncButtons();
        },

        showStep: function() {
            var step = this.currentSteps[this.currentStep];
            if (!step) return this.end({ markSeen: true, reason: 'finished' });
            var tooltip = document.getElementById('tourTooltip');
            if (!tooltip) return;
            var target = document.querySelector(step.target);
            document.querySelectorAll('.tour-highlight').forEach(function(el) { el.classList.remove('tour-highlight'); });
            if (target) {
                target.classList.add('tour-highlight');
                try { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
            }
            var pathLabel = this.currentPathKey === 'founder' ? 'Founder path' : (this.currentPathKey === 'operator' ? 'First AE / operator path' : 'Next thing path');
            tooltip.className = 'tour-tooltip active';
            tooltip.innerHTML =
                '<div class="tour-tooltip-title">' + esc(step.title) + '</div>' +
                '<div class="tour-chip-row"><span class="tour-chip">' + esc(pathLabel) + '</span>' + (this.currentPathKey !== 'next' ? '<button class="tour-helper-link" onclick="TourGuide.showNextThingPath()">Show me the next thing that matters</button>' : '') + '</div>' +
                '<div class="tour-tooltip-text">' + esc(step.text) + '</div>' +
                '<div class="tour-tooltip-actions"><span class="tour-progress">' + esc(this.currentStep + 1) + ' / ' + esc(this.currentSteps.length) + '</span><div class="tour-action-row"><button class="btn btn-ghost btn-sm" onclick="TourGuide.pause()">Pause</button><button class="btn btn-ghost btn-sm" onclick="TourGuide.end({ markSeen: true, reason: \'skip\' })">Skip</button><button class="btn btn-primary btn-sm" onclick="TourGuide.next()">' + (this.currentStep === this.currentSteps.length - 1 ? 'Finish' : 'Next') + '</button></div></div>';

            if (target) {
                var rect = target.getBoundingClientRect();
                var tooltipWidth = tooltip.offsetWidth || 360;
                var tooltipHeight = tooltip.offsetHeight || 220;
                var top = rect.top;
                var left = rect.right + 20;
                if (step.position === 'top') { top = rect.top - tooltipHeight - 20; left = rect.left; }
                if (step.position === 'bottom') { top = rect.bottom + 20; left = rect.left; }
                left = Math.min(left, window.innerWidth - tooltipWidth - 16);
                left = Math.max(16, left);
                top = Math.min(top, window.innerHeight - tooltipHeight - 16);
                top = Math.max(16, top);
                tooltip.style.top = top + 'px';
                tooltip.style.left = left + 'px';
                tooltip.style.transform = '';
            } else {
                tooltip.style.top = '50%';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translate(-50%, -50%)';
            }

            this.writeState({ pathKey: this.currentPathKey, currentStep: this.currentStep, paused: false, updatedAt: new Date().toISOString() });
            if (window.gtmAnalytics) gtmAnalytics.track('tour_step_viewed', { path: this.currentPathKey, step_index: this.currentStep + 1, step_title: step.title });
        },

        next: function() {
            this.currentStep += 1;
            if (this.currentStep >= this.currentSteps.length) return this.end({ markSeen: true, reason: 'finished' });
            this.showStep();
        },

        end: function(options) {
            options = options || {};
            if (options.markSeen !== false) this.markSeen();
            var pathKey = this.currentPathKey || 'unknown';
            var stepsSeen = this.currentStep + 1;
            this.isActive = false;
            this.currentPathKey = null;
            this.currentSteps = [];
            this.currentStep = 0;
            this.clearPending();
            this.clearState();
            this.removeFrame();
            if (window.gtmAnalytics) gtmAnalytics.track(options.reason === 'finished' ? 'tour_completed' : 'tour_closed', { path: pathKey, reason: options.reason || 'ended', steps_seen: stepsSeen });
        }
    };

    window.TourGuide = TourGuide;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function() { TourGuide.init(); });
    else TourGuide.init();
})();
