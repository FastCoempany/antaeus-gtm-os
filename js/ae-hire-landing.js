/*
 * /should-we-hire-an-ae/ landing behavior (master spec §2, §27, §32).
 *
 * Everything here is progressive enhancement: with JS disabled, every CTA is
 * a plain link to #pricing and the FAQ is native <details>. Analytics are
 * best-effort and can never block checkout (spec §2.9).
 */
(function () {
  'use strict';

  var config = window.AE_HIRE_COMMERCE || {};

  function track(name, properties) {
    try {
      if (window.gtmAnalytics && typeof window.gtmAnalytics.track === 'function') {
        window.gtmAnalytics.track(name, properties || {});
      }
    } catch (error) {
      // Analytics failure must never affect the page or checkout.
    }
  }

  var notice = document.querySelector('[data-checkout-notice]');

  function scrollBehavior() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'auto';
    } catch (error) { /* fall through */ }
    return 'smooth';
  }

  function showNotice(message) {
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = false;
  }

  // Checkout that is not connected must be impossible to overlook (spec §2.9).
  // The banner is visible in the markup (so it shows without JS); it is hidden
  // only when a checkout endpoint is actually configured.
  var banner = document.querySelector('[data-checkout-unconfigured]');
  if (config.checkoutEndpoint) {
    if (banner) banner.hidden = true;
  } else if (window.console && console.warn) {
    console.warn('AE Hiring Brief checkout is not configured: window.AE_HIRE_COMMERCE.checkoutEndpoint is empty.');
  }

  var triggers = document.querySelectorAll('[data-ae-checkout]');
  // One checkout request at a time across every CTA on the page, so a
  // double-click or a second CTA can never create duplicate Stripe sessions.
  var checkoutPending = false;
  function setPending(pending) {
    checkoutPending = pending;
    Array.prototype.forEach.call(triggers, function (el) {
      if (pending) { el.setAttribute('aria-busy', 'true'); el.setAttribute('aria-disabled', 'true'); }
      else { el.removeAttribute('aria-busy'); el.removeAttribute('aria-disabled'); }
    });
  }

  function startCheckout(trigger) {
    if (checkoutPending) return;
    var zone = trigger.getAttribute('data-ae-checkout') || 'unknown';
    track('ae_checkout_click', { cta_zone: zone, product_code: config.productCode });

    if (!config.checkoutEndpoint) {
      showNotice('Checkout is not connected in this environment yet. Nothing was charged.');
      var pricing = document.getElementById('pricing');
      if (pricing && pricing.scrollIntoView) pricing.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      return;
    }

    setPending(true);
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeoutMs = typeof config.checkoutTimeoutMs === 'number' && config.checkoutTimeoutMs > 0 ? config.checkoutTimeoutMs : 15000;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, timeoutMs);
    fetch(config.checkoutEndpoint, {
      method: 'POST',
      signal: controller ? controller.signal : undefined,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_code: config.productCode,
        attribution: { cta_zone: zone, referrer: document.referrer || null, path: window.location.pathname + window.location.search }
      })
    }).then(function (response) {
      if (!response.ok) throw new Error('checkout_http_' + response.status);
      // The timer stays armed while the body is read, so a response that sends
      // headers and then stalls is aborted too.
      return response.json();
    }).then(function (body) {
      clearTimeout(timer);
      if (!body || typeof body.url !== 'string') throw new Error('checkout_missing_url');
      // Stay pending: the browser is leaving for Stripe.
      window.location.assign(body.url);
    }).catch(function (error) {
      clearTimeout(timer);
      setPending(false);
      track('checkout_error', { message: String(error && error.message || error) });
      showNotice('Checkout could not start. Nothing was charged. Please try again, or email ' + (config.supportEmail || 'us') + '.');
    });
  }

  Array.prototype.forEach.call(triggers, function (trigger) {
    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      startCheckout(trigger);
    });
  });

  // Funnel + diagnostics (spec §32).
  track('ae_page_view', { path: window.location.pathname });

  Array.prototype.forEach.call(document.querySelectorAll('[data-ae-sample-link]'), function (link) {
    link.addEventListener('click', function () { track('ae_sample_view', { source: 'link' }); });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.faq-row'), function (row) {
    row.addEventListener('toggle', function () {
      if (row.open) track('faq_open', { question: (row.querySelector('summary') || {}).textContent || '' });
    });
  });

  if ('IntersectionObserver' in window) {
    var seen = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        if (seen[id]) return;
        seen[id] = true;
        if (id === 'sample') track('ae_sample_view', { source: 'scroll' });
        if (id === 'pricing') track('pricing_seen', {});
      });
    }, { threshold: 0.35 });
    ['sample', 'pricing'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  var depths = { 50: false, 75: false };
  window.addEventListener('scroll', function () {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var pct = (window.scrollY / scrollable) * 100;
    [50, 75].forEach(function (mark) {
      if (!depths[mark] && pct >= mark) { depths[mark] = true; track('scroll_' + mark, {}); }
    });
  }, { passive: true });
})();
