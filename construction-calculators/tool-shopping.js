(function () {
    "use strict";

    var host = document.querySelector("[data-tool-shopping]");
    if (!host) return;

    var retailers = [
        { name: "Amazon", search: window.amazonSearch },
        { name: "Ace Hardware", url: "https://www.acehardware.com/search?query=" },
        { name: "Northern Tool + Equipment", url: "https://www.northerntool.com/s?text=" },
        { name: "Tractor Supply", url: "https://www.tractorsupply.com/tsc/search/" },
        { name: "Acme Tools", url: "https://www.acmetools.com/search?q=" },
        { name: "Tool Nut", url: "https://www.toolnut.com/search?q=" },
        { name: "National Hardware Group", url: "https://nationalhardwaregroup.com/search?type=product&q=" },
        { name: "Hardware World", domain: "hardwareworld.com" },
        { name: "MSC Industrial Supply", url: "https://www.mscdirect.com/browse/tn?searchterm=" },
        { name: "Home Depot", url: "https://www.homedepot.com/s/" },
        { name: "Lowe's", url: "https://www.lowes.com/search?searchTerm=" },
        { name: "Walmart", url: "https://www.walmart.com/search?q=" }
    ];
    var suggestions = {
        patio: ["plate compactor", "masonry saw blade", "rubber mallet", "wheelbarrow"],
        landscape: ["landscape rake", "wheelbarrow", "garden shovel"],
        sod: ["lawn roller", "sod knife", "lawn sprinkler"],
        fence: ["post hole digger", "post level", "cordless drill"],
        room: ["paint roller kit", "flooring installation kit", "miter saw"],
        paint: ["paint roller kit", "paint brushes", "paint tray"],
        drywall: ["drywall screw gun", "drywall taping knives", "drywall lift"],
        "roof-pitch": ["digital angle finder", "roofing nailer", "roofing hammer"],
        "appliance-fit": ["appliance dolly", "tape measure", "furniture moving straps"],
        framing: ["framing nailer", "circular saw", "framing square"],
        "board-foot": ["circular saw", "woodworking clamps", "tape measure"],
        edging: ["garden spade", "rubber mallet", "landscape edging tool"],
        structure: ["framing nailer", "circular saw", "laser level", "cordless drill"]
    };
    var calculator = document.querySelector("[data-calculator-form]");
    var projectForm = document.getElementById("project-form");
    var context = "";
    var customQuery = false;

    host.innerHTML = '<p class="eyebrow">Tools for your project</p>' +
        '<h2 id="tool-shopping-title">Find tools and compare retailers</h2>' +
        '<p>Choose a suggested tool or enter a tool, brand, size, or model. Every retailer link searches for the same item so you can compare prices and delivery. Amazon is the first option.</p>' +
        '<form data-tool-search><div class="field"><label for="tool-search-query">Tool or equipment</label>' +
        '<input id="tool-search-query" type="search" maxlength="200" required aria-describedby="tool-search-help"></div>' +
        '<button class="calculate-button" type="submit">Search Amazon ↗</button></form>' +
        '<p id="tool-search-help" class="retailer-note">Searches open in a new tab. Add a model number to compare the same product.</p>' +
        '<div class="tool-suggestions" aria-label="Suggested tools"></div>' +
        '<div class="tool-retailers" aria-label="Search this tool at a retailer"></div>' +
        '<p class="retailer-note">As an Amazon Associate I earn from qualifying purchases. Hardware World searches open in Google with results limited to that retailer.</p>';

    var input = host.querySelector("input");
    var submit = host.querySelector("button[type=submit]");
    var links = retailers.map(function (retailer, index) {
        var link = document.createElement("a");
        link.className = "retailer-link" + (index === 0 ? "tool-amazon" : "");
        link.textContent = retailer.name + (retailer.domain ? " (via Google)" : "") + " ↗";
        link.target = "_blank";
        link.rel = index === 0 ? "noopener noreferrer sponsored" : "nofollow noopener noreferrer";
        host.querySelector(".tool-retailers").appendChild(link);
        return link;
    });

    function updateLinks() {
        var query = input.value.trim();
        submit.disabled = !query;
        retailers.forEach(function (retailer, index) {
            var link = links[index];
            if (!query) {
                link.removeAttribute("href");
                link.setAttribute("aria-disabled", "true");
                return;
            }
            link.removeAttribute("aria-disabled");
            link.href = retailer.search ? retailer.search(query) : retailer.domain ?
                "https://www.google.com/search?q=" + encodeURIComponent("site:" + retailer.domain + " " + query) :
                retailer.url + encodeURIComponent(query);
        });
    }

    function updateSuggestions() {
        var active = document.querySelector("[data-project].is-active");
        var next = projectForm && active ? active.dataset.project : calculator ? calculator.dataset.calculatorForm : "structure";
        if (next === context) return;
        context = next;
        var options = suggestions[next === "paver" ? "patio" : next] || suggestions.landscape;
        var container = host.querySelector(".tool-suggestions");
        container.textContent = "";
        options.forEach(function (query) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "secondary-button";
            button.textContent = query;
            button.addEventListener("click", function () {
                customQuery = false;
                input.value = query;
                updateLinks();
            });
            container.appendChild(button);
        });
        if (!customQuery) input.value = options[0];
        updateLinks();
    }

    input.addEventListener("input", function () { customQuery = Boolean(input.value.trim()); updateLinks(); });
    host.querySelector("form").addEventListener("submit", function (event) {
        event.preventDefault();
        if (input.value.trim()) window.open(window.amazonSearch(input.value.trim()), "_blank", "noopener,noreferrer");
    });
    // Project buttons and saved projects update their active state before this observer runs.
    if (projectForm) new MutationObserver(updateSuggestions).observe(document.getElementById("project-picker"), { subtree: true, attributes: true, attributeFilter: ["class"] });
    updateSuggestions();
}());
