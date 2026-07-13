// Newport Search Group — light client behavior (no dependencies)
(function () {
  // Shrink header on scroll (big logo at top, compact once scrolling)
  var hdr = document.querySelector(".site-header");
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle("scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Mobile nav toggle
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      header.classList.toggle("open");
    });
  }

  // Prefill contact form based on ?intent=
  var params = new URLSearchParams(window.location.search);
  var intent = params.get("intent");
  var map = {
    talent: "Request Talent",
    candidate: "Submit Resume / Candidate",
    subscribe: "Newsletter Subscription",
    recruiter: "Staffing Firm — Hire Recruiters",
  };
  var sel = document.querySelector("#hiringNeed");
  if (sel && intent && map[intent]) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === map[intent]) { sel.selectedIndex = i; break; }
    }
  }

  // Demo form handler (replace action with a real endpoint or Wix form)
  var form = document.querySelector("form[data-demo]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".form-status");
      if (note) {
        note.textContent = "Thanks — this is a demo build. Wire this form to your CRM, email, or Wix form to go live.";
        note.style.color = "var(--blue)";
      }
    });
  }

  // Scroll reveal — elements fade/slide in as they enter the viewport.
  // Gated by the 'anim' class so content still shows if JS is disabled.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("anim");
    var selectors = [
      ".section__head", ".card", ".split", ".statband .stat",
      ".pills", ".ctaband", ".form-wrap", ".jobsearch"
    ];
    var targets = [];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        // don't hide above-the-fold hero content
        if (el.closest(".hero") || el.closest(".breadcrumb-hero")) return;
        el.classList.add("reveal");
        targets.push(el);
      });
    });
    // stagger siblings within a grid for a cascade effect
    document.querySelectorAll(".grid, .statband").forEach(function (grid) {
      var kids = grid.querySelectorAll(".reveal");
      kids.forEach(function (k, i) { k.classList.add("d" + ((i % 4) + 1)); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }
})();
