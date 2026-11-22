// Construction & Trade Software Catalog — data for /research/construction-software.
//
// Source: "Construction and trade software catalog" (broad sourced catalog,
// 2026-11-21, 100 products). Descriptions and AI notes come from linked vendor
// sources — none were hands-on tested. Regenerated from the source markdown;
// keep edits faithful to the cited source and bump CATALOG_UPDATED when the
// catalog is re-verified. The page, the /research card and the OG image all
// read from this file.
//
// aiStatus "vendor"     = a vendor describes an AI-related capability,
//                          integration, separate offering or roadmap item.
// aiStatus "unverified" = the research did not verify product-specific AI.
//                          It does NOT mean the product has no AI.

export type AIStatus = "vendor" | "unverified";

export type SoftwareSource = {
  label: string;
  url: string;
};

export type ConstructionSoftware = {
  name: string;
  category: string;
  description: string;
  usedFor: string;
  contractorFocus: string;
  aiStatus: AIStatus;
  aiFeatures: string;
  notes?: string;
  sources: SoftwareSource[];
};

export type DiscoveryDirectory = {
  name: string;
  url: string;
  scope: string;
};

export const CATALOG_UPDATED = "November 2026";
export const CATALOG_UPDATED_ISO = "2026-11-21";

/** Primary-workflow categories, in catalog order. */
export const SOFTWARE_CATEGORIES = [
  "Construction management",
  "Residential construction management",
  "Field-service management",
  "Estimating and takeoff",
  "Bid opportunities and preconstruction",
  "Roofing and exterior trades",
  "Landscape management",
  "Heavy-civil estimating and operations",
  "Accounting and construction ERP",
  "Workforce and time tracking",
  "Scheduling and planning",
  "Safety and inspections",
  "Field documentation and site capture",
  "BIM, design and model coordination",
  "Document, design and schedule risk",
  "Call intake",
] as const;

export const CONSTRUCTION_SOFTWARE: ConstructionSoftware[] = [

  // ── CONSTRUCTION MANAGEMENT ───────────────────────────────────────────────

  {
    name: "Autodesk Forma Build",
    category: "Construction management",
    description: "Cloud construction-management platform joining project, cost, quality and safety information for field and office teams.",
    usedFor: "Coordinate RFIs, submittals, schedules, cost, drawings, issues, photos, reports, safety and closeout.",
    contractorFocus: "Owners, general contractors and specialty contractors in commercial, industrial, infrastructure and institutional construction; specific trades not verified.",
    aiStatus: "vendor",
    aiFeatures: "Autodesk describes Assistant for project information, Construction IQ risk analysis, photo autotags, sheet extraction and specification analysis.",
    notes: "AI features and support may vary by region.",
    sources: [
      { label: "Product page", url: "https://www.autodesk.com/products/forma-build/overview" },
      { label: "Feature source", url: "https://construction.autodesk.com/workflows/construction-project-management/" },
      { label: "AI / integration source", url: "https://construction.autodesk.com/workflows/artificial-intelligence-construction/" },
    ],
  },
  {
    name: "Constructable",
    category: "Construction management",
    description: "All-in-one commercial construction platform combining preconstruction, project management, field work and finances.",
    usedFor: "Manage bid packages, takeoffs, project documents, logs, punch lists, budgets, changes and billing.",
    contractorFocus: "Commercial general contractors, particularly small-to-mid-sized firms; vendor also describes subcontracting businesses.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes reviewable submittal/spec checks, drawing/spec conflict checks, invoice drafts and source-linked project answers.",
    notes: "AI features depend on the selected package; workflows report or draft for human review.",
    sources: [
      { label: "Product page", url: "https://constructable.ai/" },
      { label: "Feature source", url: "https://constructable.ai/features/ai-workflows" },
    ],
  },
  {
    name: "Contractor Foreman",
    category: "Construction management",
    description: "All-in-one platform managing construction and service jobs from estimating and scheduling through costs, documentation and billing.",
    usedFor: "Prepare bids, schedule crews, track costs, logs, purchase orders, service tickets and invoices.",
    contractorFocus: "Small and midsize residential and commercial general, specialty and service contractors.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes an AI Estimator for drafting/revising estimates, assigning CSI codes and matching materials; AI-assisted takeoffs are also planned.",
    notes: "AI Estimator is marked coming soon; AI-assisted Takeoffs are in development.",
    sources: [
      { label: "Product page", url: "https://contractorforeman.com/" },
      { label: "Feature source", url: "https://contractorforeman.com/features/financials/ai-estimator/" },
    ],
  },
  {
    name: "Dalux Field",
    category: "Construction management",
    description: "Mobile on-site construction-management product linking drawings and BIM with tasks, quality and safety workflows.",
    usedFor: "Assign drawing- or BIM-linked site issues, conduct inspections and track corrections and safety observations.",
    contractorFocus: "General contractors, site teams and subcontractors on projects of all scales; specific trades not established.",
    aiStatus: "vendor",
    aiFeatures: "AI Safety Hints scans SiteWalk imagery for potential safety risks and offers reviewable hints; it does not automatically send issues.",
    notes: "AI Safety Hints require Field Pro and project setup and do not replace on-site inspections.",
    sources: [
      { label: "Product page", url: "https://www.dalux.com/products/dalux-field/" },
      { label: "Feature source", url: "https://www.dalux.com/solutions/quality-control-and-assurance/" },
      { label: "AI / integration source", url: "https://support.dalux.com/hc/en-us/articles/29649032784540-AI-Safety-hints" },
    ],
  },
  {
    name: "Fieldwire",
    category: "Construction management",
    description: "Hilti web and mobile jobsite platform connecting plans and project documents to tasks, punch lists, inspections, schedules and reporting.",
    usedFor: "View plans, assign location-based work and deficiencies, document progress and coordinate trades.",
    contractorFocus: "Commercial and institutional general contractors and specialty subcontractors, including civil, concrete, drywall, electrical, HVAC, mechanical, plumbing, telecom and utilities.",
    aiStatus: "vendor",
    aiFeatures: "Field Intelligence reportedly answers project-data questions, supports voice-driven task updates and helps edit RFIs; AI photo tagging is also described.",
    notes: "AI photo tagging is on Business and Business Plus; other feature rollout limits not established.",
    sources: [
      { label: "Product page", url: "https://www.fieldwire.com/" },
      { label: "Feature source", url: "https://www.fieldwire.com/ai/" },
    ],
  },
  {
    name: "JobTread",
    category: "Construction management",
    description: "All-in-one construction estimating and project-management platform connecting sales, budgets, job finances and communication.",
    usedFor: "Create budgets and proposals; collect subcontractor bids; track schedules, costs, changes, invoices and payments.",
    contractorFocus: "Home builders, remodelers, pool, outdoor-living and roofing contractors, small-to-mid-sized commercial contractors, plumbers and electricians.",
    aiStatus: "vendor",
    aiFeatures: "Native tools reportedly draft budgets and forms, count plan items, summarize logs, generate formulas and content, extract receipts, build reports and answer support questions.",
    sources: [
      { label: "Product page", url: "https://www.jobtread.com/" },
      { label: "Feature source", url: "https://www.jobtread.com/features/ai" },
    ],
  },
  {
    name: "Kahua",
    category: "Construction management",
    description: "Configurable construction project-management platform for owners and delivery teams managing projects and capital programs.",
    usedFor: "Track budgets, commitments, changes, forecasts, drawings, approvals, field updates and handover information.",
    contractorFocus: "General and specialty subcontractors, federal and defense contractors, owners and public agencies managing multi-project programs.",
    aiStatus: "vendor",
    aiFeatures: "Noa, powered by Kahua AI, can reportedly answer questions, find project information, create records and automate routine work; vendor also describes data extraction.",
    notes: "AI page requests preview access; availability may be limited. Vendor states it uses data centers in the U.S., Canada and UK.",
    sources: [
      { label: "Product page", url: "https://kahua.com/" },
      { label: "Feature source", url: "https://kahua.com/solutions/ai/" },
    ],
  },
  {
    name: "Oracle Aconex",
    category: "Construction management",
    description: "Cloud project collaboration system connecting multiple organizations across construction, infrastructure and engineering projects.",
    usedFor: "Control documents, drawings and models, route reviews and approvals, coordinate communications and preserve project records.",
    contractorFocus: "Large complex projects involving general contractors, EPC firms, subcontractors and owners across building and infrastructure sectors.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI. Oracle’s separately described AI-enabled Advisor for Safety is not an Aconex AI feature.",
    sources: [
      { label: "Product page", url: "https://www.oracle.com/construction-engineering/aconex/" },
      { label: "Feature source", url: "https://www.oracle.com/news/announcement/new-oracle-aconex-capabilities-improve-project-transparency-and-control-2026-04-13/" },
    ],
  },
  {
    name: "PlanRadar",
    category: "Construction management",
    description: "Construction and real-estate platform for site documentation and task coordination using digital plans.",
    usedFor: "Create and assign punch-list and defect tickets with media, deadlines and closeout reports.",
    contractorFocus: "General contractors and specialty HVAC, plumbing, mechanical, electrical, fire-safety and interior/exterior contractors.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes search and answers across project data, natural-language assistants and agents, generated forms and overviews, and structured voice-capture tickets.",
    notes: "AI feature plan and geographic availability not established.",
    sources: [
      { label: "Product page", url: "https://www.planradar.com/" },
      { label: "Feature source", url: "https://www.planradar.com/us/product/punch-list/" },
      { label: "AI / integration source", url: "https://www.planradar.ai/us/" },
    ],
  },
  {
    name: "Procore",
    category: "Construction management",
    description: "Cloud construction platform connecting field and office project execution, coordination and financial workflows.",
    usedFor: "Manage schedules, drawings, RFIs, submittals, logs, changes, budgets, costs and accounting connections.",
    contractorFocus: "General contractors and specialty subcontractors, including electrical, mechanical/HVAC, plumbing, concrete, structural, site and interior trades.",
    aiStatus: "vendor",
    aiFeatures: "Procore describes AI agents that search files and draft RFIs, review submittals and compile logs for human review.",
    notes: "Procore AI is separately plan-packaged; not every core Procore plan necessarily includes AI.",
    sources: [
      { label: "Product page", url: "https://www.procore.com/" },
      { label: "Feature source", url: "https://www.procore.com/project-management" },
      { label: "AI / integration source", url: "https://www.procore.com/ai/agents" },
    ],
  },
  {
    name: "Projul",
    category: "Construction management",
    description: "Construction-management platform connecting leads, estimating, scheduling, invoicing, time and job costs.",
    usedFor: "Track leads and bids, create estimates and changes, schedule crews and compare costs against estimates.",
    contractorFocus: "Residential and commercial general contractors, builders, remodelers, roofers, electricians, plumbers, HVAC firms and landscapers.",
    aiStatus: "vendor",
    aiFeatures: "Projul AI Connect links external assistants such as ChatGPT or Claude to the platform for tasks such as adding leads or drafting estimates; human approval is required.",
    notes: "AI Connect is a Pro-plan integration, not evidence of a native AI model.",
    sources: [
      { label: "Product page", url: "https://projul.com/" },
      { label: "Feature source", url: "https://projul.com/features/budgeting/" },
      { label: "AI / integration source", url: "https://projul.com/features/projul-ai-connect/" },
    ],
  },
  {
    name: "RedTeam",
    category: "Construction management",
    description: "Construction management platform for small and midsize commercial general contractors, connecting preconstruction, projects, finances and closeout.",
    usedFor: "Manage bids, subcontractor communications, documents, RFIs, submittals, logs, changes, budgets and billing.",
    contractorFocus: "Small and midsize commercial general contractors; specific specialty-trade focus not established.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    notes: "A search-indexed AI claim was not corroborated on the current page.",
    sources: [
      { label: "Product page", url: "https://redteam.com/platform/" },
      { label: "Feature source", url: "https://redteam.com/construction-project-management-software/" },
    ],
  },
  {
    name: "Trimble ProjectSight",
    category: "Construction management",
    description: "Construction project management software that brings documents and field/office collaboration into a shared workspace.",
    usedFor: "Manage drawings, RFIs, issues, submittals, specifications, punch lists and photos.",
    contractorFocus: "General contractors and construction project teams, from small teams to large operations; Enterprise lists connected MEP workflows.",
    aiStatus: "vendor",
    aiFeatures: "Trimble describes AI drawing import that reads and extracts drawing information; the product page lists an AI Assistant without detailing its functions.",
    notes: "Displayed plans are for the U.S. and Canada, with a Europe page; Enterprise MEP workflows may require configuration or an add-on.",
    sources: [
      { label: "Product page", url: "https://www.trimble.com/en/products/projectsight" },
      { label: "Feature source", url: "https://investor.trimble.com/news/news-details/2024/Trimble-Showcases-New-Artificial-Intelligence-Innovations-During-Dimensions-User-Conference/default.aspx" },
    ],
  },

  // ── RESIDENTIAL CONSTRUCTION MANAGEMENT ───────────────────────────────────

  {
    name: "BuildBook",
    category: "Residential construction management",
    description: "Residential construction-management platform combining schedules, budgets, task and change tracking, sales and client/team communication.",
    usedFor: "Manage project schedules, budgets, selections, files, daily logs and team/client collaboration.",
    contractorFocus: "Custom home builders, remodelers and specialty contractors; vendor says not intended for large commercial firms or tract builders.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    notes: "Plan-user limits vary between pricing-page sections; no exact limit asserted.",
    sources: [
      { label: "Product page", url: "https://buildbook.co/" },
      { label: "Feature source", url: "https://buildbook.co/project-management-tools" },
    ],
  },
  {
    name: "Buildertrend",
    category: "Residential construction management",
    description: "Construction management platform combining scheduling, finances and client communication, primarily for residential construction.",
    usedFor: "Track leads, proposals, schedules, logs, selections, change orders, client updates, bills, job costs and payments.",
    contractorFocus: "Home builders, remodelers, outdoor-living, pool, deck, kitchen-and-bath and renovation contractors; also marketed to commercial GCs.",
    aiStatus: "vendor",
    aiFeatures: "AI Bill Capture extracts invoice and receipt details; AI Client Updates drafts homeowner-facing project summaries.",
    sources: [
      { label: "Product page", url: "https://buildertrend.com/" },
      { label: "Feature source", url: "https://buildertrend.com/financial-tools/construction-payables-software/" },
      { label: "AI / integration source", url: "https://buildertrend.com/blog/reactive-to-ready-ai-in-construction/" },
    ],
  },
  {
    name: "Buildxact",
    category: "Residential construction management",
    description: "Residential construction platform combining takeoffs and estimating with quoting, scheduling, job management and financial tools.",
    usedFor: "Measure PDF plans, price estimates, send quotes, schedule work and track costs, orders and invoices.",
    contractorFocus: "Small and midsized residential builders, remodelers and residential general contractors.",
    aiStatus: "vendor",
    aiFeatures: "Blu reportedly generates estimates from job descriptions or plans, assists takeoffs, checks missing items, creates quotes and updates schedules.",
    notes: "Blu capabilities vary by plan; some require paid add-on bundles or upgrades.",
    sources: [
      { label: "Product page", url: "https://www.buildxact.com/us/" },
      { label: "Feature source", url: "https://www.buildxact.com/us/features/construction-estimating-software/" },
      { label: "AI / integration source", url: "https://www.buildxact.com/us/blu-ai-construction-assistant/" },
    ],
  },
  {
    name: "Digs",
    category: "Residential construction management",
    description: "Residential construction collaboration platform connecting project documents, plans, selections, schedules and homeowner communications through warranty.",
    usedFor: "Collaborate on plans, tasks and approvals; generate takeoffs; prepare homeowner handoffs and manage warranty requests.",
    contractorFocus: "Custom and production homebuilders and residential remodelers, from small builders to enterprise operations.",
    aiStatus: "vendor",
    aiFeatures: "Vendor says AI extracts flooring, countertop and vertical-surface quantities and turns 2D floor plans into interactive 3D models.",
    sources: [
      { label: "Product page", url: "https://digs.com/" },
      { label: "Feature source", url: "https://digs.com/digscanvas" },
    ],
  },
  {
    name: "Houzz Pro",
    category: "Residential construction management",
    description: "Business and project-management platform for residential construction and design professionals, combining estimating, scheduling, collaboration and visualization.",
    usedFor: "Prepare estimates and takeoffs, coordinate schedules, logs, budgets and approvals, and create 3D visualizations.",
    contractorFocus: "Residential home builders, remodelers, design-build firms and general contractors.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI estimate drafting from text or voice, plan measurements and symbol identification, and estimate-to-schedule suggestions.",
    sources: [
      { label: "Product page", url: "https://pro.houzz.com/for-pros/software-construction" },
      { label: "Feature source", url: "https://pro.houzz.com/for-pros/software-ai-ar-tools" },
    ],
  },

  // ── FIELD-SERVICE MANAGEMENT ──────────────────────────────────────────────

  {
    name: "Ascora",
    category: "Field-service management",
    description: "Field-service and job-management platform linking quotes, scheduling, field records, project phases, invoicing and back office.",
    usedFor: "Estimate, dispatch recurring and multi-crew jobs, track phases, labor, costs, forms, stock and progressive invoices.",
    contractorFocus: "HVAC, plumbing and electrical firms, roofing, landscaping, locksmiths, painting/drywall, fire services and building firms; core fit 5–50 technicians.",
    aiStatus: "vendor",
    aiFeatures: "AI Bill Scanner extracts supplier and invoice data, line items, totals and tax and can link invoices to jobs or purchase orders.",
    notes: "Plumbing plan comparison lists AI supplier-invoice importing in Elite; availability in other packages not established.",
    sources: [
      { label: "Product page", url: "https://ascora.io/" },
      { label: "Feature source", url: "https://ascora.io/features/jobmanagement" },
      { label: "AI / integration source", url: "https://ascora.io/advanced/aibillscanner" },
    ],
  },
  {
    name: "BuildOps",
    category: "Field-service management",
    description: "Unified operations platform for commercial specialty contractors linking service, construction projects, financials and sales.",
    usedFor: "Manage service and preventive maintenance, dispatch, assets, project documents, purchasing, costs, changes and invoices.",
    contractorFocus: "Commercial HVAC/mechanical, electrical, plumbing, fire/life-safety and refrigeration contractors.",
    aiStatus: "vendor",
    aiFeatures: "OpsAI reportedly converts spoken notes into summaries, captures nameplate data, generates invoice summaries, matches payments and extracts purchase-order lines.",
    notes: "AP Automation and Dispatch Agent Teams are marked coming soon.",
    sources: [
      { label: "Product page", url: "https://buildops.com/" },
      { label: "Feature source", url: "https://buildops.com/platform/project-management-suite" },
      { label: "AI / integration source", url: "https://buildops.com/platform/opsai" },
    ],
  },
  {
    name: "Commusoft",
    category: "Field-service management",
    description: "Field-service operations platform connecting office and technicians from customer call through scheduling, completion and invoicing.",
    usedFor: "Schedule and dispatch, track assets and work orders, manage maintenance, quotes, inventory, costs and customer updates.",
    contractorFocus: "Plumbing, commercial HVAC, electrical and generator-installation/maintenance firms; commercial and large-scale residential service businesses.",
    aiStatus: "vendor",
    aiFeatures: "Built-in AI:den reportedly summarizes email and calls, drafts reports and quotes, and extracts supplier-invoice data.",
    notes: "Separate AI:den+ agents are listed as a coming-soon add-on.",
    sources: [
      { label: "Product page", url: "https://www.commusoft.com/en-us/industries/field-service-management-software/" },
      { label: "Feature source", url: "https://www.commusoft.com/en-us/features/aiden/" },
    ],
  },
  {
    name: "Fergus",
    category: "Field-service management",
    description: "Cloud job-management platform covering trade enquiries, quoting, scheduling, tracking and invoicing, with a field app.",
    usedFor: "Prepare quotes, assign jobs, manage phases and variations, track labor and materials and invoice.",
    contractorFocus: "Plumbing, electrical, HVAC, building and other field-service firms, primarily teams of 1–15 according to the vendor.",
    aiStatus: "vendor",
    aiFeatures: "The built-in Assistant uses job/customer context to create jobs, transform supplier PDFs into quotes, find information, adjust schedules and draft messages.",
    notes: "Vendor also describes supporting larger teams.",
    sources: [
      { label: "Product page", url: "https://fergus.com/us/" },
      { label: "Feature source", url: "https://fergus.com/us/ai/" },
    ],
  },
  {
    name: "FieldEdge",
    category: "Field-service management",
    description: "Field-service and business-operations platform for multi-truck home-service companies.",
    usedFor: "Dispatch by skills and availability; manage work orders, equipment histories, quotes, invoices, payments and service agreements.",
    contractorFocus: "HVAC, plumbing and electrical service businesses, especially SMB and mid-market firms with multiple trucks or locations.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI. Free2Grow is a separately integrated AI answering platform, not a verified native FieldEdge feature.",
    notes: "See the separately described Free2Grow integration rather than assuming native AI.",
    sources: [
      { label: "Product page", url: "https://fieldedge.com/field-service-software/" },
      { label: "AI / integration source", url: "https://fieldedge.com/news/fieldedge-announces-integration-with-free2grow-to-help-contractors-grow-revenue/" },
    ],
  },
  {
    name: "FieldPulse",
    category: "Field-service management",
    description: "Cloud field-service platform connecting customer intake and scheduling with field execution, estimates, invoices and payments.",
    usedFor: "Schedule and dispatch crews, track jobs and service histories, manage tasks, estimates, invoices and maintenance.",
    contractorFocus: "Growing HVAC-R, plumbing and electrical service and project businesses.",
    aiStatus: "vendor",
    aiFeatures: "Maverick answers questions from live FieldPulse data and drafts records; separate Operator AI handles call answering and booking.",
    notes: "Maverick is described as included on every plan.",
    sources: [
      { label: "Product page", url: "https://www.fieldpulse.com/" },
      { label: "Feature source", url: "https://www.fieldpulse.com/features/scheduling-and-dispatching" },
      { label: "AI / integration source", url: "https://www.fieldpulse.com/features/maverick" },
      { label: "AI / integration source", url: "https://www.fieldpulse.com/features/operator-ai" },
    ],
  },
  {
    name: "Housecall Pro",
    category: "Field-service management",
    description: "Home-service field-management platform combining dispatch, estimates, invoicing, payments and customer communication.",
    usedFor: "Schedule and dispatch jobs, send estimates and invoices, take payments and manage customer records.",
    contractorFocus: "HVAC, plumbing, electrical, handyman, appliance repair, landscaping, cleaning, roofing, pest control and remodeling firms.",
    aiStatus: "vendor",
    aiFeatures: "Vendor markets Analyst AI for business insights, Marketing AI for content and CSR AI for answering calls and booking jobs.",
    notes: "24/7 CSR AI call answering is paid; other AI members are described as included.",
    sources: [
      { label: "Product page", url: "https://www.housecallpro.com/" },
      { label: "Feature source", url: "https://www.housecallpro.com/features/" },
      { label: "AI / integration source", url: "https://www.housecallpro.com/features/ai-team/" },
    ],
  },
  {
    name: "Jobber",
    category: "Field-service management",
    description: "Business-management platform connecting home-service and contracting customer and job records with estimating, scheduling, field coordination and invoicing.",
    usedFor: "Manage requests, estimates, dispatch, customer communications, invoicing, payments and business performance.",
    contractorFocus: "Home-service businesses including HVAC, plumbing and general contractors and their crews.",
    aiStatus: "vendor",
    aiFeatures: "Vendor-described tools include an assistant for business questions, quote and marketing drafts and suggested automations; custom reports, message rewriting and AI Receptionist for calls, texts and booking.",
    sources: [
      { label: "Product page", url: "https://www.getjobber.com/features/" },
      { label: "Feature source", url: "https://www.getjobber.com/features/ai/" },
    ],
  },
  {
    name: "Joblogic",
    category: "Field-service management",
    description: "Cloud field-service and maintenance platform connecting office staff with mobile engineers and a shared job record.",
    usedFor: "Log requests, schedule reactive and planned maintenance, complete forms and compliance records, track assets, quotes and invoices.",
    contractorFocus: "HVAC/refrigeration, plumbing, heating and drainage service firms and facilities-management providers from small teams to enterprises.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes an agentic layer and AI prototypes, with scheduling/allocation and portal upgrades described as forthcoming.",
    notes: "Treat AI claims as roadmap or pilot, not verified generally available features.",
    sources: [
      { label: "Product page", url: "https://www.joblogic.com/platform/overview" },
      { label: "Feature source", url: "https://www.joblogic.com/field-service-management-software/" },
      { label: "AI / integration source", url: "https://www.joblogic.com/blog/vista-invests-in-joblogic-ai" },
    ],
  },
  {
    name: "Knowify",
    category: "Field-service management",
    description: "Specialty-trade project and service-management platform with job costing and two-way QuickBooks Online sync.",
    usedFor: "Estimate and schedule work, dispatch service calls, track crew time, job costs and WIP, and invoice or handle change orders.",
    contractorFocus: "Electrical, plumbing, HVAC, concrete, excavation, painting and remodeling firms; residential and commercial service and longer projects.",
    aiStatus: "vendor",
    aiFeatures: "Knowify AI surfaces margin risks; a beta assistant answers questions and performs tasks, while an AI Connector links Knowify data to external assistants.",
    notes: "AI Connector is on Advanced and Enterprise; the in-product Assistant is beta.",
    sources: [
      { label: "Product page", url: "https://knowify.com/trade-contractor-software/" },
      { label: "Feature source", url: "https://knowify.com/ai/" },
    ],
  },
  {
    name: "QuoteIQ",
    category: "Field-service management",
    description: "Field-service platform combining estimates, scheduling, invoicing, payments and customer records.",
    usedFor: "Prepare and send quotes, schedule accepted work and invoice or track payments.",
    contractorFocus: "Home-service firms including HVAC, plumbing, electrical, roofing, landscaping, pressure washing and remodeling/general-contracting services; solo operators to teams.",
    aiStatus: "vendor",
    aiFeatures: "The native AI Estimator uses typed or spoken descriptions, up to 20 photos, follow-up answers and matching price-book items to draft estimates for contractor review.",
    sources: [
      { label: "Product page", url: "https://myquoteiq.com/" },
      { label: "Feature source", url: "https://myquoteiq.com/features/ai-estimator/" },
    ],
  },
  {
    name: "Service Fusion",
    category: "Field-service management",
    description: "Field-service management platform for office and field scheduling, dispatch, customer records, estimates, invoicing and payments.",
    usedFor: "Create work orders, dispatch technicians, provide field job details and invoice completed work.",
    contractorFocus: "Small-to-midsize HVAC/refrigeration, plumbing, electrical, appliance repair, garage-door and locksmith service contractors.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    sources: [
      { label: "Product page", url: "https://www.servicefusion.com/" },
      { label: "Feature source", url: "https://www.servicefusion.com/field-service-management-software" },
    ],
  },
  {
    name: "ServiceM8",
    category: "Field-service management",
    description: "Mobile job-management and dispatch product for small trade service firms.",
    usedFor: "Create and dispatch jobs, keep photos and work histories, quote, invoice and accept payments on site.",
    contractorFocus: "Small plumbing and electrical service businesses, from sole operators to teams of about 20.",
    aiStatus: "vendor",
    aiFeatures: "AI Writing Helper drafts or improves messages and quote/invoice descriptions; vendor also describes drafting and booking-time suggestions.",
    notes: "Vendor lists 10 AI uses daily on Free and unlimited daily AI uses on paid plans.",
    sources: [
      { label: "Product page", url: "https://www.servicem8.com/us/" },
      { label: "Feature source", url: "https://www.servicem8.com/us/features-field-service-management" },
      { label: "AI / integration source", url: "https://www.servicem8.com/us/ai-job-management-software-for-trade-contractors" },
    ],
  },
  {
    name: "ServiceTitan",
    category: "Field-service management",
    description: "Business-management platform for residential and commercial trade companies combining office, service, financial and construction workflows.",
    usedFor: "Schedule and dispatch jobs, manage work orders and equipment, track projects, costs, billing and inventory.",
    contractorFocus: "Residential HVAC, plumbing, electrical, roofing, garage-door and pest-control firms; commercial service and specialty construction contractors.",
    aiStatus: "vendor",
    aiFeatures: "Atlas answers questions from customer/equipment records and helps with equipment manuals and troubleshooting; latter functions are listed with Field Pro.",
    notes: "Atlas in the office is marked coming soon.",
    sources: [
      { label: "Product page", url: "https://www.servicetitan.com/" },
      { label: "Feature source", url: "https://www.servicetitan.com/features/dispatch-software" },
      { label: "AI / integration source", url: "https://www.servicetitan.com/features/atlas" },
    ],
  },
  {
    name: "ServiceTrade",
    category: "Field-service management",
    description: "Commercial field-service platform supporting office and technician operations, service and project work, and inspections.",
    usedFor: "Schedule service and maintenance, guide mobile inspections, record deficiencies, maintain equipment histories and prepare repair proposals.",
    contractorFocus: "Commercial fire-protection/life-safety and HVAC/mechanical contractors; also electrical service, refrigeration and kitchen-exhaust cleaning.",
    aiStatus: "vendor",
    aiFeatures: "Smart Assistants summarize jobs and assets, turn technician notes into customer comments, answer operational questions and capture nameplate data from photos.",
    notes: "Smart Assistants are available on Premium and Enterprise; Stella AI Agents are separately presented.",
    sources: [
      { label: "Product page", url: "https://servicetrade.com/products/servicetrade-platform/features/" },
      { label: "Feature source", url: "https://servicetrade.com/products/servicetrade-platform/features/smart-assistants/" },
    ],
  },
  {
    name: "Simpro",
    category: "Field-service management",
    description: "Field-service and job-management platform connecting office and field workflows for service, maintenance and projects.",
    usedFor: "Estimate, manage inventory and supplier pricing, dispatch crews, capture field records, bill and report.",
    contractorFocus: "Electrical, plumbing, HVAC, security and fire-protection businesses handling residential and commercial work.",
    aiStatus: "vendor",
    aiFeatures: "Simpro Lightning includes vendor-described natural-language business-data questions, technician guidance, pre-job briefs, transcription and customer summaries.",
    notes: "No plan or geographic limits verified.",
    sources: [
      { label: "Product page", url: "https://www.simprogroup.com/solutions/field-service-management-software" },
      { label: "Feature source", url: "https://www.simprogroup.com/lightning" },
    ],
  },
  {
    name: "Tradify",
    category: "Field-service management",
    description: "Trade job-management app for inquiries, quoting, scheduling, tracking, invoicing and payments.",
    usedFor: "Capture inquiries, send quotes, schedule staff, track time and costs, invoice and follow up.",
    contractorFocus: "Electricians, plumbers and gas engineers, HVAC/refrigeration technicians and property-maintenance firms.",
    aiStatus: "vendor",
    aiFeatures: "SmartTools includes SmartWrite for descriptions and SmartRead for extracting invoice-photo details.",
    notes: "SmartTools is listed on Plus only.",
    sources: [
      { label: "Product page", url: "https://www.tradifyhq.com/" },
      { label: "Feature source", url: "https://www.tradifyhq.com/features/smarttools" },
      { label: "Pricing / plan note", url: "https://www.tradifyhq.com/pricing" },
    ],
  },
  {
    name: "Workiz",
    category: "Field-service management",
    description: "Web and mobile field-service platform for home-service scheduling, dispatch, customer records, invoicing, communication and payment.",
    usedFor: "Track leads and jobs, assign service calls, notify customers, prepare estimates and invoices and collect payments.",
    contractorFocus: "HVAC, plumbing, electrical, appliance repair, locksmith, garage-door, roofing, painting and other home-service businesses.",
    aiStatus: "vendor",
    aiFeatures: "Genius Answering reportedly answers calls and inbox messages, books or reschedules jobs and dispatches technicians by skill and availability.",
    sources: [
      { label: "Product page", url: "https://www.workiz.com/" },
      { label: "Feature source", url: "https://www.workiz.com/features/dispatching/" },
      { label: "AI / integration source", url: "https://www.workiz.com/features/genius-answering/" },
    ],
  },

  // ── ESTIMATING AND TAKEOFF ────────────────────────────────────────────────

  {
    name: "Bluebeam Revu",
    category: "Estimating and takeoff",
    description: "Desktop app for construction PDF markup, measurements and drawing collaboration, with Studio and browser/mobile access.",
    usedFor: "Annotate and compare plans, measure PDF quantities, export estimates and coordinate comments, issues and closeout records.",
    contractorFocus: "General and specialty contractors, including electrical, plumbing, mechanical/HVAC, roofing, drywall, concrete and steel; also heavy civil.",
    aiStatus: "vendor",
    aiFeatures: "Revu Visual Search uses computer vision to find symbols or annotations; premium Bluebeam Max adds AI drawing-review and comparison capabilities.",
    notes: "Visual Search is listed for all plans; Smart Review and Smart Overlay are in preview. Smart Review is optimized for U.S. vertical commercial construction.",
    sources: [
      { label: "Product page", url: "https://www.bluebeam.com/product/" },
      { label: "Feature source", url: "https://www.bluebeam.com/workflows/takeoffs-and-estimation/" },
      { label: "AI / integration source", url: "https://www.bluebeam.com/company/ai-transparency/" },
    ],
  },
  {
    name: "Clear Estimates",
    category: "Estimating and takeoff",
    description: "Residential-remodeling estimating product with localized costs, templates and a customizable parts library.",
    usedFor: "Prepare itemized estimates and proposals, gather signatures and create invoices and change orders.",
    contractorFocus: "Residential remodelers, general contractors, handymen and specialty roofers, painters, plumbers, HVAC contractors and electricians.",
    aiStatus: "vendor",
    aiFeatures: "AI Estimator drafts from a plain-language job description using library items; Pro adds input from photos, plans and documents.",
    notes: "Localized pricing covers U.S. areas; default library is residential-focused. Pro is required for photo, plan and document inputs.",
    sources: [
      { label: "Product page", url: "https://www.clearestimates.com/" },
      { label: "Feature source", url: "https://www.clearestimates.com/how-it-works/estimates" },
      { label: "AI / integration source", url: "https://www.clearestimates.com/blog/ai-estimating-software-for-contractors-build-estimates-from-plans-photos" },
    ],
  },
  {
    name: "Contractor+ with Estimatic AI",
    category: "Estimating and takeoff",
    description: "Estimatic AI is an estimating feature built into Contractor+, software for build and service contractors.",
    usedFor: "Draft itemized quotes; review labor, materials, markup and line items; send estimates for signature and schedule approved work.",
    contractorFocus: "HVAC, plumbing and roofing service contractors; also remodels, repairs, installations and new builds.",
    aiStatus: "vendor",
    aiFeatures: "Estimatic AI drafts estimates from job details and optional photos or plans using the contractor’s cost book, supplier pricing and local labor rates; the contractor reviews and edits.",
    notes: "Built into Contractor+, not a separate tool; vendor specifically describes a U.S. local labor-rate index.",
    sources: [
      { label: "Product page", url: "https://contractorplus.app/ai-estimating-software/" },
    ],
  },
  {
    name: "Estim8 Pro",
    category: "Estimating and takeoff",
    description: "Mobile and web construction estimating product using plans or a spoken or typed job description to build itemized estimates.",
    usedFor: "Count drawing quantities; build and adjust labor and material estimates and produce bids.",
    contractorFocus: "Small residential and light-commercial contractors, including remodelers, custom homebuilders, solo operators and trade contractors.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI blueprint reading and Supe, a conversational superintendent that builds priced, trade-divided estimates.",
    notes: "Conversational estimates need a size driver; vendor identifies complex commercial takeoffs as a weak fit. Independent listing reports U.S. coverage across 50 states and 393 metros.",
    sources: [
      { label: "Product page", url: "https://www.estim8pro.ai/" },
      { label: "Feature source", url: "https://www.estim8pro.ai/blog/ai-superintendent-conversational-construction-estimating" },
    ],
  },
  {
    name: "FastPIPE",
    category: "Estimating and takeoff",
    description: "Commercial and industrial plumbing and mechanical estimating software combining digital takeoff and trade-specific catalogs.",
    usedFor: "Measure piping and plumbing, build labor/material estimates with assemblies and supplier pricing and produce bid reports.",
    contractorFocus: "Commercial and industrial plumbing, HVAC piping and industrial process-piping contractors.",
    aiStatus: "vendor",
    aiFeatures: "FastEST plans AI-powered takeoff in FastPIPE with estimator review and adjustment.",
    notes: "AI takeoff is targeted for Q2 2027; not verified as released.",
    sources: [
      { label: "Product page", url: "https://fastest-inc.com/FastPIPE" },
      { label: "AI / integration source", url: "https://fastest-inc.com/AITakeoffSoftware" },
    ],
  },
  {
    name: "Joist",
    category: "Estimating and takeoff",
    description: "Mobile and web app connecting small contractors’ estimates, invoices, payments and job information.",
    usedFor: "Send estimates and invoices, collect deposits and payments, track invoice status and maintain job records.",
    contractorFocus: "Solo home-service contractors and small crews including remodelers, HVAC, plumbing, electrical, roofing, painting, carpentry, landscaping and handyman businesses.",
    aiStatus: "vendor",
    aiFeatures: "Built-in AI Estimate and AI Invoice draft from typed or spoken descriptions for review, and AI Note Improver polishes notes; an AI receptionist is a separate paid add-on.",
    notes: "AI Estimate and Invoice are described across active plans; payments functionality is reported in the U.S. and Canada.",
    sources: [
      { label: "Product page", url: "https://www.joist.com/" },
      { label: "Feature source", url: "https://www.joist.com/workshop/features/estimate-and-invoice-faster-with-ai/" },
    ],
  },
  {
    name: "McCormick Estimating Software",
    category: "Estimating and takeoff",
    description: "Construction bidding and estimating platform with digital takeoff, trade databases and labor/material costing.",
    usedFor: "Measure and count plan items, estimate electrical and low-voltage work, calculate cable runs, update prices and revise changes.",
    contractorFocus: "Electrical contractors and low-voltage specialists doing commercial, residential and industrial projects, security, fire alarms and structured cabling.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI symbol detection and counting in plans as a project in flight, with multi-page interpretation and extraction planned.",
    notes: "AI statement is roadmap language rather than release confirmation; databases described for the U.S. and Canada.",
    sources: [
      { label: "Product page", url: "https://www.mccormicksys.com/software/" },
      { label: "Feature source", url: "https://www.mccormicksys.com/industries/electrical/" },
      { label: "AI / integration source", url: "https://www.mccormicksys.com/ai-statement/" },
    ],
  },
  {
    name: "On-Screen Takeoff (OST)",
    category: "Estimating and takeoff",
    description: "Construction takeoff software for measuring and organizing quantities from digital plans.",
    usedFor: "Measure lengths, areas and counts, manage repeated conditions, compare revisions and transfer takeoffs into estimating workflows.",
    contractorFocus: "General contractors and trade subcontractors including concrete, doors/hardware, walls, flooring, roofing, mechanical/HVAC, electrical and plumbing.",
    aiStatus: "vendor",
    aiFeatures: "Takeoff Boost reportedly creates initial areas, counts objects and identifies wall types; it is a separately branded vendor AI tool integrated with OST.",
    notes: "Do not assume every standard OST function is AI; availability varies by product.",
    sources: [
      { label: "Product page", url: "https://www.oncenter.com/products/on-screen-takeoff/" },
      { label: "Feature source", url: "https://www.oncenter.com/products/takeoff-boost/" },
    ],
  },
  {
    name: "PlanSwift",
    category: "Estimating and takeoff",
    description: "Windows desktop software for digital takeoff and estimates using material and labor assemblies.",
    usedFor: "Measure and count PDF/CAD/image plans, apply cost formulas, compare revisions and export bid estimates.",
    contractorFocus: "General contractors and specialty estimators including drywall, concrete, electrical, plumbing, flooring, framing, HVAC, landscape, painting and masonry.",
    aiStatus: "vendor",
    aiFeatures: "Takeoff BOOST includes AI first-pass Auto Takeoff, Auto Count, Auto Scale and Auto Bookmark; estimates require review.",
    notes: "Installed Windows 10/11 application; Takeoff BOOST availability varies by subscription tier.",
    sources: [
      { label: "Product page", url: "https://www.planswift.com/" },
      { label: "Feature source", url: "https://www.planswift.com/features/auto-takeoff/" },
    ],
  },
  {
    name: "RIB Candy",
    category: "Estimating and takeoff",
    description: "Construction and engineering suite linking on-screen takeoff and bills of quantities with estimating, planning and commercial control.",
    usedFor: "Measure drawings, compile BOQs, estimate and analyze tenders, forecast resources/costs and manage valuations and variations.",
    contractorFocus: "Engineering and construction firms from small to large, including general/building and underground-infrastructure contractors.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    notes: "Candy Master Library Templates are only available in South Africa; this limit is not asserted for the core product.",
    sources: [
      { label: "Product page", url: "https://www.rib-software.com/en/rib-candy" },
    ],
  },
  {
    name: "STACK Takeoff & Estimate",
    category: "Estimating and takeoff",
    description: "Cloud preconstruction product for plan measurements, estimating worksheets, libraries and bid proposals.",
    usedFor: "Upload and measure plans, assemble labor and materials, compare revisions and prepare bids.",
    contractorFocus: "General contractors and specialty trades including concrete, masonry, drywall, electrical, framing, insulation, mechanical, painting, plumbing, roofing and site work.",
    aiStatus: "vendor",
    aiFeatures: "AI Takeoff scans plan sheets for first-pass door/window counts, room and gross areas and interior/exterior walls; results are editable.",
    notes: "AI Takeoff is included in Premium and Pro and processes one sheet at a time; architectural floor plans are recommended.",
    sources: [
      { label: "Product page", url: "https://www.stackct.com/takeoff-and-estimating/" },
      { label: "Feature source", url: "https://www.stackct.com/floor-plan-ai/" },
    ],
  },
  {
    name: "Togal.AI",
    category: "Estimating and takeoff",
    description: "Cloud construction takeoff product for measuring, counting and comparing quantities on digital plans.",
    usedFor: "Measure areas and linear runs, count symbols, search drawings, compare revisions and export quantities for bids.",
    contractorFocus: "General contractors and specialty estimators including electrical, drywall, framing, painting, flooring, glazing and doors/hardware teams.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI detection, measurement, counting, classification and comparison, image/text/pattern search and Togal.CHAT for plan questions.",
    sources: [
      { label: "Product page", url: "https://www.togal.ai/" },
      { label: "Feature source", url: "https://www.togal.ai/features" },
    ],
  },
  {
    name: "Trimble Accubid Anywhere",
    category: "Estimating and takeoff",
    description: "Cloud estimating suite for electrical and industrial mechanical contractors with takeoff, pricing and change management.",
    usedFor: "Count and measure drawings, build bids from material and labor data, compare revisions and price changes.",
    contractorFocus: "Electrical and industrial mechanical firms and their estimating teams across offices.",
    aiStatus: "vendor",
    aiFeatures: "Trimble describes AI-powered LiveCount detecting and counting outlets, switches and fire-alarm systems.",
    notes: "LiveCount is included with Named-User subscriptions according to the vendor.",
    sources: [
      { label: "Product page", url: "https://www.trimble.com/en/products/trimble-accubid-anywhere" },
      { label: "AI / integration source", url: "https://www.trimble.com/en/blog/construction/article/stop-counting-start-winning-how-ai-is-transforming-your-estimating-workflow" },
    ],
  },

  // ── BID OPPORTUNITIES AND PRECONSTRUCTION ─────────────────────────────────

  {
    name: "ConstructConnect Project Intelligence",
    category: "Bid opportunities and preconstruction",
    description: "Commercial project-discovery and preconstruction platform combining project data, bid documents, alerts and pipeline tools.",
    usedFor: "Find and qualify projects, review plans and addenda, monitor bid dates and bidders, and track leads.",
    contractorFocus: "Commercial general contractors and specialty subcontractors across trades seeking project leads.",
    aiStatus: "vendor",
    aiFeatures: "Ask Documents searches project documents to answer plain-language questions about scope, dates and materials, showing sources when available.",
    notes: "Vendor comparison page describes U.S. and Canada coverage.",
    sources: [
      { label: "Product page", url: "https://www.constructconnect.com/en/products/project-intelligence" },
      { label: "Feature source", url: "https://help.constructconnect.com/constructconnect-project-intelligence-12/ask-documents-in-project-intelligence-2746" },
    ],
  },
  {
    name: "Downtobid",
    category: "Bid opportunities and preconstruction",
    description: "Commercial bid-management platform for general contractors and trade subcontractors.",
    usedFor: "Create trade packages and planrooms, invite subcontractors and track bid coverage; subs organize invitations and deadlines.",
    contractorFocus: "Commercial general contractors and commercial trade subcontractors.",
    aiStatus: "vendor",
    aiFeatures: "GC bid tool AI reviews plan sheets, identifies trade packages and drafts scope notes.",
    notes: "Separate AI Notebook advertises early access; its additional features are not treated as generally available.",
    sources: [
      { label: "Product page", url: "https://www.downtobid.com/bid-tool" },
    ],
  },
  {
    name: "SmartBid",
    category: "Bid opportunities and preconstruction",
    description: "ConstructConnect cloud bid-management software for general contractors and subcontractor outreach.",
    usedFor: "Organize subcontractors, issue bid invitations and addenda, share plans, compare proposals and manage prequalification.",
    contractorFocus: "Prime/general contractors, including commercial and residential GCs; subcontractors participate in invitations.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    sources: [
      { label: "Product page", url: "https://smartbid.co/" },
      { label: "Feature source", url: "https://smartbid.co/features-overview-smartbid-construction-bid-management" },
    ],
  },

  // ── ROOFING AND EXTERIOR TRADES ───────────────────────────────────────────

  {
    name: "AccuLynx",
    category: "Roofing and exterior trades",
    description: "All-in-one roofing business platform linking sales, office and field work from lead to final invoice.",
    usedFor: "Manage leads, customer records, photos, estimates, contracts, scheduling, materials and progress.",
    contractorFocus: "Roofing businesses, especially residential insurance-restoration and retail roofers, from startups to multi-location firms.",
    aiStatus: "vendor",
    aiFeatures: "Lead Intelligence uses AI and third-party demographic, financial and property data to score predicted likelihood to buy.",
    sources: [
      { label: "Product page", url: "https://acculynx.com/" },
      { label: "Feature source", url: "https://acculynx.com/roofing-sales-lead-intelligence/" },
    ],
  },
  {
    name: "Eagleview One™",
    category: "Roofing and exterior trades",
    description: "Subscription platform for aerial property imagery, interactive 3D exterior models and roof and exterior measurements.",
    usedFor: "Review properties remotely, measure surfaces, prepare bids, plan projects, order materials and create reports.",
    contractorFocus: "Roofing and siding contractors serving residential, multifamily and commercial projects, from small crews to national enterprises.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI-driven asset intelligence and reports powered by machine learning.",
    sources: [
      { label: "Product page", url: "https://www.eagleview.com/eagleview-one/" },
    ],
  },
  {
    name: "JobNimbus",
    category: "Roofing and exterior trades",
    description: "Roofing CRM and project-management platform for leads, sales, estimates, job tracking, crew coordination and billing.",
    usedFor: "Track leads, inspections, estimates, work orders, crews, materials, communications, invoices and payments.",
    contractorFocus: "Primarily residential roofing contractors; also siding, gutter, fencing and exterior-remodeling businesses.",
    aiStatus: "vendor",
    aiFeatures: "Analytics AI add-on answers plain-language questions about business data; it is distinct from standard Analytics.",
    notes: "Built for residential roofing first; Analytics AI is an add-on, with trial access noted.",
    sources: [
      { label: "Product page", url: "https://www.jobnimbus.com/" },
      { label: "Feature source", url: "https://www.jobnimbus.com/product/analytics" },
    ],
  },
  {
    name: "Roofr",
    category: "Roofing and exterior trades",
    description: "Roofing platform combining CRM, measurement reports, estimates, proposals, ordering, work orders, invoices and payments.",
    usedFor: "Track leads, obtain aerial or DIY measurements, estimate materials, send proposals, schedule and invoice.",
    contractorFocus: "Residential and commercial roofing and repair/replacement businesses across North America.",
    aiStatus: "vendor",
    aiFeatures: "Optional AI Receptionist answers and screens calls, captures details and books appointments; with Instant Estimator it can provide ballpark quotes.",
    notes: "AI Receptionist is a separate add-on for any Roofr plan, not a claim that core CRM uses AI.",
    sources: [
      { label: "Product page", url: "https://roofr.com/" },
      { label: "Feature source", url: "https://roofr.com/products" },
      { label: "AI / integration source", url: "https://roofr.com/ai-receptionist" },
    ],
  },

  // ── LANDSCAPE MANAGEMENT ──────────────────────────────────────────────────

  {
    name: "LMN by Granum",
    category: "Landscape management",
    description: "Landscaping business-management platform combining budget-based estimating, customer management, scheduling, time, invoicing and job costing.",
    usedFor: "Prepare estimates and proposals, organize customers, schedule crews, record hours, invoice and compare estimated with actual costs.",
    contractorFocus: "North American landscape maintenance and design/build firms, including hardscape and softscape installers.",
    aiStatus: "vendor",
    aiFeatures: "Granum advertises a Beam AI integration to read plans and maps for takeoffs; it is attributed to Beam AI, not assumed native LMN AI.",
    notes: "Vendor gives conflicting plan-size descriptions; tier cutoffs should be treated as approximate.",
    sources: [
      { label: "Product page", url: "https://granum.com/lmn/" },
      { label: "Feature source", url: "https://granum.com/lmn/estimating/" },
    ],
  },

  // ── HEAVY-CIVIL ESTIMATING AND OPERATIONS ─────────────────────────────────

  {
    name: "AGTEK Gradework",
    category: "Heavy-civil estimating and operations",
    description: "Earthwork takeoff and modeling software using PDF, CAD and drone data to calculate quantities and create 3D models.",
    usedFor: "Estimate earthwork and cut/fill, build grading and machine-control models and analyze stockpiles and progress.",
    contractorFocus: "Civil, heavy-construction, grading, earthmoving and site-preparation contractors of varied sizes.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI. AGTEK Reveal Transform is a separate AI plan-preparation product exporting into Gradework.",
    notes: "Separate Reveal Transform capability is not counted as Gradework AI.",
    sources: [
      { label: "Product page", url: "https://agtek.com/products/gradework/" },
      { label: "Feature source", url: "https://agtek.com/construction-takeoffs/" },
    ],
  },
  {
    name: "Assignar",
    category: "Heavy-civil estimating and operations",
    description: "Cloud construction operations platform connecting field work, crew and equipment planning, compliance and job performance.",
    usedFor: "Allocate qualified workers, crews and equipment, track availability and compliance, and collect timesheets and work-progress data.",
    contractorFocus: "Heavy-civil self-performing contractors and subcontractors including asphalt, concrete, excavation, earthworks and rail; scheduler page cites teams of 20 to 200+ workers.",
    aiStatus: "vendor",
    aiFeatures: "A vendor roadmap marks Faster Order Insights with AI as released and describes daily and weekly AI summaries of site activities and order progress.",
    sources: [
      { label: "Product page", url: "https://www.assignar.com/" },
      { label: "Feature source", url: "https://assignar.com/crew-scheduling/" },
      { label: "AI / integration source", url: "https://product.assignar.com/c/294-released-faster-order-insights-with-ai" },
    ],
  },
  {
    name: "HCSS HeavyBid",
    category: "Heavy-civil estimating and operations",
    description: "Heavy-civil construction estimating and bid-management software offered in desktop and web editions.",
    usedFor: "Build estimates from pay items, labor, equipment and material costs; evaluate quotes, markups and risks; hand off budgets.",
    contractorFocus: "Self-performing heavy-civil and infrastructure contractors, including DOT and public-works bidders.",
    aiStatus: "vendor",
    aiFeatures: "Platform-level HCSS AI can reportedly summarize HeavyBid estimate-audit history; this is not evidence that ordinary calculations use AI.",
    notes: "Desktop and browser editions differ; HCSS AI is a separately described platform offering.",
    sources: [
      { label: "Product page", url: "https://www.hcss.com/products/construction-estimating-software/" },
      { label: "Feature source", url: "https://www.hcss.com/products/setup-and-takeoff/" },
      { label: "AI / integration source", url: "https://www.hcss.com/ai/" },
    ],
  },
  {
    name: "InEight Estimate",
    category: "Heavy-civil estimating and operations",
    description: "Estimating software for complex capital construction from conceptual and feasibility estimates to detailed bids and control estimates.",
    usedFor: "Build estimates from scope, resources and cost libraries, benchmark productivity, compare quotes and update changing scope.",
    contractorFocus: "Large-project infrastructure and transportation contractors, and firms in mining, energy, nuclear, water and power.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI. Platform-level predictive estimating was described as a future phase, not an Estimate-specific released feature.",
    notes: "Cloud and on-premises editions are described.",
    sources: [
      { label: "Product page", url: "https://ineight.com/products/ineight-estimate/" },
      { label: "Feature source", url: "https://ineight.com/products/ineight-estimate/bid-wizard/" },
    ],
  },
  {
    name: "Trimble B2W Estimate",
    category: "Heavy-civil estimating and operations",
    description: "Heavy-construction estimating and bidding software centralizing cost data, templates and historical comparisons.",
    usedFor: "Build bids using crews and pay items, manage RFQs and changes, support DOT workflows and review estimates against actual costs.",
    contractorFocus: "Heavy-civil firms of all sizes, including infrastructure, utilities, earthwork and paving contractors.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    sources: [
      { label: "Product page", url: "https://www.trimble.com/en/products/b2w-software/estimate" },
    ],
  },

  // ── ACCOUNTING AND CONSTRUCTION ERP ───────────────────────────────────────

  {
    name: "Acumatica Construction Edition",
    category: "Accounting and construction ERP",
    description: "Cloud construction ERP connecting job-cost accounting, project management and field-office workflows.",
    usedFor: "Track budgets, contracts, commitments, procurement, field time, expenses, billing, forecasts and financial reports.",
    contractorFocus: "Small and midsized general and design-build contractors, specialty contractors, subcontractors and production or custom homebuilders.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI insights for change-order profitability and material use, plus anomaly detection for budget overruns and subcontractor billing irregularities.",
    notes: "Capabilities depend on application/configuration; exact AI availability by release or package not established.",
    sources: [
      { label: "Product page", url: "https://www.acumatica.com/cloud-erp-software/construction-management/" },
      { label: "Feature source", url: "https://www.acumatica.com/cloud-erp-software/artificial-intelligence/" },
    ],
  },
  {
    name: "CMiC",
    category: "Accounting and construction ERP",
    description: "Construction ERP suite on a shared database combining construction financials and project management.",
    usedFor: "Manage accounting, job costs, payroll, equipment, budgets, forecasts, billing, contracts, documents and field workflows.",
    contractorFocus: "Mid-market to large general contractors and specialty/self-performing subcontractors including mechanical and civil/heavy-highway firms.",
    aiStatus: "vendor",
    aiFeatures: "Separately listed NEXUS is described as an AI-enabled platform offering with natural-language analytics, extraction, submittal suggestions and task agents.",
    notes: "Exact availability by CMiC ERP configuration is not specified.",
    sources: [
      { label: "Product page", url: "https://cmicglobal.com/products" },
      { label: "Feature source", url: "https://cmicglobal.com/products/nexus" },
    ],
  },
  {
    name: "Deltek ComputerEase",
    category: "Accounting and construction ERP",
    description: "Construction accounting software combining job costing, project management, payroll and equipment controls.",
    usedFor: "Track costs by job and phase, WIP and commitments; prepare progress bills; capture field time, expenses and equipment usage.",
    contractorFocus: "Residential, commercial and specialty-trade firms, including small mechanical contractors doing HVAC, heating, plumbing and commercial service.",
    aiStatus: "vendor",
    aiFeatures: "ComputerEase Field Apps offers Dela AI voice commands for time and expenses and ICR receipt extraction; Deltek describes ICR as an AI application.",
    notes: "Field Apps is an extension/module; do not generalize its AI to every module.",
    sources: [
      { label: "Product page", url: "https://www.deltek.com/products/erp/computerease/" },
      { label: "Feature source", url: "https://www.deltek.com/products/erp/computerease/mobile-field-service/" },
      { label: "AI / integration source", url: "https://www.deltek.com/resources/articles/construction-ai-trends/" },
    ],
  },
  {
    name: "FOUNDATION",
    category: "Accounting and construction ERP",
    description: "Construction accounting system combining job costing, payroll, accounts, ledger and construction financial reporting.",
    usedFor: "Create budgets and cost codes, monitor WIP and cash flow, manage changes and process construction payroll and compliance reports.",
    contractorFocus: "General and specialty contractors, including heavy/highway concrete, grading, excavation and asphalt firms and union/prevailing-wage projects.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI. FOUNDATION Pay A/P Automation is a distinct vendor-sold platform/add-on with separately described AI invoice processing.",
    notes: "Vendor AI initiatives are not established as released capabilities of the core accounting product.",
    sources: [
      { label: "Product page", url: "https://www.foundationsoft.com/" },
      { label: "Feature source", url: "https://www.foundationsoft.com/software/job-costing/" },
    ],
  },
  {
    name: "Premier Construction Software",
    category: "Accounting and construction ERP",
    description: "Cloud construction ERP combining accounting, job costing, project management and field/document workflows.",
    usedFor: "Track costs, budgets, cash flow and WIP; process project billing and invoice approvals; manage RFIs, submittals and changes.",
    contractorFocus: "General contractors, builders and land developers; owners are also a named audience.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI universal search, Eddie assistant for issues and routine tasks, and SmartUi machine-learning invoice processing.",
    sources: [
      { label: "Product page", url: "https://premiercs.com/" },
      { label: "Feature source", url: "https://premiercs.com/features/construction-accounting" },
      { label: "AI / integration source", url: "https://premiercs.com/features/artificial-intelligence" },
    ],
  },
  {
    name: "Sage 100 Contractor",
    category: "Accounting and construction ERP",
    description: "Construction-specific accounting and project-management software with job costing and financial controls.",
    usedFor: "Track budgets, actual and committed costs, payroll, billing, purchase orders, subcontracts and project controls; service functions support dispatch.",
    contractorFocus: "Small-to-midsize general contractors, subcontractors including electrical and plumbing, and service contractors.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    notes: "Estimating and certain service receivables/inventory functions are add-on modules.",
    sources: [
      { label: "Product page", url: "https://www.sage.com/en-us/products/sage-100-contractor/" },
      { label: "Feature source", url: "https://www.sage.com/en-us/-/media/files/sagedotcom/us/documents/pdf/construction/sage_100_contractor_ebook3-compressed.pdf" },
    ],
  },
  {
    name: "Sage 300 Construction and Real Estate",
    category: "Accounting and construction ERP",
    description: "Construction ERP connecting accounting, job cost, estimating, project management, service operations and property management.",
    usedFor: "Track project costs, budgets, contracts and billing; manage documents and changes; dispatch and bill service calls.",
    contractorFocus: "Construction firms with accounting and project teams, growing businesses and contractors with service departments; specific trades not established.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    notes: "Formerly Sage Timberline Office.",
    sources: [
      { label: "Product page", url: "https://www.sage.com/en-us/products/sage-300-construction-and-real-estate/" },
      { label: "Feature source", url: "https://www.sage.com/en-us/-/media/files/sagedotcom/us/documents/pdf/cre/sage-300-cre/sage_300cre_project_management.pdf" },
    ],
  },
  {
    name: "Trimble Vista",
    category: "Accounting and construction ERP",
    description: "Integrated construction ERP covering job-cost accounting, financials, HR/payroll, service and equipment management.",
    usedFor: "Track job costs, changes and WIP; manage accounts and payroll; process invoices; capture field labor and equipment data.",
    contractorFocus: "Large-scale contractors with complex accounting and HR/payroll needs; examples include commercial GCs, electrical contractors and service businesses.",
    aiStatus: "vendor",
    aiFeatures: "Trimble announced Automatic Invoicing using Azure AI Document Intelligence to extract paper/PDF invoice data into validated unapproved entries.",
    notes: "AI announcement is from November 2023; current deployment availability was not independently established.",
    sources: [
      { label: "Product page", url: "https://www.trimble.com/en/products/viewpoint/vista" },
      { label: "Feature source", url: "https://investor.trimble.com/news/news-details/2023/Trimble-Introduces-AI-Powered-Capability-to-Automatic-Invoicing-Functionality-with-Microsoft-Azure/default.aspx" },
    ],
  },

  // ── WORKFORCE AND TIME TRACKING ───────────────────────────────────────────

  {
    name: "Arcoro Time",
    category: "Workforce and time tracking",
    description: "Construction timekeeping system, formerly ExakTime, capturing field crew hours through mobile GPS and jobsite clocks.",
    usedFor: "Record and geofence clock-ins, review overtime, allocate labor to projects and cost codes, and transfer payroll data.",
    contractorFocus: "Construction and field-service businesses; customer examples include painting, mechanical, glass, concrete and solar firms.",
    aiStatus: "vendor",
    aiFeatures: "A generative-AI message composer drafts employee alerts and translates English messages into Spanish or French.",
    notes: "Formerly ExakTime.",
    sources: [
      { label: "Product page", url: "https://arcoro.com/exaktime" },
      { label: "Feature source", url: "https://arcoro.com/exaktime/contractors" },
      { label: "AI / integration source", url: "https://arcoro.com/resources/arcoro-launches-generative-ai-feature-in-exaktime" },
    ],
  },
  {
    name: "Bridgit",
    category: "Workforce and time tracking",
    description: "Construction workforce-planning platform showing projects, roles, people and availability across jobs.",
    usedFor: "Forecast staffing demand, identify gaps, assign people and crews, check skills and send assignment updates.",
    contractorFocus: "General contractors and mechanical, electrical, plumbing and concrete specialty subcontractors.",
    aiStatus: "vendor",
    aiFeatures: "Bridgit AI offers plain-language workforce questions, reports and agents recommending assignments or building teams; proposed actions require review.",
    notes: "Current name Bridgit; some older references use Bridgit Bench.",
    sources: [
      { label: "Product page", url: "https://gobridgit.com/" },
      { label: "Feature source", url: "https://gobridgit.com/project-planning/" },
      { label: "AI / integration source", url: "https://gobridgit.com/bridgit-ai/" },
    ],
  },
  {
    name: "busybusy",
    category: "Workforce and time tracking",
    description: "Mobile and web construction time-tracking and job-costing product for crews and equipment.",
    usedFor: "Track time, breaks, cost codes, equipment hours, payroll reports, budgets and jobsite progress.",
    contractorFocus: "Excavation, electrical, concrete, painting, restoration, snow removal, landscaping, construction, remodeling and field-service businesses.",
    aiStatus: "vendor",
    aiFeatures: "Vendor says Kiosk Mode facial recognition uses AI to notify the office if someone clocks in for another person.",
    sources: [
      { label: "Product page", url: "https://busybusy.com/" },
      { label: "Feature source", url: "https://busybusy.com/features/three-ways-to-track-time/" },
    ],
  },
  {
    name: "Workyard",
    category: "Workforce and time tracking",
    description: "Field-workforce platform combining GPS-verified time capture, crew scheduling and job-level labor tracking.",
    usedFor: "Record clock-ins, site visits, hours and mileage, allocate labor, approve timecards and dispatch crews.",
    contractorFocus: "Construction and trade businesses; official examples include electrical, heating, restoration and home-improvement firms.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    sources: [
      { label: "Product page", url: "https://www.workyard.com/" },
      { label: "Feature source", url: "https://www.workyard.com/time-clock-app-with-gps" },
    ],
  },

  // ── SCHEDULING AND PLANNING ───────────────────────────────────────────────

  {
    name: "ALICE (ALICE Optimize)",
    category: "Scheduling and planning",
    description: "Construction scheduling optimization product working with Microsoft Project, Primavera P6 or Primavera Cloud schedules.",
    usedFor: "Test sequencing, resource, acceleration and recovery scenarios and compare time, cost and risk outcomes.",
    contractorFocus: "General contractors and owners on complex capital, industrial/energy, data-center, civil, infrastructure and institutional projects.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI-driven what-if exploration simulating many scheduling paths and scenarios.",
    notes: "ALICE FieldPlan is a separate beta/coming-soon offering.",
    sources: [
      { label: "Product page", url: "https://www.alicetechnologies.com/alice-optimize" },
      { label: "Feature source", url: "https://www.alicetechnologies.com/construction-project-scheduling-software" },
    ],
  },
  {
    name: "Asta Powerproject",
    category: "Scheduling and planning",
    description: "Construction planning software combining Gantt schedules, resources, costs, scenarios and 4D BIM integration.",
    usedFor: "Plan critical paths, assign resources, compare scenarios, monitor costs and prepare progress and risk reports.",
    contractorFocus: "General contractors and planning teams delivering building and infrastructure work, from small contractors to large enterprises.",
    aiStatus: "vendor",
    aiFeatures: "AstaGPT is a separate AI-powered browser help tool answering Powerproject questions using Eleco help documentation, not AI in scheduling functions.",
    notes: "Downloadable application is Windows PC software; SaaS is described as accessible on Mac. SiteProgress is a separately licensed companion.",
    sources: [
      { label: "Product page", url: "https://elecosoft.com/products/powerproject/" },
      { label: "Feature source", url: "https://eleco.com/products/asta/asta-powerproject/features/" },
      { label: "AI / integration source", url: "https://eleco.com/products/asta/astagpt/" },
    ],
  },
  {
    name: "Oracle Primavera P6 Enterprise Project Portfolio Management (P6 EPPM)",
    category: "Scheduling and planning",
    description: "Enterprise project and portfolio management product for multiuser CPM scheduling and resource control.",
    usedFor: "Build and update schedules, coordinate activity status, plan resources, report progress and manage portfolios.",
    contractorFocus: "Commercial GCs and infrastructure/industrial delivery teams, particularly complex enterprise programs; scales from small projects to large programs.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI. Primavera Cloud is a separate product and its assistant is not verified for P6 EPPM.",
    notes: "Oracle documentation lists P6 EPPM Version 26; product is distinct from Primavera Cloud.",
    sources: [
      { label: "Product page", url: "https://www.oracle.com/construction-engineering/primavera-p6/" },
      { label: "Feature source", url: "https://www.oracle.com/construction-engineering/primavera-p6/datasheet/" },
    ],
  },
  {
    name: "Touchplan",
    category: "Scheduling and planning",
    description: "Cloud collaborative planning platform connecting master schedules to pull plans, look-aheads, weekly commitments and field updates.",
    usedFor: "Sequence pull plans, track constraints and handoffs, update tasks and review Percent Plan Complete and milestone metrics.",
    contractorFocus: "General contractors on complex commercial projects and specialty/trade contractors, including MEP and electrical/mechanical firms.",
    aiStatus: "vendor",
    aiFeatures: "BoardScan converts photos of physical planning boards into structured digital tickets; flagged items can be reviewed before import.",
    sources: [
      { label: "Product page", url: "https://touchplan.io/" },
      { label: "Feature source", url: "https://touchplan.io/digitize-lean-construction-planning/" },
      { label: "AI / integration source", url: "https://touchplan.io/boardscan/" },
      { label: "AI / integration source", url: "https://touchplan.io/media/touchplan-gains-visual-intelligence-with-boardscan/" },
    ],
  },

  // ── SAFETY AND INSPECTIONS ────────────────────────────────────────────────

  {
    name: "HammerTech",
    category: "Safety and inspections",
    description: "Construction safety platform linking worker onboarding, subcontractor compliance, field safety and project reporting.",
    usedFor: "Manage orientations, certifications, hazard analyses, permits, inspections, incidents, site access and safety reporting.",
    contractorFocus: "General contractors, EPC firms and specialist subcontractors on commercial, infrastructure, energy and industrial projects.",
    aiStatus: "vendor",
    aiFeatures: "HammerTech Intelligence reportedly transcribes pre-task discussions, recognizes observations from photos, extracts safety data sheets and summarizes site diaries.",
    sources: [
      { label: "Product page", url: "https://www.hammertech.com/en-us/product/platform" },
      { label: "Feature source", url: "https://www.hammertech.com/en-us/hammertech-intelligence" },
    ],
  },
  {
    name: "Mitti (by SafetyCulture; formerly SafetyCulture)",
    category: "Safety and inspections",
    description: "Frontline operations platform for site inspections, actions, issues, documents and assets, including offline mobile inspections.",
    usedFor: "Run safety and quality inspections, document issues with photos and assign actions through resolution.",
    contractorFocus: "Construction companies, site managers and frontline crews; specific specialty or size segments not verified.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes checklist generation from text, photos or documents and AI summaries of inspection reports.",
    notes: "Vendor announced rebrand to Mitti on 11 August 2026; Sign On is labeled a paid add-on.",
    sources: [
      { label: "Product page", url: "https://safetyculture.com/construction/" },
      { label: "Feature source", url: "https://safetyculture.com/ai-tools" },
    ],
  },
  {
    name: "Safesite",
    category: "Safety and inspections",
    description: "Web and mobile safety-management system for inspections, meetings, hazards, incidents and safety analytics.",
    usedFor: "Complete audits, record toolbox talks, report incidents and hazards, assign corrections and review safety trends.",
    contractorFocus: "Construction general and trade contractors; customer examples include a homebuilder and an electrical company.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    notes: "OSHA 300-log export is a Premium feature available to U.S. customers only.",
    sources: [
      { label: "Product page", url: "https://safesitehq.com/" },
      { label: "Feature source", url: "https://safesitehq.com/features/inspections-audits-checklists/" },
      { label: "Feature source", url: "https://safesitehq.com/features/safety-meetings-toolbox-talks/" },
      { label: "Feature source", url: "https://safesitehq.com/features/real-time-incident-reports/" },
    ],
  },
  {
    name: "SiteDocs",
    category: "Safety and inspections",
    description: "Safety-management system for digital forms, document access and jobsite compliance dashboards.",
    usedFor: "Complete inspections, toolbox talks, hazard assessments and incident forms; track signatures, certifications and corrective actions.",
    contractorFocus: "Construction general contractors and construction subcontractors/trade contractors from startups to multinational firms.",
    aiStatus: "vendor",
    aiFeatures: "Analytics Narratives uses AI to summarize data shown in a dashboard widget.",
    sources: [
      { label: "Product page", url: "https://www.sitedocs.com/" },
      { label: "Feature source", url: "https://www.sitedocs.com/contractor-management/" },
      { label: "AI / integration source", url: "https://sitedocs.zendesk.com/hc/en-us/articles/25765154673293-How-SiteDocs-Analytics-Uses-Artificial-Intelligence" },
    ],
  },

  // ── FIELD DOCUMENTATION AND SITE CAPTURE ──────────────────────────────────

  {
    name: "AI Clearing CORE",
    category: "Field documentation and site capture",
    description: "Web platform combining drone and field data, designs, BIM and schedules for infrastructure and renewable-energy projects.",
    usedFor: "Quantify work completed, monitor schedule variance and earthworks, flag deviations, manage quality issues and report quantities.",
    contractorFocus: "General contractors and large infrastructure/renewable-energy firms working in solar, transmission, civil works, highways, pipelines and rail.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes an AI engine analyzing drone imagery against CAD/BIM, AI progress tracking, deviation detection and Clara assistant.",
    sources: [
      { label: "Product page", url: "https://www.aiclearing.com/platform-core" },
      { label: "Feature source", url: "https://www.aiclearing.com/platform/quality-and-issues-management" },
    ],
  },
  {
    name: "Buildots",
    category: "Field documentation and site capture",
    description: "Construction intelligence platform turning camera, drone and laser-scan captures into progress data compared with BIM and schedules.",
    usedFor: "Track installation progress, compare actual work to plans and schedules, identify deviations and forecast delay risks.",
    contractorFocus: "General contractors and project teams on major commercial projects including data centers, multifamily, healthcare, industrial and education.",
    aiStatus: "vendor",
    aiFeatures: "Vendor says AI compares captures with BIM and schedules to generate progress and installation data and automate delay forecasting.",
    sources: [
      { label: "Product page", url: "https://buildots.com/product/" },
    ],
  },
  {
    name: "CompanyCam",
    category: "Field documentation and site capture",
    description: "Field-work app for project-organized jobsite photos and videos, crew updates and customer sharing.",
    usedFor: "Capture before/during/after documentation, annotate and share photos and produce field reports.",
    contractorFocus: "General construction, roofing, restoration/remodeling, concrete, electrical, HVAC, plumbing, landscaping and solar firms of varied sizes.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes photo and voice-based reports, checklists, captions, project recaps, photo summaries and in-app translation.",
    notes: "Vendor describes a 14-day AI trial or unlimited AI on CompanyCam Scale; verify current availability.",
    sources: [
      { label: "Product page", url: "https://companycam.com/" },
      { label: "Feature source", url: "https://companycam.com/ai-features" },
    ],
  },
  {
    name: "CupixWorks",
    category: "Field documentation and site capture",
    description: "360-degree walkthrough-to-3D-map platform for navigable site tours and comparison with past captures and BIM.",
    usedFor: "Review conditions remotely, compare captures, measure dimensions, check BIM-to-reality conditions and attach issues and reports.",
    contractorFocus: "General contractors, builders, subcontractors, owners and project/site teams; separate SiteInsights targets larger projects.",
    aiStatus: "vendor",
    aiFeatures: "Cupix describes vision AI reconstructing capture paths and mapping 360-degree frames into 3D maps; separate SiteInsights adds computer-vision progress tracking.",
    notes: "SiteInsights is an add-on; vendor uses both Cupix and CupixWorks names.",
    sources: [
      { label: "Product page", url: "https://www.cupix.com/ebooks-and-guides/take-control-of-your-construction-data" },
      { label: "Feature source", url: "https://www.cupix.com/product/360-video-to-3d-map" },
      { label: "AI / integration source", url: "https://www.cupix.com/product/construction-progress-tracking" },
    ],
  },
  {
    name: "DroneDeploy",
    category: "Field documentation and site capture",
    description: "Reality-capture platform combining aerial drone maps and 3D models with ground-level 360-degree walks and scans.",
    usedFor: "Map site conditions, measure earthworks and stockpiles, document utility as-builts and review interior installation and progress.",
    contractorFocus: "General contractors, subcontractors including MEP, and civil/heavy-civil contractors.",
    aiStatus: "vendor",
    aiFeatures: "Safety AI is a distinct premium add-on to DroneDeploy Ground that analyzes 360-degree images and ranks visible OSHA-aligned safety risks.",
    notes: "Safety AI is a separate premium add-on rather than an assumption about every core feature.",
    sources: [
      { label: "Product page", url: "https://www.dronedeploy.com/solutions/construction" },
      { label: "Feature source", url: "https://www.dronedeploy.com/product/dronedeploy-ground" },
      { label: "AI / integration source", url: "https://www.dronedeploy.com/product/safety-ai" },
      { label: "AI / integration source", url: "https://www.dronedeploy.com/blog/dronedeploy-revolutionizes-safety-risk-detection-in-construction-with-launch-of-safety-ai" },
    ],
  },
  {
    name: "OpenSpace Capture",
    category: "Field documentation and site capture",
    description: "Construction reality-capture product mapping 360-degree camera walks and other site images to plans as a dated visual record.",
    usedFor: "Review site conditions remotely, compare progress by date, support QA/QC and verify concealed work before it is covered.",
    contractorFocus: "General contractors and MEP, electrical, mechanical, drywall, framing and concrete specialty firms.",
    aiStatus: "vendor",
    aiFeatures: "Spatial AI stitches imagery and pins it to floor plans using computer vision, 3D reconstruction and image-based SLAM.",
    notes: "OpenSpace Track progress analysis is a separate add-on.",
    sources: [
      { label: "Product page", url: "https://www.openspace.ai/products/capture/" },
      { label: "Feature source", url: "https://www.openspace.ai/the-tech/" },
    ],
  },
  {
    name: "Raken",
    category: "Field documentation and site capture",
    description: "Web and mobile field-management platform for daily reporting, time, production, documentation and safety.",
    usedFor: "Create daily reports, record hours, monitor labor, materials and equipment, schedule shifts and track progress.",
    contractorFocus: "General contractors, subcontractors and heavy-civil firms including concrete, electrical, excavating, mechanical, painting, plumbing, roofing and steel trades.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI photo tagging, AI photo ID for clock-in selfies and an MCP connection to external AI assistants.",
    sources: [
      { label: "Product page", url: "https://www.rakenapp.com/" },
      { label: "Feature source", url: "https://www.rakenapp.com/features/daily-reports" },
      { label: "AI / integration source", url: "https://www.rakenapp.com/features/ai" },
    ],
  },

  // ── BIM, DESIGN AND MODEL COORDINATION ────────────────────────────────────

  {
    name: "Autodesk Navisworks",
    category: "BIM, design and model coordination",
    description: "Desktop software that federates multidisciplinary design and construction data into a 3D model for review and coordination.",
    usedFor: "Review and report model clashes, coordinate issues, simulate schedules and measure 2D/3D quantities.",
    contractorFocus: "Building-project general contractors and mechanical, electrical and plumbing trade partners doing BIM/VDC coordination.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    notes: "Clash Detective is exclusive to Navisworks Manage; Simulate supports review, simulation and quantification.",
    sources: [
      { label: "Product page", url: "https://www.autodesk.com/products/navisworks/overview" },
      { label: "Feature source", url: "https://www.autodesk.com/products/navisworks/product-details" },
    ],
  },
  {
    name: "Autodesk Revit",
    category: "BIM, design and model coordination",
    description: "BIM application for parametric building models and coordinated drawings, schedules and documentation.",
    usedFor: "Model architectural, structural and MEP systems; produce installation/fabrication documents and support coordination.",
    contractorFocus: "Building-project MEP subcontractors and detailers/fabricators, especially mechanical/HVAC, electrical and plumbing teams.",
    aiStatus: "vendor",
    aiFeatures: "Autodesk describes AI-enabled Generative Design and an AI-guided help Assistant; its newer model/documentation Assistant is a tech preview.",
    notes: "Assistant availability can vary by region/version; Generative Design requires AEC Collection or specified access and is not in Revit LT.",
    sources: [
      { label: "Product page", url: "https://www.autodesk.com/products/revit/overview" },
      { label: "Feature source", url: "https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/What-AI-features-are-available-in-Revit.html" },
    ],
  },
  {
    name: "BIMcollab (BIM coordination and issue management)",
    category: "BIM, design and model coordination",
    description: "Cloud BIM coordination platform centralizing project issues linked to model locations and objects.",
    usedFor: "Create, assign and track model-linked issues, manage due dates and comments and export reports.",
    contractorFocus: "Construction contractors participating in BIM-coordinated building projects; specific trades and size niche not established.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    notes: "Current coordination platform is marketed as BIMcollab; issue management is under the Nexus path.",
    sources: [
      { label: "Product page", url: "https://www.bimcollab.com/en/products/bimcollab-nexus/" },
      { label: "Feature source", url: "https://www.bimcollab.com/en/products/bimcollab-nexus/issue-management/" },
    ],
  },
  {
    name: "Revizto",
    category: "BIM, design and model coordination",
    description: "AECO collaboration platform combining 2D drawings, 3D models, clash detection and issue tracking in a shared workspace.",
    usedFor: "Federate models, review clashes, annotate and assign issues, and track coordination or field resolution.",
    contractorFocus: "General contractors on complex multidisciplinary projects and MEP subcontractors including electrical firms.",
    aiStatus: "unverified",
    aiFeatures: "Not verified; this does not mean the product has no AI.",
    sources: [
      { label: "Product page", url: "https://revizto.com/product/collaboration-hub" },
      { label: "Feature source", url: "https://revizto.com/product/integrated-issue-management" },
    ],
  },
  {
    name: "SketchUp",
    category: "BIM, design and model coordination",
    description: "3D modeling and visualization software offered in web, iPad and desktop plans; professional plans add 2D documentation.",
    usedFor: "Model site and building conditions, compare options, present models or walkthroughs and prepare plans and details.",
    contractorFocus: "Residential design-build general contractors and construction contractors/engineers using modeling, coordination and documentation.",
    aiStatus: "vendor",
    aiFeatures: "Generate Object creates geometry from text or images, and AI Render generates images from a model viewport and prompt; vendor also describes an AI help assistant.",
    notes: "AI features use Trimble Credits; check plan access and credit terms.",
    sources: [
      { label: "Product page", url: "https://www.sketchup.com/" },
      { label: "Feature source", url: "https://www.sketchup.com/en/industries/construction" },
      { label: "Feature source", url: "https://www.sketchup.com/en/ai-in-sketchup" },
      { label: "Feature source", url: "https://help.sketchup.com/en/ai-features" },
    ],
  },
  {
    name: "Solibri",
    category: "BIM, design and model coordination",
    description: "BIM quality-assurance platform for reviewing, coordinating and validating building models.",
    usedFor: "Federate models, check clashes and required model information, manage issues and validate information for construction and handover.",
    contractorFocus: "Contractors and subcontractors on BIM-coordinated commercial, healthcare, industrial, residential, airport and modular projects.",
    aiStatus: "vendor",
    aiFeatures: "A beta AI assistant helps configure rules, query model components and check results, navigate issues and work in the current session.",
    notes: "AI assistant is exclusive to the Premium tier and in beta.",
    sources: [
      { label: "Product page", url: "https://www.solibri.com/" },
      { label: "Feature source", url: "https://www.solibri.com/products/advanced" },
      { label: "AI / integration source", url: "https://www.solibri.com/solutions/bim-quality-assurance/solibri-ai-powered-assistant" },
    ],
  },
  {
    name: "Trimble Connect",
    category: "BIM, design and model coordination",
    description: "Cloud construction collaboration and common-data platform for sharing models, drawings and documents.",
    usedFor: "Share updated plans, annotate and combine models, review coordination and track changes and tasks.",
    contractorFocus: "Construction and engineering project teams, with examples including structural-steel contractors and large complex project teams.",
    aiStatus: "vendor",
    aiFeatures: "Trimble describes conversational Trimble Assist and available AI Punch Walk for voice-driven inspection transcription, location tagging and drawing pins.",
    notes: "Trimble Assist rolls out in phases through 2027; not all announced AI capabilities are generally available.",
    sources: [
      { label: "Product page", url: "https://www.trimble.com/en/products/trimble-connect" },
      { label: "Feature source", url: "https://www.trimble.com/en/products/trimble-connect/real-time-collaboration-software" },
      { label: "AI / integration source", url: "https://news.trimble.com/2026-11-09-Trimble-Launches-New-Trimble-Connect-Platform-AI-Capabilities-Aimed-at-De-Risking-Construction" },
    ],
  },

  // ── DOCUMENT, DESIGN AND SCHEDULE RISK ────────────────────────────────────

  {
    name: "Buildcheck",
    category: "Document, design and schedule risk",
    description: "Drawing-review platform that analyzes 2D plans and specifications for potential problems, with expert review of findings.",
    usedFor: "Check missing details, broken references, discipline clashes, omissions and drawing/spec conflicts; compare revisions and back-check resolutions.",
    contractorFocus: "General contractors reviewing multidisciplinary building projects; also owners and developers.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes AI design reviews and computer vision interpreting drawing components, geometry and dimensions; in-house experts verify outputs.",
    notes: "Code review uses adopted local codes; vendor says U.S. customer data is stored in the U.S., Canadian customer data in Canada, and other international data in the U.S.",
    sources: [
      { label: "Product page", url: "https://buildcheck.ai/" },
      { label: "Feature source", url: "https://buildcheck.ai/product-landing-page" },
    ],
  },
  {
    name: "Document Crunch",
    category: "Document, design and schedule risk",
    description: "Construction-focused contract and document risk-intelligence platform that links findings to their source documents.",
    usedFor: "Review contracts, specifications, addenda, insurance and flow-down terms; identify obligations, conflicts and risks; standardize reviews.",
    contractorFocus: "General and specialty contractors, including steel/precast, electrical and civil excavation firms with complex project documents.",
    aiStatus: "vendor",
    aiFeatures: "CrunchAI reads and connects information across construction documents and checks and cites findings against source material.",
    sources: [
      { label: "Product page", url: "https://www.documentcrunch.com/" },
      { label: "Feature source", url: "https://www.documentcrunch.com/crunch-ai" },
    ],
  },
  {
    name: "nPlan Insights Pro",
    category: "Document, design and schedule risk",
    description: "Project-controls platform using historical construction schedules to forecast dates and identify schedule risks.",
    usedFor: "Forecast milestones, inspect driving paths and activities, check schedule integrity and test mitigation scenarios.",
    contractorFocus: "General contractors delivering major capital and heavy-infrastructure projects with complex schedules.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes machine learning trained on historical schedules, deep-learning activity prediction, graph neural networks and the Barry assistant.",
    notes: "Positioned for major/heavy infrastructure rather than small trade or residential work.",
    sources: [
      { label: "Product page", url: "https://www.nplan.io/products/insights-pro" },
    ],
  },

  // ── CALL INTAKE ───────────────────────────────────────────────────────────

  {
    name: "OnCrew",
    category: "Call intake",
    description: "Standalone 24/7 AI receptionist for contractor business lines; it captures and routes information rather than dispatching or estimating.",
    usedFor: "Answer overflow or after-hours calls, gather service or project details, flag urgency and send summaries and records to the team.",
    contractorFocus: "HVAC, plumbing, electrical and roofing service shops; builders, general contractors, remodelers and subcontractors.",
    aiStatus: "vendor",
    aiFeatures: "Vendor describes real-time voice and language-model conversation for trade-specific intake and urgency triage.",
    notes: "Does not prepare bids or takeoffs, price jobs, send crews or own the schedule; team handles follow-up and dispatch.",
    sources: [
      { label: "Product page", url: "https://oncrew.ai/ai-answering-service" },
      { label: "Feature source", url: "https://oncrew.ai/answering/construction-companies" },
    ],
  },
];

/** Selective discovery directories — not complete lists or independent verification. */
export const DISCOVERY_DIRECTORIES: DiscoveryDirectory[] = [
  {
    name: "There’s an AI for That — Construction",
    url: "https://theresanaiforthat.com/task/construction/",
    scope: "Construction-specific AI tools with related safety, bids and management subcategories. AI only; some featured placements are paid and results can include generic or stale listings.",
  },
  {
    name: "There’s an AI for That — Construction Cost Estimation",
    url: "https://theresanaiforthat.com/task/construction-cost-estimation/",
    scope: "Targeted directory of AI-assisted construction estimating. It is narrowly AI-focused, includes sponsored placements and may list individual GPTs rather than full software products.",
  },
  {
    name: "There’s an AI for That — Civil Construction",
    url: "https://theresanaiforthat.com/s/civil+construction/",
    scope: "Broader AI search spanning construction, planning and design, useful for finding newer products. Search matches can include unrelated or duplicate entries and require vendor verification.",
  },
  {
    name: "Capterra — Construction Management Software",
    url: "https://www.capterra.com/construction-management-software/",
    scope: "Large multi-product directory with feature filters and user reviews, covering AI and non-AI tools. Vendors can pay for sponsored profiles; directory coverage and reviews are not independent product verification.",
  },
  {
    name: "Capterra — Residential Construction Estimating Software",
    url: "https://www.capterra.com/residential-construction-estimating-software/",
    scope: "Residential estimating, remodeling and related products with reviews and feature filters. Featured-partner ordering is bid-based, and category listings may include general-purpose tools.",
  },
  {
    name: "Software Advice — Field Service Management",
    url: "https://www.softwareadvice.com/field-service/",
    scope: "Directory of dispatch, work-order and mobile-service products, including HVAC, plumbing and electrical. Includes nonconstruction businesses and may involve referral relationships.",
  },
  {
    name: "ConTech Index — Construction Software Directory",
    url: "https://contechindex.com/software",
    scope: "Construction-focused categorized index covering BIM, safety, equipment, estimating, service and financials. Useful for workflow-oriented discovery but still selective and subject to product changes.",
  },
];

/** One-line scope for each category — written for the category grid. */
export const CATEGORY_NOTES: Record<string, string> = {
  "Construction management":
    "Drawings, RFIs, submittals, logs, field issues and cost on one project record.",
  "Residential construction management":
    "Schedules, selections, budgets and homeowner communication for builders and remodelers.",
  "Field-service management":
    "Intake, dispatch, work orders, estimates, invoicing and payments for service trades.",
  "Estimating and takeoff":
    "Measure plans, count symbols, price labor and materials, produce bids.",
  "Bid opportunities and preconstruction":
    "Find projects, issue bid invitations, track coverage and addenda.",
  "Roofing and exterior trades":
    "Roofing CRMs, aerial measurement, proposals and exterior job tracking.",
  "Landscape management":
    "Budget-based estimating, crew scheduling and job costing for landscape firms.",
  "Heavy-civil estimating and operations":
    "Earthwork takeoff, DOT bidding, crew and equipment allocation.",
  "Accounting and construction ERP":
    "Job-cost accounting, payroll, WIP, commitments and financial reporting.",
  "Workforce and time tracking":
    "GPS time capture, workforce planning and labor costing by job.",
  "Scheduling and planning":
    "CPM schedules, pull planning, look-aheads and scenario testing.",
  "Safety and inspections":
    "Inspections, toolbox talks, incidents and subcontractor compliance.",
  "Field documentation and site capture":
    "Jobsite photos, 360° walks, drone maps and progress against plan.",
  "BIM, design and model coordination":
    "Model federation, clash detection and model-linked issues.",
  "Document, design and schedule risk":
    "Contract, drawing and schedule review that flags risk before it costs money.",
  "Call intake":
    "Answering, qualifying and routing inbound calls.",
};

/** Stable slug for a category — used in #c-<slug> deep links. */
export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
