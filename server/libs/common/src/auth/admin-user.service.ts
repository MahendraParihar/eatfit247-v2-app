import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MstAdminUser } from '../models/admin';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(MstAdminUser) private readonly adminRepository: typeof MstAdminUser,
  ) {}

  async findByEmailId(emailId: string): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne({
      where: { emailId: emailId },
    });
  }

  async findById(adminId: number): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne({
      where: { adminId: adminId },
    });
  }
}

