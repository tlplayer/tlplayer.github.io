(function () {
    "use strict";

    var form = document.querySelector("[data-calculator-form]");
    if (!form) return;

    var kind = form.dataset.calculatorForm;
    var result = document.querySelector("[data-calculator-result]");
    var currentUnit = "imperial";

    var unitFactors = {
        foot: 0.3048,
        centimeter: 2.54,
        millimeter: 25.4,
        area: 0.092903,
        volume: 28.3168,
        density: 1186.55284,
        tonne: 0.90718474,
        pricePerTonne: 1.10231131,
        paintCoverage: 0.0245424
    };

    function unit(unitName, imperialLabel, metricLabel) {
        return { unit: unitName, imperial: imperialLabel, metric: metricLabel };
    }

    var unitMaps = {
        gravel: {
            length: unit("foot", "Length (feet)", "Length (meters)"),
            width: unit("foot", "Width (feet)", "Width (meters)"),
            depth: unit("centimeter", "Depth (inches)", "Depth (centimeters)"),
            density: unit("density", "Gravel density (tons/yd³)", "Gravel density (kg/m³)"),
            bagVolume: unit("volume", "Bag volume (ft³)", "Bag volume (liters)"),
            truckCapacity: unit("tonne", "Truck capacity (tons)", "Truck capacity (metric tonnes)"),
            pricePerTon: unit("pricePerTonne", "Price per ton ($)", "Price per metric tonne ($)")
        },
        "river-rock": {
            length: unit("foot", "Length (feet)", "Length (meters)"),
            width: unit("foot", "Width (feet)", "Width (meters)"),
            depth: unit("centimeter", "Depth (inches)", "Depth (centimeters)"),
            density: unit("density", "Rock density (tons/yd³)", "Rock density (kg/m³)")
        },
        topsoil: {
            length: unit("foot", "Length (feet)", "Length (meters)"),
            width: unit("foot", "Width (feet)", "Width (meters)"),
            depth: unit("centimeter", "Depth (inches)", "Depth (centimeters)"),
            density: unit("density", "Density (tons/yd³)", "Density (kg/m³)")
        },
        mulch: {
            length: unit("foot", "Bed length (feet)", "Bed length (meters)"),
            width: unit("foot", "Bed width (feet)", "Bed width (meters)"),
            depth: unit("centimeter", "Mulch depth (inches)", "Mulch depth (centimeters)")
        },
        fence: {
            length: unit("foot", "Fence length (feet)", "Fence length (meters)"),
            postSpacing: unit("foot", "Maximum post spacing (feet)", "Maximum post spacing (meters)"),
            panelWidth: unit("foot", "Panel width (feet)", "Panel width (meters)"),
            gateWidth: unit("foot", "Total gate width (feet)", "Total gate width (meters)")
        },
        "roof-pitch": {
            rise: unit("centimeter", "Rise (inches)", "Rise (centimeters)"),
            run: unit("centimeter", "Run (inches)", "Run (centimeters)")
        },
        "board-foot": {
            thickness: unit("millimeter", "Thickness (inches)", "Thickness (millimeters)"),
            width: unit("millimeter", "Width (inches)", "Width (millimeters)"),
            length: unit("foot", "Length (feet)", "Length (meters)")
        },
        paver: {
            length: unit("foot", "Project length (feet)", "Project length (meters)"),
            width: unit("foot", "Project width (feet)", "Project width (meters)"),
            paverLength: unit("millimeter", "Paver length (inches)", "Paver length (millimeters)"),
            paverWidth: unit("millimeter", "Paver width (inches)", "Paver width (millimeters)")
        },
        paint: {
            length: unit("foot", "Room length (feet)", "Room length (meters)"),
            width: unit("foot", "Room width (feet)", "Room width (meters)"),
            height: unit("foot", "Wall height (feet)", "Wall height (meters)"),
            coverage: unit("paintCoverage", "Coverage (ft² per gallon)", "Coverage (m² per liter)")
        },
        drywall: {
            length: unit("foot", "Room length (feet)", "Room length (meters)"),
            width: unit("foot", "Room width (feet)", "Room width (meters)"),
            height: unit("foot", "Wall height (feet)", "Wall height (meters)")
        },
        "appliance-fit": {
            openingWidth: unit("centimeter", "Opening width (inches)", "Opening width (centimeters)"),
            openingHeight: unit("centimeter", "Opening height (inches)", "Opening height (centimeters)"),
            openingDepth: unit("centimeter", "Opening depth (inches)", "Opening depth (centimeters)"),
            productWidth: unit("centimeter", "Appliance width (inches)", "Appliance width (centimeters)"),
            productHeight: unit("centimeter", "Appliance height (inches)", "Appliance height (centimeters)"),
            productDepth: unit("centimeter", "Appliance depth (inches)", "Appliance depth (centimeters)"),
            sideClearance: unit("centimeter", "Clearance per side (inches)", "Clearance per side (centimeters)"),
            topClearance: unit("centimeter", "Top clearance (inches)", "Top clearance (centimeters)"),
            rearClearance: unit("centimeter", "Rear clearance (inches)", "Rear clearance (centimeters)"),
            doorway: unit("centimeter", "Narrowest delivery doorway (inches)", "Narrowest delivery doorway (centimeters)")
        },
        framing: {
            wallLength: unit("foot", "Wall length (feet)", "Wall length (meters)"),
            wallHeight: unit("foot", "Wall height (feet)", "Wall height (meters)")
        }
    };

    function toBaseValue(name, number) {
        var definition = (unitMaps[kind] || {})[name];
        if (currentUnit !== "metric" || !definition) return number;
        return number / unitFactors[definition.unit];
    }

    function value(name) {
        return toBaseValue(name, Number(form.elements.namedItem(name).value));
    }

    function checked(name) {
        var control = form.elements.namedItem(name);
        return Boolean(control && control.checked);
    }

    function optionalValue(name, fallback) {
        var control = form.elements.namedItem(name);
        if (!control) return fallback;
        var number = Number(control.value);
        return Number.isFinite(number) ? toBaseValue(name, number) : fallback;
    }

    function metric() {
        return currentUnit === "metric";
    }

    function format(number, digits) {
        return Number(number).toLocaleString("en-US", {
            maximumFractionDigits: digits == null ? 2 : digits
        });
    }

    function roundUp(number) {
        var tolerance = Math.max(1, Math.abs(number)) * 1e-12;
        return Math.ceil(number - tolerance);
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
            ["Estimated weight", metric() ? format(tons * 0.90718474) + " t" : format(tons) + " tons"],
            ["Volume", metric() ? format(cubicFeet * 0.02831685) + " m³" : format(cubicFeet) + " ft³"],
            ["Before overage", metric() ? format(cubicYards * 0.76455486) + " m³" : format(cubicYards) + " yd³"]
        ];

        if (label === "Gravel") {
            var bagVolume = Math.max(0, optionalValue("bagVolume", 0));
            var truckCapacity = Math.max(0, optionalValue("truckCapacity", 0));
            var pricePerTon = Math.max(0, optionalValue("pricePerTon", 0));
            if (bagVolume) details.push(["Bagged option", format(roundUp(orderYards * 27 / bagVolume), 0) + " bags"]);
            if (truckCapacity) details.push(["Truckloads", format(roundUp(tons / truckCapacity), 0)]);
            if (pricePerTon) details.push(["Estimated material cost", "$" + format(tons * pricePerTon)]);
        }

        return {
            primary: metric() ? format(orderYards * 0.76455486) + " cubic meters" : format(orderYards) + " cubic yards",
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
            var bags = roundUp(cubicFeet / value("bagSize"));
            return {
                primary: metric() ? format(cubicYards * 0.76455486) + " cubic meters" : format(cubicYards) + " cubic yards",
                details: [
                    ["Bags needed", format(bags, 0) + " bags"],
                    ["Volume", metric() ? format(cubicFeet * 28.3168) + " L" : format(cubicFeet) + " ft³"],
                    ["Coverage", metric() ? format(value("length") * value("width") * 0.092903) + " m²" : format(value("length") * value("width"), 0) + " ft²"]
                ],
                note: "Bag count is rounded up and includes " + format(waste * 100, 1) + "% extra material."
            };
        },
        fence: function () {
            if (!requirePositive(["length", "postSpacing", "panelWidth", "bagsPerPost"])) return null;
            var gateWidth = Math.max(0, value("gateWidth") || 0);
            var fenceLength = Math.max(0, value("length") - gateWidth);
            var sections = roundUp(fenceLength / value("postSpacing"));
            var posts = sections + 1 + (gateWidth > 0 ? 1 : 0);
            var panels = roundUp(fenceLength / value("panelWidth"));
            var concrete = roundUp(posts * value("bagsPerPost"));
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
                primary: metric() ? format(total * 0.00235974, 4) + " cubic meters" : format(total) + " board feet",
                details: [
                    ["Per board", metric() ? format(each * 0.00235974, 4) + " m³" : format(each) + " bd ft"],
                    ["Quantity", format(value("quantity"), 0) + " boards"],
                    ["Total length", metric() ? format(value("length") * value("quantity") * 0.3048) + " m" : format(value("length") * value("quantity")) + " ft"]
                ],
                note: "Use nominal thickness and width for rough lumber; use actual dimensions when pricing surfaced lumber by volume."
            };
        },
        paver: function () {
            if (!requirePositive(["length", "width", "paverLength", "paverWidth"])) return null;
            var area = value("length") * value("width");
            var waste = Math.max(0, value("waste") || 0) / 100;
            var paverArea = value("paverLength") * value("paverWidth") / 144;
            var count = roundUp(area * (1 + waste) / paverArea);
            return {
                primary: format(count, 0) + " pavers",
                details: [
                    ["Project area", metric() ? format(area * 0.092903) + " m²" : format(area) + " ft²"],
                    ["Order area", metric() ? format(area * (1 + waste) * 0.092903) + " m²" : format(area * (1 + waste)) + " ft²"],
                    ["Each paver", metric() ? format(paverArea * 0.092903, 4) + " m²" : format(paverArea, 3) + " ft²"]
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
                primary: metric() ? format(roundUp(exactGallons * 3.78541), 0) + " liters of paint" : format(roundUp(exactGallons), 0) + " gallons of paint",
                details: [
                    ["Exact estimate", metric() ? format(exactGallons * 3.78541) + " L" : format(exactGallons) + " gal"],
                    ["Paintable area", metric() ? format(paintable * 0.092903) + " m²" : format(paintable, 0) + " ft²"],
                    ["Coated area", metric() ? format(coatedArea * 0.092903) + " m²" : format(coatedArea, 0) + " ft²"]
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
            var sheets = roundUp(totalArea * (1 + waste) / value("sheetArea"));
            return {
                primary: format(sheets, 0) + " drywall sheets",
                details: [
                    ["Surface area", metric() ? format(totalArea * 0.092903) + " m²" : format(totalArea, 0) + " ft²"],
                    ["Drywall screws", format(sheets * 32, 0)],
                    ["Joint compound", metric() ? format(totalArea * .053 * 0.453592) + " kg" : format(totalArea * .053, 0) + " lb"]
                ],
                note: "Sheet count includes " + format(waste * 100, 1) + "% overage. Openings are left in as a practical cutting allowance."
            };
        },
        "appliance-fit": function () {
            if (!requirePositive(["openingWidth", "openingHeight", "openingDepth", "productWidth", "productHeight", "productDepth"])) return null;
            var requiredWidth = value("productWidth") + Math.max(0, value("sideClearance") || 0) * 2;
            var requiredHeight = value("productHeight") + Math.max(0, value("topClearance") || 0);
            var requiredDepth = value("productDepth") + Math.max(0, value("rearClearance") || 0);
            var widthMargin = value("openingWidth") - requiredWidth;
            var heightMargin = value("openingHeight") - requiredHeight;
            var depthMargin = value("openingDepth") - requiredDepth;
            var fits = widthMargin >= 0 && heightMargin >= 0 && depthMargin >= 0;
            var doorway = Math.max(0, optionalValue("doorway", 0));
            var deliveryFits = !doorway || doorway >= Math.min(value("productWidth"), value("productDepth"));
            var applianceName = form.elements.namedItem("applianceType").selectedOptions[0].textContent.toLowerCase();
            var unitLabel = metric() ? "cm" : "in";
            var conversion = metric() ? 2.54 : 1;

            function clearance(margin) {
                return margin >= 0
                    ? format(margin * conversion) + " " + unitLabel + " remaining"
                    : format(Math.abs(margin) * conversion) + " " + unitLabel + " short";
            }

            return {
                primary: fits ? "The " + applianceName + " fits" : "The " + applianceName + " does not fit",
                details: [
                    ["Width check", clearance(widthMargin)],
                    ["Height check", clearance(heightMargin)],
                    ["Depth check", clearance(depthMargin)]
                ],
                note: (doorway ? (deliveryFits ? "The basic doorway-width check passes. " : "The appliance may not pass through the entered doorway. ") : "Add the narrowest doorway for a basic delivery-path check. ") + "Always use the manufacturer's required ventilation, hinge, handle, hookup, and door-swing clearances."
            };
        },
        framing: function () {
            if (!requirePositive(["wallLength", "wallHeight", "studSpacing", "plateRuns"])) return null;
            var openings = Math.max(0, value("openings") || 0);
            var extraPerOpening = Math.max(0, value("extraPerOpening") || 0);
            var waste = Math.max(0, value("waste") || 0) / 100;
            var baseStuds = roundUp(value("wallLength") * 12 / value("studSpacing")) + 1 + openings * extraPerOpening;
            var orderStuds = roundUp(baseStuds * (1 + waste));
            var plateLength = value("wallLength") * value("plateRuns") * (1 + waste);
            var wallArea = value("wallLength") * value("wallHeight");
            return {
                primary: format(orderStuds, 0) + " wall studs",
                details: [
                    ["Before waste", format(baseStuds, 0) + " studs"],
                    ["Plate lumber", metric() ? format(plateLength * 0.3048) + " m" : format(plateLength) + " linear ft"],
                    ["Wall area", metric() ? format(wallArea * 0.092903) + " m²" : format(wallArea) + " ft²"]
                ],
                note: "A quantity estimate only. Openings add " + format(extraPerOpening, 0) + " studs each; headers, corners, intersections, blocking, and structural requirements must be planned separately."
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

    function formatControlValue(number) {
        return String(Number(number.toFixed(4)));
    }

    function updateUnitLabels() {
        var definitions = unitMaps[kind] || {};
        Object.keys(definitions).forEach(function (name) {
            var label = form.querySelector('label[for="' + name + '"]');
            if (label) label.textContent = definitions[name][currentUnit];
        });

        var bagSize = form.elements.namedItem("bagSize");
        if (bagSize) {
            Array.from(bagSize.options).forEach(function (option) {
                option.textContent = currentUnit === "metric"
                    ? format(Number(option.value) * 28.3168, 1) + " L bag"
                    : option.value + " ft³ bag";
            });
        }

        var sheetArea = form.elements.namedItem("sheetArea");
        if (sheetArea) {
            var metricSheets = { "32": "1.2 × 2.4 m (2.97 m²)", "40": "1.2 × 3.0 m (3.72 m²)", "48": "1.2 × 3.7 m (4.46 m²)" };
            var imperialSheets = { "32": "4 × 8 ft (32 ft²)", "40": "4 × 10 ft (40 ft²)", "48": "4 × 12 ft (48 ft²)" };
            Array.from(sheetArea.options).forEach(function (option) {
                option.textContent = (currentUnit === "metric" ? metricSheets : imperialSheets)[option.value];
            });
        }

        var studSpacing = form.elements.namedItem("studSpacing");
        if (studSpacing) {
            Array.from(studSpacing.options).forEach(function (option) {
                option.textContent = currentUnit === "metric"
                    ? (option.value === "16" ? "406 mm on center" : "610 mm on center")
                    : option.value + " inches on center";
            });
        }
    }

    function switchUnitSystem(nextUnit) {
        if (nextUnit === currentUnit) return;
        var definitions = unitMaps[kind] || {};
        Object.keys(definitions).forEach(function (name) {
            var control = form.elements.namedItem(name);
            if (!control || control.tagName === "SELECT" || !Number.isFinite(Number(control.value))) return;
            var factor = unitFactors[definitions[name].unit];
            control.value = formatControlValue(nextUnit === "metric" ? Number(control.value) * factor : Number(control.value) / factor);
        });
        currentUnit = nextUnit;
        updateUnitLabels();
        calculate();
    }

    function setupUnitSystem() {
        var wrapper = document.createElement("div");
        wrapper.className = "unit-system-field";
        wrapper.innerHTML = '<label for="unit-system">Measurement system</label><select id="unit-system" name="units"><option value="imperial">Imperial</option><option value="metric">Metric</option></select>';
        form.insertBefore(wrapper, form.firstChild);

        var selector = wrapper.querySelector("select");
        var params = new URLSearchParams(window.location.search);
        var requestedUnit = params.get("units") === "metric" ? "metric" : "imperial";
        selector.value = requestedUnit;

        if (requestedUnit === "metric") {
            var definitions = unitMaps[kind] || {};
            Object.keys(definitions).forEach(function (name) {
                var control = form.elements.namedItem(name);
                if (!control || params.has(name) || control.tagName === "SELECT") return;
                control.value = formatControlValue(Number(control.value) * unitFactors[definitions[name].unit]);
            });
        }

        currentUnit = requestedUnit;
        selector.addEventListener("change", function () { switchUnitSystem(selector.value); });
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

    setupUnitSystem();
    hydrateFromUrl();
    updateUnitLabels();
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
            if (depth) form.elements.namedItem("depth").value = metric() ? formatControlValue(depth * 2.54) : depth;
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
        drywall: "drywall sheets",
        "appliance-fit": "large appliances",
        framing: "2x4 studs framing lumber"
    };

    function retailerQuery() {
        if (kind === "appliance-fit") {
            return form.elements.namedItem("applianceType").value + " appliance";
        }
        return retailerSearches[kind];
    }

    function updateRetailerLinks(panel) {
        var query = retailerQuery();
        panel.querySelector(".lowes-link").href = "https://www.lowes.com/search?searchTerm=" + encodeURIComponent(query);
        panel.querySelector(".home-depot-link").href = "https://www.homedepot.com/s/" + encodeURIComponent(query);
    }

    function addRetailerLinks() {
        var query = retailerQuery();
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
        updateRetailerLinks(panel);

        var applianceType = form.elements.namedItem("applianceType");
        if (applianceType) applianceType.addEventListener("change", function () { updateRetailerLinks(panel); });
    }

    addRetailerLinks();
}());
