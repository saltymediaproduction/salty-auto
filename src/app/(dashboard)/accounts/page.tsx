"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Instagram,
  MessageCircle,
  ShieldCheck,
  Copy,
  Check,
  Key,
  ExternalLink,
  Plus,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Info,
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

  // Modal states
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"whatsapp" | "instagram">("whatsapp");
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [activeAccountForTest, setActiveAccountForTest] = useState<SocialAccount | null>(null);

  // Form states
  const [formAccountName, setFormAccountName] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formAccessToken, setFormAccessToken] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Test states
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

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formAccountId || !formAccessToken) {
      setFormError("Account ID and Access Token are required.");
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform,
          accountId: formAccountId,
          accountName: formAccountName || (selectedPlatform === "whatsapp" ? "WhatsApp Number" : "Instagram Account"),
          accessToken: formAccessToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save account");
      }

      setConnectModalOpen(false);
      setFormAccountId("");
      setFormAccountName("");
      setFormAccessToken("");
      fetchAccounts();
    } catch (err: any) {
      setFormError(err.message || "Failed to connect account");
    } finally {
      setFormSubmitting(false);
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
    setTestMessage("🚀 Hello from Salty Auto! Your WhatsApp Business Cloud API is active and functioning seamlessly.");
    setTestModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-indigo-400" />
            Social Media & WhatsApp Integrations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect your live Meta WhatsApp Business API numbers and Instagram Professional accounts to start automation funnels.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError("");
            setConnectModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Meta Account</span>
        </button>
      </div>

      {/* Meta Webhook Ingress Configuration Card */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-slate-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Meta Webhook Ingress Endpoint</h2>
              <p className="text-xs text-slate-400">
                Configure this in your Meta Developer App under <strong>WhatsApp → Configuration</strong> or <strong>Instagram → Webhooks</strong>.
              </p>
            </div>
          </div>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors font-medium"
          >
            Meta Developer Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          {/* Callback URL */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Callback URL (HTTPS)
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-indigo-300 truncate">
                {webhookUrl}
              </span>
              <button
                onClick={() => handleCopy(webhookUrl, "url")}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0"
                title="Copy URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Verify Token */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Verify Token
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-indigo-300 truncate">
                {verifyToken}
              </span>
              <button
                onClick={() => handleCopy(verifyToken, "token")}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all shrink-0"
                title="Copy Verify Token"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Active Connected Channels</h2>

        {loading ? (
          <div className="glass-card p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm">Loading connected social accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl border border-dashed border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No Meta Accounts Connected Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Connect your WhatsApp Business Phone Number ID or Instagram Professional account to activate comment automation and 24-hour instant customer auto-replies.
              </p>
            </div>
            <button
              onClick={() => setConnectModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Your First Account</span>
            </button>
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
                      <div className="text-xs text-slate-400 font-mono">
                        {acc.platform === "whatsapp" ? `Phone ID: ${acc.account_id}` : `IG ID: ${acc.account_id}`}
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
                    <span>Platform:</span>
                    <span className="text-slate-200 capitalize font-medium">{acc.platform}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-medium">Active & Synchronized</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Added on:</span>
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
                    <span className="text-xs text-slate-500 italic">Listening for comment webhooks</span>
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

      {/* Step-by-Step Meta Integration Guide */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5 text-indigo-400">
          <HelpCircle className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">How to Get WhatsApp Business Cloud API Credentials</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h3 className="font-semibold text-slate-200">Create Meta App & Add WhatsApp</h3>
            <p className="text-slate-400 leading-relaxed">
              In <a href="https://developers.facebook.com" target="_blank" className="text-indigo-400 underline">developers.facebook.com</a>, create an App with type <strong>Business</strong>. Click <strong>Set Up WhatsApp</strong> on the App Dashboard.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h3 className="font-semibold text-slate-200">Copy Phone Number ID</h3>
            <p className="text-slate-400 leading-relaxed">
              Navigate to <strong>WhatsApp → API Setup</strong>. You will see a <strong>Phone Number ID</strong> (and a test number provided by Meta, or your registered business number).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h3 className="font-semibold text-slate-200">Generate Permanent Token</h3>
            <p className="text-slate-400 leading-relaxed">
              Go to Meta Business Suite → <strong>System Users</strong>. Create a System User, assign your App, and generate a permanent token with permissions: <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code>.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <strong>Free Tier Policy:</strong> Meta provides <strong>1,000 free service (user-initiated) conversations per month</strong> for each WhatsApp Business Account. Replies within 24 hours to customer inbound messages cost $0.00.
          </div>
        </div>
      </div>

      {/* Connect Account Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Connect Meta Channel
              </h3>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Platform Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlatform("whatsapp")}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  selectedPlatform === "whatsapp"
                    ? "bg-emerald-600/20 border-emerald-500/60 text-white"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">WhatsApp Business</div>
                  <div className="text-[10px] text-slate-400">Cloud API</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform("instagram")}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  selectedPlatform === "instagram"
                    ? "bg-pink-600/20 border-pink-500/60 text-white"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shrink-0">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Instagram Pro</div>
                  <div className="text-[10px] text-slate-400">Graph API</div>
                </div>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConnectSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Label / Account Name
                </label>
                <input
                  type="text"
                  value={formAccountName}
                  onChange={(e) => setFormAccountName(e.target.value)}
                  placeholder={
                    selectedPlatform === "whatsapp"
                      ? "e.g. Salty Media Official (+91 98811 20025)"
                      : "e.g. @saltymediaproduction"
                  }
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {selectedPlatform === "whatsapp" ? "Phone Number ID" : "Instagram Business Account ID"}
                  <span className="text-rose-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formAccountId}
                  onChange={(e) => setFormAccountId(e.target.value)}
                  placeholder={
                    selectedPlatform === "whatsapp"
                      ? "e.g. 105938481234567 (from WhatsApp > API Setup)"
                      : "e.g. 17841400012345678"
                  }
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Access Token (Permanent or System User Token)
                  <span className="text-rose-400 ml-1">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formAccessToken}
                  onChange={(e) => setFormAccessToken(e.target.value)}
                  placeholder="EAAG... (Paste permanent System User token with messaging permissions)"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
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
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save & Connect</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test WhatsApp Message Modal */}
      {testModalOpen && activeAccountForTest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Live WhatsApp API Dispatch Tester
              </h3>
              <button
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
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
                    <div className="text-[10px] text-slate-400 mt-1">
                      Note: If using Meta's test number, make sure the recipient phone number is added to your Allowed Recipient list in Meta Developer Portal &gt; WhatsApp &gt; API Setup.
                    </div>
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
                      <span>Sending via Meta API...</span>
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
