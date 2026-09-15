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
  LogOut,
  User,
  Radio,
  ExternalLink,
  Wallet,
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
      name: "Instagram",
      fullName: "Instagram Suite",
      href: "/instagram",
      icon: Instagram,
      activeColor: "from-purple-600 via-pink-600 to-amber-500",
      activeText: "text-pink-400",
      activeBg: "bg-pink-500/10 border-pink-500/30 text-pink-300",
      isActive: pathname === "/" || pathname.startsWith("/instagram"),
    },
    {
      name: "WhatsApp",
      fullName: "WhatsApp Suite",
      href: "/whatsapp",
      icon: MessageCircle,
      activeColor: "from-emerald-600 to-teal-500",
      activeText: "text-emerald-400",
      activeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
      isActive: pathname.startsWith("/whatsapp"),
    },
    {
      name: "Social CRM",
      fullName: "Unified Social CRM",
      href: "/crm",
      icon: Users,
      activeColor: "from-blue-600 to-cyan-500",
      activeText: "text-cyan-400",
      activeBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
      isActive: pathname.startsWith("/crm"),
    },
    {
      name: "Billing",
      fullName: "Account & Billing",
      href: "/user",
      icon: Wallet,
      activeColor: "from-amber-500 to-orange-500",
      activeText: "text-amber-400",
      activeBg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
      isActive: pathname.startsWith("/user"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-white">
      {/* ==================================================================== */}
      {/* DESKTOP ICON-BASED SIDEBAR RAIL (md:flex)                            */}
      {/* Compact, clean, 80px width (w-20), maximum screen space for content  */}
      {/* ==================================================================== */}
      <aside className="hidden md:flex w-20 border-r border-slate-800/80 bg-[#0c1220]/95 flex-col justify-between items-center py-6 shrink-0 z-30">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Brand Logo Icon */}
          <Link
            href="/instagram"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform"
            title="Salty Auto - Tech Provider v21.0"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </Link>

          {/* Icon Navigation Items */}
          <nav className="flex flex-col items-center gap-3 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.fullName}
                  className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? `${item.activeBg} border shadow-md`
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? item.activeText : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span
                    className={`text-[9px] font-semibold mt-1 tracking-tight transition-colors ${
                      isActive ? item.activeText : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Active glowing indicator pill */}
                  {isActive && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-gradient-to-b from-indigo-400 to-cyan-400 shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Sign Out Rail Actions */}
        <div className="flex flex-col items-center gap-3 w-full px-2 pt-4 border-t border-slate-800/80">
          <Link
            href="/user"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              pathname.startsWith("/user")
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
            title={`Account & Invoicing (${userEmail || "Agency User"})`}
          >
            <User className="w-4 h-4" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MOBILE TOP BAR (< md)                                                */}
      {/* Compact header with Brand title, Ingress status & quick logout       */}
      {/* ==================================================================== */}
      <header className="md:hidden sticky top-0 z-30 h-14 border-b border-slate-800/80 bg-[#0c1220]/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <Link href="/instagram" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-xs text-white tracking-wide">SALTY AUTO</div>
            <div className="text-[9px] text-slate-400 font-mono">Mobile Control</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            Live
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN CONTENT AREA                                                    */}
      {/* Responsive padding: clean on mobile, spacious on desktop             */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Sub-header */}
        <header className="hidden md:flex h-16 border-b border-slate-800/80 bg-[#0c1220]/50 backdrop-blur px-8 items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Workspace</span>
            <span className="text-slate-600">/</span>
            <span className="font-medium text-slate-200">Salty Media Production</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">
              {navItems.find((n) => n.isActive)?.fullName || "Automation Suite"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-700/60 bg-slate-800/40 text-xs text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Ingress Endpoint: <span className="font-mono text-[10px] text-indigo-300">auto.saltymediaproduction.com</span>
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Body (pb-28 on mobile so bottom dock never overlaps content) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE BOTTOM NAVIGATION DOCK (< md)                                 */}
      {/* 4 Touch-friendly icons with labels, thumb-friendly navigation        */}
      {/* ==================================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c1220]/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? `${item.activeBg} border`
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? item.activeText : "text-slate-400"
                }`}
              />
              <span
                className={`text-[10px] font-semibold mt-1 tracking-tight ${
                  isActive ? item.activeText : "text-slate-500"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
