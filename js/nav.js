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

    // — Category dropdowns (tap-to-toggle) —
    document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var dropdown = toggle.closest('.nav-dropdown');
            var isOpen = dropdown.classList.contains('open');

            // Close all open dropdowns
            document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
                d.classList.remove('open');
                d.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
            });

            // Toggle this one
            if (!isOpen) {
                dropdown.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
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
