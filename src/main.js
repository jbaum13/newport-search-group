// Newport Search Group — light client behavior (no dependencies)
(function () {
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
})();
