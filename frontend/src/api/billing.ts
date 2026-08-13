import { api } from "./client";

export interface BillingOverview {
  plan: string;
  status: string;
  nextBillingDate: string;
  amount: number;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  tier: "free" | "pro" | "enterprise";
  monthlyPrice: number;
  limits: Record<string, number>;
}

export function getBillingOverview(orgId: string): Promise<BillingOverview> {
  return api.get(`/billing/overview/${orgId}`);
}

export function getOverview(orgId: string): Promise<BillingOverview> {
  return api.get(`/billing/overview/${orgId}`);
}

export function listPlans(): Promise<BillingPlan[]> {
  return api.get("/billing/plans");
}

export function getCurrentPlan(orgId: string): Promise<BillingPlan> {
  return api.get(`/billing/plans/${orgId}/current`);
}

export function changePlan(orgId: string, planId: string): Promise<BillingPlan> {
  return api.post(`/billing/plans/${orgId}/change`, { planId });
}

export function listInvoices(orgId: string): Promise<any[]> {
  return api.get(`/billing/invoices/${orgId}`);
}

export function listPaymentMethods(orgId: string): Promise<any[]> {
  return api.get(`/billing/payment-methods/${orgId}`);
}

export function addPaymentMethod(orgId: string, data: { type: string; token: string }): Promise<any> {
  return api.post(`/billing/payment-methods/${orgId}`, data);
}

export function removePaymentMethod(orgId: string, methodId: string): Promise<void> {
  return api.delete(`/billing/payment-methods/${orgId}/${methodId}`);
}

export function setDefaultPaymentMethod(orgId: string, methodId: string): Promise<void> {
  return api.put(`/billing/payment-methods/${orgId}/${methodId}/default`);
}

export const billingApi = {
  getBillingOverview,
  getOverview,
  listPlans,
  getCurrentPlan,
  changePlan,
  listInvoices,
  listPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
};
