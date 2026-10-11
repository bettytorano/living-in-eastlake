// Neighborhood boundary maps (Leaflet + OpenStreetMap tiles).
// Usage: <div class="nbr-map" data-nbr="eastlake-hills"></div>
// Boundaries are traced along neighborhood streets from Betty's own map drawings and are approximate.

var NBR_BOUNDARIES = {
  "eastlake-hills": {
    name: "Eastlake Hills",
    // West: Corral Canyon Rd · Southeast: East H St · Northeast corner near State Route 125
    shape: [[32.660345, -116.991536], [32.661267, -116.980283], [32.658416, -116.977647], [32.655173, -116.980283],
            [32.650615, -116.986163], [32.650769, -116.988677], [32.659423, -116.992205]],
    spots: [{ name: "EastLake Elementary School", lat: 32.6559, lng: -116.9845 }]
  },
  "eastlake-shores": {
    name: "Eastlake Shores",
    // Northwest: East H St (shared edge with Eastlake Hills) · East: State Route 125
    shape: [[32.659423, -116.976876], [32.656829, -116.973490], [32.648976, -116.972578], [32.649283, -116.984500],
            [32.650615, -116.986163], [32.655173, -116.980283], [32.658416, -116.977647]]
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
      var b = NBR_BOUNDARIES[el.getAttribute("data-nbr")];
      if (!b) return;
      var map = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: !L.Browser.mobile });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      var poly = L.polygon(b.shape, { color: "#15427d", weight: 3, fillColor: "#15427d", fillOpacity: 0.18 })
        .bindTooltip(b.name, { sticky: true })
        .addTo(map);
      (b.spots || []).forEach(function (p) {
        L.circleMarker([p.lat, p.lng], { radius: 6, color: "#ffffff", weight: 2, fillColor: "#c9a84c", fillOpacity: 1 })
          .bindTooltip(p.name)
          .addTo(map);
      });
      map.fitBounds(poly.getBounds(), { padding: [24, 24] });
    });
  });
})();
