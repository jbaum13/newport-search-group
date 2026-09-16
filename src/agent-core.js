// ============================================================================
// Newport agent runtime — the conversational widget shared by every agent on
// the site. Zero dependencies, same style as src/main.js.
//
// One page mounts one agent. build.js decides which (candidate pages get Finn,
// employer pages get Beacon), renders its launcher, and loads this file plus
// that agent's profile (src/finn.js, src/beacon.js).
//
// Three layers:
//   1. ADAPTER   — talks to a real agent service when one is configured,
//                  otherwise resolves from the profile's knowledge layer.
//   2. KNOWLEDGE — lives in the profile: a fixed answer set written from this
//                  site's own content. It never invents facts.
//   3. UI        — launcher + panel, built lazily on first open.
//
// SECURITY: this is a static site. There is no server here, so no agent holds
// a credential. NEWPORT_AGENT_CONFIG.endpoints[id] may hold a URL to a server
// you control; that server holds the provider keys. Never put a key here.
// ============================================================================
(function () {
  "use strict";

  var CFG = window.NEWPORT_AGENT_CONFIG || {};
  var BASE = CFG.basePath || "";
  var EMAIL = CFG.email || "hello@newportsg.com";
  var ENDPOINTS = CFG.endpoints || {};

  // ---- helpers ------------------------------------------------------------
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  // Remote content is untrusted: render it as text, never as markup.
  var textToHtml = function (s) {
    return String(s || "").split(/\n{2,}/).map(function (p) {
      return "<p>" + esc(p).replace(/\n/g, "<br />") + "</p>";
    }).join("");
  };
  var safeHref = function (h) {
    var s = String(h || "");
    return /^(https?:\/\/|\/|mailto:|tel:)/i.test(s) ? s : null;
  };

  // ---- page context -------------------------------------------------------
  // Read from the data-* attributes build.js puts on <main>.
  function pageContext() {
    var el = document.querySelector("[data-agent-context]");
    var ctx = { url: location.pathname + location.search, pageTitle: document.title };
    if (el) {
      var map = {
        "data-agent-context": "pageKind",
        "data-industry": "industry",
        "data-service": "service",
        "data-job-id": "jobId",
        "data-job-title": "jobTitle",
      };
      for (var attr in map) {
        var v = el.getAttribute(attr);
        if (v) ctx[map[attr]] = v;
      }
    }
    return ctx;
  }

  function newSessionId(id) {
    try {
      var k = "nsg.agent." + id + ".session";
      var v = sessionStorage.getItem(k);
      if (!v) {
        v = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(k, v);
      }
      return v;
    } catch (e) {
      // Private mode / blocked storage — a per-page-load id still works.
      return "s-" + Date.now().toString(36);
    }
  }

  // ---- shared icons -------------------------------------------------------
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

  // ---- mount --------------------------------------------------------------
  // A profile supplies identity, quick actions, guardrails and knowledge.
  // Everything below is the same for every agent.
  function mount(profile) {
    var ID = profile.id;
    var launcher = document.querySelector('.agent-launcher[data-agent="' + ID + '"]');
    if (!launcher) return null; // build.js didn't put this agent on this page

    var sessionId = newSessionId(ID);
    var panel = null, bodyEl = null, inputEl = null, sendBtn = null;
    var state = "closed", busy = false, opened = false, lastFocus = null;

    // ---- analytics ---------------------------------------------------------
    // Emits through whatever the site already has, and always as a DOM event so
    // a future analytics layer can subscribe without touching this file.
    // No PII: message text is never included, only lengths and action ids.
    function track(name, detail) {
      var evt = ID + "_" + name;
      var data = detail || {};
      data.agent = ID;
      try {
        document.dispatchEvent(new CustomEvent("agent:" + evt, { detail: data }));
        document.dispatchEvent(new CustomEvent("newport-agent", { detail: { event: evt, data: data } }));
        if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: evt }, data));
        if (typeof window.gtag === "function") window.gtag("event", evt, data);
      } catch (e) { /* analytics must never break the UI */ }
    }

    // ---- knowledge ---------------------------------------------------------
    var byId = {};
    (profile.kb || []).forEach(function (k) { byId[k.id] = k; });

    function needsHandoff(t) {
      var pats = profile.handoffPatterns || [];
      for (var i = 0; i < pats.length; i++) if (pats[i].test(t)) return true;
      return false;
    }
    // First match wins, so profile.order IS the routing policy: narrow,
    // high-confidence intents before broad ones.
    function answerLocally(text) {
      if (needsHandoff(text)) return profile.handoffReply;
      var order = profile.order || Object.keys(byId);
      for (var i = 0; i < order.length; i++) {
        var k = byId[order[i]];
        if (k && k.match.test(text)) return k;
      }
      return profile.unknown;
    }

    // ---- adapter -----------------------------------------------------------
    // The one seam between the UI and whatever powers this agent.
    //   sendMessage({ message, sessionId, pageContext, visitorContext? })
    //     -> Promise<{ message, insights?, actions?, citations?, handoff? }>
    var adapter = {
      id: ID,
      endpoint: ENDPOINTS[ID] || null,
      sendMessage: function (payload) {
        if (!this.endpoint) {
          var local = answerLocally(payload.message);
          return new Promise(function (resolve) {
            // A beat of latency so the typing indicator reads as real.
            setTimeout(function () {
              resolve({
                message: local.reply,
                trusted: true,
                actions: local.actions || null,
                citations: local.cites || null,
                handoff: !!local.handoff,
              });
            }, 420 + Math.random() * 380);
          });
        }
        var ctrl = typeof AbortController === "function" ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
        return fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent: ID,
            message: String(payload.message).slice(0, 2000),
            sessionId: payload.sessionId,
            pageContext: payload.pageContext,
            visitorContext: payload.visitorContext || null,
          }),
          signal: ctrl ? ctrl.signal : undefined,
        }).then(function (res) {
          if (timer) clearTimeout(timer);
          if (!res.ok) throw new Error(ID + "_http_" + res.status);
          return res.json();
        }).then(function (data) {
          return {
            message: textToHtml(data && data.message),
            trusted: false,
            insights: (data && Array.isArray(data.insights)) ? data.insights.slice(0, 4) : null,
            actions: (data && Array.isArray(data.suggestedActions || data.actions))
              ? (data.suggestedActions || data.actions).slice(0, 5).map(String) : null,
            citations: (data && Array.isArray(data.citations))
              ? data.citations.map(function (c) {
                  var href = safeHref(c && (c.href || c.url));
                  return href ? { label: String(c.label || c.title || "Source"), href: href } : null;
                }).filter(Boolean).slice(0, 4)
              : null,
            handoff: !!(data && data.handoff),
          };
        });
      },
    };

    // ---- UI ---------------------------------------------------------------
    function el(tag, cls, html) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    }
    var avatarImg = function () {
      return '<img src="' + BASE + "/assets/" + profile.avatar + '" alt="" width="128" height="128" />';
    };

    function buildPanel() {
      panel = el("div", "agent-panel");
      panel.id = "agent-panel-" + ID;
      panel.setAttribute("data-agent", ID);
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "false");
      panel.setAttribute("aria-label", profile.name + " — Newport " + profile.role);
      panel.hidden = true;
      panel.innerHTML =
        '<div class="agent-panel__head">' +
          '<span class="agent-panel__avatar">' + avatarImg() + "</span>" +
          '<span class="agent-panel__id"><span class="agent-panel__name">' + esc(profile.name) + "</span><br />" +
            '<span class="agent-panel__role">' + esc(profile.role) + "</span></span>" +
          '<button type="button" class="agent-panel__close" aria-label="Close ' + esc(profile.name) + '">' + CLOSE + "</button>" +
        "</div>" +
        '<div class="agent-panel__body" aria-live="polite" aria-atomic="false"></div>' +
        '<div class="agent-panel__foot">' +
          '<form class="agent-form" novalidate>' +
            '<label class="agent-sr" for="agent-input-' + ID + '">Message ' + esc(profile.name) + "</label>" +
            '<textarea id="agent-input-' + ID + '" rows="1" placeholder="' + esc(profile.placeholder || ("Ask " + profile.name + " a question…")) + '" maxlength="2000" autocomplete="off"></textarea>' +
            '<button type="submit" class="agent-send" aria-label="Send message">' + SEND + "</button>" +
          "</form>" +
          '<p class="agent-disclaimer">' + profile.disclaimer + "</p>" +
        "</div>";
      document.body.appendChild(panel);

      bodyEl = panel.querySelector(".agent-panel__body");
      inputEl = panel.querySelector("textarea");
      sendBtn = panel.querySelector(".agent-send");

      panel.querySelector(".agent-panel__close").addEventListener("click", function () { close("button"); });
      panel.querySelector(".agent-form").addEventListener("submit", function (e) {
        e.preventDefault();
        submit(inputEl.value);
      });
      inputEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(inputEl.value); }
      });
      inputEl.addEventListener("input", function () {
        inputEl.style.height = "auto";
        inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
      });
      panel.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.stopPropagation(); close("escape"); return; }
        if (e.key !== "Tab") return;
        var f = panel.querySelectorAll('button:not([disabled]), textarea, a[href], [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      renderWelcome();
    }

    // Scroll after layout settles — messages arriving back-to-back would
    // otherwise race the smooth-scroll animation and strand the newest one.
    function scrollDown() {
      if (!bodyEl) return;
      var go = function () { bodyEl.scrollTop = bodyEl.scrollHeight; };
      go();
      if (window.requestAnimationFrame) requestAnimationFrame(go);
    }

    function renderWelcome() {
      state = "welcome";
      var ctx = pageContext();
      var w = el("div", "agent-welcome");
      w.innerHTML = "<h3>" + esc(profile.welcome.headline) + "</h3>" +
        (profile.welcome.subtitle ? '<p class="agent-welcome__sub">' + esc(profile.welcome.subtitle) + "</p>" : "") +
        "<p>" + esc(profile.welcome.message) + "</p>";
      bodyEl.appendChild(w);
      // An action can declare the context it needs ("jobTitle", or
      // "pageKind=job"); drop it when the page doesn't supply that.
      var acts = (profile.quickActions || []).filter(function (a) {
        if (!a.requires) return true;
        var parts = String(a.requires).split("=");
        return parts.length > 1 ? ctx[parts[0]] === parts[1] : !!ctx[parts[0]];
      }).map(function (a) { return a.label; });
      bodyEl.appendChild(actionRow(acts));
    }

    function actionRow(actions) {
      var row = el("div", "agent-actions");
      actions.forEach(function (a) {
        var b = el("button", "agent-chip", esc(a));
        b.type = "button";
        b.addEventListener("click", function () {
          track("quick_action_selected", { action: a });
          submit(a);
        });
        row.appendChild(b);
      });
      return row;
    }

    function addMessage(who, html) {
      var m = el("div", "agent-msg agent-msg--" + who, html);
      bodyEl.appendChild(m);
      scrollDown();
      return m;
    }

    // Structured findings an endpoint can return alongside prose. The knowledge
    // layer never produces these — it has no data to put in them.
    function addInsights(insights) {
      if (!insights || !insights.length) return;
      var wrap = el("div", "agent-insights");
      insights.forEach(function (i) {
        var card = el("article", "agent-insight");
        card.innerHTML =
          '<h4>' + esc(i && (i.title || i.label) || "Insight") + "</h4>" +
          (i && i.value ? '<p class="agent-insight__v">' + esc(i.value) + "</p>" : "") +
          (i && i.detail ? "<p>" + esc(i.detail) + "</p>" : "") +
          (i && i.source ? '<p class="agent-insight__src">Source: ' + esc(i.source) + "</p>" : "");
        wrap.appendChild(card);
      });
      bodyEl.appendChild(wrap);
      track("insight_viewed", { count: insights.length });
      scrollDown();
    }

    function addCitations(afterEl, cites) {
      if (!cites || !cites.length) return;
      var wrap = el("div", "agent-msg__cites");
      cites.forEach(function (c) {
        var href = safeHref(c.href);
        if (!href) return;
        var a = el("a", "agent-msg__cite", esc(c.label));
        a.href = href;
        a.addEventListener("click", function () { track("cite_clicked", { href: href, label: c.label }); });
        wrap.appendChild(a);
      });
      afterEl.appendChild(wrap);
    }

    function addHandoff() {
      state = "handoff";
      var h = el("div", "agent-handoff");
      var ho = profile.handoff;
      h.innerHTML =
        "<h4>" + esc(ho.title) + "</h4>" +
        "<p>" + esc(ho.body) + "</p>" +
        '<div class="btn-row">' +
          '<a class="btn btn--primary" href="' + ho.primary.href + '">' + esc(ho.primary.label) + "</a>" +
          '<a class="btn btn--ghost" href="mailto:' + EMAIL + '">Email us</a>' +
        "</div>";
      h.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { track("handoff_clicked", { via: a.getAttribute("href") }); });
      });
      bodyEl.appendChild(h);
      scrollDown();
      track("handoff_requested", { via: "panel" });
    }

    function submit(raw) {
      var text = String(raw || "").trim();
      if (!text || busy) return;
      if (inputEl) { inputEl.value = ""; inputEl.style.height = "auto"; }
      state = "conversation";
      addMessage("user", "<p>" + esc(text).replace(/\n/g, "<br />") + "</p>");
      // Length only — never log what a visitor actually typed.
      track("message_sent", { length: text.length });
      (profile.signals || []).forEach(function (s) {
        if (s.match.test(text)) track(s.event, {});
      });

      busy = true;
      state = "loading";
      if (sendBtn) sendBtn.disabled = true;
      var typing = addMessage("agent", '<span class="agent-typing" role="status" aria-label="' + esc(profile.name) + ' is typing"><span></span><span></span><span></span></span>');

      adapter.sendMessage({ message: text, sessionId: sessionId, pageContext: pageContext() })
        .then(function (res) {
          typing.remove();
          var m = addMessage("agent", res.message);
          addCitations(m, res.citations);
          if (res.insights) { state = "results"; addInsights(res.insights); }
          if (res.actions && res.actions.length) bodyEl.appendChild(actionRow(res.actions));
          if (res.handoff) addHandoff();
          else if (state !== "results") state = "conversation";
          scrollDown();
        })
        .catch(function (err) {
          typing.remove();
          state = "error";
          track("error", { kind: (err && err.message) || "unknown" });
          // Degrade to the knowledge layer rather than dead-ending.
          var local = answerLocally(text);
          var m = addMessage("agent", local.reply);
          addCitations(m, local.cites);
          addMessage("error",
            "<p>I lost my connection for a moment, so that answer came from Newport’s published information " +
            "rather than live data. For anything time-sensitive, a person is the safer route.</p>");
          if (local.actions) bodyEl.appendChild(actionRow(local.actions));
          if (local.handoff) addHandoff();
          scrollDown();
        })
        .then(function () {
          busy = false;
          if (sendBtn) sendBtn.disabled = false;
          if (inputEl) inputEl.focus();
        });
    }

    function open(source) {
      if (!panel) buildPanel(); // lazy: nothing above is built until first open
      lastFocus = document.activeElement;
      panel.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      state = opened ? "conversation" : "welcome";
      opened = true;
      scrollDown();
      // Don't steal the keyboard on small screens until the user asks for it.
      var small = window.matchMedia && window.matchMedia("(max-width: 560px)").matches;
      (small ? panel.querySelector(".agent-panel__close") : inputEl).focus();
      track("opened", { source: source || "launcher", path: location.pathname });
    }

    function close(source) {
      if (!panel || panel.hidden) return;
      panel.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
      state = "closed";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      else launcher.focus();
      track("closed", { source: source || "button" });
    }

    launcher.hidden = false; // JS is alive, so the launcher is real
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", panel ? panel.id : "agent-panel-" + ID);
    launcher.addEventListener("click", function () {
      if (panel && !panel.hidden) close("launcher");
      else open("launcher");
    });
    track("launcher_impression", { path: location.pathname });

    // Contextual CTAs rendered into the page by build.js
    document.querySelectorAll('[data-agent-open="' + ID + '"]').forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        var seed = btn.getAttribute("data-agent-seed");
        open("context_cta");
        if (seed) setTimeout(function () { submit(seed); }, 120);
      });
    });

    var api = {
      id: ID,
      open: open,
      close: close,
      send: submit,
      get state() { return state; },
      adapter: adapter,
      context: pageContext,
      // Test seam: resolve an utterance against the knowledge layer without
      // touching the UI. Used by test/agents.smoke.mjs.
      _route: function (t) {
        var r = answerLocally(String(t || ""));
        return { id: r.id || (r.handoff ? "handoff" : "unknown"), handoff: !!r.handoff };
      },
    };
    window.NewportAgents = window.NewportAgents || {};
    window.NewportAgents[ID] = api;
    return api;
  }

  window.NewportAgent = { mount: mount, config: CFG, esc: esc };
})();
