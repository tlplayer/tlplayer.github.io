(function () {
    "use strict";

    function MeshViewer(canvas, options) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.scene = { vertices: [], faces: [], lines: [] };
        this.yaw = options && options.yaw != null ? options.yaw : -0.65;
        this.pitch = options && options.pitch != null ? options.pitch : 0.62;
        this.zoom = 1;
        this.drag = null;
        this.pointers = {};
        this.pinch = null;
        this.bind();
        this.resize();
    }

    MeshViewer.prototype.bind = function () {
        var self = this;
        this.canvas.addEventListener("pointerdown", function (event) {
            self.pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
            self.drag = { x: event.clientX, y: event.clientY, yaw: self.yaw, pitch: self.pitch };
            self.canvas.setPointerCapture(event.pointerId);
            var points = Object.keys(self.pointers).map(function (key) { return self.pointers[key]; });
            if (points.length === 2) {
                self.pinch = { distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), zoom: self.zoom };
            }
        });
        this.canvas.addEventListener("pointermove", function (event) {
            if (!self.pointers[event.pointerId]) return;
            self.pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
            var points = Object.keys(self.pointers).map(function (key) { return self.pointers[key]; });
            if (points.length === 2 && self.pinch) {
                var distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
                self.zoom = Math.max(0.55, Math.min(2.5, self.pinch.zoom * distance / Math.max(1, self.pinch.distance)));
                self.draw();
                return;
            }
            if (!self.drag) return;
            self.yaw = self.drag.yaw + (event.clientX - self.drag.x) * 0.009;
            self.pitch = Math.max(0.12, Math.min(1.35, self.drag.pitch + (event.clientY - self.drag.y) * 0.007));
            self.draw();
        });
        function endPointer(event) {
            delete self.pointers[event.pointerId];
            self.pinch = null;
            var keys = Object.keys(self.pointers);
            if (keys.length === 1) {
                var point = self.pointers[keys[0]];
                self.drag = { x: point.x, y: point.y, yaw: self.yaw, pitch: self.pitch };
            } else self.drag = null;
        }
        this.canvas.addEventListener("pointerup", endPointer);
        this.canvas.addEventListener("pointercancel", endPointer);
        this.canvas.addEventListener("wheel", function (event) {
            event.preventDefault();
            self.zoom = Math.max(0.55, Math.min(2.5, self.zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
            self.draw();
        }, { passive: false });
        window.addEventListener("resize", function () { self.resize(); });
    };

    MeshViewer.prototype.resize = function () {
        var rect = this.canvas.getBoundingClientRect();
        var width = Math.max(300, rect.width || 700);
        var height = Math.max(280, rect.height || 440);
        var ratio = Math.min(2, window.devicePixelRatio || 1);
        this.canvas.width = Math.round(width * ratio);
        this.canvas.height = Math.round(height * ratio);
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.width = width;
        this.height = height;
        this.draw();
    };

    MeshViewer.prototype.setScene = function (scene) {
        this.scene = scene || { vertices: [], faces: [], lines: [] };
        this.draw();
    };

    MeshViewer.prototype.reset = function () {
        this.yaw = -0.65;
        this.pitch = 0.62;
        this.zoom = 1;
        this.draw();
    };

    MeshViewer.prototype.project = function (vertex, bounds) {
        var x = vertex.x - bounds.cx;
        var y = vertex.y - bounds.cy;
        var z = vertex.z - bounds.cz;
        var cosYaw = Math.cos(this.yaw);
        var sinYaw = Math.sin(this.yaw);
        var rx = x * cosYaw - y * sinYaw;
        var ry = x * sinYaw + y * cosYaw;
        var sy = ry * Math.cos(this.pitch) - z * Math.sin(this.pitch);
        var depth = ry * Math.sin(this.pitch) + z * Math.cos(this.pitch);
        var scale = Math.min(this.width, this.height) * 0.68 / Math.max(1, bounds.span) * this.zoom;
        return { x: this.width / 2 + rx * scale, y: this.height / 2 + sy * scale, depth: depth };
    };

    MeshViewer.prototype.draw = function () {
        if (!this.ctx || !this.width) return;
        var ctx = this.ctx;
        var style = getComputedStyle(document.documentElement);
        var background = style.getPropertyValue("--paper").trim() || "#101612";
        var lineColor = style.getPropertyValue("--line").trim() || "#354239";
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, this.width, this.height);
        var vertices = this.scene.vertices || [];
        if (!vertices.length) return;
        var xs = vertices.map(function (v) { return v.x; });
        var ys = vertices.map(function (v) { return v.y; });
        var zs = vertices.map(function (v) { return v.z; });
        var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
        var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
        var minZ = Math.min.apply(null, zs), maxZ = Math.max.apply(null, zs);
        var bounds = {
            cx: (minX + maxX) / 2,
            cy: (minY + maxY) / 2,
            cz: (minZ + maxZ) / 2,
            span: Math.max(maxX - minX, maxY - minY, (maxZ - minZ) * 1.3)
        };
        var projected = vertices.map(function (vertex) { return this.project(vertex, bounds); }, this);
        var faces = (this.scene.faces || []).map(function (face) {
            return {
                indices: face.indices,
                color: face.color,
                stroke: face.stroke,
                depth: face.indices.reduce(function (sum, index) { return sum + projected[index].depth; }, 0) / face.indices.length
            };
        }).sort(function (a, b) { return a.depth - b.depth; });
        faces.forEach(function (face) {
            ctx.beginPath();
            face.indices.forEach(function (index, position) {
                var point = projected[index];
                if (position) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y);
            });
            ctx.closePath();
            ctx.fillStyle = face.color || "rgba(58, 139, 88, .62)";
            ctx.fill();
            ctx.strokeStyle = face.stroke || lineColor;
            ctx.lineWidth = 0.7;
            ctx.stroke();
        });
        (this.scene.lines || []).forEach(function (line) {
            ctx.beginPath();
            line.indices.forEach(function (index, position) {
                var point = projected[index];
                if (position) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y);
            });
            ctx.strokeStyle = line.color || lineColor;
            ctx.lineWidth = line.width || 1.5;
            ctx.stroke();
        });
    };

    window.BuildEstimateMeshViewer = MeshViewer;
}());
