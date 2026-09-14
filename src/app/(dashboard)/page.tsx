"use client";

import { useState } from "react";
import {
  Zap,
  Plus,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  MoreVertical,
  Sliders,
  Sparkles,
} from "lucide-react";

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
  };
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: "rule-1",
      name: "Viral Reel Lead Magnet Giveaway",
      platform: "instagram",
      trigger_type: "comment",
      target_post_id: "all",
      keywords: ["PRICE", "LINK", "GUIDE", "FREE"],
      match_type: "contains",
      public_reply_variants: [
        "Sent you a DM with the link! 🚀",
        "Check your inbox for the free guide! 📩",
        "Just messaged you the details! ✨",
      ],
      dm_message:
        "Hey {username}! Thanks for reaching out. Here is your direct link: https://saltymediaproduction.com/guide",
      is_active: true,
      metrics: {
        triggers: 142,
        dms_sent: 142,
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
      },
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    platform: "instagram",
    keywords: "LINK, GUIDE, INFO",
    match_type: "contains" as "contains" | "exact",
    publicReplies: "Sent you a DM! 🚀\nCheck your inbox! 📩\nDetails sent! ✨",
    dmMessage: "Hey {username}! Here is the direct link you requested: https://saltymediaproduction.com",
    targetPostId: "all",
  });

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();

    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: formData.name || "Untitled Automation",
      platform: formData.platform,
      trigger_type: formData.platform === "instagram" ? "comment" : "keyword",
      target_post_id: formData.targetPostId,
      keywords: formData.keywords.split(",").map((k) => k.trim().toUpperCase()),
      match_type: formData.match_type,
      public_reply_variants: formData.publicReplies
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      dm_message: formData.dmMessage,
      is_active: true,
      metrics: {
        triggers: 0,
        dms_sent: 0,
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
            Social Automation Rules
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure automated Instagram Comment-to-DM workflows and WhatsApp auto-responders.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Rule</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Comments Processed
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">231</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Delivery Rate
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Automated DMs Dispatched
          </div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">231</div>
          <div className="text-xs text-slate-400 mt-1">
            Sub-50ms queue ingestion
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Anti-Ban Protection
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">Active</div>
          <div className="text-xs text-slate-400 mt-1">
            3 DMs/sec rate limit + Jitter
          </div>
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Active Automations</h2>

        <div className="grid gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                      rule.platform === "instagram"
                        ? "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {rule.platform}
                  </span>

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
                    (Match: {rule.match_type})
                  </span>
                </div>

                {/* DM Preview */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <Send className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="font-mono line-clamp-2">{rule.dm_message}</div>
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
                  {rule.is_active ? "Running" : "Paused"}
                </button>

                <div className="text-xs text-slate-400 font-mono">
                  {rule.metrics.dms_sent} DMs sent
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-xl w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Create Comment-to-DM Funnel
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Masterclass Giveaway"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({ ...formData, platform: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Match Type
                  </label>
                  <select
                    value={formData.match_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        match_type: e.target.value as "contains" | "exact",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="contains">Contains Keyword</option>
                    <option value="exact">Exact Match</option>
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
                  placeholder="PRICE, LINK, GUIDE, BOOK"
                  value={formData.keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Randomized Public Reply Variants (one per line)
                </label>
                <textarea
                  rows={2}
                  value={formData.publicReplies}
                  onChange={(e) =>
                    setFormData({ ...formData, publicReplies: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Direct Message Text (supports &#123;username&#125;)
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.dmMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, dmMessage: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
