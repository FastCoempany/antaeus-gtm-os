/**
 * GTMOS Data Manager — Phase 2.2 + 2.4
 *
 * Export all user data as JSON backup, import from backup, and delete all data.
 *
 * API:
 *   gtmDataManager.exportAll()    — download JSON backup
 *   gtmDataManager.importAll()    — file picker → restore from JSON
 *   gtmDataManager.deleteAll()    — two-step confirmation → wipe all data
 */

(function () {
    'use strict';

    // All GTMOS localStorage keys
    var DATA_KEYS = [
        'gtmos_onboarding',
        'gtmos_playbook',
        'gtmos_icp_analytics',
        'gtmos_outbound_seed',
        'gtmos_qw_inputs',
        'gtmos_angles',
        'gtmos_deal_workspaces',
        'gtmos_discovery_stats',
        'gtmos_qual_texts',
        'gtmos_call_handoff',
        'gtmos_account_plans',
        'gtmos_asset_builder_analytics',
        'gtmos_tour_completed',
        'gtmos_territory',
        'gtmos_ta_theses',
        'gtmos_ta_approaches',
        'gtmos_ta_accounts',
        'gtmos_ta_dispositions',
        'gtmos_ta_signals',
        'gtmos_ta_swap_history',
        'gtmos_ta_retier_history',
        'gtmos_ta_calibrations',
        'gtmos_ta_setup',
        'gtmos_sw_query_cards',
        'gtmos_sw_prospects',
        'gtmos_sw_persona_maps'
    ];

    function gatherData() {
        var data = {};
        DATA_KEYS.forEach(function (key) {
            var val = localStorage.getItem(key);
            if (val !== null) {
                try { data[key] = JSON.parse(val); }
                catch (e) { data[key] = val; }
            }
        });
        return data;
    }

    var manager = {
        /**
         * Export all data as a timestamped JSON file download.
         */
        exportAll: function () {
            var data = gatherData();
            var keyCount = Object.keys(data).length;
            if (keyCount === 0) {
                alert('No GTM OS data found to export.');
                return;
            }

            var payload = {
                _export: {
                    version: 'gtmos-v27',
                    exported_at: new Date().toISOString(),
                    keys: keyCount
                },
                data: data
            };

            var json = JSON.stringify(payload, null, 2);
            var blob = new Blob([json], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'antaeus-backup-' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

            // Track export
            if (window.gtmAnalytics) gtmAnalytics.track('data_exported', { keys: keyCount });
        },

        /**
         * Import data from a JSON backup file. Prompts with file picker.
         */
        importAll: function () {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;

                var reader = new FileReader();
                reader.onload = function (evt) {
                    try {
                        var parsed = JSON.parse(evt.target.result);
                        var data = parsed.data || parsed;

                        // Validate it looks like GTMOS data
                        var validKeys = Object.keys(data).filter(function (k) {
                            return k.indexOf('gtmos_') === 0;
                        });

                        if (validKeys.length === 0) {
                            alert('This file does not appear to contain GTM OS data.');
                            return;
                        }

                        var exportDate = parsed._export ? parsed._export.exported_at : 'unknown';
                        if (!confirm('Import ' + validKeys.length + ' data stores from backup' +
                            (exportDate !== 'unknown' ? ' (exported ' + exportDate.slice(0, 10) + ')' : '') +
                            '?\n\nThis will overwrite your current data. This cannot be undone.')) {
                            return;
                        }

                        validKeys.forEach(function (key) {
                            var val = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
                            localStorage.setItem(key, val);
                        });

                        alert('Imported ' + validKeys.length + ' data stores. Reloading…');
                        if (window.gtmAnalytics) gtmAnalytics.track('data_imported', { keys: validKeys.length });
                        window.location.reload();

                    } catch (err) {
                        alert('Failed to read backup file: ' + err.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        },

        /**
         * Delete all GTMOS data with two-step confirmation.
         */
        deleteAll: function () {
            if (!confirm('⚠️ This will permanently delete ALL your GTM OS data from this browser.\n\nICPs, deals, playbook, quota workback, outbound angles, discovery stats — everything.\n\nThis cannot be undone. Continue?')) {
                return;
            }

            var confirmation = prompt('Type DELETE to confirm:');
            if (confirmation !== 'DELETE') {
                alert('Deletion cancelled.');
                return;
            }

            // Track before deletion
            if (window.gtmAnalytics) gtmAnalytics.track('data_deleted', { keys: DATA_KEYS.length });

            DATA_KEYS.forEach(function (key) {
                localStorage.removeItem(key);
            });

            alert('All data deleted. Redirecting to setup…');
            window.location.href = '/app/onboarding/';
        },

        /**
         * Get a quick summary of stored data (for debugging / admin).
         */
        summary: function () {
            var result = {};
            DATA_KEYS.forEach(function (key) {
                var val = localStorage.getItem(key);
                if (val !== null) {
                    result[key] = { bytes: val.length, type: typeof val };
                    try {
                        var parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) result[key].items = parsed.length;
                        else if (parsed && typeof parsed === 'object') result[key].keys = Object.keys(parsed).length;
                    } catch (e) { /* not JSON */ }
                }
            });
            return result;
        }
    };

    window.gtmDataManager = manager;
})();
