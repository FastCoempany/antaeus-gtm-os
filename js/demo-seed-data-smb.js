/*
 * Luca demo dataset — SMB book (Jordan Park, $800K quota).
 * Same rules as demo-seed-data-ent.js (the hybrid people rule; relative
 * dates; real facts in signals only). 28 recognizable companies,
 * $65MM–$999MM revenue per public figures/estimates verified 2026-07-17.
 * 29 recognizable companies. Cava and Poppi are out (founder call);
 * Duolingo and Figma stay in by founder direction despite crossing
 * $1B in FY2025, alongside Coursera and Miro. Sweetgreen carries the
 * signed-run, Notion carries the live pilot.
 */
(function(){
function d(n){return new Date(Date.now()-n*86400000).toISOString()}
function dd(n){return d(n).slice(0,10)}
var A=function(id,name,ticker,industry,sector,revenue,employees,hq,domain,heat,signals){
  return {id:id,name:name,ticker:ticker,industry:industry,sector:sector,revenue:revenue,
    employees:employees,hq:hq,domain:domain,origin:'seed',fortune_rank:null,_heat:heat,signals:signals};};
var S=function(id,cat,headline,detail,why,source,ago,conf,ai){
  return {id:id,cat:cat,headline:headline,detail:detail,why_it_matters:why,source_name:source,
    published_date:d(ago),fetched_at:d(Math.max(1,ago-2)),confidence:conf,is_ai:!!ai,status:conf>=0.8?'verified':'unverified'};};

var accts=[
A('sc_s_sweetgreen','Sweetgreen','SG','Food Service','Consumer','$679M','6,000+','Los Angeles, CA','sweetgreen.com',90,[
  S('sg_s1','leadership','New COO arrived from Chipotle in 2025 — operations leadership rebuilt mid-expansion',
    'Real appointment: a former Chipotle executive took operations in May 2025.','A Chipotle-trained COO already knows what AI screening did for crew hiring there. Shortest education cycle on the book.','Trade press',24,0.9,false),
  S('sg_s2','expansion','New-market openings keep crew hiring running ahead of the recruiting team',
    'Store growth continues into new metros; every opening is a local crew funnel.','New-market crew hiring with a lean TA team is the exact SMB pitch.','Company announcements',14,0.82,false)]),
A('sc_s_notion','Notion','','Productivity Software','Technology','$500M+ ARR','2,900','San Francisco, CA','notion.so',87,[
  S('nt_s1','expansion','Headcount grew ~18% in 2025 with over 1,300 new roles opened during the year',
    'Real workforce-data read: fast hiring against a famously high bar.','Selective hiring at growth pace — screening quality is their stated obsession.','Workforce data',18,0.8,false),
  S('nt_s2','ai_transformation','Crossed $500M ARR while shipping AI agents — hiring for AI-native roles across the org',
    'Real milestone from 2025; the company hires people who work the way its product does.','An AI-native buyer evaluating an AI screen — the pilot conversation is native here.','News coverage',27,0.85,false)]),
A('sc_s_warby','Warby Parker','WRBY','DTC Eyewear','Consumer','$872M','4,000+','New York, NY','warbyparker.com',84,[
  S('wp_s1','expansion','Opened 47 net new stores in 2025 and posted its first annual net income — retail is the fastest-growing team',
    'Real FY2025 results: 323 locations and counting; store staffing is the growth engine.','A store-a-week opening pace means a standing retail hiring funnel with real math.','Earnings coverage',18,0.9,false)]),
A('sc_s_gymshark','Gymshark','','Fitness Apparel','Consumer','$860M','1,500+','Solihull, UK','gymshark.com',78,[
  S('gs_s1','leadership','Chief People Officer hired from Farfetch in 2024 to lead talent through international expansion',
    'Real appointment: the new people chief scaled her last org from 100 to 7,000+.','A CPO hired to scale talent is a buyer with a mandate, not a maybe.','Trade press',45,0.88,false),
  S('gs_s2','expansion','US retail expansion adds store hiring to a DTC-native org',
    'Permanent US stores are staffing up with retail leadership and associates.','First-time retail hiring is where screening discipline saves a brand.','Company careers data',21,0.72,true)]),
A('sc_s_coursera','Coursera','COUR','EdTech','Technology','$695M','1,400','Mountain View, CA','coursera.org',66,[
  S('cs_s1','ai_transformation','AI product push is reshaping the org — hiring concentrated in AI-adjacent roles',
    'Public strategy centers AI across the catalog and platform.','An education company betting on AI evaluates AI tooling for itself with less friction.','Public filings',22,0.72,true)]),
A('sc_s_miro','Miro','','Collaboration Software','Technology','$500M ARR (est.)','1,800','San Francisco, CA','miro.com',64,[
  S('mi_s1','expansion','Distributed hiring across US and Europe hubs continues post-correction',
    'Hiring resumed selectively after the 2023-24 tech reset.','Distributed funnels with a central people team — consistency is the pitch.','Industry reporting',26,0.68,true)]),
A('sc_s_duolingo','Duolingo','DUOL','Consumer EdTech','Technology','$1B+','900','Pittsburgh, PA','duolingo.com',82,[
  S('du_s1','ai_transformation','The CEO\'s AI-first memo reset how the company hires — managers must show a role can\'t be done by AI before opening it',
    'Real 2025 policy: contractor work AI can handle winds down, and every new seat gets an AI test first.','A company that interrogates every hire this hard needs the sharpest screen in the market — and they buy tools that match their bar.','News coverage',26,0.9,false),
  S('du_s2','expansion','Leadership says AI made employees four to five times as productive — without a single layoff',
    'Real public statements from late 2025; output per employee is the operating metric.','Productivity-per-person culture applied to hiring is exactly the Luca pitch.','CNBC',18,0.85,false)]),
A('sc_s_figma','Figma','FIG','Design Software','Technology','$1B+','1,700','San Francisco, CA','figma.com',80,[
  S('fg_s1','expansion','Hiring in response to AI, not cutting — the CEO says roles are being added across the company',
    'Real post-IPO statement from late 2025: headcount grows as AI expands what the company ships.','A design-tools company adding heads while rivals cut is a live, selective, high-volume funnel.','News coverage',22,0.88,false),
  S('fg_s2','pain_point','Design-engineer hybrid roles are among the hardest screens in software',
    'Their core craft blends disciplines most rubrics separate.','Hard-to-screen roles are where an outcome-trained screen shows off.','Industry reporting',30,0.7,true)]),
A('sc_s_grammarly','Grammarly','','AI Writing','Technology','$700M ARR','1,000+','San Francisco, CA','grammarly.com',72,[
  S('gr_s1','expansion','Raised $1B in non-dilutive growth financing in 2025 — scaling go-to-market and product hiring',
    'Real 2025 financing; the company is buying growth, and growth means hiring.','Fresh capital + hiring plans = a funnel about to outgrow the team.','News coverage',28,0.85,false)]),
A('sc_s_1password','1Password','','Security Software','Technology','$400M+ ARR','1,200','Toronto, Canada','1password.com',75,[
  S('op_s1','leadership','Passed $400M ARR in late 2025 and expanded the executive team — a president and chief business officer joined',
    'Real milestone + real appointments from November 2025.','New executive layers mean new operating reviews — including how they hire.','Company announcements',26,0.88,false)]),
A('sc_s_liquid','Liquid Death','','Beverage','Consumer','$340M','300+','Los Angeles, CA','liquiddeath.com',70,[
  S('ld_s1','leadership','New CFO from PepsiCo lineage arrived in late 2025 as the brand gears up for energy-drink expansion',
    'Real appointment ahead of the 2026 category expansion.','Category expansion at a lean brand means hiring sprints — and no recruiting infrastructure to absorb them.','Fortune',24,0.85,false)]),
A('sc_s_olipop','OLIPOP','','Beverage','Consumer','$400M+','500+','Oakland, CA','drinkolipop.com',73,[
  S('ol_s1','expansion','Raised a $50M round at a $1.85B valuation in 2025 and installed a new president from Coca-Cola lineage',
    'Real raise + real leadership addition from February 2025.','Funded, restructured, and scaling commercial teams — the classic growth-hiring window.','CNBC',33,0.88,false)]),
A('sc_s_chomps','Chomps','','CPG / Food','Consumer','$900M','400+','Chicago, IL','chomps.com',81,[
  S('ch_s1','expansion','Two new manufacturing facilities announced — hundreds of production jobs coming online',
    'Real announcements: a Missouri plant (~250 jobs) and a Nebraska facility (~150 jobs).','Production hiring is new muscle for a brand this young — they will need screening help, not just applicants.','Company announcements',26,0.9,false),
  S('ch_s2','expansion','Revenue roughly doubled two years running — headquarters hiring sprinting to keep up',
    'Growth reporting puts them near the top of the snack category\'s growth table.','Hypergrowth CPG with a Chicago HQ — a hometown logo for Luca.','Forbes',18,0.8,false)]),
A('sc_s_eventbrite','Eventbrite','EB','Ticketing Platform','Technology','$325M','700','San Francisco, CA','eventbrite.com',52,[
  S('eb_s1','pain_point','Rebuilt org running lean — every hire is scrutinized',
    'Post-restructure headcount discipline is public.','Lean teams buy tools instead of headcount. Right-size the pitch.','Public filings',28,0.7,true)]),
A('sc_s_lemonade','Lemonade','LMND','Insurtech','Technology','$527M','1,200','New York, NY','lemonade.com',68,[
  S('lm_s1','ai_transformation','Grew the book 22% while headcount shrank 9% — AI absorbs the work, and they say so publicly',
    'Real investor-day fact: in-force premium per employee up 34%.','An AI-native insurer that measures output per employee will pilot an AI screen on its own hiring.','Investor materials',21,0.85,false)]),
A('sc_s_vimeo','Vimeo','','Video Platform','Technology','$417M','1,000','New York, NY','vimeo.com',48,[
  S('vm_s1','leadership','Acquired by Bending Spoons in late 2025 — new ownership resetting the operating model',
    'Real acquisition completed November 2025.','Ownership resets reopen the tooling map — and usually compress the team that runs it.','News coverage',28,0.8,false)]),
A('sc_s_allbirds','Allbirds','BIRD','DTC Footwear','Consumer','$190M','600','San Francisco, CA','allbirds.com',44,[
  S('ab_s1','pain_point','Rebuild underway — smaller team, every hire loaded with expectation',
    'Real trajectory: revenue declining, headcount lean, a turnaround CEO promoted from COO in 2024.','When every hire counts double, screen quality is survival, not efficiency.','Earnings coverage',26,0.75,true)]),
A('sc_s_bombas','Bombas','','DTC Apparel','Consumer','$325M','300','New York, NY','bombas.com',56,[
  S('bo_s1','leadership','New CEO from Under Armour lineage took over in 2025 with the founder moving to executive chair',
    'Real 2025 transition; operating leadership professionalized.','New operating CEOs bring operating tools. Early window.','CNBC',36,0.85,false)]),
A('sc_s_rothys','Rothy\'s','','DTC Footwear','Consumer','$211M','500','San Francisco, CA','rothys.com',54,[
  S('ro_s1','expansion','Best year on record in 2024 under a veteran retail CEO — wholesale and retail expansion hiring',
    'Real results: $211M, +17%, with store fleet growth doing the lifting.','Retail expansion at a digital-native brand means first-time field hiring.','CNBC',39,0.85,false)]),
A('sc_s_tecovas','Tecovas','','Western Wear','Consumer','$300M (est.)','700+','Austin, TX','tecovas.com',62,[
  S('tc_s1','expansion','Store expansion continues — every opening staffs a new frontline team',
    'The western-wear brand keeps adding retail doors and wholesale.','Scheduled store openings are scheduled hiring waves.','Trade press',22,0.72,true)]),
A('sc_s_portillos','Portillo\'s','PTLO','Food Service','Consumer','$711M','8,000+','Chicago, IL','portillos.com',71,[
  S('pt_s1','expansion','Texas expansion continues — each restaurant staffs dozens on a compressed opening timeline',
    'Real expansion: ten Texas openings since 2023 with the new smaller-format restaurants.','Opening-crew hiring on a deadline, over and over — a subscription-shaped screening need. And a Chicago neighbor.','Company announcements',16,0.85,false)]),
A('sc_s_oatly','Oatly','OTLY','Food / Beverage','Consumer','$824M','1,600','Malmö, Sweden','oatly.com',50,[
  S('oa_s1','pain_point','Efficiency program running — global org getting leaner while commercial hiring continues',
    'Public cost discipline with regional commercial teams still hiring.','Lean-and-hiring is the tool-buying posture.','Public filings',27,0.72,true)]),
A('sc_s_athletic','Athletic Brewing','','Beverage','Consumer','$110M','300+','Milford, CT','athleticbrewing.com',46,[
  S('at_s1','expansion','Category leader still compounding — production and field-sales hiring continue',
    'Non-alcoholic beer keeps growing; they raised $50M in 2024 to expand capacity.','Production + field hiring at a lean brand — right-sized pilot territory.','CNBC',42,0.78,true)]),
A('sc_s_spindrift','Spindrift','','Beverage','Consumer','$300M+','250','Newton, MA','spindriftfresh.com',42,[
  S('sp_s1','expansion','Steady growth with a small HQ — hiring happens in bursts around launches',
    'Real trajectory per business-press reporting.','Burst hiring with no recruiting bench is exactly when a screen earns its keep.','Bloomberg',45,0.7,true)]),
A('sc_s_squatch','Dr. Squatch','','CPG','Consumer','$400M','400+','Marina del Rey, CA','drsquatch.com',48,[
  S('dq_s1','leadership','Acquired by Unilever in 2025 — brand keeps operating with new resources behind it',
    'Real 2025 acquisition; the meme-brand growth engine now has CPG-giant backing.','Integration + growth capital = hiring waves with new process expectations.','Company announcements',33,0.8,false)]),
A('sc_s_siete','Siete Foods','','CPG / Food','Consumer','$500M','500+','Austin, TX','sietefoods.com',45,[
  S('si_s1','expansion','PepsiCo acquisition completed in 2025 — the family brand scaling inside a giant',
    'Real completed acquisition from January 2025.','Post-acquisition scaling opens headcount — and standardizes tooling.','Company announcements',48,0.8,false)]),
A('sc_s_calendly','Calendly','','Scheduling Software','Technology','$280M ARR','500','Atlanta, GA','calendly.com',40,[
  S('cl_s1','pain_point','Lean team with a high bar — hiring few, screening hard',
    'The company runs deliberately small for its revenue.','Low-volume, high-bar screening — the quality end of the SMB book.','Industry reporting',30,0.65,true)]),
A('sc_s_webflow','Webflow','','Web Software','Technology','$213M','800','San Francisco, CA','webflow.com',43,[
  S('wf_s1','pain_point','Design-engineer hybrid roles are notoriously hard to screen',
    'Their core roles blend disciplines most rubrics separate.','Hard-to-screen roles are where an outcome-trained screen shows off.','Industry reporting',32,0.65,true)]),
A('sc_s_bark','BARK','BARK','Pet Products','Consumer','$484M','1,000','New York, NY','bark.co',41,[
  S('bk_s1','pain_point','First full year of positive adjusted EBITDA — discipline era, hiring under scrutiny',
    'Real FY2025 result; the company is proving the model economics.','Discipline-era companies buy efficiency. Frame the screen as recruiter leverage they do not have to hire.','Company filings',24,0.75,true)])];

var advisors=[
  {id:'adv_l1',name:'Priya Raghavan',title:'Board Partner, Halcyon Ridge Ventures (Series C lead)',tier:'t1',expertise:'Enterprise software GTM',equity:'Board seat',companies:['Warby Parker','Lemonade'],relationship:'active',createdAt:d(400)},
  {id:'adv_l2',name:'Tom Calloway',title:'Former CHRO, Fortune 100 retailer (advisor)',tier:'t2',expertise:'Retail people organizations',equity:'0.4% advisor shares',companies:['Warby Parker','Rothy\'s','Tecovas'],relationship:'active',createdAt:d(320)},
  {id:'adv_l3',name:'Dana Whitcomb',title:'VP Talent, Chipotle (happy customer)',tier:'t4',expertise:'Frontline volume hiring',equity:'—',companies:['Sweetgreen','Portillo\'s'],relationship:'active',createdAt:d(200)},
  {id:'adv_l6',name:'Rafael Ibanez',title:'Head of Talent Ops, Sweetgreen (happy customer)',tier:'t4',expertise:'Multi-site food-service hiring',equity:'—',companies:['Portillo\'s','Chomps'],relationship:'active',createdAt:d(150)},
  {id:'adv_l7',name:'June Okada',title:'Angel investor, ex-CPG operations executive',tier:'t3',expertise:'CPG scaling and co-manufacturing',equity:'$25K SAFE',companies:['Chomps','OLIPOP','Liquid Death'],relationship:'active',createdAt:d(260)}];

var deals=[
{id:'deal_s_sweetgreen',accountName:'Sweetgreen',value:88000,stage:'negotiation',
 champion:'Rafael Ibanez',economicBuyer:'Whitney Cole',useCase:'Crew screening for new-market openings',
 pain:'Opening crews hired on compressed timelines; store managers screening by gut between shifts',
 competition:'Paradox (QSR presence)',decisionProcess:'Head of Talent Ops recommends → VP People signs; light legal review',
 nextStep:'Redline round on the liability cap',nextStepDate:dd(-4),closeDate:dd(-14),forecastCategory:'bestCase',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Rafael Ibanez',role:'champion',title:'Head of Talent Operations',engaged:true},
  {name:'Whitney Cole',role:'eb',title:'VP People',engaged:true},
  {name:'Theo Lindgren',role:'legal',title:'Commercial Counsel',engaged:true}],
 created_at:d(60),updated_at:d(4)},
{id:'deal_s_notion',accountName:'Notion',value:72000,stage:'evaluation',
 champion:'Sofia Marchetti',economicBuyer:'Ben Whitaker',useCase:'AI screen on the engineering funnel — keep the bar, cut the hours',
 pain:'1,300 openings a year against a recruiting team that reads every application by hand',
 competition:'Build-internal instinct',decisionProcess:'Recruiting lead pilots → Head of People signs',
 nextStep:'Pilot check-in — week one adoption read',nextStepDate:dd(-1),closeDate:dd(-21),forecastCategory:'bestCase',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Sofia Marchetti',role:'champion',title:'Recruiting Lead',engaged:true},
  {name:'Ben Whitaker',role:'eb',title:'Head of People',engaged:true},
  {name:'Kai Nakamura',role:'end_user',title:'Senior Recruiter',engaged:true}],
 created_at:d(35),updated_at:d(1)},
{id:'deal_s_chomps',accountName:'Chomps',value:64000,stage:'proposal',
 champion:'Lena Fitzgerald',economicBuyer:'',useCase:'Production hiring for two new plants — hundreds of roles, no recruiting bench',
 pain:'Manufacturing hiring is new muscle; HQ team screening production applicants between other jobs',
 competition:'',decisionProcess:'Head of People recommends → COO signs',
 nextStep:'Proposal walkthrough with the COO',nextStepDate:dd(-7),closeDate:dd(-30),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Lena Fitzgerald',role:'champion',title:'Head of People',engaged:true},
  {name:'',role:'eb',title:'',engaged:false}],
 created_at:d(28),updated_at:d(7)},
{id:'deal_s_warby',accountName:'Warby Parker',value:78000,stage:'proposal',
 champion:'Marcus Bell',economicBuyer:'',useCase:'Retail hiring at a store-a-week opening pace',
 pain:'47 store openings a year; field managers own screening with no shared standard',
 competition:'Incumbent ATS add-on',decisionProcess:'Director Retail Talent recommends → VP People signs',
 nextStep:'',nextStepDate:'',closeDate:dd(-35),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Marcus Bell',role:'champion',title:'Director, Retail Talent',engaged:true},
  {name:'',role:'eb',title:'',engaged:false}],
 created_at:d(40),updated_at:d(12)},
{id:'deal_s_gymshark',accountName:'Gymshark',value:70000,stage:'evaluation',
 champion:'Poppy Ashworth',economicBuyer:'',useCase:'US retail expansion screening + HQ growth hiring',
 pain:'First-time US retail hiring; UK people team screening across time zones',
 competition:'',decisionProcess:'CPO org evaluates → finance reviews above £50K',
 nextStep:'Evaluation scope call with the people team',nextStepDate:dd(-5),closeDate:dd(-40),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Poppy Ashworth',role:'champion',title:'Head of Talent Acquisition',engaged:true}],
 created_at:d(25),updated_at:d(5)},
{id:'deal_s_liquid',accountName:'Liquid Death',value:48000,stage:'evaluation',
 champion:'Jesse Varga',economicBuyer:'',useCase:'Hiring sprints for the energy-drink expansion',
 pain:'Category launch means burst hiring with a three-person people team',
 competition:'',decisionProcess:'Head of People decides; CFO reviews the number',
 nextStep:'',nextStepDate:'',closeDate:dd(-45),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Jesse Varga',role:'champion',title:'Head of People',engaged:true}],
 created_at:d(22),updated_at:d(14)},
{id:'deal_s_olipop',accountName:'OLIPOP',value:56000,stage:'discovery',
 champion:'Amara Diallo',economicBuyer:'',useCase:'Commercial-team scaling after the raise',
 pain:'Funded hiring plan, no recruiting infrastructure',
 competition:'',decisionProcess:'Mapping now',
 nextStep:'Second discovery — map the hiring plan by quarter',nextStepDate:dd(-3),closeDate:dd(-55),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Amara Diallo',role:'champion',title:'Head of People',engaged:true}],
 created_at:d(15),updated_at:d(3)},
{id:'deal_s_lemonade',accountName:'Lemonade',value:82000,stage:'discovery',
 champion:'Noa Berman',economicBuyer:'',useCase:'Output-per-employee culture applied to hiring itself',
 pain:'They measure everything per employee — except the cost of a screening miss',
 competition:'Build-internal',decisionProcess:'People ops pilots → CTO org reviews AI tooling',
 nextStep:'Discovery call with people ops',nextStepDate:dd(-6),closeDate:dd(-60),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Noa Berman',role:'champion',title:'People Operations Lead',engaged:true}],
 created_at:d(12),updated_at:d(6)},
{id:'deal_s_portillos',accountName:'Portillo\'s',value:60000,stage:'discovery',
 champion:'Gus Kaminski',economicBuyer:'',useCase:'Opening-crew screening for the Texas expansion',
 pain:'Each opening staffs dozens on a deadline; crew quality decides the opening reviews',
 competition:'Paradox (evaluated once)',decisionProcess:'Field talent lead recommends → VP People signs',
 nextStep:'',nextStepDate:'',closeDate:dd(-70),forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,
 stakeholders:[
  {name:'Gus Kaminski',role:'champion',title:'Field Talent Lead',engaged:true}],
 created_at:d(10),updated_at:d(10)},
{id:'deal_s_grammarly',accountName:'Grammarly',value:75000,stage:'prospect',
 champion:'',economicBuyer:'',useCase:'Growth hiring after the financing',pain:'Funded plan, lean recruiting team',
 competition:'',decisionProcess:'',nextStep:'',nextStepDate:'',closeDate:'',forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,stakeholders:[],created_at:d(8),updated_at:d(8)},
{id:'deal_s_bombas',accountName:'Bombas',value:42000,stage:'prospect',
 champion:'',economicBuyer:'',useCase:'New-CEO operating reset',pain:'Professionalizing operations under new leadership',
 competition:'',decisionProcess:'',nextStep:'First call with the people team',nextStepDate:dd(-9),closeDate:'',forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,stakeholders:[],created_at:d(7),updated_at:d(5)},
{id:'deal_s_1password',accountName:'1Password',value:68000,stage:'prospect',
 champion:'',economicBuyer:'',useCase:'Post-milestone growth hiring',pain:'New executive layer reviewing operations',
 competition:'',decisionProcess:'',nextStep:'',nextStepDate:'',closeDate:'',forecastCategory:'pipeline',
 lossReason:null,lossNotes:null,stakeholders:[],created_at:d(6),updated_at:d(6)},
// closed-won ×6
{id:'deal_s_rothys',accountName:'Rothy\'s',value:52000,stage:'closed-won',
 champion:'Ivy Delgado',economicBuyer:'Sam Hutchins',useCase:'Retail expansion screening',pain:'Record year, store fleet growing',
 competition:'',decisionProcess:'Director Retail recommends → CFO signs',nextStep:'',nextStepDate:'',closeDate:dd(50),forecastCategory:'commit',
 lossReason:null,lossNotes:null,stakeholders:[{name:'Ivy Delgado',role:'champion',title:'Director, Retail Talent',engaged:true},{name:'Sam Hutchins',role:'eb',title:'VP Finance',engaged:true}],created_at:d(140),updated_at:d(50)},
{id:'deal_s_spindrift',accountName:'Spindrift',value:49000,stage:'closed-won',
 champion:'Colin Mercer',economicBuyer:'Dana Frost',useCase:'Launch-burst hiring support',pain:'Burst hiring, tiny team',
 competition:'',decisionProcess:'Head of People signs',nextStep:'',nextStepDate:'',closeDate:dd(85),forecastCategory:'commit',
 lossReason:null,lossNotes:null,stakeholders:[{name:'Colin Mercer',role:'champion',title:'Head of People',engaged:true},{name:'Dana Frost',role:'eb',title:'COO',engaged:true}],created_at:d(150),updated_at:d(85)},
{id:'deal_s_athletic',accountName:'Athletic Brewing',value:44000,stage:'closed-won',
 champion:'Reid Palmer',economicBuyer:'',useCase:'Production + field-sales screening',pain:'Capacity expansion hiring',
 competition:'',decisionProcess:'People lead signs under $50K',nextStep:'',nextStepDate:'',closeDate:dd(110),forecastCategory:'commit',
 lossReason:null,lossNotes:null,stakeholders:[{name:'Reid Palmer',role:'champion',title:'People Lead',engaged:true}],created_at:d(170),updated_at:d(110)},
{id:'deal_s_1p_won',accountName:'Calendly',value:58000,stage:'closed-won',
 champion:'Farrah Osei',economicBuyer:'Miles Corbett',useCase:'High-bar screening at low volume',pain:'Every hire scrutinized',
 competition:'Build-internal',decisionProcess:'People lead recommends → COO signs',nextStep:'',nextStepDate:'',closeDate:dd(140),forecastCategory:'commit',
 lossReason:null,lossNotes:null,stakeholders:[{name:'Farrah Osei',role:'champion',title:'Head of People',engaged:true},{name:'Miles Corbett',role:'eb',title:'COO',engaged:true}],created_at:d(210),updated_at:d(140)},
{id:'deal_s_chomps_won',accountName:'Siete Foods',value:62000,stage:'closed-won',
 champion:'Rosa Guzman',economicBuyer:'Perry Landon',useCase:'Post-acquisition scaling screens',pain:'Acquisition integration hiring',
 competition:'',decisionProcess:'People lead recommends → integration office approves',nextStep:'',nextStepDate:'',closeDate:dd(65),forecastCategory:'commit',
 lossReason:null,lossNotes:null,stakeholders:[{name:'Rosa Guzman',role:'champion',title:'Head of People',engaged:true},{name:'Perry Landon',role:'eb',title:'Integration Lead',engaged:true}],created_at:d(130),updated_at:d(65)},
{id:'deal_s_tecovas_won',accountName:'Tecovas',value:35000,stage:'closed-won',
 champion:'Wade Barlow',economicBuyer:'',useCase:'Store-opening crew screens',pain:'Store expansion hiring',
 competition:'',decisionProcess:'Retail talent lead signs',nextStep:'',nextStepDate:'',closeDate:dd(160),forecastCategory:'commit',
 lossReason:null,lossNotes:null,stakeholders:[{name:'Wade Barlow',role:'champion',title:'Retail Talent Lead',engaged:true}],created_at:d(220),updated_at:d(160)},
// closed-lost ×3
{id:'deal_s_vimeo',accountName:'Vimeo',value:54000,stage:'closed-lost',
 champion:'Elliot Frame',economicBuyer:'',useCase:'Rebuild-era hiring quality',pain:'Post-restructure caution',
 competition:'',decisionProcess:'Frozen mid-acquisition',nextStep:'',nextStepDate:'',closeDate:dd(75),forecastCategory:'pipeline',
 lossReason:'budget',lossNotes:'Budget froze the week the acquisition closed. Nothing we could have done on timing — but we stayed single-threaded on one champion, so we had no one to call when the freeze hit. Multi-thread even the small ones.',
 stakeholders:[{name:'Elliot Frame',role:'champion',title:'Talent Lead',engaged:false}],created_at:d(160),updated_at:d(75)},
{id:'deal_s_allbirds',accountName:'Allbirds',value:38000,stage:'closed-lost',
 champion:'Greta Voss',economicBuyer:'',useCase:'Turnaround hiring quality',pain:'Lean rebuild',
 competition:'',decisionProcess:'Went to no-decision',nextStep:'',nextStepDate:'',closeDate:dd(95),forecastCategory:'pipeline',
 lossReason:'no_decision',lossNotes:'Real pain, no forcing event. A turnaround team defers anything it can defer. Lesson: on turnaround accounts, anchor to a dated event (a planned store opening, a season) or wait.',
 stakeholders:[{name:'Greta Voss',role:'champion',title:'Head of People',engaged:true}],created_at:d(180),updated_at:d(95)},
{id:'deal_s_eventbrite',accountName:'Eventbrite',value:40000,stage:'closed-lost',
 champion:'Omar Haddad',economicBuyer:'',useCase:'Lean-team screening leverage',pain:'Post-restructure discipline',
 competition:'Cheaper point tool (won)',decisionProcess:'People lead → CFO chose on price',nextStep:'',nextStepDate:'',closeDate:dd(55),forecastCategory:'pipeline',
 lossReason:'competitor',lossNotes:'Lost on price to a single-feature tool. We sold the platform; they wanted one fix. Lesson: on discipline-era accounts, quote the one-funnel package first and expand later.',
 stakeholders:[{name:'Omar Haddad',role:'champion',title:'People Lead',engaged:true}],created_at:d(120),updated_at:d(55)}];

var stageHistory={};
stageHistory['deal_s_sweetgreen']=[{from:'',to:'prospect',at:d(60)},{from:'prospect',to:'discovery',at:d(48)},{from:'discovery',to:'evaluation',at:d(32)},{from:'evaluation',to:'proposal',at:d(18)},{from:'proposal',to:'negotiation',at:d(9)}];
stageHistory['deal_s_notion']=[{from:'',to:'prospect',at:d(35)},{from:'prospect',to:'discovery',at:d(26)},{from:'discovery',to:'evaluation',at:d(12)}];
stageHistory['deal_s_chomps']=[{from:'',to:'prospect',at:d(28)},{from:'prospect',to:'discovery',at:d(20)},{from:'discovery',to:'evaluation',at:d(13)},{from:'evaluation',to:'proposal',at:d(6)}];
stageHistory['deal_s_warby']=[{from:'',to:'prospect',at:d(40)},{from:'prospect',to:'discovery',at:d(30)},{from:'discovery',to:'evaluation',at:d(20)},{from:'evaluation',to:'proposal',at:d(11)}];
stageHistory['deal_s_gymshark']=[{from:'',to:'prospect',at:d(25)},{from:'prospect',to:'discovery',at:d(16)},{from:'discovery',to:'evaluation',at:d(8)}];
stageHistory['deal_s_liquid']=[{from:'',to:'prospect',at:d(22)},{from:'prospect',to:'discovery',at:d(15)},{from:'discovery',to:'evaluation',at:d(9)}];
stageHistory['deal_s_olipop']=[{from:'',to:'prospect',at:d(15)},{from:'prospect',to:'discovery',at:d(8)}];
stageHistory['deal_s_lemonade']=[{from:'',to:'prospect',at:d(12)},{from:'prospect',to:'discovery',at:d(7)}];
stageHistory['deal_s_portillos']=[{from:'',to:'prospect',at:d(10)},{from:'prospect',to:'discovery',at:d(5)}];
stageHistory['deal_s_grammarly']=[{from:'',to:'prospect',at:d(8)}];
stageHistory['deal_s_bombas']=[{from:'',to:'prospect',at:d(7)}];
stageHistory['deal_s_1password']=[{from:'',to:'prospect',at:d(6)}];
stageHistory['deal_s_rothys']=[{from:'',to:'prospect',at:d(140)},{from:'prospect',to:'discovery',at:d(120)},{from:'discovery',to:'evaluation',at:d(95)},{from:'evaluation',to:'proposal',at:d(70)},{from:'proposal',to:'closed-won',at:d(50)}];
stageHistory['deal_s_spindrift']=[{from:'',to:'prospect',at:d(150)},{from:'prospect',to:'discovery',at:d(130)},{from:'discovery',to:'evaluation',at:d(110)},{from:'evaluation',to:'closed-won',at:d(85)}];
stageHistory['deal_s_athletic']=[{from:'',to:'prospect',at:d(170)},{from:'prospect',to:'discovery',at:d(150)},{from:'discovery',to:'evaluation',at:d(130)},{from:'evaluation',to:'closed-won',at:d(110)}];
stageHistory['deal_s_1p_won']=[{from:'',to:'prospect',at:d(210)},{from:'prospect',to:'discovery',at:d(185)},{from:'discovery',to:'evaluation',at:d(165)},{from:'evaluation',to:'closed-won',at:d(140)}];
stageHistory['deal_s_chomps_won']=[{from:'',to:'prospect',at:d(130)},{from:'prospect',to:'discovery',at:d(110)},{from:'discovery',to:'evaluation',at:d(88)},{from:'evaluation',to:'closed-won',at:d(65)}];
stageHistory['deal_s_tecovas_won']=[{from:'',to:'prospect',at:d(220)},{from:'prospect',to:'discovery',at:d(200)},{from:'discovery',to:'evaluation',at:d(180)},{from:'evaluation',to:'closed-won',at:d(160)}];
stageHistory['deal_s_vimeo']=[{from:'',to:'prospect',at:d(160)},{from:'prospect',to:'discovery',at:d(130)},{from:'discovery',to:'evaluation',at:d(100)},{from:'evaluation',to:'closed-lost',at:d(75)}];
stageHistory['deal_s_allbirds']=[{from:'',to:'prospect',at:d(180)},{from:'prospect',to:'discovery',at:d(150)},{from:'discovery',to:'evaluation',at:d(120)},{from:'evaluation',to:'closed-lost',at:d(95)}];
stageHistory['deal_s_eventbrite']=[{from:'',to:'prospect',at:d(120)},{from:'prospect',to:'discovery',at:d(95)},{from:'discovery',to:'evaluation',at:d(75)},{from:'evaluation',to:'closed-lost',at:d(55)}];

window.__LUCA_SEED__=window.__LUCA_SEED__||{};
window.__LUCA_SEED__.smb={
  operator:{name:'Jordan Park',email:'jordan@lucaindustries.com',role:'SMB Account Executive'},
  seed:{annual_quota:800000,avg_deal_size:55000,win_rate:28,touch_to_meeting:2.5,show_rate:80,cycle_days:45,coverage_target:3,acv_band:'mid'},
  quotaTargets:{annual_quota:800000,monthly_target:66667,touches_day:27,meetings_week:6,opps_quarter:13,deals_quarter:4,coverage_target:3},
  playbook:{company:'Luca Industries',stage:'Growth · $100MM ARR',acv:55000,fields:{
    value_prop:'Luca cuts time-to-hire roughly in half by putting an AI screen in front of every funnel — sized for teams where one person owns all of hiring',
    ideal_customer:'Growth-stage consumer and software companies (200–2,000 employees) hiring faster than their people team can screen — the buyer is the Head of People, and expansion news starts the clock',
    sales_motion:'Expansion-signal outbound → one discovery call → two-week pilot on the busiest funnel → close inside 45 days',
    competitive_advantage:'Right-sized: live in two weeks on one funnel, priced for a Head of People\'s signature. The pilot shows their own numbers move before anyone asks for a committee.',
    key_objection:'"We\'re too small for this" — our answer: small teams feel a screening miss hardest. One bad store manager costs more than the platform.',
    champion_profile:'Head of People or the first Talent lead — the person doing screening themselves at 6 PM',
    loss_pattern:'SMB deals die two ways: no forcing event (Allbirds), and platform-pricing a one-problem buyer (Eventbrite). Anchor to a dated event; quote the one-funnel package first.',
    win_pattern:'Fastest closes rode a public expansion: new stores, new plants, new markets. Rothy\'s, Tecovas, Siete — every win had a date attached before we called.'},
   checks:{icp_defined:true,discovery_method:true,objection_handling:true,competitive_positioning:true,loss_patterns:true},
   notes:'The SMB book runs on expansion news. A new plant, a store-a-week pace, a category launch — that is the whole prospecting engine. Two lessons live in the losses: anchor turnaround accounts to a dated event or wait (Allbirds), and quote the one-funnel package to discipline-era buyers (Eventbrite). Multi-thread even the small ones (Vimeo).'},
  icps:[
    {id:'icp_s1',name:'Expansion-Wave Consumer',industry:'Food service / DTC / CPG',size:'200-2,000 employees',geo:'US',buyer:'Head of People',pain:'Opening crews and production hires screened by whoever has a free hour',trigger:'Announced expansion — stores, plants, markets',proofWindow:'14-30 days',worked:true,statement:'Growth consumer brands whose expansion news dates their hiring need — we call the week the announcement lands.',saved_at:d(180)},
    {id:'icp_s2',name:'Scale-up Software',industry:'Software / AI',size:'300-3,000 employees',geo:'US + EU',buyer:'Head of People / Recruiting Lead',pain:'High-bar funnels read by hand; recruiting team of two or three',trigger:'Funding or a public growth milestone',proofWindow:'14-30 days',worked:true,statement:'Software scale-ups where two recruiters carry a thousand openings — the pilot pays for itself in recruiter hours inside a month.',saved_at:d(140)},
    {id:'icp_s3',name:'Discipline-Era Operators',industry:'Any',size:'300-1,500 employees',geo:'US',buyer:'Head of People + CFO',pain:'Hiring under efficiency scrutiny; every seat justified',trigger:'Public cost program or post-restructure rebuild',proofWindow:'30-45 days',worked:false,statement:'Companies in their discipline era, where the screen is recruiter leverage they do not have to hire.',saved_at:d(90)}],
  accounts:accts,deals:deals,stageHistory:stageHistory,advisors:advisors,
  deployments:[
    {id:'dep_s1',dealName:'Sweetgreen',momentId:'reference',advisorId:'adv_l3',outcome:'successful',outcomeDate:d(20),notes:'Dana told the Chipotle story peer-to-peer — moved the evaluation to a redline round',createdAt:d(24)},
    {id:'dep_s2',dealName:'Chomps',momentId:'intro',advisorId:'adv_l7',outcome:'engaged',outcomeDate:d(6),notes:'June knows their ops leadership from the co-man world — walking the proposal in',createdAt:d(9)},
    {id:'dep_s3',dealName:'Portillo\'s',momentId:'intro',advisorId:'adv_l6',outcome:'pending',outcomeDate:null,notes:'Rafael offered a Chicago operator-to-operator intro',createdAt:d(3)}],
  onboardingAnswers:{companyName:'Luca Industries',stage:'Growth · $100MM ARR',quota:800000,acv:55000,productCategory:'recruiting',buyerPersona:'Head of People'}
};
})();

/* ── SMB part 2 — territory, funnel, working history, pilot, fronts ── */
(function(){
function d(n){return new Date(Date.now()-n*86400000).toISOString()}
function dd(n){return d(n).slice(0,10)}
var E=window.__LUCA_SEED__.smb;
var F=function(id,name,pressure,segment,lev,ago){var full=pressure+' for '+segment+', and '+lev+'.';
  return {id:id,name:name,pressure:pressure,segment:segment,leverage:lev,fullStatement:full,version:1,status:'active',createdAt:d(ago),versions:[{v:1,statement:full,date:d(ago)}]}};
var focuses=[
F('ta_s_food','Fast-casual expansion','Opening crews are hired on deadlines by managers who already have full-time jobs','fast-casual brands opening new restaurants and markets','we can screen the opening crew before the manager ever reads a resume',110),
F('ta_s_dtc','DTC & CPG velocity','Growth brands hire in bursts with no recruiting bench','consumer brands whose expansion news dates their hiring need','we can absorb the burst so the brand does not have to staff for the peak',104),
F('ta_s_soft','Software scale-ups','Two recruiters carry a thousand openings at a bar nobody will lower','software companies hiring faster than their people team can read','we can give every application a first read the day it lands',98),
F('ta_s_odd','Category oddballs','Discipline-era operators justify every seat','platforms and insurers proving their model economics','we can be the recruiter leverage they do not have to hire',92)];
var AP=function(id,fid,cat,name,desc,ago){return {id:id,focusId:fid,category:cat,name:name,description:desc,status:'active',createdAt:d(ago),retiredAt:null}};
var approaches=[
AP('ta_s_ap1','ta_s_food','event-opener','Opening-date opener','Call the week the expansion news lands — the announcement dates the need.',88),
AP('ta_s_ap2','ta_s_food','reference','Sweetgreen peer story','Peer reference from the crew-screening work — operator to operator.',87),
AP('ta_s_ap3','ta_s_dtc','burst-math','Burst-hiring math','Cost of a bad burst hire at a lean brand, in their own numbers.',86),
AP('ta_s_ap4','ta_s_soft','recruiter-hours','Recruiter-hours pitch','Hours per hire, before and after the screen — the pilot proves it in two weeks.',85),
AP('ta_s_ap5','ta_s_odd','one-funnel','One-funnel package','Quote the single busiest funnel first; expand after the number moves.',84)];
var TA=function(i,name,tier,fid,lev,trig,ago){return {id:'ta_s_a'+i,name:name,tier:tier,focusId:fid,leverageType:lev,additionTrigger:trig,status:'active',addedAt:d(ago),overrideCount:0}};
E.territory={
  setup:{completedAt:d(115),version:2},
  territory:{healthScore:77,lastPulse:dd(1),pulseSkips:0,salesCycle:'1-3m',createdAt:d(115)},
  focuses:focuses,approaches:approaches,
  accounts:[
   TA(1,'Sweetgreen',1,'ta_s_food','existing-proof-point','signal-event',100),TA(2,'Portillo\'s',1,'ta_s_food','network-connection','signal-event',95),
   TA(3,'Cava',3,'ta_s_food','market-signal','strategic-bet',90),TA(4,'Warby Parker',1,'ta_s_dtc','market-signal','signal-event',98),
   TA(5,'Chomps',1,'ta_s_dtc','network-connection','signal-event',88),TA(6,'Liquid Death',2,'ta_s_dtc','market-signal','signal-event',85),
   TA(7,'OLIPOP',2,'ta_s_dtc','market-signal','signal-event',82),TA(8,'Gymshark',2,'ta_s_dtc','market-signal','signal-event',80),
   TA(9,'Tecovas',2,'ta_s_dtc','existing-proof-point','signal-event',200),TA(10,'Rothy\'s',2,'ta_s_dtc','existing-proof-point','signal-event',130),
   TA(11,'Bombas',3,'ta_s_dtc','market-signal','strategic-bet',70),TA(12,'Allbirds',3,'ta_s_dtc','cold','strategic-bet',150),
   TA(13,'Dr. Squatch',3,'ta_s_dtc','market-signal','strategic-bet',68),TA(14,'Siete Foods',2,'ta_s_dtc','existing-proof-point','signal-event',125),
   TA(15,'Duolingo',1,'ta_s_soft','market-signal','signal-event',76),TA(30,'Figma',1,'ta_s_soft','market-signal','signal-event',74),TA(16,'Athletic Brewing',2,'ta_s_dtc','existing-proof-point','signal-event',165),
   TA(17,'Spindrift',2,'ta_s_dtc','existing-proof-point','signal-event',145),TA(18,'Oatly',3,'ta_s_dtc','cold','strategic-bet',64),
   TA(19,'Notion',1,'ta_s_soft','network-connection','signal-event',92),TA(20,'Grammarly',2,'ta_s_soft','market-signal','signal-event',75),
   TA(21,'1Password',2,'ta_s_soft','market-signal','signal-event',72),TA(22,'Calendly',2,'ta_s_soft','existing-proof-point','signal-event',205),
   TA(23,'Webflow',3,'ta_s_soft','cold','strategic-bet',62),TA(24,'Miro',3,'ta_s_soft','cold','strategic-bet',60),
   TA(25,'Coursera',3,'ta_s_soft','market-signal','strategic-bet',58),TA(26,'Lemonade',2,'ta_s_odd','market-signal','signal-event',56),
   TA(27,'Vimeo',3,'ta_s_odd','cold','strategic-bet',155),TA(28,'Eventbrite',3,'ta_s_odd','cold','strategic-bet',118),
   TA(29,'BARK',3,'ta_s_odd','market-signal','strategic-bet',54)],
  signals:[
   {id:'ta_s_s1',accountId:'ta_s_a1',description:'New-market openings keep the crew funnel live.',type:'expansion',timestamp:d(3)},
   {id:'ta_s_s2',accountId:'ta_s_a5',description:'Two plants announced — production hiring is new muscle for them.',type:'expansion',timestamp:d(5)},
   {id:'ta_s_s3',accountId:'ta_s_a19',description:'1,300 openings a year against a hand-read funnel.',type:'expansion',timestamp:d(7)},
   {id:'ta_s_s4',accountId:'ta_s_a4',description:'Store-a-week pace makes field screening the bottleneck.',type:'expansion',timestamp:d(4)}],
  dispositions:[
   {id:'ta_s_d1',accountId:'ta_s_a1',type:'progressing',approachUsed:'ta_s_ap2',angleWorked:'ta_s_ap2',timestamp:d(4)},
   {id:'ta_s_d2',accountId:'ta_s_a19',type:'progressing',approachUsed:'ta_s_ap4',angleWorked:'ta_s_ap4',timestamp:d(2)},
   {id:'ta_s_d3',accountId:'ta_s_a12',type:'no-traction',approachUsed:'ta_s_ap3',blocker:'',timestamp:d(95)},
   {id:'ta_s_d4',accountId:'ta_s_a6',type:'engaged-stalled',approachUsed:'ta_s_ap3',blocker:'Three-person people team mid-launch — timing, not interest.',timestamp:d(8)}],
  swapHistory:[{id:'ta_s_sw1',accountRemoved:'Casper',accountAdded:'ta_s_a25',reason:'fit-correction',timestamp:d(20)}],
  retierHistory:[{id:'ta_s_rt1',date:d(15),summary:'Book re-tiered around dated expansion events.'}],
  calibrations:{progression:true,leverage:true,swapLogic:true}};
E.sourcing={
  queryCards:[
   {id:'sw_s_q1',focusId:'ta_s_food',platform:'apollo',status:'active',createdAt:d(16),updatedAt:d(2),filters:{industry:'Fast casual / restaurant groups',companySize:'2,000-10,000 employees',geography:'US',behavioralSignal:'New-market announcements, opening schedules, crew hiring pushes',techSignal:'ATS-lite / spreadsheet screening',personaTitles:'Head of People; Field Talent Lead',exclusions:'Franchise-only groups',customNotes:'The opening date is the deadline — call the week the news lands.'}},
   {id:'sw_s_q2',focusId:'ta_s_dtc',platform:'sales-nav',status:'active',createdAt:d(14),updatedAt:d(3),filters:{industry:'Consumer brands / CPG',companySize:'200-1,500 employees',geography:'US',behavioralSignal:'Funding, new facilities, category launches, retail expansion',techSignal:'No recruiting stack',personaTitles:'Head of People; COO',exclusions:'Brands under $65M revenue',customNotes:'Burst hiring with no bench — the screen absorbs the peak.'}},
   {id:'sw_s_q3',focusId:'ta_s_soft',platform:'zoominfo',status:'active',createdAt:d(12),updatedAt:d(1),filters:{industry:'Software / AI',companySize:'300-3,000 employees',geography:'US + EU',behavioralSignal:'Growth milestones, financing, headcount plans',techSignal:'Greenhouse / Ashby / Lever',personaTitles:'Recruiting Lead; Head of People',exclusions:'Pre-revenue startups',customNotes:'Recruiter-hours math wins here — bring the pilot numbers.'}}],
  prospects:[
   {id:'sw_s_p1',name:'Torchy\'s Tacos',focusId:'ta_s_food',sourceType:'query-card',sourceQueryCardId:'sw_s_q1',initialImpression:'Multi-state expansion with opening crews on deadlines.',stage:'ready',createdAt:d(7),updatedAt:d(1),research:{focusMatch:'strong',entryPoint:'Head of People',suggestedApproach:'ta_s_ap1',leverageType:'market-signal',note:'Same shape as Portillo\'s — expansion crews, compressed timelines.'}},
   {id:'sw_s_p2',name:'Graza',focusId:'ta_s_dtc',sourceType:'query-card',sourceQueryCardId:'sw_s_q2',initialImpression:'Breakout olive-oil brand staffing up ops.',stage:'researched',createdAt:d(6),updatedAt:d(2),research:{focusMatch:'moderate',entryPoint:'COO',suggestedApproach:'ta_s_ap3',leverageType:'market-signal',note:'Growth is real; revenue may still be under the band floor — confirm before pushing.'}},
   {id:'sw_s_p3',name:'Linear',focusId:'ta_s_soft',sourceType:'query-card',sourceQueryCardId:'sw_s_q3',initialImpression:'Tiny team, famous bar — maybe too small.',stage:'parked',createdAt:d(9),updatedAt:d(4),research:{focusMatch:'uncertain',entryPoint:'',suggestedApproach:null,leverageType:'cold',note:'Bar fits, volume does not. Park until they scale.'}},
   {id:'sw_s_p4',name:'Fellow',focusId:'ta_s_dtc',sourceType:'news-article',sourceQueryCardId:null,initialImpression:'Premium coffee gear brand growing retail.',stage:'captured',createdAt:d(4),updatedAt:d(4)},
   {id:'sw_s_p5',name:'Thrive Market',focusId:'ta_s_dtc',sourceType:'query-card',sourceQueryCardId:'sw_s_q2',initialImpression:'Fulfillment hiring at membership-retail scale.',stage:'ready',createdAt:d(5),updatedAt:d(2),research:{focusMatch:'strong',entryPoint:'VP People',suggestedApproach:'ta_s_ap3',leverageType:'market-signal',note:'Warehouse funnels are the volume end of this book.'}}],
  personaMaps:[
   {id:'sw_s_m1',focusId:'ta_s_food',title:'Head of People',alternativeTitles:'VP People; People Lead',role:'decision-maker',priority:'primary-target',typicalConcerns:'Opening deadlines, manager screening load, crew quality.',bestApproach:'ta_s_ap1',notes:'Often signs alone under $60K — one-call close is possible.',createdAt:d(15)},
   {id:'sw_s_m2',focusId:'ta_s_dtc','title':'COO',alternativeTitles:'Head of Operations',role:'economic-buyer',priority:'secondary',typicalConcerns:'Burst cost, brand fit, not adding headcount.',bestApproach:'ta_s_ap3',notes:'Brings the wallet when the burst is dated.',createdAt:d(14)},
   {id:'sw_s_m3',focusId:'ta_s_soft',title:'Recruiting Lead',alternativeTitles:'Head of Talent',role:'champion',priority:'primary-target',typicalConcerns:'Hours per hire, bar integrity, funnel backlog.',bestApproach:'ta_s_ap4',notes:'Lives the pain daily; the pilot sells itself if the numbers move.',createdAt:d(13)}]};
var T=function(acct,cn,ct,per,temp,ch,trig,out,ago){return {id:'t_s_'+ago+'_'+acct.slice(0,3),account:acct.toLowerCase(),accountName:acct,contactName:cn,contactTitle:ct,persona:per,temperature:temp,channel:ch,trigger:trig,ctaType:'soft_ask',assetUsed:'case_study',content:'',outcome:out,outcomeDate:out?d(Math.max(1,ago-2)):null,dealId:null,qualityScore:74,motionBand:'workable',createdAt:d(ago)}};
E.shared={
 outboundTouches:{touches:[
  T('Sweetgreen','Rafael Ibanez','Head of Talent Operations','mgr','warm','email','expansion','replied',30),
  T('Notion','Sofia Marchetti','Recruiting Lead','mgr','warm','email','expansion','replied',20),
  T('Chomps','Lena Fitzgerald','Head of People','vp','warm','email','expansion','replied',16),
  T('Warby Parker','Marcus Bell','Director, Retail Talent','mgr','cool','email','expansion',null,14),
  T('Gymshark','Poppy Ashworth','Head of Talent Acquisition','mgr','cool','email','leadership','replied',12),
  T('Liquid Death','Jesse Varga','Head of People','vp','cool','email','leadership',null,10),
  T('OLIPOP','Amara Diallo','Head of People','vp','cool','email','expansion','no_response',9),
  T('Lemonade','Noa Berman','People Operations Lead','mgr','ice_cold','email','ai_transformation',null,8),
  T('Portillo\'s','Gus Kaminski','Field Talent Lead','mgr','ice_cold','email','expansion',null,6),
  T('Grammarly','','','vp','ice_cold','email','expansion','no_response',11),
  T('Bombas','','','vp','ice_cold','email','leadership',null,5),
  T('1Password','','','vp','ice_cold','email','leadership',null,4),
  T('Dr. Squatch','','','vp','ice_cold','linkedin','leadership',null,3),
  T('Coursera','','','vp','ice_cold','email','ai_transformation',null,2),
  T('BARK','','','vp','ice_cold','email','pain_point',null,1)]},
 coldCallLog:{calls:[
  {id:'cc_s1',accountName:'Portillo\'s',contactName:'Gus Kaminski',contactTitle:'Field Talent Lead',outcome:'meeting_booked',duration:210,notes:'Texas opening crews — he named the pain before I did. Meeting set.',createdAt:d(10)},
  {id:'cc_s2',accountName:'Bombas',contactName:'',contactTitle:'',outcome:'callback_scheduled',duration:120,notes:'New-CEO reset underway; call back after their planning week.',createdAt:d(5)},
  {id:'cc_s3',accountName:'Tecovas',contactName:'Wade Barlow',contactTitle:'Retail Talent Lead',outcome:'referred',duration:180,notes:'Happy customer — referred us to a peer brand\'s people lead.',createdAt:d(30)},
  {id:'cc_s4',accountName:'Oatly',contactName:'',contactTitle:'',outcome:'voicemail',duration:40,notes:'',createdAt:d(7)},
  {id:'cc_s5',accountName:'Webflow',contactName:'',contactTitle:'',outcome:'no_answer',duration:15,notes:'',createdAt:d(4)},
  {id:'cc_s6',accountName:'Miro',contactName:'',contactTitle:'',outcome:'voicemail',duration:35,notes:'',createdAt:d(3)},
  {id:'cc_s7',accountName:'Spindrift',contactName:'Colin Mercer',contactTitle:'Head of People',outcome:'callback_scheduled',duration:150,notes:'Renewal-adjacent — wants the year-one numbers before expanding.',createdAt:d(15)}]},
 linkedinLog:{actions:[
  {id:'li_s1',type:'connection',action:'connection',accountName:'Notion',outcome:'accepted',createdAt:d(25)},
  {id:'li_s2',type:'content_engage',action:'content_engage',accountName:'Notion',outcome:null,createdAt:d(19)},
  {id:'li_s3',type:'dm',action:'dm',accountName:'Notion',outcome:'replied',createdAt:d(15)},
  {id:'li_s4',type:'connection',action:'connection',accountName:'Chomps',outcome:'accepted',createdAt:d(14)},
  {id:'li_s5',type:'content_engage',action:'content_engage',accountName:'Warby Parker',outcome:null,createdAt:d(11)},
  {id:'li_s6',type:'connection',action:'connection',accountName:'Gymshark',outcome:'accepted',createdAt:d(9)},
  {id:'li_s7',type:'dm',action:'dm',accountName:'Liquid Death',outcome:'no_response',createdAt:d(7)},
  {id:'li_s8',type:'connection',action:'connection',accountName:'Lemonade',outcome:'pending',createdAt:d(3)}]},
 angles:[
  {company:'Sweetgreen',trigger:'expansion',persona:'Head of Talent Operations',email:'Every new market is an opening crew hired on a deadline. The screen reads them before your managers have to.',temperature:'warm',channel:'email',ctaType:'soft_ask',savedAt:d(28)},
  {company:'Notion',trigger:'expansion',persona:'Recruiting Lead',email:'1,300 openings, every application read by hand. Two weeks on your busiest funnel shows the hours coming back.',temperature:'warm',channel:'email',ctaType:'soft_ask',savedAt:d(18)},
  {company:'Chomps',trigger:'expansion',persona:'Head of People',email:'Two plants, hundreds of production roles, no recruiting bench. The screen is the bench.',temperature:'warm',channel:'email',ctaType:'soft_ask',savedAt:d(14)}],
 discoveryStats:{totalCalls:11,advancedCalls:6},
 discoveryWorked:{'rt_pain_1':true,'rt_trigger_1':true,'rt_stakeholder_1':true,'rt_decision_1':true},
 discoveryCallLog:{calls:[
  {id:'dcl_s1',createdAt:d(48),updatedAt:d(48),accountName:'Sweetgreen',activeFramework:'recruiting',segmentKeysWorked:['pain-and-consequence','trigger-and-urgency','stakeholder-and-ownership','decision-architecture','next-step-lock'],nodeIdsWorked:['rt_pain_1','rt_stakeholder_1'],disposition:'advanced'},
  {id:'dcl_s2',createdAt:d(26),updatedAt:d(26),accountName:'Notion',activeFramework:'recruiting',segmentKeysWorked:['pain-and-consequence','proof-threshold','next-step-lock'],nodeIdsWorked:['rt_pain_1'],disposition:'advanced'},
  {id:'dcl_s3',createdAt:d(20),updatedAt:d(20),accountName:'Chomps',activeFramework:'recruiting',segmentKeysWorked:['opening-frame','pain-and-consequence','trigger-and-urgency'],nodeIdsWorked:['rt_trigger_1'],disposition:'advanced'},
  {id:'dcl_s4',createdAt:d(8),updatedAt:d(8),accountName:'OLIPOP',activeFramework:'recruiting',segmentKeysWorked:['opening-frame','current-state-truth'],nodeIdsWorked:[],disposition:'stalled'},
  {id:'dcl_s5',createdAt:d(150),updatedAt:d(150),accountName:'Allbirds',activeFramework:'recruiting',segmentKeysWorked:['pain-and-consequence','decision-architecture'],nodeIdsWorked:['rt_decision_1'],disposition:'lost'}]},
 discoveryAgenda:{contact:'Amara Diallo',company:'OLIPOP',linkedDeal:'deal_s_olipop',gates:['pain_validated',null,null,null]},
 autopsyLog:(function(){var log={};
   log['deal_s_allbirds']={lastRunAt:d(90),tasks:{'review_loss_pattern':{done:true,doneAt:d(90)},'anchor_dated_event':{done:true,doneAt:d(85)}}};
   log['deal_s_liquid']={lastRunAt:d(4),tasks:{'set_deadline':{done:false}}};
   return log})(),
 autopsySnapshots:{snapshots:[
  {dealId:'deal_s_allbirds',accountName:'Allbirds',verdictMode:'corrected',killSwitch:'Turnaround accounts get a dated forcing event by call two, or they go back to watch.',topCauseId:'no_nextstep',topCauseLabel:'No forcing event',generatedAtIso:d(90)},
  {dealId:'deal_s_liquid',accountName:'Liquid Death',verdictMode:'left',killSwitch:'If the launch slips past next month, park it and work the OLIPOP thread.',topCauseId:'no_nextstep',topCauseLabel:'Next step has no date',generatedAtIso:d(4)}]},
 pocData:{pocs:[
  {id:'poc_s_rothys',vendor:'Luca Industries',account:'Rothy\'s',duration:14,success:'1) Screen every retail application within 24 hours\n2) Store-manager hours on screening cut by half\n3) Opening-crew quality holds through two openings',boundaries:'- Retail funnel only\n- Two store openings in scope\n- Weekly check-in with the retail talent lead',outcome:'converted',created:d(120)},
  {id:'poc_s_notion',vendor:'Luca Industries',account:'Notion',duration:14,success:'1) Every engineering application gets a first read the day it lands\n2) Recruiter hours per hire cut 35%\n3) On-site pass rate holds or improves',boundaries:'- Engineering funnel only\n- Their rubric, our screen\n- Day-7 and day-14 adoption reads',outcome:'in_progress',created:d(8)}]},
 playbookNotes:{
  'note_0':'The SMB engine is expansion news. Openings, plants, launches — the announcement dates the need and the call lands warm.',
  'note_3':'Wins ride dated events: Rothy\'s store fleet, Tecovas openings, Siete integration. Every win had a date attached before we called.',
  'note_4':'Losses: no forcing event (Allbirds), platform-priced a one-problem buyer (Eventbrite), single-threaded into a freeze (Vimeo). Anchor to dates, quote one funnel first, multi-thread everything.'}};
E.pilotDesk={'notion':{startedAt:d(8),circle:[
  {id:'ps_1',name:'Sofia Marchetti',role:'Recruiting Lead',kind:'champion',active:true},
  {id:'ps_2',name:'Ben Whitaker',role:'Head of People',kind:'signoff',active:false},
  {id:'ps_3',name:'Kai Nakamura',role:'Senior Recruiter',kind:'hands_on',active:true},
  {id:'ps_4',name:'Priya Anand',role:'Recruiter',kind:'hands_on',active:true}],
 checkins:[{at:d(1),actions:28}],
 shared:['getting_started','champion_kit'],closedGaps:[],stepsDone:2,stage:3,writeup:''}};
E.gts={'deal_s_sweetgreen':{
  fronts:{
   legal:{theirAsk:'Uncapped liability on candidate-data claims',yourLine:'Cap at 12 months of fees with a separate breach cap — the same structure their delivery vendors sign.',status:'blocking'},
   security:{theirAsk:'Security review questionnaire (40 questions)',yourLine:'Our papers answer 36 of 40 today; the rest have saved answers.',status:'clearing'},
   finance:{theirAsk:'Net-60 terms',yourLine:'Net-45, or net-30 with 2% off annual prepay.',status:'todo'},
   business:{theirAsk:'Start after the current opening wave',yourLine:'The wave IS the pilot evidence — starting now means the next market opens with the screen on.',status:'clearing'}},
  committee:[
   {id:'gs_1',name:'Rafael Ibanez',role:'Head of Talent Operations',kind:'champion',lastTouch:d(1)},
   {id:'gs_2',name:'Whitney Cole',role:'VP People',kind:'signer',lastTouch:d(3)},
   {id:'gs_3',name:'Theo Lindgren',role:'Commercial Counsel',kind:'other',lastTouch:d(4)}],
  papers:{soc2:true,subprocessors:true,pentest:true,dpa:true},
  coverage:{total:40,covered:36,saved:4},
  planToSigned:'1) Redline round on the cap (this week)\n2) Close the 4 saved security answers\n3) Terms call — prepay trade on the table\n4) Signature target: two weeks out',
  targetDate:dd(-14)}};
E.customPushbacks=[
 {id:'cpb_s1',buyer:'"We\'re too small for a screening platform."',reply:'Small teams feel a screening miss hardest — one bad store manager costs more than the platform. The one-funnel package is priced for your signature, not a committee.'},
 {id:'cpb_s2',buyer:'"Our managers like doing their own hiring."',reply:'They keep the decision — the screen just means they only read the ones worth reading. Ask them what they\'d do with those hours back.'}];
E.outdoorsEvents=[
 {id:'oe_s1',name:'RecFest USA',kind:'conference',where_at:'Nashville, TN',start_date:'2026-09-23',end_date:'2026-09-24',status:'planning',tags:'talent acquisition',notes:'Half the book\'s people leads attend.',source_url:'https://recfest.com/usa/',relevance_tier:'direct',relevance_reason:'The US gathering of the exact people this book sells to.',discovered_at:d(30),source_kind:'discovery_run',dedupe_key:'recfest-usa__2026-09__nashville'},
 {id:'oe_s2',name:'Transform 2027',kind:'conference',where_at:'Las Vegas, NV',start_date:'2027-04-12',end_date:'2027-04-14',status:'watching',tags:'people leadership',notes:'',source_url:'https://transform.us/conference/',relevance_tier:'direct',relevance_reason:'People-leadership buyers in one room.',discovered_at:d(28),source_kind:'discovery_run',dedupe_key:'transform__2027-04__las-vegas'},
 {id:'oe_s3',name:'Natural Products Expo West',kind:'trade show',where_at:'Anaheim, CA',start_date:'2027-03-03',end_date:'2027-03-06',status:'watching',tags:'CPG',notes:'The CPG half of the book gathers here.',source_url:'https://www.expowest.com/en/home.html',relevance_tier:'adjacent',relevance_reason:'Growth CPG brands — hiring follows the growth on this floor.',discovered_at:d(25),source_kind:'discovery_run',dedupe_key:'expo-west__2027-03__anaheim'},
 {id:'oe_s4',name:'SaaStr Annual',kind:'conference',where_at:'SF Bay Area, CA',start_date:'2027-05-11',end_date:'2027-05-13',status:'watching',tags:'software',notes:'',source_url:'https://www.saastrannual2026.com/',relevance_tier:'indirect',relevance_reason:'The scale-up book\'s founders and people leads orbit this one.',discovered_at:d(22),source_kind:'discovery_run',dedupe_key:'saastr-annual__2027-05__sf'}];
E.capturedHeld=7;
E.bulkDays=[26,31,24,29];
})();
