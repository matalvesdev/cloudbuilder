export interface BillingPlan {
  id: string;
  name: string;
  tier: "free" | "pro" | "enterprise";
  monthlyPrice: number;
  features: string[];
  limits: Record<string, number>;
}

export interface BillingRecord {
  id: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  total: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  items: BillingLineItem[];
}

export interface BillingLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "invoice";
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paidAt?: string;
  pdfUrl?: string;
}
