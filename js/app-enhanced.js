// ============================================
// JSON FORMATTER - MAIN APPLICATION
// Event handling and application logic
// ============================================

// Application State
const AppState = {
    history: [],
    lastAction: null,
    isDarkMode: false
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    initializeTheme();
    initializeEventListeners();
    loadHistoryFromStorage();
    console.log('✓ JSON Formatter initialized successfully');
}

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    const formatBtn = document.getElementById('formatBtn');
    const minifyBtn = document.getElementById('minifyBtn');
    const validateBtn = document.getElementById('validateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('theme-toggle');
    const inputJSON = document.getElementById('inputJSON');

    if (formatBtn) formatBtn.addEventListener('click', handleFormat);
    if (minifyBtn) minifyBtn.addEventListener('click', handleMinify);
    if (validateBtn) validateBtn.addEventListener('click', handleValidate);
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);
    if (clearBtn) clearBtn.addEventListener('click', handleClear);
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    
    if (inputJSON) {
        inputJSON.addEventListener('paste', handlePaste);
        inputJSON.addEventListener('keydown', handleKeyboardShortcuts);
    }
}

// ========== EVENT HANDLERS ==========

/**
 * Handle Format button click
 */
function handleFormat() {
    const input = getInputValue();
    const output = document.getElementById('outputJSON');

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to format');
            return;
        }

        const formatted = formatJSON(input);
        setOutputValue(formatted);
        AppState.lastAction = 'format';
        showSuccess('✓ JSON formatted successfully!');
        saveToHistory(input);
    } catch (error) {
        showError('Format Error: ' + error.message);
    }
}

/**
 * Handle Minify button click
 */
function handleMinify() {
    const input = getInputValue();

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to minify');
            return;
        }

        const minified = minifyJSON(input);
        setOutputValue(minified);
        AppState.lastAction = 'minify';
        const reduction = (100 - (minified.length / input.length * 100)).toFixed(2);
        showSuccess(`✓ Minified! Size reduced by ${reduction}%`);
        saveToHistory(input);
    } catch (error) {
        showError('Minify Error: ' + error.message);
    }
}

/**
 * Handle Validate button click
 */
function handleValidate() {
    const input = getInputValue();

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to validate');
            return;
        }

        validateJSON(input);
        AppState.lastAction = 'validate';
        showSuccess('✓ Valid JSON! No errors found.');
        displayValidationStats(input);
        saveToHistory(input);
    } catch (error) {
        showError('JSON Error: ' + error.message);
        displaySuggestions(input);
    }
}

/**
 * Handle Copy button click
 */
function handleCopy() {
    const output = getOutputValue();
    if (!output) {
        showError('Nothing to copy. Please format JSON first.');
        return;
    }

    copyToClipboard(output).then(() => {
        showSuccess('✓ Copied to clipboard!');
        // Visual feedback
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }
    }).catch(err => {
        showError('Failed to copy: ' + err.message);
    });
}

/**
 * Handle Download button click
 */
function handleDownload() {
    const output = getOutputValue();
    if (!output) {
        showError('Nothing to download. Please format JSON first.');
        return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(output, `json-${timestamp}.json`, 'application/json');
    showSuccess('✓ File downloaded!');
}

/**
 * Handle Clear button click
 */
function handleClear() {
    setInputValue('');
    setOutputValue('');
    clearError();
    showSuccess('✓ Cleared!');
}

/**
 * Handle paste event with auto-format
 */
function handlePaste(e) {
    setTimeout(() => {
        const input = getInputValue();
        if (input && input.length > 0) {
            try {
                const formatted = formatJSON(input);
                setOutputValue(formatted);
                clearError();
            } catch (error) {
                // Silent fail - user can click format manually
            }
        }
    }, 10);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter: Format
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleFormat();
    }
    // Ctrl/Cmd + L: Clear
    else if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClear();
    }
}

// ========== THEME MANAGEMENT ==========

/**
 * Toggle dark mode
 */
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    body.classList.toggle('dark-mode');
    
    // Save preference
    const isDarkMode = body.classList.contains('dark-mode');
    AppState.isDarkMode = isDarkMode;
    saveToLocalStorage('darkMode', isDarkMode);
    
    // Update button text
    if (themeToggle) {
        themeToggle.textContent = isDarkMode ? '☀️ Light' : '🌙 Dark';
    }
}

/**
 * Initialize theme from localStorage
 */
function initializeTheme() {
    const darkMode = getFromLocalStorage('darkMode') === true;
    const themeToggle = document.getElementById('theme-toggle');
    
    AppState.isDarkMode = darkMode;
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️ Light';
    } else {
        if (themeToggle) themeToggle.textContent = '🌙 Dark';
    }
}

// ========== UI HELPERS ==========

/**
 * Get input textarea value
 */
function getInputValue() {
    const inputJSON = document.getElementById('inputJSON');
    return inputJSON ? inputJSON.value.trim() : '';
}

/**
 * Set input textarea value
 */
function setInputValue(value) {
    const inputJSON = document.getElementById('inputJSON');
    if (inputJSON) {
        inputJSON.value = value;
    }
}

/**
 * Get output textarea value
 */
function getOutputValue() {
    const outputJSON = document.getElementById('outputJSON');
    return outputJSON ? outputJSON.value.trim() : '';
}

/**
 * Set output textarea value
 */
function setOutputValue(value) {
    const outputJSON = document.getElementById('outputJSON');
    if (outputJSON) {
        outputJSON.value = value;
    }
}

/**
 * Display error message
 */
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = '⚠️ ' + message;
        errorContainer.style.display = 'block';
        errorContainer.style.backgroundColor = '#f8d7da';
        errorContainer.style.color = '#721c24';
        errorContainer.style.borderColor = '#f5c6cb';
    }
}

/**
 * Display success message
 */
function showSuccess(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = message;
        errorContainer.style.display = 'block';
        errorContainer.style.backgroundColor = '#d4edda';
        errorContainer.style.color = '#155724';
        errorContainer.style.borderColor = '#c3e6cb';
        
        setTimeout(() => {
            clearError();
        }, 3000);
    }
}

/**
 * Clear error message
 */
function clearError() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';
    }
}

/**
 * Display validation statistics
 */
function displayValidationStats(jsonString) {
    try {
        const obj = JSON.parse(jsonString);
        const stats = getJSONStats(jsonString);
        
        if (stats) {
            const statsMsg = `✓ Stats: Size: ${stats.size} | Keys: ${stats.keys} | Arrays: ${stats.arrays} | Objects: ${stats.objects}`;
            showSuccess(statsMsg);
        }
    } catch (e) {
        // Silently fail stats calculation
    }
}

/**
 * Display error suggestions
 */
function displaySuggestions(jsonString) {
    const suggestions = getSuggestions(jsonString);
    if (suggestions.length > 0) {
        const msg = 'Suggestions: ' + suggestions.slice(0, 2).join(' ');
        showError(msg);
    }
}

// ========== HISTORY MANAGEMENT ==========

/**
 * Save JSON to history
 */
function saveToHistory(jsonString) {
    if (!jsonString || jsonString.length === 0) return;
    saveJSONToHistory(jsonString);
}

/**
 * Load history from storage
 */
function loadHistoryFromStorage() {
    const history = getJSONHistory();
    AppState.history = history;
}
