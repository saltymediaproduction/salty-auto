"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function AccountsPage() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const webhookUrl = "https://auto.saltymediaproduction.com/api/webhooks/meta";
  const verifyToken = "salty_auto_secure_verify_token";

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

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-indigo-400" />
            Connected Meta Accounts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your Meta Tech Provider integrations, Instagram Professional handles, and WhatsApp Business API numbers.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20">
          <Plus className="w-4 h-4" />
          <span>Connect New Account</span>
        </button>
      </div>

      {/* Meta Webhook Ingress Configuration Card */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-slate-900/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Meta Webhook Ingress Settings</h2>
            <p className="text-xs text-slate-400">
              Paste these details into your Meta Developer Dashboard under Webhooks configuration.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          {/* Callback URL */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Callback URL
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

      {/* Connected Accounts List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Instagram Account Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shrink-0">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">@saltymediaproduction</h3>
                <div className="text-xs text-slate-400 font-mono">ID: 17841400012345678</div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Token Status:</span>
              <span className="text-emerald-400 font-medium">Valid (Long-lived 60d)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Comment Webhooks:</span>
              <span className="text-slate-200">Subscribed (Realtime)</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Business Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Salty Media Support</h3>
                <div className="text-xs text-slate-400 font-mono">+91 98200 99999</div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Free 24h Tier:</span>
              <span className="text-emerald-400 font-medium">1,000 / 1,000 Free</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Phone ID:</span>
              <span className="text-slate-200 font-mono">105938481234567</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
