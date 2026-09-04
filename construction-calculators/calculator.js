(function () {
    "use strict";

    var form = document.querySelector("[data-calculator-form]");
    if (!form) return;

    var kind = form.dataset.calculatorForm;
    var result = document.querySelector("[data-calculator-result]");

    function value(name) {
        return Number(form.elements.namedItem(name).value);
    }

    function checked(name) {
        var control = form.elements.namedItem(name);
        return Boolean(control && control.checked);
    }

    function optionalValue(name, fallback) {
        var control = form.elements.namedItem(name);
        if (!control) return fallback;
        var number = Number(control.value);
        return Number.isFinite(number) ? number : fallback;
    }

    function format(number, digits) {
        return Number(number).toLocaleString("en-US", {
            maximumFractionDigits: digits == null ? 2 : digits
        });
    }

    function requirePositive(names) {
        return names.every(function (name) {
            return Number.isFinite(value(name)) && value(name) > 0;
        });
    }

    function volumeMaterial(label) {
        if (!requirePositive(["length", "width", "depth", "density"])) return null;
        var waste = Math.max(0, value("waste") || 0) / 100;
        var cubicFeet = value("length") * value("width") * (value("depth") / 12);
        var cubicYards = cubicFeet / 27;
        var orderYards = cubicYards * (1 + waste);
        var tons = orderYards * value("density");
        var details = [
            ["Estimated weight", format(tons) + " tons"],
            ["Volume", format(cubicFeet) + " ft³"],
            ["Before overage", format(cubicYards) + " yd³"]
        ];

        if (label === "Gravel") {
            var bagVolume = Math.max(0, optionalValue("bagVolume", 0));
            var truckCapacity = Math.max(0, optionalValue("truckCapacity", 0));
            var pricePerTon = Math.max(0, optionalValue("pricePerTon", 0));
            if (bagVolume) details.push(["Bagged option", format(Math.ceil(orderYards * 27 / bagVolume), 0) + " bags"]);
            if (truckCapacity) details.push(["Truckloads", format(Math.ceil(tons / truckCapacity), 0)]);
            if (pricePerTon) details.push(["Estimated material cost", "$" + format(tons * pricePerTon)]);
        }

        return {
            primary: format(orderYards) + " cubic yards",
            details: details,
            note: "Estimate includes " + format(waste * 100, 1) + "% extra material. Actual " + label.toLowerCase() + " density varies by product and moisture."
        };
    }

    var calculators = {
        gravel: function () { return volumeMaterial("Gravel"); },
        "river-rock": function () { return volumeMaterial("River rock"); },
        topsoil: function () { return volumeMaterial("Topsoil"); },
        mulch: function () {
            if (!requirePositive(["length", "width", "depth", "bagSize"])) return null;
            var waste = Math.max(0, value("waste") || 0) / 100;
            var cubicFeet = value("length") * value("width") * (value("depth") / 12) * (1 + waste);
            var cubicYards = cubicFeet / 27;
            var bags = Math.ceil(cubicFeet / value("bagSize"));
            return {
                primary: format(cubicYards) + " cubic yards",
                details: [
                    ["Bags needed", format(bags, 0) + " bags"],
                    ["Volume", format(cubicFeet) + " ft³"],
                    ["Coverage", format(value("length") * value("width"), 0) + " ft²"]
                ],
                note: "Bag count is rounded up and includes " + format(waste * 100, 1) + "% extra material."
            };
        },
        fence: function () {
            if (!requirePositive(["length", "postSpacing", "panelWidth", "bagsPerPost"])) return null;
            var gateWidth = Math.max(0, value("gateWidth") || 0);
            var fenceLength = Math.max(0, value("length") - gateWidth);
            var sections = Math.ceil(fenceLength / value("postSpacing"));
            var posts = sections + 1 + (gateWidth > 0 ? 1 : 0);
            var panels = Math.ceil(fenceLength / value("panelWidth"));
            var concrete = Math.ceil(posts * value("bagsPerPost"));
            return {
                primary: format(posts, 0) + " fence posts",
                details: [
                    ["Fence panels", format(panels, 0)],
                    ["Concrete", format(concrete, 0) + " bags"],
                    ["Fence sections", format(sections, 0)]
                ],
                note: "Includes one end post and one additional gate post when a gate width is entered. Verify corner and gate hardware separately."
            };
        },
        "roof-pitch": function () {
            if (!requirePositive(["rise", "run"])) return null;
            var ratio = value("rise") / value("run");
            var angle = Math.atan(ratio) * 180 / Math.PI;
            var multiplier = Math.sqrt(1 + ratio * ratio);
            var normalizedRise = ratio * 12;
            return {
                primary: format(normalizedRise) + ":12 pitch",
                details: [
                    ["Roof angle", format(angle, 1) + "°"],
                    ["Slope", format(ratio * 100, 1) + "%"],
                    ["Pitch multiplier", format(multiplier, 3) + "×"]
                ],
                note: "The multiplier converts horizontal roof area to sloped roof area. Add a separate waste allowance for roofing materials."
            };
        },
        "board-foot": function () {
            if (!requirePositive(["thickness", "width", "length", "quantity"])) return null;
            var each = value("thickness") * value("width") * value("length") / 12;
            var total = each * value("quantity");
            return {
                primary: format(total) + " board feet",
                details: [
                    ["Per board", format(each) + " bd ft"],
                    ["Quantity", format(value("quantity"), 0) + " boards"],
                    ["Total length", format(value("length") * value("quantity")) + " ft"]
                ],
                note: "Use nominal thickness and width for rough lumber; use actual dimensions when pricing surfaced lumber by volume."
            };
        },
        paver: function () {
            if (!requirePositive(["length", "width", "paverLength", "paverWidth"])) return null;
            var area = value("length") * value("width");
            var waste = Math.max(0, value("waste") || 0) / 100;
            var paverArea = value("paverLength") * value("paverWidth") / 144;
            var count = Math.ceil(area * (1 + waste) / paverArea);
            return {
                primary: format(count, 0) + " pavers",
                details: [
                    ["Project area", format(area) + " ft²"],
                    ["Order area", format(area * (1 + waste)) + " ft²"],
                    ["Each paver", format(paverArea, 3) + " ft²"]
                ],
                note: "Count includes " + format(waste * 100, 1) + "% for cuts and breakage. Pattern layouts may require more overage."
            };
        },
        paint: function () {
            if (!requirePositive(["length", "width", "height", "coats", "coverage"])) return null;
            var wallArea = 2 * (value("length") + value("width")) * value("height");
            var openings = Math.max(0, value("doors") || 0) * 21 + Math.max(0, value("windows") || 0) * 15;
            var paintable = Math.max(0, wallArea - openings);
            var coatedArea = paintable * value("coats");
            var exactGallons = coatedArea / value("coverage");
            return {
                primary: format(Math.ceil(exactGallons), 0) + " gallons of paint",
                details: [
                    ["Exact estimate", format(exactGallons) + " gal"],
                    ["Paintable area", format(paintable, 0) + " ft²"],
                    ["Coated area", format(coatedArea, 0) + " ft²"]
                ],
                note: "Uses 21 ft² per door and 15 ft² per window. Textured or porous walls can require additional paint."
            };
        },
        drywall: function () {
            if (!requirePositive(["length", "width", "height", "sheetArea"])) return null;
            var wallArea = 2 * (value("length") + value("width")) * value("height");
            var ceilingArea = checked("includeCeiling") ? value("length") * value("width") : 0;
            var totalArea = wallArea + ceilingArea;
            var waste = Math.max(0, value("waste") || 0) / 100;
            var sheets = Math.ceil(totalArea * (1 + waste) / value("sheetArea"));
            return {
                primary: format(sheets, 0) + " drywall sheets",
                details: [
                    ["Surface area", format(totalArea, 0) + " ft²"],
                    ["Drywall screws", format(sheets * 32, 0)],
                    ["Joint compound", format(totalArea * .053, 0) + " lb"]
                ],
                note: "Sheet count includes " + format(waste * 100, 1) + "% overage. Openings are left in as a practical cutting allowance."
            };
        }
    };

    function render(output) {
        if (!output) {
            result.innerHTML = '<p class="result-kicker">Check your measurements</p><p class="primary-result">Enter values greater than zero</p>';
            return;
        }

        var details = output.details.map(function (item) {
            return '<div class="result-detail"><strong>' + item[1] + '</strong>' + item[0] + '</div>';
        }).join("");

        result.innerHTML =
            '<p class="result-kicker">You will need approximately</p>' +
            '<p class="primary-result">' + output.primary + '</p>' +
            '<div class="result-details">' + details + '</div>' +
            '<p class="result-note">' + output.note + '</p>' +
            '<div class="result-actions" aria-label="Result actions">' +
                '<button type="button" data-copy-result>Copy result</button>' +
                '<button type="button" data-share-result>Share</button>' +
                '<button type="button" data-print-result>Print</button>' +
            '</div>';
    }

    function hydrateFromUrl() {
        var params = new URLSearchParams(window.location.search);
        params.forEach(function (parameterValue, name) {
            var control = form.elements.namedItem(name);
            if (!control || control.type === "submit") return;
            if (control.type === "checkbox") control.checked = parameterValue === "1";
            else control.value = parameterValue;
        });
    }

    function updateShareUrl() {
        if (!window.history || !window.history.replaceState) return;
        var url = new URL(window.location.href);
        Array.prototype.forEach.call(form.elements, function (control) {
            if (!control.name || control.type === "submit") return;
            url.searchParams.set(control.name, control.type === "checkbox" ? (control.checked ? "1" : "0") : control.value);
        });
        window.history.replaceState({}, "", url.pathname + "?" + url.searchParams.toString());
    }

    function copyText(text, button, successLabel) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) return Promise.reject(new Error("Clipboard unavailable"));
        return navigator.clipboard.writeText(text).then(function () {
            var previous = button.textContent;
            button.textContent = successLabel;
            window.setTimeout(function () { button.textContent = previous; }, 1600);
        });
    }

    function calculate(event) {
        if (event) event.preventDefault();
        render(calculators[kind]());
        updateShareUrl();
    }

    hydrateFromUrl();
    form.addEventListener("submit", calculate);
    form.addEventListener("input", calculate);
    result.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        if (!button) return;

        if (button.hasAttribute("data-print-result")) {
            window.print();
            return;
        }

        var summary = result.querySelector(".primary-result").textContent + ". " +
            Array.from(result.querySelectorAll(".result-detail")).map(function (detail) {
                return detail.textContent.trim();
            }).join("; ");

        if (button.hasAttribute("data-copy-result")) {
            copyText(summary, button, "Copied").catch(function () { button.textContent = "Copy unavailable"; });
        }

        if (button.hasAttribute("data-share-result")) {
            if (navigator.share) {
                navigator.share({ title: document.title, text: summary, url: window.location.href }).catch(function () {});
            } else {
                copyText(window.location.href, button, "Link copied").catch(function () { button.textContent = "Share unavailable"; });
            }
        }
    });

    var projectPreset = form.elements.namedItem("project");
    if (kind === "gravel" && projectPreset) {
        var gravelDepths = { driveway: 4, walkway: 3, "french-drain": 12, "patio-base": 4, "garden-path": 3, "parking-pad": 6 };
        projectPreset.addEventListener("change", function () {
            var depth = gravelDepths[projectPreset.value];
            if (depth) form.elements.namedItem("depth").value = depth;
            calculate();
        });
    }

    calculate();

    var retailerSearches = {
        gravel: "gravel bags",
        "river-rock": "river rock landscaping",
        topsoil: "topsoil bags",
        mulch: "mulch bags",
        fence: "fence panels and posts",
        "roof-pitch": "roofing materials",
        "board-foot": "lumber boards",
        paver: "patio pavers",
        paint: "interior wall paint",
        drywall: "drywall sheets"
    };

    function addRetailerLinks() {
        var query = retailerSearches[kind];
        var sideColumn = document.querySelector(".side-column");
        if (!query || !sideColumn) return;

        var panel = document.createElement("section");
        panel.className = "side-panel retailer-panel";
        panel.setAttribute("aria-labelledby", "shop-materials-title");
        panel.innerHTML =
            '<p class="retailer-kicker">Optional next step</p>' +
            '<h2 id="shop-materials-title">Compare materials</h2>' +
            '<p class="retailer-intro">Open matching search results at either retailer. Local prices and availability vary.</p>' +
            '<div class="retailer-links">' +
                '<a class="retailer-link lowes-link" href="https://www.lowes.com/search?searchTerm=' + encodeURIComponent(query) + '" target="_blank" rel="nofollow noopener">' +
                    '<span><small>Shop at</small>Lowe&#39;s</span><span aria-hidden="true">↗</span>' +
                '</a>' +
                '<a class="retailer-link home-depot-link" href="https://www.homedepot.com/s/' + encodeURIComponent(query) + '" target="_blank" rel="nofollow noopener">' +
                    '<span><small>Shop at</small>Home Depot</span><span aria-hidden="true">↗</span>' +
                '</a>' +
            '</div>' +
            '<p class="retailer-note">Direct retailer search links. No price or product is endorsed.</p>';

        var ad = sideColumn.querySelector("[data-ad-unit]");
        sideColumn.insertBefore(panel, ad || null);
    }

    addRetailerLinks();
}());
