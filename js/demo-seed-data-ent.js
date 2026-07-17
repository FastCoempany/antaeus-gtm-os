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
    'Reuters',24,0.93,false),
  S('sig_bo_2','leadership','Chief HR Officer Uma Amuluru is public about tying workforce quality to the safety turnaround',
    'People leadership is presenting hiring and training quality as part of the company\'s safety and culture reset.',
    'When the people chief owns a quality story, talent tooling gets executive attention and budget.',
    'Company statements',60,0.85,false),
  S('sig_bo_3','pain_point','Training and onboarding pipeline strained — new production hires need months before full certification',
    'Public reporting on the production ramp notes the bottleneck has moved from hiring to screening and readiness.',
    'Their constraint is screen quality, not applicant volume. Lead with time-to-competent, not time-to-hire.',
    'Trade press',38,0.78,true),
  S('sig_bo_4','expansion','Defense and space units hiring in parallel with commercial recovery',
    'Multiple divisions competing for the same engineering and skilled-trade candidates.',
    'Cross-division competition for candidates makes a single screening layer an efficiency story the CFO hears.',
    'Company careers data',52,0.72,true)]),
A('sc_e_starbucks','Starbucks','SBUX','Food Service / Retail','Consumer','$37.2B','360,000','Seattle, WA','starbucks.com',88,[
  S('sig_sb_1','ai_transformation','"Back to Starbucks" turnaround is putting labor back into stores — more baristas on the floor, not fewer',
    'Real 2025 move: $500M+ added labor hours across US cafes under the Green Apron staffing model — the largest store-staffing investment in company history.',
    'A company re-investing in frontline headcount at this scale needs screening that keeps quality up while volume climbs.',
    'Earnings call',45,0.9,false),
  S('sig_sb_2','leadership','Chief Partner Officer Sara Kelly is running the largest frontline people org in food service through a turnaround',
    'People leadership is central to the turnaround narrative — "partners" are the strategy.',
    'The people org has board-level visibility right now. A warm quarter to be in front of them.',
    'Public statements',70,0.84,false),
  S('sig_sb_3','pain_point','Corporate restructuring in 2025 cut support roles while store hiring continued',
    'Two rounds of corporate cuts in 2025; frontline hiring kept running through both.',
    'Leaner TA support + unchanged hiring volume = automation gap. Their recruiters are doing more with less.',
    'News coverage',80,0.8,false)]),
A('sc_e_united','United Airlines','UAL','Aviation','Transportation','$57.1B','100,000+','Chicago, IL','united.com',85,[
  S('sig_ua_1','expansion','Hiring plan ran to roughly 10,000 people in 2024 — pilot classes paused and restarted on Boeing delivery delays',
    'Real 2024 events: pilot-hiring classes paused in spring, then resumed; the year still landed near 10,000 hires including 800+ pilots.',
    'Seasonal surge + safety-critical roles = screening at volume with zero tolerance for misses.',
    'Company announcements',30,0.9,false),
  S('sig_ua_2','pain_point','Flight-attendant applications outnumber seats by more than 50 to 1',
    'Cabin-crew openings draw enormous applicant pools; screening the funnel is the bottleneck, not filling it.',
    'A 50:1 funnel is an AI-screening story that sells itself — their recruiters can\'t read every application.',
    'Industry reporting',55,0.8,false)]),
A('sc_e_openai','OpenAI','','AI / Research','Technology','$20B+ run rate','3,000+','San Francisco, CA','openai.com',91,[
  S('sig_oa_1','expansion','Headcount roughly tripled through 2024–2025 as the company scaled past 3,000 people',
    'One of the fastest-growing companies on earth; hiring across research, applied, go-to-market, and infrastructure.',
    'Hypergrowth eng hiring with the industry\'s highest bar — screening throughput is their gating factor.',
    'Public reporting',40,0.88,false),
  S('sig_oa_2','competitive','Talent war with Meta and other labs — retention and recruiting pressure at record intensity',
    'Public 2025 poaching battles put recruiting operations under a spotlight; every candidate touch matters.',
    'When rivals bid for the same people, speed from application to offer decides the hire. That is our pitch.',
    'News coverage',65,0.85,false),
  S('sig_oa_3','leadership','New Chief People Officer arrived in February 2026 — Arvind KC, ex-Roblox, owning recruiting and onboarding',
    'Real appointment after the prior people chief left mid-talent-war; recruiting now has a fresh executive owner.',
    'A new people chief hired FOR recruiting scale is the warmest possible door. Ninety-day window.',
    'News coverage',150,0.88,false)]),
A('sc_e_nordstrom','Nordstrom','JWN','Retail','Consumer','$15B','55,000','Seattle, WA','nordstrom.com',79,[
  S('sig_no_1','expansion','Seasonal ramp — tens of thousands of holiday hires across stores and fulfillment every year',
    'Their own annual filing puts the workforce near 55,000 with about half part-time or seasonal — headcount surges over 5% at holiday and Anniversary Sale peaks.',
    'Seasonal volume is the classic Luca use case: short window, huge funnel, quality still matters.',
    'Company announcements',75,0.86,false),
  S('sig_no_2','leadership','Family take-private completed in 2025 — operating priorities reset under private ownership',
    'New ownership structure historically means operating-cost scrutiny and tooling consolidation.',
    'Private-ownership resets reopen vendor decisions that were settled. Good window, higher bar.',
    'News coverage',95,0.8,false)]),
A('sc_e_coreweave','CoreWeave','CRWV','AI Infrastructure','Technology','$5.1B','2,200','Livingston, NJ','coreweave.com',82,[
  S('sig_cw_1','expansion','Datacenter buildout across multiple states — thousands of construction, operations, and engineering roles',
    'Real example: the $6B Lancaster, PA datacenter announced in 2025 with ~600 skilled jobs — and company headcount roughly tripled in one year to ~2,200.',
    'Every new site is a hiring project with local funnels. Standardized screening travels site to site.',
    'Company announcements',35,0.85,false),
  S('sig_cw_2','expansion','Post-IPO scaling — corporate functions growing from startup size to public-company size',
    'G&A and people functions are building out fast behind the revenue curve.',
    'A TA team being built WHILE hiring peaks — they will buy tooling rather than headcount.',
    'Public filings',60,0.78,true)]),
A('sc_e_chipotle','Chipotle','CMG','Food Service','Consumer','$11.9B','130,000+','Newport Beach, CA','chipotle.com',90,[
  S('sig_cm_1','expansion','Hires ~20,000 every spring for "burrito season" — and already uses an AI recruiting assistant to do it',
    'The annual burrito-season push is public; their AI assistant cut apply-to-start time to about four days.',
    'They have already bought the thesis — AI in the hiring funnel works. The conversation is expansion, not education.',
    'Company newsroom',120,0.95,false),
  S('sig_cm_2','leadership','People leadership consolidated — CHRO Ilene Eskenazi took a combined legal + HR role in January 2026',
    'Real, public leadership move; the people org now reports through a single combined chief.',
    'Org consolidation means fewer, bigger decisions. Get into the tooling review early.',
    'Company newsroom',180,0.9,false),
  S('sig_cm_3','expansion','Opening 300+ new restaurants a year — each opening is a local hiring wave',
    'Store growth guidance keeps unit hiring constant outside the seasonal peak.',
    'New-store staffing is the steady-state funnel between the spring peaks.',
    'Earnings call',50,0.85,false)]),
A('sc_e_deel','Deel','','HR Tech / Global Employment','Technology','$1B+ ARR','10,800+','San Francisco, CA','deel.com',86,[
  S('sig_dl_1','expansion','Passed $1B ARR in 2025; workforce grew ~18% year over year to nearly 11,000 people across 100+ countries',
    'Company-reported growth; hiring runs continuously across every region.',
    'Distributed hiring at this pace means screening consistency across countries — a problem they feel weekly.',
    'Company announcements',90,0.9,false),
  S('sig_dl_2','leadership','Senior leadership wave through 2025 — new president/CFO and a build-out of operations leadership',
    'Public appointments as the company scales toward IPO readiness.',
    'New operating leaders re-examine the tooling stack. Fresh eyes, fresh budget.',
    'Company blog',85,0.85,false)]),
A('sc_e_databricks','Databricks','','AI / Data Software','Technology','$5.4B run rate','8,000+','San Francisco, CA','databricks.com',80,[
  S('sig_db_1','expansion','Multi-billion-dollar funding rounds bankrolling an aggressive hiring plan across engineering and go-to-market',
    'Real 2025 facts: hiring three times as many new grads as the prior year, and growing India headcount 50%+ with 100+ new R&D engineers in Bengaluru.',
    'Their funnel volume is about to outrun their recruiter headcount. Classic pre-IPO screening squeeze.',
    'News coverage',55,0.87,false),
  S('sig_db_2','competitive','Competing for the same AI engineers as the research labs — offer velocity is a recruiting weapon',
    'The AI talent market rewards whoever gets from application to offer fastest.',
    'Speed-to-offer is a pipeline-mechanics problem. That is a demo, not a slide.',
    'Industry reporting',70,0.75,true)]),
A('sc_e_delta','Delta Air Lines','DAL','Aviation','Transportation','$61.6B','100,000','Atlanta, GA','delta.com',74,[
  S('sig_da_1','expansion','Summer operation running at record scale — frontline hiring across airports and reservations continues',
    'Real events: flight-attendant applications opened for the 2025 and 2026 class years, across nine languages, ahead of record schedules.',
    'Steady-state volume hiring at a premium brand — quality-of-hire is their differentiator language.',
    'Company announcements',42,0.82,false),
  S('sig_da_2','leadership','People leadership handed over — a longtime chief people officer retired and a successor took the org',
    'Real transition announced October 2024; the people org has a newer executive owner reviewing the stack.',
    'Selectivity at volume is the most expensive kind of screening. Their cost-per-hire math is our opener.',
    'Industry reporting',88,0.75,true)]),
A('sc_e_marriott','Marriott International','MAR','Hospitality','Consumer Services','$25B','400,000+','Bethesda, MD','marriott.com',77,[
  S('sig_ma_1','leadership','Named a top-10 Fortune Best Workplace in 2026 — people-first positioning ahead of its 100th anniversary',
    'Real 2026 recognition; the company markets its people culture as a competitive edge.',
    'A people-brand company protects that brand in hiring. Candidate experience is a board word here.',
    'Fortune / Great Place to Work',105,0.9,false),
  S('sig_ma_2','expansion','Property pipeline keeps adding hotels — every opening staffs up through local hiring wave',
    'Global unit growth translates to constant property-level hiring across hundreds of markets.',
    'Hundreds of small funnels, one brand standard. Consistency is the sale.',
    'Public filings',66,0.8,false)]),
A('sc_e_hilton','Hilton','HLT','Hospitality','Consumer Services','$11B','180,000+','McLean, VA','hilton.com',58,[
  S('sig_hi_1','expansion','Record hotel pipeline — property openings drive continuous frontline hiring',
    'Unit growth publicly guides to hundreds of openings a year worldwide.',
    'Same motion as their biggest rival — and they benchmark each other. A win at one sells the other.',
    'Public filings',72,0.78,false)]),
A('sc_e_uber','Uber','UBER','Marketplace / Technology','Technology','$44B','30,000+','San Francisco, CA','uber.com',62,[
  S('sig_ub_1','leadership','People org consolidated in 2026 — HR now reports through a single corporate-affairs president',
    'Real 2026 change: the chief people officer departed and the function was consolidated.',
    'Org changes at the top of HR reopen the tooling map underneath it.',
    'News coverage',66,0.82,false)]),
A('sc_e_fedex','FedEx','FDX','Logistics','Transportation','$88B','500,000+','Memphis, TN','fedex.com',64,[
  S('sig_fx_1','expansion','Peak-season hiring runs to tens of thousands of package handlers and drivers every year',
    'The annual peak wave is one of the largest seasonal hiring events in the country.',
    'Six-figure seasonal funnels with days-not-weeks windows. Throughput is everything.',
    'Company announcements',78,0.85,false),
  S('sig_fx_2','pain_point','European restructuring cut back-office roles while frontline hiring continued',
    'Real 2024 cuts of up to 2,000 European back-office roles under the cost program.',
    'Leaner support functions + unchanged frontline volume = the automation conversation.',
    'CNBC',140,0.8,false)]),
A('sc_e_workday','Workday','WDAY','HR Technology','Technology','$8B','18,000+','Pleasanton, CA','workday.com',68,[
  S('sig_wd_1','ai_transformation','2025 restructuring cut ~1,750 roles while the company kept hiring for AI positions',
    'Real February 2025 event: 8.5% reduction paired with explicit AI-hiring intent.',
    'An HR-tech giant reshaping its own workforce around AI buys AI tooling for its own funnels too.',
    'News coverage',150,0.85,false)]),
A('sc_e_adp','ADP','ADP','HR Technology','Technology','$20.6B','60,000+','Roseland, NJ','adp.com',52,[
  S('sig_ad_1','expansion','Steady internal hiring at one of the largest HR employers — plus a partner channel Luca could ride',
    'ADP hires at scale for its own operations and sells into every HR department in America.',
    'Customer AND potential channel. Land the internal TA team first.',
    'Public filings',95,0.72,true)]),
A('sc_e_dayforce','Dayforce','DAY','HR Technology','Technology','$1.8B','9,000+','Minneapolis, MN','dayforce.com',48,[
  S('sig_df_1','expansion','Post-rebrand growth hiring across product and go-to-market',
    'The Ceridian-to-Dayforce rebrand came with public growth targets.',
    'Growth-stage hiring inside an HCM company — they know the category cold, so the demo has to be sharp.',
    'Public filings',110,0.7,true)]),
A('sc_e_paycom','Paycom','PAYC','HR Technology','Technology','$1.9B','7,000+','Oklahoma City, OK','paycom.com',45,[
  S('sig_pc_1','expansion','Sales-org hiring machine — hundreds of reps hired and ramped every year',
    'Paycom\'s sales-hiring engine is a known quantity in the HR-tech industry.',
    'High-volume sales hiring with high washout — screening quality directly moves their revenue math.',
    'Industry reporting',100,0.7,true)]),
A('sc_e_randstad','Randstad','RAND.AS','Global Staffing','Services','$26B','40,000+','Diemen, Netherlands','randstad.com',71,[
  S('sig_rs_1','ai_transformation','World\'s largest staffing firm — screening volume IS the product, and AI screening is the industry\'s live debate',
    'Randstad places hundreds of thousands of workers; every placement is a screen.',
    'If Luca works at staffing scale, this is the biggest possible account. Long cycle, huge prize.',
    'Industry reporting',80,0.75,true)]),
A('sc_e_nike','Nike','NKE','Apparel / Retail','Consumer','$51B','80,000','Beaverton, OR','nike.com',66,[
  S('sig_nk_1','leadership','New CHRO took the people org in January 2025 as part of the broader turnaround',
    'Real appointment: a new executive VP and chief human resources officer joined with the CEO reset.',
    'New people chief + turnaround pressure = tooling reviews across the people stack.',
    'Company announcements',175,0.85,false),
  S('sig_nk_2','expansion','Retail, corporate, and supply-chain funnels all hire on different rhythms',
    'Three very different hiring motions inside one brand.',
    'One platform serving three funnels is a consolidation story their CFO will like.',
    'Public filings',90,0.7,true)]),
A('sc_e_gap','Gap Inc.','GAP','Retail','Consumer','$15B','80,000+','San Francisco, CA','gapinc.com',60,[
  S('sig_gp_1','leadership','Chief People Officer Amy Thompson has been rebuilding the people org since early 2024',
    'Real appointment under the current CEO; people leadership is part of the brand turnaround.',
    'A rebuilt people org picks its own tools. The window is open while the stack is young.',
    'PR Newswire',160,0.85,false),
  S('sig_gp_2','expansion','Four brands share one seasonal frontline hiring engine',
    'Old Navy, Gap, Banana Republic, and Athleta hire into the same holiday peaks.',
    'Multi-brand funnels mean shared screening standards — a single-platform sale.',
    'Company careers data',85,0.72,true)]),
A('sc_e_bestbuy','Best Buy','BBY','Retail','Consumer','$42B','85,000','Richfield, MN','bestbuy.com',56,[
  S('sig_bb_1','leadership','Executive team restructured in mid-2026 around the incoming CEO',
    'Real July 2026 announcement — five executives in new roles as the CEO transition lands.',
    'Leadership resets cascade into function-level tooling reviews within two quarters.',
    'Company newsroom',35,0.85,false)]),
A('sc_e_ulta','Ulta Beauty','ULTA','Retail','Consumer','$11.3B','55,000','Bolingbrook, IL','ulta.com',54,[
  S('sig_ul_1','expansion','Store-count growth keeps a standing hiring engine running',
    'New stores and services expansion staff up continuously.',
    'Store-level hiring with brand-experience stakes — quality screening at retail wages.',
    'Public filings',92,0.72,true)]),
A('sc_e_dicks','Dick\'s Sporting Goods','DKS','Retail','Consumer','$13.4B','50,000+','Coraopolis, PA','dicks.com',50,[
  S('sig_dk_1','expansion','House of Sport expansion — bigger-format stores with bigger staffing needs',
    'Each House of Sport conversion roughly doubles the store team.',
    'Format conversions are scheduled hiring waves you can plan outreach around.',
    'Public filings',88,0.72,true)]),
A('sc_e_southwest','Southwest Airlines','LUV','Aviation','Transportation','$27.5B','70,000+','Dallas, TX','southwest.com',57,[
  S('sig_sw_1','pain_point','Efficiency program has slowed hiring — every open seat now gets more scrutiny',
    'Cost pressure means fewer, more careful hires.',
    'When hiring slows, screening quality matters MORE per hire. A different pitch, same product.',
    'Earnings call',75,0.75,true)]),
A('sc_e_jetblue','JetBlue','JBLU','Aviation','Transportation','$9.3B','22,000','Long Island City, NY','jetblue.com',46,[
  S('sig_jb_1','pain_point','Leaner TA team than the majors — automation carries further here',
    'A smaller airline runs the same regulated hiring motions with a fraction of the recruiting staff.',
    'Small-team economics: one platform seat replaces work they cannot hire for.',
    'Industry reporting',95,0.68,true)]),
A('sc_e_airbnb','Airbnb','ABNB','Marketplace / Technology','Technology','$11.1B','7,000','San Francisco, CA','airbnb.com',44,[
  S('sig_ab_1','pain_point','Famously selective hiring — small volumes, extreme bar',
    'Airbnb hires few and screens hard.',
    'Low-volume, high-bar screening is the quality end of our spectrum. Reference-grade logo if it lands.',
    'Public statements',100,0.65,true)]),
A('sc_e_spotify','Spotify','SPOT','Media / Technology','Technology','$17B','7,400','Stockholm, Sweden','spotify.com',42,[
  S('sig_sp_1','expansion','Distributed-team hiring across markets after the efficiency years',
    'Hiring resumed selectively post-2023 cuts, spread across global hubs.',
    'Distributed funnels with a central people team — consistency tooling fits.',
    'Public filings',105,0.65,true)]),
A('sc_e_palantir','Palantir','PLTR','AI / Software','Technology','$2.9B','4,000','Denver, CO','palantir.com',59,[
  S('sig_pl_1','leadership','Runs a fellowship recruiting high-school graduates straight into the company — screening culture unlike anyone else\'s',
    'Real program: a paid fellowship for recent grads with high test scores, hired after a four-month trial.',
    'A company that reinvented its own funnel will take a meeting about funnel tooling — bring conviction.',
    'News coverage',95,0.85,false)]),
A('sc_e_paycom_x','Uber Freight','','Logistics / Technology','Technology','$5B','','Chicago, IL','uberfreight.com',0,[])
];
// Note: the 29th slot above is intentionally inert (heat 0, no signals) —
// it stands for the operator's own hand-add lane; keep list length honest.
accts=accts.filter(function(a){return a.id!=='sc_e_paycom_x'});

// ── LUCA'S BENCH — all fictional (the hybrid rule) ────────────────────
var advisors=[
  {id:'adv_l1',name:'Priya Raghavan',title:'Board Partner, Meridian Point Ventures (Series C lead)',tier:'t1',expertise:'Enterprise software GTM',equity:'Board seat',companies:['Boeing','Starbucks'],relationship:'active',createdAt:d(400)},
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
 champion:'Alicia Fontaine',economicBuyer:'',useCase:'AI screen on the barista funnel — keep quality up while the turnaround adds floor labor',
 pain:'Corporate TA support cut while store hiring volume held; store managers doing screening by gut',
 competition:'Paradox (strong incumbent relationship in QSR)',decisionProcess:'VP Talent recommends → Partner-org leadership approves; procurement gate at $300K',
 nextStep:'Proposal review with partner-resources leadership',nextStepDate:dd(-6),closeDate:dd(-45),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Alicia Fontaine',role:'champion',title:'VP Talent Acquisition',engaged:true},
  {name:'',role:'eb',title:'',engaged:false},
  {name:'Jerome Bates',role:'technical',title:'Director, People Systems',engaged:true}],
 created_at:d(70),updated_at:d(6)},
{id:'deal_e_united',accountName:'United Airlines',value:380000,stage:'proposal',
 champion:'Rob Vasquez',economicBuyer:'Elaine Porter',useCase:'Screening throughput for the 50:1 flight-attendant funnel + airport ops hiring',
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
 nextStep:'Pilot week-2 check-in with the recruiting circle',nextStepDate:dd(-2),closeDate:dd(-30),forecastCategory:'bestCase',
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
 champion:'Nate Brower',economicBuyer:'Sasha Villanueva',useCase:'Standardized screening that travels site to site as datacenters open',
 pain:'Every new site rebuilds the hiring funnel from scratch; TA team growing slower than the site map',
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
 pain:'Cost per hire climbing as funnels grow; brand demands white-glove candidate experience at rejection scale',
 competition:'HireVue (entrenched)',decisionProcess:'Unknown — mapping now',
 nextStep:'Discovery call with recruiting ops',nextStepDate:dd(-9),closeDate:dd(-85),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Curtis Hale',role:'champion',title:'Director, Talent Acquisition Operations',engaged:true}],
 created_at:d(25),updated_at:d(9)},
{id:'deal_e_marriott',accountName:'Marriott International',value:290000,stage:'discovery',
 champion:'Fran Delacroix',economicBuyer:'',useCase:'One brand standard for property-level hiring across hundreds of markets',
 pain:'Every property runs its own funnel; brand consistency ends at the careers page',
 competition:'Paradox (QSR-adjacent presence)',decisionProcess:'Global Talent COE evaluates → regional people VPs adopt',
 nextStep:'COE intro meeting',nextStepDate:dd(-11),closeDate:dd(-90),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Fran Delacroix',role:'champion',title:'Senior Director, Global Talent Acquisition',engaged:true}],
 created_at:d(21),updated_at:d(11)},
{id:'deal_e_uber',accountName:'Uber',value:180000,stage:'prospect',
 champion:'',economicBuyer:'',useCase:'Ops + support hiring funnels after the people-org consolidation',
 pain:'People org consolidated under new leadership; tooling map being redrawn',
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
 pain:'Leadership reset in motion; function-level reviews expected within two quarters',
 competition:'',decisionProcess:'',
 nextStep:'',nextStepDate:'',closeDate:'',forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,stakeholders:[],
 created_at:d(10),updated_at:d(10)},
// closed-won
{id:'deal_e_chipotle',accountName:'Chipotle',value:310000,stage:'closed-won',
 champion:'Dana Whitcomb',economicBuyer:'Victor Nunez',useCase:'AI screen on the burrito-season funnel — 20,000 spring hires',
 pain:'Seasonal surge screening; apply-to-start time was the constraint',
 competition:'Paradox (incumbent, displaced on the screening layer)',decisionProcess:'VP Talent recommended → SVP People signed → security review passed in 3 weeks',
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
 competition:'Internal conviction — they built their own',decisionProcess:'Recruiting leadership → security review (never finished)',
 nextStep:'',nextStepDate:'',closeDate:dd(60),forecastCategory:'pipeline',
 lossReason:'no_decision',lossNotes:'Went dark after the security review stalled at week 6. Lesson: their security review starts at discovery, not proposal — we scoped it too late. We will not repeat this: the questionnaire conversation now opens in week 1 on any deal with a security gate.',
 stakeholders:[
  {name:'Silas Grant',role:'champion',title:'Head of Talent',engaged:false}],
 created_at:d(150),updated_at:d(60)},
{id:'deal_e_gap',accountName:'Gap Inc.',value:230000,stage:'closed-lost',
 champion:'Odette Marchand',economicBuyer:'',useCase:'Four-brand seasonal screening consolidation',
 pain:'Multi-brand funnels, shared peaks',
 competition:'Incumbent ATS add-on (won)',decisionProcess:'CPO org evaluated → chose the incumbent\'s bundled module',
 nextStep:'',nextStepDate:'',closeDate:dd(40),forecastCategory:'pipeline',
 lossReason:'competitor',lossNotes:'Lost to the incumbent ATS\'s bundled screening add-on on price and procurement ease. Champion agreed ours read better; the bundle was one signature. Lesson: when the incumbent bundles, we sell the delta in outcomes, not features — and we get to the person who signs before renewal season.',
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
    sales_motion:'Signal-driven outbound → discovery → screening pilot on one live funnel → security review → commercial close',
    competitive_advantage:'Screening models trained on hiring outcomes, not generic language models. Pilots run on a live funnel in two weeks; the buyer sees their own numbers move.',
    key_objection:'"We already have an ATS with a screening add-on" — our answer: the bundle checks a box, Luca moves the number. We sit on top of every major ATS; the pilot shows the delta on their own funnel.',
    champion_profile:'VP Talent Acquisition or Head of Recruiting Ops — someone who owns time-to-hire and gets asked about it every quarter',
    loss_pattern:'Enterprise deals die in security review when it starts late. Palantir went dark at week 6 of a review we scoped at proposal. The questionnaire conversation now opens in week 1.',
    win_pattern:'Fastest closes had: a live public hiring event creating urgency, the person who signs in the room by week 3, and a pilot scoped in discovery. Chipotle is the template.'},
   checks:{icp_defined:true,discovery_method:true,objection_handling:true,competitive_positioning:true,loss_patterns:true},
   notes:'Luca sells screening at volume. The enterprise book runs on public hiring events — seasonal ramps, production rebuilds, growth plans — because those create urgency no cold pitch can. Two rules from the record: open the security conversation in week 1 (the Palantir lesson), and when the incumbent ATS bundles a screening add-on, sell the outcome delta and get to the signer before renewal season (the Gap lesson).'},
  icps:[
    {id:'icp_e1',name:'Frontline Volume Hirers',industry:'Retail / Food Service / Aviation / Logistics',size:'10,000+ employees',geo:'North America',buyer:'VP Talent Acquisition',pain:'Seasonal or standing volume hiring outrunning the recruiting team; screening by gut at scale',trigger:'A public hiring wave — seasonal ramp, production rebuild, expansion announcement',proofWindow:'30-60 days',worked:true,statement:'We sell to enterprises hiring thousands into frontline roles, where the VP of Talent Acquisition needs screening quality to survive volume — and a public hiring event has already started the clock.',saved_at:d(210)},
    {id:'icp_e2',name:'AI-Native Talent Wars',industry:'AI / Software / Data',size:'1,000-10,000 employees',geo:'US',buyer:'Head of Recruiting Operations',pain:'Engineering funnels with extreme selectivity; speed-to-offer losing candidates to rivals',trigger:'Funding round with a public hiring plan, or a publicized talent war',proofWindow:'30-45 days',worked:true,statement:'AI-native companies hiring engineers against the fastest-moving rivals in tech, where days from application to offer decide who gets the hire.',saved_at:d(160)},
    {id:'icp_e3',name:'People-Org Resets',industry:'Any',size:'25,000+ employees',geo:'US',buyer:'SVP People Operations',pain:'New people leadership rebuilding the talent stack',trigger:'A new CHRO/CPO or a people-org restructuring in the last two quarters',proofWindow:'60-120 days',worked:false,statement:'Enterprises whose people leadership changed in the last two quarters — the window when the talent stack gets re-picked.',saved_at:d(120)}],
  accounts:accts,
  deals:deals,
  stageHistory:stageHistory,
  advisors:advisors,
  deployments:[
    {id:'dep_e1',dealName:'Boeing',momentId:'procurement',advisorId:'adv_l1',outcome:'pending',outcomeDate:null,notes:'Priya knows their procurement leadership from a prior portfolio company — warming the security-review front this week',createdAt:d(4)},
    {id:'dep_e2',dealName:'Starbucks',momentId:'reference',advisorId:'adv_l3',outcome:'engaged',outcomeDate:d(9),notes:'Dana offered the Chipotle screening story peer-to-peer — same funnel shape, same seasonal math',createdAt:d(12)},
    {id:'dep_e3',dealName:'Chipotle',momentId:'intro',advisorId:'adv_l6',outcome:'successful',outcomeDate:d(210),notes:'Rafael\'s intro started the whole Chipotle relationship — the win that anchors the book',createdAt:d(215)},
    {id:'dep_e4',dealName:'United Airlines',momentId:'eb_bridge',advisorId:'adv_l4',outcome:'no_response',outcomeDate:d(20),notes:'Marcus emailed the VP People — no reply yet; second ask needs a thank-you opener',createdAt:d(28)}],
  onboardingAnswers:{companyName:'Luca Industries',stage:'Growth · $100MM ARR',quota:2000000,acv:280000,productCategory:'recruiting',buyerPersona:'VP Talent Acquisition'}
};
})();
