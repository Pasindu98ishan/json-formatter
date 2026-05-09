// JSON to TypeScript Interface Generator

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function toPascalCase(str) {
    if (!str) return 'Item';
    return str
        .replace(/[_\-\s]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function singularize(name) {
    if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
    if (name.endsWith('ses') || name.endsWith('xes') || name.endsWith('ches')) return name.slice(0, -2);
    if (name.endsWith('s') && !name.endsWith('ss') && name.length > 2) return name.slice(0, -1);
    return name + 'Item';
}

function inferType(value, name, collector) {
    if (value === null)                return 'null';
    if (typeof value === 'string')     return 'string';
    if (typeof value === 'number')     return 'number';
    if (typeof value === 'boolean')    return 'boolean';

    if (Array.isArray(value)) {
        if (value.length === 0) return 'unknown[]';
        const itemName = singularize(name);
        const types = [...new Set(value.map(item => inferType(item, itemName, collector)))];
        const inner = types.length === 1 ? types[0] : `(${types.join(' | ')})`;
        return `${inner}[]`;
    }

    if (typeof value === 'object') {
        const iName = toPascalCase(name);
        const lines = [];
        for (const [k, v] of Object.entries(value)) {
            lines.push(`  ${k}: ${inferType(v, k, collector)};`);
        }
        collector.push({ name: iName, lines });
        return iName;
    }

    return 'unknown';
}

function generateTypeScript(jsonStr) {
    const data = JSON.parse(jsonStr);
    const collector = [];
    const rootType = inferType(data, 'Root', collector);

    if (collector.length === 0) {
        return `type Root = ${rootType};`;
    }

    // Deduplicate by name, keep last definition (deepest wins for arrays)
    const seen = new Map();
    for (const iface of collector) {
        seen.set(iface.name, iface);
    }

    // Root first, then nested interfaces in reverse (innermost first for readability)
    const all = [...seen.values()];
    const root = all.find(i => i.name === 'Root');
    const rest = all.filter(i => i.name !== 'Root').reverse();
    const ordered = root ? [root, ...rest] : all.reverse();

    return ordered.map(i => `interface ${i.name} {\n${i.lines.join('\n')}\n}`).join('\n\n');
}

document.addEventListener('DOMContentLoaded', function () {
    const jsonInput   = document.getElementById('jsonInput');
    const generateBtn = document.getElementById('generateBtn');
    const outputEl    = document.getElementById('output');
    const copyBtn     = document.getElementById('copyBtn');
    const clearBtn    = document.getElementById('clearBtn');
    const errorEl     = document.getElementById('errorContainer');

    const SAMPLE = JSON.stringify({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Jane Smith",
        age: 28,
        email: "jane@example.com",
        active: true,
        score: 97.4,
        tags: ["admin", "editor"],
        address: {
            street: "10 Downing Street",
            city: "London",
            country: "UK"
        },
        metadata: null
    }, null, 2);

    jsonInput.value = SAMPLE;

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        outputEl.value = '';
    }
    function clearError() { errorEl.style.display = 'none'; }

    function generate() {
        clearError();
        const jsonStr = jsonInput.value.trim();
        if (!jsonStr) { showError('Please enter JSON input.'); return; }
        try {
            outputEl.value = generateTypeScript(jsonStr);
            trackEvent('generate_typescript');
        } catch (e) {
            showError('Invalid JSON: ' + e.message);
        }
    }

    if (generateBtn) generateBtn.addEventListener('click', generate);

    if (jsonInput) {
        jsonInput.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                generate();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            jsonInput.value = '';
            outputEl.value  = '';
            clearError();
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            const text = outputEl.value;
            if (!text) return;
            copyToClipboard(text)
                .then(() => showToast('Copied!'))
                .catch(() => {});
        });
    }

    // Generate on load with sample
    generate();
});
