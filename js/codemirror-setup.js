// Loads CM6 via dynamic import so CDN failures never break the formatter.
// Uses ?bundle so esm.sh inlines all dependencies — avoids the re-export
// chain resolution issue that occurs when the page is served from file://.
async function initCM6() {
    const inputEl       = document.getElementById('inputJSON');
    const inputContainer  = document.getElementById('cmInputEditor');
    const outputContainer = document.getElementById('cmOutputEditor'); // optional
    if (!inputEl || !inputContainer) return;

    // ── Load CM6 from individual scoped packages (each unambiguously CM6) ────
    // The unscoped `codemirror` package on esm.sh is unreliable (resolves to CM5
    // shim under ?bundle). @codemirror/* scoped packages always mean CM6.
    let basicSetup, EditorView, EditorState, Compartment, keymap, linter, lintGutter;
    let view, state, lint, json = null;
    try {
        const [v, s, l, autocomplete, commands, language, search, langJsonMod] = await Promise.all([
            import('https://esm.sh/@codemirror/view@6'),
            import('https://esm.sh/@codemirror/state@6'),
            import('https://esm.sh/@codemirror/lint@6'),
            import('https://esm.sh/@codemirror/autocomplete@6'),
            import('https://esm.sh/@codemirror/commands@6'),
            import('https://esm.sh/@codemirror/language@6'),
            import('https://esm.sh/@codemirror/search@6'),
            import('https://esm.sh/@codemirror/lang-json@6').catch(e => { console.error('lang-json load failed:', e); return null; })
        ]);
        view = v; state = s; lint = l;
        if (langJsonMod && typeof langJsonMod.json === 'function') json = langJsonMod.json;

        ({ EditorView, keymap } = v);
        ({ EditorState, Compartment } = s);
        ({ linter, lintGutter } = l);

        // Reconstruct basicSetup manually — it's just the standard extension array.
        basicSetup = [
            v.lineNumbers(),
            v.highlightActiveLineGutter(),
            v.highlightSpecialChars(),
            commands.history(),
            language.foldGutter(),
            v.drawSelection(),
            v.dropCursor(),
            s.EditorState.allowMultipleSelections.of(true),
            language.indentOnInput(),
            language.syntaxHighlighting(language.defaultHighlightStyle, { fallback: true }),
            language.bracketMatching(),
            autocomplete.closeBrackets(),
            autocomplete.autocompletion(),
            v.rectangularSelection(),
            v.crosshairCursor(),
            v.highlightActiveLine(),
            search.highlightSelectionMatches(),
            v.keymap.of([
                ...autocomplete.closeBracketsKeymap,
                ...commands.defaultKeymap,
                ...search.searchKeymap,
                ...commands.historyKeymap,
                ...language.foldKeymap,
                ...autocomplete.completionKeymap,
                ...l.lintKeymap
            ])
        ];
    } catch (e) {
        console.warn('CodeMirror 6 load failed — using native fallback:', e);
        return;
    }

    if (!EditorView || !EditorState) {
        console.warn('=== CM6 DIAGNOSTIC ===');
        console.warn('view keys:', view ? Object.keys(view).slice(0, 30) : 'null');
        console.warn('state keys:', state ? Object.keys(state).slice(0, 20) : 'null');
        console.warn('view.EditorView:', view?.EditorView);
        console.warn('state.EditorState:', state?.EditorState);
        console.warn('=== Falling back to native textarea ===');
        return;
    }

    // ── Build editor ──────────────────────────────────────────────────────────
    try {
        const isDark = () => document.body.classList.contains('dark-mode');

        const darkTheme = EditorView.theme({
            '&': { backgroundColor: '#1e1e1e', color: '#e0e0e0' },
            '.cm-content': { caretColor: '#e0e0e0' },
            '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#e0e0e0' },
            '.cm-gutters': { backgroundColor: '#252525', color: '#666', border: 'none', borderRight: '1px solid #444' },
            '.cm-lineNumbers .cm-gutterElement': { color: '#666' },
            '.cm-activeLineGutter': { backgroundColor: '#2d2d2d' },
            '.cm-activeLine': { backgroundColor: '#2a2a2a' },
            '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#3d3d3d' },
            '.cm-panels': { backgroundColor: '#252525', color: '#e0e0e0' },
            '.cm-tooltip': { backgroundColor: '#2d2d2d', color: '#e0e0e0', border: '1px solid #444' },
            '.cm-lintRange-error': { backgroundImage: 'none', borderBottom: '2px solid #f87171' },
            '.cm-diagnostic-error': { borderLeft: '3px solid #f87171' },
        }, { dark: true });

        const themeInput  = new Compartment();
        const themeOutput = new Compartment();

        const jsonLinter = linter((view) => {
            const fullText = view.state.doc.toString();
            if (!fullText.trim()) return [];
            try { JSON.parse(fullText); return []; }
            catch (e) {
                // Use the global normalizer (validator.js) when available, fall back otherwise
                const norm = (typeof window.normalizeJSONError === 'function')
                    ? window.normalizeJSONError(fullText, e.message)
                    : { title: e.message, hint: '', position: 0, rawMessage: e.message };

                const len = view.state.doc.length;
                const pos = Math.max(0, Math.min(norm.position, len));
                const tooltip = norm.hint ? `${norm.title}\n\n${norm.hint}` : norm.title;
                return [{
                    from: pos,
                    to: Math.min(pos + 1, len),
                    severity: 'error',
                    message: tooltip
                }];
            }
        }, { delay: 500 });

        const monoStyle = EditorView.theme({
            '.cm-scroller': { fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace', fontSize: '13px', lineHeight: '1.6' }
        });

        function buildInputExtensions() {
            return [
                keymap.of([{
                    key: 'Mod-Enter',
                    run: () => {
                        // Page-specific submit handler (formatter)
                        if (typeof window.handleFormat === 'function') { window.handleFormat(); return true; }
                        // Generic fallback: click whatever the page's primary button is (validator, etc.)
                        const btn = document.querySelector('.btn-primary');
                        if (btn) { btn.click(); return true; }
                        return false;
                    }
                }]),
                basicSetup,
                ...(json ? [json()] : []),
                jsonLinter,
                lintGutter(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        clearTimeout(inputView._saveTimer);
                        inputView._saveTimer = setTimeout(() => {
                            localStorage.setItem('formatterInput', update.state.doc.toString());
                        }, 500);
                    }
                }),
                themeInput.of(isDark() ? darkTheme : []),
                monoStyle
            ];
        }

        let inputView;
        try {
            inputView = new EditorView({
                parent: inputContainer,
                state: EditorState.create({ doc: inputEl.value, extensions: buildInputExtensions() })
            });
        } catch (_) {
            // json() conflicted with the core bundle — retry without it
            json = null;
            inputView = new EditorView({
                parent: inputContainer,
                state: EditorState.create({ doc: inputEl.value, extensions: buildInputExtensions() })
            });
        }

        // Proxy #inputJSON .value → all existing app.js reads/writes work unchanged
        Object.defineProperty(inputEl, 'value', {
            get: () => inputView.state.doc.toString(),
            set: (v) => { inputView.dispatch({ changes: { from: 0, to: inputView.state.doc.length, insert: String(v) } }); },
            configurable: true
        });

        inputView.dom.addEventListener('paste', () => {
            setTimeout(() => { if (typeof window.handlePaste === 'function') window.handlePaste({ type: 'paste' }); }, 0);
        });

        inputView.dom.addEventListener('dragover', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
        });
        inputView.dom.addEventListener('drop', (e) => {
            const file = e.dataTransfer?.files?.[0];
            if (!file) return;
            if (!['json', 'txt'].includes(file.name.split('.').pop().toLowerCase())) return;
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (evt) => {
                const content = evt.target.result;
                inputEl.value = content;
                try {
                    const formatted = window.formatJSON(content);
                    if (typeof window.setOutput  === 'function') window.setOutput(formatted);
                    if (window.treeViewer) window.treeViewer.render(formatted);
                    if (typeof window.clearError === 'function') window.clearError();
                } catch (err) {
                    if (typeof window.showError === 'function') window.showError('Dropped file contains invalid JSON: ' + err.message);
                }
            };
            reader.readAsText(file);
        });

        // ── Output editor (read-only) — only on pages that have an output pane ─
        let outputView = null;
        if (outputContainer) {
            outputView = new EditorView({
                parent: outputContainer,
                state: EditorState.create({
                    doc: '',
                    extensions: [
                        basicSetup,
                        ...(json ? [json()] : []),
                        EditorState.readOnly.of(true),
                        EditorView.editable.of(false),
                        themeOutput.of(isDark() ? darkTheme : []),
                        monoStyle,
                        EditorView.theme({ '.cm-content': { cursor: 'text' } })
                    ]
                })
            });

            window.cmSetOutput = (text) => {
                outputView.dispatch({ changes: { from: 0, to: outputView.state.doc.length, insert: text } });
            };
            window.cmClearOutput = () => {
                outputView.dispatch({ changes: { from: 0, to: outputView.state.doc.length, insert: '' } });
            };
        }

        new MutationObserver(() => {
            const theme = isDark() ? darkTheme : [];
            inputView.dispatch({ effects: themeInput.reconfigure(theme) });
            if (outputView) outputView.dispatch({ effects: themeOutput.reconfigure(theme) });
        }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

        // ── Swap native elements → CM6 editors ───────────────────────────────
        inputContainer.style.display = '';
        inputEl.style.display = 'none';
        inputEl.setAttribute('aria-hidden', 'true');

        if (outputContainer) {
            outputContainer.style.display = '';
            const outputPre = document.getElementById('outputJSON');
            if (outputPre) outputPre.style.display = 'none';

            const outputRaw = document.getElementById('outputJSONRaw');
            if (outputRaw && outputRaw.value) window.cmSetOutput(outputRaw.value);
        }

    } catch (e) {
        console.warn('CodeMirror 6 initialization error — using native fallback:', e);
    }
}

initCM6();
