import { Sparkles, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#090d16]">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>SALTY AUTO PORTAL</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Agency Social Engine
          </h1>
          <p className="text-xs text-slate-400">
            Dedicated automation & CRM portal for authorized business owners.
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {children}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Meta Tech Provider
          </span>
          <span>•</span>
          <span>auto.saltymediaproduction.com</span>
        </div>
      </div>
    </div>
  );
}
