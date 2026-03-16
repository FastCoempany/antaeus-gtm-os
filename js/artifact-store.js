/**
 * ANTAEUS GTM OS — Artifact Store
 * Unified persistence layer for all studios
 * 
 * Features:
 * - Supabase persistence (primary)
 * - localStorage fallback (offline resilience)
 * - Multi-format export (CSV, JSON, Text, DOCX-ready)
 * - Analytics queries
 * - Clipboard utilities
 */

(function(global) {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    
    const LOCAL_STORAGE_KEY = 'gtm_os_artifacts_buffer';
    const TABLE_NAME = 'studio_artifacts';

    // ============================================
    // SUPABASE CLIENT — uses shared client from supabase-config.js
    // ============================================

    function getSupabase() {
        // Prefer the shared client from supabase-config.js
        if (typeof window.initSupabase === 'function') {
            return window.initSupabase();
        }
        
        console.warn('ArtifactStore: Shared Supabase client not available, using localStorage only');
        return null;
    }

    async function getCurrentUserId() {
        const client = getSupabase();
        if (!client) return null;
        
        try {
            const { data: { user } } = await client.auth.getUser();
            return user?.id || null;
        } catch (e) {
            console.warn('Could not get user:', e);
            return null;
        }
    }

    // ============================================
    // LOCAL STORAGE BUFFER
    // ============================================
    
    function getLocalBuffer() {
        try {
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveToLocalBuffer(artifact) {
        try {
            const buffer = getLocalBuffer();
            artifact._localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            artifact._savedAt = new Date().toISOString();
            artifact._synced = false;
            buffer.unshift(artifact);
            
            // Keep max 100 items in local buffer
            if (buffer.length > 100) buffer.length = 100;
            
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(buffer));
            return artifact._localId;
        } catch (e) {
            console.error('Local save failed:', e);
            return null;
        }
    }

    function markLocalAsSynced(localId, supabaseId) {
        try {
            const buffer = getLocalBuffer();
            const item = buffer.find(a => a._localId === localId);
            if (item) {
                item._synced = true;
                item._supabaseId = supabaseId;
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(buffer));
            }
        } catch (e) {
            console.warn('Could not mark as synced:', e);
        }
    }

    // ============================================
    // CORE SAVE FUNCTION
    // ============================================
    
    async function saveArtifact(artifact) {
        // Validate required fields
        if (!artifact.studio || !artifact.artifact_type || !artifact.title) {
            throw new Error('Missing required fields: studio, artifact_type, title');
        }

        // Always save locally first (durability guarantee)
        const localId = saveToLocalBuffer(artifact);
        
        // Attempt Supabase save
        const client = getSupabase();
        const userId = await getCurrentUserId();
        
        if (!client || !userId) {
            console.warn('Supabase unavailable, saved locally only');
            return {
                success: true,
                id: localId,
                source: 'local',
                message: 'Saved locally (offline mode)'
            };
        }

        try {
            const record = {
                user_id: userId,
                studio: artifact.studio,
                artifact_type: artifact.artifact_type,
                title: artifact.title,
                tags: artifact.tags || [],
                payload: artifact.payload || {},
                meta: artifact.meta || {},
                outcome: artifact.outcome || null
            };

            const { data, error } = await client
                .from(TABLE_NAME)
                .insert(record)
                .select()
                .single();

            if (error) throw error;

            // Mark local copy as synced
            markLocalAsSynced(localId, data.id);

            return {
                success: true,
                id: data.id,
                source: 'supabase',
                message: 'Saved successfully',
                data: data
            };
        } catch (e) {
            console.error('Supabase save failed:', e);
            return {
                success: true,
                id: localId,
                source: 'local',
                message: 'Saved locally (sync failed)',
                error: e.message
            };
        }
    }

    // ============================================
    // QUERY FUNCTIONS
    // ============================================
    
    async function getArtifacts(options = {}) {
        const {
            studio = null,
            artifact_type = null,
            limit = 50,
            offset = 0,
            orderBy = 'created_at',
            orderDir = 'desc'
        } = options;

        const client = getSupabase();
        const userId = await getCurrentUserId();
        
        if (!client || !userId) {
            // Return from local buffer
            let results = getLocalBuffer();
            if (studio) results = results.filter(a => a.studio === studio);
            if (artifact_type) results = results.filter(a => a.artifact_type === artifact_type);
            return { data: results.slice(offset, offset + limit), source: 'local' };
        }

        try {
            let query = client
                .from(TABLE_NAME)
                .select('*')
                .eq('user_id', userId)
                .order(orderBy, { ascending: orderDir === 'asc' })
                .range(offset, offset + limit - 1);

            if (studio) query = query.eq('studio', studio);
            if (artifact_type) query = query.eq('artifact_type', artifact_type);

            const { data, error } = await query;
            if (error) throw error;

            return { data: data || [], source: 'supabase' };
        } catch (e) {
            console.error('Query failed:', e);
            return { data: getLocalBuffer(), source: 'local', error: e.message };
        }
    }

    async function getArtifactById(id) {
        const client = getSupabase();
        
        if (!client) {
            const buffer = getLocalBuffer();
            return buffer.find(a => a._localId === id || a.id === id) || null;
        }

        try {
            const { data, error } = await client
                .from(TABLE_NAME)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            // Try local buffer
            const buffer = getLocalBuffer();
            return buffer.find(a => a._localId === id) || null;
        }
    }

    // ============================================
    // ANALYTICS QUERIES
    // ============================================
    
    async function getDiscoveryStats() {
        const client = getSupabase();
        const userId = await getCurrentUserId();
        
        if (!client || !userId) {
            return calculateLocalStats('discovery', 'call_snapshot');
        }

        try {
            const { data, error } = await client
                .from(TABLE_NAME)
                .select('outcome, payload, created_at')
                .eq('user_id', userId)
                .eq('studio', 'discovery')
                .eq('artifact_type', 'call_snapshot');

            if (error) throw error;

            return calculateStats(data || []);
        } catch (e) {
            console.error('Stats query failed:', e);
            return calculateLocalStats('discovery', 'call_snapshot');
        }
    }

    function calculateStats(artifacts) {
        const total = artifacts.length;
        const meetingsBooked = artifacts.filter(a => a.outcome === 'meeting_booked').length;
        const followUps = artifacts.filter(a => a.outcome === 'follow_up_pending').length;
        
        // Count worked items
        const workedItemCounts = {};
        artifacts.forEach(a => {
            const items = a.payload?.worked_items || [];
            items.forEach(item => {
                const key = typeof item === 'object' ? item.id : item;
                workedItemCounts[key] = (workedItemCounts[key] || 0) + 1;
            });
        });

        // Sort by frequency
        const topWorkedItems = Object.entries(workedItemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({ id, count }));

        // Category breakdown
        const byCategory = {};
        artifacts.forEach(a => {
            const cat = a.payload?.product_category || 'unknown';
            if (!byCategory[cat]) byCategory[cat] = { total: 0, advanced: 0 };
            byCategory[cat].total++;
            if (a.outcome === 'meeting_booked') byCategory[cat].advanced++;
        });

        return {
            total_calls: total,
            meetings_booked: meetingsBooked,
            follow_ups: followUps,
            advancement_rate: total > 0 ? Math.round((meetingsBooked / total) * 100) : 0,
            top_worked_items: topWorkedItems,
            by_category: byCategory
        };
    }

    function calculateLocalStats(studio, artifactType) {
        const buffer = getLocalBuffer()
            .filter(a => a.studio === studio && a.artifact_type === artifactType);
        return calculateStats(buffer);
    }

    // ============================================
    // EXPORT FUNCTIONS
    // ============================================
    
    function exportToCSV(artifacts, filename) {
        if (!artifacts || artifacts.length === 0) {
            console.warn('No artifacts to export');
            return;
        }

        // Flatten payload for CSV
        const rows = artifacts.map(a => ({
            id: a.id || a._localId,
            studio: a.studio,
            type: a.artifact_type,
            title: a.title,
            outcome: a.outcome || '',
            tags: (a.tags || []).join('; '),
            created_at: a.created_at || a._savedAt,
            ...flattenPayload(a.payload)
        }));

        const headers = Object.keys(rows[0]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => 
                headers.map(h => {
                    const val = row[h];
                    if (val === null || val === undefined) return '';
                    const str = String(val).replace(/"/g, '""');
                    return str.includes(',') || str.includes('"') || str.includes('\n') 
                        ? `"${str}"` 
                        : str;
                }).join(',')
            )
        ].join('\n');

        downloadFile(csvContent, filename || 'export.csv', 'text/csv');
    }

    function exportToJSON(artifacts, filename) {
        const content = JSON.stringify(artifacts, null, 2);
        downloadFile(content, filename || 'export.json', 'application/json');
    }

    function exportToText(artifact, template) {
        // For single artifact export (recap packs, etc.)
        if (typeof template === 'function') {
            return template(artifact);
        }
        return formatArtifactAsText(artifact);
    }

    function formatArtifactAsText(artifact) {
        const lines = [];
        lines.push('=' .repeat(50));
        lines.push(artifact.title || 'Untitled');
        lines.push('=' .repeat(50));
        lines.push('');
        lines.push(`Studio: ${artifact.studio}`);
        lines.push(`Type: ${artifact.artifact_type}`);
        lines.push(`Date: ${new Date(artifact.created_at || artifact._savedAt).toLocaleString()}`);
        if (artifact.outcome) lines.push(`Outcome: ${artifact.outcome.replace(/_/g, ' ')}`);
        lines.push('');
        
        if (artifact.payload) {
            lines.push('-'.repeat(50));
            lines.push('DETAILS');
            lines.push('-'.repeat(50));
            Object.entries(artifact.payload).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    lines.push(`${formatKey(key)}:`);
                    value.forEach(v => {
                        if (typeof v === 'object') {
                            lines.push(`  • ${v.text || v.label || JSON.stringify(v)}`);
                        } else {
                            lines.push(`  • ${v}`);
                        }
                    });
                } else if (typeof value === 'object') {
                    lines.push(`${formatKey(key)}: ${JSON.stringify(value)}`);
                } else {
                    lines.push(`${formatKey(key)}: ${value}`);
                }
            });
        }
        
        lines.push('');
        lines.push('=' .repeat(50));
        return lines.join('\n');
    }

    function formatKey(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    function flattenPayload(payload, prefix = '') {
        const result = {};
        if (!payload) return result;
        
        Object.entries(payload).forEach(([key, value]) => {
            const newKey = prefix ? `${prefix}_${key}` : key;
            if (Array.isArray(value)) {
                result[newKey] = value.map(v => 
                    typeof v === 'object' ? (v.text || v.label || JSON.stringify(v)) : v
                ).join('; ');
            } else if (typeof value === 'object' && value !== null) {
                Object.assign(result, flattenPayload(value, newKey));
            } else {
                result[newKey] = value;
            }
        });
        
        return result;
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // ============================================
    // CLIPBOARD UTILITIES
    // ============================================
    
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true };
        } catch (e) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return { success: true };
            } catch (e2) {
                document.body.removeChild(textarea);
                return { success: false, error: e2.message };
            }
        }
    }

    // ============================================
    // DISCOVERY-SPECIFIC RECAP FORMATTER
    // ============================================
    
    function formatDiscoveryRecap(artifact) {
        const p = artifact.payload || {};
        const lines = [];
        
        // Header
        lines.push('📞 DISCOVERY CALL RECAP');
        lines.push('━'.repeat(40));
        lines.push('');
        
        // Basic info
        lines.push(`📅 Date: ${new Date(artifact.created_at || artifact._savedAt).toLocaleDateString()}`);
        if (p.prospect_linkedin) {
            lines.push(`👤 Prospect: ${p.prospect_linkedin}`);
        }
        lines.push(`📁 Framework: ${formatCategoryName(p.product_category)}`);
        lines.push(`🎯 Outcome: ${formatOutcome(artifact.outcome)}`);
        lines.push('');
        
        // Next step
        if (p.next_step) {
            lines.push('📍 NEXT STEP');
            lines.push('─'.repeat(40));
            lines.push(`Action: ${p.next_step}`);
            if (p.next_step_owner) lines.push(`Owner: ${p.next_step_owner}`);
            if (p.next_step_date) lines.push(`Due: ${p.next_step_date}`);
            lines.push('');
        }
        
        // What worked
        if (p.worked_items && p.worked_items.length > 0) {
            lines.push('✅ WHAT WORKED');
            lines.push('─'.repeat(40));
            p.worked_items.forEach(item => {
                const text = typeof item === 'object' ? (item.text || item.label) : item;
                lines.push(`• ${text}`);
            });
            lines.push('');
        }
        
        // Territories covered
        if (p.territories_covered && p.territories_covered.length > 0) {
            lines.push(`📊 Territories Covered: ${p.territories_covered.length}`);
            lines.push('');
        }
        
        // Notes
        if (p.notes && p.notes.length > 0) {
            lines.push('📝 SESSION NOTES');
            lines.push('─'.repeat(40));
            p.notes.forEach(note => {
                const text = typeof note === 'object' ? note.text : note;
                const time = note.timestamp ? ` (${note.timestamp})` : '';
                lines.push(`• ${text}${time}`);
            });
            lines.push('');
        }
        
        lines.push('━'.repeat(40));
        lines.push('Generated by Antaeus GTM OS');
        
        return lines.join('\n');
    }

    function formatCategoryName(category) {
        const names = {
            'cxai': 'CX AI / Support Automation',
            'cdp': 'Customer Data Platform',
            'legal': 'Legal AI',
            'revintel': 'Revenue Intelligence AI',
            'ai_objections': 'AI-Specific Objections'
        };
        return names[category] || category || 'Unknown';
    }

    function formatOutcome(outcome) {
        const names = {
            'meeting_booked': '✅ Meeting Booked',
            'follow_up_pending': '🔄 Follow-up Pending',
            'disqualified': '❌ Disqualified',
            'no_show': '⏰ No-show',
            'no_interest': '👋 No Interest',
            'converted': '🎉 Converted',
            'lost': '❌ Lost'
        };
        return names[outcome] || outcome || 'Not set';
    }

    // ============================================
    // DOCX-READY TEXT EXPORT
    // ============================================
    
    function exportAsDocxReadyText(artifact, filename) {
        // This outputs clean text that pastes perfectly into Word/Docs
        const content = formatDiscoveryRecap(artifact);
        downloadFile(content, filename || 'recap.txt', 'text/plain');
    }

    // ============================================
    // UPDATE OUTCOME
    // ============================================
    
    async function updateOutcome(artifactId, outcome) {
        const client = getSupabase();
        
        if (!client) {
            // Update local
            const buffer = getLocalBuffer();
            const item = buffer.find(a => a._localId === artifactId || a.id === artifactId);
            if (item) {
                item.outcome = outcome;
                item.outcome_updated_at = new Date().toISOString();
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(buffer));
            }
            return { success: true, source: 'local' };
        }

        try {
            const { data, error } = await client
                .from(TABLE_NAME)
                .update({ 
                    outcome: outcome,
                    outcome_updated_at: new Date().toISOString()
                })
                .eq('id', artifactId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data: data };
        } catch (e) {
            console.error('Update failed:', e);
            return { success: false, error: e.message };
        }
    }

    // ============================================
    // TOAST NOTIFICATION HELPER
    // ============================================
    
    function showToast(message, type = 'success') {
        // Remove existing toast
        const existing = document.querySelector('.artifact-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'artifact-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            ${type === 'success' 
                ? 'background: rgba(34, 197, 94, 0.9); color: white;' 
                : type === 'error'
                ? 'background: rgba(239, 68, 68, 0.9); color: white;'
                : 'background: rgba(59, 130, 246, 0.9); color: white;'}
        `;
        toast.textContent = message;
        
        // Add animation keyframes if not present
        if (!document.querySelector('#artifact-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'artifact-toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // PUBLIC API
    // ============================================
    
    const ArtifactStore = {
        // Core
        save: saveArtifact,
        get: getArtifacts,
        getById: getArtifactById,
        updateOutcome: updateOutcome,
        
        // Analytics
        getDiscoveryStats: getDiscoveryStats,
        
        // Export
        exportCSV: exportToCSV,
        exportJSON: exportToJSON,
        exportText: exportToText,
        exportDocxReady: exportAsDocxReadyText,
        
        // Clipboard
        copy: copyToClipboard,
        
        // Formatters
        formatDiscoveryRecap: formatDiscoveryRecap,
        formatCategoryName: formatCategoryName,
        formatOutcome: formatOutcome,
        
        // UI
        toast: showToast,
        
        // Utils
        getCurrentUserId: getCurrentUserId
    };

    // Expose globally
    if (typeof global !== 'undefined') {
        global.ArtifactStore = ArtifactStore;
    }
    if (typeof window !== 'undefined') {
        window.ArtifactStore = ArtifactStore;
    }

})(typeof window !== 'undefined' ? window : this);
