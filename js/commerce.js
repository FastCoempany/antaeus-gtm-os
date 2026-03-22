(function () {
    'use strict';

    var config = window.GTMOS_COMMERCE || {};
    var storageKey = config.checkoutStorageKey || 'gtmos_checkout_url';

    function safeLocalStorageGet(key) {
        try { return localStorage.getItem(key) || ''; }
        catch (e) { return ''; }
    }

    function safeLocalStorageSet(key, value) {
        try { localStorage.setItem(key, value || ''); } catch (e) { /* ignore */ }
    }

    function normalizeUrl(pathOrUrl) {
        try { return new URL(pathOrUrl, window.location.origin).toString(); }
        catch (e) { return ''; }
    }

    function getCheckoutUrl() {
        var configured = (window.GTMOS_COMMERCE && window.GTMOS_COMMERCE.checkoutUrl) || '';
        var persisted = safeLocalStorageGet(storageKey);
        return String(configured || persisted || '').trim();
    }

    function getMeta() {
        var currentConfig = window.GTMOS_COMMERCE || {};
        return {
            planName: currentConfig.planName || 'Antaeus GTM OS',
            priceLabel: currentConfig.priceLabel || '$299/year',
            billingLabel: currentConfig.billingLabel || '',
            supportEmail: currentConfig.supportEmail || '',
            checkoutUrl: getCheckoutUrl(),
            hasCheckoutUrl: !!getCheckoutUrl(),
            successUrl: normalizeUrl(currentConfig.successPath || '/purchase/success/'),
            cancelUrl: normalizeUrl(currentConfig.cancelPath || '/purchase/cancelled/')
        };
    }

    function setCheckoutUrl(url) {
        var next = String(url || '').trim();
        safeLocalStorageSet(storageKey, next);
        return getMeta();
    }

    window.gtmCommerce = {
        getMeta: getMeta,
        getCheckoutUrl: getCheckoutUrl,
        hasCheckoutUrl: function () { return !!getCheckoutUrl(); },
        setCheckoutUrl: setCheckoutUrl
    };
})();
