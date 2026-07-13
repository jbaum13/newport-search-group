// ============================================================================
// Newport Search Group — Blog articles
// ----------------------------------------------------------------------------
// Each article: slug (URL: /resources/<slug>), category, title, date,
// readTime, excerpt (listing + meta description), body (array of blocks:
// {h2}, {p}, {ul: [...]}). build.js renders these to article pages and the
// Resources listing automatically — add an article here and rebuild.
// ============================================================================

const articles = [
  {
    slug: "what-is-an-agentic-staffing-company",
    category: "Agentic Recruiting",
    title: "What Is an Agentic Staffing Company?",
    date: "2026-07-06",
    readTime: "5 min",
    excerpt:
      "Agentic staffing pairs autonomous AI agents with human recruiters. Here's what that actually means, what the agents do, and why the model outperforms both traditional firms and pure-AI tools.",
    body: [
      { p: "Every staffing firm now claims to \"use AI.\" Most mean a résumé parser, a chatbot, or an outreach tool a recruiter has to drive by hand. An agentic staffing company is something structurally different: a firm where autonomous software agents execute entire recruiting workflows — sourcing, market mapping, engagement, intelligence — continuously and without being prompted, while human recruiters own judgment, relationships, and the close." },
      { h2: "The core idea: divide the work by what it rewards" },
      { p: "Recruiting is really two jobs fused together. One job rewards speed, repetition, and coverage: searching every channel, mapping every competitor's org chart, following up on time, keeping data clean. The other rewards experience, empathy, and trust: qualifying real fit, advising a hesitant candidate, negotiating an offer that sticks. Traditional firms staff both jobs with the same expensive humans, so both get done partially. Agentic firms split them." },
      { ul: [
        "Agents do the work that scales — 24/7 sourcing, continuous market mapping, personalized outreach at volume, data hygiene, scheduling.",
        "Recruiters do the work that matters — screening for real fit, candidate advocacy, offer strategy, relationship building.",
        "Clients get both — the coverage of automation and a single accountable human partner.",
      ]},
      { h2: "What the agents actually do" },
      { p: "At Newport, five specialized agent teams run under every search: Talent Discovery agents build living pipelines instead of one-time lists; Market Mapping agents chart entire companies and talent pools; Candidate Engagement agents keep passive candidates warm until timing is right; Talent Intelligence agents turn market data into briefings; Recruiting Operations agents keep scheduling, tracking, and reporting airtight. None of this replaces the recruiter — it hands the recruiter a materially better starting position every morning." },
      { h2: "Why not just buy AI tools?" },
      { p: "Because tools still consume recruiter hours to operate, and internal teams rarely have the volume to keep them sharp. An agentic staffing partner amortizes the technology across hundreds of searches and ships you the output: qualified, contextualized candidates and market intelligence — not another license to manage." },
      { h2: "The test to apply" },
      { p: "Ask any firm claiming AI capability one question: what happens on your search at 2 a.m.? If the honest answer is \"nothing,\" it's a traditional firm with software. If the answer is \"sourcing, mapping, and engagement are still running,\" you've found an agentic one." },
    ],
  },
  {
    slug: "ai-recruiting-firm-vs-traditional-agency",
    category: "AI in Recruiting",
    title: "AI Recruiting Firm vs. Traditional Agency: What Actually Changes",
    date: "2026-06-22",
    readTime: "6 min",
    excerpt:
      "Same fee structures, very different mechanics. A practical comparison of how an AI-powered recruiting firm changes speed, coverage, and candidate quality — and what stays stubbornly human.",
    body: [
      { p: "Hiring leaders evaluating an AI recruiting firm against a traditional agency usually get marketing instead of mechanics. Here is the practical difference, stage by stage." },
      { h2: "Sourcing: hours of searching vs. continuous discovery" },
      { p: "A traditional recruiter sources in sessions — a few hours against a role, then on to other searches. An AI recruiting firm runs discovery continuously: every channel, every adjacent title, every competitor, refreshed daily. The practical effect isn't just volume; it's that the pipeline includes people who only became reachable this week — the passive candidates who never appear in a one-time search." },
      { h2: "Coverage: a slice of the market vs. the whole map" },
      { p: "Ask a traditional agency \"who else is out there?\" and you get the shortlist plus anecdotes. Agentic market mapping produces the actual answer: how many people hold this role in your market, where they sit, what they earn, and which companies are shedding or hoarding them. You make the hire — and you keep the map." },
      { h2: "Engagement: follow-up when the recruiter has time vs. always" },
      { p: "Most placements are lost in the gaps — the candidate who cooled off during a busy week, the follow-up that slipped. Engagement agents don't have busy weeks. Outreach is personalized, sequenced, and persistent, and the moment a candidate signals interest, a human takes over. That handoff discipline — machines warm, humans close — is the entire trick." },
      { h2: "What doesn't change" },
      { ul: [
        "Qualifying real fit still takes an experienced recruiter who has closed hundreds of offers.",
        "Candidates still decide based on trust, not automation.",
        "Offer strategy, counteroffer defense, and closing remain entirely human work.",
      ]},
      { p: "The honest summary: AI changes the top and middle of the funnel beyond recognition, and changes the bottom almost not at all. Choose a firm accordingly — one that automated the funnel and kept senior humans at the close." },
    ],
  },
  {
    slug: "hiring-cybersecurity-talent-tight-market",
    category: "Hiring Trends",
    title: "How to Hire Cybersecurity Talent in a Market That Never Loosens",
    date: "2026-06-08",
    readTime: "6 min",
    excerpt:
      "IAM, cloud security, GRC — security hiring stays brutal in every cycle. Five tactics that consistently land security talent, from calibrating comp weekly to selling the mission, not the perks.",
    body: [
      { p: "Cybersecurity hiring is the market that never mean-reverts. Whatever the broader economy does, demand for IAM architects, cloud security engineers, and GRC leaders outruns supply. If your security req has been open for ninety days, the problem usually isn't the market — it's the playbook." },
      { h2: "1. Stop screening for unicorns" },
      { p: "The perfect candidate — deep IAM, cloud-native, compliance-fluent, leadership-ready — exists mostly in job descriptions. Teams that hire well in security pick the one capability that is genuinely hard to teach for the role, hire for it, and train the adjacent skills. Every extra \"must-have\" on a security JD adds weeks to the search and removes real candidates from the pool." },
      { h2: "2. Calibrate compensation weekly, not annually" },
      { p: "Security comp moves faster than HR benchmarking cycles. An offer calibrated against last year's survey data reads as a lowball to a candidate holding two current offers. Continuous market intelligence — what candidates are actually accepting this month, in your metro or remote — is the difference between closing in days and re-opening the search." },
      { h2: "3. Passive candidates are the market" },
      { p: "The best security people are employed, paged less than they used to be, and not reading job boards. Reaching them takes sustained, personalized engagement over weeks — precisely the work that collapses when a human recruiter gets busy, and precisely what engagement agents never drop." },
      { h2: "4. Sell the mission and the architecture" },
      { p: "Security professionals choose roles for scope and stakes: what they'll protect, what they'll get to build, whether leadership actually funds security. Lead with the technical mandate. Perks are table stakes; a greenfield IAM rebuild is a reason to return a call." },
      { h2: "5. Move like you mean it" },
      { p: "Top security candidates are off the market in under three weeks. A five-round, six-week process is a decision to lose them. Two focused rounds plus a fast, calibrated offer beats an exhaustive process that ends in a counteroffer you can't match." },
      { p: "Security talent scarcity is permanent. Process speed, live comp data, and disciplined passive-candidate engagement are the only levers that reliably work — and they're exactly the levers an agentic search model is built around." },
    ],
  },
  {
    slug: "how-staffing-firms-recruit-recruiters",
    category: "Staffing Industry",
    title: "We Recruit Recruiters: How Top Staffing Firms Build Their Own Teams",
    date: "2026-05-18",
    readTime: "5 min",
    excerpt:
      "The hardest search in staffing is hiring for your own desk. Why recruiting recruiters is uniquely difficult, and how firms that do it well evaluate books of business, ramp time, and grit.",
    body: [
      { p: "Staffing executives will happily run a retained search for a client's VP of Engineering, then struggle for two quarters to fill a desk on their own floor. Recruiting recruiters is genuinely hard — the candidates are professional negotiators, the performers are visible to every competitor, and the failure cost of a bad producer hire is a year of missed billings." },
      { h2: "Why it's harder than client searches" },
      { ul: [
        "The best recruiters are recruited constantly — they've heard every pitch, including yours.",
        "Books of business are opaque: claimed billings, splits, and client ownership need real diligence.",
        "Culture fit is existential in a producer business — one toxic big biller can empty a bullpen.",
        "Non-competes and garden leave complicate timing in ways corporate hires rarely face.",
      ]},
      { h2: "What the firms that do it well actually evaluate" },
      { p: "Ramp time beats résumé. A recruiter who consistently builds a desk from zero in two quarters — verifiable through references and W-2 trajectory, not claimed numbers — is worth more than a bigger name whose billings rode a house account. The diligence questions that matter: How much of the book travels? Who actually owned the client relationships? What did production look like in the down year?" },
      { h2: "The market map matters more in staffing than anywhere" },
      { p: "Staffing is a small industry that thinks it's big. A continuously maintained map of who bills what, who just lost a protected territory, and which offices are melting down after an acquisition turns \"post and pray\" into precision hiring. This is exactly what we run agents against all day — because staffing talent is not just an industry we serve, it's a dedicated practice." },
      { h2: "Timing is the whole game" },
      { p: "Recruiters move when comp plans change, when new ownership arrives, or when their manager leaves — not when your req opens. Firms that win producer talent maintain warm relationships with mapped candidates for months so they're the first call on the day the trigger event hits. That patience is expensive with humans and nearly free with agents." },
    ],
  },
  {
    slug: "talent-intelligence-market-mapping-advantage",
    category: "Talent Intelligence",
    title: "Talent Intelligence: Turning Market Maps into Hiring Advantage",
    date: "2026-04-27",
    readTime: "5 min",
    excerpt:
      "Most companies hire blind — they see applicants, not the market. What continuous market mapping reveals about competitors, comp, and timing, and how to use it beyond a single search.",
    body: [
      { p: "Most hiring decisions are made while seeing five percent of the market: the people who applied. Talent intelligence is the discipline of seeing the other ninety-five — everyone who holds the role today, what they earn, who employs them, and which of them are one trigger event away from moving." },
      { h2: "What a real market map contains" },
      { ul: [
        "Population: how many people genuinely match the role in your target geography or remote pool.",
        "Concentration: which companies employ them — and which are bleeding them after a reorg or acquisition.",
        "Compensation: what offers are actually clearing this quarter, not what last year's survey said.",
        "Movement signals: tenure cliffs, leadership departures, funding events that historically precede exits.",
      ]},
      { h2: "The decisions it changes" },
      { p: "With a live map, questions that used to be guesswork become arithmetic. Should this role be remote? Check what doubling the pool does to comp and quality. Is the req underpriced? Compare against clearing offers, not postings. Should we build in Austin or Denver? Count the talent, don't poll opinions. Why did we lose two finalists? Look at who else was bidding and at what number." },
      { h2: "Why continuous beats commissioned" },
      { p: "A market study commissioned for one search is stale before the role closes. Continuous mapping — the kind autonomous agents maintain as a side effect of running searches — compounds: every search enriches the map, and every new search starts from it instead of from zero. That's why agentic firms can show you a credible shortlist in days; the map already existed." },
      { p: "Talent intelligence used to be a luxury reserved for retained executive searches. Agents made it a standing capability. Hiring against a live map isn't just faster — it changes which battles you choose to fight." },
    ],
  },
  {
    slug: "executive-search-in-the-agentic-era",
    category: "Executive Hiring",
    title: "Executive Search in the Agentic Era: Coverage Meets Discretion",
    date: "2026-04-06",
    readTime: "5 min",
    excerpt:
      "Retained search has always sold judgment and network. Agentic technology quietly fixes its weakest link — coverage — while leaving the confidential, human craft of closing leaders untouched.",
    body: [
      { p: "Retained executive search has run the same way for fifty years: a senior partner's network, a researcher's list, a discreet series of conversations. The craft at the top of that funnel — judgment, discretion, persuasion — has aged well. The research layer underneath it has not." },
      { h2: "The dirty secret of executive shortlists" },
      { p: "Most shortlists are built from who the firm already knows, plus a few weeks of manual research. Strong candidates get missed not because they were unreachable, but because no human had time to look everywhere. When a search fails at month four, it usually failed in week two — in the coverage." },
      { h2: "What agents change" },
      { p: "Market mapping agents make the coverage question mechanical: every credible leader in the space is identified, not just the ones in the Rolodex — including operators at quiet companies, rising VPs one level below the title, and executives whose vesting cliffs or board changes make them newly movable. The partner still decides who is right. But now they decide from the whole market." },
      { h2: "What agents must never touch" },
      { ul: [
        "First contact with a sitting executive — botched automation here burns reputations.",
        "Confidential mandates, where a leak can move stock or trigger departures.",
        "Assessment, references, and the offer — trust work, human work.",
      ]},
      { h2: "What to ask your next search partner" },
      { p: "How many people did you map before you called anyone? How current is your comp data for this exact role? Will we see the full market picture or just the shortlist? Firms running agentic research answer instantly, with numbers. Firms selling a network alone change the subject. Both models place executives — only one can prove it looked everywhere first." },
    ],
  },
];

module.exports = { articles };
