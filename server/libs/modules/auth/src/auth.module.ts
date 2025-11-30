import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  MstAdminUser,
  TxnAdminUserForgotPasswordOtp,
  TxnAdminLastLoginDetail,
  TxnAdminRefreshToken,
  TxnAdminPasswordResetToken,
  Env, AdminUserService,
} from '@server/common';
import { JwtStrategy } from '@server/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: Env.jwtSecret,
      signOptions: {
        expiresIn: Env.accessTokenTime as any,
      },
    }),
    SequelizeModule.forFeature([
      MstAdminUser,
      TxnAdminUserForgotPasswordOtp,
      TxnAdminLastLoginDetail,
      TxnAdminRefreshToken,
      TxnAdminPasswordResetToken,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminUserService],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {
}

