// ============================================
// JSON VALIDATOR MODULE
// Comprehensive JSON validation and error detection
// ============================================

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {boolean} True if valid, throws error otherwise
 */
function validateJSON(jsonString) {
    try {
        if (!jsonString || typeof jsonString !== 'string') {
            throw new Error('Input must be a non-empty string');
        }
        
        JSON.parse(jsonString);
        return true;
    } catch (error) {
        throw new Error(error.message);
    }
}

/**
 * Validate JSON with detailed error information
 * @param {string} jsonString - JSON string to validate
 * @returns {object} Validation result with details
 */
function validateJSONDetailed(jsonString) {
    try {
        const trimmed = jsonString.trim();
        
        if (!trimmed) {
            return {
                valid: false,
                error: 'Empty input',
                message: 'Please enter JSON data to validate'
            };
        }
        
        JSON.parse(trimmed);
        
        return {
            valid: true,
            error: null,
            message: 'Valid JSON! No errors found.',
            stats: getJSONStats(trimmed)
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message,
            message: 'JSON Error: ' + error.message,
            line: getLineNumber(jsonString, error.message)
        };
    }
}

/**
 * Get JSON error details with position information
 * @param {string} jsonString - JSON string to validate
 * @returns {object} Error details or null
 */
function getJSONErrorDetails(jsonString) {
    try {
        JSON.parse(jsonString);
        return null; // No error
    } catch (error) {
        const match = error.message.match(/position (\d+)/);
        const position = match ? parseInt(match[1]) : null;
        
        return {
            message: error.message,
            position: position,
            line: getLineNumber(jsonString, position),
            context: getErrorContext(jsonString, position)
        };
    }
}

/**
 * Get line number from string position
 * @private
 */
function getLineNumber(str, position) {
    if (!position) return 1;
    
    let line = 1;
    for (let i = 0; i < position && i < str.length; i++) {
        if (str[i] === '\n') {
            line++;
        }
    }
    return line;
}

/**
 * Get error context (surrounding text)
 * @private
 */
function getErrorContext(str, position) {
    if (!position || position < 0) return '';
    
    const start = Math.max(0, position - 20);
    const end = Math.min(str.length, position + 20);
    
    return str.substring(start, end);
}

/**
 * Validate JSON structure strictly
 * @param {string} jsonString - JSON string to validate
 * @returns {boolean} True if valid
 */
function validateJSONStrict(jsonString) {
    const trimmed = jsonString.trim();
    
    // Check if it starts with { or [ (valid JSON)
    if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
        throw new Error('JSON must start with { or [');
    }
    
    // Check if it ends with } or ] (valid JSON)
    if (!(trimmed.endsWith('}') || trimmed.endsWith(']'))) {
        throw new Error('JSON must end with } or ]');
    }
    
    try {
        JSON.parse(trimmed);
        return true;
    } catch (error) {
        throw error;
    }
}

/**
 * Find all JSON errors in string
 * @param {string} jsonString - JSON string to validate
 * @returns {array} Array of error objects
 */
function findJSONErrors(jsonString) {
    const errors = [];
    
    try {
        JSON.parse(jsonString);
    } catch (error) {
        errors.push({
            type: 'syntax',
            message: error.message,
            position: error.message.match(/position (\d+)/) ? parseInt(error.message.match(/position (\d+)/)[1]) : null
        });
    }
    
    // Check for common issues
    const commonErrors = checkCommonErrors(jsonString);
    errors.push(...commonErrors);
    
    return errors;
}

/**
 * Check for common JSON mistakes
 * @private
 */
function checkCommonErrors(jsonString) {
    const errors = [];
    
    // Check for single quotes
    if (jsonString.includes("'")) {
        const count = (jsonString.match(/'/g) || []).length;
        errors.push({
            type: 'warning',
            message: `Found ${count} single quote(s). JSON requires double quotes.`
        });
    }
    
    // Check for undefined
    if (jsonString.includes('undefined')) {
        errors.push({
            type: 'warning',
            message: "'undefined' is not valid JSON. Use null instead."
        });
    }
    
    // Check for NaN/Infinity
    if (jsonString.includes('NaN') || jsonString.includes('Infinity')) {
        errors.push({
            type: 'warning',
            message: 'NaN and Infinity are not valid JSON. Use null or a number.'
        });
    }
    
    // Check for trailing commas
    if (jsonString.match(/,\s*([}\]])/)) {
        errors.push({
            type: 'warning',
            message: 'Found trailing comma(s). Remove commas before closing brackets.'
        });
    }
    
    // Check for unescaped quotes in strings
    const unescapedQuotes = jsonString.match(/"[^"]*"[^"]*"[^"]*"/);
    if (unescapedQuotes) {
        errors.push({
            type: 'warning',
            message: 'Check for unescaped quotes in string values.'
        });
    }
    
    return errors;
}

/**
 * Get suggestions for fixing JSON errors
 * @param {string} jsonString - JSON string to validate
 * @returns {array} Array of suggestion strings
 */
function getSuggestions(jsonString) {
    const suggestions = [];
    
    // Check for common mistakes
    if (jsonString.includes("'")) {
        suggestions.push("▸ Replace single quotes (' ) with double quotes (\")");
    }
    
    if (jsonString.includes('undefined')) {
        suggestions.push("▸ Replace 'undefined' with null");
    }
    
    if (jsonString.includes('NaN')) {
        suggestions.push("▸ Replace NaN with null or a number");
    }
    
    if (jsonString.match(/,\s*([}\]])/)) {
        suggestions.push("▸ Remove trailing commas before closing brackets");
    }
    
    if (jsonString.includes('\\')) {
        suggestions.push("▸ Check backslash escaping in string values");
    }
    
    return suggestions;
}

/**
 * Check if string is valid JSON
 * @param {string} str - String to check
 * @returns {boolean} True if valid JSON
 */
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Get JSON statistics
 * @param {string} jsonString - JSON string to analyze
 * @returns {object} Statistics object
 */
function getJSONStats(jsonString) {
    try {
        const obj = JSON.parse(jsonString);
        const stats = {
            size: getJSONSize(jsonString),
            keys: countKeys(obj),
            arrays: countArrays(obj),
            objects: countObjects(obj),
            depth: getJSONDepth(obj),
            minified: obj.toString().length
        };
        return stats;
    } catch (e) {
        return null;
    }
}

/**
 * Count total keys in JSON object
 * @private
 */
function countKeys(obj) {
    let count = 0;
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            count++;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                count += countKeys(obj[key]);
            }
        }
    }
    return count;
}

/**
 * Count arrays in JSON
 * @private
 */
function countArrays(obj) {
    let count = 0;
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (Array.isArray(obj[key])) {
                count++;
                obj[key].forEach(item => {
                    if (typeof item === 'object' && item !== null) {
                        count += countArrays(item);
                    }
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                count += countArrays(obj[key]);
            }
        }
    }
    return count;
}

/**
 * Count objects in JSON
 * @private
 */
function countObjects(obj) {
    let count = 0;
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                count++;
                count += countObjects(obj[key]);
            }
        }
    }
    return count;
}

/**
 * Get maximum depth of JSON object
 * @private
 */
function getJSONDepth(obj) {
    if (typeof obj !== 'object' || obj === null) return 0;
    
    let maxDepth = 0;
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const depth = 1 + getJSONDepth(obj[key]);
            maxDepth = Math.max(maxDepth, depth);
        }
    }
    return maxDepth;
}
