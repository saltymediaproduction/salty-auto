"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  CheckCircle2,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Video,
  Smartphone,
  Trash2,
  Eye,
  Link as LinkIcon,
  Instagram,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Key,
  Radio,
  RefreshCw,
  Power,
  Play,
  Image as ImageIcon,
  Film,
  Search,
  Activity,
  History,
  Clock,
  ChevronRight,
  Layers,
} from "lucide-react";
import { parseRuleConfig, serializeRuleConfig, AutomationButton } from "@/lib/automation/rules";

interface SocialAccount {
  id: string;
  platform: "instagram" | "whatsapp";
  account_id: string;
  account_name: string | null;
  status: string;
  created_at: string;
}

interface Rule {
  id: string;
  name: string;
  platform: string;
  trigger_type: string;
  target_post_id: string;
  keywords: string[];
  match_type: "contains" | "exact";
  public_reply_variants: string[];
  dm_message: string;
  is_active: boolean;
  metrics?: {
    triggers?: number;
    dms_sent?: number;
    link_clicks?: number;
  };
}

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "REELS" | "FEED";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

interface ActivityLog {
  id: string;
  platform: string;
  status: string;
  source_id: string;
  error_message?: string;
  created_at: string;
  rule?: { id: string; name: string };
  contact?: { id: string; name: string; instagram_username?: string };
}

export default function InstagramSuitePage() {
  // Account state
  const [instagramAccount, setInstagramAccount] = useState<SocialAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [igUsername, setIgUsername] = useState("");
  const [igAccountId, setIgAccountId] = useState("");
  const [igAccessToken, setIgAccessToken] = useState("");
  const [igSubmitting, setIgSubmitting] = useState(false);
  const [igError, setIgError] = useState("");

  // Tab View state
  const [activeTab, setActiveTab] = useState<"automations" | "logs">("automations");

  // Rules state (Real Supabase persistence)
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<"dm" | "follow_gate" | "opening_dm">("dm");
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [ruleError, setRuleError] = useState("");

  // Post Picker State (OpenReply Feature)
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [targetingMode, setTargetingMode] = useState<"specific" | "all" | "next_reel">("specific");
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [manualPostId, setManualPostId] = useState("");

  // Activity Logs state
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Webhook copy states
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("LINK, PRICE, VIP, ACCESS");
  const [matchType, setMatchType] = useState<"contains" | "exact">("contains");
  const [wholeWordMatch, setWholeWordMatch] = useState(true);

  // Multi-variation Public Reply Comments
  const [publicReplyVariants, setPublicReplyVariants] = useState<string[]>([
    "Sent you a DM with the link! 🚀",
    "Check your direct messages! 📩",
    "Sent to your inbox! ✨",
  ]);

  // DM Message Copy
  const [dmMessage, setDmMessage] = useState(
    "Hey {username}! Thanks for checking out our post. Tap below to access your link:"
  );

  // Opening DM / 2-Step Opt-in state (OpenReply Feature)
  const [openingDmEnabled, setOpeningDmEnabled] = useState(false);
  const [openingDmMessage, setOpeningDmMessage] = useState(
    "Hey {username}! Tap below to get your exclusive access link 🚀"
  );
  const [openingDmButtonLabel, setOpeningDmButtonLabel] = useState("Send me the link!");

  // Follow-Gate Feature states
  const [requireFollow, setRequireFollow] = useState(false);
  const [followPromptMessage, setFollowPromptMessage] = useState(
    "Hey {username}! Make sure you're following us, then tap below to unlock your link: 🎁"
  );
  const [followButtonLabel, setFollowButtonLabel] = useState("I'm Following! Unlock Link");
  const [buttons, setButtons] = useState<AutomationButton[]>([
    { title: "Get Instant Access", url: "https://saltymediaproduction.com" },
  ]);

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
        const found = data.accounts.find((a: SocialAccount) => a.platform === "instagram");
        setInstagramAccount(found || null);
        if (found) {
          fetchPosts();
        }
      }
    } catch (err) {
      console.error("Failed to load Instagram account", err);
    } finally {
      setLoadingAccount(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch("/api/instagram/posts?limit=60");
      const data = await res.json();
      if (res.ok && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to load Instagram posts", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchRules = async () => {
    try {
      setLoadingRules(true);
      const res = await fetch("/api/rules?platform=instagram");
      const data = await res.json();
      if (res.ok && data.rules) {
        setRules(data.rules);
      }
    } catch (err) {
      console.error("Failed to load Instagram rules", err);
    } finally {
      setLoadingRules(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/logs?platform=instagram&limit=50");
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load activity logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCopy = (text: string, type: "url" | "token" | "id") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === "token") {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleConnectInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIgError("");

    if (!igAccountId.trim() || !igAccessToken.trim()) {
      setIgError("Instagram Business Account ID and Access Token are required.");
      return;
    }

    try {
      setIgSubmitting(true);
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "instagram",
          accountId: igAccountId.trim(),
          accountName: igUsername.trim() || "Instagram Account",
          accessToken: igAccessToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save Instagram account");
      }

      setConnectModalOpen(false);
      setIgUsername("");
      setIgAccountId("");
      setIgAccessToken("");
      fetchAccount();
    } catch (err: any) {
      setIgError(err.message || "Failed to connect Instagram account");
    } finally {
      setIgSubmitting(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!instagramAccount) return;
    if (!confirm("Are you sure you want to disconnect this Instagram account?")) return;

    try {
      const res = await fetch(`/api/accounts?id=${instagramAccount.id}`, { method: "DELETE" });
      if (res.ok) {
        setInstagramAccount(null);
        setPosts([]);
      }
    } catch (err) {
      console.error("Failed to disconnect Instagram account", err);
    }
  };

  const handleAddButton = () => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { title: "Explore Link", url: "https://saltymediaproduction.com" }]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index: number, field: "title" | "url", value: string) => {
    const updated = [...buttons];
    updated[index][field] = value;
    setButtons(updated);
  };

  const handleAddPublicReply = () => {
    if (publicReplyVariants.length >= 6) return;
    setPublicReplyVariants([...publicReplyVariants, "Check your DM requests! 🚀"]);
  };

  const handleRemovePublicReply = (index: number) => {
    if (publicReplyVariants.length <= 1) return;
    setPublicReplyVariants(publicReplyVariants.filter((_, i) => i !== index));
  };

  const handleUpdatePublicReply = (index: number, val: string) => {
    const updated = [...publicReplyVariants];
    updated[index] = val;
    setPublicReplyVariants(updated);
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
    if (!confirm("Are you sure you want to delete this automation?")) return;

    try {
      const res = await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete rule", err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleError("");

    if (!name.trim()) {
      setRuleError("Automation title is required.");
      return;
    }

    let targetId = "all";
    let isNextReel = false;
    let postLink: string | undefined = undefined;

    if (targetingMode === "specific") {
      targetId = selectedPost?.id || manualPostId.trim() || "all";
      postLink = selectedPost?.permalink;
    } else if (targetingMode === "next_reel") {
      targetId = "next_reel";
      isNextReel = true;
    }

    const serializedDm = serializeRuleConfig({
      dm_message: dmMessage,
      buttons: buttons,
      require_follow: requireFollow,
      follow_prompt_message: followPromptMessage,
      follow_prompt_button_label: followButtonLabel,
      opening_dm_enabled: openingDmEnabled,
      opening_dm_message: openingDmMessage,
      opening_dm_button_label: openingDmButtonLabel,
      pending_next_reel: isNextReel,
      whole_word_match: wholeWordMatch,
      post_permalink: postLink,
    });

    try {
      setRuleSubmitting(true);
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          platform: "instagram",
          trigger_type: "comment",
          target_post_id: targetId,
          keywords: keywords.split(",").map((k) => k.trim().toUpperCase()).filter(Boolean),
          match_type: matchType,
          public_reply_variants: publicReplyVariants.map((r) => r.trim()).filter(Boolean),
          dm_message: serializedDm,
          social_account_id: instagramAccount?.id || null,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create rule");
      }

      if (data.rule) {
        setRules([data.rule, ...rules]);
      } else {
        fetchRules();
      }

      setShowModal(false);
      setName("");
      setSelectedPost(null);
    } catch (err: any) {
      setRuleError(err.message || "Failed to create automation rule");
    } finally {
      setRuleSubmitting(false);
    }
  };

  const filteredPosts = postSearchQuery.trim()
    ? posts.filter((p) =>
        (p.caption || "").toLowerCase().includes(postSearchQuery.trim().toLowerCase())
      )
    : posts;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ==================================================================== */}
      {/* 1. MERGED INSTAGRAM ACCOUNT CONNECTION BANNER & WEBHOOK STATUS        */}
      {/* ==================================================================== */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-pink-600/25 shrink-0">
              <Instagram className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Instagram Comment-to-DM Suite</h1>
                {instagramAccount ? (
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
                {instagramAccount
                  ? `Active Account: ${instagramAccount.account_name || "Instagram Business"} (${instagramAccount.account_id})`
                  : "Connect your Instagram Professional Account to start automating comments and DMs."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {instagramAccount ? (
              <>
                <button
                  onClick={() => fetchPosts()}
                  disabled={loadingPosts}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Refresh Posts Feed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${loadingPosts ? "animate-spin" : ""}`} />
                  <span>Sync Feed ({posts.length})</span>
                </button>
                <button
                  onClick={() => setConnectModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-pink-400" />
                  <span>Update Token</span>
                </button>
                <button
                  onClick={handleDisconnectInstagram}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Disconnect Instagram"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setConnectModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-pink-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Instagram</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Webhook URL & Verify Token info */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase font-sans font-semibold text-[10px]">Callback URL:</span>
              <span className="text-pink-300 truncate max-w-[220px] sm:max-w-none">{webhookUrl}</span>
              <button onClick={() => handleCopy(webhookUrl, "url")} className="hover:text-white transition-colors">
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase font-sans font-semibold text-[10px]">Verify Token:</span>
              <span className="text-pink-300">{verifyToken}</span>
              <button onClick={() => handleCopy(verifyToken, "token")} className="hover:text-white transition-colors">
                {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
              </button>
            </div>
          </div>

          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-medium transition-colors"
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
            Active Automations
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
            Feed Library
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-pink-400 mt-1">
            {posts.length > 0 ? `${posts.length} Posts` : instagramAccount ? "Synced" : "0"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Visual Reel Picker Ready
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Anti-Spam Protection
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">Active</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Random Comment Rotator
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Meta Hourly Quota
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">750 / hr</div>
          <div className="text-xs text-slate-400 mt-1">
            Official Graph API Limit
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABS: CAMPAIGNS VS ACTIVITY LOGS                                  */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("automations")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "automations"
                ? "bg-pink-600/20 text-pink-300 border border-pink-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4 text-pink-400" />
            <span>Active Campaigns ({rules.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("logs");
              fetchLogs();
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "logs"
                ? "bg-pink-600/20 text-pink-300 border border-pink-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Live Activity Logs</span>
          </button>
        </div>

        {activeTab === "automations" && (
          <button
            onClick={() => {
              setRuleError("");
              if (posts.length === 0 && instagramAccount) {
                fetchPosts();
              }
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-pink-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Automation</span>
          </button>
        )}

        {activeTab === "logs" && (
          <button
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${loadingLogs ? "animate-spin" : ""}`} />
            <span>Refresh Logs</span>
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. CONTENT: ACTIVE CAMPAIGNS                                         */}
      {/* ==================================================================== */}
      {activeTab === "automations" && (
        <div className="space-y-4">
          {loadingRules ? (
            <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-pink-500 mb-2" />
              <p className="text-sm">Loading automations from database...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="glass-card p-10 rounded-2xl border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">No Automations Created Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Create your first Comment-to-DM automation. Select a specific reel from your feed, define trigger keywords, and deliver instant links with follow-gating.
                </p>
              </div>
              <button
                onClick={() => {
                  setRuleError("");
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-medium text-xs transition-all shadow-md shadow-pink-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Automation</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => {
                const config = parseRuleConfig(rule.dm_message);
                const hasPostback = config.require_follow;
                const hasButtons = config.buttons && config.buttons.length > 0;
                const hasOpeningDm = config.opening_dm_enabled;

                return (
                  <div
                    key={rule.id}
                    className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-5 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                          {rule.target_post_id === "all"
                            ? "All Posts / Feed"
                            : rule.target_post_id === "next_reel"
                            ? "Next Reel (Auto)"
                            : `Post: ${rule.target_post_id.slice(0, 10)}...`}
                        </span>

                        {hasOpeningDm && (
                          <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            2-Step Icebreaker
                          </span>
                        )}

                        {hasPostback && (
                          <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Follow Gate
                          </span>
                        )}

                        {hasButtons && (
                          <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            {config.buttons.length} Buttons
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
                            className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-pink-300"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>

                      {/* Message Preview Box */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 space-y-2">
                        <div className="flex items-start gap-2">
                          <Send className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                          <div className="whitespace-pre-line leading-relaxed">
                            {config.dm_message}
                          </div>
                        </div>

                        {/* Button list */}
                        {hasButtons && (
                          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                            {config.buttons.map((b, i) => (
                              <a
                                key={i}
                                href={b.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-pink-300 text-[11px] font-medium"
                              >
                                <span>{b.title}</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rotating comment replies counter */}
                      {rule.public_reply_variants && rule.public_reply_variants.length > 0 && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{rule.public_reply_variants.length} rotating public comment replies active</span>
                        </div>
                      )}
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
                        title="Delete Automation"
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
      )}

      {/* ==================================================================== */}
      {/* 5. CONTENT: LIVE ACTIVITY LOGS                                       */}
      {/* ==================================================================== */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {loadingLogs ? (
            <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-pink-500 mb-2" />
              <p className="text-sm">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="glass-card p-10 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
              <History className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Activity Logs Yet</h3>
              <p className="text-xs text-slate-400">
                When people comment on your Instagram posts, automated reply events and delivery confirmations will appear here live.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Automation</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                          {log.contact?.instagram_username
                            ? `@${log.contact.instagram_username}`
                            : log.contact?.name || log.source_id.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3 text-pink-300 whitespace-nowrap">
                          {log.rule?.name || "Keyword Automation"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              log.status === "sent"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : log.status === "skipped"
                                ? "bg-slate-800 text-slate-400 border border-slate-700"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px] truncate max-w-xs">
                          {log.error_message || "Delivered successfully"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. OPENREPLY-GRADE CAMPAIGN BUILDER MODAL                            */}
      {/* ==================================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-pink-500/30 rounded-2xl w-full max-w-4xl p-5 sm:p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-pink-600/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Create Instagram Comment Automation
                  </h3>
                  <p className="text-xs text-slate-400">
                    OpenReply-grade engine with visual post picker, follow-gate, and rotating comment replies.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Configuration Form (7 cols) */}
              <form onSubmit={handleCreateRule} className="lg:col-span-7 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Automation Title / Campaign
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Masterclass Reel Free Pass Giveaway"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                {/* ======================================================== */}
                {/* OPENREPLY VISUAL POST PICKER & TARGETING SELECTOR       */}
                {/* ======================================================== */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-pink-400" />
                      Target Post or Reel (OpenReply Grid)
                    </span>
                    {instagramAccount && posts.length > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {posts.length} Posts Loaded
                      </span>
                    )}
                  </div>

                  {/* 3 Targeting Mode Pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetingMode("specific")}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                        targetingMode === "specific"
                          ? "bg-pink-500/15 border-pink-500 text-pink-300 font-semibold"
                          : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      Specific Post
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetingMode("all")}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                        targetingMode === "all"
                          ? "bg-pink-500/15 border-pink-500 text-pink-300 font-semibold"
                          : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      All Posts (Feed)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetingMode("next_reel")}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-medium transition-all ${
                        targetingMode === "next_reel"
                          ? "bg-pink-500/15 border-pink-500 text-pink-300 font-semibold"
                          : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      Next Reel (Auto)
                    </button>
                  </div>

                  {/* Visual Post Picker Grid when 'specific' is active */}
                  {targetingMode === "specific" && (
                    <div className="space-y-2.5 pt-1">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={postSearchQuery}
                          onChange={(e) => setPostSearchQuery(e.target.value)}
                          placeholder="Search your posts by caption..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      {loadingPosts ? (
                        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                          <span>Fetching your Instagram posts & reels...</span>
                        </div>
                      ) : posts.length === 0 ? (
                        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700 text-center space-y-2">
                          <p className="text-xs text-slate-400">
                            {instagramAccount
                              ? "No posts found or feed not yet synced."
                              : "Connect your Instagram account to pick from your live posts."}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            {instagramAccount && (
                              <button
                                type="button"
                                onClick={fetchPosts}
                                className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs"
                              >
                                Sync Feed Now
                              </button>
                            )}
                            <input
                              type="text"
                              value={manualPostId}
                              onChange={(e) => setManualPostId(e.target.value)}
                              placeholder="Or paste Meta Media ID manually"
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto p-1 rounded-lg border border-slate-800 bg-slate-900/50">
                          {filteredPosts.map((post) => {
                            const isSelected = selectedPost?.id === post.id;
                            const isReel =
                              post.media_product_type === "REELS" || post.media_type === "VIDEO";
                            const imgUrl = post.thumbnail_url || post.media_url;

                            return (
                              <button
                                key={post.id}
                                type="button"
                                onClick={() => setSelectedPost(post)}
                                className={`relative aspect-square rounded-xl overflow-hidden border-2 text-left group transition-all ${
                                  isSelected
                                    ? "border-pink-500 ring-2 ring-pink-500/40 shadow-lg"
                                    : "border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100"
                                }`}
                              >
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={post.caption || "Instagram Media"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                    <ImageIcon className="w-6 h-6" />
                                  </div>
                                )}

                                {/* Reel / Video Badge */}
                                {isReel && (
                                  <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-white shadow-sm">
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                  </div>
                                )}

                                {/* Selected Checkmark */}
                                {isSelected && (
                                  <div className="absolute inset-0 bg-pink-600/30 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  </div>
                                )}

                                {/* Caption tooltip / snippet */}
                                <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                  {post.caption || "No caption"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Selected post summary bar */}
                      {selectedPost && (
                        <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-between text-xs text-pink-300">
                          <div className="truncate max-w-[280px]">
                            Selected: <span className="font-semibold text-white">{selectedPost.caption?.slice(0, 35) || "Instagram Media"}...</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedPost(null)}
                            className="text-pink-400 hover:text-white text-xs"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {targetingMode === "next_reel" && (
                    <div className="p-2.5 rounded-lg bg-pink-950/30 border border-pink-500/30 text-xs text-pink-300">
                      Auto-Attachment Active: The automation will listen to your Meta webhooks and bind to the very next Reel you publish on Instagram.
                    </div>
                  )}
                </div>

                {/* Keywords & Match Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Trigger Keywords (Comma separated)
                    </label>
                    <input
                      type="text"
                      required
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="LINK, VIP, PRICE, COURSE"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Keyword Match Logic
                    </label>
                    <select
                      value={matchType}
                      onChange={(e: any) => setMatchType(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                    >
                      <option value="contains">Contains (Broad)</option>
                      <option value="exact">Exact Match</option>
                    </select>
                  </div>
                </div>

                {/* Multi-Variation Randomized Public Comment Replies */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Randomized Public Comment Replies
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Rotates randomly per comment to prevent Instagram spam flags.
                      </p>
                    </div>
                    {publicReplyVariants.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddPublicReply}
                        className="text-xs text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Variant
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    {publicReplyVariants.map((variant, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}.</span>
                        <input
                          type="text"
                          value={variant}
                          onChange={(e) => handleUpdatePublicReply(idx, e.target.value)}
                          placeholder="e.g. Sent you a DM! 🚀"
                          className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                        {publicReplyVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePublicReply(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2-Step Opening DM Icebreaker Toggle (OpenReply Feature) */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        2-Step Opening DM (Icebreaker Opt-In)
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Sends a quick prompt first; user tap guarantees deliverability & opens 24h window.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={openingDmEnabled}
                      onChange={(e) => setOpeningDmEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                    />
                  </div>

                  {openingDmEnabled && (
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-300 mb-1">
                          Opening Prompt Message
                        </label>
                        <input
                          type="text"
                          value={openingDmMessage}
                          onChange={(e) => setOpeningDmMessage(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-300 mb-1">
                          Opt-In Button Label
                        </label>
                        <input
                          type="text"
                          value={openingDmButtonLabel}
                          onChange={(e) => setOpeningDmButtonLabel(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Follow-Gate Verification Toggle */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        Require Follow Before Link Delivery
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Requires user to follow your account to receive the link.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireFollow}
                      onChange={(e) => setRequireFollow(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Main DM Copy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Main Delivery Message Copy
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    placeholder="Use {username} to personalize the DM..."
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                {/* Buttons builder */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-pink-400" />
                      Meta Interactive Buttons (Max 3)
                    </span>
                    {buttons.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddButton}
                        className="text-xs text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Button
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {buttons.map((btn, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={btn.title}
                          onChange={(e) => handleButtonChange(idx, "title", e.target.value)}
                          placeholder="Button Title (e.g. Claim Pass)"
                          className="w-1/3 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="url"
                          value={btn.url}
                          onChange={(e) => handleButtonChange(idx, "url", e.target.value)}
                          placeholder="https://yourlink.com"
                          className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                        {buttons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveButton(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit buttons */}
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
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-pink-600/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {ruleSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <span>Save & Activate Campaign</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Right Column: Smartphone DM Simulator Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-[320px] rounded-[32px] border-[6px] border-slate-800 bg-black shadow-2xl overflow-hidden flex flex-col">
                  {/* Top Bar */}
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                      SM
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-white truncate">
                        {instagramAccount?.account_name || "Salty Media"}
                      </div>
                      <div className="text-[10px] text-pink-400">Instagram Direct</div>
                    </div>
                  </div>

                  {/* Preview Mode Switcher */}
                  <div className="grid grid-cols-2 bg-slate-950 p-1 border-b border-slate-800 text-[10px] text-center">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("dm")}
                      className={`py-1 rounded-md transition-colors ${
                        previewTab === "dm"
                          ? "bg-slate-800 text-white font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      Main Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("opening_dm")}
                      className={`py-1 rounded-md transition-colors ${
                        previewTab === "opening_dm"
                          ? "bg-slate-800 text-white font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      Opening Opt-In
                    </button>
                  </div>

                  {/* Chat Preview Canvas */}
                  <div className="p-3 space-y-3 min-h-[300px] flex flex-col justify-end text-xs">
                    {previewTab === "opening_dm" ? (
                      <div className="space-y-2">
                        <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl rounded-tl-xs text-[11px] leading-relaxed border border-slate-800">
                          {openingDmMessage.replace(/\{username\}/gi, "@alex_creator")}
                        </div>
                        <div className="w-full py-2 px-3 rounded-xl bg-pink-600 text-white font-semibold text-[11px] text-center shadow-md">
                          {openingDmButtonLabel}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl rounded-tl-xs text-[11px] leading-relaxed border border-slate-800 whitespace-pre-line">
                          {dmMessage.replace(/\{username\}/gi, "@alex_creator")}
                        </div>
                        {buttons.map((b, i) => (
                          <div
                            key={i}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold text-[11px] text-center shadow-md truncate"
                          >
                            {b.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950 px-3 py-2 border-t border-slate-800 text-center text-[10px] text-slate-500">
                    Live Smartphone DM Rendering
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. DEDICATED INSTAGRAM ACCOUNT CONNECTION MODAL                      */}
      {/* ==================================================================== */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-pink-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl shadow-pink-950/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-pink-600/30">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Connect Instagram Account</h3>
                  <p className="text-xs text-pink-400">Meta Graph API Professional Suite</p>
                </div>
              </div>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectInstagram} className="space-y-4">
              {igError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{igError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instagram Handle / Account Name
                </label>
                <input
                  type="text"
                  value={igUsername}
                  onChange={(e) => setIgUsername(e.target.value)}
                  placeholder="e.g. @saltymediaproduction"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instagram Business Account ID
                  <span className="text-pink-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={igAccountId}
                  onChange={(e) => setIgAccountId(e.target.value)}
                  placeholder="e.g. 17841400000000000"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-pink-500 transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Found in Meta Developer App under <strong>Graph API Explorer</strong> or Connected Business Page.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Permanent System User Token
                  <span className="text-pink-400 ml-1">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={igAccessToken}
                  onChange={(e) => setIgAccessToken(e.target.value)}
                  placeholder="EAAG... (Paste permanent System User token with instagram_manage_comments, instagram_manage_messages permissions)"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-500 transition-colors"
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
                  disabled={igSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 text-white font-semibold text-xs transition-all shadow-md shadow-pink-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {igSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Save & Connect Instagram</span>
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
