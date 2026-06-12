(function () {
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') return;
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-1GHW4SMQFK');
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-1GHW4SMQFK';
    document.head.appendChild(s);
})();
