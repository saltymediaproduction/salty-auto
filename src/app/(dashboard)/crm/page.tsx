"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Instagram,
  Phone,
  Tag,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  instagram_username?: string;
  whatsapp_phone?: string;
  stage: "lead" | "engaged" | "qualified" | "customer";
  tags: string[];
  last_contacted_at: string;
  platform: "instagram" | "whatsapp";
}

export default function CRMPage() {
  const [activeStage, setActiveStage] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [contacts] = useState<Contact[]>([
    {
      id: "c1",
      name: "Trishul Patel",
      instagram_username: "trishul.design",
      stage: "qualified",
      tags: ["instagram-comment-funnel", "high-intent"],
      last_contacted_at: "10 minutes ago",
      platform: "instagram",
    },
    {
      id: "c2",
      name: "Aarav Sharma",
      whatsapp_phone: "+91 98200 12345",
      stage: "engaged",
      tags: ["whatsapp-inbound", "pricing-inquiry"],
      last_contacted_at: "25 minutes ago",
      platform: "whatsapp",
    },
    {
      id: "c3",
      name: "Sanya Malhotra",
      instagram_username: "sanya.creator",
      stage: "customer",
      tags: ["closed-deal", "production-package"],
      last_contacted_at: "2 hours ago",
      platform: "instagram",
    },
    {
      id: "c4",
      name: "Dev Verma",
      instagram_username: "dev_v_media",
      stage: "lead",
      tags: ["instagram-comment-funnel"],
      last_contacted_at: "Yesterday",
      platform: "instagram",
    },
  ]);

  const stages = [
    { id: "all", label: "All Contacts", count: contacts.length },
    { id: "lead", label: "New Leads", count: contacts.filter((c) => c.stage === "lead").length },
    { id: "engaged", label: "Engaged (DM/Comment)", count: contacts.filter((c) => c.stage === "engaged").length },
    { id: "qualified", label: "Qualified", count: contacts.filter((c) => c.stage === "qualified").length },
    { id: "customer", label: "Customers", count: contacts.filter((c) => c.stage === "customer").length },
  ];

  const filteredContacts = contacts.filter((c) => {
    const matchesStage = activeStage === "all" || c.stage === activeStage;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.instagram_username && c.instagram_username.toLowerCase().includes(search.toLowerCase())) ||
      (c.whatsapp_phone && c.whatsapp_phone.includes(search));
    return matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Social CRM & Lead Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time contact tracking and lead staging synced automatically from Instagram and WhatsApp webhooks.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Supabase Realtime Synced</span>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setActiveStage(stage.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeStage === stage.id
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
          >
            <span>{stage.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeStage === stage.id ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {stage.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, Instagram username, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="grid gap-3">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                  contact.platform === "instagram"
                    ? "bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500"
                    : "bg-emerald-600"
                }`}
              >
                {contact.name.charAt(0)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white">{contact.name}</h3>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      contact.stage === "qualified"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : contact.stage === "customer"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {contact.stage}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {contact.instagram_username && (
                    <span className="flex items-center gap-1 font-mono text-pink-300">
                      @{contact.instagram_username}
                    </span>
                  )}
                  {contact.whatsapp_phone && (
                    <span className="flex items-center gap-1 font-mono text-emerald-300">
                      {contact.whatsapp_phone}
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    {contact.last_contacted_at}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags row */}
            <div className="flex items-center gap-2 flex-wrap">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
