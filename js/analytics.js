/**
 * GTMOS Analytics
 *
 * Local-first analytics with optional PostHog + GA4 destinations.
 * - Always persists events locally (for backups and audits)
 * - Sends events to PostHog when configured
 * - Sends events to GA4 when configured
 * - Captures first-touch / last-touch UTM attribution
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'gtmos_analytics_events';
    var SESSION_KEY = 'gtmos_analytics_session';
    var ATTRIBUTION_KEY = 'gtmos_analytics_attribution';
    var MAX_EVENTS = 5000;
    var pageEnterMs = Date.now();
    var posthogBooted = false;
    var posthogLoading = false;
    var ga4Booted = false;
    var ga4Loading = false;
    var pageTrackedThisLoad = false;

    var persistedPosthogKey = '';
    var persistedPosthogHost = '';
    var persistedGa4Id = '';
    var persistedGa4Debug = false;
    try {
        persistedPosthogKey = localStorage.getItem('gtmos_posthog_key') || '';
        persistedPosthogHost = localStorage.getItem('gtmos_posthog_host') || '';
        persistedGa4Id = localStorage.getItem('gtmos_ga4_measurement_id') || '';
        persistedGa4Debug = localStorage.getItem('gtmos_ga4_debug') === '1';
    } catch (e) { /* ignore */ }

    var POSTHOG_KEY = (window.GTMOS_POSTHOG_KEY || persistedPosthogKey || '').trim();
    var POSTHOG_HOST = (window.GTMOS_POSTHOG_HOST || persistedPosthogHost || 'https://us.i.posthog.com').trim();
    var GA4_ID = (window.GTMOS_GA4_ID || persistedGa4Id || '').trim();
    var GA4_DEBUG = !!(window.GTMOS_GA4_DEBUG || persistedGa4Debug);
    var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    var UTM_PRESETS = window.GTMOS_UTM_PRESETS || {
        twitter: { source: 'twitter', medium: 'social' },
        newsletter: { source: 'newsletter', medium: 'email' },
        producthunt: { source: 'producthunt', medium: 'launch' },
        indiehackers: { source: 'indiehackers', medium: 'community' },
        coldemail: { source: 'coldemail', medium: 'email' },
        reddit: { source: 'reddit', medium: 'community' },
        slack: { source: 'slack', medium: 'community' },
        demo: { source: 'demo', medium: 'product' }
    };

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

    function readAttribution() {
        try {
            return JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || '{}') || {};
        } catch (e) {
            return {};
        }
    }

    function writeAttribution(next) {
        try {
            localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next || {}));
        } catch (e) { /* ignore */ }
    }

    function getUrlUtmPayload(href) {
        var payload = {};
        try {
            var url = new URL(href || window.location.href, window.location.origin);
            UTM_KEYS.forEach(function (key) {
                var value = (url.searchParams.get(key) || '').trim();
                if (value) payload[key] = value;
            });
        } catch (e) { /* ignore */ }
        return payload;
    }

    function captureAttribution() {
        var current = getUrlUtmPayload(window.location.href);
        var state = readAttribution();
        var hasCurrent = Object.keys(current).length > 0;

        if (hasCurrent) {
            var stamp = {
                href: window.location.href,
                path: window.location.pathname,
                ts: new Date().toISOString()
            };
            if (!state.first_touch || !state.first_touch.utm_source) {
                state.first_touch = Object.assign({}, current, stamp);
            }
            state.last_touch = Object.assign({}, current, stamp);
            writeAttribution(state);
        }

        return state;
    }

    var attributionState = captureAttribution();

    function getAttribution() {
        return readAttribution() || attributionState || {};
    }

    function sanitizeGaEventName(eventName) {
        var safe = String(eventName || 'event').toLowerCase().replace(/[^a-z0-9_]+/g, '_');
        if (!/^[a-z]/.test(safe)) safe = 'e_' + safe;
        return safe.slice(0, 40);
    }

    function withContext(properties) {
        var attribution = getAttribution();
        var firstTouch = attribution.first_touch || {};
        var lastTouch = attribution.last_touch || {};
        return Object.assign({
            persona: getPersona(),
            path: window.location.pathname,
            href: window.location.href,
            referrer: document.referrer || '',
            browser: detectBrowser(),
            device_type: detectDeviceType(),
            viewport: (window.innerWidth || 0) + 'x' + (window.innerHeight || 0),
            page_title: document.title || '',
            current_utm_source: lastTouch.utm_source || '',
            current_utm_medium: lastTouch.utm_medium || '',
            current_utm_campaign: lastTouch.utm_campaign || '',
            current_utm_content: lastTouch.utm_content || '',
            current_utm_term: lastTouch.utm_term || '',
            first_touch_utm_source: firstTouch.utm_source || '',
            first_touch_utm_medium: firstTouch.utm_medium || '',
            first_touch_utm_campaign: firstTouch.utm_campaign || '',
            first_touch_utm_content: firstTouch.utm_content || '',
            first_touch_utm_term: firstTouch.utm_term || ''
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

    function loadGa4Sdk() {
        if (!GA4_ID || ga4Booted || ga4Loading) return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

        if (window.gtag && ga4Booted) return;

        ga4Loading = true;
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
        script.onload = function () {
            ga4Loading = false;
            try {
                window.gtag('js', new Date());
                window.gtag('config', GA4_ID, {
                    send_page_view: false,
                    debug_mode: GA4_DEBUG
                });
                ga4Booted = true;
            } catch (e) {
                // Never break product flows on GA issues.
            }
        };
        script.onerror = function () {
            ga4Loading = false;
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

    function sendToGa4(eventName, properties) {
        if (!GA4_ID) return;
        loadGa4Sdk();
        if (window.gtag && typeof window.gtag === 'function') {
            try {
                var payload = Object.assign({}, properties || {});
                if (sanitizeGaEventName(eventName) === 'page_view') {
                    payload.page_location = window.location.href;
                    payload.page_path = window.location.pathname;
                    payload.page_title = document.title || '';
                }
                window.gtag('event', sanitizeGaEventName(eventName), payload);
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
        sendToGa4(eventName, fullProps);
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

    function buildUtmUrl(baseUrl, params) {
        var url = new URL(baseUrl, window.location.origin);
        var input = Object.assign({}, params || {});
        if (input.preset && UTM_PRESETS[input.preset]) {
            input = Object.assign({}, UTM_PRESETS[input.preset], input);
        }
        var mapped = {
            utm_source: input.utm_source || input.source || '',
            utm_medium: input.utm_medium || input.medium || '',
            utm_campaign: input.utm_campaign || input.campaign || '',
            utm_content: input.utm_content || input.content || '',
            utm_term: input.utm_term || input.term || ''
        };
        Object.keys(mapped).forEach(function (key) {
            if (mapped[key]) url.searchParams.set(key, mapped[key]);
        });
        return url.toString();
    }

    function classifyClickEvent(target) {
        var el = target && target.closest ? target.closest('a,button') : null;
        if (!el) return null;

        var href = (el.getAttribute('href') || '').trim();
        var label = (el.getAttribute('data-analytics-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
        var className = typeof el.className === 'string' ? el.className : '';
        var zone = el.getAttribute('data-analytics-zone') || '';
        var explicit = el.getAttribute('data-analytics-event');
        if (explicit) {
            return { name: explicit, properties: { cta_label: label, href: href, cta_zone: zone || 'explicit' } };
        }

        if (el.id === 'buyBtn') {
            return { name: 'pricing_buy_click', properties: { cta_label: label, href: href, cta_zone: 'pricing' } };
        }
        if (className.indexOf('hero-cta') > -1) {
            return { name: 'landing_cta_click', properties: { cta_label: label, href: href, cta_zone: zone || 'hero' } };
        }
        if (className.indexOf('nav-cta') > -1) {
            return { name: 'landing_cta_click', properties: { cta_label: label, href: href, cta_zone: zone || 'nav' } };
        }
        if (href.indexOf('/demo-seed.html') > -1) {
            return { name: 'demo_entry_click', properties: { cta_label: label, href: href, cta_zone: zone || 'navigation' } };
        }
        if (href.indexOf('/login.html') > -1) {
            return { name: 'auth_entry_click', properties: { cta_label: label, href: href, auth_target: 'login', cta_zone: zone || 'navigation' } };
        }
        if (href.indexOf('/signup.html') > -1) {
            return { name: 'auth_entry_click', properties: { cta_label: label, href: href, auth_target: 'signup', cta_zone: zone || 'navigation' } };
        }
        if (href === '#pricing' || href.indexOf('/#pricing') > -1) {
            return { name: 'pricing_anchor_click', properties: { cta_label: label, href: href, cta_zone: zone || 'pricing' } };
        }
        if (href.indexOf('/methodology/') > -1) {
            return { name: 'methodology_nav_click', properties: { cta_label: label, href: href, cta_zone: zone || 'content' } };
        }
        return null;
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
                persona: getPersona(),
                attribution: getAttribution()
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

        configureGa4: function (measurementId, options) {
            GA4_ID = (measurementId || '').trim();
            GA4_DEBUG = !!(options && options.debug);
            try {
                if (GA4_ID) localStorage.setItem('gtmos_ga4_measurement_id', GA4_ID);
                else localStorage.removeItem('gtmos_ga4_measurement_id');
                if (GA4_DEBUG) localStorage.setItem('gtmos_ga4_debug', '1');
                else localStorage.removeItem('gtmos_ga4_debug');
            } catch (e) { /* ignore */ }
            if (GA4_ID) loadGa4Sdk();
        },

        getEvents: getEvents,
        getAttribution: getAttribution,
        buildUtmUrl: buildUtmUrl,
        getUtmPresets: function () { return Object.assign({}, UTM_PRESETS); },
        initPosthog: loadPosthogSdk,
        initGa4: loadGa4Sdk
    };

    document.addEventListener('click', function (evt) {
        var info = classifyClickEvent(evt.target);
        if (info) analytics.track(info.name, info.properties);
    }, true);

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
    loadGa4Sdk();
    window.gtmAnalytics = analytics;
    window.gtmAttribution = {
        buildUrl: buildUtmUrl,
        get: getAttribution,
        presets: function () { return Object.assign({}, UTM_PRESETS); }
    };
})();
