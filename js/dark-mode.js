// Shared dark mode handler for non-formatter pages
// Applies the same theme toggle behavior used by the main JSON formatter.

function setThemeToggleState(btn, isDarkMode) {
    btn.textContent = isDarkMode ? '☀️ Light' : '🌙 Dark';
    btn.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
}

function initializeSharedDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';

    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
    }

    if (themeToggle) {
        setThemeToggleState(themeToggle, savedDarkMode);
        themeToggle.addEventListener('click', function () {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
            setThemeToggleState(themeToggle, isDarkMode);
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeSharedDarkMode);
