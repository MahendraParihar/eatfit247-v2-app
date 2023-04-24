import { EmailTypeEnum } from 'src/enums/email-type-enum';
import { IBaseUser } from 'src/modules/member/interfaces/member.interface';

export interface IEmailParams {
  emailType: EmailTypeEnum;
  toUserInfo?: IBaseUser;
  attachments?: IAttachment[];
  message?: string;
  response?: string;
}

export interface IAttachment {
  name: string;
  path: string;
}
