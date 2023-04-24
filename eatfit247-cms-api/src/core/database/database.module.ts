import { Module } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import * as dotenv from 'dotenv';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from './db.model-list';

dotenv.config();

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME_DEVELOPMENT,
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      retryAttempts: 10,
      retryDelay: 3000,
      autoLoadModels: false,
      synchronize: true,
      models: ModelList,
      /*dialectOptions: {
          useUTC: false, // for reading from database
      },
      timezone: '+05:30', // for writing to database*/
    }),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class DatabaseModule {
  constructor(private sequelize: Sequelize) {
    this.syncTables()
      .then()
      .catch((error) => {});
  }

  async syncTables() {
    await this.sequelize.authenticate(); // to check for connection
    // await this.sequelize.sync(); // creates tables from model
  }
}
