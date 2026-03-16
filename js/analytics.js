/**
 * GTMOS Analytics - Phase 2.1
 *
 * Local-first analytics with optional PostHog SDK integration.
 * - Always persists events locally (for backups and audits)
 * - Sends events to PostHog when configured
 * - Normalizes required plan/audit event contracts
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'gtmos_analytics_events';
    var SESSION_KEY = 'gtmos_analytics_session';
    var MAX_EVENTS = 5000;
    var pageEnterMs = Date.now();
    var posthogBooted = false;
    var posthogLoading = false;
    var pageTrackedThisLoad = false;

    var persistedPosthogKey = '';
    var persistedPosthogHost = '';
    try {
        persistedPosthogKey = localStorage.getItem('gtmos_posthog_key') || '';
        persistedPosthogHost = localStorage.getItem('gtmos_posthog_host') || '';
    } catch (e) { /* ignore */ }

    var POSTHOG_KEY = (window.GTMOS_POSTHOG_KEY || persistedPosthogKey || '').trim();
    var POSTHOG_HOST = (window.GTMOS_POSTHOG_HOST || persistedPosthogHost || 'https://us.i.posthog.com').trim();

    function getSessionId() {
        var sid = sessionStorage.getItem(SESSION_KEY);
        if (!sid) {
            sid = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            sessionStorage.setItem(SESSION_KEY, sid);
        }
        return sid;
    }

    function getEvents() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function appendEvent(evt) {
        var events = getEvents();
        events.push(evt);
        if (events.length > MAX_EVENTS) {
            events = events.slice(events.length - MAX_EVENTS);
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        } catch (e) {
            // localStorage can fail in private mode or when full
        }
    }

    function getPersona() {
        try {
            var onboarding = JSON.parse(localStorage.getItem('gtmos_onboarding') || '{}');
            return onboarding.persona || 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }

    function detectDeviceType() {
        var width = window.innerWidth || 0;
        if (width && width < 768) return 'mobile';
        if (width && width < 1024) return 'tablet';
        return 'desktop';
    }

    function detectBrowser() {
        var ua = navigator.userAgent || '';
        if (ua.indexOf('Edg/') > -1) return 'edge';
        if (ua.indexOf('Chrome/') > -1) return 'chrome';
        if (ua.indexOf('Firefox/') > -1) return 'firefox';
        if (ua.indexOf('Safari/') > -1 && ua.indexOf('Chrome/') === -1) return 'safari';
        return 'other';
    }

    function withContext(properties) {
        return Object.assign({
            persona: getPersona(),
            path: window.location.pathname,
            href: window.location.href,
            referrer: document.referrer || '',
            browser: detectBrowser(),
            device_type: detectDeviceType(),
            viewport: (window.innerWidth || 0) + 'x' + (window.innerHeight || 0)
        }, properties || {});
    }

    function loadPosthogSdk() {
        if (!POSTHOG_KEY || posthogBooted || posthogLoading) return;
        if (window.posthog && typeof window.posthog.capture === 'function') {
            posthogBooted = true;
            return;
        }

        posthogLoading = true;
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://cdn.jsdelivr.net/npm/posthog-js@1.212.0/dist/module.no-external.js';
        script.onload = function () {
            posthogLoading = false;
            if (!window.posthog || typeof window.posthog.init !== 'function') return;
            try {
                window.posthog.init(POSTHOG_KEY, {
                    api_host: POSTHOG_HOST,
                    capture_pageview: false,
                    capture_pageleave: true,
                    autocapture: true,
                    persistence: 'localStorage+cookie',
                    person_profiles: 'identified_only'
                });
                posthogBooted = true;
            } catch (e) {
                // Keep local analytics even if PostHog init fails.
            }
        };
        script.onerror = function () {
            posthogLoading = false;
        };
        document.head.appendChild(script);
    }

    function sendToPosthog(eventName, properties) {
        if (!POSTHOG_KEY) return;
        loadPosthogSdk();
        if (window.posthog && typeof window.posthog.capture === 'function') {
            try {
                window.posthog.capture(eventName, properties);
            } catch (e) {
                // Never break product flows on analytics errors.
            }
        }
    }

    function emitEvent(eventName, properties) {
        var fullProps = withContext(properties);
        var evt = {
            event: eventName,
            ts: new Date().toISOString(),
            session: getSessionId(),
            persona: fullProps.persona,
            path: fullProps.path,
            props: fullProps
        };
        appendEvent(evt);
        sendToPosthog(eventName, fullProps);
    }

    function normalizedDerivedEvents(eventName, properties) {
        var derived = [];
        var props = properties || {};

        if (eventName === 'onboarding_step') {
            var step = Number(props.step);
            if (isFinite(step) && step > 0) {
                derived.push({
                    name: 'onboarding_step_' + Math.floor(step),
                    properties: props
                });
            }
        }

        if (eventName === 'handoff_kit_exported') {
            derived.push({
                name: 'handoff_kit_generated',
                properties: props
            });
        }

        return derived;
    }

    var analytics = {
        track: function (eventName, properties) {
            emitEvent(eventName, properties);
            normalizedDerivedEvents(eventName, properties).forEach(function (evt) {
                emitEvent(evt.name, evt.properties);
            });
        },

        page: function (moduleName) {
            var module = moduleName || window.location.pathname;
            if (pageTrackedThisLoad) return;
            pageTrackedThisLoad = true;
            this.track('page_view', { module: module });
        },

        getSummary: function () {
            var events = getEvents();
            var eventCounts = {};
            var moduleVisits = {};
            var sessions = {};
            var firstEvent = null;
            var lastEvent = null;
            var pageLeaveDurations = [];
            var viewsBySession = {};

            events.forEach(function (e) {
                eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
                sessions[e.session] = true;

                if (!firstEvent || e.ts < firstEvent) firstEvent = e.ts;
                if (!lastEvent || e.ts > lastEvent) lastEvent = e.ts;

                if (e.event === 'page_view' && e.props && e.props.module) {
                    moduleVisits[e.props.module] = (moduleVisits[e.props.module] || 0) + 1;
                    viewsBySession[e.session] = (viewsBySession[e.session] || 0) + 1;
                }

                if (e.event === 'page_leave' && e.props && typeof e.props.duration_sec === 'number') {
                    pageLeaveDurations.push(e.props.duration_sec);
                }
            });

            var bounceSessions = 0;
            Object.keys(viewsBySession).forEach(function (sid) {
                if (viewsBySession[sid] <= 1) bounceSessions++;
            });

            var avgPageSeconds = 0;
            if (pageLeaveDurations.length) {
                var total = pageLeaveDurations.reduce(function (a, b) { return a + b; }, 0);
                avgPageSeconds = Math.round(total / pageLeaveDurations.length);
            }

            return {
                totalEvents: events.length,
                totalSessions: Object.keys(sessions).length,
                bounceSessions: bounceSessions,
                avgPageSeconds: avgPageSeconds,
                eventCounts: eventCounts,
                moduleVisits: moduleVisits,
                firstEvent: firstEvent,
                lastEvent: lastEvent,
                persona: getPersona()
            };
        },

        exportCSV: function () {
            var events = getEvents();
            if (!events.length) {
                alert('No analytics events recorded yet.');
                return;
            }

            var rows = [['timestamp', 'event', 'session', 'persona', 'path', 'properties']];
            events.forEach(function (e) {
                rows.push([
                    e.ts,
                    e.event,
                    e.session || '',
                    e.persona || '',
                    e.path || '',
                    JSON.stringify(e.props || {})
                ]);
            });

            var csv = rows.map(function (row) {
                return row.map(function (value) {
                    return '"' + String(value).replace(/"/g, '""') + '"';
                }).join(',');
            }).join('\n');

            var blob = new Blob([csv], { type: 'text/csv' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'gtmos-analytics-' + new Date().toISOString().slice(0, 10) + '.csv';
            a.click();
            URL.revokeObjectURL(a.href);
        },

        clear: function () {
            localStorage.removeItem(STORAGE_KEY);
        },

        configurePosthog: function (key, host) {
            POSTHOG_KEY = (key || '').trim();
            POSTHOG_HOST = (host || 'https://us.i.posthog.com').trim();
            try {
                if (POSTHOG_KEY) localStorage.setItem('gtmos_posthog_key', POSTHOG_KEY);
                else localStorage.removeItem('gtmos_posthog_key');
                localStorage.setItem('gtmos_posthog_host', POSTHOG_HOST);
            } catch (e) { /* ignore */ }
            if (POSTHOG_KEY) loadPosthogSdk();
        },

        getEvents: getEvents,
        initPosthog: loadPosthogSdk
    };

    window.addEventListener('beforeunload', function () {
        var durationSec = Math.max(0, Math.round((Date.now() - pageEnterMs) / 1000));
        emitEvent('page_leave', { duration_sec: durationSec });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            analytics.page(window.location.pathname);
        }, { once: true });
    } else {
        analytics.page(window.location.pathname);
    }

    loadPosthogSdk();
    window.gtmAnalytics = analytics;
})();
