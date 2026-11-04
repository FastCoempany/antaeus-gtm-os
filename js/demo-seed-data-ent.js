/*
 * Luca demo dataset — ENTERPRISE book (Elena Vasquez, $2MM quota).
 * Plan: deliverables/plans/antaeus-demo-seed-luca-plan-2026-07-16.md
 *
 * The company that bought Antaeus: Luca Industries, Inc. — 7 years old,
 * $100MM ARR, AI talent platform (sourcing, AI screening, hiring
 * analytics), HQ Chicago. This file is one seller's book: 29 household-
 * name enterprises ($1B–$100B revenue, figures from public sources).
 *
 * The hybrid people rule (founder-locked): real executives appear ONLY
 * inside factual signal text citing real public events. Every contact,
 * champion, stakeholder, pilot participant, and favor target is a
 * FICTIONAL person carrying an accurate title. Fictional people hold
 * VP/Director-level seats (never a singular C-seat a real person holds).
 * Dates are relative to seed time so the demo never goes stale.
 */
(function(){
function d(n){return new Date(Date.now()-n*86400000).toISOString()}
function dd(n){return d(n).slice(0,10)}

var A=function(id,name,ticker,industry,sector,revenue,employees,hq,domain,heat,signals){
  return {id:id,name:name,ticker:ticker,industry:industry,sector:sector,revenue:revenue,
    employees:employees,hq:hq,domain:domain,origin:'seed',fortune_rank:null,_heat:heat,signals:signals};
};
var S=function(id,cat,headline,detail,why,source,ago,conf,ai){
  return {id:id,cat:cat,headline:headline,detail:detail,why_it_matters:why,source_name:source,
    published_date:d(ago),fetched_at:d(Math.max(1,ago-2)),confidence:conf,is_ai:!!ai,status:conf>=0.8?'verified':'unverified'};
};

// ── ACCOUNTS — 29 household names, real public hiring facts ──────────
var accts=[
A('sc_e_boeing','Boeing','BA','Aerospace / Manufacturing','Industrial','$89.5B','170,000','Arlington, VA','boeing.com',93,[
  S('sig_bo_1','expansion','Rebuilding the production workforce after the 2024 machinist strike — thousands of factory hires as 737 output climbs',
    'The strike ended in November 2024; production recovery means sustained high-volume hiring for machinists, quality inspectors, and trainers across Renton and Everett.',
    'Volume hiring under safety scrutiny is exactly the screening problem Luca solves — every factory hire is now a quality decision.',
    'Reuters',7,0.93,false),
  S('sig_bo_2','leadership','Chief HR Officer Uma Amuluru is public about tying workforce quality to the safety turnaround',
    'People leadership is presenting hiring and training quality as part of the company\'s safety and culture reset.',
    'When the head of HR is publicly tied to hiring quality, recruiting tools are more likely to get executive attention and budget.',
    'Company statements',18,0.85,false),
  S('sig_bo_3','pain_point','Training and onboarding pipeline strained — new production hires need months before full certification',
    'Public reporting on the production ramp notes the bottleneck has moved from hiring to screening and readiness.',
    'Their problem is screening quality, not applicant volume. Open with how quickly new hires become fully certified, not with time-to-hire.',
    'Trade press',11,0.78,true),
  S('sig_bo_4','expansion','Defense and space units hiring in parallel with commercial recovery',
    'Multiple divisions competing for the same engineering and skilled-trade candidates.',
    'Because divisions compete for the same candidates, one shared screening tool is a cost-saving case the CFO will listen to.',
    'Company careers data',16,0.72,true)]),
A('sc_e_starbucks','Starbucks','SBUX','Food Service / Retail','Consumer','$37.2B','360,000','Seattle, WA','starbucks.com',88,[
  S('sig_sb_1','ai_transformation','"Back to Starbucks" turnaround includes additional barista staffing in stores',
    'Real 2025 move: $500M+ added labor hours across US cafes under the Green Apron staffing model — the largest store-staffing investment in company history.',
    'A company re-investing in frontline headcount at this scale needs screening that keeps quality up while volume climbs.',
    'Earnings call',14,0.9,false),
  S('sig_sb_2','leadership','Chief Partner Officer Sara Kelly is running the largest frontline people org in food service through a turnaround',
    'People leadership is central to the turnaround narrative — "partners" are the strategy.',
    'The HR team has board-level attention right now, which makes this a good quarter to get a meeting with them.',
    'Public statements',21,0.84,false),
  S('sig_sb_3','pain_point','Corporate restructuring in 2025 cut support roles while store hiring continued',
    'Two rounds of corporate cuts in 2025; frontline hiring kept running through both.',
    'They have fewer recruiting support staff and the same store hiring volume, so recruiters are doing more with less. That is where automation helps.',
    'News coverage',24,0.8,false)]),
A('sc_e_united','United Airlines','UAL','Aviation','Transportation','$57.1B','100,000+','Chicago, IL','united.com',85,[
  S('sig_ua_1','expansion','Hiring plan ran to roughly 10,000 people in 2024 — pilot classes paused and restarted on Boeing delivery delays',
    'Real 2024 events: pilot-hiring classes paused in spring, then resumed; the year still landed near 10,000 hires including 800+ pilots.',
    'They hire seasonal volume into safety-critical roles, so screening has to be both fast and accurate.',
    'Company announcements',9,0.9,false),
  S('sig_ua_2','pain_point','Flight-attendant applications outnumber seats by more than 50 to 1',
    'Cabin-crew openings draw enormous applicant pools; screening the funnel is the bottleneck, not filling it.',
    'With more than 50 applicants per seat, their recruiters cannot read every application. That is the case for AI screening.',
    'Industry reporting',16,0.8,false)]),
A('sc_e_openai','OpenAI','','AI / Research','Technology','$20B+ run rate','3,000+','San Francisco, CA','openai.com',91,[
  S('sig_oa_1','expansion','Headcount roughly tripled through 2024–2025 as the company scaled past 3,000 people',
    'One of the fastest-growing companies on earth; hiring across research, applied, go-to-market, and infrastructure.',
    'They are hiring engineers very fast with a very high bar, so the number of applicants they can screen limits how fast they can hire.',
    'Public reporting',12,0.88,false),
  S('sig_oa_2','competitive','High competition for AI talent with Meta and other labs, with unusually strong pressure on recruiting and retention',
    'Public 2025 poaching battles put recruiting operations under a spotlight; every candidate touch matters.',
    'When rivals compete for the same people, the company that gets from application to offer fastest usually makes the hire. That is our pitch.',
    'News coverage',20,0.85,false),
  S('sig_oa_3','leadership','New Chief People Officer arrived in February 2026 — Arvind KC, ex-Roblox, owning recruiting and onboarding',
    'Real appointment after the prior people chief left mid-talent-war; recruiting now has a fresh executive owner.',
    'A new head of people hired to scale recruiting is the best person to approach. New executives often review their tools in the first 90 days.',
    'News coverage',45,0.88,false),
  S('sig_oa_4','expansion','Dozens of recruiting and people-ops roles open this month as the new people chief builds out the function',
    'Their own postings show the people org scaling under new leadership.','The team that would buy Luca is being hired right now.','Company careers data',3,0.78,true)]),
A('sc_e_nordstrom','Nordstrom','JWN','Retail','Consumer','$15B','55,000','Seattle, WA','nordstrom.com',79,[
  S('sig_no_1','expansion','Seasonal ramp — tens of thousands of holiday hires across stores and fulfillment every year',
    'Their own annual filing puts the workforce near 55,000 with about half part-time or seasonal — headcount surges over 5% at holiday and Anniversary Sale peaks.',
    'Seasonal hiring is the most common Luca use case: a short window, a large applicant pool, and quality still matters.',
    'Company announcements',22,0.86,false),
  S('sig_no_2','leadership','Family take-private completed in 2025 — operating priorities reset under private ownership',
    'New ownership structure historically means operating-cost scrutiny and tooling consolidation.',
    'A move to private ownership often reopens vendor decisions that were already settled. It is a good time to approach them, but expect closer cost review.',
    'News coverage',28,0.8,false)]),
A('sc_e_coreweave','CoreWeave','CRWV','AI Infrastructure','Technology','$5.1B','2,200','Livingston, NJ','coreweave.com',82,[
  S('sig_cw_1','expansion','Datacenter buildout across multiple states — thousands of construction, operations, and engineering roles',
    'Real example: the $6B Lancaster, PA datacenter announced in 2025 with ~600 skilled jobs — and company headcount roughly tripled in one year to ~2,200.',
    'Every new site is its own hiring project. A standard screening process can be reused at each site.',
    'Company announcements',10,0.85,false),
  S('sig_cw_2','expansion','Post-IPO scaling — corporate functions growing from startup size to public-company size',
    'G&A and people functions are building out fast behind the revenue curve.',
    'They are building a recruiting team while hiring is at its peak, so they are likely to buy tools rather than add recruiters.',
    'Public filings',18,0.78,true)]),
A('sc_e_chipotle','Chipotle','CMG','Food Service','Consumer','$11.9B','130,000+','Newport Beach, CA','chipotle.com',90,[
  S('sig_cm_1','expansion','Hires ~20,000 every spring for "burrito season" — and already uses an AI recruiting assistant to do it',
    'The annual burrito-season push is public; their AI assistant cut apply-to-start time to about four days.',
    'They already use AI in hiring and know it works, so the conversation is about expanding, not explaining.',
    'Company newsroom',36,0.95,false),
  S('sig_cm_2','leadership','People leadership consolidated — CHRO Ilene Eskenazi took a combined legal + HR role in January 2026',
    'Real, public leadership move; the people org now reports through a single combined chief.',
    'With HR and legal under one leader, there will be fewer and larger decisions. Get into the tools review early.',
    'Company newsroom',54,0.9,false),
  S('sig_cm_3','expansion','Opening 300+ new restaurants a year — each opening is a local hiring wave',
    'Store growth guidance keeps unit hiring constant outside the seasonal peak.',
    'Staffing new stores keeps hiring steady between the spring peaks.',
    'Earnings call',15,0.85,false)]),
A('sc_e_deel','Deel','','HR Tech / Global Employment','Technology','$1B+ ARR','10,800+','San Francisco, CA','deel.com',86,[
  S('sig_dl_1','expansion','Passed $1B ARR in 2025; workforce grew ~18% year over year to nearly 11,000 people across 100+ countries',
    'Company-reported growth; hiring runs continuously across every region.',
    'Hiring this fast across 100+ countries makes it hard to screen consistently, and they deal with that every week.',
    'Company announcements',27,0.9,false),
  S('sig_dl_2','leadership','Senior leadership wave through 2025 — new president/CFO and a build-out of operations leadership',
    'Public appointments as the company scales toward IPO readiness.',
    'New operating leaders often review the tools they inherited, and they may bring new budget.',
    'Company blog',26,0.85,false)]),
A('sc_e_databricks','Databricks','','AI / Data Software','Technology','$5.4B run rate','8,000+','San Francisco, CA','databricks.com',80,[
  S('sig_db_1','expansion','Multi-billion-dollar funding rounds bankrolling an aggressive hiring plan across engineering and go-to-market',
    'Real 2025 facts: hiring three times as many new grads as the prior year, and growing India headcount 50%+ with 100+ new R&D engineers in Bengaluru.',
    'Their applicant volume is growing faster than their recruiting team. This is common for companies preparing to go public.',
    'News coverage',16,0.87,false),
  S('sig_db_2','competitive','Competing for the same AI engineers as the research labs — offer velocity is a recruiting weapon',
    'The AI talent market rewards whoever gets from application to offer fastest.',
    'Time to offer depends on how their hiring process runs, so show it in a live demo rather than on slides.',
    'Industry reporting',21,0.75,true)]),
A('sc_e_delta','Delta Air Lines','DAL','Aviation','Transportation','$61.6B','100,000','Atlanta, GA','delta.com',74,[
  S('sig_da_1','expansion','Summer operation running at record scale — frontline hiring across airports and reservations continues',
    'Real events: flight-attendant applications opened for the 2025 and 2026 class years, across nine languages, ahead of record schedules.',
    'They hire at steady volume for a premium brand, and they describe quality of hire as what sets them apart.',
    'Company announcements',13,0.82,false),
  S('sig_da_2','leadership','People leadership handed over — a longtime chief people officer retired and a successor took the org',
    'Real transition announced October 2024; the people org has a newer executive owner reviewing the stack.',
    'Screening a huge applicant pool to hire very few people is expensive. Open with their cost per hire.',
    'Industry reporting',26,0.75,true)]),
A('sc_e_marriott','Marriott International','MAR','Hospitality','Consumer Services','$25B','400,000+','Bethesda, MD','marriott.com',77,[
  S('sig_ma_1','leadership','Named a top-10 Fortune Best Workplace in 2026 — people-first positioning ahead of its 100th anniversary',
    'Real 2026 recognition; the company markets its people culture as a competitive edge.',
    'A company known for how it treats employees protects that reputation in hiring. Candidate experience gets board attention here.',
    'Fortune / Great Place to Work',32,0.9,false),
  S('sig_ma_2','expansion','Property pipeline keeps adding hotels — every opening staffs up through a local hiring wave',
    'Global unit growth translates to constant property-level hiring across hundreds of markets.',
    'They run hundreds of small hiring processes under one brand standard. Consistent screening is what we sell them.',
    'Public filings',20,0.8,false)]),
A('sc_e_hilton','Hilton','HLT','Hospitality','Consumer Services','$11B','180,000+','McLean, VA','hilton.com',58,[
  S('sig_hi_1','expansion','Record hotel pipeline — property openings drive continuous frontline hiring',
    'Unit growth publicly guides to hundreds of openings a year worldwide.',
    'They hire the same way as Marriott, and the two companies compare themselves to each other. A win at one helps sell the other.',
    'Public filings',22,0.78,false)]),
A('sc_e_uber','Uber','UBER','Marketplace / Technology','Technology','$44B','30,000+','San Francisco, CA','uber.com',62,[
  S('sig_ub_1','leadership','People org consolidated in 2026 — HR now reports through a single corporate-affairs president',
    'Real 2026 change: the chief people officer departed and the function was consolidated.',
    'Changes at the top of HR often reopen decisions about the tools the HR team uses.',
    'News coverage',20,0.82,false)]),
A('sc_e_fedex','FedEx','FDX','Logistics','Transportation','$88B','500,000+','Memphis, TN','fedex.com',64,[
  S('sig_fx_1','expansion','Peak-season hiring runs to tens of thousands of package handlers and drivers every year',
    'The annual peak wave is one of the largest seasonal hiring events in the country.',
    'They screen hundreds of thousands of seasonal applicants with only days to hire, so screening speed matters most.',
    'Company announcements',23,0.85,false),
  S('sig_fx_2','pain_point','European restructuring cut back-office roles while frontline hiring continued',
    'Real 2024 cuts of up to 2,000 European back-office roles under the cost program.',
    'Smaller support teams with the same frontline hiring volume is where automation becomes worth discussing.',
    'CNBC',42,0.8,false)]),
A('sc_e_workday','Workday','WDAY','HR Technology','Technology','$8B','18,000+','Pleasanton, CA','workday.com',68,[
  S('sig_wd_1','ai_transformation','2025 restructuring cut ~1,750 roles while the company kept hiring for AI positions',
    'Real February 2025 event: 8.5% reduction paired with explicit AI-hiring intent.',
    'An HR-tech company reorganizing its own workforce around AI is a good candidate to buy AI tools for its own hiring.',
    'News coverage',45,0.85,false)]),
A('sc_e_adp','ADP','ADP','HR Technology','Technology','$20.6B','60,000+','Roseland, NJ','adp.com',52,[
  S('sig_ad_1','expansion','Steady internal hiring at one of the largest HR employers — plus a partner channel Luca could ride',
    'ADP hires at scale for its own operations and sells into every HR department in America.',
    'They could be both a customer and a reseller partner. Start with their internal recruiting team.',
    'Public filings',28,0.72,true)]),
A('sc_e_dayforce','Dayforce','DAY','HR Technology','Technology','$1.8B','9,000+','Minneapolis, MN','dayforce.com',48,[
  S('sig_df_1','expansion','Post-rebrand growth hiring across product and go-to-market',
    'The Ceridian-to-Dayforce rebrand came with public growth targets.',
    'Growth hiring inside an HR software company. They know this product category well, so the demo has to be precise.',
    'Public filings',33,0.7,true)]),
A('sc_e_paycom','Paycom','PAYC','HR Technology','Technology','$1.9B','7,000+','Oklahoma City, OK','paycom.com',45,[
  S('sig_pc_1','expansion','Sales organization recruits and trains hundreds of representatives each year',
    'Paycom\'s sales-hiring engine is a known quantity in the HR-tech industry.',
    'They hire many salespeople and many do not last, so better screening directly affects their revenue.',
    'Industry reporting',30,0.7,true)]),
A('sc_e_randstad','Randstad','RAND.AS','Global Staffing','Services','$26B','40,000+','Diemen, Netherlands','randstad.com',71,[
  S('sig_rs_1','ai_transformation','World\'s largest staffing firm — screening volume IS the product, and AI screening is the industry\'s live debate',
    'Randstad places hundreds of thousands of workers; every placement is a screen.',
    'If Luca works at staffing-firm scale, this is the largest possible account. Expect a long sales cycle for a very large deal.',
    'Industry reporting',24,0.75,true)]),
A('sc_e_nike','Nike','NKE','Apparel / Retail','Consumer','$51B','80,000','Beaverton, OR','nike.com',66,[
  S('sig_nk_1','leadership','New CHRO took the people org in January 2025 as part of the broader turnaround',
    'Real appointment: a new executive VP and chief human resources officer joined with the CEO reset.',
    'A new head of HR during a turnaround usually leads to a review of HR tools.',
    'Company announcements',52,0.85,false),
  S('sig_nk_2','expansion','Retail, corporate, and supply-chain funnels all hire on different rhythms',
    'Three very different hiring processes inside one company.',
    'One platform for all three hiring processes means fewer tools, which their CFO is likely to welcome.',
    'Public filings',27,0.7,true)]),
A('sc_e_gap','Gap Inc.','GAP','Retail','Consumer','$15B','80,000+','San Francisco, CA','gapinc.com',60,[
  S('sig_gp_1','leadership','Chief People Officer Amy Thompson has been rebuilding the people org since early 2024',
    'Real appointment under the current CEO; people leadership is part of the brand turnaround.',
    'A rebuilt HR team picks its own tools, and those choices are still open while the tools are new.',
    'PR Newswire',48,0.85,false),
  S('sig_gp_2','expansion','Four brands share one seasonal frontline hiring engine',
    'Old Navy, Gap, Banana Republic, and Athleta hire into the same holiday peaks.',
    'Four brands hiring for the same peaks need shared screening standards, which makes the case for one platform.',
    'Company careers data',26,0.72,true)]),
A('sc_e_bestbuy','Best Buy','BBY','Retail','Consumer','$42B','85,000','Richfield, MN','bestbuy.com',56,[
  S('sig_bb_1','leadership','Executive team restructured in mid-2026 around the incoming CEO',
    'Real July 2026 announcement — five executives in new roles as the CEO transition lands.',
    'Leadership changes often lead to reviews of department tools within two quarters.',
    'Company newsroom',10,0.85,false)]),
A('sc_e_ulta','Ulta Beauty','ULTA','Retail','Consumer','$11.3B','55,000','Bolingbrook, IL','ulta.com',54,[
  S('sig_ul_1','expansion','Store-count growth keeps a standing hiring engine running',
    'New stores and services expansion staff up continuously.',
    'Store hiring where the customer experience depends on who they hire, at retail pay levels.',
    'Public filings',28,0.72,true)]),
A('sc_e_dicks','Dick\'s Sporting Goods','DKS','Retail','Consumer','$13.4B','50,000+','Coraopolis, PA','dicks.com',50,[
  S('sig_dk_1','expansion','House of Sport expansion — bigger-format stores with bigger staffing needs',
    'Each House of Sport conversion roughly doubles the store team.',
    'Format conversions are scheduled hiring waves you can plan outreach around.',
    'Public filings',26,0.72,true)]),
A('sc_e_southwest','Southwest Airlines','LUV','Aviation','Transportation','$27.5B','70,000+','Dallas, TX','southwest.com',57,[
  S('sig_sw_1','pain_point','Efficiency program has slowed hiring — every open seat now gets more scrutiny',
    'Cost pressure means fewer, more careful hires.',
    'When hiring slows, each hire matters more, so screening quality matters more. Same product, different pitch.',
    'Earnings call',22,0.75,true)]),
A('sc_e_jetblue','JetBlue','JBLU','Aviation','Transportation','$9.3B','22,000','Long Island City, NY','jetblue.com',46,[
  S('sig_jb_1','pain_point','Leaner TA team than the majors — automation carries further here',
    'A smaller airline runs the same regulated hiring processes with a fraction of the recruiting staff.',
    'With a small team, one platform seat covers work they cannot hire people to do.',
    'Industry reporting',28,0.68,true)]),
A('sc_e_airbnb','Airbnb','ABNB','Marketplace / Technology','Technology','$11.1B','7,000','San Francisco, CA','airbnb.com',44,[
  S('sig_ab_1','pain_point','Famously selective hiring — small volumes, extreme bar',
    'Airbnb hires few and screens hard.',
    'They hire few people with a high bar, which tests our screening quality. A win here would make a strong reference customer.',
    'Public statements',30,0.65,true)]),
A('sc_e_spotify','Spotify','SPOT','Media / Technology','Technology','$17B','7,400','Stockholm, Sweden','spotify.com',42,[
  S('sig_sp_1','expansion','Distributed-team hiring across markets after the efficiency years',
    'Hiring resumed selectively post-2023 cuts, spread across global hubs.',
    'They hire in many locations with one central HR team, so a tool for consistent screening fits.',
    'Public filings',32,0.65,true)]),
A('sc_e_palantir','Palantir','PLTR','AI / Software','Technology','$2.9B','4,000','Denver, CO','palantir.com',59,[
  S('sig_pl_1','leadership','Runs a fellowship recruiting high-school graduates straight into the company — screening culture unlike anyone else\'s',
    'Real program: a paid fellowship for recent grads with high test scores, hired after a four-month trial.',
    'A company that redesigned its own hiring process is likely to take a meeting about hiring tools. Come with a clear point of view.',
    'News coverage',28,0.85,false)]),
A('sc_e_paycom_x','Uber Freight','','Logistics / Technology','Technology','$5B','','Chicago, IL','uberfreight.com',0,[])
];
// Note: the 29th slot above is intentionally inert (heat 0, no signals) —
// it stands for the operator's own hand-add lane; keep list length honest.
accts=accts.filter(function(a){return a.id!=='sc_e_paycom_x'});

// ── LUCA'S BENCH — all fictional (the hybrid rule) ────────────────────
var advisors=[
  {id:'adv_l1',name:'Priya Raghavan',title:'Board Partner, Halcyon Ridge Ventures (Series C lead)',tier:'t1',expertise:'Enterprise software GTM',equity:'Board seat',companies:['Boeing','Starbucks'],relationship:'active',createdAt:d(400)},
  {id:'adv_l2',name:'Tom Calloway',title:'Former CHRO, Fortune 100 retailer (advisor)',tier:'t2',expertise:'Enterprise people organizations',equity:'0.4% advisor shares',companies:['Nordstrom','Gap Inc.','Best Buy'],relationship:'active',createdAt:d(320)},
  {id:'adv_l3',name:'Dana Whitcomb',title:'VP Talent, Chipotle (happy customer)',tier:'t4',expertise:'Frontline volume hiring',equity:'—',companies:['Chipotle','Starbucks','Marriott International'],relationship:'active',createdAt:d(200)},
  {id:'adv_l4',name:'Marcus Oyelaran',title:'Angel investor, ex-airline operations executive',tier:'t3',expertise:'Aviation operations and unions',equity:'$50K SAFE',companies:['United Airlines','Delta Air Lines','Boeing'],relationship:'active',createdAt:d(280)},
  {id:'adv_l5',name:'Grace Lindqvist',title:'Former VP People Ops, hypergrowth AI lab (advisor)',tier:'t2',expertise:'AI-company hiring at speed',equity:'0.3% advisor shares',companies:['OpenAI','Databricks','CoreWeave'],relationship:'warm',createdAt:d(240)},
  {id:'adv_l6',name:'Rafael Ibanez',title:'Head of Talent Ops, Sweetgreen (happy customer)',tier:'t4',expertise:'Multi-site food-service hiring',equity:'—',companies:['Chipotle','Marriott International'],relationship:'active',createdAt:d(150)}
];

// ── DEALS — 12 live + 3 closed-won + 2 closed-lost ───────────────────
var deals=[
{id:'deal_e_boeing',accountName:'Boeing',value:480000,stage:'negotiation',
 champion:'Karen Mitchell',economicBuyer:'Doug Reyes',useCase:'AI screening across the production-workforce rebuild — machinists, quality inspectors, trainers',
 pain:'Thousands of factory hires under safety scrutiny; screening backlog moved the bottleneck from applications to readiness',
 competition:'HireVue (incumbent for video), Paradox (evaluated)',decisionProcess:'VP TA recommends → SVP People + procurement + security review → CFO signs above $250K',
 nextStep:'Security questionnaire working session with their infosec team',nextStepDate:dd(-3),closeDate:dd(-24),forecastCategory:'bestCase',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Karen Mitchell',role:'champion',title:'VP Talent Acquisition',engaged:true},
  {name:'Doug Reyes',role:'eb',title:'SVP People Operations',engaged:true},
  {name:'Sam Okafor',role:'technical',title:'Director, HRIS & People Systems',engaged:true},
  {name:'Linda Tran',role:'legal',title:'Procurement Manager',engaged:true},
  {name:'Pete Kowalski',role:'end_user',title:'Head of Recruiting Operations',engaged:true}],
 created_at:d(96),updated_at:d(2)},
{id:'deal_e_starbucks',accountName:'Starbucks',value:420000,stage:'proposal',
 champion:'Alicia Fontaine',economicBuyer:'',useCase:'AI-assisted screening for barista applicants as the turnaround adds store staff',
 pain:'Corporate TA support cut while store hiring volume held; store managers screening applicants on instinct',
 competition:'Paradox (strong incumbent relationship in QSR)',decisionProcess:'VP Talent recommends → Partner Resources (HR) leadership approves; procurement review above $300K',
 nextStep:'Proposal review with Partner Resources (HR) leadership',nextStepDate:dd(-6),closeDate:dd(-45),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Alicia Fontaine',role:'champion',title:'VP Talent Acquisition',engaged:true},
  {name:'',role:'eb',title:'',engaged:false},
  {name:'Jerome Bates',role:'technical',title:'Director, People Systems',engaged:true}],
 created_at:d(70),updated_at:d(6)},
{id:'deal_e_united',accountName:'United Airlines',value:380000,stage:'proposal',
 champion:'Rob Vasquez',economicBuyer:'Elaine Porter',useCase:'Faster screening for flight-attendant hiring (50 applicants per seat) and airport operations hiring',
 pain:'Applicant pools outnumber seats 50 to 1; recruiters read a fraction of applications; time-to-offer losing candidates to Delta',
 competition:'HireVue (video incumbent)',decisionProcess:'Managing Director TA owns → VP People approves → IT security review',
 nextStep:'',nextStepDate:'',closeDate:dd(-38),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Rob Vasquez',role:'champion',title:'Managing Director, Talent Acquisition',engaged:true},
  {name:'Elaine Porter',role:'eb',title:'VP People',engaged:false},
  {name:'Dev Ramanathan',role:'technical',title:'Director, HR Technology',engaged:true}],
 created_at:d(64),updated_at:d(16)},
{id:'deal_e_openai',accountName:'OpenAI',value:350000,stage:'evaluation',
 champion:'Mia Kessler',economicBuyer:'Jonah Price',useCase:'Cut recruiter screening hours on the infra-eng funnel without lowering the bar',
 pain:'Screening 400 engineering applicants a week with 3 recruiters; half never get a first review',
 competition:'Build-it-internally (their default instinct)',decisionProcess:'Recruiting leadership pilots → Head of People signs; security review is strict and fast',
 nextStep:'Week-2 pilot check-in with the recruiters using it',nextStepDate:dd(-2),closeDate:dd(-30),forecastCategory:'bestCase',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Mia Kessler',role:'champion',title:'Head of Recruiting Operations',engaged:true},
  {name:'Jonah Price',role:'eb',title:'VP People',engaged:true},
  {name:'Tara Bloom',role:'end_user',title:'Lead Technical Recruiter',engaged:true},
  {name:'Chris Delgado',role:'technical',title:'People-Systems Engineer',engaged:true}],
 created_at:d(50),updated_at:d(1)},
{id:'deal_e_nordstrom',accountName:'Nordstrom',value:260000,stage:'evaluation',
 champion:'Yolanda Pierce',economicBuyer:'',useCase:'Holiday-ramp screening — tens of thousands of seasonal applications in a six-week window',
 pain:'Seasonal funnel breaks their year-round process every October; store managers screen by hand',
 competition:'Paradox (evaluated last year, stalled)',decisionProcess:'VP Talent owns; new private ownership adds a cost-review gate',
 nextStep:'',nextStepDate:'',closeDate:dd(-55),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Yolanda Pierce',role:'champion',title:'VP Talent Acquisition',engaged:true},
  {name:'',role:'eb',title:'',engaged:false}],
 created_at:d(58),updated_at:d(21)},
{id:'deal_e_coreweave',accountName:'CoreWeave',value:220000,stage:'evaluation',
 champion:'Nate Brower',economicBuyer:'Sasha Villanueva',useCase:'One standard screening process reused at each new datacenter site',
 pain:'Every new site rebuilds the hiring funnel from scratch; recruiting team growing slower than the number of sites',
 competition:'',decisionProcess:'Director TA pilots → VP People approves → finance reviews at $200K',
 nextStep:'Scope the two-site screening pilot',nextStepDate:dd(-8),closeDate:dd(-42),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Nate Brower',role:'champion',title:'Director, Talent Acquisition',engaged:true},
  {name:'Sasha Villanueva',role:'eb',title:'VP People',engaged:true},
  {name:'Owen Marsh',role:'end_user',title:'Site Recruiting Lead',engaged:false}],
 created_at:d(44),updated_at:d(4)},
{id:'deal_e_databricks',accountName:'Databricks',value:310000,stage:'discovery',
 champion:'Ingrid Solberg',economicBuyer:'',useCase:'Offer-velocity tooling for the AI-engineer funnel — application to offer in days',
 pain:'Losing candidates to labs that move faster; hiring plan in the thousands with a recruiter team built for hundreds',
 competition:'Internal tooling project (half-built)',decisionProcess:'Recruiting Ops owns evaluation → VP Talent approves',
 nextStep:'Second discovery call — map the offer pipeline end to end',nextStepDate:dd(-4),closeDate:dd(-70),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Ingrid Solberg',role:'champion',title:'Head of Recruiting Operations',engaged:true},
  {name:'',role:'eb',title:'',engaged:false}],
 created_at:d(30),updated_at:d(4)},
{id:'deal_e_delta',accountName:'Delta Air Lines',value:340000,stage:'discovery',
 champion:'Curtis Hale',economicBuyer:'',useCase:'Selective screening at volume — six-figure applicant pools, sub-1% accept rates',
 pain:'Cost per hire climbing as funnels grow; the brand expects a high-quality candidate experience even for the very large number of applicants they turn down',
 competition:'HireVue (entrenched)',decisionProcess:'Not known yet — still finding out who decides',
 nextStep:'Discovery call with recruiting ops',nextStepDate:dd(-9),closeDate:dd(-85),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Curtis Hale',role:'champion',title:'Director, Talent Acquisition Operations',engaged:true}],
 created_at:d(25),updated_at:d(9)},
{id:'deal_e_marriott',accountName:'Marriott International',value:290000,stage:'discovery',
 champion:'Fran Delacroix',economicBuyer:'',useCase:'One brand standard for property-level hiring across hundreds of markets',
 pain:'Every property runs its own funnel; hiring is not consistent from one property to the next',
 competition:'Paradox (QSR-adjacent presence)',decisionProcess:'Global Talent COE evaluates → regional people VPs adopt',
 nextStep:'COE intro meeting',nextStepDate:dd(-11),closeDate:dd(-90),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Fran Delacroix',role:'champion',title:'Senior Director, Global Talent Acquisition',engaged:true}],
 created_at:d(21),updated_at:d(11)},
{id:'deal_e_uber',accountName:'Uber',value:180000,stage:'prospect',
 champion:'',economicBuyer:'',useCase:'Ops + support hiring funnels after the people-org consolidation',
 pain:'People org consolidated under new leadership; their HR tools are being re-evaluated',
 competition:'',decisionProcess:'',
 nextStep:'',nextStepDate:'',closeDate:'',forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,stakeholders:[],
 created_at:d(15),updated_at:d(13)},
{id:'deal_e_fedex',accountName:'FedEx',value:400000,stage:'prospect',
 champion:'',economicBuyer:'',useCase:'Peak-season screening throughput — tens of thousands of handlers in weeks',
 pain:'Peak hiring runs on speed alone; quality misses show up as January attrition',
 competition:'',decisionProcess:'',
 nextStep:'First conversation with TA operations',nextStepDate:dd(-14),closeDate:'',forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,stakeholders:[],
 created_at:d(12),updated_at:d(8)},
{id:'deal_e_bestbuy',accountName:'Best Buy',value:210000,stage:'prospect',
 champion:'',economicBuyer:'',useCase:'Store + seasonal hiring under the new executive team',
 pain:'New leadership team in place; department-level tool reviews expected within two quarters',
 competition:'',decisionProcess:'',
 nextStep:'',nextStepDate:'',closeDate:'',forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,stakeholders:[],
 created_at:d(10),updated_at:d(10)},
// closed-won
{id:'deal_e_chipotle',accountName:'Chipotle',value:310000,stage:'closed-won',
 champion:'Dana Whitcomb',economicBuyer:'Victor Nunez',useCase:'AI screen on the burrito-season funnel — 20,000 spring hires',
 pain:'Seasonal surge screening; apply-to-start time was the constraint',
 competition:'Paradox (incumbent, replaced for screening)',decisionProcess:'VP Talent recommended → SVP People signed → security review passed in 3 weeks',
 nextStep:'',nextStepDate:'',closeDate:dd(88),forecastCategory:'commit',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Dana Whitcomb',role:'champion',title:'VP Talent',engaged:true},
  {name:'Victor Nunez',role:'eb',title:'SVP People',engaged:true},
  {name:'Rosa Camacho',role:'end_user',title:'Recruiting Operations Manager',engaged:true}],
 created_at:d(220),updated_at:d(88)},
{id:'deal_e_deel',accountName:'Deel',value:290000,stage:'closed-won',
 champion:'Petra Novak',economicBuyer:'Ade Bankole',useCase:'Screening consistency across 100+ country funnels',
 pain:'Distributed hiring at 18% annual growth; every region screened differently',
 competition:'Build-internal (they build most things)',decisionProcess:'Head of TA Ops recommended → VP People signed',
 nextStep:'',nextStepDate:'',closeDate:dd(130),forecastCategory:'commit',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Petra Novak',role:'champion',title:'Head of Talent Acquisition Operations',engaged:true},
  {name:'Ade Bankole',role:'eb',title:'VP People',engaged:true}],
 created_at:d(260),updated_at:d(130)},
{id:'deal_e_dayforce',accountName:'Dayforce',value:240000,stage:'closed-won',
 champion:'Miriam Castellanos',economicBuyer:'Hank Prewitt',useCase:'Post-rebrand growth hiring — product + GTM funnels',
 pain:'Growth targets public; TA team flat',
 competition:'None serious — they knew the category',decisionProcess:'VP Talent recommended → CFO org signed',
 nextStep:'',nextStepDate:'',closeDate:dd(175),forecastCategory:'commit',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Miriam Castellanos',role:'champion',title:'VP Talent',engaged:true},
  {name:'Hank Prewitt',role:'eb',title:'SVP Finance',engaged:true}],
 created_at:d(300),updated_at:d(175)},
// closed-lost
{id:'deal_e_palantir',accountName:'Palantir',value:270000,stage:'closed-lost',
 champion:'Silas Grant',economicBuyer:'',useCase:'Screening layer for the fellowship + standard funnels',
 pain:'Unusual screening culture; wanted deep customization',
 competition:'Their own internally built tool',decisionProcess:'Recruiting leadership → security review (never finished)',
 nextStep:'',nextStepDate:'',closeDate:dd(60),forecastCategory:'pipeline',
 lossReason:'no_decision',lossNotes:'Stopped responding after the security review stalled at week 6. Lesson: their security review starts at discovery, not proposal — we scoped it too late. We will not repeat this: the questionnaire conversation now opens in week 1 on any deal with a security gate.',
 stakeholders:[
  {name:'Silas Grant',role:'champion',title:'Head of Talent',engaged:false}],
 created_at:d(150),updated_at:d(60)},
{id:'deal_e_gap',accountName:'Gap Inc.',value:230000,stage:'closed-lost',
 champion:'Odette Marchand',economicBuyer:'',useCase:'Four-brand seasonal screening consolidation',
 pain:'Multi-brand funnels, shared peaks',
 competition:'Incumbent ATS add-on (won)',decisionProcess:'CPO org evaluated → chose the incumbent\'s bundled module',
 nextStep:'',nextStepDate:'',closeDate:dd(40),forecastCategory:'pipeline',
 lossReason:'competitor',lossNotes:'Lost to the incumbent ATS\'s bundled screening add-on on price and procurement ease. The champion agreed our product was better, but the bundle needed only one signature. Lesson: when the incumbent bundles a screening add-on, we sell the difference in hiring results, not features, and we reach the person who signs before renewal season.',
 stakeholders:[
  {name:'Odette Marchand',role:'champion',title:'Senior Director, Talent Acquisition',engaged:true}],
 created_at:d(120),updated_at:d(40)}
];

var stageHistory={};
stageHistory['deal_e_boeing']=[{from:'',to:'prospect',at:d(96)},{from:'prospect',to:'discovery',at:d(80)},{from:'discovery',to:'evaluation',at:d(55)},{from:'evaluation',to:'proposal',at:d(34)},{from:'proposal',to:'negotiation',at:d(18)}];
stageHistory['deal_e_starbucks']=[{from:'',to:'prospect',at:d(70)},{from:'prospect',to:'discovery',at:d(58)},{from:'discovery',to:'evaluation',at:d(38)},{from:'evaluation',to:'proposal',at:d(14)}];
stageHistory['deal_e_united']=[{from:'',to:'prospect',at:d(64)},{from:'prospect',to:'discovery',at:d(50)},{from:'discovery',to:'evaluation',at:d(33)},{from:'evaluation',to:'proposal',at:d(16)}];
stageHistory['deal_e_openai']=[{from:'',to:'prospect',at:d(50)},{from:'prospect',to:'discovery',at:d(40)},{from:'discovery',to:'evaluation',at:d(22)}];
stageHistory['deal_e_nordstrom']=[{from:'',to:'prospect',at:d(58)},{from:'prospect',to:'discovery',at:d(45)},{from:'discovery',to:'evaluation',at:d(28)}];
stageHistory['deal_e_coreweave']=[{from:'',to:'prospect',at:d(44)},{from:'prospect',to:'discovery',at:d(32)},{from:'discovery',to:'evaluation',at:d(15)}];
stageHistory['deal_e_databricks']=[{from:'',to:'prospect',at:d(30)},{from:'prospect',to:'discovery',at:d(18)}];
stageHistory['deal_e_delta']=[{from:'',to:'prospect',at:d(25)},{from:'prospect',to:'discovery',at:d(14)}];
stageHistory['deal_e_marriott']=[{from:'',to:'prospect',at:d(21)},{from:'prospect',to:'discovery',at:d(12)}];
stageHistory['deal_e_uber']=[{from:'',to:'prospect',at:d(15)}];
stageHistory['deal_e_fedex']=[{from:'',to:'prospect',at:d(12)}];
stageHistory['deal_e_bestbuy']=[{from:'',to:'prospect',at:d(10)}];
stageHistory['deal_e_chipotle']=[{from:'',to:'prospect',at:d(220)},{from:'prospect',to:'discovery',at:d(195)},{from:'discovery',to:'evaluation',at:d(160)},{from:'evaluation',to:'proposal',at:d(125)},{from:'proposal',to:'negotiation',at:d(105)},{from:'negotiation',to:'closed-won',at:d(88)}];
stageHistory['deal_e_deel']=[{from:'',to:'prospect',at:d(260)},{from:'prospect',to:'discovery',at:d(230)},{from:'discovery',to:'evaluation',at:d(195)},{from:'evaluation',to:'proposal',at:d(165)},{from:'proposal',to:'negotiation',at:d(148)},{from:'negotiation',to:'closed-won',at:d(130)}];
stageHistory['deal_e_dayforce']=[{from:'',to:'prospect',at:d(300)},{from:'prospect',to:'discovery',at:d(270)},{from:'discovery',to:'evaluation',at:d(235)},{from:'evaluation',to:'proposal',at:d(205)},{from:'proposal',to:'closed-won',at:d(175)}];
stageHistory['deal_e_palantir']=[{from:'',to:'prospect',at:d(150)},{from:'prospect',to:'discovery',at:d(125)},{from:'discovery',to:'evaluation',at:d(95)},{from:'evaluation',to:'closed-lost',at:d(60)}];
stageHistory['deal_e_gap']=[{from:'',to:'prospect',at:d(120)},{from:'prospect',to:'discovery',at:d(95)},{from:'discovery',to:'evaluation',at:d(68)},{from:'evaluation',to:'closed-lost',at:d(40)}];

window.__LUCA_SEED__=window.__LUCA_SEED__||{};
window.__LUCA_SEED__.ent={
  operator:{name:'Elena Vasquez',email:'elena@lucaindustries.com',role:'Enterprise Account Executive'},
  seed:{annual_quota:2000000,avg_deal_size:280000,win_rate:22,touch_to_meeting:2,show_rate:80,cycle_days:150,coverage_target:3.5,acv_band:'enterprise'},
  quotaTargets:{annual_quota:2000000,monthly_target:166667,touches_day:19,meetings_week:4,opps_quarter:8,deals_quarter:2,coverage_target:3.5},
  playbook:{company:'Luca Industries',stage:'Growth · $100MM ARR',acv:280000,fields:{
    value_prop:'Luca cuts time-to-hire roughly in half by putting an AI screen in front of every funnel — sourcing, screening, and interview intelligence in one platform',
    ideal_customer:'US enterprises with standing high-volume hiring — frontline ramps, seasonal surges, or engineering wars — where the VP of Talent Acquisition owns time-to-hire and screen quality',
    sales_motion:'Outreach based on public hiring news → discovery → screening pilot on one active hiring process → security review → contract',
    competitive_advantage:'Screening models trained on hiring outcomes, not generic language models. Pilots run for two weeks on one of their active hiring processes, so the buyer sees their own numbers change.',
    key_objection:'"We already have an ATS with a screening add-on" — our answer: the add-on covers the requirement, Luca improves the hiring numbers. We work on top of every major ATS, and the pilot shows the difference on their own hiring data.',
    champion_profile:'VP Talent Acquisition or Head of Recruiting Ops — someone who owns time-to-hire and gets asked about it every quarter',
    loss_pattern:'We lose enterprise deals in security review when the review starts late. Palantir stopped responding in week 6 of a review we scoped at the proposal stage. We now start the security questionnaire conversation in week 1.',
    win_pattern:'Our fastest deals had a public hiring event creating urgency, the person who signs involved by week 3, and a pilot scoped during discovery. Chipotle is the example to follow.'},
   checks:{icp_defined:true,discovery_method:true,objection_handling:true,competitive_positioning:true,loss_patterns:true},
   notes:'Luca sells high-volume screening. Most enterprise deals start from a public hiring event (a seasonal ramp, a production rebuild, a growth plan), because the event creates urgency a cold pitch cannot. Two rules from past deals: start the security conversation in week 1 (the Palantir loss), and when the incumbent ATS bundles a screening add-on, sell the difference in hiring results and reach the person who signs before renewal season (the Gap loss).'},
  icps:[
    {id:'icp_e2',name:'AI-Native Talent Wars',industry:'AI / Software / Data',size:'1,000-10,000 employees',geo:'US',buyer:'Head of Recruiting Operations',pain:'Engineering funnels with extreme selectivity; speed-to-offer losing candidates to rivals',trigger:'Funding round with a public hiring plan, or a publicized talent war',proofWindow:'30-45 days',worked:true,statement:'AI-native companies hiring engineers against the fastest-moving rivals in tech, where days from application to offer decide who gets the hire.',saved_at:d(160)},
    {id:'icp_e3',name:'People-Org Resets',industry:'Any',size:'25,000+ employees',geo:'US',buyer:'SVP People Operations',pain:'New people leadership rebuilding the talent stack',trigger:'A new CHRO/CPO or a people-org restructuring in the last two quarters',proofWindow:'60-120 days',worked:false,statement:'Enterprises whose HR leadership changed in the last two quarters, when their HR and recruiting tools are most likely to be replaced.',saved_at:d(120)},
    {id:'icp_e1',name:'Frontline Volume Hirers',industry:'Retail / Food Service / Aviation / Logistics',size:'10,000+ employees',geo:'North America',buyer:'VP Talent Acquisition',pain:'Seasonal or standing volume hiring outrunning the recruiting team; screening by gut at scale',trigger:'A public hiring wave — seasonal ramp, production rebuild, expansion announcement',proofWindow:'30-60 days',worked:true,statement:'We sell to enterprises hiring thousands into frontline roles, where the VP of Talent Acquisition needs screening quality to hold up at high volume, and a public hiring event has already set the deadline.',saved_at:d(210)}],
  accounts:accts,
  deals:deals,
  stageHistory:stageHistory,
  advisors:advisors,
  deployments:[
    {id:'dep_e1',dealName:'Boeing',momentId:'procurement',advisorId:'adv_l1',outcome:'pending',outcomeDate:null,notes:'Priya knows their procurement leadership from a prior portfolio company — asking them to help move the security review forward this week',createdAt:d(4)},
    {id:'dep_e2',dealName:'Starbucks',momentId:'reference',advisorId:'adv_l3',outcome:'engaged',outcomeDate:d(9),notes:'Dana offered to walk their team through the Chipotle screening results herself — similar hiring process, similar seasonal volume',createdAt:d(12)},
    {id:'dep_e3',dealName:'Chipotle',momentId:'intro',advisorId:'adv_l6',outcome:'successful',outcomeDate:d(210),notes:'Rafael\'s intro started the whole Chipotle relationship — our most important reference win',createdAt:d(215)},
    {id:'dep_e4',dealName:'United Airlines',momentId:'eb_bridge',advisorId:'adv_l4',outcome:'no_response',outcomeDate:d(20),notes:'Marcus emailed the VP People — no reply yet; if we ask again, open with a thank-you',createdAt:d(28)}],
  onboardingAnswers:{companyName:'Luca Industries',stage:'Growth · $100MM ARR',quota:2000000,acv:280000,productCategory:'recruiting',buyerPersona:'VP Talent Acquisition'}
};
})();

/* ── ENT part 2 — territory, funnel, working history, pilot, fronts ── */
(function(){
function d(n){return new Date(Date.now()-n*86400000).toISOString()}
function dd(n){return d(n).slice(0,10)}
var E=window.__LUCA_SEED__.ent;

var F=function(id,name,pressure,segment,lev,ago){var full=pressure+' for '+segment+', and '+lev+'.';
  return {id:id,name:name,pressure:pressure,segment:segment,leverage:lev,fullStatement:full,version:1,status:'active',createdAt:d(ago),versions:[{v:1,statement:full,date:d(ago)}]}};
var focuses=[
F('ta_e_air','Air & aerospace frontline','Safety-critical hiring is running at post-strike, record-schedule volume','airlines and aerospace manufacturers rebuilding frontline and production workforces','we can keep screening quality high where a bad hire is a safety risk',130),
F('ta_e_ramp','Retail & food ramp','Seasonal and turnaround hiring waves are outrunning recruiting teams','retailers and food-service brands with public hiring pushes','we can handle seasonal hiring volume without lowering their hiring standards',124),
F('ta_e_ai','AI-native talent wars','The fastest offer is deciding who gets the engineer','AI companies hiring against the fastest rivals in tech','we can cut application-to-offer to days on their own funnel',118),
F('ta_e_hrtech','Workforce platforms','HR-tech companies hire at scale and know this product category well','HCM, payroll, and global-employment platforms','we can win the most demanding buyers in the market and turn them into references',112),
F('ta_e_scale','Scale logistics & marketplaces','Peak-season and operations hiring is judged on speed alone','logistics networks and marketplace platforms with six-figure seasonal funnels','we can improve screening speed and quality at the same time',106)];
var AP=function(id,fid,cat,name,desc,ago){return {id:id,focusId:fid,category:cat,name:name,description:desc,status:'active',createdAt:d(ago),retiredAt:null}};
var approaches=[
AP('ta_e_ap1','ta_e_air','event-opener','Public hiring-wave opener','Open on their own announced hiring event — the strike rebuild, the class schedule — never a cold pitch.',100),
AP('ta_e_ap2','ta_e_air','safety-frame','Quality-of-hire frame','Tie screening quality to the safety and brand story their leadership already tells.',99),
AP('ta_e_ap3','ta_e_ramp','seasonal-math','Seasonal numbers opener','Lead with the season: number of applicants, length of the hiring window, and what a missed week costs.',98),
AP('ta_e_ap4','ta_e_ramp','reference','Chipotle peer story','Reference from the Chipotle seasonal-hiring win — similar hiring process, similar numbers.',97),
AP('ta_e_ap5','ta_e_ai','speed-proof','Time-to-offer demo','Show days to offer on one of their active hiring processes; competition for engineers already creates the urgency.',96),
AP('ta_e_ap6','ta_e_hrtech','insider','Expert-buyer approach','They know this category — skip the basics and open with the difference in results.',95),
AP('ta_e_ap7','ta_e_scale','throughput','Peak-season speed case','Cost of a slow screen at 10,000 applications a week, in their own arithmetic.',94)];
var TA=function(i,name,tier,fid,lev,trig,ago){return {id:'ta_e_a'+i,name:name,tier:tier,focusId:fid,leverageType:lev,additionTrigger:trig,status:'active',addedAt:d(ago),overrideCount:0}};
var taccts=[
TA(1,'Boeing',1,'ta_e_air','existing-proof-point','signal-event',120),TA(2,'Delta Air Lines',1,'ta_e_air','market-signal','signal-event',115),
TA(3,'United Airlines',1,'ta_e_air','market-signal','signal-event',115),TA(4,'Southwest Airlines',2,'ta_e_air','market-signal','strategic-bet',90),
TA(5,'JetBlue',3,'ta_e_air','cold','strategic-bet',85),TA(6,'Marriott International',2,'ta_e_air','network-connection','network-opportunity',88),
TA(7,'Hilton',3,'ta_e_air','market-signal','strategic-bet',80),TA(8,'Nordstrom',1,'ta_e_ramp','market-signal','signal-event',110),
TA(9,'Gap Inc.',2,'ta_e_ramp','market-signal','signal-event',108),TA(10,'Best Buy',2,'ta_e_ramp','market-signal','signal-event',82),
TA(11,'Ulta Beauty',2,'ta_e_ramp','market-signal','strategic-bet',78),TA(12,'Dick\'s Sporting Goods',3,'ta_e_ramp','cold','strategic-bet',75),
TA(13,'Starbucks',1,'ta_e_ramp','network-connection','signal-event',105),TA(14,'Chipotle',1,'ta_e_ramp','existing-proof-point','signal-event',220),
TA(15,'OpenAI',1,'ta_e_ai','network-connection','signal-event',100),TA(16,'Databricks',1,'ta_e_ai','network-connection','signal-event',95),
TA(17,'Palantir',3,'ta_e_ai','cold','strategic-bet',150),TA(18,'CoreWeave',2,'ta_e_ai','market-signal','signal-event',92),
TA(19,'Workday',2,'ta_e_hrtech','market-signal','strategic-bet',70),TA(20,'ADP',3,'ta_e_hrtech','cold','strategic-bet',68),
TA(21,'Dayforce',3,'ta_e_hrtech','existing-proof-point','signal-event',300),TA(22,'Paycom',3,'ta_e_hrtech','cold','strategic-bet',66),
TA(23,'Deel',1,'ta_e_hrtech','existing-proof-point','signal-event',260),TA(24,'Randstad',2,'ta_e_hrtech','market-signal','strategic-bet',64),
TA(25,'Nike',2,'ta_e_scale','market-signal','signal-event',72),TA(26,'Uber',2,'ta_e_scale','market-signal','signal-event',60),
TA(27,'Airbnb',3,'ta_e_scale','cold','strategic-bet',58),TA(28,'Spotify',3,'ta_e_scale','cold','strategic-bet',56),
TA(29,'FedEx',2,'ta_e_scale','market-signal','signal-event',62)];
E.territory={
  setup:{completedAt:d(130),version:2},
  territory:{healthScore:81,lastPulse:dd(2),pulseSkips:0,salesCycle:'3-6m',createdAt:d(130)},
  focuses:focuses,approaches:approaches,accounts:taccts,
  signals:[
   {id:'ta_e_s1',accountId:'ta_e_a1',description:'The production rebuild keeps factory hiring high.',type:'expansion',timestamp:d(4)},
   {id:'ta_e_s2',accountId:'ta_e_a13',description:'Green Apron staffing investment is live in stores.',type:'expansion',timestamp:d(6)},
   {id:'ta_e_s3',accountId:'ta_e_a15',description:'New people chief owns recruiting scale as of February.',type:'leadership',timestamp:d(8)},
   {id:'ta_e_s4',accountId:'ta_e_a8',description:'Holiday planning starts next month, which is when seasonal hiring decisions get made.',type:'expansion',timestamp:d(3)},
   {id:'ta_e_s5',accountId:'ta_e_a16',description:'Hiring 3,000 this year with a recruiting team sized for fewer.',type:'expansion',timestamp:d(9)}],
  dispositions:[
   {id:'ta_e_d1',accountId:'ta_e_a1',type:'progressing',approachUsed:'ta_e_ap1',angleWorked:'ta_e_ap1',timestamp:d(3)},
   {id:'ta_e_d2',accountId:'ta_e_a13',type:'progressing',approachUsed:'ta_e_ap4',angleWorked:'ta_e_ap4',timestamp:d(5)},
   {id:'ta_e_d3',accountId:'ta_e_a3',type:'engaged-stalled',approachUsed:'ta_e_ap2',blocker:'The person who signs is not involved yet.',timestamp:d(7)},
   {id:'ta_e_d4',accountId:'ta_e_a8',type:'engaged-stalled',approachUsed:'ta_e_ap3',blocker:'No dated next step since the ownership change.',timestamp:d(10)},
   {id:'ta_e_d5',accountId:'ta_e_a17',type:'no-traction',approachUsed:'ta_e_ap5',timestamp:d(60)}],
  swapHistory:[{id:'ta_e_sw1',accountRemoved:'Lowe\'s',accountAdded:'ta_e_a18',reason:'signal-upgrade',timestamp:d(45)}],
  retierHistory:[{id:'ta_e_rt1',date:d(30),summary:'Account list narrowed to companies with current public hiring events.'}],
  calibrations:{progression:true,leverage:true,swapLogic:true}};

E.sourcing={
  queryCards:[
   {id:'sw_e_q1',focusId:'ta_e_air',platform:'sales-nav',status:'active',createdAt:d(20),updatedAt:d(2),filters:{industry:'Airlines / aerospace manufacturing',companySize:'20,000+ employees',geography:'North America',behavioralSignal:'Announced hiring classes, production ramps, new training centers',techSignal:'Workday ATS / legacy screening',personaTitles:'VP Talent Acquisition; Director Recruiting Operations',exclusions:'Regional carriers under 5,000 employees',customNotes:'Watch for announced class schedules — they tell us when hiring starts.'}},
   {id:'sw_e_q2',focusId:'ta_e_ramp',platform:'apollo',status:'active',createdAt:d(18),updatedAt:d(3),filters:{industry:'Retail / food service',companySize:'25,000+ employees',geography:'US',behavioralSignal:'Seasonal hiring announcements, store-count growth, turnaround labor investment',techSignal:'Paradox / ATS add-ons',personaTitles:'VP Talent Acquisition; Head of Field Recruiting',exclusions:'Franchise-only operators (stores hire, corporate does not)',customNotes:'Lead with the announced number — 20,000 spring hires gives the conversation a clear deadline.'}},
   {id:'sw_e_q3',focusId:'ta_e_ai',platform:'zoominfo',status:'active',createdAt:d(15),updatedAt:d(1),filters:{industry:'AI / data infrastructure',companySize:'500-10,000 employees',geography:'US',behavioralSignal:'Funding round with public hiring plan, datacenter buildouts, new-grad programs',techSignal:'Greenhouse / Ashby',personaTitles:'Head of Recruiting Operations; VP People',exclusions:'Pre-product labs under 100 people',customNotes:'Time to offer is the main pitch for this group.'}}],
  prospects:[
   {id:'sw_e_p1',name:'Alaska Airlines',focusId:'ta_e_air',sourceType:'query-card',sourceQueryCardId:'sw_e_q1',initialImpression:'Merger integration doubles the number of hiring processes to run.',stage:'ready',createdAt:d(8),updatedAt:d(1),research:{focusMatch:'strong',entryPoint:'VP Talent Acquisition',suggestedApproach:'ta_e_ap1',leverageType:'market-signal',note:'The Hawaiian integration merges two hiring processes into one — pitch consistent screening.'}},
   {id:'sw_e_p2',name:'Panda Express',focusId:'ta_e_ramp',sourceType:'query-card',sourceQueryCardId:'sw_e_q2',initialImpression:'Store growth with a lean corporate TA team.',stage:'ready',createdAt:d(7),updatedAt:d(2),research:{focusMatch:'strong',entryPoint:'Head of Field Recruiting',suggestedApproach:'ta_e_ap3',leverageType:'market-signal',note:'Similar hiring process to the Chipotle win, at a smaller scale.'}},
   {id:'sw_e_p3',name:'Anduril',focusId:'ta_e_ai',sourceType:'query-card',sourceQueryCardId:'sw_e_q3',initialImpression:'Defense-tech hiring surge, security-heavy screens.',stage:'researched',createdAt:d(6),updatedAt:d(2),research:{focusMatch:'moderate',entryPoint:'Recruiting Operations lead',suggestedApproach:'ta_e_ap5',leverageType:'market-signal',note:'Clearance requirements complicate the funnel — could be the pain or the blocker.'}},
   {id:'sw_e_p4',name:'Waste Management',focusId:'ta_e_scale',sourceType:'news-article',sourceQueryCardId:null,initialImpression:'Frontline hiring at national scale, with few competing vendors.',stage:'captured',createdAt:d(4),updatedAt:d(4)},
   {id:'sw_e_p5',name:'Sysco',focusId:'ta_e_scale',sourceType:'query-card',sourceQueryCardId:'sw_e_q2',initialImpression:'Driver hiring never stops, and the numbers are clear to work from.',stage:'captured',createdAt:d(3),updatedAt:d(3)},
   {id:'sw_e_p6',name:'Scale AI',focusId:'ta_e_ai',sourceType:'referral',sourceQueryCardId:null,initialImpression:'Contributor-network screening is a different product conversation.',stage:'parked',createdAt:d(12),updatedAt:d(5),research:{focusMatch:'uncertain',entryPoint:'',suggestedApproach:null,leverageType:'market-signal',note:'Their screening need is for contributors, not employees — park until the product answer is clear.'}}],
  personaMaps:[
   {id:'sw_e_m1',focusId:'ta_e_air',title:'VP Talent Acquisition',alternativeTitles:'Managing Director, Talent Acquisition',role:'decision-maker',priority:'primary-target',typicalConcerns:'Class schedules, screening speed, consistency that meets regulator requirements.',bestApproach:'ta_e_ap1',notes:'Owns the number the CEO quotes. Open with their own announcement.',createdAt:d(19)},
   {id:'sw_e_m2',focusId:'ta_e_ramp',title:'Head of Field Recruiting',alternativeTitles:'VP Store Talent',role:'champion',priority:'primary-target',typicalConcerns:'Season readiness, store-manager screening load, quality at retail pay levels.',bestApproach:'ta_e_ap3',notes:'Feels seasonal pressure directly. Opening with the seasonal numbers works here.',createdAt:d(17)},
   {id:'sw_e_m3',focusId:'ta_e_ai',title:'Head of Recruiting Operations',alternativeTitles:'Recruiting Ops Lead',role:'champion',priority:'primary-target',typicalConcerns:'Days to offer, recruiter hours per hire, keeping the hiring bar high.',bestApproach:'ta_e_ap5',notes:'Wants the demo, not the deck.',createdAt:d(14)},
   {id:'sw_e_m4',focusId:'ta_e_ramp',title:'SVP People Operations',alternativeTitles:'VP People',role:'economic-buyer',priority:'situational',typicalConcerns:'Cost per hire, tooling consolidation, brand risk.',bestApproach:'ta_e_ap4',notes:'Bring the peer reference, not the feature list.',createdAt:d(13)}]};

var T=function(acct,cn,ct,per,temp,ch,trig,out,ago){return {id:'t_e_'+ago+'_'+acct.slice(0,3),account:acct.toLowerCase(),accountName:acct,contactName:cn,contactTitle:ct,persona:per,temperature:temp,channel:ch,trigger:trig,ctaType:'soft_ask',assetUsed:'case_study',content:'',outcome:out,outcomeDate:out?d(Math.max(1,ago-2)):null,dealId:null,qualityScore:78,motionBand:'workable',createdAt:d(ago)}};
E.shared={
 outboundTouches:{touches:[
  T('Boeing','Karen Mitchell','VP Talent Acquisition','vp','warm','email','expansion','replied',26),
  T('Boeing','Pete Kowalski','Head of Recruiting Operations','mgr','warm','email','expansion','replied',12),
  T('Starbucks','Alicia Fontaine','VP Talent Acquisition','vp','warm','email','expansion','replied',18),
  T('Starbucks','Jerome Bates','Director, People Systems','mgr','cool','linkedin','leadership',null,9),
  T('United Airlines','Rob Vasquez','Managing Director, Talent Acquisition','vp','cool','email','pain_point','no_response',22),
  T('OpenAI','Mia Kessler','Head of Recruiting Operations','mgr','warm','email','competitive','replied',15),
  T('OpenAI','Tara Bloom','Lead Technical Recruiter','ic','warm','email','competitive',null,5),
  T('Nordstrom','Yolanda Pierce','VP Talent Acquisition','vp','cool','email','expansion','no_response',20),
  T('CoreWeave','Nate Brower','Director, Talent Acquisition','mgr','warm','email','expansion','replied',11),
  T('Databricks','Ingrid Solberg','Head of Recruiting Operations','mgr','cool','email','expansion',null,7),
  T('Delta Air Lines','Curtis Hale','Director, TA Operations','mgr','ice_cold','email','leadership','no_response',13),
  T('Marriott International','Fran Delacroix','Senior Director, Global TA','vp','ice_cold','email','expansion',null,10),
  T('FedEx','','','vp','ice_cold','email','expansion',null,8),
  T('Uber','','','vp','ice_cold','linkedin','leadership',null,6),
  T('Best Buy','','','vp','ice_cold','email','leadership',null,4),
  T('Nike','','','vp','ice_cold','email','leadership','no_response',17),
  T('Workday','','','vp','ice_cold','email','ai_transformation',null,3),
  T('Randstad','','','csuite','ice_cold','email','ai_transformation',null,1)]},
 coldCallLog:{calls:[
  {id:'cc_e1',accountName:'CoreWeave',contactName:'Owen Marsh',contactTitle:'Site Recruiting Lead',outcome:'meeting_booked',duration:240,notes:'Site-to-site funnel pain confirmed on the call — meeting set with Nate.',createdAt:d(44)},
  {id:'cc_e2',accountName:'Delta Air Lines',contactName:'Curtis Hale',contactTitle:'Director, TA Operations',outcome:'callback_scheduled',duration:180,notes:'Mid-class-year; call back when 2027 planning opens.',createdAt:d(16)},
  {id:'cc_e3',accountName:'FedEx',contactName:'',contactTitle:'',outcome:'voicemail',duration:45,notes:'',createdAt:d(8)},
  {id:'cc_e4',accountName:'JetBlue',contactName:'',contactTitle:'',outcome:'no_answer',duration:20,notes:'',createdAt:d(12)},
  {id:'cc_e5',accountName:'Uber',contactName:'',contactTitle:'',outcome:'rejected',duration:90,notes:'Mid-reorg — told to come back next quarter.',createdAt:d(14)},
  {id:'cc_e6',accountName:'Marriott International',contactName:'Fran Delacroix',contactTitle:'Senior Director, Global TA',outcome:'callback_scheduled',duration:200,notes:'COE intro promised; she wants the Chipotle numbers first.',createdAt:d(19)},
  {id:'cc_e7',accountName:'Ulta Beauty',contactName:'',contactTitle:'',outcome:'voicemail',duration:40,notes:'',createdAt:d(6)},
  {id:'cc_e8',accountName:'Southwest Airlines',contactName:'',contactTitle:'',outcome:'no_answer',duration:15,notes:'',createdAt:d(3)}]},
 linkedinLog:{actions:[
  {id:'li_e1',cueLabel:'Review a relevant public post',actionType:'connection',type:'connection',action:'connection',accountName:'Boeing',outcome:'accepted',createdAt:d(30)},
  {id:'li_e2',cueLabel:'Leave a useful comment',actionType:'content_engage',type:'content_engage',action:'content_engage',accountName:'Boeing',outcome:null,createdAt:d(24)},
  {id:'li_e3',cueLabel:'Send a connection request',actionType:'dm',type:'dm',action:'dm',accountName:'Boeing',outcome:'replied',createdAt:d(20)},
  {id:'li_e4',cueLabel:'Review a relevant public post',actionType:'connection',type:'connection',action:'connection',accountName:'OpenAI',outcome:'accepted',createdAt:d(18)},
  {id:'li_e5',cueLabel:'Leave a useful comment',actionType:'content_engage',type:'content_engage',action:'content_engage',accountName:'OpenAI',outcome:null,createdAt:d(13)},
  {id:'li_e6',cueLabel:'Review a relevant public post',actionType:'connection',type:'connection',action:'connection',accountName:'Databricks',outcome:'pending',createdAt:d(7)},
  {id:'li_e7',cueLabel:'Review a relevant public post',actionType:'content_engage',type:'content_engage',action:'content_engage',accountName:'Starbucks',outcome:null,createdAt:d(10)},
  {id:'li_e8',cueLabel:'Review a relevant public post',actionType:'dm',type:'dm',action:'dm',accountName:'United Airlines',outcome:'no_response',createdAt:d(15)},
  {id:'li_e9',cueLabel:'Review a relevant public post',actionType:'connection',type:'connection',action:'connection',accountName:'Nike',outcome:'accepted',createdAt:d(9)},
  {id:'li_e10',cueLabel:'Review a relevant public post',actionType:'connection',type:'connection',action:'connection',accountName:'Marriott International',outcome:'pending',createdAt:d(4)}]},
 angles:[
  {company:'Boeing',trigger:'expansion',persona:'VP Talent Acquisition',email:'Open on the production rebuild: every factory hire is now a quality decision, and the screening layer is where quality starts.',temperature:'warm',channel:'email',ctaType:'soft_ask',savedAt:d(25)},
  {company:'Starbucks',trigger:'expansion',persona:'VP Talent Acquisition',email:'The Green Apron investment puts more people on the floor — screening decides whether they are the right ones. Chipotle results attached.',temperature:'warm',channel:'email',ctaType:'soft_ask',savedAt:d(17)},
  {company:'OpenAI',trigger:'competitive',persona:'Head of Recruiting Operations',email:'When rivals bid $100M for the same people, days to offer decides who gets hired. We cut it on your own funnel in two weeks.',temperature:'warm',channel:'email',ctaType:'soft_ask',savedAt:d(14)},
  {company:'FedEx',trigger:'expansion',persona:'VP Talent Acquisition',email:'Peak season is a six-figure funnel with a six-week window. Screening throughput is the number that decides January attrition.',temperature:'ice_cold',channel:'email',ctaType:'no_ask',savedAt:d(8)}],
 discoveryStats:{totalCalls:14,advancedCalls:7},
 discoveryWorked:{'rt_pain_1':true,'rt_pain_2':true,'rt_trigger_1':true,'rt_stakeholder_1':true,'rt_evidence_1':true,'rt_decision_1':true},
 discoveryCallLog:{calls:[
  {id:'dcl_e1',createdAt:d(200),updatedAt:d(200),accountName:'Chipotle',activeFramework:'recruiting',segmentKeysWorked:['pain-and-consequence','trigger-and-urgency','proof-threshold','stakeholder-and-ownership','decision-architecture','next-step-lock'],nodeIdsWorked:['rt_pain_1','rt_trigger_1','rt_stakeholder_1'],disposition:'advanced'},
  {id:'dcl_e2',createdAt:d(80),updatedAt:d(80),accountName:'Boeing',activeFramework:'recruiting',segmentKeysWorked:['opening-frame','current-state-truth','pain-and-consequence','trigger-and-urgency','stakeholder-and-ownership'],nodeIdsWorked:['rt_pain_1','rt_pain_2'],disposition:'advanced'},
  {id:'dcl_e3',createdAt:d(40),updatedAt:d(40),accountName:'OpenAI',activeFramework:'recruiting',segmentKeysWorked:['pain-and-consequence','proof-threshold','next-step-lock'],nodeIdsWorked:['rt_evidence_1'],disposition:'advanced'},
  {id:'dcl_e4',createdAt:d(18),updatedAt:d(18),accountName:'Databricks',activeFramework:'recruiting',segmentKeysWorked:['opening-frame','current-state-truth','pain-and-consequence','trigger-and-urgency'],nodeIdsWorked:['rt_pain_1','rt_trigger_1'],disposition:'stalled'},
  {id:'dcl_e5',createdAt:d(14),updatedAt:d(14),accountName:'Delta Air Lines',activeFramework:'recruiting',segmentKeysWorked:['opening-frame','current-state-truth'],nodeIdsWorked:[],disposition:'stalled'},
  {id:'dcl_e6',createdAt:d(95),updatedAt:d(95),accountName:'Palantir',activeFramework:'recruiting',segmentKeysWorked:['pain-and-consequence','decision-architecture'],nodeIdsWorked:['rt_decision_1'],disposition:'lost'}]},
 discoveryAgenda:{contact:'Ingrid Solberg',company:'Databricks',linkedDeal:'deal_e_databricks',gates:['pain_validated',null,null,null]},
 autopsyLog:(function(){var log={};
   log['deal_e_palantir']={lastRunAt:d(58),tasks:{'review_loss_pattern':{done:true,doneAt:d(58)},'security_review_week1':{done:true,doneAt:d(50)}}};
   log['deal_e_nordstrom']={lastRunAt:d(5),tasks:{'set_deadline':{done:false},'eb_strategy':{done:false}}};
   log['deal_e_united']={lastRunAt:d(3),tasks:{'send_eb_request':{done:true,doneAt:d(2)},'set_deadline':{done:false}}};
   return log})(),
 autopsySnapshots:{snapshots:[
  {dealId:'deal_e_palantir',accountName:'Palantir',verdictMode:'corrected',killSwitch:'Security review opens in week 1 or the deal does not advance past discovery.',topCauseId:'no_nextstep',topCauseLabel:'Security review started too late',generatedAtIso:d(58)},
  {dealId:'deal_e_nordstrom',accountName:'Nordstrom',verdictMode:'left',killSwitch:'If there is no dated next step by Friday, downgrade the forecast and spend the seasonal hiring window on other accounts.',topCauseId:'no_nextstep',topCauseLabel:'Next step has no date',generatedAtIso:d(5)},
  {dealId:'deal_e_united',accountName:'United Airlines',verdictMode:'corrected',killSwitch:'If the VP People misses the next briefing, ask Marcus to reach out before the schedule is set.',topCauseId:'champion_weak',topCauseLabel:'Signer not involved yet',generatedAtIso:d(3)}]},
 pocData:{pocs:[
  {id:'poc_e_chipotle',vendor:'Luca Industries',account:'Chipotle',duration:14,success:'1) Cut apply-to-start below 5 days on the seasonal funnel\n2) Screening consistency across 200 pilot stores\n3) Hiring-manager satisfaction above 8/10',boundaries:'- One region, 200 stores\n- No custom model work during the pilot\n- Weekly check-ins with the recruiters in the pilot',outcome:'converted',created:d(200)},
  {id:'poc_e_openai',vendor:'Luca Industries',account:'OpenAI',duration:21,success:'1) Cut recruiter screening hours 40% on the infra-eng funnel\n2) Zero drop in on-site pass rate\n3) Days from application to first interview under 4',boundaries:'- Infra-eng funnel only\n- Their scoring rubric, our screening\n- Security review runs in parallel, not after',outcome:'in_progress',created:d(12)}]},
 playbookNotes:{
  'note_0':'Most of our deals start from a public hiring event: the Boeing rebuild, Starbucks Green Apron, Chipotle burrito season. The announcement gives the conversation a deadline and creates the urgency.',
  'note_3':'Our fastest deals had the person who signs involved by week 3 and a pilot scoped during discovery. Chipotle is the example: an intro from a peer, the seasonal numbers, a two-week pilot, then the contract.',
  'note_4':'Two ways we keep losing deals: security reviews that start at the proposal stage (Palantir), and incumbent ATS bundles beating us because they are easier to buy (Gap). We now start the security conversation in week 1 and sell the difference in hiring results.'}};

E.pilotDesk={'boeing':{startedAt:d(52),circle:[
  {id:'pbo_1',name:'Karen Mitchell',role:'VP Talent Acquisition',kind:'champion',active:true},
  {id:'pbo_2',name:'Doug Reyes',role:'SVP People Operations',kind:'signoff',active:false},
  {id:'pbo_3',name:'Pete Kowalski',role:'Head of Recruiting Operations',kind:'hands_on',active:true},
  {id:'pbo_4',name:'Alma Reyes-Fulton',role:'Production Recruiter',kind:'hands_on',active:true},
  {id:'pbo_5',name:'Jim Castile',role:'Production Recruiter',kind:'hands_on',active:true},
  {id:'pbo_6',name:'Nina Vo',role:'Recruiting Coordinator',kind:'hands_on',active:true}],
 checkins:[{at:d(45),actions:31},{at:d(38),actions:58},{at:d(31),actions:74},{at:d(24),actions:88}],
 shared:['getting_started','role_quickstarts','champion_kit','kickoff_note','case_study'],
 closedGaps:['it_person','second_site'],stepsDone:3,stage:5,
 writeup:'Three weeks on the Renton machinist funnel: every application screened inside a day (the backlog was eleven days when we started), recruiter hours per hire down 44%, and quality-of-hire flags surfaced before interviews instead of after offers. Doug can present this to the CFO without us there: screening kept up at post-strike rebuild volume.'},
'openai':{startedAt:d(12),circle:[
  {id:'pc_1',name:'Mia Kessler',role:'Head of Recruiting Operations',kind:'champion',active:true},
  {id:'pc_2',name:'Jonah Price',role:'VP People',kind:'signoff',active:false},
  {id:'pc_3',name:'Tara Bloom',role:'Lead Technical Recruiter',kind:'hands_on',active:true},
  {id:'pc_4',name:'Priyanka Shah',role:'Technical Recruiter',kind:'hands_on',active:true},
  {id:'pc_5',name:'Cole Bennett',role:'Technical Recruiter',kind:'hands_on',active:true},
  {id:'pc_6',name:'Ana Fuentes',role:'Recruiting Coordinator',kind:'hands_on',active:false}],
 checkins:[{at:d(7),actions:34},{at:d(2),actions:51}],
 shared:['getting_started','role_quickstarts','champion_kit'],
 closedGaps:[],stepsDone:1,stage:3,
 writeup:''}};

E.gts={'deal_e_boeing':{
  fronts:{
   security:{theirAsk:'Full 150-question security review before any contract redlines move',yourLine:'Our existing documents answer 118 of the 150 today — SOC 2 Type II, pen-test, subprocessor list, DPA. The working session closes 22 more.',status:'blocking'},
   legal:{theirAsk:'Uncapped liability on data-related claims',yourLine:'Cap at 12 months of fees with a separate, higher breach cap — the structure their other vendors already accept.',status:'clearing'},
   finance:{theirAsk:'Net-90 payment terms',yourLine:'Net-60 flat, or net-30 with 3% off annual prepay — their treasury team often takes the prepay discount.',status:'todo'},
   business:{theirAsk:'Hold rollout until next fiscal year',yourLine:'Starting in January would miss spring hiring. The signing plan keeps the move from pilot to rollout inside this year.',status:'clearing'}},
  committee:[
   {id:'gc_1',name:'Karen Mitchell',role:'VP Talent Acquisition',kind:'champion',lastTouch:d(2)},
   {id:'gc_2',name:'Doug Reyes',role:'SVP People Operations',kind:'signer',lastTouch:d(9)},
   {id:'gc_3',name:'Linda Tran',role:'Procurement Manager',kind:'other',lastTouch:d(4)},
   {id:'gc_4',name:'Marcus Webb',role:'Information Security Lead',kind:'other',lastTouch:d(3)}],
  papers:{soc2:true,subprocessors:true,pentest:true,dpa:true},
  coverage:{total:150,covered:118,saved:22},
  planToSigned:'1) Security working session (this week) — close the 22 saved answers\n2) Engineering answers the last 10 (next week)\n3) Legal redline round on the cap structure\n4) Terms call with treasury — prepay trade on the table\n5) Signature target: end of month',
  targetDate:dd(-21)}};

E.customPushbacks=[
 {id:'cpb_e1',buyer:'"Our ATS already has an AI screening add-on."',reply:'The add-on covers the requirement — ask what hiring number it improved. We run on top of the same ATS and show the difference on your own hiring data in two weeks.'},
 {id:'cpb_e2',buyer:'"Legal will never approve AI screening — bias risk."',reply:'That is exactly why the audit trail matters: every screen is explainable and logged, which is more than the judgment calls your store managers make today. Our compliance documents answer it in writing.'}];

E.outdoorsEvents=[
 {id:'oe_e1',name:'RecFest USA',kind:'conference',where_at:'Nashville, TN',start_date:'2026-09-23',end_date:'2026-09-24',status:'planning',tags:'talent acquisition',notes:'The main event for recruiting leaders — about half of our champions attend.',source_url:'https://recfest.com/usa/',relevance_tier:'direct',relevance_reason:'The biggest US gathering of the exact people Luca sells to.',discovered_at:d(30),source_kind:'discovery_run',dedupe_key:'recfest-usa__2026-09__nashville'},
 {id:'oe_e2',name:'Transform 2027',kind:'conference',where_at:'Las Vegas, NV',start_date:'2027-04-12',end_date:'2027-04-14',status:'watching',tags:'people leadership',notes:'',source_url:'https://transform.us/conference/',relevance_tier:'direct',relevance_reason:'People-leadership buyers and the HR-tech vendor field in one room.',discovered_at:d(28),source_kind:'discovery_run',dedupe_key:'transform__2027-04__las-vegas'},
 {id:'oe_e3',name:'UNLEASH America 2027',kind:'conference',where_at:'Las Vegas, NV',start_date:'2027-04-13',end_date:'2027-04-15',status:'watching',tags:'HR technology',notes:'',source_url:'https://www.unleash.ai/unleashamerica/',relevance_tier:'direct',relevance_reason:'Enterprise HR-tech buying committees walk the floor here.',discovered_at:d(28),source_kind:'discovery_run',dedupe_key:'unleash-america__2027-04__las-vegas'},
 {id:'oe_e4',name:'NRF Big Show 2027',kind:'trade show',where_at:'New York, NY',start_date:'2027-01-10',end_date:'2027-01-12',status:'watching',tags:'retail',notes:'Relevant to our retail accounts — seasonal hiring is a regular topic here.',source_url:'https://nrfbigshow.nrf.com/',relevance_tier:'adjacent',relevance_reason:'Our retail accounts attend; hiring is a standing agenda item.',discovered_at:d(25),source_kind:'discovery_run',dedupe_key:'nrf-big-show__2027-01__new-york'},
 {id:'oe_e5',name:'SaaStr Annual',kind:'conference',where_at:'SF Bay Area, CA',start_date:'2027-05-11',end_date:'2027-05-13',status:'watching',tags:'software',notes:'',source_url:'https://www.saastrannual2026.com/',relevance_tier:'indirect',relevance_reason:'Founders and HR leaders from our AI-native accounts often attend.',discovered_at:d(22),source_kind:'discovery_run',dedupe_key:'saastr-annual__2027-05__sf'}];

E.capturedHeld=5;
E.bulkDays=[12,14,22,17];
})();
