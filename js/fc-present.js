// Google's standard "signal Funding Choices is present" snippet, required by
// the Funding Choices message script (see AdSense > Privacy & messaging).
// It tells Google's tags a consent management platform is on the page, via a
// hidden same-origin-marker iframe, so ad requests wait for a consent signal
// instead of assuming none is coming.
(function () {
    function signalGooglefcPresent() {
        if (!window.frames['googlefcPresent']) {
            if (document.body) {
                var iframe = document.createElement('iframe');
                iframe.style = 'width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px;';
                iframe.style.display = 'none';
                iframe.name = 'googlefcPresent';
                document.body.appendChild(iframe);
            } else {
                setTimeout(signalGooglefcPresent, 0);
            }
        }
    }
    signalGooglefcPresent();
})();
