(function() {
    'use strict';

    if (window.gtmWeekOneLifecycle) return;

    var STATE_KEY = 'gtmos_week_one_state';
    var DASHBOARD_KEY = 'gtmos_week_one_dashboard_visits';
    var TOUR_KEY = 'gtmos_tour_completed';
    var DAY_MS = 24 * 60 * 60 * 1000;

    function parse(raw, fallback) {
        if (raw == null || raw === '') return fallback;
        try { return JSON.parse(raw); } catch (e) { return fallback; }
    }

    function esc(value) {
        var node = document.createElement('div');
        node.textContent = value == null ? '' : String(value);
        return node.innerHTML;
    }

    function scopedGet(key, fallback) {
        if (window.gtmLocalState && typeof window.gtmLocalState.get === 'function') {
            return window.gtmLocalState.get(key, fallback, { scope: 'user' });
        }
        try { return parse(localStorage.getItem(key), fallback); } catch (e) { return fallback; }
    }

    function scopedSet(key, value) {
        if (window.gtmLocalState && typeof window.gtmLocalState.set === 'function') {
            window.gtmLocalState.set(key, value, { scope: 'user' });
            return;
        }
        try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch (e) {}
    }

    function arr(value) {
        return Array.isArray(value) ? value : [];
    }

    function roleLabel(value) {
        var raw = String(value || 'founder').replace(/[_-]+/g, ' ').trim();
        return raw.split(/\s+/).filter(Boolean).map(function(part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join(' ') || 'Founder';
    }

    function buildCounts(summary) {
        var icps = arr(summary && summary.icpAnalytics && summary.icpAnalytics.icps);
        var deals = arr(summary && summary.deals);
        var accounts = arr(summary && summary.signalConsole && summary.signalConsole.accounts);
        var signals = accounts.reduce(function(total, account) {
            return total + arr(account && account.signals).length;
        }, 0);
        var discoveryStats = summary && summary.discovery && summary.discovery.stats ? summary.discovery.stats : {};
        var touchLog = summary && summary.sequences && summary.sequences.outboundTouches ? summary.sequences.outboundTouches : {};
        var linkedinLog = summary && summary.sequences && summary.sequences.linkedinLog ? summary.sequences.linkedinLog : {};
        var touches = arr(touchLog.touches).length + arr(linkedinLog.actions).length;
        var calls = Number(discoveryStats.totalCalls || 0) || 0;
        return {
            icps: icps.length,
            deals: deals.length,
            accounts: accounts.length,
            signals: signals,
            touches: touches,
            calls: calls,
            motions: touches + calls
        };
    }

    function getRole(summary) {
        var profile = summary && summary.profile ? summary.profile : {};
        var onboarding = summary && summary.onboarding && summary.onboarding.answers ? summary.onboarding.answers : {};
        return profile.role || onboarding.role || 'founder';
    }

    function getStartAt(summary) {
        var profile = summary && summary.profile ? summary.profile : {};
        var onboarding = summary && summary.onboarding ? summary.onboarding : {};
        var state = scopedGet(STATE_KEY, {});
        var startAt = profile.onboarding_completed_at || onboarding.completedAt || state.startedAt || null;
        if (!startAt) return null;
        if (!state.startedAt) {
            scopedSet(STATE_KEY, Object.assign({}, state, { startedAt: startAt }));
        }
        return startAt;
    }

    function getBackupStatus() {
        var manager = window.gtmDataManager || window.dataManager || null;
        if (!manager || typeof manager.getBackupStatus !== 'function') return null;
        return manager.getBackupStatus();
    }

    function hasSeenWelcome(summary) {
        if (typeof window.hasSeenWelcome !== 'function') return false;
        try { return !!window.hasSeenWelcome(summary && summary.profile ? summary.profile : null, null); }
        catch (e) { return false; }
    }

    function hasCompletedTour() {
        return scopedGet(TOUR_KEY, 'false') === 'true';
    }

    function buildMilestones(summary, counts, backup) {
        return [
            { key:'welcome', label:'Welcome corridor completed', done:hasSeenWelcome(summary), copy:'You have moved from account creation into the real app shell.' },
            { key:'tour', label:'Tour run once', done:hasCompletedTour(), copy:'The product story has been shown in a self-serve way.' },
            { key:'icp', label:'First ICP saved', done:counts.icps > 0, copy:'Targeting truth exists for the rest of the system.' },
            { key:'signal', label:'First account or signal saved', done:(counts.accounts > 0 || counts.signals > 0), copy:'Signal Console now contains live external context.' },
            { key:'deal', label:'First live deal created', done:counts.deals > 0, copy:'Dashboard, proof, and pipeline logic now have an honest object to reason about.' },
            { key:'motion', label:'First motion logged', done:counts.motions > 0, copy:'The app is storing real activity, not just setup answers.' },
            { key:'backup', label:'Offline backup exported', done:!!(backup && backup.hasExport), copy:'The workspace survives more than one browser and more than one lucky day.' }
        ];
    }

    function getNextAction(summary, counts, backup) {
        if (!hasSeenWelcome(summary)) return { href:'/app/welcome/', label:'Finish Welcome Guide', why:'The app should first orient you before it asks for real work.' };
        if (!hasCompletedTour()) return { href:'/app/dashboard/', label:'Run the Tour', why:'The first-week story should be legible without needing human explanation.' };
        if (!counts.icps) return { href:'/app/icp-studio/', label:'Create First ICP', why:'The rest of the app compounds off targeting truth.' };
        if (!(counts.accounts || counts.signals)) return { href:'/app/signal-console/', label:'Save One Live Account', why:'Signal Console should be working from real external context.' };
        if (!counts.deals) return { href:'/app/deal-workspace/', label:'Create First Deal', why:'A real deal makes dashboard, proof, and handoff more believable.' };
        if (!counts.motions) return { href:'/app/outbound-studio/', label:'Log First Motion', why:'One touch or call starts turning the app into operating memory.' };
        if (!(backup && backup.hasExport)) return { href:'/app/settings/', label:'Export Backup', why:'By week one, the workspace should survive refresh, re-login, and mistakes.' };
        return { href:'/app/dashboard/', label:'Run the Dashboard Daily', why:'The first week goal is to make the dashboard feel like the place you start each session.' };
    }

    function getDayGuidance(dayNumber, nextAction) {
        if (dayNumber <= 1) {
            return {
                headline:'Day 1 is about making the workspace real.',
                body:'Do one piece of targeting work, one piece of signal work, and one tour pass so the product stops feeling theoretical.',
                rhythm:'Come back to the dashboard after every major action today so the command view starts teaching you the system.'
            };
        }
        if (dayNumber <= 3) {
            return {
                headline:'Days 2 and 3 should move from setup into operating truth.',
                body:'Focus on live accounts, the first real deal, and at least one saved motion. The app gets dramatically more believable after that.',
                rhythm:'Start each session on the dashboard, leave to do one real action, then come back here before you stop.'
            };
        }
        if (dayNumber <= 5) {
            return {
                headline:'Mid-week is where the app should stop feeling empty.',
                body:'Use this stretch to tighten discovery, review the dashboard honestly, and export your first backup.',
                rhythm:'Return to the dashboard at least once per day and check whether the next move still matches reality.'
            };
        }
        return {
            headline:'By the end of week one, the system should feel durable.',
            body:'If the workspace still feels hollow, it is underfed. Put more real ICP, signal, deal, and motion truth into it before calling the setup done.',
            rhythm:'Use the dashboard as your morning reset and sanity check before you leave the app each day.'
        };
    }

    function todayStamp() {
        return new Date().toISOString().slice(0, 10);
    }

    var lifecycle = {
        async load(force) {
            var summary = null;
            if (window.gtmPersistence && window.gtmPersistence.workspace && typeof window.gtmPersistence.workspace.loadSummary === 'function') {
                try {
                    var result = await window.gtmPersistence.workspace.loadSummary(null, force ? { force:true } : {});
                    summary = result && result.data ? result.data : null;
                } catch (error) {
                    console.error('Week-one lifecycle summary load failed:', error);
                }
            }
            summary = summary || {};
            var startAt = getStartAt(summary);
            if (!startAt) return { active:false, reason:'missing-start' };
            var elapsed = Math.max(0, Date.now() - new Date(startAt).getTime());
            var dayNumber = Math.floor(elapsed / DAY_MS) + 1;
            var active = dayNumber >= 1 && dayNumber <= 7 && !(window.gtmEnvironment && window.gtmEnvironment.isDemo);
            var counts = buildCounts(summary);
            var backup = getBackupStatus();
            var milestones = buildMilestones(summary, counts, backup);
            var completed = milestones.filter(function(item){ return item.done; }).length;
            var nextAction = getNextAction(summary, counts, backup);
            var guidance = getDayGuidance(dayNumber, nextAction);
            return {
                active: active,
                startAt: startAt,
                dayNumber: dayNumber,
                roleLabel: roleLabel(getRole(summary)),
                summary: summary,
                counts: counts,
                backup: backup,
                milestones: milestones,
                completed: completed,
                total: milestones.length,
                nextAction: nextAction,
                guidance: guidance
            };
        },

        markDashboardVisit(state) {
            if (!state || !state.active) return;
            var store = scopedGet(DASHBOARD_KEY, { visits: [] });
            var stamp = todayStamp();
            if (arr(store.visits).indexOf(stamp) === -1) {
                store.visits = arr(store.visits).concat(stamp);
                store.lastVisitAt = new Date().toISOString();
                scopedSet(DASHBOARD_KEY, store);
            }
        },

        renderDashboardPanel(state) {
            if (!state || !state.active) return '';
            return '<div class="np-lifecycle">' +
                '<div class="np-lifecycle-top">' +
                    '<div><div class="np-lifecycle-kicker">Week 1 · Day ' + esc(state.dayNumber) + ' of 7</div><div class="np-lifecycle-title">' + esc(state.guidance.headline) + '</div><div class="np-lifecycle-copy">' + esc(state.guidance.body) + '</div></div>' +
                    '<div class="np-lifecycle-score"><span>' + esc(state.completed) + '/' + esc(state.total) + '</span><small>milestones live</small></div>' +
                '</div>' +
                '<div class="np-lifecycle-rhythm">' + esc(state.guidance.rhythm) + '</div>' +
                '<div class="np-lifecycle-actions">' +
                    '<a href="' + esc(state.nextAction.href) + '" class="np-tool-btn primary">' + esc(state.nextAction.label) + '</a>' +
                    '<a href="/app/welcome/" class="np-tool-btn">Open Welcome Guide</a>' +
                    '<a href="/app/settings/" class="np-tool-btn">Backup and Settings</a>' +
                '</div>' +
                '<div class="np-lifecycle-milestones">' + state.milestones.slice(0, 4).map(function(item) {
                    return '<div class="np-lifecycle-pill' + (item.done ? ' done' : '') + '">' + esc(item.label) + '</div>';
                }).join('') + '</div>' +
            '</div>';
        },

        renderNavNudge(options) {
            options = options || {};
            var footer = options.footer;
            if (!footer) return;
            var currentPath = String(options.currentPath || '');
            var existing = footer.querySelector('.nav-weekone-chip');
            this.load(false).then(function(state) {
                if (!state || !state.active || currentPath.indexOf('/app/dashboard') !== -1 || currentPath.indexOf('/app/welcome') !== -1 || (window.gtmEnvironment && window.gtmEnvironment.isDemo)) {
                    if (existing) existing.remove();
                    return;
                }
                var label = 'Week 1 · Return to Dashboard';
                if (!existing) {
                    existing = document.createElement('button');
                    existing.className = 'nav-weekone-chip';
                    existing.onclick = function() { window.location.href = '/app/dashboard/'; };
                    footer.insertBefore(existing, footer.querySelector('.user-menu') || footer.firstChild);
                }
                existing.textContent = label;
                existing.title = state.guidance.rhythm;
            }).catch(function(error) {
                console.error('Week-one nav nudge failed:', error);
            });
        }
    };

    window.gtmWeekOneLifecycle = lifecycle;
})();
