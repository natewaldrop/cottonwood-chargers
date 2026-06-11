(function loadDashboardScript() {
    const scriptName = window.DASHBOARD_SCRIPT || "script.js";
    const scriptTag = document.createElement("script");
    scriptTag.src = scriptName;
    document.body.appendChild(scriptTag);
})();
