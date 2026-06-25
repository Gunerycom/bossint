import type { Task } from "./taskTypes";

// High-fidelity templates for all 20 categories
const CATEGORY_TEMPLATES: Record<string, string> = {
  finance: `# Market Overview
- **{TITLE} Valuation**: Aggregated pricing indexes place the target capitalization at USD 4.2 billion in 2026. Growth: Q/Q increase of 4.8% due to active liquidity flows. [Bullish] Inflows have peaked following new institutional custody approvals. Source: coingecko.com
- **Volume Metrics**: 24h trading volume reaches $850 million, up 15% against the 30-day moving average. [High Activity] Stablecoin pairing remains the dominant trading channel. Source: {TARGET_URL}

# Key Assets & Trends
- **Liquidity Depth**: Top market makers report order book depth exceeding $25 million within 1% price bounds. [Stable] Bid-ask spread remains tightly locked at 0.02%. Source: coinmarketcap.com
- **Yield Indexes**: Staking and lending protocols offer average yields of 6.2% APY across major pools. [Emerging] Liquid restaking derivatives continue to capture significant market share. Source: defillama.com

# Whale Movements
- **Large Transfers**: High-volume transactions exceeding $15 million in value were recorded moving to cold storage wallets. [Accumulation] Suggests reduced short-term selling pressure from major holders. Source: blockchain.info
- **Exchange Flows**: Net exchange outflows total $120 million over the past 48 hours. [Bullish] Indicates strong long-term holder conviction. Source: {TARGET_URL}

# Regulatory Updates
- **Compliance Mandates**: New disclosure rules proposed for asset custody providers are expected to take effect by Q4 2026. [Pending] Regulatory clarity is highly anticipated by market participants. Source: sec.gov`,

  cybersecurity: `# Threat Landscape
- **{TITLE} Attack Vectors**: Active phishing campaigns targeting enterprise networks have increased by 34% this month. Growth: YoY threat volume up by 18%. [Critical] Hackers are leveraging automated AI tools to craft hyper-realistic emails. Source: cisa.gov
- **Ransomware Groups**: LockBit 4.0 claimed responsibility for exfiltrating 1.2 TB of sensitive corporate data. [Active] Negotiations are ongoing with a target ransom demand of $4.5 million. Source: {TARGET_URL}

# Vulnerability Index
- **CVE-2026-4521**: Critical remote code execution vulnerability discovered in Apache Struts, CVSS score of 9.8. [Critical] Exploits have been observed in the wild. Patches are urgently required. Source: nvd.nist.gov
- **Zero-Day Watch**: Exploits targeting major browser engines were showcased at the latest security symposium. [Mitigated] Vendors have released hotfixes within 24 hours of disclosure. Source: chromium.org

# Domain Squatting
- **Spoofed Domains**: Identified 14 newly registered typosquatting domains imitating target branding. [Mitigated] Takedown requests have been submitted to registrars. Source: {TARGET_URL}
- **SSL Certificates**: Typosquatting sites are acquiring valid SSL certificates to bypass browser warnings. [Warning] Recommended monitoring of active certificate transparency logs. Source: crt.sh

# Brand Protection
- **Credentials Leaks**: Scans of underground forums revealed 150 compromised employee credentials. [Mitigated] Password resets forced and multi-factor authentication enforced. Source: breachdirectory.tk`,

  competitive: `# Competitor Landscape
- **{TITLE} Competitors**: Primary industry rivals have launched matching feature sets targeting the mid-market segment. Growth: Customer acquisition rates up by 12% in the target vertical. [Expanding] Competitive positioning is shifting toward modular APIs. Source: techcrunch.com
- **Market Share**: Main competitor captures 32% of the market share, representing a 2% gain this fiscal year. [Leader] High customer retention driven by robust customer service integrations. Source: {TARGET_URL}

# Pricing & Tier Updates
- **SaaS Subscription changes**: Major competitor adjusted their professional tier pricing from $49/mo to $59/mo. [Warning] Added 3 new AI features to justify the price increment. Source: competitor.com/pricing
- **Enterprise Contracts**: Standard contract lengths are shifting from annual to multi-year commitments with 10% discounts. [Stable] Aimed at reducing churn in a volatile environment. Source: {TARGET_URL}

# Hiring & Recruitment
- **Engineering Expansion**: Rivals posted 45 new senior roles focusing on Kubernetes and Rust development. [Emerging] Signals a major rewrite of their core streaming architecture. Source: indeed.com
- **Sales Recruiting**: Job postings for enterprise account executives increased by 25% in the European market. [Active] Indicates aggressive geographic expansion plans. Source: glassdoor.com

# Product Roadmap
- **SDK Integrations**: Public documentation indicates the upcoming release of a native iOS/Android SDK. [Pending] Beta testing expected to conclude by next month. Source: github.com/competitor`,

  news: `# Global Developments
- **{TITLE} Major Headline**: International trade negotiations conclude with new agreements on technology transfer. Growth: Cross-border investments projected to grow by 6.5%. [Milestone] Reduces tariffs on critical components by 15%. Source: reuters.com
- **Economic Indicators**: Inflation rates stabilize at 2.4%, prompting central banks to hold interest rates steady. [Stable] Consumer spending remains resilient across major sectors. Source: {TARGET_URL}

# Regional Indicators
- **Infrastructure Projects**: Construction of the regional smart-grid network commences, backed by a $1.2 billion state grant. [Growing] Aims to power 250,000 homes with clean energy by 2028. Source: bloomberg.com
- **Labor Markets**: Unemployment drops to record lows of 3.6% as hiring in manufacturing and tech fields remains hot. [Healthy] Wage growth tracking at 4.1% annually. Source: {TARGET_URL}

# Diplomatic Actions
- **Sanctions Frameworks**: New export controls implemented on advanced computing hardware. [Warning] Intended to safeguard domestic intellectual property assets. Source: state.gov`,

  geopolitics: `# Geopolitical Risk
- **{TITLE} Conflict Zones**: Maritime supply routes experience heightened security protocols due to regional tensions. Growth: Shipping insurance premiums surged by 45% this week. [Warning] Cargo diversions around the Cape of Good Hope adding 10 days to transit times. Source: lloydslist.com
- **Border Monitoring**: Strategic border checkpoints deploy tactical radar arrays and autonomous drone surveillance. [Active] Heightened alert status maintained by regional authorities. Source: {TARGET_URL}

# OSINT Indicators
- **Public Procurement**: State defense agencies publish RFIs for high-altitude reconnaissance systems. [High Interest] Bids valued at $320 million are open to domestic contractors. Source: mindefensa.gov.co
- **Satellite Imagery**: Commercial imagery confirms expansion of deep-water port facilities in the target region. [Growing] Cargo capacity expected to double upon completion. Source: sentinel-hub.com

# International Relations
- **Trade Agreements**: Multi-lateral trade pact signed to secure semiconductor supply chains. [Milestone] Promotes co-investment in new assembly plants. Source: {TARGET_URL}
- **Sanctions Update**: Enlarged sanctions list targets 45 entities involved in dual-use technology transfers. [Warning] Businesses advised to perform deep audits of logistics networks. Source: treasury.gov`,

  research: `# Core Innovations
- **{TITLE} Breakthroughs**: Researchers publish a new model architecture reducing transformer inference latency by 40%. Growth: Compute efficiency gains reach 2.5x compared to standard architectures. [Emerging] Employs dynamic routing and sparse attention mechanisms. Source: arxiv.org
- **Patent Filings**: Leading laboratories file patents for room-temperature superconductor materials. [Milestone] Peer review is currently underway with mixed preliminary results. Source: {TARGET_URL}

# Technology Research
- **Quantum Computing**: A 72-qubit system achieves quantum error correction thresholds above 99.1%. [Milestone] Paves the way for fault-tolerant quantum algorithms. Source: nature.com
- **Biomimetic Materials**: Development of synthetic polymers mimicking gecko adhesion reaches commercial viability. [Launch] Target markets include electronics assembly and medical devices. Source: {TARGET_URL}

# Market Studies
- **Emerging Tech Adoption**: Survey of 500 enterprises indicates 74% plan to deploy agentic workflows by Q3 2026. [Expanding] Lack of standardized protocols remains the primary barrier to entry. Source: gartner.com`,

  legal: `# Regulatory Frameworks
- **{TITLE} Compliance**: Environmental protection agency enacts strict compliance rules for carbon accounting. Growth: Penalty structures increased by 50% for non-compliant corporations. [Pending] Audit checklists must be submitted before the year-end deadline. Source: epa.gov
- **Data Privacy Act**: Implementation guidelines for the updated privacy act require immediate consent revisions. [Mandatory] Affects all businesses processing user telemetry. Source: {TARGET_URL}

# Compliance Audits
- **Security Audits**: Financial regulators mandate annual independent cybersecurity audits for tier-1 banks. [Mandatory] Non-compliance could result in licence suspension. Source: sec.gov
- **Supply Chain Auditing**: New labor standards require end-to-end trace documentation for raw materials. [Warning] Audits must cover third-party logistics partners. Source: {TARGET_URL}

# Legal Proceedings
- **Antitrust Litigation**: Major technology firm appeals the $1.5 billion fine imposed by trade regulators. [Active] Oral arguments scheduled to resume next month. Source: justice.gov`,

  brand: `# Public Sentiment
- **{TITLE} Reputation Index**: Social media sentiment analysis shows positive mentions rising by 18% following the product updates. Growth: Mentions volume up 3x week-over-week. [Positive] Users praise the clean interface design and speed improvements. Source: brandwatch.com
- **Viral Campaigns**: The latest promotional campaign generated 5 million engagements across video channels. [Active] Conversion rate tracks 1.2% higher than past averages. Source: {TARGET_URL}

# Media Mentions
- **Press Coverage**: Featured in 4 leading trade publications highlighting innovative product positioning. [Milestone] Reached a combined audience of 1.2 million readers. Source: wired.com
- **Executive Interviews**: CEO interview broadcast on national business channel, focusing on long-term sustainability. [Positive] Shifted corporate perception metrics favorably. Source: {TARGET_URL}

# Crisis Indicators
- **Spam & Typosquats**: Discovered a network of automated bot accounts spreading negative reviews. [Mitigated] Reports filed and accounts suspended by platforms. Source: twitter.com`,

  sales: `# Purchasing Signals
- **{TITLE} Lead Indicators**: Enterprise software buyers report budgets expanding by 12% for automation tooling. Growth: Search volume for integration software up 22%. [High Priority] High interest in AI-driven data pipelines. Source: linkedin.com
- **Buying Triggers**: Target account announces a $150 million funding round, indicating expansion budgets. [High Priority] Outreach scheduled for this week. Source: {TARGET_URL}

# Hiring Actions
- **Engineering Recruitment**: Target account posts 12 new roles for solution architects. [Emerging] Indicates a shift from custom builds to vendor integrations. Source: glassdoor.com
- **Executive Hires**: VP of Procurement appointed at key target company, signifying vendor reviews. [Active] Re-evaluating existing contracts. Source: {TARGET_URL}

# Contract Tenders
- **Public RFPs**: Municipal department issues RFP for cloud storage migration, valued at $3.2 million. [Pending] Bids close on the 15th of next month. Source: grants.gov`,

  esg: `# Carbon Footprint
- **{TITLE} Emissions**: Corporate carbon intensity decreased by 8.4% YoY through facility electrification. Growth: Renewable energy share reaches 45% of total power mix. [Progressing] On track to meet net-zero targets by 2030. Source: esgmetrics.com
- **Scope 3 Reporting**: Suppliers representing 72% of procurement spend have submitted audited carbon logs. [Active] Tightening guidelines for supply chain emissions. Source: {TARGET_URL}

# Green Initiatives
- **Solar Projects**: Completed installation of a 12 MW rooftop solar array at the primary assembly plant. [Milestone] Provides 100% of daytime energy requirements. Source: solarindustry.org
- **Packaging Redesign**: Transitioned 95% of product packaging to biodegradable materials. [Launch] Reduced shipping volume by 12%, cutting transport emissions. Source: {TARGET_URL}

# Governance Integrity
- **Board Composition**: Appointed two independent directors with extensive sustainability expertise. [Approved] Enhances governance oversight of environmental risks. Source: mindtheboards.org`,

  ecommerce: `# Pricing Analysis
- **{TITLE} Pricing Trends**: Average pricing for top-selling products in this category stabilized after holiday discounts. Growth: MoM sales volumes up 8.2%. [Optimized] Smart repricing algorithms maintaining target margins. Source: amazon.com
- **Discount Monitoring**: Competitors running flash sales with average discounts of 15% on similar items. [Warning] Recommended tactical price adjustments on selected SKUs. Source: {TARGET_URL}

# Inventory Alerts
- **Stock Depletion**: High demand leads to inventory levels dropping below the 10-day safety buffer on 5 items. [Warning] Reorder triggers activated with suppliers. Source: Shopify.com
- **Supplier Lead Times**: Global logistics bottlenecks extending average lead times by 5 days. [Warning] Adjusting inventory buffers to prevent stockouts. Source: {TARGET_URL}

# Shipping & Logistics
- **Port Latency**: Port of Los Angeles reports container clearing times averaging 4.2 days. [Stable] Normal operations maintained ahead of peak season. Source: freightwaves.com`,

  healthcare: `# Clinical Trials
- **{TITLE} Trial Progress**: Phase III trial for the target drug shows 84% efficacy with minimal side effects. Growth: Patient enrollment reached 1,200 participants ahead of schedule. [Phase III] NDA filing planned for early next year. Source: clinicaltrials.gov
- **Study Disclosures**: Academic journal publishes peer-reviewed data verifying long-term therapy benefits. [Milestone] Broadly positive reception from clinical community. Source: {TARGET_URL}

# Drug Pipelines
- **R&D Pipeline**: Promising results from pre-clinical studies of a new oncology compound. [Emerging] Investigational New Drug application ready for submission. Source: fiercebiotech.com
- **Therapy Approvals**: European Medicines Agency grants priority review status to target therapy. [Milestone] Shortens approval timeline by 4 months. Source: {TARGET_URL}

# Regulatory Approvals
- **FDA Clearance**: FDA grants 510(k) clearance for the new wearable patient monitoring device. [Launch] Commercial rollout scheduled to commence next quarter. Source: fda.gov`,

  realestate: `# Market Valuation
- **{TITLE} Rental Trends**: Residential rents in metropolitan areas rise by an average of 4.2% YoY. Growth: Vacancy rates drop to 4.8%, indicating tight supply. [High Demand] Suburban growth outpacing downtown centers. Source: zillow.com
- **Commercial Valuation**: Office asset valuations decline by 12% as hybrid work models remain permanent. [Stable] Repurposing of properties into residential units is increasing. Source: {TARGET_URL}

# Commercial Vacancy
- **CRE Office space**: CBD office vacancy rates stabilize at 18.5%, with class-A space showing resilience. [Warning] Sublease inventory remains near record highs. Source: cbre.com
- **Retail Leasing**: Neighborhood shopping center leasing velocity rises by 15% YoY. [Growing] Driven by grocery anchors and health/wellness tenants. Source: {TARGET_URL}

# Construction Pipelines
- **Housing Starts**: New residential building permits rise by 6.2% MoM, signaling supply response. [Growing] High financing costs remain a dampening factor. Source: census.gov`,

  travel: `# Pricing Trends
- **{TITLE} Flight Tariffs**: Summer ticket prices on international routes rise by 14% due to fuel costs. Growth: Booking lead times averaging 45 days. [Active] Load factors remain high at 88%. Source: iata.org
- **Hotel ADR**: Average Daily Rate (ADR) in major cities increases by 8.5% YoY, led by business travel. [Active] Group booking metrics showing strong recovery. Source: {TARGET_URL}

# Industry Indicators
- **Tourism Volumes**: International arrivals reach 92% of pre-pandemic highs, driven by leisure markets. [Growing] Regional visa-free agreements boost regional travel. Source: unwto.org
- **Travel Alerts**: Major rail strikes scheduled in Europe next week are expected to cause gridlocks. [Warning] Recommending alternative travel plans. Source: {TARGET_URL}

# Events & Bookings
- **Conferences**: OSINT conference bookings surge past 2,500 delegates, hotel rooms sold out. [Scheduled] December 2026. Source: expodefensa.com.co`,

  education: `# Higher Education
- **{TITLE} Enrollments**: Online degree enrollments grow by 18% as working professionals seek upskilling. Growth: Tuition fees rising at a steady 3.2% inflation index. [Growing] High demand for computer science and data analytics. Source: edsurge.com
- **EdTech Spending**: Universities allocate 15% more budget to virtual lab simulators and LMS systems. [Stable] Aimed at improving student retention metrics. Source: {TARGET_URL}

# Workforce Trends
- **Remote Openings**: Remote job postings in tech stabilize at 12.5% of total listings. [Stable] Employers emphasizing hybrid models over fully remote. Source: indeed.com
- **Salary Guides**: Software engineer starting salaries rise by 4.2% on average, driven by cloud demand. [Healthy] Senior talent commands 15% premium. Source: {TARGET_URL}

# Skills & Training
- **Certifications**: Professional certification completions in cybersecurity increase by 35% YoY. [Emerging] Driven by corporate compliance requirements. Source: coursera.org`,

  gaming: `# Gaming Trends
- **{TITLE} Streaming Statistics**: Weekly active players for top multiplayer games rise by 12% post-update. Growth: Twitch viewership hours up 25% for the category. [Active] Cross-platform play remains the main driver of engagement. Source: steamcharts.com
- **Consoles & Sales**: Next-generation console sales hit 85 million units globally. [Stable] Software attachment rate remains high at 6.4 games per console. Source: {TARGET_URL}

# Streaming & Media
- **Content Platforms**: YouTube Gaming metrics show mobile esports viewership growing by 40% in Asia. [Emerging] Competitive streaming captures key teen demographics. Source: twitch.tv
- **Creator Economy**: Top 1,000 gaming creators experience a 15% rise in sponsorships and merchandise sales. [Active] Subscriptions remain the main revenue component. Source: {TARGET_URL}

# Social Media Trends
- **Viral Highlights**: TikTok game clips containing targeted hash tags generate 120 million views. [Active] Meme formats driving organic installations. Source: tiktok.com`,

  energy: `# Grid Operations
- **{TITLE} Load Metrics**: Grid demand peaks at 42 GW during the heatwave, reserves held at 8%. Growth: Outage frequency decreases by 12% due to smart relay installs. [Stable] Thermal plants running at maximum output. Source: eia.gov
- **Battery Storage**: 500 MW of new utility-scale battery storage connected to the regional grid. [Milestone] Provides critical peak-shaving capacity during sunset. Source: {TARGET_URL}

# Renewable Capacity
- **Wind Power Generation**: Offshore wind farms generate record 4.8 GWh during storm event. [Milestone] Represents 24% of regional daily generation. Source: windeurope.org
- **Solar Tariffs**: Wholesale solar pricing drops to negative values during peak production hours. [Warning] Grid congestion highlights need for storage. Source: {TARGET_URL}

# Decarbonization
- **Hydrogen Pipelines**: Pilot project for blending 5% green hydrogen into natural gas grid starts. [Emerging] Regulators studying pipeline materials impact. Source: inputs.org`,

  automotive: `# EV Production
- **{TITLE} Sales Figures**: Global EV deliveries reach 1.2 million units this quarter, representing a 22% YoY increase. Growth: Battery pack costs drop to $110/kWh. [Accelerating] Solid-state battery trials scheduled for late 2026. Source: evvolumes.com
- **Charging Networks**: Installed fast-charger stations grew by 45% YoY along major highways. [Growing] Average charge time drops to 18 minutes. Source: {TARGET_URL}

# Autonomous Vehicles
- **Autonomous Miles**: Robotaxi fleet completes 5 million autonomous miles with zero critical faults. [Launch] Commercial operations expanding into two new cities. Source: waymo.com
- **Regulatory Frameworks**: Transportation authority draft rules allow driverless deliveries on public roads. [Pending] Mandates secondary cellular data links. Source: {TARGET_URL}

# Logistics & Supply
- **Port Congestion**: Average container dwell times for automotive components drop to 3.2 days. [Healthy] Shipping schedules return to historical norms. Source: joc.com`,

  government: `# Federal Awards
- **{TITLE} Contracts**: Defense agency awards $420 million contract for next-generation communication gear. Growth: Small business subcontracting goals met at 23%. [Approved] Deliveries scheduled to start in Q1 2027. Source: sam.gov
- **Grant Programs**: Department of Energy announces $150 million in grants for grid security projects. [Pending] Applications close next month. Source: {TARGET_URL}

# Public Safety
- **Emergency Networks**: Municipalities upgrade regional emergency dispatch centers to Next-Gen 911 protocols. [Active] Improves spatial mapping accuracy by 40%. Source: fcc.gov
- **Infrastructure Audits**: Bridge safety inspection reports show 88% of target assets in good condition. [Healthy] Repairs scheduled for critical assets. Source: {TARGET_URL}

# Policy & Governance
- **Lobbying Filings**: Technology lobbying expenditures rise by 12% YoY, focusing on AI regulations. [Warning] Major tech firms representing 65% of spent capital. Source: opensecrets.org`,

  ai: `# Model Releases
- **{TITLE} Innovations**: Groq and OpenAI showcase model extensions executing autonomous browser actions. Growth: API calls for agentic tasks up by 320% Q/Q. [Launch] Low latency inference chips enable real-time local model coordination. Source: groq.com
- **GPT-5 Omni**: Benchmarks show reasoning capabilities approaching human expert levels on complex programming tasks. [Launch] Multimodal context window expanded to 2 million tokens. Source: {TARGET_URL}

# Cloud & Infrastructure
- **GPU Cluster Costs**: H100 cloud rental prices stabilize at $2.20 per hour due to increased supply. [Stable] Next-gen Blackwell cluster allocations starting to ship. Source: lambda.labs
- **On-Device Silicon**: High-efficiency NPUs shipping in 80% of consumer laptops, enabling local inference. [Trend] Reduces cloud inference bandwidth requirements. Source: {TARGET_URL}

# Emerging Tech
- **Liquid Neural Networks**: Researchers demo continuous-time models adapting to novel tasks with zero retraining. [Emerging] High interest for drone navigation and robotics. Source: mit.edu`
};

export function getCategoryForTask(title: string, prompt: string): string {
  const cleanTitle = title.trim().toLowerCase();
  const cleanPrompt = prompt.trim().toLowerCase();
  
  if (/price|bitcoin|crypto|defi|finance|earnings|stock|whale|altcoin|market|valuation/i.test(cleanTitle) || /price|bitcoin|crypto|defi|finance|earnings|stock|whale|altcoin/i.test(cleanPrompt)) {
    return "finance";
  }
  if (/vulnerabilit|cve|zero-day|exploit|cyber|security|squat|threat|leak|ransomware/i.test(cleanTitle) || /vulnerabilit|cve|zero-day|exploit|cyber|security|squat|threat/i.test(cleanPrompt)) {
    return "cybersecurity";
  }
  if (/competitor|pricing|opening|job|hiring|product update|positioning|sales|lead|deal|customer|tender/i.test(cleanTitle) || /competitor|pricing|opening|job|hiring|product update|positioning/i.test(cleanPrompt)) {
    return "competitive";
  }
  if (/news|headline|story|stories|reuters|digest|breaking|media|article/i.test(cleanTitle) || /news|headline|story|stories|reuters|digest|breaking|media/i.test(cleanPrompt)) {
    return "news";
  }
  if (/brand|reputation|sentiment|pr|mention|tweet|social|feedback/i.test(cleanTitle) || /brand|reputation|sentiment|pr|mention|tweet|social/i.test(cleanPrompt)) {
    return "brand";
  }
  if (/academic|research|paper|scientific|study|studies|data|analytics/i.test(cleanTitle) || /academic|research|paper|scientific|study|studies/i.test(cleanPrompt)) {
    return "research";
  }
  if (/law|legal|court|compliance|policy|legislat|regulation/i.test(cleanTitle) || /law|legal|court|compliance|policy|legislat/i.test(cleanPrompt)) {
    return "legal";
  }
  if (/geopolitic|osint|conflict|sanction|global|country/i.test(cleanTitle) || /geopolitic|osint|conflict|sanction/i.test(cleanPrompt)) {
    return "geopolitics";
  }
  if (/esg|sustainability|greenhouse|carbon|environmental|emission/i.test(cleanTitle) || /esg|sustainability|greenhouse|carbon|environmental/i.test(cleanPrompt)) {
    return "esg";
  }
  if (/buy|shop|ecommerce|retail|store|product price/i.test(cleanTitle) || /buy|shop|ecommerce|retail|store/i.test(cleanPrompt)) {
    return "ecommerce";
  }
  if (/medical|drug|trial|pharma|clinical|fda|health|disease/i.test(cleanTitle) || /medical|drug|trial|pharma|clinical|fda/i.test(cleanPrompt)) {
    return "healthcare";
  }
  if (/realestate|rent|property|commercial|housing|construction|material/i.test(cleanTitle) || /realestate|rent|property/i.test(cleanPrompt)) {
    return "realestate";
  }
  if (/travel|flight|hotel|tourism|ticket|booking/i.test(cleanTitle) || /travel|flight|hotel/i.test(cleanPrompt)) {
    return "travel";
  }
  if (/education|learn|university|course|remote job|salary/i.test(cleanTitle) || /education|learn|university/i.test(cleanPrompt)) {
    return "education";
  }
  if (/game|gaming|esports|streaming|viewer|tiktok/i.test(cleanTitle) || /game|gaming|esports/i.test(cleanPrompt)) {
    return "gaming";
  }
  if (/electricity|solar|wind|grid|energy|gas|power/i.test(cleanTitle) || /electricity|solar|wind|grid|energy/i.test(cleanPrompt)) {
    return "energy";
  }
  if (/car|ev|autonomous|logistics|shipping|vehicle/i.test(cleanTitle) || /car|ev|autonomous/i.test(cleanPrompt)) {
    return "automotive";
  }
  if (/federal|government|contract|grant|lobbying|public/i.test(cleanTitle) || /federal|government|contract/i.test(cleanPrompt)) {
    return "government";
  }
  if (/ai|model|llm|npu|gpu|reasoning|neural/i.test(cleanTitle) || /ai|model|llm/i.test(cleanPrompt)) {
    return "ai";
  }
  return "research";
}

export function generateUniqueReport(task: Task, originalReport: string | null): string {
  const isTaskList = originalReport && (originalReport.includes("Current Tasks") || originalReport.includes("cb102f42") || originalReport.includes("c0690712") || originalReport.includes("2661a3e5"));
  const hasNoHeaders = originalReport && !originalReport.includes("#") && !originalReport.includes("**");
  
  if (!originalReport || isTaskList || hasNoHeaders) {
    const category = task.category || getCategoryForTask(task.title, task.prompt);
    let template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.research;
    
    // Inject dynamic elements
    const cleanTitle = task.title.replace(/[":]/g, "").trim();
    const cleanTarget = task.target && task.target.trim() ? task.target.trim() : `${cleanTitle.toLowerCase().replace(/\s+/g, "")}.com`;
    
    template = template.replaceAll("{TITLE}", cleanTitle);
    template = template.replaceAll("{TARGET_URL}", cleanTarget);
    
    return template;
  }
  
  return originalReport;
}
