import { create } from "zustand";
import type {
  BillingPlan,
  BillingRecord,
  PaymentMethod,
  Invoice,
} from "@/types/billing.types";
import { billingApi, type BillingOverview } from "@/api/billing";

interface BillingState {
  overview: BillingOverview | null;
  plans: BillingPlan[];
  currentPlan: BillingPlan | null;
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;

  fetchOverview: (orgId: string) => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchCurrentPlan: (orgId: string) => Promise<void>;
  changePlan: (orgId: string, planId: string) => Promise<void>;
  fetchInvoices: (orgId: string) => Promise<void>;
  fetchPaymentMethods: (orgId: string) => Promise<void>;
  addPaymentMethod: (
    orgId: string,
    data: { type: string; token: string },
  ) => Promise<void>;
  removePaymentMethod: (orgId: string, methodId: string) => Promise<void>;
  setDefaultPaymentMethod: (orgId: string, methodId: string) => Promise<void>;
}

export const useBillingStore = create<BillingState>((set) => ({
  overview: null,
  plans: [],
  currentPlan: null,
  invoices: [],
  paymentMethods: [],
  loading: false,
  error: null,

  fetchOverview: async (orgId) => {
    set({ loading: true, error: null });
    try {
      const overview = await billingApi.getOverview(orgId);
      set({ overview, loading: false });
    } catch {
      set({ error: "Falha ao carregar faturamento", loading: false });
    }
  },

  fetchPlans: async () => {
    try {
      const plans = await billingApi.listPlans();
      set({ plans });
    } catch {
      /* silent */
    }
  },

  fetchCurrentPlan: async (orgId) => {
    try {
      const plan = await billingApi.getCurrentPlan(orgId);
      set({ currentPlan: plan });
    } catch {
      /* silent */
    }
  },

  changePlan: async (orgId, planId) => {
    set({ loading: true, error: null });
    try {
      const plan = await billingApi.changePlan(orgId, planId);
      set({ currentPlan: plan, loading: false });
    } catch {
      set({ error: "Falha ao alterar plano", loading: false });
    }
  },

  fetchInvoices: async (orgId) => {
    set({ loading: true, error: null });
    try {
      const invoices = await billingApi.listInvoices(orgId);
      set({ invoices, loading: false });
    } catch {
      set({ error: "Falha ao carregar faturas", loading: false });
    }
  },

  fetchPaymentMethods: async (orgId) => {
    try {
      const methods = await billingApi.listPaymentMethods(orgId);
      set({ paymentMethods: methods });
    } catch {
      /* silent */
    }
  },

  addPaymentMethod: async (orgId, data) => {
    set({ loading: true, error: null });
    try {
      const method = await billingApi.addPaymentMethod(orgId, data);
      set((s) => ({
        paymentMethods: [...s.paymentMethods, method],
        loading: false,
      }));
    } catch {
      set({ error: "Falha ao adicionar método de pagamento", loading: false });
    }
  },

  removePaymentMethod: async (orgId, methodId) => {
    try {
      await billingApi.removePaymentMethod(orgId, methodId);
      set((s) => ({
        paymentMethods: s.paymentMethods.filter((m) => m.id !== methodId),
      }));
    } catch {
      /* silent */
    }
  },

  setDefaultPaymentMethod: async (orgId, methodId) => {
    try {
      await billingApi.setDefaultPaymentMethod(orgId, methodId);
      set((s) => ({
        paymentMethods: s.paymentMethods.map((m) => ({
          ...m,
          isDefault: m.id === methodId,
        })),
      }));
    } catch {
      /* silent */
    }
  },
}));
