export interface IResolveGatewayInput {
  franchiseId: number;
  currency: string; // INR, USD, AED
  isInternational: boolean; // derived from taxMode
  amount: number; // for min/max validation
}

export interface IResolvedGateway {
  franchisePaymentGatewayId: number;
  gatewayCode: string; // RAZORPAY, STRIPE, TELR
  providerCountryCode: string;
  currency: string;
}

export interface IPaymentLinkCustomer {
  name?: string;
  email?: string;
  contact?: string;
}

export interface ICreatePaymentLinkRequest {
  amount: number;
  currency?: string;
  franchisePaymentGatewayId: number;
  description?: string;
  customer?: IPaymentLinkCustomer;
  notes?: Record<string, any>;
}

export interface IPaymentLinkResponse {
  shortUrl: string;
  id: string;
  gatewayCode: string;
}
