import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TxnContactForm } from '@server_1/core';
import { CreateContactFormDto } from '../dto';

@Injectable()
export class ContactFormService {
  constructor(
    @InjectModel(TxnContactForm)
    private readonly contactFormRepository: typeof TxnContactForm,
  ) {}

  /**
   * Create a new contact form submission
   * @param dto - Contact form data
   * @param requestedIp - Client IP address
   * @returns Created contact form ID
   */
  async create(dto: CreateContactFormDto, requestedIp: string): Promise<{ contactFormId: number }> {
    // Parse phone number to extract country code if present
    const { countryCode, contactNumber } = this.parsePhoneNumber(dto.phone || '');

    // Combine subject and message
    const fullMessage = this.buildMessage(dto.subject, dto.message);

    const contactForm = await this.contactFormRepository.create({
      name: dto.name,
      emailId: dto.email,
      countryCode: countryCode,
      contactNumber: contactNumber,
      message: fullMessage,
      active: true,
      createdIp: requestedIp,
      modifiedIp: requestedIp,
    });

    return { contactFormId: contactForm.contactFormId };
  }

  /**
   * Parse phone number to extract country code and number
   * Defaults to +91 (India) if no country code is found
   */
  private parsePhoneNumber(phone: string): { countryCode: string; contactNumber: string } {
    if (!phone || phone.trim() === '') {
      return { countryCode: '+91', contactNumber: '0000000000' };
    }

    // Remove all spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // Check if it starts with + (international format)
    if (cleaned.startsWith('+')) {
      // Try to extract country code (1-4 digits after +)
      const match = cleaned.match(/^\+(\d{1,4})(.+)$/);
      if (match) {
        return {
          countryCode: `+${match[1]}`,
          contactNumber: match[2],
        };
      }
    }

    // Check if it starts with 00 (international format without +)
    if (cleaned.startsWith('00')) {
      const match = cleaned.match(/^00(\d{1,4})(.+)$/);
      if (match) {
        return {
          countryCode: `+${match[1]}`,
          contactNumber: match[2],
        };
      }
    }

    // Default to India (+91) if no country code detected
    // Remove leading 0 if present (common in Indian numbers)
    const number = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
    return {
      countryCode: '+91',
      contactNumber: number || '0000000000',
    };
  }

  /**
   * Build full message from subject and message
   */
  private buildMessage(subject?: string, message?: string): string {
    const parts: string[] = [];
    
    if (subject && subject.trim()) {
      parts.push(`Subject: ${subject.trim()}`);
    }
    
    if (message && message.trim()) {
      parts.push(message.trim());
    }

    const fullMessage = parts.join('\n\n');
    
    // Ensure message is not empty (required field)
    if (!fullMessage || fullMessage.trim() === '') {
      return 'No message provided';
    }

    // Truncate if too long (max 1000 chars)
    return fullMessage.length > 1000 ? fullMessage.substring(0, 997) + '...' : fullMessage;
  }
}

