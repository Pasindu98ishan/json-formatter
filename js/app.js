// Main Application File
document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    initializeEventListeners();
    initializeTheme();
    initializeAds();
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

function handleFormat() {
    const input = document.getElementById('inputJSON').value.trim();
    const output = document.getElementById('outputJSON');
    const errorContainer = document.getElementById('errorContainer');

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to format');
            return;
        }

        const formatted = formatJSON(input);
        output.value = formatted;
    } catch (error) {
        showError('Error: ' + error.message);
    }
}

function handleMinify() {
    const input = document.getElementById('inputJSON').value.trim();
    const output = document.getElementById('outputJSON');

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to minify');
            return;
        }

        const minified = minifyJSON(input);
        output.value = minified;
    } catch (error) {
        showError('Error: ' + error.message);
    }
}

function handleValidate() {
    const input = document.getElementById('inputJSON').value.trim();

    try {
        clearError();
        if (!input) {
            showError('Please enter JSON data to validate');
            return;
        }

        const isValid = validateJSON(input);
        if (isValid) {
            showSuccess('✓ Valid JSON! No errors found.');
        }
    } catch (error) {
        showError('JSON Error: ' + error.message);
    }
}

function handleCopy() {
    const output = document.getElementById('outputJSON');
    if (!output.value) {
        showError('Nothing to copy. Please format JSON first.');
        return;
    }

    navigator.clipboard.writeText(output.value).then(() => {
        showSuccess('✓ Copied to clipboard!');
    }).catch(err => {
        showError('Failed to copy: ' + err.message);
    });
}

function handleDownload() {
    const output = document.getElementById('outputJSON').value;
    if (!output) {
        showError('Nothing to download. Please format JSON first.');
        return;
    }

    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('✓ File downloaded!');
}

function handleClear() {
    document.getElementById('inputJSON').value = '';
    document.getElementById('outputJSON').value = '';
    clearError();
}

function handlePaste(e) {
    // Auto-format after paste
    setTimeout(() => {
        const input = document.getElementById('inputJSON').value.trim();
        if (input && input.length > 0) {
            try {
                const formatted = formatJSON(input);
                document.getElementById('outputJSON').value = formatted;
                clearError();
            } catch (error) {
                // Silent fail - user can click format manually
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
