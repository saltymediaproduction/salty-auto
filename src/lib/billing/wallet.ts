import { createAdminClient } from "@/lib/supabase/admin";

export interface BusinessDetails {
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  taxId: string; // GSTIN / VAT
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  currency: string; // "INR" or "USD"
}

export interface TransactionItem {
  id: string;
  type: "deposit" | "deduction" | "bonus" | "refund";
  amount: number; // positive for deposit/bonus, negative for deduction
  balanceAfter: number;
  description: string;
  reference: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

export interface WalletBillingState {
  workspaceId: string;
  businessDetails: BusinessDetails;
  walletBalance: number;
  totalDeposited: number;
  totalSpent: number;
  costPerAutomation: number; // in current currency (e.g. 0.15 INR)
  automationsCount: number;
  remainingAutomationsEstimate: number;
  transactions: TransactionItem[];
}

const DEFAULT_BUSINESS_DETAILS: BusinessDetails = {
  businessName: "Salty Media Agency",
  contactPerson: "Agency Admin",
  email: "billing@saltymediaproduction.com",
  phone: "+91 98765 43210",
  taxId: "29AABCS1429B1Z1",
  address: "100 Feet Road, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  country: "India",
  postalCode: "560038",
  currency: "INR",
};

const DEFAULT_STARTING_CREDIT = 500.0; // ₹500 complimentary starting credit
const DEFAULT_COST_PER_AUTOMATION = 0.15; // ₹0.15 per triggered automation

/**
 * Fetch or initialize the secure billing profile and wallet state for a workspace
 */
export async function getWorkspaceBillingProfile(workspaceId: string): Promise<WalletBillingState> {
  const supabase = createAdminClient();

  // Look for the workspace billing profile stored inside auto_contacts
  const { data: contact, error } = await supabase
    .from("auto_contacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .contains("tags", ["billing_profile"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Billing Wallet] Error fetching billing profile:", error);
  }

  if (contact && contact.metadata && typeof contact.metadata === "object") {
    const meta = contact.metadata as any;
    const balance = typeof meta.wallet_balance === "number" ? meta.wallet_balance : DEFAULT_STARTING_CREDIT;
    const cost = typeof meta.cost_per_automation === "number" ? meta.cost_per_automation : DEFAULT_COST_PER_AUTOMATION;
    const remainingEst = cost > 0 ? Math.floor(balance / cost) : 0;

    return {
      workspaceId,
      businessDetails: {
        businessName: meta.business_name || DEFAULT_BUSINESS_DETAILS.businessName,
        contactPerson: meta.contact_person || DEFAULT_BUSINESS_DETAILS.contactPerson,
        email: meta.email || DEFAULT_BUSINESS_DETAILS.email,
        phone: meta.phone || DEFAULT_BUSINESS_DETAILS.phone,
        taxId: meta.tax_id || DEFAULT_BUSINESS_DETAILS.taxId,
        address: meta.address || DEFAULT_BUSINESS_DETAILS.address,
        city: meta.city || DEFAULT_BUSINESS_DETAILS.city,
        state: meta.state || DEFAULT_BUSINESS_DETAILS.state,
        country: meta.country || DEFAULT_BUSINESS_DETAILS.country,
        postalCode: meta.postal_code || DEFAULT_BUSINESS_DETAILS.postalCode,
        currency: meta.currency || DEFAULT_BUSINESS_DETAILS.currency,
      },
      walletBalance: Number(balance.toFixed(2)),
      totalDeposited: typeof meta.total_deposited === "number" ? meta.total_deposited : balance,
      totalSpent: typeof meta.total_spent === "number" ? meta.total_spent : 0,
      costPerAutomation: cost,
      automationsCount: typeof meta.automations_count === "number" ? meta.automations_count : 0,
      remainingAutomationsEstimate: remainingEst,
      transactions: Array.isArray(meta.transactions) ? meta.transactions : [],
    };
  }

  // If no billing record exists, securely auto-provision one with bonus credits
  const initialTransactions: TransactionItem[] = [
    {
      id: `txn_${Date.now()}_bonus`,
      type: "bonus",
      amount: DEFAULT_STARTING_CREDIT,
      balanceAfter: DEFAULT_STARTING_CREDIT,
      description: "Complimentary Agency Welcome Credit Bonus",
      reference: "BONUS_PROMO_500",
      status: "completed",
      createdAt: new Date().toISOString(),
    },
  ];

  const initialMetadata = {
    business_name: DEFAULT_BUSINESS_DETAILS.businessName,
    contact_person: DEFAULT_BUSINESS_DETAILS.contactPerson,
    email: DEFAULT_BUSINESS_DETAILS.email,
    phone: DEFAULT_BUSINESS_DETAILS.phone,
    tax_id: DEFAULT_BUSINESS_DETAILS.taxId,
    address: DEFAULT_BUSINESS_DETAILS.address,
    city: DEFAULT_BUSINESS_DETAILS.city,
    state: DEFAULT_BUSINESS_DETAILS.state,
    country: DEFAULT_BUSINESS_DETAILS.country,
    postal_code: DEFAULT_BUSINESS_DETAILS.postalCode,
    currency: DEFAULT_BUSINESS_DETAILS.currency,
    wallet_balance: DEFAULT_STARTING_CREDIT,
    total_deposited: DEFAULT_STARTING_CREDIT,
    total_spent: 0,
    cost_per_automation: DEFAULT_COST_PER_AUTOMATION,
    automations_count: 0,
    transactions: initialTransactions,
  };

  const { data: newContact, error: insertError } = await (supabase.from("auto_contacts") as any)
    .insert({
      workspace_id: workspaceId,
      name: `${DEFAULT_BUSINESS_DETAILS.businessName} (Billing)`,
      stage: "customer",
      tags: ["billing_profile", "wallet_account"],
      metadata: initialMetadata,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[Billing Wallet] Error initializing billing profile:", insertError);
  }

  return {
    workspaceId,
    businessDetails: DEFAULT_BUSINESS_DETAILS,
    walletBalance: DEFAULT_STARTING_CREDIT,
    totalDeposited: DEFAULT_STARTING_CREDIT,
    totalSpent: 0,
    costPerAutomation: DEFAULT_COST_PER_AUTOMATION,
    automationsCount: 0,
    remainingAutomationsEstimate: Math.floor(DEFAULT_STARTING_CREDIT / DEFAULT_COST_PER_AUTOMATION),
    transactions: initialTransactions,
  };
}

/**
 * Update the business details and tax invoicing info
 */
export async function updateWorkspaceBusinessProfile(
  workspaceId: string,
  details: Partial<BusinessDetails>
): Promise<WalletBillingState> {
  const current = await getWorkspaceBillingProfile(workspaceId);
  const supabase = createAdminClient();

  const mergedBusiness: BusinessDetails = {
    ...current.businessDetails,
    ...details,
  };

  const { data: existingContact } = await supabase
    .from("auto_contacts")
    .select("id, metadata")
    .eq("workspace_id", workspaceId)
    .contains("tags", ["billing_profile"])
    .limit(1)
    .maybeSingle();

  const currentMeta = (existingContact?.metadata as any) || {};
  const updatedMeta = {
    ...currentMeta,
    business_name: mergedBusiness.businessName,
    contact_person: mergedBusiness.contactPerson,
    email: mergedBusiness.email,
    phone: mergedBusiness.phone,
    tax_id: mergedBusiness.taxId,
    address: mergedBusiness.address,
    city: mergedBusiness.city,
    state: mergedBusiness.state,
    country: mergedBusiness.country,
    postal_code: mergedBusiness.postalCode,
    currency: mergedBusiness.currency,
  };

  if (existingContact?.id) {
    await (supabase.from("auto_contacts") as any)
      .update({
        name: `${mergedBusiness.businessName} (Billing)`,
        metadata: updatedMeta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingContact.id);
  }

  return {
    ...current,
    businessDetails: mergedBusiness,
  };
}

/**
 * Add money / Top-up the workspace wallet
 */
export async function topUpWallet(
  workspaceId: string,
  amount: number,
  paymentMethod: string = "razorpay",
  reference?: string,
  orderId?: string
): Promise<WalletBillingState> {
  const current = await getWorkspaceBillingProfile(workspaceId);
  const supabase = createAdminClient();

  if (amount <= 0) {
    throw new Error("Top-up amount must be greater than 0");
  }

  const newBalance = Number((current.walletBalance + amount).toFixed(2));
  const newTotalDeposited = Number((current.totalDeposited + amount).toFixed(2));
  const txnRef = reference || `txn_pay_${Date.now()}`;

  const newTxn: TransactionItem = {
    id: `txn_${Date.now()}`,
    type: "deposit",
    amount: Number(amount.toFixed(2)),
    balanceAfter: newBalance,
    description: `Wallet Top-Up via ${paymentMethod.toUpperCase()}`,
    reference: txnRef,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  const updatedTransactions = [newTxn, ...current.transactions.slice(0, 99)];

  // Update in auto_contacts
  const { data: existingContact } = await supabase
    .from("auto_contacts")
    .select("id, metadata")
    .eq("workspace_id", workspaceId)
    .contains("tags", ["billing_profile"])
    .limit(1)
    .maybeSingle();

  const currentMeta = (existingContact?.metadata as any) || {};
  const updatedMeta = {
    ...currentMeta,
    wallet_balance: newBalance,
    total_deposited: newTotalDeposited,
    transactions: updatedTransactions,
  };

  if (existingContact?.id) {
    await (supabase.from("auto_contacts") as any)
      .update({
        metadata: updatedMeta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingContact.id);
  }

  // Also log securely into payment_logs table
  try {
    await (supabase.from("payment_logs") as any).insert({
      event_type: "wallet.topup",
      razorpay_order_id: orderId || null,
      razorpay_payment_id: txnRef,
      payload: {
        workspace_id: workspaceId,
        amount,
        payment_method: paymentMethod,
        currency: current.businessDetails.currency,
        new_balance: newBalance,
      },
      status: "processed",
      created_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.warn("[Billing Wallet] Could not write to payment_logs:", logErr);
  }

  return {
    ...current,
    walletBalance: newBalance,
    totalDeposited: newTotalDeposited,
    remainingAutomationsEstimate: Math.floor(newBalance / current.costPerAutomation),
    transactions: updatedTransactions,
  };
}

/**
 * Deduct cost after an automation execution (e.g. comment-to-DM or WhatsApp trigger)
 */
export async function deductAutomationCost(
  workspaceId: string,
  cost: number = DEFAULT_COST_PER_AUTOMATION,
  description: string = "Instagram Comment-to-DM Execution",
  ruleId?: string
): Promise<WalletBillingState> {
  const current = await getWorkspaceBillingProfile(workspaceId);
  const supabase = createAdminClient();

  const newBalance = Math.max(0, Number((current.walletBalance - cost).toFixed(2)));
  const newTotalSpent = Number((current.totalSpent + cost).toFixed(2));
  const newCount = current.automationsCount + 1;

  const newTxn: TransactionItem = {
    id: `deduct_${Date.now()}`,
    type: "deduction",
    amount: -Number(cost.toFixed(2)),
    balanceAfter: newBalance,
    description,
    reference: ruleId ? `rule_${ruleId.slice(0, 8)}` : `exec_${Date.now()}`,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  const updatedTransactions = [newTxn, ...current.transactions.slice(0, 99)];

  const { data: existingContact } = await supabase
    .from("auto_contacts")
    .select("id, metadata")
    .eq("workspace_id", workspaceId)
    .contains("tags", ["billing_profile"])
    .limit(1)
    .maybeSingle();

  const currentMeta = (existingContact?.metadata as any) || {};
  const updatedMeta = {
    ...currentMeta,
    wallet_balance: newBalance,
    total_spent: newTotalSpent,
    automations_count: newCount,
    transactions: updatedTransactions,
  };

  if (existingContact?.id) {
    await (supabase.from("auto_contacts") as any)
      .update({
        metadata: updatedMeta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingContact.id);
  }

  return {
    ...current,
    walletBalance: newBalance,
    totalSpent: newTotalSpent,
    automationsCount: newCount,
    remainingAutomationsEstimate: Math.floor(newBalance / current.costPerAutomation),
    transactions: updatedTransactions,
  };
}
