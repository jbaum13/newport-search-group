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
const { site, nav, footer, pages, ctaBlocks, seoKeywords } = require("./src/content");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
// Base path for sub-directory hosting (e.g. GitHub Pages project sites).
// Empty by default -> site is served from the domain root. Set via env, e.g.
//   BASE_PATH=/newport-search-group node build.js
let BASE = (process.env.BASE_PATH || "").trim();
if (BASE === "/") BASE = "";
BASE = BASE.replace(/\/+$/, ""); // no trailing slash
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Brand lockup: the official logo. `white` variant (wave + white wordmark) is
// used on dark surfaces (header/footer); `color` on light surfaces.
function brand(href = "/", variant = "white") {
  const file = variant === "color" ? "logo.png" : "logo-white.png";
  return `<a class="brand" href="${BASE}${href}" aria-label="${esc(site.name)} home"><img src="${BASE}/assets/${file}" alt="${esc(site.name)}" width="279" height="142" /></a>`;
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
  const cols = footer.columns.map((c) => `<div class="footer-col"><h4>${esc(c.title)}</h4>${c.links.map((l) => `<a href="${hrefFor(l.route)}">${esc(l.label)}</a>`).join("")}</div>`).join("");
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
      <span class="tag">${esc(footer.tagline)}</span>
    </div>
  </div></footer>`;
}

// ---- buttons ---------------------------------------------------------------
const isExternal = (r) => /^https?:\/\//i.test(r || "");
const btn = (b, cls) => {
  if (!b) return "";
  const ext = isExternal(b.route);
  const href = ext ? b.route : hrefFor(b.route);
  const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a class="btn ${cls}" href="${href}"${attrs}>${esc(b.label)}</a>`;
};

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
  cards(s) {
    const n = s.cards.length % 4 === 0 ? 4 : (s.cards.length % 3 === 0 || s.cards.length > 4 ? 3 : 2);
    const cards = s.cards.map((c) => {
      const inner = `<h3>${esc(c.title)}</h3><p>${esc(c.body)}</p>${c.route ? `<span class="arrow">Learn more →</span>` : ""}`;
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
  stats(s) {
    const items = s.items.map((x) => `<div class="stat"><div class="num">${esc(x.value)}</div><div class="lbl">${esc(x.label)}</div></div>`).join("");
    return `<section class="section section--dark"><div class="container">
      ${head(s)}<div class="statband">${items}</div>
    </div></section>`;
  },
  cta(s) {
    return `<section class="section section--dark"><div class="container"><div class="ctaband">
      <h2>${esc(s.headline)}</h2>
      <p>${esc(s.body)}</p>
      <div class="btn-row">${btn(s.primary, "btn--primary")}${btn(s.secondary, "btn--ghost")}</div>
    </div></div></section>`;
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
        <p><strong>Email</strong><br><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
        <p><strong>Phone</strong><br><a href="tel:${esc(site.phone)}">${esc(site.phone)}</a></p>
        <hr style="border:0;border-top:1px solid var(--line-dark);margin:1.2rem 0" />
        <p class="muted">${esc(site.tagline)}</p>
      </aside>
    </div></div></section>`;
  },
};

function renderPage(page) {
  const body = page.sections.map((s) => (renderers[s.type] || (() => ""))(s)).join("\n");
  const kw = page.route === "/" ? seoKeywords.join(", ") : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}" />
${kw ? `<meta name="keywords" content="${esc(kw)}" />\n` : ""}<meta property="og:title" content="${esc(page.title)}" />
<meta property="og:description" content="${esc(page.description)}" />
<meta property="og:type" content="website" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="icon" type="image/png" href="${BASE}/assets/favicon.png" />
<link rel="stylesheet" href="${BASE}/styles.css?v=${CSS_VER}" />
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "Organization", name: site.name,
    description: site.positioning, url: `https://${site.domain}`, email: site.email, telephone: site.phone,
    slogan: site.tagline,
  })}</script>
</head>
<body>
${renderHeader(page.route)}
<main>
${body}
</main>
${renderFooter()}
<script src="${BASE}/main.js?v=${JS_VER}"></script>
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
  fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });
  for (const a of ["logo.png", "logo-white.png", "favicon.png"]) {
    fs.copyFileSync(path.join(ROOT, "src/assets", a), path.join(DIST, "assets", a));
  }
  for (const page of pages) writeFile(outFileFor(page.route), renderPage(page));
  // sitemap + robots
  const urls = pages.map((p) => `  <url><loc>https://${site.domain}${p.route}</loc></url>`).join("\n");
  writeFile(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: https://${site.domain}/sitemap.xml\n`);
  // Custom domain for GitHub Pages (apex). www redirects to it automatically.
  if (site.domain) writeFile(path.join(DIST, "CNAME"), site.domain + "\n");
  console.log(`✓ Built ${pages.length} pages → dist/`);
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
