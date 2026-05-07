function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function() {
    const inputYAML = document.getElementById('inputYAML');
    const outputJSON = document.getElementById('outputJSON');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    inputYAML.addEventListener('paste', function() {
        trackEvent('tool_start', { tool: 'yaml_to_json' });
    });

    convertBtn.addEventListener('click', function() {
        const input = inputYAML.value.trim();
        if (!input) { alert('Please enter YAML data'); return; }
        try {
            const data = jsyaml.load(input);
            outputJSON.value = JSON.stringify(data, null, 2);
            trackEvent('convert_yaml_to_json');
            showNotification('Converted to JSON successfully');
        } catch (error) {
            outputJSON.value = 'Error: ' + error.message;
            showNotification('Conversion failed', 'error');
        }
    });

    initDragDrop('inputYAML', function(content) {
        inputYAML.value = content;
        trackEvent('tool_start', { tool: 'yaml_to_json' });
    }, ['.yaml', '.yml', '.txt']);

    clearBtn.addEventListener('click', function() {
        inputYAML.value = '';
        outputJSON.value = '';
        inputYAML.focus();
    });

    copyBtn.addEventListener('click', function() {
        if (!outputJSON.value) { alert('Nothing to copy'); return; }
        outputJSON.select();
        document.execCommand('copy');
        trackEvent('copy_output', { tool: 'yaml_to_json' });
        showNotification('Copied to clipboard!');
    });

    downloadBtn.addEventListener('click', function() {
        if (!outputJSON.value) { alert('Nothing to download'); return; }
        const el = document.createElement('a');
        el.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(outputJSON.value));
        el.setAttribute('download', 'data.json');
        el.style.display = 'none';
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
        trackEvent('download_output', { tool: 'yaml_to_json' });
        showNotification('Downloaded!');
    });

    function showNotification(message, type = 'success') {
        const n = document.createElement('div');
        n.textContent = message;
        n.style.cssText = `position:fixed;top:20px;right:20px;background:${type === 'error' ? '#f44336' : '#4CAF50'};color:white;padding:15px 20px;border-radius:4px;z-index:10000;`;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    }
});
