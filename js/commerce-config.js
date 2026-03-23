(function () {
    'use strict';

    var existing = window.GTMOS_COMMERCE || {};

    window.GTMOS_COMMERCE = Object.assign({
        planName: 'Antaeus GTM OS',
        priceLabel: '$299/year',
        billingLabel: '$25/mo equivalent billed annually',
        checkoutUrl: '',
        checkoutStorageKey: 'gtmos_checkout_url',
        supportEmail: 'hello@antaeus.app',
        successPath: '/purchase/success/',
        cancelPath: '/purchase/cancelled/'
    }, existing);
})();
