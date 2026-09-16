// ============================================================================
// Beacon — market intelligence agent (lighthouse). "Greater Opportunities Ahead."
//
// A profile for the runtime in src/agent-core.js. Beacon is the employer-facing
// counterpart to Finn: he talks about talent markets, workforce strategy, and
// how Newport produces intelligence — and he routes qualified conversations to
// business development.
//
// THE GUARDRAIL THAT MATTERS: Beacon has no market dataset connected. He must
// never state a market statistic, a compensation benchmark, a time-to-fill, or
// a named company's hiring activity. Every answer below explains what Newport
// can produce and who to ask; none of them contains a number. Keep it that way
// unless a verified source is wired into the adapter — at which point the
// figures should come from that response, not from this file.
// ============================================================================
(function () {
  "use strict";
  if (!window.NewportAgent) return;

  var CFG = window.NEWPORT_AGENT_CONFIG || {};
  var BASE = CFG.basePath || "";
  var EMAIL = CFG.email || "hello@newportsg.com";
  var CONTACT = BASE + "/contact";
  var TALENT = CONTACT + "?intent=talent";

  window.NewportAgent.mount({
    id: "beacon",
    name: "Beacon",
    role: "Market Intelligence Agent",
    avatar: "beacon-avatar.png",
    placeholder: "Ask Beacon about your talent market…",
    disclaimer: 'Beacon is an AI agent. He reports what Newport can verify and says so when he can’t — ' +
      'for market data specific to your business, <a href="' + TALENT + '">talk to us</a>.',

    welcome: {
      headline: "Meet Beacon",
      subtitle: "Newport’s Market Intelligence Agent",
      message: "I help leaders navigate talent markets, workforce strategy, hiring intelligence, " +
        "and emerging opportunities.",
    },

    quickActions: [
      { label: "Talent market insights" },
      { label: "Salary intelligence" },
      { label: "Hiring trends" },
      { label: "Build a workforce strategy" },
      { label: "Talk to Newport" },
    ],

    // Extra events on top of the runtime's standard set.
    signals: [
      { match: /\b(market|talent pool|supply|availab|competitor|benchmark|salar|comp\b|compensation|trend|signal|mapping)/i,
        event: "market_query" },
    ],

    handoff: {
      title: "Talk to Newport",
      body: "A conversation with our team turns this into something specific to your roles, your market, and your timeline.",
      primary: { label: "Request talent", href: TALENT },
    },

    // Straight to a human: commercial terms, an actual engagement, or a
    // complaint. Note what is deliberately NOT here — compensation and market
    // questions are Beacon's job to field honestly, not to dodge.
    handoffPatterns: [
      /\b(talk|speak|connect|chat|meet)\s+(to|with)\s+(a\s+)?(human|person|someone|rep|recruiter|you|newport)/i,
      /\b(get|want|need|speak|talk|connect|give|put)\b[^.?!]*\b(real|actual)\s+(person|human)\b/i,
      /\b(what do you charge|your (fee|fees|rate|rates|pricing|price)|how much (do|would) (you|it)|cost to (use|engage|hire) (you|newport))/i,
      /\b(contract|msa|agreement|terms|sow|statement of work|invoice|payment terms)\b/i,
      /\b(start a search|engage you|kick off|get started with newport|onboard us|proposal)\b/i,
      /\b(complain|complaint|upset|frustrat|unhappy|legal|dispute)/i,
    ],

    handoffReply: {
      reply: "<p>That’s a conversation for our team rather than for me — commercial terms and live engagements " +
        "sit with people, not with an agent.</p>",
      handoff: true,
    },

    unknown: {
      reply: "<p>I don’t have verified information on that, and I won’t estimate — market numbers that aren’t " +
        "sourced are worse than no numbers.</p>" +
        "<p>Tell me the role or market you’re thinking about and I’ll explain what Newport can actually establish, " +
        "or I can put you in front of our team.</p>",
      actions: ["Talent market insights", "Talk to Newport"],
    },

    // First match wins — narrow intents before broad ones. "salary" must beat
    // "market", and both must beat the generic services answer.
    order: ["greeting", "identity", "salary", "availability", "ma", "signals_intel", "trends",
            "strategy", "offshore", "recruiters", "industries", "market",
            "services", "how", "privacy", "company", "thanks"],

    kb: [
      {
        id: "market",
        match: /\b(market|mapping|landscape|intelligen|research|data|insight|who else|competitor)/i,
        reply:
          "<p>Newport builds talent market maps: the companies that employ the skill you need, the teams inside them, " +
          "where the people sit today, and how each pocket of the market behaves.</p>" +
          "<p>I don’t carry a live dataset in this chat, so I won’t quote you figures. What I can tell you is what a " +
          "market map establishes for a specific role — and our team can run one.</p>",
        cites: [{ label: "The agentic platform", href: BASE + "/agentic-platform" }],
        actions: ["Build a workforce strategy", "Talk to Newport"],
      },
      {
        id: "salary",
        match: /\b(salar|compensation|comp\b|pay (band|range|scale)|what (should|do) (we|i) pay|benchmark|total rewards|equity|bonus)/i,
        reply:
          "<p>Compensation is one of the things Newport benchmarks — against what the market is actually paying for the " +
          "skill, in the geography, at the level you’re hiring.</p>" +
          "<p>I won’t give you a number here. No verified comp dataset is connected to this chat, and an invented band " +
          "is worse than none: it moves offers in the wrong direction. Our team produces real benchmarks as part of a " +
          "search or a market map.</p>",
        actions: ["Talk to Newport", "Talent market insights"],
      },
      {
        id: "availability",
        match: /\b(availab|talent pool|supply|how many|scarce|shortage|candidates? (are|in)|pipeline depth)|\b(hard|tough|difficult|competitive|tight)\s+(market|to (find|fill|hire|recruit))/i,
        reply:
          "<p>Talent availability is knowable — but only by mapping the actual market for your role, not by a rule of thumb.</p>" +
          "<p>I don’t have a verified pool count for your search, so I won’t offer one. A Newport market map gives you the " +
          "real picture: who exists, who’s reachable, and what it takes to move them.</p>",
        actions: ["Build a workforce strategy", "Talk to Newport"],
      },
      {
        id: "trends",
        match: /\b(trend|shifting|changing|future|whats? (happening|next)|outlook|forecast|2026|market conditions)/i,
        reply:
          "<p>The shift Newport is built around: recruiting work that rewards speed and coverage is moving to agents, " +
          "while the work that rewards judgment and trust stays with people. That changes how fast a search starts and " +
          "how complete a market view you can expect.</p>" +
          "<p>Our written perspective is in Resources. For dated, sourced numbers on your market specifically, that’s a " +
          "conversation with our team rather than a claim from me.</p>",
        cites: [{ label: "Resources", href: BASE + "/resources" }],
        actions: ["Talent market insights", "Talk to Newport"],
      },
      {
        id: "signals_intel",
        match: /\b(signal|funding|raised|series [a-d]|layoff|leadership change|stealth|expansion|opened an office|hiring spree)/i,
        reply:
          "<p>Funding, leadership changes, expansion and stealth activity are exactly the signals that tell you when a " +
          "talent pool is about to move.</p>" +
          "<p>I’m not connected to a verified signal feed in this chat, so I won’t tell you what any named company is " +
          "doing. Newport tracks this per engagement, sourced.</p>",
        actions: ["Talk to Newport"],
      },
      {
        id: "strategy",
        match: /\b(strategy|workforce plan|headcount|scale (a|the|our) team|build (a|our) team|org|ramp|capacity|how should we hire)/i,
        reply:
          "<p>Workforce strategy usually comes down to the right mix: what to hire permanently, what to run on contract, " +
          "what to embed with RPO, and what to search for retained.</p>" +
          "<ul><li><strong>Direct hire</strong> — permanent, across technical, operational, commercial and executive roles</li>" +
          "<li><strong>Contract staffing</strong> — scale up and down while keeping operational control</li>" +
          "<li><strong>RPO</strong> — an embedded recruiting team backed by agentic technology</li>" +
          "<li><strong>Executive search</strong> — retained, for the leaders who set the next chapter</li></ul>",
        cites: [{ label: "Staffing solutions", href: BASE + "/staffing-solutions" }],
        actions: ["Talk to Newport", "Talent market insights"],
      },
      {
        id: "offshore",
        match: /\b(offshore|nearshore|philippines|india|global team|remote team build|bpo)/i,
        reply:
          "<p>Newport builds offshore recruiting teams for staffing firms and internal talent functions — sourcing and " +
          "recruiting capacity that runs alongside your onshore team rather than replacing it.</p>",
        cites: [{ label: "Staffing industry solutions", href: BASE + "/staffing-industry" }],
        actions: ["Talk to Newport"],
      },
      {
        id: "recruiters",
        match: /\b(recruit recruiters|hire recruiters|staffing firm|search firm|our recruiting team|sales leaders|bd talent)/i,
        reply:
          "<p>We recruit recruiters. Staffing firms, search firms, RPO providers and MSPs come to Newport to build their " +
          "own recruiting, sales and leadership teams — and to modernize how they operate with agentic technology.</p>",
        cites: [{ label: "Staffing industry solutions", href: BASE + "/staffing-industry" }],
        actions: ["Build a workforce strategy", "Talk to Newport"],
      },
      {
        id: "ma",
        match: /\b(m&a|merger|acquisition|corporate development|sell (my|our) (firm|agency)|buy(ing)? a (firm|agency)|valuation)/i,
        reply:
          "<p>Newport supports corporate development and staffing M&amp;A — the talent and market side of it, not the " +
          "financial advice. I won’t put a number on any firm.</p>",
        cites: [{ label: "M&A support", href: BASE + "/staffing-industry#ma" }],
        actions: ["Talk to Newport"],
      },
      {
        id: "industries",
        match: /\b(industr|sector|vertical|cyber|security|iam\b|energy|aerospace|defen[cs]e|manufactur|technolog)/i,
        reply:
          "<p>Newport specializes where talent is scarce: Cybersecurity &amp; Identity, Advanced Energy, " +
          "Aerospace &amp; Defense, Manufacturing, Technology, and Staffing &amp; Recruiting.</p>" +
          "<p>Specialization is what makes a market map worth anything — it’s the difference between a list of names " +
          "and knowing which ones will move.</p>",
        cites: [{ label: "Industries", href: BASE + "/industries" }],
        actions: ["Talent market insights", "Talk to Newport"],
      },
      {
        id: "services",
        match: /\b(direct hire|contract|rpo\b|executive search|services?\b|hiring model|permanent|retained)/i,
        reply:
          "<p>Four hiring models — direct hire, contract staffing, RPO, and retained executive search — and most " +
          "engagements use more than one.</p>",
        cites: [{ label: "Staffing solutions", href: BASE + "/staffing-solutions" }],
        actions: ["Build a workforce strategy", "Talk to Newport"],
      },
      {
        id: "how",
        match: /\b(how (does|do) (it|you|newport) work|process|duke|scout|your (technology|platform|agents)|methodology)/i,
        reply:
          "<p>Agents handle scale; recruiters handle judgment. Scout maps markets and surfaces signal, Duke builds the " +
          "relationships that actually close, Finn looks after candidates, and I handle market intelligence for employers.</p>" +
          "<p>The recruiters qualify, advise, advocate and negotiate. That division of labor is the whole model.</p>",
        cites: [{ label: "Meet the agents", href: BASE + "/agentic-platform/meet-the-agents" }],
        actions: ["Talent market insights", "Talk to Newport"],
      },
      {
        id: "identity",
        match: /\b(who are you|what are you|beacon\b|lighthouse|are you (a )?(human|real|bot|robot|ai))/i,
        reply:
          "<p>I’m Beacon — Newport’s market intelligence agent, and an AI. I work with Duke and Scout on the search side " +
          "and Finn on the candidate side.</p>" +
          "<p>My job is to be useful about talent markets and honest about the edge of what Newport can verify. " +
          "Greater opportunities ahead.</p>",
        cites: [{ label: "Meet the agents", href: BASE + "/agentic-platform/meet-the-agents" }],
        actions: ["Talent market insights", "Hiring trends"],
      },
      {
        id: "company",
        match: /\b(about newport|what.*newport|what do you (do|guys)|compan(y|ies)|tell me about)/i,
        reply:
          "<p>Newport Search Group is an agentic staffing company — autonomous AI agents paired with experienced " +
          "recruiters, across direct hire, contract, RPO and executive search.</p>" +
          "<p><em>Human Connection. Agentic Execution.</em></p>",
        cites: [{ label: "About Newport", href: BASE + "/about" }],
        actions: ["Build a workforce strategy", "Talk to Newport"],
      },
      {
        id: "privacy",
        match: /\b(privacy|our data|gdpr|confidential|nda|who sees|store)/i,
        reply:
          "<p>Nothing you type here goes into a CRM, and I have no access to candidate records or client data. " +
          "Our conversation stays in this browser tab.</p>" +
          '<p>For anything confidential, email <a href="mailto:' + EMAIL + '">' + EMAIL + "</a> and a person will handle it.</p>",
        actions: ["Talk to Newport"],
      },
      {
        id: "greeting",
        match: /^(hi|hey|hello|yo|good (morning|afternoon|evening)|sup)\b/i,
        reply: "<p>Good to meet you. What market are you hiring into?</p>",
        actions: ["Talent market insights", "Hiring trends", "Build a workforce strategy"],
      },
      {
        id: "thanks",
        match: /\b(thank|cheers|appreciate|great\b|perfect\b|helpful)/i,
        reply: "<p>Any time. Anything else worth looking into?</p>",
        actions: ["Talent market insights", "Talk to Newport"],
      },
    ],
  });
})();
