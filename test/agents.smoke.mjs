// ============================================================================
// Agent smoke test — no test framework, matching this repo's zero-dependency
// stance. Playwright is optional: if it isn't resolvable the test skips with a
// clear message rather than failing the build.
//
//   node build.js && node test/agents.smoke.mjs
//   PLAYWRIGHT=/path/to/node_modules/playwright-core node test/agents.smoke.mjs
// ============================================================================
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, "..", "dist");
const SHOTS = path.join(ROOT, "..", ".agent-screenshots");

if (!existsSync(DIST)) {
  console.error("dist/ not found — run `node build.js` first.");
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import(process.env.PLAYWRIGHT || "playwright-core"));
} catch {
  console.log("SKIP: playwright-core not resolvable. Set PLAYWRIGHT=<path> to run browser checks.");
  process.exit(0);
}

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };

// Stand-in for the contact endpoint: /__contact accepts, anything else fails.
const posts = [];
const server = createServer(async (req, res) => {
  if (req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    if (req.url === "/__contact") {
      posts.push({ headers: req.headers, body: JSON.parse(body) });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true}');
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end('{"error":"down"}');
    }
    return;
  }
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(DIST, p);
  try {
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(await readFile(path.join(DIST, "404.html")).catch(() => "not found"));
  }
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}`;

let failures = 0;
const ok = (name, cond, extra = "") => {
  console.log(`${cond ? "  PASS" : "  FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
  if (!cond) failures++;
};

const EVENTS = ["opened", "closed", "message_sent", "quick_action_selected", "launcher_impression",
  "insight_viewed", "handoff_requested", "handoff_clicked", "cite_clicked", "error",
  "application_started", "market_query"];

const browser = await chromium.launch();
const errors = [];

async function agentPage(url, viewport = { width: 1280, height: 900 }) {
  const page = await browser.newPage({ viewport });
  const events = [];
  await page.exposeFunction("__agentEvent", (e, d) => events.push({ e, d }));
  await page.addInitScript(() => {
    document.addEventListener("newport-agent", (ev) => window.__agentEvent(ev.detail.event, ev.detail.data));
  });
  page.on("pageerror", (e) => errors.push(`${url}: ${e}`));
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  return { page, events };
}

// ---------------------------------------------------------------- routing --
console.log("\nagent routing (one launcher per page)");
for (const [url, want] of [
  ["/", "beacon"], ["/about/", "beacon"], ["/staffing-solutions/", "beacon"],
  ["/industries/cybersecurity/", "beacon"], ["/staffing-industry/", "beacon"],
  ["/agentic-platform/meet-the-agents/", "beacon"],
  ["/jobs/", "finn"], ["/contact/", "finn"], ["/resources/", "finn"],
]) {
  const p = await browser.newPage();
  await p.goto(BASE + url, { waitUntil: "domcontentloaded" });
  const ids = await p.$$eval(".agent-launcher", (els) => els.map((e) => e.dataset.agent));
  ok(`${url} -> ${want}`, ids.length === 1 && ids[0] === want, ids.join(",") || "none");
  await p.close();
}

// ------------------------------------------------------------------- Finn --
console.log("\nFinn — /jobs");
{
  const { page, events } = await agentPage("/jobs/");
  ok("launcher is visible", await page.isVisible(".agent-launcher"));
  ok("contextual CTA is revealed", await page.isVisible('[data-agent-open="finn"]'));
  ok("page context is on <main>", (await page.getAttribute("main", "data-agent-context")) === "job");
  ok("panel is not in the DOM before first open", (await page.locator(".agent-panel").count()) === 0, "lazy build");
  ok("launcher_impression fired", events.some((e) => e.e === "finn_launcher_impression"));

  await page.click(".agent-launcher");
  await page.waitForSelector(".agent-panel:not([hidden])");
  ok("panel opens", await page.isVisible(".agent-panel"));
  ok("welcome headline renders", (await page.textContent(".agent-welcome h3")) === "Meet Finn");
  ok("quick actions render", (await page.locator(".agent-chip").count()) >= 4);
  ok("aria-expanded flips", (await page.getAttribute(".agent-launcher", "aria-expanded")) === "true");
  ok("finn_opened fired", events.some((e) => e.e === "finn_opened"));

  await page.fill(".agent-form textarea", "what industries do you recruit in?");
  await page.press(".agent-form textarea", "Enter");
  await page.waitForSelector(".agent-msg--agent:not(:has(.agent-typing))", { timeout: 5000 });
  ok("answers from the knowledge layer", /Cybersecurity/i.test(await page.locator(".agent-msg--agent").last().textContent()));
  ok("message text is NOT in analytics", !events.some((e) => JSON.stringify(e.d || {}).includes("industries")), "no PII");

  await page.fill(".agent-form textarea", "what salary does this role pay?");
  await page.press(".agent-form textarea", "Enter");
  await page.waitForSelector(".agent-handoff", { timeout: 5000 });
  ok("compensation triggers handoff", await page.isVisible(".agent-handoff"));
  ok("no fabricated figures", !/\$\s?\d/.test(await page.textContent(".agent-panel__body")));

  await page.keyboard.press("Escape");
  await page.waitForSelector(".agent-panel", { state: "hidden" });
  ok("Escape closes", !(await page.isVisible(".agent-panel")));
  ok("focus returns to launcher",
    await page.evaluate(() => document.activeElement?.classList.contains("agent-launcher")));

  const ROUTES = [
    ["what industries do you recruit in?", "industries"],
    ["show me jobs", "jobs"],
    ["how do I apply", "apply"],
    ["what happens after I apply?", "next_step"],
    ["who are you", "agents"],
    ["are you a real person?", "agents"],
    ["tell me about your company", "company"],
    ["is this role remote", "location"],
    ["what do you do with my data", "privacy"],
    ["hey", "greeting"],
    ["what salary does it pay", "handoff"],
    ["I want to talk to a human", "handoff"],
    ["did I get the job?", "handoff"],
    ["what is the airspeed of a swallow", "unknown"],
  ];
  for (const [u, want] of ROUTES) {
    const got = await page.evaluate((x) => window.NewportAgents.finn._route(x), u);
    ok(`finn: "${u}" -> ${want}`, got.id === want, got.id === want ? "" : `got ${got.id}`);
  }

  await mkdir(SHOTS, { recursive: true });
  await page.click(".agent-launcher");
  await page.waitForSelector(".agent-panel:not([hidden])");
  await page.screenshot({ path: path.join(SHOTS, "finn-desktop.png") });
  await page.close();
}

// ----------------------------------------------------------------- Beacon --
console.log("\nBeacon — / (home)");
{
  const { page, events } = await agentPage("/");
  ok("launcher is visible", await page.isVisible('.agent-launcher[data-agent="beacon"]'));
  ok("hero CTA is revealed", await page.isVisible('[data-agent-open="beacon"]'));

  await page.click('[data-agent-open="beacon"]');
  await page.waitForSelector(".agent-msg--user", { timeout: 5000 });
  ok("CTA seeds the first question", /Talent market insights/i.test(await page.textContent(".agent-msg--user")));
  ok("welcome shows his role", (await page.textContent(".agent-welcome__sub")) === "Newport's AI Orchestrator".replace("'", "’"));
  ok("beacon_opened fired", events.some((e) => e.e === "beacon_opened"));
  ok("market_query fired", events.some((e) => e.e === "beacon_market_query"));

  await page.waitForSelector(".agent-msg--agent:not(:has(.agent-typing))", { timeout: 5000 });

  // The guardrail that matters: no invented numbers, anywhere, ever.
  for (const q of ["what's the average salary for a security engineer?",
                   "how many IAM engineers are there in Dallas?",
                   "what's the time to fill for a plant manager?",
                   "is Acme Corp hiring right now?"]) {
    await page.fill(".agent-form textarea", q);
    await page.press(".agent-form textarea", "Enter");
    await page.waitForTimeout(1100);
  }
  const transcript = await page.textContent(".agent-panel__body");
  ok("no dollar figures in any answer", !/\$\s?[\d,]/.test(transcript));
  ok("no percentages in any answer", !/\d+(\.\d+)?\s?%/.test(transcript));
  ok("no invented counts", !/\b\d{2,}\s+(engineers|candidates|people|professionals|roles)\b/i.test(transcript));
  ok("says what he can't verify", /(won’t|won't|don’t|don't)\s+(give|have|estimate|tell|offer|quote)/i.test(transcript));

  const BROUTES = [
    ["what's the average salary for this role", "salary"],
    ["what should we pay a VP of engineering", "salary"],
    ["how many candidates are available", "availability"],
    ["is this a hard market to hire in", "availability"],
    ["what are the hiring trends right now", "trends"],
    ["did they just raise a series B", "signals_intel"],
    ["help me build a workforce strategy", "strategy"],
    ["can you build an offshore team", "offshore"],
    ["we need to hire recruiters", "recruiters"],
    ["thinking about an acquisition", "ma"],
    ["tell me about cybersecurity", "industries"],
    ["what does a market map give me", "market"],
    ["how does newport work", "how"],
    ["who are you", "identity"],
    ["hello", "greeting"],
    ["what do you charge", "handoff"],
    ["send me an MSA", "handoff"],
    ["I want to talk to a person", "handoff"],
    ["how do I start a search", "handoff"],
    ["what is the airspeed of a swallow", "unknown"],
  ];
  for (const [u, want] of BROUTES) {
    const got = await page.evaluate((x) => window.NewportAgents.beacon._route(x), u);
    ok(`beacon: "${u}" -> ${want}`, got.id === want, got.id === want ? "" : `got ${got.id}`);
  }

  await page.screenshot({ path: path.join(SHOTS, "beacon-desktop.png") });
  await page.close();
}

// ------------------------------------------------------------ cross-agent --
console.log("\nshared behaviour");
{
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await m.goto(BASE + "/", { waitUntil: "networkidle" });
  await m.click(".agent-launcher");
  await m.waitForSelector(".agent-panel:not([hidden])");
  const box = await m.locator(".agent-panel").boundingBox();
  ok("mobile panel fits the viewport", box.width <= 390 && box.x >= 0 && box.height <= 844,
     `${Math.round(box.width)}x${Math.round(box.height)}`);
  await m.screenshot({ path: path.join(SHOTS, "beacon-mobile.png") });
  await m.close();

  const a = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  await a.goto(BASE + "/agentic-platform/meet-the-agents/", { waitUntil: "networkidle" });
  ok("four agents render", (await a.locator(".char").count()) === 4);
  const chars = await a.textContent(".chars");
  ok("all four are named", ["Duke", "Scout", "Finn", "Beacon"].every((n) => chars.includes(n)));
  await a.screenshot({ path: path.join(SHOTS, "agents-page.png"), fullPage: true });
  await a.close();

  // Header: nav labels stay on one line and nothing overflows, at each tier.
  const header = async (width, height = 800) => {
    const h = await browser.newPage({ viewport: { width, height } });
    await h.goto(BASE + "/", { waitUntil: "networkidle" });
    const m = await h.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const nav = document.querySelector(".nav");
      const inner = document.querySelector(".site-header .container");
      const edge = box(inner).right - parseFloat(getComputedStyle(inner).paddingRight);
      return {
        navShown: getComputedStyle(nav).display !== "none",
        wrapped: [...nav.children].filter((el) => box(el).height > 48).length,
        overflow: Math.round(box(nav).right - edge),
        brandSquashed: box(document.querySelector(".site-header .brand img")).width < 100,
        headerH: Math.round(box(inner).height),
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    return { h, m };
  };
  for (const width of [1920, 1366, 1181, 1180, 1041]) {
    const { h, m } = await header(width);
    ok(`header fits on one line at ${width}px`, m.navShown && m.wrapped === 0 && m.overflow <= 0 && !m.brandSquashed && !m.pageOverflow,
      JSON.stringify(m));
    await h.close();
  }
  {
    const { h, m } = await header(1040);
    ok("nav collapses to the menu button at 1040px", !m.navShown && (await h.isVisible(".nav-toggle")) && !m.pageOverflow);
    await h.close();
  }
  {
    const { h, m } = await header(390, 700);
    ok("phone header is compact", m.headerH <= 76, `${m.headerH}px`);
    await h.click(".nav-toggle");
    const menu = await h.evaluate(() => {
      const r = document.querySelector(".nav").getBoundingClientRect();
      return { bottom: Math.round(r.bottom), vh: innerHeight };
    });
    ok("open phone menu stays within the screen", menu.bottom <= menu.vh, `${menu.bottom}/${menu.vh}`);
    await h.close();
  }

  // Footer: the floating launcher must not cover the last row at page end.
  for (const [width, height] of [[1366, 700], [390, 700]]) {
    const f = await browser.newPage({ viewport: { width, height } });
    await f.goto(BASE + "/about/", { waitUntil: "networkidle" });
    await f.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await f.waitForTimeout(700);
    const clear = await f.evaluate(() => {
      const l = document.querySelector(".agent-launcher").getBoundingClientRect();
      return [...document.querySelectorAll(".footer-bottom > *")].every((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom <= l.top || r.right <= l.left || r.top >= l.bottom;
      });
    });
    ok(`launcher clears the footer's last row at ${width}px`, clear);
    if (width === 1366) await f.screenshot({ path: path.join(SHOTS, "footer-clear.png") });
    await f.close();
  }

  // Search markup: articles are articles; the sitemap dates what it can.
  const articleHtml = await readFile(path.join(DIST, "resources/what-is-an-ai-native-recruiting-platform/index.html"), "utf8");
  const lds = [...articleHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((x) => JSON.parse(x[1]));
  const art = lds.find((x) => x["@type"] === "Article");
  ok("article pages carry Article markup", !!art && art.datePublished === "2026-07-06" && !!art.author && !!art.publisher.logo);
  ok("article pages are og:type article", /property="og:type" content="article"/.test(articleHtml) &&
    /property="article:published_time" content="2026-07-06"/.test(articleHtml));
  const homeHtml = await readFile(path.join(DIST, "index.html"), "utf8");
  ok("non-article pages stay og:type website", /property="og:type" content="website"/.test(homeHtml) && !/"@type":"Article"/.test(homeHtml));
  const sitemap = await readFile(path.join(DIST, "sitemap.xml"), "utf8");
  ok("sitemap dates articles", /what-is-an-ai-native-recruiting-platform<\/loc><lastmod>2026-07-06<\/lastmod>/.test(sitemap));
  ok("sitemap does not invent dates for static pages", /<loc>https:\/\/newportsg\.com\/about<\/loc><\/url>/.test(sitemap));

  const r = await browser.newPage();
  await r.goto(BASE + "/agentic-platform/duke-and-scout/", { waitUntil: "networkidle" });
  ok("legacy agents URL redirects", r.url().includes("meet-the-agents"), r.url());
  await r.close();
}

// ----------------------------------------------------------- contact form --
// The form must never swallow an enquiry: it either reaches the endpoint or
// hands the visitor a prefilled email. These checks never touch a real
// endpoint — data-endpoint is always overridden or removed first.
console.log("\ncontact form");
{
  const LEAD = { name: "Ada Lovelace", company: "Analytical Engines", email: "ada@example.test",
    phone: "555 0100", message: "We need two IAM engineers." };
  const open = async (endpoint) => {
    const page = await browser.newPage();
    const events = [];
    await page.exposeFunction("__contactEvent", (e, d) => events.push({ e, d }));
    await page.addInitScript(() => {
      document.addEventListener("newport-contact", (ev) => window.__contactEvent(ev.detail.event, ev.detail.data));
    });
    page.on("pageerror", (e) => errors.push(`/contact/: ${e}`));
    await page.goto(BASE + "/contact/?intent=recruiter", { waitUntil: "networkidle" });
    await page.evaluate((url) => {
      const f = document.querySelector("form[data-contact]");
      if (url) f.setAttribute("data-endpoint", url); else f.removeAttribute("data-endpoint");
    }, endpoint);
    return { page, events };
  };
  const fill = async (page) => {
    for (const [k, v] of Object.entries(LEAD)) await page.fill(`#${k}`, v);
  };
  const send = (page) => page.click('form[data-contact] button[type="submit"]');
  const tone = (page) => page.getAttribute(".form-status", "data-tone");

  // No endpoint -> prefilled email, and the visitor is told.
  let { page, events } = await open(null);
  ok("demo handler is gone", (await page.locator("form[data-demo]").count()) === 0);
  ok("?intent= preselects the hiring need", (await page.inputValue("#hiringNeed")) === "Staffing Firm — Hire Recruiters");
  await send(page);
  ok("empty required fields block the submit", (await page.textContent(".form-status")) === "");
  await fill(page);
  await send(page);
  await page.waitForSelector("[data-contact-fallback]");
  const href = decodeURIComponent(await page.getAttribute("[data-contact-fallback]", "href"));
  ok("no endpoint -> prefilled email fallback", href.startsWith("mailto:") && href.includes(LEAD.name) &&
    href.includes(LEAD.message) && href.includes("Staffing Firm"), href.slice(0, 60));
  ok("fallback keeps what the visitor typed", (await page.inputValue("#message")) === LEAD.message);
  ok("fallback event fired", events.some((e) => e.e === "contact_form_email_fallback"));
  ok("no field values in analytics", !JSON.stringify(events).includes("ada@") && !JSON.stringify(events).includes("Lovelace"), "no PII");
  await page.close();

  // Endpoint accepts -> JSON POST, confirmation, cleared form.
  ({ page, events } = await open(BASE + "/__contact"));
  await fill(page);
  await send(page);
  await page.waitForSelector('.form-status[data-tone="ok"]');
  const sent = posts[0] || { headers: {}, body: {} };
  ok("endpoint receives one JSON POST", posts.length === 1 && /application\/json/.test(sent.headers["content-type"] || "") &&
    /application\/json/.test(sent.headers.accept || ""));
  ok("payload carries every field", Object.entries(LEAD).every(([k, v]) => sent.body[k] === v) &&
    sent.body.hiringNeed === "Staffing Firm — Hire Recruiters");
  ok("payload carries intent, page and subject", sent.body.intent === "recruiter" && sent.body.page === "/contact/" &&
    /Website enquiry/.test(sent.body._subject || ""));
  ok("visitor sees a confirmation", /Thanks, Ada/.test(await page.textContent(".form-status")));
  ok("form clears after a successful send", (await page.inputValue("#email")) === "");
  ok("submitted event fired", events.some((e) => e.e === "contact_form_submitted"));
  await page.screenshot({ path: path.join(SHOTS, "contact-sent.png") });
  ok("confirmation message is on screen", await page.evaluate(() => {
    const r = document.querySelector(".form-status").getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  }));
  await page.close();

  // Endpoint down -> the enquiry is not lost.
  ({ page } = await open(BASE + "/__contact-down"));
  await fill(page);
  await send(page);
  await page.waitForSelector("[data-contact-fallback]");
  ok("endpoint failure -> email fallback", (await tone(page)) === "warn" &&
    decodeURIComponent(await page.getAttribute("[data-contact-fallback]", "href")).includes(LEAD.message));
  ok("failed send keeps what the visitor typed", (await page.inputValue("#message")) === LEAD.message);
  ok("send button is usable again", await page.isEnabled('form[data-contact] button[type="submit"]'));
  await page.screenshot({ path: path.join(SHOTS, "contact-fallback.png") });
  ok("fallback message is on screen", await page.evaluate(() => {
    const r = document.querySelector(".form-status").getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  }));
  await page.close();

  // Honeypot filled -> looks like success, sends nothing.
  ({ page } = await open(BASE + "/__contact"));
  await fill(page);
  await page.evaluate(() => { document.querySelector('[name="_gotcha"]').value = "http://spam.example"; });
  await send(page);
  await page.waitForSelector('.form-status[data-tone="ok"]');
  ok("honeypot submissions are dropped", posts.length === 1, `${posts.length} POST(s) total`);
  ok("honeypot is hidden from people", await page.evaluate(() => {
    const r = document.querySelector(".field--trap").getBoundingClientRect();
    return r.right < 0;
  }));
  await page.close();
}

ok("no uncaught page errors", errors.length === 0, errors.join(" | "));
void EVENTS;

await browser.close();
server.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
