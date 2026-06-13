/**
 * HTTP Status Code Quiz — game engine.
 * Depends on js/http-status-data.js (HTTP_STATUS) loaded first.
 *
 * Game rules (see HTTP_STATUS_QUIZ_PLAN.md):
 *   - 10 questions, always 4-option multiple choice, no code repeats within a game.
 *   - Difficulty via weighted random tier sampling that ramps from easy to trivia.
 *   - Mixed formats ~40% code->meaning, ~40% scenario->code, ~20% scenario classification.
 *   - Scoring = streak + accuracy only (no speed bonus).
 */

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

var QUIZ_LENGTH = 10;

// Per-question tier weights [tier1, tier2, tier3]. Index by question number (1-based).
var TIER_WEIGHTS = {
    1: [0.85, 0.15, 0.00], 2: [0.85, 0.15, 0.00],
    3: [0.50, 0.40, 0.10], 4: [0.50, 0.40, 0.10], 5: [0.50, 0.40, 0.10],
    6: [0.20, 0.50, 0.30], 7: [0.20, 0.50, 0.30], 8: [0.20, 0.50, 0.30],
    9: [0.05, 0.35, 0.60], 10: [0.05, 0.35, 0.60]
};

// Target format mix across a 10-question game: 5 code->meaning, 5 scenario->code.
var FORMAT_PLAN = [
    'meaning', 'scenario', 'scenario', 'meaning', 'scenario',
    'meaning', 'scenario', 'meaning', 'meaning', 'scenario'
];

// Rank bands by score. Median (5-6) is neutral-positive so people still share.
var RANKS = [
    { min: 0, max: 2, title: '404 Human', emoji: '🫠' },
    { min: 3, max: 4, title: '502 Bad Gateway Brain', emoji: '💥' },
    { min: 5, max: 6, title: '200 OK', emoji: '✅' },
    { min: 7, max: 8, title: 'Certified Postman', emoji: '📨' },
    { min: 9, max: 10, title: 'HTTP Wizard', emoji: '🧙' }
];

var SHARE_URL = 'https://jsondevtools.org/http-status-quiz.html';

// ---- localStorage helpers -------------------------------------------------

function lsGet(key, fallback) {
    try {
        var v = localStorage.getItem(key);
        return v === null ? fallback : v;
    } catch (e) { return fallback; }
}
function lsSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* private mode */ }
}

function getBestScore() { return parseInt(lsGet('httpQuizBestScore', '0'), 10) || 0; }
function getGamesPlayed() { return parseInt(lsGet('httpQuizGamesPlayed', '0'), 10) || 0; }

// httpQuizMissedCodes shape: { "_lastPruned": <ms>, "404": 3, "503": 1, ... }
function getMissedMap() {
    var raw = lsGet('httpQuizMissedCodes', '{}');
    var map;
    try { map = JSON.parse(raw); } catch (e) { map = {}; }
    if (!map || typeof map !== 'object') map = {};
    var THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    var last = map._lastPruned || 0;
    if (Date.now() - last > THIRTY_DAYS) {
        map = { _lastPruned: Date.now() };
    }
    return map;
}
function recordMisses(codes) {
    var map = getMissedMap();
    codes.forEach(function (c) {
        map[c] = (map[c] || 0) + 1;
    });
    if (!map._lastPruned) map._lastPruned = Date.now();
    // Cap to the 50 highest-miss codes (plus the bookkeeping key).
    var entries = Object.keys(map).filter(function (k) { return k !== '_lastPruned'; });
    if (entries.length > 50) {
        entries.sort(function (a, b) { return map[b] - map[a]; });
        var keep = { _lastPruned: map._lastPruned };
        entries.slice(0, 50).forEach(function (k) { keep[k] = map[k]; });
        map = keep;
    }
    lsSet('httpQuizMissedCodes', JSON.stringify(map));
}

// ---- cross-game recent-code rotation --------------------------------------
// Tracks the most recent codes seen across completed games so consecutive
// playthroughs feel fresh. Stored as a JSON array of code numbers, e.g.
// [200,404,500,...], capped to the RECENT_MAX most recent unique entries.

var RECENT_KEY = 'httpQuizRecentCodes';
var RECENT_MAX = 20;

function getRecentCodes() {
    var raw = lsGet(RECENT_KEY, '[]');
    var arr;
    try { arr = JSON.parse(raw); } catch (e) { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    return arr.filter(function (c) { return typeof c === 'number'; });
}

// Append a completed game's codes, dedupe (keeping the most-recent position),
// and trim to the RECENT_MAX most recent. Older codes naturally fall back into
// the eligible pool once they drop out of this window.
function appendRecentCodes(codes) {
    var recent = getRecentCodes();
    codes.forEach(function (c) {
        var i = recent.indexOf(c);
        if (i !== -1) recent.splice(i, 1);
        recent.push(c);
    });
    if (recent.length > RECENT_MAX) {
        recent = recent.slice(recent.length - RECENT_MAX);
    }
    lsSet(RECENT_KEY, JSON.stringify(recent));
}

// ---- in-progress state persistence ----------------------------------------

var STATE_KEY = 'httpQuizInProgress';

function saveState() {
    if (!state) return;
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
}

function clearSavedState() {
    try { localStorage.removeItem(STATE_KEY); } catch (e) {}
}

// Flag set when the player clicks an in-quiz "Learn more" link so that on
// return we jump straight back to the exact question instead of showing the
// continue/new-game resume screen. sessionStorage = scoped to this tab.
var RETURN_KEY = 'httpQuizReturning';

function markReturning() {
    try { sessionStorage.setItem(RETURN_KEY, '1'); } catch (e) {}
}

function consumeReturning() {
    try {
        var v = sessionStorage.getItem(RETURN_KEY);
        sessionStorage.removeItem(RETURN_KEY);
        return v === '1';
    } catch (e) { return false; }
}

function loadSavedState() {
    var raw = lsGet(STATE_KEY, null);
    if (!raw) return null;
    try {
        var s = JSON.parse(raw);
        if (!s || !Array.isArray(s.questions) || s.questions.length !== QUIZ_LENGTH) return null;
        if (typeof s.index !== 'number' || s.index < 0 || s.index >= QUIZ_LENGTH) return null;
        return s;
    } catch (e) { return null; }
}

// Reconstruct the answered-question UI after restoring state (no re-answer needed).
function applyAnsweredState() {
    var q = state.questions[state.index];
    var buttons = el.options.querySelectorAll('.hsq-option');
    buttons.forEach(function (b) {
        b.disabled = true;
        var key = b.getAttribute('data-key');
        var match = q.options.filter(function (o) { return String(o.key) === key; })[0];
        if (match && match.correct) b.classList.add('correct');
        if (state.selectedKey != null && String(key) === String(state.selectedKey) && match && !match.correct) {
            b.classList.add('incorrect');
        }
    });

    var item = q.item;
    var msg = (state.lastCorrect ? 'Correct! ' : 'Not quite. ') +
        item.code + ' ' + item.name + ' — ' + item.blurb;
    el.feedback.textContent = msg;
    el.feedback.className = 'hsq-feedback ' + (state.lastCorrect ? 'is-correct' : 'is-incorrect');
    show(el.feedback, true);

    if (item.page) {
        var a = document.createElement('a');
        a.href = item.page;
        a.className = 'hsq-learn';
        a.textContent = 'Learn more about ' + item.code + ' →';
        a.addEventListener('click', markReturning);
        el.feedback.appendChild(document.createTextNode(' '));
        el.feedback.appendChild(a);
    }

    el.next.textContent = (state.index + 1 >= QUIZ_LENGTH) ? 'See results' : 'Next question';
    show(el.next, true);
}

// ---- utilities ------------------------------------------------------------

function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

function byCode(code) {
    for (var i = 0; i < HTTP_STATUS.length; i++) {
        if (HTTP_STATUS[i].code === code) return HTTP_STATUS[i];
    }
    return null;
}

function weightedTier(weights) {
    var r = Math.random();
    if (r < weights[0]) return 1;
    if (r < weights[0] + weights[1]) return 2;
    return 3;
}

var ADJACENT = {
    '1xx': ['2xx', '3xx'],
    '2xx': ['3xx', '1xx'],
    '3xx': ['2xx', '4xx'],
    '4xx': ['5xx', '3xx'],
    '5xx': ['4xx', '3xx']
};

// ---- game state -----------------------------------------------------------

var state = null;        // current game
var sessionRecent = [];  // recent codes (loaded from httpQuizRecentCodes) to avoid this game

function pickQuestionCode(qNum, usedCodes) {
    var tier = weightedTier(TIER_WEIGHTS[qNum]);
    var tiers = [tier, tier === 1 ? 2 : (tier === 3 ? 2 : 1), tier === 1 ? 3 : (tier === 3 ? 1 : 3)];
    // Try the chosen tier, then fall through other tiers if exhausted.
    for (var t = 0; t < tiers.length; t++) {
        var pool = HTTP_STATUS.filter(function (s) {
            return s.tier === tiers[t] && usedCodes.indexOf(s.code) === -1;
        });
        // Prefer codes not seen in the last game.
        var fresh = pool.filter(function (s) { return sessionRecent.indexOf(s.code) === -1; });
        var chosen = (fresh.length ? fresh : pool);
        if (chosen.length) {
            return chosen[Math.floor(Math.random() * chosen.length)].code;
        }
    }
    // Absolute fallback: any unused code.
    var any = HTTP_STATUS.filter(function (s) { return usedCodes.indexOf(s.code) === -1; });
    return any[Math.floor(Math.random() * any.length)].code;
}

// Build 3 distractors that never include the correct answer.
// Fallback chain: same-category -> adjacent-category -> any valid code.
function buildDistractors(correct, valueKey) {
    var picked = [];
    var seen = {};
    seen[correct.code] = true;

    function addFrom(list) {
        var shuffled = shuffle(list);
        for (var i = 0; i < shuffled.length && picked.length < 3; i++) {
            var s = shuffled[i];
            if (seen[s.code]) continue;
            seen[s.code] = true;
            picked.push(s);
        }
    }

    addFrom(HTTP_STATUS.filter(function (s) { return s.cat === correct.cat; }));
    if (picked.length < 3) {
        (ADJACENT[correct.cat] || []).forEach(function (cat) {
            if (picked.length < 3) addFrom(HTTP_STATUS.filter(function (s) { return s.cat === cat; }));
        });
    }
    if (picked.length < 3) addFrom(HTTP_STATUS);
    return picked;
}

function buildQuestion(qNum, usedCodes) {
    var format = FORMAT_PLAN[qNum - 1];
    var code = pickQuestionCode(qNum, usedCodes);
    var item = byCode(code);
    usedCodes.push(code);

    var distractors = buildDistractors(item, format);
    var optionItems = shuffle([item].concat(distractors));

    if (format === 'meaning') {
        // Options must NOT include the code number — the prompt already shows it,
        // so listing "400 Bad Request" would let players match digits instead of
        // knowing the meaning. Show name + meaning only.
        return {
            format: 'meaning',
            code: code,
            prompt: 'What does HTTP ' + code + ' mean?',
            context: '',
            badge: item.cat,
            options: optionItems.map(function (s) {
                return { value: s.name + ' — ' + s.blurb, key: s.code, correct: s.code === code };
            }),
            item: item
        };
    }

    // scenario -> code
    return {
        format: 'scenario',
        code: code,
        prompt: 'Which status code fits this situation?',
        context: item.scenario,
        options: optionItems.map(function (s) {
            return { value: s.code + ' ' + s.name, key: s.code, correct: s.code === code };
        }),
        item: item
    };
}

function buildGame() {
    // Load the persisted cross-game recent codes so this game prefers codes the
    // player hasn't seen lately. The list is updated on game completion, not here.
    sessionRecent = getRecentCodes();
    var used = [];
    var questions = [];
    for (var q = 1; q <= QUIZ_LENGTH; q++) {
        questions.push(buildQuestion(q, used));
    }
    return {
        questions: questions,
        index: 0,
        score: 0,
        streak: 0,
        bestStreak: 0,
        answered: false,
        missed: []
    };
}

// ---- DOM rendering --------------------------------------------------------

var el = {};

function show(node, visible) { if (node) node.style.display = visible ? '' : 'none'; }

function startGame() {
    clearSavedState();
    state = buildGame();
    trackEvent('quiz_start');
    show(el.start, false);
    show(el.end, false);
    show(el.play, true);
    renderQuestion();
}

function catClass(cat) { return 'hs-' + cat; }

function renderQuestion() {
    var q = state.questions[state.index];
    state.answered = false;

    el.progressBar.style.width = ((state.index) / QUIZ_LENGTH * 100) + '%';
    el.progressText.textContent = 'Question ' + (state.index + 1) + ' of ' + QUIZ_LENGTH;
    el.scoreText.textContent = 'Score ' + state.score;
    el.streakText.textContent = state.streak > 1 ? ('🔥 ' + state.streak) : '';

    el.prompt.textContent = q.prompt;

    // Only the "meaning" format shows the big code (the prompt asks what it means).
    // "scenario" questions hide the code and show only the scenario text.
    if (q.format === 'meaning') {
        el.bigCode.textContent = q.code;
        el.bigCode.className = 'hsq-bigcode ' + catClass(q.item.cat);
        show(el.bigCode, true);
    } else {
        show(el.bigCode, false);
    }
    el.context.textContent = q.context || '';
    show(el.context, !!q.context);

    el.feedback.textContent = '';
    el.feedback.className = 'hsq-feedback';
    show(el.feedback, false);
    show(el.next, false);

    // Options.
    el.options.innerHTML = '';
    q.options.forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hsq-option';
        btn.setAttribute('data-key', String(opt.key));
        btn.innerHTML = '<span class="hsq-num">' + (i + 1) + '</span>' +
            '<span class="hsq-opt-text"></span>';
        btn.querySelector('.hsq-opt-text').textContent = opt.value;
        btn.addEventListener('click', function () { selectAnswer(opt, btn, q); });
        el.options.appendChild(btn);
    });

    // Focus first option for keyboard users.
    var first = el.options.querySelector('.hsq-option');
    if (first) first.focus();
}

function selectAnswer(opt, btn, q) {
    if (state.answered) return;
    state.answered = true;

    var buttons = el.options.querySelectorAll('.hsq-option');
    buttons.forEach(function (b) {
        b.disabled = true;
        var key = b.getAttribute('data-key');
        var match = q.options.filter(function (o) { return String(o.key) === key; })[0];
        if (match && match.correct) b.classList.add('correct');
    });

    var correct = !!opt.correct;
    state.selectedKey = opt.key;
    state.lastCorrect = correct;
    if (correct) {
        btn.classList.add('correct');
        state.score++;
        state.streak++;
        if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    } else {
        btn.classList.add('incorrect');
        state.streak = 0;
        state.missed.push(q.code);
    }

    el.scoreText.textContent = 'Score ' + state.score;
    el.streakText.textContent = state.streak > 1 ? ('🔥 ' + state.streak) : '';

    // Feedback text + optional "Learn more" link (only when a detail page exists).
    var item = q.item;
    var msg = (correct ? 'Correct! ' : 'Not quite. ') +
        item.code + ' ' + item.name + ' — ' + item.blurb;
    el.feedback.textContent = msg;
    el.feedback.className = 'hsq-feedback ' + (correct ? 'is-correct' : 'is-incorrect');
    show(el.feedback, true);

    if (item.page) {
        var a = document.createElement('a');
        a.href = item.page;
        a.className = 'hsq-learn';
        a.textContent = 'Learn more about ' + item.code + ' →';
        a.addEventListener('click', markReturning);
        el.feedback.appendChild(document.createTextNode(' '));
        el.feedback.appendChild(a);
    }

    el.next.textContent = (state.index + 1 >= QUIZ_LENGTH) ? 'See results' : 'Next question';
    show(el.next, true);
    el.next.focus();
    saveState();
}

function nextQuestion() {
    if (!state.answered) return;
    state.index++;
    state.selectedKey = null;
    state.lastCorrect = null;
    if (state.index >= QUIZ_LENGTH) {
        finishGame();
    } else {
        saveState();
        renderQuestion();
    }
}

function rankFor(score) {
    for (var i = 0; i < RANKS.length; i++) {
        if (score >= RANKS[i].min && score <= RANKS[i].max) return RANKS[i];
    }
    return RANKS[RANKS.length - 1];
}

function finishGame() {
    clearSavedState();
    var score = state.score;
    var rank = rankFor(score);

    // Persist stats.
    var games = getGamesPlayed() + 1;
    lsSet('httpQuizGamesPlayed', String(games));
    var best = getBestScore();
    var isBest = score > best;
    if (isBest) lsSet('httpQuizBestScore', String(score));
    if (state.missed.length) recordMisses(state.missed);

    // Record this game's codes so the next game avoids them (cross-game rotation).
    appendRecentCodes(state.questions.map(function (q) { return q.code; }));

    trackEvent('quiz_complete', { score: score, best_streak: state.bestStreak });

    show(el.play, false);
    show(el.end, true);
    el.progressBar.style.width = '100%';

    el.endScore.textContent = score + ' / ' + QUIZ_LENGTH;
    el.endRank.textContent = rank.emoji + ' ' + rank.title;
    el.endBest.textContent = isBest ? 'New personal best!' :
        ('Best: ' + Math.max(best, score) + '/' + QUIZ_LENGTH + ' · Games played: ' + games);

    // Static score card image — hide gracefully if the asset is missing.
    el.scoreCard.style.display = '';
    el.scoreCard.onerror = function () { el.scoreCard.style.display = 'none'; };
    el.scoreCard.onload = function () { el.scoreCard.style.display = ''; };
    el.scoreCard.src = 'images/score-card-' + score + '.png';
    el.scoreCard.alt = 'HTTP Status Quiz score: ' + score + ' out of 10 — ' + rank.title;

    // "What you missed" review list.
    el.missList.innerHTML = '';
    if (state.missed.length === 0) {
        var li = document.createElement('li');
        li.textContent = 'Nothing missed — flawless run!';
        el.missList.appendChild(li);
    } else {
        state.missed.forEach(function (code) {
            var item = byCode(code);
            var li = document.createElement('li');
            if (item.page) {
                var a = document.createElement('a');
                a.href = item.page;
                a.textContent = item.code + ' ' + item.name;
                li.appendChild(a);
                li.appendChild(document.createTextNode(' — ' + item.blurb));
            } else {
                li.textContent = item.code + ' ' + item.name + ' — ' + item.blurb;
            }
            el.missList.appendChild(li);
        });
    }

    el.shareText = 'I scored ' + score + '/' + QUIZ_LENGTH +
        ' on the HTTP Status Quiz — "' + rank.emoji + ' ' + rank.title + '". Beat me:';
    el.end.focus();
}

// ---- share modal ----------------------------------------------------------

function openShareModal() {
    var modal = document.getElementById('hsqShareModal');
    var sub = document.getElementById('hsqShareModalSub');
    if (!modal) return;
    if (sub) sub.textContent = el.shareText || 'Try the HTTP Status Quiz:';
    modal.style.display = '';
    var closeBtn = document.getElementById('hsqShareClose');
    if (closeBtn) closeBtn.focus();
    trackEvent('share_clicked');
}

function closeShareModal() {
    var modal = document.getElementById('hsqShareModal');
    if (modal) modal.style.display = 'none';
}

function doShare() {
    openShareModal();
}

function flashBtn(btn, msg) {
    var orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = orig; }, 1800);
}

function copyText(str, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(function () { if (btn) flashBtn(btn, 'Copied!'); });
    } else {
        var ta = document.createElement('textarea');
        ta.value = str; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); if (btn) flashBtn(btn, 'Copied!'); } catch (e) { /* noop */ }
        document.body.removeChild(ta);
    }
}

// ---- keyboard -------------------------------------------------------------

function onKey(e) {
    if (!state) return;
    if (el.play.style.display === 'none') return;
    if (!state.answered && e.key >= '1' && e.key <= '4') {
        var idx = parseInt(e.key, 10) - 1;
        var btns = el.options.querySelectorAll('.hsq-option');
        if (btns[idx]) { e.preventDefault(); btns[idx].click(); }
    } else if (state.answered && (e.key === 'Enter')) {
        e.preventDefault();
        nextQuestion();
    }
}

// ---- init -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    // Only run on the quiz page.
    if (!document.getElementById('hsqApp')) return;

    el.start = document.getElementById('hsqStart');
    el.play = document.getElementById('hsqPlay');
    el.end = document.getElementById('hsqEnd');
    el.progressBar = document.getElementById('hsqProgressBar');
    el.progressText = document.getElementById('hsqProgressText');
    el.scoreText = document.getElementById('hsqScore');
    el.streakText = document.getElementById('hsqStreak');
    el.prompt = document.getElementById('hsqPrompt');
    el.bigCode = document.getElementById('hsqBigCode');
    el.context = document.getElementById('hsqContext');
    el.options = document.getElementById('hsqOptions');
    el.feedback = document.getElementById('hsqFeedback');
    el.next = document.getElementById('hsqNext');
    el.endScore = document.getElementById('hsqEndScore');
    el.endRank = document.getElementById('hsqEndRank');
    el.endBest = document.getElementById('hsqEndBest');
    el.scoreCard = document.getElementById('hsqScoreCard');
    el.missList = document.getElementById('hsqMissList');

    var startBtn = document.getElementById('hsqStartBtn');
    var againBtn = document.getElementById('hsqAgainBtn');
    var shareBtn = document.getElementById('hsqShareBtn');
    var copyBtn  = document.getElementById('hsqCopyBtn');

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (againBtn) againBtn.addEventListener('click', startGame);
    if (el.next)  el.next.addEventListener('click', nextQuestion);
    if (shareBtn) shareBtn.addEventListener('click', doShare);
    if (copyBtn)  copyBtn.addEventListener('click', function () {
        copyText((el.shareText || 'Try the HTTP Status Quiz:') + ' ' + SHARE_URL, copyBtn);
        trackEvent('share_clicked', { method: 'copy' });
    });

    // Share modal wiring
    var shareClose   = document.getElementById('hsqShareClose');
    var shareBackdrop = document.getElementById('hsqShareBackdrop');
    var modalTwitter = document.getElementById('hsqModalTwitter');
    var modalCopyLink = document.getElementById('hsqModalCopyLink');
    var modalCopyText = document.getElementById('hsqModalCopyText');

    if (shareClose) shareClose.addEventListener('click', closeShareModal);
    // Close on backdrop click but NOT on the box itself
    if (shareBackdrop) shareBackdrop.addEventListener('click', function (e) {
        if (e.target === shareBackdrop) closeShareModal();
    });
    if (modalTwitter) modalTwitter.addEventListener('click', function () {
        var text = encodeURIComponent((el.shareText || 'Try the HTTP Status Quiz:') + ' ' + SHARE_URL);
        window.open('https://twitter.com/intent/tweet?text=' + text, '_blank', 'noopener');
        trackEvent('share_clicked', { method: 'twitter' });
    });
    if (modalCopyLink) modalCopyLink.addEventListener('click', function () {
        copyText(SHARE_URL, modalCopyLink);
        trackEvent('share_clicked', { method: 'copy_link' });
    });
    if (modalCopyText) modalCopyText.addEventListener('click', function () {
        copyText((el.shareText || 'Try the HTTP Status Quiz:') + ' ' + SHARE_URL, modalCopyText);
        trackEvent('share_clicked', { method: 'copy_text' });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeShareModal();
        onKey(e);
    });

    // Restore an in-progress game directly into the exact question window.
    function resumeSavedGame(saved, fromEl) {
        // Capture answered before state = saved overwrites the reference.
        var wasAnswered = saved.answered;
        var wasSelected = saved.selectedKey;
        var wasCorrect  = saved.lastCorrect;
        state = saved;
        show(fromEl, false);
        show(el.play, true);
        renderQuestion();               // resets state.answered = false internally
        if (wasAnswered) {
            state.answered    = true;
            state.selectedKey = wasSelected;
            state.lastCorrect = wasCorrect;
            applyAnsweredState();
        }
    }

    var saved = loadSavedState();
    if (saved) {
        var resumeEl = document.getElementById('hsqResume');

        // Returning from an in-quiz "Learn more" link → jump straight back to the
        // exact window, skip the continue/new-game prompt.
        if (consumeReturning()) {
            show(el.start, false);
            resumeSavedGame(saved, resumeEl);
        } else {
            // Fresh visit with a game in progress → let the player choose.
            var resumeInfo   = document.getElementById('hsqResumeInfo');
            var resumeBtn    = document.getElementById('hsqResumeBtn');
            var resumeNewBtn = document.getElementById('hsqResumeNewBtn');

            if (resumeInfo) {
                resumeInfo.textContent =
                    'Question ' + (saved.index + 1) + ' of ' + QUIZ_LENGTH +
                    ' · Score ' + saved.score;
            }
            show(el.start, false);
            show(resumeEl, true);

            if (resumeBtn) resumeBtn.addEventListener('click', function () {
                resumeSavedGame(saved, resumeEl);
            });
            if (resumeNewBtn) resumeNewBtn.addEventListener('click', function () {
                clearSavedState();
                saved = null;
                show(resumeEl, false);
                show(el.start, true);
            });
        }
    }

    // Show best score on the start screen if present.
    var bestEl = document.getElementById('hsqStartBest');
    if (bestEl) {
        var best = getBestScore();
        var games = getGamesPlayed();
        if (games > 0) {
            bestEl.textContent = 'Your best: ' + best + '/' + QUIZ_LENGTH + ' · ' + games + ' games played';
        }
    }
});
