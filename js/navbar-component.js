(function () {
    var p = document.getElementById('nav-placeholder');
    if (!p) return;
    var r = p.getAttribute('data-root') || '';
    p.outerHTML = '<nav class="navbar" role="navigation" aria-label="Primary site navigation">\n' +
        '    <div class="container">\n' +
        '        <div class="logo"><a href="' + (r || './') + '">&#128295; JSON Dev Tools</a></div>\n' +
        '        <div class="nav-actions">\n' +
        '            <button class="nav-hamburger" aria-label="Toggle navigation" aria-expanded="false">\n' +
        '                <span></span><span></span><span></span>\n' +
        '            </button>\n' +
        '            <ul class="nav-links">\n' +
        '                <li class="nav-dropdown">\n' +
        '                    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">JSON Tools &#9662;</button>\n' +
        '                    <ul class="dropdown-menu">\n' +
        '                        <li><a href="' + r + 'formatter.html">JSON Formatter</a></li>\n' +
        '                        <li><a href="' + r + 'json-validator.html">JSON Validator</a></li>\n' +
        '                        <li><a href="' + r + 'json-schema-validator.html">JSON Schema Validator</a></li>\n' +
        '                        <li><a href="' + r + 'json-schema-generator.html">JSON Schema Generator</a></li>\n' +
        '                        <li><a href="' + r + 'json-schema-multi-generator.html">Schema from Multiple JSON</a></li>\n' +
        '                        <li><a href="' + r + 'json-minifier.html">JSON Minifier</a></li>\n' +
        '                        <li><a href="' + r + 'json-viewer.html">JSON Viewer</a></li>\n' +
        '                        <li><a href="' + r + 'json-beautifier.html">JSON Beautifier</a></li>\n' +
        '                        <li><a href="' + r + 'json-diff.html">JSON Diff</a></li>\n' +
        '                        <li><a href="' + r + 'text-diff.html">Text Diff</a></li>\n' +
        '                        <li><a href="' + r + 'jsonpath.html">JSONPath Tester</a></li>\n' +
        '                    </ul>\n' +
        '                </li>\n' +
        '                <li class="nav-dropdown">\n' +
        '                    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">Converters &#9662;</button>\n' +
        '                    <ul class="dropdown-menu">\n' +
        '                        <li><a href="' + r + 'json-to-csv.html">JSON &#8594; CSV</a></li>\n' +
        '                        <li><a href="' + r + 'csv-to-json.html">CSV &#8594; JSON</a></li>\n' +
        '                        <li><a href="' + r + 'json-to-yaml.html">JSON &#8594; YAML</a></li>\n' +
        '                        <li><a href="' + r + 'yaml-to-json.html">YAML &#8594; JSON</a></li>\n' +
        '                        <li><a href="' + r + 'json-to-xml.html">JSON &#8594; XML</a></li>\n' +
        '                        <li><a href="' + r + 'xml-to-json.html">XML &#8594; JSON</a></li>\n' +
        '                        <li><a href="' + r + 'json-to-typescript.html">JSON &#8594; TypeScript</a></li>\n' +
        '                        <li><a href="' + r + 'json-to-toon.html">JSON &#8594; TOON</a></li>\n' +
        '                        <li><a href="' + r + 'px-to-rem.html">Px &#8596; Rem</a></li>\n' +
        '                        <li><a href="' + r + 'timestamp.html">Timestamp</a></li>\n' +
        '                    </ul>\n' +
        '                </li>\n' +
        '                <li class="nav-dropdown">\n' +
        '                    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">Encoders &#9662;</button>\n' +
        '                    <ul class="dropdown-menu">\n' +
        '                        <li><a href="' + r + 'base64.html">Base64</a></li>\n' +
        '                        <li><a href="' + r + 'url-encoder.html">URL Encoder</a></li>\n' +
        '                        <li><a href="' + r + 'jwt-decoder.html">JWT Decoder</a></li>\n' +
        '                        <li><a href="' + r + 'string-escape.html">String Escape</a></li>\n' +
        '                    </ul>\n' +
        '                </li>\n' +
        '                <li class="nav-dropdown">\n' +
        '                    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">Generators &#9662;</button>\n' +
        '                    <ul class="dropdown-menu">\n' +
        '                        <li><a href="' + r + 'uuid.html">UUID Generator</a></li>\n' +
        '                        <li><a href="' + r + 'hash.html">Hash Generator</a></li>\n' +
        '                        <li><a href="' + r + 'cron.html">CRON Generator</a></li>\n' +
        '                    </ul>\n' +
        '                </li>\n' +
        '                <li class="nav-dropdown">\n' +
        '                    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">Other Tools &#9662;</button>\n' +
        '                    <ul class="dropdown-menu">\n' +
        '                        <li><a href="' + r + 'http-status.html">HTTP Status Codes</a></li>\n' +
        '                    </ul>\n' +
        '                </li>\n' +
        '                <li class="nav-dropdown">\n' +
        '                    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">Reference &#9662;</button>\n' +
        '                    <ul class="dropdown-menu">\n' +
        '                        <li><a href="' + r + 'errors.html">Error Reference</a></li>\n' +
        '                        <li><a href="' + r + 'blog/">Blog &amp; Guides</a></li>\n' +
        '                    </ul>\n' +
        '                </li>\n' +
        '            </ul>\n' +
        '            <button id="theme-toggle" class="theme-btn" aria-label="Switch to dark mode">&#127769; Dark</button>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</nav>';
})();
