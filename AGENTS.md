# Newport's website agents — Finn & Beacon

Two conversational agents live on this site, sharing one runtime:

| | **Finn** | **Beacon** |
| --- | --- | --- |
| Role | Candidate Experience Agent | Market Intelligence Agent |
| Audience | Candidates | Employers |
| Mascot | Dolphin | Lighthouse |
| Accent | Newport blue | Lantern gold |
| Pages | `/jobs`, `/contact`, `/resources/*` | everything else |

Built to the specs in `docs/specs/` (`finn-website-integration.json`,
`beacon-website-integration.json`).

## One agent per page

`agentForRoute()` in `build.js` decides. Candidate routes get Finn; everything
else — which is most of the site, because most of it is written for employers —
gets Beacon. **Two floating launchers on one page would be noise**, so the
routing is exclusive and the smoke test asserts exactly one launcher per page.
Change the audience of a page by changing `FINN_ROUTES`.

## Files

| File | What it is |
| --- | --- |
| `src/agent-core.js` | The runtime: adapter, analytics, page context, launcher, panel, all six states, focus management. Agent-agnostic. |
| `src/finn.js` | Finn's profile: identity, quick actions, guardrails, knowledge layer. |
| `src/beacon.js` | Beacon's profile, same shape. |
| `src/agent.css` | Shared styles on the `styles.css` tokens; per-agent accents hang off `[data-agent]`. |
| `build.js` | Routes the agent, renders its launcher, injects `window.NEWPORT_AGENT_CONFIG`, copies + cache-busts, and provides the `agentCta` section type. |
| `src/content.js` | Both profiles in the `agents` array; the `agentCta` blocks. |
| `test/agents.smoke.mjs` | Browser smoke test, routing assertions, two intent tables, and Beacon's no-numbers guardrail. |

Adding a third agent is a profile file, an entry in `AGENTS` and `AGENT_JS` in
`build.js`, and an avatar. The runtime doesn't change.

## The three layers

1. **Adapter** — the only seam between the UI and whatever powers an agent.

   ```js
   sendMessage({ message, sessionId, pageContext, visitorContext? })
     -> Promise<{ message, insights?, suggestedActions?, citations?, handoff? }>
   ```

   `pageContext` is `{ url, pageTitle, pageKind, industry?, service?, jobId?,
   jobTitle? }`, read from the `data-*` attributes `build.js` puts on `<main>`.
   `pageKind` is one of `job`, `candidate`, `industry`, `service`, `resource`,
   `general`.

2. **Knowledge layer** — each profile's `kb` array, written from this site's own
   content. Used when no endpoint is configured, *and* as the fallback when a
   configured endpoint fails. `order` directly above it is the routing policy:
   first match wins, so narrow intents come first.

3. **UI** — launcher, panel, welcome, conversation, quick actions, insight
   cards, handoff, loading and error states. Built on first open, not page load.

## Configuration

There is no server in this repo — the site is static and published to GitHub
Pages — so **no agent holds a credential**. The only thing configurable is the
URL of a service *you* run, which holds the provider keys:

```bash
FINN_ENDPOINT=https://your-service.example.com/finn \
BEACON_ENDPOINT=https://your-service.example.com/beacon \
node build.js
```

Those land in `window.NEWPORT_AGENT_CONFIG.endpoints` at build time. With
neither set (the default, including in CI), both agents answer from their
knowledge layers and the site ships exactly as it does today.

Your endpoint receives `POST` JSON `{ agent, message, sessionId, pageContext,
visitorContext }` and replies with `{ message, insights?, suggestedActions?,
citations?, handoff? }`. Replies render as **text, never as HTML** — a
compromised or confused endpoint cannot inject markup. Citation URLs are
restricted to `http(s)`, site-relative, `mailto:` and `tel:`.

`insights` renders as structured cards (title, value, detail, source). The
knowledge layers never emit them: neither agent has verified data to put in one.

## Guardrails

**Finn** escalates instead of answering on compensation, offers, a candidate's
own application status or hiring decision, complaints, or an explicit request
for a person. He never states a salary, location, requirement, client name,
interview stage, or status.

**Beacon** is the one to be careful with, because a market intelligence agent is
exactly the kind of thing that sounds authoritative while making things up. He
has **no market dataset connected**, so:

- No market statistic, comp benchmark, time-to-fill, or pool count. Ever.
- No named company's hiring activity.
- Compensation and availability questions get a real answer about what Newport
  *can* establish and why he won't guess — not a deflection, and not a number.
- Commercial terms (fees, contracts, starting an engagement) go to a person.

The smoke test enforces this: it asks him four questions designed to bait a
number out of him and fails if a dollar figure, a percentage, or an invented
count appears anywhere in the transcript. **If you add answers to
`src/beacon.js`, keep them number-free** until a verified source is wired into
the adapter — at which point the figures belong in that response, not in this
repo.

Anything unmatched returns `unknown`, which says so plainly and offers a human.

## Analytics

Every interaction emits two DOM events — a specific one (`agent:finn_opened`,
`agent:beacon_market_query`) and a generic `newport-agent` carrying
`{ event, data }` — and also pushes to `window.dataLayer` / `gtag` when either
exists. This site has no analytics layer today; when one is added it picks these
up with no change here.

Events: `launcher_impression`, `opened`, `closed`, `message_sent`,
`quick_action_selected`, `insight_viewed`, `cite_clicked`, `handoff_requested`,
`handoff_clicked`, `error`, plus `finn_application_started` and
`beacon_market_query`. All prefixed with the agent id.

**Message text is never in an event** — `message_sent` carries a length.

## Privacy

Neither agent collects anything in-panel. Finn's intake goes through the
existing candidate form (`/contact?intent=candidate`); Beacon's handoff goes to
`/contact?intent=talent`. The only browser storage is a random per-agent session
id in `sessionStorage`, wrapped in try/catch so private mode degrades quietly.

## Artwork

Each agent ships two assets, both cut out of the supplied master render:

- `src/assets/finn.png`, `src/assets/beacon.png` — character card portraits for
  the agents page. **Transparent PNGs**, so they composite onto the card's
  gradient with the CSS drop-shadow instead of sitting on a baked-in background.
  The signature lockups from the master renders are cropped out; the card already
  prints name and role as text. `duke.png` and `scout.png` were cut out of the
  original JPGs for the same reason — the old `.jpg` files are still on disk but
  nothing references them.
- `src/assets/finn-avatar.png`, `beacon-avatar.png` — 128px head crops for the
  launcher, panel header and CTAs. They sit on a pale disc, because both
  characters are navy and vanish against the navy header otherwise.

## Testing

```bash
npm test            # build, then run the smoke test
```

Playwright is optional — if `playwright-core` can't be resolved the test
**skips** rather than failing, so CI stays green on a zero-dependency checkout:

```bash
PLAYWRIGHT=/path/to/node_modules/playwright-core/index.mjs node test/agents.smoke.mjs
```

It covers agent routing on nine pages, launcher and CTA visibility, lazy panel
construction, open/close, welcome and quick actions, knowledge-layer answers,
Finn's compensation guardrail, Beacon's no-numbers guardrail, `Escape` + focus
restoration, analytics events, absence of message text in those events, two
intent-routing tables (34 cases), mobile layout bounds, the four-agent page, and
the legacy-URL redirect.

## Not done yet

- **No live job data.** Finn points candidates at `/jobs`; he cannot describe
  individual roles because the site has no job feed. Wire an ATS (Manatal) to
  `/jobs` first, then give Finn the same data through the adapter.
- **No market data.** Beacon's entire value proposition is gated on a verified
  source — Newport OS, a market intelligence MCP, something. Until then he is
  honest and useful but cannot quote anything.
- **No agent endpoints.** Both ship on their knowledge layers.
- **No visitor context.** `visitorContext` is in the adapter signature and always
  `null`; it needs an authenticated session or a CRM (Attio) to mean anything.
- **Contact form is still a demo handler** (pre-existing — see `REVIEW.md`).
  Both agents hand off to it, so wiring it up matters more now than it did.
