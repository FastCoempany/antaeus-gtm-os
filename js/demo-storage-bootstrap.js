(function(window) {
    'use strict';

    if (window.gtmDemoStorageBootstrap) return;

    var MODE_KEY = 'gtmos_env_mode';
    var DEMO_PREFIX = 'gtmos_demo__';
    var storageProto = window.Storage && window.Storage.prototype;
    var rawGetItem = storageProto && storageProto.getItem;
    var rawSetItem = storageProto && storageProto.setItem;
    var rawRemoveItem = storageProto && storageProto.removeItem;
    var rawKey = storageProto && storageProto.key;
    var rawClear = storageProto && storageProto.clear;

    function safeGetSessionMode() {
        try {
            return sessionStorage.getItem(MODE_KEY) || 'prod';
        } catch (e) {
            return 'prod';
        }
    }

    function safeSetSessionMode(mode) {
        try {
            sessionStorage.setItem(MODE_KEY, mode === 'demo' ? 'demo' : 'prod');
        } catch (e) {}
    }

    function syncModeFromSearch(search) {
        try {
            var params = new URLSearchParams(search || window.location.search || '');
            var demoParam = String(params.get('demo') || '').toLowerCase();
            if (demoParam === '1' || demoParam === 'true') {
                safeSetSessionMode('demo');
            } else if (demoParam === '0' || demoParam === 'false') {
                safeSetSessionMode('prod');
            }
        } catch (e) {}
    }

    function isDemoStorageMode() {
        return safeGetSessionMode() === 'demo';
    }

    function shouldPatch(storageObj) {
        return storageObj === window.localStorage && isDemoStorageMode();
    }

    function mapKey(key) {
        var next = String(key || '');
        if (next.indexOf('gtmos_') !== 0) return next;
        if (next.indexOf(DEMO_PREFIX) === 0) return next;
        return DEMO_PREFIX + next;
    }

    function patchStoragePrototype() {
        if (!storageProto || storageProto.__gtmosDemoStoragePatch) return;
        storageProto.__gtmosDemoStoragePatch = true;

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
                if (storageKey && storageKey.indexOf(DEMO_PREFIX) === 0) {
                    demoKeys.push(storageKey.slice(DEMO_PREFIX.length));
                }
            }
            return demoKeys[index] || null;
        };

        storageProto.clear = function() {
            if (!shouldPatch(this)) return rawClear.call(this);
            purgeDemoNamespace();
        };
    }

    function enumerateRawDemoKeys() {
        var keys = [];
        if (!window.localStorage || !rawKey) return keys;
        for (var i = 0; i < window.localStorage.length; i++) {
            var storageKey = rawKey.call(window.localStorage, i);
            if (storageKey && storageKey.indexOf(DEMO_PREFIX) === 0) {
                keys.push(storageKey);
            }
        }
        return keys;
    }

    function purgeDemoNamespace() {
        if (!window.localStorage || !rawRemoveItem) return 0;
        var keys = enumerateRawDemoKeys();
        keys.forEach(function(storageKey) {
            rawRemoveItem.call(window.localStorage, storageKey);
        });
        return keys.length;
    }

    function countVisibleGtmKeys() {
        var count = 0;
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.indexOf('gtmos_') === 0) count++;
            }
        } catch (e) {}
        return count;
    }

    function bootstrapEnvironmentMode(options) {
        options = options || {};

        if (options.forceMode === 'demo' || options.forceMode === 'prod') {
            safeSetSessionMode(options.forceMode);
        } else {
            syncModeFromSearch(options.search);
        }

        patchStoragePrototype();

        var isDemo = safeGetSessionMode() === 'demo';
        window.__gtmosEnvBootstrapped = true;
        window.gtmEnvironment = {
            mode: isDemo ? 'demo' : 'prod',
            isDemo: isDemo
        };
        return window.gtmEnvironment;
    }

    window.gtmDemoStorageBootstrap = {
        MODE_KEY: MODE_KEY,
        DEMO_PREFIX: DEMO_PREFIX,
        bootstrapEnvironmentMode: bootstrapEnvironmentMode,
        purgeDemoNamespace: purgeDemoNamespace,
        countVisibleGtmKeys: countVisibleGtmKeys,
        isDemoStorageMode: isDemoStorageMode,
        mapKey: mapKey
    };
})(window);
