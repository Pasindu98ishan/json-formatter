// ============================================
// TEST SUITE FOR CORE FEATURES
// Comprehensive testing of all JSON formatter functions
// ============================================

/**
 * Run all tests
 */
function runAllTests() {
    console.log('🧪 Starting JSON Formatter Test Suite...\n');
    
    testFormattingFunctions();
    testValidationFunctions();
    testUtilityFunctions();
    testConversionFunctions();
    
    console.log('\n✅ All tests completed!\n');
}

// ========== FORMATTING TESTS ==========

function testFormattingFunctions() {
    console.log('📝 Testing Formatting Functions...');
    
    const testJSON = '{"name":"John","age":30,"city":"New York"}';
    
    // Test Format
    try {
        const formatted = formatJSON(testJSON);
        console.log('✓ formatJSON:', formatted.includes('\n') ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ formatJSON: ERROR -', e.message);
    }
    
    // Test Minify
    try {
        const minified = minifyJSON(testJSON);
        console.log('✓ minifyJSON:', minified.includes('\n') ? 'FAIL' : 'PASS');
    } catch (e) {
        console.log('✗ minifyJSON: ERROR -', e.message);
    }
    
    // Test Format with Custom Indent
    try {
        const formatted4 = formatWithIndent(testJSON, 4);
        console.log('✓ formatWithIndent:', formatted4.includes('    ') ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ formatWithIndent: ERROR -', e.message);
    }
    
    // Test Sort Keys
    try {
        const sorted = sortJSONKeys(testJSON);
        console.log('✓ sortJSONKeys:', sorted.length > 0 ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ sortJSONKeys: ERROR -', e.message);
    }
}

// ========== VALIDATION TESTS ==========

function testValidationFunctions() {
    console.log('\n✅ Testing Validation Functions...');
    
    const validJSON = '{"test":true}';
    const invalidJSON = '{invalid}';
    
    // Test Validate Valid JSON
    try {
        const result = validateJSON(validJSON);
        console.log('✓ validateJSON (valid):', result ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ validateJSON (valid): ERROR -', e.message);
    }
    
    // Test Validate Invalid JSON
    try {
        validateJSON(invalidJSON);
        console.log('✗ validateJSON (invalid): FAIL - Should have thrown error');
    } catch (e) {
        console.log('✓ validateJSON (invalid):', e.message.includes('Unexpected') ? 'PASS' : 'FAIL');
    }
    
    // Test Detailed Validation
    try {
        const result = validateJSONDetailed(validJSON);
        console.log('✓ validateJSONDetailed:', result.valid ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ validateJSONDetailed: ERROR -', e.message);
    }
    
    // Test Error Detection
    try {
        const invalidWithQuote = "{'test':'value'}";
        const errors = findJSONErrors(invalidWithQuote);
        console.log('✓ findJSONErrors:', errors.length > 0 ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ findJSONErrors: ERROR -', e.message);
    }
}

// ========== UTILITY TESTS ==========

function testUtilityFunctions() {
    console.log('\n🛠️ Testing Utility Functions...');
    
    const testJSON = '{"test":"value"}';
    
    // Test Size Calculation
    try {
        const size = getJSONSize(testJSON);
        console.log('✓ getJSONSize:', size.includes('B') ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ getJSONSize: ERROR -', e.message);
    }
    
    // Test JSON Comparison
    try {
        const json1 = '{"a":1}';
        const json2 = '{"a":1}';
        const json3 = '{"a":2}';
        const result1 = compareJSON(json1, json2);
        const result2 = compareJSON(json1, json3);
        console.log('✓ compareJSON:', result1 && !result2 ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ compareJSON: ERROR -', e.message);
    }
    
    // Test Statistics
    try {
        const stats = getJSONStats(testJSON);
        console.log('✓ getJSONStats:', stats && stats.size ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ getJSONStats: ERROR -', e.message);
    }
    
    // Test Storage
    try {
        saveToLocalStorage('testKey', { test: 'value' });
        const retrieved = getFromLocalStorage('testKey');
        const success = retrieved && retrieved.test === 'value';
        removeFromLocalStorage('testKey');
        console.log('✓ localStorage operations:', success ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ localStorage: ERROR -', e.message);
    }
}

// ========== CONVERSION TESTS ==========

function testConversionFunctions() {
    console.log('\n🔄 Testing Conversion Functions...');
    
    // Test JSON to CSV
    try {
        const jsonArray = '[{"name":"John","age":30},{"name":"Jane","age":25}]';
        const csv = jsonToCSV(jsonArray);
        console.log('✓ jsonToCSV:', csv.includes('name') && csv.includes('age') ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ jsonToCSV: ERROR -', e.message);
    }
    
    // Test CSV to JSON
    try {
        const csv = 'name,age\nJohn,30\nJane,25';
        const json = csvToJSON(csv);
        const obj = JSON.parse(json);
        console.log('✓ csvToJSON:', Array.isArray(obj) && obj.length === 2 ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ csvToJSON: ERROR -', e.message);
    }
    
    // Test JSON to YAML
    try {
        const testJSON = '{"name":"John","age":30}';
        const yaml = jsonToYAML(testJSON);
        console.log('✓ jsonToYAML:', yaml.includes('name') && !yaml.includes('{') ? 'PASS' : 'FAIL');
    } catch (e) {
        console.log('✗ jsonToYAML: ERROR -', e.message);
    }
}

// ========== SAMPLE TESTS DATA ==========

const SAMPLE_DATA = {
    simple: '{"name":"John","age":30}',
    nested: '{"user":{"name":"John","address":{"city":"New York"}}}',
    array: '[{"id":1},{"id":2},{"id":3}]',
    complex: `{
        "users": [
            {"id": 1, "name": "John", "email": "john@example.com"},
            {"id": 2, "name": "Jane", "email": "jane@example.com"}
        ],
        "meta": {
            "total": 2,
            "page": 1
        }
    }`,
    invalid: '{invalid json}',
    withQuotes: "{'name':'John'}"
};

/**
 * Run demo with sample data
 */
function runDemoWithSamples() {
    console.log('🎯 Running demo with sample data...\n');
    
    Object.keys(SAMPLE_DATA).forEach(key => {
        console.log(`📊 Sample: ${key}`);
        console.log(`Input: ${SAMPLE_DATA[key].substring(0, 50)}...`);
        
        try {
            if (key === 'invalid' || key === 'withQuotes') {
                try {
                    formatJSON(SAMPLE_DATA[key]);
                } catch (e) {
                    console.log(`✓ Correctly detected error: ${e.message}\n`);
                }
            } else {
                const formatted = formatJSON(SAMPLE_DATA[key]);
                const minified = minifyJSON(SAMPLE_DATA[key]);
                console.log(`✓ Formatted: ${formatted.substring(0, 40)}...`);
                console.log(`✓ Minified: ${minified.substring(0, 40)}...`);
                console.log(`✓ Size: ${getJSONSize(SAMPLE_DATA[key])}\n`);
            }
        } catch (e) {
            console.log(`✗ Error: ${e.message}\n`);
        }
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        runDemoWithSamples,
        SAMPLE_DATA
    };
}
