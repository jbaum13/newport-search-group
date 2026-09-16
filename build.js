#!/usr/bin/env node
// ============================================================================
// Newport Search Group — static site generator (zero dependencies)
//   node build.js          -> writes dist/ (full static website)
//   node build.js --wix    -> also writes WIX-CONTENT.md (paste-ready copy)
// ============================================================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
// Short content hash for cache-busting asset URLs (changes only when file changes)
const fileVer = (p) => crypto.createHash("sha1").update(fs.readFileSync(p)).digest("hex").slice(0, 8);
const CSS_VER = fileVer(path.join(__dirname, "src/styles.css"));
const JS_VER = fileVer(path.join(__dirname, "src/main.js"));
const AGENT_CSS_VER = fileVer(path.join(__dirname, "src/agent.css"));
const AGENT_JS = { core: "agent-core.js", finn: "finn.js", beacon: "beacon.js" };
const AGENT_VER = Object.fromEntries(
  Object.entries(AGENT_JS).map(([k, f]) => [k, fileVer(path.join(__dirname, "src", f))])
);
const { site, nav, footer, pages, ctaBlocks, seoKeywords } = require("./src/content");
const { articles } = require("./src/articles");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
// Base path for sub-directory hosting (e.g. GitHub Pages project sites).
// Empty by default -> site is served from the domain root. Set via env, e.g.
//   BASE_PATH=/newport-search-group node build.js
// Agent endpoints. Each is a URL to a server YOU control, which holds the
// provider keys — never a key itself. Empty (the default) => that agent answers
// from its own knowledge layer.
//   FINN_ENDPOINT=https://api.example.com/finn BEACON_ENDPOINT=… node build.js
const AGENT_ENDPOINTS = {
  finn: (process.env.FINN_ENDPOINT || "").trim() || null,
  beacon: (process.env.BEACON_ENDPOINT || "").trim() || null,
};
let BASE = (process.env.BASE_PATH || "").trim();
if (BASE === "/") BASE = "";
BASE = BASE.replace(/\/+$/, ""); // no trailing slash
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Inline line-icons (stroke = currentColor) used as optional card accents.
// Reference one from content via a card's `icon:` key. Unknown keys render nothing.
const ICONS = {
  "direct-hire": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 11 2 2 4-4"/>',
  contract: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/>',
  rpo: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  executive: '<path d="m12 2 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17l.9-5.4L4.2 7.7l5.4-.8z"/>',
  cyber: '<path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5z"/><path d="M9 12l2 2 4-4"/>',
  energy: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  aerospace: '<path d="M12 2s5 3 5 10c0 3-1 5-1 5l-4 3-4-3s-1-2-1-5c0-7 5-10 5-10z"/><circle cx="12" cy="9" r="1.6"/><path d="M8 17l-3 3M16 17l3 3"/>',
  manufacturing: '<path d="M2 20h20M4 20V9l6 4V9l6 4V6l4 2v12"/><circle cx="6" cy="16" r="1"/><circle cx="12" cy="16" r="1"/>',
  technology: '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20M9 8h6M9 12h4"/>',
  staffing: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15 20a5 5 0 0 1 6.5-4.8"/>',
};
const icon = (k) => (ICONS[k] ? `<span class="card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg></span>` : "");

// True if an asset file exists in src/assets — lets sections degrade gracefully
// to a placeholder until the real image is dropped in.
const hasAsset = (f) => { try { return !!f && fs.existsSync(path.join(ROOT, "src/assets", f)); } catch { return false; } };

// Brand lockup: the official logo. `white` variant (wave + white wordmark) is
// used on dark surfaces (header/footer); `color` on light surfaces.
function brand(href = "/", variant = "white") {
  const file = variant === "color" ? "logo.png" : "logo-white.png";
  // White wordmark ships a 2x asset for crisp rendering at larger / high-DPI sizes.
  const srcset = variant === "color" ? "" : ` srcset="${BASE}/assets/logo-white.png 1x, ${BASE}/assets/logo-white@2x.png 2x"`;
  return `<a class="brand" href="${BASE}${href}" aria-label="${esc(site.name)} home"><img src="${BASE}/assets/${file}"${srcset} alt="${esc(site.name)}" width="279" height="142" /></a>`;
}

// ---- routing helpers -------------------------------------------------------
// "/" -> dist/index.html ; "/a/b" -> dist/a/b/index.html
const outFileFor = (route) => route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route.replace(/^\//, ""), "index.html");
const hrefFor = (route) => BASE + route; // pretty URLs; BASE prefixes sub-path hosts

// ---- shared chrome ---------------------------------------------------------
function renderHeader(active) {
  const item = (n) => {
    if (n.children) {
      const sub = n.children.map((c) => `<a href="${hrefFor(c.route)}">${esc(c.label)}</a>`).join("");
      return `<div class="nav__group"><span>${esc(n.label)} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span><div class="nav__menu">${sub}</div></div>`;
    }
    if (n.cta) return `<a class="btn btn--primary" href="${hrefFor(n.route)}">${esc(n.label)}</a>`;
    const cls = n.route === active ? ' class="is-active"' : "";
    return `<a${cls} href="${hrefFor(n.route)}">${esc(n.label)}</a>`;
  };
  return `<header class="site-header">
  <div class="container">
    ${brand("/")}
    <button class="nav-toggle" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
    <nav class="nav">${nav.map(item).join("")}</nav>
  </div>
</header>`;
}

function renderFooter() {
  const footerLink = (l) => {
    const ext = isExternal(l.route);
    const href = ext ? l.route : hrefFor(l.route);
    const extAttrs = ext ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}"${extAttrs}>${esc(l.label)}</a>`;
  };
  const cols = footer.columns.map((c) => `<div class="footer-col"><h4>${esc(c.title)}</h4>${c.links.map(footerLink).join("")}</div>`).join("");
  return `<footer class="site-footer"><div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        ${brand("/")}
        <p>${esc(footer.blurb)}</p>
      </div>
      ${cols}
    </div>
    <div class="footer-bottom">
      <span>© ${" "}${esc(site.name)}. All rights reserved.</span>
      ${footer.legal && footer.legal.length ? `<nav class="footer-legal" aria-label="Legal">${footer.legal.map(footerLink).join('<span aria-hidden="true">·</span>')}</nav>` : ""}
      <span class="tag">${esc(footer.tagline)}</span>
    </div>
  </div></footer>`;
}

// ---- buttons ---------------------------------------------------------------
const isExternal = (r) => /^https?:\/\//i.test(r || "");
// Absolute = already a full URL/scheme (http, mailto, tel) — must not get a BASE prefix.
const isAbsolute = (r) => /^(https?:|mailto:|tel:)/i.test(r || "");
const btn = (b, cls) => {
  if (!b) return "";
  const href = isAbsolute(b.route) ? b.route : hrefFor(b.route);
  const attrs = isExternal(b.route) ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a class="btn ${cls}" href="${href}"${attrs}>${esc(b.label)}</a>`;
};

// ---- articles ---------------------------------------------------------------
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmtDate = (iso) => { const [y,m,d] = iso.split("-").map(Number); return `${MONTHS[m-1]} ${d}, ${y}`; };
const sortedArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date));
const articleRoute = (a) => `/resources/${a.slug}`;

// Article data -> page object (rendered via the `article` branch in renderPage)
const articlePages = sortedArticles.map((a) => ({
  route: articleRoute(a),
  title: `${a.title} | Newport Search Group`,
  description: a.excerpt,
  article: a,
}));

function renderArticleBody(a) {
  const blocks = a.body.map((b) => {
    if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
    if (b.ul) return `<ul>${b.ul.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`;
    return `<p>${esc(b.p)}</p>`;
  }).join("\n");
  return `<section class="breadcrumb-hero"><div class="container">
      <span class="eyebrow">Resources / ${esc(a.category)}</span>
      <h1>${esc(a.title)}</h1>
      <p class="article-meta">${fmtDate(a.date)} · ${esc(a.readTime)} read · ${esc(site.name)}</p>
    </div></section>
    <article class="section"><div class="container"><div class="prose">
      ${blocks}
      <p class="prose-back"><a href="${hrefFor("/resources")}">&larr; All articles</a></p>
    </div></div></article>
    ${renderers.cta(ctaBlocks.buildYourTeam)}`;
}

// Wrap the last word of a heading in a gradient accent span
const gradLast = (text) => {
  const t = esc(text);
  const i = t.lastIndexOf(" ");
  return i === -1 ? `<span class="grad">${t}</span>` : `${t.slice(0, i + 1)}<span class="grad">${t.slice(i + 1)}</span>`;
};

// ---- section renderers -----------------------------------------------------
function head(s, darkLead) {
  const eb = s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : "";
  const h = s.headline ? `<h2>${esc(s.headline)}</h2>` : "";
  const b = s.body ? `<p class="lead">${esc(s.body)}</p>` : "";
  return `<div class="section__head">${eb}${h}${b}</div>`;
}

const renderers = {
  hero(s) {
    const stats = s.stats ? `<div class="hero-stats">${s.stats.map((x) => `<div><div class="num">${esc(x.value)}</div><div class="lbl">${esc(x.label)}</div></div>`).join("")}</div>` : "";
    return `<section class="hero"><div class="container">
      ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
      <h1>${gradLast(s.headline)}</h1>
      <p class="lead">${esc(s.sub)}</p>
      <div class="btn-row">${btn(s.primary, "btn--primary")}${btn(s.secondary, "btn--ghost")}</div>
      ${stats}
    </div></section>`;
  },
  breadcrumbHero(s) {
    return `<section class="breadcrumb-hero"><div class="container">
      ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
      <h1>${esc(s.headline)}</h1>
      ${s.sub ? `<p class="lead">${esc(s.sub)}</p>` : ""}
      <div class="btn-row">${btn(s.primary, "btn--primary")}${btn(s.secondary, "btn--ghost")}</div>
    </div></section>`;
  },
  intro(s) {
    return `<section class="section section--center" ${s.id ? `id="${s.id}"` : ""}><div class="container">
      <div class="section__head">
        ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
        <h2>${esc(s.headline)}</h2>
        ${s.body ? `<p class="lead">${esc(s.body)}</p>` : ""}
      </div>
      ${s.cta ? `<div class="btn-row" style="justify-content:center">${btn(s.cta, "btn--primary")}</div>` : ""}
    </div></section>`;
  },
  legal(s) {
    const blocks = (s.body || []).map((b) => {
      if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
      if (b.ul) return `<ul>${b.ul.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`;
      if (b.contact) {
        const em = b.contact.email ? `<p><strong>Email:</strong> <a href="mailto:${esc(b.contact.email)}">${esc(b.contact.email)}</a></p>` : "";
        const web = b.contact.website ? `<p><strong>Website:</strong> <a href="https://${esc(b.contact.website)}">${esc(b.contact.website)}</a></p>` : "";
        return `<p><strong>${esc(b.contact.name || site.name)}</strong></p>${em}${web}`;
      }
      return `<p>${esc(b.p)}</p>`;
    }).join("\n");
    return `<section class="section"><div class="container"><div class="prose">
      ${s.updated ? `<p class="article-meta" style="margin-bottom:1.8rem">${esc(s.updated)}</p>` : ""}
      ${blocks}
    </div></div></section>`;
  },
  cards(s) {
    const n = s.cards.length % 4 === 0 ? 4 : (s.cards.length % 3 === 0 || s.cards.length > 4 ? 3 : 2);
    const cards = s.cards.map((c) => {
      const inner = `${icon(c.icon)}<h3>${esc(c.title)}</h3><p>${esc(c.body)}</p>${c.route ? `<span class="arrow">Learn more →</span>` : ""}`;
      return c.route ? `<a class="card" href="${hrefFor(c.route)}">${inner}</a>` : `<div class="card">${inner}</div>`;
    }).join("");
    return `<section class="section ${s.tint ? "section--tint" : ""}" ${s.id ? `id="${s.id}"` : ""}><div class="container">
      ${head(s)}<div class="grid grid--${n}">${cards}</div>
    </div></section>`;
  },
  list(s) {
    const pills = s.items.map((i) => `<span class="pill">${esc(i)}</span>`).join("");
    return `<section class="section section--tint" ${s.id ? `id="${s.id}"` : ""}><div class="container">
      ${head(s)}<div class="pills">${pills}</div>
    </div></section>`;
  },
  split(s) {
    const bullets = s.bullets ? `<ul class="checks">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : "";
    return `<section class="section" ${s.id ? `id="${s.id}"` : ""}><div class="container"><div class="split">
      <div>
        ${s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : ""}
        <h2>${esc(s.headline)}</h2>
        ${s.body ? `<p class="lead">${esc(s.body)}</p>` : ""}
        ${s.cta ? `<div class="btn-row">${btn(s.cta, "btn--primary")}</div>` : ""}
      </div>
      <div class="split__panel">${bullets || `<p class="muted">${esc(s.body || "")}</p>`}</div>
    </div></div></section>`;
  },
  characters(s) {
    const cards = s.characters.map((c) => {
      const media = hasAsset(c.img)
        ? `<img class="char__img" src="${BASE}/assets/${c.img}" alt="${esc(c.imgAlt || `${c.name}, ${c.role}`)}" loading="lazy" />`
        : `<div class="char__ph"><span>${esc(c.name)}</span><small>add <code>src/assets/${esc(c.img)}</code></small></div>`;
      const facts = [
        c.mission && ["Mission", c.mission],
        c.ability && ["Special ability", c.ability],
      ].filter(Boolean).map(([k, v]) => `<div class="char__fact"><span class="char__k">${esc(k)}</span><span>${esc(v)}</span></div>`).join("");
      return `<article class="char" data-accent="${esc(c.accent || "blue")}">
        <div class="char__media">${media}</div>
        <div class="char__body">
          <div class="char__role">${esc(c.role)}</div>
          <h3 class="char__name">${esc(c.name)}</h3>
          <span class="char__side">${esc(c.side)}</span>
          ${c.tagline ? `<p class="char__tag">${esc(c.tagline)}</p>` : ""}
          ${facts ? `<div class="char__facts">${facts}</div>` : ""}
          ${c.signature ? `<p class="char__sig">&ldquo;${esc(c.signature)}&rdquo;</p>` : ""}
        </div>
      </article>`;
    }).join("");
    const cls = `section ${s.dark === false ? "" : "section--dark"} ${s.center ? "section--center" : ""}`.trim();
    return `<section class="${cls}" ${s.id ? `id="${s.id}"` : ""}><div class="container">
      ${head(s)}
      <div class="chars">${cards}</div>
      ${s.unity ? `<p class="chars__unity">${esc(s.unity)}</p>` : ""}
      ${(s.cta || s.secondary) ? `<div class="btn-row" style="justify-content:center;margin-top:1.6rem">${btn(s.cta, "btn--primary")}${btn(s.secondary, "btn--ghost")}</div>` : ""}
    </div></section>`;
  },
  stats(s) {
    const items = s.items.map((x) => `<div class="stat"><div class="num">${esc(x.value)}</div><div class="lbl">${esc(x.label)}</div></div>`).join("");
    return `<section class="section section--dark"><div class="container">
      ${head(s)}<div class="statband">${items}</div>
    </div></section>`;
  },
  articleList(s) {
    const cards = sortedArticles.map((a) => `<a class="card article-card" href="${hrefFor(articleRoute(a))}">
        <span class="cat">${esc(a.category)}</span>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.excerpt)}</p>
        <span class="arrow">${fmtDate(a.date)} · ${esc(a.readTime)} — Read →</span>
      </a>`).join("");
    return `<section class="section section--tint"><div class="container">
      ${head(s)}<div class="grid grid--3">${cards}</div>
    </div></section>`;
  },
  logos(s) {
    const items = s.items.map((i) => `<span>${esc(i)}</span>`).join("");
    return `<section class="section ${s.dark ? "section--dark" : "section--tint"}" style="padding-block: clamp(36px,5vw,60px)"><div class="container">
      <div class="logostrip">
        <div class="strip-label">${esc(s.label)}</div>
        <div class="strip-items">${items}</div>
      </div>
    </div></section>`;
  },
  testimonial(s) {
    return `<section class="section ${s.dark ? "section--dark" : ""}"><div class="container">
      <figure class="testimonial">
        <blockquote>${esc(s.quote)}</blockquote>
        <figcaption><strong>${esc(s.name)}</strong>${esc(s.role)}</figcaption>
      </figure>
    </div></section>`;
  },
  cta(s) {
    return `<section class="section section--dark"><div class="container"><div class="ctaband">
      <h2>${esc(s.headline)}</h2>
      <p>${esc(s.body)}</p>
      <div class="btn-row">${btn(s.primary, "btn--primary")}${btn(s.secondary, "btn--ghost")}</div>
    </div></div></section>`;
  },
  // Contextual invitation to open an agent. `seed` pre-sends a first question
  // so the panel opens already on topic. The button ships hidden and the agent
  // runtime reveals it, so no-JS visitors never see a dead control.
  agentCta(s) {
    const id = s.agent || "beacon";
    const a = AGENTS[id];
    const cls = `section ${s.dark ? "section--dark" : ""} ${s.tint ? "section--tint" : ""}`.trim();
    return `<section class="${cls}"><div class="container">
      ${s.headline || s.eyebrow ? head(s) : ""}
      <div class="agent-cta" data-agent="${id}">
        <span class="agent-cta__avatar">${agentAvatar(id)}</span>
        <div class="agent-cta__body">
          <h3>${esc(s.title || `Ask ${a.name}`)}</h3>
          <p>${esc(s.body || "")}</p>
        </div>
        <button type="button" class="btn btn--primary" data-agent-open="${id}"${s.seed ? ` data-agent-seed="${esc(s.seed)}"` : ""} hidden>${esc(s.cta || `Ask ${a.name}`)}</button>
      </div>
    </div></section>`;
  },
  ctaRef(s) { return renderers.cta(ctaBlocks[s.ref]); },
  jobsearch(s) {
    return `<section class="section section--tint"><div class="container">
      ${head(s)}
      <form class="jobsearch" data-demo onsubmit="return false">
        <input type="text" placeholder="Keyword, title, or skill" aria-label="Keyword" />
        <select aria-label="Category">
          <option>All categories</option><option>Engineering</option><option>Manufacturing</option>
          <option>Cybersecurity</option><option>Executive</option><option>Staffing Industry</option>
          <option>Sales</option><option>Operations</option>
        </select>
        <button class="btn btn--primary" type="submit">Search</button>
      </form>
      <p class="form-status muted" style="margin-top:1rem"></p>
    </div></section>`;
  },
  form() {
    return `<section class="section"><div class="container"><div class="form-wrap">
      <form class="form" data-demo>
        <div class="grid2">
          <div class="field"><label for="name">Name</label><input id="name" name="name" required /></div>
          <div class="field"><label for="company">Company</label><input id="company" name="company" /></div>
        </div>
        <div class="grid2">
          <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required /></div>
          <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" /></div>
        </div>
        <div class="field"><label for="hiringNeed">Hiring Need</label>
          <select id="hiringNeed" name="hiringNeed">
            <option>Request Talent</option>
            <option>Schedule a Consultation</option>
            <option>Submit Resume / Candidate</option>
            <option>Staffing Firm — Hire Recruiters</option>
            <option>RPO / Embedded Recruiting</option>
            <option>Executive Search</option>
            <option>Newsletter Subscription</option>
            <option>Other</option>
          </select>
        </div>
        <div class="field"><label for="message">Message</label><textarea id="message" name="message" rows="5"></textarea></div>
        <div><button class="btn btn--primary" type="submit">Send</button></div>
        <p class="form-status form-note"></p>
      </form>
      <aside class="contact-aside">
        <h3>Talk to a recruiter</h3>
        <p class="muted">Prefer to reach us directly? We respond fast.</p>
        <p><strong>Email</strong><br><a href="mailto:${esc(site.emailTo || site.email)}">${esc(site.email)}</a></p>
        <p><strong>Phone</strong><br><a href="tel:${esc(site.phone.replace(/[^\d+]/g, ""))}">${esc(site.phone)}</a></p>
        <hr style="border:0;border-top:1px solid var(--line-dark);margin:1.2rem 0" />
        <p class="muted">${esc(site.tagline)}</p>
      </aside>
    </div></div></section>`;
  },
};


// ---- Agents (Finn & Beacon) ------------------------------------------------
// One page mounts one agent. Candidates get Finn; everyone else — employers,
// which is most of this site — gets Beacon. Two floating launchers on one page
// would be noise, so routing is explicit and exclusive.
const AGENTS = {
  finn: { name: "Finn", role: "Candidate Experience Agent", avatar: "finn-avatar.png", cta: "Ask Finn" },
  beacon: { name: "Beacon", role: "Market Intelligence Agent", avatar: "beacon-avatar.png", cta: "Ask Beacon" },
};
const FINN_ROUTES = ["/jobs", "/contact", "/resources"];
const agentForRoute = (route = "/") =>
  FINN_ROUTES.some((r) => route === r || route.startsWith(r + "/")) ? "finn" : "beacon";

// Line-icon fallback, kept for any surface where the portrait isn't wanted.
const FINN_DOLPHIN =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3.2 10.4c3.6-5 8.6-6.6 13.4-5.4 1.9.5 3.3 1.7 4.2 3.3-1.6-.4-2.9-.2-3.9.6"/>' +
  '<path d="M20.8 8.3c.7 3.4-.6 6.8-3.4 9-2.6 2-6 2.7-9.2 1.9-2.2-.6-4-1.9-5.2-3.8 2 .5 3.9.2 5.5-.9"/>' +
  '<path d="M8.5 14.5c-1.9.6-3.8.2-5.3-1.1"/><circle cx="16.6" cy="9.7" r=".9" fill="currentColor" stroke="none"/></svg>';

const agentAvatar = (id) =>
  `<img src="${BASE}/assets/${AGENTS[id].avatar}" alt="" width="128" height="128" loading="lazy" />`;

// The launcher ships hidden and the runtime reveals it, so a no-JS visitor
// never sees a control that does nothing.
function renderAgentLauncher(id) {
  const a = AGENTS[id];
  return `<button type="button" class="agent-launcher" data-agent="${id}" hidden aria-label="Open ${esc(a.name)}, Newport's ${esc(a.role.toLowerCase())}">
  <span class="agent-launcher__avatar">${agentAvatar(id)}</span>
  <span class="agent-launcher__label">${esc(a.cta)}</span>
  <span class="agent-launcher__dot" aria-hidden="true"></span>
</button>`;
}

// Page context handed to the agent adapter, read off <main> at runtime.
function agentContextAttrs(page) {
  const r = page.route || "/";
  let kind = "general";
  if (r === "/jobs") kind = "job";
  else if (r === "/contact") kind = "candidate";
  else if (r.startsWith("/industries")) kind = "industry";
  else if (r.startsWith("/staffing-solutions")) kind = "service";
  else if (r.startsWith("/resources")) kind = "resource";
  const seg = (prefix) => (r.startsWith(prefix + "/") ? r.slice(prefix.length + 1) : "");
  const industry = seg("/industries");
  const service = seg("/staffing-solutions");
  return ` data-agent-context="${kind}"` +
    (industry ? ` data-industry="${esc(industry)}"` : "") +
    (service ? ` data-service="${esc(service)}"` : "") +
    (page.jobTitle ? ` data-job-title="${esc(page.jobTitle)}"` : "") +
    (page.jobId ? ` data-job-id="${esc(page.jobId)}"` : "");
}

function agentConfigScript() {
  const cfg = { basePath: BASE, email: site.email, endpoints: AGENT_ENDPOINTS };
  return `<script>window.NEWPORT_AGENT_CONFIG=${JSON.stringify(cfg)};</script>`;
}

function renderPage(page) {
  const body = page.article
    ? renderArticleBody(page.article)
    : page.sections.map((s) => (renderers[s.type] || (() => ""))(s)).join("\n");
  const kw = page.route === "/" ? seoKeywords.join(", ") : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}" />
${kw ? `<meta name="keywords" content="${esc(kw)}" />\n` : ""}<link rel="canonical" href="https://${site.domain}${page.route === "/404.html" ? "/" : page.route}" />
<meta property="og:title" content="${esc(page.title)}" />
<meta property="og:description" content="${esc(page.description)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://${site.domain}${page.route === "/404.html" ? "/" : page.route}" />
<meta property="og:image" content="https://${site.domain}/assets/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://${site.domain}/assets/og-image.png" />
<link rel="preload" href="${BASE}/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
<link rel="icon" type="image/png" href="${BASE}/assets/favicon.png" />
<link rel="stylesheet" href="${BASE}/styles.css?v=${CSS_VER}" />
<link rel="stylesheet" href="${BASE}/agent.css?v=${AGENT_CSS_VER}" />
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "Organization", name: site.name,
    description: site.positioning, url: `https://${site.domain}`, email: site.email, telephone: site.phone,
    slogan: site.tagline,
  })}</script>
</head>
<body>
${renderHeader(page.route)}
<main${agentContextAttrs(page)}>
${body}
</main>
${renderFooter()}
${renderAgentLauncher(agentForRoute(page.route))}
<script src="${BASE}/main.js?v=${JS_VER}"></script>
${agentConfigScript()}
<script src="${BASE}/agent-core.js?v=${AGENT_VER.core}" defer></script>
<script src="${BASE}/${AGENT_JS[agentForRoute(page.route)]}?v=${AGENT_VER[agentForRoute(page.route)]}" defer></script>
</body>
</html>`;
}

// ---- writers ---------------------------------------------------------------
function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function writeFile(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); }

function buildSite() {
  rmrf(DIST);
  fs.mkdirSync(DIST, { recursive: true });
  fs.copyFileSync(path.join(ROOT, "src/styles.css"), path.join(DIST, "styles.css"));
  fs.copyFileSync(path.join(ROOT, "src/main.js"), path.join(DIST, "main.js"));
  fs.copyFileSync(path.join(ROOT, "src/agent.css"), path.join(DIST, "agent.css"));
  for (const f of Object.values(AGENT_JS)) fs.copyFileSync(path.join(ROOT, "src", f), path.join(DIST, f));
  fs.mkdirSync(path.join(DIST, "assets", "fonts"), { recursive: true });
  for (const a of ["logo.png", "logo-white.png", "logo-white@2x.png", "favicon.png", "og-image.png", "duke.png", "scout.png", "finn.png", "finn-avatar.png", "beacon.png", "beacon-avatar.png"]) {
    const src = path.join(ROOT, "src/assets", a);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIST, "assets", a)); // optional assets skipped until added
  }
  fs.copyFileSync(path.join(ROOT, "src/assets/fonts/inter-var.woff2"), path.join(DIST, "assets/fonts/inter-var.woff2"));
  const allPages = [...pages, ...articlePages];
  for (const page of allPages) writeFile(outFileFor(page.route), renderPage(page));
  // Branded 404 (GitHub Pages serves /404.html for unknown routes)
  writeFile(path.join(DIST, "404.html"), renderPage({
    route: "/404.html",
    title: "Page Not Found | " + site.name,
    description: "That page doesn't exist — but the talent you're looking for does.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "404",
        headline: "This page went off the market",
        sub: "Like the best candidates, it's no longer available. Let's get you somewhere useful.",
        primary: { label: "Back to Home", route: "/" },
        secondary: { label: "Contact Us", route: "/contact" },
      },
    ],
  }));
  // Legacy URL: the agents page was /agentic-platform/duke-and-scout before
  // Finn joined. GitHub Pages has no server-side redirects, so serve a
  // canonical-tagged meta-refresh stub to keep old links and SEO intact.
  const MOVED_FROM = "/agentic-platform/duke-and-scout";
  const MOVED_TO = "/agentic-platform/meet-the-agents";
  writeFile(outFileFor(MOVED_FROM), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Meet the Agents | ${esc(site.name)}</title>
<link rel="canonical" href="https://${site.domain}${MOVED_TO}" />
<meta name="robots" content="noindex, follow" />
<meta http-equiv="refresh" content="0; url=${BASE}${MOVED_TO}" />
</head>
<body>
<p>This page moved to <a href="${BASE}${MOVED_TO}">Meet the Agents</a>.</p>
<script>location.replace(${JSON.stringify(BASE + MOVED_TO)});</script>
</body>
</html>`);

  // sitemap + robots
  const urls = allPages.map((p) => `  <url><loc>https://${site.domain}${p.route}</loc></url>`).join("\n");
  writeFile(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: https://${site.domain}/sitemap.xml\n`);
  // Custom domain for GitHub Pages (apex). www redirects to it automatically.
  if (site.domain) writeFile(path.join(DIST, "CNAME"), site.domain + "\n");
  console.log(`✓ Built ${allPages.length} pages (${articlePages.length} articles) → dist/`);
}

// ---- Wix export (paste-ready Markdown) ------------------------------------
function buildWix() {
  const L = [];
  L.push(`# ${site.name} — Wix Content & Setup Guide`);
  L.push(`\n_Paste-ready copy for the Wix Editor. One section per heading. Generated from \`src/content.js\` — keep this and the website in sync by re-running \`node build.js --wix\`._\n`);
  L.push(`**Category:** ${site.category}  `);
  L.push(`**Tagline:** ${site.tagline}\n`);

  L.push(`\n## Site setup\n`);
  L.push(`**Business name:** ${site.name}  `);
  L.push(`**Primary email:** ${site.email}  `);
  L.push(`**Phone:** ${site.phone}\n`);
  L.push(`**Theme colors** (Wix → Site Design → Color):`);
  L.push(`- Primary / Background dark: \`#0a1124\` (navy)`);
  L.push(`- Surface: \`#0e1830\` / \`#142142\``);
  L.push(`- Accent (buttons/links): \`#2f7bff\` (electric blue)`);
  L.push(`- Neutral text on dark: \`#9aa7bd\` ; light surface: \`#f5f7fb\``);
  L.push(`\n**Fonts:** Inter (Headings 700–800, Body 400–500).`);
  L.push(`\n**Logo:** Upload \`src/assets/logo.png\` (full-color, transparent — for light backgrounds) and \`src/assets/logo-white.png\` (white wordmark — for the dark header/footer). Favicon: \`src/assets/favicon.png\` (wave mark).`);

  L.push(`\n## Primary navigation (Wix menu)\n`);
  nav.forEach((n) => {
    L.push(`- **${n.label}** → \`${n.route}\``);
    if (n.children) n.children.forEach((c) => L.push(`  - ${c.label} → \`${c.route}\``));
  });

  L.push(`\n## SEO keywords (per Wix SEO panel)\n`);
  L.push(seoKeywords.map((k) => `\`${k}\``).join(" · "));

  // page-by-page
  for (const page of pages) {
    L.push(`\n\n---\n\n## Page: ${page.title.split("|")[0].trim()}`);
    L.push(`**URL slug:** \`${page.route}\`  `);
    L.push(`**SEO title:** ${page.title}  `);
    L.push(`**Meta description:** ${page.description}\n`);
    page.sections.forEach((raw, i) => {
      const s = raw.type === "ctaRef" ? ctaBlocks[raw.ref] : raw;
      const t = raw.type === "ctaRef" ? "cta" : s.type;
      L.push(`### Section ${i + 1} — ${labelFor(t)}`);
      if (s.eyebrow) L.push(`*Eyebrow:* ${s.eyebrow}  `);
      if (s.headline) L.push(`**${s.headline}**  `);
      if (s.sub) L.push(s.sub);
      if (s.body) L.push(s.body);
      if (s.bullets) s.bullets.forEach((b) => L.push(`- ${b}`));
      if (s.items) s.items.forEach((it) => L.push(`- ${it}`));
      if (s.cards) s.cards.forEach((c) => L.push(`- **${c.title}** — ${c.body}${c.route ? ` (links to \`${c.route}\`)` : ""}`));
      if (s.stats) s.stats.forEach((x) => L.push(`- **${x.value}** — ${x.label}`));
      const btns = [s.primary, s.secondary, s.cta].filter(Boolean);
      if (btns.length) L.push(`Buttons: ${btns.map((b) => `[${b.label}] → \`${b.route}\``).join(" · ")}`);
      if (t === "form") L.push(`Form fields: Name, Company, Email, Phone, Hiring Need (dropdown), Message. Connect to Wix Forms → email + CRM.`);
      L.push("");
    });
  }
  writeFile(path.join(ROOT, "WIX-CONTENT.md"), L.join("\n") + "\n");
  console.log("✓ Wrote WIX-CONTENT.md");
}
function labelFor(t) {
  return ({ hero: "Hero", breadcrumbHero: "Page header", intro: "Intro / statement",
    cards: "Card grid", list: "Tag/pill list", split: "Split feature", stats: "Stats band",
    cta: "Call to action", form: "Contact form", jobsearch: "Job search" })[t] || t;
}

// ---- main ------------------------------------------------------------------
buildSite();
if (process.argv.includes("--wix")) buildWix();
