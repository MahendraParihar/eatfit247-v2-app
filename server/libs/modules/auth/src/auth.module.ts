import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  Env, AdminUserService,
} from '@server/common';
import { JwtStrategy } from '@server/common';
import { EmailModule } from '../../email';
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
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminUserService],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {
}

