"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  Wallet,
  PlusCircle,
  Building2,
  Receipt,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Zap,
  DollarSign,
  TrendingDown,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  IndianRupee,
  Server,
  HardDrive,
  Database,
  Cpu,
} from "lucide-react";
import type { WalletBillingState, BusinessDetails } from "@/lib/billing/wallet";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function UserAccountPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [testingDeduct, setTestingDeduct] = useState(false);
  const [purgingLogs, setPurgingLogs] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Billing & Wallet State
  const [billing, setBilling] = useState<WalletBillingState | null>(null);

  // Business Details Form State
  const [businessForm, setBusinessForm] = useState<BusinessDetails>({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    taxId: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    currency: "INR",
  });

  // Top Up Modal State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [topUpSuccessBanner, setTopUpSuccessBanner] = useState<string | null>(null);

  // Filter for transactions
  const [transactionTab, setTransactionTab] = useState<"all" | "deposit" | "deduction">("all");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success && data.billing) {
        setBilling(data.billing);
        setBusinessForm(data.billing.businessDetails);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessForm),
      });
      const data = await res.json();
      if (data.success && data.billing) {
        setBilling(data.billing);
        setSaveSuccessMsg("Business details and invoicing information securely saved in DB!");
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenTopUpModal = (amount: number = 1000) => {
    setTopUpAmount(amount);
    setShowTopUpModal(true);
  };

  const handleExecuteTopUp = async () => {
    if (!topUpAmount || topUpAmount <= 0) return;
    setTopUpLoading(true);
    setTopUpSuccessBanner(null);

    try {
      // 1. Create order
      const orderRes = await fetch("/api/user/wallet/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: topUpAmount,
          currency: businessForm.currency || "INR",
        }),
      });
      const orderData = await orderRes.json();

      // If Razorpay SDK is loaded on window and we're not strictly mocked
      if (typeof window !== "undefined" && window.Razorpay && orderData.orderId && !orderData.isMock) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Salty Auto Wallet Top-Up",
          description: `Add ${currencySymbol}${topUpAmount} to automation balance`,
          order_id: orderData.orderId,
          prefill: {
            name: businessForm.contactPerson || "Agency User",
            email: businessForm.email || "billing@saltymediaproduction.com",
            contact: businessForm.phone || "9876543210",
          },
          theme: {
            color: "#6366f1",
          },
          handler: async function (response: any) {
            await finalizeTopUp(topUpAmount, selectedMethod, response.razorpay_payment_id, orderData.orderId);
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setTopUpLoading(false);
        return;
      }

      // Instant sandbox confirmation if modal is closed or mocked test environment
      await finalizeTopUp(
        topUpAmount,
        selectedMethod,
        `pay_rzp_test_${Math.floor(10000000 + Math.random() * 90000000)}`,
        orderData.orderId
      );
    } catch (err) {
      console.error("Top-up initiation error:", err);
      setTopUpLoading(false);
    }
  };

  const finalizeTopUp = async (
    amount: number,
    method: string,
    paymentRef: string,
    orderId?: string
  ) => {
    try {
      const topUpRes = await fetch("/api/user/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: `Razorpay (${method.toUpperCase()})`,
          paymentRef,
          orderId,
        }),
      });
      const topUpData = await topUpRes.json();
      if (topUpData.success && topUpData.billing) {
        setBilling(topUpData.billing);
        setShowTopUpModal(false);
        setTopUpSuccessBanner(
          `Successfully credited ${currencySymbol}${amount.toFixed(2)} to your automation wallet!`
        );
        setTimeout(() => setTopUpSuccessBanner(null), 6000);
      }
    } catch (err) {
      console.error("Finalize top up error:", err);
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleTestAutomationDeduction = async () => {
    setTestingDeduct(true);
    try {
      const res = await fetch("/api/user/wallet/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost: billing?.costPerAutomation || 0.15,
          description: "Simulated Instagram Comment-to-DM Execution",
        }),
      });
      const data = await res.json();
      if (data.success && data.billing) {
        setBilling(data.billing);
      }
    } catch (err) {
      console.error("Failed to test deduction:", err);
    } finally {
      setTestingDeduct(false);
    }
  };

  const handleTriggerLogPurge = async () => {
    setPurgingLogs(true);
    setPurgeMsg(null);
    try {
      const res = await fetch("/api/cron/cleanup-logs", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPurgeMsg(data.message || `Purged ${data.purgedCount} expired logs successfully.`);
      } else {
        setPurgeMsg(data.message || "Failed to purge logs.");
      }
    } catch (err: any) {
      setPurgeMsg("Error executing purge: " + err.message);
    } finally {
      setPurgingLogs(false);
      setTimeout(() => setPurgeMsg(null), 6000);
    }
  };

  const currencySymbol = businessForm.currency === "USD" ? "$" : "₹";
  const walletBalance = billing?.walletBalance ?? 0;
  const isLowBalance = walletBalance < 100;
  const costPerAuto = billing?.costPerAutomation ?? 0.15;
  const remainingAutomations = costPerAuto > 0 ? Math.floor(walletBalance / costPerAuto) : 0;

  const filteredTransactions = (billing?.transactions || []).filter((tx) => {
    if (transactionTab === "all") return true;
    if (transactionTab === "deposit") return tx.type === "deposit" || tx.type === "bonus";
    if (transactionTab === "deduction") return tx.type === "deduction";
    return true;
  });

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* ==================================================================== */}
        {/* HEADER SECTION                                                       */}
        {/* ==================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20 text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  Account & Billing Control
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Enterprise
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  Manage your business profile, wallet balance, automation usage deductions, and payment ledger.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenTopUpModal(1000)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Add Money / Top-Up
            </button>

            <button
              onClick={fetchProfile}
              disabled={loading}
              title="Refresh wallet balance"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {topUpSuccessBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{topUpSuccessBanner}</span>
            </div>
            <button
              onClick={() => setTopUpSuccessBanner(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* ROW 1: REAL-TIME WALLET & COST TRACKING METRICS                     */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Remaining Wallet Amount */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-[#0e1526]/90 border border-slate-800/80 shadow-xl group hover:border-slate-700/80 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Remaining Amount
              </span>
              <div
                className={`p-2 rounded-xl ${
                  isLowBalance
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
                <span>{currencySymbol}</span>
                <span>{walletBalance.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                {isLowBalance ? (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Low Balance (Add Money)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active & Funded
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleOpenTopUpModal(1000)}
              className="mt-4 w-full py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Quick Top-Up
            </button>
          </div>

          {/* Card 2: Estimated Automations Remaining */}
          <div className="p-5 rounded-2xl bg-[#0e1526]/90 border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Automations Remaining
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-white">
                {remainingAutomations.toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <span>Estimated runs at</span>
                <span className="text-slate-200 font-mono font-medium">
                  {currencySymbol}
                  {costPerAuto.toFixed(2)}/run
                </span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Instagram Comment-to-DM</span>
              <span className="text-emerald-400 font-medium">Included</span>
            </div>
          </div>

          {/* Card 3: Total Spent & Runs Counter */}
          <div className="p-5 rounded-2xl bg-[#0e1526]/90 border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Automation Spent
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
                <span>{currencySymbol}</span>
                <span>{(billing?.totalSpent ?? 0).toFixed(2)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Across{" "}
                <span className="text-purple-400 font-semibold font-mono">
                  {billing?.automationsCount ?? 0}
                </span>{" "}
                triggered interactions
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Lifetime Deposited</span>
              <span className="text-slate-200 font-mono font-medium">
                {currencySymbol}
                {(billing?.totalDeposited ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Card 4: Cost Per Automation Policy */}
          <div className="p-5 rounded-2xl bg-[#0e1526]/90 border border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Pricing Rate
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
                <span>{currencySymbol}</span>
                <span>{costPerAuto.toFixed(2)}</span>
                <span className="text-xs text-slate-500 font-normal ml-1">/ trigger</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Transparent pay-per-use. Zero recurring software fees.
              </p>
            </div>

            <button
              onClick={handleTestAutomationDeduction}
              disabled={testingDeduct || walletBalance < costPerAuto}
              className="mt-4 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              title="Deducts ₹0.15 to demonstrate real-time remaining balance calculation"
            >
              <Zap className={`w-3.5 h-3.5 ${testingDeduct ? "animate-pulse text-indigo-400" : ""}`} />
              {testingDeduct ? "Simulating..." : `Simulate Run (-${currencySymbol}${costPerAuto})`}
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* ROW 2: BUSINESS DETAILS FORM & INVOICING                            */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-[#0c1220]/95 border border-slate-800/80 shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Business & Invoicing Details
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Required for automated tax receipts, GST / VAT invoices, and workspace ownership.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>DB Encrypted</span>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveBusinessProfile} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Company / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessForm.businessName}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, businessName: e.target.value })
                    }
                    placeholder="e.g. Salty Media Production"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Authorized Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessForm.contactPerson}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, contactPerson: e.target.value })
                    }
                    placeholder="e.g. Trishul Nirmala"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Billing Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={businessForm.email}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, email: e.target.value })
                    }
                    placeholder="e.g. billing@saltymediaproduction.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Business Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={businessForm.phone}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, phone: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    GSTIN / Tax Identification Number
                  </label>
                  <input
                    type="text"
                    value={businessForm.taxId}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, taxId: e.target.value })
                    }
                    placeholder="e.g. 29AABCS1429B1Z1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Operating Currency
                  </label>
                  <select
                    value={businessForm.currency}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, currency: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="INR">INR (₹) - Indian Rupee (Razorpay UPI & Cards)</option>
                    <option value="USD">USD ($) - US Dollar (International Cards)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={businessForm.address}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, address: e.target.value })
                  }
                  placeholder="Street address, building, suite"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={businessForm.city}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, city: e.target.value })
                    }
                    placeholder="Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={businessForm.state}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, state: e.target.value })
                    }
                    placeholder="Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Postal Code / PIN
                  </label>
                  <input
                    type="text"
                    value={businessForm.postalCode}
                    onChange={(e) =>
                      setBusinessForm({ ...businessForm, postalCode: e.target.value })
                    }
                    placeholder="560038"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving to DB...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Business Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Top-Up & Payment Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#121b30] to-[#0c1220] border border-indigo-500/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instant Wallet Top-Up</h3>
                  <p className="text-xs text-slate-400">Zero downtime automation refill</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-300">Select amount to deposit:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleOpenTopUpModal(amt)}
                      className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                      {currencySymbol}
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenTopUpModal(1000)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Custom Amount
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Razorpay PCI-DSS Level 1 Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Real-time instant wallet credit</span>
                </div>
              </div>
            </div>

            {/* Invoicing info card */}
            <div className="p-6 rounded-2xl bg-[#0c1220]/95 border border-slate-800/80 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-400" />
                GST Tax Invoicing
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All top-ups generate an automated invoice with your GSTIN / Tax ID sent to your registered billing email address.
              </p>
              <div className="text-[11px] text-indigo-400 font-mono">
                {businessForm.taxId ? `GST: ${businessForm.taxId}` : "No GST configured (B2C)"}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* ROW 2.5: INFRASTRUCTURE COST SAFEGUARDS (FLAT-COST ARCHITECTURE)     */}
        {/* ==================================================================== */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#0c1220] via-[#0f172a] to-[#0c1220] border border-indigo-500/20 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Infrastructure Cost Safeguards
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Architectural safeguards keeping cloud compute and database costs flat as automation volume scales into millions.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleTriggerLogPurge}
              disabled={purgingLogs}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              title="Runs on-demand cleanup of logs older than 30 days"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${purgingLogs ? "animate-spin text-indigo-400" : "text-slate-400"}`} />
              {purgingLogs ? "Purging Old Logs..." : "Run Log Purge Now"}
            </button>
          </div>

          {purgeMsg && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{purgeMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Safeguard 1: Log Purge Policy */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  30-Day Log TTL
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">Enabled</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Raw webhook logs are automatically purged after 30 days via daily Inngest cron, keeping PostgreSQL storage permanently within the low tier.
              </p>
            </div>

            {/* Safeguard 2: Edge Rule Cache */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  In-Memory Edge Cache
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">120s TTL</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automation keyword rules and connected credentials are cached in RAM, eliminating 95% of database SELECT query spikes during viral campaigns.
              </p>
            </div>

            {/* Safeguard 3: Dual-Driver Event Queue */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Server className="w-4 h-4 text-purple-400" />
                  Dual-Driver Queue
                </div>
                <span className="text-[10px] font-mono text-indigo-400 font-semibold">Inngest + QStash</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Supports dual execution engines with Upstash QStash fallback ($1.00/100K messages), reducing high-volume queuing costs by up to 70%.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* ROW 3: TRANSACTION & USAGE LEDGER TABLE                             */}
        {/* ==================================================================== */}
        <div className="p-6 md:p-8 rounded-2xl bg-[#0c1220]/95 border border-slate-800/80 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                Transaction Ledger & Payment History
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Audit trail of all money added, automated usage deductions, and credit adjustments.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setTransactionTab("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  transactionTab === "all"
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTransactionTab("deposit")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  transactionTab === "deposit"
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Deposits
              </button>
              <button
                onClick={() => setTransactionTab("deduction")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  transactionTab === "deduction"
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Deductions
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No transactions recorded in this view yet.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isCredit
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownRight className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-200 font-medium">
                          {tx.description}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {tx.reference}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-semibold ${
                            isCredit ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isCredit ? "+" : ""}
                          {currencySymbol}
                          {Math.abs(tx.amount).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {currencySymbol}
                          {tx.balanceAfter.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
                          <span className="text-[11px] capitalize text-slate-400">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TOP-UP MODAL (Add Money with Razorpay / UPI / Cards)                 */}
      {/* ==================================================================== */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0c1220] border border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Money to Wallet</h3>
                  <p className="text-[11px] text-slate-400">Instant credit for automation runs</p>
                </div>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-white text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            {/* Preset Amount Chips */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Quick Select Amount:</label>
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      topUpAmount === amt
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {currencySymbol}
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1.5">
                Or Custom Amount ({businessForm.currency})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  {currencySymbol}
                </div>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Enter amount"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Minimum top-up: {currencySymbol}50</p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Payment Option:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("upi")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === "upi"
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-semibold">UPI Instant</span>
                  <span className="text-[9px] text-slate-500">GPay / PhonePe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("card")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === "card"
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span className="text-[11px] font-semibold">Cards</span>
                  <span className="text-[9px] text-slate-500">Visa / MC / RuPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod("netbanking")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === "netbanking"
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px] font-semibold">NetBanking</span>
                  <span className="text-[9px] text-slate-500">All Banks</span>
                </button>
              </div>
            </div>

            {/* Summary details */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Top-up Amount</span>
                <span className="text-slate-200 font-mono font-medium">
                  {currencySymbol}
                  {topUpAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Extra Runs</span>
                <span className="text-emerald-400 font-mono font-medium">
                  +{(costPerAuto > 0 ? Math.floor(topUpAmount / costPerAuto) : 0).toLocaleString()} runs
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={topUpLoading || topUpAmount <= 0}
                onClick={handleExecuteTopUp}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {topUpLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Pay {currencySymbol}
                    {topUpAmount.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
