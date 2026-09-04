(function () {
    "use strict";

    var form = document.getElementById("terrain-form");
    var canvas = document.getElementById("terrain-canvas");
    if (!form || !canvas || !window.BuildEstimateMeshViewer) return;
    var viewer = new window.BuildEstimateMeshViewer(canvas);
    var units = document.getElementById("terrain-units");
    var widthInput = document.getElementById("site-width");
    var depthInput = document.getElementById("site-depth");
    var targetInput = document.getElementById("target-elevation");
    var exaggerationInput = document.getElementById("vertical-scale");
    var imageReliefInput = document.getElementById("image-relief");
    var elevationInputs = Array.prototype.slice.call(document.querySelectorAll("[data-elevation]"));
    var stats = document.getElementById("terrain-stats");
    var analysis = document.getElementById("terrain-analysis");
    var status = document.getElementById("terrain-file-status");
    var sourceLabel = document.getElementById("terrain-source-label");
    var currentUnit = "imperial";
    var importedGrid = null;
    var latestMeasurements = null;

    function numeric(input, fallback) {
        var value = Number(input.value);
        return Number.isFinite(value) ? value : fallback;
    }

    function format(value, digits) {
        return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits == null ? 2 : digits });
    }

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

    function exportTerrainCsv() {
        var grid = activeGrid();
        var rows = [["Record Type", "Name", "X", "Y", "Elevation / Value", "Unit", "Notes"]];
        var lengthUnit = currentUnit === "metric" ? "m" : "ft";
        var volumeUnit = currentUnit === "metric" ? "m³" : "yd³";
        var width = Math.max(1, numeric(widthInput, 1));
        var depth = Math.max(1, numeric(depthInput, 1));
        rows.push(["Project", "Exported", "", "", new Date().toISOString(), "", ""]);
        rows.push(["Project", "Site width", "", "", width, lengthUnit, ""]);
        rows.push(["Project", "Site depth", "", "", depth, lengthUnit, ""]);
        if (latestMeasurements) {
            rows.push(["Analysis", "Total relief", "", "", latestMeasurements.relief, lengthUnit, ""]);
            rows.push(["Analysis", "Average grid grade", "", "", latestMeasurements.averageSlope, "%", ""]);
            rows.push(["Analysis", "Steepest grid grade", "", "", latestMeasurements.maxSlope, "%", ""]);
            rows.push(["Analysis", "Curvature index", "", "", latestMeasurements.curvature, "relative", "Mean local second-difference"]);
            rows.push(["Analysis", "Conceptual cut", "", "", currentUnit === "metric" ? latestMeasurements.cut : latestMeasurements.cut / 27, volumeUnit, "At target level"]);
            rows.push(["Analysis", "Conceptual fill", "", "", currentUnit === "metric" ? latestMeasurements.fill : latestMeasurements.fill / 27, volumeUnit, "At target level"]);
        }
        grid.forEach(function (line, row) {
            line.forEach(function (elevation, column) {
                rows.push(["Surface point", "Grid " + row + ":" + column, column / (line.length - 1) * width, row / (grid.length - 1) * depth, elevation, lengthUnit, sourceLabel.textContent]);
            });
        });
        downloadCsv("terrain-surface-xyz.csv", rows);
    }

    function shareElevations(grid) {
        var lastRow = grid.length - 1;
        var lastColumn = grid[0].length - 1;
        return [grid[0][0], grid[0][Math.round(lastColumn / 2)], grid[0][lastColumn], grid[Math.round(lastRow / 2)][0], grid[Math.round(lastRow / 2)][Math.round(lastColumn / 2)], grid[Math.round(lastRow / 2)][lastColumn], grid[lastRow][0], grid[lastRow][Math.round(lastColumn / 2)], grid[lastRow][lastColumn]];
    }

    function updateUrl(grid) {
        if (!history.replaceState) return;
        var params = new URLSearchParams();
        params.set("units", currentUnit);
        params.set("width", numeric(widthInput, 1));
        params.set("depth", numeric(depthInput, 1));
        params.set("target", numeric(targetInput, 0));
        params.set("vertical", numeric(exaggerationInput, 3));
        params.set("e", shareElevations(grid).map(function (value) { return Number(value.toFixed(4)); }).join(","));
        history.replaceState({}, "", location.pathname + "?" + params.toString());
    }

    function shareCurrent(button) {
        var approximate = Boolean(importedGrid);
        var data = { title: "Terrain surface | BuildEstimate", text: approximate ? "Nine-point approximation of an imported terrain surface" : "Shared terrain elevation surface", url: location.href };
        if (navigator.share) { navigator.share(data).catch(function () {}); return; }
        navigator.clipboard.writeText(data.url).then(function () {
            var previous = button.textContent; button.textContent = approximate ? "Approximate link copied" : "Link copied";
            window.setTimeout(function () { button.textContent = previous; }, 1800);
        }).catch(function () { button.textContent = "Copy unavailable"; });
    }

    function manualGrid(size) {
        var controls = elevationInputs.map(function (input) { return numeric(input, 0); });
        var output = [];
        for (var row = 0; row < size; row += 1) {
            var v = row / (size - 1) * 2;
            var rowIndex = Math.min(1, Math.floor(v));
            var fv = v - rowIndex;
            if (v === 2) { rowIndex = 1; fv = 1; }
            var values = [];
            for (var column = 0; column < size; column += 1) {
                var u = column / (size - 1) * 2;
                var columnIndex = Math.min(1, Math.floor(u));
                var fu = u - columnIndex;
                if (u === 2) { columnIndex = 1; fu = 1; }
                var a = controls[rowIndex * 3 + columnIndex];
                var b = controls[rowIndex * 3 + columnIndex + 1];
                var c = controls[(rowIndex + 1) * 3 + columnIndex];
                var d = controls[(rowIndex + 1) * 3 + columnIndex + 1];
                values.push(a * (1 - fu) * (1 - fv) + b * fu * (1 - fv) + c * (1 - fu) * fv + d * fu * fv);
            }
            output.push(values);
        }
        return output;
    }

    function activeGrid() {
        return importedGrid || manualGrid(17);
    }

    function measureGrid(grid) {
        var rows = grid.length;
        var columns = grid[0].length;
        var siteWidth = Math.max(1, numeric(widthInput, 1));
        var siteDepth = Math.max(1, numeric(depthInput, 1));
        var dx = siteWidth / (columns - 1);
        var dy = siteDepth / (rows - 1);
        var flat = [].concat.apply([], grid);
        var min = Math.min.apply(null, flat);
        var max = Math.max.apply(null, flat);
        var slopeTotal = 0, slopeCount = 0, maxSlope = 0, curvatureTotal = 0, curvatureCount = 0;
        for (var row = 0; row < rows; row += 1) {
            for (var column = 0; column < columns; column += 1) {
                if (column + 1 < columns) {
                    var sx = Math.abs(grid[row][column + 1] - grid[row][column]) / dx * 100;
                    slopeTotal += sx; slopeCount += 1; maxSlope = Math.max(maxSlope, sx);
                }
                if (row + 1 < rows) {
                    var sy = Math.abs(grid[row + 1][column] - grid[row][column]) / dy * 100;
                    slopeTotal += sy; slopeCount += 1; maxSlope = Math.max(maxSlope, sy);
                }
                if (row > 0 && row < rows - 1 && column > 0 && column < columns - 1) {
                    var curveX = Math.abs(grid[row][column - 1] - 2 * grid[row][column] + grid[row][column + 1]) / (dx * dx);
                    var curveY = Math.abs(grid[row - 1][column] - 2 * grid[row][column] + grid[row + 1][column]) / (dy * dy);
                    curvatureTotal += (curveX + curveY) / 2;
                    curvatureCount += 1;
                }
            }
        }
        var target = numeric(targetInput, (min + max) / 2);
        var cut = 0, fill = 0;
        for (var r = 0; r < rows - 1; r += 1) {
            for (var col = 0; col < columns - 1; col += 1) {
                var cellElevation = (grid[r][col] + grid[r][col + 1] + grid[r + 1][col] + grid[r + 1][col + 1]) / 4;
                var volume = Math.abs(cellElevation - target) * dx * dy;
                if (cellElevation > target) cut += volume; else fill += volume;
            }
        }
        return { min: min, max: max, relief: max - min, averageSlope: slopeTotal / Math.max(1, slopeCount), maxSlope: maxSlope, curvature: curvatureTotal / Math.max(1, curvatureCount), cut: cut, fill: fill, target: target };
    }

    function buildScene(grid) {
        var rows = grid.length;
        var columns = grid[0].length;
        var siteWidth = Math.max(1, numeric(widthInput, 1));
        var siteDepth = Math.max(1, numeric(depthInput, 1));
        var exaggeration = Math.max(0.2, numeric(exaggerationInput, 3));
        var flat = [].concat.apply([], grid);
        var min = Math.min.apply(null, flat);
        var max = Math.max.apply(null, flat);
        var range = Math.max(0.0001, max - min);
        var vertices = [];
        for (var row = 0; row < rows; row += 1) {
            for (var column = 0; column < columns; column += 1) {
                vertices.push({ x: column / (columns - 1) * siteWidth, y: row / (rows - 1) * siteDepth, z: (grid[row][column] - min) * exaggeration });
            }
        }
        var faces = [];
        for (var r = 0; r < rows - 1; r += 1) {
            for (var c = 0; c < columns - 1; c += 1) {
                var index = r * columns + c;
                var height = (grid[r][c] + grid[r][c + 1] + grid[r + 1][c] + grid[r + 1][c + 1]) / 4;
                var ratio = (height - min) / range;
                var light = 25 + ratio * 28;
                faces.push({ indices: [index, index + 1, index + columns + 1, index + columns], color: "hsla(145, 48%, " + light + "%, .88)" });
            }
        }
        return { vertices: vertices, faces: faces, lines: [] };
    }

    function render() {
        var grid = activeGrid();
        var values = measureGrid(grid);
        latestMeasurements = values;
        var lengthUnit = currentUnit === "metric" ? "m" : "ft";
        var volumeUnit = currentUnit === "metric" ? "m³" : "yd³";
        var cut = currentUnit === "metric" ? values.cut : values.cut / 27;
        var fill = currentUnit === "metric" ? values.fill : values.fill / 27;
        viewer.setScene(buildScene(grid));
        stats.innerHTML =
            '<div class="stat-card"><strong>' + format(values.relief) + ' ' + lengthUnit + '</strong>Total relief</div>' +
            '<div class="stat-card"><strong>' + format(values.averageSlope, 1) + '%</strong>Average grid grade</div>' +
            '<div class="stat-card"><strong>' + format(values.maxSlope, 1) + '%</strong>Steepest grid grade</div>' +
            '<div class="stat-card"><strong>' + format(values.curvature, 4) + '</strong>Curvature index</div>';
        analysis.innerHTML =
            '<details class="bom-phase" open><summary>Level-grade earthwork at ' + format(values.target) + ' ' + lengthUnit + '</summary><table class="bom-table"><thead><tr><th>Quantity</th><th>Estimate</th><th>Meaning</th></tr></thead><tbody>' +
            '<tr><td>Cut</td><td class="bom-quantity">' + format(cut) + ' ' + volumeUnit + '</td><td>Ground conceptually above target</td></tr>' +
            '<tr><td>Fill</td><td class="bom-quantity">' + format(fill) + ' ' + volumeUnit + '</td><td>Ground conceptually below target</td></tr>' +
            '<tr><td>Net</td><td class="bom-quantity">' + format(cut - fill) + ' ' + volumeUnit + '</td><td>Positive means net export before compaction</td></tr>' +
            '</tbody></table></details>' +
            '<details class="bom-phase" open><summary>Surface range and curvature</summary><table class="bom-table"><tbody>' +
            '<tr><td>Low elevation</td><td class="bom-quantity">' + format(values.min) + ' ' + lengthUnit + '</td><td>Lowest sampled/interpolated point</td></tr>' +
            '<tr><td>High elevation</td><td class="bom-quantity">' + format(values.max) + ' ' + lengthUnit + '</td><td>Highest sampled/interpolated point</td></tr>' +
            '<tr><td>Curvature index</td><td class="bom-quantity">' + format(values.curvature, 4) + '</td><td>Mean local second-difference; useful for relative comparison only</td></tr>' +
            '</tbody></table></details>';
        updateUrl(grid);
    }

    function parsePoints(text) {
        var points = text.split(/\r?\n/).map(function (line) {
            var cells = line.trim().split(/[\s,;]+/).map(Number);
            return cells.length >= 3 && cells.slice(0, 3).every(Number.isFinite) ? { x: cells[0], y: cells[1], z: cells[2] } : null;
        }).filter(Boolean);
        if (points.length < 3) throw new Error("At least three valid XYZ rows are required.");
        var minX = Math.min.apply(null, points.map(function (p) { return p.x; }));
        var maxX = Math.max.apply(null, points.map(function (p) { return p.x; }));
        var minY = Math.min.apply(null, points.map(function (p) { return p.y; }));
        var maxY = Math.max.apply(null, points.map(function (p) { return p.y; }));
        if (maxX === minX || maxY === minY) throw new Error("XYZ data must cover an area in both x and y.");
        widthInput.value = format(maxX - minX, 3);
        depthInput.value = format(maxY - minY, 3);
        var size = 25;
        var grid = [];
        for (var row = 0; row < size; row += 1) {
            var line = [];
            var y = minY + row / (size - 1) * (maxY - minY);
            for (var column = 0; column < size; column += 1) {
                var x = minX + column / (size - 1) * (maxX - minX);
                var weighted = 0, weights = 0, exact = null;
                points.forEach(function (point) {
                    var distanceSquared = Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2);
                    if (distanceSquared < 1e-12) exact = point.z;
                    var weight = 1 / Math.max(distanceSquared, 1e-9);
                    weighted += point.z * weight; weights += weight;
                });
                line.push(exact == null ? weighted / weights : exact);
            }
            grid.push(line);
        }
        targetInput.value = format(points.reduce(function (sum, p) { return sum + p.z; }, 0) / points.length, 3);
        return { grid: grid, count: points.length };
    }

    function parseImage(file) {
        return new Promise(function (resolve, reject) {
            var image = new Image();
            var url = URL.createObjectURL(file);
            image.onload = function () {
                var size = 25;
                var sample = document.createElement("canvas");
                sample.width = size; sample.height = size;
                var context = sample.getContext("2d", { willReadFrequently: true });
                context.drawImage(image, 0, 0, size, size);
                var data = context.getImageData(0, 0, size, size).data;
                var relief = Math.max(0.01, numeric(imageReliefInput, 6));
                var base = numeric(targetInput, 0) - relief / 2;
                var grid = [];
                for (var row = 0; row < size; row += 1) {
                    var line = [];
                    for (var column = 0; column < size; column += 1) {
                        var index = (row * size + column) * 4;
                        var luminance = (data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722) / 255;
                        line.push(base + luminance * relief);
                    }
                    grid.push(line);
                }
                URL.revokeObjectURL(url);
                resolve(grid);
            };
            image.onerror = function () { URL.revokeObjectURL(url); reject(new Error("The image could not be read.")); };
            image.src = url;
        });
    }

    document.getElementById("terrain-file").addEventListener("change", function (event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;
        status.textContent = "Reading " + file.name + " locally…";
        if (file.type.indexOf("image/") === 0) {
            parseImage(file).then(function (grid) {
                importedGrid = grid;
                sourceLabel.textContent = "Relative brightness height map · " + file.name;
                status.textContent = "Loaded a relative height map. Bright pixels are higher; scale is user supplied.";
                render();
            }).catch(function (error) { status.textContent = error.message; });
            return;
        }
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var result = parsePoints(String(reader.result || ""));
                importedGrid = result.grid;
                sourceLabel.textContent = "Interpolated XYZ surface · " + file.name;
                status.textContent = "Loaded " + result.count + " XYZ points locally.";
                render();
            } catch (error) { status.textContent = error.message; }
        };
        reader.onerror = function () { status.textContent = "The file could not be read."; };
        reader.readAsText(file);
    });

    form.addEventListener("input", function (event) {
        if (event.target.hasAttribute("data-elevation")) {
            importedGrid = null;
            sourceLabel.textContent = "Nine-point elevation surface";
        }
        render();
    });
    units.addEventListener("change", function () {
        var factor = units.value === "metric" ? 0.3048 : 1 / 0.3048;
        [widthInput, depthInput, targetInput, imageReliefInput].concat(elevationInputs).forEach(function (input) { input.value = format(numeric(input, 0) * factor, 3); });
        if (importedGrid) importedGrid = importedGrid.map(function (row) { return row.map(function (value) { return value * factor; }); });
        currentUnit = units.value;
        document.querySelectorAll("[data-length-unit], [data-elevation-unit]").forEach(function (node) { node.textContent = currentUnit === "metric" ? "m" : "ft"; });
        render();
    });
    document.querySelectorAll("[data-terrain-preset]").forEach(function (button) {
        button.addEventListener("click", function () {
            var values = button.dataset.terrainPreset === "flat" ? [100,100,100,100,100,100,100,100,100] : [102,101.6,101,101.5,100.8,100.2,101,100.4,99.6];
            elevationInputs.forEach(function (input, index) { input.value = values[index]; });
            targetInput.value = button.dataset.terrainPreset === "flat" ? 100 : 100.8;
            importedGrid = null;
            sourceLabel.textContent = "Nine-point elevation surface";
            status.textContent = "Preset loaded. Files stay on this device.";
            render();
        });
    });
    document.getElementById("terrain-reset-view").addEventListener("click", function () { viewer.reset(); });
    document.getElementById("terrain-export").addEventListener("click", exportTerrainCsv);
    document.getElementById("terrain-share").addEventListener("click", function () { shareCurrent(this); });
    document.getElementById("terrain-print").addEventListener("click", function () { window.print(); });
    var params = new URLSearchParams(location.search);
    var requestedUnit = params.get("units") === "metric" ? "metric" : "imperial";
    currentUnit = requestedUnit; units.value = requestedUnit;
    if (params.has("width")) widthInput.value = params.get("width");
    if (params.has("depth")) depthInput.value = params.get("depth");
    if (params.has("target")) targetInput.value = params.get("target");
    if (params.has("vertical")) exaggerationInput.value = params.get("vertical");
    if (params.has("e")) {
        var shared = params.get("e").split(",").map(Number);
        if (shared.length === 9 && shared.every(Number.isFinite)) elevationInputs.forEach(function (input, index) { input.value = shared[index]; });
        sourceLabel.textContent = "Shared nine-point elevation surface";
    }
    document.querySelectorAll("[data-length-unit], [data-elevation-unit]").forEach(function (node) { node.textContent = currentUnit === "metric" ? "m" : "ft"; });
    render();
}());
