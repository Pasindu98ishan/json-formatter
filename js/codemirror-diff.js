/**
 * codemirror-diff.js — generic, HTML-driven CodeMirror 6 editors for the diff tools.
 *
 * Any element with [data-cm-editor] is turned into a line-numbered CodeMirror editor
 * bound to the textarea named in its data-textarea attribute. The textarea's `.value`
 * is proxied to the editor so existing tool logic (Compare / Swap / Clear) keeps working
 * unchanged. Add data-json="true" to enable JSON syntax highlighting + inline lint.
 *
 * Graceful fallback: if the bundle fails to load, the original textareas stay usable.
 */
(function () {
    var containers = Array.prototype.slice.call(document.querySelectorAll('[data-cm-editor]'));
    if (!containers.length) return;

    initDiffEditors(containers);

    async function initDiffEditors(containers) {
        let mod;
        try {
            mod = await import('./cm6.bundle.min.js');
        } catch (e) {
            console.warn('CodeMirror 6 bundle load failed — using native textareas:', e);
            return;
        }

        var EditorView = mod.EditorView, EditorState = mod.EditorState, Compartment = mod.Compartment,
            keymap = mod.keymap, lineNumbers = mod.lineNumbers,
            highlightActiveLineGutter = mod.highlightActiveLineGutter,
            highlightSpecialChars = mod.highlightSpecialChars, history = mod.history,
            historyKeymap = mod.historyKeymap, defaultKeymap = mod.defaultKeymap,
            foldGutter = mod.foldGutter, foldKeymap = mod.foldKeymap,
            indentOnInput = mod.indentOnInput, syntaxHighlighting = mod.syntaxHighlighting,
            defaultHighlightStyle = mod.defaultHighlightStyle, bracketMatching = mod.bracketMatching,
            closeBrackets = mod.closeBrackets, closeBracketsKeymap = mod.closeBracketsKeymap,
            drawSelection = mod.drawSelection, dropCursor = mod.dropCursor,
            highlightActiveLine = mod.highlightActiveLine, searchKeymap = mod.searchKeymap,
            linter = mod.linter, lintGutter = mod.lintGutter, lintKeymap = mod.lintKeymap,
            json = mod.json || null;

        if (!EditorView || !EditorState || !Compartment) {
            console.warn('CodeMirror 6 bundle missing core exports — using native textareas');
            return;
        }

        var isDark = function () { return document.body.classList.contains('dark-mode'); };

        var darkTheme = EditorView.theme({
            '&': { backgroundColor: '#1e1e1e', color: '#e0e0e0' },
            '.cm-content': { caretColor: '#e0e0e0' },
            '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#e0e0e0' },
            '.cm-gutters': { backgroundColor: '#252525', color: '#666', border: 'none', borderRight: '1px solid #444' },
            '.cm-lineNumbers .cm-gutterElement': { color: '#666' },
            '.cm-activeLineGutter': { backgroundColor: '#2d2d2d' },
            '.cm-activeLine': { backgroundColor: '#2a2a2a' },
            '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#3d3d3d' },
            '.cm-tooltip': { backgroundColor: '#2d2d2d', color: '#e0e0e0', border: '1px solid #444' },
            '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '2px solid #f87171' },
            '.cm-diagnostic-error': { borderLeft: '3px solid #f87171' }
        }, { dark: true });

        var monoStyle = EditorView.theme({
            '.cm-scroller': { fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace', fontSize: '13px', lineHeight: '1.6' }
        });

        function baseExtensions() {
            return [
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightSpecialChars(),
                history(),
                foldGutter(),
                drawSelection(),
                dropCursor(),
                indentOnInput(),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                bracketMatching(),
                closeBrackets(),
                highlightActiveLine(),
                EditorView.lineWrapping,
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                    ...lintKeymap
                ])
            ];
        }

        // Lightweight JSON linter (no dependency on normalizeJSONError).
        function jsonLinter() {
            return linter(function (view) {
                var text = view.state.doc.toString();
                if (!text.trim()) return [];
                try { JSON.parse(text); return []; }
                catch (e) {
                    var len = view.state.doc.length;
                    var m = /position (\d+)/.exec(e.message);
                    var pos = m ? Math.max(0, Math.min(parseInt(m[1], 10), len)) : 0;
                    return [{ from: pos, to: Math.min(pos + 1, len), severity: 'error', message: e.message }];
                }
            }, { delay: 500 });
        }

        var views = [];

        containers.forEach(function (container) {
            var taId = container.getAttribute('data-textarea');
            var ta = taId && document.getElementById(taId);
            if (!ta) return;

            var useJson = container.getAttribute('data-json') === 'true';
            var theme = new Compartment();

            var extensions = baseExtensions();
            if (useJson) {
                if (json) { try { extensions.push(json()); } catch (_) { /* highlight fallback */ } }
                extensions.push(jsonLinter(), lintGutter());
            }
            extensions.push(theme.of(isDark() ? darkTheme : []));
            extensions.push(monoStyle);

            var view = new EditorView({
                parent: container,
                state: EditorState.create({ doc: ta.value, extensions: extensions })
            });

            // Proxy the textarea's value to the editor so existing logic keeps working.
            Object.defineProperty(ta, 'value', {
                get: function () { return view.state.doc.toString(); },
                set: function (v) {
                    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: String(v) } });
                },
                configurable: true
            });

            container.style.display = '';
            ta.style.display = 'none';
            ta.setAttribute('aria-hidden', 'true');

            views.push({ view: view, theme: theme });
        });

        if (!views.length) return;

        // Reconfigure every editor's theme when dark mode toggles.
        new MutationObserver(function () {
            var t = isDark() ? darkTheme : [];
            views.forEach(function (v) {
                v.view.dispatch({ effects: v.theme.reconfigure(t) });
            });
        }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
})();
