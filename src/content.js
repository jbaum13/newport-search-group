// ============================================================================
// Newport Search Group — Single Source of Truth
// ----------------------------------------------------------------------------
// Every page's copy and structure lives here. The static-site generator
// (build.js) renders this to HTML, and the Wix export (build.js --wix) renders
// the same data to paste-ready Markdown. Edit copy here, in ONE place.
//
// Section model: each page is an array of section objects with a `type`.
// Supported types: hero, intro, cards, list, split, stats, logos, faq,
//                  cta, form, breadcrumbHero, richText.
// ============================================================================

const site = {
  name: "Newport Search Group",
  category: "Agentic Staffing Company",
  tagline: "Human Connection. Agentic Execution.",
  domain: "newportsg.com",
  email: "hello@newportsg.com",
  schedulingUrl: "mailto:jason@newportsg.com?subject=Schedule%20a%20Consultation",
  phone: "(949) 555-0100",
  positioning:
    "Newport Search Group is an Agentic Staffing Company built for the future of hiring. We pair autonomous AI agents with experienced recruiters to deliver faster searches, deeper talent intelligence, and better hiring outcomes. Our technology works around the clock while our recruiters focus on what matters most — building relationships and securing exceptional talent.",
};

// ---------------------------------------------------------------------------
// Navigation (header). `children` renders a dropdown.
// ---------------------------------------------------------------------------
const nav = [
  { label: "Home", route: "/" },
  { label: "Agentic Platform", route: "/agentic-platform" },
  {
    label: "Services",
    route: "/staffing-solutions",
    children: [
      { label: "Overview", route: "/staffing-solutions" },
      { label: "Direct Hire", route: "/staffing-solutions/direct-hire" },
      { label: "Contract Staffing", route: "/staffing-solutions/contract-staffing" },
      { label: "RPO", route: "/staffing-solutions/rpo" },
      { label: "Executive Search", route: "/staffing-solutions/executive-search" },
    ],
  },
  { label: "Staffing Industry", route: "/staffing-industry" },
  {
    label: "Industries",
    route: "/industries",
    children: [
      { label: "Overview", route: "/industries" },
      { label: "Cybersecurity & Identity", route: "/industries/cybersecurity" },
      { label: "Advanced Energy", route: "/industries/energy" },
      { label: "Aerospace & Defense", route: "/industries/aerospace-defense" },
      { label: "Manufacturing", route: "/industries/manufacturing" },
      { label: "Technology", route: "/industries/technology" },
      { label: "Staffing & Recruiting", route: "/industries/staffing" },
    ],
  },
  { label: "Jobs", route: "/jobs" },
  { label: "Resources", route: "/resources" },
  { label: "Contact", route: "/contact", cta: true },
];

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const footer = {
  tagline: site.tagline,
  blurb:
    "An agentic staffing company pairing autonomous AI recruiting agents with experienced search professionals.",
  columns: [
    {
      title: "Company",
      links: [
        { label: "About", route: "/about" },
        { label: "Agentic Platform", route: "/agentic-platform" },
        { label: "Contact", route: "/contact" },
        // Timecard portal — separate Next.js app on Vercel. DISABLED 2026-07-13:
        // the deployment at newport-timecard.vercel.app returns
        // DEPLOYMENT_NOT_FOUND. Re-enable with the working URL once redeployed.
        // { label: "Portal", route: "https://newport-timecard.vercel.app" },
      ],
    },
    {
      title: "Services",
      links: [
        { label: "Direct Hire", route: "/staffing-solutions/direct-hire" },
        { label: "Contract Staffing", route: "/staffing-solutions/contract-staffing" },
        { label: "RPO", route: "/staffing-solutions/rpo" },
        { label: "Executive Search", route: "/staffing-solutions/executive-search" },
      ],
    },
    {
      title: "Industries",
      links: [
        { label: "Cybersecurity", route: "/industries/cybersecurity" },
        { label: "Energy", route: "/industries/energy" },
        { label: "Aerospace & Defense", route: "/industries/aerospace-defense" },
        { label: "Manufacturing", route: "/industries/manufacturing" },
        { label: "Technology", route: "/industries/technology" },
        { label: "Staffing", route: "/industries/staffing" },
      ],
    },
    {
      title: "Staffing Industry",
      links: [
        { label: "Recruiters", route: "/staffing-industry#recruiting" },
        { label: "Sales Leaders", route: "/staffing-industry#sales" },
        { label: "Executives", route: "/staffing-industry#leadership" },
        { label: "Offshore Recruiting", route: "/staffing-industry#offshore" },
        { label: "M&A Support", route: "/staffing-industry#ma" },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Pages — each: { route, title, description (SEO meta), sections: [...] }
// ---------------------------------------------------------------------------
const pages = [
  // ===================== HOME =====================
  {
    route: "/",
    title: "Newport Search Group | Agentic Staffing Company",
    description:
      "Newport Search Group is an agentic staffing company pairing autonomous AI recruiting agents with experienced recruiters for faster searches and better hires.",
    sections: [
      {
        type: "hero",
        eyebrow: "Human Connection, Agentic Execution",
        headline: "The Future of Hiring Is Agentic",
        sub: "Newport Search Group combines autonomous AI agents with experienced recruiters to deliver faster searches, deeper talent intelligence, and better hiring outcomes.",
        primary: { label: "Schedule a Consultation", route: site.schedulingUrl },
        secondary: { label: "Request Talent", route: "/contact?intent=talent" },
        stats: [
          { value: "24/7", label: "Continuous sourcing" },
          { value: "3x", label: "Faster pipeline build" },
          { value: "100%", label: "Human-led closing" },
        ],
      },
      {
        type: "intro",
        eyebrow: "What Is Agentic Recruiting?",
        headline: "Recruiters set the strategy. Agents do the work that never sleeps.",
        body: "Traditional recruiting is capped by human bandwidth — a recruiter can only source, screen, and follow up with so many people in a day. Agentic recruiting removes that ceiling. Our autonomous agents run sourcing, market mapping, candidate engagement, and intelligence workflows around the clock, then hand qualified, contextualized candidates to our recruiters. The result: the speed and coverage of automation with the judgment and trust of an experienced human team.",
        cta: { label: "Explore the Agentic Platform", route: "/agentic-platform" },
      },
      {
        // Trust strip — swap these for real client logos/names when available
        type: "logos",
        label: "Placing critical talent across",
        items: ["Cybersecurity & Identity", "Advanced Energy", "Aerospace & Defense", "Manufacturing", "Technology", "Staffing & Recruiting"],
      },
      {
        type: "cards",
        eyebrow: "Staffing Solutions",
        headline: "Hiring models built for how you actually scale",
        cards: [
          { icon: "direct-hire", title: "Direct Hire", body: "Permanent placement across technical, operational, commercial, and executive functions.", route: "/staffing-solutions/direct-hire" },
          { icon: "contract", title: "Contract Staffing", body: "Flexible workforce solutions that let you scale quickly while keeping operational control.", route: "/staffing-solutions/contract-staffing" },
          { icon: "rpo", title: "RPO", body: "Embedded recruiting teams powered by agentic technology and senior recruiting leadership.", route: "/staffing-solutions/rpo" },
          { icon: "executive", title: "Executive Search", body: "Retained search for the leaders who define the next chapter of your company.", route: "/staffing-solutions/executive-search" },
        ],
      },
      {
        type: "split",
        eyebrow: "Staffing Industry Solutions",
        headline: "We Recruit Recruiters",
        body: "Staffing firms, search firms, RPO providers, MSPs, and workforce solutions companies come to us to build their own recruiting, sales, and leadership teams — and to modernize how they operate with agentic technology.",
        bullets: [
          "Recruiting, sales & leadership talent for staffing firms",
          "Offshore recruiting team buildouts",
          "Agentic recruiting transformation",
          "Corporate development & staffing M&A support",
        ],
        cta: { label: "Explore Staffing Industry Solutions", route: "/staffing-industry" },
      },
      {
        type: "cards",
        eyebrow: "Industries Served",
        headline: "Deep specialization where talent is scarce",
        cards: [
          { icon: "cyber", title: "Cybersecurity & Identity", body: "IAM, PAM, CIAM, cloud and application security, GRC.", route: "/industries/cybersecurity" },
          { icon: "energy", title: "Advanced Energy", body: "Power generation, infrastructure, and energy innovation.", route: "/industries/energy" },
          { icon: "aerospace", title: "Aerospace & Defense", body: "Mission-driven technical, operational, and leadership talent.", route: "/industries/aerospace-defense" },
          { icon: "manufacturing", title: "Manufacturing", body: "Production, quality, engineering, supply chain, plant leadership.", route: "/industries/manufacturing" },
          { icon: "technology", title: "Technology", body: "Engineering, product, sales, and leadership for growth and enterprise.", route: "/industries/technology" },
          { icon: "staffing", title: "Staffing & Recruiting", body: "Talent for the firms that build other companies' teams.", route: "/industries/staffing" },
        ],
      },
      // TODO: Re-enable when a real client quote is available — the renderer
      // and styles are already live; just fill in quote/name/role and uncomment.
      // {
      //   type: "testimonial",
      //   quote: "…",
      //   name: "Client Name",
      //   role: "Title, Company",
      // },
      {
        type: "stats",
        eyebrow: "Why Newport",
        headline: "The advantages of automation, none of the cold-machine feeling",
        items: [
          { value: "Always on", label: "Agents source and engage candidates 24/7, across time zones." },
          { value: "Deeper intel", label: "Continuous market mapping means you see the whole talent landscape, not a slice." },
          { value: "Human-led", label: "Every relationship and every close is owned by an experienced recruiter." },
          { value: "Scalable", label: "Add capacity without adding headcount or sacrificing quality." },
        ],
      },
      {
        type: "cta",
        headline: "Let's build your team.",
        body: "Whether you need one critical hire, an entire project team, or recruiters for your staffing firm, Newport delivers talent solutions built for the future.",
        primary: { label: "Schedule a Consultation", route: site.schedulingUrl },
        secondary: { label: "Request Talent", route: "/contact?intent=talent" },
      },
    ],
  },

  // ===================== ABOUT =====================
  {
    route: "/about",
    title: "About | Newport Search Group",
    description:
      "Newport Search Group was founded on a belief: technology should make recruiters better, not replace them. Meet the agentic staffing company.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "About",
        headline: "Built by recruiters. Powered by agents.",
        sub: "We were founded on a simple belief: technology should make recruiters better — not replace them.",
      },
      {
        type: "intro",
        eyebrow: "Our Story",
        headline: "Recruiting was overdue for a new operating model",
        body: "For decades, the limit on a search has been the same: how many people one recruiter can reach in a day. Newport Search Group was created to break that limit. We combine autonomous recruiting agents with experienced talent professionals to create a faster, smarter, and more relationship-driven hiring model — one where technology handles scale and humans handle trust.",
      },
      {
        type: "split",
        eyebrow: "Mission",
        headline: "Better hiring outcomes for everyone in the search",
        body: "Our mission is to make hiring faster and more human at the same time. Agents expand what's possible; recruiters make it meaningful. We measure ourselves on the quality of the people we place and the strength of the relationships we keep long after the search closes.",
        bullets: [
          "Speed without sacrificing fit",
          "Coverage of the entire market, not just the active candidates",
          "Relationships that outlast a single placement",
        ],
      },
      {
        type: "cards",
        eyebrow: "Leadership Philosophy",
        headline: "How we operate",
        cards: [
          { title: "Agents do the work that scales", body: "Sourcing, mapping, outreach, and research run continuously and tirelessly." },
          { title: "Recruiters do the work that matters", body: "Judgment, advocacy, negotiation, and relationships stay firmly human." },
          { title: "Clients see the whole picture", body: "Continuous market intelligence keeps every search transparent and informed." },
        ],
      },
      {
        type: "intro",
        eyebrow: "Why Human Relationships Still Matter",
        headline: "Automation finds people. Trust closes them.",
        body: "The best candidates are rarely looking, and they don't make career decisions because of a clever algorithm — they make them because someone they trust gave them honest counsel at the right moment. That's the part we will never automate. Our agents create the time and the intelligence; our recruiters spend it on the conversations that change careers.",
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== AGENTIC PLATFORM =====================
  {
    route: "/agentic-platform",
    title: "Agentic Platform | Newport Search Group",
    description:
      "Meet your digital recruiting workforce — talent discovery, market mapping, candidate engagement, intelligence, and operations agents working 24/7.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Agentic Platform",
        headline: "Meet your digital recruiting workforce",
        sub: "Traditional recruiting is limited by human bandwidth. Agentic recruiting is not. Our agents execute sourcing, market mapping, engagement, and intelligence workflows continuously — so our recruiters can focus on judgment, relationships, and closing.",
        primary: { label: "Schedule a Consultation", route: site.schedulingUrl },
      },
      {
        type: "cards",
        eyebrow: "The Agents",
        headline: "Five specialized agent teams, one search",
        cards: [
          { title: "Talent Discovery Agents", body: "Continuously source active and passive candidates across every channel, building living pipelines instead of one-time lists." },
          { title: "Market Mapping Agents", body: "Map entire companies, teams, and talent pools so you see the complete landscape — competitors, comp, and where the best people sit today." },
          { title: "Candidate Engagement Agents", body: "Initiate and nurture personalized outreach at scale, keeping passive candidates warm until the right moment and a recruiter takes over." },
          { title: "Talent Intelligence Agents", body: "Synthesize market data, compensation benchmarks, and competitor signals into briefings your team and your hiring managers can act on." },
          { title: "Recruiting Operations Agents", body: "Handle scheduling, status tracking, data hygiene, and reporting so nothing slips and everyone stays aligned." },
        ],
      },
      {
        type: "split",
        eyebrow: "The Model",
        headline: "Agents handle scale. Humans handle judgment.",
        body: "Every Newport search runs on a simple division of labor. The agents work the parts of recruiting that reward speed, repetition, and coverage. The recruiters work the parts that reward experience, empathy, and trust. You get both — without choosing between them.",
        bullets: [
          "Agents: source, map, engage, research, operate",
          "Recruiters: qualify, advise, advocate, negotiate, close",
          "You: a faster search with a human you actually trust",
        ],
      },
      {
        type: "stats",
        eyebrow: "Benefits",
        headline: "What an agentic workforce changes",
        items: [
          { value: "Faster", label: "Searches that start the moment you do — pipelines build overnight, not over weeks." },
          { value: "Visible", label: "Better talent visibility through continuous, complete market mapping." },
          { value: "Engaged", label: "Stronger passive-candidate engagement that keeps the best people in play." },
          { value: "Scalable", label: "Recruiting capacity that flexes up and down without rehiring." },
        ],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== STAFFING SOLUTIONS OVERVIEW =====================
  {
    route: "/staffing-solutions",
    title: "Staffing Solutions | Newport Search Group",
    description:
      "Direct hire, contract staffing, RPO, and executive search — flexible hiring models powered by agentic recruiting and human relationships.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Staffing Solutions",
        headline: "Flexible hiring models, one agentic engine",
        sub: "However you need to hire — one critical leader, a project team, or an embedded recruiting function — Newport delivers it with the speed of agents and the judgment of experienced recruiters.",
      },
      {
        type: "cards",
        eyebrow: "Services",
        headline: "Choose the model that fits the moment",
        cards: [
          { title: "Direct Hire", body: "Permanent placement for high-growth companies across technical, operational, commercial, and executive functions.", route: "/staffing-solutions/direct-hire" },
          { title: "Contract Staffing", body: "Flexible workforce solutions to scale quickly while maintaining operational control.", route: "/staffing-solutions/contract-staffing" },
          { title: "RPO", body: "Embedded recruiting teams powered by agentic technology and recruiting leadership.", route: "/staffing-solutions/rpo" },
          { title: "Executive Search", body: "Retained search for the leaders who set strategy and culture.", route: "/staffing-solutions/executive-search" },
        ],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== DIRECT HIRE =====================
  {
    route: "/staffing-solutions/direct-hire",
    title: "Direct Hire | Newport Search Group",
    description:
      "Permanent placement solutions for high-growth companies seeking exceptional talent across technical, operational, commercial, and executive functions.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Staffing Solutions / Direct Hire",
        headline: "Permanent placement, built for high-growth teams",
        sub: "Permanent placement solutions for companies seeking exceptional talent across technical, operational, commercial, and executive functions.",
        primary: { label: "Request Talent", route: "/contact?intent=talent" },
      },
      {
        type: "intro",
        eyebrow: "How it works",
        headline: "A complete market, surfaced in days",
        body: "Our discovery and mapping agents build a complete picture of the available talent — including the passive candidates who never apply — within days of kickoff. Your dedicated recruiter then qualifies, advises, and advocates through to offer and close. You get the coverage of a large team and the accountability of a single trusted partner.",
      },
      {
        type: "list",
        eyebrow: "Specialties",
        headline: "Functions we place",
        items: ["Engineering", "Manufacturing", "Operations", "Finance & Accounting", "Sales", "Cybersecurity", "Executive Leadership"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== CONTRACT STAFFING =====================
  {
    route: "/staffing-solutions/contract-staffing",
    title: "Contract Staffing | Newport Search Group",
    description:
      "Flexible contract and contract-to-hire workforce solutions that help companies scale quickly while maintaining operational control.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Staffing Solutions / Contract Staffing",
        headline: "Scale your workforce without losing control",
        sub: "Flexible workforce solutions that help companies scale quickly while maintaining operational control.",
        primary: { label: "Request Talent", route: "/contact?intent=talent" },
      },
      {
        type: "intro",
        eyebrow: "How it works",
        headline: "Capacity when you need it, quality every time",
        body: "When timelines move faster than headcount approvals, contract staffing keeps your projects on track. Our agents keep a continuously refreshed bench of vetted talent, so we can mobilize contractors, project teams, or contract-to-hire candidates quickly — without compromising on the quality bar you'd hold for a permanent hire.",
      },
      {
        type: "list",
        eyebrow: "Solutions",
        headline: "Ways we deploy contract talent",
        items: ["Technical contractors", "Manufacturing workforce", "Project teams", "Contract-to-hire", "Specialized consultants"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== RPO =====================
  {
    route: "/staffing-solutions/rpo",
    title: "RPO | Newport Search Group",
    description:
      "Recruitment Process Outsourcing — embedded recruiting teams powered by agentic technology and experienced recruiting leadership.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Staffing Solutions / RPO",
        headline: "Your recruiting function, embedded and amplified",
        sub: "Embedded recruiting teams powered by agentic technology and experienced recruiting leadership.",
        primary: { label: "Schedule a Consultation", route: site.schedulingUrl },
      },
      {
        type: "intro",
        eyebrow: "How it works",
        headline: "An in-house team, without the in-house lead time",
        body: "Newport RPO drops a complete, agent-powered recruiting function into your organization. You get dedicated recruiters, offshore sourcing support, and continuous talent intelligence — operating as an extension of your team, reporting on the metrics you care about, and scaling with your hiring plan.",
      },
      {
        type: "list",
        eyebrow: "Capabilities",
        headline: "What's included",
        items: ["Dedicated recruiting teams", "Offshore recruiting support", "Sourcing operations", "Candidate engagement", "Talent intelligence reporting", "Hiring analytics"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== EXECUTIVE SEARCH =====================
  {
    route: "/staffing-solutions/executive-search",
    title: "Executive Search | Newport Search Group",
    description:
      "Retained executive search for the leaders who define your company's next chapter — powered by agentic market mapping and senior recruiters.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Staffing Solutions / Executive Search",
        headline: "Find the leaders who define what's next",
        sub: "Retained search for the executives and senior leaders who set strategy, build teams, and shape culture.",
        primary: { label: "Schedule a Consultation", route: site.schedulingUrl },
      },
      {
        type: "intro",
        eyebrow: "How it works",
        headline: "Complete market mapping, discreet human outreach",
        body: "Executive searches are won on coverage and discretion. Our market mapping agents identify every credible leader in your space — including those no one else is talking to — while our senior recruiters manage confidential, high-touch outreach and assessment. The result is a shortlist built from the entire market, not just the names already on a competitor's list.",
      },
      {
        type: "list",
        eyebrow: "Mandates",
        headline: "Where we lead searches",
        items: ["C-Suite (CEO, COO, CRO, CFO, CISO)", "Vice Presidents & General Managers", "Functional Heads", "Board & Advisory", "Private Equity Portfolio Leadership"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== STAFFING INDUSTRY =====================
  {
    route: "/staffing-industry",
    title: "Staffing Industry Solutions | We Recruit Recruiters",
    description:
      "Newport helps staffing firms, search firms, RPO and MSP providers build high-performing recruiting, sales, and leadership teams. We recruit recruiters.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Staffing Industry Solutions",
        headline: "We Recruit Recruiters",
        sub: "Newport Search Group helps staffing firms, search firms, RPO providers, MSP organizations, and workforce solutions companies build high-performing recruiting, sales, and leadership teams — and modernize how they operate.",
        primary: { label: "Build Your Team", route: "/contact?intent=talent" },
      },
      {
        type: "intro",
        eyebrow: "Why us",
        headline: "We know your business because it's our business",
        body: "Hiring recruiters is hard precisely because the best ones are the hardest to reach. We speak the language of billings, desks, splits, and ramp time — and our agents map the staffing talent market continuously, so we know who's performing, who's moving, and who's ready before your competitors do.",
      },
      {
        type: "list",
        id: "recruiting",
        eyebrow: "Recruiting Roles",
        headline: "Recruiting talent we place",
        items: ["Executive Recruiters", "Senior Recruiters", "Technical Recruiters", "Healthcare Recruiters", "Engineering Recruiters", "Locums Recruiters", "Government Recruiters", "Recruiting Managers", "Directors of Recruiting", "Vice Presidents of Recruiting"],
      },
      {
        type: "list",
        id: "sales",
        eyebrow: "Sales Roles",
        headline: "Sales talent we place",
        items: ["Business Development Executives", "Account Executives", "National Account Managers", "Regional Sales Directors", "Vice Presidents of Sales", "Chief Revenue Officers"],
      },
      {
        type: "list",
        id: "leadership",
        eyebrow: "Leadership Roles",
        headline: "Leadership talent we place",
        items: ["Branch Managers", "Regional Directors", "Managing Directors", "Operations Leaders", "Presidents", "CEOs", "Private Equity Operating Leaders"],
      },
      {
        type: "split",
        id: "offshore",
        eyebrow: "Offshore Recruiting Teams",
        headline: "Stand up offshore recruiting capacity, fast",
        body: "Expand your sourcing and delivery capacity with offshore recruiting teams built and managed to your standards. We recruit, structure, and ramp the team; our agentic platform makes them productive faster.",
        bullets: ["Sourcer and recruiter pods", "Trained on your process and tech stack", "Agent-augmented for higher output", "Managed quality and reporting"],
      },
      {
        type: "split",
        eyebrow: "Agentic Recruiting Transformation",
        headline: "Modernize your firm with agentic recruiting",
        body: "Already have a team? We help staffing and search firms adopt agentic workflows — discovery, mapping, engagement, and intelligence — so your recruiters do more of what only humans can, and your firm competes on speed and coverage.",
        bullets: ["Agentic workflow design", "Tooling and integration guidance", "Recruiter enablement & training", "Productivity benchmarking"],
      },
      {
        type: "split",
        id: "ma",
        eyebrow: "Corporate Development & M&A",
        headline: "Growth, transactions, and operating support",
        body: "From recruiting team buildouts to executive search, staffing M&A support, and corporate development, Newport partners with owners, operators, and private equity to grow and transact with confidence.",
        bullets: ["Recruiting team buildouts", "Offshore recruiting programs", "Agentic recruiting transformation", "Executive search", "Staffing M&A support", "Corporate development support"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== INDUSTRIES OVERVIEW =====================
  {
    route: "/industries",
    title: "Industries | Newport Search Group",
    description:
      "Specialized agentic recruiting for cybersecurity, advanced energy, aerospace & defense, manufacturing, technology, and the staffing industry.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Industries",
        headline: "Specialization where talent is scarce",
        sub: "We focus where the talent market is tightest — and where deep domain knowledge and continuous market mapping make the difference between a search that stalls and one that closes.",
      },
      {
        type: "cards",
        eyebrow: "Industries Served",
        headline: "Sectors we know cold",
        cards: [
          { title: "Cybersecurity & Identity", body: "IAM, PAM, CIAM, cloud security, application security, GRC, risk management.", route: "/industries/cybersecurity" },
          { title: "Advanced Energy", body: "Power generation, infrastructure, and energy innovation.", route: "/industries/energy" },
          { title: "Aerospace & Defense", body: "Mission-driven technical, operational, and leadership talent.", route: "/industries/aerospace-defense" },
          { title: "Manufacturing", body: "Production, operations, quality, engineering, supply chain, plant leadership.", route: "/industries/manufacturing" },
          { title: "Technology", body: "Engineering, product, sales, and leadership for growth-stage and enterprise.", route: "/industries/technology" },
          { title: "Staffing & Recruiting", body: "Talent for staffing firms, search firms, and workforce solutions providers.", route: "/industries/staffing" },
        ],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== INDUSTRY: CYBERSECURITY =====================
  {
    route: "/industries/cybersecurity",
    title: "Cybersecurity & Identity Recruiting | Newport Search Group",
    description:
      "Specialized recruiting across IAM, PAM, CIAM, cloud security, application security, GRC, and risk management.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Industries / Cybersecurity & Identity",
        headline: "Cybersecurity & Identity recruiting",
        sub: "The security talent market is the tightest there is. Our agents map it continuously so your search starts ahead — and our recruiters know the difference between a résumé and real depth.",
        primary: { label: "Request Talent", route: "/contact?intent=talent" },
      },
      {
        type: "list",
        eyebrow: "Focus Areas",
        headline: "Where we specialize",
        items: ["Identity & Access Management (IAM)", "Privileged Access Management (PAM)", "Customer Identity (CIAM)", "Cloud Security", "Application Security", "Governance, Risk & Compliance (GRC)", "Risk Management"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== INDUSTRY: ENERGY =====================
  {
    route: "/industries/energy",
    title: "Advanced Energy Recruiting | Newport Search Group",
    description:
      "Recruiting for organizations building the future of power generation, infrastructure, and energy innovation.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Industries / Advanced Energy",
        headline: "Advanced Energy recruiting",
        sub: "Supporting organizations building the future of power generation, infrastructure, and energy innovation.",
        primary: { label: "Request Talent", route: "/contact?intent=talent" },
      },
      {
        type: "list",
        eyebrow: "Focus Areas",
        headline: "Where we specialize",
        items: ["Power Generation", "Grid & Infrastructure", "Renewables & Storage", "Engineering & EPC", "Project Development", "Operations & Plant Leadership"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== INDUSTRY: AEROSPACE & DEFENSE =====================
  {
    route: "/industries/aerospace-defense",
    title: "Aerospace & Defense Recruiting | Newport Search Group",
    description:
      "Helping mission-driven aerospace and defense organizations secure technical, operational, and leadership talent.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Industries / Aerospace & Defense",
        headline: "Aerospace & Defense recruiting",
        sub: "Helping mission-driven aerospace and defense organizations secure technical, operational, and leadership talent.",
        primary: { label: "Request Talent", route: "/contact?intent=talent" },
      },
      {
        type: "list",
        eyebrow: "Focus Areas",
        headline: "Where we specialize",
        items: ["Systems & Hardware Engineering", "Avionics & Software", "Manufacturing & Production", "Quality & Compliance", "Program Management", "Operational & Executive Leadership"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== INDUSTRY: MANUFACTURING =====================
  {
    route: "/industries/manufacturing",
    title: "Manufacturing Recruiting | Newport Search Group",
    description:
      "Recruiting for production, operations, quality, engineering, supply chain, and plant leadership.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Industries / Manufacturing",
        headline: "Manufacturing recruiting",
        sub: "Recruiting for production, operations, quality, engineering, supply chain, and plant leadership.",
        primary: { label: "Request Talent", route: "/contact?intent=talent" },
      },
      {
        type: "list",
        eyebrow: "Focus Areas",
        headline: "Where we specialize",
        items: ["Production & Operations", "Quality & Continuous Improvement", "Manufacturing & Process Engineering", "Supply Chain & Procurement", "Maintenance & Reliability", "Plant & Site Leadership"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== INDUSTRY: TECHNOLOGY =====================
  {
    route: "/industries/technology",
    title: "Technology Recruiting | Newport Search Group",
    description:
      "Building engineering, product, sales, and leadership teams for growth-stage and enterprise technology companies.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Industries / Technology",
        headline: "Technology recruiting",
        sub: "Building engineering, product, sales, and leadership teams for growth-stage and enterprise technology companies.",
        primary: { label: "Request Talent", route: "/contact?intent=talent" },
      },
      {
        type: "list",
        eyebrow: "Focus Areas",
        headline: "Where we specialize",
        items: ["Software & Platform Engineering", "Data & AI/ML", "Product & Design", "Go-to-Market & Sales", "Customer Success", "Technology Leadership"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== INDUSTRY: STAFFING =====================
  {
    route: "/industries/staffing",
    title: "Staffing & Recruiting Industry Talent | Newport Search Group",
    description:
      "Specialized recruiting for staffing firms, search firms, workforce solutions providers, and recruiting organizations.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Industries / Staffing & Recruiting",
        headline: "Staffing & Recruiting industry talent",
        sub: "Specialized recruiting for staffing firms, search firms, workforce solutions providers, and recruiting organizations.",
        primary: { label: "Build Your Team", route: "/contact?intent=talent" },
      },
      {
        type: "split",
        eyebrow: "Deep dive",
        headline: "The full picture: We Recruit Recruiters",
        body: "This is more than an industry for us — it's a dedicated practice. See the recruiting, sales, and leadership roles we place, plus offshore buildouts, agentic transformation, and M&A support.",
        cta: { label: "Explore Staffing Industry Solutions", route: "/staffing-industry" },
        bullets: ["Recruiting, sales & leadership roles", "Offshore recruiting teams", "Agentic recruiting transformation", "Staffing M&A support"],
      },
      { type: "ctaRef", ref: "buildYourTeam" },
    ],
  },

  // ===================== JOBS =====================
  {
    route: "/jobs",
    title: "Jobs | Newport Search Group",
    description:
      "Search jobs, upload your resume, and set job alerts across engineering, manufacturing, cybersecurity, executive, sales, and operations roles.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Jobs",
        headline: "Find your next role",
        sub: "Search open roles, apply online, and set alerts so the right opportunity finds you.",
        primary: { label: "Submit Your Resume", route: "/contact?intent=candidate" },
      },
      {
        type: "jobsearch",
        eyebrow: "Search",
        headline: "Browse open roles",
      },
      {
        type: "cards",
        eyebrow: "Categories",
        headline: "Explore by category",
        cards: [
          { title: "Engineering", body: "Software, hardware, systems, and platform roles." },
          { title: "Manufacturing", body: "Production, quality, supply chain, and plant leadership." },
          { title: "Cybersecurity", body: "IAM, cloud security, AppSec, GRC, and risk." },
          { title: "Executive", body: "C-suite, VP, and functional leadership mandates." },
          { title: "Staffing Industry", body: "Recruiters, sales, and leadership for staffing firms." },
          { title: "Sales", body: "Business development, account management, and revenue leadership." },
          { title: "Operations", body: "Ops leadership, program management, and continuous improvement." },
        ],
      },
      {
        type: "split",
        eyebrow: "Stay in the loop",
        headline: "Set up job alerts",
        body: "Tell us what you're looking for and we'll notify you when matching roles open. Upload your resume once and our recruiters — backed by agentic talent intelligence — will reach out when there's a genuine fit.",
        cta: { label: "Submit Your Resume", route: "/contact?intent=candidate" },
      },
    ],
  },

  // ===================== RESOURCES =====================
  {
    route: "/resources",
    title: "Resources | Newport Search Group",
    description:
      "Insights on agentic recruiting, hiring trends, the staffing industry, talent intelligence, executive hiring, and AI in recruiting.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Resources",
        headline: "Insights from the front lines of agentic recruiting",
        sub: "Perspectives on where hiring is going — and how to win talent in the markets that matter most.",
      },
      {
        // Articles live in src/articles.js — add one there and rebuild.
        type: "articleList",
        eyebrow: "Latest Articles",
        headline: "Browse the latest",
      },
      {
        type: "split",
        eyebrow: "Newsletter",
        headline: "Get our talent intelligence briefing",
        body: "A periodic, no-fluff briefing on hiring trends and the agentic recruiting shift. Subscribe and stay ahead of the market.",
        cta: { label: "Subscribe", route: "/contact?intent=subscribe" },
      },
    ],
  },

  // ===================== CONTACT =====================
  {
    route: "/contact",
    title: "Contact | Newport Search Group",
    description:
      "Let's build your team. Whether you need one critical hire, a project team, or recruiters for your staffing firm, Newport delivers.",
    sections: [
      {
        type: "breadcrumbHero",
        eyebrow: "Contact",
        headline: "Let's build your team.",
        sub: "Whether you need one critical hire, an entire project team, or recruiters for your staffing firm, Newport Search Group delivers talent solutions built for the future.",
      },
      { type: "form" },
    ],
  },
];

// Reusable CTA blocks referenced by `ctaRef`
const ctaBlocks = {
  buildYourTeam: {
    type: "cta",
    headline: "Let's build your team.",
    body: "Whether you need one critical hire, an entire project team, or recruiters for your staffing firm, Newport delivers talent solutions built for the future.",
    primary: { label: "Schedule a Consultation", route: site.schedulingUrl },
    secondary: { label: "Request Talent", route: "/contact?intent=talent" },
  },
};

const seoKeywords = [
  "agentic staffing company", "AI recruiting firm", "executive search firm",
  "contract staffing agency", "staffing industry recruiting", "recruit recruiters",
  "cybersecurity recruiting", "manufacturing staffing", "aerospace recruiting", "energy recruiting",
];

module.exports = { site, nav, footer, pages, ctaBlocks, seoKeywords };
