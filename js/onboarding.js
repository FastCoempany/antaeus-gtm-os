/**
 * GTMOS Onboarding
 *
 * Manages onboarding state and pre-populates modules from quick-start answers.
 */
(function() {
    'use strict';

    var ONBOARDING_KEY = 'gtmos_onboarding';
    var ENV_MODE_KEY = 'gtmos_env_mode';

    function readJson(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch (e) { return fallback; }
    }

    function writeJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) {}
    }

    function isoDaysFromNow(dayOffset) {
        return new Date(Date.now() + (dayOffset * 86400000)).toISOString();
    }

    function isDemoEnvironment() {
        try {
            if (window.gtmEnvironment && window.gtmEnvironment.isDemo) return true;
            return sessionStorage.getItem(ENV_MODE_KEY) === 'demo';
        } catch (e) {
            return false;
        }
    }

    function getState() {
        try {
            return JSON.parse(localStorage.getItem(ONBOARDING_KEY)) || null;
        } catch (e) {
            return null;
        }
    }

    function setState(data) {
        try {
            localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('onboarding: failed to save state', e);
            return false;
        }
    }

    function isCompleted() {
        var state = getState();
        return !!(state && state.completed === true);
    }

    function seedBaseWorkspace(persona, answers) {
        var playbook = readJson('gtmos_playbook', {});

        if (answers.companyName) playbook.company = answers.companyName;
        if (answers.stage) playbook.stage = answers.stage;
        if (answers.acv) playbook.acv = String(answers.acv);

        if (!playbook.fields) playbook.fields = {};
        if (answers.idealCustomer) playbook.fields['market-who'] = answers.idealCustomer;

        if (persona === 'founder') {
            playbook.fields['motion-type'] = 'Founder-led';
        } else if (persona === 'first-ae') {
            playbook.fields['motion-type'] = 'AE-led with founder support';
        } else if (persona === 'cro') {
            playbook.fields['motion-type'] = 'Sales-led';
        }

        if (!playbook.checks) playbook.checks = {};
        playbook.timestamp = new Date().toISOString();
        writeJson('gtmos_playbook', playbook);

        var stageDefaults = {
            'pre-seed': { winRate: 15, discoToOpp: 30, showRate: 70, emailBook: 1.5, dialBook: 1.8 },
            'seed': { winRate: 18, discoToOpp: 35, showRate: 75, emailBook: 1.8, dialBook: 2.0 },
            'series-a': { winRate: 22, discoToOpp: 40, showRate: 80, emailBook: 2.0, dialBook: 2.3 },
            'series-b-plus': { winRate: 25, discoToOpp: 45, showRate: 85, emailBook: 2.5, dialBook: 2.8 }
        };
        var stageRates = answers.stage && stageDefaults[answers.stage] ? stageDefaults[answers.stage] : {};

        if (answers.quota || answers.acv || answers.stage) {
            var qwInputs = {};
            if (answers.quota) qwInputs.annualQuota = answers.quota;
            if (answers.acv) qwInputs.acv = answers.acv;
            if (stageRates.winRate) qwInputs.winRate = stageRates.winRate;
            if (stageRates.discoToOpp) qwInputs.discoToOpp = stageRates.discoToOpp;
            if (stageRates.showRate) qwInputs.showRate = stageRates.showRate;
            if (stageRates.emailBook) qwInputs.emailBook = stageRates.emailBook;
            if (stageRates.dialBook) qwInputs.dialBook = stageRates.dialBook;
            if (answers.stage) qwInputs.stage = answers.stage;
            writeJson('gtmos_qw_inputs', qwInputs);

            var outboundSeed = readJson('gtmos_outbound_seed', {});
            if (answers.quota) outboundSeed.annual_quota = answers.quota;
            if (answers.acv) outboundSeed.acv = answers.acv;
            outboundSeed.updated_at = new Date().toISOString();
            writeJson('gtmos_outbound_seed', outboundSeed);
        }

        if (answers.idealCustomer) {
            var icpAnalytics = readJson('gtmos_icp_analytics', { icps: [], totalWorked: 0 });
            if (!Array.isArray(icpAnalytics.icps)) icpAnalytics.icps = [];
            if (icpAnalytics.icps.length === 0) {
                icpAnalytics.icps.push({
                    timestamp: new Date().toISOString(),
                    role: 'custom',
                    industry: '',
                    size: '',
                    geo: '',
                    buyer: answers.idealCustomer,
                    pain: '',
                    trigger: '',
                    proofWindow: '',
                    activeAccounts: 0,
                    statement: 'Draft ICP: ' + answers.idealCustomer,
                    worked: false,
                    source: 'onboarding'
                });
                icpAnalytics.totalWorked = 0;
                writeJson('gtmos_icp_analytics', icpAnalytics);
            }
        }

        return playbook;
    }

    function seedDemoWorkspace(persona, answers, playbook) {
        var company = answers.companyName || 'Demo Company';
        var acv = Math.max(12000, Number(answers.acv || 32000));
        var quota = Math.max(acv * 20, Number(answers.quota || (acv * 24)));
        var icpLine = answers.idealCustomer || 'Mid-market B2B teams with high manual pipeline overhead';
        var nowIso = new Date().toISOString();

        playbook.company = company;
        playbook.stage = answers.stage || playbook.stage || 'seed';
        playbook.acv = String(acv);
        playbook.cycle = playbook.cycle || '45-75 days';
        playbook.notes = 'Demo workspace seeded from onboarding. All records are editable and safe to overwrite.';
        playbook.fields = playbook.fields || {};
        playbook.fields['market-who'] = icpLine;
        playbook.fields['market-segment'] = 'Mid-market software';
        playbook.fields['market-wedge'] = 'Teams with 5-20 quota carriers';
        playbook.fields['motion-channel'] = 'Email + LinkedIn + phone';
        playbook.fields['disco-patterns'] = 'Champion-led opportunities close faster than committee-led deals.';
        playbook.fields['win-patterns'] = 'Deals move when there is a quantified cost of delay and a weekly owner.';
        playbook.checks = playbook.checks || {};
        playbook.checks['step1'] = true;
        playbook.checks['step2'] = true;
        playbook.checks['step3'] = true;
        playbook.timestamp = nowIso;
        writeJson('gtmos_playbook', playbook);

        var outboundSeed = readJson('gtmos_outbound_seed', {});
        outboundSeed.annual_quota = quota;
        outboundSeed.acv = acv;
        outboundSeed.updated_at = nowIso;
        writeJson('gtmos_outbound_seed', outboundSeed);

        var icpAnalytics = {
            icps: [
                {
                    timestamp: isoDaysFromNow(-20),
                    role: 'custom',
                    industry: 'B2B SaaS',
                    size: '200-1000 employees',
                    geo: 'North America',
                    buyer: icpLine,
                    pain: 'Pipeline review is anecdotal and late.',
                    trigger: 'Revenue target increased without pipeline expansion.',
                    proofWindow: '90 days',
                    activeAccounts: 38,
                    statement: 'High-growth B2B SaaS teams needing tighter pipeline execution.',
                    worked: true,
                    workedDeals: 2,
                    source: 'demo-seed'
                },
                {
                    timestamp: isoDaysFromNow(-14),
                    role: 'custom',
                    industry: 'Fintech',
                    size: '100-800 employees',
                    geo: 'US + UK',
                    buyer: 'VP Sales or CRO',
                    pain: 'Forecast confidence drops due to late deal risk detection.',
                    trigger: 'Board asks for tighter forecast accuracy.',
                    proofWindow: '60 days',
                    activeAccounts: 22,
                    statement: 'Fintech operators under pressure to improve forecast reliability.',
                    worked: false,
                    workedDeals: 0,
                    source: 'demo-seed'
                },
                {
                    timestamp: isoDaysFromNow(-10),
                    role: 'custom',
                    industry: 'Healthcare IT',
                    size: '150-1200 employees',
                    geo: 'North America',
                    buyer: 'Head of Revenue Operations',
                    pain: 'Qualification criteria vary by rep and stage.',
                    trigger: 'New enterprise segment launched.',
                    proofWindow: '120 days',
                    activeAccounts: 16,
                    statement: 'Healthcare IT teams standardizing repeatable qualification.',
                    worked: false,
                    workedDeals: 0,
                    source: 'demo-seed'
                }
            ],
            totalWorked: 1
        };
        writeJson('gtmos_icp_analytics', icpAnalytics);

        writeJson('gtmos_account_planning', {
            fields: {
                sponsor: 'VP Revenue',
                economicBuyer: 'CFO',
                painSummary: 'Late-stage risk surprises',
                targetOutcome: '20% better forecast confidence',
                timeline: 'Quarterly rollout',
                risks: 'Data hygiene and process adoption'
            },
            updatedAt: nowIso
        });

        var dealList = [
            {
                id: 'demo-deal-1',
                account_name: 'Northstar Bank',
                deal_value: Math.round(acv * 1.8),
                stage: 'negotiation',
                champion: 'A. Kim',
                close_date: isoDaysFromNow(18),
                next_steps: 'Finalize legal review and procurement checklist.',
                primary_persona: 'VP Sales',
                pain_points: 'Forecast volatility in enterprise segment.',
                decision_process: 'CRO + Finance + Procurement',
                timeline: 'Quarter end',
                competition: 'Internal spreadsheet workflow',
                blockers: 'Security review',
                use_cases: 'Pipeline review standardization',
                economic_buyer: 'CFO',
                created_at: isoDaysFromNow(-24),
                updated_at: isoDaysFromNow(-2)
            },
            {
                id: 'demo-deal-2',
                account_name: 'Cascade Health Systems',
                deal_value: Math.round(acv * 1.4),
                stage: 'poc',
                champion: 'S. Patel',
                close_date: isoDaysFromNow(26),
                next_steps: 'Complete pilot success review with RevOps lead.',
                primary_persona: 'RevOps Director',
                pain_points: 'Low confidence in pipeline stage movement.',
                decision_process: 'RevOps + CFO',
                timeline: '6-week pilot',
                competition: 'Legacy CRM reports',
                blockers: 'Pilot adoption',
                use_cases: 'Deal staleness and qualification workflow',
                economic_buyer: 'VP Finance',
                created_at: isoDaysFromNow(-30),
                updated_at: isoDaysFromNow(-3)
            },
            {
                id: 'demo-deal-3',
                account_name: 'Vertex Commerce',
                deal_value: Math.round(acv * 1.1),
                stage: 'qualification',
                champion: 'M. Torres',
                close_date: isoDaysFromNow(34),
                next_steps: 'Confirm business case metrics with sales ops.',
                primary_persona: 'Sales Ops Manager',
                pain_points: 'No consistent qualification language.',
                decision_process: 'Sales Ops + CRO',
                timeline: 'Month-end decision',
                competition: 'Point solution trial',
                blockers: 'Internal alignment',
                use_cases: 'Qualification scorecard implementation',
                economic_buyer: 'CRO',
                created_at: isoDaysFromNow(-16),
                updated_at: isoDaysFromNow(-1)
            },
            {
                id: 'demo-deal-4',
                account_name: 'Summit Data Group',
                deal_value: Math.round(acv * 2.2),
                stage: 'closed-won',
                champion: 'R. Lewis',
                close_date: isoDaysFromNow(-5),
                next_steps: 'Kickoff and handoff to customer success.',
                primary_persona: 'VP Revenue',
                created_at: isoDaysFromNow(-48),
                updated_at: isoDaysFromNow(-5)
            },
            {
                id: 'demo-deal-5',
                account_name: 'Quarry Analytics',
                deal_value: Math.round(acv * 1.6),
                stage: 'closed-lost',
                champion: 'J. Carter',
                close_date: isoDaysFromNow(-11),
                next_steps: 'Re-engage next quarter with revised pricing.',
                primary_persona: 'Head of Sales',
                created_at: isoDaysFromNow(-52),
                updated_at: isoDaysFromNow(-11)
            }
        ];
        writeJson('gtmos_deal_workspaces', dealList);

        var qualBreakdownStrong = {
            champion: 2, eb: 2, usecase: 2, impact: 2, process: 2, timeline: 1, competition: 1, risks: 1, nextstep: 2
        };
        var qualBreakdownGood = {
            champion: 2, eb: 1, usecase: 2, impact: 1, process: 1, timeline: 1, competition: 1, risks: 1, nextstep: 2
        };
        writeJson('gtmos_deal_quals', {
            'demo-deal-1': { score: 15, level: 'qualified', breakdown: qualBreakdownStrong, updatedAt: nowIso },
            'demo-deal-2': { score: 13, level: 'qualified', breakdown: qualBreakdownGood, updatedAt: nowIso },
            'demo-deal-3': { score: 12, level: 'qualified', breakdown: qualBreakdownGood, updatedAt: nowIso },
            'demo-deal-4': { score: 16, level: 'strong', breakdown: qualBreakdownStrong, frozenAt: isoDaysFromNow(-5), updatedAt: isoDaysFromNow(-5) }
        });

        writeJson('gtmos_deal_outcomes', {
            'demo-deal-4': {
                type: 'won',
                trigger: 'Board-level forecast initiative',
                framework: 'Mutual action plan',
                territories: ['economic impact', 'decision process'],
                persona: 'VP Revenue',
                displacement: 'competitive',
                cycleLength: 43,
                qualScoreAtClose: 16,
                whatWorked: 'We quantified cost of delay and assigned a weekly owner.',
                tags: ['roi-proof', 'process-discipline'],
                closedAt: isoDaysFromNow(-5)
            },
            'demo-deal-5': {
                type: 'lost',
                stalledStage: 'negotiation',
                lossReason: 'security',
                lossDetail: 'Security review expanded and timeline slipped.',
                aiObjectionBlocker: '',
                doOverActions: ['engage security earlier', 'align legal timing'],
                doOverDetail: 'Start security track during qualification.',
                qualScoreAtClose: 11,
                closedAt: isoDaysFromNow(-11)
            },
            'demo-deal-2': {
                type: 'won',
                trigger: 'Quarterly planning reset',
                framework: 'Pilot to rollout',
                territories: ['use case', 'timeline'],
                persona: 'RevOps Director',
                displacement: 'greenfield',
                cycleLength: 37,
                qualScoreAtClose: 13,
                whatWorked: 'Tied pilot success metric to executive forecast cadence.',
                tags: ['pilot-conversion'],
                closedAt: isoDaysFromNow(-1)
            }
        });

        writeJson('gtmos_deal_reviews', [
            { id: 'demo-review-1', dealId: 'demo-deal-1', timestamp: isoDaysFromNow(-3), note: 'Risk review completed.' },
            { id: 'demo-review-2', dealId: 'demo-deal-2', timestamp: isoDaysFromNow(-8), note: 'Pilot metric updated.' },
            { id: 'demo-review-3', dealId: 'demo-deal-3', timestamp: isoDaysFromNow(-13), note: 'Qualification strengthened.' }
        ]);

        writeJson('gtmos_discovery_stats', {
            totalCalls: 9,
            advancedCalls: 4,
            wins: 2,
            losses: 1,
            updated_at: nowIso
        });

        writeJson('gtmos_discovery_agenda', {
            contact: 'Jordan Lee',
            title: 'VP Revenue',
            company: 'Northstar Bank',
            gates: [true, true, true, true],
            linkedDeal: 'demo-deal-1',
            updatedAt: nowIso
        });

        writeJson('gtmos_angles', [
            { id: 'demo-angle-1', created_at: isoDaysFromNow(-18), name: 'Hiring signal', payload: { got_reply: true, trigger: 'new sales hiring' } },
            { id: 'demo-angle-2', created_at: isoDaysFromNow(-15), name: 'Funding signal', payload: { got_reply: false, trigger: 'recent funding round' } },
            { id: 'demo-angle-3', created_at: isoDaysFromNow(-12), name: 'Territory expansion', payload: { got_reply: true, trigger: 'new market launch' } },
            { id: 'demo-angle-4', created_at: isoDaysFromNow(-10), name: 'Forecast pressure', payload: { got_reply: false, trigger: 'forecast miss' } },
            { id: 'demo-angle-5', created_at: isoDaysFromNow(-7), name: 'Ops bottleneck', payload: { got_reply: false, trigger: 'revops backlog' } },
            { id: 'demo-angle-6', created_at: isoDaysFromNow(-4), name: 'Pipeline staleness', payload: { got_reply: false, trigger: 'aging opportunities' } }
        ]);

        writeJson('gtmos_asset_builder_analytics', {
            assets: [
                { id: 'demo-asset-1', title: 'ROI one-pager', worked: true, createdAt: isoDaysFromNow(-9) },
                { id: 'demo-asset-2', title: 'Mutual action plan template', worked: false, createdAt: isoDaysFromNow(-6) },
                { id: 'demo-asset-3', title: 'Executive summary deck', worked: false, createdAt: isoDaysFromNow(-2) }
            ],
            totalWorked: 1
        });

        writeJson('gtmos_qual_texts', {
            'demo-deal-1': {
                champion: 'VP Revenue aligned to the rollout plan.',
                eb: 'CFO reviewed expected payback period.',
                usecase: 'Weekly forecast review process is defined.',
                impact: 'Forecast confidence to rise from 62% to 80%.',
                process: 'Security, legal, procurement owners assigned.',
                timeline: 'Target go-live in under 45 days.'
            },
            'demo-deal-2': {
                champion: 'RevOps lead owns pilot metrics.',
                eb: 'VP Finance approved pilot budget.',
                usecase: 'Qualification workflow embedded in deal reviews.',
                impact: 'Cycle time reduced by 15%.',
                process: 'Pilot check-ins weekly.',
                timeline: 'Pilot closes this month.'
            }
        });

        writeJson('gtmos_demo_seed_meta', {
            seededAt: nowIso,
            persona: persona,
            company: company,
            targetScore: 80
        });
    }

    function prePopulate(persona, answers) {
        persona = persona || 'founder';
        answers = answers || {};

        var playbook = seedBaseWorkspace(persona, answers);
        if (isDemoEnvironment()) {
            seedDemoWorkspace(persona, answers, playbook);
        }

        setState({
            completed: true,
            completedAt: new Date().toISOString(),
            persona: persona,
            answers: answers,
            environment: isDemoEnvironment() ? 'demo' : 'prod'
        });

        return true;
    }

    function guardPage() {
        var path = window.location.pathname;
        if (path.indexOf('/app/onboarding') >= 0) return;
        if (path.indexOf('/login') >= 0) return;
        if (path.indexOf('/signup') >= 0) return;
        if (path.indexOf('/auth/') >= 0) return;
        if (path.indexOf('/forgot-password') >= 0) return;
        if (!isCompleted()) window.location.replace('/app/onboarding/');
    }

    window.gtmOnboarding = {
        getState: getState,
        setState: setState,
        isCompleted: isCompleted,
        prePopulate: prePopulate,
        guardPage: guardPage,
        isDemoEnvironment: isDemoEnvironment,
        ONBOARDING_KEY: ONBOARDING_KEY
    };
})();
