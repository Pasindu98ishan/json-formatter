// Timestamp Converter Tool
document.addEventListener('DOMContentLoaded', function() {
    const timestamp = document.getElementById('timestamp');
    const dateOutput = document.getElementById('dateOutput');
    const dateInput = document.getElementById('dateInput');
    const timestampOutput = document.getElementById('timestampOutput');
    const toDateBtn = document.getElementById('toDateBtn');
    const toTimestampBtn = document.getElementById('toTimestampBtn');
    const nowBtn = document.getElementById('nowBtn');
    const copyBtn = document.getElementById('copyBtn');
    const currentTimestampSpan = document.getElementById('currentTimestamp');

    // Update current timestamp
    function updateCurrentTimestamp() {
        currentTimestampSpan.textContent = Math.floor(Date.now() / 1000);
    }
    updateCurrentTimestamp();
    setInterval(updateCurrentTimestamp, 1000);

    // Convert Timestamp to Date
    toDateBtn.addEventListener('click', function() {
        try {
            const ts = parseInt(timestamp.value);
            if (isNaN(ts)) {
                alert('Please enter a valid Unix timestamp');
                return;
            }
            const date = new Date(ts * 1000);
            dateOutput.value = date.toISOString();
            showNotification('Converted timestamp to date');
        } catch (error) {
            dateOutput.value = 'Error: ' + error.message;
        }
    });

    // Get Current Time
    nowBtn.addEventListener('click', function() {
        const now = Math.floor(Date.now() / 1000);
        timestamp.value = now;
        const date = new Date(now * 1000);
        dateOutput.value = date.toISOString();
        showNotification('Current timestamp: ' + now);
    });

    // Convert Date to Timestamp
    toTimestampBtn.addEventListener('click', function() {
        try {
            if (!dateInput.value) {
                alert('Please enter a date and time');
                return;
            }
            const date = new Date(dateInput.value);
            const ts = Math.floor(date.getTime() / 1000);
            timestampOutput.value = ts;
            showNotification('Converted date to timestamp');
        } catch (error) {
            timestampOutput.value = 'Error: ' + error.message;
        }
    });

    // Copy Timestamp
    copyBtn.addEventListener('click', function() {
        if (!timestampOutput.value) {
            alert('Nothing to copy');
            return;
        }
        timestampOutput.select();
        document.execCommand('copy');
        showNotification('Copied to clipboard!');
    });

    // Real-time conversion on Enter key
    timestamp.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            toDateBtn.click();
        }
    });

    dateInput.addEventListener('change', function() {
        toTimestampBtn.click();
    });

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
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
