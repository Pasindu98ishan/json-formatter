// JSON to CSV Converter Tool
function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function() {
    const inputJSON = document.getElementById('inputJSON');
    const outputCSV = document.getElementById('outputCSV');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Convert JSON to CSV
    convertBtn.addEventListener('click', function() {
        try {
            const input = inputJSON.value.trim();
            if (!input) {
                alert('Please enter JSON data');
                return;
            }
            
            // Parse JSON
            const jsonData = JSON.parse(input);
            
            if (!Array.isArray(jsonData)) {
                throw new Error('JSON must be an array of objects');
            }
            
            if (jsonData.length === 0) {
                outputCSV.value = '';
                showNotification('Empty array');
                return;
            }

            // Get headers from first object
            const headers = Object.keys(jsonData[0]);
            
            // Create CSV
            let csv = headers.join(',') + '\n';
            
            for (let row of jsonData) {
                const values = headers.map(header => {
                    const value = row[header];
                    
                    // Handle CSV special characters
                    if (value === null || value === undefined) {
                        return '';
                    }
                    
                    const stringValue = String(value);
                    
                    // Quote if contains comma, newline, or quotes
                    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                        return '"' + stringValue.replace(/"/g, '""') + '"';
                    }
                    
                    return stringValue;
                });
                
                csv += values.join(',') + '\n';
            }
            
            outputCSV.value = csv;
            trackEvent('convert_to_csv');
            showNotification('Converted to CSV successfully');
        } catch (error) {
            outputCSV.value = 'Error: ' + error.message;
            showNotification('Conversion failed', 'error');
        }
    });

    // Clear
    clearBtn.addEventListener('click', function() {
        inputJSON.value = '';
        outputCSV.value = '';
        inputJSON.focus();
    });

    // Copy Output
    copyBtn.addEventListener('click', function() {
        if (!outputCSV.value) {
            alert('Nothing to copy');
            return;
        }
        outputCSV.select();
        document.execCommand('copy');
        trackEvent('copy_output', { tool: 'csv' });
        showNotification('Copied to clipboard!');
    });

    // Download CSV
    downloadBtn.addEventListener('click', function() {
        if (!outputCSV.value) {
            alert('Nothing to download');
            return;
        }
        
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(outputCSV.value));
        element.setAttribute('download', 'data.csv');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        trackEvent('download_output', { tool: 'csv' });
        showNotification('Downloaded!');
    });

    initDragDrop('inputJSON', function(content) {
        inputJSON.value = content;
    }, ['.json', '.txt']);

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
