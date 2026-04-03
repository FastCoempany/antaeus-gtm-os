(function () {
    'use strict';

    function tx(value) {
        return String(value || '').trim();
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function pushReason(list, reason) {
        var next = tx(reason);
        if (!next) return;
        if (list.indexOf(next) >= 0) return;
        list.push(next);
    }

    function parseNumber(source) {
        var match = String(source || '').match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : 0;
    }

    function parseRisk(card) {
        return clamp(parseNumber(card && card.badge), 0, 100);
    }

    function parseHeat(card) {
        var meta = Array.isArray(card && card.meta) ? card.meta : [];
        for (var i = 0; i < meta.length; i++) {
            if (/heat/i.test(meta[i])) return clamp(parseNumber(meta[i]), 0, 100);
        }
        return 0;
    }

    function parseStaleDays(card) {
        var meta = Array.isArray(card && card.meta) ? card.meta : [];
        for (var i = 0; i < meta.length; i++) {
            if (/stale/i.test(meta[i])) return clamp(parseNumber(meta[i]), 0, 365);
        }
        return 0;
    }

    function hasAction(card, pattern) {
        var actions = Array.isArray(card && card.actions) ? card.actions : [];
        return actions.some(function (action) {
            return pattern.test(String((action && action.label) || ''));
        });
    }

    function normalizeTone(card, family) {
        if (card && card.badgeTone) return card.badgeTone;
        if (family === 'risk') return 'state-risk';
        if (family === 'system') return 'state-risk';
        if (family === 'icp') return 'state-ready';
        return 'state-live';
    }

    function familyPriority(family) {
        if (family === 'risk') return 5;
        if (family === 'advisor') return 4;
        if (family === 'opportunity') return 4;
        if (family === 'move') return 3;
        if (family === 'icp') return 2;
        if (family === 'system') return 1;
        return 0;
    }

    function buildRiskReasons(card) {
        var reasons = [];
        var risk = parseRisk(card);
        var staleDays = parseStaleDays(card);
        if (risk) pushReason(reasons, 'risk ' + risk);
        if (staleDays) pushReason(reasons, staleDays + 'd stale');
        if (!hasAction(card, /open deal/i)) pushReason(reasons, 'deal context thin');
        if (/autopsy/i.test(tx(card && card.title))) pushReason(reasons, 'failure mode exposed');
        var meta = Array.isArray(card && card.meta) ? card.meta : [];
        meta.forEach(function (item) {
            if (/\$/.test(item)) return;
            if (/stale/i.test(item)) return;
            if (/risk/i.test(item)) return;
            if (reasons.length >= 4) return;
            pushReason(reasons, item);
        });
        return reasons.slice(0, 4);
    }

    function buildMoveReasons(card) {
        var reasons = [];
        var heat = parseHeat(card);
        var risk = parseRisk(card);
        if (heat) pushReason(reasons, 'heat ' + heat);
        if (risk) pushReason(reasons, 'risk ' + risk);
        if (/coverage/i.test(tx(card && card.copy))) pushReason(reasons, 'coverage pressure');
        if (/advisor/i.test(tx(card && card.title))) pushReason(reasons, 'advisor leverage ready');
        if (/outbound|signal/i.test(tx(card && card.title) + ' ' + tx(card && card.copy))) pushReason(reasons, 'market motion available');
        var meta = Array.isArray(card && card.meta) ? card.meta : [];
        meta.forEach(function (item) {
            if (/\$/.test(item)) return;
            if (/heat|risk/i.test(item)) return;
            if (reasons.length >= 4) return;
            pushReason(reasons, item);
        });
        if (!reasons.length) pushReason(reasons, 'next move ready');
        return reasons.slice(0, 4);
    }

    function buildSystemReasons(card, input) {
        var reasons = [];
        var warnings = Array.isArray(input && input.dependencyWarnings) ? input.dependencyWarnings : [];
        if (warnings.length) pushReason(reasons, warnings.length + ' sync warning' + (warnings.length === 1 ? '' : 's'));
        pushReason(reasons, 'local fallback active');
        return reasons.slice(0, 4);
    }

    function buildIcpReasons(input) {
        var reasons = [];
        pushReason(reasons, 'targeting truth missing');
        var context = input && input.shellContext ? input.shellContext : {};
        if (context.signals || context.accounts) pushReason(reasons, 'market layer already live');
        if (context.deals) pushReason(reasons, 'deal layer depends on ICP');
        return reasons.slice(0, 4);
    }

    function scoreRiskCard(card) {
        var risk = parseRisk(card);
        var staleDays = parseStaleDays(card);
        var score = (risk * 0.72) + (staleDays * 1.25);
        if (staleDays >= 14) score += 8;
        if (hasAction(card, /run autopsy/i)) score += 10;
        return clamp(score, 0, 100);
    }

    function scoreMoveCard(card, family) {
        var heat = parseHeat(card);
        var risk = parseRisk(card);
        var score = family === 'advisor' ? 66 : family === 'opportunity' ? 62 : 56;
        score += heat * 0.35;
        score += risk * 0.3;
        if (card && card.badge === 'Now') score += 10;
        if (card && card.badge === 'Next') score += 4;
        if (/coverage/i.test(tx(card && card.copy))) score += 8;
        if (/advisor/i.test(tx(card && card.title))) score += 10;
        return clamp(score, 0, 100);
    }

    function scoreSystemCard(input) {
        var warnings = Array.isArray(input && input.dependencyWarnings) ? input.dependencyWarnings : [];
        return clamp(48 + (warnings.length * 8), 0, 88);
    }

    function scoreIcpCard(input) {
        var context = input && input.shellContext ? input.shellContext : {};
        var score = 52;
        if (context.signals || context.accounts) score += 8;
        if (context.deals) score += 10;
        return clamp(score, 0, 82);
    }

    function buildObjectFromCard(card, family, input) {
        var score = family === 'risk'
            ? scoreRiskCard(card)
            : scoreMoveCard(card, family);
        var reasons = family === 'risk'
            ? buildRiskReasons(card)
            : buildMoveReasons(card);
        var actions = Array.isArray(card && card.actions) ? card.actions.slice() : [];
        return {
            id: tx(card && card.commandId) || tx(card && card.title).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            objectType: family === 'risk' ? 'deal' : family === 'opportunity' ? 'signal' : 'motion',
            title: tx(card && card.title),
            copy: tx(card && card.copy),
            badge: tx(card && card.badge),
            badgeTone: normalizeTone(card, family),
            metricLabel: tx(card && card.badge) || 'Command state',
            metricValue: String(score),
            meta: Array.isArray(card && card.meta) ? card.meta.slice() : [],
            actions: actions,
            sheetKey: tx(card && card.sheetKey),
            focusObject: tx(card && card.title),
            focusRoom: actions[0] && actions[0].roomLabel ? actions[0].roomLabel : '',
            score: score,
            scoreReasons: reasons,
            commandFamily: family,
            stateKey: family,
            source: card || null
        };
    }

    function buildSystemObject(input) {
        var warnings = Array.isArray(input && input.dependencyWarnings) ? input.dependencyWarnings : [];
        return {
            id: 'system-trust',
            objectType: 'system',
            title: 'Repair trust in the command surface.',
            copy: 'Some synced inputs fell back to local state. Rebuild trust before you over-read the current ordering.',
            badge: 'Risk',
            badgeTone: 'state-risk',
            metricLabel: 'System pressure',
            metricValue: String(scoreSystemCard(input)),
            meta: ['local fallback', warnings.length + ' sync warning' + (warnings.length === 1 ? '' : 's')],
            actions: [
                { href: '/app/settings/', label: 'Open Settings', tone: 'btn-secondary', roomLabel: 'Settings' },
                { href: '/app/dashboard/?mode=spotlight', label: 'Refresh view', tone: 'btn-secondary', roomLabel: 'Dashboard' }
            ],
            sheetKey: '',
            focusObject: 'Command surface trust',
            focusRoom: 'Settings',
            score: scoreSystemCard(input),
            scoreReasons: buildSystemReasons(null, input),
            commandFamily: 'system',
            stateKey: 'system',
            source: null
        };
    }

    function buildIcpObject(input) {
        return {
            id: 'icp-truth',
            objectType: 'icp',
            title: 'Save one ICP before the week drifts.',
            copy: 'Market signals or deals exist, but targeting truth is still missing. The system is carrying that ambiguity everywhere else.',
            badge: 'Truth gap',
            badgeTone: 'state-ready',
            metricLabel: 'ICP pressure',
            metricValue: String(scoreIcpCard(input)),
            meta: ['missing ICP', 'targeting layer'],
            actions: [
                { href: '/app/icp-studio/', label: 'Open ICP Studio', roomLabel: 'ICP Studio' }
            ],
            sheetKey: '',
            focusObject: 'ICP truth',
            focusRoom: 'ICP Studio',
            score: scoreIcpCard(input),
            scoreReasons: buildIcpReasons(input),
            commandFamily: 'icp',
            stateKey: 'icp',
            source: null
        };
    }

    function buildFallbackPrimaryObject(input) {
        var primary = input && input.primary ? input.primary : null;
        if (!primary) return null;
        return {
            id: 'primary-fallback',
            objectType: 'system',
            title: tx(primary.title),
            copy: tx(primary.copy),
            badge: tx(primary.label) || 'Now',
            badgeTone: normalizeTone(primary, 'move'),
            metricLabel: 'Command state',
            metricValue: '50',
            meta: Array.isArray(primary.tags) ? primary.tags.slice() : [],
            actions: Array.isArray(primary.actions) ? primary.actions.slice() : [],
            sheetKey: tx(primary.sheetKey),
            focusObject: tx(primary.title),
            focusRoom: '',
            score: 50,
            scoreReasons: ['stage pressure', 'front-door fallback'],
            commandFamily: 'move',
            stateKey: 'move',
            source: primary
        };
    }

    function dedupeObjects(objects) {
        var seen = {};
        return (objects || []).filter(function (object) {
            var key = tx(object && object.title).toLowerCase();
            if (!key) return false;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }

    function buildCommandObjects(input) {
        var objects = [];
        var riskCards = Array.isArray(input && input.riskCards) ? input.riskCards : [];
        var moveCards = Array.isArray(input && input.moveCards) ? input.moveCards : [];
        riskCards.forEach(function (card) {
            objects.push(buildObjectFromCard(card, 'risk', input));
        });
        moveCards.forEach(function (card) {
            var family = /advisor/i.test(tx(card && card.title))
                ? 'advisor'
                : (/outbound|signal/i.test(tx(card && card.title) + ' ' + tx(card && card.copy)) ? 'opportunity' : 'move');
            objects.push(buildObjectFromCard(card, family, input));
        });
        if (!objects.length) {
            var fallback = buildFallbackPrimaryObject(input);
            if (fallback) objects.push(fallback);
        }
        if (Array.isArray(input && input.dependencyWarnings) && input.dependencyWarnings.length) {
            objects.push(buildSystemObject(input));
        }
        var context = input && input.shellContext ? input.shellContext : {};
        if (!context.icps && (context.accounts || context.signals || context.deals)) {
            objects.push(buildIcpObject(input));
        }
        return dedupeObjects(objects);
    }

    function rankCommandObjects(objects) {
        return (objects || []).slice().sort(function (a, b) {
            if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
            if (familyPriority(b.commandFamily) !== familyPriority(a.commandFamily)) {
                return familyPriority(b.commandFamily) - familyPriority(a.commandFamily);
            }
            return tx(a.title).localeCompare(tx(b.title));
        });
    }

    function summarizeCommandContext(objects, options) {
        var ranked = rankCommandObjects(objects);
        var limit = options && options.limit ? options.limit : 6;
        var queue = ranked.slice(0, limit);
        return {
            ranked: ranked,
            spotlight: queue[0] || null,
            queue: queue,
            riskCards: ranked.filter(function (object) { return object.commandFamily === 'risk'; }).slice(0, 3),
            moveCards: ranked.filter(function (object) { return object.commandFamily !== 'risk' && object.commandFamily !== 'system'; }).slice(0, 4),
            systemCards: ranked.filter(function (object) { return object.commandFamily === 'system' || object.commandFamily === 'icp'; }).slice(0, 3)
        };
    }

    function joinReasons(reasons) {
        var list = (Array.isArray(reasons) ? reasons : []).filter(Boolean).slice(0, 2);
        if (!list.length) return 'the command pressure is higher than the surrounding work';
        if (list.length === 1) return list[0];
        return list[0] + ' and ' + list[1];
    }

    function explainCommandObject(object, mode) {
        var family = tx(object && object.commandFamily);
        var reasons = Array.isArray(object && object.scoreReasons) ? object.scoreReasons : [];
        var because = joinReasons(reasons);
        if (mode === 'queue') {
            if (family === 'risk') {
                return {
                    label: 'Why this order',
                    title: 'Recovery is ahead of expansion.',
                    copy: 'This stays near the front because ' + because + '.'
                };
            }
            if (family === 'advisor' || family === 'opportunity' || family === 'move') {
                return {
                    label: 'Why this order',
                    title: 'This is the next move with leverage.',
                    copy: 'It stays in front of lower-pressure work because ' + because + '.'
                };
            }
            if (family === 'icp') {
                return {
                    label: 'Why this order',
                    title: 'Truth work must happen before scale work.',
                    copy: 'This stays visible because ' + because + '.'
                };
            }
            return {
                label: 'Why this order',
                title: 'This keeps the command surface honest.',
                copy: 'It stays in the ranked run because ' + because + '.'
            };
        }
        if (family === 'risk') {
            return {
                label: 'Why this is here',
                title: 'The week is drifting through this object.',
                copy: 'It is in the light because ' + because + '.'
            };
        }
        if (family === 'advisor' || family === 'opportunity' || family === 'move') {
            return {
                label: 'Why this is here',
                title: 'This is the highest-leverage move right now.',
                copy: 'It is in the light because ' + because + '.'
            };
        }
        if (family === 'icp') {
            return {
                label: 'Why this is here',
                title: 'Targeting truth is still upstream of everything else.',
                copy: 'It is in the light because ' + because + '.'
            };
        }
        return {
            label: 'Why this is here',
            title: 'System trust is affecting the rest of the stack.',
            copy: 'It is in the light because ' + because + '.'
        };
    }

    window.gtmCommandIntelligence = {
        buildCommandObjects: buildCommandObjects,
        rankCommandObjects: rankCommandObjects,
        summarizeCommandContext: summarizeCommandContext,
        explainCommandObject: explainCommandObject
    };
})();
