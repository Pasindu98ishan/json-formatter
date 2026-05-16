// Loads CM6 from a local self-hosted bundle (js/cm6.bundle.min.js).
// Falls back gracefully if the bundle fails to load.
async function initCM6() {
    const inputEl       = document.getElementById('inputJSON');
    const inputContainer  = document.getElementById('cmInputEditor');
    const outputContainer = document.getElementById('cmOutputEditor'); // optional
    if (!inputEl || !inputContainer) return;

    let EditorView, EditorState, Compartment, keymap;
    let lineNumbers, highlightActiveLineGutter, highlightSpecialChars;
    let drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine;
    let history, historyKeymap, defaultKeymap, undo, redo, undoDepth, redoDepth;
    let foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching;
    let closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap;
    let searchKeymap, highlightSelectionMatches;
    let linter, lintGutter, lintKeymap;
    let json = null;

    try {
        const mod = await import('./cm6.bundle.min.js');
        ({
            EditorView, EditorState, Compartment, keymap,
            lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
            drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine,
            history, historyKeymap, defaultKeymap, undo, redo, undoDepth, redoDepth,
            foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching,
            closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap,
            searchKeymap, highlightSelectionMatches,
            linter, lintGutter, lintKeymap,
            json
        } = mod);
    } catch (e) {
        console.warn('CodeMirror 6 bundle load failed — using native fallback:', e);
        return;
    }

    if (!EditorView || !EditorState) {
        console.warn('CM6 bundle missing core exports — using native fallback');
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

        const basicSetup = [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            bracketMatching(),
            closeBrackets(),
            autocompletion(),
            rectangularSelection(),
            crosshairCursor(),
            highlightActiveLine(),
            highlightSelectionMatches(),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...searchKeymap,
                ...historyKeymap,
                ...foldKeymap,
                ...completionKeymap,
                ...lintKeymap
            ])
        ];

        const jsonLinter = linter((view) => {
            const fullText = view.state.doc.toString();
            if (!fullText.trim()) return [];
            try { JSON.parse(fullText); return []; }
            catch (e) {
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
                        if (typeof window.handleFormat === 'function') { window.handleFormat(); return true; }
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
                    const undoBtn = document.getElementById('undoBtn');
                    const redoBtn = document.getElementById('redoBtn');
                    if (undoBtn) undoBtn.disabled = undoDepth(update.state) === 0;
                    if (redoBtn) redoBtn.disabled = redoDepth(update.state) === 0;
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
            // json() conflicted — retry without it
            json = null;
            inputView = new EditorView({
                parent: inputContainer,
                state: EditorState.create({ doc: inputEl.value, extensions: buildInputExtensions() })
            });
        }

        // Expose undo/redo for the UI buttons in app.js
        window.cmUndo = () => { undo(inputView); };
        window.cmRedo = () => { redo(inputView); };

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
