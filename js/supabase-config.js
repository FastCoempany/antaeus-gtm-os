/**
 * Supabase Configuration - Antaeus GTM OS
 */

const SUPABASE_URL = 'https://wjdqmgxwulqxxxnyuzyl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jJNFxW9cMGvv-cuqIxiZ2w_AOBkWZGm';

function bootstrapEnvironmentMode() {
    if (window.__gtmosEnvBootstrapped) {
        return window.gtmEnvironment || { mode: 'prod', isDemo: false };
    }
    window.__gtmosEnvBootstrapped = true;

    var MODE_KEY = 'gtmos_env_mode';
    var mode = 'prod';
    try {
        var params = new URLSearchParams(window.location.search || '');
        var demoParam = (params.get('demo') || '').toLowerCase();
        if (demoParam === '1' || demoParam === 'true') {
            sessionStorage.setItem(MODE_KEY, 'demo');
        } else if (demoParam === '0' || demoParam === 'false') {
            sessionStorage.setItem(MODE_KEY, 'prod');
        }
        mode = sessionStorage.getItem(MODE_KEY) || 'prod';
    } catch (e) {
        mode = 'prod';
    }

    var isDemo = mode === 'demo';
    window.gtmEnvironment = { mode: isDemo ? 'demo' : 'prod', isDemo: isDemo };

    if (!isDemo || !window.localStorage) return window.gtmEnvironment;

    var prefix = 'gtmos_demo__';
    var storageProto = window.Storage && window.Storage.prototype;
    if (!storageProto || storageProto.__gtmosDemoStoragePatch) return window.gtmEnvironment;
    storageProto.__gtmosDemoStoragePatch = true;

    var rawGetItem = storageProto.getItem;
    var rawSetItem = storageProto.setItem;
    var rawRemoveItem = storageProto.removeItem;
    var rawKey = storageProto.key;
    var rawClear = storageProto.clear;

    function isDemoStorageMode() {
        try { return sessionStorage.getItem(MODE_KEY) === 'demo'; }
        catch (e) { return false; }
    }

    function shouldPatch(storageObj) {
        return storageObj === window.localStorage && isDemoStorageMode();
    }

    function mapKey(key) {
        var next = String(key || '');
        if (next.indexOf('gtmos_') !== 0) return next;
        if (next.indexOf(prefix) === 0) return next;
        return prefix + next;
    }

    storageProto.getItem = function(key) {
        if (shouldPatch(this)) return rawGetItem.call(this, mapKey(key));
        return rawGetItem.call(this, key);
    };

    storageProto.setItem = function(key, value) {
        if (shouldPatch(this)) return rawSetItem.call(this, mapKey(key), value);
        return rawSetItem.call(this, key, value);
    };

    storageProto.removeItem = function(key) {
        if (shouldPatch(this)) return rawRemoveItem.call(this, mapKey(key));
        return rawRemoveItem.call(this, key);
    };

    storageProto.key = function(index) {
        if (!shouldPatch(this)) return rawKey.call(this, index);
        var demoKeys = [];
        for (var i = 0; i < this.length; i++) {
            var storageKey = rawKey.call(this, i);
            if (storageKey && storageKey.indexOf(prefix) === 0) {
                demoKeys.push(storageKey.slice(prefix.length));
            }
        }
        return demoKeys[index] || null;
    };

    storageProto.clear = function() {
        if (!shouldPatch(this)) return rawClear.call(this);
        var toDelete = [];
        for (var i = 0; i < this.length; i++) {
            var storageKey = rawKey.call(this, i);
            if (storageKey && storageKey.indexOf(prefix) === 0) {
                toDelete.push(storageKey);
            }
        }
        toDelete.forEach(function(storageKey) {
            rawRemoveItem.call(window.localStorage, storageKey);
        });
    };

    return window.gtmEnvironment;
}

bootstrapEnvironmentMode();

// Don't redeclare - use the global from CDN
var supabaseClient = null;
var DB_TIMEOUT_MS = 10000;
var DB_TOAST_HIDE_TIMER = null;
var DB_TOAST_THROTTLE_MS = 1500;
var DB_LAST_TOAST_AT = 0;

// Temporary no-auth mode switch:
// - URL: ?noauth=1&noauth_email=you@company.com (or ?offline=1 legacy alias)
// - Disable: ?noauth=0
var AUTH_BYPASS_KEY = 'gtmos_noauth_mode';
var AUTH_BYPASS_EMAIL_KEY = 'gtmos_noauth_email';
var AUTH_BYPASS = false;

function isStoredAuthBypassValue(value) {
    if (value == null) return false;

    var normalized = String(value).trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') return true;

    if (
        (normalized.charAt(0) === '"' && normalized.charAt(normalized.length - 1) === '"') ||
        (normalized.charAt(0) === "'" && normalized.charAt(normalized.length - 1) === "'")
    ) {
        try {
            normalized = String(JSON.parse(normalized)).trim().toLowerCase();
        } catch (e) {}
    }

    return normalized === '1' || normalized === 'true';
}

function isDemoEnvironment() {
    return !!(window.gtmEnvironment && window.gtmEnvironment.isDemo);
}

function authBypassAllowedHere() {
    if (isDemoEnvironment()) return true;
    var path = (window.location.pathname || '').toLowerCase();
    return path === '/demo-seed.html' || path === '/demo.html';
}

function authBypassCanSyncFromQuery() {
    var path = (window.location.pathname || '').toLowerCase();
    return path === '/demo-seed.html' || path === '/demo.html';
}

var OFFLINE_DB_KEY = 'gtmos_offline_db_v1';
var OFFLINE_DEFAULT_STATE = {
    pipeline_settings: {},
    icps: [],
    sequences: [],
    deals: [],
    signal_console_accounts: [],
    discovery_frameworks: [],
    discovery_call_logs: []
};
var PROFILE_CACHE_KEY = 'gtmos_profile_cache';
var WORKSPACE_BOOTSTRAP_KEYS = [
    'gtmos_onboarding',
    'gtmos_product_category',
    'gtmos_outbound_seed',
    'gtmos_qw_inputs',
    'gtmos_playbook',
    PROFILE_CACHE_KEY
];
var ACV_BAND_DEFAULTS = {
    small: { winRate: 25, cycle: 45, coverage: 3.0 },
    mid: { winRate: 20, cycle: 90, coverage: 3.5 },
    enterprise: { winRate: 15, cycle: 180, coverage: 4.5 },
    strategic: { winRate: 12, cycle: 240, coverage: 5.0 }
};
var STAGE_QW_DEFAULTS = {
    'pre-seed': { winRate: 15, discoToOpp: 30, showRate: 70, emailBook: 1.5, dialBook: 1.8 },
    'seed': { winRate: 18, discoToOpp: 35, showRate: 75, emailBook: 1.8, dialBook: 2.0 },
    'series-a': { winRate: 22, discoToOpp: 40, showRate: 80, emailBook: 2.0, dialBook: 2.3 },
    'series-b': { winRate: 25, discoToOpp: 45, showRate: 85, emailBook: 2.5, dialBook: 2.8 },
    'series-b-plus': { winRate: 25, discoToOpp: 45, showRate: 85, emailBook: 2.5, dialBook: 2.8 }
};

function cloneValue(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return value;
    }
}

function readStorageJson(key, fallback) {
    try {
        var raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function writeStorageJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        return false;
    }
}

function removeStorageKeys(keys) {
    try {
        (keys || []).forEach(function(key) {
            localStorage.removeItem(key);
        });
    } catch (e) {}
}

function readStorageText(key, fallback) {
    try {
        var raw = localStorage.getItem(key);
        if (raw == null || raw === '') return fallback;

        try {
            var parsed = JSON.parse(raw);
            if (typeof parsed === 'string') {
                return cleanText(parsed) || fallback;
            }
        } catch (e) {}

        return cleanText(raw) || fallback;
    } catch (e) {
        return fallback;
    }
}

function cleanText(value) {
    if (value == null) return null;
    var next = String(value).trim();
    return next ? next : null;
}

function numberOrNull(value) {
    if (value == null || value === '') return null;
    var next = Number(value);
    return Number.isFinite(next) && next > 0 ? next : null;
}

function normalizeStageKey(stage) {
    var next = cleanText(stage);
    return next ? next.toLowerCase() : null;
}

function getStageDefaults(stage) {
    return STAGE_QW_DEFAULTS[normalizeStageKey(stage)] || {};
}

function getAcvBand(acvValue) {
    var acv = numberOrNull(acvValue) || 0;
    if (acv >= 200000) return 'strategic';
    if (acv >= 75000) return 'enterprise';
    if (acv >= 30000) return 'mid';
    return 'small';
}

function getCachedWorkspaceProfileId() {
    var cached = readStorageJson(PROFILE_CACHE_KEY, null);
    if (!cached || !cached.id) return null;
    return String(cached.id);
}

function buildProfileCache(profile) {
    if (!profile) return null;
    return {
        id: profile.id || null,
        email: cleanText(profile.email),
        full_name: cleanText(profile.full_name),
        role: cleanText(profile.role),
        company_name: cleanText(profile.company_name),
        startup_stage: cleanText(profile.startup_stage),
        buyer_persona: cleanText(profile.buyer_persona),
        product_category: cleanText(profile.product_category),
        onboarding_completed: profile.onboarding_completed === true,
        onboarding_completed_at: profile.onboarding_completed_at || null,
        quota: numberOrNull(profile.quota),
        average_deal_size: numberOrNull(profile.average_deal_size),
        acv_band: cleanText(profile.acv_band)
    };
}

function buildOnboardingAnswersFromProfile(profile) {
    var answers = {};

    if (profile && profile.onboarding_answers && typeof profile.onboarding_answers === 'object') {
        answers = cloneValue(profile.onboarding_answers);
    }

    if (cleanText(profile && profile.role)) answers.role = cleanText(profile.role);
    if (cleanText(profile && profile.company_name)) answers.companyName = cleanText(profile.company_name);
    if (cleanText(profile && profile.startup_stage)) answers.stage = cleanText(profile.startup_stage);
    if (cleanText(profile && profile.buyer_persona)) answers.buyerPersona = cleanText(profile.buyer_persona);
    if (cleanText(profile && profile.product_category)) answers.productCategory = cleanText(profile.product_category);
    if (numberOrNull(profile && profile.quota)) answers.quota = numberOrNull(profile.quota);
    if (numberOrNull(profile && profile.average_deal_size)) answers.acv = numberOrNull(profile.average_deal_size);
    if (!cleanText(answers.role)) answers.role = 'founder';

    return answers;
}

function buildOnboardingStateFromProfile(profile) {
    if (!profile) return null;

    var answers = buildOnboardingAnswersFromProfile(profile);
    return {
        completed: profile.onboarding_completed === true,
        completedAt: profile.onboarding_completed_at || null,
        persona: answers.role || 'founder',
        answers: answers,
        source: 'supabase-profile',
        syncedAt: new Date().toISOString()
    };
}

function buildQwInputsFromProfile(profile) {
    if (!profile) return null;

    var existing = readStorageJson('gtmos_qw_inputs', {});
    var defaults = getStageDefaults(profile.startup_stage);
    var quota = numberOrNull(profile.quota);
    var acv = numberOrNull(profile.average_deal_size);
    var next = Object.assign({}, existing);

    if (quota) next.quota = quota;
    if (acv) next.acv = acv;
    if (defaults.winRate) next.win = defaults.winRate;
    if (defaults.discoToOpp) next.m2o = defaults.discoToOpp;
    if (defaults.showRate) next.show = defaults.showRate;
    if (defaults.emailBook) next.emailBook = defaults.emailBook;
    if (defaults.dialBook) next.dialBook = defaults.dialBook;
    if (cleanText(profile.startup_stage)) next.stage = cleanText(profile.startup_stage);

    return Object.keys(next).length ? next : null;
}

function buildOutboundSeedFromProfile(profile) {
    if (!profile) return null;

    var existing = readStorageJson('gtmos_outbound_seed', {});
    var quota = numberOrNull(profile.quota);
    var acv = numberOrNull(profile.average_deal_size);
    var band = cleanText(profile.acv_band) || getAcvBand(acv);
    var defaults = ACV_BAND_DEFAULTS[band] || ACV_BAND_DEFAULTS.mid;

    return Object.assign({}, existing, {
        annual_quota: quota || existing.annual_quota || 0,
        avg_deal_size: acv || existing.avg_deal_size || 50000,
        win_rate: defaults.winRate,
        touch_to_meeting: existing.touch_to_meeting != null ? existing.touch_to_meeting : 0.7,
        show_rate: existing.show_rate != null ? existing.show_rate : 80,
        cycle_days: defaults.cycle,
        coverage_target: defaults.coverage,
        acv_band: band,
        updated_at: new Date().toISOString()
    });
}

function buildPlaybookFromProfile(profile) {
    if (!profile) return null;

    var existing = readStorageJson('gtmos_playbook', {});
    var answers = buildOnboardingAnswersFromProfile(profile);
    var next = Object.assign({}, existing);

    if (answers.companyName) next.company = answers.companyName;
    if (answers.stage) next.stage = answers.stage;
    if (answers.acv) next.acv = String(answers.acv);

    if (!next.fields || typeof next.fields !== 'object') next.fields = {};
    if (!next.checks || typeof next.checks !== 'object') next.checks = {};
    if (answers.idealCustomer) next.fields['market-who'] = answers.idealCustomer;
    next.timestamp = new Date().toISOString();

    return next;
}

function syncWorkspaceCacheFromProfile(profile) {
    if (!profile || isDemoEnvironment()) return null;

    var cachedId = getCachedWorkspaceProfileId();
    if (cachedId && profile.id && cachedId !== String(profile.id)) {
        removeStorageKeys(WORKSPACE_BOOTSTRAP_KEYS);
    }

    writeStorageJson(PROFILE_CACHE_KEY, buildProfileCache(profile));

    var onboardingState = buildOnboardingStateFromProfile(profile);
    if (onboardingState) writeStorageJson('gtmos_onboarding', onboardingState);

    var answers = onboardingState ? onboardingState.answers || {} : {};
    if (answers.productCategory) {
        try { localStorage.setItem('gtmos_product_category', JSON.stringify(answers.productCategory)); }
        catch (e) {}
    }

    var qwInputs = buildQwInputsFromProfile(profile);
    if (qwInputs) writeStorageJson('gtmos_qw_inputs', qwInputs);

    var outboundSeed = buildOutboundSeedFromProfile(profile);
    if (outboundSeed) writeStorageJson('gtmos_outbound_seed', outboundSeed);

    var playbook = buildPlaybookFromProfile(profile);
    if (playbook) writeStorageJson('gtmos_playbook', playbook);

    window.__gtmosCurrentProfile = profile;
    return onboardingState;
}

function clearWorkspaceBootstrapCache() {
    removeStorageKeys(WORKSPACE_BOOTSTRAP_KEYS);
    window.__gtmosCurrentProfile = null;
    window.__gtmosWorkspaceBootstrap = null;
    window.__gtmosWorkspaceBootstrapPromise = null;
}

function buildProfileSeedFromUser(user) {
    var meta = (user && user.user_metadata) || {};
    return {
        id: user && user.id ? user.id : null,
        email: cleanText(user && user.email),
        full_name: cleanText(meta.full_name || meta.name),
        role: cleanText(meta.role),
        onboarding_answers: {}
    };
}

function buildLocalWorkspaceFallback(session) {
    var profile = readStorageJson(PROFILE_CACHE_KEY, null);
    if (profile && session && session.user && profile.id && String(profile.id) !== String(session.user.id)) {
        profile = null;
    }

    var onboarding = readStorageJson('gtmos_onboarding', null);
    var completed = false;

    if (profile && profile.onboarding_completed === true) {
        completed = true;
    } else if (!session || !session.user) {
        completed = !!(onboarding && onboarding.completed === true);
    }

    return {
        user: session && session.user ? session.user : null,
        profile: profile,
        onboarding: onboarding,
        onboardingCompleted: completed,
        route: completed ? '/app/dashboard/' : '/app/onboarding/',
        source: 'local-cache'
    };
}

function setAuthBypass(enabled, email) {
    try {
        if (enabled) {
            localStorage.setItem(AUTH_BYPASS_KEY, '1');
            if (email) localStorage.setItem(AUTH_BYPASS_EMAIL_KEY, String(email).trim().toLowerCase());
        } else {
            localStorage.removeItem(AUTH_BYPASS_KEY);
            localStorage.removeItem(AUTH_BYPASS_EMAIL_KEY);
        }
    } catch (e) {}
    AUTH_BYPASS = !!enabled;
}

function syncAuthBypassFromQuery() {
    if (!authBypassCanSyncFromQuery()) return;
    try {
        var query = new URLSearchParams(window.location.search || '');
        var noauth = query.get('noauth');
        var offline = query.get('offline');
        var email = query.get('noauth_email') || query.get('offline_email');

        if (noauth === '1' || noauth === 'true' || offline === '1' || offline === 'true') {
            setAuthBypass(true, email || null);
        }
        if (noauth === '0' || noauth === 'false' || offline === '0' || offline === 'false') {
            setAuthBypass(false);
        }
    } catch (e) {}
}

function initAuthBypassFlag() {
    if (!authBypassAllowedHere()) {
        setAuthBypass(false);
        AUTH_BYPASS = false;
        return;
    }

    try {
        AUTH_BYPASS = isStoredAuthBypassValue(localStorage.getItem(AUTH_BYPASS_KEY));
    } catch (e) {
        AUTH_BYPASS = false;
    }

    syncAuthBypassFromQuery();
}

function isAuthBypassEnabled() {
    return AUTH_BYPASS;
}

function getBypassEmail(fallbackEmail) {
    if (fallbackEmail) return String(fallbackEmail).trim().toLowerCase();
    try {
        var stored = localStorage.getItem(AUTH_BYPASS_EMAIL_KEY);
        if (stored) return String(stored).trim().toLowerCase();
    } catch (e) {}
    return 'noauth@antaeus.local';
}

function getMockUser(email) {
    var resolvedEmail = getBypassEmail(email);
    var safeId = resolvedEmail.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'noauth_user';
    return {
        id: 'noauth_' + safeId,
        email: resolvedEmail,
        user_metadata: { full_name: 'No-Auth User' }
    };
}

function getMockSession(email) {
    var nowSec = Math.floor(Date.now() / 1000);
    return {
        access_token: 'noauth-token',
        token_type: 'bearer',
        expires_in: 60 * 60 * 24,
        expires_at: nowSec + (60 * 60 * 24),
        refresh_token: 'noauth-refresh',
        user: getMockUser(email)
    };
}

function ensureOfflineDbShape(state) {
    var next = cloneValue(OFFLINE_DEFAULT_STATE);
    if (!state || typeof state !== 'object') return next;

    if (state.pipeline_settings && typeof state.pipeline_settings === 'object') {
        next.pipeline_settings = state.pipeline_settings;
    }

    ['icps', 'sequences', 'deals', 'signal_console_accounts', 'discovery_frameworks', 'discovery_call_logs'].forEach(function(tableName) {
        if (Array.isArray(state[tableName])) next[tableName] = state[tableName];
    });

    return next;
}

function readOfflineDb() {
    try {
        var raw = localStorage.getItem(OFFLINE_DB_KEY);
        if (!raw) return cloneValue(OFFLINE_DEFAULT_STATE);
        return ensureOfflineDbShape(JSON.parse(raw));
    } catch (e) {
        return cloneValue(OFFLINE_DEFAULT_STATE);
    }
}

function writeOfflineDb(state) {
    try {
        localStorage.setItem(OFFLINE_DB_KEY, JSON.stringify(ensureOfflineDbShape(state)));
    } catch (e) {}
}

function offlineNowIso() {
    return new Date().toISOString();
}

function createOfflineId(prefix) {
    var rand = Math.random().toString(36).slice(2, 10);
    return prefix + '_' + Date.now() + '_' + rand;
}

function sortRows(rows, field, ascending) {
    rows.sort(function(a, b) {
        var av = (a && a[field]) ? String(a[field]) : '';
        var bv = (b && b[field]) ? String(b[field]) : '';
        if (av === bv) return 0;
        if (ascending) return av > bv ? 1 : -1;
        return av > bv ? -1 : 1;
    });
}

function offlineTableList(tableName, userId, orderField, ascending) {
    var state = readOfflineDb();
    var rows = (state[tableName] || []).filter(function(row) { return row.user_id === userId; });
    sortRows(rows, orderField || 'created_at', !!ascending);
    return { data: cloneValue(rows), error: null };
}

function offlineTableGet(tableName, id) {
    var state = readOfflineDb();
    var row = (state[tableName] || []).find(function(item) { return item.id === id; }) || null;
    return { data: cloneValue(row), error: null };
}

function offlineTableCreate(tableName, userId, payload) {
    var state = readOfflineDb();
    var nowIso = offlineNowIso();
    var row = Object.assign(
        {
            id: createOfflineId(tableName),
            user_id: userId,
            created_at: nowIso,
            updated_at: nowIso
        },
        payload || {}
    );
    state[tableName] = state[tableName] || [];
    state[tableName].push(row);
    writeOfflineDb(state);
    return { data: cloneValue(row), error: null };
}

function offlineTableUpdate(tableName, id, payload) {
    var state = readOfflineDb();
    state[tableName] = state[tableName] || [];
    var idx = state[tableName].findIndex(function(item) { return item.id === id; });
    if (idx < 0) return { data: null, error: { message: 'Record not found' } };

    var existing = state[tableName][idx];
    var updated = Object.assign({}, existing, payload || {}, { updated_at: offlineNowIso() });
    state[tableName][idx] = updated;
    writeOfflineDb(state);
    return { data: cloneValue(updated), error: null };
}

function offlineTableDelete(tableName, id) {
    var state = readOfflineDb();
    state[tableName] = state[tableName] || [];
    state[tableName] = state[tableName].filter(function(item) { return item.id !== id; });
    writeOfflineDb(state);
    return { data: null, error: null };
}

var PROFILE_WRITE_FIELDS = [
    'email',
    'full_name',
    'role',
    'company_name',
    'startup_stage',
    'buyer_persona',
    'product_category',
    'quota',
    'average_deal_size',
    'acv_band',
    'onboarding_completed',
    'onboarding_completed_at',
    'onboarding_answers'
];

function pickProfileFields(source) {
    var next = {};
    PROFILE_WRITE_FIELDS.forEach(function(field) {
        if (source && Object.prototype.hasOwnProperty.call(source, field)) {
            next[field] = source[field];
        }
    });
    return next;
}

function setMappedAnswer(target, key, value) {
    if (!target) return;
    if (value == null || value === '') {
        delete target[key];
        return;
    }
    target[key] = value;
}

function mergeProfileForWrite(existingProfile, patch, options) {
    options = options || {};

    var merged = pickProfileFields(existingProfile || {});
    var patchFields = pickProfileFields(patch || {});
    var answers = options.replaceOnboardingAnswers ? {} : cloneValue((existingProfile && existingProfile.onboarding_answers) || {});

    Object.keys(patchFields).forEach(function(field) {
        if (field === 'onboarding_answers') return;
        merged[field] = patchFields[field];
    });

    if (patchFields.onboarding_answers && typeof patchFields.onboarding_answers === 'object') {
        answers = Object.assign(answers, cloneValue(patchFields.onboarding_answers));
    }

    if (Object.prototype.hasOwnProperty.call(patchFields, 'role')) setMappedAnswer(answers, 'role', patchFields.role);
    if (Object.prototype.hasOwnProperty.call(patchFields, 'company_name')) setMappedAnswer(answers, 'companyName', patchFields.company_name);
    if (Object.prototype.hasOwnProperty.call(patchFields, 'startup_stage')) setMappedAnswer(answers, 'stage', patchFields.startup_stage);
    if (Object.prototype.hasOwnProperty.call(patchFields, 'buyer_persona')) setMappedAnswer(answers, 'buyerPersona', patchFields.buyer_persona);
    if (Object.prototype.hasOwnProperty.call(patchFields, 'product_category')) setMappedAnswer(answers, 'productCategory', patchFields.product_category);
    if (Object.prototype.hasOwnProperty.call(patchFields, 'quota')) setMappedAnswer(answers, 'quota', patchFields.quota);
    if (Object.prototype.hasOwnProperty.call(patchFields, 'average_deal_size')) setMappedAnswer(answers, 'acv', patchFields.average_deal_size);

    merged.onboarding_answers = answers;
    return merged;
}

function profilePayloadChanged(existingProfile, nextProfile) {
    return JSON.stringify(pickProfileFields(existingProfile || {})) !== JSON.stringify(pickProfileFields(nextProfile || {}));
}

function buildProfilePatchFromOnboardingState(onboardingState) {
    var answers = cloneValue((onboardingState && onboardingState.answers) || {});
    var quota = numberOrNull(answers.quota);
    var acv = numberOrNull(answers.acv);
    var localSeed = readStorageJson('gtmos_outbound_seed', {});
    var productCategory = cleanText(answers.productCategory) || cleanText(readStorageJson('gtmos_product_category', null));

    return {
        role: cleanText(answers.role || (onboardingState && onboardingState.persona)),
        company_name: cleanText(answers.companyName),
        startup_stage: cleanText(answers.stage),
        buyer_persona: cleanText(answers.buyerPersona),
        product_category: productCategory,
        quota: quota,
        average_deal_size: acv,
        acv_band: cleanText(localSeed.acv_band) || (acv ? getAcvBand(acv) : null),
        onboarding_completed: onboardingState && onboardingState.completed === true,
        onboarding_completed_at: onboardingState && onboardingState.completed === true
            ? (onboardingState.completedAt || new Date().toISOString())
            : null,
        onboarding_answers: answers
    };
}

function buildProfilePatchFromLocalState(existingProfile) {
    existingProfile = existingProfile || {};

    var patch = {};
    var onboarding = readStorageJson('gtmos_onboarding', null);
    if (onboarding && typeof onboarding === 'object') {
        var fromOnboarding = buildProfilePatchFromOnboardingState(onboarding);

        if (!existingProfile.id) {
            patch = mergeProfileForWrite({}, fromOnboarding, { replaceOnboardingAnswers: true });
        } else {
            if (!cleanText(existingProfile.role) && cleanText(fromOnboarding.role)) patch.role = fromOnboarding.role;
            if (!cleanText(existingProfile.company_name) && cleanText(fromOnboarding.company_name)) patch.company_name = fromOnboarding.company_name;
            if (!cleanText(existingProfile.startup_stage) && cleanText(fromOnboarding.startup_stage)) patch.startup_stage = fromOnboarding.startup_stage;
            if (!cleanText(existingProfile.buyer_persona) && cleanText(fromOnboarding.buyer_persona)) patch.buyer_persona = fromOnboarding.buyer_persona;
            if (!cleanText(existingProfile.product_category) && cleanText(fromOnboarding.product_category)) patch.product_category = fromOnboarding.product_category;
            if (!numberOrNull(existingProfile.quota) && numberOrNull(fromOnboarding.quota)) patch.quota = fromOnboarding.quota;
            if (!numberOrNull(existingProfile.average_deal_size) && numberOrNull(fromOnboarding.average_deal_size)) patch.average_deal_size = fromOnboarding.average_deal_size;
            if (!cleanText(existingProfile.acv_band) && cleanText(fromOnboarding.acv_band)) patch.acv_band = fromOnboarding.acv_band;
            if ((!existingProfile.onboarding_answers || Object.keys(existingProfile.onboarding_answers).length === 0) && fromOnboarding.onboarding_answers) {
                patch.onboarding_answers = cloneValue(fromOnboarding.onboarding_answers);
            }
        }
    }

    var localSeed = readStorageJson('gtmos_outbound_seed', {});
    if (!numberOrNull(existingProfile.quota) && numberOrNull(localSeed.annual_quota)) patch.quota = numberOrNull(localSeed.annual_quota);
    if (!numberOrNull(existingProfile.average_deal_size) && numberOrNull(localSeed.avg_deal_size)) patch.average_deal_size = numberOrNull(localSeed.avg_deal_size);
    if (!cleanText(existingProfile.acv_band) && cleanText(localSeed.acv_band)) patch.acv_band = cleanText(localSeed.acv_band);

    var localCategory = cleanText(readStorageJson('gtmos_product_category', null));
    if (!cleanText(existingProfile.product_category) && localCategory) patch.product_category = localCategory;

    return patch;
}

function buildMockProfileFromLocalState(user) {
    var seed = buildProfileSeedFromUser(user || getMockUser());
    var localPatch = buildProfilePatchFromLocalState({});
    return mergeProfileForWrite(seed, localPatch, { replaceOnboardingAnswers: true });
}

async function fetchProfileRow(userId) {
    if (AUTH_BYPASS) {
        return { data: buildMockProfileFromLocalState({ id: userId, email: getBypassEmail() }), error: null };
    }
    var client = requireSupabaseClient();
    return await client.from('profiles').select('*').eq('id', userId).maybeSingle();
}

async function upsertProfileRow(userId, payload) {
    if (AUTH_BYPASS) {
        return { data: mergeProfileForWrite(buildMockProfileFromLocalState({ id: userId, email: getBypassEmail() }), payload), error: null };
    }
    var client = requireSupabaseClient();
    var writePayload = pickProfileFields(payload || {});
    writePayload.id = userId;
    writePayload.updated_at = new Date().toISOString();
    return await client.from('profiles').upsert(writePayload, { onConflict: 'id' }).select().single();
}

async function ensureProfileRow(user) {
    if (!user || !user.id) {
        return { data: null, error: new Error('Auth user missing') };
    }

    if (AUTH_BYPASS) {
        return { data: buildMockProfileFromLocalState(user), error: null };
    }

    var current = await fetchProfileRow(user.id);
    if (current.error) return current;

    var existing = current.data || null;
    var authSeed = buildProfileSeedFromUser(user);
    var nextPayload = existing ? mergeProfileForWrite(existing, authSeed) : mergeProfileForWrite({}, authSeed, { replaceOnboardingAnswers: true });
    nextPayload = mergeProfileForWrite(nextPayload, buildProfilePatchFromLocalState(existing || {}), {
        replaceOnboardingAnswers: !existing
    });

    if (!existing || profilePayloadChanged(existing, nextPayload)) {
        return await upsertProfileRow(user.id, nextPayload);
    }

    return { data: existing, error: null };
}

async function resolveCurrentUser(sessionOverride) {
    if (sessionOverride && sessionOverride.user) return sessionOverride.user;
    if (AUTH_BYPASS) return getMockUser();
    return await auth.getUser();
}

async function ensureUserWorkspace(sessionOverride, options) {
    options = options || {};

    if (AUTH_BYPASS || isDemoEnvironment()) {
        var demoWorkspace = buildLocalWorkspaceFallback(sessionOverride);
        window.__gtmosWorkspaceBootstrap = demoWorkspace;
        return demoWorkspace;
    }

    if (options.force) {
        window.__gtmosWorkspaceBootstrapPromise = null;
    }

    if (window.__gtmosWorkspaceBootstrapPromise) {
        return await window.__gtmosWorkspaceBootstrapPromise;
    }

    window.__gtmosWorkspaceBootstrapPromise = (async function() {
        try {
            var user = await resolveCurrentUser(sessionOverride);
            if (!user) return buildLocalWorkspaceFallback(sessionOverride);

            var profileResult = await ensureProfileRow(user);
            if (profileResult.error) throw profileResult.error;

            var profile = profileResult.data;
            var onboarding = syncWorkspaceCacheFromProfile(profile);
            var workspace = {
                user: user,
                profile: profile,
                onboarding: onboarding,
                onboardingCompleted: !!(profile && profile.onboarding_completed === true),
                route: profile && profile.onboarding_completed === true ? '/app/dashboard/' : '/app/onboarding/',
                source: 'supabase-profile'
            };

            window.__gtmosWorkspaceBootstrap = workspace;
            return workspace;
        } catch (e) {
            console.error('Workspace bootstrap failed:', e);
            var fallback = buildLocalWorkspaceFallback(sessionOverride);
            window.__gtmosWorkspaceBootstrap = fallback;
            return fallback;
        }
    })();

    return await window.__gtmosWorkspaceBootstrapPromise;
}

async function resolvePostAuthRoute(sessionOverride, options) {
    var workspace = await ensureUserWorkspace(sessionOverride, options);
    return (workspace && workspace.route) ? workspace.route : '/app/onboarding/';
}

async function updateWorkspaceProfile(fields, sessionOverride, options) {
    options = options || {};

    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: buildLocalWorkspaceFallback(sessionOverride).profile, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) {
        return { data: null, error: new Error('Auth session missing') };
    }

    var profileResult = await ensureProfileRow(user);
    if (profileResult.error) return profileResult;

    var payload = mergeProfileForWrite(
        mergeProfileForWrite(profileResult.data || {}, buildProfileSeedFromUser(user)),
        fields,
        options
    );

    var updated = await upsertProfileRow(user.id, payload);
    if (!updated.error && updated.data) {
        syncWorkspaceCacheFromProfile(updated.data);
        window.__gtmosWorkspaceBootstrap = null;
        window.__gtmosWorkspaceBootstrapPromise = null;
    }

    return updated;
}

async function saveUserOnboardingState(onboardingState, sessionOverride) {
    var patch = buildProfilePatchFromOnboardingState(onboardingState);
    return await updateWorkspaceProfile(patch, sessionOverride, { replaceOnboardingAnswers: true });
}

async function resetUserOnboardingState(sessionOverride) {
    if (AUTH_BYPASS || isDemoEnvironment()) {
        removeStorageKeys(['gtmos_onboarding', 'gtmos_product_category', PROFILE_CACHE_KEY, 'gtmos_discovery_pledged']);
        return { data: buildLocalWorkspaceFallback(sessionOverride), error: null };
    }

    var resetPatch = {
        company_name: null,
        startup_stage: null,
        buyer_persona: null,
        product_category: null,
        quota: null,
        average_deal_size: null,
        acv_band: null,
        onboarding_completed: false,
        onboarding_completed_at: null,
        onboarding_answers: {}
    };

    var result = await updateWorkspaceProfile(resetPatch, sessionOverride, { replaceOnboardingAnswers: true });
    removeStorageKeys(['gtmos_onboarding', 'gtmos_product_category', PROFILE_CACHE_KEY, 'gtmos_discovery_pledged']);

    if (!result.error && result.data) {
        syncWorkspaceCacheFromProfile(result.data);
    }

    return result;
}

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function isUuidLike(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function sortByRecent(items, fields) {
    return toArray(items).sort(function(a, b) {
        var av = 0;
        var bv = 0;

        (fields || []).forEach(function(field) {
            if (!av) {
                var at = new Date((a && a[field]) || 0).getTime();
                av = isNaN(at) ? 0 : at;
            }
            if (!bv) {
                var bt = new Date((b && b[field]) || 0).getTime();
                bv = isNaN(bt) ? 0 : bt;
            }
        });

        return bv - av;
    });
}

function localIcpName(icp) {
    var industry = cleanText(icp && icp.industry);
    var buyer = cleanText(icp && icp.buyer);
    if (buyer && industry) return buyer + ' @ ' + industry;
    return buyer || industry || cleanText(icp && icp.statement) || 'Untitled';
}

function normalizeIcpItem(icp) {
    var next = cloneValue(icp || {});
    if (!next || typeof next !== 'object') next = {};
    next.worked = next.worked === true;
    if (!next.timestamp) next.timestamp = next.updated_at || next.created_at || new Date().toISOString();
    if (next.activeAccounts != null) next.activeAccounts = Number(next.activeAccounts) || 0;
    return next;
}

function readLocalIcpAnalyticsState() {
    var raw = readStorageJson('gtmos_icp_analytics', { icps: [], totalWorked: 0 });
    var items = toArray(raw && raw.icps).map(normalizeIcpItem);
    return {
        icps: items,
        totalWorked: items.filter(function(item) { return item.worked; }).length,
        lastSyncedAt: raw && raw.lastSyncedAt ? raw.lastSyncedAt : null,
        source: raw && raw.source ? raw.source : 'local-cache'
    };
}

function writeLocalIcpAnalyticsState(state) {
    var next = {
        icps: toArray(state && state.icps).map(normalizeIcpItem),
        totalWorked: toArray(state && state.icps).filter(function(item) { return item && item.worked === true; }).length,
        lastSyncedAt: state && state.lastSyncedAt ? state.lastSyncedAt : new Date().toISOString(),
        source: state && state.source ? state.source : 'supabase'
    };
    writeStorageJson('gtmos_icp_analytics', next);
    return next;
}

function mapIcpRowToItem(row) {
    var item = cloneValue((row && row.data && typeof row.data === 'object') ? row.data : row || {});
    if (!item || typeof item !== 'object') item = {};

    if (row && row.id && !item.id) item.id = row.id;
    if (row && row.created_at && !item.created_at) item.created_at = row.created_at;
    if (row && row.updated_at) item.updated_at = row.updated_at;
    if (row && row.summary && !item.statement) item.statement = row.summary;
    if (row && row.name && !item.name) item.name = row.name;
    if (row && row.worked != null) item.worked = row.worked === true;

    return normalizeIcpItem(item);
}

function buildIcpAnalyticsStateFromRows(rows) {
    var items = sortByRecent(toArray(rows).map(mapIcpRowToItem), ['timestamp', 'updated_at', 'created_at']);
    return writeLocalIcpAnalyticsState({
        icps: items,
        lastSyncedAt: new Date().toISOString(),
        source: 'supabase'
    });
}

function serializeIcpRow(icp) {
    var item = normalizeIcpItem(icp);
    var payload = {
        name: localIcpName(item),
        worked: item.worked === true,
        summary: cleanText(item.statement),
        data: cloneValue(item),
        created_at: item.created_at || item.timestamp || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    if (item.id && isUuidLike(item.id)) payload.id = item.id;
    return payload;
}

async function replaceCloudIcpsFromLocalState(state, sessionOverride) {
    var localState = state || readLocalIcpAnalyticsState();
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: writeLocalIcpAnalyticsState(localState), error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localState, error: new Error('Auth session missing') };

    var current = await db.icps.list(user.id);
    if (current.error) return { data: localState, error: current.error };

    var existingRows = toArray(current.data);
    var existingIds = {};
    existingRows.forEach(function(row) {
        if (row && row.id) existingIds[String(row.id)] = true;
    });

    var keptIds = {};
    for (var i = 0; i < localState.icps.length; i++) {
        var item = normalizeIcpItem(localState.icps[i]);
        var payload = serializeIcpRow(item);
        var result = (item.id && existingIds[String(item.id)])
            ? await db.icps.update(item.id, payload)
            : await db.icps.create(user.id, payload);
        if (result.error) return { data: localState, error: result.error };
        if (result.data && result.data.id) keptIds[String(result.data.id)] = true;
    }

    for (var rowIndex = 0; rowIndex < existingRows.length; rowIndex++) {
        var row = existingRows[rowIndex];
        if (row && row.id && !keptIds[String(row.id)]) {
            var deleted = await db.icps.delete(row.id);
            if (deleted.error) return { data: localState, error: deleted.error };
        }
    }

    return await loadIcpAnalyticsFromCloud(sessionOverride, { skipBootstrap: true });
}

async function loadIcpAnalyticsFromCloud(sessionOverride, options) {
    options = options || {};

    var localState = readLocalIcpAnalyticsState();
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localState, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localState, error: new Error('Auth session missing') };

    var result = await db.icps.list(user.id);
    if (result.error) return { data: localState, error: result.error };

    var rows = toArray(result.data);
    if (!rows.length && localState.icps.length && !options.skipBootstrap) {
        return await replaceCloudIcpsFromLocalState(localState, sessionOverride);
    }

    return { data: buildIcpAnalyticsStateFromRows(rows), error: null };
}

async function saveIcpEntryToCloud(icp, sessionOverride) {
    var item = normalizeIcpItem(icp);
    var localState = readLocalIcpAnalyticsState();

    if (AUTH_BYPASS || isDemoEnvironment()) {
        localState.icps.push(item);
        return { data: writeLocalIcpAnalyticsState(localState), error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localState, error: new Error('Auth session missing') };

    var current = await db.icps.list(user.id);
    if (current.error) return { data: localState, error: current.error };

    var existingIds = {};
    toArray(current.data).forEach(function(row) {
        if (row && row.id) existingIds[String(row.id)] = true;
    });

    var payload = serializeIcpRow(item);
    var result = (item.id && existingIds[String(item.id)])
        ? await db.icps.update(item.id, payload)
        : await db.icps.create(user.id, payload);
    if (result.error) return { data: localState, error: result.error };

    return await loadIcpAnalyticsFromCloud(sessionOverride, { skipBootstrap: true });
}

async function deleteIcpEntryFromCloud(id, sessionOverride) {
    var localState = readLocalIcpAnalyticsState();
    if (!id) return { data: localState, error: null };

    if (AUTH_BYPASS || isDemoEnvironment()) {
        localState.icps = localState.icps.filter(function(item) { return String(item.id) !== String(id); });
        return { data: writeLocalIcpAnalyticsState(localState), error: null };
    }

    var result = await db.icps.delete(id);
    if (result.error) return { data: localState, error: result.error };
    return await loadIcpAnalyticsFromCloud(sessionOverride, { skipBootstrap: true });
}

function normalizeDealItem(deal, stageHistoryMap) {
    var next = cloneValue(deal || {});
    if (!next || typeof next !== 'object') next = {};

    if (next.value == null && next.deal_value != null) next.value = Number(next.deal_value) || 0;
    if (next.value == null) next.value = 0;
    if (!next.stage) next.stage = 'prospect';

    var history = next.stageHistory;
    if (!Array.isArray(history) && stageHistoryMap && next.id) {
        history = cloneValue(stageHistoryMap[String(next.id)] || []);
    }
    next.stageHistory = Array.isArray(history) ? history : [];

    if (!next.created_at) next.created_at = next.updated_at || new Date().toISOString();
    if (!next.updated_at) next.updated_at = next.created_at;

    return next;
}

function readLocalDealState() {
    var raw = readStorageJson('gtmos_deal_workspaces', []);
    if (!Array.isArray(raw)) {
        raw = Object.keys(raw || {}).map(function(id) {
            var deal = cloneValue(raw[id] || {});
            if (deal && !deal.id) deal.id = id;
            return deal;
        });
    }

    var stageHistoryMap = readStorageJson('gtmos_deal_stage_history', {});
    return sortByRecent(toArray(raw).map(function(deal) {
        return normalizeDealItem(deal, stageHistoryMap);
    }), ['updated_at', 'created_at']);
}

function writeLocalDealState(deals) {
    var normalized = sortByRecent(toArray(deals).map(function(deal) {
        return normalizeDealItem(deal);
    }), ['updated_at', 'created_at']);

    var history = {};
    normalized.forEach(function(deal) {
        if (deal && deal.id && Array.isArray(deal.stageHistory) && deal.stageHistory.length) {
            history[String(deal.id)] = cloneValue(deal.stageHistory);
        }
    });

    writeStorageJson('gtmos_deal_workspaces', normalized);
    writeStorageJson('gtmos_deal_stage_history', history);
    return normalized;
}

function mapDealRowToItem(row) {
    var deal = cloneValue((row && row.data && typeof row.data === 'object') ? row.data : row || {});
    if (!deal || typeof deal !== 'object') deal = {};

    if (row && row.id && !deal.id) deal.id = row.id;
    if (row && row.account_name && !deal.accountName) deal.accountName = row.account_name;
    if (row && row.stage && !deal.stage) deal.stage = row.stage;
    if (row && row.deal_value != null && deal.value == null) deal.value = Number(row.deal_value) || 0;
    if (row && row.close_date && !deal.closeDate) deal.closeDate = row.close_date;
    if (row && row.next_step_date && !deal.nextStepDate) deal.nextStepDate = row.next_step_date;
    if (row && row.forecast_category && !deal.forecastCategory) deal.forecastCategory = row.forecast_category;
    if (row && row.loss_reason && !deal.lossReason) deal.lossReason = row.loss_reason;
    if (row && row.created_at && !deal.created_at) deal.created_at = row.created_at;
    if (row && row.updated_at) deal.updated_at = row.updated_at;
    if (row && Array.isArray(row.stage_history) && !deal.stageHistory) deal.stageHistory = cloneValue(row.stage_history);

    return normalizeDealItem(deal);
}

function serializeDealRow(deal) {
    var item = normalizeDealItem(deal);
    var payload = {
        account_name: cleanText(item.accountName || item.account_name),
        stage: cleanText(item.stage) || 'prospect',
        deal_value: Number(item.value || item.deal_value || 0) || 0,
        close_date: cleanText(item.closeDate || item.close_date),
        next_step_date: cleanText(item.nextStepDate || item.next_step_date),
        forecast_category: cleanText(item.forecastCategory || item.forecast_category) || 'pipeline',
        loss_reason: cleanText(item.lossReason || item.loss_reason),
        stage_history: Array.isArray(item.stageHistory) ? cloneValue(item.stageHistory) : [],
        data: cloneValue(item),
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    if (item.id && isUuidLike(item.id)) payload.id = item.id;
    return payload;
}

async function replaceCloudDealsFromLocalState(deals, sessionOverride) {
    var localDeals = writeLocalDealState(deals || readLocalDealState());
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localDeals, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localDeals, error: new Error('Auth session missing') };

    var current = await db.deals.list(user.id);
    if (current.error) return { data: localDeals, error: current.error };

    var existingRows = toArray(current.data);
    var existingIds = {};
    existingRows.forEach(function(row) {
        if (row && row.id) existingIds[String(row.id)] = true;
    });

    var keptIds = {};
    for (var i = 0; i < localDeals.length; i++) {
        var item = normalizeDealItem(localDeals[i]);
        var payload = serializeDealRow(item);
        var result = (item.id && existingIds[String(item.id)])
            ? await db.deals.update(item.id, payload)
            : await db.deals.create(user.id, payload);
        if (result.error) return { data: localDeals, error: result.error };
        if (result.data && result.data.id) keptIds[String(result.data.id)] = true;
    }

    for (var rowIndex = 0; rowIndex < existingRows.length; rowIndex++) {
        var row = existingRows[rowIndex];
        if (row && row.id && !keptIds[String(row.id)]) {
            var deleted = await db.deals.delete(row.id);
            if (deleted.error) return { data: localDeals, error: deleted.error };
        }
    }

    return await loadDealsFromCloud(sessionOverride, { skipBootstrap: true });
}

async function loadDealsFromCloud(sessionOverride, options) {
    options = options || {};

    var localDeals = readLocalDealState();
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localDeals, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localDeals, error: new Error('Auth session missing') };

    var result = await db.deals.list(user.id);
    if (result.error) return { data: localDeals, error: result.error };

    var rows = toArray(result.data);
    if (!rows.length && localDeals.length && !options.skipBootstrap) {
        return await replaceCloudDealsFromLocalState(localDeals, sessionOverride);
    }

    var deals = writeLocalDealState(rows.map(mapDealRowToItem));
    return { data: deals, error: null };
}

async function saveDealToCloud(deal, sessionOverride) {
    var item = normalizeDealItem(deal);
    var localDeals = readLocalDealState();

    if (AUTH_BYPASS || isDemoEnvironment()) {
        var nextDeals = localDeals.filter(function(existing) { return String(existing.id) !== String(item.id); });
        nextDeals.push(item);
        return { data: writeLocalDealState(nextDeals), error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localDeals, error: new Error('Auth session missing') };

    var current = await db.deals.list(user.id);
    if (current.error) return { data: localDeals, error: current.error };

    var existingIds = {};
    toArray(current.data).forEach(function(row) {
        if (row && row.id) existingIds[String(row.id)] = true;
    });

    var payload = serializeDealRow(item);
    var result = (item.id && existingIds[String(item.id)])
        ? await db.deals.update(item.id, payload)
        : await db.deals.create(user.id, payload);
    if (result.error) return { data: localDeals, error: result.error };

    return await loadDealsFromCloud(sessionOverride, { skipBootstrap: true });
}

async function deleteDealFromCloud(id, sessionOverride) {
    var localDeals = readLocalDealState();
    if (!id) return { data: localDeals, error: null };

    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: writeLocalDealState(localDeals.filter(function(item) { return String(item.id) !== String(id); })), error: null };
    }

    var result = await db.deals.delete(id);
    if (result.error) return { data: localDeals, error: result.error };
    return await loadDealsFromCloud(sessionOverride, { skipBootstrap: true });
}

function signalConsoleAccountKey(account) {
    var item = cloneValue(account || {});
    var explicit = cleanText(item && item.id);
    if (explicit) return explicit;

    var domain = cleanText(item && item.domain).toLowerCase().replace(/^www\./, '');
    if (domain) return 'domain:' + domain;

    var ticker = cleanText(item && item.ticker).toUpperCase();
    var name = cleanText(item && item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (name && ticker) return 'acct:' + name + ':' + ticker;
    if (name) return 'acct:' + name;
    return 'acct:' + createOfflineId('signal_console');
}

function normalizeSignalConsoleAccount(account) {
    var next = cloneValue(account || {});
    if (!next || typeof next !== 'object') next = {};

    if (!next.id) next.id = signalConsoleAccountKey(next);
    if (!Array.isArray(next.signals)) next.signals = [];
    if (next._heat == null && next.heat != null) next._heat = Number(next.heat) || 0;
    if (!next._lastEnriched && next.lastEnrichedAt) next._lastEnriched = next.lastEnrichedAt;
    if (!next.created_at) next.created_at = next.updated_at || new Date().toISOString();
    if (!next.updated_at) next.updated_at = next.created_at;

    return next;
}

function readLocalSignalConsoleState() {
    var raw = readStorageJson('gtmos_sc_v4', { accounts: [] });
    var accounts = toArray(raw && raw.accounts).map(normalizeSignalConsoleAccount);
    return sortByRecent(accounts, ['_lastEnriched', 'updated_at', 'created_at']);
}

function writeLocalSignalConsoleState(accounts) {
    var normalized = sortByRecent(toArray(accounts).map(normalizeSignalConsoleAccount), ['_lastEnriched', 'updated_at', 'created_at']);
    writeStorageJson('gtmos_sc_v4', { accounts: normalized });
    return normalized;
}

function mapSignalConsoleRowToAccount(row) {
    var account = cloneValue((row && row.data && typeof row.data === 'object') ? row.data : row || {});
    if (!account || typeof account !== 'object') account = {};

    if (!account.id) account.id = cleanText(row && row.account_key) || signalConsoleAccountKey(account);
    if (row && row.id) account.cloud_id = row.id;
    if (row && row.account_name && !account.name) account.name = row.account_name;
    if (row && row.domain && !account.domain) account.domain = row.domain;
    if (row && row.ticker && !account.ticker) account.ticker = row.ticker;
    if (row && row.industry && !account.industry) account.industry = row.industry;
    if (row && row.sector && !account.sector) account.sector = row.sector;
    if (row && row.heat != null) account._heat = Number(row.heat) || 0;
    if (row && row.last_enriched_at) account._lastEnriched = row.last_enriched_at;
    if (row && row.created_at && !account.created_at) account.created_at = row.created_at;
    if (row && row.updated_at) account.updated_at = row.updated_at;

    return normalizeSignalConsoleAccount(account);
}

function serializeSignalConsoleAccountRow(account) {
    var item = normalizeSignalConsoleAccount(account);
    var data = cloneValue(item);
    delete data._researchNotice;
    delete data.cloud_id;
    var payload = {
        account_key: signalConsoleAccountKey(item),
        account_name: cleanText(item.name),
        domain: cleanText(item.domain).toLowerCase().replace(/^www\./, ''),
        ticker: cleanText(item.ticker).toUpperCase(),
        industry: cleanText(item.industry),
        sector: cleanText(item.sector),
        heat: Number(item._heat != null ? item._heat : item.heat || 0) || 0,
        last_enriched_at: item._lastEnriched || item.lastEnrichedAt || null,
        data: data,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    if (item.cloud_id && isUuidLike(item.cloud_id)) payload.id = item.cloud_id;
    return payload;
}

async function replaceCloudSignalConsoleAccountsFromLocalState(accounts, sessionOverride) {
    var localAccounts = writeLocalSignalConsoleState(accounts || readLocalSignalConsoleState());
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localAccounts, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localAccounts, error: new Error('Auth session missing') };

    var current = await db.signalConsoleAccounts.list(user.id);
    if (current.error) return { data: localAccounts, error: current.error };

    var existingRows = toArray(current.data);
    var existingByKey = {};
    existingRows.forEach(function(row) {
        if (row && row.account_key) existingByKey[String(row.account_key)] = row;
    });

    var keptRowIds = {};
    for (var i = 0; i < localAccounts.length; i++) {
        var item = normalizeSignalConsoleAccount(localAccounts[i]);
        var payload = serializeSignalConsoleAccountRow(item);
        var existing = existingByKey[String(payload.account_key)] || null;
        if (existing && existing.id && !payload.id) payload.id = existing.id;

        var result = await db.signalConsoleAccounts.upsert(user.id, payload);
        if (result.error) return { data: localAccounts, error: result.error };
        if (result.data && result.data.id) keptRowIds[String(result.data.id)] = true;
    }

    for (var rowIndex = 0; rowIndex < existingRows.length; rowIndex++) {
        var row = existingRows[rowIndex];
        if (row && row.id && !keptRowIds[String(row.id)]) {
            var deleted = await db.signalConsoleAccounts.delete(row.id);
            if (deleted.error) return { data: localAccounts, error: deleted.error };
        }
    }

    return await loadSignalConsoleAccountsFromCloud(sessionOverride, { skipBootstrap: true });
}

async function loadSignalConsoleAccountsFromCloud(sessionOverride, options) {
    options = options || {};

    var localAccounts = readLocalSignalConsoleState();
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localAccounts, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localAccounts, error: new Error('Auth session missing') };

    var result = await db.signalConsoleAccounts.list(user.id);
    if (result.error) return { data: localAccounts, error: result.error };

    var rows = toArray(result.data);
    if (!rows.length && localAccounts.length && !options.skipBootstrap) {
        return await replaceCloudSignalConsoleAccountsFromLocalState(localAccounts, sessionOverride);
    }

    var accounts = writeLocalSignalConsoleState(rows.map(mapSignalConsoleRowToAccount));
    return { data: accounts, error: null };
}

async function saveSignalConsoleAccountToCloud(account, sessionOverride) {
    var item = normalizeSignalConsoleAccount(account);
    var localAccounts = readLocalSignalConsoleState();
    var existingLocalIndex = localAccounts.findIndex(function(existing) {
        return signalConsoleAccountKey(existing) === signalConsoleAccountKey(item);
    });
    if (existingLocalIndex >= 0) localAccounts[existingLocalIndex] = item;
    else localAccounts.unshift(item);
    writeLocalSignalConsoleState(localAccounts);

    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localAccounts, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localAccounts, error: new Error('Auth session missing') };

    var payload = serializeSignalConsoleAccountRow(item);
    var result = await db.signalConsoleAccounts.upsert(user.id, payload);
    if (result.error) return { data: localAccounts, error: result.error };

    return await loadSignalConsoleAccountsFromCloud(sessionOverride, { skipBootstrap: true });
}

async function deleteSignalConsoleAccountFromCloud(idOrKey, sessionOverride) {
    var localAccounts = readLocalSignalConsoleState();
    if (!idOrKey) return { data: localAccounts, error: null };

    var targetKey = String(idOrKey);
    var nextLocal = localAccounts.filter(function(item) {
        return String(item.id) !== targetKey && signalConsoleAccountKey(item) !== targetKey && String(item.cloud_id || '') !== targetKey;
    });
    writeLocalSignalConsoleState(nextLocal);

    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: nextLocal, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: nextLocal, error: new Error('Auth session missing') };

    var current = await db.signalConsoleAccounts.list(user.id);
    if (current.error) return { data: nextLocal, error: current.error };

    var row = toArray(current.data).find(function(item) {
        return item && (
            String(item.id) === targetKey ||
            String(item.account_key) === targetKey
        );
    });
    if (!row || !row.id) return { data: nextLocal, error: null };

    var result = await db.signalConsoleAccounts.delete(row.id);
    if (result.error) return { data: nextLocal, error: result.error };
    return await loadSignalConsoleAccountsFromCloud(sessionOverride, { skipBootstrap: true });
}

function readLocalDiscoveryState() {
    var stats = Object.assign({ totalCalls: 0, advancedCalls: 0 }, cloneValue(readStorageJson('gtmos_discovery_stats', {})) || {});
    return {
        currentCategory: readStorageText('gtmos_product_category', 'cxai') || 'cxai',
        workedIds: toArray(readStorageJson('gtmos_discovery_worked', [])).map(function(id) { return String(id); }),
        stats: stats,
        agenda: cloneValue(readStorageJson('gtmos_discovery_agenda', null)),
        handoff: cloneValue(readStorageJson('gtmos_call_handoff', null))
    };
}

function writeLocalDiscoveryState(state) {
    var next = Object.assign({
        currentCategory: 'cxai',
        workedIds: [],
        stats: { totalCalls: 0, advancedCalls: 0 },
        agenda: null,
        handoff: null
    }, cloneValue(state || {}));

    localStorage.setItem('gtmos_product_category', JSON.stringify(next.currentCategory || 'cxai'));
    writeStorageJson('gtmos_discovery_worked', toArray(next.workedIds));
    writeStorageJson('gtmos_discovery_stats', Object.assign({ totalCalls: 0, advancedCalls: 0 }, next.stats || {}));

    if (next.agenda) writeStorageJson('gtmos_discovery_agenda', next.agenda);
    else localStorage.removeItem('gtmos_discovery_agenda');

    if (next.handoff) writeStorageJson('gtmos_call_handoff', next.handoff);
    else localStorage.removeItem('gtmos_call_handoff');

    return next;
}

function hasDiscoveryState(state) {
    return !!(
        (state && toArray(state.workedIds).length) ||
        (state && state.stats && (Number(state.stats.totalCalls) || Number(state.stats.advancedCalls))) ||
        (state && state.agenda) ||
        (state && state.handoff)
    );
}

function findDiscoveryStateRow(rows) {
    return toArray(rows).find(function(row) {
        return row && (
            row.framework_key === 'workspace_state' ||
            row.name === 'workspace_state' ||
            (row.data && row.data.workspaceType === 'workspace_state')
        );
    }) || null;
}

function mapDiscoveryStateFromRow(row) {
    var data = cloneValue((row && row.data && typeof row.data === 'object') ? row.data : {});
    return {
        currentCategory: cleanText(data.currentCategory || (row && row.category)) || 'cxai',
        workedIds: toArray(data.workedIds).map(function(id) { return String(id); }),
        stats: Object.assign({ totalCalls: 0, advancedCalls: 0 }, data.stats || {}),
        agenda: data.agenda || null,
        handoff: data.handoff || null
    };
}

async function saveDiscoveryStateToCloud(state, sessionOverride) {
    var next = writeLocalDiscoveryState(state || readLocalDiscoveryState());
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: next, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: next, error: new Error('Auth session missing') };

    var current = await db.discoveryFrameworks.list(user.id);
    if (current.error) return { data: next, error: current.error };

    var existing = findDiscoveryStateRow(current.data);
    var payload = {
        framework_key: 'workspace_state',
        name: 'workspace_state',
        category: next.currentCategory || 'cxai',
        data: Object.assign({}, cloneValue(next), { workspaceType: 'workspace_state' }),
        updated_at: new Date().toISOString()
    };

    var result = existing
        ? await db.discoveryFrameworks.update(existing.id, payload)
        : await db.discoveryFrameworks.create(user.id, payload);
    if (result.error) return { data: next, error: result.error };

    return await loadDiscoveryStateFromCloud(sessionOverride, { skipBootstrap: true });
}

async function loadDiscoveryStateFromCloud(sessionOverride, options) {
    options = options || {};

    var localState = readLocalDiscoveryState();
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localState, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localState, error: new Error('Auth session missing') };

    var frameworkResult = await db.discoveryFrameworks.list(user.id);
    if (frameworkResult.error) return { data: localState, error: frameworkResult.error };

    var logResult = await db.discoveryCallLogs.list(user.id);
    if (logResult.error) return { data: localState, error: logResult.error };

    var stateRow = findDiscoveryStateRow(frameworkResult.data);
    if (!stateRow && hasDiscoveryState(localState) && !options.skipBootstrap) {
        return await saveDiscoveryStateToCloud(localState, sessionOverride);
    }

    var next = stateRow ? mapDiscoveryStateFromRow(stateRow) : localState;
    var logs = sortByRecent(toArray(logResult.data).map(function(row) {
        return cloneValue((row && row.data && typeof row.data === 'object') ? row.data : row || {});
    }), ['timestamp', 'created_at', 'updated_at']);
    if (logs.length && !next.handoff) next.handoff = logs[0];

    writeLocalDiscoveryState(next);
    return { data: next, logs: logs, error: null };
}

async function recordDiscoveryCallLog(entry, sessionOverride) {
    var payload = cloneValue(entry || {});
    payload.timestamp = payload.timestamp || new Date().toISOString();

    if (AUTH_BYPASS || isDemoEnvironment()) {
        var localState = readLocalDiscoveryState();
        if (!localState.handoff) localState.handoff = cloneValue(payload);
        writeLocalDiscoveryState(localState);
        return { data: payload, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: payload, error: new Error('Auth session missing') };

    var result = await db.discoveryCallLogs.create(user.id, {
        log_type: cleanText(payload.logType || payload.outcome) || 'call',
        summary: cleanText(payload.summary || payload.contact || payload.outcome || 'Discovery call'),
        data: payload,
        created_at: payload.timestamp,
        updated_at: payload.timestamp
    });
    if (result.error) return { data: payload, error: result.error };

    return await loadDiscoveryStateFromCloud(sessionOverride, { skipBootstrap: true });
}

function readLocalSequenceState() {
    return {
        angles: toArray(readStorageJson('gtmos_angles', [])),
        outboundTouches: Object.assign({ touches: [] }, cloneValue(readStorageJson('gtmos_outbound_touches', {})) || {}),
        linkedinLog: Object.assign({ actions: [] }, cloneValue(readStorageJson('gtmos_linkedin_log', {})) || {})
    };
}

function writeLocalSequenceState(state) {
    var next = Object.assign({
        angles: [],
        outboundTouches: { touches: [] },
        linkedinLog: { actions: [] }
    }, cloneValue(state || {}));

    writeStorageJson('gtmos_angles', toArray(next.angles));
    writeStorageJson('gtmos_outbound_touches', Object.assign({ touches: [] }, next.outboundTouches || {}));
    writeStorageJson('gtmos_linkedin_log', Object.assign({ actions: [] }, next.linkedinLog || {}));
    return next;
}

function hasSequenceState(state) {
    return !!(
        (state && toArray(state.angles).length) ||
        (state && state.outboundTouches && toArray(state.outboundTouches.touches).length) ||
        (state && state.linkedinLog && toArray(state.linkedinLog.actions).length)
    );
}

function findSequenceRow(rows, key) {
    return toArray(rows).find(function(row) {
        return row && (
            row.sequence_key === key ||
            row.name === key ||
            row.title === key
        );
    }) || null;
}

async function upsertSequenceDocument(sequenceKey, title, data, sessionOverride) {
    var localState = readLocalSequenceState();

    if (sequenceKey === 'outbound_angles') localState.angles = toArray(data);
    if (sequenceKey === 'outbound_touches') localState.outboundTouches = Object.assign({ touches: [] }, cloneValue(data) || {});
    if (sequenceKey === 'linkedin_log') localState.linkedinLog = Object.assign({ actions: [] }, cloneValue(data) || {});
    writeLocalSequenceState(localState);

    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localState, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localState, error: new Error('Auth session missing') };

    var current = await db.sequences.list(user.id);
    if (current.error) return { data: localState, error: current.error };

    var existing = findSequenceRow(current.data, sequenceKey);
    var payload = {
        sequence_key: sequenceKey,
        name: sequenceKey,
        title: title || sequenceKey,
        data: cloneValue(data),
        updated_at: new Date().toISOString()
    };

    var result = existing
        ? await db.sequences.update(existing.id, payload)
        : await db.sequences.create(user.id, payload);
    if (result.error) return { data: localState, error: result.error };

    return await loadSequenceStateFromCloud(sessionOverride, { skipBootstrap: true });
}

async function syncSequenceStateToCloud(state, sessionOverride) {
    var next = writeLocalSequenceState(state || readLocalSequenceState());
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: next, error: null };
    }

    var outboundAngles = await upsertSequenceDocument('outbound_angles', 'Outbound Angles', next.angles, sessionOverride);
    if (outboundAngles.error) return outboundAngles;

    var outboundTouches = await upsertSequenceDocument('outbound_touches', 'Outbound Touch Log', next.outboundTouches, sessionOverride);
    if (outboundTouches.error) return outboundTouches;

    return await upsertSequenceDocument('linkedin_log', 'LinkedIn Activity Log', next.linkedinLog, sessionOverride);
}

async function loadSequenceStateFromCloud(sessionOverride, options) {
    options = options || {};

    var localState = readLocalSequenceState();
    if (AUTH_BYPASS || isDemoEnvironment()) {
        return { data: localState, error: null };
    }

    var user = await resolveCurrentUser(sessionOverride);
    if (!user || !user.id) return { data: localState, error: new Error('Auth session missing') };

    var result = await db.sequences.list(user.id);
    if (result.error) return { data: localState, error: result.error };

    var rows = toArray(result.data);
    if (!rows.length && hasSequenceState(localState) && !options.skipBootstrap) {
        return await syncSequenceStateToCloud(localState, sessionOverride);
    }

    var anglesRow = findSequenceRow(rows, 'outbound_angles');
    var touchRow = findSequenceRow(rows, 'outbound_touches');
    var linkedinRow = findSequenceRow(rows, 'linkedin_log');

    var next = writeLocalSequenceState({
        angles: cloneValue((anglesRow && anglesRow.data) || localState.angles || []),
        outboundTouches: Object.assign({ touches: [] }, cloneValue((touchRow && touchRow.data) || localState.outboundTouches || {})),
        linkedinLog: Object.assign({ actions: [] }, cloneValue((linkedinRow && linkedinRow.data) || localState.linkedinLog || {}))
    });

    return { data: next, error: null };
}

function initSupabase() {
    if (AUTH_BYPASS) return null;
    if (supabaseClient) return supabaseClient;

    // The CDN exposes window.supabase with createClient
    if (!window.supabase || !window.supabase.createClient) {
        console.error('Supabase CDN not loaded');
        return null;
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'antaeus-auth-token'
        }
    });

    return supabaseClient;
}

function requireSupabaseClient() {
    var client = initSupabase();
    if (!client) throw new Error('Supabase client unavailable');
    return client;
}

function ensureDbToastNode() {
    var node = document.getElementById('gtmosDbSyncToast');
    if (node) return node;
    if (!document.body) return null;

    node = document.createElement('div');
    node.id = 'gtmosDbSyncToast';
    node.style.cssText = [
        'position:fixed',
        'right:20px',
        'bottom:20px',
        'z-index:9999',
        'max-width:360px',
        'padding:11px 14px',
        'border-radius:10px',
        'font-size:0.82rem',
        'line-height:1.4',
        'font-family:inherit',
        'background:rgba(245,158,11,0.14)',
        'border:1px solid rgba(245,158,11,0.4)',
        'color:#fbbf24',
        'box-shadow:0 10px 32px rgba(0,0,0,0.35)',
        'opacity:0',
        'transform:translateY(8px)',
        'transition:opacity 0.2s ease, transform 0.2s ease',
        'pointer-events:none'
    ].join(';');
    document.body.appendChild(node);
    return node;
}

function showDbToast(message, kind) {
    var now = Date.now();
    if ((now - DB_LAST_TOAST_AT) < DB_TOAST_THROTTLE_MS) return;
    DB_LAST_TOAST_AT = now;

    var node = ensureDbToastNode();
    if (!node) return;

    if (kind === 'offline') {
        node.style.background = 'rgba(59,130,246,0.14)';
        node.style.border = '1px solid rgba(59,130,246,0.4)';
        node.style.color = '#93c5fd';
    } else {
        node.style.background = 'rgba(245,158,11,0.14)';
        node.style.border = '1px solid rgba(245,158,11,0.4)';
        node.style.color = '#fbbf24';
    }

    node.textContent = message;
    node.style.opacity = '1';
    node.style.transform = 'translateY(0)';

    if (DB_TOAST_HIDE_TIMER) clearTimeout(DB_TOAST_HIDE_TIMER);
    DB_TOAST_HIDE_TIMER = setTimeout(function() {
        node.style.opacity = '0';
        node.style.transform = 'translateY(8px)';
    }, 3200);
}

function isLikelyConnectionError(err) {
    if (!err) return false;
    var msg = String(err.message || '').toLowerCase();
    return (
        err.code === 'DB_TIMEOUT' ||
        msg.indexOf('timeout') >= 0 ||
        msg.indexOf('network') >= 0 ||
        msg.indexOf('failed to fetch') >= 0 ||
        msg.indexOf('fetch') >= 0
    );
}

function withTimeout(promise, methodName) {
    return new Promise(function(resolve, reject) {
        var settled = false;
        var timer = setTimeout(function() {
            if (settled) return;
            settled = true;
            var timeoutErr = new Error('db timeout: ' + methodName);
            timeoutErr.code = 'DB_TIMEOUT';
            reject(timeoutErr);
        }, DB_TIMEOUT_MS);

        Promise.resolve(promise).then(function(result) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(result);
        }).catch(function(err) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(err);
        });
    });
}

function wrapDbMethod(methodName, methodFn) {
    return async function() {
        try {
            var result = await withTimeout(methodFn.apply(this, arguments), methodName);
            if (result && result.error) {
                console.error('DB method error (' + methodName + '):', result.error);
                showDbToast('Cloud sync failed - your data is saved locally.', 'warn');
            }
            return result;
        } catch (err) {
            console.error('DB method failure (' + methodName + '):', err);
            if (isLikelyConnectionError(err)) {
                showDbToast('Connection issue - working offline. Data saved locally.', 'offline');
            } else {
                showDbToast('Cloud sync failed - your data is saved locally.', 'warn');
            }
            return { data: null, error: err };
        }
    };
}

function wrapDbMethods(rootObj, rootName) {
    Object.keys(rootObj).forEach(function(key) {
        var value = rootObj[key];
        var fullName = rootName + '.' + key;
        if (typeof value === 'function') {
            rootObj[key] = wrapDbMethod(fullName, value);
            return;
        }
        if (value && typeof value === 'object') {
            wrapDbMethods(value, fullName);
        }
    });
}

initAuthBypassFlag();

const auth = {
    async getUser() {
        if (AUTH_BYPASS) return getMockUser();
        const client = requireSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        return user;
    },
    async getSession() {
        if (AUTH_BYPASS) return getMockSession();
        const client = requireSupabaseClient();
        const { data: { session } } = await client.auth.getSession();
        return session;
    },
    async signUp(email, password, meta = {}, emailRedirectTo = null) {
        if (AUTH_BYPASS) {
            setAuthBypass(true, email);
            return { user: getMockUser(email), session: getMockSession(email) };
        }
        const client = requireSupabaseClient();
        const options = { data: meta };
        if (emailRedirectTo) options.emailRedirectTo = emailRedirectTo;
        const { data, error } = await client.auth.signUp({ email, password, options });
        if (error) throw error;
        return data;
    },
    async signIn(email, password) {
        if (AUTH_BYPASS) {
            setAuthBypass(true, email);
            return { data: { user: getMockUser(email), session: getMockSession(email) }, error: null };
        }
        const client = requireSupabaseClient();
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { data, error: null };
    },
    async signOut() {
        if (AUTH_BYPASS) {
            setAuthBypass(false);
            return { error: null };
        }
        const client = requireSupabaseClient();
        return await client.auth.signOut();
    },
    async resetPassword(email) {
        if (AUTH_BYPASS) {
            return { data: null, error: { message: 'No-auth mode is enabled. Password reset requires Supabase.' } };
        }
        const client = requireSupabaseClient();
        return await client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
    },
    async updatePassword(newPassword) {
        if (AUTH_BYPASS) {
            return { data: null, error: { message: 'No-auth mode is enabled. Password update requires Supabase.' } };
        }
        const client = requireSupabaseClient();
        return await client.auth.updateUser({ password: newPassword });
    },
    onAuthStateChange(callback) {
        if (AUTH_BYPASS) {
            setTimeout(function() { callback('SIGNED_IN', getMockSession()); }, 0);
            return {
                data: {
                    subscription: {
                        unsubscribe: function() {}
                    }
                }
            };
        }
        const client = requireSupabaseClient();
        return client.auth.onAuthStateChange(callback);
    }
};

const db = {
    profiles: {
        async get(userId) {
            return await fetchProfileRow(userId);
        },
        async ensure(user) {
            return await ensureProfileRow(user);
        },
        async upsert(userId, profile) {
            return await upsertProfileRow(userId, profile);
        }
    },
    pipeline: {
        async get(userId) {
            if (AUTH_BYPASS) {
                var state = readOfflineDb();
                var row = state.pipeline_settings[userId] || null;
                return { data: cloneValue(row), error: null };
            }
            const client = requireSupabaseClient();
            return await client.from('pipeline_settings').select('*').eq('user_id', userId).single();
        },
        async upsert(userId, settings) {
            if (AUTH_BYPASS) {
                var state = readOfflineDb();
                state.pipeline_settings[userId] = Object.assign(
                    { user_id: userId, updated_at: offlineNowIso() },
                    state.pipeline_settings[userId] || {},
                    settings || {},
                    { updated_at: offlineNowIso() }
                );
                writeOfflineDb(state);
                return { data: cloneValue(state.pipeline_settings[userId]), error: null };
            }
            const client = requireSupabaseClient();
            return await client.from('pipeline_settings').upsert({
                user_id: userId, ...settings, updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' }).select().single();
        }
    },
    icps: {
        async list(userId) {
            if (AUTH_BYPASS) return offlineTableList('icps', userId, 'created_at', false);
            const client = requireSupabaseClient();
            return await client.from('icps').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        },
        async get(id) {
            if (AUTH_BYPASS) return offlineTableGet('icps', id);
            const client = requireSupabaseClient();
            return await client.from('icps').select('*').eq('id', id).single();
        },
        async create(userId, icp) {
            if (AUTH_BYPASS) return offlineTableCreate('icps', userId, icp);
            const client = requireSupabaseClient();
            return await client.from('icps').insert({ user_id: userId, ...icp }).select().single();
        },
        async update(id, icp) {
            if (AUTH_BYPASS) return offlineTableUpdate('icps', id, icp);
            const client = requireSupabaseClient();
            return await client.from('icps').update({ ...icp, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        },
        async delete(id) {
            if (AUTH_BYPASS) return offlineTableDelete('icps', id);
            const client = requireSupabaseClient();
            return await client.from('icps').delete().eq('id', id);
        }
    },
    sequences: {
        async list(userId) {
            if (AUTH_BYPASS) return offlineTableList('sequences', userId, 'created_at', false);
            const client = requireSupabaseClient();
            return await client.from('sequences').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        },
        async get(id) {
            if (AUTH_BYPASS) return offlineTableGet('sequences', id);
            const client = requireSupabaseClient();
            return await client.from('sequences').select('*').eq('id', id).single();
        },
        async create(userId, sequence) {
            if (AUTH_BYPASS) return offlineTableCreate('sequences', userId, sequence);
            const client = requireSupabaseClient();
            return await client.from('sequences').insert({ user_id: userId, ...sequence }).select().single();
        },
        async update(id, sequence) {
            if (AUTH_BYPASS) return offlineTableUpdate('sequences', id, sequence);
            const client = requireSupabaseClient();
            return await client.from('sequences').update({ ...sequence, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        },
        async delete(id) {
            if (AUTH_BYPASS) return offlineTableDelete('sequences', id);
            const client = requireSupabaseClient();
            return await client.from('sequences').delete().eq('id', id);
        }
    },
    deals: {
        async list(userId) {
            if (AUTH_BYPASS) return offlineTableList('deals', userId, 'updated_at', false);
            const client = requireSupabaseClient();
            return await client.from('deals').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
        },
        async get(id) {
            if (AUTH_BYPASS) return offlineTableGet('deals', id);
            const client = requireSupabaseClient();
            return await client.from('deals').select('*').eq('id', id).single();
        },
        async create(userId, deal) {
            if (AUTH_BYPASS) return offlineTableCreate('deals', userId, deal);
            const client = requireSupabaseClient();
            return await client.from('deals').insert({ user_id: userId, ...deal }).select().single();
        },
        async update(id, deal) {
            if (AUTH_BYPASS) return offlineTableUpdate('deals', id, deal);
            const client = requireSupabaseClient();
            return await client.from('deals').update({ ...deal, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        },
        async delete(id) {
            if (AUTH_BYPASS) return offlineTableDelete('deals', id);
            const client = requireSupabaseClient();
            return await client.from('deals').delete().eq('id', id);
        }
    },
    signalConsoleAccounts: {
        async list(userId) {
            if (AUTH_BYPASS) return offlineTableList('signal_console_accounts', userId, 'updated_at', false);
            const client = requireSupabaseClient();
            return await client.from('signal_console_accounts').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
        },
        async upsert(userId, account) {
            if (AUTH_BYPASS) {
                var state = readOfflineDb();
                state.signal_console_accounts = state.signal_console_accounts || [];
                var payload = Object.assign({ user_id: userId }, account || {});
                var idx = state.signal_console_accounts.findIndex(function(row) {
                    return row && row.user_id === userId && row.account_key === payload.account_key;
                });

                if (idx >= 0) {
                    state.signal_console_accounts[idx] = Object.assign({}, state.signal_console_accounts[idx], payload, { updated_at: offlineNowIso() });
                } else {
                    state.signal_console_accounts.push(Object.assign({
                        id: createOfflineId('signal_console_accounts'),
                        user_id: userId,
                        created_at: offlineNowIso(),
                        updated_at: offlineNowIso()
                    }, payload));
                }

                writeOfflineDb(state);
                var row = state.signal_console_accounts.find(function(item) {
                    return item && item.user_id === userId && item.account_key === payload.account_key;
                }) || null;
                return { data: cloneValue(row), error: null };
            }
            const client = requireSupabaseClient();
            return await client.from('signal_console_accounts').upsert({
                user_id: userId, ...account, updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,account_key' }).select().single();
        },
        async delete(id) {
            if (AUTH_BYPASS) return offlineTableDelete('signal_console_accounts', id);
            const client = requireSupabaseClient();
            return await client.from('signal_console_accounts').delete().eq('id', id);
        }
    },
    discoveryFrameworks: {
        async list(userId) {
            if (AUTH_BYPASS) return offlineTableList('discovery_frameworks', userId, 'created_at', false);
            const client = requireSupabaseClient();
            return await client.from('discovery_frameworks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        },
        async get(id) {
            if (AUTH_BYPASS) return offlineTableGet('discovery_frameworks', id);
            const client = requireSupabaseClient();
            return await client.from('discovery_frameworks').select('*').eq('id', id).single();
        },
        async create(userId, framework) {
            if (AUTH_BYPASS) return offlineTableCreate('discovery_frameworks', userId, framework);
            const client = requireSupabaseClient();
            return await client.from('discovery_frameworks').insert({ user_id: userId, ...framework }).select().single();
        },
        async update(id, framework) {
            if (AUTH_BYPASS) return offlineTableUpdate('discovery_frameworks', id, framework);
            const client = requireSupabaseClient();
            return await client.from('discovery_frameworks').update({ ...framework, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        },
        async delete(id) {
            if (AUTH_BYPASS) return offlineTableDelete('discovery_frameworks', id);
            const client = requireSupabaseClient();
            return await client.from('discovery_frameworks').delete().eq('id', id);
        }
    },
    discoveryCallLogs: {
        async list(userId) {
            if (AUTH_BYPASS) return offlineTableList('discovery_call_logs', userId, 'created_at', false);
            const client = requireSupabaseClient();
            return await client.from('discovery_call_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        },
        async create(userId, log) {
            if (AUTH_BYPASS) return offlineTableCreate('discovery_call_logs', userId, log);
            const client = requireSupabaseClient();
            return await client.from('discovery_call_logs').insert({ user_id: userId, ...log }).select().single();
        },
        async delete(id) {
            if (AUTH_BYPASS) return offlineTableDelete('discovery_call_logs', id);
            const client = requireSupabaseClient();
            return await client.from('discovery_call_logs').delete().eq('id', id);
        }
    }
};

wrapDbMethods(db, 'db');

// Expose globally
window.handleSignOut = async function () {
    try {
        await auth.signOut();
    } catch (e) {
        console.error('Sign out failed:', e);
    }

    try {
        localStorage.removeItem('gtmos_noauth_mode');
        localStorage.removeItem('gtmos_noauth_email');
        removeStorageKeys([
            'gtmos_onboarding',
            'gtmos_product_category',
            PROFILE_CACHE_KEY,
            'gtmos_icp_analytics',
            'gtmos_deal_workspaces',
            'gtmos_deal_stage_history',
            'gtmos_sc_v4',
            'gtmos_discovery_worked',
            'gtmos_discovery_stats',
            'gtmos_discovery_agenda',
            'gtmos_call_handoff',
            'gtmos_angles',
            'gtmos_outbound_touches',
            'gtmos_linkedin_log'
        ]);
        sessionStorage.removeItem('gtmos_env_mode');
    } catch (e) {}

    window.__gtmosCurrentProfile = null;
    window.__gtmosWorkspaceBootstrap = null;
    window.__gtmosWorkspaceBootstrapPromise = null;
    window.location.replace('/login.html');
};

window.initSupabase = initSupabase;
window.auth = auth;
window.db = db;
window.setAuthBypass = setAuthBypass;
window.isAuthBypassEnabled = isAuthBypassEnabled;
window.isDemoEnvironment = isDemoEnvironment;
window.ensureUserWorkspace = ensureUserWorkspace;
window.resolvePostAuthRoute = resolvePostAuthRoute;
window.updateWorkspaceProfile = updateWorkspaceProfile;
window.saveUserOnboardingState = saveUserOnboardingState;
window.resetUserOnboardingState = resetUserOnboardingState;
window.clearWorkspaceBootstrapCache = clearWorkspaceBootstrapCache;
window.gtmPersistence = {
    icps: {
        load: loadIcpAnalyticsFromCloud,
        save: saveIcpEntryToCloud,
        replaceAll: replaceCloudIcpsFromLocalState,
        remove: deleteIcpEntryFromCloud
    },
    deals: {
        load: loadDealsFromCloud,
        save: saveDealToCloud,
        replaceAll: replaceCloudDealsFromLocalState,
        remove: deleteDealFromCloud
    },
    discovery: {
        load: loadDiscoveryStateFromCloud,
        save: saveDiscoveryStateToCloud,
        logCall: recordDiscoveryCallLog
    },
    sequences: {
        load: loadSequenceStateFromCloud,
        saveAll: syncSequenceStateToCloud,
        saveDocument: upsertSequenceDocument
    },
    signalConsole: {
        load: loadSignalConsoleAccountsFromCloud,
        save: saveSignalConsoleAccountToCloud,
        replaceAll: replaceCloudSignalConsoleAccountsFromLocalState,
        remove: deleteSignalConsoleAccountFromCloud
    }
};
