import { Logger } from '@nestjs/common';
import { SequelizeOptions } from 'sequelize-typescript';
import { Env } from './utils/env.values';

const logger = new Logger('Sequelize SQL');
export const databaseConfig: SequelizeOptions = {
  username: Env.databaseUsername,
  password: Env.databasePassword,
  database: Env.databaseName,
  host: Env.databaseHost,
  port: Env.databasePort,
  dialect: 'postgres',
  logging: (msg) => {
    logger.debug(msg);
  },
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
};

