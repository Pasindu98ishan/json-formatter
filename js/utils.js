// ============================================
// UTILITY FUNCTIONS MODULE
// Helper functions for JSON manipulation and conversions
// ============================================

/**
 * Enable drag-and-drop file upload on a textarea.
 * @param {string} textareaId - ID of the textarea element
 * @param {function} onLoad - Callback(content) called with file text after load
 * @param {string[]} [accepts] - Accepted file extensions e.g. ['.json']
 */
function initDragDrop(textareaId, onLoad, accepts) {
    const el = document.getElementById(textareaId);
    if (!el) return;

    el.addEventListener('dragover', function(e) {
        e.preventDefault();
        el.classList.add('drag-over');
    });

    el.addEventListener('dragleave', function(e) {
        if (!el.contains(e.relatedTarget)) el.classList.remove('drag-over');
    });

    el.addEventListener('drop', function(e) {
        e.preventDefault();
        el.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (accepts && accepts.length) {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!accepts.includes(ext)) {
                alert('Unsupported file type. Expected: ' + accepts.join(', '));
                return;
            }
        }
        const reader = new FileReader();
        reader.onload = function(ev) { onLoad(ev.target.result); };
        reader.readAsText(file);
    });
}

// ========== CLIPBOARD & FILE OPERATIONS ==========

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise} Promise that resolves when copied
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return Promise.resolve();
    }
}

/**
 * Download content as file
 * @param {string} content - Content to download
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename = 'data.json', mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Read file from upload input
 * @param {File} file - File object
 * @returns {Promise} Promise with file content
 */
function getFileFromUpload(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// ========== JSON SIZE & STATS ==========

/**
 * Get JSON file size in readable format
 * @param {string} jsonString - JSON string
 * @returns {string} Formatted size string
 */
function getJSONSize(jsonString) {
    const bytes = new Blob([jsonString]).size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Compare two JSON strings for equality
 * @param {string} json1 - First JSON string
 * @param {string} json2 - Second JSON string
 * @returns {boolean} True if equal
 */
function compareJSON(json1, json2) {
    try {
        const obj1 = JSON.parse(json1);
        const obj2 = JSON.parse(json2);
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    } catch (e) {
        return false;
    }
}

/**
 * Get comprehensive JSON statistics
 * @param {string} jsonString - JSON string
 * @returns {object} Statistics object
 */
function getJSONStats(jsonString) {
    try {
        const obj = JSON.parse(jsonString);
        const formatted = JSON.stringify(obj, null, 2);
        const minified = JSON.stringify(obj);
        
        return {
            size: getJSONSize(jsonString),
            minifiedSize: getJSONSize(minified),
            formatted: formatted,
            minified: minified,
            lines: jsonString.split('\n').length,
            compression: (100 - (minified.length / formatted.length * 100)).toFixed(2) + '%'
        };
    } catch (e) {
        return null;
    }
}

// ========== JSON CONVERSIONS ==========

/**
 * Convert JSON to CSV format
 * @param {string} jsonString - JSON string (array of objects)
 * @param {boolean} includeHeader - Include header row
 * @returns {string} CSV formatted string
 */
function jsonToCSV(jsonString, includeHeader = true) {
    try {
        const obj = JSON.parse(jsonString);
        
        if (!Array.isArray(obj) || obj.length === 0) {
            throw new Error('Input must be a non-empty array of objects');
        }
        
        const headers = Object.keys(obj[0]);
        let csv = '';
        
        if (includeHeader) {
            csv = headers.join(',') + '\n';
        }
        
        obj.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) {
                    return '';
                }
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });
        
        return csv;
    } catch (error) {
        throw new Error('CSV conversion failed: ' + error.message);
    }
}

/**
 * Convert CSV to JSON format
 * @param {string} csvString - CSV formatted string
 * @param {boolean} hasHeader - First row is header
 * @returns {string} JSON formatted string
 */
function csvToJSON(csvString, hasHeader = true) {
    try {
        const lines = csvString.trim().split('\n');
        if (lines.length === 0) {
            throw new Error('Empty CSV input');
        }
        
        let headers = [];
        let startIndex = 0;
        
        if (hasHeader) {
            headers = parseCSVLine(lines[0]);
            startIndex = 1;
        } else {
            headers = Array.from({ length: parseCSVLine(lines[0]).length }, (_, i) => `column${i + 1}`);
        }
        
        const data = [];
        for (let i = startIndex; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            data.push(obj);
        }
        
        return JSON.stringify(data, null, 2);
    } catch (error) {
        throw new Error('CSV to JSON conversion failed: ' + error.message);
    }
}

/**
 * Parse a CSV line handling quoted values
 * @private
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

/**
 * Convert JSON to YAML format
 * @param {string} jsonString - JSON string
 * @returns {string} YAML formatted string
 */
function jsonToYAML(jsonString) {
    try {
        const obj = JSON.parse(jsonString);
        return objToYAML(obj);
    } catch (error) {
        throw new Error('JSON to YAML conversion failed: ' + error.message);
    }
}

/**
 * Convert object to YAML string
 * @private
 */
function objToYAML(obj, indent = 0) {
    const spaces = ' '.repeat(indent);
    let yaml = '';
    
    if (Array.isArray(obj)) {
        obj.forEach(item => {
            yaml += spaces + '- ';
            if (typeof item === 'object' && item !== null) {
                if (Array.isArray(item)) {
                    yaml += '\n' + objToYAML(item, indent + 2).substring(indent + 2);
                } else {
                    const first = Object.keys(item)[0];
                    yaml += first + ': ' + formatYAMLValue(item[first]) + '\n';
                    const rest = Object.keys(item).slice(1);
                    rest.forEach(key => {
                        yaml += spaces + '  ' + key + ': ' + formatYAMLValue(item[key]) + '\n';
                    });
                }
            } else {
                yaml += formatYAMLValue(item) + '\n';
            }
        });
    } else {
        Object.keys(obj).forEach(key => {
            yaml += spaces + key + ': ';
            const value = obj[key];
            if (typeof value === 'object' && value !== null) {
                yaml += '\n' + objToYAML(value, indent + 2);
            } else {
                yaml += formatYAMLValue(value) + '\n';
            }
        });
    }
    
    return yaml;
}

/**
 * Format YAML value
 * @private
 */
function formatYAMLValue(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return '"' + value.replace(/"/g, '\\"') + '"';
    if (typeof value === 'boolean') return value.toString();
    return value.toString();
}

// ========== FUNCTIONAL UTILITIES ==========

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Milliseconds limit
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== URL & QUERY PARAMETERS ==========

/**
 * Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string} Parameter value or null
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set query parameter in URL
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// ========== LOCAL STORAGE ==========

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Storage error:', e);
        return false;
    }
}

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @returns {*} Stored value or null
 */
function getFromLocalStorage(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (e) {
        console.error('Storage error:', e);
        return null;
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error('Storage error:', e);
        return false;
    }
}

/**
 * Clear all localStorage
 * @returns {boolean} Success status
 */
function clearLocalStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (e) {
        console.error('Storage error:', e);
        return false;
    }
}

// ========== JSON HISTORY ==========

/**
 * Save JSON to history
 * @param {string} jsonString - JSON to save
 * @param {string} name - Optional name for the JSON
 */
function saveJSONToHistory(jsonString, name) {
    if (!jsonString) return;
    
    const history = getFromLocalStorage('jsonHistory') || [];
    const entry = {
        id: Date.now(),
        name: name || 'Untitled ' + (history.length + 1),
        content: jsonString,
        timestamp: new Date().toISOString()
    };
    
    history.unshift(entry);
    history.splice(10); // Keep only last 10
    
    saveToLocalStorage('jsonHistory', history);
}

/**
 * Get JSON history
 * @returns {array} Array of history entries
 */
function getJSONHistory() {
    return getFromLocalStorage('jsonHistory') || [];
}

/**
 * Clear JSON history
 */
function clearJSONHistory() {
    removeFromLocalStorage('jsonHistory');
}

// ========== GENERATORS ==========

/**
 * Generate random JSON object
 * @returns {string} Random JSON string
 */
function generateRandomJSON() {
    const data = {
        id: Math.floor(Math.random() * 10000),
        name: 'Sample User ' + Math.floor(Math.random() * 100),
        email: 'user' + Math.floor(Math.random() * 1000) + '@example.com',
        age: Math.floor(Math.random() * 60) + 18,
        active: Math.random() > 0.5,
        tags: ['tag1', 'tag2', 'tag3'],
        metadata: {
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        }
    };
    return JSON.stringify(data, null, 2);
}
