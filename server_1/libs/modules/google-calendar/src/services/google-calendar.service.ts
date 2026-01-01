import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AppConfigService, CryptoUtil, MstAdminUser } from '@server_1/core';
import { google } from 'googleapis';
import { ConfigParam, IGoogleCalendarStatus } from '@eatfit247-shared-lib';

@Injectable()
export class GoogleCalendarService {
  constructor() {}
}
