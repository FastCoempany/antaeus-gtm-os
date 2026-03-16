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

var OFFLINE_DB_KEY = 'gtmos_offline_db_v1';
var OFFLINE_DEFAULT_STATE = {
    pipeline_settings: {},
    icps: [],
    sequences: [],
    deals: [],
    discovery_frameworks: [],
    discovery_call_logs: []
};

function cloneValue(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (e) {
        return value;
    }
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
    try {
        AUTH_BYPASS = localStorage.getItem(AUTH_BYPASS_KEY) === '1';
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

    ['icps', 'sequences', 'deals', 'discovery_frameworks', 'discovery_call_logs'].forEach(function(tableName) {
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
window.initSupabase = initSupabase;
window.auth = auth;
window.db = db;
window.setAuthBypass = setAuthBypass;
window.isAuthBypassEnabled = isAuthBypassEnabled;
