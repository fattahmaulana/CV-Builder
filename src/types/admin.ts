export type ApiKeyProvider = "gemini" | "doku" | "job_api" | "turnstile" | "smtp" | "other";
export type ApiKeyStatus = "aktif" | "cooldown" | "habis" | "tidak_valid" | "nonaktif";

export interface ApiKeyRecord {
  id: string;
  provider: ApiKeyProvider;
  label: string;
  last_four_chars: string;
  masked_key: string;
  status: ApiKeyStatus;
  priority: number;
  weight: number;
  requests_today: number;
  errors_today: number;
  cooldown_until: string | null;
  last_used_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export interface AdminOrder {
  id: string;
  user_id: string;
  cv_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  payment_method: string | null;
  doku_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at?: string | null;
  user_email: string;
  user_name: string;
  cv_title: string;
}

export interface RevenueStats {
  totalRevenue: number;
  totalPaidOrders: number;
  totalPendingOrders: number;
  totalFailedOrders: number;
  uniquePaidUsers: number;
}

