/**
 * BULLETPROOF DISCOVERY FRAMEWORKS
 * Antaeus GTM OS - The Big Money Maker
 * 
 * 4 Product Categories × 7 Territories × 6-10 Response Scenarios
 * With embedded objection handling, persona variations, and color-coded flags
 */

const DISCOVERY_FRAMEWORKS = {
    
    // ================================================================
    // FRAMEWORK 1: CX AI / SUPPORT AUTOMATION
    // ================================================================
    cxai: {
        id: 'cxai',
        label: 'CX AI / Support Automation',
        color: 'cyan',
        description: 'For AI support automation products that resolve tickets (not just deflect). Navigate discovery and handle skepticism about chatbot effectiveness.',
        useCases: ['AI chatbots that resolve', 'Support ticket automation', 'Conversational AI agents', 'Help desk AI', 'Customer service AI'],
        coreInsight: "You don't sell chatbots. You sell the gap between what current bots deflect and what actually gets resolved — and the cost of humans handling what AI should.",
        competitiveLandscape: ['Zendesk AI', 'Intercom Fin', 'Ada', 'Forethought', 'Kustomer AI', 'Freshdesk Freddy'],
        typicalBuyers: ['VP Support', 'Head of CX', 'COO', 'VP Operations', 'Director of Customer Service'],
        keyMetrics: ['Tickets/month', 'Cost per ticket', 'Resolution rate', 'CSAT', 'First response time', 'Handle time'],
        territories: [
            // ====== TERRITORY 1: CURRENT STATE ======
            {
                id: 't1',
                name: '1. Current State',
                icon: '🎧',
                purpose: 'Understand their support landscape. Build rapport. Show you did homework. Low-threat opening.',
                gateCriteria: [
                    'Tech stack / tools they use (Zendesk, Intercom, Freshdesk, etc.)',
                    'Team structure and size',
                    'Volume metrics (tickets/month, channels)',
                    'Current automation attempts',
                    'Initial read on sophistication level'
                ],
                entries: [
                    { 
                        id: 'cxai-t1-e1', 
                        context: 'Cold / First Meeting',
                        label: 'Open-ended Discovery', 
                        text: '"Maybe just to get grounded—can you walk me through how support works at [Company] today? Like, what\'s the volume, what channels, and what does the team structure look like?"',
                        subtext: 'Why this works: Low threat, lets them frame it. You\'re genuinely curious, not interrogating.'
                    },
                    { 
                        id: 'cxai-t1-e2', 
                        context: 'Hypothesis-Led (PREFERRED)',
                        label: 'Show Your Homework', 
                        text: '"From what I could tell, it looks like you\'re running [Zendesk/Intercom] for ticketing, probably doing email and chat, maybe some phone. And I\'d guess you\'ve experimented with chatbots at some point—they\'re kind of unavoidable. Is that roughly right, or is it more complicated than that?"',
                        subtext: 'Why this works: Shows homework. Invites correction. Gets them talking. Being wrong is fine—they\'ll correct you and reveal more.'
                    },
                    { 
                        id: 'cxai-t1-e3', 
                        context: 'Warm / Referred',
                        label: 'Reference the Introduction', 
                        text: '"[Referrer] mentioned you\'re running a pretty sophisticated support operation—something like [X] tickets a month across multiple channels. Before I make assumptions, can you give me the real picture? What does support actually look like day-to-day?"',
                        subtext: 'Why this works: Leverages social proof from referrer while still being genuinely curious.'
                    },
                    { 
                        id: 'cxai-t1-e4', 
                        context: 'Recovery Version',
                        label: 'Reset After Rough Start', 
                        text: '"Let me step back—I want to make sure I understand your world before jumping to solutions. Forget what I said earlier. Can you just walk me through: what does a typical day look like for your support team?"',
                        subtext: 'Why this works: Humble reset. Shows you\'re listening, not pitching.'
                    },
                    { 
                        id: 'cxai-t1-e5', 
                        context: 'Executive Version',
                        label: 'Strategic Framing', 
                        text: '"I know you\'re not in the weeds on tickets—but from where you sit, how do you think about support? Is it primarily a cost center you\'re trying to optimize, or is it strategic to retention and expansion?"',
                        subtext: 'Why this works: Respects their altitude. Gets strategic context before tactical details.'
                    }
                ],
                responses: [
                    {
                        id: 'cxai-t1-r1',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Detailed, Transparent Answer',
                        text: '"Yeah, we\'re on Intercom, doing about 15K tickets a month. Team of 25, mostly tier 1. We\'ve tried chatbots but they\'re basically FAQ deflectors—customers hate them and just ask for a human anyway."',
                        meaning: 'They\'re open, they have volume, they have existing pain with automation. Perfect setup.',
                        move: {
                            label: 'Probe the Automation Gap',
                            text: '"15K a month is real volume. Of those, roughly what percentage actually need a human—like, truly require judgment or system access—versus ones that are repetitive but just too nuanced for your current bot to handle?"',
                            subtext: 'You\'re setting up the "resolution vs deflection" distinction that\'s your differentiator.'
                        },
                        listenFor: [
                            { signal: '"Most could be automated if the bot was smarter"', action: '🟢 GOLD. Transition to Pain/Impact.' },
                            { signal: '"40-50% are repetitive but bot can\'t handle"', action: '🟢 Quantify this. That\'s your ROI case.' },
                            { signal: 'Specific percentage or estimate', action: '🟢 Write it down. You\'ll use this number.' }
                        ],
                        transition: '"So when you say [X%] are repetitive—what\'s the actual cost there? Is it agent burnout, response times, or just scaling headcount?"',
                        nextTerritory: '2. Pain/Impact'
                    },
                    {
                        id: 'cxai-t1-r2',
                        flag: 'yellow',
                        type: 'GOOD',
                        label: 'High-Level Answer, Missing Details',
                        text: '"We use Zendesk. Support team is about 20 people. Pretty standard setup."',
                        meaning: 'They\'re being polite but not revealing much. Need to dig deeper.',
                        move: {
                            label: 'Get Specific Numbers',
                            text: '"Got it—standard setup makes sense. Can you give me a sense of volume? Like, roughly how many tickets a month? And are those mostly email, chat, or mixed?"',
                            subtext: 'You need numbers to build an ROI case later. Push gently for specifics.'
                        },
                        listenFor: [
                            { signal: 'They give numbers', action: '🟢 Good. Note them and transition to Pain.' },
                            { signal: 'They stay vague', action: '🟡 They might not know, or might not trust you yet. Try a hypothesis.' }
                        ],
                        transition: '"That\'s helpful context. What made you take this meeting—did something change recently?"',
                        nextTerritory: '3. Trigger/Priority'
                    },
                    {
                        id: 'cxai-t1-r3',
                        flag: 'orange',
                        type: 'CONCERNING',
                        label: 'Defensive or Guarded',
                        text: '"Why do you need to know our setup? Can\'t you just show me what you do?"',
                        meaning: 'They\'ve been burned by salespeople before, or they\'re not the real decision maker.',
                        move: {
                            label: 'Disarm and Reframe',
                            text: '"Totally fair question. I could do a generic demo, but honestly that wastes both our time. I\'m asking because the companies we help best look a certain way—and if you\'re not a fit, I\'d rather tell you that in 10 minutes than make you sit through a 45-minute pitch. Does that make sense?"',
                            subtext: 'You\'re positioning yourself as someone who qualifies OUT, not in. This builds trust.'
                        },
                        listenFor: [
                            { signal: 'They relax and open up', action: '🟢 Good. Return to discovery.' },
                            { signal: 'They stay defensive', action: '🔴 Consider if this is worth continuing.' }
                        ],
                        transition: '"So with that context—can you give me the 60-second version of how support runs today?"',
                        nextTerritory: 'Stay in T1 until you get basics'
                    },
                    {
                        id: 'cxai-t1-r4',
                        flag: 'red',
                        type: 'DEAL-KILLER',
                        label: 'Tiny Volume / No Real Need',
                        text: '"We get maybe 200 tickets a month. My team of 3 handles it fine."',
                        meaning: 'They don\'t have the volume to justify your solution. This is a bad fit.',
                        move: {
                            label: 'Graceful Exit',
                            text: '"I appreciate you being upfront. Honestly, at 200 tickets a month, you probably don\'t need us—the ROI wouldn\'t be there. Most of our customers are doing 5,000+ before the math works. Can I ask what made you take this call? Was there something specific you were hoping to solve?"',
                            subtext: 'You might uncover a different angle, or you might confirm the disqualification. Either way, you\'re being honest.'
                        },
                        exitStrategy: 'If volume is genuinely low, offer to check back in 6 months when they scale. Add to nurture list.',
                        nextTerritory: 'Qualify or Exit'
                    },
                    {
                        id: 'cxai-t1-r5',
                        flag: 'gray',
                        type: 'EVASIVE',
                        label: 'Won\'t Give Numbers',
                        text: '"I don\'t have exact numbers in front of me. We\'re just exploring options."',
                        meaning: 'Either they don\'t know (not the right person), don\'t trust you, or are hiding something.',
                        move: {
                            label: 'Call It Out Gently',
                            text: '"No worries on exact numbers—ballpark is fine. Are we talking hundreds of tickets a month? Thousands? Tens of thousands? Just trying to understand the scale so I know if we\'re even a fit."',
                            subtext: 'If they still won\'t answer, they might not be the decision maker.'
                        },
                        listenFor: [
                            { signal: 'They give a ballpark', action: '🟢 Good enough. Move forward.' },
                            { signal: '"I\'d have to ask my manager"', action: '🟡 You might be talking to the wrong person.' }
                        ],
                        transition: '"Who else is involved in evaluating something like this?"',
                        nextTerritory: '5. Stakeholders/Process'
                    },
                    {
                        id: 'cxai-t1-r6',
                        flag: 'red',
                        type: 'OBJECTION',
                        label: '"Chatbots Don\'t Work"',
                        text: '"We\'ve tried chatbots. They don\'t work. Customers hate them."',
                        meaning: 'They have scar tissue from a bad experience. This is actually an opportunity if handled right.',
                        objection: {
                            rootCause: 'They tried a rules-based or FAQ bot that deflects but doesn\'t resolve. Customers got frustrated because they had to repeat themselves when they got to a human.',
                            badResponse: '"Our chatbot is different, it uses AI..." (They\'ve heard this before. It sounds like every other vendor.)',
                            goodResponse: '"You\'re right—most chatbots are terrible. They\'re basically FAQ search with a chat interface. They deflect, they don\'t resolve. That\'s not what we do."',
                            greatResponse: '"Totally valid. Most chatbots are designed to deflect—push people to articles, force them to repeat themselves when they finally get a human. The question is: if you had a bot that could actually resolve tickets—like, take actions in your systems, not just answer questions—would that change anything? Or is this more of a \'we\'ve given up on AI for support\' situation?"'
                        },
                        move: {
                            label: 'Acknowledge & Differentiate',
                            text: '"You\'re right—most chatbots are terrible. They deflect, they don\'t resolve. That\'s the key distinction. [Pause] Setting aside whether AI works—the underlying pain that made you try a bot in the first place—that\'s real, right? What was it?"',
                            subtext: 'You\'re redirecting to the underlying pain while acknowledging their skepticism.'
                        },
                        transition: '"What made you try a bot in the first place? What were you hoping to solve?"',
                        nextTerritory: '2. Pain/Impact'
                    },
                    {
                        id: 'cxai-t1-r7',
                        flag: 'orange',
                        type: 'OBJECTION',
                        label: '"We\'re Building Our Own"',
                        text: '"Our engineering team is working on something internally. We\'re just comparing options."',
                        meaning: 'Engineering ego. Internal build is tough to beat but often fails.',
                        objection: {
                            rootCause: 'Engineering believes they can build it better/cheaper. Or there\'s political capital invested in the internal project.',
                            badResponse: '"You shouldn\'t build when you can buy..." (Insulting to their engineering team)',
                            goodResponse: '"Smart to evaluate build vs buy. What\'s the scope of the internal project? Sometimes we work alongside internal teams for the AI piece while they own the integrations."',
                            greatResponse: '"That makes sense. Engineering teams often want to own this. Can I ask: what\'s the timeline and team size for the internal build? And what happens to the roadmap for your core product while engineers are focused on support automation? I\'m not asking to be difficult—I just want to understand if there\'s a path to help or if I should get out of your way."'
                        },
                        move: {
                            label: 'Understand the Build',
                            text: '"Walk me through the internal project—scope, timeline, team size. I\'ll give you an honest take on where it makes sense to build vs buy. No sales pitch, just experience."',
                            subtext: 'Often internal projects are underscoped. Find out.'
                        },
                        transition: '"What would the internal build need to accomplish for it to be considered successful?"',
                        nextTerritory: '4. Prior Attempts'
                    }
                ],
                redFlags: [
                    { signal: 'Volume under 1,000 tickets/month', why: 'ROI won\'t justify the cost. Math doesn\'t work.', exit: 'Be honest: "At your volume, the ROI probably isn\'t there yet. Let\'s reconnect when you scale."' },
                    { signal: 'They\'re building their own solution', why: 'Engineering ego. They\'ll never buy if they think they can build.', exit: 'Ask timeline and budget for their build. Often uncovers it\'s not realistic.' },
                    { signal: 'No decision maker in the room', why: 'You\'re doing discovery with someone who can\'t say yes.', exit: 'Ask who else needs to be involved and suggest a joint call.' }
                ],
                greenFlags: [
                    { signal: 'They know their numbers (tickets, cost, team size)', capitalize: 'They\'re sophisticated buyers. Move faster, go deeper.' },
                    { signal: 'They mention a failed automation attempt', capitalize: 'They have budget and intent—just need a better solution.' },
                    { signal: 'They ask about integrations early', capitalize: 'They\'re thinking about implementation. Buying signal.' }
                ],
                transitions: {
                    strong: '"That\'s really helpful context. So let me ask—where does this actually hurt? Is it more cost, speed, quality, or something else?"',
                    neutral: '"Got it. Before we go further—what made you take this call today?"',
                    recovery: '"Let me step back. Forget everything I said. What\'s the one thing you\'d want to fix about support if you could wave a magic wand?"'
                }
            },
            // ====== TERRITORY 2: PAIN / IMPACT ======
            {
                id: 't2',
                name: '2. Pain / Impact',
                icon: '⚠️',
                purpose: 'Find where it hurts and QUANTIFY in dollars/hours/risk. This is where deals are won or lost.',
                gateCriteria: [
                    'Specific pain point (not generic)',
                    'Quantified impact ($X, Y hours, Z% error rate)',
                    'Who feels the pain (their role vs. the org)',
                    'How long this has been painful',
                    'Cost of inaction'
                ],
                entries: [
                    {
                        id: 'cxai-t2-e1',
                        context: 'Anchor to Their Words',
                        label: 'Use What They Said',
                        text: '"You mentioned [backlog / can\'t scale / bot doesn\'t work]. Where does that actually show up—is it more in response times, agent burnout, CSAT, or cost per ticket?"',
                        subtext: 'Why this works: You\'re using their language, not introducing new concepts.'
                    },
                    {
                        id: 'cxai-t2-e2',
                        context: 'Hypothesis-Led (PREFERRED)',
                        label: 'Pattern Matching',
                        text: '"A lot of support leaders tell me the same three things: they can\'t scale without hiring linearly, agents are burned out on repetitive work, or CSAT is suffering because of wait times. Does any of that resonate, or is it something different?"',
                        subtext: 'Why this works: Shows you understand their world. Multiple choice makes it easy to answer.'
                    },
                    {
                        id: 'cxai-t2-e3',
                        context: 'Executive Version',
                        label: 'Strategic Impact',
                        text: '"From a business standpoint, where does support show up as a constraint? Is it limiting how fast you can grow, affecting retention, or just eating margin?"',
                        subtext: 'Why this works: Executives think in business outcomes, not operational metrics.'
                    },
                    {
                        id: 'cxai-t2-e4',
                        context: 'Probing Deeper',
                        label: 'The "So What" Question',
                        text: '"When [the pain they mentioned] happens—what\'s the downstream impact? Like, what does that actually cost you?"',
                        subtext: 'Why this works: Connects tactical pain to strategic impact.'
                    },
                    {
                        id: 'cxai-t2-e5',
                        context: 'Recovery Version',
                        label: 'If Pain Isn\'t Obvious',
                        text: '"I want to make sure I\'m not solving a problem you don\'t have. On a scale of 1-10, how painful is support for you right now? And what would a 10 look like?"',
                        subtext: 'Why this works: Gets them to self-assess. If it\'s a 3, you might not have a deal.'
                    }
                ],
                responses: [
                    {
                        id: 'cxai-t2-r1',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Clear Pain - Scaling',
                        text: '"The scaling thing, definitely. Every time we grow, support costs grow at the same rate. We added 50% more customers last year and had to add 50% more agents. It\'s not sustainable."',
                        meaning: 'Classic scaling pain. Perfect for AI automation value prop.',
                        move: {
                            label: 'GO DEEP - QUANTIFY',
                            text: '"Let\'s put some numbers on that.\n\n1. What\'s the fully loaded cost of an agent? Probably $60-80K with benefits?\n\n2. How many agents did you add last year? And what did that cost?\n\n3. If you could automate 40-50% of tickets—real resolution, not deflection—what would that mean for next year\'s hiring plan?"',
                            subtext: '💰 THE MATH: If they added 10 agents at $70K = $700K. If you can reduce that by 40%, you\'re saving them $280K/year. Say this number back to them.'
                        },
                        listenFor: [
                            { signal: 'Specific cost per agent', action: '🟢 GOLD. Write it down. This is your ROI case.' },
                            { signal: '"We can\'t keep hiring at this rate"', action: '🟢 Urgency signal. Ask about timeline.' },
                            { signal: 'They mention a hiring freeze', action: '🟢 Even better. They HAVE to automate.' }
                        ],
                        transition: '"That\'s helpful. What made you take this meeting now—did something change, or has this been building for a while?"',
                        nextTerritory: '3. Trigger/Priority'
                    },
                    {
                        id: 'cxai-t2-r2',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Agent Burnout / Turnover',
                        text: '"Agent burnout is killing us. Turnover is like 40% annually. We spend half our time training new people who leave 6 months later."',
                        meaning: 'Turnover is expensive and measurable. Great angle.',
                        move: {
                            label: 'QUANTIFY THE TURNOVER',
                            text: '"40% turnover is brutal. Let me make sure I understand the math:\n\n1. How many agents total? And 40% turn over annually?\n\n2. What\'s the cost to recruit and train a new agent? Usually it\'s 3-6 months of salary...\n\n3. What percentage of tickets are repetitive—the ones that burn agents out?"',
                            subtext: '💰 THE MATH: 25 agents × 40% turnover = 10 replacements/year. At $15K cost to replace each = $150K/year in turnover cost alone.'
                        },
                        listenFor: [
                            { signal: 'Specific turnover numbers', action: '🟢 Build this into your ROI model.' },
                            { signal: '"The repetitive tickets are what burns them out"', action: '🟢 Perfect. That\'s exactly what AI should handle.' }
                        ],
                        transition: '"Has something changed recently that made this feel more urgent, or has it been building?"',
                        nextTerritory: '3. Trigger/Priority'
                    },
                    {
                        id: 'cxai-t2-r3',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'CSAT / Customer Experience',
                        text: '"Our CSAT is suffering. Response times are too long, and by the time customers get help, they\'re already frustrated. We\'re seeing it in churn."',
                        meaning: 'CSAT tied to churn = revenue impact. Big deal.',
                        move: {
                            label: 'QUANTIFY THE CHURN IMPACT',
                            text: '"CSAT affecting churn is serious. Help me understand the numbers:\n\n1. What\'s your current CSAT and where do you want it to be?\n\n2. What percentage of churned customers had a negative support interaction?\n\n3. What\'s the LTV of a customer? If you lose 100 customers from bad support, that\'s..."',
                            subtext: '💰 THE MATH: If 10% of churned customers cite support, and you\'re losing $500K in churn annually, that\'s $50K directly attributable to support experience.'
                        },
                        listenFor: [
                            { signal: 'They connect CSAT to revenue', action: '🟢 This is your ROI story.' },
                            { signal: 'Specific CSAT target', action: '🟢 You can measure success against this.' }
                        ],
                        transition: '"What made this become a priority now versus six months ago?"',
                        nextTerritory: '3. Trigger/Priority'
                    },
                    {
                        id: 'cxai-t2-r4',
                        flag: 'yellow',
                        type: 'GOOD',
                        label: 'Generic Pain - Needs Specifics',
                        text: '"Yeah, support is always a challenge. Response times could be better. The usual stuff."',
                        meaning: 'They\'re not feeling acute pain. Need to find something specific or this might not be urgent.',
                        move: {
                            label: 'Find the Specific',
                            text: '"\'The usual stuff\' can mean a lot of things. If I asked your CEO what they think about support—would they say it\'s fine, or would they have concerns? What would they say?"',
                            subtext: 'You\'re trying to find where the political pain is—what matters to leadership.'
                        },
                        listenFor: [
                            { signal: 'They mention a specific executive concern', action: '🟢 That\'s your angle. Dig into it.' },
                            { signal: '"CEO doesn\'t really pay attention to support"', action: '🟡 Might not have executive sponsorship for a big buy.' }
                        ],
                        transition: '"What would need to change for support to become a priority for leadership?"',
                        nextTerritory: '3. Trigger/Priority'
                    },
                    {
                        id: 'cxai-t2-r5',
                        flag: 'orange',
                        type: 'CONCERNING',
                        label: 'Focused on Cost Cutting Only',
                        text: '"We just need to cut costs. That\'s really all this is about."',
                        meaning: 'Cost-only buyers are tough. They\'ll beat you up on price and may not value quality.',
                        move: {
                            label: 'Reframe to Value',
                            text: '"Cost is definitely part of it. But I\'m curious—if you cut costs but CSAT drops and you start losing customers, is that a win? Or is there a quality bar you have to maintain?"',
                            subtext: 'You\'re trying to elevate the conversation from cost to value. If they only care about cost, this might be a race to the bottom.'
                        },
                        listenFor: [
                            { signal: '"Quality still matters"', action: '🟢 Good. Now you can talk about resolution vs deflection.' },
                            { signal: '"Just cut costs, don\'t care about quality"', action: '🔴 Might not be your customer.' }
                        ],
                        transition: '"What does success look like—is there a specific cost target, or is it more about efficiency?"',
                        nextTerritory: '6. Budget/Commercial Reality'
                    },
                    {
                        id: 'cxai-t2-r6',
                        flag: 'red',
                        type: 'DEAL-KILLER',
                        label: 'No Real Pain',
                        text: '"Honestly, things are working pretty well. We\'re just exploring what\'s out there."',
                        meaning: 'No pain = no urgency = no deal (in the near term).',
                        move: {
                            label: 'Test for Future Pain',
                            text: '"That\'s great that things are working. Let me ask a different question: where do you think support will break first if you 2x or 3x? What\'s the constraint you\'ll hit?"',
                            subtext: 'You\'re trying to find future pain even if current pain is low.'
                        },
                        listenFor: [
                            { signal: 'They identify a future constraint', action: '🟡 Nurture opportunity. Check back when they grow.' },
                            { signal: '"We\'ll figure it out when we get there"', action: '🔴 No urgency. Add to nurture list.' }
                        ],
                        exitStrategy: '"Sounds like you\'re in a good spot. Let me send you some resources in case things change, and let\'s reconnect in 6 months."',
                        nextTerritory: 'Likely exit'
                    },
                    {
                        id: 'cxai-t2-r7',
                        flag: 'orange',
                        type: 'OBJECTION',
                        label: '"Our Issues Are Too Complex for AI"',
                        text: '"Our support issues are really complex. I don\'t think AI can handle what we do."',
                        meaning: 'This is usually wrong—they overestimate complexity. But it\'s a real objection that needs handling.',
                        objection: {
                            rootCause: 'They\'re thinking of AI as a dumb chatbot, not an intelligent agent. Or they have a few truly complex edge cases and are extrapolating.',
                            badResponse: '"AI can handle anything!" (Too dismissive of their concern)',
                            goodResponse: '"You\'re probably right that some tickets are genuinely complex. What percentage would you say truly require human judgment versus ones that feel complex but are actually repetitive?"',
                            greatResponse: '"I hear that a lot, and here\'s what I\'ve found: when companies say their issues are complex, usually 20% truly are—those should stay with humans. But 80% feel complex because they require multiple system lookups or have edge cases, but they follow patterns. The question is: which 80% could be automated if the AI was smart enough? Let\'s not guess—can you walk me through a few examples of tickets you think are too complex?"'
                        },
                        move: {
                            label: 'Get Specific Examples',
                            text: '"Let\'s test that. Walk me through a couple of tickets you think are too complex for AI. I\'ll tell you honestly if we could handle them or not."',
                            subtext: 'You\'re offering to prove it with their own examples. This usually uncovers that most aren\'t as complex as they think.'
                        },
                        transition: '"Once we\'ve looked at a few examples, we\'ll have a better sense of what percentage could realistically be automated."',
                        nextTerritory: 'Stay in T2 until you establish value'
                    },
                    {
                        id: 'cxai-t2-r8',
                        flag: 'orange',
                        type: 'OBJECTION',
                        label: '"Customers Want to Talk to Humans"',
                        text: '"Our customers expect human service. They don\'t want to talk to a bot."',
                        meaning: 'Valid concern, but usually overstated. Most customers want FAST resolution, not necessarily human.',
                        objection: {
                            rootCause: 'They\'re projecting their own preferences, or they\'ve had bad bot experiences. Or it\'s a premium segment that truly wants white-glove service.',
                            badResponse: '"Customers actually prefer AI!" (Insulting to their customer knowledge)',
                            goodResponse: '"That\'s a fair concern. What does your data show? Do customers complain about bots, or is it more that the bots they\'ve tried couldn\'t actually help?"',
                            greatResponse: '"Here\'s what I\'ve seen: customers don\'t actually want to talk to humans—they want their problem solved fast. If a bot can resolve their issue in 30 seconds, they\'re happier than waiting 20 minutes for a human. But if the bot just deflects, they\'re furious. The question isn\'t bot vs human—it\'s \'does it actually solve the problem?\' What would your customers say if the bot could actually fix things, not just route them?"'
                        },
                        move: {
                            label: 'Reframe the Question',
                            text: '"What matters more to your customers: talking to a human, or getting their problem solved fast? If a bot resolved their issue instantly, would they complain?"',
                            subtext: 'You\'re separating the channel from the outcome.'
                        },
                        transition: '"Have you surveyed customers on this, or is it more of an intuition?"',
                        nextTerritory: 'Stay in T2'
                    }
                ],
                redFlags: [
                    { signal: '"Support isn\'t really a problem for us"', why: 'No pain = no deal. Don\'t force it.', exit: 'Add to nurture. Check back in 6 months.' },
                    { signal: 'Can\'t quantify any impact', why: 'If they can\'t measure it, they can\'t justify budget.', exit: 'Offer to help them build a business case. If no interest, move on.' },
                    { signal: 'Pain is political, not operational', why: '"My boss told me to look at this" without real need.', exit: 'Find out what the boss actually wants.' }
                ],
                greenFlags: [
                    { signal: 'They can quantify pain in dollars', capitalize: 'Build your ROI case around their numbers.' },
                    { signal: 'Pain is tied to a strategic initiative', capitalize: 'Connect your solution to their strategic goal.' },
                    { signal: 'Multiple people feel the pain', capitalize: 'You have potential champions across the org.' }
                ],
                transitions: {
                    strong: '"That\'s exactly the kind of pain we solve. What made you decide to look at this now?"',
                    neutral: '"Got it. Before we go further—is this a priority right now, or more of an exploration?"',
                    recovery: '"I want to make sure we\'re solving a real problem. What would need to change for this to become urgent?"'
                }
            },
            // ====== TERRITORY 3: TRIGGER / PRIORITY ======
            {
                id: 't3',
                name: '3. Trigger / Priority',
                icon: '⚡',
                purpose: 'Why NOW? What changed? No trigger = no urgency = no deal (or very slow deal).',
                gateCriteria: [
                    'Specific event that created urgency',
                    'Timeline (when does pressure hit?)',
                    'Consequence of missing the timeline',
                    'Is this a "must do" or "nice to have"?',
                    'Competing priorities'
                ],
                entries: [
                    {
                        id: 'cxai-t3-e1',
                        context: 'Direct',
                        label: 'The "Why Now" Question',
                        text: '"This has probably been on your radar for a while. What made you take this meeting now—did something change?"',
                        subtext: 'Why this works: Simple, direct. Lets them reveal the trigger without guessing.'
                    },
                    {
                        id: 'cxai-t3-e2',
                        context: 'Hypothesis-Led',
                        label: 'Pattern Matching',
                        text: '"Usually when people reach out, it\'s because something changed—new CEO pushing efficiency, a big growth round, support costs hit a threshold, or a key person quit. Any of those ring true?"',
                        subtext: 'Why this works: You\'re showing you understand common patterns.'
                    },
                    {
                        id: 'cxai-t3-e3',
                        context: 'Executive Version',
                        label: 'Board/Leadership Pressure',
                        text: '"Is this something the board or leadership is asking about? Or is it more of an operational initiative?"',
                        subtext: 'Why this works: Executive sponsorship changes everything.'
                    },
                    {
                        id: 'cxai-t3-e4',
                        context: 'If No Trigger',
                        label: 'Create Urgency',
                        text: '"What would need to happen for this to become urgent? Is there a point where the current situation becomes untenable?"',
                        subtext: 'Why this works: Helps them see their own burning platform.'
                    }
                ],
                responses: [
                    {
                        id: 'cxai-t3-r1',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Clear Trigger - Growth',
                        text: '"We just closed our Series B. We\'re about to 3x our customer base and there\'s no way support can scale with current approach."',
                        meaning: 'Growth trigger + funding = real urgency and budget.',
                        move: {
                            label: 'Lock the Timeline',
                            text: '"Congrats on the round. What\'s the timeline—when does the growth hit, and when do you need a solution in place to handle it?"',
                            subtext: 'Growth pressure creates urgency. Get the specific timeline.'
                        },
                        listenFor: [
                            { signal: 'Specific date or quarter', action: '🟢 That\'s your deal deadline. Work backwards.' },
                            { signal: '"As soon as possible"', action: '🟢 Strong urgency. Ask about decision process.' }
                        ],
                        transition: '"Have you tried to tackle this before? Any chatbot or automation attempts we should know about?"',
                        nextTerritory: '4. Prior Attempts'
                    },
                    {
                        id: 'cxai-t3-r2',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Efficiency Mandate',
                        text: '"New CEO. Whole company is focused on efficiency. Support is one of the big line items being scrutinized."',
                        meaning: 'Top-down mandate = executive sponsorship. Very strong.',
                        move: {
                            label: 'Understand the Mandate',
                            text: '"What\'s the target? Is there a specific efficiency goal or cost reduction number the CEO is looking for?"',
                            subtext: 'If you know the target, you can show how you hit it.'
                        },
                        listenFor: [
                            { signal: 'Specific percentage or dollar target', action: '🟢 Build your entire pitch around hitting that number.' },
                            { signal: '"Not sure of the specific target"', action: '🟡 Might not be close enough to the decision.' }
                        ],
                        transition: '"What else has been tried so far? Any automation initiatives already in flight?"',
                        nextTerritory: '4. Prior Attempts'
                    },
                    {
                        id: 'cxai-t3-r3',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Pain Event',
                        text: '"We had a major outage last month, got slammed with tickets, and our response time went to 72 hours. Leadership was not happy."',
                        meaning: 'Specific failure event. Strong trigger with executive visibility.',
                        move: {
                            label: 'Capture the Pain',
                            text: '"72 hours—that\'s brutal. What was the fallout? Churn, bad reviews, executive attention? And what\'s the mandate now—make sure it never happens again?"',
                            subtext: 'You\'re connecting the event to ongoing urgency.'
                        },
                        listenFor: [
                            { signal: 'Leadership mandate to fix it', action: '🟢 Executive sponsorship. Big opportunity.' },
                            { signal: 'Specific consequences (churn, reviews)', action: '🟢 Quantifiable impact. Use in ROI.' }
                        ],
                        transition: '"What\'s been tried since then to prevent it from happening again?"',
                        nextTerritory: '4. Prior Attempts'
                    },
                    {
                        id: 'cxai-t3-r4',
                        flag: 'yellow',
                        type: 'GOOD',
                        label: 'Vague Timing',
                        text: '"It\'s been on our roadmap for a while. We\'re just now getting around to evaluating options."',
                        meaning: 'Low urgency. This deal will move slowly unless you find a trigger.',
                        move: {
                            label: 'Find the Burning Platform',
                            text: '"What would need to happen for this to move from \'roadmap\' to \'urgent\'? Is there a point where the current situation breaks?"',
                            subtext: 'You\'re trying to help them see their own urgency.'
                        },
                        listenFor: [
                            { signal: 'They identify a specific breakpoint', action: '🟢 Now you have a trigger to reference.' },
                            { signal: '"Not really, just evaluating"', action: '🔴 This will be a long cycle. Qualify carefully.' }
                        ],
                        transition: '"Got it. Is there a timeline you\'re working against, or is this more open-ended?"',
                        nextTerritory: '5. Stakeholders/Process'
                    },
                    {
                        id: 'cxai-t3-r5',
                        flag: 'red',
                        type: 'DEAL-KILLER',
                        label: 'Just Browsing',
                        text: '"No specific timeline. Just exploring options. Wanted to see what\'s out there."',
                        meaning: 'No trigger = no urgency = very long deal cycle or no deal.',
                        move: {
                            label: 'Qualify Directly',
                            text: '"Let me ask directly—is there a scenario where you\'d actually move on this in the next six months? Or is this purely educational?"',
                            subtext: 'Better to know now than waste months on a dead deal.'
                        },
                        listenFor: [
                            { signal: '"If X happens, we\'d move fast"', action: '🟡 Conditional opportunity. Track the trigger.' },
                            { signal: '"Just want to know our options"', action: '🔴 Nurture only. Check back in 6 months.' }
                        ],
                        exitStrategy: '"Totally fair. Let me send you some resources, and let\'s reconnect when timing makes more sense."',
                        nextTerritory: 'Likely exit or nurture'
                    },
                    {
                        id: 'cxai-t3-r6',
                        flag: 'orange',
                        type: 'OBJECTION',
                        label: '"We\'re Already Talking to [Competitor]"',
                        text: '"We\'re already pretty far along with Ada/Forethought/Zendesk AI."',
                        meaning: 'Competitive deal. Can still win but need to differentiate fast.',
                        objection: {
                            rootCause: 'They started the process before they found you. Normal.',
                            badResponse: '"We\'re better than them because..." (They\'ve heard this)',
                            goodResponse: '"Makes sense they\'d be on your list. What criteria are you using to evaluate? What matters most?"',
                            greatResponse: '"Good—you should be talking to them. Can I ask: what does success look like for this project? Because if you\'re solving for [deflection/cost], they might be fine. If you need actual resolution—tickets fully resolved without humans—that\'s where the approaches diverge. Which matters more to you?"'
                        },
                        move: {
                            label: 'Understand Their Criteria',
                            text: '"What criteria are you using to evaluate? What\'s the most important thing this needs to do?"',
                            subtext: 'If you can reset the criteria, you can reset the deal.'
                        },
                        transition: '"What would make you choose us over them?"',
                        nextTerritory: '4. Prior Attempts or 5. Stakeholders'
                    }
                ],
                redFlags: [
                    { signal: 'No timeline, no event, no pressure', why: 'This deal will stall without urgency.', exit: 'Create a forcing function or move to nurture.' },
                    { signal: '"Evaluating for next year\'s budget"', why: 'Very long cycle. Might not be worth heavy investment now.', exit: 'Light touch. Check back Q4 for budget planning.' },
                    { signal: 'Internal project competing for resources', why: 'They might build instead of buy.', exit: 'Understand the internal project timeline and scope.' }
                ],
                greenFlags: [
                    { signal: 'Executive mandate with deadline', capitalize: 'This is a must-close deal. Accelerate everything.' },
                    { signal: 'Budget already allocated', capitalize: 'Money is there. Focus on winning, not justifying spend.' },
                    { signal: 'Failed with competitor recently', capitalize: 'They have urgency AND you can position against the failure.' }
                ],
                transitions: {
                    strong: '"Got it—[timeline] is tight but doable. Have you tried anything before, or is this the first real attempt?"',
                    neutral: '"Helpful to understand the timing. Before we go further—what else have you tried?"',
                    recovery: '"I want to make sure we\'re not wasting time. If this isn\'t urgent, should we just schedule a check-in for Q4?"'
                }
            },
            // ====== TERRITORY 4: PRIOR ATTEMPTS ======
            {
                id: 't4',
                name: '4. Prior Attempts',
                icon: '🔄',
                purpose: 'What\'s been tried? Why did it fail? This tells you what NOT to repeat and gives you competitive intelligence.',
                gateCriteria: [
                    'What solutions they\'ve tried',
                    'Why each failed (specific reasons)',
                    'What they learned',
                    'Success criteria for "this time"',
                    'Landmines to avoid'
                ],
                entries: [
                    {
                        id: 'cxai-t4-e1',
                        context: 'Direct',
                        label: 'The History Check',
                        text: '"Have you tried to tackle this before—chatbot, AI pilot, anything? Or is this the first time you\'re really looking at it?"',
                        subtext: 'Why this works: Opens up their history without assuming.'
                    },
                    {
                        id: 'cxai-t4-e2',
                        context: 'Hypothesis-Led',
                        label: 'Pattern Recognition',
                        text: '"Most companies your size have tried at least one chatbot or automation tool by now. What\'s your history with that? Anything we should know about?"',
                        subtext: 'Why this works: Normalizes having tried and failed.'
                    },
                    {
                        id: 'cxai-t4-e3',
                        context: 'If They Mentioned Failure Earlier',
                        label: 'Dig Into the Failure',
                        text: '"You mentioned [the failed bot/tool]. Walk me through what happened—what was the goal, what went wrong, and what would need to be different this time?"',
                        subtext: 'Why this works: Failures contain valuable learning.'
                    }
                ],
                responses: [
                    {
                        id: 'cxai-t4-r1',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Yes, It Failed',
                        text: '"We tried [Zendesk bot/Intercom Resolution Bot] last year. Spent 3 months implementing. Deflection went up but resolution didn\'t. Customers complained about having to repeat themselves. We turned it off after 6 months."',
                        meaning: 'They have scar tissue but also budget history and intent. Great opportunity.',
                        move: {
                            label: 'Diagnose the Failure',
                            text: '"That\'s a common story. Let me make sure I understand: the bot could deflect to articles, but when issues needed actual resolution—like processing a refund or checking an order—it couldn\'t do that, right? So customers had to start over with a human?"',
                            subtext: 'You\'re setting up the deflection vs resolution distinction.'
                        },
                        listenFor: [
                            { signal: '"Exactly—it couldn\'t actually do anything"', action: '🟢 Now you can position around resolution.' },
                            { signal: 'They describe specific failures', action: '🟢 Address each one in your pitch.' }
                        ],
                        transition: '"What would need to be different this time for you to feel confident it would actually work?"',
                        nextTerritory: '5. Stakeholders/Process'
                    },
                    {
                        id: 'cxai-t4-r2',
                        flag: 'yellow',
                        type: 'GOOD',
                        label: 'Currently Using Competitor',
                        text: '"We have [competitor] deployed now. It\'s...fine. Looking to see if there\'s something better."',
                        meaning: 'Competitive replacement. Need to find the gap in their current solution.',
                        move: {
                            label: 'Find the Gap',
                            text: '"\'Fine\' is interesting—it means it\'s not failing, but it\'s not amazing either. What\'s the gap? What would \'great\' look like versus what you have now?"',
                            subtext: 'You need to find the wedge to displace the incumbent.'
                        },
                        listenFor: [
                            { signal: 'Specific limitation of current tool', action: '🟢 Build your pitch around that gap.' },
                            { signal: '"Honestly, it\'s working okay"', action: '🔴 Might be hard to displace if pain is low.' }
                        ],
                        transition: '"What would need to be true for you to switch? What\'s the bar?"',
                        nextTerritory: '5. Stakeholders/Process'
                    },
                    {
                        id: 'cxai-t4-r3',
                        flag: 'green',
                        type: 'GOOD',
                        label: 'First Time Looking',
                        text: '"This is our first real look at automation. We\'ve been heads-down on growth and support has been duct-taped together."',
                        meaning: 'Greenfield. No scar tissue. But might need more education.',
                        move: {
                            label: 'Set Expectations',
                            text: '"Fresh start is actually good—no bad habits to unlearn. What made you decide now is the right time to look at this?"',
                            subtext: 'Connect back to trigger/priority.'
                        },
                        listenFor: [
                            { signal: 'Clear trigger event', action: '🟢 Good. They have a reason to move.' },
                            { signal: '"Just want to get ahead of it"', action: '🟡 Might not be urgent enough.' }
                        ],
                        transition: '"Since you haven\'t done this before, who else would need to be involved in evaluating and deciding?"',
                        nextTerritory: '5. Stakeholders/Process'
                    },
                    {
                        id: 'cxai-t4-r4',
                        flag: 'orange',
                        type: 'CONCERNING',
                        label: 'Building Internally',
                        text: '"Our engineering team is building something. I\'m looking at buy vs build options."',
                        meaning: 'Internal competition. Engineer ego is a tough opponent.',
                        move: {
                            label: 'Understand the Internal Project',
                            text: '"Walk me through the internal project—what\'s the scope, timeline, and how many engineers are on it? I\'ll give you an honest take on where buy vs build makes sense."',
                            subtext: 'Often internal projects are under-scoped and behind schedule. Find out.'
                        },
                        listenFor: [
                            { signal: 'Small team, long timeline', action: '🟢 They\'ll probably never finish. Position around speed.' },
                            { signal: 'Serious investment, dedicated team', action: '🔴 Might not be able to win this one.' }
                        ],
                        transition: '"What would need to be true for you to choose buy over build?"',
                        nextTerritory: '5. Stakeholders/Process'
                    },
                    {
                        id: 'cxai-t4-r5',
                        flag: 'red',
                        type: 'DEAL-KILLER',
                        label: 'Locked Into Contract',
                        text: '"We\'re under contract with [competitor] for another 18 months."',
                        meaning: 'They literally can\'t buy. This is a long nurture.',
                        move: {
                            label: 'Get the Details',
                            text: '"Got it—that\'s good to know. When does the contract end? And what would need to be true for you to be looking at alternatives when it does?"',
                            subtext: 'Mark for follow-up at contract end.'
                        },
                        listenFor: [
                            { signal: 'Specific contract end date', action: '🟡 Put in CRM with follow-up 3 months before end.' },
                            { signal: 'Early termination possible', action: '🟢 Explore what that would take.' }
                        ],
                        exitStrategy: '"Let me put something on my calendar to reach out [3 months before contract ends]. In the meantime, I\'ll send you some resources."',
                        nextTerritory: 'Nurture'
                    }
                ],
                redFlags: [
                    { signal: 'Locked into long contract with competitor', why: 'Can\'t switch for 12-18 months.', exit: 'Get the contract end date. Nurture until then.' },
                    { signal: 'CTO is championing internal build', why: 'Engineering ego is hard to overcome.', exit: 'Find different champion (COO, CFO) or wait for internal project to fail.' },
                    { signal: 'They\'ve tried 5+ solutions already', why: 'Serial evaluator. Might never buy.', exit: 'Ask what would be different this time. If no clear answer, deprioritize.' }
                ],
                greenFlags: [
                    { signal: 'Recent failure with competitor', capitalize: 'Position against their specific failures.' },
                    { signal: 'Internal build is stalled or over budget', capitalize: 'You\'re the rescue option. Emphasize speed to value.' },
                    { signal: 'Clear success criteria from past failures', capitalize: 'They know what they need. Speak to those criteria.' }
                ],
                transitions: {
                    strong: '"Got it—that gives me good context on what to avoid. If this worked, who else would need to be involved in the decision?"',
                    neutral: '"Thanks for the history. Who else has a stake in this decision?"',
                    recovery: '"What would success look like this time? What\'s the bar you\'re trying to clear?"'
                }
            },
            // ====== TERRITORY 5: STAKEHOLDERS / DECISION PROCESS ======
            {
                id: 't5',
                name: '5. Stakeholders / Process',
                icon: '👥',
                purpose: 'Map the buying group. Understand how decisions get made. Find champions and blockers.',
                gateCriteria: [
                    'Full list of stakeholders',
                    'Each stakeholder\'s role (champion, blocker, signer, influencer)',
                    'Decision process (steps from here to yes)',
                    'Timeline for each step',
                    'Who can kill this deal',
                    'Who isn\'t in the room that should be'
                ],
                entries: [
                    {
                        id: 'cxai-t5-e1',
                        context: 'Direct',
                        label: 'The Process Question',
                        text: '"If you found something that looked like a fit, walk me through what happens next. Who else weighs in, what\'s the process, and how long does something like this usually take?"',
                        subtext: 'Why this works: Gets them to map their own process.'
                    },
                    {
                        id: 'cxai-t5-e2',
                        context: 'Hypothesis-Led',
                        label: 'Typical Stakeholders',
                        text: '"Usually on a decision like this, I see Support leadership, IT/Engineering for integrations, Finance for budget, and sometimes Security. Who\'s involved on your side?"',
                        subtext: 'Why this works: Primes them to think about people they might not have mentioned.'
                    },
                    {
                        id: 'cxai-t5-e3',
                        context: 'Champion-Building',
                        label: 'Find Your Champion',
                        text: '"Between you and me—who really wants this to happen? Who\'s going to fight for it if it gets stuck?"',
                        subtext: 'Why this works: Identifies your internal champion.'
                    },
                    {
                        id: 'cxai-t5-e4',
                        context: 'Find the Blocker',
                        label: 'Anticipate Resistance',
                        text: '"Is there anyone who might push back on this? Maybe IT security, or someone who tried something similar before?"',
                        subtext: 'Why this works: Better to know about blockers now than be surprised later.'
                    }
                ],
                responses: [
                    {
                        id: 'cxai-t5-r1',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Clear Process, Right People',
                        text: '"It\'s me for the initial eval, then I\'d bring in IT to look at integrations, and Finance would need to approve anything over $50K. Final sign-off is our COO."',
                        meaning: 'They know their process. This is a sophisticated buyer.',
                        move: {
                            label: 'Map the Process',
                            text: '"Perfect—let me make sure I have this right: You evaluate, IT checks integrations, Finance approves budget, COO signs. What\'s the typical timeline for each of those steps?"',
                            subtext: 'You\'re building your deal timeline.'
                        },
                        listenFor: [
                            { signal: 'Specific timeline for each step', action: '🟢 You can now project your close date.' },
                            { signal: '"IT takes forever"', action: '🟡 Potential bottleneck. Ask how to accelerate.' }
                        ],
                        transition: '"What does [COO] care about most? If this lands on their desk, what do they need to see to say yes?"',
                        nextTerritory: '6. Budget/Commercial Reality'
                    },
                    {
                        id: 'cxai-t5-r2',
                        flag: 'yellow',
                        type: 'CONCERNING',
                        label: 'Evaluator, Not Decider',
                        text: '"I\'m gathering options to present to my VP. They\'ll make the call."',
                        meaning: 'You\'re not talking to the decision maker. Need to get higher.',
                        move: {
                            label: 'Get to the VP',
                            text: '"Got it—you\'re doing the research to make a recommendation. What does your VP care about most? And would it make sense to include them in our next conversation so I can address their questions directly?"',
                            subtext: 'You need to meet the decision maker or you\'re flying blind.'
                        },
                        listenFor: [
                            { signal: '"Sure, I can loop them in"', action: '🟢 Get that meeting scheduled before you leave.' },
                            { signal: '"They don\'t usually join these calls"', action: '🟡 Your champion might not be strong enough.' }
                        ],
                        transition: '"What would make your recommendation stronger? What does your VP need to see?"',
                        nextTerritory: '6. Budget/Commercial Reality'
                    },
                    {
                        id: 'cxai-t5-r3',
                        flag: 'orange',
                        type: 'CONCERNING',
                        label: 'Procurement Involved',
                        text: '"If we get to that stage, procurement would need to be involved. They have their own process."',
                        meaning: 'Procurement can add weeks/months. Plan for it.',
                        move: {
                            label: 'Understand Procurement',
                            text: '"Good to know. How early should we engage procurement? And is there anything that typically slows things down with them—security reviews, specific terms they need?"',
                            subtext: 'Frontload procurement requirements to avoid surprises.'
                        },
                        listenFor: [
                            { signal: 'Specific procurement requirements', action: '🟢 Get these handled early.' },
                            { signal: '"It usually takes 2-3 months"', action: '🟡 Factor into your timeline.' }
                        ],
                        transition: '"While we work through procurement, what else do you need to see to feel confident this is the right solution?"',
                        nextTerritory: '6. Budget/Commercial Reality'
                    },
                    {
                        id: 'cxai-t5-r4',
                        flag: 'red',
                        type: 'DEAL-KILLER',
                        label: 'No Path to Decision Maker',
                        text: '"I honestly don\'t know how this would get approved. We\'ve never bought something like this."',
                        meaning: 'No established buying process = very long and uncertain cycle.',
                        move: {
                            label: 'Create a Path',
                            text: '"That\'s actually common for new categories. Let me ask: who in your organization has the authority to approve a [price range] investment? And who would need to be convinced that this is worth doing?"',
                            subtext: 'You might need to help them create a buying process.'
                        },
                        listenFor: [
                            { signal: 'They identify specific people', action: '🟢 Now you have targets to reach.' },
                            { signal: '"I\'d have to figure that out"', action: '🔴 Very early stage. Might not be worth heavy investment.' }
                        ],
                        exitStrategy: '"Let\'s do this: you figure out who else needs to be involved, and let\'s schedule a follow-up when you have more clarity."',
                        nextTerritory: 'Might need to pause and regroup'
                    }
                ],
                redFlags: [
                    { signal: 'Can\'t identify decision maker', why: 'You\'re not in a real deal.', exit: 'Help them map the process. If they can\'t, move to nurture.' },
                    { signal: 'IT/Security has veto and hasn\'t been engaged', why: 'Technical blocker you haven\'t addressed.', exit: 'Get IT in the room before going further.' },
                    { signal: '"We\'ll figure out the process later"', why: 'Process ambiguity kills deals.', exit: 'Push for clarity or expect a long cycle.' }
                ],
                greenFlags: [
                    { signal: 'Decision maker is engaged', capitalize: 'Direct access to power. Move fast.' },
                    { signal: 'Previous purchases in this category', capitalize: 'They have a playbook. Follow it.' },
                    { signal: 'Strong internal champion', capitalize: 'Arm your champion to sell internally.' }
                ],
                transitions: {
                    strong: '"Great—I have a good sense of the process. Let\'s talk about budget and commercial reality."',
                    neutral: '"Thanks for walking me through that. Is budget something we should talk about now, or is that further down the line?"',
                    recovery: '"I want to make sure we don\'t waste time. Who else should be in the room before we go much further?"'
                }
            },
            // ====== TERRITORY 6: BUDGET / COMMERCIAL REALITY ======
            {
                id: 't6',
                name: '6. Budget / Commercial Reality',
                icon: '💰',
                purpose: 'Understand if money exists and how it flows. Don\'t get to the end and find out there\'s no budget.',
                gateCriteria: [
                    'Budget exists? (Y/N/Maybe)',
                    'Budget range awareness',
                    'Fiscal year timing',
                    'Approval thresholds',
                    'Who controls budget',
                    'Competing priorities for same budget'
                ],
                entries: [
                    {
                        id: 'cxai-t6-e1',
                        context: 'Direct',
                        label: 'The Budget Question',
                        text: '"Let\'s talk commercial reality. Is there budget allocated for this, or would you need to make the case for budget?"',
                        subtext: 'Why this works: Direct and respectful. Gets to the truth.'
                    },
                    {
                        id: 'cxai-t6-e2',
                        context: 'Hypothesis-Led',
                        label: 'Range Anchoring',
                        text: '"To give you context—solutions like ours typically run [$X-Y annually] depending on volume. Is that in the ballpark of what you\'re thinking, or would we need to right-size something?"',
                        subtext: 'Why this works: Anchors the price and tests reaction.'
                    },
                    {
                        id: 'cxai-t6-e3',
                        context: 'If They Dodge',
                        label: 'The ROI Angle',
                        text: '"I get that budget is sensitive. Let me ask it differently: if I could show you a 3x ROI—spend $1 to save $3—is there a path to get that approved? Or is there a freeze no matter what?"',
                        subtext: 'Why this works: Tests if ROI can unlock budget.'
                    },
                    {
                        id: 'cxai-t6-e4',
                        context: 'Timing',
                        label: 'Fiscal Year Awareness',
                        text: '"When does your fiscal year end? Are there any budget cycles we should be aware of—like, is this a \'spend it or lose it\' situation, or would this need to be in next year\'s plan?"',
                        subtext: 'Why this works: Helps you understand deal timing.'
                    }
                ],
                responses: [
                    {
                        id: 'cxai-t6-r1',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Budget Allocated',
                        text: '"We have budget. It\'s part of our support tools line item. I\'m not going to tell you the number, but if the ROI is there, we can move."',
                        meaning: 'Money exists. Now you need to win the evaluation.',
                        move: {
                            label: 'Confirm Fit',
                            text: '"Fair—I\'m not asking for the specific number. Just want to make sure we\'re in the same ballpark. Solutions like ours typically run $X-Y annually. If that\'s within range, great. If it\'s way off, let\'s figure that out now."',
                            subtext: 'Sanity check on fit without demanding their budget number.'
                        },
                        listenFor: [
                            { signal: '"That\'s in range"', action: '🟢 Full speed ahead.' },
                            { signal: '"That\'s higher than we expected"', action: '🟡 Need to build an ROI case.' }
                        ],
                        transition: '"Perfect. Let me tell you what I\'m thinking for next steps to get you what you need to make a decision."',
                        nextTerritory: '7. Close/Next Step'
                    },
                    {
                        id: 'cxai-t6-r2',
                        flag: 'yellow',
                        type: 'GOOD',
                        label: 'Need to Make Budget Case',
                        text: '"There\'s no line item for this. I\'d need to make the case for new budget."',
                        meaning: 'Requires internal selling. Need strong ROI case.',
                        move: {
                            label: 'Build the Case Together',
                            text: '"Got it—you need to sell this internally. Let me help. What does the business case need to show for you to get budget approved? Is it pure cost savings, efficiency gains, or something strategic?"',
                            subtext: 'Offer to co-create the business case.'
                        },
                        listenFor: [
                            { signal: 'Specific criteria for budget approval', action: '🟢 Build your case around those criteria.' },
                            { signal: '"I\'ve never done this before"', action: '🟡 They might need more hand-holding.' }
                        ],
                        transition: '"Would it help if I put together an ROI model you could take to [decision maker]?"',
                        nextTerritory: '7. Close/Next Step'
                    },
                    {
                        id: 'cxai-t6-r3',
                        flag: 'orange',
                        type: 'CONCERNING',
                        label: 'Budget Exists but Contested',
                        text: '"There\'s budget, but it\'s also being looked at for a few other things. We\'d be competing for the same dollars."',
                        meaning: 'Internal competition for budget. Need to win the priority.',
                        move: {
                            label: 'Understand the Competition',
                            text: '"What else is competing for that budget? And who makes the call on priorities? I want to understand what we\'re up against."',
                            subtext: 'You need to know if you can win the internal competition.'
                        },
                        listenFor: [
                            { signal: 'They identify competing priorities', action: '🟡 You need to position as higher ROI than alternatives.' },
                            { signal: '"CFO will decide"', action: '🟡 Need CFO angle or CFO meeting.' }
                        ],
                        transition: '"What would make this the obvious priority versus the other options?"',
                        nextTerritory: '7. Close/Next Step'
                    },
                    {
                        id: 'cxai-t6-r4',
                        flag: 'red',
                        type: 'DEAL-KILLER',
                        label: 'Budget Freeze',
                        text: '"We\'re in a freeze. No new spend through Q4."',
                        meaning: 'Unless something changes, this deal isn\'t happening soon.',
                        move: {
                            label: 'Find the Exception',
                            text: '"I understand freezes—they\'re no fun for anyone. Is there an exception path? Like, if something had a fast ROI or was tied to a strategic initiative, could it get approved anyway?"',
                            subtext: 'Sometimes freezes have exceptions. Find out.'
                        },
                        listenFor: [
                            { signal: '"If it saves money, maybe"', action: '🟢 Position as cost reduction, not new spend.' },
                            { signal: '"No exceptions"', action: '🔴 Real freeze. Mark for follow-up in Q1.' }
                        ],
                        exitStrategy: '"Let\'s stay in touch. When does your Q1 planning start? I\'ll follow up then so you\'re ready to move when the freeze lifts."',
                        nextTerritory: 'Likely pause or nurture'
                    }
                ],
                redFlags: [
                    { signal: 'No budget and no path to budget', why: 'Can\'t buy what they can\'t pay for.', exit: 'Help build ROI case or move to nurture.' },
                    { signal: 'Procurement requires 6-month process', why: 'Very long cycle. Factor into forecast.', exit: 'Start procurement early. Accept long timeline.' },
                    { signal: '"We\'re not allowed to discuss budget"', why: 'Either no trust or no real buying intent.', exit: 'Give a range to test reaction. If no engagement, deprioritize.' }
                ],
                greenFlags: [
                    { signal: 'Budget already approved', capitalize: 'Remove commercial risk from deal. Focus on winning.' },
                    { signal: 'Previous similar purchases', capitalize: 'They know how to buy this. Follow their playbook.' },
                    { signal: 'Decision maker controls budget', capitalize: 'Simpler deal. Fewer stakeholders.' }
                ],
                transitions: {
                    strong: '"We\'re in good shape commercially. Let me propose next steps."',
                    neutral: '"Thanks for being direct about budget. Here\'s what I\'m thinking for next steps."',
                    recovery: '"Even if budget is tight, let\'s explore what would need to be true for this to make sense."'
                }
            },
            // ====== TERRITORY 7: CLOSE / NEXT STEP ======
            {
                id: 't7',
                name: '7. Close / Next Step',
                icon: '🎯',
                purpose: 'Lock a concrete, calendar-confirmed next step. NEVER leave a call without this.',
                gateCriteria: [
                    'Specific next meeting (date/time/attendees)',
                    'Clear agenda for next meeting',
                    'Homework for both sides',
                    'Timeline commitment',
                    'If not moving forward: clear reason and nurture plan'
                ],
                entries: [
                    {
                        id: 'cxai-t7-e1',
                        context: 'Call Went Well',
                        label: 'Strong Close',
                        text: '"I think there\'s a real fit here. Here\'s what I\'m thinking: I\'ll put together [specific deliverable] by [date], and let\'s get [stakeholder] on the next call. Does [date/time] work?"',
                        subtext: 'Why this works: Propose a specific next step and get it on the calendar.'
                    },
                    {
                        id: 'cxai-t7-e2',
                        context: 'Call Was Mixed',
                        label: 'Neutral Close',
                        text: '"Before we wrap—what would you need to see to move forward? And what\'s a realistic timeline for the next conversation?"',
                        subtext: 'Why this works: Gets them to tell you what\'s needed.'
                    },
                    {
                        id: 'cxai-t7-e3',
                        context: 'Call Was Rocky',
                        label: 'Honest Check',
                        text: '"Let me be direct—based on our conversation, is this something worth pursuing, or are we forcing it? I\'d rather know now than have us both spend more time if it\'s not a fit."',
                        subtext: 'Why this works: Calls out the elephant in the room.'
                    },
                    {
                        id: 'cxai-t7-e4',
                        context: 'Need to Expand Stakeholders',
                        label: 'Get Decision Maker',
                        text: '"The logical next step is to get [VP/COO/whoever] in the room to answer their questions directly. Can we schedule that before we hang up?"',
                        subtext: 'Why this works: Strikes while the iron is hot.'
                    }
                ],
                responses: [
                    {
                        id: 'cxai-t7-r1',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Yes, Let\'s Schedule',
                        text: '"Yeah, let\'s do it. I can bring my VP to the next call. How about Thursday at 2pm?"',
                        meaning: 'Committed next step with new stakeholder. Deal is advancing.',
                        move: {
                            label: 'Lock It Down',
                            text: '"Perfect. I\'ll send the invite. Before then, I\'ll send [deliverable]. Can you send me [what you need from them]?"',
                            subtext: 'Give homework to both sides. Creates commitment.'
                        },
                        listenFor: [
                            { signal: 'Confirmed calendar event', action: '🟢 Deal is advancing. Update pipeline.' }
                        ],
                        transition: 'Send calendar invite before you leave the call.',
                        nextTerritory: 'DONE - You have your next step'
                    },
                    {
                        id: 'cxai-t7-r2',
                        flag: 'yellow',
                        type: 'CONCERNING',
                        label: 'Send Me Info, I\'ll Review',
                        text: '"Can you just send me some materials? I\'ll review and get back to you."',
                        meaning: 'Brush-off alert. No commitment.',
                        move: {
                            label: 'Push for Commitment',
                            text: '"Happy to send materials. But honestly, they won\'t tell you much more than we already discussed. What would be more useful: I can put together a specific proposal based on today\'s conversation, and let\'s schedule 30 minutes next week to walk through it. Would [day/time] work?"',
                            subtext: 'Don\'t accept vague follow-up. Push for calendar commitment.'
                        },
                        listenFor: [
                            { signal: 'They agree to a meeting', action: '🟢 Get it on the calendar NOW.' },
                            { signal: '"I really can\'t commit to time"', action: '🔴 Likely not a priority. Move to nurture.' }
                        ],
                        transition: 'Don\'t hang up without a calendar event or a clear no.',
                        nextTerritory: 'Stay until you have commitment or qualification'
                    },
                    {
                        id: 'cxai-t7-r3',
                        flag: 'red',
                        type: 'DEAL-KILLER',
                        label: 'Not the Right Time',
                        text: '"This is helpful but it\'s not the right time. Let\'s reconnect in 6 months."',
                        meaning: 'You\'re being pushed off. Either timing is genuinely bad or they\'re not interested.',
                        move: {
                            label: 'Test It',
                            text: '"I respect that. Before I go: what would need to change in 6 months for this to be the right time? Is there something specific that will be different?"',
                            subtext: 'Find out if there\'s a real future trigger or if this is a polite no.'
                        },
                        listenFor: [
                            { signal: 'Specific future event', action: '🟡 Put in nurture with that date.' },
                            { signal: 'Vague "just busy"', action: '🔴 Probably not coming back. Light nurture only.' }
                        ],
                        exitStrategy: '"Got it. I\'ll send you some resources and check in [specific date]. Good luck with [thing they mentioned]."',
                        nextTerritory: 'Add to nurture campaign'
                    },
                    {
                        id: 'cxai-t7-r4',
                        flag: 'green',
                        type: 'IDEAL',
                        label: 'Wants to Move Fast',
                        text: '"Actually, we need to move quickly on this. Can we get a proposal this week and discuss early next?"',
                        meaning: 'Strong buying signal. They\'re ready.',
                        move: {
                            label: 'Match Their Speed',
                            text: '"Absolutely. Let me make sure I get you what you need: is this a technical evaluation, a commercial proposal, or both? And who else needs to see it?"',
                            subtext: 'Clarify what they need to make a decision.'
                        },
                        listenFor: [
                            { signal: 'Clear next steps from them', action: '🟢 This is a hot deal. Prioritize it.' },
                            { signal: 'They mention specific decision date', action: '🟢 Work backwards from that date.' }
                        ],
                        transition: 'Get calendar on the books. Send proposal same day if possible.',
                        nextTerritory: 'DONE - Move to proposal'
                    }
                ],
                redFlags: [
                    { signal: '"We\'ll be in touch"', why: 'No commitment. You\'re being politely rejected.', exit: 'Push for specific date or accept the loss.' },
                    { signal: 'Won\'t commit to next meeting', why: 'Not a priority.', exit: 'Ask directly: is this worth pursuing or not?' },
                    { signal: '"Send me everything by email"', why: 'They\'re not going to read it.', exit: 'Offer to summarize in 5 minutes on a call instead.' }
                ],
                greenFlags: [
                    { signal: 'They offer to bring decision maker', capitalize: 'Deal is advancing. Move fast.' },
                    { signal: 'Asking about implementation timeline', capitalize: 'They\'re already thinking about buying.' },
                    { signal: 'Want to move faster than expected', capitalize: 'Hot deal. Prioritize this account.' }
                ],
                transitions: {
                    strong: 'Send calendar invite before hanging up.',
                    neutral: 'Send follow-up email within 1 hour summarizing discussion and proposed next steps.',
                    recovery: 'If no next step, mark as nurture and schedule 90-day check-in.'
                }
            }
        ]
    }
};

// Support both historical and current category keys.
if (!DISCOVERY_FRAMEWORKS.revenue && DISCOVERY_FRAMEWORKS.revintel) {
    DISCOVERY_FRAMEWORKS.revenue = DISCOVERY_FRAMEWORKS.revintel;
}
if (!DISCOVERY_FRAMEWORKS.revintel && DISCOVERY_FRAMEWORKS.revenue) {
    DISCOVERY_FRAMEWORKS.revintel = DISCOVERY_FRAMEWORKS.revenue;
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.DISCOVERY_FRAMEWORKS = DISCOVERY_FRAMEWORKS;
}

// ================================================================
// FRAMEWORK 2: CUSTOMER DATA PLATFORM (CDP)
// ================================================================
DISCOVERY_FRAMEWORKS.cdp = {
    id: 'cdp',
    label: 'Customer Data Platform (CDP)',
    color: 'purple',
    description: 'For CDPs, identity resolution, and data unification. Navigate discovery around data quality and the hidden cost of bad data.',
    useCases: ['Identity resolution', 'Customer data unification', 'Data cleansing', 'Single customer view', 'Data enrichment'],
    coreInsight: "You don't sell data infrastructure. You sell the cost of decisions made on bad data—missed forecasts, embarrassing customer experiences, and hours spent reconciling spreadsheets.",
    competitiveLandscape: ['Segment', 'mParticle', 'Treasure Data', 'Tealium', 'Amperity', 'Twilio Segment'],
    typicalBuyers: ['VP Data', 'Head of Analytics', 'CMO', 'CIO', 'VP Marketing', 'Head of Growth'],
    keyMetrics: ['Duplicate rate', 'Data cleanup hours/week', 'Systems count', 'Report accuracy', 'Time to insight'],
    territories: [
        {
            id: 't1', name: '1. Current State', icon: '🗄️',
            purpose: 'Understand their data landscape. How many systems? Where\'s the customer data?',
            gateCriteria: ['Systems where customer data lives', 'Current integration architecture', 'Data team size', 'How reports are generated', 'Known data quality issues'],
            entries: [
                { id: 'cdp-t1-e1', context: 'Open-ended', label: 'The Data Landscape', text: '"Can you walk me through how customer data flows through your organization? Where does it live, how does it move between systems?"', subtext: 'Gets them to explain their data architecture.' },
                { id: 'cdp-t1-e2', context: 'Hypothesis-Led', label: 'Pattern Recognition', text: '"Most companies have customer data in Salesforce, a marketing platform like HubSpot, maybe a data warehouse like Snowflake, and a bunch of other places. Is that your world, or more complicated?"', subtext: 'Shows you understand their world.' },
                { id: 'cdp-t1-e3', context: 'Executive', label: 'Strategic Framing', text: '"From where you sit, how do you think about customer data? Is it an asset you\'re leveraging, or more of a mess that needs cleanup?"', subtext: 'Gets executive perspective on data as asset vs liability.' }
            ],
            responses: [
                { id: 'cdp-t1-r1', flag: 'green', type: 'IDEAL', label: 'Complex, Fragmented Landscape', text: '"It\'s a mess. Data is in Salesforce, HubSpot, Intercom, our database, and probably five other places. Everyone has their own version of truth."', meaning: 'Classic CDP pain. Fragmentation is exactly what you solve.', move: { label: 'Quantify the Mess', text: '"Everyone has their own version of truth"—that\'s what I hear most. How does that show up? Reporting disagreements, marketing targeting problems, or customer experience issues?"' }, transition: '"Where does fragmentation actually hurt you?"', nextTerritory: '2. Pain/Impact' },
                { id: 'cdp-t1-r2', flag: 'yellow', type: 'GOOD', label: 'Some Centralization', text: '"We\'ve got most stuff in Snowflake now. But getting it there and keeping it clean is a full-time job."', meaning: 'Progress made but operational burden high.', move: { label: 'Find the Burden', text: '"Data warehouse is set up, but maintenance is killing you. How much time does your team spend on pipelines, cleaning, reconciliation?"' }, transition: '"What would your team do if they got those hours back?"', nextTerritory: '2. Pain/Impact' },
                { id: 'cdp-t1-r3', flag: 'red', type: 'DEAL-KILLER', label: 'Tiny Scale', text: '"We just use Salesforce and HubSpot. Pretty simple."', meaning: 'May not have enough complexity to justify CDP.', move: { label: 'Test for Hidden Pain', text: '"Simple is good. Let me ask: when marketing wants to target customers who did X in the product, how hard is that to pull together?"' }, exitStrategy: 'If truly simple, offer to reconnect when they scale.', nextTerritory: 'Qualify' }
            ],
            redFlags: [{ signal: 'Data team of 1-2 people', why: 'May not have resources to implement', exit: 'Check if they\'re planning to grow the team' }],
            greenFlags: [{ signal: 'Multiple systems with conflicting data', capitalize: 'Core CDP value prop' }],
            transitions: { strong: '"That gives me good context. Where does fragmentation actually hurt?"', neutral: '"What made you decide to look at this now?"' }
        },
        {
            id: 't2', name: '2. Pain / Impact', icon: '⚠️',
            purpose: 'Find where fragmented data hurts and QUANTIFY. Connect to business outcomes.',
            gateCriteria: ['Specific pain from fragmentation', 'Quantified impact', 'Who feels pain most', 'Business decisions affected'],
            entries: [
                { id: 'cdp-t2-e1', context: 'Hypothesis-Led', label: 'Common Pain Patterns', text: '"A lot of data leaders tell me: can\'t trust customer counts in reports, call center doesn\'t know who the customer is, or half the week spent cleaning duplicates. Any of that resonate?"' },
                { id: 'cdp-t2-e2', context: 'Anchor', label: 'Follow Their Lead', text: '"You mentioned [specific thing]. Where does that show up as a business problem?"' }
            ],
            responses: [
                { id: 'cdp-t2-r1', flag: 'green', type: 'IDEAL', label: 'Reporting Trust Issues', text: '"Nobody trusts the customer count because of duplicates. Marketing says 100K, sales says 80K. Leadership meetings turn into arguments about whose number is right."', meaning: 'Classic CDP pain with executive visibility.', move: { label: 'QUANTIFY', text: '"Let me understand the math: 1) What\'s the duplicate rate? 2) How much time reconciling before meetings? 3) What happens when leadership decides based on wrong numbers?"', subtext: '💰 THE MATH: 20% duplicates × $1M marketing budget = $200K wasted on duplicate targeting' }, transition: '"What made you decide to address this now?"', nextTerritory: '3. Trigger' },
                { id: 'cdp-t2-r2', flag: 'green', type: 'IDEAL', label: 'Marketing Effectiveness', text: '"Marketing can\'t do personalization because they don\'t trust the data. Half the time we send offers to people who already bought."', meaning: 'Revenue impact from bad data.', move: { label: 'Quantify Revenue Impact', text: '"That\'s hitting revenue. 1) What % of campaigns go to wrong people? 2) Cost of wrong offer? 3) What would true single customer view unlock?"', subtext: '💰 THE MATH: 10% wasted × $5M annual spend = $500K wasted' }, transition: '"What would need to be true for marketing to trust the data?"', nextTerritory: '3. Trigger' },
                { id: 'cdp-t2-r3', flag: 'orange', type: 'CONCERNING', label: 'Not Prioritized', text: '"Data quality isn\'t great, but it\'s always been that way. We work around it."', meaning: 'Pain exists but not acute.', move: { label: 'Find Business Impact', text: '"What scenario would make data quality urgent? What would break?"' }, transition: '"What would need to change for this to become priority?"', nextTerritory: '3. Trigger' }
            ],
            redFlags: [{ signal: 'Pain only felt by data team, not business', why: 'Hard to get business budget', exit: 'Find business impact or move on' }],
            greenFlags: [{ signal: 'Executive frustration with data', capitalize: 'Executive sponsorship potential' }],
            transitions: { strong: '"Significant impact. What made you decide to address now?"', recovery: '"What would make this urgent?"' }
        },
        {
            id: 't3', name: '3. Trigger / Priority', icon: '⚡',
            purpose: 'Why now? Data projects languish forever without urgency.',
            gateCriteria: ['Specific event driving this', 'Timeline', 'Consequence of not fixing', 'Executive sponsorship'],
            entries: [
                { id: 'cdp-t3-e1', context: 'Direct', label: 'Why Now', text: '"Data quality has been a concern for a while. What made you take this meeting now?"' },
                { id: 'cdp-t3-e2', context: 'Hypothesis', label: 'Common Triggers', text: '"Usually companies prioritize data unification because of a new personalization initiative, board asking about metrics, or big CDP migration. Any of those?"' }
            ],
            responses: [
                { id: 'cdp-t3-r1', flag: 'green', type: 'IDEAL', label: 'Strategic Initiative', text: '"We\'re launching personalization in Q3. Marketing needs clean data to make it work."', meaning: 'Clear trigger with timeline.', move: { label: 'Understand Initiative', text: '"Personalization in Q3 needs clean data. Walk me through timeline: when do you need data ready, and what does \'clean enough\' look like?"' }, transition: '"Have you tried solving data quality before?"', nextTerritory: '4. Prior Attempts' },
                { id: 'cdp-t3-r2', flag: 'red', type: 'DEAL-KILLER', label: 'No Timeline', text: '"No specific trigger. Just want to get ahead of it."', meaning: 'No urgency = slow deal.', move: { label: 'Find Future Urgency', text: '"What would make this urgent? Is there a point where current approach breaks?"' }, exitStrategy: 'Nurture and check quarterly.', nextTerritory: 'Nurture' }
            ],
            redFlags: [{ signal: 'No executive sponsorship', why: 'Data projects without exec backing die', exit: 'Find exec angle' }],
            greenFlags: [{ signal: 'Board asking for better data', capitalize: 'Executive sponsorship, move fast' }],
            transitions: { strong: '"[Initiative] in [Q] is clear target. What\'s been tried before?"', recovery: '"Let\'s make sure this is worth pursuing now."' }
        },
        {
            id: 't4', name: '4. Prior Attempts', icon: '🔄',
            purpose: 'What\'s been tried? Critical for CDP—everyone has tried something.',
            gateCriteria: ['Previous tools/projects', 'Why they failed', 'Success criteria this time'],
            entries: [
                { id: 'cdp-t4-e1', context: 'Direct', label: 'History Check', text: '"Have you tried to solve data quality before—cleanup project, MDM tool, homegrown ETL? What\'s the history?"' }
            ],
            responses: [
                { id: 'cdp-t4-r1', flag: 'green', type: 'IDEAL', label: 'Previous Project Failed', text: '"We did cleanup 2 years ago. Took 6 months, cost a fortune, duplicates back in 3 months."', meaning: 'Scar tissue but budget history.', move: { label: 'Diagnose Failure', text: '"When duplicates came back—was it one-time cleanup without ongoing matching? Pipes still broken, dirty data flowing in?"' }, transition: '"What would be different this time?"', nextTerritory: '5. Stakeholders' },
                { id: 'cdp-t4-r2', flag: 'orange', type: 'CONCERNING', label: 'Engineering Building', text: '"Data engineering is building their own. I\'m looking at buy vs build."', meaning: 'Internal competition.', move: { label: 'Understand Build', text: '"Walk me through—scope, timeline, how many engineers. I\'ll give honest buy vs build take."' }, transition: '"What would build need to accomplish to be considered success?"', nextTerritory: '5. Stakeholders' }
            ],
            redFlags: [{ signal: 'Locked into CDP contract', why: 'Can\'t switch', exit: 'Get contract end date, nurture' }],
            greenFlags: [{ signal: 'Previous project failed', capitalize: 'Budget exists, position against failure' }],
            transitions: { strong: '"Good context on what to avoid. Who else involved in decision?"' }
        },
        {
            id: 't5', name: '5. Stakeholders / Process', icon: '👥',
            purpose: 'CDP deals involve data, IT, marketing, and executives.',
            gateCriteria: ['All stakeholders', 'Decision process', 'IT/Security requirements', 'Executive sponsor'],
            entries: [
                { id: 'cdp-t5-e1', context: 'Direct', label: 'Process Question', text: '"If this looked like a fit, who else weighs in? IT, security, marketing, business teams who own data?"' },
                { id: 'cdp-t5-e2', context: 'Hypothesis', label: 'Typical Stakeholders', text: '"Usually on CDP I see data engineering, IT security, marketing, and business sponsor like CMO. Who\'s involved on your side?"' }
            ],
            responses: [
                { id: 'cdp-t5-r1', flag: 'green', type: 'IDEAL', label: 'Clear Map', text: '"I evaluate with data engineering, IT security approves, CMO is exec sponsor since marketing needs this most."', meaning: 'Clear stakeholders.', move: { label: 'Map Process', text: '"Perfect. Timeline for each step?"' }, transition: '"What does CMO care about most?"', nextTerritory: '6. Budget' },
                { id: 'cdp-t5-r2', flag: 'yellow', type: 'CONCERNING', label: 'Not Sure', text: '"Not sure who else would be involved. Just starting to look."', meaning: 'Early stage.', move: { label: 'Help Map', text: '"Let\'s think through—who owns data being unified? Who approves security? Who has budget authority?"' }, transition: '"Let\'s follow up once you\'ve socialized internally."', nextTerritory: 'Pause' }
            ],
            redFlags: [{ signal: 'Can\'t identify decision maker', why: 'Not real deal', exit: 'Help map process or nurture' }],
            greenFlags: [{ signal: 'CMO or CIO sponsor', capitalize: 'Executive backing, move fast' }],
            transitions: { strong: '"Great map. Let\'s talk budget."' }
        },
        {
            id: 't6', name: '6. Budget / Commercial Reality', icon: '💰',
            purpose: 'Understand if money exists for CDP investment.',
            gateCriteria: ['Budget allocated', 'Budget range', 'Approval process'],
            entries: [
                { id: 'cdp-t6-e1', context: 'Direct', label: 'Budget Question', text: '"Is there budget for CDP, or would you need to build business case?"' },
                { id: 'cdp-t6-e2', context: 'Anchoring', label: 'Range Check', text: '"CDP investments typically run $X-Y annually depending on data volume. Is that in range?"' }
            ],
            responses: [
                { id: 'cdp-t6-r1', flag: 'green', type: 'IDEAL', label: 'Budget Exists', text: '"We have data infrastructure budget. If ROI is there, we can move."', meaning: 'Money exists.', move: { label: 'Confirm Fit', text: '"Our solutions typically run $X-Y. In ballpark, or need to right-size?"' }, transition: '"Perfect. Let me propose next steps."', nextTerritory: '7. Close' },
                { id: 'cdp-t6-r2', flag: 'yellow', type: 'GOOD', label: 'Need to Build Case', text: '"No line item. I\'d need to make the case."', meaning: 'Requires internal selling.', move: { label: 'Build Together', text: '"What does business case need to show? Cost savings, revenue lift, risk reduction?"' }, transition: '"Would ROI model help?"', nextTerritory: '7. Close' }
            ],
            redFlags: [{ signal: 'Budget freeze', why: 'Can\'t buy', exit: 'Find exception or nurture' }],
            greenFlags: [{ signal: 'Budget approved', capitalize: 'Focus on winning' }],
            transitions: { strong: '"Budget looks good. Next steps."' }
        },
        {
            id: 't7', name: '7. Close / Next Step', icon: '🎯',
            purpose: 'Lock concrete next step. Never leave without calendar commitment.',
            gateCriteria: ['Specific next meeting booked', 'Agenda confirmed', 'Homework assigned'],
            entries: [
                { id: 'cdp-t7-e1', context: 'Strong', label: 'Propose Next Step', text: '"Here\'s what I\'m thinking: I\'ll put together technical overview for data engineering, let\'s get them plus CMO on next call. Does [date] work?"' }
            ],
            responses: [
                { id: 'cdp-t7-r1', flag: 'green', type: 'IDEAL', label: 'Calendar It', text: '"Let\'s do it. I\'ll get CMO\'s calendar, next Thursday works."', meaning: 'Deal advancing.', move: { label: 'Lock It', text: '"Perfect. I\'ll send invite. What else do you need before then?"' }, transition: 'Send invite NOW.', nextTerritory: 'DONE' },
                { id: 'cdp-t7-r2', flag: 'yellow', type: 'CONCERNING', label: 'Send Materials', text: '"Can you send materials? I\'ll review and get back."', meaning: 'Brush-off.', move: { label: 'Push for Calendar', text: '"Happy to send. Let\'s also lock time to discuss—otherwise things slip. What works next week?"' }, transition: 'Push until calendar or clear no.', nextTerritory: 'Stay in T7' }
            ],
            redFlags: [{ signal: '"We\'ll be in touch"', why: 'No commitment', exit: 'Push for date or accept loss' }],
            greenFlags: [{ signal: 'They offer to bring exec', capitalize: 'Deal advancing fast' }],
            transitions: { strong: 'Send calendar invite now.', neutral: 'Follow up within 1 hour.' }
        }
    ]
};

// ================================================================
// FRAMEWORK 3: LEGAL AI
// ================================================================
DISCOVERY_FRAMEWORKS.legal = {
    id: 'legal',
    label: 'Legal AI',
    color: 'amber',
    description: 'For AI legal tech products—document review, research, contract analysis. Navigate conservative buyers.',
    useCases: ['Contract review & drafting', 'Legal research', 'Litigation support', 'Due diligence', 'Compliance automation'],
    coreInsight: "You don't sell AI to lawyers. You sell time back—the 4-6 hours per week on work beneath their expertise but still requiring legal judgment.",
    competitiveLandscape: ['Kira Systems', 'Luminance', 'Harvey', 'Ironclad', 'ContractPodAI', 'Clio'],
    typicalBuyers: ['GC', 'CLO', 'Head of Legal Ops', 'Managing Partner', 'Associate General Counsel'],
    keyMetrics: ['Hours per contract', 'Outside counsel spend', 'Contract turnaround time', 'Review accuracy'],
    territories: [
        {
            id: 't1', name: '1. Current State', icon: '⚖️',
            purpose: 'Understand their legal operations. Volume, team, tools.',
            gateCriteria: ['Contract volume', 'Team size', 'Current tools', 'Outside counsel spend', 'Review process'],
            entries: [
                { id: 'legal-t1-e1', context: 'Open', label: 'Legal Landscape', text: '"Can you walk me through how contract review works today? What\'s the volume, who handles it, and what tools are you using?"' },
                { id: 'legal-t1-e2', context: 'Hypothesis', label: 'Pattern Recognition', text: '"Most legal teams I talk to are doing some combination of Word redlines, maybe a CLM like Ironclad or DocuSign, and a lot of manual review. Is that your world?"' }
            ],
            responses: [
                { id: 'legal-t1-r1', flag: 'green', type: 'IDEAL', label: 'High Volume, Manual Process', text: '"We\'re reviewing 200+ contracts a month. Mostly manual—lawyers spending 4-5 hours per contract on the complex ones."', meaning: 'High volume with manual pain. Perfect.', move: { label: 'Quantify the Burden', text: '"200 contracts × 4-5 hours is 800-1000 hours a month on review. What\'s the billable rate for that time? And what strategic work isn\'t getting done because lawyers are doing document review?"' }, transition: '"Where does that actually hurt you?"', nextTerritory: '2. Pain/Impact' },
                { id: 'legal-t1-r2', flag: 'yellow', type: 'GOOD', label: 'Using Outside Counsel', text: '"We outsource most contract review. Using a couple of firms for overflow."', meaning: 'Outside counsel spend = easy ROI story.', move: { label: 'Quantify Outside Spend', text: '"What\'s the annual spend on outside counsel for contract review? And is it growing, flat, or something you\'re trying to bring down?"' }, transition: '"If you could bring that in-house affordably, would you?"', nextTerritory: '2. Pain/Impact' }
            ],
            redFlags: [{ signal: 'Low contract volume (<50/month)', why: 'ROI might not be there', exit: 'Check for other use cases like research' }],
            greenFlags: [{ signal: 'High outside counsel spend', capitalize: 'Easy ROI story' }],
            transitions: { strong: '"Where does manual review actually hurt you?"' }
        },
        {
            id: 't2', name: '2. Pain / Impact', icon: '⚠️',
            purpose: 'Find where manual legal work hurts. Quantify in hours and dollars.',
            gateCriteria: ['Specific pain', 'Quantified hours/cost', 'Who feels it', 'Business impact'],
            entries: [
                { id: 'legal-t2-e1', context: 'Hypothesis', label: 'Common Pain', text: '"Legal teams usually tell me: lawyers doing work below their pay grade, outside counsel eating budget, deal cycles slowing because legal is bottleneck. Any resonate?"' },
                { id: 'legal-t2-e2', context: 'Strategic', label: 'Business Impact', text: '"Where does legal show up as constraint on the business? Slowing deals, compliance risk, or just cost?"' }
            ],
            responses: [
                { id: 'legal-t2-r1', flag: 'green', type: 'IDEAL', label: 'Lawyer Time Waste', text: '"My senior attorneys spending 30% of their time on review that associates or tools should handle. That\'s $400/hour time on $100/hour work."', meaning: 'Clear time/money waste. Easy ROI.', move: { label: 'QUANTIFY', text: '"30% of time on low-value work. How many senior attorneys, and at $400/hour, what\'s the annual cost of that misallocation?"', subtext: '💰 THE MATH: 5 attorneys × 30% × 2000 hrs × $400 = $1.2M/year in misallocated senior time' }, transition: '"What made you decide to address this now?"', nextTerritory: '3. Trigger' },
                { id: 'legal-t2-r2', flag: 'green', type: 'IDEAL', label: 'Outside Counsel Spend', text: '"Outside counsel is killing us—$2M a year just on contract review overflow."', meaning: 'Direct cost. Easy to show ROI.', move: { label: 'Build ROI Case', text: '"$2M on outside review. If you could bring 50% of that in-house with AI assistance, you\'re looking at $1M savings. Is that the kind of impact that would get attention?"' }, transition: '"What\'s driving the outside counsel usage—volume spikes or capability gaps?"', nextTerritory: '3. Trigger' },
                { id: 'legal-t2-r3', flag: 'orange', type: 'OBJECTION', label: '"AI Can\'t Handle Legal Nuance"', text: '"I\'m skeptical AI can handle legal work. The nuance is too important."', meaning: 'Valid concern from conservative buyer.', objection: { rootCause: 'Lawyers are trained to be risk-averse. AI mistakes have real consequences.', badResponse: '"AI is very accurate now!" (dismissive)', goodResponse: '"You\'re right to be cautious. Where do you see the line between what AI should vs shouldn\'t touch?"', greatResponse: '"That skepticism is healthy. Let me reframe: AI shouldn\'t replace legal judgment—it should eliminate the 80% of review time spent finding the issues, so lawyers can focus on the 20% that requires judgment. Does that distinction land?"' }, move: { label: 'Reframe AI Role', text: '"Think of it as triage, not judgment. AI finds the issues, flags the risks, extracts the data. Lawyer still makes the call. Does that change the math?"' }, nextTerritory: 'Stay in T2' }
            ],
            redFlags: [{ signal: '"We don\'t trust AI for legal"', why: 'Cultural resistance', exit: 'Find innovation-friendly champion or deprioritize' }],
            greenFlags: [{ signal: 'GC pushing for efficiency', capitalize: 'Executive mandate' }],
            transitions: { strong: '"That\'s significant. What made you look at this now?"' }
        },
        {
            id: 't3', name: '3. Trigger / Priority', icon: '⚡',
            purpose: 'Why now? Legal tends to be slow unless there\'s a trigger.',
            gateCriteria: ['Specific event', 'Timeline', 'Executive mandate', 'Consequence of waiting'],
            entries: [
                { id: 'legal-t3-e1', context: 'Direct', label: 'Why Now', text: '"Legal transformation tends to be slow. What made you take this meeting—did something change?"' },
                { id: 'legal-t3-e2', context: 'Hypothesis', label: 'Common Triggers', text: '"Usually when legal looks at AI, it\'s because of M&A due diligence needs, new GC pushing efficiency, or budget pressure to reduce outside counsel. Any of those?"' }
            ],
            responses: [
                { id: 'legal-t3-r1', flag: 'green', type: 'IDEAL', label: 'M&A Activity', text: '"We have 3 acquisitions this year. Due diligence is going to bury us without help."', meaning: 'Specific volume spike with timeline.', move: { label: 'Understand Timeline', text: '"3 acquisitions is serious diligence load. What\'s the timeline for each, and when does the crunch hit?"' }, transition: '"Have you used AI or tech for diligence before?"', nextTerritory: '4. Prior Attempts' },
                { id: 'legal-t3-r2', flag: 'green', type: 'IDEAL', label: 'New GC Mandate', text: '"New GC. Big mandate to modernize legal ops and show efficiency gains."', meaning: 'Executive mandate. Strong.', move: { label: 'Understand Mandate', text: '"What does the GC want to see? Specific efficiency targets, or more general modernization?"' }, transition: '"What else has been tried so far?"', nextTerritory: '4. Prior Attempts' }
            ],
            redFlags: [{ signal: '"Just exploring options"', why: 'No urgency', exit: 'Nurture' }],
            greenFlags: [{ signal: 'M&A or regulatory event', capitalize: 'Specific timeline, move fast' }],
            transitions: { strong: '"[Trigger] gives clear timeline. What\'s been tried?"' }
        },
        {
            id: 't4', name: '4. Prior Attempts', icon: '🔄',
            purpose: 'Legal is conservative. What have they tried? What are they scared of?',
            gateCriteria: ['Previous tools', 'What failed/worked', 'Concerns from past attempts'],
            entries: [
                { id: 'legal-t4-e1', context: 'Direct', label: 'History', text: '"Have you tried any legal AI or automation before? What\'s your history with legal tech?"' }
            ],
            responses: [
                { id: 'legal-t4-r1', flag: 'green', type: 'IDEAL', label: 'Tried CLM, Not AI', text: '"We have Ironclad for workflow, but nothing on the AI/review side. That\'s new territory."', meaning: 'Greenfield for AI. Good.', move: { label: 'Set Expectations', text: '"CLM for workflow makes sense. AI for review is different—it\'s about accelerating the human, not replacing them. Who would need to be comfortable before you\'d try something?"' }, transition: '"Who else would weigh in on this?"', nextTerritory: '5. Stakeholders' },
                { id: 'legal-t4-r2', flag: 'yellow', type: 'CONCERNING', label: 'Bad Past Experience', text: '"We tried [competitor] 2 years ago. Accuracy wasn\'t there. Partners didn\'t trust it."', meaning: 'Scar tissue. Need to rebuild trust.', move: { label: 'Diagnose Failure', text: '"What specifically went wrong? Was it accuracy on specific clause types, adoption by attorneys, or something else?"' }, transition: '"What would need to be different this time?"', nextTerritory: '5. Stakeholders' }
            ],
            redFlags: [{ signal: 'Partners killed previous AI initiative', why: 'Cultural blocker', exit: 'Need partner champion' }],
            greenFlags: [{ signal: 'No AI history, just CLM', capitalize: 'Greenfield positioning' }],
            transitions: { strong: '"Good context. Who else involved?"' }
        },
        {
            id: 't5', name: '5. Stakeholders / Process', icon: '👥',
            purpose: 'Legal buying often involves GC, IT, and partner buy-in.',
            gateCriteria: ['GC involvement', 'IT/Security requirements', 'Partner/attorney buy-in'],
            entries: [
                { id: 'legal-t5-e1', context: 'Direct', label: 'Process', text: '"If this looked promising, who else weighs in? IT for security, partners for adoption, procurement?"' }
            ],
            responses: [
                { id: 'legal-t5-r1', flag: 'green', type: 'IDEAL', label: 'Clear Path', text: '"I\'d get sign-off from GC, IT does security review, then we\'d pilot with a practice group."', meaning: 'Clear process.', move: { label: 'Map It', text: '"GC, IT security, pilot with practice group. What\'s typical timeline for each?"' }, transition: '"What does the GC care about most?"', nextTerritory: '6. Budget' }
            ],
            redFlags: [{ signal: 'Partners have veto', why: 'Attorney adoption is hard', exit: 'Find partner champion' }],
            greenFlags: [{ signal: 'GC is champion', capitalize: 'Executive backing' }],
            transitions: { strong: '"Good map. Budget next."' }
        },
        {
            id: 't6', name: '6. Budget / Commercial Reality', icon: '💰',
            purpose: 'Legal often has budget but slow procurement.',
            gateCriteria: ['Budget exists', 'Procurement process', 'Fiscal timing'],
            entries: [
                { id: 'legal-t6-e1', context: 'Direct', label: 'Budget', text: '"Is there budget for legal tech, or would this need to compete for new dollars?"' }
            ],
            responses: [
                { id: 'legal-t6-r1', flag: 'green', type: 'IDEAL', label: 'Budget Exists', text: '"We have a legal tech budget. This would fit."', meaning: 'Money exists.', move: { label: 'Confirm Range', text: '"Good to know. Solutions like ours typically run $X-Y. In ballpark?"' }, transition: '"Let me propose next steps."', nextTerritory: '7. Close' }
            ],
            redFlags: [{ signal: 'No legal tech budget', why: 'Needs business case', exit: 'Build ROI on outside counsel savings' }],
            greenFlags: [{ signal: 'Budget approved', capitalize: 'Move to close' }],
            transitions: { strong: '"Budget fits. Next steps."' }
        },
        {
            id: 't7', name: '7. Close / Next Step', icon: '🎯',
            purpose: 'Lock next step. Legal moves slow—keep momentum.',
            gateCriteria: ['Specific next meeting', 'Pilot scope discussed', 'Homework assigned'],
            entries: [
                { id: 'legal-t7-e1', context: 'Strong', label: 'Propose Pilot', text: '"Here\'s what I\'m thinking: let\'s scope a pilot with one practice group. I\'ll put together proposal, let\'s get GC on next call. Does [date] work?"' }
            ],
            responses: [
                { id: 'legal-t7-r1', flag: 'green', type: 'IDEAL', label: 'Yes to Pilot', text: '"Pilot makes sense. Let me get the GC\'s calendar for next week."', meaning: 'Moving to pilot.', move: { label: 'Lock Details', text: '"Perfect. Which practice group would be best for pilot? And what does success look like?"' }, transition: 'Send invite.', nextTerritory: 'DONE' }
            ],
            redFlags: [{ signal: '"Need to socialize internally"', why: 'Stall risk', exit: 'Offer to join internal meeting' }],
            greenFlags: [{ signal: 'GC wants to meet', capitalize: 'Fast track' }],
            transitions: { strong: 'Send calendar invite now.' }
        }
    ]
};

// ================================================================
// FRAMEWORK 4: REVENUE INTELLIGENCE
// ================================================================
DISCOVERY_FRAMEWORKS.revintel = {
    id: 'revintel',
    label: 'Revenue Intelligence',
    color: 'blue',
    description: 'For revenue intelligence, call recording, forecasting, and CRM automation. Navigate skeptical sales leaders.',
    useCases: ['Call intelligence', 'CRM automation', 'Forecasting', 'Deal inspection', 'Coaching'],
    coreInsight: "You don't sell another tool. You sell visibility into what\'s really happening in deals—and the 70% of selling time lost to admin instead of selling.",
    competitiveLandscape: ['Gong', 'Clari', 'People.ai', 'Chorus', 'Revenue.io', 'Salesforce'],
    typicalBuyers: ['CRO', 'VP Sales', 'VP RevOps', 'Sales Ops Leader', 'CFO'],
    keyMetrics: ['Forecast accuracy', 'Pipeline coverage', 'Win rate', 'Deal cycle time', 'Rep productivity'],
    territories: [
        {
            id: 't1', name: '1. Current State', icon: '📊',
            purpose: 'Understand their revenue ops maturity. CRM, forecasting, deal visibility.',
            gateCriteria: ['CRM and tech stack', 'Forecasting process', 'Rep count', 'Deal visibility methods', 'Current pain points'],
            entries: [
                { id: 'ri-t1-e1', context: 'Open', label: 'Revenue Ops Landscape', text: '"Can you walk me through how you run revenue ops today? How do you forecast, inspect deals, and know what\'s really happening in pipeline?"' },
                { id: 'ri-t1-e2', context: 'Hypothesis', label: 'Pattern Recognition', text: '"Most revenue leaders I talk to are doing some combination of Salesforce, weekly forecast calls, and 1:1s to figure out what\'s real. Lots of spreadsheets. Is that your world?"' }
            ],
            responses: [
                { id: 'ri-t1-r1', flag: 'green', type: 'IDEAL', label: 'Low Visibility', text: '"Honestly, forecasting is a guess. Reps tell me what they think, I haircut it. I don\'t really know what\'s happening in deals until they close or die."', meaning: 'Classic revenue intelligence pain.', move: { label: 'Quantify the Gap', text: '"What\'s your forecast accuracy? And when deals slip or die unexpectedly—how much revenue is that per quarter?"' }, transition: '"Where does that hurt you most?"', nextTerritory: '2. Pain/Impact' },
                { id: 'ri-t1-r2', flag: 'yellow', type: 'GOOD', label: 'Using Competitor', text: '"We have Gong for calls, but forecasting is still spreadsheets."', meaning: 'Partial solution. Find the gap.', move: { label: 'Find the Gap', text: '"Gong for calls makes sense. Where does the visibility break down? Is it connecting call insights to CRM, forecasting accuracy, or something else?"' }, transition: '"What\'s the biggest gap Gong doesn\'t solve?"', nextTerritory: '2. Pain/Impact' }
            ],
            redFlags: [{ signal: 'Small team (<10 reps)', why: 'ROI might not justify', exit: 'Check if they\'re scaling' }],
            greenFlags: [{ signal: 'Forecast accuracy below 70%', capitalize: 'Clear value prop' }],
            transitions: { strong: '"Where does low visibility actually hurt?"' }
        },
        {
            id: 't2', name: '2. Pain / Impact', icon: '⚠️',
            purpose: 'Find where lack of visibility hurts. Quantify in revenue and time.',
            gateCriteria: ['Specific pain', 'Revenue impact', 'Time wasted', 'Who feels it'],
            entries: [
                { id: 'ri-t2-e1', context: 'Hypothesis', label: 'Common Pain', text: '"Revenue leaders usually tell me: forecast is a guess, don\'t know why deals die, reps spending more time in CRM than selling. Any resonate?"' },
                { id: 'ri-t2-e2', context: 'Strategic', label: 'Business Impact', text: '"Where does lack of visibility show up on the board deck? Missed quarters, pipeline surprises, or rep productivity?"' }
            ],
            responses: [
                { id: 'ri-t2-r1', flag: 'green', type: 'IDEAL', label: 'Forecast Misses', text: '"We missed two quarters last year because deals that looked solid just evaporated. Board lost confidence. I need to know what\'s real."', meaning: 'Executive-level pain with consequences.', move: { label: 'QUANTIFY', text: '"Two missed quarters—what was the total shortfall? And when deals evaporate, is it usually late in the quarter when it\'s too late to recover?"', subtext: '💰 THE MATH: If $2M missed × 2 quarters = $4M in revenue surprise. What\'s that worth to prevent?' }, transition: '"What made you decide to address this now?"', nextTerritory: '3. Trigger' },
                { id: 'ri-t2-r2', flag: 'green', type: 'IDEAL', label: 'Rep Productivity', text: '"My reps spend 2 hours a day on CRM and admin. That\'s 500 hours a week across the team not selling."', meaning: 'Time waste. Clear ROI.', move: { label: 'QUANTIFY', text: '"500 hours a week × 50 weeks = 25,000 hours a year. What\'s the average hourly cost of a rep? And what would happen if even half that time went back to selling?"', subtext: '💰 THE MATH: 25K hours × $50/hour = $1.25M in rep time on admin. If 50% went to selling at 3x pipeline return...' }, transition: '"What would it mean if reps got that time back?"', nextTerritory: '3. Trigger' },
                { id: 'ri-t2-r3', flag: 'orange', type: 'OBJECTION', label: '"Reps Won\'t Use Another Tool"', text: '"I\'ve tried tools before. Reps don\'t use them. Just more CRM hygiene nagging."', meaning: 'Adoption skepticism. Valid concern.', objection: { rootCause: 'Previous tools added work without value. Reps saw them as management surveillance.', badResponse: '"Our adoption rates are 90%+" (they\'ve heard this)', goodResponse: '"What specifically killed adoption last time? Was it the tool or the rollout?"', greatResponse: '"You\'re right—most tools fail because they add work for reps while only helping managers. The test is: does the tool make the rep\'s life easier, or just management\'s? If it auto-updates CRM and preps them for calls, adoption happens. If it\'s just another dashboard for you, it won\'t. Which category has failed for you before?"' }, move: { label: 'Understand Past Failures', text: '"What killed adoption before? Was it the tool adding work, or how it was positioned to reps?"' }, nextTerritory: 'Stay in T2' }
            ],
            redFlags: [{ signal: '"Our Salesforce data is fine"', why: 'Don\'t perceive the problem', exit: 'Dig deeper or move on' }],
            greenFlags: [{ signal: 'Board pressure on forecast', capitalize: 'Executive mandate' }],
            transitions: { strong: '"Significant impact. Why look at this now?"' }
        },
        {
            id: 't3', name: '3. Trigger / Priority', icon: '⚡',
            purpose: 'Why now? Revenue tools are crowded—need strong trigger.',
            gateCriteria: ['Specific event', 'Timeline', 'Executive mandate', 'Competing priorities'],
            entries: [
                { id: 'ri-t3-e1', context: 'Direct', label: 'Why Now', text: '"What made you take this meeting—did something change? Missed quarter, new CRO, board pressure?"' }
            ],
            responses: [
                { id: 'ri-t3-r1', flag: 'green', type: 'IDEAL', label: 'Board Mandate', text: '"CFO is on me about forecast accuracy. After last quarter, they want to know what\'s real before we report."', meaning: 'Executive mandate with consequences.', move: { label: 'Understand Mandate', text: '"What does CFO need to see? Specific accuracy target, or more about methodology?"' }, transition: '"What have you tried so far?"', nextTerritory: '4. Prior Attempts' }
            ],
            redFlags: [{ signal: '"Just evaluating options"', why: 'No urgency', exit: 'Nurture' }],
            greenFlags: [{ signal: 'New CRO or CFO mandate', capitalize: 'Executive sponsor' }],
            transitions: { strong: '"[Mandate] is clear driver. What\'s been tried?"' }
        },
        {
            id: 't4', name: '4. Prior Attempts', icon: '🔄',
            purpose: 'What\'s been tried? Revenue tech is crowded.',
            gateCriteria: ['Current tools', 'What failed/worked', 'Adoption history'],
            entries: [
                { id: 'ri-t4-e1', context: 'Direct', label: 'History', text: '"What revenue tools are you using now? Gong, Clari, anything else?"' }
            ],
            responses: [
                { id: 'ri-t4-r1', flag: 'green', type: 'IDEAL', label: 'Tool Fatigue', text: '"We have Gong for calls, Clari for forecasting, but they don\'t talk to each other. Still doing manual rollups."', meaning: 'Integration pain.', move: { label: 'Find Integration Gap', text: '"So you have point solutions but not unified intelligence. What falls through the cracks?"' }, transition: '"What would unified view actually solve?"', nextTerritory: '5. Stakeholders' }
            ],
            redFlags: [{ signal: 'Just signed with competitor', why: 'Too late', exit: 'Nurture until contract renewal' }],
            greenFlags: [{ signal: 'Current tools not integrated', capitalize: 'Platform play' }],
            transitions: { strong: '"Good context. Who else weighs in?"' }
        },
        {
            id: 't5', name: '5. Stakeholders / Process', icon: '👥',
            purpose: 'Revenue tools involve CRO, RevOps, IT, and sometimes CFO.',
            gateCriteria: ['Decision maker', 'RevOps involvement', 'IT requirements'],
            entries: [
                { id: 'ri-t5-e1', context: 'Direct', label: 'Process', text: '"If this looked like a fit, who else weighs in? RevOps, IT, CFO?"' }
            ],
            responses: [
                { id: 'ri-t5-r1', flag: 'green', type: 'IDEAL', label: 'Clear Process', text: '"I\'d evaluate with RevOps, IT does security, CFO signs off on anything over $100K."', meaning: 'Clear process.', move: { label: 'Map It', text: '"You, RevOps, IT security, CFO for budget. Timeline for each?"' }, transition: '"What does CFO care about most?"', nextTerritory: '6. Budget' }
            ],
            redFlags: [{ signal: 'CFO controls everything', why: 'Long sales cycle', exit: 'Build CFO business case' }],
            greenFlags: [{ signal: 'CRO has budget authority', capitalize: 'Shorter cycle' }],
            transitions: { strong: '"Good map. Budget next."' }
        },
        {
            id: 't6', name: '6. Budget / Commercial Reality', icon: '💰',
            purpose: 'Revenue tools can be expensive. Make sure budget exists.',
            gateCriteria: ['Budget exists', 'Approval threshold', 'Competing priorities'],
            entries: [
                { id: 'ri-t6-e1', context: 'Direct', label: 'Budget', text: '"Is there budget for revenue tech, or would this compete with other priorities?"' }
            ],
            responses: [
                { id: 'ri-t6-r1', flag: 'green', type: 'IDEAL', label: 'Budget Exists', text: '"We have RevOps budget. If ROI is there, I can make it happen."', meaning: 'Money exists.', move: { label: 'Confirm Range', text: '"Solutions like ours typically run $X per rep per month. For your team size, that\'s roughly $Y annually. In ballpark?"' }, transition: '"Let me propose next steps."', nextTerritory: '7. Close' }
            ],
            redFlags: [{ signal: 'Need to replace existing tool first', why: 'Displacement play', exit: 'Understand switching costs' }],
            greenFlags: [{ signal: 'Budget for this fiscal year', capitalize: 'Move to close' }],
            transitions: { strong: '"Budget works. Next steps."' }
        },
        {
            id: 't7', name: '7. Close / Next Step', icon: '🎯',
            purpose: 'Lock next step. Revenue leaders are busy—keep momentum.',
            gateCriteria: ['Specific next meeting', 'Demo or pilot scoped', 'Homework assigned'],
            entries: [
                { id: 'ri-t7-e1', context: 'Strong', label: 'Propose Demo', text: '"Here\'s what I\'m thinking: let me show you how this would work with your actual Salesforce data. 45 minutes, you\'ll see exactly what visibility you\'d get. Does [date] work?"' }
            ],
            responses: [
                { id: 'ri-t7-r1', flag: 'green', type: 'IDEAL', label: 'Yes to Demo', text: '"That makes sense. Let\'s do it next Tuesday, and I\'ll bring my RevOps lead."', meaning: 'Demo booked with stakeholder.', move: { label: 'Lock Details', text: '"Perfect. I\'ll need a Salesforce export or sandbox access before then. Who on your team can help with that?"' }, transition: 'Send invite.', nextTerritory: 'DONE' }
            ],
            redFlags: [{ signal: '"I\'ll check calendars and get back"', why: 'Stall', exit: 'Push for specific date now' }],
            greenFlags: [{ signal: 'Bringing RevOps to demo', capitalize: 'Multiple stakeholders engaged' }],
            transitions: { strong: 'Send calendar invite before hanging up.' }
        }
    ]
};

    // ================================================================
    // FRAMEWORK 5: AI-SPECIFIC OBJECTIONS (Cross-Category)
    // ================================================================
DISCOVERY_FRAMEWORKS['ai-objections'] = {
        id: 'ai-objections',
        label: '🧬 AI Objections (Cross-Category)',
        color: 'purple',
        description: 'Universal AI-specific objections buyers raise regardless of product category. Use alongside your product framework during discovery when AI skepticism surfaces.',
        useCases: ['AI trust concerns', 'Security & compliance objections', 'ROI skepticism', 'Black box fears', 'Pilot-to-rollout blockers', 'Human oversight requirements'],
        coreInsight: "AI objections aren't about your product — they're about the buyer's risk tolerance. Your job is to make the risk legible, not to argue it away. Meet skepticism with specificity.",
        typicalBuyers: ['CIO / CTO', 'CISO / Security', 'Legal / GC', 'VP Operations', 'CFO', 'Any executive evaluating AI for the first time'],
        keyMetrics: ['Accuracy rate vs. status quo', 'Time-to-value', 'Security review timeline', 'Pilot success criteria', 'Error rate benchmarks'],
        territories: [
            // ====== TERRITORY 1: AI HALLUCINATIONS & RELIABILITY ======
            {
                id: 'ai-t1',
                name: '1. AI Hallucinations & Reliability',
                icon: '🤖',
                purpose: 'When they worry about AI making things up or being unreliable. Most common first objection.',
                gateCriteria: [
                    'Buyer understands your accuracy benchmarks vs. their current error rate',
                    'Guardrails explained (confidence scoring, escalation triggers, audit trails)',
                    'Offer to show benchmarks on their actual use case, not synthetic data',
                    'Reframed from "does it ever fail?" to "what\'s the error rate vs. status quo?"'
                ],
                entries: [
                    {
                        id: 'ai-t1-e1', context: 'Direct / Technical Buyer',
                        label: 'Hard Accuracy Question',
                        text: '"How do we know the AI won\'t hallucinate? We can\'t afford wrong answers going to customers / in legal documents / affecting deals."',
                        subtext: 'Why they ask: They\'ve seen bad AI demos or read horror stories. This is a legitimate technical concern.'
                    },
                    {
                        id: 'ai-t1-e2', context: 'Executive / Risk-Averse',
                        label: 'Reputational Risk Framing',
                        text: '"What happens when the AI gets it wrong and a customer sees it? We can\'t have our brand associated with bad AI."',
                        subtext: 'Why they ask: Brand risk trumps efficiency gains at the executive level. They need confidence, not features.'
                    },
                    {
                        id: 'ai-t1-e3', context: 'Already Burned',
                        label: 'Prior Bad Experience',
                        text: '"We tried an AI tool before and the outputs were embarrassing. What makes yours different?"',
                        subtext: 'Why they ask: Scar tissue from a failed implementation. You need to distinguish, not dismiss.'
                    }
                ],
                responses: [
                    {
                        id: 'ai-t1-r1', flag: 'green', type: 'IDEAL', label: 'Open to Evidence',
                        text: '"That makes sense — can you show us accuracy numbers on a use case like ours?"',
                        meaning: 'They\'re not dismissing AI — they want proof. This is a buying signal disguised as skepticism.',
                        move: {
                            label: 'Reframe the Risk Equation',
                            text: '"Absolutely. But first, quick reframe: every AI system has an error rate. So does your current process — humans miss things, tire out, get inconsistent. The real question is: can AI get you to a lower error rate, faster, at scale? We can show you our accuracy benchmarks on your actual use case, not synthetic data. And we build in guardrails — confidence scoring, human escalation triggers, audit trails — so you always know when it\'s uncertain."',
                            subtext: 'You\'re shifting the benchmark from "perfect" to "better than today." That\'s winnable.'
                        },
                        listenFor: [
                            { signal: '"What\'s your accuracy rate on [specific use case]?"', action: '🟢 GOLD. They\'re evaluating, not dismissing.' },
                            { signal: '"Can we test it on our data?"', action: '🟢 Pilot conversation. Move to Evaluation territory.' },
                            { signal: '"How do guardrails work exactly?"', action: '🟢 Technical deep-dive. Bring in your solutions engineer.' }
                        ],
                        transition: '"Would it help to see how we measure this with a customer in your space? I can walk through an actual accuracy report."',
                        nextTerritory: '6. Evaluation & Proving ROI'
                    },
                    {
                        id: 'ai-t1-r2', flag: 'yellow', type: 'CAUTIOUS', label: 'Skeptical But Listening',
                        text: '"I mean, we\'ve all seen ChatGPT make stuff up. How is this different?"',
                        meaning: 'Conflating consumer AI with enterprise AI. Education opportunity.',
                        move: {
                            label: 'Separate Consumer AI from Enterprise AI',
                            text: '"Fair point — and honestly, ChatGPT hallucinating is the best thing that happened to enterprise AI companies. It set the bar for what NOT to build. Here\'s the difference: consumer AI tries to answer everything. Enterprise AI is purpose-built for specific workflows with domain-specific training, retrieval-augmented generation so it cites sources, and hard guardrails that reject low-confidence outputs instead of guessing. Think of it less like \'AI that knows everything\' and more like \'AI that\'s an expert in one thing and knows when to say I don\'t know.\'"',
                            subtext: 'The "ChatGPT comparison" is your chance to differentiate. Don\'t get defensive — lean in.'
                        },
                        listenFor: [
                            { signal: '"OK, that makes sense"', action: '🟢 Education worked. Probe for specific use case.' },
                            { signal: '"But what about [edge case]?"', action: '🟡 They want to stress-test. Good sign — engage the specifics.' }
                        ],
                        transition: '"Want to see this in action on a use case that matches yours? Seeing the guardrails live usually clicks faster than me describing them."',
                        nextTerritory: '5. Human-in-the-Loop Control'
                    },
                    {
                        id: 'ai-t1-r3', flag: 'red', type: 'HARD BLOCKER', label: 'Zero Tolerance for Error',
                        text: '"We absolutely cannot have any errors. Zero tolerance. If AI can\'t guarantee 100% accuracy, it\'s a non-starter."',
                        meaning: 'Unrealistic expectation. Either they genuinely believe this (need education) or it\'s a polite no.',
                        move: {
                            label: 'Mirror the Impossibility Back',
                            text: '"I respect that standard — and I\'d never tell you we\'re 100% accurate, because no system is. Including your current one. Quick question: what\'s your current error rate on [the process AI would handle]? Most teams don\'t measure it, which means the bar for AI is \'perfect\' while the bar for humans is \'we don\'t track it.\' If we can get you to a measurably lower error rate with full auditability, is that worth exploring? Or is the concern really about something else — like who\'s accountable when something goes wrong?"',
                            subtext: 'If they insist on 100%, this might be a non-buyer. But often the real objection is accountability, not accuracy.'
                        },
                        listenFor: [
                            { signal: '"You\'re right, we don\'t measure our current error rate"', action: '🟢 Breakthrough. Help them measure it — that\'s your pilot.' },
                            { signal: '"It\'s really about who\'s responsible"', action: '🟢 Redirect to Accountability territory.' },
                            { signal: 'Doubles down on zero tolerance', action: '🔴 Likely not a buyer right now. Qualify out gracefully.' }
                        ],
                        transition: '"Let me ask this differently — if we could prove a lower error rate than your current process, with full audit trails, would that change the conversation?"',
                        nextTerritory: '2. Accountability & Liability'
                    }
                ],
                redFlags: [
                    { signal: '"Our legal team will never approve AI"', why: 'Might be organizational blocker, not just this champion\'s concern', exit: 'Ask: "Has legal evaluated an AI vendor before, or would this be the first?"' },
                    { signal: 'Can\'t articulate what "accurate enough" means', why: 'No success criteria = no way to win', exit: 'Help them define it or qualify out' }
                ],
                greenFlags: [
                    { signal: 'Asking about specific accuracy benchmarks', capitalize: 'They\'re evaluating, not dismissing — move to pilot' },
                    { signal: '"Our current process has errors too"', capitalize: 'They get the reframe. Quantify current error rate.' }
                ],
                transitions: {
                    strong: '"Let me show you accuracy data from a customer in your space — that usually makes this concrete."',
                    neutral: '"Would it help to define what \'accurate enough\' looks like for your use case before we go further?"',
                    recovery: '"I hear the concern. Rather than debating AI in the abstract — can I show you exactly what the output looks like on a real example from your industry?"'
                }
            },

            // ====== TERRITORY 2: ACCOUNTABILITY & LIABILITY ======
            {
                id: 'ai-t2',
                name: '2. Accountability & Liability',
                icon: '⚖️',
                purpose: 'When they ask who\'s responsible when AI makes a mistake. Often the real blocker behind accuracy concerns.',
                gateCriteria: [
                    'Buyer understands the three layers: tool liability, process liability, vendor liability',
                    'Legal contact identified for evaluation',
                    'SLA and accuracy guarantees discussed',
                    'Workflow oversight model explained (AI recommends, human approves)'
                ],
                entries: [
                    {
                        id: 'ai-t2-e1', context: 'Legal / Compliance Buyer',
                        label: 'Direct Liability Question',
                        text: '"If the AI makes a bad decision, who\'s liable? Legal is going to have a field day with this."',
                        subtext: 'Why they ask: Legal teams need to assign risk. They\'re doing their job, not blocking yours.'
                    },
                    {
                        id: 'ai-t2-e2', context: 'Executive / Board Pressure',
                        label: 'Governance Framing',
                        text: '"Our board wants to know our AI governance framework before we adopt any AI tools. What does yours look like?"',
                        subtext: 'Why they ask: Board-level AI governance is becoming standard. Good sign — means they\'re serious about adoption.'
                    },
                    {
                        id: 'ai-t2-e3', context: 'Operational Leader',
                        label: 'Blame Game Concern',
                        text: '"If something goes wrong, my team is on the hook. I can\'t blame the AI."',
                        subtext: 'Why they ask: Personal career risk. This person needs air cover, not just product features.'
                    }
                ],
                responses: [
                    {
                        id: 'ai-t2-r1', flag: 'green', type: 'IDEAL', label: 'Wants to Understand the Framework',
                        text: '"Walk me through how liability works with your product."',
                        meaning: 'They\'re buying — they just need the governance story for internal sign-off.',
                        move: {
                            label: 'Separate the Layers of Accountability',
                            text: '"Great question — and it\'s one that every sophisticated buyer should be asking. Let me separate this into layers: Tool liability — the AI is a tool, like a calculator or a search engine. It doesn\'t \'make decisions\' — it assists your people in making better, faster decisions. Process liability — that stays with your team. We help you build workflows where AI recommendations always go through your approval process before action. Vendor liability — we contractually stand behind our accuracy claims and SLAs. If we say 95% accuracy, we measure it, we report it, and there are consequences if we fall short."',
                            subtext: 'The three-layer separation makes liability legible instead of scary.'
                        },
                        listenFor: [
                            { signal: '"Can we get that in the contract?"', action: '🟢 Deal progression. Get legal involved.' },
                            { signal: '"Who else handles it this way?"', action: '🟢 Social proof request. Share reference customers.' },
                            { signal: '"Our legal team should hear this"', action: '🟢 GOLD. Multi-thread into legal. Book the meeting.' }
                        ],
                        transition: '"The companies that struggle with AI aren\'t the ones who worry about liability — they\'re the ones who don\'t build proper oversight into the workflow. Who on your legal team would want to be part of the evaluation?"',
                        nextTerritory: '5. Human-in-the-Loop Control'
                    },
                    {
                        id: 'ai-t2-r2', flag: 'orange', type: 'CONCERNING', label: 'Using Liability as a Stall',
                        text: '"We need to figure out our AI policy before we can evaluate any vendors."',
                        meaning: 'Could be genuine (early-stage AI governance) or a stall tactic.',
                        move: {
                            label: 'Offer to Help Build the Framework',
                            text: '"That\'s smart — and a lot of companies are in the same place. Here\'s what we see work: rather than trying to build a comprehensive AI policy in a vacuum, start with one specific use case. Define the oversight model for that workflow, run a controlled pilot, and use the learnings to inform your broader policy. We can share AI governance frameworks from similar companies — it usually accelerates the policy work by months. Would that be helpful?"',
                            subtext: 'You\'re positioning yourself as the AI governance partner, not just a vendor waiting for permission.'
                        },
                        listenFor: [
                            { signal: '"That would actually be really helpful"', action: '🟢 You\'re now the trusted advisor, not just a vendor.' },
                            { signal: '"We need to do this internally first"', action: '🟡 Respect it. Offer the framework doc and follow up in 30 days.' }
                        ],
                        transition: '"Want me to send over the AI governance template we use with enterprise customers? No strings — it\'ll help your internal process either way."',
                        nextTerritory: '6. Evaluation & Proving ROI'
                    }
                ],
                redFlags: [
                    { signal: '"Our legal team has a blanket no-AI policy"', why: 'Organizational blocker — not a champion problem', exit: 'Ask if any exceptions exist or if policy is under review' },
                    { signal: 'No one can articulate who would own the AI governance decision', why: 'No decision-maker identified', exit: 'Help them map the decision process before investing more time' }
                ],
                greenFlags: [
                    { signal: '"Can you present this to our legal team?"', capitalize: 'Multi-threading into legal — major deal progression' },
                    { signal: '"We have an AI governance committee"', capitalize: 'Organizational readiness. Ask to present to the committee.' }
                ],
                transitions: {
                    strong: '"Let me set up a call between our legal team and yours — we do these all the time and it usually takes 30 minutes to resolve."',
                    neutral: '"I can send over our standard AI governance documentation. Would that be useful for your internal review?"',
                    recovery: '"It sounds like the liability question is the real blocker. Rather than going deeper on product — should we solve this one first?"'
                }
            },

            // ====== TERRITORY 3: DATA PRIVACY & TRAINING ======
            {
                id: 'ai-t3',
                name: '3. Data Privacy & Training Concerns',
                icon: '🔒',
                purpose: 'When they worry about their data being used to train AI or exposed. Usually the security team\'s first question.',
                gateCriteria: [
                    'Training data policy clearly stated (opt-in vs. never used)',
                    'Data residency options explained',
                    'Security certifications listed (SOC 2, HIPAA, ISO 27001)',
                    'Security review contact identified and timeline set',
                    'Positioned security as a strength, not a checkbox'
                ],
                entries: [
                    {
                        id: 'ai-t3-e1', context: 'CISO / Security Team',
                        label: 'Direct Data Training Question',
                        text: '"Does our data get used to train your models? What about data residency? Our security team will never approve this."',
                        subtext: 'Why they ask: Post-ChatGPT, every security team asks this. It\'s table stakes, not a deal-killer.'
                    },
                    {
                        id: 'ai-t3-e2', context: 'Regulated Industry',
                        label: 'Compliance-First Framing',
                        text: '"We\'re in [healthcare/finance/legal]. Our compliance requirements are extremely strict. How do you handle PHI/PII/confidential data?"',
                        subtext: 'Why they ask: Regulated buyers have real constraints. Lead with your compliance posture, not product features.'
                    },
                    {
                        id: 'ai-t3-e3', context: 'Procurement / Vendor Review',
                        label: 'Security Questionnaire Preview',
                        text: '"We have a 200-question security questionnaire. Have you filled one out before? How long does your security review take?"',
                        subtext: 'Why they ask: They\'re trying to estimate the procurement timeline. Speed here is a differentiator.'
                    }
                ],
                responses: [
                    {
                        id: 'ai-t3-r1', flag: 'green', type: 'IDEAL', label: 'Ready to Start Security Review',
                        text: '"OK, that all sounds right. Who should I connect with on your security team to get the review started?"',
                        meaning: 'They\'re ready to buy — security review is the next step, not a blocker.',
                        move: {
                            label: 'Get Specific, Not Defensive',
                            text: '"Let me be direct on each point: Training data — [customize: \'your data is never used to train our models, period\' or \'you have opt-in control over whether your data contributes to model improvements\']. Data residency — we can deploy in [regions]. Your data stays in the region you choose. Security posture — [SOC 2 Type II / HIPAA / ISO 27001 — whatever applies]. I can have our security team do a joint call with yours. Honestly, the security conversation is one of our strongest. We usually pass security review faster than legacy software vendors because our architecture is modern."',
                            subtext: 'Be specific and confident. Vagueness is what kills you with security teams.'
                        },
                        listenFor: [
                            { signal: '"Can you start on our security questionnaire?"', action: '🟢 DEAL PROGRESSION. Get it started immediately — this is on the critical path.' },
                            { signal: '"We need to see your SOC 2 report"', action: '🟢 Standard ask. Send it same day.' },
                            { signal: '"Can you deploy in [specific region]?"', action: '🟢 Specific requirement — confirm or escalate to your team.' }
                        ],
                        transition: '"Who leads your security review? I\'d love to get that started in parallel so it doesn\'t become a blocker."',
                        nextTerritory: '2. Accountability & Liability'
                    },
                    {
                        id: 'ai-t3-r2', flag: 'red', type: 'HARD BLOCKER', label: 'Blanket AI Data Ban',
                        text: '"Our policy is that no company data goes into any AI system. Period."',
                        meaning: 'Organizational policy — not something this champion can override.',
                        move: {
                            label: 'Explore the Policy Boundaries',
                            text: '"I respect that — a lot of companies had that policy 12 months ago. Quick question: is that a permanent position, or is there a review process? Because what we\'re seeing is companies moving from \'no AI\' to \'AI with guardrails\' once they see how the data architecture actually works. The concern is usually \'data leaking to OpenAI\' — which is legitimate. But enterprise AI deployment is architecturally different from consumer AI. Your data never leaves your environment. Would it help if I could show your security team exactly how the data flows?"',
                            subtext: 'Don\'t argue the policy. Explore if there\'s a path to exception or review.'
                        },
                        listenFor: [
                            { signal: '"The policy is under review"', action: '🟢 There\'s an opening. Ask when and who\'s leading the review.' },
                            { signal: '"There might be exceptions for on-prem or private cloud"', action: '🟢 Deployment model conversation. Get specific on your options.' },
                            { signal: '"It\'s a board-level decision and it\'s not changing"', action: '🔴 Not a buyer right now. Stay warm, check back quarterly.' }
                        ],
                        transition: '"I don\'t want to push against your policy — but if there\'s a review process, I\'d love to be a resource when that conversation happens."',
                        nextTerritory: 'PAUSE — revisit when policy evolves'
                    }
                ],
                redFlags: [
                    { signal: 'No security contact identified after two meetings', why: 'Security review isn\'t starting — deal is stalling', exit: 'Make it explicit: "For us to move forward, we need to start the security conversation. Who should I reach out to?"' },
                    { signal: '"We\'ll handle security review internally and get back to you"', why: 'You\'re being cut out of the process', exit: 'Push for a joint call: "Our security team does these every week — they can usually resolve questions in one call vs. weeks of back-and-forth"' }
                ],
                greenFlags: [
                    { signal: '"Can you fill out our security questionnaire this week?"', capitalize: 'Deal is moving. Prioritize this — it\'s on the critical path.' },
                    { signal: '"Our CISO wants to talk to your CISO"', capitalize: 'Executive-level security engagement. Your strongest signal.' }
                ],
                transitions: {
                    strong: '"Let me get our security team on a call with yours this week — we can knock out most questions in 30 minutes."',
                    neutral: '"I\'ll send over our security documentation today. What\'s the best way to get your security team engaged?"',
                    recovery: '"I hear the data concern. Rather than me describing our architecture — can I get our CTO on a call to walk through the data flow diagram?"'
                }
            },

            // ====== TERRITORY 4: AUDITABILITY & EXPLAINABILITY ======
            {
                id: 'ai-t4',
                name: '4. Auditability & Explainability',
                icon: '🔍',
                purpose: 'When they need to explain AI decisions to regulators, boards, or customers. Big in finance, healthcare, legal.',
                gateCriteria: [
                    'Buyer understands your explainability features (reasoning traces, source attribution, confidence scores, audit logs)',
                    'Reframed from "trust AI" to "trust your oversight of AI"',
                    'Offered to walk through an actual audit trail',
                    'Connected to their specific regulatory or governance requirements'
                ],
                entries: [
                    {
                        id: 'ai-t4-e1', context: 'Regulated Industry',
                        label: 'Black Box Objection',
                        text: '"We need to be able to explain every decision. We can\'t have a black box."',
                        subtext: 'Why they ask: Regulatory requirement or board mandate. This is non-negotiable for them.'
                    },
                    {
                        id: 'ai-t4-e2', context: 'Customer-Facing AI',
                        label: 'Customer Trust Concern',
                        text: '"If a customer asks why they got this answer, we need to be able to explain it. \'The AI decided\' isn\'t acceptable."',
                        subtext: 'Why they ask: Customer trust is on the line. They need explainability built into the UX, not just the backend.'
                    },
                    {
                        id: 'ai-t4-e3', context: 'Audit / Compliance',
                        label: 'Audit Trail Requirement',
                        text: '"Our auditors need to see a clear decision trail. Can you produce that?"',
                        subtext: 'Why they ask: Specific compliance requirement. Get the exact format they need and confirm you can deliver it.'
                    }
                ],
                responses: [
                    {
                        id: 'ai-t4-r1', flag: 'green', type: 'IDEAL', label: 'Wants to See the Audit Trail',
                        text: '"Can you show me what the audit trail actually looks like?"',
                        meaning: 'They\'re evaluating, not objecting. Show don\'t tell.',
                        move: {
                            label: 'Turn Black Box Into a Differentiator',
                            text: '"Absolutely — and \'black box\' AI is something we refuse to build. Every output our system produces has: Reasoning traces — you can see why it made each recommendation. Source attribution — every answer ties back to the specific data it used. Confidence scores — it tells you how sure it is, so your team knows when to double-check. Audit logs — full history of what the AI did, when, and what inputs drove it. Your regulators / board / customers don\'t need to trust AI — they need to trust that you have oversight. That\'s what this gives you."',
                            subtext: 'Position explainability as your competitive advantage, not a checkbox.'
                        },
                        listenFor: [
                            { signal: '"Can we export the audit logs?"', action: '🟢 Specific requirement. Confirm the format and move to pilot.' },
                            { signal: '"This is better than what our current system provides"', action: '🟢 GOLD. They\'re comparing you favorably to status quo.' },
                            { signal: '"Our compliance team needs to see this"', action: '🟢 Multi-thread into compliance. Book the demo.' }
                        ],
                        transition: '"Want me to walk through an actual audit trail from a customer in a regulated industry? It\'s the fastest way to see if this meets your bar."',
                        nextTerritory: '5. Human-in-the-Loop Control'
                    },
                    {
                        id: 'ai-t4-r2', flag: 'yellow', type: 'CAUTIOUS', label: 'Needs Regulatory Specifics',
                        text: '"We\'re under [specific regulation]. Does your audit trail satisfy [specific requirement]?"',
                        meaning: 'Real compliance requirement. Get specific or bring in your compliance expert.',
                        move: {
                            label: 'Get Specific on Their Requirements',
                            text: '"Good question — and I want to get this exactly right rather than give you a generic answer. Can you share the specific audit requirements you need to satisfy? I\'ll bring our compliance team into the conversation to map our capabilities to your exact requirements. We do this with [type of regulated customers] regularly."',
                            subtext: 'Don\'t fake compliance knowledge. Get the right people in the room.'
                        },
                        listenFor: [
                            { signal: 'Shares specific regulatory requirements', action: '🟢 They\'re investing time. Match requirements to your capabilities.' },
                            { signal: '"We\'re not sure exactly what we need yet"', action: '🟡 Help them define requirements — you become the trusted advisor.' }
                        ],
                        transition: '"Let me set up a compliance-focused session with your team and ours — we\'ll map your requirements to our audit capabilities."',
                        nextTerritory: '3. Data Privacy & Training'
                    }
                ],
                redFlags: [
                    { signal: 'Can\'t articulate what "explainable" means for their context', why: 'Vague objection might be covering a different concern', exit: 'Ask: "When you say explainable — who needs the explanation and what format does it need to be in?"' }
                ],
                greenFlags: [
                    { signal: 'Sharing specific regulatory or audit requirements', capitalize: 'Real buyer behavior — they\'re mapping your product to their needs' },
                    { signal: '"This is actually better visibility than our current process"', capitalize: 'You\'ve flipped the objection into an advantage' }
                ],
                transitions: {
                    strong: '"Let me show you the audit trail live — 10 minutes and you\'ll know if it meets your bar."',
                    neutral: '"I\'ll document exactly how our explainability features map to your requirements and send it over."',
                    recovery: '"It sounds like explainability is make-or-break. Let me bring our compliance lead into the next call to address this head-on."'
                }
            },

            // ====== TERRITORY 5: HUMAN-IN-THE-LOOP CONTROL ======
            {
                id: 'ai-t5',
                name: '5. Human-in-the-Loop Control',
                icon: '👤',
                purpose: 'When they\'re not ready to let AI run autonomously. Use this to build a graduated adoption path.',
                gateCriteria: [
                    'Buyer understands the control spectrum (Assist → Supervised → Autonomous)',
                    'Starting level agreed upon (usually Level 1 or 2)',
                    'ROI case made for even the most conservative starting point',
                    'Graduation criteria discussed (how they\'d move from Level 1 to Level 2)'
                ],
                entries: [
                    {
                        id: 'ai-t5-e1', context: 'Risk-Averse Buyer',
                        label: 'Autonomy Resistance',
                        text: '"We\'re not comfortable with AI making decisions without human oversight."',
                        subtext: 'Why they say it: Control instinct. They\'re not saying "no" to AI — they\'re saying "not unsupervised."'
                    },
                    {
                        id: 'ai-t5-e2', context: 'Operational Leader',
                        label: 'Workflow Integration Concern',
                        text: '"Our team needs to be in the loop on every output. We can\'t just let AI send things to customers."',
                        subtext: 'Why they say it: They\'re imagining AI replacing their team\'s judgment. Reframe as augmenting it.'
                    },
                    {
                        id: 'ai-t5-e3', context: 'Change Management',
                        label: 'Team Resistance Proxy',
                        text: '"My team is going to push back on this. They don\'t trust AI to do their jobs."',
                        subtext: 'Why they say it: The real concern is team buy-in, not AI capability. Address the people problem.'
                    }
                ],
                responses: [
                    {
                        id: 'ai-t5-r1', flag: 'green', type: 'IDEAL', label: 'Open to Graduated Approach',
                        text: '"If we could start with human approval on everything and dial it up over time, that might work."',
                        meaning: 'They\'ve given you the adoption path. Build the pilot around Level 1.',
                        move: {
                            label: 'Offer the Spectrum of Control',
                            text: '"That\'s exactly how most companies start. Think of it as a spectrum: Level 1 — Assist mode: AI drafts responses / recommendations, human approves before anything happens. Level 2 — Supervised mode: AI handles routine cases automatically, flags edge cases for human review. Level 3 — Autonomous mode: AI handles everything within guardrails you\'ve set. Most customers start at Level 1 or 2 and dial up as they build confidence. You\'re never locked into full autonomy. The ROI is real at every level — even Level 1 typically saves 40-60% of time on the tasks you point it at."',
                            subtext: 'The spectrum removes the "all or nothing" framing that scares buyers.'
                        },
                        listenFor: [
                            { signal: '"Level 1 sounds right for us"', action: '🟢 Adoption path agreed. Build the pilot around assist mode.' },
                            { signal: '"What does it take to move from Level 1 to Level 2?"', action: '🟢 They\'re already thinking about expansion. Share graduation criteria.' },
                            { signal: '"40-60% time savings even at Level 1?"', action: '🟢 ROI hook. Quantify it for their specific use case.' }
                        ],
                        transition: '"Where on that spectrum feels right as a starting point? We can always adjust based on what you see in the pilot."',
                        nextTerritory: '6. Evaluation & Proving ROI'
                    },
                    {
                        id: 'ai-t5-r2', flag: 'yellow', type: 'CAUTIOUS', label: 'Team Pushback Concern',
                        text: '"I think I\'d be OK with it, but my team is going to resist."',
                        meaning: 'Champion is bought in but worried about adoption. Help them build the internal case.',
                        move: {
                            label: 'Address the Change Management',
                            text: '"That\'s normal — and honestly, the teams that resist the most often become the biggest advocates once they see it in action. Here\'s what works: don\'t announce it as \'AI replacing work.\' Position it as \'here\'s a tool that handles the boring stuff so you can focus on the hard stuff.\' Start with your most open-minded team member. Let them use it for a week. When they start raving about it, the rest of the team will follow. We\'ve seen this pattern dozens of times."',
                            subtext: 'Give them a change management playbook, not just a product pitch.'
                        },
                        listenFor: [
                            { signal: '"Who on my team should I start with?"', action: '🟢 They\'re planning the rollout. Help them identify the pilot user.' },
                            { signal: '"Can your team help with the internal messaging?"', action: '🟢 You\'re now a strategic partner, not just a vendor.' }
                        ],
                        transition: '"Want me to share the internal rollout playbook we give to customers? It covers exactly how to position this to the team."',
                        nextTerritory: '6. Evaluation & Proving ROI'
                    }
                ],
                redFlags: [
                    { signal: '"We\'ll never let AI touch customer-facing workflows"', why: 'Scope too narrow for meaningful ROI', exit: 'Ask: "What about internal workflows — is there a back-office use case where AI could save time without any customer exposure?"' }
                ],
                greenFlags: [
                    { signal: '"Level 1 to start, then we\'ll see"', capitalize: 'Adoption path confirmed. Build the pilot.' },
                    { signal: 'Asking about how other teams adopted', capitalize: 'Social proof seeking — share case studies of graduated adoption' }
                ],
                transitions: {
                    strong: '"Let\'s pick the use case for your Level 1 pilot — what process would you want AI to assist with first?"',
                    neutral: '"I can map out what Level 1 would look like for your specific workflow — that usually makes it tangible."',
                    recovery: '"Total control stays with your team. AI just does the prep work. Want to see what that looks like in practice?"'
                }
            },

            // ====== TERRITORY 6: EVALUATION & PROVING ROI ======
            {
                id: 'ai-t6',
                name: '6. Evaluation & Proving ROI',
                icon: '📋',
                purpose: 'When they don\'t know how to measure whether AI actually works. Critical for getting to a paid deal.',
                gateCriteria: [
                    'Specific use case identified with measurable outcomes',
                    'Success metric defined that leadership cares about',
                    'Pilot structure agreed (controlled test, timeline, who\'s involved)',
                    'Executive sponsor identified who will champion the results'
                ],
                entries: [
                    {
                        id: 'ai-t6-e1', context: 'First-Time AI Buyer',
                        label: 'No Evaluation Framework',
                        text: '"How would we even evaluate this? We don\'t know what good looks like with AI."',
                        subtext: 'Why they ask: Genuine uncertainty, not resistance. Help them build the framework.'
                    },
                    {
                        id: 'ai-t6-e2', context: 'CFO / Finance Buyer',
                        label: 'ROI Skepticism',
                        text: '"What\'s the actual ROI? I need hard numbers, not \'AI magic.\'"',
                        subtext: 'Why they ask: They\'ve seen overpromised AI pitches. Lead with their metrics, not yours.'
                    },
                    {
                        id: 'ai-t6-e3', context: 'Post-Pilot',
                        label: 'Pilot Didn\'t Convince',
                        text: '"The pilot was interesting but I\'m not sure it justifies the investment."',
                        subtext: 'Why they say it: Usually means the pilot measured the wrong thing or lacked executive visibility.'
                    }
                ],
                responses: [
                    {
                        id: 'ai-t6-r1', flag: 'green', type: 'IDEAL', label: 'Wants Help Defining Success',
                        text: '"Can you help us figure out what to measure?"',
                        meaning: 'They\'re asking you to define the evaluation — huge trust signal.',
                        move: {
                            label: 'Define Success Before They Buy',
                            text: '"That\'s actually the most important question — and most vendors skip it because they don\'t want you measuring them. Here\'s what we do: before you commit to anything, we define success together. Step 1 — Pick a specific use case with measurable outcomes (not \'improve efficiency\' — something like \'reduce average handling time on tier-1 tickets from 8 min to 3 min\'). Step 2 — Run a controlled pilot: same types of cases, some with AI, some without. Apples to apples. Step 3 — Measure what matters to YOU: accuracy, speed, cost per resolution, customer satisfaction — whatever your exec team cares about. If the numbers don\'t work, we\'ll tell you. We\'d rather you not buy than buy and be disappointed."',
                            subtext: '"We\'d rather you not buy" is the strongest trust-building line in AI sales.'
                        },
                        listenFor: [
                            { signal: '"What metric would you recommend?"', action: '🟢 They\'re deferring to your expertise. Suggest their most impactful metric.' },
                            { signal: '"Our CEO cares about [specific metric]"', action: '🟢 GOLD. Build the pilot around that exact metric.' },
                            { signal: '"How long does a pilot typically take?"', action: '🟢 Timeline question = buying signal. Scope it tight: 2-4 weeks.' }
                        ],
                        transition: '"What metric would make your leadership say \'yes, this is working\'? Let\'s build the pilot around that."',
                        nextTerritory: 'CLOSE — scope the pilot'
                    },
                    {
                        id: 'ai-t6-r2', flag: 'orange', type: 'CONCERNING', label: 'Wants Free Extended Trial',
                        text: '"Can we just try it for a few months and see how it goes?"',
                        meaning: 'Unstructured trial = no clear success criteria = stall.',
                        move: {
                            label: 'Structure the Evaluation',
                            text: '"I get the instinct, but here\'s what we\'ve learned: open-ended trials almost never lead to a decision. Not because the product doesn\'t work — but because without clear success criteria, there\'s no \'aha moment\' that justifies the change. Let\'s do something better: a 3-week structured pilot with a specific use case, agreed metrics, and a decision date. If it works, you\'ll know. If it doesn\'t, you\'ll know that too. Either way, you won\'t waste months in limbo."',
                            subtext: 'Unstructured trials are where deals go to die. Always push for structured evaluation.'
                        },
                        listenFor: [
                            { signal: '"OK, what would a structured pilot look like?"', action: '🟢 They\'re open. Scope it on the call.' },
                            { signal: '"We really just need more time"', action: '🔴 Stall. Ask what would change with more time that wouldn\'t change with a focused pilot.' }
                        ],
                        transition: '"Let\'s pick one use case, one metric, and three weeks. If the numbers work, we move forward. If they don\'t, no hard feelings."',
                        nextTerritory: 'CLOSE — scope the pilot'
                    }
                ],
                redFlags: [
                    { signal: '"We\'ll evaluate internally and get back to you"', why: 'You\'re being cut out of the evaluation process', exit: 'Push back: "We\'ve found the evaluation works much better when we co-design it. Can I at least help define the success criteria?"' },
                    { signal: 'No executive sponsor identified for the pilot', why: 'Results won\'t have an audience', exit: 'Ask: "Who on the leadership team would see the pilot results? We should make sure we\'re measuring what they care about."' }
                ],
                greenFlags: [
                    { signal: 'Asking about success metrics', capitalize: 'They want to measure — help them measure the right things' },
                    { signal: '"Our CEO/CFO wants to see the numbers"', capitalize: 'Executive engagement. Build the pilot report for that audience.' }
                ],
                transitions: {
                    strong: '"Let\'s scope the pilot right now — use case, metric, timeline. I can have a proposal to you by tomorrow."',
                    neutral: '"I\'ll put together a pilot proposal with recommended metrics for your use case. Can we review it next week?"',
                    recovery: '"Forget the product for a second — what would need to be true for you to feel confident investing in AI? Let\'s work backwards from that."'
                }
            },

            // ====== TERRITORY 7: TRIAL DIDN'T PROVE NEED ======
            {
                id: 'ai-t7',
                name: '7. Trial Didn\'t Prove Need',
                icon: '🔬',
                purpose: 'When they did a pilot but didn\'t expand. Diagnose the structural problem — it\'s rarely the product.',
                gateCriteria: [
                    'Root cause identified (wrong use case, wrong metrics, or wrong champion)',
                    'Determined if this is a real "no" or a solvable structural problem',
                    'If solvable: new pilot scoped with corrected approach',
                    'If real no: qualified out gracefully with door open for future'
                ],
                entries: [
                    {
                        id: 'ai-t7-e1', context: 'Post-Pilot Debrief',
                        label: 'Pilot Didn\'t Expand',
                        text: '"We had a trial and realized we don\'t need to roll this out broadly right now."',
                        subtext: 'Why they say it: Almost never means the product failed. Usually a structural problem in how the pilot was run.'
                    },
                    {
                        id: 'ai-t7-e2', context: 'Budget Cycle Miss',
                        label: 'Timing-Based Rejection',
                        text: '"The pilot went well but we don\'t have budget allocated for this right now."',
                        subtext: 'Why they say it: Could be real budget constraint or could be lack of executive sponsorship for the spend.'
                    },
                    {
                        id: 'ai-t7-e3', context: 'Champion Left or Changed',
                        label: 'Lost Momentum',
                        text: '"The person who ran the pilot isn\'t here anymore and we haven\'t picked it back up."',
                        subtext: 'Why they say it: Champion left and no one inherited the project. You need a new champion.'
                    }
                ],
                responses: [
                    {
                        id: 'ai-t7-r1', flag: 'green', type: 'IDEAL', label: 'Open to Diagnosing What Happened',
                        text: '"Yeah, it kind of fizzled. I\'m not sure why exactly."',
                        meaning: 'They\'re not hostile — they just lost momentum. Diagnose and re-engage.',
                        move: {
                            label: 'Diagnose the Gap Between Pilot and Rollout',
                            text: '"That\'s useful feedback. Mind if I ask a few questions about the trial? Usually when a pilot \'works\' but doesn\'t expand, it\'s one of three things: 1. Wrong use case — the pilot targeted something that wasn\'t painful enough to justify change management. 2. Wrong success metrics — it worked technically but nobody measured the business impact in a way leadership cared about. 3. Wrong champion — the person who ran the pilot didn\'t have budget authority or executive sponsorship to expand. Which of those resonates? Or was it something else entirely?"',
                            subtext: 'Listen carefully — the answer tells you whether this is a real \'no\' or a solvable structural problem.'
                        },
                        listenFor: [
                            { signal: '"It was probably the wrong use case"', action: '🟢 Solvable. Ask: "If you could pick the highest-pain use case now, what would it be?"' },
                            { signal: '"We didn\'t measure the right things"', action: '🟢 Solvable. Offer to co-design the success metrics for a re-pilot.' },
                            { signal: '"The champion left"', action: '🟡 Find the new champion. Ask: "Who owns this problem now?"' },
                            { signal: '"Honestly, we just don\'t need it"', action: '🔴 Real no. Qualify out. Stay warm for when priorities shift.' }
                        ],
                        transition: '"Based on what you\'re saying, it sounds like [diagnosis]. Would it make sense to run a tighter pilot — different use case, clearer metrics, executive sponsor — and see if the outcome changes?"',
                        nextTerritory: '6. Evaluation & Proving ROI'
                    },
                    {
                        id: 'ai-t7-r2', flag: 'red', type: 'HARD BLOCKER', label: 'Definitive No',
                        text: '"We evaluated it thoroughly and decided AI isn\'t right for us right now."',
                        meaning: 'Respect it. Don\'t push. Leave the door open.',
                        move: {
                            label: 'Qualify Out Gracefully',
                            text: '"I appreciate the honesty — and I\'d rather hear that directly than chase a dead thread. Quick question before I go: what would need to change for AI to make sense for you in the future? New leadership priority? Budget cycle? Competitive pressure? I\'d love to stay in touch and be useful when the timing is right."',
                            subtext: 'A graceful exit is the best way to keep the door open. They\'ll remember you weren\'t pushy.'
                        },
                        listenFor: [
                            { signal: '"If our competitors start using AI, we\'d have to look again"', action: '🟡 Feed them competitive intelligence when it happens.' },
                            { signal: '"Maybe next budget cycle"', action: '🟡 Set a calendar reminder. Follow up 30 days before their budget planning.' },
                            { signal: '"Honestly, never"', action: '🔴 True no. Remove from pipeline. Check back in 12 months.' }
                        ],
                        transition: '"Thanks for the honesty. I\'ll check in [timeframe] — and if anything changes before then, you know where to find me."',
                        nextTerritory: 'DONE — nurture track'
                    }
                ],
                redFlags: [
                    { signal: 'Pilot was run by someone who\'s no longer there', why: 'No organizational memory of the results', exit: 'Treat as a fresh opportunity — don\'t assume prior context carries over' },
                    { signal: '"We\'re happy with our current process"', why: 'No perceived pain = no urgency', exit: 'Ask about their metrics: "What does success look like for [the process AI would handle]? Are you measuring it?"' }
                ],
                greenFlags: [
                    { signal: '"We might have picked the wrong use case"', capitalize: 'They\'re open to a do-over. Help them pick the right one.' },
                    { signal: '"New leadership is more open to AI"', capitalize: 'Regime change = new opportunity. Re-engage from scratch.' }
                ],
                transitions: {
                    strong: '"Let\'s do a 30-minute session to pick the right use case and metrics — I think a re-pilot would look very different."',
                    neutral: '"I\'ll send over a one-pager on what a structured pilot looks like vs. what you did before. See if it changes the calculus."',
                    recovery: '"No pressure — but I\'d love to stay in your orbit. Mind if I check in next quarter?"'
                }
            }
        ]
    };

// Export for global use
var discoveryFrameworks = DISCOVERY_FRAMEWORKS;
