(function () {
    'use strict';

    if (window.gtmMethodologyBridge) return;

    var METHOD_CAMPAIGN = 'phase20_methodology_bridge';
    var HUB_PATH = '/methodology/';

    var PAGE_MAP = {
        '/methodology/when-to-hire-first-sales-person-startup.html': {
            eyebrow: 'Buyer A · Founder-led sales',
            audience: 'Founders deciding whether the first sales hire would be multiplication or rescue.',
            bestFor: 'You are carrying the motion yourself and need to know whether the system is handoff-safe yet.',
            sessionOutcome: 'a more honest read on whether the first hire is safe, what is still fragile, and what the handoff kit would need to contain',
            modules: [
                { href: '/app/readiness/', label: 'Readiness', reason: 'score whether the motion is mature enough to survive a first hire' },
                { href: '/app/founding-gtm/', label: 'Founding GTM', reason: 'see what a first AE should inherit when the handoff is real' },
                { href: '/app/dashboard/', label: 'Dashboard', reason: 'check whether the current system is producing enough truth to manage' }
            ],
            outputs: [
                'A blunt read on whether the motion is ready to hand off.',
                'The gaps that still make a first hire dangerous.',
                'A cleaner sense of what the eventual handoff kit must include.'
            ],
            related: [
                { href: '/methodology/founder-led-sales-process.html', label: 'Founder-led sales process' },
                { href: '/methodology/first-ae-playbook.html', label: 'First AE playbook' },
                { href: '/methodology/sales-handoff-kit.html', label: 'Sales handoff kit' }
            ]
        },
        '/methodology/founder-led-sales-process.html': {
            eyebrow: 'Buyer A · Founder-led sales',
            audience: 'Founders who need the motion to become a system before they hire or scale it.',
            bestFor: 'You know the product matters, but you still need ICP, discovery, outbound, deal, and proof layers to handshake.',
            sessionOutcome: 'a founder-led system with visible inputs and outputs instead of a pile of memory and momentum',
            modules: [
                { href: '/app/icp-studio/', label: 'ICP Studio', reason: 'turn broad founder instinct into a target that can actually be run' },
                { href: '/app/signal-console/', label: 'Signal Console', reason: 'make account temperature and timing visible instead of guessed' },
                { href: '/app/deal-workspace/', label: 'Deal Workspace', reason: 'force the system to keep next steps, proof, and risk honest' }
            ],
            outputs: [
                'A narrower ICP and signal model that the rest of the app can compound from.',
                'A real deal object with visible risk and next-step truth.',
                'A system that feels more inspectable than charismatic.'
            ],
            related: [
                { href: '/methodology/when-to-hire-first-sales-person-startup.html', label: 'When to hire your first salesperson' },
                { href: '/methodology/enterprise-discovery-call-framework.html', label: 'Enterprise discovery call framework' },
                { href: '/methodology/sales-handoff-kit.html', label: 'Sales handoff kit' }
            ]
        },
        '/methodology/enterprise-discovery-call-framework.html': {
            eyebrow: 'Buyer B · Enterprise discovery',
            audience: 'Founders and first operators who need discovery to collect decision intelligence, not just rapport.',
            bestFor: 'You want discovery to change deal quality, not just generate nicer notes.',
            sessionOutcome: 'a call plan, a clearer discovery structure, and a better sense of what should be captured before any pitch or proof move',
            modules: [
                { href: '/app/discovery-studio/', label: 'Discovery Studio', reason: 'structure the live questioning and intelligence capture' },
                { href: '/app/discovery-agenda/', label: 'Call Planner', reason: 'leave the session with a call plan instead of vague prep' },
                { href: '/app/deal-workspace/', label: 'Deal Workspace', reason: 'push discovery truth forward into the actual deal object' }
            ],
            outputs: [
                'A repeatable discovery frame instead of ad hoc questioning.',
                'A call agenda tied to real buyer intelligence.',
                'Deal context that becomes more useful after every call.'
            ],
            related: [
                { href: '/methodology/sales-champion-framework.html', label: 'Sales champion framework' },
                { href: '/methodology/sales-kill-switch-framework.html', label: 'Sales kill switch framework' },
                { href: '/methodology/founder-led-sales-process.html', label: 'Founder-led sales process' }
            ]
        },
        '/methodology/cold-call-script-b2b-saas.html': {
            eyebrow: 'Buyer B · Outbound execution',
            audience: 'Operators who need cold call structure that produces live motion, not memorized theater.',
            bestFor: 'You want outbound to feel operational and inspectable rather than motivational.',
            sessionOutcome: 'a call structure, logging rhythm, and better sense of how outreach should connect to the rest of the system',
            modules: [
                { href: '/app/cold-call-studio/', label: 'Cold Call Studio', reason: 'turn the state machine into an actual calling workflow' },
                { href: '/app/outbound-studio/', label: 'Outbound Studio', reason: 'make sequences, touches, and next actions visible' },
                { href: '/app/linkedin-playbook/', label: 'LinkedIn Playbook', reason: 'carry the same channel discipline into social touchpoints' }
            ],
            outputs: [
                'A cold-call flow that is easier to run and inspect live.',
                'A better logging habit after each touch.',
                'A clearer bridge from call motion into broader outbound coverage.'
            ],
            related: [
                { href: '/methodology/first-ae-playbook.html', label: 'First AE playbook' },
                { href: '/methodology/founder-led-sales-process.html', label: 'Founder-led sales process' },
                { href: '/methodology/sales-kill-switch-framework.html', label: 'Sales kill switch framework' }
            ]
        },
        '/methodology/first-ae-playbook.html': {
            eyebrow: 'Buyer B · First-sales hire',
            audience: 'Founders and first AEs trying to turn founder memory into inherited operating context.',
            bestFor: 'You are about to hand off the motion or need to prove what the first rep should actually inherit.',
            sessionOutcome: 'a more explicit inherited playbook shape across ICP, proof, deal discipline, and daily command behavior',
            modules: [
                { href: '/app/founding-gtm/', label: 'Founding GTM', reason: 'compile what the first AE should inherit instead of rediscover' },
                { href: '/app/readiness/', label: 'Readiness', reason: 'show where the system is still too thin for a safe handoff' },
                { href: '/app/dashboard/', label: 'Dashboard', reason: 'turn handoff into a daily operating rhythm, not a PDF event' }
            ],
            outputs: [
                'A clearer inherited playbook instead of a rep-sized blank space.',
                'Visible handoff risk before the hire compounds it.',
                'A better link between daily operating truth and first-rep coaching.'
            ],
            related: [
                { href: '/methodology/when-to-hire-first-sales-person-startup.html', label: 'When to hire your first salesperson' },
                { href: '/methodology/sales-handoff-kit.html', label: 'Sales handoff kit' },
                { href: '/methodology/founder-led-sales-process.html', label: 'Founder-led sales process' }
            ]
        },
        '/methodology/sales-handoff-kit.html': {
            eyebrow: 'Buyer B · Sales handoff',
            audience: 'Founders who need the handoff artifact to become a real operating asset.',
            bestFor: 'You want the first rep to inherit context, proof, signals, and risk instead of disconnected anecdotes.',
            sessionOutcome: 'a stronger sense of what the handoff kit must contain and which upstream modules need to feed it',
            modules: [
                { href: '/app/founding-gtm/', label: 'Founding GTM', reason: 'assemble the handoff kit from live upstream truth' },
                { href: '/app/readiness/', label: 'Readiness', reason: 'score whether the motion is mature enough to transfer cleanly' },
                { href: '/app/dashboard/', label: 'Dashboard', reason: 'keep the inherited motion operating after the handoff document exists' }
            ],
            outputs: [
                'A clearer handoff asset instead of a founder-memory dump.',
                'A better map of which modules must feed the eventual kit.',
                'A more defensible first-AE transition story.'
            ],
            related: [
                { href: '/methodology/first-ae-playbook.html', label: 'First AE playbook' },
                { href: '/methodology/when-to-hire-first-sales-person-startup.html', label: 'When to hire your first salesperson' },
                { href: '/methodology/sales-champion-framework.html', label: 'Sales champion framework' }
            ]
        },
        '/methodology/sales-kill-switch-framework.html': {
            eyebrow: 'Buyer B · Deal discipline',
            audience: 'Operators who need dead-deal discipline to become systemic instead of emotional.',
            bestFor: 'You want stale pipeline truth to become visible before it poisons the forecast.',
            sessionOutcome: 'a better rule set for killing zombie deals and moving that discipline into the live pipeline',
            modules: [
                { href: '/app/future-autopsy/', label: 'Future Autopsy', reason: 'make deal death patterns visible before they repeat' },
                { href: '/app/deal-workspace/', label: 'Deal Workspace', reason: 'tie kill-switch logic to the actual deal object and next steps' },
                { href: '/app/dashboard/', label: 'Dashboard', reason: 'surface pipeline risk in the command layer where it belongs' }
            ],
            outputs: [
                'Cleaner criteria for cutting dead deals.',
                'A more honest view of deal risk and momentum decay.',
                'A tighter bridge between qualification and forecast truth.'
            ],
            related: [
                { href: '/methodology/sales-champion-framework.html', label: 'Sales champion framework' },
                { href: '/methodology/enterprise-discovery-call-framework.html', label: 'Enterprise discovery call framework' },
                { href: '/methodology/sales-handoff-kit.html', label: 'Sales handoff kit' }
            ]
        },
        '/methodology/sales-champion-framework.html': {
            eyebrow: 'Buyer B · Champion health',
            audience: 'Sellers who need a real read on internal power, access, and commitment inside a deal.',
            bestFor: 'You want champion quality to affect proof, next steps, and risk instead of staying a gut feeling.',
            sessionOutcome: 'a better read on whether a deal actually has an internal mover and what to do if it does not',
            modules: [
                { href: '/app/deal-workspace/', label: 'Deal Workspace', reason: 'carry champion truth into live deal notes and risk' },
                { href: '/app/poc-framework/', label: 'PoC Framework', reason: 'tie proof strategy to the strength of the internal champion' },
                { href: '/app/advisor-deploy/', label: 'Advisor Deploy', reason: 'decide when outside leverage should help strengthen the thread' }
            ],
            outputs: [
                'A sharper distinction between a polite contact and a real internal operator.',
                'Proof moves that match the political reality of the deal.',
                'A clearer sense of when the thread is too weak to trust.'
            ],
            related: [
                { href: '/methodology/sales-kill-switch-framework.html', label: 'Sales kill switch framework' },
                { href: '/methodology/enterprise-discovery-call-framework.html', label: 'Enterprise discovery call framework' },
                { href: '/methodology/sales-handoff-kit.html', label: 'Sales handoff kit' }
            ]
        },
        '/methodology/portfolio-gtm-assessment.html': {
            eyebrow: 'Buyer C · Portfolio support',
            audience: 'Platform teams and investors who need a durable way to assess founder-led sales maturity.',
            bestFor: 'You want a portfolio company assessment to measure operating readiness instead of anecdotal updates.',
            sessionOutcome: 'a stronger frame for how a portfolio GTM review should translate into live system work',
            modules: [
                { href: '/app/readiness/', label: 'Readiness', reason: 'score the operating maturity of the motion instead of relying on narrative' },
                { href: '/app/founding-gtm/', label: 'Founding GTM', reason: 'see what a company would hand off if the motion were actually encoded' },
                { href: '/app/dashboard/', label: 'Dashboard', reason: 'turn portfolio review into a recurring operating view instead of a slide' }
            ],
            outputs: [
                'A more structured portfolio GTM assessment model.',
                'A clearer line between readiness signals and operating gaps.',
                'A better way to convert portfolio support into real action.'
            ],
            related: [
                { href: '/methodology/vc-platform-sales-tools.html', label: 'VC platform sales tools' },
                { href: '/methodology/when-to-hire-first-sales-person-startup.html', label: 'When to hire your first salesperson' },
                { href: '/methodology/founder-led-sales-process.html', label: 'Founder-led sales process' }
            ]
        },
        '/methodology/vc-platform-sales-tools.html': {
            eyebrow: 'Buyer C · Platform ops',
            audience: 'VC platform teams trying to support repeatable sales systems instead of collecting dashboards.',
            bestFor: 'You need a product story that sounds like operating leverage, not generic enablement software.',
            sessionOutcome: 'a stronger picture of which Antaeus modules actually matter to platform support and portfolio readiness',
            modules: [
                { href: '/app/readiness/', label: 'Readiness', reason: 'show whether a portfolio company is actually maturing or just noisy' },
                { href: '/app/founding-gtm/', label: 'Founding GTM', reason: 'make handoff and system maturity legible to founders and platform leads' },
                { href: '/app/dashboard/', label: 'Dashboard', reason: 'turn scattered GTM observations into an operating command surface' }
            ],
            outputs: [
                'A more honest view of what platform teams should actually operationalize.',
                'A clearer product bridge between methodology and portfolio support.',
                'A stronger sense of how to pitch Antaeus as system leverage, not another dashboard.'
            ],
            related: [
                { href: '/methodology/portfolio-gtm-assessment.html', label: 'Portfolio GTM assessment' },
                { href: '/methodology/first-ae-playbook.html', label: 'First AE playbook' },
                { href: '/methodology/sales-handoff-kit.html', label: 'Sales handoff kit' }
            ]
        }
    };

    var HUB_CADENCE = [
        {
            lane: 'Founder-led sales',
            cadence: '1 page per week',
            topics: ['first-discovery-decision-memo', 'pricing-pressure-before-first-ae', 'founder-vs-first-ae-forecast-rules']
        },
        {
            lane: 'Discovery and deal discipline',
            cadence: '1 page every 2 weeks',
            topics: ['poc-design-without-free-consulting', 'enterprise-next-step-discipline', 'deal-revival-vs-deal-kill']
        },
        {
            lane: 'Platform and portfolio support',
            cadence: '1 page every 2 weeks',
            topics: ['portfolio-signal-review-rhythm', 'operator-led-portfolio-diagnostics', 'first-rep-readiness-for-investors']
        }
    ];

    function pathKey() {
        var path = window.location.pathname || HUB_PATH;
        if (path === '/methodology') return HUB_PATH;
        return path;
    }

    function esc(value) {
        var node = document.createElement('div');
        node.textContent = value == null ? '' : String(value);
        return node.innerHTML;
    }

    function slugFromPath(path) {
        return String(path || '').split('/').pop().replace(/\.html$/, '') || 'methodology';
    }

    function trackedUrl(basePath, label) {
        var slug = pathKey() === HUB_PATH ? 'index' : slugFromPath(pathKey());
        if (window.gtmAttribution && typeof window.gtmAttribution.buildUrl === 'function') {
            return window.gtmAttribution.buildUrl(basePath, {
                source: 'methodology',
                medium: 'content',
                campaign: METHOD_CAMPAIGN,
                content: slug,
                term: label || ''
            });
        }
        return basePath;
    }

    function track(name, props) {
        if (window.gtmAnalytics && typeof window.gtmAnalytics.track === 'function') {
            window.gtmAnalytics.track(name, Object.assign({
                module: 'methodology',
                methodology_path: pathKey()
            }, props || {}));
        }
    }

    function markCta(anchor, label) {
        if (!anchor) return;
        anchor.dataset.analyticsEvent = 'methodology_cta_click';
        anchor.dataset.analyticsLabel = label;
        anchor.dataset.analyticsZone = 'methodology_bridge';
    }

    function normalizeSharedLinks() {
        Array.prototype.forEach.call(document.querySelectorAll('a[href="/#pricing"]'), function (anchor) {
            anchor.href = trackedUrl('/purchase/', 'annual_plan');
        });

        var topnav = document.querySelector('.topnav');
        if (!topnav) return;

        var demoLink = topnav.querySelector('a[href="/demo-seed.html"]');
        if (demoLink) {
            demoLink.href = trackedUrl('/demo-seed.html', 'topnav_demo');
            demoLink.textContent = 'Explore Demo';
            markCta(demoLink, 'topnav_demo');
        }

        var startLink = topnav.querySelector('a[href="/login.html"]');
        if (startLink) {
            startLink.href = trackedUrl('/signup.html', 'topnav_signup');
            startLink.textContent = 'Start Workspace';
            startLink.className = 'link-pill';
            markCta(startLink, 'topnav_signup');
        }

        var ctaLink = topnav.querySelector('.cta-pill');
        if (ctaLink) {
            ctaLink.href = trackedUrl('/purchase/', 'topnav_purchase');
            ctaLink.textContent = 'See Annual Plan';
            markCta(ctaLink, 'topnav_purchase');
        }
    }

    function renderActions(actions, className) {
        return actions.map(function (action) {
            return '<a class="' + esc(action.className || className || 'link-pill') + '" href="' + esc(action.href) + '" data-analytics-event="methodology_cta_click" data-analytics-zone="methodology_bridge" data-analytics-label="' + esc(action.labelKey || action.label) + '">' + esc(action.label) + '</a>';
        }).join('');
    }

    function buildStandardActions(prefix) {
        return [
            { href: trackedUrl('/demo-seed.html', prefix + '_demo'), label: 'Explore Demo', className: 'cta-pill', labelKey: prefix + '_demo' },
            { href: trackedUrl('/signup.html', prefix + '_signup'), label: 'Start Workspace', className: 'link-pill', labelKey: prefix + '_signup' },
            { href: trackedUrl('/purchase/', prefix + '_purchase'), label: 'See Annual Plan', className: 'ghost-pill', labelKey: prefix + '_purchase' }
        ];
    }

    function injectAfter(reference, node) {
        if (!reference || !reference.parentNode || !node) return;
        reference.parentNode.insertBefore(node, reference.nextSibling);
    }

    function enhanceHub() {
        var hero = document.querySelector('main.hero');
        var indexGrid = hero && hero.querySelector('.index-grid');
        var ctaBlock = hero && hero.querySelector('.cta-block');
        if (!hero || !indexGrid) return;

        if (!hero.querySelector('.method-hub-guide')) {
            var guide = document.createElement('section');
            guide.className = 'method-hub-guide';
            guide.innerHTML =
                '<div class="hub-guide-header">' +
                    '<div class="hub-guide-kicker">Methodology as funnel infrastructure</div>' +
                    '<h2>Use these pages to move from agreement into product truth.</h2>' +
                    '<p>Read the page that matches the bottleneck, then move immediately into the demo, signup, or annual-plan path that proves the topic can become operating output.</p>' +
                '</div>' +
                '<div class="hub-guide-grid">' +
                    '<div class="hub-guide-card"><strong>1. Read for the bottleneck</strong><p>Choose the page that matches the current friction: founder-led motion, discovery, outbound, deal discipline, or platform support.</p></div>' +
                    '<div class="hub-guide-card"><strong>2. See it in the sample workspace</strong><p>Use demo mode to inspect how signals, deals, proof, and handoff fit together with live sample data.</p></div>' +
                    '<div class="hub-guide-card"><strong>3. Start your own workspace</strong><p>Move from agreement into real execution: build the ICP, log signals, create a deal, and make the dashboard honest.</p></div>' +
                '</div>';
            hero.insertBefore(guide, indexGrid);
        }

        if (!hero.querySelector('.methodology-cadence')) {
            var cadence = document.createElement('section');
            cadence.className = 'methodology-cadence';
            cadence.innerHTML =
                '<div class="hub-guide-header">' +
                    '<div class="hub-guide-kicker">Publishing cadence beyond the first 10 pages</div>' +
                    '<h2>Keep the methodology layer compounding.</h2>' +
                    '<p>This library should keep shipping on a visible rhythm so the content layer continues to feed demo, signup, and the annual-plan story.</p>' +
                '</div>' +
                '<div class="cadence-grid">' + HUB_CADENCE.map(function (lane) {
                    return '<div class="cadence-card">' +
                        '<strong>' + esc(lane.lane) + '</strong>' +
                        '<div class="cadence-frequency">' + esc(lane.cadence) + '</div>' +
                        '<ul>' + lane.topics.map(function (topic) {
                            return '<li>' + esc(topic) + '</li>';
                        }).join('') + '</ul>' +
                    '</div>';
                }).join('') + '</div>';
            injectAfter(indexGrid, cadence);
        }

        if (ctaBlock) {
            ctaBlock.innerHTML =
                '<h3>Methodology should lead into the product, not stop at agreement.</h3>' +
                '<p>These pages exist to create belief, then route that belief into a sample workspace, a real signup path, or the annual plan for the full operating system.</p>' +
                '<div class="cta-actions">' + renderActions(buildStandardActions('hub_bottom')) + '</div>' +
                '<div class="bridge-note">Ten pages are live now. The next wave keeps compounding founder-led sales, discovery, deal discipline, and portfolio support.</div>';
        }

        track('methodology_hub_rendered', { page_type: 'index', page_count: 10 });
    }

    function enhanceArticle(meta) {
        if (!meta) return;

        var eyebrow = document.querySelector('.eyebrow');
        if (eyebrow) eyebrow.textContent = meta.eyebrow;

        var metaRow = document.querySelector('.meta-row');
        if (metaRow && !document.querySelector('.credibility-strip')) {
            var credibility = document.createElement('div');
            credibility.className = 'credibility-strip';
            credibility.innerHTML =
                '<div class="credibility-card"><strong>Best for</strong><p>' + esc(meta.bestFor) + '</p></div>' +
                '<div class="credibility-card"><strong>Inside Antaeus</strong><p>' + esc(meta.modules[0].label) + ' is usually the first live module this topic should influence.</p></div>' +
                '<div class="credibility-card"><strong>One-session payoff</strong><p>Leave with ' + esc(meta.sessionOutcome) + '.</p></div>';
            injectAfter(metaRow, credibility);
        }

        var article = document.querySelector('.article');
        var sections = article ? article.querySelectorAll('section') : [];
        var bridgeSection = sections.length ? sections[sections.length - 1] : null;
        if (bridgeSection) {
            bridgeSection.className = 'bridge-section';
            bridgeSection.innerHTML =
                '<h2>Turn this methodology into a live operating move</h2>' +
                '<p>This topic should not stop at agreement. In Antaeus it should become a visible operating action, a saved artifact, and a more believable dashboard or handoff story.</p>' +
                '<div class="bridge-grid">' +
                    '<div class="bridge-card"><h3>Open these modules</h3><ul class="bridge-list">' + meta.modules.map(function (item) {
                        return '<li><a href="' + esc(item.href) + '">' + esc(item.label) + '</a><span>' + esc(item.reason) + '</span></li>';
                    }).join('') + '</ul></div>' +
                    '<div class="bridge-card"><h3>Leave one session with</h3><ul class="bridge-list">' + meta.outputs.map(function (item) {
                        return '<li><span>' + esc(item) + '</span></li>';
                    }).join('') + '</ul></div>' +
                    '<div class="bridge-card"><h3>Read next</h3><ul class="bridge-list">' + meta.related.map(function (item) {
                        return '<li><a href="' + esc(item.href) + '">' + esc(item.label) + '</a><span>Keep the methodology lane moving instead of stopping here.</span></li>';
                    }).join('') + '</ul></div>' +
                '</div>';
        }

        var ctaBlock = document.querySelector('.cta-block');
        if (ctaBlock) {
            ctaBlock.innerHTML =
                '<h3>Use this in the product, not just in theory.</h3>' +
                '<p>' + esc(meta.audience) + ' The next move is to turn the idea into live module output, not another saved tab.</p>' +
                '<div class="cta-actions">' + renderActions(buildStandardActions('article_bottom')) + '</div>' +
                '<div class="bridge-note">If you want to inspect the operating system before you trust it, start in demo. If you want your own workspace, start with signup.</div>';
        }

        track('methodology_article_bridge_rendered', {
            page_type: 'article',
            article_slug: slugFromPath(pathKey()),
            primary_module: meta.modules[0].label
        });
    }

    function attachClickTracking() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-analytics-event="methodology_cta_click"]'), function (anchor) {
            if (anchor.dataset.methodologyTracked === '1') return;
            anchor.dataset.methodologyTracked = '1';
            anchor.addEventListener('click', function () {
                track('methodology_cta_click', {
                    label: anchor.dataset.analyticsLabel || anchor.textContent || '',
                    href: anchor.getAttribute('href') || '',
                    page_type: pathKey() === HUB_PATH ? 'index' : 'article'
                });
            });
        });
    }

    function boot() {
        normalizeSharedLinks();
        if (pathKey() === HUB_PATH) {
            enhanceHub();
        } else {
            enhanceArticle(PAGE_MAP[pathKey()]);
        }
        attachClickTracking();
    }

    window.gtmMethodologyBridge = { boot: boot };
    boot();
})();
