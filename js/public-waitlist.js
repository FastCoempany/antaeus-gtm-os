(function () {
    'use strict';

    var SUPABASE_URL = 'https://wjdqmgxwulqxxxnyuzyl.supabase.co';
    var SUPABASE_ANON_KEY = 'sb_publishable_jJNFxW9cMGvv-cuqIxiZ2w_AOBkWZGm';
    var TABLE_NAME = 'waitlist_signups';

    var form = document.getElementById('captureForm');
    var input = document.getElementById('curiousEmail');
    var note = document.getElementById('captureNote');
    var button = form ? form.querySelector('.capture-button') : null;
    var pending = false;
    var client = null;

    if (!form || !input || !note || !button) return;

    function getClient() {
        if (client) return client;
        if (!window.supabase || !window.supabase.createClient) {
            throw new Error('Supabase client unavailable.');
        }
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
        return client;
    }

    function normalizeEmail(value) {
        return String(value || '').trim().toLowerCase();
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function setPending(next) {
        pending = !!next;
        input.disabled = pending;
        button.disabled = pending;
        button.textContent = pending ? '...' : 'nervous?';
    }

    function setNote(message) {
        note.textContent = String(message || '');
    }

    function track(name, props) {
        if (!window.gtmAnalytics || typeof window.gtmAnalytics.track !== 'function') return;
        window.gtmAnalytics.track(name, Object.assign({ stage: 'coming-soon' }, props || {}));
    }

    async function submitEmail(email) {
        var payload = {
            email: email,
            source: 'coming-soon',
            page_path: window.location.pathname || '/coming-soon.html',
            referrer: document.referrer || null,
            user_agent: navigator.userAgent || null,
            metadata: {
                href: window.location.href,
                title: document.title || '',
                captured_at: new Date().toISOString()
            }
        };

        return getClient().from(TABLE_NAME).insert(payload);
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (pending) return;

        var email = normalizeEmail(input.value);
        if (!isValidEmail(email)) {
            setNote('use a real email.');
            input.focus();
            return;
        }

        setPending(true);
        setNote('');

        try {
            var response = await submitEmail(email);
            var error = response && response.error ? response.error : null;

            if (error) {
                var message = String(error.message || error.details || error.hint || '');
                if (/duplicate key|already exists|unique/i.test(message)) {
                    try {
                        window.localStorage.setItem('antaeus_interest_capture', email);
                    } catch (e) {}
                    setNote('already on it.');
                    track('waitlist_duplicate', { source: 'coming-soon' });
                    return;
                }

                setNote('noted? not yet. try again.');
                track('waitlist_failed', { source: 'coming-soon', error: message || 'unknown' });
                return;
            }

            try {
                window.localStorage.setItem('antaeus_interest_capture', email);
            } catch (e) {}

            input.value = '';
            setNote('you are on it.');
            track('waitlist_joined', { source: 'coming-soon' });
        } catch (error) {
            setNote('noted? not yet. try again.');
            track('waitlist_failed', { source: 'coming-soon', error: error && error.message ? error.message : 'unknown' });
        } finally {
            setPending(false);
        }
    });
})();
