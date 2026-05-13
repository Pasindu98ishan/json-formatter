document.addEventListener('DOMContentLoaded', function () {
    var hamburger = document.querySelector('.nav-hamburger');
    var navLinks = document.querySelector('.nav-links');
    if (!hamburger || !navLinks) return;

    // — Hamburger (mobile menu) —
    hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = navLinks.classList.toggle('nav-open');
        hamburger.setAttribute('aria-expanded', isOpen);
        hamburger.classList.toggle('is-open', isOpen);
    });

    // Close mobile menu when a nav link is tapped
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('nav-open');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.classList.remove('is-open');
        });
    });

    // Shared helper: close every dropdown except `active` (pass null to close all).
    // Also blurs any focused element inside closed dropdowns so :focus-within
    // does not keep a menu visible after .open is removed.
    function closeOthers(active) {
        document.querySelectorAll('.nav-dropdown').forEach(function (d) {
            if (d === active) return;
            d.classList.remove('open');
            d.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
            var focused = d.querySelector(':focus');
            if (focused) focused.blur();
        });
    }

    // — Desktop hover with 150 ms grace period —
    // (hover: hover) excludes touch devices so mobile click-only behaviour is unchanged.
    if (window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
            var closeTimer;

            dropdown.addEventListener('mouseenter', function () {
                clearTimeout(closeTimer);
                closeOthers(dropdown);
                dropdown.classList.add('open');
                dropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'true');
            });

            dropdown.addEventListener('mouseleave', function () {
                closeTimer = setTimeout(function () {
                    dropdown.classList.remove('open');
                    dropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
                }, 150);
            });
        });
    }

    // — Category dropdowns (tap-to-toggle) —
    document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var dropdown = toggle.closest('.nav-dropdown');
            var isOpen = dropdown.classList.contains('open');
            closeOthers(dropdown);
            if (!isOpen) {
                dropdown.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
            } else {
                dropdown.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Close dropdowns + mobile menu when clicking outside
    document.addEventListener('click', function () {
        document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
            d.classList.remove('open');
            d.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
        });
        navLinks.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('is-open');
    });

    // — Auto-detect active page —
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.querySelectorAll('a').forEach(function (link) {
        var linkPage = (link.getAttribute('href') || '').split('/').pop();
        if (linkPage && linkPage === currentPage) {
            link.classList.add('active');
            var parentDropdown = link.closest('.nav-dropdown');
            if (parentDropdown) {
                parentDropdown.querySelector('.dropdown-toggle').classList.add('active');
            }
        }
    });
});
