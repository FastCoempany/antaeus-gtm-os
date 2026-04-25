(function(){
    "use strict";

    var TIERS = {
        t1: { label: "Board / Investor", cooldownDays: 90 },
        t2: { label: "Strategic Advisor", cooldownDays: 30 },
        t3: { label: "Angel / Portfolio", cooldownDays: 14 },
        t4: { label: "Customer Reference", cooldownDays: 30 }
    };

    var MOMENTS = [
        { id: "intro", name: "Warm introduction", short: "No meeting yet. One exact human can open the room.", ask: "Can you make a warm introduction to [buyer] at [company]? I drafted the two-line context below so this stays easy.", proof: "The account fits our wedge, but the first trusted path is still missing.", advisorLine: "You only need to open the door. I will carry the actual sale.", outcome: "First meeting booked from a credible source." },
        { id: "eb_bridge", name: "Executive bridge", short: "Champion is alive, but executive authority is not in the thread.", ask: "Could you send [buyer] a short note that this deserves executive visibility at [company]?", proof: "Pain and proof exist. Authority is the missing bridge.", advisorLine: "This is a signal that the work is worth executive attention, not a request to sell it for us.", outcome: "Executive meeting or named budget owner." },
        { id: "poc_stall", name: "Post-proof stall", short: "Proof landed, but the deal went quiet.", ask: "Could you ask whether the proof from [company] is still moving forward or if timing changed?", proof: "The product proved itself. The silence is a prioritization problem.", advisorLine: "A neutral check from you will get a clearer answer than another founder follow-up.", outcome: "Next step revived or closed cleanly." },
        { id: "procurement", name: "Procurement pressure", short: "Contract is stuck and nobody will name timing.", ask: "Could you ask [buyer] whether procurement timing is real or if the deal needs a different path?", proof: "The business case is no longer the blocker. Process opacity is.", advisorLine: "You are not pressuring procurement. You are asking whether the timeline is honest.", outcome: "Named timeline, owner, or escalation path." },
        { id: "competitor", name: "Competitive frame", short: "A competitor entered and the buyer needs outside perspective.", ask: "Could you give [buyer] ten minutes of pattern recognition on what matters in this category?", proof: "The prospect is comparing options. Third-party credibility can reset the criteria.", advisorLine: "No pitch. Just help them avoid choosing the wrong evaluation frame.", outcome: "Criteria reset around the problem we solve best." },
        { id: "champion_left", name: "Champion loss", short: "The internal carrier disappeared.", ask: "Our champion at [company] left. Do you know another credible path into this account?", proof: "The deal was real, but the thread lost its carrier.", advisorLine: "Speed matters more than perfection. We need one safe re-entry point.", outcome: "New internal owner or clean exit." },
        { id: "budget_kill", name: "Budget freeze", short: "The deal has proof but lost the budget fight.", ask: "Could you help us frame whether [company] should phase this instead of freezing it?", proof: "The work may still be valuable, but the spend path got compressed.", advisorLine: "The ask is a smaller path forward, not a plea for budget.", outcome: "Phased budget or explicit no." },
        { id: "board_decision", name: "Board signal", short: "Approval needs board or C-suite confidence.", ask: "Could you signal to the executive path at [company] that this is a serious backed company?", proof: "This is too expensive to spend casually. Use only when the deal merits it.", advisorLine: "A board-level mention can change trust faster than another deck.", outcome: "Executive or board approval path opens." },
        { id: "reference", name: "Reference proof", short: "The buyer wants independent validation.", ask: "Could you speak with [buyer] for fifteen minutes and share what matters from your operator view?", proof: "The buyer needs confidence from someone who has lived the problem.", advisorLine: "Keep it practical. What broke, what changed, what you would watch.", outcome: "Reference call completed and decision advances." },
        { id: "renewal", name: "Renewal expansion", short: "Existing customer needs a strategic touch before the next phase.", ask: "Could you check in with [buyer] before renewal and tee up the expansion conversation?", proof: "The relationship is already live. The next phase needs executive oxygen.", advisorLine: "This is partnership reinforcement, not a save attempt.", outcome: "Renewal stays warm and expansion gets named." }
    ];

    var state = {
        dealId: "",
        advisorId: "",
        momentId: "intro",
        customAsk: ""
    };

    function byId(id){ return document.getElementById(id); }

    function readLS(key, fallback){
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function syncDocToCloud(key, data){
        if(!(window.gtmPersistence && window.gtmPersistence.docs && typeof window.gtmPersistence.docs.save === "function")) return;
        if(window.gtmPersistence.docs.has && !window.gtmPersistence.docs.has(key)) return;
        window.gtmPersistence.docs.save(key, data).catch(function(error){
            console.error("Advisor Deploy sync failed for", key, error);
        });
    }

    function writeLS(key, value){
        localStorage.setItem(key, JSON.stringify(value));
        syncDocToCloud(key, value);
    }

    function getAdvisors(){
        return (readLS("gtmos_advisor_registry", { advisors: [] }).advisors || []).filter(Boolean);
    }

    function saveAdvisors(advisors){
        writeLS("gtmos_advisor_registry", { advisors: advisors });
    }

    function getDeployments(){
        return (readLS("gtmos_advisor_deployments", { deployments: [] }).deployments || []).filter(Boolean);
    }

    function saveDeployments(deployments){
        writeLS("gtmos_advisor_deployments", { deployments: deployments });
    }

    function getDeals(){
        var deals = readLS("gtmos_deal_workspaces", []);
        return Array.isArray(deals) ? deals.filter(Boolean) : [];
    }

    function saveDeal(deal){
        if(!deal || !deal.id) return;
        var deals = getDeals();
        var idx = deals.findIndex(function(item){ return String(item.id || "") === String(deal.id); });
        if(idx >= 0) deals[idx] = deal;
        else deals.push(deal);
        localStorage.setItem("gtmos_deal_workspaces", JSON.stringify(deals));
        if(window.gtmPersistence && window.gtmPersistence.deals && typeof window.gtmPersistence.deals.save === "function"){
            window.gtmPersistence.deals.save(deal).catch(function(error){
                console.error("Advisor Deploy deal sync failed:", error);
            });
        }
    }

    function uid(prefix){
        return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    }

    function escapeHtml(value){
        var div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function normalize(value){
        return String(value || "").trim().toLowerCase();
    }

    function money(value){
        var n = Number(value || 0);
        if(!n) return "$0";
        if(n >= 1000000) return "$" + (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + "M";
        if(n >= 1000) return "$" + Math.round(n / 1000) + "K";
        return "$" + n.toLocaleString();
    }

    function daysSince(iso){
        if(!iso) return 999;
        return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
    }

    function addDaysIso(days){
        var date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
    }

    function dealName(deal){
        return deal ? (deal.accountName || deal.account_name || deal.name || "Unnamed deal") : "No deal selected";
    }

    function dealValue(deal){
        return Number(deal && deal.value || 0);
    }

    function stageLabel(stage){
        return ({
            prospect: "Prospect",
            discovery: "Discovery",
            evaluation: "Evaluation",
            poc: "PoC",
            negotiation: "Negotiation",
            verbal: "Verbal",
            "closed-won": "Closed won",
            "closed-lost": "Closed lost"
        })[stage] || stage || "Prospect";
    }

    function getDealById(id){
        return getDeals().find(function(deal){ return String(deal.id || "") === String(id || ""); }) || null;
    }

    function getAdvisorById(id){
        return getAdvisors().find(function(advisor){ return String(advisor.id || "") === String(id || ""); }) || null;
    }

    function getMomentById(id){
        return MOMENTS.find(function(moment){ return moment.id === id; }) || MOMENTS[0];
    }

    function advisorsForDeal(deal){
        var name = normalize(dealName(deal));
        return getAdvisors().filter(function(advisor){
            return (advisor.companies || []).some(function(company){ return normalize(company) === name; });
        });
    }

    function activeDeals(){
        return getDeals().filter(function(deal){
            return deal && deal.stage !== "closed-won" && deal.stage !== "closed-lost";
        });
    }

    function getCooldownStatus(advisor){
        var tier = TIERS[advisor && advisor.tier] || TIERS.t2;
        var deployments = getDeployments().filter(function(dep){ return dep.advisorId === advisor.id; });
        if(!deployments.length) return { ok: true, label: "Available" };
        deployments.sort(function(a, b){ return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
        var days = daysSince(deployments[0].createdAt);
        if(days < tier.cooldownDays) return { ok: false, label: "Cooling " + Math.ceil(tier.cooldownDays - days) + "d" };
        return { ok: true, label: "Available" };
    }

    function recommendedMomentForDeal(deal){
        if(!deal) return "intro";
        var stage = String(deal.stage || "prospect");
        var next = String(deal.nextStep || "").toLowerCase();
        if(stage === "prospect") return "intro";
        if(stage === "discovery" && !deal.economicBuyer) return "eb_bridge";
        if(stage === "evaluation" || stage === "poc"){
            if(!deal.nextStepDate || new Date(deal.nextStepDate) < new Date()) return "poc_stall";
            return "reference";
        }
        if(stage === "negotiation" || stage === "verbal"){
            if(next.indexOf("procurement") >= 0 || next.indexOf("legal") >= 0 || next.indexOf("security") >= 0) return "procurement";
            if(!deal.decisionProcess || !deal.economicBuyer) return "board_decision";
            return "reference";
        }
        if(stage === "closed-won") return "renewal";
        return "intro";
    }

    function dealPressure(deal){
        if(!deal) return "No live deal linked yet.";
        if(!deal.nextStepDate) return "No dated next step is holding the thread together.";
        if(new Date(deal.nextStepDate) < new Date()) return "Next step is overdue and momentum is decaying.";
        if((deal.stage === "evaluation" || deal.stage === "poc" || deal.stage === "negotiation" || deal.stage === "verbal") && !deal.decisionProcess) return "Decision process is still blurry for the current stage.";
        if((deal.stage === "negotiation" || deal.stage === "verbal") && !deal.economicBuyer) return "Economic buyer is still not explicit late in the deal.";
        if((deal.stage === "evaluation" || deal.stage === "poc") && !deal.champion) return "There is still no named internal driver carrying the evaluation.";
        return "The ask must be precise enough to justify outside trust.";
    }

    function recommendedAdvisor(deal){
        var exact = advisorsForDeal(deal).filter(function(advisor){ return getCooldownStatus(advisor).ok; });
        if(exact.length) return exact[0];
        var anyExact = advisorsForDeal(deal);
        if(anyExact.length) return anyExact[0];
        var all = getAdvisors();
        return all[0] || null;
    }

    function currentContext(){
        var deal = getDealById(state.dealId) || activeDeals()[0] || null;
        var advisor = getAdvisorById(state.advisorId) || recommendedAdvisor(deal);
        var moment = getMomentById(state.momentId || recommendedMomentForDeal(deal));
        return { deal: deal, advisor: advisor, moment: moment };
    }

    function hydrateStateFromData(){
        var params = new URLSearchParams(window.location.search);
        var dealParam = params.get("deal") || params.get("focusObject") || "";
        var deals = activeDeals();
        var byId = deals.find(function(deal){ return String(deal.id || "") === String(dealParam); });
        var byName = deals.find(function(deal){ return normalize(dealName(deal)) === normalize(dealParam); });
        var deal = byId || byName || deals[0] || null;
        if(deal) state.dealId = deal.id || "";
        state.momentId = recommendedMomentForDeal(deal);
        var advisor = recommendedAdvisor(deal);
        state.advisorId = advisor ? advisor.id : "";
        state.customAsk = "";
    }

    function buildAsk(ctx){
        var deal = ctx.deal;
        var advisor = ctx.advisor;
        var moment = ctx.moment;
        var company = dealName(deal);
        var buyer = deal && (deal.economicBuyer || deal.champion || deal.primaryContact || deal.buyer || "the right owner");
        var ask = moment.ask.replace(/\[company\]/g, company).replace(/\[buyer\]/g, buyer);
        var line = "Hi " + (advisor ? advisor.name.split(" ")[0] : "[advisor]") + ",\n\n" +
            ask + "\n\n" +
            "Why now: " + dealPressure(deal) + "\n\n" +
            "Proof line: " + moment.proof + "\n\n" +
            "If you are open, the forwardable note is below. It should take less than two minutes to adapt.";
        var forward = "Subject: Quick read on " + company + "\n\n" +
            (buyer || "[Buyer]") + " -\n\n" +
            "I wanted to connect you with the Antaeus team because the work they are doing around this problem looks relevant to the thread at " + company + ". " +
            moment.advisorLine + "\n\n" +
            "Worth a brief look?\n\n" +
            (advisor ? advisor.name : "[Advisor]");
        return {
            ask: state.customAsk || line,
            forward: forward,
            title: ask,
            proof: moment.proof,
            outcome: moment.outcome
        };
    }

    function spendRead(ctx){
        var score = 30;
        if(ctx.deal) score += 15;
        if(ctx.advisor) score += 15;
        if(ctx.deal && advisorsForDeal(ctx.deal).length) score += 14;
        if(ctx.deal && ctx.deal.nextStepDate) score += 8;
        if(ctx.deal && (ctx.deal.economicBuyer || ctx.deal.champion)) score += 8;
        if(ctx.moment && ctx.moment.id !== "intro") score += 5;
        return Math.min(92, score);
    }

    function render(){
        renderSelectors();
        var ctx = currentContext();
        var generated = buildAsk(ctx);
        var score = spendRead(ctx);
        var deal = ctx.deal;
        var advisor = ctx.advisor;
        var moment = ctx.moment;

        byId("advisorDeskTitle").textContent = deal
            ? dealName(deal) + " needs " + moment.name.toLowerCase() + "."
            : "Prepare one backchannel ask before you spend trust.";
        byId("deskNote").textContent = deal
            ? "The desk is pointed at " + stageLabel(deal.stage) + ", " + money(dealValue(deal)) + ". " + dealPressure(deal)
            : "Add a live deal and at least one advisor before spending relationship capital.";

        byId("deskRead").innerHTML =
            '<div class="desk-read-top"><div><div class="desk-label">Spend read</div><h3>' + escapeHtml(score >= 72 ? "Ask-ready" : score >= 54 ? "Narrow first" : "Not ready") + '</h3></div><div class="desk-read-score">' + score + '</div></div>' +
            '<p>' + escapeHtml(score >= 72 ? "Specific enough to send, but still small enough not to burn trust." : score >= 54 ? "A path exists. Tighten the buyer or proof line before sending." : "Do not spend advisor capital until the deal and ask are clearer.") + '</p>';

        byId("proofBlotter").innerHTML =
            '<div class="desk-label">Proof blotter</div>' +
            '<h3>' + escapeHtml(generated.proof) + '</h3>' +
            '<p>' + escapeHtml(dealPressure(deal)) + '</p>' +
            '<div class="proof-chipline">' +
                '<span class="proof-chip">' + escapeHtml(stageLabel(deal && deal.stage)) + '</span>' +
                '<span class="proof-chip">' + escapeHtml(money(dealValue(deal))) + '</span>' +
                '<span class="proof-chip">' + escapeHtml(moment.name) + '</span>' +
            '</div>';

        renderRolodex(ctx);

        byId("askSheet").innerHTML =
            '<div class="desk-label">Forwardable note</div>' +
            '<h3>' + escapeHtml(generated.title) + '</h3>' +
            '<p>' + escapeHtml("Carrier: " + (advisor ? advisor.name + ", " + (advisor.title || TIERS[advisor.tier || "t2"].label) : "No advisor selected") + ". Return: " + generated.outcome) + '</p>' +
            '<textarea class="desk-textarea" id="askEditor" aria-label="Advisor ask text">' + escapeHtml(generated.ask) + '</textarea>';

        byId("deskEdge").innerHTML =
            deskEdgeItem("Input", deal ? dealName(deal) + " proof line" : "No live deal") +
            deskEdgeItem("Carrier", advisor ? advisor.name : "No advisor") +
            deskEdgeItem("Output", "Copy-ready ask") +
            deskEdgeItem("Return", generated.outcome);

        renderRegistry();
        renderDeployments();
        renderImpact();
    }

    function deskEdgeItem(label, title){
        return '<div><div class="desk-label">' + escapeHtml(label) + '</div><h3>' + escapeHtml(title) + '</h3></div>';
    }

    function renderSelectors(){
        var dealOptions = activeDeals().map(function(deal){
            return '<option value="' + escapeHtml(deal.id || "") + '"' + (String(deal.id || "") === String(state.dealId || "") ? " selected" : "") + '>' + escapeHtml(dealName(deal) + " - " + money(dealValue(deal)) + " - " + stageLabel(deal.stage)) + '</option>';
        });
        if(!dealOptions.length) dealOptions.push('<option value="">No live deals yet</option>');
        byId("dealSelect").innerHTML = dealOptions.join("");

        var advisors = getAdvisors();
        var deal = getDealById(state.dealId);
        var exactIds = advisorsForDeal(deal).map(function(advisor){ return advisor.id; });
        var advisorOptions = advisors.map(function(advisor){
            var marker = exactIds.indexOf(advisor.id) >= 0 ? "exact" : "available";
            return '<option value="' + escapeHtml(advisor.id) + '"' + (String(advisor.id) === String(state.advisorId || "") ? " selected" : "") + '>' + escapeHtml(advisor.name + " - " + marker) + '</option>';
        });
        if(!advisorOptions.length) advisorOptions.push('<option value="">No advisors registered</option>');
        byId("advisorSelect").innerHTML = advisorOptions.join("");

        byId("momentSelect").innerHTML = MOMENTS.map(function(moment){
            return '<option value="' + escapeHtml(moment.id) + '"' + (moment.id === state.momentId ? " selected" : "") + '>' + escapeHtml(moment.name) + '</option>';
        }).join("");
    }

    function renderRolodex(ctx){
        var advisors = getAdvisors();
        if(!advisors.length){
            byId("advisorRolodex").innerHTML = '<div class="contact-empty">No advisors are registered yet. Add one below before this room can spend outside trust.</div>';
            return;
        }
        var exact = advisorsForDeal(ctx.deal);
        var selected = ctx.advisor;
        var list = exact.concat(advisors.filter(function(advisor){
            return !exact.some(function(item){ return item.id === advisor.id; });
        })).slice(0, 4);
        byId("advisorRolodex").innerHTML = list.map(function(advisor){
            var status = getCooldownStatus(advisor);
            var exactMatch = exact.some(function(item){ return item.id === advisor.id; });
            return '<button class="contact-tab' + (selected && selected.id === advisor.id ? " is-active" : "") + '" type="button" data-action="choose-advisor" data-id="' + escapeHtml(advisor.id) + '">' +
                '<h3>' + escapeHtml(advisor.name) + '</h3>' +
                '<p>' + escapeHtml((exactMatch ? "Exact company path. " : "") + (advisor.title || TIERS[advisor.tier || "t2"].label) + ". " + status.label + ".") + '</p>' +
            '</button>';
        }).join("");
    }

    function renderRegistry(){
        var advisors = getAdvisors();
        byId("advisorList").innerHTML = advisors.length ? advisors.map(function(advisor){
            var status = getCooldownStatus(advisor);
            return '<div class="ledger-row">' +
                '<div><strong>' + escapeHtml(advisor.name) + '</strong><small>' + escapeHtml(advisor.title || TIERS[advisor.tier || "t2"].label) + '</small></div>' +
                '<div><span class="pill ' + (status.ok ? "green" : "orange") + '">' + escapeHtml(status.label) + '</span></div>' +
                '<div><button class="desk-btn red" type="button" data-action="delete-advisor" data-id="' + escapeHtml(advisor.id) + '">Remove</button></div>' +
            '</div>';
        }).join("") : '<div class="empty-note">No advisor registry yet. Add the people whose trust should be spent carefully.</div>';
    }

    function renderDeployments(){
        var deployments = getDeployments().slice().sort(function(a, b){
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        byId("deploymentList").innerHTML = deployments.length ? deployments.map(function(dep){
            var advisor = getAdvisorById(dep.advisorId);
            var moment = getMomentById(dep.momentId);
            return '<div class="ledger-row">' +
                '<div><strong>' + escapeHtml(dep.dealName || "Unknown deal") + '</strong><small>' + escapeHtml((advisor ? advisor.name : "Unknown advisor") + " - " + moment.name + " - " + daysSince(dep.createdAt) + "d ago") + '</small></div>' +
                '<div><select class="outcome-select" data-action="update-outcome" data-id="' + escapeHtml(dep.id) + '">' +
                    option("pending", "Pending", dep.outcome) +
                    option("engaged", "Engaged", dep.outcome) +
                    option("successful", "Successful", dep.outcome) +
                    option("no_response", "No response", dep.outcome) +
                    option("declined", "Declined", dep.outcome) +
                '</select></div>' +
                '<div><button class="desk-btn blue" type="button" data-action="open-deal-from-dep" data-id="' + escapeHtml(dep.id) + '">Open deal</button></div>' +
            '</div>';
        }).join("") : '<div class="empty-note">No advisor asks logged yet. When you send, hold, or reroute, the loop appears here.</div>';
    }

    function option(value, label, selected){
        return '<option value="' + escapeHtml(value) + '"' + ((selected || "pending") === value ? " selected" : "") + '>' + escapeHtml(label) + '</option>';
    }

    function renderImpact(){
        var advisors = getAdvisors();
        var deployments = getDeployments();
        var deals = activeDeals();
        var covered = deals.filter(function(deal){ return advisorsForDeal(deal).length > 0; }).length;
        var pending = deployments.filter(function(dep){ return !dep.outcome || dep.outcome === "pending" || dep.outcome === "engaged"; }).length;
        var successful = deployments.filter(function(dep){ return dep.outcome === "successful"; }).length;
        var rate = deployments.length ? Math.round((successful / deployments.length) * 100) : 0;
        byId("impactGrid").innerHTML =
            impactCell(advisors.length, "registered carriers") +
            impactCell(covered + "/" + deals.length, "live deal coverage") +
            impactCell(pending, "open loops") +
            impactCell(rate + "%", "success read");

        var rows = [];
        if(!advisors.length) rows.push(["Registry first", "No advisor can carry the ask until the relationship is registered.", "red"]);
        if(deals.length && covered < deals.length) rows.push(["Coverage gap", (deals.length - covered) + " live deal(s) have no mapped advisor path.", "orange"]);
        if(pending) rows.push(["Follow-through", pending + " advisor loop(s) still need a result.", "blue"]);
        if(successful) rows.push(["Compounding", successful + " advisor loop(s) produced useful movement.", "green"]);
        if(!rows.length) rows.push(["Clean desk", "No urgent advisor weakness is visible right now.", "green"]);
        byId("impactList").innerHTML = rows.map(function(row){
            return '<div class="ledger-row"><div><strong>' + escapeHtml(row[0]) + '</strong><small>' + escapeHtml(row[1]) + '</small></div><div><span class="pill ' + row[2] + '">' + escapeHtml(row[0]) + '</span></div><div></div></div>';
        }).join("");
    }

    function impactCell(value, label){
        return '<div class="impact-cell"><strong>' + escapeHtml(value) + '</strong><span>' + escapeHtml(label) + '</span></div>';
    }

    function deploymentPayload(outcome){
        var ctx = currentContext();
        var generated = buildAsk(ctx);
        return {
            id: uid("dep"),
            dealId: ctx.deal ? (ctx.deal.id || "") : "",
            dealName: ctx.deal ? dealName(ctx.deal) : "Unlinked deal",
            dealStage: ctx.deal ? (ctx.deal.stage || "") : "",
            advisorId: ctx.advisor ? ctx.advisor.id : "",
            advisorName: ctx.advisor ? ctx.advisor.name : "",
            momentId: ctx.moment.id,
            momentName: ctx.moment.name,
            ask: generated.ask,
            forwardableNote: generated.forward,
            outcome: outcome,
            notes: outcome === "pending" ? "Ask sent from Backchannel Desk." : outcome === "hold" ? "Held before spending advisor trust." : "Rerouted before sending.",
            createdAt: new Date().toISOString(),
            outcomeDate: outcome === "pending" ? null : new Date().toISOString()
        };
    }

    function logDeployment(outcome){
        var ctx = currentContext();
        if(!ctx.deal){
            toast("No deal selected");
            return;
        }
        if(!ctx.advisor){
            toast("No advisor selected");
            return;
        }
        var dep = deploymentPayload(outcome);
        var deployments = getDeployments();
        deployments.unshift(dep);
        saveDeployments(deployments);
        syncDeploymentToDeal(dep);
        toast(outcome === "pending" ? "Ask logged" : outcome === "hold" ? "Hold logged" : "Reroute logged");
        render();
    }

    function syncDeploymentToDeal(dep){
        var deal = dep.dealId ? getDealById(dep.dealId) : null;
        if(!deal) return;
        var history = Array.isArray(deal.advisorHistory) ? deal.advisorHistory.slice() : [];
        var entry = {
            id: dep.id,
            advisorId: dep.advisorId || "",
            advisorName: dep.advisorName || "",
            momentId: dep.momentId || "",
            momentName: dep.momentName || "",
            outcome: dep.outcome || "pending",
            createdAt: dep.createdAt,
            outcomeDate: dep.outcomeDate || null
        };
        var idx = history.findIndex(function(item){ return item && item.id === dep.id; });
        if(idx >= 0) history[idx] = entry;
        else history.push(entry);
        deal.advisorHistory = history;
        deal.lastAdvisorDeployment = entry;
        deal.lastAdvisorDeploymentAt = dep.createdAt;
        deal.lastAdvisorMoment = entry.momentName || "";
        if(dep.outcome === "pending"){
            deal.nextStep = deal.nextStep || "Send advisor ask and book the follow-up thread";
            deal.nextStepDate = deal.nextStepDate || addDaysIso(3);
        }
        if(dep.outcome === "engaged" || dep.outcome === "successful"){
            deal.nextStep = "Convert advisor momentum into the next stakeholder step";
            deal.nextStepDate = addDaysIso(dep.outcome === "successful" ? 2 : 3);
        }
        if(dep.outcome === "declined" || dep.outcome === "no_response" || dep.outcome === "hold" || dep.outcome === "reroute"){
            deal.nextStep = "Choose the next leverage path without waiting on this advisor thread";
            deal.nextStepDate = addDaysIso(4);
        }
        saveDeal(deal);
    }

    function updateDeploymentOutcome(id, outcome){
        var deployments = getDeployments();
        var dep = deployments.find(function(item){ return item.id === id; });
        if(!dep) return;
        dep.outcome = outcome;
        dep.outcomeDate = new Date().toISOString();
        saveDeployments(deployments);
        syncDeploymentToDeal(dep);
        toast("Outcome updated");
        render();
    }

    function addAdvisor(event){
        event.preventDefault();
        var name = byId("advisorName").value.trim();
        if(!name){
            toast("Name required");
            return;
        }
        var advisor = {
            id: uid("adv"),
            name: name,
            title: byId("advisorTitle").value.trim(),
            tier: byId("advisorTier").value,
            expertise: byId("advisorExpertise").value.trim(),
            equity: "",
            companies: byId("advisorCompanies").value.split(",").map(function(item){ return item.trim(); }).filter(Boolean),
            notes: byId("advisorNotes").value.trim(),
            relationship: "active",
            createdAt: new Date().toISOString()
        };
        var advisors = getAdvisors();
        advisors.push(advisor);
        saveAdvisors(advisors);
        state.advisorId = advisor.id;
        event.target.reset();
        toast("Advisor saved");
        render();
    }

    function deleteAdvisor(id){
        saveAdvisors(getAdvisors().filter(function(advisor){ return advisor.id !== id; }));
        if(state.advisorId === id) state.advisorId = "";
        toast("Advisor removed");
        render();
    }

    function buildAdvisorRoomHref(href, focusObject, roomLabel){
        try {
            var url = new URL(href, window.location.origin);
            if(!url.searchParams.get("returnTo")){
                url.searchParams.set("returnTo", "/app/advisor-deploy/");
                url.searchParams.set("returnLabel", "Back to Advisor Deploy");
                if(focusObject) url.searchParams.set("focusObject", focusObject);
                if(roomLabel) url.searchParams.set("focusRoom", roomLabel);
                url.searchParams.set("fromMode", "room");
                url.searchParams.set("fromSurface", "advisor-deploy");
            }
            return url.pathname + url.search + url.hash;
        } catch (error) {
            return href;
        }
    }

    function openRoom(room){
        var ctx = currentContext();
        var deal = ctx.deal;
        if(!deal){
            toast("No deal selected");
            return;
        }
        var id = encodeURIComponent(deal.id || "");
        if(room === "deal") window.location.href = buildAdvisorRoomHref("/app/deal-workspace/?deal=" + id, dealName(deal), "Deal Workspace");
        if(room === "autopsy") window.location.href = buildAdvisorRoomHref("/app/future-autopsy/?deal=" + id, dealName(deal), "Future Autopsy");
        if(room === "poc") window.location.href = buildAdvisorRoomHref("/app/poc-framework/?deal=" + id, dealName(deal), "PoC Framework");
    }

    function openDealFromDeployment(id){
        var dep = getDeployments().find(function(item){ return item.id === id; });
        if(!dep){
            toast("Deployment missing");
            return;
        }
        var deal = dep.dealId ? getDealById(dep.dealId) : null;
        var target = deal ? deal.id : "";
        window.location.href = buildAdvisorRoomHref("/app/deal-workspace/?deal=" + encodeURIComponent(target), dep.dealName || "Advisor deployment", "Deal Workspace");
    }

    function copyText(text){
        if(navigator.clipboard && navigator.clipboard.writeText){
            return navigator.clipboard.writeText(text);
        }
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "readonly");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
        return Promise.resolve();
    }

    function copyAsk(){
        var generated = buildAsk(currentContext());
        var text = generated.ask + "\n\n--- Forwardable note ---\n\n" + generated.forward;
        copyText(text).then(function(){ toast("Ask copied"); });
    }

    function exportPack(){
        var ctx = currentContext();
        var generated = buildAsk(ctx);
        var text = [
            "# Advisor Deploy Pack",
            "",
            "Deal: " + (ctx.deal ? dealName(ctx.deal) : "Unlinked"),
            "Value: " + (ctx.deal ? money(dealValue(ctx.deal)) : "$0"),
            "Advisor: " + (ctx.advisor ? ctx.advisor.name : "None"),
            "Moment: " + ctx.moment.name,
            "",
            "## Ask",
            generated.ask,
            "",
            "## Forwardable note",
            generated.forward,
            "",
            "## Return condition",
            generated.outcome
        ].join("\n");
        var blob = new Blob([text], { type: "text/markdown" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "advisor-deploy-pack.md";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast("Pack exported");
    }

    function resetRoute(){
        hydrateStateFromData();
        render();
        toast("Route reset");
    }

    function handleAction(event){
        var target = event.target.closest("[data-action]");
        if(!target) return;
        var action = target.getAttribute("data-action");
        if(action === "toggle-sheet"){
            var sheet = byId(target.getAttribute("data-target"));
            if(sheet) sheet.classList.toggle("is-open");
        }
        if(action === "choose-advisor"){
            state.advisorId = target.getAttribute("data-id") || "";
            state.customAsk = "";
            render();
        }
        if(action === "delete-advisor") deleteAdvisor(target.getAttribute("data-id"));
        if(action === "log-send") logDeployment("pending");
        if(action === "log-hold") logDeployment("hold");
        if(action === "log-reroute") logDeployment("reroute");
        if(action === "copy-ask") copyAsk();
        if(action === "export-pack") exportPack();
        if(action === "reset-route") resetRoute();
        if(action === "open-deal") openRoom("deal");
        if(action === "open-autopsy") openRoom("autopsy");
        if(action === "open-poc") openRoom("poc");
        if(action === "open-deal-from-dep") openDealFromDeployment(target.getAttribute("data-id"));
    }

    function handleChange(event){
        if(event.target.id === "dealSelect"){
            state.dealId = event.target.value;
            var deal = getDealById(state.dealId);
            state.momentId = recommendedMomentForDeal(deal);
            var advisor = recommendedAdvisor(deal);
            state.advisorId = advisor ? advisor.id : "";
            state.customAsk = "";
            render();
        }
        if(event.target.id === "advisorSelect"){
            state.advisorId = event.target.value;
            state.customAsk = "";
            render();
        }
        if(event.target.id === "momentSelect"){
            state.momentId = event.target.value;
            state.customAsk = "";
            render();
        }
        if(event.target.id === "askEditor") state.customAsk = event.target.value;
        if(event.target.getAttribute("data-action") === "update-outcome"){
            updateDeploymentOutcome(event.target.getAttribute("data-id"), event.target.value);
        }
    }

    function toast(message){
        var node = byId("toast");
        if(!node) return;
        node.textContent = message;
        node.classList.add("show");
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function(){ node.classList.remove("show"); }, 1700);
    }

    window.prefillDeal = function(dealId, momentId, advisorId){
        if(dealId) state.dealId = dealId;
        if(momentId) state.momentId = momentId;
        if(advisorId) state.advisorId = advisorId;
        render();
    };

    async function boot(){
        if(!byId("advisorRoom")) return;
        if(window.gtmPersistence && window.gtmPersistence.docs && typeof window.gtmPersistence.docs.load === "function"){
            await window.gtmPersistence.docs.load({ keys: ["gtmos_advisor_registry", "gtmos_advisor_deployments"] }).catch(function(error){
                console.error("Advisor Deploy docs preload failed:", error);
            });
        }
        if(window.gtmPersistence && window.gtmPersistence.deals && typeof window.gtmPersistence.deals.loadAll === "function"){
            await window.gtmPersistence.deals.loadAll().catch(function(error){
                console.error("Advisor Deploy deals preload failed:", error);
            });
        }
        hydrateStateFromData();
        byId("advisorForm").addEventListener("submit", addAdvisor);
        document.addEventListener("click", handleAction);
        document.addEventListener("change", handleChange);
        document.addEventListener("input", handleChange);
        render();
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
