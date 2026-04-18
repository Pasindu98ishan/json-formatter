// ============================================
// AD CHECKER TEST FUNCTIONS
// Test the conditional ad display functionality
// ============================================

/**
 * Test function to simulate ad loading scenarios
 * Call this from browser console to test ad behavior
 */
function testAdLoading() {
    console.log('Testing Ad Loading Scenarios...');

    // Test 1: Simulate successful ad load
    setTimeout(() => {
        const headerAd = document.getElementById('header-ad');
        if (headerAd) {
            headerAd.querySelector('ins').setAttribute('data-ad-status', 'filled');
            console.log('✅ Test 1: Header ad should now be visible');
        }
    }, 1000);

    // Test 2: Simulate failed ad load
    setTimeout(() => {
        const contentAd = document.getElementById('content-ad');
        if (contentAd) {
            contentAd.querySelector('ins').setAttribute('data-ad-status', 'unfilled');
            console.log('❌ Test 2: Content ad should now be hidden');
        }
    }, 2000);

    // Test 3: Manual ad show/hide
    setTimeout(() => {
        console.log('🔧 Test 3: Manual controls');
        console.log('Call showAd("header-ad") to show header ad');
        console.log('Call hideAd("content-ad") to hide content ad');
        console.log('Call hideAllAds() to hide all ads');
    }, 3000);
}

/**
 * Force show all ads for testing
 */
function forceShowAds() {
    showAd('header-ad');
    showAd('content-ad');
    console.log('All ads forced visible for testing');
}

/**
 * Force hide all ads for testing
 */
function forceHideAds() {
    hideAd('header-ad');
    hideAd('content-ad');
    console.log('All ads forced hidden for testing');
}

// Make test functions available globally
window.testAdLoading = testAdLoading;
window.forceShowAds = forceShowAds;
window.forceHideAds = forceHideAds;