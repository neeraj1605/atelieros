/* ============================================================
   Planex Spatial Contract Layer — Browser Build
   v1.0 — Metric Cartesian (millimetre) spatial layout contract.
   
   Single self-contained file for browser usage. Provides:
   - Contract types & factory (newContract, roomId)
   - Geometry kernel (area, perimeter, centroid, polygon ops)
   - Validator (validateContract, assertValidContract)
   - SpatialKernel (abstracts WASM vs TypeScript geometry)
   - Planex bridge (layoutToContract — meters → contract mm)
   
   Usage:
     <script src="spatial/js/spatial-contract.js"></script>
     <script>
       const { contract, validation } = window.PlanexSpatial.layoutToContract({...});
       if (!validation.valid) console.error(validation.errors);
     </script>
   ============================================================ */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PlanexSpatial = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ============================================================
     Section 1 — Contract Types & Factory
     ============================================================ */
  var CONTRACT_VERSION = '1.0';
  var COORDINATE_SYSTEM = 'EPSG:Metric_Cartesian_MM';

  var SLUG = /[^a-z0-9]+/g;

  function newContract(opts) {
    var c = {
      contract_version: CONTRACT_VERSION,
      coordinate_system: COORDINATE_SYSTEM,
      units: { length: 'mm', angle: 'deg' },
      source: opts.source,
      provenance: Object.assign({ created_at: new Date().toISOString() }, opts.provenance),
      rooms: opts.rooms || []
    };
    if (opts.scene) c.scene = opts.scene;
    if (opts.walls) c.walls = opts.walls;
    return c;
  }

  function roomId(name) {
    var base = String(name || 'room').toLowerCase().replace(SLUG, '_').replace(/^_+|_+$/g, '');
    return 'room_' + (base || 'unnamed');
  }

  /* ============================================================
     Section 2 — Geometry Kernel
     ============================================================ */
  var BOUNDARY_TOL_MM = 2;

  function isFinitePoint(p) {
    return Array.isArray(p) && p.length === 2 &&
      typeof p[0] === 'number' && isFinite(p[0]) &&
      typeof p[1] === 'number' && isFinite(p[1]);
  }

  function pointsEqual(a, b, tol) {
    tol = tol || 0;
    return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol;
  }

  function dropClosingPoint(poly) {
    if (poly.length > 1 && pointsEqual(poly[0], poly[poly.length - 1], BOUNDARY_TOL_MM)) {
      return poly.slice(0, -1);
    }
    return poly.slice();
  }

  function hasConsecutiveDuplicates(poly, tol) {
    tol = tol || 0;
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i];
      var b = poly[(i + 1) % poly.length];
      if (pointsEqual(a, b, tol)) return true;
    }
    return false;
  }

  function dedupeConsecutive(poly, tol) {
    tol = tol || 0;
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      if (!out.length || !pointsEqual(out[out.length - 1], poly[i], tol)) out.push(poly[i]);
    }
    while (out.length > 1 && pointsEqual(out[0], out[out.length - 1], tol)) out.pop();
    return out;
  }

  function signedArea(poly) {
    var p = dropClosingPoint(poly);
    var sum = 0;
    for (var i = 0; i < p.length; i++) {
      var a = p[i];
      var b = p[(i + 1) % p.length];
      sum += a[0] * b[1] - b[0] * a[1];
    }
    return sum / 2;
  }

  function area(poly) {
    return Math.abs(signedArea(poly));
  }

  function perimeter(poly) {
    var p = dropClosingPoint(poly);
    var total = 0;
    for (var i = 0; i < p.length; i++) {
      var a = p[i];
      var b = p[(i + 1) % p.length];
      total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return total;
  }

  function centroid(poly) {
    var p = dropClosingPoint(poly);
    var cx = 0, cy = 0, a = 0;
    for (var i = 0; i < p.length; i++) {
      var q = p[i];
      var r = p[(i + 1) % p.length];
      var cross = q[0] * r[1] - r[0] * q[1];
      a += cross;
      cx += (q[0] + r[0]) * cross;
      cy += (q[1] + r[1]) * cross;
    }
    if (Math.abs(a) < 1e-9) {
      return [
        p.reduce(function (s, v) { return s + v[0]; }, 0) / p.length,
        p.reduce(function (s, v) { return s + v[1]; }, 0) / p.length
      ];
    }
    a *= 0.5;
    return [cx / (6 * a), cy / (6 * a)];
  }

  function bbox(poly) {
    var xs = poly.map(function (p) { return p[0]; });
    var ys = poly.map(function (p) { return p[1]; });
    var minX = Math.min.apply(null, xs);
    var minY = Math.min.apply(null, ys);
    var maxX = Math.max.apply(null, xs);
    var maxY = Math.max.apply(null, ys);
    return {
      min: [minX, minY],
      max: [maxX, maxY],
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function edges(poly) {
    var p = dropClosingPoint(poly);
    var out = [];
    for (var i = 0; i < p.length; i++) {
      var a = p[i];
      var b = p[(i + 1) % p.length];
      out.push({
        index: i,
        a: a,
        b: b,
        length: Math.hypot(b[0] - a[0], b[1] - a[1])
      });
    }
    return out;
  }

  function distancePointToSegment(p, a, b) {
    var vx = b[0] - a[0], vy = b[1] - a[1];
    var wx = p[0] - a[0], wy = p[1] - a[1];
    var len2 = vx * vx + vy * vy;
    if (len2 === 0) return Math.hypot(wx, wy);
    var t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
    return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
  }

  function isPointOnBoundary(poly, p, tol) {
    tol = tol || BOUNDARY_TOL_MM;
    return edges(poly).some(function (e) {
      return distancePointToSegment(p, e.a, e.b) <= tol;
    });
  }

  function pointInPolygon(poly, p) {
    var ring = dropClosingPoint(poly);
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1];
      var xj = ring[j][0], yj = ring[j][1];
      var intersect = (yi > p[1]) !== (yj > p[1]) &&
        p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function orientation(a, b, c) {
    var v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(v) < 1e-9) return 0;
    return v > 0 ? 1 : 2;
  }

  function onSegment(a, b, c) {
    return b[0] <= Math.max(a[0], c[0]) + 1e-9 &&
      b[0] >= Math.min(a[0], c[0]) - 1e-9 &&
      b[1] <= Math.max(a[1], c[1]) + 1e-9 &&
      b[1] >= Math.min(a[1], c[1]) - 1e-9;
  }

  function segmentsIntersect(p1, q1, p2, q2) {
    var o1 = orientation(p1, q1, p2);
    var o2 = orientation(p1, q1, q2);
    var o3 = orientation(p2, q2, p1);
    var o4 = orientation(p2, q2, q1);
    if (o1 !== o2 && o3 !== o4) return true;
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
    return false;
  }

  function selfIntersects(poly) {
    var e = edges(poly);
    for (var i = 0; i < e.length; i++) {
      for (var j = i + 1; j < e.length; j++) {
        var adjacent = j === i + 1 || (i === 0 && j === e.length - 1);
        if (adjacent) continue;
        if (segmentsIntersect(e[i].a, e[i].b, e[j].a, e[j].b)) return true;
      }
    }
    return false;
  }

  function isCollinear(a, b, c) {
    return orientation(a, b, c) === 0;
  }

  function removeCollinear(poly) {
    var p = dedupeConsecutive(dropClosingPoint(poly));
    if (p.length <= 3) return p;
    var out = [];
    for (var i = 0; i < p.length; i++) {
      var prev = p[(i - 1 + p.length) % p.length];
      var cur = p[i];
      var next = p[(i + 1) % p.length];
      if (!isCollinear(prev, cur, next)) out.push(cur);
    }
    return out.length >= 3 ? out : p;
  }

  function normalizeRing(poly, clockwise) {
    if (clockwise === undefined) clockwise = false;
    var p = dedupeConsecutive(dropClosingPoint(poly));
    var ccw = signedArea(p) >= 0;
    if (ccw === clockwise) p = p.slice().reverse();
    return p;
  }

  function wallRuns(poly) {
    return edges(poly).map(function (e) { return e.length; });
  }

  function edgeContaining(poly, p, tol) {
    if (tol === undefined) tol = BOUNDARY_TOL_MM;
    var e = edges(poly);
    for (var i = 0; i < e.length; i++) {
      var edge = e[i];
      if (distancePointToSegment(p, edge.a, edge.b) <= tol) {
        var distAlong = Math.hypot(p[0] - edge.a[0], p[1] - edge.a[1]);
        return {
          edgeIndex: edge.index,
          distAlong: distAlong,
          edgeLength: edge.length,
          remaining: edge.length - distAlong
        };
      }
    }
    return null;
  }

  /* ============================================================
     Section 3 — Validator
     ============================================================ */
  var ROOM_ID_REGEX = /^[a-z0-9][a-z0-9_-]*$/;
  var OPENING_TYPES = ['door', 'window', 'opening', 'arch', 'balcony_slider'];

  function isObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  }

  function isInt(v) {
    return typeof v === 'number' && isFinite(v) && Math.round(v) === v;
  }

  function isFiniteNumber(v) {
    return typeof v === 'number' && isFinite(v);
  }

  function pointsWellFormed(poly) {
    return Array.isArray(poly) && poly.every(function (p) {
      return Array.isArray(p) && p.length === 2 &&
        isFiniteNumber(p[0]) && isFiniteNumber(p[1]);
    });
  }

  function validateContract(input) {
    var errors = [];
    var warnings = [];

    function err(code, path, message, value) {
      errors.push({ code: code, path: path, message: message, value: value });
    }

    function warn(code, path, message, value) {
      warnings.push({ code: code, path: path, message: message, value: value });
    }

    if (!isObject(input)) {
      return {
        valid: false,
        errors: [{ code: 'E_NOT_OBJECT', path: '$', message: 'Contract must be an object.' }],
        warnings: []
      };
    }

    var c = input;

    if (c.contract_version !== CONTRACT_VERSION)
      err('E_VERSION', '$.contract_version', 'Expected "1.0".', c.contract_version);
    if (c.coordinate_system !== COORDINATE_SYSTEM)
      err('E_COORDINATE_SYSTEM', '$.coordinate_system', 'Expected "EPSG:Metric_Cartesian_MM".', c.coordinate_system);

    if (!isObject(c.units) || c.units.length !== 'mm' || c.units.angle !== 'deg') {
      err('E_UNITS', '$.units', 'units must be { length: "mm", angle: "deg" }.', c.units);
    }

    if (!isObject(c.source) || typeof c.source.kind !== 'string') {
      err('E_SOURCE', '$.source', 'source.kind is required.');
    }

    if (!isObject(c.provenance) || typeof c.provenance.measured_by !== 'string') {
      err('E_PROVENANCE', '$.provenance', 'provenance.measured_by is required.');
    } else if (c.provenance.confidence === undefined) {
      warn('W_NO_CONFIDENCE', '$.provenance.confidence', 'No measurement confidence supplied.');
    }

    if (!Array.isArray(c.rooms) || c.rooms.length === 0) {
      err('E_NO_ROOMS', '$.rooms', 'At least one room is required.');
      return { valid: errors.length === 0, errors: errors, warnings: warnings };
    }

    var seen = {};
    var totalArea = 0;
    var openingCount = 0;

    for (var ri = 0; ri < c.rooms.length; ri++) {
      var room = c.rooms[ri];
      var rp = '$.rooms[' + ri + ']';

      if (!isObject(room)) {
        err('E_RING_MIN_POINTS', rp, 'Room must be an object.');
        continue;
      }

      if (typeof room.id !== 'string' || !ROOM_ID_REGEX.test(room.id)) {
        err('E_ROOM_ID', rp + '.id', 'Room id must match ^[a-z0-9][a-z0-9_-]*$.', room.id);
      } else if (seen[room.id]) {
        err('E_DUP_ROOM', rp + '.id', 'Duplicate room id "' + room.id + '".', room.id);
      } else {
        seen[room.id] = ri;
      }

      if (!pointsWellFormed(room.boundary_polygon)) {
        err('E_POINT_FORMAT', rp + '.boundary_polygon', 'Polygon must be an array of [x, y] finite numbers.');
        continue;
      }

      var ring = room.boundary_polygon;
      var open = dropClosingPoint(ring);

      if (open.length < 3)
        err('E_RING_MIN_POINTS', rp + '.boundary_polygon', 'Polygon needs at least 3 distinct points.', open.length);
      if (hasConsecutiveDuplicates(ring, 0))
        err('E_RING_DUPLICATE', rp + '.boundary_polygon', 'Polygon has consecutive duplicate points.');

      if (open.length >= 3) {
        var a = area(ring);
        if (a <= 0) err('E_RING_AREA', rp + '.boundary_polygon', 'Polygon area must be greater than zero.', a);
        if (selfIntersects(ring))
          err('E_RING_SELF_INTERSECTS', rp + '.boundary_polygon', 'Polygon is self-intersecting.');
        totalArea += a;
        var normalized = normalizeRing(ring);
        if (perimeter(normalized) - perimeter(ring) > BOUNDARY_TOL_MM) {
          warn('W_RING_COLLINEAR', rp + '.boundary_polygon', 'Polygon has redundant collinear points.');
        }
      }

      if (!isInt(room.ceiling_height_mm) || room.ceiling_height_mm <= 0) {
        err('E_CEILING_HEIGHT', rp + '.ceiling_height_mm', 'ceiling_height_mm must be a positive integer (mm).', room.ceiling_height_mm);
      }

      if (room.floor_elevation_mm !== undefined && !isInt(room.floor_elevation_mm)) {
        err('E_FLOOR_ELEVATION', rp + '.floor_elevation_mm', 'floor_elevation_mm must be an integer (mm).', room.floor_elevation_mm);
      }

      if (room.confidence !== undefined && room.confidence < 0.5) {
        warn('W_LOW_CONFIDENCE', rp + '.confidence', 'Room confidence below 0.5 — flag for review.', room.confidence);
      }

      var openings = Array.isArray(room.openings) ? room.openings : [];
      for (var oi = 0; oi < openings.length; oi++) {
        var o = openings[oi];
        var op = rp + '.openings[' + oi + ']';
        openingCount++;

        if (OPENING_TYPES.indexOf(o.type) === -1)
          err('E_OPENING_TYPE', op + '.type', 'Opening type must be one of ' + OPENING_TYPES.join(', ') + '.', o.type);
        if (!isInt(o.width_mm) || o.width_mm <= 0)
          err('E_OPENING_DIMS', op + '.width_mm', 'width_mm must be a positive integer.', o.width_mm);
        if (!isInt(o.height_mm) || o.height_mm <= 0)
          err('E_OPENING_DIMS', op + '.height_mm', 'height_mm must be a positive integer.', o.height_mm);

        var sill = o.sill_mm !== undefined ? o.sill_mm : (o.sill_height_mm !== undefined ? o.sill_height_mm : 0);
        if (!isInt(sill) || sill < 0)
          err('E_OPENING_SILL', op + '.sill_mm', 'sill_mm must be an integer >= 0.', o.sill_mm);
        if (o.type === 'door' && sill !== 0)
          err('E_DOOR_SILL', op + '.sill_mm', 'Doors must have sill_mm = 0.', sill);
        if (isInt(room.ceiling_height_mm) && sill + o.height_mm > room.ceiling_height_mm)
          err('E_OPENING_DIMS', op + '.height_mm', 'Opening + sill exceeds the ceiling height.', sill + o.height_mm);

        if (!Array.isArray(o.start_mm) || o.start_mm.length !== 2 ||
          !isFiniteNumber(o.start_mm[0]) || !isFiniteNumber(o.start_mm[1])) {
          err('E_POINT_FORMAT', op + '.start_mm', 'start_mm must be [x, y].');
          continue;
        }

        if (open.length >= 3) {
          var hit = edgeContaining(ring, o.start_mm);
          if (!hit) {
            err('E_OPENING_OFF_BOUNDARY', op + '.start_mm', 'Opening start must lie on the room boundary.', o.start_mm);
            continue;
          }
          if (isInt(o.width_mm) && o.width_mm > hit.remaining + BOUNDARY_TOL_MM) {
            err('E_OPENING_WIDTH', op + '.width_mm',
              'Opening width ' + o.width_mm + 'mm exceeds the remaining wall run (' + Math.round(hit.remaining) + 'mm).',
              o.width_mm);
          } else if (isInt(o.width_mm) && hit.remaining - o.width_mm < 150) {
            warn('W_OPENING_NEAR_CORNER', op + '.start_mm', 'Opening ends within 150mm of a corner — verify against the drawings.');
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      stats: { rooms: c.rooms.length, area_mm2: totalArea, openings: openingCount }
    };
  }

  function assertValidContract(input) {
    var res = validateContract(input);
    if (!res.valid) {
      var detail = res.errors.slice(0, 5).map(function (e) {
        return e.path + ': ' + e.message;
      }).join('; ');
      throw new Error('Invalid Metric Spatial Contract (' + res.errors.length + ' error(s)) — ' + detail);
    }
    return input;
  }

  /* ============================================================
     Section 4 — Spatial Kernel
     ============================================================ */
  function createKernel() {
    return new SpatialKernel();
  }

  var SpatialKernel = (function () {
    function SpatialKernel() {
      this.wasm = null;
      this.initialized = false;
    }

    SpatialKernel.prototype.init = function (wasmModule) {
      var self = this;
      if (wasmModule) {
        this.wasm = wasmModule;
        if (typeof this.wasm.init === 'function') {
          return Promise.resolve(this.wasm.init()).then(function () {
            self.initialized = true;
          });
        }
      }
      this.initialized = true;
      return Promise.resolve();
    };

    SpatialKernel.prototype.getWasmReady = function () {
      return this.wasm !== null && this.initialized;
    };

    SpatialKernel.prototype.computeArea = function (polygon) {
      if (this.getWasmReady() && this.wasm.computeArea) {
        return this.wasm.computeArea(polygon);
      }
      return area(polygon);
    };

    SpatialKernel.prototype.computePerimeter = function (polygon) {
      if (this.getWasmReady() && this.wasm.computePerimeter) {
        return this.wasm.computePerimeter(polygon);
      }
      return perimeter(polygon);
    };

    SpatialKernel.prototype.computeWalls = function (rooms) {
      if (this.getWasmReady() && this.wasm.computeWalls) {
        return this.wasm.computeWalls(rooms);
      }
      return this.tsWalls(rooms);
    };

    SpatialKernel.prototype.tsWalls = function (rooms) {
      var walls = [];
      var wallMap = {};

      for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        var roomEdges = edges(room.polygon_mm);
        for (var j = 0; j < roomEdges.length; j++) {
          var e = roomEdges[j];
          var key = this.edgeKey(e.a, e.b);
          var existing = wallMap[key];
          if (existing) {
            if (!existing.room_ids) existing.room_ids = [];
            if (existing.room_ids.indexOf(room.id) === -1) {
              existing.room_ids.push(room.id);
            }
          } else {
            var wall = {
              id: 'wall_' + (walls.length + 1),
              start_mm: e.a,
              end_mm: e.b,
              thickness_mm: 120,
              room_ids: [room.id]
            };
            wallMap[key] = wall;
            walls.push(wall);
          }
        }
      }
      return walls;
    };

    SpatialKernel.prototype.edgeKey = function (a, b) {
      var ax = a[0], ay = a[1], bx = b[0], by = b[1];
      if (ax > bx || (ax === bx && ay > by)) {
        return bx + ',' + by + '|' + ax + ',' + ay;
      }
      return ax + ',' + ay + '|' + bx + ',' + by;
    };

    SpatialKernel.prototype.parseLayout = function (input) {
      var walls = input.walls || this.computeWalls(input.rooms);

      var contract = {
        contract_version: CONTRACT_VERSION,
        coordinate_system: COORDINATE_SYSTEM,
        units: { length: 'mm', angle: 'deg' },
        source: input.source,
        provenance: input.provenance,
        rooms: input.rooms.map(function (r) {
          var room = {
            id: r.id,
            name: r.name,
            level: r.level,
            kind: r.kind,
            boundary_polygon: dropClosingPoint(r.polygon_mm),
            ceiling_height_mm: r.ceiling_height_mm,
            floor_elevation_mm: r.floor_elevation_mm,
            openings: r.openings,
            confidence: r.confidence
          };
          return room;
        }),
        walls: walls,
        scene: input.scene
      };

      var validation = validateContract(contract);

      var totalArea = 0;
      var totalPerimeter = 0;
      for (var i = 0; i < input.rooms.length; i++) {
        totalArea += this.computeArea(input.rooms[i].polygon_mm);
        totalPerimeter += this.computePerimeter(input.rooms[i].polygon_mm);
      }

      return {
        contract: contract,
        valid: validation.valid,
        validation: validation,
        stats: {
          rooms: input.rooms.length,
          walls: walls.length,
          total_area_mm2: totalArea,
          total_perimeter_mm: totalPerimeter
        }
      };
    };

    return SpatialKernel;
  })();

  /* ============================================================
     Section 5 — Planex Bridge
     ============================================================ */
  var M_TO_MM = 1000;

  function rectToPolygonMm(xM, yM, wM, hM) {
    var x = Math.round(xM * M_TO_MM);
    var y = Math.round(yM * M_TO_MM);
    var w = Math.round(wM * M_TO_MM);
    var h = Math.round(hM * M_TO_MM);
    return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h]
    ];
  }

  function mapOpening(opening, roomPolygon) {
    if (!opening.type || !opening.width || !opening.height) {
      return null;
    }

    var startPoint;

    if (opening.x !== undefined && opening.y !== undefined) {
      startPoint = [Math.round(opening.x * M_TO_MM), Math.round(opening.y * M_TO_MM)];
    } else if (opening.x !== undefined) {
      var maxY = Math.max.apply(null, roomPolygon.map(function (p) { return p[1]; }));
      var maxPoint = roomPolygon.find(function (p) { return p[1] === maxY; });
      startPoint = [Math.round(opening.x * M_TO_MM), maxPoint ? maxPoint[1] : 0];
    } else {
      startPoint = [roomPolygon[0][0], roomPolygon[0][1]];
    }

    var result = {
      type: opening.type,
      start_mm: startPoint,
      width_mm: Math.round(opening.width * M_TO_MM),
      height_mm: Math.round(opening.height * M_TO_MM)
    };

    if (opening.sill !== undefined) {
      result.sill_mm = Math.round(opening.sill * M_TO_MM);
    }
    if (opening.type === 'door') {
      result.sill_mm = 0;
    }
    if (opening.swing_deg !== undefined) {
      result.swing_deg = opening.swing_deg;
    }
    if (opening.confidence !== undefined) {
      result.confidence = opening.confidence;
    }

    return result;
  }

  function layoutToContract(input) {
    var roomObjs = input.rooms.map(function (r) {
      var polygon = rectToPolygonMm(r.x, r.y, r.w, r.h);
      var id = r.id || roomId(r.name);

      var room = {
        id: id,
        name: r.name,
        kind: r.kind,
        boundary_polygon: polygon,
        ceiling_height_mm: r.ceilingHeight
          ? Math.round(r.ceilingHeight * M_TO_MM)
          : Math.round((input.ceilingHeightM || 2.7) * M_TO_MM),
        floor_elevation_mm: r.floorElevation
          ? Math.round(r.floorElevation * M_TO_MM)
          : input.floorElevationM
            ? Math.round(input.floorElevationM * M_TO_MM)
            : 0
      };

      if (r.confidence !== undefined) {
        room.confidence = r.confidence;
      }

      if (r.openings && r.openings.length > 0) {
        var openings = [];
        for (var i = 0; i < r.openings.length; i++) {
          var mapped = mapOpening(r.openings[i], polygon);
          if (mapped) openings.push(mapped);
        }
        if (openings.length > 0) {
          room.openings = openings;
        }
      }

      return room;
    });

    var contract = newContract({
      source: input.source,
      provenance: input.provenance,
      rooms: roomObjs,
      scene: input.scene
    });

    var validation = validateContract(contract);

    return { contract: contract, validation: validation };
  }

  function roomToContract(room, source, provenance, floorElevationM, ceilingHeightM) {
    if (floorElevationM === undefined) floorElevationM = 0;
    if (ceilingHeightM === undefined) ceilingHeightM = 2.7;
    return layoutToContract({
      source: source,
      provenance: provenance,
      widthM: room.w,
      heightM: room.h,
      floorElevationM: floorElevationM,
      ceilingHeightM: ceilingHeightM,
      rooms: [room]
    });
  }

  /* ============================================================
     Section 6 — Public API
     ============================================================ */
  return {
    // Constants
    CONTRACT_VERSION: CONTRACT_VERSION,
    COORDINATE_SYSTEM: COORDINATE_SYSTEM,
    BOUNDARY_TOL_MM: BOUNDARY_TOL_MM,
    M_TO_MM: M_TO_MM,

    // Contract
    newContract: newContract,
    roomId: roomId,
    validateContract: validateContract,
    assertValidContract: assertValidContract,

    // Geometry
    isFinitePoint: isFinitePoint,
    pointsEqual: pointsEqual,
    dropClosingPoint: dropClosingPoint,
    hasConsecutiveDuplicates: hasConsecutiveDuplicates,
    dedupeConsecutive: dedupeConsecutive,
    signedArea: signedArea,
    area: area,
    perimeter: perimeter,
    centroid: centroid,
    bbox: bbox,
    wallRuns: wallRuns,
    edges: edges,
    distancePointToSegment: distancePointToSegment,
    isPointOnBoundary: isPointOnBoundary,
    pointInPolygon: pointInPolygon,
    segmentsIntersect: segmentsIntersect,
    selfIntersects: selfIntersects,
    isCollinear: isCollinear,
    removeCollinear: removeCollinear,
    normalizeRing: normalizeRing,
    edgeContaining: edgeContaining,

    // Kernel
    SpatialKernel: SpatialKernel,
    createKernel: createKernel,

    // Bridge
    layoutToContract: layoutToContract,
    roomToContract: roomToContract
  };
});
