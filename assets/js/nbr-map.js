// Neighborhood boundary maps (Leaflet + OpenStreetMap tiles).
// Usage: <div class="nbr-map" data-nbr="eastlake-hills"></div> (several: data-nbr="eastlake-trails,eastlake-trails-north")
// Boundaries are traced along neighborhood streets from Betty's own map drawings and are approximate.

var NBR_BOUNDARIES = {
  "eastlake-hills": {
    name: "Eastlake Hills",
    // West: Corral Canyon Rd · Southeast: East H St · Northeast corner near State Route 125
    shape: [[32.660345, -116.991536], [32.661267, -116.980283], [32.658416, -116.977647], [32.655173, -116.980283],
            [32.650615, -116.986163], [32.650769, -116.988677], [32.659423, -116.992205]]
  },
  "eastlake-shores": {
    name: "Eastlake Shores",
    // Northwest: East H St (shared edge with Eastlake Hills) · East: State Route 125
    shape: [[32.659423, -116.976876], [32.656829, -116.973490], [32.648976, -116.972578], [32.649283, -116.984500],
            [32.650615, -116.986163], [32.655173, -116.980283], [32.658416, -116.977647]]
  },
  "eastlake-greens": {
    name: "Eastlake Greens",
    // North: Otay Lakes Rd · West: Eastlake Pkwy · East: Hunte Pkwy · South: Olympic Pkwy
    shape: [[32.648178, -116.965305], [32.649572, -116.961064], [32.650225, -116.957133], [32.650051, -116.955116],
            [32.649115, -116.953099], [32.647329, -116.950849], [32.644281, -116.953875], [32.642430, -116.954935],
            [32.640252, -116.955064], [32.638510, -116.954469], [32.634111, -116.950125], [32.631759, -116.948780],
            [32.628863, -116.954081], [32.627948, -116.958529], [32.636376, -116.967218], [32.639490, -116.966029],
            [32.643301, -116.966494], [32.645848, -116.965279], [32.646502, -116.964994]]
  },
  "eastlake-trails": {
    name: "Eastlake Trails",
    // West: Hunte Pkwy (shared edge with Eastlake Greens) · North: Otay Lakes Rd · South: Olympic Pkwy
    shape: [[32.647329, -116.950849], [32.645805, -116.948909], [32.645152, -116.946582], [32.644825, -116.944901],
            [32.633610, -116.944901], [32.631759, -116.948780], [32.634111, -116.950125], [32.638510, -116.954469],
            [32.640252, -116.955064], [32.642430, -116.954935], [32.644281, -116.953875]]
  },
  "eastlake-vistas": {
    name: "Eastlake Vistas",
    // West edge shared with Eastlake Trails · North: Otay Lakes Rd · East: Wueste Rd area
    shape: [[32.644825, -116.944901], [32.643389, -116.936318], [32.641036, -116.934250], [32.638609, -116.935064],
            [32.634088, -116.934690], [32.633662, -116.936780], [32.633532, -116.937484], [32.633328, -116.938585],
            [32.632587, -116.939795], [32.632050, -116.938915], [32.631160, -116.939245], [32.629493, -116.939245],
            [32.628603, -116.939839], [32.628622, -116.941489], [32.632309, -116.942831], [32.633291, -116.942831],
            [32.633610, -116.944901]]
  },
  "eastlake-trails-north": {
    name: "Eastlake Trails North",
    label: "left",
    // South tip: Otay Lakes Rd & Hunte Pkwy (shared corner with Greens and Trails) · East: Hunte Pkwy
    shape: [[32.657051, -116.953114], [32.654783, -116.954264], [32.652884, -116.952791], [32.649687, -116.953873],
            [32.647329, -116.950849], [32.648331, -116.949569], [32.649590, -116.949270], [32.650889, -116.949270]]
  },
  "the-woods": {
    name: "The Woods",
    // South: Otay Lakes Rd (shared with Trails) · West: Hunte Pkwy (shared with Trails North)
    shape: [[32.661828, -116.945385], [32.660026, -116.941703], [32.653924, -116.936250], [32.649759, -116.937561],
            [32.649546, -116.940277], [32.644825, -116.944901], [32.645152, -116.946582], [32.645805, -116.948909],
            [32.647329, -116.950849], [32.648331, -116.949569], [32.649590, -116.949270], [32.650889, -116.949270],
            [32.651832, -116.949457], [32.653730, -116.945730], [32.654893, -116.946305], [32.656190, -116.947686],
            [32.656190, -116.945385]]
  }
};

(function () {
  var els = document.querySelectorAll(".nbr-map[data-nbr]");
  if (!els.length) return;

  function load(cb) {
    if (window.L) return cb();
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    var js = document.createElement("script");
    js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    js.onload = cb;
    document.head.appendChild(js);
  }

  load(function () {
    Array.prototype.forEach.call(els, function (el) {
      var list = el.getAttribute("data-nbr").split(",").map(function (k) { return NBR_BOUNDARIES[k.trim()]; }).filter(Boolean);
      if (!list.length) return;
      var map = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: !L.Browser.mobile });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      var all = L.featureGroup().addTo(map);
      list.forEach(function (b) {
        L.polygon(b.shape, { color: "#15427d", weight: 3, fillColor: "#15427d", fillOpacity: 0.18 })
          .bindTooltip(b.name, { sticky: true })
          .addTo(all);
        if (b.label === "left") {
          // Label set off to the side, pointing at the area, so it never covers the streets
          var west = b.shape.reduce(function (w, p) { return p[1] < w[1] ? p : w; });
          var mid = b.shape.reduce(function (s, p) { return s + p[0]; }, 0) / b.shape.length;
          L.tooltip({ permanent: true, direction: "left", offset: [-14, 0], className: "nbr-label" })
            .setLatLng([mid, west[1]]).setContent(b.name).addTo(map);
        }
        (b.spots || []).forEach(function (p) {
          L.circleMarker([p.lat, p.lng], { radius: 6, color: "#ffffff", weight: 2, fillColor: "#c9a84c", fillOpacity: 1 })
            .bindTooltip(p.name)
            .addTo(map);
        });
      });
      map.fitBounds(all.getBounds(), { padding: [24, 24] });
    });
  });
})();
