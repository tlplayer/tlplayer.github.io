(function () {
    "use strict";

    var form = document.getElementById("structure-form");
    var canvas = document.getElementById("structure-canvas");
    if (!form || !canvas || !window.BuildEstimateMeshViewer) return;
    var viewer = new window.BuildEstimateMeshViewer(canvas);
    var unitSystem = document.getElementById("structure-units");
    var currentUnit = "imperial";
    var output = document.getElementById("structure-bom");
    var stats = document.getElementById("structure-stats");
    var summary = document.getElementById("structure-summary");
    var modelLabel = document.getElementById("structure-model-label");
    var latestPhases = [];

    function element(id) { return document.getElementById(id); }
    function numeric(id, fallback) { var value = Number(element(id).value); return Number.isFinite(value) ? value : fallback; }
    function toFeet(value) { return currentUnit === "metric" ? value / 0.3048 : value; }
    function format(value, digits) { return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits == null ? 1 : digits }); }
    function round(value) { return Math.ceil(value - Math.max(1, Math.abs(value)) * 1e-12); }
    function displayLength(feet) { return currentUnit === "metric" ? format(feet * 0.3048) + " m" : format(feet) + " ft"; }
    function displayArea(squareFeet) { return currentUnit === "metric" ? format(squareFeet * 0.092903) + " m²" : format(squareFeet, 0) + " ft²"; }
    function displayVolume(cubicFeet) { return currentUnit === "metric" ? format(cubicFeet * 0.0283168) + " m³" : format(cubicFeet / 27) + " yd³"; }

    function csvCell(value) {
        var text = value == null ? "" : String(value);
        if (typeof value === "string" && /^[=+\-@]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    }

    function downloadCsv(filename, rows) {
        var csv = "\ufeff" + rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
        var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        var link = document.createElement("a");
        link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function shoppingUrls(query) {
        var encoded = encodeURIComponent(query);
        return { homeDepot: "https://www.homedepot.com/s/" + encoded, lowes: "https://www.lowes.com/search?searchTerm=" + encoded };
    }

    function splitQuantity(quantity, declaredUnit) {
        if (typeof quantity === "number") return { value: quantity, unit: declaredUnit || "" };
        var match = String(quantity).match(/^([\d,.]+)\s*(.*)$/);
        return match ? { value: Number(match[1].replace(/,/g, "")), unit: declaredUnit || match[2] } : { value: quantity, unit: declaredUnit || "" };
    }

    function exportStructureCsv() {
        var rows = [["Record Type", "Phase", "Item", "Value / Quantity", "Unit", "Basis", "Unit Cost", "Extended Cost", "Home Depot", "Lowe's"]];
        rows.push(["Project", "", "Structure", element("building-type").selectedOptions[0].textContent, "", "", "", "", "", ""]);
        rows.push(["Project", "", "Exported", new Date().toISOString(), "", "", "", "", "", ""]);
        rows.push(["Project", "", "Shareable configuration", window.location.href, "", "", "", "", "", ""]);
        Array.prototype.forEach.call(form.elements, function (control) {
            if (!control.name) return;
            var label = form.querySelector('label[for="' + control.id + '"]');
            var value = control.tagName === "SELECT" ? control.selectedOptions[0].textContent : control.value;
            rows.push(["Dimension / assumption", "", label ? label.textContent.trim() : control.name, value, "", control.name, "", "", "", ""]);
        });
        latestPhases.forEach(function (phase) {
            phase.rows.forEach(function (item) {
                var urls = shoppingUrls(item.query);
                var quantity = splitQuantity(item.quantity, item.unit);
                rows.push(["Material", phase.name, item.name, quantity.value, quantity.unit, item.method, "", "", urls.homeDepot, urls.lowes]);
            });
        });
        rows.push(["Note", "", "Costs", "Enter quoted unit costs in Excel", "", "Extended cost is intentionally blank until a supplier price is known.", "", "", "", ""]);
        downloadCsv(element("building-type").value + "-material-estimate.csv", rows);
    }

    function shareCurrent(button) {
        var data = { title: document.title, text: summary.textContent, url: window.location.href };
        if (navigator.share) {
            navigator.share(data).catch(function () {});
            return;
        }
        navigator.clipboard.writeText(data.url).then(function () {
            var previous = button.textContent; button.textContent = "Link copied";
            window.setTimeout(function () { button.textContent = previous; }, 1500);
        }).catch(function () { button.textContent = "Copy unavailable"; });
    }

    function updateUnitConstraints() {
        element("building-length").min = currentUnit === "metric" ? "1.2" : "4";
        element("building-width").min = currentUnit === "metric" ? "1.2" : "4";
        element("wall-height").min = currentUnit === "metric" ? "1.8" : "6";
    }

    function row(name, quantity, unit, query, method) { return { name: name, quantity: quantity, unit: unit, query: query, method: method }; }

    function calculate() {
        var length = Math.max(4, toFeet(numeric("building-length", 24)));
        var width = Math.max(4, toFeet(numeric("building-width", 24)));
        var stories = Math.max(1, numeric("building-stories", 1));
        var wallHeight = Math.max(6, toFeet(numeric("wall-height", 9)));
        var waste = Math.max(0, numeric("structure-waste", 10)) / 100;
        var perimeter = 2 * (length + width);
        var footprint = length * width;
        var floorArea = footprint * stories;
        var grossWallArea = perimeter * wallHeight * stories;
        var openings = Math.max(0, numeric("window-count", 0)) * 15 + Math.max(0, numeric("door-count", 0)) * 21;
        var netWallArea = Math.max(0, grossWallArea - openings);
        var pitch = Math.max(0, numeric("roof-pitch", 0));
        var roofType = element("roof-type").value;
        var roofMultiplier = roofType === "flat" ? 1.02 : Math.sqrt(1 + Math.pow(pitch / 12, 2)) * (roofType === "hip" ? 1.04 : 1);
        var roofArea = footprint * roofMultiplier;
        var framing = element("framing-type").value;
        var studLabel = framing === "steel" ? "Steel wall studs" : framing + " studs";
        var finish = element("exterior-finish").selectedOptions[0].textContent;
        var phases = [];
        var foundationRows = [];
        if (element("foundation-type").value === "slab") {
            foundationRows.push(row("4-inch concrete slab", displayVolume(footprint * 4 / 12), "", "concrete mix or ready mix", "Footprint × 4 in"));
            foundationRows.push(row("Compacted gravel base", displayVolume(footprint * 4 / 12 * (1 + waste)), "", "crushed gravel base", "4 in base plus allowance"));
            foundationRows.push(row("Vapor barrier", displayArea(footprint * (1 + waste)), "", "concrete vapor barrier", "Footprint plus laps"));
        } else if (element("foundation-type").value === "pier") {
            var piers = round((perimeter / 8 + (length / 8 - 1) * (width / 8 - 1)) * (1 + waste));
            foundationRows.push(row("Conceptual pier locations", piers, "piers", "concrete deck footing form", "Approximate 8 ft grid"));
            foundationRows.push(row("Ground-contact beams", displayLength((length * 2 + width * 2) * (1 + waste)), "", "pressure treated beam", "Perimeter beam allowance"));
        }
        if (foundationRows.length) phases.push({ name: "Foundation", rows: foundationRows });
        var studCount = round(((perimeter * 12 / 16) + 4 + numeric("window-count", 0) * 3 + numeric("door-count", 0) * 3) * stories * (1 + waste));
        var framingRows = [
            row(studLabel, studCount, "pieces", framing === "steel" ? "light gauge steel wall studs" : framing + " framing studs", "16 in on-center plus openings and allowance"),
            row("Top and bottom plates", round(perimeter * 3 * stories / 16 * (1 + waste)), "16-ft pieces", framing === "steel" ? "steel wall track" : framing + " framing lumber 16 ft", "Three plate runs per story"),
            row("Wall sheathing", round(grossWallArea / 32 * (1 + waste)), "4×8 sheets", "7/16 OSB sheathing 4x8", "Gross wall area ÷ 32"),
            row("House wrap", displayArea(grossWallArea * (1 + waste)), "", "house wrap", "Exterior wall area plus allowance")
        ];
        if (stories > 1) framingRows.push(row("Upper-floor subfloor", round(footprint * (stories - 1) / 32 * (1 + waste)), "4×8 sheets", "tongue groove subfloor 4x8", "Upper floor area ÷ 32"));
        phases.push({ name: "Wall and floor framing", rows: framingRows });
        phases.push({ name: "Roof", rows: [
            row("Roof surface", displayArea(roofArea), "", roofType === "flat" ? "low slope roofing membrane" : "roof shingles", "Footprint × pitch/type multiplier"),
            row("Roof sheathing", round(roofArea / 32 * (1 + waste)), "4×8 sheets", "roof OSB sheathing 4x8", "Roof area ÷ 32 plus allowance"),
            roofType === "flat" ? row("Roof membrane", displayArea(roofArea * (1 + waste)), "", "low slope roofing membrane", "Roof area plus allowance") : row("Shingle bundles", round(roofArea / 33.3 * (1 + waste)), "bundles", "architectural roof shingles", "Approx. 33.3 ft² per bundle"),
            row("Drip edge", displayLength(perimeter * (1 + waste)), "", "roof drip edge", "Building perimeter plus allowance")
        ] });
        phases.push({ name: "Envelope", rows: [
            row(finish, displayArea(netWallArea * (1 + waste)), "", finish.toLowerCase(), "Net exterior wall area plus allowance"),
            row("Wall insulation", displayArea(netWallArea * 1.05), "", framing === "2x6" ? "R-21 wall insulation" : "wall insulation", "Net exterior wall area plus 5%"),
            row("Windows", Math.max(0, numeric("window-count", 0)), "units", "residential windows", "User-entered count"),
            row("Exterior doors", Math.max(0, numeric("door-count", 0)), "units", "exterior entry door", "User-entered count")
        ] });
        var finishArea = grossWallArea + floorArea * 1.5;
        phases.push({ name: "Conceptual interior finishes", rows: [
            row("Drywall", round(finishArea / 32 * (1 + waste)), "4×8 sheets", "1/2 drywall 4x8", "Exterior faces plus assumed partitions/ceilings"),
            row("Paint", round(finishArea * 2 / 350), "gallons", "interior wall paint gallon", "Two coats at 350 ft²/gal"),
            row("Floor finish", displayArea(floorArea * (1 + waste)), "", "flooring", "Gross floor area plus allowance")
        ] });
        return { length: length, width: width, wallHeight: wallHeight, stories: stories, footprint: footprint, floorArea: floorArea, wallArea: grossWallArea, roofArea: roofArea, roofType: roofType, pitch: pitch, phases: phases };
    }

    function addBox(scene, x, y, z, length, width, height, colors) {
        var start = scene.vertices.length;
        [[x,y,z],[x+length,y,z],[x+length,y+width,z],[x,y+width,z],[x,y,z+height],[x+length,y,z+height],[x+length,y+width,z+height],[x,y+width,z+height]].forEach(function (p) { scene.vertices.push({ x:p[0], y:p[1], z:p[2] }); });
        [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach(function (indices, index) { scene.faces.push({ indices: indices.map(function (i) { return start+i; }), color: colors[index % colors.length] }); });
    }

    function buildScene(model) {
        var scene = { vertices: [], faces: [], lines: [] };
        var totalHeight = model.wallHeight * model.stories;
        addBox(scene, 0, 0, -0.45, model.length, model.width, 0.45, ["rgba(126,135,128,.9)"]);
        addBox(scene, 0, 0, 0, model.length, model.width, totalHeight, ["rgba(70,139,96,.86)","rgba(55,115,79,.9)","rgba(65,128,88,.9)"]);
        for (var story = 1; story < model.stories; story += 1) {
            var z = story * model.wallHeight;
            var base = scene.vertices.length;
            scene.vertices.push({x:0,y:0,z:z},{x:model.length,y:0,z:z},{x:model.length,y:model.width,z:z},{x:0,y:model.width,z:z});
            scene.lines.push({ indices:[base,base+1,base+2,base+3,base], color:"rgba(235,242,237,.55)", width:1.2 });
        }
        if (model.roofType === "flat") {
            addBox(scene, -0.4, -0.4, totalHeight, model.length+0.8, model.width+0.8, 0.5, ["rgba(62,70,65,.96)"]);
        } else if (model.roofType === "gable") {
            var rise = model.width / 2 * model.pitch / 12;
            var s = scene.vertices.length;
            [[0,0,totalHeight],[model.length,0,totalHeight],[model.length,model.width,totalHeight],[0,model.width,totalHeight],[0,model.width/2,totalHeight+rise],[model.length,model.width/2,totalHeight+rise]].forEach(function(p){scene.vertices.push({x:p[0],y:p[1],z:p[2]});});
            scene.faces.push({indices:[s,s+1,s+5,s+4],color:"rgba(112,87,66,.96)"},{indices:[s+4,s+5,s+2,s+3],color:"rgba(92,70,55,.96)"},{indices:[s,s+4,s+3],color:"rgba(52,105,73,.92)"},{indices:[s+1,s+2,s+5],color:"rgba(48,94,67,.92)"});
        } else {
            var hipRise = Math.min(model.length, model.width) / 2 * model.pitch / 12;
            var h = scene.vertices.length;
            [[0,0,totalHeight],[model.length,0,totalHeight],[model.length,model.width,totalHeight],[0,model.width,totalHeight],[model.length*.35,model.width/2,totalHeight+hipRise],[model.length*.65,model.width/2,totalHeight+hipRise]].forEach(function(p){scene.vertices.push({x:p[0],y:p[1],z:p[2]});});
            scene.faces.push({indices:[h,h+1,h+5,h+4],color:"rgba(112,87,66,.96)"},{indices:[h+3,h+4,h+5,h+2],color:"rgba(92,70,55,.96)"},{indices:[h,h+4,h+3],color:"rgba(102,78,60,.96)"},{indices:[h+1,h+2,h+5],color:"rgba(82,62,50,.96)"});
        }
        return scene;
    }

    function shopLinks(query) {
        var encoded = encodeURIComponent(query);
        return '<div class="shop-links"><a target="_blank" rel="nofollow noopener" href="https://www.homedepot.com/s/' + encoded + '">Home Depot ↗</a><a target="_blank" rel="nofollow noopener" href="https://www.lowes.com/search?searchTerm=' + encoded + '">Lowe\'s ↗</a></div>';
    }

    function renderBom(phases) {
        output.innerHTML = phases.map(function (phase) {
            return '<details class="bom-phase" open><summary>' + phase.name + '</summary><table class="bom-table"><thead><tr><th>Material</th><th>Quantity</th><th>Basis</th><th>Where to buy</th></tr></thead><tbody>' + phase.rows.map(function (item) {
                return '<tr><td>' + item.name + '</td><td class="bom-quantity">' + item.quantity + (item.unit ? ' ' + item.unit : '') + '</td><td>' + item.method + '</td><td>' + shopLinks(item.query) + '</td></tr>';
            }).join("") + '</tbody></table></details>';
        }).join("");
    }

    function updateUrl() {
        if (!history.replaceState) return;
        var params = new URLSearchParams();
        Array.prototype.forEach.call(form.elements, function (control) { if (control.name) params.set(control.name, control.value); });
        history.replaceState({}, "", location.pathname + "?" + params.toString());
    }

    function render() {
        var model = calculate();
        latestPhases = model.phases;
        viewer.setScene(buildScene(model));
        var typeLabel = element("building-type").selectedOptions[0].textContent.toLowerCase();
        modelLabel.textContent = model.stories + "-story " + typeLabel + " · " + model.roofType + " roof";
        summary.textContent = displayLength(model.length) + " × " + displayLength(model.width) + " · " + model.stories + " stor" + (model.stories === 1 ? "y" : "ies");
        stats.innerHTML = '<div class="stat-card"><strong>' + displayArea(model.footprint) + '</strong>Footprint</div><div class="stat-card"><strong>' + displayArea(model.floorArea) + '</strong>Floor area</div><div class="stat-card"><strong>' + displayArea(model.wallArea) + '</strong>Gross walls</div><div class="stat-card"><strong>' + displayArea(model.roofArea) + '</strong>Roof surface</div>';
        renderBom(model.phases);
        updateUrl();
    }

    var presets = { shed:{length:12,width:10,stories:1,height:8,windows:1,doors:1,pitch:5}, garage:{length:24,width:24,stories:1,height:9,windows:4,doors:2,pitch:6}, house:{length:48,width:36,stories:2,height:9,windows:14,doors:3,pitch:6}, workshop:{length:40,width:30,stories:1,height:12,windows:6,doors:2,pitch:4} };
    element("building-type").addEventListener("change", function () {
        var preset = presets[this.value];
        var factor = currentUnit === "metric" ? 0.3048 : 1;
        element("building-length").value = format(preset.length * factor, 2);
        element("building-width").value = format(preset.width * factor, 2);
        element("building-stories").value = preset.stories;
        element("wall-height").value = format(preset.height * factor, 2);
        element("window-count").value = preset.windows;
        element("door-count").value = preset.doors;
        element("roof-pitch").value = preset.pitch;
        render();
    });
    unitSystem.addEventListener("change", function () {
        var factor = unitSystem.value === "metric" ? 0.3048 : 1 / 0.3048;
        [element("building-length"), element("building-width"), element("wall-height")].forEach(function (input) { input.value = format(Number(input.value) * factor, 3); });
        currentUnit = unitSystem.value;
        document.querySelectorAll("[data-structure-unit]").forEach(function (node) { node.textContent = currentUnit === "metric" ? "m" : "ft"; });
        updateUnitConstraints();
        render();
    });
    form.addEventListener("input", function (event) { if (event.target !== unitSystem && event.target.id !== "building-type") render(); });
    document.getElementById("structure-reset-view").addEventListener("click", function () { viewer.reset(); });
    document.getElementById("structure-print").addEventListener("click", function () { window.print(); });
    document.getElementById("structure-export").addEventListener("click", exportStructureCsv);
    document.getElementById("structure-share").addEventListener("click", function () { shareCurrent(this); });
    document.getElementById("structure-copy").addEventListener("click", function () {
        var lines = [document.title, summary.textContent];
        latestPhases.forEach(function (phase) { lines.push("", phase.name); phase.rows.forEach(function (item) { lines.push("- " + item.name + ": " + item.quantity + (item.unit ? " " + item.unit : "")); }); });
        navigator.clipboard.writeText(lines.join("\n")).then(function () { this.textContent = "Copied"; }.bind(this)).catch(function () { this.textContent = "Copy unavailable"; }.bind(this));
    });
    var params = new URLSearchParams(location.search);
    params.forEach(function (value, name) { if (form.elements.namedItem(name)) form.elements.namedItem(name).value = value; });
    currentUnit = unitSystem.value;
    document.querySelectorAll("[data-structure-unit]").forEach(function (node) { node.textContent = currentUnit === "metric" ? "m" : "ft"; });
    updateUnitConstraints();
    render();
}());
