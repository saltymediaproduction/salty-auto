"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle,
  Plus,
  CheckCircle2,
  Send,
  Sparkles,
  Phone,
  Clock,
  Smartphone,
  ShieldCheck,
  CheckCheck,
  AlertCircle,
  Sliders,
  Trash2,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Radio,
  RefreshCw,
  Gift,
  Layers,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Zap,
} from "lucide-react";
import { parseRuleConfig, WhatsAppReplyButtonConfig } from "@/lib/automation/rules";

interface SocialAccount {
  id: string;
  platform: "instagram" | "whatsapp";
  account_id: string;
  account_name: string | null;
  status: string;
  created_at: string;
}

interface WhatsAppRule {
  id: string;
  name: string;
  platform: string;
  trigger_type: string;
  target_post_id: string;
  keywords: string[];
  match_type: "contains" | "exact";
  dm_message: string;
  is_active: boolean;
  metrics?: {
    triggers?: number;
    dms_sent?: number;
  };
}

const JASPERS_MARKET_TEMPLATE = {
  name: "Jasper's Market Concierge Flow",
  keywords: "HI, HELLO, MENU, START, SERVICES, SALTY",
  replyMessage: "Welcome to Salty Media Production! Choose an option below to get started immediately:",
  buttons: [
    {
      id: "btn_services",
      title: "Explore Services",
      reply_text:
        "Here is what Salty Media offers:\n\n• Video Production & Reels Editing\n• Full-Stack Web & Automation Apps\n• Performance Ad Campaigns & Creatives\n\nWhich service aligns best with your vision?",
    },
    {
      id: "btn_portfolio",
      title: "Portfolio Work",
      reply_text:
        "Explore our recent high-impact showreels & productions:\n\n🌐 https://saltymediaproduction.com/work\n\nWould you like a tailored quote for your project?",
    },
    {
      id: "btn_promo",
      title: "Claim 20% Promo",
      reply_text:
        "🎉 Here is your exclusive 20% off voucher code: SALTY20\n\nApply this on your next media production retainer or consultation booking!",
    },
  ],
};

export default function WhatsAppDashboardPage() {
  // Account State
  const [whatsappAccount, setWhatsappAccount] = useState<SocialAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [waDisplayName, setWaDisplayName] = useState("");
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState("");

  // Rules State (Real Supabase persistence)
  const [rules, setRules] = useState<WhatsAppRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [ruleError, setRuleError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("PRICE, PACKAGES, RATES, INFO");
  const [matchType, setMatchType] = useState<"contains" | "exact">("contains");
  const [responseType, setResponseType] = useState<"text" | "interactive_buttons">("interactive_buttons");
  const [replyMessage, setReplyMessage] = useState(
    "Welcome to Salty Media Production! Choose an option below to get started immediately:"
  );
  const [waButtons, setWaButtons] = useState<WhatsAppReplyButtonConfig[]>([
    ...JASPERS_MARKET_TEMPLATE.buttons,
  ]);

  // Live Test Dispatcher state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState(
    "Hello from Salty Auto! Your WhatsApp Business Cloud API is active and functioning seamlessly. 🚀"
  );
  const [testSendInteractive, setTestSendInteractive] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    success?: boolean;
    error?: string;
    messageId?: string;
    isInteractive?: boolean;
  } | null>(null);

  // Copy states
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Simulator State
  const [simMessages, setSimMessages] = useState<
    Array<{
      sender: "user" | "bot";
      text: string;
      buttons?: WhatsAppReplyButtonConfig[];
    }>
  >([
    { sender: "user", text: "Hi, I'd like some info!" },
    {
      sender: "bot",
      text: JASPERS_MARKET_TEMPLATE.replyMessage,
      buttons: JASPERS_MARKET_TEMPLATE.buttons,
    },
  ]);
  const [simTyping, setSimTyping] = useState(false);
  const [simFollowUpNotice, setSimFollowUpNotice] = useState(false);

  const webhookUrl = "https://auto.saltymediaproduction.com/api/webhooks/meta";
  const verifyToken = "salty_media_2026_secure_secret";

  useEffect(() => {
    fetchAccount();
    fetchRules();
  }, []);

  const fetchAccount = async () => {
    try {
      setLoadingAccount(true);
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (res.ok && data.accounts) {
        const found = data.accounts.find((a: SocialAccount) => a.platform === "whatsapp");
        setWhatsappAccount(found || null);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp account", err);
    } finally {
      setLoadingAccount(false);
    }
  };

  const fetchRules = async () => {
    try {
      setLoadingRules(true);
      const res = await fetch("/api/rules?platform=whatsapp");
      const data = await res.json();
      if (res.ok && data.rules) {
        setRules(data.rules);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp rules", err);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleCopy = (text: string, type: "url" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaError("");

    if (!waPhoneNumberId.trim() || !waAccessToken.trim()) {
      setWaError("WhatsApp Phone Number ID and Permanent Access Token are required.");
      return;
    }

    try {
      setWaSubmitting(true);
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "whatsapp",
          accountId: waPhoneNumberId.trim(),
          accountName: waDisplayName.trim() || "WhatsApp Business Number",
          accessToken: waAccessToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save WhatsApp account");
      }

      setConnectModalOpen(false);
      setWaDisplayName("");
      setWaPhoneNumberId("");
      setWaAccessToken("");
      fetchAccount();
    } catch (err: any) {
      setWaError(err.message || "Failed to connect WhatsApp account");
    } finally {
      setWaSubmitting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!whatsappAccount) return;
    if (!confirm("Are you sure you want to disconnect this WhatsApp account?")) return;

    try {
      const res = await fetch(`/api/accounts?id=${whatsappAccount.id}`, { method: "DELETE" });
      if (res.ok) {
        setWhatsappAccount(null);
      }
    } catch (err) {
      console.error("Failed to disconnect WhatsApp account", err);
    }
  };

  const handleToggleRule = async (id: string, currentActive: boolean) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !currentActive } : r))
    );

    try {
      await fetch("/api/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
    } catch (err) {
      console.error("Failed to toggle rule", err);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: currentActive } : r))
      );
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this responder?")) return;

    try {
      const res = await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete rule", err);
    }
  };

  const handleLoadJaspersTemplate = () => {
    setName(JASPERS_MARKET_TEMPLATE.name);
    setKeywords(JASPERS_MARKET_TEMPLATE.keywords);
    setReplyMessage(JASPERS_MARKET_TEMPLATE.replyMessage);
    setResponseType("interactive_buttons");
    setWaButtons([...JASPERS_MARKET_TEMPLATE.buttons]);
  };

  const handleAddButton = () => {
    if (waButtons.length >= 3) return;
    const newIdx = waButtons.length + 1;
    setWaButtons([
      ...waButtons,
      {
        id: `btn_option_${newIdx}`,
        title: `Option ${newIdx}`,
        reply_text: `Thank you for selecting Option ${newIdx}! How else can we assist you?`,
      },
    ]);
  };

  const handleRemoveButton = (index: number) => {
    if (waButtons.length <= 1) return;
    setWaButtons(waButtons.filter((_, i) => i !== index));
  };

  const handleUpdateButton = (index: number, field: keyof WhatsAppReplyButtonConfig, val: string) => {
    setWaButtons((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: val } : b))
    );
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleError("");

    if (!name.trim()) {
      setRuleError("Responder name is required.");
      return;
    }

    if (responseType === "interactive_buttons") {
      for (const btn of waButtons) {
        if (!btn.title.trim()) {
          setRuleError("All button titles are required.");
          return;
        }
        if (btn.title.trim().length > 20) {
          setRuleError(`Button title "${btn.title}" exceeds Meta's 20 character limit.`);
          return;
        }
        if (!btn.reply_text.trim()) {
          setRuleError(`Please provide response copy for button "${btn.title}".`);
          return;
        }
      }
    }

    try {
      setRuleSubmitting(true);
      const payload: any = {
        name: name.trim(),
        platform: "whatsapp",
        trigger_type: "keyword",
        target_post_id: "all",
        keywords: keywords.split(",").map((k) => k.trim().toUpperCase()).filter(Boolean),
        match_type: matchType,
        public_reply_variants: [],
        dm_message: replyMessage.trim(),
        social_account_id: whatsappAccount?.id || null,
        is_active: true,
      };

      if (responseType === "interactive_buttons") {
        payload.wa_buttons = waButtons;
      }

      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create responder");
      }

      if (data.rule) {
        setRules([data.rule, ...rules]);
      } else {
        fetchRules();
      }

      setShowModal(false);
      setName("");
    } catch (err: any) {
      setRuleError(err.message || "Failed to create responder");
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSending(true);
    setTestStatus(null);

    if (!whatsappAccount) {
      setTestStatus({
        error: "No WhatsApp Business account connected. Please connect your account first.",
      });
      setTestSending(false);
      return;
    }

    try {
      const res = await fetch("/api/accounts/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: whatsappAccount.id,
          recipientPhone: testPhone,
          messageText: testMsg,
          sendInteractiveMenu: testSendInteractive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus({
          success: true,
          messageId: data.messageId,
          isInteractive: data.isInteractive,
        });
      } else {
        setTestStatus({ error: data.error || "Failed to dispatch message via Meta Cloud API" });
      }
    } catch (err: any) {
      setTestStatus({ error: err.message || "Network error" });
    } finally {
      setTestSending(false);
    }
  };

  // Simulator actions
  const handleSimButtonClick = (btn: WhatsAppReplyButtonConfig) => {
    if (simTyping) return;
    setSimMessages((prev) => [...prev, { sender: "user", text: btn.title }]);
    setSimTyping(true);
    setSimFollowUpNotice(false);

    setTimeout(() => {
      setSimTyping(false);
      setSimMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: btn.reply_text,
        },
      ]);
      setSimFollowUpNotice(true);
    }, 800);
  };

  const handleResetSim = () => {
    setSimMessages([
      { sender: "user", text: "Hi, I'd like some info!" },
      {
        sender: "bot",
        text: JASPERS_MARKET_TEMPLATE.replyMessage,
        buttons: JASPERS_MARKET_TEMPLATE.buttons,
      },
    ]);
    setSimTyping(false);
    setSimFollowUpNotice(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ==================================================================== */}
      {/* 1. MERGED WHATSAPP ACCOUNT CONNECTION BANNER & WEBHOOK STATUS         */}
      {/* ==================================================================== */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">WhatsApp Business Suite</h1>
                {whatsappAccount ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    Live & Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {whatsappAccount
                  ? `Active Phone ID: ${whatsappAccount.account_id} • ${whatsappAccount.account_name || "WhatsApp Number"}`
                  : "Connect your Meta Cloud API Phone Number ID to enable 24-hour instant auto-replies."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {whatsappAccount ? (
              <>
                <button
                  onClick={() => {
                    setTestStatus(null);
                    setTestModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Message</span>
                </button>
                <button
                  onClick={() => setConnectModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Update Token</span>
                </button>
                <button
                  onClick={handleDisconnectWhatsApp}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Disconnect WhatsApp"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setConnectModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Connect WhatsApp Business</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Webhook URL & Verify Token info */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase font-sans font-semibold text-[10px]">Callback URL:</span>
              <span className="text-emerald-300 truncate max-w-[220px] sm:max-w-none">{webhookUrl}</span>
              <button onClick={() => handleCopy(webhookUrl, "url")} className="hover:text-white transition-colors">
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase font-sans font-semibold text-[10px]">Verify Token:</span>
              <span className="text-emerald-300">{verifyToken}</span>
              <button onClick={() => handleCopy(verifyToken, "token")} className="hover:text-white transition-colors">
                {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
              </button>
            </div>
          </div>

          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            <span>Meta App Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. STATS ROW                                                         */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Responders
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {rules.filter((r) => r.is_active).length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {rules.length} Total Configured
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            WhatsApp Status
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
            {whatsappAccount ? "Live" : "Inactive"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {whatsappAccount ? "Cloud API Active" : "Action Required"}
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Customer Care Window
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 mt-1">24 Hours</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5" />
            Zero-Cost Policy
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Free Tier Quota
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">1,000 / mo</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Meta Service Conversations
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. JASPER'S MARKET META-APPROVED FLOW & SMARTPHONE SIMULATOR         */}
      {/* ==================================================================== */}
      <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Meta Approved Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">Jasper&apos;s Market Pattern</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Interactive Quick-Reply WhatsApp Automation
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Based on Meta&apos;s reference implementation: uses instant typing indicators, native clickable reply buttons, limited-time promo code distribution, and Inngest serverless follow-up scheduling with zero Redis hosting costs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                handleLoadJaspersTemplate();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Deploy Jasper Flow</span>
            </button>
            <button
              onClick={handleResetSim}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset Smartphone Simulator"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column: Feature Highlights & Interactive Smartphone Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 4 Architecture Pillars */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1. Natural Human Typing Indicator</span>
              </div>
              <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                Sends a Meta Cloud API <code className="text-emerald-300 font-mono">typing_indicator</code> and marks the customer message as read immediately. Customers see &quot;typing...&quot; before receiving the response.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                <Layers className="w-4 h-4 text-teal-400 shrink-0" />
                <span>2. Interactive Quick-Reply Buttons (Up to 3)</span>
              </div>
              <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                Dispatches native interactive button messages (<code className="text-teal-300 font-mono">type: &quot;button&quot;</code>). No typing needed on mobile: customers tap a button to navigate options instantly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                <span>3. Dynamic Voucher & Promo Distribution</span>
              </div>
              <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                Delivers personalized discount codes (<code className="text-amber-300 font-mono">SALTY20</code>) with automatic contact profiling into Supabase CRM (<code className="text-slate-300 font-mono">choice:btn_promo</code>).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>4. Serverless Inngest Follow-Up Re-engagement</span>
              </div>
              <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                Replaces Jasper&apos;s Market Redis server with Inngest serverless event queue (<code className="text-cyan-300 font-mono">step.sleep(&quot;3m&quot;)</code>). Follows up automatically with zero infrastructure cost.
              </p>
            </div>
          </div>

          {/* Right Column: Live Interactive Smartphone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] rounded-[32px] border-[6px] border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col font-sans">
              {/* WhatsApp Phone Header */}
              <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  SM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs truncate flex items-center gap-1">
                    <span>Salty Media Production</span>
                    <CheckCircle2 className="w-3 h-3 text-teal-300 inline shrink-0" />
                  </div>
                  <div className="text-[10px] text-emerald-200">
                    {simTyping ? (
                      <span className="font-semibold animate-pulse text-amber-300">typing...</span>
                    ) : (
                      "Official Business Account"
                    )}
                  </div>
                </div>
                <button onClick={handleResetSim} className="text-emerald-200 hover:text-white transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chat Canvas (WhatsApp Dark Pattern) */}
              <div className="bg-[#0b141a] p-3 space-y-3 min-h-[340px] max-h-[420px] overflow-y-auto text-xs flex flex-col justify-end">
                {/* Simulated message bubbles */}
                {simMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      m.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {m.sender === "user" ? (
                      <div className="bg-[#005c4b] text-white px-3 py-1.5 rounded-2xl rounded-tr-xs max-w-[85%] text-[11px] shadow-sm">
                        {m.text}
                      </div>
                    ) : (
                      <div className="max-w-[90%] space-y-1.5">
                        <div className="bg-[#202c33] text-slate-100 p-2.5 rounded-2xl rounded-tl-xs text-[11px] leading-relaxed whitespace-pre-line shadow-sm border border-slate-700/30">
                          {m.text}
                        </div>

                        {/* Interactive Buttons (if any) */}
                        {m.buttons && m.buttons.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {m.buttons.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => handleSimButtonClick(b)}
                                disabled={simTyping}
                                className="w-full text-center py-2 px-3 rounded-xl bg-[#202c33] hover:bg-[#2a3942] active:bg-[#005c4b] text-[#53bdeb] hover:text-white font-medium text-[11px] transition-all border border-slate-700/60 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <span>{b.title}</span>
                                <ChevronRight className="w-3 h-3 opacity-60" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing animation bubble */}
                {simTyping && (
                  <div className="flex items-center gap-1.5 bg-[#202c33] text-emerald-400 px-3 py-2 rounded-2xl rounded-tl-xs max-w-[80px] shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}

                {/* Follow-up scheduler simulation tag */}
                {simFollowUpNotice && (
                  <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 shrink-0 text-cyan-400" />
                    <span>Inngest Queue: 3-min follow-up scheduled ($0 cost)</span>
                  </div>
                )}
              </div>

              {/* Bottom Simulator Bar */}
              <div className="bg-[#202c33] px-3 py-2 border-t border-slate-800 text-center text-[10px] text-slate-400">
                Tap buttons above to simulate live WhatsApp interaction
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. REAL RESPONDERS LIST                                              */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            WhatsApp Responders & Workflows {rules.length > 0 && `(${rules.length})`}
          </h2>
          <button
            onClick={() => {
              setRuleError("");
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New WhatsApp Responder</span>
          </button>
        </div>

        {loadingRules ? (
          <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm">Loading responders from database...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl border border-dashed border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No WhatsApp Responders Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Create your first automated WhatsApp responder bot. When customers message your WhatsApp business number with inquiries or keywords, Salty Auto will instantly qualify them and reply within seconds.
              </p>
            </div>
            <button
              onClick={() => {
                handleLoadJaspersTemplate();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Deploy Jasper&apos;s Market Template</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {rules.map((rule) => {
              const config = parseRuleConfig(rule.dm_message);
              const hasWaButtons = config.wa_buttons && config.wa_buttons.length > 0;

              return (
                <div
                  key={rule.id}
                  className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-5 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        WhatsApp Cloud API
                      </span>
                      {hasWaButtons ? (
                        <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          Jasper&apos;s Interactive Flow ({config.wa_buttons?.length} Buttons)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Text Reply
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-400">
                        Match: {rule.match_type}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          rule.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                        }`}
                      />
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white">{rule.name}</h3>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400">Trigger Keywords:</span>
                      {rule.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>

                    {/* Body message preview */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 space-y-3">
                      <div className="flex items-start gap-2">
                        <Send className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="whitespace-pre-line leading-relaxed font-sans">
                          {config.dm_message}
                        </div>
                      </div>

                      {/* Display Buttons if configured */}
                      {hasWaButtons && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-2">
                          <div className="text-[11px] font-semibold text-teal-400 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Interactive Quick-Reply Buttons:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {config.wa_buttons?.map((b) => (
                              <div
                                key={b.id}
                                className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1"
                              >
                                <div className="font-semibold text-white flex items-center justify-between">
                                  <span>{b.title}</span>
                                  <span className="text-[9px] font-mono text-emerald-400">
                                    {b.id}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                                  {b.reply_text}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.is_active)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        rule.is_active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {rule.is_active ? "● Active & Live" : "○ Paused"}
                    </button>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Responder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. DEDICATED WHATSAPP ACCOUNT CONNECTION MODAL                       */}
      {/* ==================================================================== */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-600/30">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Connect WhatsApp Business</h3>
                  <p className="text-xs text-emerald-400">Meta WhatsApp Cloud API Integration</p>
                </div>
              </div>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectWhatsApp} className="space-y-4">
              {waError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{waError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Phone / Business Label
                </label>
                <input
                  type="text"
                  value={waDisplayName}
                  onChange={(e) => setWaDisplayName(e.target.value)}
                  placeholder="e.g. Salty Media Support (+91 98811 20025)"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp Phone Number ID
                  <span className="text-emerald-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={waPhoneNumberId}
                  onChange={(e) => setWaPhoneNumberId(e.target.value)}
                  placeholder="e.g. 105938481234567"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Found in Meta Developer App under <strong>WhatsApp → API Setup → Phone Number ID</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Permanent System User Token
                  <span className="text-emerald-400 ml-1">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={waAccessToken}
                  onChange={(e) => setWaAccessToken(e.target.value)}
                  placeholder="EAAG... (Paste permanent System User token with whatsapp_business_messaging permissions)"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={waSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {waSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting WhatsApp...</span>
                    </>
                  ) : (
                    <span>Save & Connect WhatsApp</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. CREATE WHATSAPP RESPONDER MODAL (WITH JASPER'S BUILDER)           */}
      {/* ==================================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  Configure WhatsApp Automation
                </h3>
                <p className="text-xs text-slate-400">
                  Build single text replies or Jasper&apos;s Market interactive quick-reply flows.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {ruleError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ruleError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRule} className="space-y-5">
              {/* Preset Loader Banner */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Load Meta-approved Jasper&apos;s Market Template (Services, Showreel & 20% Voucher)</span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadJaspersTemplate}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shrink-0 transition-colors"
                >
                  Apply Preset
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Responder Name / Campaign
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lead Qualification Bot"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Keywords (Comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="PRICING, QUOTE, HI"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Match Type
                  </label>
                  <select
                    value={matchType}
                    onChange={(e: any) => setMatchType(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="contains">Contains (Broad)</option>
                    <option value="exact">Exact Word Match</option>
                  </select>
                </div>
              </div>

              {/* Response Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Response Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResponseType("interactive_buttons")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      responseType === "interactive_buttons"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Interactive Buttons</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Jasper&apos;s Market Quick-Reply Buttons (Up to 3, Recommended)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResponseType("text")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      responseType === "text"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      <span>Plain Text Reply</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Simple automated text response without buttons
                    </p>
                  </button>
                </div>
              </div>

              {/* Welcome / Header Copy */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {responseType === "interactive_buttons"
                    ? "Welcome Message (Header Body)"
                    : "Automated Reply Message Body"}
                </label>
                <textarea
                  rows={3}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write your WhatsApp message copy here..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Interactive Buttons Sub-Builder */}
              {responseType === "interactive_buttons" && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>Configure Quick-Reply Buttons ({waButtons.length}/3)</span>
                    </div>
                    {waButtons.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddButton}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Button</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 pt-1">
                    {waButtons.map((btn, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              Button {idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono ${
                                btn.title.length > 20 ? "text-rose-400 font-bold" : "text-slate-400"
                              }`}
                            >
                              {btn.title.length}/20 chars
                            </span>
                            {waButtons.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveButton(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">
                              Button Label (Max 20 Chars)
                            </label>
                            <input
                              type="text"
                              maxLength={20}
                              required
                              value={btn.title}
                              onChange={(e) => handleUpdateButton(idx, "title", e.target.value)}
                              placeholder="e.g. Explore Services"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1">
                              Payload ID
                            </label>
                            <input
                              type="text"
                              required
                              value={btn.id}
                              onChange={(e) => handleUpdateButton(idx, "id", e.target.value)}
                              placeholder="btn_services"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">
                            Response Copy When Clicked
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={btn.reply_text}
                            onChange={(e) => handleUpdateButton(idx, "reply_text", e.target.value)}
                            placeholder="Write the bot response when this button is tapped..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ruleSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {ruleSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>Save & Activate Responder</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. LIVE WHATSAPP TEST MESSAGE MODAL (WITH INTERACTIVE TOGGLE)        */}
      {/* ==================================================================== */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                Live WhatsApp API Dispatch Test
              </h3>
              <button
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {testStatus && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  testStatus.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                {testStatus.success ? (
                  <>
                    <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <Check className="w-4 h-4" /> Message Delivered to Meta WhatsApp Cloud API!
                    </div>
                    {testStatus.isInteractive && (
                      <div className="text-[11px] text-teal-300 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Dispatched as Jasper&apos;s Market 3-Button Interactive Menu
                      </div>
                    )}
                    {testStatus.messageId && (
                      <div className="font-mono text-[11px] text-emerald-200/80">
                        Message ID: {testStatus.messageId}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="font-bold flex items-center gap-1.5 text-rose-400">
                      <AlertCircle className="w-4 h-4" /> Meta API Error:
                    </div>
                    <div>{testStatus.error}</div>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Recipient Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. +919881120025 or 919881120025"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Interactive Menu Test Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testSendInteractive}
                  onChange={(e) => setTestSendInteractive(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Send Jasper&apos;s Market Interactive Buttons Menu
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Dispatches native Meta interactive reply buttons directly to your phone so you can tap them live.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Message Copy / Header Body
                </label>
                <textarea
                  rows={3}
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={testSending || !testPhone}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {testSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching via Meta API...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
