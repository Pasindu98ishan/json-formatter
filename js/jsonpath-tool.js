// JSONPath Tester Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function () {
    const jsonInput   = document.getElementById('jsonInput');
    const pathInput   = document.getElementById('pathInput');
    const evaluateBtn = document.getElementById('evaluateBtn');
    const outputEl    = document.getElementById('output');
    const copyBtn     = document.getElementById('copyBtn');
    const clearBtn    = document.getElementById('clearBtn');
    const errorEl     = document.getElementById('errorContainer');
    const matchBadge  = document.getElementById('matchBadge');
    let lastResult = '';

    const SAMPLE_JSON = JSON.stringify({
        store: {
            book: [
                { category: "reference", author: "Nigel Rees",      title: "Sayings of the Century", price: 8.95  },
                { category: "fiction",   author: "Evelyn Waugh",    title: "Sword of Honour",        price: 12.99 },
                { category: "fiction",   author: "Herman Melville", title: "Moby Dick",              price: 8.99  },
                { category: "fiction",   author: "J. R. R. Tolkien",title: "The Lord of the Rings",  price: 22.99 }
            ],
            bicycle: { color: "red", price: 19.95 }
        }
    }, null, 2);

    jsonInput.value = SAMPLE_JSON;
    pathInput.value = '$.store.book[*].author';

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        outputEl.value = '';
        if (matchBadge) matchBadge.textContent = '';
        lastResult = '';
    }

    function clearError() {
        errorEl.style.display = 'none';
    }

    function evaluate() {
        clearError();
        const jsonStr = jsonInput.value.trim();
        const path    = pathInput.value.trim();

        if (!jsonStr) { showError('Please enter JSON data.'); return; }
        if (!path)    { showError('Please enter a JSONPath expression.'); return; }

        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            showError('Invalid JSON: ' + e.message);
            return;
        }

        try {
            const result = JSONPath.JSONPath({ path, json: data });
            if (!result || (Array.isArray(result) && result.length === 0)) {
                outputEl.value = '(no matches)';
                if (matchBadge) matchBadge.textContent = '0 matches';
                lastResult = '';
            } else {
                lastResult = JSON.stringify(result, null, 2);
                outputEl.value = lastResult;
                const count = Array.isArray(result) ? result.length : 1;
                if (matchBadge) matchBadge.textContent = count + (count === 1 ? ' match' : ' matches');
                trackEvent('evaluate_jsonpath', { path });
            }
        } catch (e) {
            showError('JSONPath error: ' + e.message);
        }
    }

    if (evaluateBtn) evaluateBtn.addEventListener('click', evaluate);

    [jsonInput, pathInput].forEach(el => {
        if (!el) return;
        el.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                evaluate();
            }
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            jsonInput.value = '';
            pathInput.value = '';
            outputEl.value  = '';
            if (matchBadge) matchBadge.textContent = '';
            clearError();
            lastResult = '';
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!lastResult) return;
            copyToClipboard(lastResult)
                .then(() => showToast('Copied!'))
                .catch(() => {});
        });
    }
});
