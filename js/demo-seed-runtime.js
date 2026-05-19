if(window.gtmDemoStorageBootstrap&&typeof window.gtmDemoStorageBootstrap.bootstrapEnvironmentMode==='function'){
  window.gtmDemoStorageBootstrap.bootstrapEnvironmentMode({forceMode:'demo'});
}

function ensureDemoAnalytics(){
  if(document.querySelector('script[data-gtmos-analytics-config]')) return;
  var configScript=document.createElement('script');
  configScript.src='/js/analytics-site-config.js';
  configScript.setAttribute('data-gtmos-analytics-config','true');
  document.head.appendChild(configScript);

  var analyticsScript=document.createElement('script');
  analyticsScript.src='/js/analytics.js';
  analyticsScript.setAttribute('data-gtmos-analytics-runtime','true');
  document.head.appendChild(analyticsScript);
}

function trackDemo(name,props){
  try{
    if(window.gtmAnalytics&&typeof window.gtmAnalytics.track==='function'){
      window.gtmAnalytics.track(name,Object.assign({stage:'demo_lane'},props||{}));
    }
  }catch(e){}
}

function renderDemoLane(){
  var card=document.querySelector('.card');
  if(!card) return;
  card.innerHTML='' +
    '<div class="eyebrow">Self-Serve Demo Lane</div>' +
    '<div class="hero">' +
      '<div class="hero-copy">' +
        '<div class="logo">antaeus<span>.</span></div>' +
        '<div class="sub">Sample workspace, real system flow</div>' +
        '<h1>Pick the demo that makes Antaeus believable in one session.</h1>' +
        '<p>This is the guided sample workspace for seeing how signal, territory, outbound, discovery, deal motion, proof, and handoff all stack inside one operating system.</p>' +
        '<div class="note-list">' +
          '<div class="note"><strong>What is sample</strong>Accounts, deals, touches, advisor moves, PoC motion, and handoff evidence are seeded so the product never feels empty.</div>' +
          '<div class="note"><strong>What is real</strong>The module logic, module handshakes, saved state, tour path, and shell behavior are the real app. Demo data just makes the story legible.</div>' +
        '</div>' +
        '<div class="quick-links">' +
          '<a class="link-chip" href="/purchase/?entry=demo-lane">See Annual Plan</a>' +
          '<a class="link-chip" href="/login.html">Sign In</a>' +
          '<a class="link-chip" href="/methodology/">Read Methodology</a>' +
        '</div>' +
      '</div>' +
      '<div class="hero-side">' +
        '<h2>What this demo should prove</h2>' +
        '<p>By the time you hit dashboard, the path should feel coherent enough to explain in a Loom, a live demo, or a founder handoff conversation.</p>' +
        '<ul class="proof-list">' +
          '<li>Signal Console feeds territory, deal, and outbound context instead of living in isolation.</li>' +
          '<li>Discovery, autopsy, and PoC work look like one system, not separate templates.</li>' +
          '<li>The handoff path is visible, not theoretical.</li>' +
          '<li>Sample data is clearly marked as sample, and real workspace return is easy.</li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div class="scenario-grid">' +
      '<button class="btn btn-mm" onclick="seed(\'mm\')"><span class="scenario-type">Scenario One</span><span class="scenario-title">Mid-Market Demo</span><span class="scenario-meta">$80K ACV - $500K quota - 6 deals</span><span class="scenario-body">Founder-to-first-AE motion. Expansion signals, a real champion path, one win, one loss, and enough pipeline detail to show how Antaeus sharpens execution before the first serious sales hire.</span></button>' +
      '<button class="btn btn-ent" onclick="seed(\'ent\')"><span class="scenario-type">Scenario Two</span><span class="scenario-title">Enterprise Demo</span><span class="scenario-meta">$180K ACV - $1.2M quota - 7 deals</span><span class="scenario-body">Operator-scale motion. Complex proof, heavier stakeholders, longer cycles, advisor leverage, and clearer downstream handoff pressure for a team already running a real enterprise sale.</span></button>' +
    '</div>' +
    '<div class="toolbar">' +
      '<div class="toolbar-copy">Choose one narrative, seed the workspace, and move straight into dashboard.</div>' +
      '<button class="btn-clear" onclick="clearAll()">Reset Demo Workspace</button>' +
    '</div>' +
    '<div class="status" id="status"></div>' +
    '<div class="count" id="count"></div>';
}

document.title='Antaeus Demo Workspace';
ensureDemoAnalytics();
renderDemoLane();

function d(n){return new Date(Date.now()-n*86400000).toISOString()}
function uid(pre){return(pre||'id')+'_'+Date.now()+'_'+Math.random().toString(36).substr(2,6)}

// ══════════════════════════════════════════════════════════════
// SHARED DATA (both scenarios use same advisors, same company)
// ══════════════════════════════════════════════════════════════

var COMPANY='Vectyr AI';
var PRODUCT_CATEGORY='cxai';

var ADVISORS=[
  {id:'adv_01',name:'Sarah Chen',title:'Board Member, Sequoia Capital',tier:'t1',expertise:'Enterprise SaaS GTM',equity:'Board seat + 1.2%',companies:[],relationship:'active',createdAt:d(180)},
  {id:'adv_02',name:'David Okonkwo',title:'Managing Partner, a16z Growth',tier:'t1',expertise:'AI/ML Infrastructure',equity:'Lead investor',companies:[],relationship:'active',createdAt:d(160)},
  {id:'adv_03',name:'Rachel Torres',title:'Former CRO, Zendesk',tier:'t2',expertise:'CX Platform Sales, Enterprise',equity:'0.5% advisor shares',companies:[],relationship:'active',createdAt:d(140)},
  {id:'adv_04',name:'Michael Krishnamurthy',title:'VP Sales, Twilio (current)',tier:'t2',expertise:'API/Platform Sales',equity:'0.3% advisor shares',companies:[],relationship:'active',createdAt:d(120)},
  {id:'adv_05',name:'Anna Lindström',title:'Former SVP Ops, Klarna',tier:'t2',expertise:'Fintech Operations, EU Markets',equity:'0.25% advisor shares',companies:[],relationship:'warm',createdAt:d(100)},
  {id:'adv_06',name:'James Whitfield',title:'Angel Investor',tier:'t3',expertise:'B2B SaaS, Revenue Operations',equity:'$50K SAFE',companies:[],relationship:'active',createdAt:d(90)},
  {id:'adv_07',name:'Priya Nair',title:'Angel, Ex-Google Cloud',tier:'t3',expertise:'Cloud Infrastructure, AI/ML',equity:'$25K SAFE',companies:[],relationship:'active',createdAt:d(80)},
  {id:'adv_08',name:'Carlos Mendoza',title:'Angel Investor',tier:'t3',expertise:'Healthcare IT, Compliance',equity:'$25K SAFE',companies:[],relationship:'warm',createdAt:d(70)},
  {id:'adv_09',name:'Lisa Park',title:'VP CX, Meridian Logistics',tier:'t4',expertise:'Customer Operations',equity:'—',companies:[],relationship:'active',createdAt:d(45)},
  {id:'adv_10',name:'Thomas Brennan',title:'CTO, Riverview Insurance',tier:'t4',expertise:'Insurance Tech, Claims Automation',equity:'—',companies:[],relationship:'active',createdAt:d(30)}
];

// ══════════════════════════════════════════════════════════════
// SCENARIO: MID-MARKET
// ══════════════════════════════════════════════════════════════
function midMarket(){
var accts=[
  {id:'sc_mm_1',name:'Meridian Logistics',ticker:'MRDN',industry:'Logistics / Supply Chain',sector:'Technology',revenue:'$340M',employees:'1,200',hq:'Chicago, IL',domain:'meridianlogistics.com',origin:'seed',fortune_rank:null,_heat:88,
   signals:[
    {id:'s1',cat:'expansion',headline:'Opened 3 new distribution centers in Q1, hiring 200+ ops staff',detail:'Massive expansion creating operational complexity. Current CX tools not scaling.',why_it_matters:'Expansion = broken processes at scale. Their support volume will 3x before their systems catch up.',source_name:'SEC Filing',published_date:'2026-01',confidence:0.92,is_ai:false,status:'verified'},
    {id:'s2',cat:'leadership',headline:'New VP Customer Operations hired from Amazon',detail:'Samantha Reeves, previously ran Amazon Logistics CS. Mandate to modernize.',why_it_matters:'New VP with big-company expectations and a mandate to change. 90-day window to get in front of her.',source_name:'LinkedIn',published_date:'2026-02',confidence:0.88,is_ai:false,status:'verified'},
    {id:'s3',cat:'pain_point',headline:'Glassdoor reviews cite "outdated support tools" as top frustration',detail:'14 reviews in past 6 months mention legacy ticketing system and lack of AI assistance.',why_it_matters:'Internal pain is public. Reference this in outreach — "your team is telling us what the problem is."',source_name:'Glassdoor',published_date:'2026-02',confidence:0.78,is_ai:true,status:'unverified'}
  ]},
  {id:'sc_mm_2',name:'Cascadia Health Systems',ticker:'',industry:'Healthcare / HealthTech',sector:'Services',revenue:'$520M',employees:'3,400',hq:'Portland, OR',domain:'cascadiahealth.org',origin:'seed',fortune_rank:null,_heat:81,
   signals:[
    {id:'s4',cat:'compliance',headline:'HIPAA audit scheduled Q3 — scrambling to document patient communication workflows',detail:'Regulatory pressure creating urgency around communication compliance.',why_it_matters:'Compliance deadline = budget unlocked. They need to solve this before the audit, not after.',source_name:'Industry Report',published_date:'2026-01',confidence:0.85,is_ai:false,status:'verified'},
    {id:'s5',cat:'expansion',headline:'Acquired two rural clinics, integrating patient communication systems',detail:'Acquisition creating system fragmentation across 14 locations.',why_it_matters:'Integration pain is the scope. Sell unified CX as the connective tissue across acquisitions.',source_name:'Press Release',published_date:'2026-02',confidence:0.90,is_ai:false,status:'verified'}
  ]},
  {id:'sc_mm_3',name:'Northstar Financial',ticker:'NSTR',industry:'Financial Services',sector:'Insurance',revenue:'$180M',employees:'800',hq:'Denver, CO',domain:'northstarfinancial.com',origin:'seed',fortune_rank:null,_heat:72,
   signals:[
    {id:'s6',cat:'ai_transformation',headline:'Board approved $2M AI budget for 2026 — evaluating CX automation vendors',detail:'CEO mentioned AI transformation in earnings call. Budget allocated but vendors not selected.',why_it_matters:'Budget exists. Vendor selection in progress. This is a live buying cycle.',source_name:'Earnings Call',published_date:'2026-01',confidence:0.88,is_ai:false,status:'verified'},
    {id:'s7',cat:'pain_point',headline:'Customer NPS dropped 12 points in H2 2025',detail:'Agent turnover and response times driving customer dissatisfaction.',why_it_matters:'NPS decline + AI budget = executive urgency. Lead with "reverse the NPS slide in 90 days."',source_name:'Industry Survey',published_date:'2025-12',confidence:0.75,is_ai:true,status:'unverified'}
  ]},
  {id:'sc_mm_4',name:'Apex Manufacturing',ticker:'',industry:'Manufacturing',sector:'Industrial',revenue:'$95M',employees:'450',hq:'Detroit, MI',domain:'apexmfg.com',origin:'seed',fortune_rank:null,_heat:45,
   signals:[
    {id:'s8',cat:'pain_point',headline:'Customer complaint volume up 40% after ERP migration',detail:'Botched ERP rollout causing fulfillment errors and customer service overload.',why_it_matters:'Crisis = speed. They need a fix now, not a 6-month evaluation.',source_name:'Trade Publication',published_date:'2025-11',confidence:0.70,is_ai:true,status:'unverified'}
  ]},
  {id:'sc_mm_5',name:'Riverview Insurance',ticker:'',industry:'Insurance',sector:'Financial Services',revenue:'$290M',employees:'1,100',hq:'Hartford, CT',domain:'riverviewins.com',origin:'seed',fortune_rank:null,_heat:65,
   signals:[
    {id:'s9',cat:'leadership',headline:'CTO Thomas Brennan publicly advocating for AI-first claims processing',detail:'Conference talk and LinkedIn posts about modernizing claims CX.',why_it_matters:'CTO is an internal champion already sold on AI CX. Warm entry via his public content.',source_name:'Conference',published_date:'2026-01',confidence:0.82,is_ai:false,status:'verified'}
  ]},
  {id:'sc_mm_6',name:'Beacon Retail Group',ticker:'',industry:'Retail / E-Commerce',sector:'Consumer',revenue:'$210M',employees:'900',hq:'Atlanta, GA',domain:'beaconretail.com',origin:'seed',fortune_rank:null,_heat:58,
   signals:[
    {id:'s10',cat:'expansion',headline:'Launching DTC channel in Q2 — building customer service from scratch',detail:'Traditionally wholesale-only, now going direct. Zero CX infrastructure for consumers.',why_it_matters:'Greenfield opportunity. No incumbent to displace. Sell the full stack on day one.',source_name:'Press Release',published_date:'2026-02',confidence:0.85,is_ai:false,status:'verified'}
  ]}
];

// Wire advisor connections to these accounts
var advisors=JSON.parse(JSON.stringify(ADVISORS));
advisors[0].companies=['Meridian Logistics','Cascadia Health Systems']; // Sarah Chen (Board)
advisors[1].companies=['Northstar Financial']; // David Okonkwo (Board)
advisors[2].companies=['Meridian Logistics','Beacon Retail Group']; // Rachel Torres (CRO)
advisors[3].companies=['Cascadia Health Systems','Northstar Financial']; // Michael K (VP Sales)
advisors[4].companies=['Northstar Financial']; // Anna (EU)
advisors[5].companies=['Apex Manufacturing','Beacon Retail Group']; // James (Angel)
advisors[6].companies=['Cascadia Health Systems']; // Priya (Angel)
advisors[7].companies=['Cascadia Health Systems']; // Carlos (Healthcare Angel)
advisors[8].companies=['Meridian Logistics']; // Lisa Park (Customer ref)
advisors[9].companies=['Riverview Insurance']; // Thomas Brennan (Customer ref)

var deals=[
  {id:'deal_mm_1',accountName:'Meridian Logistics',value:120000,stage:'negotiation',
   champion:'Samantha Reeves',economicBuyer:'',useCase:'Unified CX platform across 14 distribution centers',
   pain:'Legacy ticketing system, 3x support volume from expansion, agent turnover',
   competition:'Zendesk (incumbent), Freshdesk (evaluated)',decisionProcess:'VP Ops recommends → CFO approves > $75K',
   nextStep:'EB meeting with CFO',nextStepDate:'',closeDate:d(-10),forecastCategory:'bestCase',
   lossReason:null,lossNotes:null,
   stakeholders:[
    {name:'Samantha Reeves',role:'champion',title:'VP Customer Operations',engaged:true},
    {name:'',role:'eb',title:'',engaged:false},
    {name:'Derek Huang',role:'technical',title:'Dir. IT Infrastructure',engaged:true},
    {name:'Patricia Wells',role:'end_user',title:'Support Team Lead',engaged:true}
   ],
   created_at:d(35),updated_at:d(11)},
  {id:'deal_mm_2',accountName:'Cascadia Health Systems',value:95000,stage:'discovery',
   champion:'Maria Santos',economicBuyer:'Dr. Robert Kim',useCase:'HIPAA-compliant patient communication hub',
   pain:'Compliance audit pressure, fragmented systems across 14 locations post-acquisition',
   competition:'',decisionProcess:'Champion + CTO evaluate → COO approves',
   nextStep:'Technical deep-dive with IT team',nextStepDate:d(-3),closeDate:d(-60),forecastCategory:'pipeline',
   lossReason:null,lossNotes:null,
   stakeholders:[
    {name:'Maria Santos',role:'champion',title:'Dir. Patient Experience',engaged:true},
    {name:'Dr. Robert Kim',role:'eb',title:'COO',engaged:true},
    {name:'Janet Liu',role:'technical',title:'CTO',engaged:true},
    {name:'Karen Walsh',role:'legal',title:'Compliance Officer',engaged:false}
   ],
   created_at:d(18),updated_at:d(3)},
  {id:'deal_mm_3',accountName:'Northstar Financial',value:80000,stage:'evaluation',
   champion:'Alex Petrov',economicBuyer:'',useCase:'AI-powered claims routing and customer self-service',
   pain:'NPS dropped 12 points, agent turnover at 35%, response times 2x industry avg',
   competition:'Ada (evaluated), Intercom (shortlisted)',decisionProcess:'',
   nextStep:'Competitive bake-off presentation',nextStepDate:d(-5),closeDate:d(-45),forecastCategory:'pipeline',
   lossReason:null,lossNotes:null,
   stakeholders:[
    {name:'Alex Petrov',role:'champion',title:'VP Digital',engaged:true},
    {name:'',role:'eb',title:'',engaged:false},
    {name:'Ryan O\'Brien',role:'technical',title:'Sr. Engineer',engaged:true}
   ],
   created_at:d(22),updated_at:d(5)},
  {id:'deal_mm_4',accountName:'Apex Manufacturing',value:12000,stage:'prospect',
   champion:'',economicBuyer:'',useCase:'Emergency CX triage after ERP migration failure',
   pain:'Customer complaint volume up 40%, fulfillment errors',
   competition:'',decisionProcess:'',
   nextStep:'',nextStepDate:'',closeDate:'',forecastCategory:'pipeline',
   lossReason:null,lossNotes:null,
   stakeholders:[],
   created_at:d(48),updated_at:d(42)},
  {id:'deal_mm_5',accountName:'Riverview Insurance',value:110000,stage:'closed-won',
   champion:'Thomas Brennan',economicBuyer:'Margaret Chen',useCase:'AI claims processing and policyholder self-service',
   pain:'Manual claims review bottleneck, 72-hour avg response time',
   competition:'Pega (lost)',decisionProcess:'CTO recommends → CEO approves',
   nextStep:'',nextStepDate:'',closeDate:d(15),forecastCategory:'commit',
   lossReason:null,lossNotes:null,
   stakeholders:[
    {name:'Thomas Brennan',role:'champion',title:'CTO',engaged:true},
    {name:'Margaret Chen',role:'eb',title:'CEO',engaged:true},
    {name:'David Park',role:'technical',title:'VP Engineering',engaged:true},
    {name:'Lisa Huang',role:'end_user',title:'Claims Supervisor',engaged:true},
    {name:'Robert Taylor',role:'legal',title:'General Counsel',engaged:true}
   ],
   created_at:d(90),updated_at:d(15)},
  {id:'deal_mm_6',accountName:'Beacon Retail Group',value:75000,stage:'closed-lost',
   champion:'Nicole Adams',economicBuyer:'',useCase:'DTC customer service platform',
   pain:'Zero CX infrastructure for new DTC channel',
   competition:'Gorgias (won)',decisionProcess:'VP E-Commerce recommends → CFO approves',
   nextStep:'',nextStepDate:'',closeDate:d(8),forecastCategory:'pipeline',
   lossReason:'competitor',lossNotes:'Lost to Gorgias on price. Champion liked our AI capabilities but CFO chose the cheaper option. No EB engagement — should have gotten above the VP level.',
   stakeholders:[
    {name:'Nicole Adams',role:'champion',title:'VP E-Commerce',engaged:true},
    {name:'',role:'eb',title:'',engaged:false}
   ],
   created_at:d(55),updated_at:d(8)}
];

var stageHistory={};
stageHistory['deal_mm_1']=[{from:'',to:'prospect',at:d(35)},{from:'prospect',to:'discovery',at:d(28)},{from:'discovery',to:'evaluation',at:d(20)},{from:'evaluation',to:'negotiation',at:d(14)}];
stageHistory['deal_mm_2']=[{from:'',to:'prospect',at:d(18)},{from:'prospect',to:'discovery',at:d(12)}];
stageHistory['deal_mm_3']=[{from:'',to:'prospect',at:d(22)},{from:'prospect',to:'discovery',at:d(16)},{from:'discovery',to:'evaluation',at:d(8)}];
stageHistory['deal_mm_4']=[{from:'',to:'prospect',at:d(48)}];
stageHistory['deal_mm_5']=[{from:'',to:'prospect',at:d(90)},{from:'prospect',to:'discovery',at:d(75)},{from:'discovery',to:'evaluation',at:d(60)},{from:'evaluation',to:'negotiation',at:d(40)},{from:'negotiation',to:'verbal',at:d(22)},{from:'verbal',to:'closed-won',at:d(15)}];
stageHistory['deal_mm_6']=[{from:'',to:'prospect',at:d(55)},{from:'prospect',to:'discovery',at:d(42)},{from:'discovery',to:'evaluation',at:d(30)},{from:'evaluation',to:'closed-lost',at:d(8)}];

return {
  seed:{annual_quota:500000,avg_deal_size:80000,win_rate:20,touch_to_meeting:0.7,show_rate:80,cycle_days:90,coverage_target:3.5,acv_band:'mid'},
  playbook:{company:COMPANY,stage:'Seed / Pre-Series A',acv:80000,fields:{value_prop:'AI-powered CX platform that reduces resolution time by 40% and automates 60% of routine inquiries',ideal_customer:'Mid-market companies (500-5,000 employees) with high support volume and legacy ticketing systems',sales_motion:'Signal-driven outbound → discovery → technical evaluation → PoC → commercial negotiation',competitive_advantage:'Category-specific AI models trained on CX data, not generic LLMs. 2-week implementation vs. 6-month enterprise deployments.',key_objection:'\"We already have Zendesk/Freshdesk\" — our response: we sit on top of existing tools, not replace them. Augmentation, not migration.',champion_profile:'VP/Dir Customer Operations or VP Digital — someone who owns CSAT/NPS and has budget authority or direct access to it',loss_pattern:'Deals die when we don\'t get above the champion to the EB. Single-threaded deals at $75K+ close at 8% vs 34% with EB engagement.',win_pattern:'Fastest closes have: EB engaged by week 2, PoC scoped in discovery, and a compliance or expansion trigger creating urgency.'},checks:{icp_defined:true,discovery_method:true,objection_handling:true,competitive_positioning:true,loss_patterns:true},notes:'Vectyr AI sells to mid-market CX teams that are drowning in support volume after expansion, acquisition, or compliance pressure. Our scope is speed: 2-week implementation, AI that actually understands their domain, and a platform that sits on top of their existing stack. The new hire should know: we lose when we stay single-threaded. Every deal over $75K needs an EB meeting by week 2 or the close rate drops from 34% to 8%. Use the advisory network — Sarah Chen and Rachel Torres have connections at half our pipeline.'},
  icps:[
    {id:'icp_1',name:'Mid-Market CX Expansion',industry:'Technology / SaaS',size:'500-2000 employees',geo:'North America',buyer:'VP Customer Operations',pain:'Support volume scaling faster than team, legacy tools breaking',trigger:'Expansion (new offices, acquisitions, product launches)',proofWindow:'60-90 days',worked:true,statement:'We sell to mid-market companies expanding faster than their CX tools can handle, where the VP of Customer Ops needs to show the board that support quality isn\'t degrading.',saved_at:d(60)},
    {id:'icp_2',name:'Healthcare Compliance',industry:'Healthcare / HealthTech',size:'1000-5000 employees',geo:'US',buyer:'Director Patient Experience',pain:'HIPAA compliance gaps in patient communication',trigger:'Audit deadline or acquisition integration',proofWindow:'60-120 days',worked:true,statement:'Healthcare orgs facing compliance audits who need to document and automate patient communication workflows before regulators arrive.',saved_at:d(45)},
    {id:'icp_3',name:'Financial Services AI',industry:'Financial Services',size:'500-3000 employees',geo:'US + EU',buyer:'VP Digital / Head of Innovation',pain:'NPS decline, agent turnover, response time degradation',trigger:'AI budget approved, vendor evaluation in progress',proofWindow:'90-120 days',worked:false,statement:'Financial services companies with approved AI budgets who are actively evaluating CX automation vendors.',saved_at:d(30)}
  ],
  accounts:accts,
  deals:deals,
  stageHistory:stageHistory,
  advisors:advisors,
  deployments:[
    {id:'dep_1',dealName:'Meridian Logistics',momentId:'eb_bridge',advisorId:'adv_01',outcome:'pending',outcomeDate:null,notes:'Sarah reaching out to CFO this week',createdAt:d(3)},
    {id:'dep_2',dealName:'Riverview Insurance',momentId:'intro',advisorId:'adv_09',outcome:'successful',outcomeDate:d(80),notes:'Lisa\'s intro got us the first meeting with CTO',createdAt:d(85)},
    {id:'dep_3',dealName:'Northstar Financial',momentId:'competitor',advisorId:'adv_02',outcome:'engaged',outcomeDate:d(4),notes:'David offered to call the VP Digital directly',createdAt:d(6)},
    {id:'dep_4',dealName:'Beacon Retail Group',momentId:'eb_bridge',advisorId:'adv_06',outcome:'no_response',outcomeDate:d(12),notes:'James emailed but no reply from CFO',createdAt:d(20)},
    {id:'dep_5',dealName:'Cascadia Health Systems',momentId:'intro',advisorId:'adv_07',outcome:'successful',outcomeDate:d(16),notes:'Priya\'s Google Cloud connection got us the first meeting',createdAt:d(18)}
  ]
};
}

// ══════════════════════════════════════════════════════════════
// SCENARIO: ENTERPRISE
// ══════════════════════════════════════════════════════════════
function enterprise(){
var accts=[
  {id:'sc_ent_1',name:'Meridian Logistics Global',ticker:'MRDG',industry:'Logistics / Supply Chain',sector:'Technology',revenue:'$2.1B',employees:'8,500',hq:'Chicago, IL',domain:'meridianlogisticsglobal.com',origin:'seed',fortune_rank:null,_heat:91,
   signals:[
    {id:'e1',cat:'expansion',headline:'$300M acquisition of PacificRoute — integrating 4 contact centers across APAC',detail:'Largest acquisition in company history. 1,200 new support agents with different tools and processes.',why_it_matters:'Massive integration = urgent CX unification need. 4 contact centers on 3 different platforms.',source_name:'SEC Filing',published_date:'2026-01',confidence:0.95,is_ai:false,status:'verified'},
    {id:'e2',cat:'leadership',headline:'Chief Customer Officer role created — Samantha Reeves promoted from VP',detail:'New C-level role signals CX becoming a board-level priority.',why_it_matters:'CCO creation = executive sponsorship path that didn\'t exist before. Direct EB access.',source_name:'Press Release',published_date:'2026-02',confidence:0.92,is_ai:false,status:'verified'},
    {id:'e3',cat:'ai_transformation',headline:'CEO committed to "AI-first operations" in annual shareholder letter',detail:'$50M allocated to AI transformation across supply chain and customer operations.',why_it_matters:'$50M AI budget. The question isn\'t whether they buy AI CX — it\'s whose.',source_name:'Annual Report',published_date:'2026-01',confidence:0.90,is_ai:false,status:'verified'}
  ]},
  {id:'sc_ent_2',name:'Cascadia Health Network',ticker:'CSCN',industry:'Healthcare',sector:'Services',revenue:'$4.2B',employees:'22,000',hq:'Portland, OR',domain:'cascadiahealth.org',origin:'seed',fortune_rank:null,_heat:84,
   signals:[
    {id:'e4',cat:'compliance',headline:'CMS audit findings require patient communication overhaul by Q4 2026',detail:'Federal audit identified 3 critical gaps in patient notification systems.',why_it_matters:'Regulatory mandate with a hard deadline. This deal has a built-in close date.',source_name:'CMS Report',published_date:'2026-01',confidence:0.93,is_ai:false,status:'verified'},
    {id:'e5',cat:'pain_point',headline:'Patient satisfaction scores dropped to 67th percentile — below Medicare reimbursement threshold',detail:'Satisfaction-linked reimbursement at risk. Estimated $18M revenue impact.',why_it_matters:'$18M revenue at risk from CX quality. The ROI case writes itself.',source_name:'Industry Report',published_date:'2025-12',confidence:0.87,is_ai:false,status:'verified'}
  ]},
  {id:'sc_ent_3',name:'Northstar Capital Partners',ticker:'NCAP',industry:'Financial Services',sector:'Asset Management',revenue:'$890M',employees:'2,400',hq:'New York, NY',domain:'northstarcap.com',origin:'seed',fortune_rank:null,_heat:78,
   signals:[
    {id:'e6',cat:'ai_transformation',headline:'Board approved enterprise AI platform — RFP issued for client services automation',detail:'Formal RFP with 90-day evaluation timeline. 6 vendors invited.',why_it_matters:'Active RFP. We need to be in this evaluation cycle or we\'re locked out for 3 years.',source_name:'Industry Source',published_date:'2026-02',confidence:0.85,is_ai:false,status:'verified'}
  ]},
  {id:'sc_ent_4',name:'Pinnacle Defense Systems',ticker:'PNCL',industry:'Defense / Aerospace',sector:'Government',revenue:'$1.8B',employees:'6,200',hq:'Arlington, VA',domain:'pinnacledefense.com',origin:'seed',fortune_rank:null,_heat:42,
   signals:[
    {id:'e7',cat:'pain_point',headline:'Internal help desk ticket backlog reached 14,000 — contractor support overwhelmed',detail:'IT support infrastructure failing. Contractors hired but not solving root cause.',why_it_matters:'Throwing contractors at a systems problem. Perfect case for AI automation of L1/L2 support.',source_name:'Industry Analysis',published_date:'2025-10',confidence:0.68,is_ai:true,status:'unverified'}
  ]},
  {id:'sc_ent_5',name:'Trident Pharmaceuticals',ticker:'TRDT',industry:'Pharmaceuticals',sector:'Healthcare',revenue:'$3.6B',employees:'15,000',hq:'Cambridge, MA',domain:'tridentpharma.com',origin:'seed',fortune_rank:null,_heat:70,
   signals:[
    {id:'e8',cat:'expansion',headline:'Launched 2 new specialty drugs — patient support program scaling from 5K to 40K patients',detail:'8x patient volume increase requires automated communication and case management.',why_it_matters:'8x volume = current systems will break. Sell before the crisis, not during it.',source_name:'FDA Filings',published_date:'2026-01',confidence:0.88,is_ai:false,status:'verified'}
  ]},
  {id:'sc_ent_6',name:'Atlas Energy Corp',ticker:'ATLC',industry:'Energy / Utilities',sector:'Infrastructure',revenue:'$2.8B',employees:'9,800',hq:'Houston, TX',domain:'atlasenergy.com',origin:'seed',fortune_rank:null,_heat:55,
   signals:[
    {id:'e9',cat:'compliance',headline:'State PUC mandating customer notification improvements after outage communication failures',detail:'Regulatory order requiring real-time customer communication during service disruptions.',why_it_matters:'Regulatory mandate = guaranteed budget. Compliance deadline creates natural urgency.',source_name:'Regulatory Filing',published_date:'2025-11',confidence:0.80,is_ai:false,status:'verified'}
  ]},
  {id:'sc_ent_7',name:'Summit Hospitality Group',ticker:'',industry:'Hospitality',sector:'Consumer Services',revenue:'$1.2B',employees:'4,500',hq:'Las Vegas, NV',domain:'summithospitality.com',origin:'seed',fortune_rank:null,_heat:62,
   signals:[
    {id:'e10',cat:'leadership',headline:'New Chief Digital Officer from Marriott — mandate to unify guest communication',detail:'CDO brought in specifically to modernize guest-facing technology.',why_it_matters:'New CDO with transformation mandate. 90-day window before they pick their stack.',source_name:'LinkedIn',published_date:'2026-02',confidence:0.82,is_ai:false,status:'verified'}
  ]}
];

var advisors=JSON.parse(JSON.stringify(ADVISORS));
advisors[0].companies=['Meridian Logistics Global','Trident Pharmaceuticals'];
advisors[1].companies=['Northstar Capital Partners','Meridian Logistics Global'];
advisors[2].companies=['Meridian Logistics Global','Summit Hospitality Group'];
advisors[3].companies=['Cascadia Health Network','Northstar Capital Partners'];
advisors[4].companies=['Northstar Capital Partners'];
advisors[5].companies=['Pinnacle Defense Systems','Atlas Energy Corp'];
advisors[6].companies=['Cascadia Health Network'];
advisors[7].companies=['Cascadia Health Network','Trident Pharmaceuticals'];
advisors[8].companies=['Meridian Logistics Global'];
advisors[9].companies=['Trident Pharmaceuticals'];

var deals=[
  {id:'deal_ent_1',accountName:'Meridian Logistics Global',value:280000,stage:'negotiation',
   champion:'Samantha Reeves',economicBuyer:'',useCase:'Enterprise CX unification across 4 acquired contact centers',
   pain:'4 contact centers on 3 platforms post-acquisition, no unified reporting, $50M AI budget allocated',
   competition:'Salesforce Service Cloud (incumbent), Genesys (evaluated)',decisionProcess:'CCO recommends → CFO + CEO approve > $200K',
   nextStep:'Executive briefing with CFO',nextStepDate:'',closeDate:d(-14),forecastCategory:'bestCase',
   lossReason:null,lossNotes:null,
   stakeholders:[
    {name:'Samantha Reeves',role:'champion',title:'Chief Customer Officer',engaged:true},
    {name:'',role:'eb',title:'',engaged:false},
    {name:'James Chen',role:'technical',title:'VP Engineering',engaged:true},
    {name:'Derek Huang',role:'end_user',title:'Contact Center Director',engaged:true},
    {name:'',role:'legal',title:'',engaged:false}
   ],
   created_at:d(42),updated_at:d(13)},
  {id:'deal_ent_2',accountName:'Cascadia Health Network',value:195000,stage:'discovery',
   champion:'Dr. Amy Foster',economicBuyer:'Robert Kim',useCase:'HIPAA-compliant patient communication platform — CMS mandate',
   pain:'CMS audit findings, satisfaction below Medicare threshold, $18M reimbursement at risk',
   competition:'',decisionProcess:'CMO + CTO evaluate → COO approves',
   nextStep:'Compliance gap analysis with IT + Legal',nextStepDate:d(-4),closeDate:d(-75),forecastCategory:'pipeline',
   lossReason:null,lossNotes:null,
   stakeholders:[
    {name:'Dr. Amy Foster',role:'champion',title:'VP Patient Experience',engaged:true},
    {name:'Robert Kim',role:'eb',title:'COO',engaged:true},
    {name:'Janet Liu',role:'technical',title:'CIO',engaged:true},
    {name:'Karen Walsh',role:'legal',title:'Chief Compliance Officer',engaged:true}
   ],
   created_at:d(20),updated_at:d(4)},
  {id:'deal_ent_3',accountName:'Northstar Capital Partners',value:180000,stage:'evaluation',
   champion:'Marcus Webb',economicBuyer:'',useCase:'Client services AI platform — formal RFP response',
   pain:'Client service quality inconsistent across 12 offices, manual processes, 6 competing vendors',
   competition:'Kustomer, Intercom, Ada, Drift, Five9',decisionProcess:'RFP committee → Managing Partner approves',
   nextStep:'RFP presentation (round 2)',nextStepDate:d(-7),closeDate:d(-50),forecastCategory:'pipeline',
   lossReason:null,lossNotes:null,
   stakeholders:[
    {name:'Marcus Webb',role:'champion',title:'Head of Client Services',engaged:true},
    {name:'',role:'eb',title:'',engaged:false},
    {name:'Sarah Johannsen',role:'technical',title:'VP Technology',engaged:true}
   ],
   created_at:d(25),updated_at:d(6)},
  {id:'deal_ent_4',accountName:'Pinnacle Defense Systems',value:14000,stage:'prospect',
   champion:'',economicBuyer:'',useCase:'IT help desk automation pilot',
   pain:'14K ticket backlog, contractor costs spiraling',
   competition:'',decisionProcess:'',
   nextStep:'',nextStepDate:'',closeDate:'',forecastCategory:'pipeline',
   lossReason:null,lossNotes:null,
   stakeholders:[],
   created_at:d(52),updated_at:d(44)},
  {id:'deal_ent_5',accountName:'Trident Pharmaceuticals',value:220000,stage:'closed-won',
   champion:'Dr. Michelle Laurent',economicBuyer:'CFO David Nakamura',useCase:'Patient support program automation — 5K to 40K patient scale',
   pain:'8x patient volume increase, manual case management breaking, regulatory reporting requirements',
   competition:'Veeva (incumbent for CRM, not CX)',decisionProcess:'VP Patient Services → CFO approves',
   nextStep:'',nextStepDate:'',closeDate:d(12),forecastCategory:'commit',
   lossReason:null,lossNotes:null,
   stakeholders:[
    {name:'Dr. Michelle Laurent',role:'champion',title:'VP Patient Services',engaged:true},
    {name:'David Nakamura',role:'eb',title:'CFO',engaged:true},
    {name:'Chris Anderson',role:'technical',title:'VP IT',engaged:true},
    {name:'Rebecca Torres',role:'end_user',title:'Patient Support Manager',engaged:true},
    {name:'Alan Weiss',role:'legal',title:'Regulatory Affairs Director',engaged:true},
    {name:'Jennifer Park',role:'executive',title:'Chief Medical Officer',engaged:true}
   ],
   created_at:d(105),updated_at:d(12)},
  {id:'deal_ent_6',accountName:'Atlas Energy Corp',value:160000,stage:'closed-lost',
   champion:'Brian Murphy',economicBuyer:'',useCase:'Customer notification and outage communication platform',
   pain:'Regulatory mandate for real-time communication, PUC compliance deadline',
   competition:'Everbridge (won)',decisionProcess:'VP Customer Ops recommends → SVP approves',
   nextStep:'',nextStepDate:'',closeDate:d(10),forecastCategory:'pipeline',
   lossReason:'no_decision',lossNotes:'Deal stalled in procurement for 8 weeks. Champion got reassigned to another project. No executive sponsor ever engaged. Everbridge came in with a pre-existing relationship at the SVP level and closed in 3 weeks. We were outsold, not outproduced.',
   stakeholders:[
    {name:'Brian Murphy',role:'champion',title:'VP Customer Operations',engaged:true},
    {name:'',role:'eb',title:'',engaged:false}
   ],
   created_at:d(70),updated_at:d(10)},
  {id:'deal_ent_7',accountName:'Summit Hospitality Group',value:150000,stage:'prospect',
   champion:'',economicBuyer:'',useCase:'Guest communication unification',
   pain:'Fragmented guest communication across 45 properties',
   competition:'',decisionProcess:'',
   nextStep:'Intro meeting with CDO',nextStepDate:d(-5),closeDate:'',forecastCategory:'pipeline',
   lossReason:null,lossNotes:null,
   stakeholders:[],
   created_at:d(8),updated_at:d(2)}
];

var stageHistory={};
stageHistory['deal_ent_1']=[{from:'',to:'prospect',at:d(42)},{from:'prospect',to:'discovery',at:d(33)},{from:'discovery',to:'evaluation',at:d(22)},{from:'evaluation',to:'negotiation',at:d(16)}];
stageHistory['deal_ent_2']=[{from:'',to:'prospect',at:d(20)},{from:'prospect',to:'discovery',at:d(14)}];
stageHistory['deal_ent_3']=[{from:'',to:'prospect',at:d(25)},{from:'prospect',to:'discovery',at:d(18)},{from:'discovery',to:'evaluation',at:d(10)}];
stageHistory['deal_ent_4']=[{from:'',to:'prospect',at:d(52)}];
stageHistory['deal_ent_5']=[{from:'',to:'prospect',at:d(105)},{from:'prospect',to:'discovery',at:d(88)},{from:'discovery',to:'evaluation',at:d(70)},{from:'evaluation',to:'poc',at:d(50)},{from:'poc',to:'negotiation',at:d(32)},{from:'negotiation',to:'verbal',at:d(18)},{from:'verbal',to:'closed-won',at:d(12)}];
stageHistory['deal_ent_6']=[{from:'',to:'prospect',at:d(70)},{from:'prospect',to:'discovery',at:d(55)},{from:'discovery',to:'evaluation',at:d(38)},{from:'evaluation',to:'closed-lost',at:d(10)}];
stageHistory['deal_ent_7']=[{from:'',to:'prospect',at:d(8)}];

return {
  seed:{annual_quota:1200000,avg_deal_size:180000,win_rate:15,touch_to_meeting:0.7,show_rate:80,cycle_days:180,coverage_target:4.5,acv_band:'enterprise'},
  playbook:{company:COMPANY,stage:'Seed / Pre-Series A',acv:180000,fields:{value_prop:'Enterprise AI-powered CX platform that unifies contact centers, automates 60% of routine interactions, and provides real-time compliance reporting',ideal_customer:'Enterprise companies (5,000+ employees) with multi-location contact centers, high support volume, and regulatory compliance requirements',sales_motion:'Signal-driven outbound → executive discovery → technical evaluation → PoC/pilot → procurement → commercial close',competitive_advantage:'Domain-specific AI models (not generic LLMs), 4-week enterprise implementation vs. 6-month Salesforce deployments, and a compliance-first architecture that passes HIPAA/SOC2/PCI audits on day one',key_objection:'\"We\'re a Salesforce shop\" — we integrate with Service Cloud, not replace it. Our AI layer sits on top. Zero migration risk.',champion_profile:'VP/Dir Customer Operations, Chief Customer Officer, or VP Digital — someone who owns CSAT/NPS at the executive level and has direct budget authority over $150K+',loss_pattern:'We lose when: (1) we never get above the champion to the EB, (2) procurement stalls without executive air cover, or (3) an incumbent with a pre-existing executive relationship closes before we can build one. The Atlas Energy loss is the textbook example.',win_pattern:'Fastest enterprise closes have: EB engaged by week 3, a PoC scoped during discovery (not after), a compliance or regulatory trigger creating a hard deadline, and an advisor deployment to bridge the executive gap.'},checks:{icp_defined:true,discovery_method:true,objection_handling:true,competitive_positioning:true,loss_patterns:true},notes:'Vectyr AI sells enterprise CX platforms to large organizations drowning in multi-location complexity, regulatory pressure, or post-acquisition integration chaos. Our moat is speed and specificity — we implement in 4 weeks what Salesforce takes 6 months to deploy, and our AI models are trained on domain-specific CX data, not generic language models. The new hire needs to understand: enterprise deals die in procurement. Every deal over $150K needs an executive sponsor engaged by week 3 and an advisor deployment strategy for the EB bridge. Reference the advisory network — Sarah Chen and David Okonkwo have board-level connections at half our target accounts.'},
  icps:[
    {id:'icp_e1',name:'Enterprise Multi-Location CX',industry:'Logistics / Transportation / Manufacturing',size:'5000+ employees',geo:'North America',buyer:'Chief Customer Officer / VP Ops',pain:'Multi-location CX fragmentation post-acquisition or expansion',trigger:'Acquisition, major expansion, or CX leadership change',proofWindow:'90-120 days',worked:true,statement:'We sell to enterprise companies operating multiple contact centers across locations where CX quality is inconsistent and executive leadership has made it a board-level priority.',saved_at:d(55)},
    {id:'icp_e2',name:'Regulated Enterprise (Healthcare/Finance)',industry:'Healthcare / Financial Services',size:'2000-25000 employees',geo:'US',buyer:'VP Patient Experience / Head of Client Services',pain:'Regulatory compliance gaps in customer/patient communication',trigger:'Audit finding, regulatory mandate, or compliance deadline',proofWindow:'60-120 days',worked:true,statement:'Regulated enterprises where a compliance event has created a hard deadline for CX infrastructure modernization and the budget conversation is already happening.',saved_at:d(40)},
    {id:'icp_e3',name:'AI-Budget Enterprise',industry:'Any',size:'1000-10000 employees',geo:'US + EU',buyer:'VP Digital / Chief Innovation Officer',pain:'Approved AI budget, active vendor evaluation, competitive pressure to adopt',trigger:'Board-approved AI budget or formal RFP issued',proofWindow:'90-180 days',worked:false,statement:'Enterprises with approved AI budgets actively evaluating CX automation vendors through formal procurement processes.',saved_at:d(25)}
  ],
  accounts:accts,
  deals:deals,
  stageHistory:stageHistory,
  advisors:advisors,
  deployments:[
    {id:'dep_e1',dealName:'Meridian Logistics Global',momentId:'eb_bridge',advisorId:'adv_01',outcome:'pending',outcomeDate:null,notes:'Sarah emailing CFO this week',createdAt:d(3)},
    {id:'dep_e2',dealName:'Trident Pharmaceuticals',momentId:'intro',advisorId:'adv_10',outcome:'successful',outcomeDate:d(100),notes:'Thomas intro\'d us to VP Patient Services',createdAt:d(105)},
    {id:'dep_e3',dealName:'Northstar Capital Partners',momentId:'competitor',advisorId:'adv_02',outcome:'engaged',outcomeDate:d(5),notes:'David offering to call Managing Partner directly',createdAt:d(7)},
    {id:'dep_e4',dealName:'Atlas Energy Corp',momentId:'procurement',advisorId:'adv_06',outcome:'no_response',outcomeDate:d(15),notes:'James emailed SVP but no response before deal was lost',createdAt:d(25)},
    {id:'dep_e5',dealName:'Cascadia Health Network',momentId:'intro',advisorId:'adv_07',outcome:'successful',outcomeDate:d(18),notes:'Priya connected us through her Google Cloud health network',createdAt:d(20)}
  ]
};
}

function buildTerritoryArchitectSeed(mode){
  if(mode==='ent'){
    return {
      setup:{completedAt:d(120),version:2},
      territory:{healthScore:79,lastPulse:d(3).slice(0,10),pulseSkips:0,salesCycle:'3-6m',createdAt:d(120)},
      theses:[
        {id:'ta_ent_th_1',name:'Integration pressure',pressure:'Post-acquisition support operations are fragmenting',segment:'enterprise operators consolidating support across regions',leverage:'we can unify service motion before the integration debt hardens',fullStatement:'Post-acquisition support operations are fragmenting for enterprise operators consolidating support across regions, and we can unify service motion before the integration debt hardens.',version:1,status:'active',createdAt:d(120),versions:[{v:1,statement:'Post-acquisition support operations are fragmenting for enterprise operators consolidating support across regions, and we can unify service motion before the integration debt hardens.',date:d(120)}]},
        {id:'ta_ent_th_2',name:'Compliance revenue risk',pressure:'Compliance and patient/service outcomes are threatening revenue',segment:'regulated operators with hard communication deadlines',leverage:'we can turn compliance pressure into an operational rollout instead of a documentation scramble',fullStatement:'Compliance and patient/service outcomes are threatening revenue for regulated operators with hard communication deadlines, and we can turn compliance pressure into an operational rollout instead of a documentation scramble.',version:1,status:'active',createdAt:d(116),versions:[{v:1,statement:'Compliance and patient/service outcomes are threatening revenue for regulated operators with hard communication deadlines, and we can turn compliance pressure into an operational rollout instead of a documentation scramble.',date:d(116)}]},
        {id:'ta_ent_th_3',name:'AI selection window',pressure:'AI budget is live but ownership is still being decided',segment:'enterprise teams entering formal platform selection',leverage:'we can frame the evaluation around operator proof instead of abstract transformation language',fullStatement:'AI budget is live but ownership is still being decided for enterprise teams entering formal platform selection, and we can frame the evaluation around operator proof instead of abstract transformation language.',version:1,status:'active',createdAt:d(110),versions:[{v:1,statement:'AI budget is live but ownership is still being decided for enterprise teams entering formal platform selection, and we can frame the evaluation around operator proof instead of abstract transformation language.',date:d(110)}]}
      ],
      approaches:[
        {id:'ta_ent_ap_1',thesisId:'ta_ent_th_1',category:'exec-bridge',name:'CCO integration review',description:'Use the acquisition integration agenda to get the CCO and finance into one room.',status:'active',createdAt:d(108),retiredAt:null},
        {id:'ta_ent_ap_2',thesisId:'ta_ent_th_1',category:'ops-proof',name:'Contact-center fracture proof',description:'Lead with tooling fragmentation and queue/reporting inconsistency across sites.',status:'active',createdAt:d(107),retiredAt:null},
        {id:'ta_ent_ap_3',thesisId:'ta_ent_th_2',category:'risk-case',name:'Audit deadline opener',description:'Open on the deadline, the communication gap, and the revenue risk if it stays manual.',status:'active',createdAt:d(106),retiredAt:null},
        {id:'ta_ent_ap_4',thesisId:'ta_ent_th_2',category:'patient-impact',name:'Outcome protection path',description:'Use patient/service outcomes and reimbursement exposure to force the urgency.',status:'active',createdAt:d(105),retiredAt:null},
        {id:'ta_ent_ap_5',thesisId:'ta_ent_th_3',category:'selection-frame',name:'Evaluation criteria reset',description:'Reset the buying criteria around operator proof, not generic AI ambition.',status:'active',createdAt:d(104),retiredAt:null},
        {id:'ta_ent_ap_6',thesisId:'ta_ent_th_3',category:'eb-access',name:'Budget-owner bridge',description:'Get to the economic owner before the RFP gets trapped in platform feature scoring.',status:'active',createdAt:d(103),retiredAt:null}
      ],
      accounts:[
        {id:'ta_ent_acct_1',name:'Meridian Logistics Global',tier:1,thesisId:'ta_ent_th_1',leverageType:'existing-proof-point',additionTrigger:'signal-event',status:'active',addedAt:d(58),overrideCount:0},
        {id:'ta_ent_acct_2',name:'Cascadia Health Network',tier:1,thesisId:'ta_ent_th_2',leverageType:'network-connection',additionTrigger:'signal-event',status:'active',addedAt:d(47),overrideCount:0},
        {id:'ta_ent_acct_3',name:'Trident Pharmaceuticals',tier:1,thesisId:'ta_ent_th_2',leverageType:'market-signal',additionTrigger:'signal-event',status:'active',addedAt:d(44),overrideCount:0},
        {id:'ta_ent_acct_4',name:'Northstar Capital Partners',tier:2,thesisId:'ta_ent_th_3',leverageType:'market-signal',additionTrigger:'signal-event',status:'active',addedAt:d(38),overrideCount:0},
        {id:'ta_ent_acct_5',name:'Summit Hospitality Group',tier:2,thesisId:'ta_ent_th_1',leverageType:'network-connection',additionTrigger:'network-opportunity',status:'active',addedAt:d(33),overrideCount:0},
        {id:'ta_ent_acct_6',name:'Atlas Energy Corp',tier:3,thesisId:'ta_ent_th_2',leverageType:'market-signal',additionTrigger:'strategic-bet',status:'active',addedAt:d(61),overrideCount:0},
        {id:'ta_ent_acct_7',name:'Pinnacle Defense Systems',tier:3,thesisId:'ta_ent_th_3',leverageType:'cold',additionTrigger:'strategic-bet',status:'active',addedAt:d(67),overrideCount:0}
      ],
      signals:[
        {id:'ta_ent_sig_1',accountId:'ta_ent_acct_1',description:'APAC contact-center integration still running on three tools.',type:'expansion',timestamp:d(4)},
        {id:'ta_ent_sig_2',accountId:'ta_ent_acct_2',description:'CMS deadline now linked to reimbursement exposure.',type:'competitive',timestamp:d(6)},
        {id:'ta_ent_sig_3',accountId:'ta_ent_acct_3',description:'Patient support program scaling faster than service ops can absorb.',type:'expansion',timestamp:d(5)},
        {id:'ta_ent_sig_4',accountId:'ta_ent_acct_4',description:'RFP clock is real but budget owner is still not engaged.',type:'leadership',timestamp:d(3)},
        {id:'ta_ent_sig_5',accountId:'ta_ent_acct_5',description:'New CDO is reshaping guest communication stack.',type:'leadership',timestamp:d(9)},
        {id:'ta_ent_sig_6',accountId:'ta_ent_acct_7',description:'Backlog is real but ownership stays buried in IT.',type:'other',timestamp:d(26)}
      ],
      dispositions:[
        {id:'ta_ent_disp_1',accountId:'ta_ent_acct_1',type:'signal-detected',description:'Integration pressure escalated after APAC acquisition close.',signalType:'expansion',timestamp:d(4)},
        {id:'ta_ent_disp_2',accountId:'ta_ent_acct_1',type:'progressing',approachUsed:'ta_ent_ap_1',angleWorked:'ta_ent_ap_1',timestamp:d(2)},
        {id:'ta_ent_disp_3',accountId:'ta_ent_acct_2',type:'signal-detected',description:'Audit deadline tied to measurable revenue exposure.',signalType:'competitive',timestamp:d(6)},
        {id:'ta_ent_disp_4',accountId:'ta_ent_acct_2',type:'progressing',approachUsed:'ta_ent_ap_3',angleWorked:'ta_ent_ap_3',timestamp:d(3)},
        {id:'ta_ent_disp_5',accountId:'ta_ent_acct_3',type:'signal-detected',description:'Support scale curve widened after launch forecast was revised.',signalType:'expansion',timestamp:d(5)},
        {id:'ta_ent_disp_6',accountId:'ta_ent_acct_3',type:'progressing',approachUsed:'ta_ent_ap_4',angleWorked:'ta_ent_ap_4',timestamp:d(1)},
        {id:'ta_ent_disp_7',accountId:'ta_ent_acct_4',type:'signal-detected',description:'Evaluation is live but still stuck below the true budget owner.',signalType:'leadership',timestamp:d(3)},
        {id:'ta_ent_disp_8',accountId:'ta_ent_acct_4',type:'engaged-stalled',approachUsed:'ta_ent_ap_5',blocker:'Economic buyer still not in the thread.',timestamp:d(2)},
        {id:'ta_ent_disp_9',accountId:'ta_ent_acct_5',type:'engaged-stalled',approachUsed:'ta_ent_ap_2',blocker:'Ops lead agrees with pain but has not opened the live system review.',timestamp:d(8)},
        {id:'ta_ent_disp_10',accountId:'ta_ent_acct_6',type:'no-traction',approachUsed:'ta_ent_ap_4',timestamp:d(15)},
        {id:'ta_ent_disp_11',accountId:'ta_ent_acct_7',type:'no-traction',approachUsed:'ta_ent_ap_5',timestamp:d(19)}
      ],
      swapHistory:[{id:'ta_ent_swap_1',accountRemoved:'archived_enterprise_placeholder',accountAdded:'ta_ent_acct_5',reason:'signal-upgrade',timestamp:d(21)}],
      retierHistory:[{id:'ta_ent_retier_1',date:d(18),summary:'Field tightened around integration and compliance pressure.'}],
      calibrations:{progression:true,leverage:true,swapLogic:true}
    };
  }

  return {
    setup:{completedAt:d(90),version:2},
    territory:{healthScore:74,lastPulse:d(2).slice(0,10),pulseSkips:0,salesCycle:'1-3m',createdAt:d(90)},
    theses:[
      {id:'ta_mm_th_1',name:'Ops strain after expansion',pressure:'Support operations are stretching faster than the team can keep quality stable',segment:'mid-market operators expanding into more locations or channels',leverage:'we can give the operator a tighter control layer before the backlog becomes the story',fullStatement:'Support operations are stretching faster than the team can keep quality stable for mid-market operators expanding into more locations or channels, and we can give the operator a tighter control layer before the backlog becomes the story.',version:1,status:'active',createdAt:d(90),versions:[{v:1,statement:'Support operations are stretching faster than the team can keep quality stable for mid-market operators expanding into more locations or channels, and we can give the operator a tighter control layer before the backlog becomes the story.',date:d(90)}]},
      {id:'ta_mm_th_2',name:'Compliance force',pressure:'Compliance pressure is making communication gaps too expensive to ignore',segment:'regulated teams that must tighten customer or patient communication fast',leverage:'we can turn deadline pressure into a real workflow change instead of more documentation',fullStatement:'Compliance pressure is making communication gaps too expensive to ignore for regulated teams that must tighten customer or patient communication fast, and we can turn deadline pressure into a real workflow change instead of more documentation.',version:1,status:'active',createdAt:d(84),versions:[{v:1,statement:'Compliance pressure is making communication gaps too expensive to ignore for regulated teams that must tighten customer or patient communication fast, and we can turn deadline pressure into a real workflow change instead of more documentation.',date:d(84)}]},
      {id:'ta_mm_th_3',name:'Budget with missing owner',pressure:'AI budget exists but the operator owner and forcing event are still incomplete',segment:'teams evaluating CX automation while service quality is already slipping',leverage:'we can keep the evaluation tied to a live operator problem instead of generic transformation talk',fullStatement:'AI budget exists but the operator owner and forcing event are still incomplete for teams evaluating CX automation while service quality is already slipping, and we can keep the evaluation tied to a live operator problem instead of generic transformation talk.',version:1,status:'active',createdAt:d(79),versions:[{v:1,statement:'AI budget exists but the operator owner and forcing event are still incomplete for teams evaluating CX automation while service quality is already slipping, and we can keep the evaluation tied to a live operator problem instead of generic transformation talk.',date:d(79)}]}
    ],
    approaches:[
      {id:'ta_mm_ap_1',thesisId:'ta_mm_th_1',category:'operator-proof',name:'Volume breakage opener',description:'Lead with the operator pressure from expansion before talking category.',status:'active',createdAt:d(78),retiredAt:null},
      {id:'ta_mm_ap_2',thesisId:'ta_mm_th_1',category:'exec-bridge',name:'Owner-plus-backlog path',description:'Get the real owner and backlog consequence into the same conversation.',status:'active',createdAt:d(77),retiredAt:null},
      {id:'ta_mm_ap_3',thesisId:'ta_mm_th_2',category:'deadline-frame',name:'Audit deadline route',description:'Open on the date, the workflow gap, and what breaks if they wait.',status:'active',createdAt:d(76),retiredAt:null},
      {id:'ta_mm_ap_4',thesisId:'ta_mm_th_2',category:'risk-proof',name:'Revenue/compliance proof',description:'Tie communication failure to measurable compliance or reimbursement risk.',status:'active',createdAt:d(75),retiredAt:null},
      {id:'ta_mm_ap_5',thesisId:'ta_mm_th_3',category:'buying-criteria',name:'Operator criteria reset',description:'Reset the evaluation around operator proof instead of AI aspiration.',status:'active',createdAt:d(74),retiredAt:null},
      {id:'ta_mm_ap_6',thesisId:'ta_mm_th_3',category:'eb-bridge',name:'Budget-owner bridge',description:'Force access to the budget owner before the evaluation turns generic.',status:'active',createdAt:d(73),retiredAt:null}
    ],
    accounts:[
      {id:'ta_mm_acct_1',name:'Meridian Logistics',tier:1,thesisId:'ta_mm_th_1',leverageType:'existing-proof-point',additionTrigger:'signal-event',status:'active',addedAt:d(37),overrideCount:0},
      {id:'ta_mm_acct_2',name:'Cascadia Health Systems',tier:1,thesisId:'ta_mm_th_2',leverageType:'network-connection',additionTrigger:'signal-event',status:'active',addedAt:d(28),overrideCount:0},
      {id:'ta_mm_acct_3',name:'Northstar Financial',tier:2,thesisId:'ta_mm_th_3',leverageType:'market-signal',additionTrigger:'signal-event',status:'active',addedAt:d(34),overrideCount:0},
      {id:'ta_mm_acct_4',name:'Riverview Insurance',tier:2,thesisId:'ta_mm_th_3',leverageType:'existing-proof-point',additionTrigger:'network-opportunity',status:'active',addedAt:d(30),overrideCount:0},
      {id:'ta_mm_acct_5',name:'Beacon Retail Group',tier:2,thesisId:'ta_mm_th_1',leverageType:'market-signal',additionTrigger:'strategic-bet',status:'active',addedAt:d(31),overrideCount:0},
      {id:'ta_mm_acct_6',name:'Apex Manufacturing',tier:3,thesisId:'ta_mm_th_1',leverageType:'cold',additionTrigger:'signal-event',status:'active',addedAt:d(56),overrideCount:0}
    ],
    signals:[
      {id:'ta_mm_sig_1',accountId:'ta_mm_acct_1',description:'New operator leader inherited a support queue that is already widening.',type:'leadership',timestamp:d(4)},
      {id:'ta_mm_sig_2',accountId:'ta_mm_acct_2',description:'Audit pressure is now directly tied to patient communication workflow gaps.',type:'competitive',timestamp:d(6)},
      {id:'ta_mm_sig_3',accountId:'ta_mm_acct_3',description:'AI budget exists, but the owner still has not pulled finance into the room.',type:'leadership',timestamp:d(3)},
      {id:'ta_mm_sig_4',accountId:'ta_mm_acct_4',description:'Claims modernization still has a willing operator and a visible proof point.',type:'funding',timestamp:d(12)},
      {id:'ta_mm_sig_5',accountId:'ta_mm_acct_5',description:'DTC support load is rising, but ownership is still soft.',type:'expansion',timestamp:d(24)}
    ],
    dispositions:[
      {id:'ta_mm_disp_1',accountId:'ta_mm_acct_1',type:'signal-detected',description:'Expansion pressure is now visible in queue and staffing cadence.',signalType:'leadership',timestamp:d(4)},
      {id:'ta_mm_disp_2',accountId:'ta_mm_acct_1',type:'progressing',approachUsed:'ta_mm_ap_1',angleWorked:'ta_mm_ap_1',timestamp:d(2)},
      {id:'ta_mm_disp_3',accountId:'ta_mm_acct_2',type:'signal-detected',description:'Compliance deadline now has a real executive consequence.',signalType:'competitive',timestamp:d(6)},
      {id:'ta_mm_disp_4',accountId:'ta_mm_acct_2',type:'progressing',approachUsed:'ta_mm_ap_3',angleWorked:'ta_mm_ap_3',timestamp:d(3)},
      {id:'ta_mm_disp_5',accountId:'ta_mm_acct_3',type:'signal-detected',description:'Buying cycle is live but still below the real budget owner.',signalType:'leadership',timestamp:d(3)},
      {id:'ta_mm_disp_6',accountId:'ta_mm_acct_3',type:'engaged-stalled',approachUsed:'ta_mm_ap_5',blocker:'No economic buyer in the thread yet.',timestamp:d(1)},
      {id:'ta_mm_disp_7',accountId:'ta_mm_acct_4',type:'progressing',approachUsed:'ta_mm_ap_6',angleWorked:'ta_mm_ap_6',timestamp:d(10)},
      {id:'ta_mm_disp_8',accountId:'ta_mm_acct_5',type:'no-traction',approachUsed:'ta_mm_ap_2',timestamp:d(8)},
      {id:'ta_mm_disp_9',accountId:'ta_mm_acct_6',type:'no-traction',approachUsed:'ta_mm_ap_2',timestamp:d(18)}
    ],
    swapHistory:[{id:'ta_mm_swap_1',accountRemoved:'archived_mm_placeholder',accountAdded:'ta_mm_acct_5',reason:'signal-upgrade',timestamp:d(17)}],
    retierHistory:[{id:'ta_mm_retier_1',date:d(14),summary:'Field tightened around operator pressure instead of logo fit.'}],
    calibrations:{progression:true,leverage:true,swapLogic:true}
  };
}

function buildSourcingWorkbenchSeed(mode, territorySeed){
  var thesisIds={};
  (territorySeed.theses||[]).forEach(function(thesis){
    thesisIds[thesis.name]=thesis.id;
  });
  var approachIds={};
  (territorySeed.approaches||[]).forEach(function(approach){
    if(!approachIds[approach.thesisId]) approachIds[approach.thesisId]=[];
    approachIds[approach.thesisId].push(approach.id);
  });
  function firstApproach(thesisId,offset){
    var list=approachIds[thesisId]||[];
    return list[offset||0]||null;
  }

  if(mode==='ent'){
    var entOps=thesisIds['Integration pressure before the board notices']||territorySeed.theses[0].id;
    var entRisk=thesisIds['Compliance and outcome exposure are now one problem']||territorySeed.theses[1].id;
    var entBudget=thesisIds['AI budget exists but the owner path is still weak']||territorySeed.theses[2].id;
    return {
      queryCards:[
        {id:'sw_ent_qc_1',thesisId:entOps,platform:'sales-nav',status:'active',createdAt:d(16),updatedAt:d(3),filters:{industry:'Global logistics / contact-center operations',companySize:'5000+ employees',geography:'North America + APAC',behavioralSignal:'Acquisition integration, queue fragmentation, new operator leader',techSignal:'Service Cloud / Genesys / multi-stack',personaTitles:'CCO; VP Customer Operations; Contact Center Director',exclusions:'Single-site teams, pure freight brokers',customNotes:'Target operators inheriting multi-site queue sprawl after acquisition.'}},
        {id:'sw_ent_qc_2',thesisId:entRisk,platform:'zoominfo',status:'active',createdAt:d(15),updatedAt:d(4),filters:{industry:'Healthcare systems / regulated service networks',companySize:'2500-25000 employees',geography:'United States',behavioralSignal:'Audit deadline, reimbursement exposure, patient communication gaps',techSignal:'Epic / legacy notification stack / workflow fragmentation',personaTitles:'VP Patient Experience; COO; Compliance Officer',exclusions:'Small clinics, payers-only',customNotes:'Prioritize hard deadlines over generic compliance language.'}},
        {id:'sw_ent_qc_3',thesisId:entBudget,platform:'apollo',status:'active',createdAt:d(14),updatedAt:d(2),filters:{industry:'Financial services / enterprise client services',companySize:'1000-10000 employees',geography:'US + EU',behavioralSignal:'RFP, board-approved AI budget, evaluation cycle live',techSignal:'Intercom / Ada / Salesforce eval',personaTitles:'Head of Client Services; VP Digital; COO',exclusions:'Budget talk without active owner',customNotes:'Need both budget gravity and a real operator thread.'}},
        {id:'sw_ent_qc_4',thesisId:entOps,platform:'conference',status:'active',createdAt:d(12),updatedAt:d(1),filters:{industry:'Hospitality / multi-property operations',companySize:'3000+ employees',geography:'North America',behavioralSignal:'New digital leader, guest messaging unification, property sprawl',techSignal:'Medallia / guest messaging stack',personaTitles:'CDO; VP Guest Experience',exclusions:'Single-property groups',customNotes:'Use conference attendee lists and follow-on operator hires.'}}
      ],
      prospects:[
        {id:'sw_ent_p_1',name:'HarborSpan Freight',thesisId:entOps,sourceType:'query-card',sourceQueryCardId:'sw_ent_qc_1',initialImpression:'Operator reshuffle after APAC integration looks urgent.',stage:'ready',createdAt:d(7),updatedAt:d(1),research:{thesisMatch:'strong',entryPoint:'Leah Morgan, VP Customer Operations',suggestedApproach:firstApproach(entOps,0),leverageType:'market-signal',note:'Three queue systems, one new owner, and public hiring pressure in Manila.'}},
        {id:'sw_ent_p_2',name:'Pioneer Health Alliance',thesisId:entRisk,sourceType:'query-card',sourceQueryCardId:'sw_ent_qc_2',initialImpression:'Patient communication audit language is explicit.',stage:'ready',createdAt:d(8),updatedAt:d(2),research:{thesisMatch:'strong',entryPoint:'Dr. Nia Brooks, VP Patient Experience',suggestedApproach:firstApproach(entRisk,0),leverageType:'network-connection',note:'Audit remediation board deck references call-center handoff failures.'}},
        {id:'sw_ent_p_3',name:'Argent Wealth Services',thesisId:entBudget,sourceType:'query-card',sourceQueryCardId:'sw_ent_qc_3',initialImpression:'RFP is live, but operator owner is still fuzzy.',stage:'researched',createdAt:d(9),updatedAt:d(3),research:{thesisMatch:'moderate',entryPoint:'Marcus Delaney, Head of Client Experience',suggestedApproach:firstApproach(entBudget,0),leverageType:'market-signal',note:'Budget exists, but committee still framing this as generic AI modernization.'}},
        {id:'sw_ent_p_4',name:'NorthBridge Hospitality',thesisId:entOps,sourceType:'query-card',sourceQueryCardId:'sw_ent_qc_4',initialImpression:'Guest messaging stack looks fragmented across brands.',stage:'researched',createdAt:d(6),updatedAt:d(2),research:{thesisMatch:'moderate',entryPoint:'Elena Ruiz, SVP Guest Experience',suggestedApproach:firstApproach(entOps,1),leverageType:'network-connection',note:'CDO just hired from Marriott. Strong ownership signal, weaker forcing event.'}},
        {id:'sw_ent_p_5',name:'Solstice Pharma Services',thesisId:entRisk,sourceType:'referral',sourceQueryCardId:null,initialImpression:'Advisor intro surfaced reimbursement exposure tied to patient support.',stage:'pushed',createdAt:d(11),updatedAt:d(2),research:{thesisMatch:'strong',entryPoint:'Maya Chen, VP Patient Programs',suggestedApproach:firstApproach(entRisk,1),leverageType:'existing-proof-point',note:'Already strong enough to earn territory review and Signal Console timing.'}},
        {id:'sw_ent_p_6',name:'Granite Public Systems',thesisId:entBudget,sourceType:'news-article',sourceQueryCardId:null,initialImpression:'AI budget story is loud; operator reality is still thin.',stage:'captured',createdAt:d(4),updatedAt:d(4)},
        {id:'sw_ent_p_7',name:'EverGrid Energy',thesisId:entRisk,sourceType:'event',sourceQueryCardId:null,initialImpression:'Regulatory message is real but buyer route is incomplete.',stage:'parked',createdAt:d(10),updatedAt:d(5),research:{thesisMatch:'uncertain',entryPoint:'Jonah Patel, Director Customer Programs',suggestedApproach:null,leverageType:'market-signal',note:'Need the true service owner before it deserves a live slot.'}},
        {id:'sw_ent_p_8',name:'Vector Defense Tech',thesisId:entBudget,sourceType:'query-card',sourceQueryCardId:'sw_ent_qc_3',initialImpression:'Formal buying process, but no operator pressure.',stage:'rejected',createdAt:d(13),updatedAt:d(6),rejectionReason:'budget without operator pain'}
      ],
      personaMaps:[
        {id:'sw_ent_pm_1',thesisId:entOps,title:'VP Customer Operations',alternativeTitles:'Head of Service Delivery; Contact Center VP',role:'decision-maker',priority:'primary-target',typicalConcerns:'Integration chaos, queue visibility, inconsistent operator control across sites.',bestApproach:firstApproach(entOps,0),notes:'Needs a field-control story, not a platform migration pitch.',createdAt:d(13)},
        {id:'sw_ent_pm_2',thesisId:entOps,title:'Contact Center Director',alternativeTitles:'Global Service Ops Director',role:'champion',priority:'secondary',typicalConcerns:'Backlog, staffing volatility, reporting gaps after acquisition.',bestApproach:firstApproach(entOps,1),notes:'Often owns the pain but not the budget.',createdAt:d(12)},
        {id:'sw_ent_pm_3',thesisId:entRisk,title:'VP Patient Experience',alternativeTitles:'VP Member Experience',role:'decision-maker',priority:'primary-target',typicalConcerns:'Audit deadlines, satisfaction-linked revenue, workflow compliance proof.',bestApproach:firstApproach(entRisk,0),notes:'Responds to consequence and deadline framing.',createdAt:d(13)},
        {id:'sw_ent_pm_4',thesisId:entRisk,title:'Chief Compliance Officer',alternativeTitles:'Regulatory Affairs Lead',role:'influencer',priority:'secondary',typicalConcerns:'Documentation, provable controls, deadline credibility.',bestApproach:firstApproach(entRisk,1),notes:'Useful validator but rarely the buying owner.',createdAt:d(11)},
        {id:'sw_ent_pm_5',thesisId:entBudget,title:'Head of Client Services',alternativeTitles:'VP Client Operations',role:'champion',priority:'primary-target',typicalConcerns:'Client experience drift, committee sprawl, proving an operator outcome fast.',bestApproach:firstApproach(entBudget,0),notes:'Needs criteria reset before the RFP flattens the story.',createdAt:d(10)},
        {id:'sw_ent_pm_6',thesisId:entBudget,title:'COO',alternativeTitles:'Managing Director of Operations',role:'economic-buyer',priority:'situational',typicalConcerns:'Why now, cost of delay, and whether this is a real operator problem.',bestApproach:firstApproach(entBudget,1),notes:'Bring in once operator pain and owner path are explicit.',createdAt:d(9)}
      ]
    };
  }

  var mmOps=thesisIds['Ops strain after expansion']||territorySeed.theses[0].id;
  var mmRisk=thesisIds['Compliance force']||territorySeed.theses[1].id;
  var mmBudget=thesisIds['Budget with missing owner']||territorySeed.theses[2].id;
  return {
    queryCards:[
      {id:'sw_mm_qc_1',thesisId:mmOps,platform:'sales-nav',status:'active',createdAt:d(12),updatedAt:d(2),filters:{industry:'Regional logistics / field-service operators',companySize:'750-2500 employees',geography:'North America',behavioralSignal:'Expansion, backlog, new operator leader',techSignal:'Zendesk / Freshdesk / fragmented queue ops',personaTitles:'VP Customer Operations; Support Director',exclusions:'Massive enterprises, consumer-only brands',customNotes:'Hunt for operators opening sites faster than queue control is catching up.'}},
      {id:'sw_mm_qc_2',thesisId:mmRisk,platform:'zoominfo',status:'active',createdAt:d(11),updatedAt:d(3),filters:{industry:'Healthcare / regulated service orgs',companySize:'1000-5000 employees',geography:'United States',behavioralSignal:'Audit deadline, reimbursement risk, acquisition integration',techSignal:'Legacy patient messaging / workflow gaps',personaTitles:'Director Patient Experience; Compliance Officer',exclusions:'Small clinics, gov-only orgs',customNotes:'Need a real date or measurable downside, not just “compliance matters.”'}},
      {id:'sw_mm_qc_3',thesisId:mmBudget,platform:'apollo',status:'active',createdAt:d(10),updatedAt:d(2),filters:{industry:'Financial services / insurance operations',companySize:'500-3000 employees',geography:'US + EU',behavioralSignal:'AI budget, vendor evaluation, quality slide',techSignal:'Intercom / Ada / Service Cloud',personaTitles:'VP Digital; Head of Claims Ops; Revenue Ops',exclusions:'Pure R&D AI teams',customNotes:'Budget must connect to a visible operator owner and forcing event.'}},
      {id:'sw_mm_qc_4',thesisId:mmOps,platform:'conference',status:'active',createdAt:d(9),updatedAt:d(1),filters:{industry:'Retail / DTC operators',companySize:'500-1500 employees',geography:'North America',behavioralSignal:'Channel launch, support surge, staffing strain',techSignal:'Gorgias / support hiring spike',personaTitles:'VP E-Commerce; Customer Experience Lead',exclusions:'Single-location retailers',customNotes:'Use conference attendee lists and operator hiring patterns for capture.'}}
    ],
    prospects:[
      {id:'sw_mm_p_1',name:'BlueHarbor Freight',thesisId:mmOps,sourceType:'query-card',sourceQueryCardId:'sw_mm_qc_1',initialImpression:'Queue strain is visible in hiring and review patterns.',stage:'ready',createdAt:d(6),updatedAt:d(1),research:{thesisMatch:'strong',entryPoint:'Dana Cole, VP Customer Operations',suggestedApproach:firstApproach(mmOps,0),leverageType:'market-signal',note:'Opened 3 depots in 8 months. Queue complaints are visible in hiring copy and review sites.'}},
      {id:'sw_mm_p_2',name:'HarborCare Clinics',thesisId:mmRisk,sourceType:'query-card',sourceQueryCardId:'sw_mm_qc_2',initialImpression:'Audit remediation language is explicit.',stage:'ready',createdAt:d(7),updatedAt:d(2),research:{thesisMatch:'strong',entryPoint:'Alicia Monroe, Director Patient Experience',suggestedApproach:firstApproach(mmRisk,0),leverageType:'network-connection',note:'Two new clinics acquired. Deadline is now tied to reimbursement reporting.'}},
      {id:'sw_mm_p_3',name:'PineGate Insurance',thesisId:mmBudget,sourceType:'query-card',sourceQueryCardId:'sw_mm_qc_3',initialImpression:'AI budget exists, but owner path still feels soft.',stage:'researched',createdAt:d(8),updatedAt:d(3),research:{thesisMatch:'moderate',entryPoint:'Micah Doyle, VP Digital',suggestedApproach:firstApproach(mmBudget,0),leverageType:'market-signal',note:'Budget committee is real. Still need the budget owner and current workflow pain in the same thread.'}},
      {id:'sw_mm_p_4',name:'NorthPeak Commerce',thesisId:mmOps,sourceType:'query-card',sourceQueryCardId:'sw_mm_qc_4',initialImpression:'DTC support is scaling faster than the team.',stage:'researched',createdAt:d(5),updatedAt:d(2),research:{thesisMatch:'moderate',entryPoint:'Rachel Kim, VP E-Commerce',suggestedApproach:firstApproach(mmOps,1),leverageType:'market-signal',note:'Good operator route. Still need stronger proof that backlog is hurting the business now.'}},
      {id:'sw_mm_p_5',name:'Luma Fleet Services',thesisId:mmOps,sourceType:'referral',sourceQueryCardId:null,initialImpression:'Advisor intro surfaced a real backlog and new operator owner.',stage:'pushed',createdAt:d(9),updatedAt:d(2),research:{thesisMatch:'strong',entryPoint:'Nora Vasquez, Head of Customer Operations',suggestedApproach:firstApproach(mmOps,0),leverageType:'existing-proof-point',note:'Already clean enough for territory and signal timing.'}},
      {id:'sw_mm_p_6',name:'Cedar Ridge Health',thesisId:mmRisk,sourceType:'news-article',sourceQueryCardId:null,initialImpression:'Acquisition signal is visible but the human owner is still unproven.',stage:'captured',createdAt:d(4),updatedAt:d(4)},
      {id:'sw_mm_p_7',name:'Summit Claims Group',thesisId:mmBudget,sourceType:'event',sourceQueryCardId:null,initialImpression:'Strong budget story, thin operator route.',stage:'parked',createdAt:d(10),updatedAt:d(5),research:{thesisMatch:'uncertain',entryPoint:'Elijah Park, Director Innovation',suggestedApproach:null,leverageType:'market-signal',note:'Feels like budget theater until the operator owner is named.'}},
      {id:'sw_mm_p_8',name:'Atlas Growth Labs',thesisId:mmBudget,sourceType:'query-card',sourceQueryCardId:'sw_mm_qc_3',initialImpression:'Wanted AI language, no real pressure.',stage:'rejected',createdAt:d(12),updatedAt:d(6),rejectionReason:'category fit without operator pressure'}
    ],
    personaMaps:[
      {id:'sw_mm_pm_1',thesisId:mmOps,title:'VP Customer Operations',alternativeTitles:'Head of Support; VP Service Ops',role:'decision-maker',priority:'primary-target',typicalConcerns:'Backlog, inconsistent quality, new-site pressure, and lack of queue control.',bestApproach:firstApproach(mmOps,0),notes:'Needs proof the rail starts with real operator pain.',createdAt:d(13)},
      {id:'sw_mm_pm_2',thesisId:mmOps,title:'Support Director',alternativeTitles:'Customer Experience Director',role:'champion',priority:'secondary',typicalConcerns:'Capacity, staffing, escalation load, and visibility.',bestApproach:firstApproach(mmOps,1),notes:'Often gives the best field proof.',createdAt:d(12)},
      {id:'sw_mm_pm_3',thesisId:mmRisk,title:'Director Patient Experience',alternativeTitles:'Director Member Experience',role:'decision-maker',priority:'primary-target',typicalConcerns:'Audit exposure, communication breakdowns, and reimbursement risk.',bestApproach:firstApproach(mmRisk,0),notes:'Responds to date-driven forcing language.',createdAt:d(11)},
      {id:'sw_mm_pm_4',thesisId:mmRisk,title:'Compliance Officer',alternativeTitles:'Quality Director',role:'influencer',priority:'secondary',typicalConcerns:'Documentation, provable workflows, and deadline credibility.',bestApproach:firstApproach(mmRisk,1),notes:'Useful validation path, rarely the primary owner.',createdAt:d(10)},
      {id:'sw_mm_pm_5',thesisId:mmBudget,title:'VP Digital',alternativeTitles:'Head of Innovation',role:'champion',priority:'primary-target',typicalConcerns:'Vendor evaluation drift, proving ROI, and keeping AI work tied to operations.',bestApproach:firstApproach(mmBudget,0),notes:'Can open the deal but needs the operator owner alongside them.',createdAt:d(9)},
      {id:'sw_mm_pm_6',thesisId:mmBudget,title:'COO',alternativeTitles:'Operations Chief',role:'economic-buyer',priority:'situational',typicalConcerns:'Why now, owner clarity, and budget discipline.',bestApproach:firstApproach(mmBudget,1),notes:'Bring in once the operator problem is named, not before.',createdAt:d(8)}
    ]
  };
}

// ══════════════════════════════════════════════════════════════
// SHARED GENERATION (outbound, calls, discovery, etc.)
// ══════════════════════════════════════════════════════════════
function generateShared(data){
  var accounts=data.accounts;
  var deals=data.deals;

  // OUTBOUND TOUCHES
  var touches=[];
  var touchAccts=accounts.slice(0,4);
  var outcomes=['replied','no_response','no_response','meeting_booked','no_response','replied','no_response','no_response','no_response','no_response','replied','no_response'];
  touchAccts.forEach(function(a,ai){
    for(var t=0;t<(ai===0?5:ai===1?4:3);t++){
      touches.push({
        id:uid('t'),accountName:a.name,contactName:'',contactTitle:'',
        persona:['csuite','vp','vp','ic'][ai]||'vp',
        temperature:['ice_cold','cool','cool','warm'][Math.min(t,3)],
        channel:['email','email','linkedin','email','phone'][t%5],
        trigger:(a.signals[0]||{}).cat||'expansion',
        ctaType:t<2?'no_ask':'soft_ask',
        assetUsed:t<2?'industry_brief':'case_study',
        content:'',
        outcome:outcomes[(ai*4+t)%outcomes.length]||'no_response',
        outcomeDate:d(30-ai*5-t*2),
        dealId:null,
        createdAt:d(35-ai*5-t*2)
      });
    }
  });

  // COLD CALLS
  var calls=[];
  var callOutcomes=['no_answer','voicemail','meeting_booked','rejected','callback_scheduled','voicemail','no_answer','meeting_booked','voicemail','rejected','voicemail','callback_scheduled'];
  touchAccts.forEach(function(a,ai){
    for(var c=0;c<3;c++){
      calls.push({
        id:uid('cc'),accountName:a.name,contactName:'',contactTitle:'',
        outcome:callOutcomes[(ai*3+c)%callOutcomes.length],
        duration:Math.floor(Math.random()*180)+30,
        notes:'',
        createdAt:d(28-ai*4-c*2)
      });
    }
  });

  // LINKEDIN
  var liActions=[];
  touchAccts.slice(0,3).forEach(function(a,ai){
    liActions.push({id:uid('li'),type:'connection',action:'connection',accountName:a.name,outcome:ai<2?'accepted':'pending',createdAt:d(25-ai*3)});
    if(ai<2)liActions.push({id:uid('li'),type:'dm',action:'dm',accountName:a.name,outcome:ai===0?'replied':'no_response',createdAt:d(22-ai*3)});
  });

  // ANGLES
  var angles=accounts.slice(0,5).map(function(a,i){
    return {
      company:a.name,
      trigger:(a.signals[0]||{}).cat||'expansion',
      persona:['VP Operations','VP Digital','Dir. IT','COO','CTO'][i%5],
      email:'Signal-driven angle for '+a.name+' based on '+((a.signals[0]||{}).headline||'recent activity'),
      temperature:['ice_cold','cool','warm','ice_cold','cool'][i%5],
      channel:'email',
      ctaType:i<2?'no_ask':'soft_ask',
      savedAt:d(30-i*4)
    };
  });

  // DISCOVERY STATS
  var discoveryStats={totalCalls:12,advancedCalls:5};

  // DISCOVERY WORKED MOVES
  var discoveryWorked={
    'cx_resolution_1':true,'cx_resolution_2':true,'cx_resolution_3':true,'cx_resolution_4':true,
    'cx_agent_1':true,'cx_agent_2':true,'cx_agent_3':true,
    'cx_implementation_1':true,'cx_implementation_2':true
  };

  // DISCOVERY AGENDA
  var firstDeal=deals.find(function(dd){return dd.stage==='discovery'||dd.stage==='evaluation'});
  var discoveryAgenda={
    contact:firstDeal?firstDeal.champion:'',
    company:firstDeal?firstDeal.accountName:'',
    linkedDeal:firstDeal?firstDeal.id:'',
    gates:['pain_validated','budget_confirmed',null,null]
  };

  // AUTOPSY LOG (object keyed by deal ID)
  var stallingDeal=deals.find(function(dd){return dd.stage==='negotiation'});
  var lostDeal=deals.find(function(dd){return dd.stage==='closed-lost'});
  var autopsyLog={};
  if(stallingDeal){
    autopsyLog[stallingDeal.id]={lastRunAt:d(2),tasks:{'send_eb_request':{done:false},'schedule_technical':{done:true,doneAt:d(5)},'set_deadline':{done:false}}};
  }
  if(lostDeal){
    autopsyLog[lostDeal.id]={lastRunAt:d(9),tasks:{'review_loss_pattern':{done:true,doneAt:d(9)}}};
  }
  // Add a third run for readiness points
  var thirdDeal=deals.find(function(dd){return dd.stage==='evaluation'});
  if(thirdDeal){
    autopsyLog[thirdDeal.id]={lastRunAt:d(4),tasks:{'competitive_prep':{done:true,doneAt:d(4)},'eb_strategy':{done:false}}};
  }

  // POC DATA
  var wonDeal=deals.find(function(dd){return dd.stage==='closed-won'});
  var pocData={pocs:[]};
  if(wonDeal){
    pocData.pocs.push({id:uid('poc'),vendor:COMPANY,account:wonDeal.accountName,duration:14,
      success:'1) Resolve 40% of routine inquiries without human intervention\n2) Integration with existing CRM in <5 business days\n3) HIPAA/SOC2 compliance verified by security team',
      boundaries:'- No custom model training during PoC\n- Limited to 1 department / 1 location\n- No production data migration',
      outcome:'converted',created:d(35)});
  }

  // PLAYBOOK NOTES
  var playbookNotes={
    'note_0':'Our strongest ICP is the mid-market expansion play — companies growing faster than their CX tools. The compliance play in healthcare is strong but longer cycle.',
    'note_3':'We close fastest when: (1) EB is engaged by week 2-3, (2) PoC is scoped in discovery, (3) there\'s a compliance or expansion trigger. The Riverview deal is the template — CTO was the champion AND the reference.',
    'note_4':'Two consistent loss patterns: single-threaded deals and procurement stalls. The Atlas/Beacon losses both died because we never got above the champion. Advisor deployment for EB bridge should be standard on every deal over $75K.'
  };

  return {
    outboundTouches:{touches:touches},
    coldCallLog:{calls:calls},
    linkedinLog:{actions:liActions},
    angles:angles,
    discoveryStats:discoveryStats,
    discoveryWorked:discoveryWorked,
    discoveryAgenda:discoveryAgenda,
    autopsyLog:autopsyLog,
    pocData:pocData,
    playbookNotes:playbookNotes
  };
}

// ══════════════════════════════════════════════════════════════
// SEED WRITER
// ══════════════════════════════════════════════════════════════
function countGtmKeys(){
  try{
    if(window.gtmDemoStorageBootstrap&&typeof window.gtmDemoStorageBootstrap.countVisibleGtmKeys==='function'){
      return window.gtmDemoStorageBootstrap.countVisibleGtmKeys();
    }
  }catch(e){}
  var c=0;
  try{
    for(var i=0;i<localStorage.length;i++){
      var key=localStorage.key(i);
      if(key&&key.indexOf('gtmos_')===0)c++;
    }
  }catch(e){}
  return c;
}

function updateCount(){
  var c=countGtmKeys();
  var countNode=document.getElementById('count');
  if(countNode){
    countNode.textContent=c+' demo keys currently live in this browser';
  }
}

function purgeVisibleGtmKeysFallback(){
  var removed=0;
  var keys=[];
  try{
    for(var i=0;i<localStorage.length;i++){
      var key=localStorage.key(i);
      if(key&&key.indexOf('gtmos_')===0){
        keys.push(key);
      }
    }
    keys.forEach(function(key){
      localStorage.removeItem(key);
      removed++;
    });
  }catch(e){}
  return removed;
}
function getScenarioMeta(mode){
  return mode==='ent'
    ? {name:'Enterprise Demo',label:'enterprise',description:'Operator-scale deal motion with heavier proof, stakeholders, and handoff pressure.',redirect:'/app/dashboard/?demo=1'}
    : {name:'Mid-Market Demo',label:'mid_market',description:'Founder-to-first-AE motion with expansion triggers, one win, one loss, and believable daily execution.',redirect:'/app/dashboard/?demo=1'};
}

function buildStatusMarkup(meta,data,shared,keys,returnUrl){
  return keys+' demo keys written.<br>'
    +data.accounts.length+' accounts - '
    +data.deals.length+' deals - '
    +data.advisors.length+' advisors - '
    +shared.outboundTouches.touches.length+' touches - '
    +shared.coldCallLog.calls.length+' calls<br><br>'
    +'Loaded: '+meta.name+'<br>'
    +meta.description+'<br><br>'
    +'<a href="'+returnUrl+'" style="color:var(--accent);font-weight:700;">Open demo dashboard</a>';
}

window.seed=function(mode){
  var data=mode==='ent'?enterprise():midMarket();
  var territorySeed=buildTerritoryArchitectSeed(mode);
  var sourcingSeed=buildSourcingWorkbenchSeed(mode,territorySeed);
  var shared=generateShared(data);
  var meta=getScenarioMeta(mode);
  var status=document.getElementById('status');
  var keys=0;
  var params;
  var autoSeed='';
  var returnUrl=meta.redirect;

  function w(k,v){localStorage.setItem(k,JSON.stringify(v));keys++}
  function wRaw(k,v){localStorage.setItem(k,String(v));keys++}

  try{
    params=new URLSearchParams(window.location.search||'');
    autoSeed=(params.get('autoseed')||'').toLowerCase();
    returnUrl=params.get('return')||meta.redirect;
  }catch(e){}

  try{
    if(window.gtmDemoStorageBootstrap&&typeof window.gtmDemoStorageBootstrap.purgeDemoNamespace==='function'){
      window.gtmDemoStorageBootstrap.purgeDemoNamespace();
    }else{
      purgeVisibleGtmKeysFallback();
    }
  }catch(e){}

  wRaw('gtmos_noauth_mode','1');
  wRaw('gtmos_noauth_email','demo@vectyr.ai');
  w('gtmos_profile_cache',{id:'demo-workspace',full_name:'Demo Workspace',company_name:COMPANY,email:'demo@vectyr.ai',role:'founder',onboarding_completed:true});
  w('gtmos_onboarding',{completed:true,answers:{companyName:COMPANY,stage:'Seed / Pre-Series A',quota:data.seed.annual_quota,acv:data.seed.avg_deal_size,productCategory:PRODUCT_CATEGORY,buyerPersona:'VP Operations'}});
  w('gtmos_outbound_seed',data.seed);
  w('gtmos_playbook',data.playbook);
  w('gtmos_product_category',PRODUCT_CATEGORY);
  w('gtmos_icp_analytics',{icps:data.icps,totalWorked:data.icps.filter(function(i){return i.worked}).length});
  w('gtmos_sc_v4',{accounts:data.accounts,mode:'complex'});
  w('gtmos_deal_workspaces',data.deals);
  w('gtmos_deal_stage_history',data.stageHistory);

  var outcomes={};
  data.deals.forEach(function(dd){
    if(dd.stage==='closed-won') outcomes[dd.id]={type:'won',date:dd.closeDate};
    if(dd.stage==='closed-lost') outcomes[dd.id]={type:'lost',date:dd.closeDate,reason:dd.lossReason};
  });
  w('gtmos_deal_outcomes',outcomes);
  w('gtmos_advisor_registry',{advisors:data.advisors});
  w('gtmos_advisor_deployments',{deployments:data.deployments});
  w('gtmos_outbound_touches',shared.outboundTouches);
  w('gtmos_cold_call_log',shared.coldCallLog);
  w('gtmos_linkedin_log',shared.linkedinLog);
  w('gtmos_angles',shared.angles);
  w('gtmos_discovery_stats',shared.discoveryStats);
  w('gtmos_discovery_worked',shared.discoveryWorked);
  w('gtmos_discovery_agenda',shared.discoveryAgenda);
  w('gtmos_autopsy_log_v1',shared.autopsyLog);
  w('gtmos_poc_data',shared.pocData);
  w('gtmos_playbook_notes',shared.playbookNotes);
  w('gtmos_qw_inputs',{quota:data.seed.annual_quota,acv:data.seed.avg_deal_size,winRate:data.seed.win_rate,cycle:data.seed.cycle_days});
  w('gtmos_territory',territorySeed.territory);
  w('gtmos_ta_theses',territorySeed.theses);
  w('gtmos_ta_approaches',territorySeed.approaches);
  w('gtmos_ta_accounts',territorySeed.accounts);
  w('gtmos_ta_dispositions',territorySeed.dispositions);
  w('gtmos_ta_signals',territorySeed.signals);
  w('gtmos_ta_swap_history',territorySeed.swapHistory);
  w('gtmos_ta_retier_history',territorySeed.retierHistory);
  w('gtmos_ta_calibrations',territorySeed.calibrations);
  w('gtmos_ta_setup',territorySeed.setup);
  w('gtmos_sw_query_cards',sourcingSeed.queryCards);
  w('gtmos_sw_prospects',sourcingSeed.prospects);
  w('gtmos_sw_persona_maps',sourcingSeed.personaMaps);
  w('gtmos_demo_seed_meta',{mode:mode,scenario:meta.label,seededAt:new Date().toISOString(),version:'v2',entry:'demo_lane'});

  status.className='status ok';
  status.innerHTML=buildStatusMarkup(meta,data,shared,keys,returnUrl);
  updateCount();
  trackDemo('demo_seed_complete',{demo_mode:mode,scenario:meta.label,accounts:data.accounts.length,deals:data.deals.length,touches:shared.outboundTouches.touches.length,return_path:returnUrl});

  try{
    if(autoSeed&&autoSeed===String(mode||'').toLowerCase()){
      trackDemo('demo_autoseed_requested',{demo_mode:mode,scenario:meta.label,return_path:returnUrl});
      status.innerHTML+='<br><br>Launching demo workspace...';
      setTimeout(function(){window.location.href=returnUrl;},700);
      return;
    }
  }catch(e){}

  status.innerHTML+='<br><br>Opening demo workspace...';
  setTimeout(function(){window.location.href=returnUrl;},900);
};

window.clearAll=function(){
  var cleared=countGtmKeys();
  try{
    if(window.gtmDemoStorageBootstrap&&typeof window.gtmDemoStorageBootstrap.purgeDemoNamespace==='function'){
      window.gtmDemoStorageBootstrap.purgeDemoNamespace();
    }else{
      purgeVisibleGtmKeysFallback();
    }
  }catch(e){}
  document.getElementById('status').className='status';
  document.getElementById('status').textContent=cleared+' demo keys cleared. You can now seed a fresh narrative.';
  updateCount();
  trackDemo('demo_reset_click',{cleared_keys:cleared});
};
updateCount();
trackDemo('demo_lane_loaded',{path:window.location.pathname});
try{
  var autoParams=new URLSearchParams(window.location.search||'');
  var autoMode=(autoParams.get('autoseed')||'').toLowerCase();
  if(autoMode==='mm'||autoMode==='ent'){
    setTimeout(function(){seed(autoMode)},120);
  }
}catch(e){}
