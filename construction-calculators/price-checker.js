(function () {
    "use strict";

    var requirement = window.BUILDESTIMATE_PRICING;
    var layout = document.querySelector(".calculator-layout");
    if (!layout || !requirement) return;

    var retailers = ["Home Depot", "Lowe's", "Walmart", "Local supplier"];
    var unitNames = {
        cu_ft: "ft³",
        gallon: "gal",
        each: "each",
        sq_ft: "ft²",
        linear_ft: "linear ft",
        board_ft: "board ft"
    };
    var feedOffers = [];
    var activeMaterial = null;
    var currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    var number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

    var section = document.createElement("section");
    section.className = "page-wrap price-checker-section";
    section.setAttribute("aria-labelledby", "price-checker-title");
    section.innerHTML =
        '<div class="price-checker-shell">' +
            '<div class="price-checker-heading">' +
                '<div><p class="eyebrow">Price checker</p><h2 id="price-checker-title">Compare the real project cost</h2></div>' +
                '<p class="price-requirement" data-price-requirement></p>' +
            '</div>' +
            '<p class="price-checker-intro">Compare unlike package sizes using the complete quantity your project requires. Whole-package rounding and leftover material are included.</p>' +
            '<div class="authorized-offers" data-live-offers aria-live="polite"></div>' +
            '<details class="manual-price-panel" open>' +
                '<summary>Compare current store and supplier prices</summary>' +
                '<p>Use the retailer search links on this page, then enter each current package size and price. Entries stay on this device.</p>' +
                '<div class="manual-price-grid" data-manual-grid></div>' +
            '</details>' +
            '<p class="price-disclaimer">Prices and availability vary by location and can change without notice. Taxes, delivery, minimum orders, membership discounts, and installation are not included. Verify the final cart before buying.</p>' +
        '</div>';
    layout.insertAdjacentElement("afterend", section);

    var requirementNode = section.querySelector("[data-price-requirement]");
    var offersNode = section.querySelector("[data-live-offers]");
    var manualGrid = section.querySelector("[data-manual-grid]");

    function finitePositive(value) {
        var parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    function roundUp(value) {
        var tolerance = Math.max(1, Math.abs(value)) * 1e-12;
        return Math.ceil(value - tolerance);
    }

    function formatQuantity(value, label) {
        return number.format(value) + " " + label;
    }

    function storageKey() {
        return "buildestimate-price-inputs-" + requirement.material;
    }

    function loadEntries() {
        try {
            return JSON.parse(window.localStorage.getItem(storageKey())) || {};
        } catch (error) {
            return {};
        }
    }

    function saveEntries(entries) {
        try {
            window.localStorage.setItem(storageKey(), JSON.stringify(entries));
        } catch (error) {
            // Comparison still works when storage is unavailable.
        }
    }

    function defaultPackageSize(retailer) {
        var material = requirement.material;
        var isLocal = retailer === "Local supplier";
        if (material === "gravel" || material === "river-rock") return isLocal ? 27 : 0.5;
        if (material === "topsoil") return isLocal ? 27 : 0.75;
        if (material === "mulch") return isLocal ? 27 : 2;
        if (material === "sod") return isLocal ? 500 : 10;
        if (material === "edging") return isLocal ? 20 : 8;
        return 1;
    }

    function manualCard(retailer, index, saved) {
        var card = document.createElement("article");
        card.className = "manual-price-card";
        card.dataset.manualCard = "";
        card.dataset.retailer = retailer;
        var packageId = "package-size-" + index;
        var priceId = "package-price-" + index;
        card.innerHTML =
            '<div class="manual-card-title"><h3></h3><span class="best-price-badge" hidden>Lowest total</span></div>' +
            '<div class="manual-price-fields">' +
                '<label for="' + packageId + '">Quantity per package <span></span><input id="' + packageId + '" data-package-size type="number" min="0" step="any" inputmode="decimal"></label>' +
                '<label for="' + priceId + '">Current package price ($)<input id="' + priceId + '" data-package-price type="number" min="0" step="any" inputmode="decimal" placeholder="0.00"></label>' +
            '</div>' +
            '<div class="manual-price-output" data-manual-output>Enter a package price to compare.</div>';
        card.querySelector("h3").textContent = retailer;
        card.querySelector(".manual-price-fields span").textContent = "(" + (unitNames[requirement.unit] || requirement.unitLabel) + ")";
        card.querySelector("[data-package-size]").value = finitePositive(saved.size) || defaultPackageSize(retailer);
        card.querySelector("[data-package-price]").value = finitePositive(saved.price) || "";
        return card;
    }

    function renderManualGrid() {
        var saved = loadEntries();
        manualGrid.replaceChildren();
        retailers.forEach(function (retailer, index) {
            manualGrid.appendChild(manualCard(retailer, index, saved[retailer] || {}));
        });
        updateManualComparison(false);
    }

    function updateManualComparison(shouldSave) {
        var entries = {};
        var calculations = [];
        Array.prototype.forEach.call(manualGrid.querySelectorAll("[data-manual-card]"), function (card) {
            var retailer = card.dataset.retailer;
            var size = finitePositive(card.querySelector("[data-package-size]").value);
            var price = finitePositive(card.querySelector("[data-package-price]").value);
            entries[retailer] = { size: size, price: price };
            card.classList.remove("is-best");
            card.querySelector(".best-price-badge").hidden = true;
            if (!size || !price) {
                card.querySelector("[data-manual-output]").textContent = "Enter a package price to compare.";
                return;
            }
            var packages = roundUp(requirement.quantity / size);
            var total = packages * price;
            var excess = Math.max(0, packages * size - requirement.quantity);
            calculations.push({ card: card, total: total });
            card.querySelector("[data-manual-output]").innerHTML =
                '<strong>' + packages + ' package' + (packages === 1 ? '' : 's') + ' · ' + currency.format(total) + '</strong>' +
                '<span>' + currency.format(price / size) + ' per ' + (unitNames[requirement.unit] || requirement.unitLabel) + ' · ' + formatQuantity(excess, requirement.unitLabel) + ' left over</span>';
        });
        if (shouldSave) saveEntries(entries);
        if (!calculations.length) return;
        var lowest = Math.min.apply(null, calculations.map(function (item) { return item.total; }));
        calculations.forEach(function (item) {
            if (Math.abs(item.total - lowest) < 0.005) {
                item.card.classList.add("is-best");
                item.card.querySelector(".best-price-badge").hidden = false;
            }
        });
    }

    function packageQuantity(offer) {
        var quantity = finitePositive(offer.quantityPerPackage);
        var unit = String(offer.quantityUnit || "").toLowerCase();
        if (!quantity) return 0;
        if (unit === requirement.unit) return quantity;
        if (requirement.unit === "cu_ft" && (unit === "cu_yd" || unit === "cubic_yard")) return quantity * 27;
        if (requirement.unit === "cu_ft" && (unit === "liter" || unit === "litre")) return quantity / 28.3168466;
        if (requirement.unit === "gallon" && (unit === "liter" || unit === "litre")) return quantity / 3.78541178;
        if (requirement.unit === "sq_ft" && unit === "sq_m") return quantity / 0.09290304;
        if (requirement.unit === "linear_ft" && (unit === "meter" || unit === "metre")) return quantity / 0.3048;
        return 0;
    }

    function relevantOffers() {
        return feedOffers.map(function (offer) {
            var genericAppliance = requirement.material.indexOf("appliance-") === 0 && offer && offer.material === "appliance";
            if (!offer || (offer.material !== requirement.material && !genericAppliance)) return null;
            var size = packageQuantity(offer);
            var price = finitePositive(offer.price);
            if (!size || !price || !offer.retailer || !offer.product) return null;
            var packages = roundUp(requirement.quantity / size);
            return {
                offer: offer,
                size: size,
                packages: packages,
                total: packages * price,
                excess: Math.max(0, packages * size - requirement.quantity)
            };
        }).filter(Boolean).sort(function (a, b) { return a.total - b.total; });
    }

    function offerCard(item, isBest) {
        var offer = item.offer;
        var card = document.createElement("article");
        card.className = "live-offer-card" + (isBest ? " is-best" : "");
        var heading = document.createElement("div");
        heading.className = "manual-card-title";
        var title = document.createElement("div");
        var retailer = document.createElement("p");
        retailer.className = "offer-retailer";
        retailer.textContent = offer.retailer;
        var product = document.createElement("h3");
        product.textContent = offer.product;
        title.appendChild(retailer);
        title.appendChild(product);
        heading.appendChild(title);
        if (isBest) {
            var badge = document.createElement("span");
            badge.className = "best-price-badge";
            badge.textContent = "Lowest total";
            heading.appendChild(badge);
        }
        var total = document.createElement("p");
        total.className = "offer-total";
        total.textContent = currency.format(item.total);
        var details = document.createElement("p");
        details.className = "offer-details";
        details.textContent = item.packages + " package" + (item.packages === 1 ? "" : "s") + " · " + currency.format(offer.price / item.size) + " per " + (unitNames[requirement.unit] || requirement.unitLabel) + " · " + formatQuantity(item.excess, requirement.unitLabel) + " left over";
        card.appendChild(heading);
        card.appendChild(total);
        card.appendChild(details);
        if (offer.availability) {
            var availability = document.createElement("p");
            availability.className = "offer-availability";
            availability.textContent = offer.availability;
            card.appendChild(availability);
        }
        var destination = offer.affiliateUrl || offer.productUrl;
        if (destination && /^https?:\/\//i.test(destination)) {
            var link = document.createElement("a");
            link.className = "offer-link";
            link.href = destination;
            link.target = "_blank";
            link.rel = (offer.affiliateUrl ? "sponsored " : "nofollow ") + "noopener";
            link.textContent = "Check at " + offer.retailer + " ↗";
            card.appendChild(link);
        }
        return card;
    }

    function renderOffers(feedDate) {
        offersNode.replaceChildren();
        var offers = relevantOffers();
        var status = document.createElement("p");
        status.className = "offer-feed-status";
        if (!offers.length) {
            status.textContent = "Authorized retailer price feed not connected yet. The manual comparison below is ready now.";
            offersNode.appendChild(status);
            return;
        }
        var parsedDate = feedDate ? new Date(feedDate) : null;
        var checked = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleString() : "recently";
        status.textContent = "Authorized prices last checked " + checked + ".";
        var grid = document.createElement("div");
        grid.className = "live-offer-grid";
        offers.forEach(function (item, index) { grid.appendChild(offerCard(item, index === 0)); });
        offersNode.appendChild(status);
        offersNode.appendChild(grid);
    }

    function updateRequirement(nextRequirement) {
        if (!nextRequirement) {
            section.hidden = true;
            return;
        }
        section.hidden = false;
        requirement = nextRequirement;
        requirementNode.textContent = "Project requirement: " + formatQuantity(requirement.quantity, requirement.unitLabel);
        if (activeMaterial !== requirement.material) {
            activeMaterial = requirement.material;
            renderManualGrid();
        } else {
            updateManualComparison(false);
        }
        renderOffers(window.BUILDESTIMATE_PRICE_FEED_DATE);
    }

    manualGrid.addEventListener("input", function () { updateManualComparison(true); });
    window.addEventListener("buildestimate:pricing", function (event) { updateRequirement(event.detail); });

    updateRequirement(requirement);
    fetch("../construction-calculators/data/retailer-offers.json", { cache: "no-store" })
        .then(function (response) {
            if (!response.ok) throw new Error("Price feed unavailable");
            return response.json();
        })
        .then(function (feed) {
            feedOffers = Array.isArray(feed.offers) ? feed.offers : [];
            window.BUILDESTIMATE_PRICE_FEED_DATE = feed.generatedAt || null;
            renderOffers(window.BUILDESTIMATE_PRICE_FEED_DATE);
        })
        .catch(function () { renderOffers(null); });
}());
