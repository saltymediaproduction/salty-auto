"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import {
  Sparkles,
  Instagram,
  MessageCircle,
  Users,
  Share2,
  ShieldCheck,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setUserEmail(user.email || user.displayName || "Agency User");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const navItems = [
    {
      name: "Instagram Suite",
      href: "/instagram",
      icon: Instagram,
      badge: "OpenReply",
      isActive: pathname === "/" || pathname.startsWith("/instagram"),
    },
    {
      name: "WhatsApp Suite",
      href: "/whatsapp",
      icon: MessageCircle,
      badge: "Cloud API",
      isActive: pathname.startsWith("/whatsapp"),
    },
    {
      name: "Unified Social CRM",
      href: "/crm",
      icon: Users,
      isActive: pathname.startsWith("/crm"),
    },
    {
      name: "Connected Accounts",
      href: "/accounts",
      icon: Share2,
      isActive: pathname.startsWith("/accounts"),
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0c1220]/90 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-wide">
                SALTY AUTO
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Tech Provider v21.0
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Agency Engine
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-white"
                          : item.name.includes("Instagram")
                          ? "text-pink-400"
                          : item.name.includes("WhatsApp")
                          ? "text-emerald-400"
                          : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        item.name.includes("Instagram")
                          ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom user card & Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-200 truncate">
                  {userEmail || "Agency Owner"}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  Firebase Verified
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Meta Verified
            </span>
            <span className="font-mono text-[10px] text-slate-500 truncate max-w-[100px]">
              auto.salty...
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0c1220]/50 backdrop-blur px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-medium text-slate-200">Salty Media Production</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-700/60 bg-slate-800/40 text-xs text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ingress: Live (<span className="font-mono text-[10px]">auto.saltymediaproduction.com</span>)</span>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
