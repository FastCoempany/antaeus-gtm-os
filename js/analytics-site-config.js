(function () {
    'use strict';

    // Set your live GA4 Measurement ID here after creating the property.
    // Example: window.GTMOS_GA4_ID = 'G-ABC123XYZ9';
    window.GTMOS_GA4_ID = window.GTMOS_GA4_ID || 'G-51MNQDJGLY';
    window.GTMOS_GA4_DEBUG = window.GTMOS_GA4_DEBUG || false;

    // Optional PostHog mirror.
    window.GTMOS_POSTHOG_KEY = window.GTMOS_POSTHOG_KEY || '';
    window.GTMOS_POSTHOG_HOST = window.GTMOS_POSTHOG_HOST || 'https://us.i.posthog.com';

    // Shared UTM presets for manual distribution.
    window.GTMOS_UTM_PRESETS = window.GTMOS_UTM_PRESETS || {
        twitter: { source: 'twitter', medium: 'social' },
        newsletter: { source: 'newsletter', medium: 'email' },
        producthunt: { source: 'producthunt', medium: 'launch' },
        indiehackers: { source: 'indiehackers', medium: 'community' },
        coldemail: { source: 'coldemail', medium: 'email' },
        reddit: { source: 'reddit', medium: 'community' },
        slack: { source: 'slack', medium: 'community' },
        demo: { source: 'demo', medium: 'product' }
    };
})();

