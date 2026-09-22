// Google Consent Mode v2 defaults, set before any Google tag (AdSense, GA4)
// requests ad or analytics cookies. Region list is the EEA + UK + EFTA states
// that require opt-in consent; everywhere else keeps the site's existing
// default-granted behavior unchanged. The published consent message (set up
// in AdSense > Privacy & messaging) calls gtag('consent','update', ...) once
// a visitor makes a choice, which is why this file only sets defaults.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
window.gtag = gtag;

gtag('consent', 'default', {
    'ad_storage': 'granted',
    'ad_user_data': 'granted',
    'ad_personalization': 'granted',
    'analytics_storage': 'granted'
});
gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'region': [
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
        'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
        'SI', 'ES', 'SE', // EEA (EU 27)
        'IS', 'LI', 'NO', // EEA (EFTA)
        'GB', 'CH'        // UK, Switzerland
    ],
    'wait_for_update': 500
});
