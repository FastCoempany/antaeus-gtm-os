window.DS_CONTROL_FACE_FOUNDATION = {
  frameworks: [
    'Legal Ops',
    'Recruiting',
    'Product / UX',
    'GovTech',
    'Customer Support',
    'Sales / Revenue',
    'Manufacturing',
    'Data / Intelligence',
    'AI-Native'
  ],
  defaultFrameworkIndex: 4,
  segments: [
    {
      id: '1',
      n: '01',
      t: 'Opening frame',
      say: 'Most teams I talk to already have some automation in place, but the expensive edge cases still fall back to humans. Is that what is happening here too?',
      replies: [
        { tone: 'green', meta: 'Useful correction', quote: '"Mostly. The bot can answer, but it cannot resolve."' },
        { tone: 'orange', meta: 'Broad answer', quote: '"We have a pretty standard support setup."' },
        { tone: 'red', meta: 'Pushback', quote: '"Why do you need to know our setup first?"' }
      ],
      next: [
        'That helps. Walk me through where the bot hands off today and what happens after that.',
        'Got it. Which system are you running, and where do agents usually have to step in?',
        'Fair question. I ask because the handoff usually tells us whether this is a real problem or just a demo request.'
      ],
      facts: [
        'They do have some automation in place.',
        'Humans still handle the edge cases.',
        'You still need the handoff flow.'
      ],
      recover: [
        'I am not trying to audit your stack. I am trying to see whether there is a problem worth solving here.',
        'If the handoff is clean, we may find there is nothing important for us to talk about.',
        'Give me the short version of what happens when the bot can no longer finish the job.'
      ],
      leave: [
        'Name the system.',
        'Name where humans step in.',
        'Do not pitch yet.'
      ]
    },
    {
      id: '2',
      n: '02',
      t: 'Current-state truth',
      say: 'From what I could tell, it looks like you are running Zendesk or Intercom for ticketing, probably doing email and chat, maybe some phone. Is that roughly right, or is it more complicated than that?',
      replies: [
        { tone: 'green', meta: 'Detailed answer', quote: '"Yeah, we are on Intercom, doing about 15K tickets a month. Team of 25. Bots mostly deflect."' },
        { tone: 'orange', meta: 'Thin answer', quote: '"We use Zendesk. Support team is about 20 people. Pretty standard."' },
        { tone: 'red', meta: 'Defensive answer', quote: '"Why do you need to know our setup? Why not just show the product?"' }
      ],
      next: [
        'Of those tickets, roughly what share actually needs human judgment or system access?',
        'When a case leaves the bot, what usually forces that handoff?',
        'I am not trying to inventory your stack. I am trying to see where automation stops being safe.'
      ],
      facts: [
        'The system is named.',
        'Ticket volume and team size are in view.',
        'You still need the handoff trigger.'
      ],
      recover: [
        'I am asking because the handoff point usually tells us where the cost lives.',
        'If your current setup is working well, that is useful for me to know too.',
        'Help me get one concrete picture of the workflow before I show anything.'
      ],
      leave: [
        'Get ticket volume or a real estimate.',
        'Get the handoff trigger.',
        'Know who owns the queue.'
      ]
    },
    {
      id: '3',
      n: '03',
      t: 'Pain and consequence',
      say: 'Where does the current setup start hurting: speed, cost, quality, burnout, or all of the above?',
      replies: [
        { tone: 'green', meta: 'Concrete pain', quote: '"Escalations destroy response time and supervisors end up triaging all day."' },
        { tone: 'orange', meta: 'Soft pain', quote: '"It is not terrible. We just know it could be better."' },
        { tone: 'red', meta: 'No pain', quote: '"Honestly, support is not our biggest problem right now."' }
      ],
      next: [
        'What does that cost you in practice today: money, time, service quality, or team bandwidth?',
        'If that stayed exactly the same for six months, what would get worse?',
        'If it is not creating a real consequence, tell me now so we do not force it.'
      ],
      facts: [
        'A pain pattern is named or absent.',
        'You still need the consequence.',
        'You need to know who feels it.'
      ],
      recover: [
        'Let me narrow it down. Which part hurts most today: cost, speed, or quality?',
        'I do not need every pain point. I need the one that actually matters.',
        'If this is not painful enough to move, that is the answer too.'
      ],
      leave: [
        'Name one painful consequence.',
        'Tie it to a team or leader.',
        'Do not move on with generic pain.'
      ]
    },
    {
      id: '4',
      n: '04',
      t: 'Trigger and urgency',
      say: 'What changed recently that made this worth looking at now?',
      replies: [
        { tone: 'green', meta: 'Real trigger', quote: '"Ticket volume jumped after a new product launch."' },
        { tone: 'orange', meta: 'Ambient interest', quote: '"We are exploring this as part of a general efficiency push."' },
        { tone: 'red', meta: 'No trigger', quote: '"Nothing really changed. We are just browsing."' }
      ],
      next: [
        'What happened that pushed this from a background idea onto the calendar?',
        'Was there a spike, a miss, a launch, or an executive ask behind this?',
        'If nothing changed, that is fine. I just need to know whether this is active or exploratory.'
      ],
      facts: [
        'Urgency is real, soft, or absent.',
        'You still need the forcing event.',
        'You need to know whether this call deserves momentum.'
      ],
      recover: [
        'I am not looking for the perfect story. I am looking for the thing that made this meeting happen now.',
        'If this is just early curiosity, say that and we can treat it that way.',
        'What would have to happen for this to become urgent?'
      ],
      leave: [
        'Name the trigger.',
        'Separate active urgency from ambient interest.',
        'Know whether this deserves a next step.'
      ]
    },
    {
      id: '5',
      n: '05',
      t: 'Stakeholder and ownership',
      say: 'Who actually owns this pain today, and who would own the change if this became real?',
      replies: [
        { tone: 'green', meta: 'Clear owner', quote: '"The VP of Support owns the queue problem, but IT would own the system change."' },
        { tone: 'orange', meta: 'Blurry owner', quote: '"It touches a few teams, so ownership is shared."' },
        { tone: 'red', meta: 'Wrong person', quote: '"I do not own this. I was asked to explore."' }
      ],
      next: [
        'Who feels this problem day to day, and who would have to bless a fix?',
        'Who owns the queue now, and who would own the system decision?',
        'If this is really someone else’s problem, who is the person we should bring in next?'
      ],
      facts: [
        'The pain owner may differ from the system owner.',
        'A real next step depends on the right human.',
        'Shared ownership usually means weak momentum.'
      ],
      recover: [
        'Let us split this up. Who lives with the problem, and who signs off on change?',
        'I do not need the full org chart. I need the people who matter to this decision.',
        'If you are not the owner, help me name the owner.'
      ],
      leave: [
        'Name the pain owner.',
        'Name the decision owner.',
        'Know whether the right person is in the room.'
      ]
    },
    {
      id: '6',
      n: '06',
      t: 'Proof threshold',
      say: 'What would they need to believe before movement feels safe enough to earn?',
      replies: [
        { tone: 'green', meta: 'Proof named', quote: '"We would need to see real deflection quality on our own ticket mix."' },
        { tone: 'orange', meta: 'Loose proof', quote: '"A demo would help, maybe some examples."' },
        { tone: 'red', meta: 'Premature proof', quote: '"Can you just show me the best case study now?"' }
      ],
      next: [
        'Before this could move, what would your team need to see to believe it is safe and worth it?',
        'Would that proof need to be a live workflow, your own ticket mix, or a reference from someone like you?',
        'When you ask for proof this early, what concern are you actually trying to reduce?'
      ],
      facts: [
        'They need some form of proof before moving.',
        'You need to know what kind of proof matters.',
        'Early proof requests usually hide a real concern.'
      ],
      recover: [
        'Happy to get there. First tell me what you would need proof of so I show the right thing.',
        'Do you need to believe this works, or that it is safe to buy?',
        'I would rather answer the real concern than guess at the wrong demo.'
      ],
      leave: [
        'Name the proof they need.',
        'Know whether the ask is operational, technical, or political.',
        'Do not show generic proof if the concern is specific.'
      ]
    },
    {
      id: '7',
      n: '07',
      t: 'Current vendor and displacement',
      say: 'What have they tried already, and what still keeps the status quo alive?',
      replies: [
        { tone: 'green', meta: 'Status quo named', quote: '"Intercom plus internal macros works well enough that no one wants migration pain."' },
        { tone: 'orange', meta: 'Partial answer', quote: '"We have explored a few tools, but nothing serious."' },
        { tone: 'red', meta: 'Incumbent shield', quote: '"We are pretty bought into our current vendor."' }
      ],
      next: [
        'What is good enough about the current setup that it keeps winning?',
        'What have you already tried, and why did it stall or fall short?',
        'If switching pain is the real blocker, where would that show up first?'
      ],
      facts: [
        'The status quo has a defense.',
        'You need the switching cost.',
        'You need to know what they will protect.'
      ],
      recover: [
        'I am not assuming your current setup is bad. I am trying to see what keeps it in place.',
        'What would be hardest to unwind if you changed course?',
        'If the incumbent is strong, where do they still fall short?'
      ],
      leave: [
        'Know what they like about the current path.',
        'Know what they already tried.',
        'Know whether displacement is realistic.'
      ]
    },
    {
      id: '8',
      n: '08',
      t: 'Decision architecture',
      say: 'If this became real, what would the decision path actually look like?',
      replies: [
        { tone: 'green', meta: 'Path visible', quote: '"Support would shortlist, IT would review, and procurement would join only after security."' },
        { tone: 'orange', meta: 'Path fuzzy', quote: '"We would probably loop in a few people after this."' },
        { tone: 'red', meta: 'Path blocked', quote: '"Honestly, I do not know how this would get approved."' }
      ],
      next: [
        'If this became real, what meetings and approvals would actually happen after this one?',
        'Who says yes, who can stall it, and who needs to feel safe before it moves?',
        'If you are not sure yet, what is your best guess about how decisions like this usually get made there?'
      ],
      facts: [
        'You need the real approval path, not the hopeful one.',
        'Stall points matter as much as approvers.',
        'A vague path weakens the next step.'
      ],
      recover: [
        'I do not need the entire process. I need the next two gates.',
        'Who would have to be comfortable before this could move at all?',
        'What usually slows a decision like this down there?'
      ],
      leave: [
        'Map the next gates.',
        'Know who can stall the deal.',
        'Do not assume a healthy path if the buyer cannot name it.'
      ]
    },
    {
      id: '9',
      n: '09',
      t: 'Next-step lock',
      say: 'What is the next review worth taking, and who must be there?',
      replies: [
        { tone: 'green', meta: 'Concrete next step', quote: '"Let us bring in our VP of Support next Thursday with the systems lead."' },
        { tone: 'orange', meta: 'Loose next step', quote: '"Send something over and we will circle back."' },
        { tone: 'red', meta: 'No step', quote: '"We are not ready for a next meeting yet."' }
      ],
      next: [
        'What is the next conversation worth taking, and who needs to be in it for it to matter?',
        'Can we put a date on that now so this does not turn into loose follow-up?',
        'If we are not ready for a next step, what is still missing that would make a next meeting worthwhile?'
      ],
      facts: [
        'A real next step has a date, people, and a purpose.',
        'Loose follow-up is not a next step.',
        'No next step may simply mean the call is not ready.'
      ],
      recover: [
        'Rather than send something broad, what would make the next meeting real and useful?',
        'Who else has to be in the room for the next step to count?',
        'If we are not ready to lock a date, what is the missing piece?'
      ],
      leave: [
        'Get a date if the call deserves one.',
        'Name the attendees.',
        'Know what the next review is supposed to accomplish.'
      ]
    },
    {
      id: '10',
      n: '10',
      t: 'Post-call routing',
      say: 'What belongs in Deal Workspace, what stays in Call Planner, and what belongs in Future Autopsy?',
      replies: [
        { tone: 'green', meta: 'Clean handoff', quote: '"Deal notes go to the workspace, the forcing question goes to call planning, and the risk pattern goes to autopsy."' },
        { tone: 'orange', meta: 'Messy handoff', quote: '"We would need to clean up notes first."' },
        { tone: 'red', meta: 'No handoff', quote: '"We do not really document this consistently."' }
      ],
      next: [
        'What do you want captured from this call so the next conversation starts sharper, not colder?',
        'What should go into the deal notes, and what belongs as the next forcing question?',
        'What is the one missing truth we need to carry forward before the next room takes over?'
      ],
      facts: [
        'Only earned truth should travel forward.',
        'The next room needs one forcing question.',
        'Messy notes weaken the handoff.'
      ],
      recover: [
        'Let us keep this simple. What are the three things the next room must know?',
        'What is still missing that the next room needs to chase down?',
        'If you handed this call to another rep, what would they absolutely need?'
      ],
      leave: [
        'Write the handoff in plain language.',
        'Separate what is known from what is missing.',
        'Do not dump raw notes into the next room.'
      ]
    }
  ]
};
