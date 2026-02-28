import { Logger } from '@nestjs/common';
import { SequelizeOptions } from 'sequelize-typescript';
import { Env } from '../config/env.values';

const logger = new Logger('Sequelize SQL');
export const databaseConfig: SequelizeOptions & {
  retryAttempts?: number;
  retryDelay?: number;
} = {
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
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retryAttempts: 3, // Reduced from 10 to 3 for faster failure detection
  retryDelay: 1000, // Reduced from 3000ms to 1000ms for faster retries
};

