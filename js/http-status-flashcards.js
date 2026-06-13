/**
 * HTTP Status Code Flashcards — study mode.
 * Depends on js/http-status-data.js (HTTP_STATUS, HTTP_CLASSES) loaded first.
 *
 * No scoring. Renders every code as a flippable card (code <-> meaning),
 * filterable by class. Cards with a detail page get a "Learn more" link.
 */

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

var activeFilter = 'all';

function classChip(cat) {
    return '<span class="hs-class-tag hs-' + cat + '">' + cat + '</span>';
}

function renderCards() {
    var grid = document.getElementById('hsfGrid');
    if (!grid) return;
    grid.innerHTML = '';

    var list = HTTP_STATUS.filter(function (s) {
        return activeFilter === 'all' || s.cat === activeFilter;
    }).sort(function (a, b) { return a.code - b.code; });

    list.forEach(function (s) {
        var card = document.createElement('div');
        card.className = 'hsf-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('aria-label', s.code + ' ' + s.name + '. Activate to reveal meaning.');

        var learn = s.page
            ? '<a class="hsf-learn" href="' + s.page + '">Learn more →</a>'
            : '';

        card.innerHTML =
            '<div class="hsf-inner">' +
                '<div class="hsf-face hsf-front hs-' + s.cat + '">' +
                    '<span class="hsf-code">' + s.code + '</span>' +
                    '<span class="hsf-class">' + s.cat + ' · ' + HTTP_CLASSES[s.cat].label + '</span>' +
                '</div>' +
                '<div class="hsf-face hsf-back">' +
                    '<strong>' + s.code + ' ' + s.name + '</strong>' +
                    '<span class="hsf-blurb"></span>' +
                    learn +
                '</div>' +
            '</div>';

        card.querySelector('.hsf-blurb').textContent = s.blurb;

        function flip(e) {
            // Don't flip when following the Learn-more link.
            if (e && e.target && e.target.classList.contains('hsf-learn')) return;
            var flipped = card.classList.toggle('is-flipped');
            card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
        }
        card.addEventListener('click', flip);
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(e); }
        });

        grid.appendChild(card);
    });

    var count = document.getElementById('hsfCount');
    if (count) count.textContent = list.length + ' card' + (list.length === 1 ? '' : 's');
}

function setFilter(cat, btn) {
    activeFilter = cat;
    var btns = document.querySelectorAll('.hsf-filter-btn');
    btns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
    trackEvent('study_toggle', { filter: cat });
    renderCards();
}

document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('hsfGrid')) return;

    var filters = document.querySelectorAll('.hsf-filter-btn');
    filters.forEach(function (btn) {
        btn.addEventListener('click', function () { setFilter(btn.getAttribute('data-cat'), btn); });
    });

    renderCards();
});
