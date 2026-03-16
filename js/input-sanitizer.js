/**
 * Phase 11.2 input sanitization utility.
 *
 * Exposes:
 *   - window.sanitizeInput(str, options)
 *   - window.gtmInputSanitizer.sanitizeField(fieldName, value)
 *
 * Also patches localStorage/sessionStorage setItem for gtmos_* keys so
 * string payloads are sanitized before persistence.
 */
(function () {
    'use strict';

    function stripHtmlTags(value) {
        return String(value).replace(/<[^>]*>/g, '');
    }

    function inferMaxLength(fieldName) {
        var key = String(fieldName || '').toLowerCase();
        if (!key) return 2000;

        // Notes and long-form detail fields.
        if (/(^|_)(notes?|detail|journal|history|log)(_|$)/.test(key)) return 5000;

        // Company/name-like fields.
        if (/(company|account|name|buyer|champion|persona|title|industry|geo|owner|role)/.test(key)) return 100;

        // Default long text fields.
        return 2000;
    }

    function sanitizeInput(value, options) {
        if (value === null || value === undefined) return '';
        var maxLength = options && typeof options.maxLength === 'number'
            ? options.maxLength
            : 2000;
        var cleaned = stripHtmlTags(value).trim();
        if (cleaned.length > maxLength) cleaned = cleaned.slice(0, maxLength);
        return cleaned;
    }

    function sanitizeByField(fieldName, value) {
        return sanitizeInput(value, { maxLength: inferMaxLength(fieldName) });
    }

    function sanitizeStructured(value, path) {
        if (Array.isArray(value)) {
            return value.map(function (item, idx) {
                return sanitizeStructured(item, path.concat(String(idx)));
            });
        }
        if (value && typeof value === 'object') {
            var out = {};
            Object.keys(value).forEach(function (key) {
                out[key] = sanitizeStructured(value[key], path.concat(key));
            });
            return out;
        }
        if (typeof value === 'string') {
            var leaf = path.length ? path[path.length - 1] : '';
            return sanitizeByField(leaf, value);
        }
        return value;
    }

    function maybeSanitizeJsonString(rawValue) {
        if (typeof rawValue !== 'string') return rawValue;
        var trimmed = rawValue.trim();
        var looksJson = (
            (trimmed.charAt(0) === '{' && trimmed.charAt(trimmed.length - 1) === '}') ||
            (trimmed.charAt(0) === '[' && trimmed.charAt(trimmed.length - 1) === ']')
        );
        if (!looksJson) return null;

        try {
            var parsed = JSON.parse(rawValue);
            var sanitized = sanitizeStructured(parsed, []);
            return JSON.stringify(sanitized);
        } catch (e) {
            return null;
        }
    }

    function sanitizeStoragePayload(key, rawValue) {
        if (typeof rawValue !== 'string') return rawValue;

        var jsonSanitized = maybeSanitizeJsonString(rawValue);
        if (jsonSanitized !== null) return jsonSanitized;

        return sanitizeByField(key, rawValue);
    }

    function patchStorageSetItem() {
        if (window.__gtmosStorageSanitizerPatched) return;
        if (typeof Storage === 'undefined' || !Storage.prototype) return;

        var rawSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
            var finalValue = value;
            try {
                if (typeof key === 'string' && key.indexOf('gtmos_') === 0) {
                    finalValue = sanitizeStoragePayload(key, value);
                }
            } catch (e) {
                console.warn('input-sanitizer: storage sanitize failed for key', key, e);
                finalValue = value;
            }
            return rawSetItem.call(this, key, finalValue);
        };

        window.__gtmosStorageSanitizerPatched = true;
    }

    patchStorageSetItem();

    window.sanitizeInput = sanitizeInput;
    window.gtmInputSanitizer = {
        sanitizeInput: sanitizeInput,
        sanitizeField: sanitizeByField,
        sanitizeStructured: function (value) { return sanitizeStructured(value, []); },
        sanitizeStoragePayload: sanitizeStoragePayload
    };
})();

