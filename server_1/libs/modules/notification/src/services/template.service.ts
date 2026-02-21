import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  /**
   * Render template with parameters
   * @param template - Template string with placeholders
   * @param params - Parameters to replace
   * @returns Rendered template
   */
  render(template: string, params: Record<string, string | number>): string {
    try {
      let rendered = template;

      // Replace placeholders like {{memberName}}, {{dietPdfUrl}}
      Object.entries(params).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        rendered = rendered.replace(placeholder, String(value));
      });

      return rendered;
    } catch (error: any) {
      this.logger.error(`Error rendering template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Prepare notification content from DTO
   * @param dto - Notification DTO
   * @returns Prepared content with message and subject
   */
  prepareNotificationContent(dto: SendNotificationDto): { message: string; subject?: string } {
    let message = dto.message || '';
    let subject = dto.subject;

    // If template name is provided, render template
    if (dto.templateName && dto.templateParams) {
      // In a real implementation, you would fetch the template from database
      // For now, we'll use the message as template if provided
      if (message) {
        message = this.render(message, dto.templateParams);
      }

      if (subject) {
        subject = this.render(subject, dto.templateParams);
      }
    }

    return { message, subject };
  }
}
