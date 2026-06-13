/**
 * Shared HTTP status code dataset.
 * Used by the HTTP Status Quiz (js/http-status-quiz.js) and the
 * HTTP Status Flashcards (js/http-status-flashcards.js).
 *
 * Field notes:
 *   code     – numeric status code
 *   name     – official reason phrase
 *   cat      – class: "1xx" | "2xx" | "3xx" | "4xx" | "5xx"
 *   tier     – quiz difficulty: 1 everyday, 2 intermediate, 3 trivia
 *   blurb    – one-line meaning (used for feedback + flashcard back)
 *   scenario – plain-language situation (powers scenario→code questions)
 *   page     – path to the detail page if one exists, else null
 *
 * Names/meanings mirror the http-status.html reference table.
 */
const HTTP_STATUS = [
    // ---- 1xx Informational ----
    { code: 100, name: "Continue", cat: "1xx", tier: 3,
      blurb: "Request headers received; client should send the body.",
      scenario: "The server got your headers and wants you to send the request body.",
      page: null },
    { code: 101, name: "Switching Protocols", cat: "1xx", tier: 3,
      blurb: "Server is switching protocols as requested (e.g. to WebSocket).",
      scenario: "Your connection is upgrading from HTTP to WebSocket.",
      page: null },
    { code: 103, name: "Early Hints", cat: "1xx", tier: 3,
      blurb: "Preliminary headers sent so the client can start preloading.",
      scenario: "The server sends hints early so the browser can preload assets.",
      page: null },

    // ---- 2xx Success ----
    { code: 200, name: "OK", cat: "2xx", tier: 1,
      blurb: "Standard success response; body contains the result.",
      scenario: "Your GET request comes back and the body contains exactly the data you asked for.",
      page: "http-status/200.html" },
    { code: 201, name: "Created", cat: "2xx", tier: 1,
      blurb: "Request succeeded and a new resource was created.",
      scenario: "Your POST created a new record and the server confirms it.",
      page: "http-status/201.html" },
    { code: 202, name: "Accepted", cat: "2xx", tier: 2,
      blurb: "Request accepted for processing but not yet completed.",
      scenario: "Your request was queued for async processing, not done yet.",
      page: null },
    { code: 204, name: "No Content", cat: "2xx", tier: 1,
      blurb: "Success with no response body (common for DELETE/PUT).",
      scenario: "Your DELETE request completes and the server sends back an empty body — nothing to show.",
      page: "http-status/204.html" },
    { code: 206, name: "Partial Content", cat: "2xx", tier: 3,
      blurb: "Server is delivering part of the resource (range request).",
      scenario: "You requested a byte range and got just that slice of the file.",
      page: null },

    // ---- 3xx Redirection ----
    { code: 301, name: "Moved Permanently", cat: "3xx", tier: 1,
      blurb: "Resource has a new permanent URL; update references.",
      scenario: "A URL your app has hit for months now replies with a new permanent address — update all stored references.",
      page: "http-status/301.html" },
    { code: 302, name: "Found", cat: "3xx", tier: 1,
      blurb: "Resource temporarily at a different URL.",
      scenario: "The resource you requested is currently available at a different address — but don't update your stored references yet.",
      page: "http-status/302.html" },
    { code: 303, name: "See Other", cat: "3xx", tier: 2,
      blurb: "Retrieve the resource with a GET at another URL.",
      scenario: "After your POST, the server says 'Done — fetch the result by hitting this other URL with GET.'",
      page: null },
    { code: 304, name: "Not Modified", cat: "3xx", tier: 1,
      blurb: "Cached version is still valid; no body returned.",
      scenario: "Your cached copy is still fresh, so no body is sent.",
      page: "http-status/304.html" },
    { code: 307, name: "Temporary Redirect", cat: "3xx", tier: 2,
      blurb: "Temporary redirect that preserves the HTTP method.",
      scenario: "You POST data and the server says 'try this other URL instead — keep it as a POST, don't switch to GET.'",
      page: null },
    { code: 308, name: "Permanent Redirect", cat: "3xx", tier: 2,
      blurb: "Permanent redirect that preserves the HTTP method.",
      scenario: "You POST data and the server says this endpoint has permanently moved — resend the same request to the new address.",
      page: null },

    // ---- 4xx Client Error ----
    { code: 400, name: "Bad Request", cat: "4xx", tier: 1,
      blurb: "Malformed request the server can't process (e.g. invalid JSON).",
      scenario: "You sent malformed JSON and the server can't parse it.",
      page: "http-status/400.html" },
    { code: 401, name: "Unauthorized", cat: "4xx", tier: 1,
      blurb: "Authentication required or credentials invalid.",
      scenario: "You aren't logged in or your token is missing/invalid.",
      page: "http-status/401.html" },
    { code: 403, name: "Forbidden", cat: "4xx", tier: 1,
      blurb: "Authenticated but not allowed to access the resource.",
      scenario: "You're logged in but lack permission for this resource.",
      page: "http-status/403.html" },
    { code: 404, name: "Not Found", cat: "4xx", tier: 1,
      blurb: "The requested resource does not exist.",
      scenario: "You requested a URL the server can't find.",
      page: "http-status/404.html" },
    { code: 405, name: "Method Not Allowed", cat: "4xx", tier: 2,
      blurb: "HTTP method not supported for this resource.",
      scenario: "You sent a DELETE to an endpoint that only allows GET.",
      page: null },
    { code: 406, name: "Not Acceptable", cat: "4xx", tier: 3,
      blurb: "No response matches the client's Accept headers.",
      scenario: "The server can't produce a format your Accept header allows.",
      page: null },
    { code: 407, name: "Proxy Authentication Required", cat: "4xx", tier: 3,
      blurb: "You must authenticate with the proxy first.",
      scenario: "A corporate proxy needs you to authenticate before continuing.",
      page: null },
    { code: 408, name: "Request Timeout", cat: "4xx", tier: 2,
      blurb: "Client took too long to send the request.",
      scenario: "Your client was too slow sending the request and timed out.",
      page: null },
    { code: 409, name: "Conflict", cat: "4xx", tier: 2,
      blurb: "Request conflicts with the current state (e.g. duplicate).",
      scenario: "You tried to create a record that already exists.",
      page: null },
    { code: 410, name: "Gone", cat: "4xx", tier: 2,
      blurb: "Resource was deleted and will not return.",
      scenario: "The resource was permanently deleted and won't come back.",
      page: null },
    { code: 415, name: "Unsupported Media Type", cat: "4xx", tier: 3,
      blurb: "Request body format not supported (e.g. wrong Content-Type).",
      scenario: "You sent XML but the API only accepts JSON.",
      page: null },
    { code: 418, name: "I'm a teapot", cat: "4xx", tier: 3,
      blurb: "An April Fools' joke code (RFC 2324); used as an Easter egg.",
      scenario: "You asked a teapot to brew coffee. It politely refuses.",
      page: "http-status/418.html" },
    { code: 422, name: "Unprocessable Entity", cat: "4xx", tier: 2,
      blurb: "Syntax is valid but the data fails validation.",
      scenario: "Your JSON is valid but a field fails the server's validation.",
      page: "http-status/422.html" },
    { code: 425, name: "Too Early", cat: "4xx", tier: 3,
      blurb: "Server refuses to risk processing a replayed request.",
      scenario: "The server won't process a request that may be replayed (TLS 0-RTT).",
      page: null },
    { code: 428, name: "Precondition Required", cat: "4xx", tier: 3,
      blurb: "Server requires a conditional request (e.g. If-Match).",
      scenario: "The server demands an If-Match header to avoid lost updates.",
      page: null },
    { code: 429, name: "Too Many Requests", cat: "4xx", tier: 1,
      blurb: "Client hit a rate limit; check the Retry-After header.",
      scenario: "You hit a rate limit and must back off before retrying.",
      page: "http-status/429.html" },
    { code: 431, name: "Request Header Fields Too Large", cat: "4xx", tier: 3,
      blurb: "Headers are too large for the server to process.",
      scenario: "Your cookies/headers grew too big for the server to accept.",
      page: null },
    { code: 451, name: "Unavailable For Legal Reasons", cat: "4xx", tier: 3,
      blurb: "Resource blocked for legal reasons.",
      scenario: "The content is blocked due to a legal demand or censorship.",
      page: null },

    // ---- 5xx Server Error ----
    { code: 500, name: "Internal Server Error", cat: "5xx", tier: 1,
      blurb: "Generic server failure; the request was valid.",
      scenario: "Your request was valid and well-formed, but something went wrong on the backend while processing it.",
      page: "http-status/500.html" },
    { code: 501, name: "Not Implemented", cat: "5xx", tier: 2,
      blurb: "Server does not support the functionality required.",
      scenario: "The server doesn't support the method you used at all.",
      page: null },
    { code: 502, name: "Bad Gateway", cat: "5xx", tier: 1,
      blurb: "Upstream server returned an invalid response.",
      scenario: "A proxy got a broken response from the upstream server.",
      page: "http-status/502.html" },
    { code: 503, name: "Service Unavailable", cat: "5xx", tier: 1,
      blurb: "Server temporarily overloaded or down for maintenance.",
      scenario: "The endpoint is temporarily refusing all requests — it may be under heavy load or getting updated.",
      page: "http-status/503.html" },
    { code: 504, name: "Gateway Timeout", cat: "5xx", tier: 2,
      blurb: "Upstream server failed to respond in time.",
      scenario: "A proxy waited too long for the upstream server to reply.",
      page: null },
    { code: 511, name: "Network Authentication Required", cat: "5xx", tier: 3,
      blurb: "You must authenticate to gain network access (captive portal).",
      scenario: "A captive portal (hotel/airport WiFi) needs you to sign in.",
      page: null }
];

// Class metadata for category-classification questions and flashcard theming.
const HTTP_CLASSES = {
    "1xx": { label: "Informational", desc: "the request was received and the process continues" },
    "2xx": { label: "Success", desc: "the request was received, understood, and accepted" },
    "3xx": { label: "Redirection", desc: "further action is needed to complete the request" },
    "4xx": { label: "Client Error", desc: "the request was bad or unauthorized" },
    "5xx": { label: "Server Error", desc: "the request was valid but the server failed" }
};

// Expose for both module-less <script> includes and any test harness.
if (typeof window !== "undefined") {
    window.HTTP_STATUS = HTTP_STATUS;
    window.HTTP_CLASSES = HTTP_CLASSES;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { HTTP_STATUS, HTTP_CLASSES };
}
