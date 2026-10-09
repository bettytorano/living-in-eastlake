// Interactive Eastlake neighborhood map (Leaflet + OpenStreetMap tiles).
// To move a pin: open the page with ?edit at the end of the address
// (e.g. /neighborhoods?edit), drag the pin, and copy the coordinates shown.

var EASTLAKE_NEIGHBORHOODS = [
  { name: "Eastlake Hills", slug: "eastlake-hills", hoa: "Eastlake I", lat: 32.6575, lng: -116.9835,
    desc: "One of Eastlake's original neighborhoods and Betty's home since 1987. Many original homes are past their Mello-Roos district.",
    listings: "https://bettytorano.com/neighborhood/159144632/eastlakehills" },
  { name: "Eastlake Shores", slug: "eastlake-shores", hoa: "Eastlake I", lat: 32.6525, lng: -116.9765,
    desc: "Built around Eastlake's lake, home of the Beach Club and lagoon.",
    listings: "https://bettytorano.com/neighborhood/159144633/eastlakeshores" },
  { name: "Eastlake Greens", slug: "eastlake-greens", hoa: "Eastlake II", lat: 32.6433, lng: -116.9625,
    desc: "Surrounding the Enagic Golf Club at Eastlake (formerly EastLake Country Club), with its own association and amenities.",
    listings: "https://bettytorano.com/neighborhood/159144634/eastlakegreens" },
  { name: "Eastlake Trails", slug: "eastlake-trails", hoa: "Eastlake III", lat: 32.6392, lng: -116.9498,
    desc: "Home of the permanent Eastlake Little League fields and Arroyo Vista Elementary.",
    listings: "https://bettytorano.com/neighborhood/159144636/eastlaketrails" },
  { name: "Eastlake Trails North", slug: "eastlake-trails-north", hoa: "Eastlake III", lat: 32.6500, lng: -116.9512,
    desc: "Part of the Eastlake III association alongside the Trails, Vistas and the Woods.",
    listings: "https://bettytorano.com/neighborhood/159144637/eastlaketrailsnorth" },
  { name: "The Woods", slug: "the-woods", hoa: "Eastlake III", lat: 32.6556, lng: -116.9450,
    desc: "Home of EastLake Middle School and close to the District at Eastlake shops.",
    listings: "https://bettytorano.com/neighborhood/159144638/thewoodsateastlake" },
  { name: "Eastlake Vistas", slug: "eastlake-vistas", hoa: "Eastlake III", lat: 32.6384, lng: -116.9356,
    desc: "Part of the Eastlake III association. Ask Betty about current Mello-Roos status.",
    listings: "https://bettytorano.com/neighborhood/159144635/eastlakevistas" }
];

var EASTLAKE_LANDMARKS = [
  { name: "EastLake Elementary (opened 1989)", lat: 32.6559, lng: -116.9845 },
  { name: "Olympic View Elementary", lat: 32.6378, lng: -116.9652 },
  { name: "Arroyo Vista Elementary", lat: 32.6387, lng: -116.9535 },
  { name: "EastLake Middle School (opened 2003)", lat: 32.6544, lng: -116.9480 },
  { name: "Enagic Golf Club at Eastlake (formerly EastLake Country Club)", lat: 32.6435, lng: -116.9610 }
];

document.addEventListener("DOMContentLoaded", function () {
  var el = document.getElementById("eastlake-map");
  if (!el || typeof L === "undefined") return;

  var editMode = /[?&]edit\b/.test(location.search);
  var map = L.map(el, {
    scrollWheelZoom: false,          // don't hijack page scrolling
    dragging: !L.Browser.mobile,     // let phones scroll the page with one finger
    tap: !L.Browser.mobile
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  EASTLAKE_LANDMARKS.forEach(function (p) {
    L.circleMarker([p.lat, p.lng], { radius: 5, color: "#ffffff", weight: 2, fillColor: "#1f6f8b", fillOpacity: 1 })
      .bindTooltip(p.name)
      .addTo(map);
  });

  var bounds = [];
  EASTLAKE_NEIGHBORHOODS.forEach(function (n) {
    var icon = L.divIcon({
      className: "nb-pin",
      html: '<span class="nb-pin-dot"></span><span class="nb-pin-label">' + n.name + "</span>",
      iconSize: null,
      iconAnchor: [9, 9]
    });
    var marker = L.marker([n.lat, n.lng], { icon: icon, draggable: editMode, title: n.name, riseOnHover: true }).addTo(map);
    marker.bindPopup(
      '<div class="nb-popup">' +
        '<span class="tag">' + n.hoa + " HOA</span>" +
        "<h3>" + n.name + "</h3>" +
        "<p>" + n.desc + "</p>" +
        '<a class="btn small" href="' + n.listings + '" rel="noopener">See homes for sale</a>' +
        '<a class="nb-popup-more" href="/neighborhoods#' + n.slug + '">About ' + n.name + " →</a>" +
        '<a class="nb-popup-more" href="/home-value">What\'s my home worth? →</a>' +
      "</div>",
      { maxWidth: 280, autoPanPadding: [20, 20] }
    );
    if (editMode) {
      marker.on("dragend", function () {
        var p = marker.getLatLng();
        var text = n.name + ": lat: " + p.lat.toFixed(4) + ", lng: " + p.lng.toFixed(4);
        var out = document.getElementById("eastlake-map-edit");
        if (out) out.textContent = text;
        console.log(text);
      });
    }
    bounds.push([n.lat, n.lng]);
  });

  map.fitBounds(bounds, { padding: [40, 40] });

  if (editMode) {
    var out = document.createElement("p");
    out.id = "eastlake-map-edit";
    out.className = "nbmap-hint";
    out.textContent = "Edit mode: drag a pin to the right spot, then copy the coordinates shown here.";
    el.parentNode.insertBefore(out, el.nextSibling);
  }
});
