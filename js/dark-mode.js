// Shared dark mode handler for non-formatter pages
// Applies the same theme toggle behavior used by the main JSON formatter.

function initializeSharedDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';

    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
    }

    if (themeToggle) {
        themeToggle.textContent = savedDarkMode ? '☀️ Light' : '🌙 Dark';
        themeToggle.addEventListener('click', function () {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
            themeToggle.textContent = isDarkMode ? '☀️ Light' : '🌙 Dark';
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeSharedDarkMode);
