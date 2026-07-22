export interface TradeWhyRow {
  idx: string;
  heading: string;
  body: string;
}

export interface LayerEx {
  body: string;
  dim: string;
}

export interface TradeFaq {
  q: string;
  a: string;
}

export interface TradeData {
  slug: string;
  tradePlural: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  heroMeta: string;
  headline1: string;
  headline2Em: string;
  headline3Dim?: string;
  heroDeck: string;
  problemCaption: string;
  problemStrong1: string;
  problemDim: string;
  problemStrong2: string;
  whyIdx: string;
  whyLine1: string;
  whyLine2Em: string;
  whyDeck: string;
  whyRows: TradeWhyRow[];
  layerExamples: [LayerEx, LayerEx, LayerEx, LayerEx, LayerEx, LayerEx];
  gaps: string[];
  auditNote: string;
  finalLine1: string;
  finalLine2Em: string;
  finalLine3Dim?: string;
  faqs: TradeFaq[];
}

export const BASE_LAYERS = [
  { num: "01", acro: "GEO", title: "Generative Engine Optimization" },
  { num: "02", acro: "PEO", title: "Prompt Engine Optimization" },
  { num: "03", acro: "AEO", title: "Answer Engine Optimization" },
  { num: "04", acro: "IEO", title: "Index Engine Optimization" },
  { num: "05", acro: "LEO", title: "Local Entity Optimization" },
  { num: "06", acro: "VEO", title: "Voice Engine Optimization" },
] as const;

export const tradesBySlug: Record<string, TradeData> = {

  roofers: {
    slug: "roofers",
    tradePlural: "Roofers",
    metaTitle: "6Signal: AI Visibility Audit for Roofers",
    metaDescription: "AI visibility audits for roofers in Dallas/Fort Worth and North Texas. See where your roofing company appears across AI, Maps, and search.",
    ogTitle: "Be the roofer AI recommends after the storm.",
    ogDescription: "6 Signal helps roofing contractors own the AI shortlist in their market. AI Visibility Brief — $27.",
    heroMeta: "AI Visibility · Built for Roofing Contractors",
    headline1: "Be the roofer",
    headline2Em: "AI recommends after the storm.",
    headline3Dim: "Not the one it skips.",
    heroDeck: "After a storm, homeowners search urgently. They trust whatever AI and Maps surface first. The window is narrow — sometimes 48 hours — and whoever is named when it opens takes the majority of calls. 6 Signal makes sure your company is one of those names before a competitor in your market closes the window.",
    problemCaption: "A real path to a roofing job — 2026",
    problemStrong1: "Tuesday. 10 p.m. A homeowner walks upstairs and finds a wet ceiling after three days of rain. She grabs her phone. \"Best roofer near me for storm damage.\" ChatGPT names three companies.",
    problemDim: "She opens Maps. Two of the three show up with recent reviews and photos. She asks Siri for the closest number. She calls one before she goes to bed.",
    problemStrong2: "You finished a storm-damage job two blocks away last week. She never found your company.",
    whyIdx: "§ 03 — Why this hits roofers hardest",
    whyLine1: "Storm cycles are brief, saturated,",
    whyLine2Em: "and winner-take-most.",
    whyDeck: "Three dynamics in roofing make AI and search visibility more critical here than almost any other trade.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "The search window after a storm is 48 hours — and it goes to whoever appears first.",
        body: "When a weather event hits, every homeowner searches in the same compressed window. The companies already embedded in AI and search results take the majority of calls. The window is short. It closes fast. Being visible on Tuesday when the storm hits matters more than ranking well in the abstract.",
      },
      {
        idx: "02 / 03",
        heading: "Insurance research starts online — and AI is increasingly part of it.",
        body: "Homeowners filing storm claims search for roofers who can handle their carrier, explain the supplement process, and have a track record with insurance work. AI tools increasingly surface companies associated with those specific queries. If your content doesn't signal that expertise, you're invisible to that buyer.",
      },
      {
        idx: "03 / 03",
        heading: "Maps is saturated. The AI layer is still open in most markets.",
        body: "Most roofers have done some Google Business Profile work. The generative AI layer — ChatGPT, Gemini, Perplexity — is largely unclaimed territory in most markets right now. The operators who move first build position that compounds every month until competitors catch up.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'best roofer near me for storm damage' or 'trusted roofing contractor in [city],'",
        dim: "is your company one of the three names in the answer? Most roofing companies aren't. The ones that are didn't get there by accident.",
      },
      {
        body: "'Emergency roof repair after storm.' 'Roofer for wind damage.' 'Insurance claim roof replacement.' 'Metal roofing contractor in [city].'",
        dim: "PEO makes sure your company appears inside the specific searches your storm-damage customers type in the first hour after a weather event.",
      },
      {
        body: "Google now answers roofing questions directly — what to do after storm damage, how to find a trusted roofer, when insurance covers a replacement.",
        dim: "AEO positions your company in those answers so your name appears before the homeowner clicks anything.",
      },
      {
        body: "Your services, service areas, license, certifications, and whether you handle insurance claims",
        dim: "— all need to be structured so every AI system reads them correctly and matches you to the right storm-damage queries.",
      },
      {
        body: "Google Maps, Angi, HomeAdvisor, BBB, Yelp — every directory a storm-damaged homeowner might check.",
        dim: "LEO reconciles all of them so every system sees the same roofing company with the same name, number, and service area.",
      },
      {
        body: "A homeowner on a wet floor at 10 p.m. asks Siri: 'Emergency roofer near me.'",
        dim: "VEO makes sure your company is the answer — hands-free, urgent, and specific to your city.",
      },
    ],
    gaps: [
      "GBP service area doesn't match the cities listed on your website",
      "No storm-damage or emergency-repair page structure — AI can't surface you for those queries",
      "AI tools name competitors when asked for roofers in your city",
      "Directory listings have an old phone number, address, or company name",
      "No structured data (schema) for your services, license, or service area",
      "Reviews mention 'great work' without location or service-type signals that AI can read",
    ],
    auditNote: "For roofing contractors, we specifically prompt ChatGPT, Gemini, and Perplexity for roofers in your city and show you the exact output in your brief — instantly, no call required. You see what a homeowner sees when they ask AI to recommend a roofer after a storm.",
    finalLine1: "Three roofers get named",
    finalLine2Em: "after every storm in your market.",
    finalLine3Dim: "Make sure you're one of them.",
    faqs: [
      {
        q: "I get most of my business from referrals. Do I need this?",
        a: "Referrals are earned and finite. They depend on a satisfied customer being willing to pick up the phone at the right moment. AI recommendations run 24/7, reach homeowners who have no neighbor to ask, and work during every storm — not just when your last customer happens to mention you. It's a parallel channel, not a replacement.",
      },
      {
        q: "I'm already on Angi and HomeAdvisor. Isn't that covered?",
        a: "Directory platforms are one layer — LEO. You're paying for placement inside their system. AI tools don't pull your Angi ranking when a homeowner asks ChatGPT for a roofer. They make their own determination based on signals across the web. That's a different problem than your Angi profile.",
      },
      {
        q: "Storm season is cyclical. Why pay year-round?",
        a: "Position in AI systems is built in the off-season and harvested in the peak. The contractors whose names appear in the first ChatGPT answers in May started visibility work in February. Waiting until the storm hits is waiting until after the window opens.",
      },
      {
        q: "Does this help my Google ranking?",
        a: "Indirectly — structured data, local entity work, and schema support organic rankings as a side effect. The primary goal is appearing in AI recommendations, answer engines, and voice results, each of which runs on different signals than the blue-link algorithm. If your SEO is already strong, this adds the five channels it doesn't cover.",
      },
      {
        q: "Do you work with multiple roofers in my area?",
        a: "No. One roofing company per local market. If your market is open, that position is available to take. If it's already taken, we'll tell you in the first thirty seconds of the audit call.",
      },
    ],
  },

  plumbers: {
    slug: "plumbers",
    tradePlural: "Plumbers",
    metaTitle: "6Signal: AI Visibility Audit for Plumbers",
    metaDescription: "AI visibility audits for plumbers in Dallas/Fort Worth and North Texas. See where your plumbing company appears across AI, Maps, and search.",
    ogTitle: "When the pipe bursts, the buyer asks their phone who to call.",
    ogDescription: "Emergency plumbing creates the purest AI-search moment in home services. 6 Signal gets your company onto that shortlist.",
    heroMeta: "AI Visibility · Built for Plumbing Contractors",
    headline1: "When the pipe bursts,",
    headline2Em: "the buyer asks their phone who to call.",
    headline3Dim: "Be the answer.",
    heroDeck: "Emergency plumbing creates the purest AI-search moment in home services — urgent problem, no time to compare, immediate trust required. 6 Signal makes sure your plumbing company is named when that moment happens in your market.",
    problemCaption: "A real path to a plumbing call — 2026",
    problemStrong1: "Thursday. 11:43 p.m. A homeowner walks into her utility room and finds three inches of water. She grabs her phone. \"Emergency plumber near me open now.\" ChatGPT names three companies. Perplexity names two of the same.",
    problemDim: "She checks Maps. Two have recent emergency reviews and a phone number that rings. She asks Siri which one is closest. She calls the first one that picks up.",
    problemStrong2: "You have a licensed emergency crew ready to roll. She never found your name.",
    whyIdx: "§ 03 — Why this hits plumbers hardest",
    whyLine1: "Emergency plumbing is a zero-delay search event",
    whyLine2Em: "with no comparison shopping.",
    whyDeck: "Three dynamics in plumbing make AI and search visibility the deciding factor in whether a homeowner calls you or a competitor.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "When water is actively on the floor, there is no second call.",
        body: "The homeowner searches, finds the first credible name, and calls. She's not comparing prices. She's not checking three websites. She's on the phone with whoever appeared first and looked credible. The shortlist is made in under sixty seconds.",
      },
      {
        idx: "02 / 03",
        heading: "Trust signals are binary in emergency plumbing.",
        body: "Homeowners let plumbers into their basement at midnight. That's a trust decision made in under two minutes, based on what AI and search can verify — license, insurance, reviews, service area. If those signals aren't clearly structured and readable, she calls the competitor whose are.",
      },
      {
        idx: "03 / 03",
        heading: "24/7 availability and emergency structure are almost never done right.",
        body: "Most plumbers mention 24-hour service somewhere on their website. Almost none have that availability structured in a way that AI tools can surface it in urgent queries. That gap is the opportunity — and most markets still have it open.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'emergency plumber near me open now' or 'best plumber in [city] for a burst pipe,'",
        dim: "is your company one of the three named — including at 11 p.m. on a Thursday?",
      },
      {
        body: "'Emergency plumber near me.' 'Water heater repair [city].' 'Burst pipe repair 24 hours.' 'Drain cleaning same day.' 'Slab leak repair [city].'",
        dim: "PEO makes sure your company appears inside the specific emergency queries your customers type before they call anyone.",
      },
      {
        body: "Google answers plumbing questions — what to do when a pipe bursts, how to shut off your water, who to call for a slab leak.",
        dim: "AEO gets your company cited in those answers so your name appears in the moment of highest urgency.",
      },
      {
        body: "Your services, your 24/7 availability, your service area, your license number",
        dim: "— structured so every AI system can correctly surface you for the right urgent queries, not just generic 'plumber near me.'",
      },
      {
        body: "Google Maps, Yelp, HomeAdvisor, Angi, BBB, city business directories",
        dim: "— reconciled so a homeowner at midnight gets your correct phone number regardless of which platform she checks first.",
      },
      {
        body: "A homeowner with water on the floor asks Siri: 'Emergency plumber near me.'",
        dim: "VEO makes sure your company is the answer — and that the number Siri reads is the one that actually rings.",
      },
    ],
    gaps: [
      "Emergency or 24/7 availability not structured in GBP or schema — AI can't surface you for urgent queries",
      "Service area too narrow or inconsistent across directories",
      "AI tools name competitors when asked for emergency plumbers in your city",
      "Old phone numbers active in three or four directory listings",
      "License and insurance not visible in structured data",
      "Reviews say 'great service' but don't mention specific services — AI can't tell you do water heater replacement",
    ],
    auditNote: "For plumbing contractors, the audit tests emergency queries first — 'emergency plumber near me,' 'burst pipe repair open now' — because emergency is where the highest-value, fastest-converting leads come from. You see the exact AI output for your city, live.",
    finalLine1: "When water is on the floor,",
    finalLine2Em: "three plumbers get called.",
    finalLine3Dim: "One of them should be you.",
    faqs: [
      {
        q: "Most of my calls are word of mouth. Why change what works?",
        a: "Word of mouth is a downstream result of good work. AI visibility is an upstream channel — it reaches homeowners before they have a chance to ask their neighbor. Emergencies in particular don't wait for referrals. They search immediately, find three names, and call.",
      },
      {
        q: "Do emergency searches really go through AI?",
        a: "Yes — and urgency accelerates it. Voice search through Siri and Google Assistant is already the primary channel for emergency home service calls made hands-free. AI Overviews appear above organic results for most plumbing queries. Neither cares about your website's ranking — they require different inputs, which is exactly what we structure.",
      },
      {
        q: "What about Google Local Service Ads?",
        a: "LSAs are a paid channel — they run while you pay and stop when you don't. Organic AI visibility compounds over time. They're not competing, but they're not substitutes either. This is the organic infrastructure underneath paid.",
      },
      {
        q: "Do you work with more than one plumber in my area?",
        a: "No. One plumbing company per local market. If your market is open, you can take it. If not, we'll tell you on the call — and you still get the full visibility read.",
      },
    ],
  },

  hvac: {
    slug: "hvac",
    tradePlural: "HVAC Companies",
    metaTitle: "6Signal: AI Visibility Audit for HVAC Companies",
    metaDescription: "AI visibility audits for HVAC companies in Dallas/Fort Worth and North Texas. See where your company appears across AI, Maps, and search.",
    ogTitle: "When the AC dies in July, the shortlist is set before your phone rings.",
    ogDescription: "Seasonal failure drives compressed, urgent search behavior. 6 Signal gets HVAC companies onto the AI shortlist before competitors answer first.",
    heroMeta: "AI Visibility · Built for HVAC Contractors",
    headline1: "When the AC dies in July,",
    headline2Em: "the shortlist is set before you answer.",
    headline3Dim: "Be on it.",
    heroDeck: "When the AC fails in July, homeowners move from problem to call in minutes — not hours. The companies named in that window built their position before the heat wave arrived, not during it. 6 Signal makes sure your company is one of those names — across AI tools, Maps, and voice — before a competitor in your market answers first.",
    problemCaption: "A real path to an HVAC call — 2026",
    problemStrong1: "Saturday. 2 p.m. July. 96 degrees. The AC stops blowing cold. She checks the thermostat — it's 88 inside. She asks Google Assistant: \"Emergency HVAC repair near me open today.\" Three companies appear.",
    problemDim: "She opens Maps. Two have same-day availability mentions in their recent reviews. One has a 'call now' button and a recent photo of a service van. She calls it.",
    problemStrong2: "You're three miles away. Fully staffed on a Saturday. She never found you.",
    whyIdx: "§ 03 — Why this hits HVAC hardest",
    whyLine1: "Seasonal failure compresses decision cycles",
    whyLine2Em: "into minutes, not days.",
    whyDeck: "Three dynamics in HVAC make AI and search visibility the deciding factor in whether a homeowner calls you during the next heat wave.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "AC failure in summer is a zero-delay search event.",
        body: "There's no consideration phase when the house is 88 degrees and a family is inside. Homeowners search immediately, find the first credible shortlist, and call. Every minute between the failure and your name appearing in AI results costs you that call.",
      },
      {
        idx: "02 / 03",
        heading: "Seasonal search spikes are predictable — and preparation is the advantage.",
        body: "The same weather patterns that drive your busiest weeks drive the same AI search behavior. Contractors who build their AI and search visibility in spring are the ones whose names appear first when July heat hits. Waiting until the heat wave to start is waiting until after the window opens.",
      },
      {
        idx: "03 / 03",
        heading: "HVAC is a high-repeat, high-lifetime-value relationship business.",
        body: "A homeowner who calls for emergency repair becomes a maintenance plan customer. An AI recommendation that generates one call can generate five years of revenue. The economics of visibility work in HVAC are different than they look at first glance.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'best HVAC company near me' or 'emergency AC repair in [city],'",
        dim: "is your company one of the three names? Most HVAC companies aren't — even when they're the best option in the market.",
      },
      {
        body: "'Emergency AC repair open now.' 'HVAC company near me same day.' 'Furnace repair [city].' 'Air conditioning installation near me.' 'Heat pump replacement [city].'",
        dim: "PEO makes sure your company appears inside the specific search language your customers use when their system fails.",
      },
      {
        body: "Google answers HVAC questions directly — what to do when the AC stops working, how to find a trusted HVAC contractor, what refrigerant charge problems look like.",
        dim: "AEO puts your company in those answers so your name appears in the moment before the homeowner calls.",
      },
      {
        body: "Your services, service areas, licensing, equipment brands, and maintenance plan availability",
        dim: "— structured so AI can correctly describe your company and match you to both emergency and planned-maintenance queries.",
      },
      {
        body: "Google Maps, Yelp, HomeAdvisor, Angi, manufacturer dealer locators, equipment brand directories",
        dim: "— reconciled so every platform a homeowner checks shows the same company with the same number and service area.",
      },
      {
        body: "A homeowner with a failing AC asks Google Assistant on her smart speaker: 'Find HVAC repair near me.'",
        dim: "VEO makes sure your company is the answer — correctly tied to your city, your services, and a number that rings.",
      },
    ],
    gaps: [
      "No emergency or same-day availability signals in GBP or schema",
      "Service area set too narrowly in Maps — missing adjacent cities you actually service",
      "AI tools name competitors when asked for HVAC repair in your city",
      "No seasonal content structure (AC queries vs furnace queries) — AI can't tell what you do in what season",
      "Manufacturer or equipment brand affiliations not in structured data",
      "Directory listings have inconsistent business name (DBA vs legal name)",
    ],
    auditNote: "For HVAC companies, we test both emergency and non-emergency queries — because your business operates in high-urgency summer mode and planned-maintenance fall mode. The audit shows where you appear in each context, and where competitors are filling the gap.",
    finalLine1: "When the AC fails,",
    finalLine2Em: "three HVAC companies get called.",
    finalLine3Dim: "One of them should be yours.",
    faqs: [
      {
        q: "We already rank well on Google. Is this still useful?",
        a: "Blue-link rankings are one output of one system. When a homeowner asks their smart speaker for emergency HVAC repair, that's a different system. When they ask ChatGPT for the best HVAC company in their city, that's another. You can rank on page one and still be invisible in both. We work the five channels your Google ranking doesn't reach.",
      },
      {
        q: "Our busy season is only a few months. Is a year-round engagement worth it?",
        a: "Position in AI systems is built in the slow months. The contractors who appear in AI recommendations in June built that position in February. The sprint starts the build — the month-to-month that follows holds it. You're visible when the spike hits, not scrambling after the first hot week.",
      },
      {
        q: "We have maintenance plan customers already. Can this help with renewals?",
        a: "Indirectly. A stronger Maps presence, more specific service-type reviews, and 'maintenance plan' signals in your content structure support both retention and new plan acquisition from AI recommendations. The buyer who calls for an emergency AC repair in July is the same buyer you offer a maintenance plan to after the visit — and the AI recommendation that generated the first call supports the relationship that generates the next.",
      },
      {
        q: "Do you work with multiple HVAC companies in one market?",
        a: "No. One HVAC company per local market. If your market is open and you want the position, book the audit.",
      },
    ],
  },

  electricians: {
    slug: "electricians",
    tradePlural: "Electricians",
    metaTitle: "6Signal: AI Visibility Audit for Electricians",
    metaDescription: "AI visibility audits for electricians in Dallas/Fort Worth and North Texas. See where your company appears across AI, Maps, and search.",
    ogTitle: "Emergency, remodel, panel upgrade — if the systems don't name you, the homeowner never calls.",
    ogDescription: "License signals, credential visibility, and AI search position determine which electrician gets the call. 6 Signal builds that infrastructure.",
    heroMeta: "AI Visibility · Built for Electrical Contractors",
    headline1: "Emergency, remodel, panel upgrade —",
    headline2Em: "if the systems don't name you, the homeowner never calls.",
    heroDeck: "Electrical buyers range from emergency-driven to fully planned — a tripped breaker that won't reset to a $15,000 panel upgrade before a home sale. For all of them, the same question gates the call: is this company licensed and trustworthy? 6 Signal structures your credentials so AI tools can answer that question correctly — and name your company when buyers search.",
    problemCaption: "A real path to an electrical call — 2026",
    problemStrong1: "Sunday morning. The circuit breaker trips again and won't reset. Third time this month. She searches: \"Licensed electrician near me — panel problem.\" ChatGPT names three companies. She checks if they're licensed.",
    problemDim: "She opens Maps and checks their reviews — specifically for panel work and license mentions. Two look credible. She checks their websites briefly. She calls the one that looks most like a real company.",
    problemStrong2: "You're fully licensed, fully insured, two neighborhoods away. She found someone else.",
    whyIdx: "§ 03 — Why this hits electricians hardest",
    whyLine1: "License verification is the first thing buyers check.",
    whyLine2Em: "AI now determines who surfaces as verified.",
    whyDeck: "Three dynamics in electrical contracting make structured credential visibility the deciding factor in which company gets the call.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "Buyers research license and insurance before they call — and AI surfaces who has them.",
        body: "Homeowners are wary of unlicensed electrical work. When they search, they're looking for verifiable signals: license, insurance, reviews for the specific type of work. AI tools increasingly surface companies with credible, structured credential signals. If yours aren't visible to machines, you lose calls to competitors whose are.",
      },
      {
        idx: "02 / 03",
        heading: "Electrical is a wide-spectrum trade — and search behavior varies dramatically by job type.",
        body: "Emergency calls are high-urgency, short decision cycle. Panel upgrades, EV charger installations, and remodel work are planned and research-heavy. Your visibility needs to work across both contexts. Most electricians are optimized for neither.",
      },
      {
        idx: "03 / 03",
        heading: "EV charger installation is a category where AI is actively shaping shortlists now.",
        body: "Homeowners asking ChatGPT for an electrician to install an EV charger are a growing, high-value segment. AI tools are naming specific electricians for these queries in major markets right now. Most electricians aren't in the conversation yet. That gap is closing.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'licensed electrician near me' or 'best electrician for panel upgrade in [city],'",
        dim: "is your company one of the three named? License signals, credential mentions, and service specificity are what put electricians in AI recommendations.",
      },
      {
        body: "'Licensed electrician near me.' 'Panel upgrade [city].' 'EV charger installation near me.' 'Emergency electrician open now.' '200 amp service upgrade.'",
        dim: "PEO makes sure your company appears for the specific job types your customers search — not just a generic 'electrician near me.'",
      },
      {
        body: "Google answers electrical questions — when to upgrade a panel, whether you need a permit, what to do when a breaker won't reset.",
        dim: "AEO gets your company cited in those answers so homeowners find your name in the moments of highest intent.",
      },
      {
        body: "Your license type, service areas, job types (residential, commercial, EV, panel upgrades), permits, and credentials",
        dim: "— all need to be structured so AI can surface you correctly for both emergency and planned-work queries.",
      },
      {
        body: "Google Maps, Yelp, HomeAdvisor, licensing board directories, BBB",
        dim: "— reconciled so your license number, service area, and business name are consistent everywhere a homeowner might verify.",
      },
      {
        body: "A homeowner with a sparking outlet asks Siri: 'Licensed emergency electrician near me.'",
        dim: "VEO makes sure your company is the answer — tied to your correct credentials and your actual service area.",
      },
    ],
    gaps: [
      "License and insurance not visible in schema or GBP — AI can't surface your credentials",
      "No service-type structure (residential vs commercial vs EV charging vs panel work)",
      "AI tools name competitors when asked for licensed electricians in your city",
      "Permit and compliance language missing — buyers searching for licensed work can't find you",
      "Old or inconsistent information in licensing board directories",
      "Emergency availability not structured — you don't appear for urgent electrical queries",
    ],
    auditNote: "For electrical contractors, we specifically test credential queries — 'licensed electrician near me,' 'insured electrician for panel work' — because license signals are what separate your company from unlicensed competition in AI results. You see the output live.",
    finalLine1: "Three electricians get called",
    finalLine2Em: "for every job in your market.",
    finalLine3Dim: "Make yours the license that gets found.",
    faqs: [
      {
        q: "I'm licensed and insured. Don't buyers already know that?",
        a: "Only if machines can surface it. License information needs to be in your schema, your GBP, your site structure, and verified in the directories AI pulls from. If it's on a PDF buried on your website, it doesn't exist to a search system.",
      },
      {
        q: "My work is mostly word of mouth from builders and remodelers. Is this relevant?",
        a: "If your pipeline is entirely referral-based, the vulnerability is that it's dependent on other people's decisions. AI visibility opens a parallel channel — direct homeowner inquiries for EV chargers, panel upgrades, and emergency work that don't require a referral partner in the middle.",
      },
      {
        q: "I only do commercial work. Is this useful?",
        a: "Partly. Commercial buyers also search before outreach, and AI is increasingly used in vendor research. But our primary framework is built around residential and mixed contractors. If you're exclusively commercial, the commercial contractors page is the better starting point.",
      },
      {
        q: "Do you work with multiple electricians in one area?",
        a: "One licensed electrical contractor per local market. Not two residential electricians competing for the same homeowner.",
      },
    ],
  },

  remodelers: {
    slug: "remodelers",
    tradePlural: "Remodelers",
    metaTitle: "6Signal: AI Visibility Audit for Remodelers",
    metaDescription: "AI visibility audits for remodelers in Dallas/Fort Worth and North Texas. See where your company appears across AI, Maps, and search.",
    ogTitle: "High-ticket projects are won before the estimate. Buyers verify before they trust.",
    ogDescription: "Homeowners research remodelers for weeks using AI, Maps, and reviews before calling anyone. 6 Signal gets your company into that research process.",
    heroMeta: "AI Visibility · Built for Remodeling Contractors",
    headline1: "High-ticket projects are won",
    headline2Em: "before the estimate is ever sent.",
    headline3Dim: "Buyers verify before they trust.",
    heroDeck: "Kitchen remodels, bathroom renovations, basement builds, additions — these are $20,000 to $200,000 decisions. Homeowners research for weeks. They ask AI, read reviews, compare portfolios, and check credentials before speaking to a single contractor. 6 Signal makes sure your company is found and trusted throughout that entire process.",
    problemCaption: "A real path to a remodeling job — 2026",
    problemStrong1: "Saturday morning. A couple decides this is the year they do the kitchen. She opens ChatGPT: \"Best kitchen remodeler in [city] — good reviews, doesn't disappear mid-project.\" Three companies get named.",
    problemDim: "Over the following week, she checks their Google reviews specifically for kitchen projects, red flags, and communication mentions. She visits their websites. She checks if they're licensed.",
    problemStrong2: "You've done thirty kitchens in the past two years. You have photos, reviews, and a spotless reputation. She never found your company.",
    whyIdx: "§ 03 — Why this hits remodelers hardest",
    whyLine1: "High-ticket projects have long research phases.",
    whyLine2Em: "AI is now part of every phase.",
    whyDeck: "Three dynamics in remodeling make AI and search visibility a structural advantage — not a nice-to-have.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "The research phase is weeks long — and AI is shaping it from the first search.",
        body: "Remodeling decisions don't happen in an afternoon. Homeowners research contractors the way they used to research cars. AI tools are increasingly embedded in that research — recommending remodelers, comparing them, answering project questions. The company named early in that process has a structural advantage over the one that never appears.",
      },
      {
        idx: "02 / 03",
        heading: "Portfolio proof and specialization signals drive AI recommendations.",
        body: "When a homeowner asks ChatGPT for kitchen remodelers, it doesn't randomly pick three names. It pulls from its understanding of which companies are specifically associated with that type of work, in that area, with evidence of completed projects. Generic 'remodeler' positioning loses to specific portfolio signals.",
      },
      {
        idx: "03 / 03",
        heading: "Remodeling is trust-gated — and trust is assembled online before the first call.",
        body: "A homeowner who lets a remodeling crew into her house for eight weeks needs confidence before the first conversation. AI recommendations, review volume, portfolio clarity, and professional presentation all contribute to that confidence — before you ever answer a call.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'best kitchen remodeler in [city]' or 'trusted basement contractor near me,'",
        dim: "is your company named? The names that appear in AI tools get the first calls, the first estimates, and the first signed contracts.",
      },
      {
        body: "'Kitchen remodeler [city].' 'Bathroom renovation contractor near me.' 'Licensed home addition contractor.' 'Basement finishing company [city].'",
        dim: "PEO makes sure your company appears for the specific project types you specialize in — not just a generic 'contractor near me.'",
      },
      {
        body: "Google answers remodeling questions — how to find a trusted contractor, how to vet a remodeler, what to include in a renovation contract.",
        dim: "AEO positions your company in those answers so homeowners find your name while they're researching, not just when they're ready to call.",
      },
      {
        body: "Your specialties (kitchen, bath, basement, addition), your license, your service area, and your project portfolio signals",
        dim: "— structured so AI can correctly describe what you do and match you to the right project-type searches.",
      },
      {
        body: "Google Maps, Houzz, HomeAdvisor, Yelp, Angi, BBB, NARI membership directories",
        dim: "— reconciled so every platform a researching homeowner checks shows the same company with the same portfolio and contact information.",
      },
      {
        body: "A homeowner asks Siri: 'Recommend a kitchen remodeling company near me.'",
        dim: "VEO makes sure your company is named — with the correct specialty and service area.",
      },
    ],
    gaps: [
      "No project-type specialization in your site structure — AI treats you as a generic contractor",
      "Houzz and HomeAdvisor profiles incomplete or outdated",
      "Portfolio photos exist but aren't organized in a way AI can read or index",
      "License not visible in GBP or schema",
      "Reviews don't mention project type — 'great work' doesn't tell AI you do kitchens",
      "AI tools name competitors when asked for remodelers in your city",
    ],
    auditNote: "For remodeling contractors, the audit specifically tests specialty queries — kitchen, bath, basement, additions — because remodelers who appear in project-specific AI results convert at significantly higher rates than those appearing only for generic terms.",
    finalLine1: "Three remodelers make the shortlist",
    finalLine2Em: "before a homeowner calls anyone.",
    finalLine3Dim: "One of them should be yours.",
    faqs: [
      {
        q: "Most of my business comes from Houzz and HomeAdvisor. Is this different?",
        a: "Directory platforms put you in front of buyers already using that platform. AI visibility reaches buyers before they open any platform — when they ask ChatGPT who to call. Those are two different discovery moments. This addresses the one that Houzz, HomeAdvisor, and word-of-mouth all miss: the buyer who hasn't found a referral yet and goes to AI first.",
      },
      {
        q: "Remodeling is high-consideration. Don't buyers research beyond AI?",
        a: "Yes — and that's exactly why the AI layer matters more, not less. Your name needs to appear early in a long research process. A contractor who appears in a ChatGPT answer gets the website visit, the portfolio view, and the first estimate request. If you never appear in the AI answer, the research process never starts for you.",
      },
      {
        q: "Do you handle content creation or just the optimization structure?",
        a: "We handle the structural work — schema, local entity cleanup, answer-ready content organization, and prompt visibility. If you have existing portfolio content (photos, project descriptions, testimonials), we work with that. If your content is thin, we'll tell you exactly what needs to exist and why.",
      },
      {
        q: "Do you work with multiple remodelers in one market?",
        a: "No. One remodeling contractor per local market.",
      },
    ],
  },

  "garage-doors": {
    slug: "garage-doors",
    tradePlural: "Garage Door Companies",
    metaTitle: "6Signal: AI Visibility Audit for Garage Door Companies",
    metaDescription: "AI visibility audits for garage door companies in Dallas/Fort Worth and North Texas. See where your company appears across AI, Maps, and search.",
    ogTitle: "A stuck garage door is an urgent search. Three companies get named. Everyone else disappears.",
    ogDescription: "Voice search, AI tools, and Maps determine which garage door company gets called in an emergency. 6 Signal gets your company onto that shortlist.",
    heroMeta: "AI Visibility · Built for Garage Door Companies",
    headline1: "A stuck garage door is an urgent search.",
    headline2Em: "Three companies get named. Everyone else disappears.",
    heroDeck: "Garage door failure is one of the most urgency-compressed searches in home services. The problem is immediate. The decision is made in under 90 seconds. Whoever is named first usually gets the call. 6 Signal makes sure your company is one of those names — with same-day availability surfaced clearly enough that a buyer at 7 a.m. doesn't have to guess whether you can help.",
    problemCaption: "A real path to a garage door call — 2026",
    problemStrong1: "Monday. 7:12 a.m. The spring snaps. The door won't open. There's a car inside and she's late for work. She asks her phone: \"Garage door repair near me open now.\" Siri names two companies. ChatGPT names three.",
    problemDim: "She checks the closest one — four-star rating, same-day service reviews, phone number that's easy to tap. She calls. Someone answers.",
    problemStrong2: "You answer on the first ring, every time, with same-day service. She didn't find you.",
    whyIdx: "§ 03 — Why this hits garage door companies hardest",
    whyLine1: "Urgency collapses the decision",
    whyLine2Em: "to under sixty seconds.",
    whyDeck: "Three dynamics in garage door service make being named in AI results the only thing that matters in an emergency.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "A stuck garage door is a zero-comparison-shopping search event.",
        body: "The homeowner searches, reads two reviews, and calls the first company that looks credible. There is no comparison shopping. The shortlist is three names, and the winner is whoever appears first and answers the phone.",
      },
      {
        idx: "02 / 03",
        heading: "Voice and local search are the primary discovery channels — not websites.",
        body: "Most garage door calls start with Siri, Alexa, or a Maps tap. Voice assistants answer with one or two names. Maps shows three. Your website is almost irrelevant to the first call — but your Maps listing, voice search presence, and AI profile are everything.",
      },
      {
        idx: "03 / 03",
        heading: "Same-day availability is the highest-converting signal — and almost no one structures it.",
        body: "A homeowner looking for emergency garage door repair wants to know who can come today. That signal needs to be in your GBP description, your schema, your content structure, and readable by AI tools. Most garage door companies have it structured nowhere.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'garage door repair near me open now' or 'emergency garage door spring replacement [city],'",
        dim: "is your company one of the three names returned? Voice search for garage door emergencies is nearly identical in structure.",
      },
      {
        body: "'Garage door spring repair same day.' 'Emergency garage door opener repair.' 'Garage door company near me open now.' 'Broken cable garage door repair [city].'",
        dim: "PEO makes sure your company appears for the exact emergency language your customers type when they can't get their car out.",
      },
      {
        body: "Google answers garage door questions — how to open a stuck door, what causes spring failure, when to repair vs replace.",
        dim: "AEO positions your company in those answers so your name appears before the homeowner makes a single call.",
      },
      {
        body: "Your services, your same-day availability, your service area, and your emergency hours",
        dim: "— structured so AI can surface your company in urgent queries, not just general 'garage door company' searches.",
      },
      {
        body: "Google Maps, Yelp, HomeAdvisor, BBB, local business directories",
        dim: "— all with the same phone number, the same service area, and same-day availability clearly and consistently stated.",
      },
      {
        body: "A homeowner late for work asks Siri: 'Garage door repair near me — open right now.'",
        dim: "VEO makes sure your company is the name Siri reads — correct address, correct number, open for business.",
      },
    ],
    gaps: [
      "Same-day or emergency availability not structured in GBP or schema",
      "Service types (spring, opener, cable, panel) not clearly structured — you appear only for generic 'garage door repair'",
      "Voice search returns a competitor because your address or business name isn't correctly mapped",
      "Old phone number active in Apple Maps or Yelp",
      "AI tools name competitors when asked for emergency garage door repair in your city",
      "Reviews don't mention same-day or emergency response — your fastest asset is invisible to AI",
    ],
    auditNote: "For garage door companies, the audit specifically tests emergency and same-day queries — because that's where the majority of high-intent calls come from. We show you exactly what Siri, ChatGPT, and Maps return for those queries in your city, live on the call.",
    finalLine1: "The spring breaks.",
    finalLine2Em: "She asks Siri who to call.",
    finalLine3Dim: "Be the answer.",
    faqs: [
      {
        q: "We're already in the Google Maps pack. Isn't that enough?",
        a: "Maps is one layer — LEO. Being in the three-pack is valuable and you should protect it. But voice assistants, ChatGPT, and AI Overviews all use different inputs than the Maps pack algorithm. You can be in the pack and still be invisible in those channels.",
      },
      {
        q: "Most of our calls come from Thumbtack or Angi. Is this different?",
        a: "Lead generation platforms put you in front of buyers who are already on that platform. AI visibility — ChatGPT, voice, answer engines — reaches buyers before they open any platform. It's a different discovery moment and a different buyer behavior.",
      },
      {
        q: "Our phone rings plenty. Why do we need this?",
        a: "A phone that rings plenty can still be missing calls from buyers who never found you. If your competitor is named in AI results and you're not, you're invisible to every homeowner who searches there. The question isn't whether you're busy — it's whether you could be busier.",
      },
      {
        q: "Do you work with more than one garage door company per city?",
        a: "No. One garage door company per local market.",
      },
    ],
  },

  landscaping: {
    slug: "landscaping",
    tradePlural: "Landscaping Companies",
    metaTitle: "6Signal: AI Visibility Audit for Landscaping Companies",
    metaDescription: "AI visibility audits for landscaping companies in Dallas/Fort Worth and North Texas. See where your company appears across AI, Maps, and search.",
    ogTitle: "The best work in the neighborhood doesn't help if they can't find you.",
    ogDescription: "Landscaping buyers research before they call. AI tools, Maps, and search shape who makes the shortlist. 6 Signal gets your company there.",
    heroMeta: "AI Visibility · Built for Landscaping Companies",
    headline1: "The best work in the neighborhood",
    headline2Em: "doesn't help if they can't find you.",
    heroDeck: "Landscaping buyers don't call the first name they see. They look at project photos, read reviews by neighborhood, and research which company does the kind of work they want done. That research now starts with AI and search — before the referral network has a chance to point anywhere. 6 Signal makes sure your company is found at the start of that process, not discovered after a competitor already has the job.",
    problemCaption: "A real path to a landscaping call — 2026",
    problemStrong1: "Early April. New homeowners in a house with a neglected yard. He asks ChatGPT: \"Best landscaping company near me — lawn care and landscape design.\" Three companies get named.",
    problemDim: "He checks their Google reviews — specifically looking for photos of work in neighborhoods like his. Two companies have recent project photos. He emails one.",
    problemStrong2: "Your crew does stunning work three streets over. Your Google profile has photos from 2021. He hired someone else.",
    whyIdx: "§ 03 — Why this hits landscaping companies hardest",
    whyLine1: "Visual proof and seasonal timing",
    whyLine2Em: "drive the landscaping shortlist.",
    whyDeck: "Three dynamics in landscaping make structured visibility the deciding factor in whether a homeowner calls you this spring.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "Spring is a brief window — and the shortlist gets made before the first warm day.",
        body: "Homeowners who want landscaping work done in spring start researching in late winter. The companies embedded in AI recommendations and search results in March get the calls in April. Waiting until the ground thaws to build visibility is waiting until after the window opens.",
      },
      {
        idx: "02 / 03",
        heading: "Visual proof and portfolio signals are what AI tools use to recommend landscapers.",
        body: "When a homeowner asks ChatGPT for the best landscaping company near them, it pulls from signals across the web — portfolio content presence, review specificity, and service-type clarity. Companies with rich, structured proof content get named. Companies with vague websites don't.",
      },
      {
        idx: "03 / 03",
        heading: "Recurring service is high lifetime value — one AI recommendation can mean years of revenue.",
        body: "A homeowner who hires a landscaping company for a lawn care program may stay for five to eight years. The economics of one AI-generated call that converts to a maintenance contract are dramatically different from a one-time job referral.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'best landscaping company near me' or 'lawn care service [city] — who does good work,'",
        dim: "is your company named? Portfolio signals and review specificity are what put landscapers in AI recommendations.",
      },
      {
        body: "'Lawn care company near me.' 'Landscape design contractor [city].' 'Hardscape patio installation near me.' 'Tree trimming and lawn maintenance [city].'",
        dim: "PEO makes sure your company appears for the specific services you offer — not just a generic 'landscaping near me.'",
      },
      {
        body: "Google answers landscaping questions — how to find a trusted lawn care company, what to look for in a landscaping contractor, when to aerate and overseed.",
        dim: "AEO positions your company in those answers so homeowners find your name while they're still in research mode.",
      },
      {
        body: "Your services, your service areas, your project portfolio structure, and your seasonal offerings",
        dim: "— organized so AI tools can match your company to the specific services homeowners search for.",
      },
      {
        body: "Google Maps, Yelp, Thumbtack, HomeAdvisor, Angi, local business directories",
        dim: "— reconciled so your service area and services are consistent across every platform a homeowner might check.",
      },
      {
        body: "A homeowner asks Google Assistant: 'Find me a lawn care company near me.'",
        dim: "VEO makes sure your company is the answer — with your service area and services correctly tied to your location.",
      },
    ],
    gaps: [
      "Service types not structured — 'landscaping' is too generic for AI to match you to specific searches",
      "Portfolio photos exist but aren't organized in a way AI can read or index",
      "Seasonal content missing — no structure for spring cleanup, fall aeration, winter services",
      "Service area in Maps doesn't match the neighborhoods you actually work in",
      "Reviews are generic — no project type or location signals that AI can use",
      "AI tools name competitors when asked for landscapers in your city",
    ],
    auditNote: "For landscaping companies, the audit tests seasonal and service-specific queries — because the highest-converting searches are for specific services in specific neighborhoods. You see exactly where you appear and where competitors fill the gap.",
    finalLine1: "When homeowners search for landscapers,",
    finalLine2Em: "three companies get found.",
    finalLine3Dim: "One of them should have your name on the truck.",
    faqs: [
      {
        q: "We get most clients from yard signs and referrals. Do we need this?",
        a: "Yard signs and referrals work in the neighborhoods where you already work. AI visibility works everywhere you'd like to work — including neighborhoods your trucks haven't been in yet. It's a lead source that doesn't depend on geographical proximity.",
      },
      {
        q: "Our reviews are good. Isn't that enough?",
        a: "Good reviews are one signal. They need to be recent, specific to service type and location, and consistent across the right platforms to influence AI recommendations. A competitor with fewer reviews but better-structured specialization signals can outperform you in AI results. We find this in most landscaping markets we audit.",
      },
      {
        q: "We're seasonal. Is a year-round engagement worth it?",
        a: "The sprint builds position, and continuing month-to-month holds it so it peaks at the right time. Landscapers who build AI and search visibility in January and February are the ones getting calls in March. The off-season is when you build the position the busy season harvests.",
      },
      {
        q: "Do you work with multiple landscaping companies in one market?",
        a: "No. One landscaping company per local market.",
      },
    ],
  },

  "tree-service": {
    slug: "tree-service",
    tradePlural: "Tree Service Companies",
    metaTitle: "6Signal: AI Visibility Audit for Tree Service Companies",
    metaDescription: "AI visibility audits for tree service companies in Dallas/Fort Worth and North Texas. See where your company appears across AI, Maps, and search.",
    ogTitle: "After the storm, homeowners don't build a long list. They ask who can handle it now.",
    ogDescription: "Storm surge search behavior is compressed and urgent. 6 Signal gets tree service companies onto the AI shortlist before the first call goes to a competitor.",
    heroMeta: "AI Visibility · Built for Tree Service Companies",
    headline1: "After the storm, homeowners don't build a long list.",
    headline2Em: "They ask who can handle it now.",
    heroDeck: "Tree service combines urgency and trust in a way almost no other trade does — emergency calls that won't wait, and work near structures where a wrong hire has real consequences. Homeowners searching after a storm want the answer fast and the credentials visible. 6 Signal makes sure your company appears with both — before they move to the next result.",
    problemCaption: "A real path to a tree service call — 2026",
    problemStrong1: "Thursday. 6 a.m. A storm rolled through overnight. A large limb is across the backyard fence. She opens her phone before coffee: \"Emergency tree removal near me.\" ChatGPT names three companies. She checks if any are certified arborists.",
    problemDim: "She checks Maps. Two have recent emergency-removal reviews and photos of storm work. One has an ISA certification mention in their listing. She calls that one.",
    problemStrong2: "Your crew just cleared two storm jobs in the same zip code last night. She didn't know you existed.",
    whyIdx: "§ 03 — Why this hits tree service companies hardest",
    whyLine1: "Hazardous work requires certified proof.",
    whyLine2Em: "AI surfaces who has it and who doesn't.",
    whyDeck: "Three dynamics in tree service make AI and search visibility the difference between capturing storm surge calls and watching them go to competitors.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "Storm surges are brief, high-volume, and go to whoever appears first.",
        body: "After a significant weather event, search volume for emergency tree service spikes in hours. The companies already embedded in AI and Maps results capture the majority of calls. The window is 24 to 72 hours, and whoever appears first when it opens wins.",
      },
      {
        idx: "02 / 03",
        heading: "Credential signals are the trust gate for hazardous work near structures.",
        body: "Homeowners don't casually hire someone to remove a tree near their house. They look for certification, insurance, and reviews for hazardous work specifically. AI tools increasingly surface companies with clear credential signals for tree service queries — which means if yours aren't visible, you're losing calls to less-qualified competitors who simply have better-structured data.",
      },
      {
        idx: "03 / 03",
        heading: "Emergency structure is almost never done right — and that gap is still open.",
        body: "Most tree service companies have a website that lists their services. Almost none have their emergency availability, ISA certifications, equipment capacity, or hazard-removal experience structured in a way AI tools can surface under pressure. Most markets still have this gap open.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'emergency tree removal near me' or 'certified arborist [city] storm damage,'",
        dim: "is your company named? Certification and hazard-removal signals are what separate tree service companies in AI recommendations.",
      },
      {
        body: "'Emergency tree removal.' 'Storm damage tree service near me.' 'Tree trimming [city].' 'Stump grinding near me.' 'ISA certified arborist.'",
        dim: "PEO makes sure your company appears for both emergency and planned service queries — not just one or the other.",
      },
      {
        body: "Google answers tree service questions — when to remove a tree vs trim it, how to find a certified arborist, what to do after storm damage.",
        dim: "AEO gets your company cited in those answers so your name appears before a homeowner makes any call.",
      },
      {
        body: "Your services, certifications, equipment capacity, service area, and emergency availability",
        dim: "— structured so AI can correctly surface your company for both urgent storm calls and planned removal work.",
      },
      {
        body: "Google Maps, Yelp, Angi, Tree Care Industry Association directories, ISA Find a Tree Care Service tool",
        dim: "— reconciled so every listing shows the same credentials, the same number, and the same service area.",
      },
      {
        body: "A homeowner with a tree on their fence asks Siri: 'Emergency tree service near me that can come today.'",
        dim: "VEO makes sure your company is the answer — with your credentials and availability correctly surfaced.",
      },
    ],
    gaps: [
      "No emergency or storm-damage signal structure in GBP or schema",
      "ISA certifications and insurance not in structured data — AI can't surface your credentials",
      "Service types not clearly separated (removal vs trimming vs stump grinding)",
      "AI tools name competitors when asked for emergency tree service in your city",
      "No presence in specialty directories (ISA, TCIA)",
      "Reviews mention 'great work' without hazard-removal or emergency-service signals",
    ],
    auditNote: "For tree service companies, we specifically test certification and emergency queries — because homeowners hiring for hazardous work check credentials before they call. You see exactly what AI returns for those queries in your market, live.",
    finalLine1: "After the storm,",
    finalLine2Em: "three tree service companies get called.",
    finalLine3Dim: "Make sure one of them answers to your name.",
    faqs: [
      {
        q: "We get most of our business from previous customers and neighbors. Is AI relevant?",
        a: "Neighbor referrals work in your existing footprint. Storm damage calls come from homeowners who have never heard of you — they search immediately, find three names, and call. AI visibility is the channel that reaches those new customers before a competitor's name comes up.",
      },
      {
        q: "We're ISA certified. Does that help with AI visibility?",
        a: "It can — if it's structured. An ISA certification mentioned in a PDF or buried in your about page doesn't exist to a search system. It needs to be in your GBP, in your schema, and on the pages that correspond to the queries homeowners search. The audit shows whether your credentials are machine-readable.",
      },
      {
        q: "Our busy season is short. Is a year-round engagement worth it?",
        a: "Position in AI systems is built continuously and harvested when demand spikes. The companies that appear in AI recommendations during a storm surge built that position during the quiet months. The sprint starts that build — continuing month-to-month is what makes the surge calls go to you.",
      },
      {
        q: "Do you work with multiple tree service companies in one market?",
        a: "No. One tree service company per local market. If your market is open, it's available.",
      },
    ],
  },

  "pest-control": {
    slug: "pest-control",
    tradePlural: "Pest Control Companies",
    metaTitle: "6Signal: AI Visibility Audit for Pest Control Companies",
    metaDescription: "AI visibility audits for pest control companies in Dallas/Fort Worth and North Texas. See where your company appears across AI, Maps, and search.",
    ogTitle: "When the problem feels urgent or unsafe, buyers want a trusted name fast.",
    ogDescription: "Pest control buyers research aggressively before letting anyone spray their home. 6 Signal gets your company onto the AI shortlist buyers check first.",
    heroMeta: "AI Visibility · Built for Pest Control Companies",
    headline1: "When the problem feels urgent or unsafe,",
    headline2Em: "buyers want a trusted name fast.",
    heroDeck: "Pest problems drive immediate, trust-gated searches. Homeowners verify license, check for kid-safe treatment options, and read reviews before they let anyone spray their home. That vetting now starts with AI and Maps — not a phone book and not a referral. 6 Signal makes sure your company is named across every system buyers check before they call.",
    problemCaption: "A real path to a pest control call — 2026",
    problemStrong1: "Sunday morning. She finds signs of a rodent in the kitchen. She's not calling anyone she doesn't trust. She searches: \"Licensed pest control near me — rodent specialist.\" ChatGPT names three companies. She checks if they're licensed.",
    problemDim: "She checks their reviews — specifically for rodent treatments and how they handled families with kids and pets. Two look credible. One has a photo of their technician and mentions kid-safe methods.",
    problemStrong2: "You're licensed, insured, use kid-safe treatments, and have fifty relevant reviews. She found someone else first.",
    whyIdx: "§ 03 — Why this hits pest control hardest",
    whyLine1: "Buyers research aggressively",
    whyLine2Em: "before letting anyone spray their home.",
    whyDeck: "Three dynamics in pest control make structured credential visibility the deciding factor in whether a homeowner trusts your company enough to call.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "Trust is the primary purchase driver — and buyers research before they call.",
        body: "Homeowners don't hire pest control companies the way they hire cleaners. They're vetting who will spray their home near their children and their food. That vetting starts with AI recommendations, license verification, and review specificity — before anyone picks up the phone.",
      },
      {
        idx: "02 / 03",
        heading: "Specialty signals separate you from generic pest control — and AI surfaces specialists.",
        body: "A homeowner with a bed bug problem is not looking for 'pest control near me.' They're searching 'bed bug treatment specialist' or 'heat treatment company near me.' Companies that structure their service specialties correctly in AI-readable content appear for those high-intent searches. Generic companies don't.",
      },
      {
        idx: "03 / 03",
        heading: "Recurring service means one AI-generated call can convert to years of revenue.",
        body: "Quarterly pest control programs represent significant recurring revenue per household. The economics of one AI-generated call that converts to a maintenance program are completely different from a one-time removal job.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'licensed pest control near me' or 'best exterminator for [pest] in [city],'",
        dim: "is your company named? License signals and treatment-type specificity are what put pest control companies in AI recommendations.",
      },
      {
        body: "'Licensed exterminator near me.' 'Rodent control [city].' 'Termite inspection near me.' 'Bed bug treatment specialist.' 'Ant control kid-safe methods.'",
        dim: "PEO makes sure your company appears for the specific pest and treatment type your customers search — not just 'pest control near me.'",
      },
      {
        body: "Google answers pest questions — how to identify infestations, when to call an exterminator, how to find a licensed pest control company.",
        dim: "AEO positions your company in those answers so homeowners find your name while they're still in research mode.",
      },
      {
        body: "Your license, treatment methods, specific pests you handle, service area, and safety certifications",
        dim: "— all need to be structured so AI can surface you for the specific pest and treatment queries your customers use.",
      },
      {
        body: "Google Maps, Yelp, HomeAdvisor, Angi, state licensing board directories, BBB",
        dim: "— reconciled so your license number, service area, and treatment specialties are consistent everywhere a buyer checks.",
      },
      {
        body: "A homeowner who finds signs of termites asks Siri: 'Licensed termite inspector near me.'",
        dim: "VEO makes sure your company is the answer — with your correct specialties and credentials surfaced.",
      },
    ],
    gaps: [
      "License and insurance not visible in schema or GBP — AI can't verify your credentials",
      "No pest-specific service structure — 'pest control' is too generic for specialty searches",
      "AI tools name competitors when asked for licensed pest control in your city",
      "State licensing board directory not updated with current address or phone",
      "No safety or family-friendly treatment signals — high-converting claims invisible to AI",
      "Reviews don't mention specific pest types or treatment methods",
    ],
    auditNote: "For pest control companies, the audit specifically tests specialty and license queries — because trust verification is the primary barrier to a first call. We show you exactly what AI tools return for 'licensed exterminator near me' and pest-specific queries in your market.",
    finalLine1: "When a homeowner searches for a trusted exterminator,",
    finalLine2Em: "three companies get named.",
    finalLine3Dim: "One of them should be yours.",
    faqs: [
      {
        q: "We have good reviews. Isn't that enough?",
        a: "Reviews are one signal. They need to be recent, specific to pest type and treatment method, and on the right platforms to influence AI recommendations. A competitor with fewer reviews but better-structured specialization signals can outperform you in AI results even with a lower overall rating. We find this gap — the wrong company appearing first — in most markets we audit.",
      },
      {
        q: "Most of our calls come from HomeAdvisor or Thumbtack. Is this different?",
        a: "Lead platforms put you in front of buyers already using that platform. AI visibility reaches buyers before they open any platform. It's an earlier and increasingly common discovery moment — one that platform advertising doesn't reach.",
      },
      {
        q: "We're licensed in multiple states. Does that complicate things?",
        a: "Multi-state licensing needs to be structured for each service area separately — different schemas, different GBP listings, different local entity signals per market. The audit shows where inconsistencies exist across your footprint.",
      },
      {
        q: "Do you work with multiple pest control companies in one area?",
        a: "No. One licensed pest control company per local market.",
      },
    ],
  },

  "foundation-concrete": {
    slug: "foundation-concrete",
    tradePlural: "Foundation & Concrete Contractors",
    metaTitle: "6Signal: AI Visibility Audit for Foundation Contractors",
    metaDescription: "AI visibility audits for foundation and concrete companies in North Texas. See where your company appears across AI, Maps, and search.",
    ogTitle: "High-trust structural work requires confidence before the first call.",
    ogDescription: "Foundation buyers research for weeks using AI, Maps, and search before calling anyone. 6 Signal builds the visibility infrastructure that gets your company found throughout that process.",
    heroMeta: "AI Visibility · Built for Foundation & Concrete Contractors",
    headline1: "High-trust structural work",
    headline2Em: "requires confidence before the first call.",
    heroDeck: "Foundation repair and structural concrete sit at the highest-trust end of home services — projects where the decision takes weeks, the stakes feel consequential, and the homeowner has to believe in your company before the first conversation. 6 Signal makes sure you appear throughout that research period, not just at the end when the shortlist is already set.",
    problemCaption: "A real path to a foundation call — 2026",
    problemStrong1: "March. She notices a crack in the basement wall that's wider than last year. She doesn't call anyone immediately. She researches for two weeks. She asks ChatGPT: \"Who does foundation repair in [city] and can I trust them?\" Three companies appear in the first answer.",
    problemDim: "Over ten days, she reads their reviews, checks their warranties, looks at photos of their work, and searches for complaints. One company keeps appearing across multiple AI answers and has specific content addressing foundation questions.",
    problemStrong2: "You've done foundation work in her zip code for fifteen years. She signed with someone she found on the internet.",
    whyIdx: "§ 03 — Why this hits foundation contractors hardest",
    whyLine1: "Structural work is the highest-trust category.",
    whyLine2Em: "Buyers research for weeks before calling.",
    whyDeck: "Three dynamics in foundation and structural work make AI visibility a structural advantage — not a nice-to-have.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "Foundation work is the highest-stakes home service category — trust is the primary purchase driver.",
        body: "A homeowner spending $8,000 to $40,000 on foundation repair does not buy on price. They buy on confidence. AI recommendations, review specificity, warranty signals, and professional presentation are the inputs that build that confidence before anyone gets a quote.",
      },
      {
        idx: "02 / 03",
        heading: "The research phase is long — and AI shapes it from the first search.",
        body: "Foundation problems are worrisome. Homeowners research for weeks before calling. AI tools are increasingly embedded in that research — answering 'is this serious,' 'what causes this,' and 'who should I call.' The company whose name appears repeatedly throughout that research has a structural advantage.",
      },
      {
        idx: "03 / 03",
        heading: "Specialty signals and warranty visibility separate foundation companies in AI results.",
        body: "When a homeowner asks AI for foundation contractors, it's pulling companies whose content, reviews, and structured data signal specific expertise — crack repair, waterproofing, piering, structural warranty. Generic 'concrete company' positioning loses to competitors with specific structural signals.",
      },
    ],
    layerExamples: [
      {
        body: "When a homeowner asks ChatGPT 'foundation repair company [city] — who is trustworthy' or 'best basement waterproofing contractor near me,'",
        dim: "is your company named? Specialty signals and reputation depth are what put foundation contractors in AI recommendations.",
      },
      {
        body: "'Foundation crack repair [city].' 'Basement waterproofing contractor near me.' 'Slab leveling company near me.' 'Foundation piering specialist.' 'Structural concrete repair [city].'",
        dim: "PEO makes sure your company appears for the specific service type a homeowner searches — not just 'foundation company near me.'",
      },
      {
        body: "Google answers foundation questions — what causes cracks, whether a crack is serious, when to call a structural engineer.",
        dim: "AEO positions your company in those answers so homeowners find your name during the research phase, weeks before they call anyone.",
      },
      {
        body: "Your specialties, warranty terms, certifications, service area, and whether you handle insurance-related structural work",
        dim: "— structured so AI can correctly describe your expertise and surface you for high-trust structural queries.",
      },
      {
        body: "Google Maps, Yelp, BBB, Angi, HomeAdvisor, regional foundation authority directories",
        dim: "— reconciled so every platform a researching homeowner checks shows the same company with the same credentials and warranty information.",
      },
      {
        body: "A homeowner standing in front of a cracked wall asks Siri: 'Best foundation repair company near me.'",
        dim: "VEO makes sure your company is the answer — with your specialty and location correctly tied to your business.",
      },
    ],
    gaps: [
      "Specialty services (piering, waterproofing, crack injection) not in schema or structured content",
      "Warranty terms not visible to AI — high-trust signals invisible to machines",
      "AI tools name competitors when asked for foundation repair in your city",
      "Reviews don't mention specific service types — 'great company' doesn't tell AI you do structural piering",
      "No content addressing the specific questions homeowners research during their consideration phase",
      "GBP incomplete — no service descriptions, no recent photos of completed structural work",
    ],
    auditNote: "For foundation contractors, the audit specifically tests trust and specialty queries — because buyers in this category research for weeks before calling. We show you exactly what AI tools return during that research phase and whether your company appears as a credible, verifiable option.",
    finalLine1: "Foundation buyers research for weeks.",
    finalLine2Em: "Your company should appear throughout.",
    finalLine3Dim: "The audit shows whether it does.",
    faqs: [
      {
        q: "Most of our leads come from referrals from realtors and home inspectors. Is this relevant?",
        a: "Referral channels are relationship-dependent and finite. AI visibility reaches homeowners before they reach out to any referral source — especially the ones who find a crack on a Sunday morning and start Googling before they've thought to call their realtor.",
      },
      {
        q: "Our work is complex to explain. Can AI accurately capture what we do?",
        a: "Not without structured information. AI tools describe companies based on what they can read — your website content, your reviews, your schema data. If your services are complex and your website is vague, AI will describe you vaguely. The IEO work structures your content so machines can accurately describe what you do.",
      },
      {
        q: "We have a strong warranty. Does that matter for AI visibility?",
        a: "Yes — warranty signals are trust indicators. But only if they're structured. A warranty mentioned once on a page that isn't semantically organized won't influence AI recommendations. The visibility work makes your warranty a searchable, readable trust signal.",
      },
      {
        q: "Do you work with multiple foundation companies in one market?",
        a: "No. One foundation and structural concrete company per local market.",
      },
    ],
  },

  // NOTE: commercial-contractors/page.tsx uses CommercialPage (a custom component) and
  // defines its own metadata directly in that file. This data.ts entry is kept for reference only.
  "commercial-contractors": {
    slug: "commercial-contractors",
    tradePlural: "Commercial Contractors",
    metaTitle: "6Signal: AI Visibility Audit for Commercial Contractors",
    metaDescription: "AI visibility audits for commercial contractors in Dallas/Fort Worth and North Texas. See where your company appears across AI and search.",
    ogTitle: "Prequalification, vendor selection, and bid decisions now start with what buyers can verify online.",
    ogDescription: "Commercial contractors are evaluated before outreach. 6 Signal builds the digital credibility infrastructure that survives that scrutiny.",
    heroMeta: "AI Visibility · Built for Commercial Contractors",
    headline1: "Prequalification, vendor selection, and bid decisions",
    headline2Em: "start with what buyers can verify online.",
    heroDeck: "Commercial contractors are increasingly evaluated before outreach — by procurement teams, GCs, and facility managers who verify reputation, capability, and credibility through search, AI tools, and online presence before a single email gets sent. 6 Signal makes sure your company is visible and credible in that verification process.",
    problemCaption: "A real path to a commercial contract — 2026",
    problemStrong1: "Wednesday. A facilities manager is evaluating three commercial contractors for a renovation bid. Before sending RFP invitations, she searches each company name in Google and asks ChatGPT: \"What do people say about [company] as a commercial contractor?\"",
    problemDim: "One company has a clear presence — Maps reviews, a structured project portfolio, specific service descriptions. The other two are difficult to verify. One looks like it might be out of business.",
    problemStrong2: "You're fully bonded, have $10M in completed commercial projects, and excellent references. She couldn't find enough information online to feel confident sending you the RFP.",
    whyIdx: "§ 03 — Why this hits commercial contractors hardest",
    whyLine1: "Commercial buyers verify before they reach out.",
    whyLine2Em: "Your digital presence is your prequalification.",
    whyDeck: "Three dynamics in commercial contracting make structured digital visibility a prerequisite for being included in bid opportunities.",
    whyRows: [
      {
        idx: "01 / 03",
        heading: "Commercial buyers verify before outreach — and the credibility bar is high.",
        body: "A procurement team vetting contractors for a commercial bid is looking for specific signals: insurance, bonding, project history, and capability evidence. If those signals can't be found through a combination of Google, AI tools, and search, the contractor gets filtered out before the RFP process starts.",
      },
      {
        idx: "02 / 03",
        heading: "AI tools are increasingly used for vendor research in commercial contexts.",
        body: "Facilities managers, GCs, and procurement professionals are using ChatGPT and other AI tools to research contractors, compare companies, and assess reputation before committing to an outreach list. This is changing faster in commercial than most people expect.",
      },
      {
        idx: "03 / 03",
        heading: "Your entire digital footprint functions as a prequalification document.",
        body: "In residential, the website converts. In commercial, the website and your digital footprint qualify. Project portfolio signals, bonding information, specialty certifications, and review consistency all function as credibility documents that buyers read before they ever contact you.",
      },
    ],
    layerExamples: [
      {
        body: "When a procurement manager or GC asks ChatGPT 'experienced commercial contractor for [project type] in [city]' or researches your company by name,",
        dim: "does your company appear credible and capable? Missing project signals and thin digital presence eliminate you from shortlists you never knew existed.",
      },
      {
        body: "'Commercial general contractor [city].' 'Licensed commercial contractor for office renovation.' 'Bonded commercial construction company near me.' 'Commercial tenant improvement contractor.'",
        dim: "PEO makes sure your company appears in the specific commercial queries buyers and GCs use during vendor research.",
      },
      {
        body: "Answer engines respond to commercial construction questions — how to vet a commercial contractor, what to look for in a GC, prequalification best practices.",
        dim: "AEO positions your company in those answers so your name appears during the research phase, before outreach.",
      },
      {
        body: "Your project types, bonding capacity, license, certifications, and service area",
        dim: "— structured so AI tools can describe your commercial capabilities accurately and match you to the right procurement queries.",
      },
      {
        body: "Google Maps, BBB, Dodge Reports, DUNS records, Angi Pro, commercial contractor directories",
        dim: "— reconciled so every system a buyer checks shows the same company with the same capabilities and contact information.",
      },
      {
        body: "A GC asks a smart assistant: 'Commercial contractor for [project type] in [city].'",
        dim: "VEO makes sure your company appears — correctly tied to your commercial specialties and your project geography.",
      },
    ],
    gaps: [
      "Project portfolio not structured — no machine-readable project type, scope, or location signals",
      "Bonding and insurance information not in GBP or schema — commercial buyers can't verify",
      "AI tools don't associate your company with specific commercial project types",
      "No content addressing common commercial buyer questions (bonding capacity, insurance limits, references)",
      "Inconsistent or thin presence across the directories commercial buyers check",
      "Company name differs across directories, making it hard to aggregate trust signals",
    ],
    auditNote: "For commercial contractors, the audit specifically tests what AI tools and search return when someone researches your company by name — because commercial buyers verify before outreach. You see exactly how your company appears to someone doing due diligence before sending an RFP.",
    finalLine1: "Commercial buyers verify",
    finalLine2Em: "before they send the RFP.",
    finalLine3Dim: "The audit shows what they find.",
    faqs: [
      {
        q: "We win work through relationships and GC referrals. Is AI visibility relevant?",
        a: "Relationship networks are valuable. But buyers increasingly do parallel verification through search and AI — even for referred contractors. A strong referral can lose to weak digital presence if the buyer can't find enough to verify the recommendation.",
      },
      {
        q: "We don't sell to homeowners. Is your framework built for that?",
        a: "The six layers apply to any context where buyers search before committing. Commercial buyer behavior differs in timeline and depth, but the systems buyers check — search, AI, Maps, directories — are the same. The audit applies the framework to your specific commercial buyer context.",
      },
      {
        q: "Our projects are often confidential. Can we still show portfolio signals?",
        a: "Yes. Portfolio signals don't require client names or project values. Project type, square footage ranges, and location (city, region) are enough to structure searchable capability signals without disclosing confidential details.",
      },
      {
        q: "We operate in multiple cities. Does the engagement cover all markets?",
        a: "The engagement is structured per market. Multi-market contractors typically need multiple sprint engagements — one per primary market. The audit shows where your biggest gaps are across your footprint, and we prioritize from there.",
      },
    ],
  },
};
