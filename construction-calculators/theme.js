(function () {
    "use strict";

    var storageKey = "buildestimate-theme";
    var root = document.documentElement;
    var savedTheme = "";

    try {
        savedTheme = window.localStorage.getItem(storageKey) || "";
    } catch (error) {
        // Storage can be unavailable in strict privacy modes; dark remains the default.
    }

    root.dataset.theme = savedTheme === "light" ? "light" : "dark";

    window.addEventListener("DOMContentLoaded", function () {
        var nav = document.querySelector(".top-nav");
        if (!nav) return;

        var button = document.createElement("button");
        button.className = "theme-toggle";
        button.type = "button";
        button.innerHTML = '<span class="theme-icon theme-sun" aria-hidden="true">☀</span><span class="theme-icon theme-moon" aria-hidden="true">☾</span>';

        function updateButton() {
            var isDark = root.dataset.theme === "dark";
            button.setAttribute("aria-pressed", String(isDark));
            button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
            button.title = isDark ? "Switch to light mode" : "Switch to dark mode";
        }

        button.addEventListener("click", function () {
            root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
            try {
                window.localStorage.setItem(storageKey, root.dataset.theme);
            } catch (error) {
                // The toggle still works for the current page when storage is unavailable.
            }
            updateButton();
        });

        updateButton();
        nav.appendChild(button);
    });
}());
