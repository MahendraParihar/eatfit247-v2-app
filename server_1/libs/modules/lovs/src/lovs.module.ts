import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forFeature([]),
  ],
  controllers: [],
  providers: [],
  exports: [
    SequelizeModule,
  ],
})
export class LovsModule {
}
