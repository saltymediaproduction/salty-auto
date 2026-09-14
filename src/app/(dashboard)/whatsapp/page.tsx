"use client";

import { useState } from "react";
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
} from "lucide-react";

interface WhatsAppRule {
  id: string;
  name: string;
  phone_number_id: string;
  keywords: string[];
  match_type: "contains" | "exact";
  reply_message: string;
  is_active: boolean;
  metrics: {
    inbound_count: number;
    replies_sent: number;
  };
}

export default function WhatsAppDashboardPage() {
  const [rules, setRules] = useState<WhatsAppRule[]>([
    {
      id: "wa-1",
      name: "Lead Qualification & Pricing Bot",
      phone_number_id: "default",
      keywords: ["PRICE", "PRICING", "COST", "PACKAGES"],
      match_type: "contains",
      reply_message:
        "Hi {name}! 🌟 Thanks for reaching out to Salty Media Production. Our packages start at ₹15,000 for monthly creative retainer. Would you like us to send the full service brochure or schedule a quick 10-minute discovery call?",
      is_active: true,
      metrics: {
        inbound_count: 94,
        replies_sent: 94,
      },
    },
    {
      id: "wa-2",
      name: "Workshop Booking & Registration Support",
      phone_number_id: "default",
      keywords: ["WORKSHOP", "REGISTER", "TICKET", "SEAT"],
      match_type: "contains",
      reply_message:
        "Hello {name}! 🎬 You can reserve your seat for the upcoming Video Production Masterclass directly here: https://saltymediaproduction.com/workshops\n\nNeed assistance with payment? Reply 'HELP' and our team will assist you immediately.",
      is_active: true,
      metrics: {
        inbound_count: 58,
        replies_sent: 58,
      },
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("PRICE, PACKAGES, RATES");
  const [matchType, setMatchType] = useState<"contains" | "exact">("contains");
  const [replyMessage, setReplyMessage] = useState(
    "Hi {name}! Thanks for messaging Salty Media. How can our creative team help you today?"
  );

  // Live Test Dispatcher state
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Hello from Salty Auto WhatsApp Engine! 🚀");
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: WhatsAppRule = {
      id: `wa-${Date.now()}`,
      name: name || "Untitled WhatsApp Rule",
      phone_number_id: "default",
      keywords: keywords.split(",").map((k) => k.trim().toUpperCase()),
      match_type: matchType,
      reply_message: replyMessage,
      is_active: true,
      metrics: {
        inbound_count: 0,
        replies_sent: 0,
      },
    };

    setRules([newRule, ...rules]);
    setShowModal(false);
    setName("");
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSending(true);
    setTestStatus(null);

    try {
      // Query active WhatsApp accounts
      const accRes = await fetch("/api/accounts");
      const accData = await accRes.json();
      const waAccount = accData.accounts?.find(
        (a: any) => a.platform === "whatsapp" && a.status === "active"
      );

      if (!waAccount) {
        setTestStatus({
          error: "No active WhatsApp Business account connected. Connect one in 'Connected Accounts'.",
        });
        setTestSending(false);
        return;
      }

      const res = await fetch("/api/accounts/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: waAccount.id,
          recipientPhone: testPhone,
          messageText: testMsg,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus({ success: true });
      } else {
        setTestStatus({ error: data.error || "Failed to dispatch message" });
      }
    } catch (err: any) {
      setTestStatus({ error: err.message || "Network error" });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            WhatsApp Business Suite
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Official WhatsApp Business Cloud API automation, 24-hr customer care triggers & keyword auto-responders.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New WhatsApp Responder</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Inbound Messages
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">152</div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sub-50ms Webhook SLA
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            24-Hour Windows Open
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">48</div>
          <div className="text-xs text-slate-400 mt-1">
            Free Service Conversations
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Automated Dispatches
          </div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">152</div>
          <div className="text-xs text-slate-400 mt-1">
            Zero Dropped Messages
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Meta Cloud API Status
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">Connected</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Tier 1 Verified (1k free/mo)
          </div>
        </div>
      </div>

      {/* Live WhatsApp Test Dispatcher Card */}
      <div className="glass-card p-6 rounded-2xl border border-emerald-900/40 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              Live WhatsApp API Dispatcher
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Send an instant real-time message via Meta Cloud API to verify your phone number and delivery.
            </p>
          </div>
        </div>

        <form onSubmit={handleSendTest} className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Recipient Phone (with country code)
            </label>
            <input
              type="text"
              required
              placeholder="+91 98200 12345"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Message Content
            </label>
            <input
              type="text"
              required
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={testSending}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testSending ? "Sending..." : "Test Send"}</span>
            </button>
          </div>
        </form>

        {testStatus && (
          <div className="mt-3">
            {testStatus.success ? (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Message successfully delivered via WhatsApp Cloud API!
              </div>
            ) : (
              <div className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {testStatus.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Active WhatsApp Responders</h2>

        <div className="grid gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    WhatsApp Cloud
                  </span>

                  <span className="text-xs font-mono text-slate-400">
                    Trigger: Inbound Keyword
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
                  <span className="text-xs text-slate-400">Trigger Keywords:</span>
                  {rule.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300"
                    >
                      {kw}
                    </span>
                  ))}
                  <span className="text-xs text-slate-500 ml-2">
                    (Match: {rule.match_type})
                  </span>
                </div>

                {/* Reply Message Preview */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="font-sans line-clamp-2 text-slate-200">{rule.reply_message}</div>
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

                <div className="text-xs text-slate-400 font-mono">
                  {rule.metrics.replies_sent} replies sent
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create WhatsApp Rule Modal with Live WhatsApp Phone Preview */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="glass-card max-w-4xl w-full p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Build WhatsApp Auto-Responder
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Controls */}
              <form onSubmit={handleCreateRule} className="lg:col-span-7 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inbound Pricing Consultation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Match Criteria
                    </label>
                    <select
                      value={matchType}
                      onChange={(e) => setMatchType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="contains">Contains Any Keyword</option>
                      <option value="exact">Exact Phrase Match</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Customer Care Window
                    </label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-emerald-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      24-Hour Active Window
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trigger Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PRICE, PACKAGES, BOOK, HELP"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp Automated Response (supports &#123;name&#125;)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
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
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/30"
                  >
                    Save & Activate Responder
                  </button>
                </div>
              </form>

              {/* Live WhatsApp Phone Preview */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="w-full max-w-[320px] rounded-[38px] p-4 bg-[#0b141a] border-4 border-slate-800 shadow-2xl">
                  {/* Phone Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-4" />

                  {/* WhatsApp Green Bar Header */}
                  <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-900/40 px-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      SM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        Salty Media Production
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">WhatsApp Business Account</div>
                    </div>
                  </div>

                  {/* WhatsApp Chat Conversation Body */}
                  <div className="py-6 space-y-3 min-h-[260px] flex flex-col justify-end">
                    {/* User Inbound Message (Left bubble) */}
                    <div className="self-start max-w-[80%] p-2.5 rounded-xl rounded-tl-none bg-[#202c33] text-xs text-slate-200 shadow-sm">
                      Hi, can you share the {keywords.split(",")[0] || "pricing"} details?
                      <div className="text-[9px] text-slate-400 text-right mt-1">10:42 AM</div>
                    </div>

                    {/* Bot Outbound Reply (Right bubble with green tint & double ticks) */}
                    <div className="self-end max-w-[85%] p-2.5 rounded-xl rounded-tr-none bg-[#005c4b] text-xs text-white shadow-sm space-y-1">
                      <div className="whitespace-pre-line">
                        {replyMessage.replace(/\{name\}/gi, "Aarav")}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200 mt-1">
                        <span>10:42 AM</span>
                        <CheckCheck className="w-3 h-3 text-cyan-300" />
                      </div>
                    </div>
                  </div>

                  {/* Phone Bottom Pill */}
                  <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
                </div>
                <div className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Live WhatsApp Chat Bubble Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
