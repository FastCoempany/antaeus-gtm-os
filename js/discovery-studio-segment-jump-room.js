(function(){
  var runtime = window.DISCOVERY_SEGMENT_RUNTIME || null;
  var root = document.getElementById("dsjRoot");
  if(!root) return;

  var STORAGE_KEY = "gtmos_discovery_segment_jump_room_v1";
  var CATEGORY_KEY = "gtmos_product_category";
  var evaluationBySegment = {
    "opening-frame":["p","q"],
    "current-state-truth":["q","x"],
    "pain-and-consequence":["q","x","f"],
    "trigger-and-urgency":["q","f"],
    "stakeholder-and-ownership":["x","q"],
    "proof-threshold":["x","v"],
    "current-vendor-and-displacement":["q","x","v"],
    "decision-architecture":["x","f"],
    "next-step-lock":["c","p"],
    "post-call-routing":["c","v"]
  };
  var roomMeta = {
    "call-planner": { label:"Call Planner", href:"/app/discovery-agenda/" },
    "deal-workspace": { label:"Deal Workspace", href:"/app/deal-workspace/" },
    "future-autopsy": { label:"Future Autopsy", href:"/app/future-autopsy/" }
  };
  var toneText = {
    grn:"tone-grn",
    org:"tone-org",
    red:"tone-red",
    blu:"tone-blu",
    pur:"tone-pur"
  };
  var registry = runtime && Array.isArray(runtime.registry) ? runtime.registry.slice() : [];
  var aliasMap = buildAliasMap(registry);
  var state = readLS(STORAGE_KEY, {
    frameworkId: "",
    emergency: false,
    panelHidden: false,
    dockView: "recover",
    frameworks: {}
  });
  if(!state || typeof state !== "object") state = {};
  if(!state.frameworks || typeof state.frameworks !== "object") state.frameworks = {};
  if(typeof state.frameworkId !== "string") state.frameworkId = "";
  state.emergency = !!state.emergency;
  state.panelHidden = !!state.panelHidden;
  state.dockView = ["recover","context","routes"].indexOf(state.dockView) > -1 ? state.dockView : "recover";

  function esc(value){
    var node = document.createElement("div");
    node.textContent = value == null ? "" : String(value);
    return node.innerHTML;
  }

  function slug(value){
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function readLS(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(error){
      return fallback;
    }
  }

  function readTextLS(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      if(raw == null) return fallback;
      try{
        var parsed = JSON.parse(raw);
        return typeof parsed === "string" ? parsed : fallback;
      }catch(error){
        return raw || fallback;
      }
    }catch(error){
      return fallback;
    }
  }

  function writeLS(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
    }catch(error){
      // ignore storage failures
    }
  }

  function buildAliasMap(items){
    var map = {};
    items.forEach(function(item){
      [item.id, item.storageKey].concat(item.aliases || []).forEach(function(alias){
        if(!alias || typeof alias !== "string") return;
        map[alias.trim().toLowerCase()] = item.id;
      });
    });
    return map;
  }

  function resolveFrameworkKey(raw){
    var value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    return value && aliasMap[value] ? aliasMap[value] : "";
  }

  function getFramework(frameworkId){
    return runtime && runtime.frameworks ? runtime.frameworks[frameworkId] || null : null;
  }

  function getRegistryItem(frameworkId){
    return registry.find(function(item){ return item.id === frameworkId; }) || null;
  }

  function getFirstFrameworkId(){
    if(getFramework("customer-support")) return "customer-support";
    return registry.length ? registry[0].id : "";
  }

  function getInitialFrameworkId(){
    var query = new URLSearchParams(window.location.search);
    var explicit = resolveFrameworkKey(query.get("framework") || query.get("category") || "");
    if(explicit && getFramework(explicit)) return explicit;
    var stored = resolveFrameworkKey(readTextLS(CATEGORY_KEY, ""));
    if(stored && getFramework(stored)) return stored;
    return getFirstFrameworkId();
  }

  function ensureFrameworkState(frameworkId){
    if(!state.frameworks[frameworkId]){
      state.frameworks[frameworkId] = {
        openSegment: "opening-frame",
        openNodes: {},
        activeBranches: {},
        checkedNodes: {},
        selectedInterrupt: ""
      };
    }
    if(!state.frameworks[frameworkId].openNodes || typeof state.frameworks[frameworkId].openNodes !== "object"){
      state.frameworks[frameworkId].openNodes = {};
    }
    return state.frameworks[frameworkId];
  }

  function getFrameworkState(frameworkId){
    return ensureFrameworkState(frameworkId);
  }

  function persist(){
    writeLS(STORAGE_KEY, state);
  }

  function getDeals(){
    var deals = readLS("gtmos_deal_workspaces", []);
    if(Array.isArray(deals)) return deals;
    return Object.values(deals || {});
  }

  function buildDiscoveryRoomHref(href, focusObject, roomLabel){
    try{
      var url = new URL(href, window.location.origin);
      url.searchParams.set("returnTo", "/app/discovery-studio/");
      url.searchParams.set("returnLabel", "Back to Discovery Studio");
      if(focusObject) url.searchParams.set("focusObject", focusObject);
      if(roomLabel) url.searchParams.set("focusRoom", roomLabel);
      url.searchParams.set("fromMode", "room");
      url.searchParams.set("fromSurface", "discovery-studio");
      return url.pathname + url.search + url.hash;
    }catch(error){
      return href;
    }
  }

  function getAgendaState(){
    return readLS("gtmos_discovery_agenda", null) || null;
  }

  function getHandoffState(){
    return readLS("gtmos_call_handoff", null) || null;
  }

  function getLinkedDeal(){
    var agenda = getAgendaState();
    var dealId = agenda && agenda.linkedDeal ? agenda.linkedDeal : "";
    if(!dealId) return null;
    return getDeals().find(function(deal){ return deal && deal.id === dealId; }) || null;
  }

  function getRoomContext(){
    var agenda = getAgendaState();
    var deal = getLinkedDeal();
    var focusObject = deal
      ? (deal.accountName || deal.name || "Discovery Studio")
      : agenda && agenda.company
        ? agenda.company
        : agenda && agenda.contact
          ? agenda.contact
          : "Discovery Studio";
    return {
      agenda: agenda,
      handoff: getHandoffState(),
      deal: deal,
      focusObject: focusObject,
      plannerHref: buildDiscoveryRoomHref("/app/discovery-agenda/", focusObject, "Call Planner"),
      workspaceHref: buildDiscoveryRoomHref(
        deal ? ("/app/deal-workspace/?deal=" + encodeURIComponent(deal.id)) : "/app/deal-workspace/",
        focusObject,
        "Deal Workspace"
      ),
      autopsyHref: buildDiscoveryRoomHref(
        deal ? ("/app/future-autopsy/?deal=" + encodeURIComponent(deal.id)) : "/app/future-autopsy/",
        focusObject,
        "Future Autopsy"
      )
    };
  }

  function getContextRoute(roomId, context){
    if(roomId === "call-planner") return context.plannerHref;
    if(roomId === "deal-workspace") return context.workspaceHref;
    if(roomId === "future-autopsy") return context.autopsyHref;
    return roomMeta[roomId] ? roomMeta[roomId].href : "#";
  }

  function setFramework(frameworkId){
    if(!getFramework(frameworkId)) return;
    state.frameworkId = frameworkId;
    ensureFrameworkState(frameworkId);
    var registryItem = getRegistryItem(frameworkId);
    if(registryItem && registryItem.storageKey){
      try{
        localStorage.setItem(CATEGORY_KEY, registryItem.storageKey);
      }catch(error){
        // ignore
      }
    }
    persist();
    render();
  }

  function setOpenSegment(segmentKey, shouldScroll){
    var frameworkState = getFrameworkState(state.frameworkId);
    var framework = getActiveFramework();
    frameworkState.openSegment = segmentKey;
    ensureOpenNode(framework, segmentKey);
    persist();
    render();
    if(shouldScroll) scrollToId("dsj-segment-" + segmentKey);
  }

  function setOpenNode(segmentKey, nodeId){
    var frameworkState = getFrameworkState(state.frameworkId);
    frameworkState.openNodes[segmentKey] = nodeId;
    persist();
    render();
  }

  function toggleEmergency(){
    state.emergency = !state.emergency;
    persist();
    render();
  }

  function togglePanel(){
    state.panelHidden = !state.panelHidden;
    persist();
    render();
  }

  function setDockView(view){
    if(["recover","context","routes"].indexOf(view) === -1) return;
    state.dockView = view;
    persist();
    render();
  }

  function toggleBranch(nodeId, branchIndex){
    var frameworkState = getFrameworkState(state.frameworkId);
    var segmentKey = nodeId.split("--")[0];
    frameworkState.openNodes[segmentKey] = nodeId;
    frameworkState.activeBranches[nodeId] = frameworkState.activeBranches[nodeId] === branchIndex ? -1 : branchIndex;
    persist();
    render();
  }

  function toggleCheck(nodeId){
    var frameworkState = getFrameworkState(state.frameworkId);
    frameworkState.checkedNodes[nodeId] = !frameworkState.checkedNodes[nodeId];
    persist();
    render();
  }

  function selectInterrupt(interruptId){
    var frameworkState = getFrameworkState(state.frameworkId);
    frameworkState.selectedInterrupt = frameworkState.selectedInterrupt === interruptId ? "" : interruptId;
    persist();
    render();
  }

  function scrollToId(id){
    window.requestAnimationFrame(function(){
      var node = document.getElementById(id);
      if(node) node.scrollIntoView({ behavior:"smooth", block:"start" });
    });
  }

  function handleActionTarget(target){
    var context = getRoomContext();
    if(!target) return;
    if(target.indexOf("segment:") === 0){
      setOpenSegment(target.slice(8), true);
      return;
    }
    if(target.indexOf("node:") === 0){
      var payload = target.slice(5);
      var segmentKey = payload.split("--")[0];
      var frameworkState = getFrameworkState(state.frameworkId);
      frameworkState.openNodes[segmentKey] = payload;
      setOpenSegment(segmentKey, false);
      scrollToId("dsj-node-" + payload);
      return;
    }
    if(target.indexOf("room:") === 0){
      window.location.href = getContextRoute(target.slice(5), context);
      return;
    }
    if(target.charAt(0) === "#"){
      scrollToId(target.slice(1));
      return;
    }
    window.location.href = target;
  }

  function getActiveFramework(){
    return getFramework(state.frameworkId);
  }

  function getOpenSegment(framework){
    var frameworkState = getFrameworkState(state.frameworkId);
    var fallback = framework && framework.segments && framework.segments.length ? framework.segments[0].key : "";
    var openKey = frameworkState.openSegment || fallback;
    if(state.emergency){
      var openSegment = (framework.segments || []).find(function(segment){ return segment.key === openKey; }) || null;
      if(!openSegment || !openSegment.essential){
        var firstEssential = (framework.segments || []).find(function(segment){ return segment.essential; }) || null;
        openKey = firstEssential ? firstEssential.key : fallback;
        frameworkState.openSegment = openKey;
      }
    }
    return openKey;
  }

  function visibleSegments(framework){
    if(!framework || !Array.isArray(framework.segments)) return [];
    return state.emergency
      ? framework.segments.filter(function(segment){ return segment.essential; })
      : framework.segments.slice();
  }

  function getVisibleNodes(segment){
    return state.emergency
      ? (segment.nodes || []).filter(function(node){ return node.essential; })
      : (segment.nodes || []).slice();
  }

  function ensureOpenNode(framework, segmentKey){
    var frameworkState = getFrameworkState(state.frameworkId);
    var segment = (framework && framework.segments || []).find(function(item){ return item.key === segmentKey; }) || null;
    if(!segment) return "";
    var nodes = getVisibleNodes(segment);
    var current = frameworkState.openNodes[segmentKey] || "";
    var exists = nodes.some(function(node){ return node.id === current; });
    if(!exists){
      frameworkState.openNodes[segmentKey] = nodes.length ? nodes[0].id : "";
    }
    return frameworkState.openNodes[segmentKey] || "";
  }

  function checkedCount(framework){
    var frameworkState = getFrameworkState(state.frameworkId);
    var checkedNodes = frameworkState.checkedNodes || {};
    var allNodes = [];
    (framework.segments || []).forEach(function(segment){
      (segment.nodes || []).forEach(function(node){
        if(!state.emergency || node.essential) allNodes.push(node);
      });
    });
    var essentialNodes = allNodes.filter(function(node){ return node.essential; });
    var checkedVisible = allNodes.filter(function(node){ return checkedNodes[node.id]; }).length;
    var checkedEssential = essentialNodes.filter(function(node){ return checkedNodes[node.id]; }).length;
    return {
      visible: checkedVisible,
      visibleTotal: allNodes.length,
      essential: checkedEssential,
      essentialTotal: essentialNodes.length
    };
  }

  function activeEvaluation(segmentKey){
    return evaluationBySegment[segmentKey] || [];
  }

  function renderMiniPill(label, value){
    return '<span class="dsj-mini-pill"><strong>' + esc(label) + '</strong> ' + esc(value) + '</span>';
  }

  function renderActionButton(action, extraClass){
    var cls = toneText[action.tone] || "";
    return '<button type="button" class="' + esc(extraClass || "dsj-inline-btn") + (cls ? (" " + cls) : "") + '" data-target="' + esc(action.target) + '">' + esc(action.label) + '</button>';
  }

  function renderTopbar(framework, context, segmentKey){
    var pills = [
      renderMiniPill("Focus", context.focusObject)
    ];
    if(context.deal){
      pills.push(renderMiniPill("Deal", context.deal.accountName || context.deal.name || "Linked"));
    }else if(context.agenda && context.agenda.company){
      pills.push(renderMiniPill("Agenda", context.agenda.company));
    }
    return '' +
      '<div class="dsj-topbar">' +
        '<div class="dsj-topbar-left">' +
          '<span class="dsj-brand">Antaeus</span>' +
          '<span class="dsj-title">Discovery Studio</span>' +
        '</div>' +
        '<div class="dsj-topbar-center">' + pills.join("") + '</div>' +
        '<div class="dsj-topbar-right">' +
          '<button type="button" class="dsj-icon-btn ' + (state.emergency ? 'is-hot' : 'is-warning') + '" id="dsjEmergencyBtn">' + (state.emergency ? 'Full view' : 'Compress') + '</button>' +
          '<button type="button" class="dsj-panel-toggle" id="dsjPanelToggle">' + esc(state.panelHidden ? 'Show dock' : 'Hide dock') + '</button>' +
        '</div>' +
      '</div>';
  }

  function renderFrameworkRail(){
    return '' +
      '<aside class="dsj-rail">' +
        '<div class="dsj-rail-label">Framework rail</div>' +
        '<div class="dsj-framework-list">' +
          registry.map(function(item){
            var framework = getFramework(item.id);
            var active = item.id === state.frameworkId;
            var count = framework && framework.segments ? framework.segments.length : 0;
            return '' +
              '<button type="button" class="dsj-framework-btn' + (active ? ' is-active' : '') + '" data-framework="' + esc(item.id) + '">' +
                '<span class="dsj-dot"></span>' +
                '<span class="dsj-framework-short">' + esc(item.label) + '</span>' +
                '<span class="dsj-framework-count">' + esc(String(count)) + '</span>' +
              '</button>';
          }).join("") +
        '</div>' +
      '</aside>';
  }

  function renderSegmentStrip(framework, openSegmentKey){
    return '' +
      '<div class="dsj-segment-strip">' +
        framework.segments.map(function(segment){
          return '<button type="button" class="dsj-jump-btn' + (segment.key === openSegmentKey ? ' is-active' : '') + '" data-segment="' + esc(segment.key) + '">' + esc(segment.num + ' ' + segment.title) + '</button>';
        }).join("") +
      '</div>';
  }

  function renderQuickRow(framework){
    return '' +
      '<div class="dsj-quick-strip">' +
        framework.quickActions.map(function(item){
          var cls = toneText[item.action.tone] || "";
          return '' +
            '<button type="button" class="dsj-quick-btn' + (cls ? (" " + cls) : "") + '" data-target="' + esc(item.action.target) + '">' +
              '<span class="dsj-quick-title">' + esc(item.action.label) + '</span>' +
            '</button>';
        }).join("") +
      '</div>';
  }

  function renderBranch(nodeId, branch, branchIndex, isOpen){
    var detail = '';
    if(isOpen){
      detail = '' +
        '<div class="dsj-branch-detail">' +
          '<div class="dsj-inline-meta">Then say</div>' +
          '<div class="dsj-inline-line">' + esc(branch.move) + '</div>' +
          '<div class="dsj-inline-list">' +
            (branch.clear ? '<div class="dsj-inline-row"><strong>You now know</strong> ' + esc(branch.clear) + '</div>' : '') +
            (branch.missing ? '<div class="dsj-inline-row"><strong>Still missing</strong> ' + esc(branch.missing) + '</div>' : '') +
          '</div>' +
          '<div class="dsj-inline-actions">' + (branch.actions || []).map(function(action){
            return renderActionButton(action, 'dsj-inline-btn');
          }).join("") + '</div>' +
        '</div>';
    }
    return '' +
      '<div class="dsj-branch' + (isOpen ? ' is-open' : '') + '">' +
        '<button type="button" class="dsj-branch-btn" data-branch="' + esc(nodeId + ':' + branchIndex) + '">' +
          '<span class="dsj-response-dot tone-' + esc(branch.cls) + '"></span>' +
          '<span>' +
            '<span class="dsj-branch-tag">' + esc(branch.tag) + '</span>' +
            '<span class="dsj-branch-quote">' + esc(branch.quote) + '</span>' +
          '</span>' +
        '</button>' +
        detail +
      '</div>';
  }

  function renderNode(node, segmentKey, isOpen){
    var frameworkState = getFrameworkState(state.frameworkId);
    var activeBranch = frameworkState.activeBranches[node.id];
    return '' +
      '<article class="dsj-node' + (node.essential ? ' is-essential' : '') + (isOpen ? ' is-open' : '') + '" id="dsj-node-' + esc(node.id) + '">' +
        '<div class="dsj-node-head" data-node-head="' + esc(segmentKey + '|' + node.id) + '" role="button" tabindex="0">' +
          '<button type="button" class="dsj-check' + (frameworkState.checkedNodes[node.id] ? ' is-on' : '') + '" data-check="' + esc(node.id) + '">✓</button>' +
          '<span class="dsj-node-copy">' +
            '<div class="dsj-node-badge tone-' + esc(node.tone) + '">' + esc(node.badge) + '</div>' +
            '<div class="dsj-node-line">' + esc(node.text) + '</div>' +
          '</span>' +
          '<span class="dsj-node-caret">' + esc(isOpen ? 'Hide' : 'Open') + '</span>' +
        '</div>' +
        '<div class="dsj-node-branches">' +
          (node.branches || []).map(function(branch, branchIndex){
            return renderBranch(node.id, branch, branchIndex, activeBranch === branchIndex);
          }).join("") +
        '</div>' +
      '</article>';
  }

  function renderNodeTight(node, segmentKey, isOpen){
    var frameworkState = getFrameworkState(state.frameworkId);
    var activeBranch = frameworkState.activeBranches[node.id];
    return '' +
      '<article class="dsj-node' + (node.essential ? ' is-essential' : '') + (isOpen ? ' is-open' : '') + '" id="dsj-node-' + esc(node.id) + '">' +
        '<div class="dsj-node-head" data-node-head="' + esc(segmentKey + '|' + node.id) + '" role="button" tabindex="0">' +
          '<span class="dsj-check' + (frameworkState.checkedNodes[node.id] ? ' is-on' : '') + '" data-check="' + esc(node.id) + '">&#10003;</span>' +
          '<span class="dsj-node-copy">' +
            '<span class="dsj-node-badge tone-' + esc(node.tone) + '">' + esc(node.badge) + '</span>' +
            '<span class="dsj-node-line">' + esc(node.text) + '</span>' +
          '</span>' +
          '<span class="dsj-node-caret">' + esc(isOpen ? 'Hide' : 'Open') + '</span>' +
        '</div>' +
        '<div class="dsj-node-branches">' +
          (node.branches || []).map(function(branch, branchIndex){
            return renderBranch(node.id, branch, branchIndex, activeBranch === branchIndex);
          }).join("") +
        '</div>' +
      '</article>';
  }

  function renderPhase(segment, openSegmentKey){
    var isOpen = segment.key === openSegmentKey;
    var framework = getActiveFramework();
    var nodes = getVisibleNodes(segment);
    var openNodeId = isOpen ? ensureOpenNode(framework, segment.key) : "";
    return '' +
      '<section class="dsj-phase' + (isOpen ? ' is-open is-active' : '') + '" id="dsj-segment-' + esc(segment.key) + '">' +
        '<button type="button" class="dsj-phase-head" data-segment-head="' + esc(segment.key) + '">' +
          '<span class="dsj-phase-title-wrap">' +
            '<span class="dsj-phase-number">' + esc(segment.num) + '</span>' +
            '<span class="dsj-phase-title">' + esc(segment.title) + '</span>' +
          '</span>' +
          '<span class="dsj-phase-cue">' + esc(segment.cue) + '</span>' +
        '</button>' +
        '<div class="dsj-phase-body">' + nodes.map(function(node){ return renderNodeTight(node, segment.key, node.id === openNodeId); }).join("") + '</div>' +
      '</section>';
  }

  function renderCenter(framework, openSegmentKey){
    return '' +
      '<main class="dsj-center">' +
        renderQuickRow(framework) +
        '<div class="dsj-emergency' + (state.emergency ? ' is-live' : '') + '"><strong>Compressed mode.</strong> Only essential nodes stay visible until the call stabilizes.</div>' +
        '<div class="dsj-stack">' +
          visibleSegments(framework).map(function(segment){ return renderPhase(segment, openSegmentKey); }).join("") +
        '</div>' +
      '</main>';
  }

  function renderInterrupts(framework){
    var frameworkState = getFrameworkState(state.frameworkId);
    var selected = (framework.interrupts || []).find(function(item){ return item.id === frameworkState.selectedInterrupt; }) || (framework.interrupts || [])[0] || null;
    return '' +
      '<div class="dsj-dock-pane">' +
        '<div class="dsj-dock-section">' +
          '<div class="dsj-block-label">If the call jumps</div>' +
          '<h3>Recover the call</h3>' +
          '<p class="dsj-dock-copy">Use these at any point. They stay outside the segment order.</p>' +
          '<div class="dsj-interrupt-buttons">' +
            (framework.interrupts || []).map(function(interrupt){
              return '<button type="button" class="dsj-interrupt-btn' + (selected && selected.id === interrupt.id ? ' tone-org' : '') + '" data-interrupt="' + esc(interrupt.id) + '">' + esc(interrupt.label) + '</button>';
            }).join("") +
          '</div>' +
          (selected ? '' +
            '<div class="dsj-interrupt-detail">' +
              '<div class="dsj-inline-meta">Say this</div>' +
              '<div class="dsj-inline-line">' + esc(selected.reply) + '</div>' +
              '<div class="dsj-inline-actions">' + (selected.actions || []).map(function(action){
                return renderActionButton(action, 'dsj-inline-btn');
              }).join("") + '</div>' +
            '</div>' : '') +
        '</div>' +
      '</div>';
  }

  function renderContextPane(framework, context){
    var rows = [
      { label:"Focus object", value:context.focusObject },
      { label:"Framework aim", value:framework.target },
      { label:"Proof to earn", value:framework.proof },
      { label:"Next review", value:framework.nextReview }
    ];
    if(context.deal){
      rows.splice(1, 0, {
        label:"Linked deal",
        value:context.deal.accountName || context.deal.name || "Live deal"
      });
    }else if(context.agenda && context.agenda.company){
      rows.splice(1, 0, {
        label:"Agenda company",
        value:context.agenda.company
      });
    }
    return '' +
      '<div class="dsj-dock-pane">' +
        '<div class="dsj-dock-section">' +
          '<div class="dsj-block-label">Call context</div>' +
          '<h3>Keep the room grounded</h3>' +
          '<div class="dsj-dock-grid">' +
            rows.map(function(row){
              return '<div class="dsj-kv"><div class="dsj-kv-label">' + esc(row.label) + '</div><div class="dsj-kv-value">' + esc(row.value) + '</div></div>';
            }).join("") +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderRoutes(context){
    return '' +
      '<div class="dsj-dock-pane">' +
        '<div class="dsj-dock-section">' +
          '<div class="dsj-block-label">Next rooms</div>' +
          '<h3>Leave this room cleanly</h3>' +
          '<div class="dsj-route-list">' +
            ['call-planner','deal-workspace','future-autopsy'].map(function(roomId){
              return '' +
                '<div class="dsj-route-row" id="dsj-route-' + esc(roomId) + '">' +
                  '<div class="dsj-route-copy">' +
                    '<div class="dsj-route-title">' + esc(roomMeta[roomId].label) + '</div>' +
                    '<div class="dsj-route-line">' + esc(roomId === 'call-planner'
                      ? 'Tighten the forcing question.'
                      : roomId === 'deal-workspace'
                        ? 'Attach the discovery truth to the live deal.'
                        : 'Name the failure pattern if the call smells like drift.') + '</div>' +
                  '</div>' +
                  '<a class="dsj-route-btn tone-blu" href="' + esc(getContextRoute(roomId, context)) + '">Open</a>' +
                '</div>';
            }).join("") +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderDockTabs(){
    var tabs = [
      { id:"recover", label:"Recover" },
      { id:"context", label:"Context" },
      { id:"routes", label:"Routes" }
    ];
    return '' +
      '<div class="dsj-dock-tabs">' +
        tabs.map(function(tab){
          return '<button type="button" class="dsj-dock-tab' + (state.dockView === tab.id ? ' is-active' : '') + '" data-dock-view="' + esc(tab.id) + '">' + esc(tab.label) + '</button>';
        }).join("") +
      '</div>';
  }

  function renderDock(framework, context){
    var pane = state.dockView === "context"
      ? renderContextPane(framework, context)
      : state.dockView === "routes"
        ? renderRoutes(context)
        : renderInterrupts(framework);
    return '' +
      '<aside class="dsj-dock' + (state.panelHidden ? ' is-hidden' : '') + '">' +
        renderDockTabs() +
        pane +
      '</aside>';
  }

  function bindEvents(){
    if(root.__dsjEventsBound) return;
    root.__dsjEventsBound = true;

    root.addEventListener("click", function(event){
      var check = event.target.closest("[data-check]");
      if(check && root.contains(check)){
        event.stopPropagation();
        toggleCheck(check.getAttribute("data-check"));
        return;
      }

      var emergencyButton = event.target.closest("#dsjEmergencyBtn");
      if(emergencyButton && root.contains(emergencyButton)){
        toggleEmergency();
        return;
      }

      var panelButton = event.target.closest("#dsjPanelToggle");
      if(panelButton && root.contains(panelButton)){
        togglePanel();
        return;
      }

      var frameworkButton = event.target.closest("[data-framework]");
      if(frameworkButton && root.contains(frameworkButton)){
        setFramework(frameworkButton.getAttribute("data-framework"));
        return;
      }

      var segmentButton = event.target.closest("[data-segment], [data-segment-head]");
      if(segmentButton && root.contains(segmentButton)){
        setOpenSegment(segmentButton.getAttribute("data-segment") || segmentButton.getAttribute("data-segment-head"), true);
        return;
      }

      var nodeHead = event.target.closest("[data-node-head]");
      if(nodeHead && root.contains(nodeHead)){
        var nodeParts = (nodeHead.getAttribute("data-node-head") || "").split("|");
        if(nodeParts.length === 2){
          setOpenNode(nodeParts[0], nodeParts[1]);
        }
        return;
      }

      var branchButton = event.target.closest("[data-branch]");
      if(branchButton && root.contains(branchButton)){
        var branchParts = (branchButton.getAttribute("data-branch") || "").split(":");
        if(branchParts.length === 2){
          toggleBranch(branchParts[0], Number(branchParts[1]));
        }
        return;
      }

      var targetButton = event.target.closest("[data-target]");
      if(targetButton && root.contains(targetButton)){
        handleActionTarget(targetButton.getAttribute("data-target"));
        return;
      }

      var interruptButton = event.target.closest("[data-interrupt]");
      if(interruptButton && root.contains(interruptButton)){
        selectInterrupt(interruptButton.getAttribute("data-interrupt"));
        return;
      }

      var dockButton = event.target.closest("[data-dock-view]");
      if(dockButton && root.contains(dockButton)){
        setDockView(dockButton.getAttribute("data-dock-view"));
      }
    });

    root.addEventListener("keydown", function(event){
      if(event.key !== "Enter" && event.key !== " ") return;
      var nodeHead = event.target.closest("[data-node-head]");
      if(!nodeHead || !root.contains(nodeHead)) return;
      event.preventDefault();
      var parts = (nodeHead.getAttribute("data-node-head") || "").split("|");
      if(parts.length === 2){
        setOpenNode(parts[0], parts[1]);
      }
    });
  }

  function renderBoot(title, copy){
    root.innerHTML = '' +
      '<div class="dsj-boot">' +
        '<div class="dsj-brand">Discovery Studio</div>' +
        '<div class="dsj-boot-title">' + esc(title) + '</div>' +
        '<div class="dsj-boot-copy">' + esc(copy) + '</div>' +
      '</div>';
  }

  function render(){
    if(!runtime || !runtime.frameworks || !registry.length){
      renderBoot("Discovery runtime missing.", "The room cannot boot until DISCOVERY_SEGMENT_RUNTIME is loaded.");
      return;
    }
    if(!state.frameworkId || !getFramework(state.frameworkId)){
      state.frameworkId = getInitialFrameworkId();
    }
    if(!state.frameworkId || !getFramework(state.frameworkId)){
      renderBoot("No discovery frameworks are available.", "The runtime loaded, but no framework registry entries are usable.");
      return;
    }

    var framework = getActiveFramework();
    var context = getRoomContext();
    var openSegmentKey = getOpenSegment(framework);
    ensureFrameworkState(state.frameworkId);
    persist();

    root.innerHTML =
      renderTopbar(framework, context, openSegmentKey) +
      renderSegmentStrip(framework, openSegmentKey) +
      '<div class="dsj-shell">' +
        renderFrameworkRail() +
        renderCenter(framework, openSegmentKey) +
        renderDock(framework, context) +
      '</div>';

    bindEvents();
  }

  state.frameworkId = state.frameworkId || getInitialFrameworkId();
  render();
})();
