import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Public, RecaptchaGuard, RequestedIp, RequireRecaptcha } from '@server_1/core';
import { ContactFormService } from '../../services';
import { CreateContactFormDto } from '../../dto';

@Public()
@Controller('contact')
export class PublicContactFormController {
  constructor(private readonly contactFormService: ContactFormService) {}

  @UseGuards(RecaptchaGuard)
  @RequireRecaptcha('contact_form_submit', 0.5)
  @Post('submit')
  async submit(
    @Body() body: CreateContactFormDto,
    @RequestedIp() requestedIp: string,
  ): Promise<{ contactFormId: number; message: string }> {
    const result = await this.contactFormService.create(body, requestedIp);
    return {
      contactFormId: result.contactFormId,
      message: 'Thank you for contacting us! We will get back to you soon.',
    };
  }
}

