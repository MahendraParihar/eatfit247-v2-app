/**
 * Contact Form Report Interfaces
 * Shared interfaces for contact form reporting across frontend and backend
 */

export interface IContactFormReportFilter {
  startDate: string;
  endDate: string;
  search?: string;
}

export interface IContactFormReportItem {
  contactFormId: number;
  name: string;
  emailId: string;
  countryCode: string;
  contactNumber: string;
  fullContactNumber: string;
  message: string;
  respondedBy: number | null;
  respondedByUserName: string | null;
  respondedMessage: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isResponded: boolean;
}

export interface ISendResponseDto {
  respondedMessage: string;
}

