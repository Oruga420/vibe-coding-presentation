/**
 * Presentation Engine — GSAP + Hash Routing
 * Keyboard nav, staggered reveals, dot sidebar, demo timer.
 */
(function () {
    'use strict';

    // ── DOM ──
    const track = document.getElementById('deck-track');
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('sidebar-dots');
    const sidebarFill = document.getElementById('sidebar-fill');
    const countCurrent = document.getElementById('count-current');
    const countTotal = document.getElementById('count-total');
    const totalSlides = slides.length;

    // ── State ──
    let current = 0;
    let isTransitioning = false;

    // ── Init ──
    function init() {
        countTotal.textContent = totalSlides;
        buildDots();
        // Read hash on load
        const hash = window.location.hash;
        const match = hash.match(/^#slide-(\d+)$/);
        if (match) {
            const idx = parseInt(match[1], 10) - 1;
            if (idx >= 0 && idx < totalSlides) current = idx;
        }
        goTo(current, true);
        setupKeyboard();
        setupWheel();
        setupTouch();
        setupHashChange();
        setupThemeToggle();
    }

    // ── Dots ──
    function buildDots() {
        slides.forEach((s, i) => {
            const dot = document.createElement('button');
            dot.className = 'sidebar__dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            const tip = document.createElement('span');
            tip.className = 'sidebar__dot-tip';
            tip.textContent = s.dataset.title || `Slide ${i + 1}`;
            dot.appendChild(tip);
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        });
    }

    // ── Navigate ──
    let lastAnimated = -1;

    function goTo(index, instant) {
        if (!instant && isTransitioning) return;
        if (index < 0 || index >= totalSlides) return;
        if (index === current && !instant) return;

        isTransitioning = true;
        const prev = current;
        current = index;
        lastAnimated = -1;

        // Animate out previous slide
        if (!instant && slides[prev]) {
            animateOut(slides[prev]);
        }

        // Move track
        const duration = instant ? 0 : 0.85;
        gsap.to(track, {
            x: `-${current * 100}%`,
            duration,
            ease: 'expo.out',
            onComplete: () => {
                if (lastAnimated !== current) {
                    lastAnimated = current;
                    animateIn(slides[current]);
                }
                isTransitioning = false;
            }
        });

        // Update URL hash
        history.replaceState(null, '', `#slide-${current + 1}`);

        // Update counter
        countCurrent.textContent = current + 1;

        // Update dots
        const dots = dotsContainer.querySelectorAll('.sidebar__dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === current));

        // Update progress line
        const progress = totalSlides > 1 ? current / (totalSlides - 1) : 0;
        sidebarFill.style.height = `${progress * 100}%`;

        // Slide 5 specific — darken bg, start timer
        handleSlide5(current === 4);

        if (instant) {
            // On instant load, immediately show elements
            lastAnimated = current;
            animateIn(slides[current]);
            isTransitioning = false;
        }
    }

    // ── GSAP Animations ──
    function animateIn(slide) {
        // Clear any previous animations on this slide
        const elements = slide.querySelectorAll('[data-animate]');
        elements.forEach(el => {
            gsap.killTweensOf(el);
        });

        // Title animations — clip / reveal
        const titles = slide.querySelectorAll('[data-animate="title"]');
        gsap.fromTo(titles,
            { opacity: 0, y: 40, skewY: 2 },
            { opacity: 1, y: 0, skewY: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1 }
        );

        // Fade animations
        const fades = slide.querySelectorAll('[data-animate="fade"]');
        gsap.fromTo(fades,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.25, stagger: 0.12 }
        );

        // Stagger list items
        const staggers = slide.querySelectorAll('[data-animate="stagger"]');
        gsap.fromTo(staggers,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out', delay: 0.35, stagger: 0.1 }
        );
    }

    function animateOut(slide) {
        const elements = slide.querySelectorAll('[data-animate]');
        gsap.to(elements, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in'
        });
    }

    // ── Keyboard ──
    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowRight': case 'ArrowDown': case ' ':
                    e.preventDefault(); goTo(current + 1); break;
                case 'ArrowLeft': case 'ArrowUp':
                    e.preventDefault(); goTo(current - 1); break;
                case 'Home':
                    e.preventDefault(); goTo(0); break;
                case 'End':
                    e.preventDefault(); goTo(totalSlides - 1); break;
                case 'f': case 'F':
                    toggleFullscreen(); break;
            }
        });
    }

    // ── Mouse Wheel ──
    function setupWheel() {
        let wheelCooldown = false;
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (wheelCooldown) return;
            wheelCooldown = true;
            setTimeout(() => wheelCooldown = false, 900);
            if (e.deltaY > 0 || e.deltaX > 0) goTo(current + 1);
            else goTo(current - 1);
        }, { passive: false });
    }

    // ── Touch / Swipe ──
    function setupTouch() {
        let startX = 0;
        document.addEventListener('touchstart', (e) => {
            startX = e.changedTouches[0].screenX;
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            const diff = startX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 60) {
                diff > 0 ? goTo(current + 1) : goTo(current - 1);
            }
        }, { passive: true });
    }

    // ── Hash Change ──
    function setupHashChange() {
        window.addEventListener('hashchange', () => {
            const m = window.location.hash.match(/^#slide-(\d+)$/);
            if (m) {
                const idx = parseInt(m[1], 10) - 1;
                if (idx >= 0 && idx < totalSlides && idx !== current) goTo(idx);
            }
        });
    }

    // ── Fullscreen ──
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen();
        }
    }

    // ── Slide 5: Demo mode (Digital Clock) ──
    let timerInterval = null;
    const digitEls = {
        m1: document.getElementById('timer-m1'),
        m2: document.getElementById('timer-m2'),
        s1: document.getElementById('timer-s1'),
        s2: document.getElementById('timer-s2')
    };

    function handleSlide5(active) {
        if (!digitEls.m1) return;

        if (active && !timerInterval) {
            let seconds = 20 * 60; // 20 min
            updateDigits(seconds);
            timerInterval = setInterval(() => {
                seconds--;
                if (seconds <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    seconds = 0;
                }
                updateDigits(seconds);
            }, 1000);
        } else if (!active && timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateDigits(totalSec) {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        const digits = {
            m1: String(Math.floor(m / 10)),
            m2: String(m % 10),
            s1: String(Math.floor(s / 10)),
            s2: String(s % 10)
        };
        for (const key in digits) {
            const el = digitEls[key];
            if (el && el.textContent !== digits[key]) {
                el.textContent = digits[key];
                el.classList.remove('flip');
                void el.offsetWidth; // force reflow
                el.classList.add('flip');
            }
        }
    }

    // ── Theme Toggle ──
    function setupThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        // Load saved theme
        const saved = localStorage.getItem('deck-theme');
        if (saved === 'light') applyTheme('light');

        toggle.addEventListener('click', () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            applyTheme(isLight ? 'dark' : 'light');
        });
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('deck-theme', 'light');
            // Update Three.js bg
            if (window.threeBg) {
                window.threeBg.setTheme('light');
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('deck-theme', 'dark');
            if (window.threeBg) {
                window.threeBg.setTheme('dark');
            }
        }
    }

    // ── Start ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
