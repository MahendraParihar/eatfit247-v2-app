import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminUserService, Env, JwtStrategy } from '@server_1/core';
import { NotificationsModule } from '../../notifications';
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
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminUserService],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {
}

