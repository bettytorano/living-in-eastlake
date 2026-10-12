// Mobile menu toggle and footer year
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Prevent double submits on lead forms
  document.querySelectorAll("form.lead-form").forEach(function (form) {
    form.addEventListener("submit", function () {
      var btn = form.querySelector("button[type=submit]");
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    });
  });
});

// Scrolling reviews: duplicate cards for a seamless loop; pause on tap; "Read more"
document.addEventListener("DOMContentLoaded", function () {
  var viewport = document.querySelector(".reviews-viewport");
  var track = viewport && viewport.querySelector(".reviews-track");
  if (!track) return;
  var originals = Array.prototype.slice.call(track.children);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    originals.forEach(function (card) {
      var copy = card.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    });
    track.style.setProperty("--reviews-duration", Math.max(40, originals.length * 14) + "s");
  }
  track.addEventListener("click", function (e) {
    var btn = e.target.closest(".review-more");
    if (btn) {
      var card = btn.closest(".review");
      var open = card.classList.toggle("open");
      btn.textContent = open ? "Show less" : "Read more";
      viewport.classList.toggle("paused", open);
      return;
    }
    viewport.classList.toggle("paused");
  });
  // Hide "Read more" on reviews short enough to show in full
  track.querySelectorAll(".review").forEach(function (card) {
    var q = card.querySelector("blockquote"), b = card.querySelector(".review-more");
    if (q && b && q.scrollHeight <= q.clientHeight + 2) b.hidden = true;
  });
});

// "Let's make a plan" contact popup
(function () {
  var dlg = document.getElementById("plan-dialog");
  if (!dlg || typeof dlg.showModal !== "function") return;
  document.querySelectorAll("[data-open-plan]").forEach(function (b) {
    b.addEventListener("click", function () { dlg.showModal(); var f = dlg.querySelector("input:not([type=hidden]):not([tabindex])"); if (f) f.focus(); });
  });
  dlg.querySelector("[data-close-plan]").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();

// When arriving at a #section link, jump again once images have loaded (lazy images shift the page)
(function () {
  if (!location.hash) return;
  var go = function () {
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  };
  // Instagram embeds and lazy images keep changing the page height for a few seconds, so re-jump a few times
  [300, 900, 1800, 3000].forEach(function (t) { setTimeout(go, t); });
  window.addEventListener("load", go);
})();
