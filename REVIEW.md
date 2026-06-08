# Newport Search Group — Site Map Review & Refinements

A critique of the supplied site map, the changes I made while building, and recommendations to take it further. Grouped by impact.

---

## What was already strong
- **Clear, differentiated positioning.** "Agentic Staffing Company" + "Human Relationships. Agentic Execution." is a sharp, ownable angle. The human/agent division-of-labor story is consistent and credible.
- **Sensible IA.** Services / Industries / Staffing-Industry / Jobs / Resources / Contact is the standard, proven structure for a staffing firm. No reinvention needed.
- **The "We Recruit Recruiters" practice** is a genuine wedge and deserves its own top-level nav item — the map correctly gives it one.

---

## Gaps I found and fixed in the build

1. **Nav vs. pages mismatch.** The JSON nav listed Services with only 3 children (Direct Hire, Contract, RPO), but the Markdown defined a Services *Overview* page and an *Executive Search* page that had nowhere to be reached. **Fix:** added "Overview" and "Executive Search" to the Services dropdown, and gave Industries a dropdown too (six industry pages were otherwise only reachable from the overview page).

2. **About was missing from the JSON entirely** (it existed only in the Markdown) and wasn't in primary nav. **Fix:** built the About page and linked it from the footer (matching the Markdown's footer spec).

3. **Executive Search was referenced in the footer but had no page.** **Fix:** wrote a full Executive Search service page.

4. **Thin/placeholder copy.** Several pages had only a headline or a one-liner (industries, services, platform sections). **Fix:** wrote full section copy for every page — intros, "how it works," focus areas, and benefits — in the brand voice.

5. **No conversion mechanics defined.** The map listed conversion *priorities* but no actual capture mechanism. **Fix:** every page ends in a CTA band, every primary CTA routes to `/contact`, and the contact form pre-selects the right "Hiring Need" via an `?intent=` query param (e.g. "Request Talent", "Submit Resume"). This directly serves all five stated conversion priorities.

6. **SEO was a keyword list with no home.** **Fix:** unique `<title>` + meta description per page, Organization JSON-LD schema, `sitemap.xml`, and `robots.txt` generated automatically.

---

## Recommendations (not yet built — your call)

### High impact
- **Add proof.** The single biggest gap for a premium search firm is *evidence*. Add: client logos, 2–3 case studies / placement stories, testimonials, and a stat or two you can defend (placements made, avg. time-to-shortlist, retention rate). Trust is what closes executive search — the site currently asserts quality without showing it.
- **A real "Agentic Platform" demonstration.** The differentiator is the agents, but the page describes them in prose. Consider a short explainer animation or an annotated "anatomy of a search" timeline showing what each agent does on day 1, day 3, day 7. Show, don't tell.
- **Lead routing, not just a form.** Decide where contact submissions go (CRM + instant email + Calendly/consultation booking). "Schedule a Consultation" should ideally open a real booking flow, not a generic form.

### Medium impact
- **Split the two audiences earlier.** The site serves *employers hiring talent* and *candidates seeking jobs* and *staffing firms hiring recruiters* — three distinct journeys. The home hero speaks mostly to employers. Consider an audience selector or clearly distinct paths so candidates and staffing-firm buyers don't feel like an afterthought.
- **Resources needs real articles to earn its SEO keywords.** Categories alone won't rank. Plan 1–2 cornerstone articles per category targeting the keyword list (e.g. "What is an agentic staffing company?", "How to hire cybersecurity talent in a tight market").
- **Jobs page needs a real ATS/job feed.** Currently a static search UI. Wire it to your ATS (Bullhorn, Greenhouse, etc.) or a job-board widget so listings are live and applications are captured.

### Polish
- **Add a privacy policy / terms** (required for forms + ad tracking, and for trust).
- **Compensation/benchmark angle.** Talent-intelligence is a stated strength — a downloadable salary guide is a high-converting lead magnet for this audience.
- **Accessibility pass.** The build uses semantic HTML, focus states, reduced-motion support, and AA-contrast colors, but run a full audit before launch (the `design:accessibility-review` skill can do this).

---

## Voice & messaging notes
- The copy I wrote leans into the consistent refrain: *agents handle scale, humans handle judgment/trust/closing.* Keep hammering this — it's the whole pitch and it reassures the "AI will replace my recruiter relationship" skeptic.
- Avoided robot/AI-gimmick language per the design direction. "Digital recruiting workforce," "market mapping," "talent intelligence" read as premium, not gimmicky.
- One thing to decide: how much to *name* the technology. Right now it's described functionally (five agent types). If the platform has a product name, branding it would strengthen the moat.
