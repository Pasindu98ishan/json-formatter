// JSON to YAML Converter Tool
function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function() {
    const inputJSON = document.getElementById('inputJSON');
    const outputYAML = document.getElementById('outputYAML');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Convert JSON to YAML
    convertBtn.addEventListener('click', function() {
        try {
            const input = inputJSON.value.trim();
            if (!input) {
                alert('Please enter JSON data');
                return;
            }
            
            // Parse JSON
            const jsonData = JSON.parse(input);
            
            // Convert to YAML
            const yaml = jsonToYaml(jsonData);
            
            outputYAML.value = yaml;
            trackEvent('convert_to_yaml');
            showNotification('Converted to YAML successfully');
        } catch (error) {
            outputYAML.value = 'Error: ' + error.message;
            showNotification('Conversion failed', 'error');
        }
    });

    // Convert JSON object to YAML string
    function jsonToYaml(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        let yaml = '';
        
        if (typeof obj !== 'object' || obj === null) {
            return JSON.stringify(obj);
        }
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return '[]';
            }
            
            for (let i = 0; i < obj.length; i++) {
                yaml += spaces + '- ';
                const item = obj[i];
                
                if (typeof item === 'object' && item !== null) {
                    if (Array.isArray(item)) {
                        yaml += jsonToYaml(item, indent + 2);
                    } else {
                        const keys = Object.keys(item);
                        if (keys.length === 0) {
                            yaml += '{}\n';
                        } else {
                            yaml += '\n';
                            for (let key of keys) {
                                yaml += spaces + '  ' + key + ': ';
                                const value = item[key];
                                if (typeof value === 'object' && value !== null) {
                                    if (Array.isArray(value)) {
                                        yaml += '\n';
                                        yaml += jsonToYaml(value, indent + 4);
                                    } else {
                                        yaml += '\n';
                                        yaml += jsonToYaml(value, indent + 4);
                                    }
                                } else if (typeof value === 'string' && value.includes('\n')) {
                                    yaml += '|\n' + spaces + '  ' + value.split('\n').join('\n' + spaces + '  ') + '\n';
                                } else {
                                    yaml += JSON.stringify(value) + '\n';
                                }
                            }
                        }
                    }
                } else if (typeof item === 'string' && item.includes('\n')) {
                    yaml += '|\n' + spaces + '  ' + item.split('\n').join('\n' + spaces + '  ') + '\n';
                } else {
                    yaml += JSON.stringify(item) + '\n';
                }
            }
        } else {
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                return '{}';
            }
            
            for (let key of keys) {
                yaml += spaces + key + ': ';
                const value = obj[key];
                
                if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value)) {
                        if (value.length === 0) {
                            yaml += '[]\n';
                        } else {
                            yaml += '\n';
                            yaml += jsonToYaml(value, indent + 2);
                        }
                    } else {
                        yaml += '\n';
                        yaml += jsonToYaml(value, indent + 2);
                    }
                } else if (typeof value === 'string' && value.includes('\n')) {
                    yaml += '|\n' + spaces + '  ' + value.split('\n').join('\n' + spaces + '  ') + '\n';
                } else {
                    yaml += JSON.stringify(value) + '\n';
                }
            }
        }
        
        return yaml;
    }

    initDragDrop('inputJSON', function(content) {
        inputJSON.value = content;
    }, ['.json', '.txt']);

    // Clear
    clearBtn.addEventListener('click', function() {
        inputJSON.value = '';
        outputYAML.value = '';
        inputJSON.focus();
    });

    // Copy Output
    copyBtn.addEventListener('click', function() {
        if (!outputYAML.value) {
            alert('Nothing to copy');
            return;
        }
        outputYAML.select();
        document.execCommand('copy');
        trackEvent('copy_output', { tool: 'yaml' });
        showNotification('Copied to clipboard!');
    });

    // Download YAML
    downloadBtn.addEventListener('click', function() {
        if (!outputYAML.value) {
            alert('Nothing to download');
            return;
        }
        
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/yaml;charset=utf-8,' + encodeURIComponent(outputYAML.value));
        element.setAttribute('download', 'data.yaml');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        trackEvent('download_output', { tool: 'yaml' });
        showNotification('Downloaded!');
    });

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        const bgColor = type === 'error' ? '#f44336' : '#4CAF50';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease-in-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
});
