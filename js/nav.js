// Mobile navigation hamburger toggle
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', function () {
        const isOpen = navLinks.classList.toggle('nav-open');
        hamburger.setAttribute('aria-expanded', isOpen);
        hamburger.classList.toggle('is-open', isOpen);
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('nav-open');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.classList.remove('is-open');
        }
    });

    // Close when a nav link is tapped (mobile)
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('nav-open');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.classList.remove('is-open');
        });
    });
});
