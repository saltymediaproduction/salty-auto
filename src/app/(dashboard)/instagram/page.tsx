"use client";

import { useState } from "react";
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
} from "lucide-react";
import { parseRuleConfig, serializeRuleConfig, AutomationButton } from "@/lib/automation/rules";

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
  metrics: {
    triggers: number;
    dms_sent: number;
    link_clicks?: number;
  };
}

export default function InstagramSuitePage() {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: "rule-1",
      name: "Viral Reel Free Masterclass Funnel",
      platform: "instagram",
      trigger_type: "comment",
      target_post_id: "all",
      keywords: ["PRICE", "LINK", "CLASS", "FREE"],
      match_type: "contains",
      public_reply_variants: [
        "Sent you a DM with your VIP link! 🚀",
        "Check your inbox for the masterclass pass! 📩",
        "Just messaged you the details! ✨",
      ],
      dm_message: serializeRuleConfig({
        dm_message: "Hey {username}! Thanks for commenting. Tap the button below to join the free workshop:",
        buttons: [
          { title: "Claim Free Pass", url: "https://saltymediaproduction.com/courses" },
          { title: "View Schedule", url: "https://saltymediaproduction.com/workshops" },
        ],
        require_follow: true,
        follow_prompt_message: "Hey {username}! Make sure you are following @saltymedia, then tap below to unlock your masterclass ticket: 🎁",
        follow_prompt_button_label: "I'm Following! Unlock Ticket",
        whole_word_match: true,
      }),
      is_active: true,
      metrics: {
        triggers: 184,
        dms_sent: 184,
        link_clicks: 129,
      },
    },
    {
      id: "rule-2",
      name: "WhatsApp Pricing & Consultation Bot",
      platform: "whatsapp",
      trigger_type: "keyword",
      target_post_id: "all",
      keywords: ["CONSULTATION", "PRICING", "HI", "HELLO"],
      match_type: "contains",
      public_reply_variants: [],
      dm_message:
        "Hello {name}! Thanks for contacting Salty Media. What kind of production or marketing services are you looking for today?",
      is_active: true,
      metrics: {
        triggers: 89,
        dms_sent: 89,
        link_clicks: 0,
      },
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<"dm" | "follow_gate">("dm");

  // Form State
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"instagram" | "whatsapp">("instagram");
  const [keywords, setKeywords] = useState("LINK, GUIDE, VIP");
  const [matchType, setMatchType] = useState<"contains" | "exact">("contains");
  const [wholeWordMatch, setWholeWordMatch] = useState(true);
  const [targetPostId, setTargetPostId] = useState("all");
  const [attachNextReel, setAttachNextReel] = useState(false);
  const [publicReplies, setPublicReplies] = useState(
    "Sent you a DM! 🚀\nCheck your inbox! 📩\nDetails sent! ✨"
  );
  const [dmMessage, setDmMessage] = useState(
    "Hey {username}! Here is the direct link you requested:"
  );

  // OpenReply-grade feature states
  const [requireFollow, setRequireFollow] = useState(false);
  const [followPromptMessage, setFollowPromptMessage] = useState(
    "Hey {username}! Follow @saltymedia and tap below to unlock your link: 🎁"
  );
  const [followButtonLabel, setFollowButtonLabel] = useState("I'm Following! Unlock Link");
  const [buttons, setButtons] = useState<AutomationButton[]>([
    { title: "Get Instant Access", url: "https://saltymediaproduction.com" },
  ]);

  const handleAddButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, { title: "Explore Services", url: "https://saltymediaproduction.com" }]);
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index: number, field: keyof AutomationButton, value: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();

    const serializedDm = serializeRuleConfig({
      dm_message: dmMessage,
      buttons: platform === "instagram" ? buttons : [],
      require_follow: platform === "instagram" && requireFollow,
      follow_prompt_message: followPromptMessage,
      follow_prompt_button_label: followButtonLabel,
      pending_next_reel: attachNextReel,
      whole_word_match: wholeWordMatch,
    });

    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: name || "Untitled Automation",
      platform,
      trigger_type: platform === "instagram" ? "comment" : "keyword",
      target_post_id: attachNextReel ? "next_reel" : targetPostId,
      keywords: keywords.split(",").map((k) => k.trim().toUpperCase()),
      match_type: matchType,
      public_reply_variants: publicReplies
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      dm_message: serializedDm,
      is_active: true,
      metrics: {
        triggers: 0,
        dms_sent: 0,
        link_clicks: 0,
      },
    };

    setRules([newRule, ...rules]);
    setShowModal(false);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-indigo-400" />
            Social Automation Funnels
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Instagram Comment-to-DM, Button Templates, Follow-Gating & Tracked Links.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Automation</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Comments Processed
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">273</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Ingested
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Automated DMs Dispatched
          </div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">273</div>
          <div className="text-xs text-slate-400 mt-1">
            Meta Button Templates
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tracked Link Clicks
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">129</div>
          <div className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            47.2% CTR Conversion
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Anti-Ban Safety Guard
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">Active</div>
          <div className="text-xs text-slate-400 mt-1">
            750 DMs/hr rate limit + Jitter
          </div>
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Active Automations</h2>

        <div className="grid gap-4">
          {rules.map((rule) => {
            const config = parseRuleConfig(rule.dm_message);
            const hasButtons = config.buttons && config.buttons.length > 0;

            return (
              <div
                key={rule.id}
                className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                        rule.platform === "instagram"
                          ? "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {rule.platform}
                    </span>

                    {config.require_follow && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        Follow-Gated
                      </span>
                    )}

                    {config.pending_next_reel && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">
                        <Video className="w-3 h-3" />
                        Next Reel
                      </span>
                    )}

                    <span className="text-xs font-mono text-slate-400">
                      Trigger: {rule.trigger_type}
                    </span>

                    <span
                      className={`w-2 h-2 rounded-full ${
                        rule.is_active ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                      }`}
                    />
                  </div>

                  <h3 className="text-lg font-bold text-white">{rule.name}</h3>

                  {/* Keywords badge row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400">Keywords:</span>
                    {rule.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-indigo-300"
                      >
                        {kw}
                      </span>
                    ))}
                    <span className="text-xs text-slate-500 ml-2">
                      ({config.whole_word_match ? "Whole Word" : "Contains"})
                    </span>
                  </div>

                  {/* DM Preview with Buttons */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex items-start gap-2">
                      <Send className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="font-sans line-clamp-2 text-slate-200">
                        {config.dm_message}
                      </div>
                    </div>

                    {hasButtons && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                        {config.buttons.map((btn, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                          >
                            <LinkIcon className="w-3 h-3 text-indigo-400" />
                            <span>{btn.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action column */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-800">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      rule.is_active
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {rule.is_active ? "Active" : "Paused"}
                  </button>

                  <div className="text-xs text-slate-400 font-mono text-right">
                    <div>{rule.metrics.dms_sent} DMs sent</div>
                    {rule.metrics.link_clicks ? (
                      <div className="text-amber-400">{rule.metrics.link_clicks} Clicks</div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Rule Modal with Live iPhone Preview */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="glass-card max-w-4xl w-full p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Build Comment-to-DM Campaign
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Controls (Left Column) */}
              <form onSubmit={handleCreateRule} className="lg:col-span-7 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Video Course Drop"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Platform
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Trigger Post Target
                    </label>
                    <select
                      value={attachNextReel ? "next_reel" : targetPostId}
                      onChange={(e) => {
                        if (e.target.value === "next_reel") {
                          setAttachNextReel(true);
                          setTargetPostId("next_reel");
                        } else {
                          setAttachNextReel(false);
                          setTargetPostId(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Posts & Reels</option>
                      <option value="next_reel">Attach to Next Reel Published</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trigger Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LINK, GUIDE, VIP, 08"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="wholeWord"
                      checked={wholeWordMatch}
                      onChange={(e) => setWholeWordMatch(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="wholeWord" className="text-xs text-slate-400 cursor-pointer">
                      Enforce whole-word boundary (prevents "WIN" matching "WINTER")
                    </label>
                  </div>
                </div>

                {/* Follow Gate Toggle */}
                {platform === "instagram" && (
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-semibold text-white">
                          Require Follower Verification (Follow-Gate)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireFollow}
                        onChange={(e) => setRequireFollow(e.target.checked)}
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    {requireFollow && (
                      <div className="space-y-3 pt-2 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1">Follow Prompt DM Message</label>
                          <textarea
                            rows={2}
                            value={followPromptMessage}
                            onChange={(e) => setFollowPromptMessage(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Verification Button Title</label>
                          <input
                            type="text"
                            value={followButtonLabel}
                            onChange={(e) => setFollowButtonLabel(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Message Copy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Direct Message Copy (supports &#123;username&#125;)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* Button Templates (Instagram only) */}
                {platform === "instagram" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-300">
                        Interactive DM Buttons (Tracked Links, max 3)
                      </label>
                      {buttons.length < 3 && (
                        <button
                          type="button"
                          onClick={handleAddButton}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Button
                        </button>
                      )}
                    </div>

                    {buttons.map((btn, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Button Title (max 20 chars)"
                          maxLength={20}
                          value={btn.title}
                          onChange={(e) => handleButtonChange(index, "title", e.target.value)}
                          className="w-1/3 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="url"
                          placeholder="Destination URL (https://...)"
                          value={btn.url}
                          onChange={(e) => handleButtonChange(index, "url", e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveButton(index)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Randomized Public Reply Variants */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Randomized Public Replies (anti-bot protection)
                  </label>
                  <textarea
                    rows={2}
                    value={publicReplies}
                    onChange={(e) => setPublicReplies(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/30"
                  >
                    Save & Launch Campaign
                  </button>
                </div>
              </form>

              {/* Live Smartphone DM Preview (Right Column) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="w-full max-w-[320px] rounded-[38px] p-4 bg-slate-950 border-4 border-slate-800 shadow-2xl">
                  {/* Phone Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-4" />

                  {/* Header Bar */}
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
                        SM
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        saltymedia
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">Active now</div>
                    </div>
                  </div>

                  {/* Preview Selector Switch */}
                  {requireFollow && (
                    <div className="flex p-1 mt-3 bg-slate-900 rounded-lg text-[10px] font-medium text-slate-400">
                      <button
                        type="button"
                        onClick={() => setPreviewTab("follow_gate")}
                        className={`flex-1 py-1 rounded-md transition-all ${
                          previewTab === "follow_gate" ? "bg-indigo-600 text-white font-bold" : ""
                        }`}
                      >
                        1. Follow Gate
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab("dm")}
                        className={`flex-1 py-1 rounded-md transition-all ${
                          previewTab === "dm" ? "bg-indigo-600 text-white font-bold" : ""
                        }`}
                      >
                        2. Reveal DM
                      </button>
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className="py-6 space-y-3 min-h-[260px] flex flex-col justify-end">
                    {requireFollow && previewTab === "follow_gate" ? (
                      /* Follow Gate Preview Bubble */
                      <div className="space-y-1.5">
                        <div className="p-3.5 rounded-2xl rounded-bl-sm bg-slate-800/90 text-xs text-white shadow-md">
                          {followPromptMessage.replace(/\{username\}/gi, "@sarah_creator")}
                        </div>
                        <div className="p-2 rounded-xl bg-purple-600 text-center text-xs font-semibold text-white shadow-sm cursor-pointer hover:bg-purple-500 transition-all">
                          {followButtonLabel}
                        </div>
                      </div>
                    ) : (
                      /* Final Direct Message & Buttons Bubble */
                      <div className="space-y-1.5">
                        <div className="p-3.5 rounded-2xl rounded-bl-sm bg-slate-800/90 text-xs text-white shadow-md">
                          {dmMessage.replace(/\{username\}/gi, "@sarah_creator")}
                        </div>
                        {buttons.map((b, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-xs font-medium text-indigo-400 shadow-sm cursor-pointer hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {b.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phone Bottom Pill */}
                  <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
                </div>
                <div className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Live Instagram DM Mobile Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
