/**
 * Tour Guide System — Antaeus GTM OS v27 Phase 1
 * Updated for consolidated module navigation
 */

const TourGuide = {
    steps: [
        {
            target: '.sidebar-logo',
            title: 'Welcome to Antaeus GTM OS',
            text: 'Everything you do here builds toward one output: a system your first hire can run from day one. Let me show you how it works.',
            position: 'right'
        },
        {
            target: '[data-nav="dashboard"]',
            title: 'Command Center',
            text: 'Start every session here. Pipeline health, win/loss patterns, and whether you\'re on track to hit your number.',
            position: 'right'
        },
        {
            target: '[data-nav="readiness"]',
            title: 'Readiness Score',
            text: 'The question you\'re building toward: is your GTM foundationally sound? This score tracks your progress across every module.',
            position: 'right'
        },
        {
            target: '[data-nav="icp-studio"]',
            title: 'ICP Studio',
            text: 'Define who you sell to. Build ICPs, browse your saved profiles, and track what\'s converting. Every outbound angle starts here.',
            position: 'right'
        },
        {
            target: '[data-nav="quota-workback"]',
            title: 'Quota Workback',
            text: 'Work backwards from your number. How many touches, meetings, and deals you need each week.',
            position: 'right'
        },
        {
            target: '[data-nav="outbound-studio"]',
            title: 'Outbound Studio',
            text: 'Your weekly targets from quota math plus signal-based outreach angles. Volume meets precision.',
            position: 'right'
        },
        {
            target: '[data-nav="discovery-agenda"]',
            title: 'Call Planner → Discovery Frameworks',
            text: 'Two modes: plan the call beforehand with the Call Planner, then hit Start Call to run it live with guided discovery.',
            position: 'right'
        },
        {
            target: '[data-nav="deal-workspace"]',
            title: 'Deal Workspace',
            text: 'Your deals, qualification reviews, and account plans — all in one place. Score deals, map stakeholders, and capture outcomes.',
            position: 'right'
        },
        {
            target: '[data-nav="discovery-studio"]',
            title: 'CFO Negotiation',
            text: 'When you\'re in the room with finance. Tested scripts for every procurement objection territory.',
            position: 'right'
        },
        {
            target: '[data-nav="founding-gtm"]',
            title: 'GTM Playbook',
            text: 'The document your first hire reads on day one. Auto-assembles from your selling activity across every module.',
            position: 'right'
        },
        {
            target: '.user-menu',
            title: 'You\'re Set',
            text: 'Click the tour button anytime to see this again. Start at the Command Center and work your way down.',
            position: 'top'
        }
    ],
    
    currentStep: 0,
    isActive: false,

    hasSeenTour() {
        if (window.gtmLocalState && typeof window.gtmLocalState.get === 'function') {
            return window.gtmLocalState.get('gtmos_tour_completed', null, { scope: 'user' }) === 'true';
        }
        return localStorage.getItem('gtmos_tour_completed') === 'true';
    },

    markSeen() {
        if (window.gtmLocalState && typeof window.gtmLocalState.set === 'function') {
            window.gtmLocalState.set('gtmos_tour_completed', 'true', { scope: 'user' });
            return;
        }
        localStorage.setItem('gtmos_tour_completed', 'true');
    },
    
    init() {
        if (!this.hasSeenTour()) {
            setTimeout(() => this.start(), 1000);
        }
        this.addTourButton();
    },
    
    addTourButton() {
        const footer = document.querySelector('.sidebar-footer');
        if (!footer) return;
        if (footer.querySelector('.nav-tour-btn, [data-tour-button]')) return;
        
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost btn-sm btn-block mt-sm';
        btn.setAttribute('data-tour-button', 'true');
        btn.textContent = 'Tour the App';
        btn.onclick = () => this.start();
        footer.appendChild(btn);
    },
    
    start() {
        this.currentStep = 0;
        this.isActive = true;
        this.createOverlay();
        this.showStep();
        if (window.gtmAnalytics) gtmAnalytics.track('tour_started');
    },
    
    createOverlay() {
        document.querySelectorAll('.tour-overlay, .tour-tooltip').forEach(el => el.remove());
        
        const overlay = document.createElement('div');
        overlay.className = 'tour-overlay active';
        overlay.onclick = (e) => {
            if (e.target === overlay) this.end();
        };
        document.body.appendChild(overlay);
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tour-tooltip';
        tooltip.id = 'tourTooltip';
        document.body.appendChild(tooltip);
    },
    
    showStep() {
        const step = this.steps[this.currentStep];
        if (!step) {
            this.end();
            return;
        }
        
        const target = document.querySelector(step.target);
        const tooltip = document.getElementById('tourTooltip');
        
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
        
        if (target) {
            target.classList.add('tour-highlight');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        tooltip.innerHTML = `
            <div class="tour-tooltip-title">${step.title}</div>
            <div class="tour-tooltip-text">${step.text}</div>
            <div class="tour-tooltip-actions">
                <span class="tour-progress">${this.currentStep + 1} / ${this.steps.length}</span>
                <div style="display: flex; gap: var(--space-sm);">
                    <button class="btn btn-ghost btn-sm" onclick="TourGuide.end()">Skip</button>
                    <button class="btn btn-primary btn-sm" onclick="TourGuide.next()">${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}</button>
                </div>
            </div>
        `;
        
        if (target) {
            const rect = target.getBoundingClientRect();
            let top, left;
            
            switch(step.position) {
                case 'right':
                    top = rect.top + window.scrollY;
                    left = rect.right + 20;
                    break;
                case 'top':
                    top = rect.top + window.scrollY - 200;
                    left = rect.left;
                    break;
                case 'bottom':
                    top = rect.bottom + window.scrollY + 20;
                    left = rect.left;
                    break;
                default:
                    top = rect.top + window.scrollY;
                    left = rect.right + 20;
            }
            
            if (left + 360 > window.innerWidth) left = window.innerWidth - 380;
            if (left < 280) left = 280;
            
            tooltip.style.top = Math.max(20, top) + 'px';
            tooltip.style.left = left + 'px';
            tooltip.style.transform = '';
        } else {
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
        }
        
        tooltip.classList.add('active');
    },
    
    next() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.end();
        } else {
            this.showStep();
        }
    },
    
    end() {
        this.isActive = false;
        this.markSeen();
        if (window.gtmAnalytics) gtmAnalytics.track('tour_completed', { steps_seen: this.currentStep + 1 });
        
        document.querySelectorAll('.tour-overlay, .tour-tooltip').forEach(el => el.remove());
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TourGuide.init());
} else {
    TourGuide.init();
}
