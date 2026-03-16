/**
 * GTMOS localStorage Migration
 * 
 * Migrates legacy localStorage keys to standardized gtmos_ prefix.
 * Runs once per browser. Shows a brief upgrade notice on first run.
 * 
 * Include this script BEFORE any module scripts.
 */

(function() {
    'use strict';

    var MIGRATION_FLAG = 'gtmos_migration_v1_done';

    // Already migrated
    if (localStorage.getItem(MIGRATION_FLAG)) return;

    var MIGRATIONS = [
        { from: 'gtmos_angles',                   to: 'gtmos_angles' },
        { from: 'gtmos_discovery_stats',   to: 'gtmos_discovery_stats' },
        { from: 'gtmos_tour_completed',    to: 'gtmos_tour_completed' },
        { from: 'gtmos_asset_builder_analytics',   to: 'gtmos_asset_builder_analytics' },
        { from: 'gtmos_deal_workspaces',        to: 'gtmos_deal_workspaces' },
        { from: 'gtmos_discovery_agenda',       to: 'gtmos_discovery_agenda' },
        { from: 'gtmos_playbook',           to: 'gtmos_playbook' },
        { from: 'gtmos_outbound_seed',          to: 'gtmos_outbound_seed' },
        { from: 'gtmos_icp_analytics',        to: 'gtmos_icp_analytics' },
        { from: 'gtmos_deal_reviews',    to: 'gtmos_deal_reviews' },
        { from: 'gtmos_account_planning',       to: 'gtmos_account_planning' }
    ];

    var migrated = 0;

    MIGRATIONS.forEach(function(m) {
        var val = localStorage.getItem(m.from);
        if (val !== null) {
            // Only write new key if it doesn't already exist
            if (localStorage.getItem(m.to) === null) {
                localStorage.setItem(m.to, val);
            }
            // Keep old key as backup (can be cleaned up in future version)
            migrated++;
        }
    });

    // Also migrate the gtmos_deal_quals, gtmos_deal_outcomes, gtmos_discovery_links
    // which already use the gtmos_ prefix from gtmos-store.js — no action needed.

    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());

    // Show brief upgrade notice if any data was migrated
    if (migrated > 0) {
        var notice = document.createElement('div');
        notice.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;' +
            'background:rgba(30,41,59,0.95);border:1px solid rgba(212,165,116,0.3);border-radius:8px;' +
            'padding:12px 24px;font-size:0.85rem;color:#e2e8f0;backdrop-filter:blur(8px);' +
            'box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:opacity 0.5s;';
        notice.innerHTML = '⚡ GTM OS upgraded — ' + migrated + ' data stores migrated successfully.';
        document.body.appendChild(notice);
        setTimeout(function() { notice.style.opacity = '0'; }, 3000);
        setTimeout(function() { notice.remove(); }, 3500);
    }
})();
