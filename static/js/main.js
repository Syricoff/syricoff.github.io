(function () {
    const body = document.body;
    const toggle = document.querySelector('.mode-toggle');
    const header = document.querySelector('.site-header');
    const navToggle = document.querySelector('.nav-toggle');
    const primaryNav = document.querySelector('.primary-nav');
    const navChips = document.querySelectorAll('.nav-chip');
    const sections = document.querySelectorAll('.page-section');
    const STORAGE_KEY = 'syricoff-theme';

    const setTheme = (mode) => {
        body.classList.remove('theme-light', 'theme-dark');
        body.classList.add(mode);
        localStorage.setItem(STORAGE_KEY, mode);
    };

    const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem(STORAGE_KEY);
    setTheme(saved || (preferDark ? 'theme-dark' : 'theme-light'));

    if (toggle) {
        toggle.addEventListener('click', () => {
            const next = body.classList.contains('theme-dark') ? 'theme-light' : 'theme-dark';
            setTheme(next);
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
