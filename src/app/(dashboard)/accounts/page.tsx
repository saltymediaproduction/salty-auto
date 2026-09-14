"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Instagram,
  MessageCircle,
  Copy,
  Check,
  Key,
  ExternalLink,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  Smartphone,
  Globe,
  Radio,
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: "instagram" | "whatsapp";
  account_id: string;
  account_name: string | null;
  status: string;
  created_at: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);

  // 1. Separate Instagram Modal & Form State
  const [instagramModalOpen, setInstagramModalOpen] = useState(false);
  const [igUsername, setIgUsername] = useState("");
  const [igAccountId, setIgAccountId] = useState("");
  const [igAccessToken, setIgAccessToken] = useState("");
  const [igSubmitting, setIgSubmitting] = useState(false);
  const [igError, setIgError] = useState("");

  // 2. Separate WhatsApp Modal & Form State
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [waDisplayName, setWaDisplayName] = useState("");
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waError, setWaError] = useState("");

  // 3. Test Modal State (for WhatsApp live testing)
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [activeAccountForTest, setActiveAccountForTest] = useState<SocialAccount | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; messageId?: string } | null>(null);

  const webhookUrl = "https://auto.saltymediaproduction.com/api/webhooks/meta";
  const verifyToken = "salty_auto_secure_verify_token";

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (res.ok && data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error("Failed to load accounts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, type: "url" | "token" | "account_id", id?: string) => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === "token") {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else if (id) {
      setCopiedAccountId(id);
      setTimeout(() => setCopiedAccountId(null), 2000);
    }
  };

  // Open Instagram Modal
  const openInstagramModal = () => {
    setIgUsername("");
    setIgAccountId("");
    setIgAccessToken("");
    setIgError("");
    setInstagramModalOpen(true);
  };

  // Open WhatsApp Modal
  const openWhatsAppModal = () => {
    setWaDisplayName("");
    setWaPhoneNumberId("");
    setWaAccessToken("");
    setWaError("");
    setWhatsappModalOpen(true);
  };

  // Submit Instagram Connection
  const handleInstagramSubmit = async (e: React.FormEvent) => {
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

      setInstagramModalOpen(false);
      setIgUsername("");
      setIgAccountId("");
      setIgAccessToken("");
      fetchAccounts();
    } catch (err: any) {
      setIgError(err.message || "Failed to connect Instagram account");
    } finally {
      setIgSubmitting(false);
    }
  };

  // Submit WhatsApp Connection
  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
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

      setWhatsappModalOpen(false);
      setWaDisplayName("");
      setWaPhoneNumberId("");
      setWaAccessToken("");
      fetchAccounts();
    } catch (err: any) {
      setWaError(err.message || "Failed to connect WhatsApp account");
    } finally {
      setWaSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;

    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (err) {
      console.error("Failed to delete account", err);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccountForTest || !testPhone) return;

    setTestSubmitting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/accounts/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: activeAccountForTest.id,
          recipientPhone: testPhone,
          messageText: testMessage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestResult({
          success: false,
          error: data.error || "Failed to send WhatsApp message via Meta Cloud API",
        });
      } else {
        setTestResult({
          success: true,
          messageId: data.messageId,
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || "Network error" });
    } finally {
      setTestSubmitting(false);
    }
  };

  const openTestModal = (acc: SocialAccount) => {
    setActiveAccountForTest(acc);
    setTestResult(null);
    setTestPhone("");
    setTestMessage("Hello from Salty Auto! Your WhatsApp Business Cloud API is active and functioning seamlessly.");
    setTestModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Dedicated Separate Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-indigo-400" />
            Connected Accounts
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your Meta Graph API and WhatsApp Business Cloud API integrations.
          </p>
        </div>

        {/* Separate Buttons to Open Separate Pop Up Windows */}
        <div className="flex items-center gap-3">
          <button
            onClick={openInstagramModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-medium text-sm transition-all shadow-md shadow-pink-500/20"
          >
            <Instagram className="w-4 h-4" />
            <span>Connect Instagram</span>
          </button>

          <button
            onClick={openWhatsAppModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Connect WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Meta Webhook Ingress Endpoint Panel (Clean & Compact) */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Meta Webhook Ingress</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <span>Meta App Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          {/* Callback URL */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Callback URL
              </div>
              <div className="font-mono text-xs text-slate-200 truncate mt-0.5">
                {webhookUrl}
              </div>
            </div>
            <button
              onClick={() => handleCopy(webhookUrl, "url")}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0"
              title="Copy URL"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Verify Token */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Verify Token
              </div>
              <div className="font-mono text-xs text-slate-200 truncate mt-0.5">
                {verifyToken}
              </div>
            </div>
            <button
              onClick={() => handleCopy(verifyToken, "token")}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0"
              title="Copy Token"
            >
              {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Active Channels {accounts.length > 0 && `(${accounts.length})`}
          </h2>
        </div>

        {loading ? (
          <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500 mb-2" />
            <p className="text-sm">Loading connected channels...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl border border-dashed border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No Channels Connected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Connect your Instagram Professional or WhatsApp Business account to enable real-time messaging automation.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={openInstagramModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-medium text-xs transition-all shadow-md shadow-pink-500/20"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Connect Instagram Account</span>
              </button>
              <button
                onClick={openWhatsAppModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Connect WhatsApp Business</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${
                        acc.platform === "whatsapp"
                          ? "bg-emerald-600 shadow-lg shadow-emerald-600/20"
                          : "bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 shadow-lg shadow-pink-600/20"
                      }`}
                    >
                      {acc.platform === "whatsapp" ? (
                        <MessageCircle className="w-6 h-6" />
                      ) : (
                        <Instagram className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {acc.account_name || (acc.platform === "whatsapp" ? "WhatsApp Number" : "Instagram Account")}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                        <span>{acc.platform === "whatsapp" ? "Phone ID:" : "IG ID:"}</span>
                        <span className="text-slate-300 truncate max-w-[160px]">{acc.account_id}</span>
                        <button
                          onClick={() => handleCopy(acc.account_id, "account_id", acc.id)}
                          className="hover:text-white transition-colors"
                          title="Copy ID"
                        >
                          {copiedAccountId === acc.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Integration:</span>
                    <span className="text-slate-200 font-medium">
                      {acc.platform === "whatsapp" ? "WhatsApp Cloud API" : "Instagram Graph API"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-medium">Active & Synchronized</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Connected:</span>
                    <span className="text-slate-400">{new Date(acc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {acc.platform === "whatsapp" ? (
                    <button
                      onClick={() => openTestModal(acc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Message</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-pink-400" />
                      <span>Comment & DM Webhooks Live</span>
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Disconnect Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* POPUP WINDOW 1: Dedicated Instagram Connect Modal                    */}
      {/* ==================================================================== */}
      {instagramModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-pink-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl shadow-pink-950/40 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-pink-600/30">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Connect Instagram Account</h3>
                  <p className="text-xs text-pink-400">Meta Graph API • Professional Account</p>
                </div>
              </div>
              <button
                onClick={() => setInstagramModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleInstagramSubmit} className="space-y-4">
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
                  placeholder="e.g. 17841400012345678"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-pink-500 transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Found in Meta Business Suite or Graph API Explorer under your Instagram Professional Account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meta Graph API Access Token (System User / Page Token)
                  <span className="text-pink-400 ml-1">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={igAccessToken}
                  onChange={(e) => setIgAccessToken(e.target.value)}
                  placeholder="EAAG... (Paste token with instagram_basic, instagram_manage_comments, instagram_manage_messages)"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInstagramModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={igSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-semibold text-xs transition-all shadow-md shadow-pink-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {igSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting Instagram...</span>
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

      {/* ==================================================================== */}
      {/* POPUP WINDOW 2: Dedicated WhatsApp Connect Modal                     */}
      {/* ==================================================================== */}
      {whatsappModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
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
                onClick={() => setWhatsappModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
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
                  Located in Meta Developer App under <strong>WhatsApp → API Setup → Phone Number ID</strong>.
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
                  onClick={() => setWhatsappModalOpen(false)}
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
      {/* Test WhatsApp Message Modal                                          */}
      {/* ==================================================================== */}
      {testModalOpen && activeAccountForTest && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300">
              Sending from: <strong>{activeAccountForTest.account_name}</strong> (ID: {activeAccountForTest.account_id})
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                {testResult.success ? (
                  <>
                    <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <Check className="w-4 h-4" /> Message Delivered to Meta WhatsApp Cloud API!
                    </div>
                    <div className="font-mono text-[11px] text-emerald-200/80">
                      Message ID: {testResult.messageId}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold flex items-center gap-1.5 text-rose-400">
                      <AlertCircle className="w-4 h-4" /> Meta API Error:
                    </div>
                    <div>{testResult.error}</div>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Recipient WhatsApp Number (with Country Code)
                  <span className="text-rose-400 ml-1">*</span>
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
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
                  disabled={testSubmitting || !testPhone}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {testSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
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
