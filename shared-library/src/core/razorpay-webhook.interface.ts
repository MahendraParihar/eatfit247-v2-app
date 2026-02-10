export interface RazorpayPaymentAuthentication {
  authentication_channel?: string;
  version?: string;
}

export interface RazorpayPaymentCard {
  entity?: string;
  id?: string;
  emi?: boolean;
  international?: boolean;
  issuer?: string;
  last4?: string;
  name?: string;
  network?: string;
  sub_type?: string;
  type?: string;
}

export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  amount_captured?: number;
  amount_transferred?: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, any>;
  fee: number | null;
  fee_bearer?: string;
  tax: number | null;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: Record<string, any>;
  authentication?: RazorpayPaymentAuthentication;
  card?: RazorpayPaymentCard;
  created_at: number;
  reward?: any | null;
  upi?: {
    vpa?: string;
    flow?: string;
  } | null;
  base_amount?: number;
}

export interface RazorpayPaymentLinkCustomer {
  name: string;
  email: string;
  contact: string;
}

export interface RazorpayPaymentLinkNotify {
  email?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
}

export interface RazorpayPaymentLinkReminders {
  status?: string;
}

export interface RazorpayPaymentLinkEntity {
  id: string;
  entity: string;
  amount: number;
  amount_paid?: number;
  currency: string;
  description: string | null;
  customer: RazorpayPaymentLinkCustomer;
  status: string;
  notes: Record<string, any> | null;
  created_at: number;
  accept_partial?: boolean;
  callback_method?: string;
  callback_url?: string;
  cancelled_at?: number;
  expire_by?: number;
  expired_at?: number;
  first_min_partial_amount?: number;
  notify?: RazorpayPaymentLinkNotify;
  order_id?: string;
  reference_id?: string;
  reminder_enable?: boolean;
  reminders?: RazorpayPaymentLinkReminders;
  short_url?: string;
  updated_at?: number;
  upi_link?: boolean;
  user_id?: string;
  whatsapp_link?: boolean;
}

export interface RazorpayOrderEntity {
  id: string;
  entity: string;
  account_number?: string | null;
  amount: number;
  amount_paid: number;
  amount_due: number;
  app_offer?: boolean;
  attempts: number;
  authorized?: boolean;
  bank?: string | null;
  bank_account?: any | null;
  checkout_config_id?: string | null;
  created_at: number;
  currency: string;
  customer_id?: string | null;
  discount?: boolean;
  first_payment_min_amount?: number;
  force_offer?: string | null;
  late_auth_config_id?: string | null;
  merchant_id?: string;
  method?: string | null;
  notes: Record<string, any> | null;
  offers?: Record<string, any>;
  order_metas?: any[];
  order_relationships?: any[];
  partial_payment?: boolean;
  payer_name?: string | null;
  payment_capture?: boolean;
  product_id?: string;
  product_type?: string;
  provider_context?: any | null;
  public_key?: string;
  public_response?: any | null;
  receipt?: string | null;
  reference2?: string | null;
  reference3?: string | null;
  reference4?: string | null;
  reference5?: string | null;
  reference6?: string | null;
  reference7?: string | null;
  reference8?: string | null;
  source?: string | null;
  status: string;
  transfers?: any | null;
  updated_at?: number;
  description?: string | null;
  checkout?: any | null;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    payment_link?: {
      entity: RazorpayPaymentLinkEntity;
    };
    order?: {
      entity: RazorpayOrderEntity;
    };
  };
  created_at?: number;
}

