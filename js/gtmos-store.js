/**
 * GTMOS Store — Cross-Module Data Layer
 * 
 * New cross-module data uses gtmos_ prefix.
 * Existing per-module keys are left alone (backward compat).
 * 
 * Keys managed here:
 *   gtmos_deal_quals      — Qualification scores keyed by deal ID
 *   gtmos_deal_outcomes    — Win/loss capture data keyed by deal ID
 *   gtmos_discovery_links  — Discovery Agenda → Deal linkages
 * 
 * Usage:
 *   gtmStore.quals.get(dealId)          → { score, breakdown, updatedAt }
 *   gtmStore.quals.set(dealId, data)    → saves + returns data
 *   gtmStore.quals.getAll()             → { dealId: {...}, ... }
 *   gtmStore.outcomes.get(dealId)       → { type, reason, ... }
 *   gtmStore.outcomes.set(dealId, data) → saves + returns data
 *   gtmStore.outcomes.getAll()          → { dealId: {...}, ... }
 */

(function() {
    'use strict';

    const KEYS = {
        quals: 'gtmos_deal_quals',
        outcomes: 'gtmos_deal_outcomes',
        discoveryLinks: 'gtmos_discovery_links'
    };

    function syncDocToCloud(key, data) {
        if (!(window.gtmPersistence && window.gtmPersistence.docs && typeof window.gtmPersistence.docs.save === 'function')) return;
        window.gtmPersistence.docs.save(key, data).catch(function(error) {
            console.error('gtmStore sync failed for', key, error);
        });
    }

    function readKey(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch(e) {
            console.warn('gtmStore: failed to read', key, e);
            return {};
        }
    }

    function writeKey(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            syncDocToCloud(key, data);
            return true;
        } catch(e) {
            console.warn('gtmStore: failed to write', key, e);
            return false;
        }
    }

    // ── Qualification Scores ──────────────────────────────────────────
    // Stored per deal ID. Updated by Deal Review, read by Deal Workspaces + Dashboard.
    //
    // Shape per deal:
    // {
    //   score: 0-18,
    //   level: 'not-qualified' | 'emerging' | 'qualified' | 'strong',
    //   breakdown: { champion: 0|1|2, eb: 0|1|2, ... },
    //   frozenAt: null | ISO date string (set when deal closes),
    //   updatedAt: ISO date string
    // }

    const quals = {
        get(dealId) {
            const all = readKey(KEYS.quals);
            return all[dealId] || null;
        },
        set(dealId, data) {
            const all = readKey(KEYS.quals);
            all[dealId] = { ...data, updatedAt: new Date().toISOString() };
            writeKey(KEYS.quals, all);
            return all[dealId];
        },
        freeze(dealId) {
            const all = readKey(KEYS.quals);
            if (all[dealId]) {
                all[dealId].frozenAt = new Date().toISOString();
                writeKey(KEYS.quals, all);
            }
            return all[dealId] || null;
        },
        getAll() {
            return readKey(KEYS.quals);
        },
        remove(dealId) {
            const all = readKey(KEYS.quals);
            delete all[dealId];
            writeKey(KEYS.quals, all);
        }
    };

    // ── Deal Outcomes (Win/Loss) ──────────────────────────────────────
    // Stored per deal ID. Written by Deal Workspaces close forms, read by Dashboard patterns.
    //
    // Shape per deal (Closed Won):
    // {
    //   type: 'won',
    //   trigger: string,
    //   framework: string,
    //   territories: [string],
    //   persona: string,
    //   displacement: 'greenfield' | 'competitive',
    //   cycleLength: number (days),
    //   qualScoreAtClose: number,
    //   whatWorked: string,
    //   tags: [string],
    //   closedAt: ISO date
    // }
    //
    // Shape per deal (Closed Lost):
    // {
    //   type: 'lost',
    //   stalledStage: string,
    //   lossReason: string,
    //   lossDetail: string,
    //   aiObjectionBlocker: string | null,
    //   doOverActions: [string],
    //   doOverDetail: string,
    //   qualScoreAtClose: number,
    //   closedAt: ISO date
    // }

    const outcomes = {
        get(dealId) {
            const all = readKey(KEYS.outcomes);
            return all[dealId] || null;
        },
        set(dealId, data) {
            const all = readKey(KEYS.outcomes);
            all[dealId] = { ...data, closedAt: data.closedAt || new Date().toISOString() };
            writeKey(KEYS.outcomes, all);
            return all[dealId];
        },
        getAll() {
            return readKey(KEYS.outcomes);
        },
        getWins() {
            const all = readKey(KEYS.outcomes);
            const wins = {};
            Object.keys(all).forEach(function(id) {
                if (all[id].type === 'won') wins[id] = all[id];
            });
            return wins;
        },
        getLosses() {
            const all = readKey(KEYS.outcomes);
            const losses = {};
            Object.keys(all).forEach(function(id) {
                if (all[id].type === 'lost') losses[id] = all[id];
            });
            return losses;
        },
        count() {
            const all = readKey(KEYS.outcomes);
            var wins = 0, losses = 0;
            Object.keys(all).forEach(function(id) {
                if (all[id].type === 'won') wins++;
                else if (all[id].type === 'lost') losses++;
            });
            return { wins: wins, losses: losses, total: wins + losses };
        },
        remove(dealId) {
            const all = readKey(KEYS.outcomes);
            delete all[dealId];
            writeKey(KEYS.outcomes, all);
        }
    };

    // ── Discovery Links ──────────────────────────────────────────────
    // Maps Discovery Agenda sessions to Deal IDs.
    // When a gate is checked in Discovery Agenda with a linked deal,
    // the gate data flows to the deal's qualification score.

    const discoveryLinks = {
        get(agendaId) {
            const all = readKey(KEYS.discoveryLinks);
            return all[agendaId] || null;
        },
        set(agendaId, dealId) {
            const all = readKey(KEYS.discoveryLinks);
            all[agendaId] = { dealId: dealId, linkedAt: new Date().toISOString() };
            writeKey(KEYS.discoveryLinks, all);
            return all[agendaId];
        },
        getByDeal(dealId) {
            const all = readKey(KEYS.discoveryLinks);
            const results = [];
            Object.keys(all).forEach(function(agendaId) {
                if (all[agendaId].dealId === dealId) results.push(agendaId);
            });
            return results;
        },
        getAll() {
            return readKey(KEYS.discoveryLinks);
        }
    };

    // ── Qualification Scoring Logic ──────────────────────────────────
    // Shared scoring function used by Deal Review and any page that
    // needs to compute a qual score from the 9 review fields.

    const QUAL_FIELDS = [
        { id: 'champion', label: 'Champion Identified' },
        { id: 'eb', label: 'Economic Buyer Engaged' },
        { id: 'usecase', label: 'Use Case Defined' },
        { id: 'impact', label: 'Impact Metric Quantified' },
        { id: 'process', label: 'Decision Process Mapped' },
        { id: 'timeline', label: 'Timeline Confirmed' },
        { id: 'competition', label: 'Competition Known' },
        { id: 'risks', label: 'Risks Identified' },
        { id: 'nextstep', label: 'Next Step Scheduled' }
    ];

    // Score a single field: Empty (0), Partial (1), Strong (2)
    function scoreField(value) {
        if (!value || value.trim().length === 0) return 0;
        // Partial: has some text but short (< 50 chars)
        if (value.trim().length < 50) return 1;
        // Strong: substantive text (50+ chars)
        return 2;
    }

    // Score all 9 fields, return { score, level, breakdown }
    function scoreQualification(fieldValues) {
        var breakdown = {};
        var total = 0;
        QUAL_FIELDS.forEach(function(f) {
            var val = fieldValues[f.id] || '';
            var s = scoreField(val);
            breakdown[f.id] = s;
            total += s;
        });

        var level;
        if (total >= 16) level = 'strong';
        else if (total >= 12) level = 'qualified';
        else if (total >= 7) level = 'emerging';
        else level = 'not-qualified';

        return { score: total, level: level, breakdown: breakdown };
    }

    // Level display helpers
    function qualLevelLabel(level) {
        switch(level) {
            case 'strong': return 'Strong';
            case 'qualified': return 'Qualified';
            case 'emerging': return 'Emerging';
            default: return 'Not Qualified';
        }
    }

    function qualLevelColor(level) {
        switch(level) {
            case 'strong': return '#22c55e';
            case 'qualified': return '#3b82f6';
            case 'emerging': return '#eab308';
            default: return '#ef4444';
        }
    }

    function qualLevelEmoji(level) {
        switch(level) {
            case 'strong': return '✅';
            case 'qualified': return '🟢';
            case 'emerging': return '⚠️';
            default: return '❌';
        }
    }

    // ── Public API ──────────────────────────────────────────────────

    window.gtmStore = {
        quals: quals,
        outcomes: outcomes,
        discoveryLinks: discoveryLinks,
        preload: function() {
            if (!(window.gtmPersistence && window.gtmPersistence.docs && typeof window.gtmPersistence.docs.load === 'function')) {
                return Promise.resolve({ data: null, error: null });
            }
            return window.gtmPersistence.docs.load({ keys: [KEYS.quals, KEYS.outcomes, KEYS.discoveryLinks] }).catch(function(error) {
                console.error('gtmStore preload failed:', error);
                return { data: null, error: error };
            });
        },
        scoring: {
            FIELDS: QUAL_FIELDS,
            scoreField: scoreField,
            scoreQualification: scoreQualification,
            levelLabel: qualLevelLabel,
            levelColor: qualLevelColor,
            levelEmoji: qualLevelEmoji
        },
        KEYS: KEYS
    };

    if (window.__gtmosAuthGatePending && window.requireAuthReady && typeof window.requireAuthReady.then === 'function') {
        window.requireAuthReady.then(function() { return window.gtmStore.preload(); }).catch(function() {});
    } else if (window.__gtmosAuthGatePending) {
        window.addEventListener('gtmos:auth-ready', function() {
            window.gtmStore.preload().catch(function() {});
        }, { once: true });
    } else {
        window.gtmStore.preload().catch(function() {});
    }

})();
