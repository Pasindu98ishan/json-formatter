// Main Application File
let treeViewer; // Global tree viewer instance

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tree viewer
    treeViewer = new JSONTreeViewer('treeViewerContainer');

    // Initialize event listeners
    initializeEventListeners();
    initializeTheme();
    initializeAds();

    // Drag-and-drop JSON file onto input
    initDragDrop('inputJSON', function(content) {
        document.getElementById('inputJSON').value = content;
        try {
            const formatted = formatJSON(content);
            setOutput(formatted);
            treeViewer.render(formatted);
            clearError();
        } catch (e) {
            showError('Dropped file contains invalid JSON: ' + e.message);
        }
    }, ['.json', '.txt']);
});

function initializeEventListeners() {
    const formatBtn = document.getElementById('formatBtn');
    const minifyBtn = document.getElementById('minifyBtn');
    const validateBtn = document.getElementById('validateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const themeToggle = document.getElementById('theme-toggle');
    const inputJSON = document.getElementById('inputJSON');

    if (formatBtn) formatBtn.addEventListener('click', handleFormat);
    if (minifyBtn) minifyBtn.addEventListener('click', handleMinify);
    if (validateBtn) validateBtn.addEventListener('click', handleValidate);
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);
    if (clearBtn) clearBtn.addEventListener('click', handleClear);
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (inputJSON) inputJSON.addEventListener('paste', handlePaste);
}

function setOutput(text) {
    const pre = document.getElementById('outputJSON');
    const raw = document.getElementById('outputJSONRaw');
    if (pre) pre.innerHTML = addSyntaxHighlight(text);
    if (raw) raw.value = text;
}

function getOutput() {
    const raw = document.getElementById('outputJSONRaw');
    return raw ? raw.value : '';
}

function clearOutput() {
    const pre = document.getElementById('outputJSON');
    const raw = document.getElementById('outputJSONRaw');
    if (pre) pre.innerHTML = '<span class="output-placeholder">Formatted JSON will appear here...</span>';
    if (raw) raw.value = '';
}

function handleFormat() {
    const input = document.getElementById('inputJSON').value.trim();

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to format');
            treeViewer.clear();
            return;
        }

        const formatted = formatJSON(input);
        setOutput(formatted);
        trackEvent('format_json');
        treeViewer.render(formatted);
    } catch (error) {
        showError('Error: ' + error.message);
        treeViewer.clear();
    }
}

function handleMinify() {
    const input = document.getElementById('inputJSON').value.trim();

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to minify');
            treeViewer.clear();
            return;
        }

        const minified = minifyJSON(input);
        setOutput(minified);
        trackEvent('minify_json');
        treeViewer.render(minified);
    } catch (error) {
        showError('Error: ' + error.message);
        treeViewer.clear();
    }
}

function handleValidate() {
    const input = document.getElementById('inputJSON').value.trim();

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to validate');
            treeViewer.clear();
            return;
        }

        const isValid = validateJSON(input);
        if (isValid) {
            showSuccess('✓ Valid JSON! No errors found.');
            trackEvent('validate_json', { result: 'valid' });
            // Update tree viewer with valid JSON
            treeViewer.render(input);
        }
    } catch (error) {
        showError('JSON Error: ' + error.message);
        treeViewer.clear();
    }
}

function handleCopy() {
    const text = getOutput();
    if (!text) {
        showError('Nothing to copy. Please format JSON first.');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showSuccess('✓ Copied to clipboard!');
        trackEvent('copy_output', { tool: 'formatter' });
    }).catch(err => {
        showError('Failed to copy: ' + err.message);
    });
}

function handleDownload() {
    const text = getOutput();
    if (!text) {
        showError('Nothing to download. Please format JSON first.');
        return;
    }

    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackEvent('download_output', { tool: 'formatter' });
    showSuccess('✓ File downloaded!');
}

function handleClear() {
    document.getElementById('inputJSON').value = '';
    clearOutput();
    clearError();
    treeViewer.clear();
}

function handlePaste(e) {
    // Auto-format after paste
    setTimeout(() => {
        const input = document.getElementById('inputJSON').value.trim();
        if (input && input.length > 0) {
            try {
                const formatted = formatJSON(input);
                setOutput(formatted);
                treeViewer.render(formatted);
                clearError();
            } catch (error) {
                // Silent fail - user can click format manually
                treeViewer.clear();
            }
        }
    }, 10);
}

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    body.classList.toggle('dark-mode');
    
    // Save preference
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update button text
    themeToggle.textContent = isDarkMode ? '☀️ Light' : '🌙 Dark';
}

function initializeTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const themeToggle = document.getElementById('theme-toggle');
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️ Light';
    } else {
        if (themeToggle) themeToggle.textContent = '🌙 Dark';
    }
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = '⚠️ ' + message;
        errorContainer.style.display = 'block';
    }
}

function showSuccess(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = message;
        errorContainer.style.display = 'block';
        errorContainer.style.backgroundColor = '#d4edda';
        errorContainer.style.color = '#155724';
        errorContainer.style.borderColor = '#c3e6cb';
        
        setTimeout(() => {
            clearError();
        }, 3000);
    }
}

function clearError() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.style.backgroundColor = '#f8d7da';
        errorContainer.style.color = '#721c24';
        errorContainer.style.borderColor = '#f5c6cb';
    }
}

// ============================================
// AD MANAGEMENT FUNCTIONS
// Conditional AdSense ad display based on ad load status
// ============================================

function initializeAds() {
    // Check if AdSense is loaded
    if (typeof window.adsbygoogle !== 'undefined') {
        // Initialize ads with load checking
        initializeAdSlots();
        
        // Set up ad load monitoring
        monitorAdLoad();
    } else {
        // AdSense not loaded (ad blocker or network issue)
        console.log('AdSense not available');
        hideAllAds();
    }
}

function initializeAdSlots() {
    try {
        // Push ads to AdSense
        const ads = document.querySelectorAll('.adsbygoogle');
        ads.forEach(ad => {
            if (!ad.hasAttribute('data-adsbygoogle-status')) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        });
    } catch (error) {
        console.log('Ad initialization error:', error);
        hideAllAds();
    }
}

function monitorAdLoad() {
    // Use MutationObserver to detect when ads are loaded
    const adContainers = document.querySelectorAll('.ad-space');
    
    adContainers.forEach(container => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'data-ad-status') {
                    
                    const adStatus = container.querySelector('ins').getAttribute('data-ad-status');
                    
                    if (adStatus === 'filled') {
                        showAd(container.id);
                    } else if (adStatus === 'unfilled') {
                        hideAd(container.id);
                    }
                }
            });
        });
        
        const insElement = container.querySelector('ins');
        if (insElement) {
            observer.observe(insElement, {
                attributes: true,
                attributeFilter: ['data-ad-status']
            });
        }
    });
    
    // Fallback: Check ad status after timeout
    setTimeout(() => {
        checkAdFallback();
    }, 3000);
}

function checkAdFallback() {
    const adContainers = document.querySelectorAll('.ad-space');
    
    adContainers.forEach(container => {
        const insElement = container.querySelector('ins');
        
        if (insElement) {
            const adStatus = insElement.getAttribute('data-ad-status');
            
            if (adStatus === 'filled') {
                showAd(container.id);
            } else {
                // Check if ad has content (fallback for older AdSense versions)
                const hasContent = insElement.innerHTML.trim() !== '' || 
                                 insElement.querySelector('iframe') !== null;
                
                if (hasContent) {
                    showAd(container.id);
                } else {
                    hideAd(container.id);
                }
            }
        }
    });
}

function showAd(adId) {
    const adElement = document.getElementById(adId);
    if (adElement) {
        adElement.style.display = 'block';
        console.log(`Ad ${adId} displayed successfully`);
    }
}

function hideAd(adId) {
    const adElement = document.getElementById(adId);
    if (adElement) {
        adElement.style.display = 'none';
        console.log(`Ad ${adId} hidden (no ad available)`);
    }
}

function hideAllAds() {
    const adContainers = document.querySelectorAll('.ad-space');
    adContainers.forEach(container => {
        container.style.display = 'none';
    });
    console.log('All ads hidden');
}
