/**
 * GTMOS Data Manager
 *
 * Export, import, and delete workspace data while treating Supabase-backed
 * persistence as the durable source of truth.
 */

(function () {
    'use strict';

    var BASE_DATA_KEYS = [
        'gtmos_onboarding',
        'gtmos_product_category',
        'gtmos_playbook',
        'gtmos_qw_inputs',
        'gtmos_outbound_seed',
        'gtmos_icp_analytics',
        'gtmos_deal_workspaces',
        'gtmos_deal_stage_history',
        'gtmos_discovery_worked',
        'gtmos_discovery_stats',
        'gtmos_discovery_agenda',
        'gtmos_call_handoff',
        'gtmos_angles',
        'gtmos_outbound_touches',
        'gtmos_linkedin_log',
        'gtmos_sc_v4',
        'gtmos_qual_texts',
        'gtmos_account_plans',
        'gtmos_asset_builder_analytics',
        'gtmos_tour_completed'
    ];

    var EXCLUDED_KEYS = [
        'gtmos_noauth_mode',
        'gtmos_noauth_email',
        'gtmos_env_mode',
        'gtmos_enrichment_base_url'
    ];
    var BACKUP_META_KEY = 'gtmos_backup_meta';
    var BACKUP_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
    var BACKUP_REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

    function cloneValue(value) {
        if (value == null) return value;
        try { return JSON.parse(JSON.stringify(value)); }
        catch (e) { return value; }
    }

    function unique(items) {
        var seen = {};
        return (items || []).filter(function (item) {
            var key = String(item || '');
            if (!key || seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }

    function isExcludedKey(key) {
        return EXCLUDED_KEYS.indexOf(String(key || '')) >= 0;
    }

    function readScopedUiState(key, fallback) {
        try {
            if (window.gtmLocalState && typeof window.gtmLocalState.get === 'function') {
                return window.gtmLocalState.get(key, fallback, { scope: 'user' });
            }
        } catch (e) {}

        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : cloneValue(fallback);
        } catch (e) {
            return cloneValue(fallback);
        }
    }

    function writeScopedUiState(key, value) {
        try {
            if (window.gtmLocalState && typeof window.gtmLocalState.set === 'function') {
                window.gtmLocalState.set(key, value, { scope: 'user' });
                return;
            }
        } catch (e) {}

        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }

    function readBackupMeta() {
        var meta = readScopedUiState(BACKUP_META_KEY, {});
        return meta && typeof meta === 'object' ? meta : {};
    }

    function writeBackupMeta(next) {
        var current = readBackupMeta();
        writeScopedUiState(BACKUP_META_KEY, Object.assign({}, current, next || {}));
    }

    function padNumber(value) {
        return String(Number(value) || 0).padStart(2, '0');
    }

    function formatExportTimestamp(date) {
        var dt = date instanceof Date ? date : new Date(date || Date.now());
        return [
            dt.getFullYear(),
            padNumber(dt.getMonth() + 1),
            padNumber(dt.getDate())
        ].join('-') + '-' + [
            padNumber(dt.getHours()),
            padNumber(dt.getMinutes()),
            padNumber(dt.getSeconds())
        ].join('');
    }

    function buildExportFilename(date) {
        return 'antaeus-backup-' + formatExportTimestamp(date) + '.json';
    }

    function buildBackupStatus() {
        var meta = readBackupMeta();
        var lastExportAt = meta.lastExportAt || null;
        var lastExportMs = lastExportAt ? new Date(lastExportAt).getTime() : NaN;
        var hasExport = Number.isFinite(lastExportMs);
        var ageMs = hasExport ? Math.max(0, Date.now() - lastExportMs) : null;

        return {
            hasExport: hasExport,
            lastExportAt: lastExportAt,
            lastExportFileName: meta.lastExportFileName || null,
            lastReminderAt: meta.lastReminderAt || null,
            exportCount: Number(meta.exportCount || 0) || 0,
            ageMs: ageMs,
            ageDays: hasExport ? Math.floor(ageMs / (24 * 60 * 60 * 1000)) : null,
            needsReminder: !hasExport || ageMs >= BACKUP_REMINDER_INTERVAL_MS
        };
    }

    function shouldShowBackupReminder(status) {
        var next = status || buildBackupStatus();
        if (!next.needsReminder) return false;

        var lastReminderMs = next.lastReminderAt ? new Date(next.lastReminderAt).getTime() : NaN;
        if (!Number.isFinite(lastReminderMs)) return true;
        return (Date.now() - lastReminderMs) >= BACKUP_REMINDER_COOLDOWN_MS;
    }

    function durableDocKeys() {
        if (!(window.gtmPersistence && window.gtmPersistence.docs && Array.isArray(window.gtmPersistence.docs.keys))) {
            return [];
        }
        return window.gtmPersistence.docs.keys.slice();
    }

    function localGtmKeys() {
        var keys = [];
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.indexOf('gtmos_') === 0 && !isExcludedKey(key)) {
                    keys.push(key);
                }
            }
        } catch (e) {}
        return keys;
    }

    function allDataKeys() {
        return unique(BASE_DATA_KEYS.concat(durableDocKeys()).concat(localGtmKeys())).filter(function (key) {
            return !isExcludedKey(key);
        });
    }

    function readParsed(key, fallback) {
        var raw;
        try { raw = localStorage.getItem(key); }
        catch (e) { raw = null; }

        if (raw === null || raw === undefined) return cloneValue(fallback);

        try { return JSON.parse(raw); }
        catch (e) { return raw; }
    }

    function setStoredValue(key, value) {
        if (value === undefined) return;
        if (value === null) {
            localStorage.removeItem(key);
            return;
        }
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }

    function clearLocalData() {
        allDataKeys().forEach(function (key) {
            try { localStorage.removeItem(key); }
            catch (e) {}
        });
        try { localStorage.removeItem('gtmos_profile_cache'); }
        catch (e) {}
    }

    function gatherData(keys) {
        var data = {};
        (keys || allDataKeys()).forEach(function (key) {
            var raw = null;
            try { raw = localStorage.getItem(key); }
            catch (e) { raw = null; }
            if (raw === null) return;

            try { data[key] = JSON.parse(raw); }
            catch (e) { data[key] = raw; }
        });
        return data;
    }

    function defaultDocState(keys) {
        var next = {};
        (keys || durableDocKeys()).forEach(function (key) {
            if (window.gtmPersistence && window.gtmPersistence.docs && typeof window.gtmPersistence.docs.defaultFor === 'function') {
                next[key] = cloneValue(window.gtmPersistence.docs.defaultFor(key));
            } else {
                next[key] = null;
            }
        });
        return next;
    }

    function durableDocsFromLocal(keys) {
        var state = defaultDocState(keys);
        Object.keys(state).forEach(function (key) {
            state[key] = readParsed(key, state[key]);
        });
        return state;
    }

    function buildSequenceStateFromLocal() {
        return {
            angles: readParsed('gtmos_angles', []),
            outboundTouches: Object.assign({ touches: [] }, readParsed('gtmos_outbound_touches', {}) || {}),
            linkedinLog: Object.assign({ actions: [] }, readParsed('gtmos_linkedin_log', {}) || {})
        };
    }

    function buildDiscoveryStateFromLocal() {
        return {
            currentCategory: readParsed('gtmos_product_category', 'cxai') || 'cxai',
            workedIds: readParsed('gtmos_discovery_worked', []),
            stats: Object.assign({ totalCalls: 0, advancedCalls: 0 }, readParsed('gtmos_discovery_stats', {}) || {}),
            agenda: readParsed('gtmos_discovery_agenda', null),
            handoff: readParsed('gtmos_call_handoff', null)
        };
    }

    function buildIcpStateFromLocal() {
        var state = readParsed('gtmos_icp_analytics', { icps: [], totalWorked: 0 }) || {};
        return {
            icps: Array.isArray(state.icps) ? state.icps : [],
            totalWorked: Number(state.totalWorked || 0) || 0
        };
    }

    function buildSignalConsoleAccountsFromLocal() {
        var state = readParsed('gtmos_sc_v4', { accounts: [] }) || {};
        return Array.isArray(state.accounts) ? state.accounts : [];
    }

    async function settledCall(label, fn, errors) {
        if (typeof fn !== 'function') return;
        try {
            var result = await fn();
            if (result && result.error) {
                errors.push(label + ': ' + (result.error.message || String(result.error)));
            }
        } catch (error) {
            errors.push(label + ': ' + (error && error.message ? error.message : String(error)));
        }
    }

    async function preloadCloudBackedState() {
        var tasks = [];
        if (window.gtmPersistence && window.gtmPersistence.workspace && typeof window.gtmPersistence.workspace.loadSummary === 'function') {
            tasks.push(window.gtmPersistence.workspace.loadSummary({ force: true }));
        }
        if (window.gtmPersistence && window.gtmPersistence.icps && typeof window.gtmPersistence.icps.load === 'function') {
            tasks.push(window.gtmPersistence.icps.load());
        }
        if (window.gtmPersistence && window.gtmPersistence.deals && typeof window.gtmPersistence.deals.load === 'function') {
            tasks.push(window.gtmPersistence.deals.load());
        }
        if (window.gtmPersistence && window.gtmPersistence.discovery && typeof window.gtmPersistence.discovery.load === 'function') {
            tasks.push(window.gtmPersistence.discovery.load());
        }
        if (window.gtmPersistence && window.gtmPersistence.sequences && typeof window.gtmPersistence.sequences.load === 'function') {
            tasks.push(window.gtmPersistence.sequences.load());
        }
        if (window.gtmPersistence && window.gtmPersistence.signalConsole && typeof window.gtmPersistence.signalConsole.load === 'function') {
            tasks.push(window.gtmPersistence.signalConsole.load());
        }
        if (window.gtmPersistence && window.gtmPersistence.docs && typeof window.gtmPersistence.docs.load === 'function') {
            tasks.push(window.gtmPersistence.docs.load());
        }

        if (tasks.length) {
            await Promise.allSettled(tasks);
        }

        return gatherData();
    }

    async function syncCloudFromLocalState() {
        var errors = [];

        await settledCall('workspace onboarding', function () {
            if (typeof window.saveUserOnboardingState !== 'function') return null;
            var onboarding = readParsed('gtmos_onboarding', null);
            if (!onboarding || typeof onboarding !== 'object') return null;
            return window.saveUserOnboardingState(onboarding);
        }, errors);

        await settledCall('ICPs', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.icps && typeof window.gtmPersistence.icps.replaceAll === 'function')) return null;
            return window.gtmPersistence.icps.replaceAll(buildIcpStateFromLocal());
        }, errors);

        await settledCall('deals', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.deals && typeof window.gtmPersistence.deals.replaceAll === 'function')) return null;
            return window.gtmPersistence.deals.replaceAll(readParsed('gtmos_deal_workspaces', []));
        }, errors);

        await settledCall('discovery', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.discovery && typeof window.gtmPersistence.discovery.save === 'function')) return null;
            return window.gtmPersistence.discovery.save(buildDiscoveryStateFromLocal());
        }, errors);

        await settledCall('sequences', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.sequences && typeof window.gtmPersistence.sequences.saveAll === 'function')) return null;
            return window.gtmPersistence.sequences.saveAll(buildSequenceStateFromLocal());
        }, errors);

        await settledCall('signal console', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.signalConsole && typeof window.gtmPersistence.signalConsole.replaceAll === 'function')) return null;
            return window.gtmPersistence.signalConsole.replaceAll(buildSignalConsoleAccountsFromLocal());
        }, errors);

        await settledCall('durable docs', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.docs && typeof window.gtmPersistence.docs.syncAll === 'function')) return null;
            return window.gtmPersistence.docs.syncAll(durableDocsFromLocal());
        }, errors);

        if (typeof window.clearWorkspaceBootstrapCache === 'function') {
            window.clearWorkspaceBootstrapCache();
        }
        if (window.gtmPersistence && window.gtmPersistence.workspace && typeof window.gtmPersistence.workspace.loadSummary === 'function') {
            await window.gtmPersistence.workspace.loadSummary({ force: true }).catch(function (error) {
                console.error('Data manager workspace summary refresh failed:', error);
            });
        }

        return errors;
    }

    async function resetCloudState() {
        var errors = [];

        await settledCall('workspace onboarding reset', function () {
            if (typeof window.resetUserOnboardingState !== 'function') return null;
            return window.resetUserOnboardingState();
        }, errors);

        await settledCall('ICP reset', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.icps && typeof window.gtmPersistence.icps.replaceAll === 'function')) return null;
            return window.gtmPersistence.icps.replaceAll({ icps: [], totalWorked: 0 });
        }, errors);

        await settledCall('deal reset', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.deals && typeof window.gtmPersistence.deals.replaceAll === 'function')) return null;
            return window.gtmPersistence.deals.replaceAll([]);
        }, errors);

        await settledCall('discovery reset', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.discovery && typeof window.gtmPersistence.discovery.save === 'function')) return null;
            return window.gtmPersistence.discovery.save({
                currentCategory: 'cxai',
                workedIds: [],
                stats: { totalCalls: 0, advancedCalls: 0 },
                agenda: null,
                handoff: null
            });
        }, errors);

        await settledCall('sequence reset', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.sequences && typeof window.gtmPersistence.sequences.saveAll === 'function')) return null;
            return window.gtmPersistence.sequences.saveAll({
                angles: [],
                outboundTouches: { touches: [] },
                linkedinLog: { actions: [] }
            });
        }, errors);

        await settledCall('signal console reset', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.signalConsole && typeof window.gtmPersistence.signalConsole.replaceAll === 'function')) return null;
            return window.gtmPersistence.signalConsole.replaceAll([]);
        }, errors);

        await settledCall('durable docs reset', function () {
            if (!(window.gtmPersistence && window.gtmPersistence.docs && typeof window.gtmPersistence.docs.syncAll === 'function')) return null;
            return window.gtmPersistence.docs.syncAll(defaultDocState());
        }, errors);

        if (typeof window.clearWorkspaceBootstrapCache === 'function') {
            window.clearWorkspaceBootstrapCache();
        }

        return errors;
    }

    var manager = {
        exportAll: async function () {
            var data = await preloadCloudBackedState();
            var keyCount = Object.keys(data).length;
            if (keyCount === 0) {
                alert('No GTM OS data found to export.');
                return;
            }

            var exportedAt = new Date();
            var fileName = buildExportFilename(exportedAt);

            var payload = {
                _export: {
                    version: 'gtmos-v28',
                    exported_at: exportedAt.toISOString(),
                    keys: keyCount
                },
                data: data
            };

            var json = JSON.stringify(payload, null, 2);
            var blob = new Blob([json], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

            writeBackupMeta({
                lastExportAt: exportedAt.toISOString(),
                lastExportFileName: fileName,
                exportCount: buildBackupStatus().exportCount + 1
            });

            if (window.gtmAnalytics) gtmAnalytics.track('data_exported', { keys: keyCount });
        },

        importAll: function (options) {
            options = options || {};
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;

                var reader = new FileReader();
                reader.onload = async function (evt) {
                    try {
                        var parsed = JSON.parse(evt.target.result);
                        var data = parsed.data || parsed;

                        var validKeys = Object.keys(data).filter(function (k) {
                            return k.indexOf('gtmos_') === 0 && !isExcludedKey(k);
                        });

                        if (validKeys.length === 0) {
                            alert('This file does not appear to contain GTM OS data.');
                            return;
                        }

                        var exportDate = parsed._export ? parsed._export.exported_at : 'unknown';
                        if (!confirm(
                            'Import ' + validKeys.length + ' data stores from backup' +
                            (exportDate !== 'unknown' ? ' (exported ' + exportDate.slice(0, 10) + ')' : '') +
                            '?\n\nThis will overwrite your current data and resync durable workspace state.'
                        )) {
                            return;
                        }

                        clearLocalData();
                        allDataKeys().forEach(function (key) {
                            var nextValue = Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
                            if (nextValue === undefined) return;
                            setStoredValue(key, nextValue);
                        });
                        validKeys.forEach(function (key) {
                            if (allDataKeys().indexOf(key) >= 0) return;
                            setStoredValue(key, data[key]);
                        });

                        var syncErrors = await syncCloudFromLocalState();
                        var message = 'Imported ' + validKeys.length + ' data stores. Reloading...';
                        if (syncErrors.length) {
                            message += '\n\nCloud sync warnings:\n- ' + syncErrors.join('\n- ');
                        }

                        alert(message);
                        if (window.gtmAnalytics) gtmAnalytics.track('data_imported', { keys: validKeys.length, cloud_warnings: syncErrors.length });
                        if (options.reloadTo) {
                            window.location.href = options.reloadTo;
                        } else {
                            window.location.reload();
                        }
                    } catch (err) {
                        alert('Failed to read backup file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        },

        deleteAll: async function () {
            if (!confirm('This will permanently delete ALL your GTM OS data for this signed-in workspace.\n\nICPs, deals, Signal Console, discovery state, territory data, cold-call log, advisor deploy, and other durable workspace records will be cleared.\n\nThis cannot be undone. Continue?')) {
                return;
            }

            var confirmation = prompt('Type DELETE to confirm:');
            if (confirmation !== 'DELETE') {
                alert('Deletion cancelled.');
                return;
            }

            var resetErrors = await resetCloudState();
            if (resetErrors.length) {
                alert('Unable to fully clear durable workspace truth.\n\n' + resetErrors.join('\n'));
                return;
            }

            if (window.gtmAnalytics) gtmAnalytics.track('data_deleted', { keys: allDataKeys().length });

            clearLocalData();
            if (typeof window.clearWorkspaceBootstrapCache === 'function') {
                window.clearWorkspaceBootstrapCache();
            }

            alert('All workspace data deleted. Redirecting to setup...');
            window.location.href = '/app/onboarding/';
        },

        summary: function () {
            var result = {};
            allDataKeys().forEach(function (key) {
                var val = null;
                try { val = localStorage.getItem(key); }
                catch (e) { val = null; }
                if (val === null) return;

                result[key] = { bytes: val.length, type: typeof val };
                try {
                    var parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) result[key].items = parsed.length;
                    else if (parsed && typeof parsed === 'object') result[key].keys = Object.keys(parsed).length;
                } catch (e) {}
            });
            return result;
        },

        getBackupStatus: function () {
            return buildBackupStatus();
        },

        shouldShowBackupReminder: function () {
            return shouldShowBackupReminder(buildBackupStatus());
        },

        markBackupReminderShown: function () {
            writeBackupMeta({ lastReminderAt: new Date().toISOString() });
        }
    };

    manager.export = manager.exportAll;
    manager.import = manager.importAll;
    manager.delete = manager.deleteAll;

    window.dataManager = manager;
    window.gtmDataManager = manager;
})();
