/**
 * Email Data Interface
 * Defines the structure for email data passed to the email service
 */

export interface IEmailData {
  to: string | string[];
  subject?: string; // Optional - will use template default if not provided
  type: string; // EmailType enum value
  data: Record<string, any>; // Template variables
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

