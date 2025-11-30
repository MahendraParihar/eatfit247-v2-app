import { Module } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from './db.model-list';
import { Env } from '../../util/env.values';

@Module({
  imports: [
    SequelizeModule.forRoot({
      username: Env.databaseUsername,
      password: Env.databasePassword,
      database: Env.databaseName,
      host: Env.databaseHost,
      port: Env.databasePort,
      dialect: 'postgres',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      logQueryParameters: true,
      schema: Env.databaseSchema,
      dialectOptions: {
        statement_timeout: 60000,
        query_timeout: 60000,
      },
      pool: {
        max: 100,
        min: 10,
      },
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
