// ============================================================================
// Build-time job feed — pulls open roles from the Manatal-hosted career page.
//
// Source: the public career page (site.careersPage). Its listing links every
// published job as /jobs/<uuid>, and each job page carries a schema.org
// JobPosting in JSON-LD. Reading that needs no API key, shows exactly what
// Manatal publishes, and gives us the real apply URL (/jobs/<uuid>/apply) —
// applications land in Manatal as candidates on that job.
//
// By default a failure doesn't break the build: the feed returns
// { ok: false, jobs: [] } and /jobs falls back to a link to the career page.
// The deploy workflow sets JOBS_FEED_REQUIRED=1 instead, so a failed fetch
// fails the build and the live site (with its job pages) stays up.
//   JOBS_FEED=off node build.js          -> skip the fetch (offline builds)
//   JOBS_FEED_URL=https://… node build.js -> point at another career page
// ============================================================================

const TIMEOUT_MS = 15000;
const MAX_LIST_PAGES = 20;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// GET with retries: the career page rate-limits (HTTP 429), so back off and
// honour Retry-After instead of failing the whole feed on one busy response.
async function get(url, attempts = 4) {
  for (let i = 1; ; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "newportsg.com site build" } });
      if (res.ok) return await res.text();
    } catch (err) {
      if (i >= attempts) throw err;
    } finally {
      clearTimeout(t);
    }
    const retryable = !res || res.status === 429 || res.status >= 500;
    if (!retryable || i >= attempts) throw new Error(`HTTP ${res ? res.status : "error"} for ${url}`);
    const after = res && Number(res.headers.get("retry-after"));
    await sleep(Math.min(after > 0 ? after * 1000 : 2000 * 2 ** (i - 1), 30000));
  }
}

// Every /jobs/<uuid> link on a listing page, in page order.
const jobIdsIn = (html) => [...new Set([...html.matchAll(/href="\/jobs\/([0-9a-f-]{36})"/g)].map((m) => m[1]))];
// Pagination links (?page=N), if the career page splits the list.
const pageLinksIn = (html) => [...new Set([...html.matchAll(/href="[^"]*[?&]page=(\d+)[^"]*"/g)].map((m) => Number(m[1])))];

function jobPostingIn(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const d = JSON.parse(m[1]);
      const found = [].concat(d).find((x) => x && x["@type"] === "JobPosting");
      if (found) return found;
    } catch { /* not JSON we understand — keep looking */ }
  }
  return null;
}

// Job descriptions are recruiter-authored HTML from Manatal. Keep a small set
// of formatting tags, strip every attribute, and drop everything else.
const KEEP = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "h2", "h3", "h4"]);
function sanitize(html = "") {
  return String(html)
    .replace(/<(script|style|iframe|object|embed|noscript)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(\/?)\s*([a-z0-9]+)[^>]*>/gi, (_, close, tag) => {
      let t = tag.toLowerCase();
      if (t === "h1") t = "h2"; // the job title is the page's only h1
      if (t === "h5" || t === "h6") t = "h4";
      if (!KEEP.has(t)) return "";
      return t === "br" ? "<br>" : `<${close}${t}>`;
    })
    .replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, "")
    .trim();
}

const plain = (html = "") => sanitize(html).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

const slugify = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, "");

const EMPLOYMENT = { FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACTOR: "Contract", TEMPORARY: "Temporary", INTERN: "Internship" };

function toJob(id, posting, base) {
  const addr = (posting.jobLocation && posting.jobLocation.address) || {};
  const location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter((x) => x && x !== "-").join(", ");
  const types = [].concat(posting.employmentType || []).filter(Boolean);
  return {
    id,
    // Title slug + the uuid's first block keeps URLs readable and unique.
    slug: `${slugify(posting.title) || "role"}-${id.slice(0, 8)}`,
    title: String(posting.title || "Open role").trim(),
    location,
    city: addr.addressLocality && addr.addressLocality !== "-" ? addr.addressLocality : "",
    region: addr.addressRegion && addr.addressRegion !== "-" ? addr.addressRegion : "",
    country: addr.addressCountry && addr.addressCountry !== "-" ? addr.addressCountry : "",
    employmentType: types.map((t) => EMPLOYMENT[t] || t).join(", "),
    employmentTypeRaw: types,
    datePosted: posting.datePosted || "",
    validThrough: posting.validThrough || "",
    descriptionHtml: sanitize(posting.description),
    // Card blurb: body text only, so it doesn't open with "About the Role" etc.
    summary: plain(sanitize(posting.description).replace(/<h[2-4]>[\s\S]*?<\/h[2-4]>/g, " ")
      .replace(/<p>\s*<(strong|b)>[^<]{0,60}<\/\1>\s*<\/p>/g, " ")).slice(0, 220),
    url: `${base}/jobs/${id}`,
    applyUrl: `${base}/jobs/${id}/apply`,
  };
}

async function fetchJobs(careersPage) {
  if ((process.env.JOBS_FEED || "").toLowerCase() === "off") return { ok: false, skipped: true, jobs: [] };
  const base = (process.env.JOBS_FEED_URL || careersPage || "").trim().replace(/\/+$/, "");
  if (!base) return { ok: false, jobs: [] };
  try {
    const first = await get(base + "/");
    const ids = jobIdsIn(first);
    const pages = pageLinksIn(first).filter((n) => n > 1 && n <= MAX_LIST_PAGES);
    for (const n of pages) for (const id of jobIdsIn(await get(`${base}/?page=${n}`))) if (!ids.includes(id)) ids.push(id);

    const jobs = [];
    for (const id of ids) {
      await sleep(400); // stay well under the career page's rate limit
      const posting = jobPostingIn(await get(`${base}/jobs/${id}`));
      if (posting && posting.title) jobs.push(toJob(id, posting, base));
    }
    jobs.sort((a, b) => (b.datePosted || "").localeCompare(a.datePosted || ""));
    return { ok: true, jobs, source: base };
  } catch (err) {
    console.warn(`! Job feed unavailable (${err.message}) — /jobs will link to the career page instead.`);
    return { ok: false, jobs: [], source: base };
  }
}

module.exports = { fetchJobs, sanitize, slugify, jobIdsIn, jobPostingIn };
