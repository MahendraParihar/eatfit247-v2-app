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

