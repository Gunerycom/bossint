"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Mail, ArrowRight, Lock, Eye, EyeOff, Laptop, HelpCircle, 
  Sparkles, Play, Search, Coins, TrendingUp, Globe, Calendar, 
  Anchor, DollarSign, ShieldAlert, Compass, Heart, AlertTriangle,
  Check, Code, Copy, Terminal, CheckCircle2, ChevronRight, Trophy,
  Star, ShoppingBag, Home, Scale
} from "lucide-react";
import Dialog, { DialogButton } from "./Dialog";
import { TEMPLATES, TEMPLATE_CATEGORIES, AgentTemplate } from "../lib/templateData";
import TemplateDeployDialog from "./TemplateDeployDialog";
import { InteractiveDots } from "@/components/ui/interactive-dots-1";

interface TrendingAgent {
  id: string;
  title: string;
  creator: string;
  category: string;
  description: string;
  gradient: string;
  iconName: string;
  coverImage: string;
  prompt: string;
  schedule: string;
  taskType: "track" | "crawl" | "monitor" | "custom";
}

const TRENDING_AGENTS: TrendingAgent[] = [
  {
    id: "finance-cryptocurrency-bitcoin",
    title: "Bitcoin Price Tracker",
    creator: "Bossint Crypton",
    category: "Finance",
    description: "Track BTC/USD price movements, funding rates, and volume spikes.",
    gradient: "from-amber-500 via-orange-600 to-yellow-500",
    iconName: "Coins",
    coverImage: "/bitcoin-price-cover.png",
    prompt: "Analyze Bitcoin market metrics on CoinGecko including current price, 24h volume, and order book depth. Highlight any rapid fluctuations greater than 2% in the last 4 hours.",
    schedule: "every 6 hours",
    taskType: "track"
  },
  {
    id: "finance-cryptocurrency-watchlist",
    title: "Altcoin Watchlist",
    creator: "Bossint Crypton",
    category: "Finance",
    description: "Monitor top 20 altcoin price action, daily gainers, and losers.",
    gradient: "from-cyan-500 via-blue-600 to-indigo-700",
    iconName: "TrendingUp",
    coverImage: "/altcoin-watchlist-cover.png",
    prompt: "Scrape the top 20 cryptocurrencies on CoinMarketCap. Summarize the biggest 24h gainers and losers, and extract any recurring narrative tags associated with them.",
    schedule: "daily",
    taskType: "track"
  },
  {
    id: "competitive-competitor-changes",
    title: "Competitor Watchdog",
    creator: "Bossint Intel",
    category: "Competitive",
    description: "Detect updates on landing pages, product catalogs, and pricing of competitors.",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    iconName: "Eye",
    coverImage: "/competitor-watchdog-cover.png",
    prompt: "Crawl target competitor websites (e.g. landing page, pricing page) and compile a diff report highlighting new copy, CTAs, or design tweaks.",
    schedule: "daily",
    taskType: "crawl"
  },
  {
    id: "news-breaking-headlines",
    title: "Global Headlines Digest",
    creator: "Bossint Media",
    category: "News & Media",
    description: "Consolidate breaking news from Reuters, AP, and Bloomberg feeds.",
    gradient: "from-red-500 via-rose-600 to-pink-700",
    iconName: "Globe",
    coverImage: "/global-headlines-cover.png",
    prompt: "Scrape frontpage headlines from Reuters and AP News. Summarize key developments in international relations, regional events, and economy.",
    schedule: "every 6 hours",
    taskType: "crawl"
  },
  {
    id: "finance-stocks-earnings",
    title: "Earnings Calendar Monitor",
    creator: "Bossint Equity",
    category: "Finance",
    description: "Track tech earnings reports, estimated vs actual EPS, and market reactions.",
    gradient: "from-violet-600 via-indigo-700 to-purple-800",
    iconName: "Calendar",
    coverImage: "/earnings-monitor-cover.png",
    prompt: "Extract the list of major tech earnings reports scheduled for this week from Yahoo Finance. List estimated EPS, revenue targets, and actual reports post-release.",
    schedule: "weekly",
    taskType: "track"
  },
  {
    id: "finance-cryptocurrency-whale",
    title: "Crypto Whale Alerts",
    creator: "Bossint Crypton",
    category: "Finance",
    description: "Detect blockchain transactions >$1M on BTC/ETH/Stablecoins.",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    iconName: "Anchor",
    coverImage: "/crypto-whale-cover.png",
    prompt: "Identify on-chain large volume transactions (whales) exceeding $1M in value for BTC, ETH, and stablecoins. Map out destination exchange addresses.",
    schedule: "daily",
    taskType: "monitor"
  },
  {
    id: "competitive-strategic-ma",
    title: "M&A Deal Tracker",
    creator: "Bossint Corporate",
    category: "Competitive",
    description: "Track venture deals, acquisitions, mergers and tech buyouts.",
    gradient: "from-pink-500 via-purple-600 to-indigo-750",
    iconName: "DollarSign",
    coverImage: "/ma-deal-cover.png",
    prompt: "Monitor deal registries and venture funding newsletters for acquisitions, mergers, or buyouts in our market. Report valuations.",
    schedule: "weekly",
    taskType: "monitor"
  },
  {
    id: "cybersecurity-threat-intel",
    title: "Zero-Day Exploit Watch",
    creator: "Bossint Sec",
    category: "Cybersecurity",
    description: "Scan threat databases and security blogs for active exploits.",
    gradient: "from-fuchsia-600 via-pink-700 to-rose-800",
    iconName: "ShieldAlert",
    coverImage: "/zeroday-exploit-cover.png",
    prompt: "Scan security blogs, CVE registries, and cybersecurity forums for newly disclosed zero-day vulnerabilities, active exploits, and patching advisories.",
    schedule: "every 6 hours",
    taskType: "monitor"
  },
  {
    id: "geopolitics-risk-tracker",
    title: "Geopolitical Risk Radar",
    creator: "Bossint OSINT",
    category: "Geopolitics",
    description: "Monitor state conflicts, global sanctions, and public record updates.",
    gradient: "from-green-600 via-emerald-700 to-teal-800",
    iconName: "Compass",
    coverImage: "/geopolitical-risk-cover.png",
    prompt: "Identify and track geopolitical conflicts, sanctions updates, and state-level declarations. Scan public indices and defense reports.",
    schedule: "daily",
    taskType: "monitor"
  },
  {
    id: "brand-reputation-tracker",
    title: "Brand Sentiment Watch",
    creator: "Bossint PR",
    category: "Brand & PR",
    description: "Track public sentiment and brand mentions across social blogs.",
    gradient: "from-yellow-400 via-amber-500 to-orange-600",
    iconName: "Heart",
    coverImage: "/brand-sentiment-cover.png",
    prompt: "Query news indices for brand and executive mentions. Record the sentiment context (positive/negative/neutral) and domain authority.",
    schedule: "daily",
    taskType: "monitor"
  }
];

interface LandingPageProps {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [selectedAgentToDeploy, setSelectedAgentToDeploy] = useState<TrendingAgent | AgentTemplate | null>(null);
  const [pendingDeployDetails, setPendingDeployDetails] = useState<{ name: string; prompt: string; taskType: any; schedule: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [pricingTab, setPricingTab] = useState<"individual" | "team">("individual");

  // Developer section states
  const [activeCodeTab, setActiveCodeTab] = useState<"curl" | "ts" | "py">("curl");
  const [apiState, setApiState] = useState<"idle" | "loading" | "success">("idle");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeCaseStudyIndex, setActiveCaseStudyIndex] = useState(0);

  const getCaseStudyPrompt = (index: number) => {
    switch (index) {
      case 0: return "Get last night OHL scores and quote highlights";
      case 1: return "Check sightings tracker for target: Keanu Reeves";
      case 2: return "Optimize prices for: boss-headphones-max";
      case 3: return "Scan zipcode: 90210 for deals under median";
      case 4: return "Check EPA regulations updates for chemical tariffs";
      default: return "Run agent group scan";
    }
  };

  const getCaseStudyResponse = (index: number) => {
    switch (index) {
      case 0:
        return {
          status: "success",
          agent_group: "canada-hockey-hub",
          execution_time_ms: 1280,
          data: {
            highlights: [
              {
                game: "London Knights (4) vs Windsor Spitfires (3) - OT",
                key_quote: "\"We kept pushing and got rewarded.\" - Coach Hunter"
              },
              {
                game: "Seattle Thunderbirds (5) vs Portland Winterhawks (2)",
                key_quote: "\"Total team effort tonight.\" - Sawchyn"
              }
            ],
            scraped_sources: ["ohl.ca/news", "whl.ca/games"]
          }
        };
      case 1:
        return {
          status: "success",
          agent_group: "celebrity-intel-tracker",
          execution_time_ms: 1540,
          data: {
            status: "Verified Sighting",
            target: "Keanu Reeves",
            location: "Toronto Pearson Int'l (YYZ)",
            timestamp: "2026-06-22T21:45:00Z",
            signals: [
              { source: "Flight Tracker Agent", match: "Private Charter tail #N109K landed" },
              { source: "Social Media Monitor", match: "\"Just saw Keanu Reeves at baggage claim YYZ!\"" }
            ]
          }
        };
      case 2:
        return {
          status: "success",
          agent_group: "ecommerce-price-optimizer",
          execution_time_ms: 940,
          data: {
            product_id: "boss-headphones-max",
            our_price: 299.00,
            competitor_prices: {
              amazon: 295.00,
              bestbuy: 299.00,
              target: 310.00
            },
            action: "Price Updated via Webhook",
            new_price: 292.00,
            margin_preserved: "14.2%"
          }
        };
      case 3:
        return {
          status: "success",
          agent_group: "real-estate-discount-finder",
          execution_time_ms: 2100,
          data: {
            zipcode: "90210",
            median_neighborhood_price: 3200000,
            deals_found: [
              {
                address: "1245 Rexford Dr, Los Angeles",
                listed_price: 2690000,
                pct_below_median: "15.9%",
                source: "Redfin Crawl Agent"
              }
            ]
          }
        };
      case 4:
        return {
          status: "success",
          agent_group: "regulatory-policy-compliance",
          execution_time_ms: 1820,
          data: {
            agency: "EPA / Federal Register",
            keyword: "chemical tariffs",
            updates_detected: 1,
            change_log: {
              action: "Rule amendment proposed for Subchapter R",
              impact_score: "High (Manufacturing risks flagged)",
              date_effective: "2026-07-01"
            }
          }
        };
      default:
        return { status: "success" };
    }
  };

  const runApiSim = () => {
    setApiState("loading");
    setTimeout(() => {
      setApiState("success");
    }, 1200);
  };

  const copyCodeText = () => {
    let text = "";
    const groupIds = ["canada-hockey", "celebrity-checker", "price-watcher", "realestate-radar", "policy-tracker"];
    const selectedGroupId = groupIds[activeCaseStudyIndex] || "canada-hockey";
    const prompt = getCaseStudyPrompt(activeCaseStudyIndex);
    
    if (activeCodeTab === "curl") {
      text = `curl -X POST "https://api.bossint.ai/v1/agent-groups/\${selectedGroupId}/run" \\\n  -H "Authorization: Bearer boss_live_8a92f08a" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "query": "\${prompt}",\n    "format": "json"\n  }'`;
    } else if (activeCodeTab === "ts") {
      text = `import { BossintClient } from "@bossint/sdk";\n\nconst bossint = new BossintClient({ apiKey: "boss_live_8a92f08a" });\n\nconst result = await bossint.agentGroups.run("\${selectedGroupId}", {\n  query: "\${prompt}",\n  format: "json"\n});\n\nconsole.log(result.data);`;
    } else if (activeCodeTab === "py") {
      text = `from bossint import BossintClient\n\nclient = BossintClient(api_key="boss_live_8a92f08a")\n\nresult = client.agent_groups.run(\n    group_id="\${selectedGroupId}",\n    query="\${prompt}",\n    format="json"\n)\n\nprint(result["data"])`;
    }
    
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const renderCaseStudyIcon = (iconName: string, isActive: boolean) => {
    const colorClass = isActive ? "text-indigo-600" : "text-neutral-500";
    switch (iconName) {
      case "Trophy":
        return <Trophy className={`w-5 h-5 ${colorClass}`} />;
      case "Star":
        return <Star className={`w-5 h-5 ${colorClass}`} />;
      case "ShoppingBag":
        return <ShoppingBag className={`w-5 h-5 ${colorClass}`} />;
      case "Home":
        return <Home className={`w-5 h-5 ${colorClass}`} />;
      case "Scale":
        return <Scale className={`w-5 h-5 ${colorClass}`} />;
      default:
        return <Sparkles className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  const CASE_STUDIES = [
    {
      id: "canada-hockey",
      title: "Canada Hockey News App",
      category: "Sports Media",
      icon: "Trophy",
      shortDesc: "Automatically crawls junior hockey leagues, scrapes game summaries, stats, and quotes, and posts them to a sports news feed.",
      pipeline: [
        { name: "OHL / WHL Crawlers", desc: "Monitors game feeds & scrapes post-game summaries" },
        { name: "Quote Scraper", desc: "Extracts key player/coach interview quotes" },
        { name: "Sportswriter Agent", desc: "Compiles a clean markdown news brief + highlights" }
      ]
    },
    {
      id: "celebrity-checker",
      title: "Celebrity Sightings Checker",
      category: "OSINT Research",
      icon: "Star",
      shortDesc: "Monitors social handles, news mentions, and airport flight logs to track and cross-reference celebrity sightings and public movements.",
      pipeline: [
        { name: "Social Media Watcher", desc: "Monitors Twitter/X, Instagram geotags, and news feeds" },
        { name: "Flight Log Agent", desc: "Scrapes flight registration codes and arrivals" },
        { name: "Cross-Reference Hub", desc: "Matches time & location to verify sighting certainty" }
      ]
    },
    {
      id: "price-watcher",
      title: "E-Commerce Price War Watcher",
      category: "Competitive Retail",
      icon: "ShoppingBag",
      shortDesc: "Checks competitor sites hourly (Amazon, Shopify), matches prices, and auto-updates your product's pricing API to match.",
      pipeline: [
        { name: "Competitor Scrapers", desc: "Crawls pricing matrices from Amazon and BestBuy" },
        { name: "Pricing Engine Agent", desc: "Applies 1% discount logic and checks baseline margin rules" },
        { name: "Pricing API Webhook", desc: "Triggers immediate update on your e-commerce storefront" }
      ]
    },
    {
      id: "realestate-radar",
      title: "Real Estate Discount Radar",
      category: "PropTech & Investment",
      icon: "Home",
      shortDesc: "Scrapes local property listings daily, flags listings priced 15% below neighborhood average, and notifies investment syndicates.",
      pipeline: [
        { name: "Listing Parser", desc: "Crawls MLS, Redfin and Zillow for new property releases" },
        { name: "Valuation Estimator", desc: "Calculates neighborhood average and highlights outliers" },
        { name: "Alert Syndicate API", desc: "Pushes qualified deal brief to Slack and investor emails" }
      ]
    },
    {
      id: "policy-tracker",
      title: "Regulatory Compliance Tracker",
      category: "Enterprise Legal",
      icon: "Scale",
      shortDesc: "Monitors official government bulletins and federal register feeds daily for changes in environmental regulations or tariffs.",
      pipeline: [
        { name: "Federal Bulletin Crawler", desc: "Checks Federal Register and EPA policy pages daily" },
        { name: "Impact Assessor Agent", desc: "Flags compliance changes matching client chemical list" },
        { name: "Advisory Auto-Mailer", desc: "Drafts and sends regulatory risk bulletins to compliance heads" }
      ]
    }
  ];

  const getCodeContent = () => {
    const groupIds = ["canada-hockey", "celebrity-checker", "price-watcher", "realestate-radar", "policy-tracker"];
    const selectedGroupId = groupIds[activeCaseStudyIndex] || "canada-hockey";
    
    switch (activeCodeTab) {
      case "curl":
        return (
          <code className="text-neutral-300 font-mono text-xs leading-relaxed block whitespace-pre">
            <span className="text-neutral-500"># Run agent group via cURL</span>{"\n"}
            <span className="text-indigo-400">curl</span> -X POST <span className="text-emerald-400">"https://api.bossint.ai/v1/agent-groups/{selectedGroupId}/run"</span> \{'\n'}
            {"  "}-H <span className="text-emerald-400">"Authorization: Bearer boss_live_8a92f08a"</span> \{'\n'}
            {"  "}-H <span className="text-emerald-400">"Content-Type: application/json"</span> \{'\n'}
            {"  "}-d <span className="text-amber-400">'{'{'}'</span>{"\n"}
            {"    "}<span className="text-cyan-400">"query"</span>: <span className="text-emerald-400">"{getCaseStudyPrompt(activeCaseStudyIndex)}"</span>,{"\n"}
            {"    "}<span className="text-cyan-400">"format"</span>: <span className="text-emerald-400">"json"</span>{"\n"}
            {"  "}<span className="text-amber-400">'{'}'}'</span>
          </code>
        );
      case "ts":
        return (
          <code className="text-neutral-300 font-mono text-xs leading-relaxed block whitespace-pre">
            <span className="text-pink-400">import</span> <span className="text-amber-400">{'{'}</span> BossintClient <span className="text-amber-400">{'}'}</span> <span className="text-pink-400">from</span> <span className="text-emerald-400">"@bossint/sdk"</span>;{"\n\n"}
            <span className="text-pink-400">const</span> bossint = <span className="text-pink-400">new</span> <span className="text-amber-400">BossintClient</span><span className="text-neutral-400">({'{'}</span> apiKey: <span className="text-emerald-400">"boss_live_8a92f08a"</span> <span className="text-neutral-400">{'}'})</span>;{"\n\n"}
            <span className="text-pink-400">const</span> result = <span className="text-pink-400">await</span> bossint.agentGroups.run(<span className="text-emerald-400">"{selectedGroupId}"</span>, <span className="text-neutral-400">{'{'}</span>{"\n"}
            {"  "}query: <span className="text-emerald-400">"{getCaseStudyPrompt(activeCaseStudyIndex)}"</span>,{"\n"}
            {"  "}format: <span className="text-emerald-400">"json"</span>{"\n"}
            <span className="text-neutral-400">{'}'}</span>);{"\n\n"}
            console.log(result.data);
          </code>
        );
      case "py":
        return (
          <code className="text-neutral-300 font-mono text-xs leading-relaxed block whitespace-pre">
            <span className="text-pink-400">from</span> bossint <span className="text-pink-400">import</span> BossintClient{"\n\n"}
            client = <span className="text-amber-400">BossintClient</span>(api_key=<span className="text-emerald-400">"boss_live_8a92f08a"</span>){"\n\n"}
            result = client.agent_groups.run({"\n"}
            {"    "}group_id=<span className="text-emerald-400">"{selectedGroupId}"</span>,{"\n"}
            {"    "}query=<span className="text-emerald-400">"{getCaseStudyPrompt(activeCaseStudyIndex)}"</span>,{"\n"}
            {"    "}format=<span className="text-emerald-400">"json"</span>{"\n"}
            ){"\n\n"}
            <span className="text-pink-400">print</span>(result[<span className="text-emerald-400">"data"</span>])
          </code>
        );
    }
  };

  const renderAgentIcon = (name: string) => {
    switch (name) {
      case "Coins":
        return <Coins className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "TrendingUp":
        return <TrendingUp className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "Eye":
        return <Eye className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "Globe":
        return <Globe className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "Calendar":
        return <Calendar className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "Anchor":
        return <Anchor className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "DollarSign":
        return <DollarSign className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "ShieldAlert":
        return <ShieldAlert className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "Compass":
        return <Compass className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      case "Heart":
        return <Heart className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
      default:
        return <Globe className="w-12 h-12 text-white/90" strokeWidth={1.5} />;
    }
  };

  // Video source placeholder (set to empty to show the video-placer-image by default)
  const videoSrc = ""; 

  const performLogin = async (emailVal: string, passwordVal: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal.trim(), password: passwordVal }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (data && data.access_token) {
        localStorage.setItem("bossint_auth", "true");
        localStorage.setItem("bossint_user_token", data.access_token);
        localStorage.setItem("bossint_user_email", emailVal.trim());
        return true;
      }
    } catch (err) {
      console.error("Login API call failed:", err);
    }
    return false;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    const success = await performLogin(email, password);
    if (success) {
      window.dispatchEvent(new Event("bossint_auth_change"));
      onLogin();
    } else {
      // Fallback for offline/unregistered dev mode
      if (password === "112233q" && email.trim().toLowerCase() === "gokhan@gunery.com") {
        localStorage.setItem("bossint_auth", "true");
        localStorage.setItem("bossint_user_email", email.trim());
        window.dispatchEvent(new Event("bossint_auth_change"));
        onLogin();
      } else {
        setError("Invalid credentials. Please check your email and password.");
      }
    }
    setIsLoading(false);
  };

  const handleQuickDemoLogin = async () => {
    setError("");
    setIsLoading(true);
    const success = await performLogin("gokhan@gunery.com", "112233q");
    if (success) {
      window.dispatchEvent(new Event("bossint_auth_change"));
      onLogin();
    } else {
      localStorage.setItem("bossint_auth", "true");
      localStorage.setItem("bossint_user_email", "gokhan@gunery.com");
      window.dispatchEvent(new Event("bossint_auth_change"));
      onLogin();
    }
    setIsLoading(false);
  };

  const handleModalQuickLogin = async () => {
    setModalError("");
    setIsLoading(true);
    const success = await performLogin("gokhan@gunery.com", "112233q");
    if (!success) {
      localStorage.setItem("bossint_auth", "true");
      localStorage.setItem("bossint_user_email", "gokhan@gunery.com");
    }
    if (pendingDeployDetails) {
      localStorage.setItem("bossint_pending_deploy", JSON.stringify(pendingDeployDetails));
    }
    window.dispatchEvent(new Event("bossint_auth_change"));
    onLogin();
    setIsLoading(false);
    setIsAuthOpen(false);
  };

  const handleModalAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!modalEmail || !modalPassword) {
      setModalError("Please fill in both email and password.");
      return;
    }
    setIsLoading(true);
    const success = await performLogin(modalEmail, modalPassword);
    if (success) {
      if (pendingDeployDetails) {
        localStorage.setItem("bossint_pending_deploy", JSON.stringify(pendingDeployDetails));
      }
      window.dispatchEvent(new Event("bossint_auth_change"));
      onLogin();
      setIsAuthOpen(false);
    } else {
      if (modalEmail.trim().toLowerCase() === "gokhan@gunery.com" && modalPassword === "112233q") {
        localStorage.setItem("bossint_auth", "true");
        localStorage.setItem("bossint_user_email", modalEmail.trim());
        if (pendingDeployDetails) {
          localStorage.setItem("bossint_pending_deploy", JSON.stringify(pendingDeployDetails));
        }
        window.dispatchEvent(new Event("bossint_auth_change"));
        onLogin();
        setIsAuthOpen(false);
      } else {
        setModalError("Invalid credentials. Try: gokhan@gunery.com / 112233q");
      }
    }
    setIsLoading(false);
  };

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || template.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  }).slice(0, 15);

  return (
    <div className="min-h-screen w-full bg-[#FBF9F6] text-[#1A1E23] overflow-y-auto font-sans scroll-smooth flex flex-col">
      
      {/* SECTION 1: HERO & LOGIN */}
      <div className="w-full flex flex-col lg:flex-row border-b border-[#E8E4DC] shrink-0 min-h-screen">
        
        {/* LEFT PANE - Marketing Content & Login Card */}
        <div className="w-full lg:w-[48%] flex flex-col justify-between p-8 lg:p-14 min-h-[100vh] lg:min-h-screen">
          {/* Content Body */}
          <div className="my-auto py-10 w-full max-w-[440px] mx-auto flex flex-col items-center">
            
            {/* Centered Logo matching text and sign in box */}
            <div className="flex items-center justify-center mb-8 select-none">
              <video
                src="/bossint-logo-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-24 w-auto object-contain"
              />
            </div>
            
            {/* Headline - cool strong minimal sans-serif */}
            <h1 className="font-sans text-4xl lg:text-[46px] font-semibold text-neutral-800 leading-[1.15] tracking-tight mb-6 text-center">
              Know everything. Before everyone.
            </h1>

            {/* Subtitle - paragraph description */}
            <p className="text-neutral-600 text-[16px] lg:text-[17px] leading-relaxed mb-10 text-center">
              Use agents to monitor the web nonstop. Get updates on your schedule via email, WhatsApp, Telegram, or dashboard.
            </p>

            {/* Login Card */}
            <div className="bg-white rounded-3xl border border-[#E8E4DC] p-6 lg:p-8 shadow-sm relative overflow-hidden transition-all duration-300 w-full">
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Continue with Google Mock */}
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-[#E8E4DC] hover:bg-neutral-50 text-neutral-700 font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* OR Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-[#E8E4DC]"></div>
                  <span className="px-3 text-xs font-semibold text-neutral-400 tracking-wider">OR</span>
                  <div className="flex-grow border-t border-[#E8E4DC]"></div>
                </div>

                {/* Email Input */}
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-xs font-semibold text-neutral-500">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-white border border-[#E8E4DC] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-3 pl-4 pr-10 text-sm outline-none transition-all duration-200"
                    />
                    <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label htmlFor="password" className="block text-xs font-semibold text-neutral-500">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-white border border-[#E8E4DC] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-3 pl-4 pr-10 text-sm outline-none transition-all duration-200 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2 pt-2"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  ) : (
                    <>
                      <span>Continue to Bossint</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Terms and Privacy policy */}
              <p className="mt-5 text-center text-[11px] text-neutral-400 leading-normal">
                By continuing, you acknowledge Bossint's{" "}
                <a href="#" className="underline hover:text-neutral-600">Terms of Service</a> and{" "}
                <a href="#" className="underline hover:text-neutral-600">Privacy Policy</a>.
              </p>
            </div>
          </div>

          {/* Footer/App Download button centered */}
          <div className="flex flex-col items-center justify-center border-t border-neutral-200/50 pt-5 mt-auto w-full gap-4 text-xs text-neutral-500">
            <button className="flex items-center justify-center gap-2 border border-[#E8E4DC] bg-white hover:bg-neutral-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 transition duration-200 cursor-pointer shadow-sm">
              <Laptop className="w-3.5 h-3.5" />
              Download desktop app
            </button>
            
            <a href="#" className="flex items-center justify-center gap-1 hover:text-neutral-600 transition">
              <HelpCircle className="w-3.5 h-3.5" />
              Support
            </a>
          </div>
        </div>

        {/* RIGHT PANE - Video/Image Placer Showcase Mockup */}
        <div className="w-full lg:w-[52%] bg-[#F5F1EA] flex items-center justify-center p-6 lg:p-14 relative min-h-[500px] lg:min-h-screen border-t lg:border-t-0 lg:border-l border-[#E8E4DC]">
          
          {/* Mockup Container mimicking the premium outer frame from the Claude design */}
          <div className="w-full max-w-2xl bg-[#ECE8DF] p-4 lg:p-6 rounded-[28px] border border-[#DDD9CE] shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] flex flex-col gap-4">
            
            {/* Mock Window Headers / Navigation Switch */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-neutral-300/80"></span>
                <span className="w-3 h-3 rounded-full bg-neutral-300/80"></span>
                <span className="w-3 h-3 rounded-full bg-neutral-300/80"></span>
              </div>
              
              {/* Custom Tab Switcher just like "Chat / Cowork" in the Claude image */}
              <div className="bg-[#DFDACF] p-1 rounded-full flex items-center text-xs font-semibold text-neutral-600 shadow-sm border border-[#DDD9CE]">
                <span className="px-4 py-1.5 bg-[#F5F1EA] text-neutral-800 rounded-full shadow-sm">Research Hub</span>
                <span className="px-4 py-1.5 text-neutral-500 cursor-pointer hover:text-neutral-800 transition">Autonomous Army</span>
              </div>
            </div>

            {/* Media Content Area */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#E8E4DC] shadow-lg relative aspect-video flex items-center justify-center bg-neutral-900 group">
              
              {videoSrc ? (
                <video
                  src={videoSrc}
                  poster="/video-placer-image.png"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full relative">
                  <img 
                    src="/video-placer-image.png" 
                    alt="Bossint Autonomous Agents Demo" 
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                  
                  {/* Mock Play Indicator suggesting a video is there */}
                  <div className="absolute inset-0 bg-black/10 hover:bg-black/20 flex items-center justify-center transition duration-300">
                    <div className="w-16 h-16 rounded-full bg-white/90 shadow-xl border border-neutral-200/50 flex items-center justify-center hover:scale-105 transition-transform duration-250 cursor-pointer">
                      <svg className="w-6 h-6 text-neutral-800 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Subtitle / Video hint */}
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-xs font-medium text-white border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Intro Video Placer
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TRENDING AGENTS */}
      <div className="w-full bg-[#0E1116] text-[#ECF0F3] py-20 px-6 lg:px-16 border-t border-neutral-900 flex-shrink-0 animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-2 mb-12 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-sans">
            Trending Autopilot Agents
          </h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            Deploy for yourself with a single click.
          </p>
        </div>

        {/* Horizontal Scroll Cards Section */}
        <div className="max-w-7xl mx-auto overflow-hidden relative px-2 py-10">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              display: flex;
              gap: 56px;
              width: max-content;
              animation: marquee 75s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}} />
          <div className="animate-marquee py-4">
            {/* Render twice for infinite scrolling marquee loop */}
            {[...TRENDING_AGENTS, ...TRENDING_AGENTS].map((agent, index) => (
              <div
                key={`${agent.id}-${index}`}
                className="w-[280px] flex-shrink-0 group cursor-pointer"
                onClick={() => {
                  setSelectedAgentToDeploy(agent);
                  setPendingDeployDetails(null);
                  setModalError("");
                  setModalEmail("");
                  setModalPassword("");
                  setIsDeployDialogOpen(true);
                }}
              >
                {/* Square Card Artwork Cover */}
                <div className="w-[280px] h-[280px] rounded-3xl overflow-hidden relative shadow-2xl bg-neutral-900 border border-neutral-800 transition-all duration-300 transform group-hover:scale-[1.02] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                  {/* Cover Image */}
                  <img
                    src={agent.coverImage}
                    alt={agent.title}
                    className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Gradient Overlay for subtle look */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                  {/* Hover Play/Deploy Button overlay */}
                  <div className="absolute bottom-4 right-4 bg-white hover:bg-neutral-100 text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Play className="w-5 h-5 fill-current ml-0.5 text-black" />
                  </div>
                </div>

                {/* Info below the card */}
                <div className="mt-5 space-y-1.5 px-1">
                  <h3 className="text-lg font-bold text-white truncate tracking-tight group-hover:text-indigo-400 transition-colors">
                    {agent.title}
                  </h3>
                  <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                    {agent.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 pt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{agent.schedule}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explore All Agents Button */}
        <div className="flex justify-center pt-8">
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setIsExploreOpen(true);
            }}
            className="bg-white hover:bg-neutral-100 text-neutral-900 px-8 py-3.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Explore All Agents
          </button>
        </div>
      </div>
      {/* SECTION 3: PRICING */}
      <div id="pricing" className="w-full bg-[#FBF9F6] py-24 px-6 lg:px-16 border-t border-[#E8E4DC] flex-shrink-0 animate-fade-in font-sans">
        <div className="max-w-6xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-4xl lg:text-[40px] font-extrabold tracking-tight text-neutral-800 font-sans">
            Explore plans
          </h2>
          
          {/* Pill Switcher */}
          <div className="flex justify-center pt-2">
            <div className="bg-[#DFDACF] p-1 rounded-full flex items-center text-xs font-semibold text-neutral-600 shadow-sm border border-[#DDD9CE] select-none">
              <button
                type="button"
                onClick={() => setPricingTab("individual")}
                className={`px-6 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  pricingTab === "individual"
                    ? "bg-[#F5F1EA] text-neutral-800 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setPricingTab("team")}
                className={`px-6 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                  pricingTab === "team"
                    ? "bg-[#F5F1EA] text-neutral-800 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Team and Enterprise
              </button>
            </div>
          </div>
        </div>

        {pricingTab === "individual" ? (
          /* INDIVIDUAL PLANS GRID */
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* TIER 1: FREE */}
            <div className="bg-white rounded-3xl border border-[#E8E4DC] p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Try Bossint</div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-6">Free</h3>
                
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-extrabold text-neutral-800">$0</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedAgentToDeploy(null);
                    setModalError("");
                    setModalEmail("");
                    setModalPassword("");
                    setIsAuthOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-neutral-300 hover:border-neutral-800 text-neutral-700 hover:text-neutral-900 font-semibold text-sm transition-all duration-200 mb-8 cursor-pointer text-center"
                >
                  Try Bossint
                </button>

                <div className="space-y-4 border-t border-neutral-100 pt-6">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      Deploy up to <strong>3 active agents</strong> from the 200+ template library
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      Access <strong>20 template categories</strong> (Finance, Competitive Intel, News, etc.)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Manual agent runs</strong> via "Run Now" execution on demand
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Chat-based OSINT research</strong> (web search, crawl, summarize)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Reasoning trace visibility</strong> to see step-by-step thinking
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Source attribution & citations</strong> linking back to origins
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Basic scheduling</strong> (run daily or weekly only)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>In-app dashboard</strong> to view agent execution results
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Light & dark mode</strong> support across components
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>7-day data retention</strong> for agent execution history
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TIER 2: PRO */}
            <div className="bg-white rounded-3xl border-2 border-indigo-500/80 p-8 shadow-md relative flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
              {/* Most Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold py-1 px-3.5 rounded-full uppercase tracking-wider">
                Recommended
              </div>

              <div>
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">For everyday intelligence</div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-6">Pro</h3>
                
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-extrabold text-neutral-800">$17</span>
                  <span className="text-neutral-500 text-sm ml-2">/ month</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedAgentToDeploy(null);
                    setModalError("");
                    setModalEmail("");
                    setModalPassword("");
                    setIsAuthOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 mb-8 cursor-pointer text-center shadow-sm"
                >
                  Try Bossint Pro
                </button>

                <div className="text-xs font-bold text-neutral-800 mb-4">Everything in Free, plus:</div>

                <div className="space-y-4 border-t border-neutral-100 pt-6">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      Deploy up to <strong>25 active agents</strong> concurrently
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>More usage limit</strong> with higher daily run caps per agent
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Hourly scheduling</strong> (every hour, 6 hours, 12 hours, daily, weekly)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Telegram bot alerts</strong> pushed directly to your chats
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Email digests</strong> (daily or weekly reports)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Session memory</strong> for follow-up query context
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Image generation</strong> to embed charts or visual panels in reports
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      Access to <strong>all 200+ agent templates</strong> (including premium blueprints)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Change detection & diffing</strong> showing what's updated since last run
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Export to CSV & PDF</strong> for sharing report summaries
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>90-day data retention</strong> for agent history logs
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Unlimited research chats</strong> with search queries
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TIER 3: MAX */}
            <div className="bg-white rounded-3xl border border-[#E8E4DC] p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
              <div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">5-20x more usage than Pro</div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-6">Max</h3>
                
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-extrabold text-neutral-800">$100</span>
                  <span className="text-neutral-500 text-sm ml-2">/ month</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedAgentToDeploy(null);
                    setModalError("");
                    setModalEmail("");
                    setModalPassword("");
                    setIsAuthOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-neutral-300 hover:border-neutral-800 text-neutral-700 hover:text-neutral-900 font-semibold text-sm transition-all duration-200 mb-8 cursor-pointer text-center"
                >
                  Try Bossint Max
                </button>

                <div className="text-xs font-bold text-neutral-800 mb-4">Everything in Pro, plus:</div>

                <div className="space-y-4 border-t border-neutral-100 pt-6">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      Deploy <strong>unlimited active agents</strong> concurrently
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>15-minute scheduling</strong> for real-time critical monitoring
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Webhook & Slack integrations</strong> to push alerts anywhere
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Multi-agent pipelines</strong> to chain outputs together
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Priority agent execution</strong> queue slots during high traffic
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Custom source connectors</strong> for specialized RSS, APIs or DBs
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Advanced dashboard analytics</strong> (time-series, matrices, heatmaps)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Unlimited data retention</strong> of all historical logs
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Early access</strong> to bleeding-edge agent capabilities
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* TEAM AND ENTERPRISE PLAN CARD */
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl border border-[#E8E4DC] p-8 lg:p-12 shadow-sm flex flex-col md:flex-row justify-between gap-8 hover:shadow-md transition-shadow duration-300">
              <div className="flex-1 space-y-6">
                <div>
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Enterprise</div>
                  <h3 className="text-3xl font-bold text-neutral-800">Bossint for Teams</h3>
                  <p className="text-neutral-500 text-sm mt-2 leading-relaxed text-left">
                    Intelligence at scale for your organization. Manage shared workflows, connect private indices, and automate operations securely.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-100 pt-6">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Everything in Max</strong> features included
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Team workspaces</strong> with shared agents, results & dashboards
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Role-based access controls</strong> (RBAC) with detailed permissions
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>SSO / SAML authentication</strong> provider setups
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Audit logging</strong> detailing all creation, run, and access logs
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Custom agent templates</strong> designed specifically with your team
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Dedicated support & onboarding</strong> with priority service channels
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>SLA & uptime guarantees</strong> contractual reliability
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>GDPR/CCPA compliance</strong> toolkit, PII detection, & deletion
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600 leading-normal text-left">
                      <strong>Volume pricing tiering</strong> adjusted to your headcount size
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-[240px] flex flex-col justify-center items-center p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-center shrink-0">
                <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">Custom Pricing</div>
                <div className="text-3xl font-extrabold text-neutral-800 mb-6">Contact Sales</div>
                <a
                  href="mailto:sales@bossint.com?subject=Bossint%20Enterprise%20Inquiry"
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm transition-all duration-200 cursor-pointer text-center shadow-sm"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto text-center mt-12 text-[11px] text-neutral-400 leading-normal px-4">
          Usage limits apply. Prices shown don't include applicable tax. Prices and plans are subject to change at Bossint's discretion.
        </div>
      </div>

      {/* SECTION 2.5: DEVELOPER HUB (Light Section) */}
      <div id="developers" className="w-full bg-[#FAF8F5] py-24 px-6 lg:px-16 border-t border-[#E8E4DC] flex-shrink-0 animate-fade-in font-sans">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pipelineFlow {
            0% { left: -20%; }
            100% { left: 120%; }
          }
          .animate-pipeline-flow {
            animation: pipelineFlow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}} />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* LEFT COLUMN: Message and interactive terminal */}
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-600/15 bg-indigo-600/5 text-indigo-700 text-xs font-semibold">
              <Code className="w-3.5 h-3.5" />
              <span>Developer Platform</span>
            </div>
            
            <h2 className="text-3xl lg:text-[40px] font-extrabold tracking-tight text-neutral-800 leading-[1.1] font-sans">
              Build custom agents, orchestrate groups, and deploy production-ready APIs.
            </h2>
            
            <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
              Turn autonomous intelligence workflows into instant HTTP endpoints. Combine web crawling, LLM synthesis, and data-monitoring tools into orchestrated pipelines, then query them programmatically from your product or client apps.
            </p>

            {/* MOCK IDE CODE WINDOW */}
            <div className="w-full bg-[#16161A] rounded-3xl border border-neutral-800 shadow-xl overflow-hidden mt-8 transition-all">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#0F0F12] border-b border-neutral-800/80 select-none">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono ml-2 font-medium">api-playground.sh</span>
                </div>
                
                <div className="flex bg-[#1E1E24] border border-neutral-800/80 rounded-lg p-0.5 text-[10px] font-mono font-semibold text-neutral-400">
                  <button
                    type="button"
                    onClick={() => { setActiveCodeTab("curl"); setApiState("idle"); }}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${activeCodeTab === "curl" ? "bg-[#16161A] text-white shadow-sm" : "hover:text-neutral-200"}`}
                  >
                    cURL
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveCodeTab("ts"); setApiState("idle"); }}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${activeCodeTab === "ts" ? "bg-[#16161A] text-white shadow-sm" : "hover:text-neutral-200"}`}
                  >
                    TypeScript
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveCodeTab("py"); setApiState("idle"); }}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${activeCodeTab === "py" ? "bg-[#16161A] text-white shadow-sm" : "hover:text-neutral-200"}`}
                  >
                    Python
                  </button>
                </div>
              </div>

              {/* Code display */}
              <div className="p-5 overflow-x-auto min-h-[160px] bg-[#16161A] border-b border-neutral-800/50">
                {getCodeContent()}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-[#0F0F12] border-t border-neutral-800/50 select-none">
                <button
                  type="button"
                  onClick={runApiSim}
                  disabled={apiState === "loading"}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run API Request</span>
                </button>
                
                <button
                  type="button"
                  onClick={copyCodeText}
                  className="flex items-center gap-1.5 text-neutral-400 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Console */}
              <div className="bg-[#0B0B0E] border-t border-neutral-800/60 p-5 font-mono text-[11px] text-neutral-400 relative min-h-[160px] max-h-[320px] overflow-y-auto">
                <div className="flex items-center justify-between text-neutral-500 mb-3 border-b border-neutral-900 pb-2 select-none">
                  <span>API RESPONSE</span>
                  {apiState === "success" && (
                    <span className="text-emerald-500 flex items-center gap-1 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      HTTP 200 OK
                    </span>
                  )}
                  {apiState === "loading" && (
                    <span className="text-indigo-400 flex items-center gap-1 font-semibold text-[10px]">
                      <span className="w-2 h-2 rounded-full border border-indigo-400 border-t-transparent animate-spin"></span>
                      EXECUTING PIPELINE...
                    </span>
                  )}
                  {apiState === "idle" && <span>READY TO RUN</span>}
                </div>

                {apiState === "idle" && (
                  <div className="flex flex-col items-center justify-center py-10 text-neutral-600 select-none">
                    <Terminal className="w-8 h-8 mb-2 opacity-40 text-neutral-500" strokeWidth={1.5} />
                    <span className="text-neutral-500">Trigger standard JSON output above</span>
                  </div>
                )}

                {apiState === "loading" && (
                  <div className="space-y-1.5 text-neutral-400 leading-relaxed text-left">
                    <p className="text-neutral-500 font-mono">&gt; POST /v1/agent-groups/{CASE_STUDIES[activeCaseStudyIndex].id}/run HTTP/1.1</p>
                    <p className="text-neutral-500 font-mono">&gt; Host: api.bossint.ai</p>
                    <p className="text-neutral-600 font-bold mt-2.5 flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-indigo-500 rounded animate-pulse"></span>
                      Calling {CASE_STUDIES[activeCaseStudyIndex].pipeline[0].name}...
                    </p>
                    <p className="text-neutral-600 font-bold flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-indigo-400 rounded animate-pulse"></span>
                      Synthesizing details with {CASE_STUDIES[activeCaseStudyIndex].pipeline[1].name}...
                    </p>
                  </div>
                )}

                {apiState === "success" && (
                  <pre className="text-emerald-400/90 whitespace-pre overflow-x-auto select-all leading-normal text-left font-mono">
                    {JSON.stringify(getCaseStudyResponse(activeCaseStudyIndex), null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Case Studies list */}
          <div className="space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 select-none mb-3">
              Production Use Cases
            </h3>

            <div className="space-y-3">
              {CASE_STUDIES.map((study, idx) => {
                const isActive = activeCaseStudyIndex === idx;
                return (
                  <div
                    key={study.id}
                    onClick={() => {
                      setActiveCaseStudyIndex(idx);
                      setApiState("idle");
                    }}
                    className={`group w-full rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden p-5 text-left ${
                      isActive
                        ? "bg-white border-indigo-400/80 shadow-md"
                        : "bg-white/50 border-[#E8E4DC] hover:border-neutral-300 hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl transition ${isActive ? "bg-indigo-600/5" : "bg-neutral-100"}`}>
                        {renderCaseStudyIcon(study.icon, isActive)}
                      </div>
                      
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold truncate transition ${isActive ? "text-indigo-600" : "text-neutral-800"}`}>
                            {study.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-indigo-600/10 text-indigo-700" : "bg-neutral-100 text-neutral-500"}`}>
                            {study.category}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                          {study.shortDesc}
                        </p>
                      </div>
                    </div>

                    {/* Active Expanded pipeline flow */}
                    {isActive && (
                      <div className="mt-5 pt-5 border-t border-neutral-100 animate-fade-in space-y-3.5">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider select-none">
                          Agent Pipeline Sequence
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          {/* Node 1 */}
                          <div className="flex-1 bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 text-left">
                            <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">1. Input Agent</div>
                            <div className="text-xs font-bold text-neutral-800 truncate">{study.pipeline[0].name}</div>
                            <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">{study.pipeline[0].desc}</div>
                          </div>
                          
                          {/* Connect Arrow 1 */}
                          <div className="relative w-full sm:w-10 h-2 flex items-center justify-center">
                            <div className="w-0.5 sm:w-full h-full sm:h-0.5 bg-neutral-200 rounded-full relative overflow-hidden">
                              <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-1/3 rounded-full animate-pipeline-flow"></div>
                            </div>
                            <ChevronRight className="w-3 h-3 text-indigo-400 absolute right-0 top-1/2 -translate-y-1/2 hidden sm:block" />
                          </div>

                          {/* Node 2 */}
                          <div className="flex-1 bg-neutral-50 border border-neutral-200/80 rounded-xl p-3 text-left">
                            <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">2. Synthesis Agent</div>
                            <div className="text-xs font-bold text-neutral-800 truncate">{study.pipeline[1].name}</div>
                            <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">{study.pipeline[1].desc}</div>
                          </div>

                          {/* Connect Arrow 2 */}
                          <div className="relative w-full sm:w-10 h-2 flex items-center justify-center">
                            <div className="w-0.5 sm:w-full h-full sm:h-0.5 bg-neutral-200 rounded-full relative overflow-hidden">
                              <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-1/3 rounded-full animate-pipeline-flow"></div>
                            </div>
                            <ChevronRight className="w-3 h-3 text-indigo-400 absolute right-0 top-1/2 -translate-y-1/2 hidden sm:block" />
                          </div>

                          {/* Node 3 */}
                          <div className="flex-1 bg-emerald-50/20 border border-emerald-200 rounded-xl p-3 text-left">
                            <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">3. Live API Endpoint</div>
                            <div className="text-xs font-bold text-emerald-800 truncate">{study.pipeline[2].name}</div>
                            <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">{study.pipeline[2].desc}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3.5: INTERACTIVE DOTS (Light showcase section) */}
      <div id="interactive-dots" className="w-full h-screen relative overflow-hidden flex flex-col items-center justify-center bg-white border-t border-[#E8E4DC] shrink-0 font-sans select-none">
        <InteractiveDots dotColor="#0000ff" dotSize={10} className="absolute inset-0 z-0 pointer-events-auto" />
        <div className="relative z-10 text-center space-y-4 px-6 flex flex-col items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => {
              setSelectedAgentToDeploy(null);
              setPendingDeployDetails(null);
              setModalError("");
              setModalEmail("");
              setModalPassword("");
              setIsAuthOpen(true);
            }}
            className="pointer-events-auto cursor-pointer group flex flex-col items-center"
          >
            <h2 className="text-5xl lg:text-[64px] font-black tracking-tight text-white transition-all duration-300 font-sans leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
              Start Monitoring Internet
            </h2>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-white/90 group-hover:text-white transition-colors drop-shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
              <span>Deploy your autonomous army now</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 4: FOOTER */}
      <footer className="w-full bg-[#F5F2EC] py-16 px-6 lg:px-16 border-t border-[#E8E4DC] flex-shrink-0 animate-fade-in font-sans text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2 select-none">
              <video
                src="/bossint-logo-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-8 w-auto object-contain animate-fade-in"
              />
              <span className="font-sans font-bold text-sm tracking-tight text-neutral-700">Bossint</span>
            </div>
            <p className="text-[11px] text-neutral-400">© 2026 Bossint Corp. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 font-semibold text-neutral-600">
            <a href="#" className="hover:text-neutral-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">OSINT Library</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Security</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Documentation</a>
            <a href="mailto:support@bossint.com" className="hover:text-neutral-900 transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* DIALOG 1: EXPLORE ALL AGENTS */}
      <Dialog
        isOpen={isExploreOpen}
        onClose={() => setIsExploreOpen(false)}
        title="Explore Agent Library"
        subtitle="Search and discover ready-to-deploy blueprints across 20+ industries."
        icon={<Globe className="w-5 h-5" strokeWidth={1.5} />}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 font-sans">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search templates by title, description or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm transition-colors"
            />
          </div>

          {/* Categories Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              All Categories
            </button>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Results Grid/List */}
          <div className="max-h-[380px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-200"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        {template.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)] pt-1">
                      <span>Interval: {template.schedule}</span>
                      {template.tags.length > 0 && (
                        <div className="flex gap-1">
                          {template.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-[var(--bg-surface-hover)] px-1.5 py-0.5 rounded text-[9px] text-[var(--text-secondary)] border border-[var(--border-color)]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAgentToDeploy(template);
                      setPendingDeployDetails(null);
                      setIsExploreOpen(false);
                      setModalEmail("");
                      setModalPassword("");
                      setModalError("");
                      setIsDeployDialogOpen(true);
                    }}
                    className="text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer self-start sm:self-center"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Deploy</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[var(--text-tertiary)] text-xs">
                No agents found matching your search criteria.
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* DIALOG 2: REGISTER & SIGN-IN POPUP */}
      <Dialog
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        title="Sign In or Register"
        subtitle={pendingDeployDetails ? `To deploy "${pendingDeployDetails.name}", please sign in to your Bossint account.` : (selectedAgentToDeploy ? `To deploy "${selectedAgentToDeploy.title}", please sign in to your Bossint account.` : "Sign in or create an account to get started.")}
        icon={<Lock className="w-5 h-5" strokeWidth={1.5} />}
        maxWidth="max-w-[420px]"
      >
        <div className="space-y-4 font-sans">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
              {modalError}
            </div>
          )}

          <form onSubmit={handleModalAuthSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1">
              <label htmlFor="modalEmail" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="modalEmail"
                  type="email"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  placeholder="Enter email (e.g. gokhan@gunery.com)"
                  className="w-full bg-white border border-[#E8E4DC] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-4 pr-10 text-sm outline-none transition-all duration-200"
                />
                <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-neutral-400" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label htmlFor="modalPassword" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="modalPassword"
                  type={showModalPassword ? "text" : "password"}
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  placeholder="Enter password (e.g. 112233q)"
                  className="w-full bg-white border border-[#E8E4DC] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-4 pr-10 text-sm outline-none transition-all duration-200 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowModalPassword(!showModalPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              ) : (
                <>
                  <span>Register &amp; Deploy</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-3">
            <div className="flex-grow border-t border-[#E8E4DC]"></div>
            <span className="px-3 text-xs font-semibold text-neutral-400 tracking-wider">OR</span>
            <div className="flex-grow border-t border-[#E8E4DC]"></div>
          </div>

          {/* Quick Demo Login Link */}
          <button
            type="button"
            onClick={handleModalQuickLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E8E4DC] hover:bg-neutral-50 text-neutral-700 font-medium py-2.5 px-4 rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Use Gokhan's Demo Login</span>
          </button>
        </div>
      </Dialog>

      {/* Configure & Deploy Agent Dialog */}
      <TemplateDeployDialog
        isOpen={isDeployDialogOpen}
        onClose={() => setIsDeployDialogOpen(false)}
        template={selectedAgentToDeploy as AgentTemplate}
        onDeploy={(configuredDetails) => {
          setPendingDeployDetails(configuredDetails);
          setIsDeployDialogOpen(false);
          setModalError("");
          setModalEmail("");
          setModalPassword("");
          setIsAuthOpen(true);
        }}
      />
    </div>
  );
}
