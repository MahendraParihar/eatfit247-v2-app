import { IAdminInfo } from '../base.interface';

export interface IBaseCourierProvider {
  providerCode: string;
  providerName: string;
  authType: 'API_KEY' | 'JWT' | 'BASIC';
  supportsRateApi: boolean;
  supportsWebhook: boolean;
  supportsCod: boolean;
  priorityOrder: number;
  active: boolean;
}

export interface IManageCourierProvider extends IBaseCourierProvider {
  providerId?: number;
}

export interface ICourierProvider extends IBaseCourierProvider, IAdminInfo {
  providerId: number;
}

export interface IBaseCourierProviderAccount {
  providerId: number;
  franchiseId: number;
  accountName?: string;
  apiBaseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  passwordEncrypted?: string;
  authToken?: string;
  tokenExpiry?: Date;
  webhookSecret?: string;
  active: boolean;
}

export interface IManageCourierProviderAccount extends IBaseCourierProviderAccount {
  providerAccountId?: number;
  password?: string; // For create/update operations (will be encrypted)
}

export interface ICourierProviderAccount extends IBaseCourierProviderAccount, IAdminInfo {
  providerAccountId: number;
  provider?: {
    providerId: number;
    providerCode: string;
    providerName: string;
  };
  franchise?: {
    franchiseId: number;
    companyName: string;
  };
}

