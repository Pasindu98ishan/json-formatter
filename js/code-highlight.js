/* Lightweight, dependency-free syntax highlighter for .code-block <pre><code> (BETA)
 *
 * Operates on the element's textContent (already entity-decoded by the browser),
 * tokenizes a JS/TS/Python/JSON/shell superset, and rewrites innerHTML with
 * <span class="hl-*"> tokens. Strings and comments are consumed first so keywords
 * inside them are never highlighted. All emitted text is re-escaped, so this never
 * injects markup. The copy button still works because it reads innerText.
 */
(function () {
    var KEYWORDS = /^(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|await|async|import|export|from|as|default|typeof|instanceof|throw|try|catch|finally|class|extends|super|void|delete|yield|in|of|def|elif|with|lambda|pass|raise|except|and|or|not|is|None|True|False|self|print)$/;
    var LITERALS = /^(?:true|false|null|undefined|NaN|Infinity)$/;

    function esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function span(cls, txt) {
        return '<span class="hl-' + cls + '">' + esc(txt) + '</span>';
    }

    function highlight(code) {
        var i = 0, n = code.length, out = '';
        while (i < n) {
            var c = code[i];

            // Line comment: // (but not part of :// ) or #
            if (c === '/' && code[i + 1] === '/' && code[i - 1] !== ':') {
                var j = code.indexOf('\n', i); if (j < 0) j = n;
                out += span('com', code.slice(i, j)); i = j; continue;
            }
            if (c === '#') {
                var h = code.indexOf('\n', i); if (h < 0) h = n;
                out += span('com', code.slice(i, h)); i = h; continue;
            }

            // Strings: ' " ` with escape handling (backticks may span lines)
            if (c === '"' || c === "'" || c === '`') {
                var q = c, k = i + 1;
                while (k < n) {
                    if (code[k] === '\\') { k += 2; continue; }
                    if (code[k] === q) { k++; break; }
                    k++;
                }
                out += span('str', code.slice(i, k)); i = k; continue;
            }

            // Numbers (not when glued to the end of an identifier)
            if (c >= '0' && c <= '9' && !/[A-Za-z_$]/.test(code[i - 1] || '')) {
                var num = code.slice(i).match(/^0[xX][0-9a-fA-F]+n?|^\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?n?/);
                if (num) { out += span('num', num[0]); i += num[0].length; continue; }
            }

            // Identifiers / keywords
            if (/[A-Za-z_$]/.test(c)) {
                var word = code.slice(i).match(/^[A-Za-z_$][\w$]*/)[0];
                var after = code.slice(i + word.length);
                var cls = '';
                if (KEYWORDS.test(word)) cls = 'key';
                else if (LITERALS.test(word)) cls = 'lit';
                else if (/^\s*\(/.test(after)) cls = 'fn';
                else if (/^[A-Z]/.test(word)) cls = 'type';
                out += cls ? span(cls, word) : esc(word);
                i += word.length; continue;
            }

            // Any other single character
            out += esc(c); i++;
        }
        return out;
    }

    function run() {
        var nodes = document.querySelectorAll('.code-block pre code');
        Array.prototype.forEach.call(nodes, function (code) {
            if (code.getAttribute('data-hl')) return;
            code.innerHTML = highlight(code.textContent);
            code.setAttribute('data-hl', '1');
        });
    }

    if (document.readyState !== 'loading') run();
    else document.addEventListener('DOMContentLoaded', run);
})();
