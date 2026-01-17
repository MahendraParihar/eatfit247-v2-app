import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Public, RequestedIp, RequireRecaptcha } from '@server_1/core';
import { RecaptchaGuard } from '@server_1/platform';
import { IManageMember } from '@eatfit247-shared-lib';
import { MemberService } from '../../services';
import { CreatePublicMemberDto } from '../../dto';

@Public()
@Controller('member')
export class PublicMemberController {
  constructor(private readonly memberService: MemberService) {}

  @UseGuards(RecaptchaGuard)
  @RequireRecaptcha('member_creation', 0.5)
  @Post('create')
  async createOrUpdate(
    @Body() body: CreatePublicMemberDto,
    @RequestedIp() requestedIp: string,
  ): Promise<{ memberId: number; isNew: boolean }> {
    // Convert DTO to IManageMember format
    // franchiseId will be auto-determined by the service based on countryId
    const memberData: IManageMember = {
      firstName: body.firstName,
      lastName: body.lastName,
      countryCode: body.countryCode,
      contactNumber: body.contactNumber,
      emailId: body.emailId,
      countryId: body.countryId,
      referrerId: body.referrerId,
      nutritionistId: body.nutritionistId,
      active: true,
      hasAnyPlan: false,
    };

    return await this.memberService.createOrUpdate(memberData, requestedIp);
  }
}

