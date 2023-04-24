import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { CommonModule } from '../common/common.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';

@Module({
  controllers: [AccountController],
  imports: [
    PassportModule,
    CommonModule,
    SequelizeModule.forFeature(ModelList),
    JwtModule.register({
      secret: process.env.JWTKEY,
      signOptions: {
        expiresIn: process.env.TOKEN_EXPIRATION,
      },
    }),
  ],
  exports: [],
  providers: [AccountService, JwtStrategy],
})
export class AccountModule {}
