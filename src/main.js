// Newport Search Group — light client behavior (no dependencies)
(function () {
  // Copy-link buttons (article share row). Delegated so it works for any
  // [data-copy-link] element without per-element wiring.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-copy-link]");
    if (!btn) return;
    var url = btn.getAttribute("data-copy-link");
    var label = btn.querySelector(".share-btn__t");
    var reset = function (text) {
      if (!label) return;
      var prev = label.getAttribute("data-prev") || label.textContent;
      label.setAttribute("data-prev", prev);
      label.textContent = text;
      btn.classList.add("is-copied");
      setTimeout(function () { label.textContent = prev; btn.classList.remove("is-copied"); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { reset("Copied!"); }, function () { reset("Press ⌘C"); });
    } else {
      reset("Copy manually");
    }
  });

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

  // Contact form. With a build-time endpoint (data-endpoint) the enquiry is
  // POSTed as JSON to a service we run or rent; without one, or if that call
  // fails, it falls back to a prefilled email so no enquiry is silently lost.
  // Nothing here holds a credential, and no field value reaches analytics.
  var form = document.querySelector("form[data-contact]");
  if (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var value = function (name) {
      var el = form.elements[name];
      return el && el.value ? String(el.value).trim() : "";
    };
    var say = function (text, tone, link) {
      if (!status) return;
      status.textContent = text;
      status.setAttribute("data-tone", tone || "");
      if (link) {
        var a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.text;
        a.setAttribute("data-contact-fallback", "");
        status.appendChild(document.createTextNode(" "));
        status.appendChild(a);
      }
      // The message sits under the Send button; make sure an outcome is seen.
      if (tone && status.scrollIntoView) status.scrollIntoView({ block: "center", behavior: "instant" });
    };
    var mailtoHref = function (d) {
      var lines = [
        "Name: " + d.name,
        d.company ? "Company: " + d.company : "",
        "Email: " + d.email,
        d.phone ? "Phone: " + d.phone : "",
        "Hiring need: " + d.hiringNeed,
        "",
        d.message,
      ].filter(function (l, i) { return l !== "" || i === 5; });
      return "mailto:" + form.getAttribute("data-mailto") +
        "?subject=" + encodeURIComponent(d._subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    };
    var track = function (evt, d) {
      var data = { hiringNeed: d.hiringNeed, intent: d.intent || "" };
      document.dispatchEvent(new CustomEvent("newport-contact", { detail: { event: evt, data: data } }));
      if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: evt, hiringNeed: data.hiringNeed, intent: data.intent });
    };
    var byEmail = function (d, lead) {
      var href = mailtoHref(d);
      say(lead, "warn", { href: href, text: "Open your email app" });
      track("contact_form_email_fallback", d);
      window.location.href = href;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.getAttribute("data-busy")) return;
      var d = {
        name: value("name"), company: value("company"), email: value("email"),
        phone: value("phone"), hiringNeed: value("hiringNeed"), message: value("message"),
        intent: intent || "", page: window.location.pathname,
      };
      d._subject = "Website enquiry: " + d.hiringNeed + " (" + d.name + ")";
      // Honeypot: a filled trap field is a bot. Report success and send nothing.
      if (value("_gotcha")) { say("Thanks. We have your message and will be in touch shortly.", "ok"); form.reset(); return; }

      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        byEmail(d, "Your email app should open with this message ready to send. If it did not:");
        return;
      }
      form.setAttribute("data-busy", "1");
      if (button) button.disabled = true;
      say("Sending…", "");
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(d),
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        say("Thanks, " + d.name.split(" ")[0] + ". We have your message and will be in touch shortly.", "ok");
        track("contact_form_submitted", d);
        form.reset();
      }).catch(function () {
        byEmail(d, "We could not send that just now. Your message is not lost:");
      }).then(function () {
        form.removeAttribute("data-busy");
        if (button) button.disabled = false;
      });
    });
  }

  // Job list filter (/jobs). The form ships hidden so no-JS visitors just see
  // the full list; here we reveal it and filter cards by keyword + location.
  var jobFilter = document.querySelector("form[data-job-filter]");
  if (jobFilter) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".job-card"));
    var count = document.querySelector("[data-job-count]");
    var none = document.querySelector("[data-job-none]");
    var q = jobFilter.querySelector("[name=q]");
    var region = jobFilter.querySelector("[name=region]");
    var apply = function () {
      var words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      var r = region.value;
      var shown = 0;
      cards.forEach(function (c) {
        var text = c.getAttribute("data-job-text") || "";
        var ok = (!r || c.getAttribute("data-job-region") === r) &&
          words.every(function (w) { return text.indexOf(w) !== -1; });
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown + " of " + cards.length + " open " + (cards.length === 1 ? "role" : "roles");
      if (none) none.hidden = shown !== 0;
    };
    jobFilter.hidden = false;
    q.addEventListener("input", apply);
    region.addEventListener("change", apply);
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
