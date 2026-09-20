(function () {
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') return;
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    // Report the page URL without user data: never the #fragment (share links for
    // the formatter, JSONPath and regex tester carry the pasted content there) and
    // never the legacy ?j= share parameter.
    var params = new URLSearchParams(location.search);
    params.delete('j');
    var qs = params.toString();
    var pageLocation = location.origin + location.pathname + (qs ? '?' + qs : '');

    gtag('js', new Date());
    gtag('config', 'G-1GHW4SMQFK', { page_location: pageLocation });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-1GHW4SMQFK';
    document.head.appendChild(s);
})();
