// ============================================
// JSON VALIDATOR MODULE
// Comprehensive JSON validation and error detection
// ============================================

/**
 * Convert a raw JSON.parse error into a developer-friendly explanation.
 * Walks the input around the parser-failure point to locate the *actual*
 * mistake (e.g. trailing comma is reported one token later by V8).
 *
 * @param {string} input        - Original JSON text
 * @param {string} errorMessage - error.message from JSON.parse
 * @returns {{title:string, hint:string, line:number, column:number, position:number, rawMessage:string}}
 */
function normalizeJSONError(input, errorMessage) {
    const msg = String(errorMessage || '');
    const text = String(input || '');

    const result = {
        title: msg,
        hint: '',
        line: 1,
        column: 1,
        position: 0,
        rawMessage: msg
    };

    // Extract position (V8/Chrome: "at position N")
    const posMatch = msg.match(/at position (\d+)/i);
    let pos = posMatch ? parseInt(posMatch[1], 10) : -1;

    // Extract line/col (Firefox + newer V8: "(line N column M)")
    const lcMatch = msg.match(/line (\d+) column (\d+)/i);
    if (lcMatch) {
        result.line = parseInt(lcMatch[1], 10);
        result.column = parseInt(lcMatch[2], 10);
    }

    // Compute line/col from position when only position is given
    if (pos >= 0) {
        result.position = pos;
        if (!lcMatch) {
            const before = text.slice(0, pos);
            result.line = (before.match(/\n/g) || []).length + 1;
            result.column = pos - before.lastIndexOf('\n');
        }
    }

    // Walk backward from the parser failure point to find the real culprit
    function prevNonWhitespace(fromIdx) {
        let i = fromIdx - 1;
        while (i >= 0 && /\s/.test(text[i])) i--;
        return i >= 0 ? { char: text[i], pos: i } : null;
    }

    // Walk forward — V8 sometimes points to whitespace just before the offender
    function nextNonWhitespace(fromIdx) {
        let i = fromIdx;
        while (i < text.length && /\s/.test(text[i])) i++;
        return i < text.length ? { char: text[i], pos: i } : null;
    }

    function locOf(p) {
        const before = text.slice(0, p);
        const line = (before.match(/\n/g) || []).length + 1;
        const column = p - before.lastIndexOf('\n');
        return { line, column };
    }

    const trailingCommaTriggers =
        /Expected (double-quoted )?property name|Unexpected token .?[}\]]|Unexpected token (\\?")?[}\]]/i;

    // ── Pattern 1: Trailing comma ─────────────────────────────────────────────
    // Parser fails one token after the stray comma; rewind to find it.
    if (pos >= 0 && trailingCommaTriggers.test(msg)) {
        const prev = prevNonWhitespace(pos);
        if (prev && prev.char === ',') {
            const loc = locOf(prev.pos);
            return {
                title: `Trailing comma at line ${loc.line}`,
                hint: 'Remove the comma after the last item before the closing bracket — JSON does not allow trailing commas.',
                line: loc.line,
                column: loc.column,
                position: prev.pos,
                rawMessage: msg
            };
        }
    }

    // ── Pattern 2: Single quotes ──────────────────────────────────────────────
    if (pos >= 0) {
        const here = text.charAt(pos);
        const prev = prevNonWhitespace(pos);
        const sqPos = here === "'" ? pos : (prev && prev.char === "'" ? prev.pos : -1);
        if (sqPos >= 0) {
            const loc = locOf(sqPos);
            return {
                title: `Single quote at line ${loc.line} — JSON requires double quotes`,
                hint: "Replace ' with \" — JSON only allows double-quoted strings and property names.",
                line: loc.line,
                column: loc.column,
                position: sqPos,
                rawMessage: msg
            };
        }
    }

    // ── Pattern 3: Unquoted property name ─────────────────────────────────────
    if (pos >= 0 && /Expected (double-quoted )?property name/i.test(msg)) {
        const here = text.charAt(pos);
        if (/[a-zA-Z_$]/.test(here)) {
            return {
                title: `Unquoted property name at line ${result.line}`,
                hint: 'JSON property names must be wrapped in double quotes, e.g. "name": value.',
                line: result.line,
                column: result.column,
                position: pos,
                rawMessage: msg
            };
        }
    }

    // ── Pattern 4: Unterminated string ────────────────────────────────────────
    if (/Unterminated string|Bad string|Bad control character/i.test(msg)) {
        return {
            title: `Unterminated string at line ${result.line}`,
            hint: 'A string starts with " but never closes. Check for a missing closing quote on a string value.',
            line: result.line,
            column: result.column,
            position: Math.max(0, pos),
            rawMessage: msg
        };
    }

    // ── Pattern 5a: Mismatched closing bracket ────────────────────────────────
    // V8: "Expected ',' or '}' after property value..."  → inside an object
    //     "Expected ',' or ']' after array element..."   → inside an array
    // If the next real character is the *opposite* closer, the structure is
    // wrong (someone closed an object with ] or an array with }).
    const expectedMatch = msg.match(/Expected ',' or '([}\]])'/);
    if (expectedMatch && pos >= 0) {
        const expectedClose = expectedMatch[1];                 // '}' or ']'
        const oppositeClose = expectedClose === '}' ? ']' : '}';
        const ahead = nextNonWhitespace(pos);
        if (ahead && ahead.char === oppositeClose) {
            const loc = locOf(ahead.pos);
            const containerName = expectedClose === '}' ? 'object' : 'array';
            return {
                title: `Missing closing ${expectedClose} before ${oppositeClose} at line ${loc.line}`,
                hint: `An ${containerName} was opened earlier but never closed — add the missing ${expectedClose} before this ${oppositeClose}.`,
                line: loc.line,
                column: loc.column,
                position: ahead.pos,
                rawMessage: msg
            };
        }
        // Same context (expected closer matches actual context) → real missing comma
        return {
            title: `Missing comma at line ${result.line}`,
            hint: `Each property in an object and each item in an array must be separated by a comma. The parser was expecting either a comma or '${expectedClose}' here.`,
            line: result.line,
            column: result.column,
            position: Math.max(0, pos),
            rawMessage: msg
        };
    }

    // ── Pattern 5b: Older V8 missing-comma messages ───────────────────────────
    // "Unexpected string ...", "Unexpected number ...", "Unexpected token { ..."
    if (/Unexpected (string|number|true|false|null)/i.test(msg) ||
        /Unexpected token .?[\{\[]/i.test(msg)) {
        return {
            title: `Missing comma at line ${result.line}`,
            hint: 'Each property in an object and each item in an array must be separated by a comma.',
            line: result.line,
            column: result.column,
            position: Math.max(0, pos),
            rawMessage: msg
        };
    }

    // ── Pattern 6: Unexpected end of input ────────────────────────────────────
    if (/Unexpected end/i.test(msg)) {
        const loc = pos >= 0 ? locOf(Math.min(pos, text.length)) : { line: result.line, column: result.column };
        return {
            title: 'Unexpected end of JSON input',
            hint: 'The JSON appears incomplete — check for missing closing brackets, braces, or quotes.',
            line: loc.line,
            column: loc.column,
            position: Math.max(0, pos),
            rawMessage: msg
        };
    }

    // ── Pattern 7: Unexpected closing bracket ─────────────────────────────────
    // Reaches here only when Patterns 1 (trailing comma) and 5a (mismatch) didn't
    // match — i.e. genuinely unexpected closer, likely an extra one or wrong nesting.
    const closingMatch = msg.match(/Unexpected token .?([}\]])/i);
    if (closingMatch) {
        const closer = closingMatch[1];
        const opener = closer === '}' ? '{' : '[';
        return {
            title: `Unexpected ${closer} at line ${result.line}`,
            hint: `This ${closer} has no matching open ${opener}, or the structure is closed in the wrong order. Check that every ${opener} has a matching ${closer} at the right nesting level.`,
            line: result.line,
            column: result.column,
            position: Math.max(0, pos),
            rawMessage: msg
        };
    }

    // ── Default: keep raw but format the headline cleanly ─────────────────────
    if (lcMatch || posMatch) {
        result.title = `JSON parse error at line ${result.line}, column ${result.column}`;
        result.hint = msg;
    }
    return result;
}

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
