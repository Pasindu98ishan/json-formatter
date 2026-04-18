// ============================================
// JSON FORMATTER MODULE
// Advanced JSON formatting, minification, and beautification
// ============================================

/**
 * Format JSON string with proper indentation
 * @param {string} jsonString - JSON string to format
 * @param {number} indent - Number of spaces for indentation (default: 2)
 * @returns {string} Formatted JSON string
 */
function formatJSON(jsonString) {
    try {
        const trimmed = jsonString.trim();
        if (!trimmed) throw new Error('Empty input');
        
        const parsed = JSON.parse(trimmed);
        return JSON.stringify(parsed, null, 2);
    } catch (error) {
        throw new Error('Invalid JSON: ' + error.message);
    }
}

/**
 * Minify JSON string by removing all unnecessary whitespace
 * @param {string} jsonString - JSON string to minify
 * @returns {string} Minified JSON string
 */
function minifyJSON(jsonString) {
    try {
        const trimmed = jsonString.trim();
        if (!trimmed) throw new Error('Empty input');
        
        const parsed = JSON.parse(trimmed);
        return JSON.stringify(parsed);
    } catch (error) {
        throw new Error('Invalid JSON: ' + error.message);
    }
}

/**
 * Beautify JSON with custom indentation
 * @param {string} jsonString - JSON string to beautify
 * @param {number} indentation - Number of spaces (2, 4, or 8)
 * @returns {string} Beautified JSON string
 */
function beautifyJSON(jsonString, indentation = 2) {
    try {
        const trimmed = jsonString.trim();
        if (!trimmed) throw new Error('Empty input');
        
        if (![2, 4, 8].includes(indentation)) {
            throw new Error('Indentation must be 2, 4, or 8 spaces');
        }
        
        const parsed = JSON.parse(trimmed);
        return JSON.stringify(parsed, null, indentation);
    } catch (error) {
        throw new Error('Invalid JSON: ' + error.message);
    }
}

/**
 * Format JSON with custom indentation
 * @param {string} jsonString - JSON string to format
 * @param {number} indent - Number of spaces for indentation
 * @returns {string} Formatted JSON string
 */
function formatWithIndent(jsonString, indent = 2) {
    try {
        const trimmed = jsonString.trim();
        if (!trimmed) throw new Error('Empty input');
        
        if (indent < 1 || indent > 8) {
            throw new Error('Indentation must be between 1 and 8 spaces');
        }
        
        const parsed = JSON.parse(trimmed);
        return JSON.stringify(parsed, null, indent);
    } catch (error) {
        throw new Error('Invalid JSON: ' + error.message);
    }
}

/**
 * Format JSON with custom indentation using tabs
 * @param {string} jsonString - JSON string to format
 * @param {number} tabs - Number of tabs for indentation
 * @returns {string} Formatted JSON string with tabs
 */
function formatWithTabs(jsonString, tabs = 1) {
    try {
        const trimmed = jsonString.trim();
        if (!trimmed) throw new Error('Empty input');
        
        const parsed = JSON.parse(trimmed);
        const tabString = '\t'.repeat(tabs);
        return JSON.stringify(parsed, null, tabString);
    } catch (error) {
        throw new Error('Invalid JSON: ' + error.message);
    }
}

/**
 * Sort JSON object keys alphabetically
 * @param {string} jsonString - JSON string to sort
 * @returns {string} Sorted JSON string
 */
function sortJSONKeys(jsonString) {
    try {
        const trimmed = jsonString.trim();
        if (!trimmed) throw new Error('Empty input');
        
        const parsed = JSON.parse(trimmed);
        const sorted = sortObjectKeys(parsed);
        return JSON.stringify(sorted, null, 2);
    } catch (error) {
        throw new Error('Invalid JSON: ' + error.message);
    }
}

/**
 * Recursively sort object keys
 * @private
 */
function sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === 'object') {
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = sortObjectKeys(obj[key]);
        });
        return sorted;
    }
    return obj;
}

/**
 * Add syntax highlighting to JSON string
 * @param {string} jsonString - JSON string to highlight
 * @returns {string} HTML-formatted JSON with syntax highlighting
 */
function addSyntaxHighlight(jsonString) {
    return jsonString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="json-' + cls + '">' + match + '</span>';
        });
}

/**
 * Escape JSON string for safe display
 * @param {string} jsonString - JSON string to escape
 * @returns {string} Escaped JSON string
 */
function escapeJSON(jsonString) {
    return jsonString
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

/**
 * Unescape JSON string
 * @param {string} jsonString - Escaped JSON string
 * @returns {string} Unescaped JSON string
 */
function unescapeJSON(jsonString) {
    return jsonString
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}
