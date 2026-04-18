# JSON Formatter - Core Features Documentation

## Overview
Complete documentation of all core features implemented in the JSON Formatter application.

---

## 📋 Table of Contents
1. [Formatting Features](#formatting-features)
2. [Validation Features](#validation-features)
3. [Utility Features](#utility-features)
4. [Conversion Features](#conversion-features)
5. [UI Features](#ui-features)
6. [Data Management](#data-management)

---

## Formatting Features

### 1. **JSON Format** ✨
**Function:** `formatJSON(jsonString)`

Pretty prints JSON with proper indentation (2 spaces by default).

```javascript
// Input
{"name":"John","age":30,"city":"New York"}

// Output
{
  "name": "John",
  "age": 30,
  "city": "New York"
}
```

### 2. **JSON Minify** 📦
**Function:** `minifyJSON(jsonString)`

Removes all unnecessary whitespace to reduce file size.

```javascript
// Input
{
  "name": "John",
  "age": 30
}

// Output
{"name":"John","age":30}
```

### 3. **Custom Indentation**
**Functions:**
- `formatWithIndent(jsonString, indent)` - Format with custom spaces (1-8)
- `formatWithTabs(jsonString, tabs)` - Format using tabs

```javascript
// 4 spaces
{
    "name": "John",
    "age": 30
}

// Using tabs
{
→   "name": "John",
→   "age": 30
}
```

### 4. **Sort JSON Keys** 🔤
**Function:** `sortJSONKeys(jsonString)`

Sorts all object keys alphabetically for consistent ordering.

```javascript
// Input
{"z":"last","a":"first","m":"middle"}

// Output
{
  "a": "first",
  "m": "middle",
  "z": "last"
}
```

### 5. **Beautify JSON** 🎨
**Function:** `beautifyJSON(jsonString, indentation)`

Beautifies JSON with custom indentation levels (2, 4, or 8).

### 6. **Syntax Highlighting**
**Function:** `addSyntaxHighlight(jsonString)`

Adds HTML syntax highlighting for different JSON elements:
- Keys: blue
- Strings: green
- Numbers: red
- Booleans: orange
- Null: gray

---

## Validation Features

### 1. **JSON Validation** ✔️
**Function:** `validateJSON(jsonString)`

Validates if JSON string is syntactically correct.

```javascript
// Valid
validateJSON('{"test":true}') // Returns: true

// Invalid
validateJSON('{invalid}') // Throws error
```

**Returns:** `boolean` or throws error

### 2. **Detailed Validation**
**Function:** `validateJSONDetailed(jsonString)`

Returns detailed validation results with statistics.

```javascript
{
  valid: true,
  error: null,
  message: "Valid JSON! No errors found.",
  stats: {
    size: "50 B",
    keys: 3,
    arrays: 1,
    objects: 2,
    depth: 3
  }
}
```

### 3. **Error Detection** 🔍
**Function:** `getJSONErrorDetails(jsonString)`

Provides detailed error information including position and context.

```javascript
{
  message: "Unexpected token...",
  position: 15,
  line: 2,
  context: "...part of error context..."
}
```

### 4. **Find All Errors**
**Function:** `findJSONErrors(jsonString)`

Returns array of all detected errors and warnings.

### 5. **Error Suggestions**
**Function:** `getSuggestions(jsonString)`

Provides helpful suggestions to fix common JSON errors:
- ❌ Single quotes → ✔️ Use double quotes
- ❌ undefined → ✔️ Use null
- ❌ Trailing commas → ✔️ Remove them
- ❌ Unescaped quotes → ✔️ Escape properly

### 6. **JSON Statistics** 📊
**Function:** `getJSONStats(jsonString)`

Returns comprehensive statistics about JSON structure:

```javascript
{
  size: "150 B",
  minifiedSize: "120 B",
  formatted: "...",
  minified: "...",
  lines: 15,
  compression: "20%"
}
```

---

## Utility Features

### 1. **Clipboard Operations** 📋
**Functions:**
- `copyToClipboard(text)` - Copy to clipboard
- Modern API with fallback for older browsers

```javascript
copyToClipboard(jsonString).then(() => {
  console.log('Copied successfully!');
});
```

### 2. **File Operations** 📁
**Functions:**
- `downloadFile(content, filename, mimeType)` - Download as file
- `getFileFromUpload(file)` - Read uploaded file

```javascript
downloadFile(jsonString, 'data.json', 'application/json');
```

### 3. **Size Calculation**
**Function:** `getJSONSize(jsonString)`

Returns human-readable file size:
- Bytes: "150 B"
- Kilobytes: "2.50 KB"
- Megabytes: "1.25 MB"

### 4. **JSON Comparison** 🔄
**Function:** `compareJSON(json1, json2)`

Compares two JSON strings for equality.

```javascript
compareJSON('{"a":1}', '{"a":1}') // true
compareJSON('{"a":1}', '{"a":2}') // false
```

### 5. **Local Storage** 💾
**Functions:**
- `saveToLocalStorage(key, value)` - Save data
- `getFromLocalStorage(key)` - Retrieve data
- `removeFromLocalStorage(key)` - Delete data
- `clearLocalStorage()` - Clear all

### 6. **History Management**
**Functions:**
- `saveJSONToHistory(jsonString, name)` - Save to history
- `getJSONHistory()` - Get history entries
- `clearJSONHistory()` - Clear history

---

## Conversion Features

### 1. **JSON to CSV** 📊
**Function:** `jsonToCSV(jsonString, includeHeader)`

Converts JSON array to CSV format.

```javascript
// Input
[{"name":"John","age":30},{"name":"Jane","age":25}]

// Output
name,age
John,30
Jane,25
```

**Features:**
- ✓ Handles quoted values
- ✓ Escapes special characters
- ✓ Optional header row

### 2. **CSV to JSON** 📈
**Function:** `csvToJSON(csvString, hasHeader)`

Converts CSV to JSON array of objects.

```javascript
// Input
name,age
John,30
Jane,25

// Output
[
  {"name":"John","age":"30"},
  {"name":"Jane","age":"25"}
]
```

### 3. **JSON to YAML** 📝
**Function:** `jsonToYAML(jsonString)`

Converts JSON to YAML format.

```javascript
// Input
{"name":"John","age":30,"address":{"city":"NYC"}}

// Output
name: "John"
age: 30
address:
  city: "NYC"
```

---

## UI Features

### 1. **Dark Mode** 🌙
**Functions:**
- `toggleTheme()` - Toggle dark/light mode
- `initializeTheme()` - Initialize saved theme

**Features:**
- Persistent theme preference
- Smooth transitions
- Contrast-optimized colors

### 2. **Keyboard Shortcuts** ⌨️
| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Format JSON |
| `Ctrl+L` | Clear all |

### 3. **Auto-format on Paste**
Automatically formats JSON when pasted into input field.

### 4. **Real-time Validation**
Shows validation errors and suggestions as you type.

### 5. **Status Messages**
- ✅ Success messages (green)
- ⚠️ Error messages (red)
- ℹ️ Info messages (blue)

### 6. **Copy Feedback**
- Button text changes to "✓ Copied!" on click
- Auto-reverts after 2 seconds

---

## Data Management

### 1. **History Tracking**
Automatically saves last 10 formatted JSONs with:
- Timestamp
- Preview (first 100 chars)
- Full content

### 2. **Application State**
Global state object tracks:
- History entries
- Last action performed
- Dark mode status
- User preferences

### 3. **Data Persistence**
All data stored in browser's localStorage:
- Theme preference
- JSON history
- User settings

**Storage structure:**
```javascript
localStorage.darkMode = true/false
localStorage.jsonHistory = [...]
```

---

## Advanced Features

### 1. **Error Context**
Shows surrounding text where error occurred.

### 2. **Recursive Analysis**
Counts nested structures:
- Total keys at all levels
- Array count including nested
- Object count including nested
- Maximum depth

### 3. **Compression Statistics**
- Original size vs minified size
- Compression percentage
- Byte reduction

### 4. **Function Utilities**
- `debounce()` - Delay function execution
- `throttle()` - Rate limit function calls
- `generateRandomJSON()` - Demo data generator

---

## Usage Examples

### Format and Download
```javascript
const json = '{"name":"John"}';
const formatted = formatJSON(json);
downloadFile(formatted, 'output.json');
```

### Validate with Suggestions
```javascript
try {
  validateJSON(userInput);
  console.log('Valid!');
} catch (e) {
  const suggestions = getSuggestions(userInput);
  console.log('Fix these:', suggestions);
}
```

### Convert and Save
```javascript
const csv = jsonToCSV(jsonString);
saveToLocalStorage('converted_csv', csv);
```

### Complete Workflow
```javascript
// 1. Validate
validateJSON(input);

// 2. Format
const formatted = formatJSON(input);

// 3. Get stats
const stats = getJSONStats(formatted);

// 4. Save to history
saveJSONToHistory(input);

// 5. Download
downloadFile(formatted, 'data.json');
```

---

## Performance Features

✅ **Client-side processing** - No server requests
✅ **Instant parsing** - <100ms for typical JSONs
✅ **Memory efficient** - Handles large files
✅ **No storage limits** - Unlike cloud services
✅ **Offline capable** - Works without internet

---

## Security Features

✅ **Data privacy** - Data never leaves browser
✅ **No logging** - No tracking of user data
✅ **No uploads** - Everything local
✅ **Open source** - Code is transparent
✅ **Safe escaping** - Proper character handling

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Formatting | ✓ | ✓ | ✓ | ✓ |
| Validation | ✓ | ✓ | ✓ | ✓ |
| Clipboard API | ✓ | ✓ | ✓ | ✓ |
| Dark Mode | ✓ | ✓ | ✓ | ✓ |
| LocalStorage | ✓ | ✓ | ✓ | ✓ |

---

## API Reference

### Core Functions Summary

```javascript
// Formatting
formatJSON(jsonString)
minifyJSON(jsonString)
formatWithIndent(jsonString, indent)
sortJSONKeys(jsonString)

// Validation
validateJSON(jsonString)
validateJSONDetailed(jsonString)
findJSONErrors(jsonString)
getSuggestions(jsonString)

// Utilities
getJSONSize(jsonString)
compareJSON(json1, json2)
getJSONStats(jsonString)
generateRandomJSON()

// Conversions
jsonToCSV(jsonString, includeHeader)
csvToJSON(csvString, hasHeader)
jsonToYAML(jsonString)

// Storage
saveToLocalStorage(key, value)
getFromLocalStorage(key)
saveJSONToHistory(jsonString, name)
```

---

## Testing

Comprehensive test suite available in `tests.js`:

```javascript
// Run all tests
runAllTests();

// Run demo with sample data
runDemoWithSamples();
```

**Test coverage:**
- ✓ Formatting functions
- ✓ Validation functions
- ✓ Utility functions
- ✓ Conversion functions
- ✓ Error handling

---

## AdSense Integration 🚀

### Conditional Ad Display System
**Smart ad management that shows ads only when they're available**

#### **How It Works**
- **Automatic Detection**: Checks if AdSense ads load successfully
- **Conditional Display**: Shows ad spaces only when ads are received
- **Ad Blocker Friendly**: Hides ad containers when ads are blocked
- **Fallback Handling**: Multiple detection methods for reliability

#### **Ad Locations**
1. **Header Ad**: Above main content (728x90 responsive)
2. **Content Ad**: Between formatter and features (300x250 responsive)

#### **Technical Implementation**
```javascript
// Automatic ad initialization
initializeAds();

// Monitors ad load status
monitorAdLoad();

// Shows ads when loaded
showAd('header-ad');

// Hides ads when not available
hideAd('content-ad');
```

#### **Testing Functions**
Available in browser console for testing:
```javascript
// Test ad loading scenarios
testAdLoading();

// Force show all ads
forceShowAds();

// Force hide all ads
forceHideAds();
```

#### **Setup Requirements**
1. Replace `ca-pub-XXXXXXXXXXXXXXXX` with your AdSense publisher ID
2. Replace `XXXXXXXXXX` with your actual ad slot IDs
3. Ensure AdSense approval for your domain

#### **Benefits**
- ✅ **Clean UI**: No empty ad spaces when ads don't load
- ✅ **Better UX**: Users only see ads when they're actually displayed
- ✅ **Ad Blocker Compatible**: Gracefully handles ad blocking
- ✅ **Performance**: No wasted space or layout shifts

---

**Last Updated:** April 2026
**Version:** 1.0.0
**Status:** Production Ready
