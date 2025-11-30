import { EmailTypeEnum } from 'shared-lib';
import { IBaseUser } from 'src/modules/member/interfaces/member.interface';

export interface IEmailParams {
  emailType: EmailTypeEnum;
  toUserInfo?: IBaseUser;
  attachments?: IAttachment[];
  message?: string;
  response?: string;
  otp?: string; // OTP for password reset
}

export interface IAttachment {
  name: string;
  path: string;
}
