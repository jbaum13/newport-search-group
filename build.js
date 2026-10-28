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
const { fetchJobs } = require("./src/jobs-feed");
// Filled by the job feed before the site renders (see main at the bottom).
let JOBS = { ok: false, jobs: [] };

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
      <span>© ${" "}${esc(site.legalName || site.name)}. All rights reserved.</span>
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

// Article share row. LinkedIn pulls the title/description/image from the page's
// Open Graph tags, so the shared card is populated automatically. Copy-link is
// wired in src/main.js (delegated click on [data-copy-link]).
function shareRow(a) {
  const url = `https://${site.domain}${articleRoute(a)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return `<div class="share">
      <span class="share__label">Share this article</span>
      <div class="share__btns">
        <a class="share-btn share-btn--li" href="${li}" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
          <span>Share on LinkedIn</span>
        </a>
        <button class="share-btn share-btn--copy" type="button" data-copy-link="${url}" aria-label="Copy link to article">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15l6-6"/><path d="M11 6l1-1a5 5 0 0 1 7 7l-1 1"/><path d="M13 18l-1 1a5 5 0 0 1-7-7l1-1"/></svg>
          <span class="share-btn__t">Copy link</span>
        </button>
      </div>
    </div>`;
}
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
      ${shareRow(a)}
      <p class="prose-back"><a href="${hrefFor("/resources")}">&larr; All articles</a></p>
    </div></div></article>
    ${renderers.cta(ctaBlocks.buildYourTeam)}`;
}

// ---- jobs (from the Manatal career page — src/jobs-feed.js) -----------------
const jobRoute = (j) => `/jobs/${j.slug}`;
const jobMeta = (j) => [j.location, j.employmentType].filter(Boolean).map(esc).join(" · ");
// Job data -> page object (rendered via the `job` branch in renderPage)
const jobPages = () => JOBS.jobs.map((j) => ({
  route: jobRoute(j),
  title: `${j.title}${j.city ? ` — ${j.city}` : ""} | Jobs | ${site.name}`,
  description: j.summary || `${j.title} — an open role represented by ${site.name}.`,
  job: j,
  jobTitle: j.title,
  jobId: j.id,
}));
// Apply opens Manatal's hosted form for this job (same tab), so the
// application lands in the ATS as a candidate on the right job.
const applyBtn = (j, cls = "btn--primary") => `<a class="btn ${cls}" href="${esc(j.applyUrl)}" rel="noopener">Apply now</a>`;

function renderJobBody(j) {
  const posted = j.datePosted ? `Posted ${fmtDate(j.datePosted.slice(0, 10))}` : "";
  const meta = [jobMeta(j), posted].filter(Boolean).join(" · ");
  const jobsPage = pages.find((p) => p.route === "/jobs");
  const finn = jobsPage && jobsPage.sections.find((s) => s.type === "agentCta");
  return `<section class="breadcrumb-hero"><div class="container">
      <span class="eyebrow">Jobs${j.region ? ` / ${esc(j.region)}` : ""}</span>
      <h1>${esc(j.title)}</h1>
      ${meta ? `<p class="article-meta">${meta}</p>` : ""}
      <div class="btn-row">${applyBtn(j)}<a class="btn btn--ghost" href="${hrefFor("/jobs")}">All open roles</a></div>
    </div></section>
    <article class="section"><div class="container"><div class="prose job-desc">
      ${j.descriptionHtml}
      <div class="job-apply">
        <div><h3>Interested in this role?</h3><p>Applying takes a few minutes. Your application goes straight to the Newport recruiter running this search.</p></div>
        ${applyBtn(j)}
      </div>
      <p class="prose-back"><a href="${hrefFor("/jobs")}">&larr; All open roles</a></p>
    </div></div></article>
    ${finn ? renderers.agentCta(finn) : ""}`;
}

// schema.org JobPosting for a job page — makes it eligible for Google's job results.
function jobPostingLd(j) {
  const ld = {
    "@context": "https://schema.org", "@type": "JobPosting",
    title: j.title, description: j.descriptionHtml, identifier: { "@type": "PropertyValue", name: site.name, value: j.id },
    datePosted: j.datePosted || undefined, validThrough: j.validThrough || undefined,
    employmentType: j.employmentTypeRaw.length ? j.employmentTypeRaw : undefined,
    hiringOrganization: { "@type": "Organization", name: site.name, sameAs: `https://${site.domain}`, logo: `https://${site.domain}/assets/logo.png` },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: j.city || undefined, addressRegion: j.region || undefined, addressCountry: j.country || undefined } },
    directApply: false,
    url: `https://${site.domain}${jobRoute(j)}`,
  };
  // "</script>" inside a description must not close the tag early.
  return JSON.stringify(ld).replace(/</g, "\\u003c");
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
  // Open roles from the job feed. The filter ships hidden and main.js reveals
  // it, so no-JS visitors still get the full list of links.
  jobsearch(s) {
    const careers = site.careersPage;
    const resume = btn({ label: "Submit Your Resume", route: "/contact?intent=candidate" }, "btn--ghost");
    let inner;
    if (!JOBS.ok) {
      inner = `<div class="jobs-empty"><p>Browse every open role and apply online on our career page.</p>
        <div class="btn-row">${btn({ label: "View open roles", route: careers }, "btn--primary")}${resume}</div></div>`;
    } else if (!JOBS.jobs.length) {
      inner = `<div class="jobs-empty"><p>No roles are posted right now. New searches open every week — send us your resume and we'll reach out when one fits.</p>
        <div class="btn-row">${resume}</div></div>`;
    } else {
      const regions = [...new Set(JOBS.jobs.map((j) => j.region).filter(Boolean))].sort();
      const list = JOBS.jobs.map((j) => `<a class="card job-card" href="${hrefFor(jobRoute(j))}" data-job-text="${esc([j.title, j.location, j.employmentType, j.summary].join(" ").toLowerCase())}" data-job-region="${esc(j.region)}">
          <h3>${esc(j.title)}</h3>
          ${jobMeta(j) ? `<p class="job-card__meta">${jobMeta(j)}</p>` : ""}
          ${j.summary ? `<p>${esc(j.summary)}${j.summary.length >= 220 ? "…" : ""}</p>` : ""}
          <span class="arrow">View role →</span>
        </a>`).join("");
      inner = `<form class="jobsearch" data-job-filter role="search" hidden onsubmit="return false">
        <input type="search" name="q" placeholder="Keyword, title, or skill" aria-label="Keyword" />
        <select name="region" aria-label="Location">
          <option value="">All locations</option>${regions.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("")}
        </select>
      </form>
      <p class="jobs-count muted" aria-live="polite" data-job-count>${JOBS.jobs.length} open ${JOBS.jobs.length === 1 ? "role" : "roles"}</p>
      <div class="jobs-list">${list}</div>
      <p class="jobs-none muted" data-job-none hidden>No roles match that search. Try a different keyword or location.</p>`;
    }
    return `<section class="section section--tint" id="open-roles"><div class="container">
      ${head(s)}
      ${inner}
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
  beacon: { name: "Beacon", role: "AI Orchestrator", avatar: "beacon-avatar.png", cta: "Ask Beacon" },
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
  if (r === "/jobs" || r.startsWith("/jobs/")) kind = "job";
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
    : page.job
    ? renderJobBody(page.job)
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
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} — Resources" href="https://${site.domain}/feed.xml" />
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
${page.job ? `<script type="application/ld+json">${jobPostingLd(page.job)}</script>\n` : ""}</head>
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
  for (const a of ["logo.png", "logo-white.png", "logo-white@2x.png", "email-signature-logo.png", "favicon.png", "og-image.png", "duke.png", "scout.png", "finn.png", "finn-avatar.png", "beacon.png", "beacon-avatar.png"]) {
    const src = path.join(ROOT, "src/assets", a);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIST, "assets", a)); // optional assets skipped until added
  }
  fs.copyFileSync(path.join(ROOT, "src/assets/fonts/inter-var.woff2"), path.join(DIST, "assets/fonts/inter-var.woff2"));
  const allPages = [...pages, ...articlePages, ...jobPages()];
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
  // Legacy URLs → canonical-tagged meta-refresh stubs. GitHub Pages has no
  // server-side redirects, so serve a stub at each old path to keep inbound
  // links and SEO intact. Add a row whenever a route or article slug changes.
  const REDIRECTS = [
    // The agents page was /agentic-platform/duke-and-scout before Finn joined.
    { from: "/agentic-platform/duke-and-scout", to: "/agentic-platform/meet-the-agents", label: "Meet the Agents" },
    // Article retitled when the brand moved to "AI-native recruiting platform".
    { from: "/resources/what-is-an-agentic-staffing-company", to: "/resources/what-is-an-ai-native-recruiting-platform", label: "What Is an AI-Native Recruiting Platform?" },
  ];
  for (const r of REDIRECTS) {
    writeFile(outFileFor(r.from), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(r.label)} | ${esc(site.name)}</title>
<link rel="canonical" href="https://${site.domain}${r.to}" />
<meta name="robots" content="noindex, follow" />
<meta http-equiv="refresh" content="0; url=${BASE}${r.to}" />
</head>
<body>
<p>This page moved to <a href="${BASE}${r.to}">${esc(r.label)}</a>.</p>
<script>location.replace(${JSON.stringify(BASE + r.to)});</script>
</body>
</html>`);
  }

  // sitemap + robots
  const urls = allPages.map((p) => `  <url><loc>https://${site.domain}${p.route}</loc></url>`).join("\n");
  writeFile(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: https://${site.domain}/sitemap.xml\n`);
  // RSS feed of articles — powers auto-posting (Buffer / n8n RSS trigger) and readers.
  const feedItems = sortedArticles.map((a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>https://${site.domain}${articleRoute(a)}</link>
      <guid isPermaLink="true">https://${site.domain}${articleRoute(a)}</guid>
      <pubDate>${new Date(a.date + "T09:00:00Z").toUTCString()}</pubDate>
      <category>${esc(a.category)}</category>
      <description>${esc(a.excerpt)}</description>
    </item>`).join("\n");
  writeFile(path.join(DIST, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} — Resources</title>
    <link>https://${site.domain}/resources</link>
    <atom:link href="https://${site.domain}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Insights from the front lines of AI-native recruiting.</description>
    <language>en-us</language>
${feedItems}
  </channel>
</rss>
`);
  // Custom domain for GitHub Pages (apex). www redirects to it automatically.
  if (site.domain) writeFile(path.join(DIST, "CNAME"), site.domain + "\n");
  const jobsNote = JOBS.ok ? `${JOBS.jobs.length} jobs` : JOBS.skipped ? "job feed skipped" : "job feed unavailable";
  console.log(`✓ Built ${allPages.length} pages (${articlePages.length} articles, ${jobsNote}) → dist/`);
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
(async () => {
  JOBS = await fetchJobs(site.careersPage);
  // Deploys set this so a feed outage never publishes a /jobs with no roles —
  // the build fails and GitHub Pages keeps serving the last good deploy.
  if (process.env.JOBS_FEED_REQUIRED === "1" && !JOBS.ok) {
    console.error("✗ Job feed required (JOBS_FEED_REQUIRED=1) but unavailable — not building.");
    process.exit(1);
  }
  buildSite();
  if (process.argv.includes("--wix")) buildWix();
})().catch((err) => { console.error(err); process.exit(1); });
