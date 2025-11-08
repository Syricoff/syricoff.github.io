(function () {
    const html = document.documentElement;
    const body = document.body;
    const toggle = document.querySelector('.mode-toggle');
    const header = document.querySelector('.site-header');
    const navToggle = document.querySelector('.nav-toggle');
    const primaryNav = document.querySelector('.primary-nav');
    const navChips = document.querySelectorAll('.nav-chip');
    const sections = document.querySelectorAll('.page-section');
    const STORAGE_KEY = 'syricoff-theme';
    const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

    const getSystemTheme = () => {
        return prefersColorScheme.matches ? 'theme-dark' : 'theme-light';
    };

    const getCurrentTheme = () => {
        if (html.classList.contains('theme-dark')) return 'theme-dark';
        if (html.classList.contains('theme-light')) return 'theme-light';
        return null;
    };

    const setTheme = (mode) => {
        html.classList.remove('theme-light', 'theme-dark');
        if (mode === 'auto') {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            html.classList.add(mode);
            localStorage.setItem(STORAGE_KEY, mode);
        }
    };

    const initTheme = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setTheme(saved);
        } else {
            html.classList.remove('theme-light', 'theme-dark');
        }
    };

    initTheme();

    prefersColorScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            html.classList.remove('theme-light', 'theme-dark');
        }
    });

    if (toggle) {
        toggle.addEventListener('click', () => {
            const current = getCurrentTheme();
            const system = getSystemTheme();

            if (!current) {
                const next = system === 'theme-dark' ? 'theme-light' : 'theme-dark';
                setTheme(next);
            } else if (current === 'theme-light') {
                setTheme('theme-dark');
            } else {
                setTheme('theme-light');
            }
        });
    }

    const closeNav = () => {
        if (header) {
            header.classList.remove('site-header--nav-open');
        }
        body.classList.remove('nav-open');
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', 'false');
        }
    };

    if (navToggle && primaryNav && header) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';

            if (isExpanded) {
                closeNav();
            } else {
                header.classList.add('site-header--nav-open');
                body.classList.add('nav-open');
                navToggle.setAttribute('aria-expanded', 'true');
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeNav();
            }
        });
    }

    if (navChips.length) {
        navChips.forEach((chip) => {
            chip.addEventListener('click', () => {
                closeNav();
            });
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeNav();
        }
    });

    document.addEventListener('click', (event) => {
        if (!header || !header.classList.contains('site-header--nav-open')) {
            return;
        }

        if (primaryNav && primaryNav.contains(event.target)) {
            return;
        }

        if (navToggle && navToggle.contains(event.target)) {
            return;
        }

        closeNav();
    });

    let activeHash = null;

    const setActiveChip = (hash, manageHistory = false) => {
        if (!hash) {
            return;
        }

        const normalizedHash = hash === '#' || hash === '' ? '#top' : hash;

        if (normalizedHash === activeHash) {
            return;
        }

        const targetChip = Array.from(navChips).find((chip) => chip.hash === normalizedHash);

        if (!targetChip) {
            return;
        }

        navChips.forEach((chip) => chip.removeAttribute('aria-current'));
        targetChip.setAttribute('aria-current', 'page');
        activeHash = normalizedHash;

        if (manageHistory && history.replaceState) {
            history.replaceState(null, '', `${window.location.pathname}${normalizedHash === '#top' ? '' : normalizedHash}`);
        }
    };

    const updateActiveNav = () => {
        setActiveChip(window.location.hash || '#top');
    };

    if (navChips.length) {
        window.addEventListener('hashchange', updateActiveNav);
        window.addEventListener('load', updateActiveNav);
        updateActiveNav();
    }

    if (sections.length && navChips.length) {
        let ticking = false;

        const syncActiveFromScroll = () => {
            if (!sections.length) {
                return;
            }

            const offset = (header ? header.offsetHeight : 0) + 24;
            const scrollPos = window.scrollY + offset;
            let currentSection = sections[0];

            sections.forEach((section) => {
                const top = section.offsetTop;
                const bottom = top + section.offsetHeight;

                if (scrollPos >= top && scrollPos < bottom) {
                    currentSection = section;
                }
            });

            if (currentSection) {
                setActiveChip(`#${currentSection.id}`, true);
            }
        };

        const onScroll = () => {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(() => {
                syncActiveFromScroll();
                ticking = false;
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('load', syncActiveFromScroll);
        syncActiveFromScroll();
    }
})();
