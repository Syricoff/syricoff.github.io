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

    // Navigation state management
    let activeHash = null;
    let isUserScrolling = true;
    let scrollTimeout = null;
    let isNavigating = false;

    const setActiveChip = (hash, updateHistory = false) => {
        if (!hash) return;

        const normalizedHash = hash === '#' || hash === '' ? '#top' : hash;

        if (normalizedHash === activeHash) return;

        const targetChip = Array.from(navChips).find((chip) => chip.hash === normalizedHash);
        if (!targetChip) return;

        navChips.forEach((chip) => chip.removeAttribute('aria-current'));
        targetChip.setAttribute('aria-current', 'page');
        activeHash = normalizedHash;

        if (updateHistory && history.replaceState) {
            history.replaceState(null, '', normalizedHash === '#top' ? window.location.pathname : normalizedHash);
        }
    };

    const updateNavFromHash = () => {
        const hash = window.location.hash || '#top';
        setActiveChip(hash, false);
    };

    const getSectionInView = () => {
        const headerHeight = header ? header.offsetHeight : 0;
        const scrollPos = window.scrollY + headerHeight + 100;

        // Check from bottom to top to prioritize sections higher on page when multiple are visible
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;

            if (scrollPos >= top && scrollPos < bottom) {
                return section;
            }
        }

        // If we're at the very top, return first section
        if (window.scrollY < 100) {
            return sections[0];
        }

        // If we're near the bottom, return last section
        const docHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        if (window.scrollY + windowHeight >= docHeight - 100) {
            return sections[sections.length - 1];
        }

        return sections[0];
    };

    const syncNavFromScroll = () => {
        if (isNavigating) return;

        const currentSection = getSectionInView();
        if (currentSection) {
            setActiveChip(`#${currentSection.id}`, true);
        }
    };

    // Handle manual scroll detection
    const onScroll = () => {
        isUserScrolling = true;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
            isNavigating = false;
        }, 150);

        requestAnimationFrame(syncNavFromScroll);
    };

    // Handle navigation clicks
    if (navChips.length) {
        navChips.forEach((chip) => {
            chip.addEventListener('click', (e) => {
                const targetHash = chip.hash;

                if (targetHash) {
                    isNavigating = true;
                    isUserScrolling = false;

                    // Update active state immediately
                    setActiveChip(targetHash, false);

                    // Let browser handle smooth scroll, then reset navigation flag
                    setTimeout(() => {
                        isNavigating = false;
                    }, 1000);
                }

                closeNav();
            });
        });

        // Handle browser back/forward buttons
        window.addEventListener('hashchange', () => {
            if (!isNavigating) {
                updateNavFromHash();
            }
        });

        // Initialize on load
        window.addEventListener('load', () => {
            updateNavFromHash();
            syncNavFromScroll();
        });

        updateNavFromHash();
    }

    // Attach scroll listener
    if (sections.length && navChips.length) {
        window.addEventListener('scroll', onScroll, { passive: true });

        // Initial sync
        requestAnimationFrame(syncNavFromScroll);
    }
})();
