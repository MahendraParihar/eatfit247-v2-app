import * as dotenv from 'dotenv';
import { IDatabaseConfig } from './interface/dbConfig.interface';
import { ModelList } from './db.model-list';
import { SequelizeOptions } from 'sequelize-typescript';

dotenv.config();

export const databaseConfig: IDatabaseConfig = {
  development: <SequelizeOptions>{
    dialect: process.env.DB_DIALECT ? process.env.DB_DIALECT.toString() : 'postgres',
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
    dialectOptions: {
      useUTC: false, // for reading from database
    },
    timezone: '+05:30', // for writing to database
  },
  test: <SequelizeOptions>{
    dialect: process.env.DB_DIALECT ? process.env.DB_DIALECT.toString() : 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    retryAttempts: 10,
    retryDelay: 3000,
    autoLoadModels: false,
    synchronize: true,
    models: ModelList,
    dialectOptions: {
      useUTC: false, // for reading from database
    },
    timezone: '+05:30', // for writing to database
  },
  production: <SequelizeOptions>{
    dialect: process.env.DB_DIALECT ? process.env.DB_DIALECT.toString() : 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_PRODUCTION,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    retryAttempts: 10,
    retryDelay: 3000,
    autoLoadModels: false,
    synchronize: true,
    models: ModelList,
    dialectOptions: {
      useUTC: false, // for reading from database
    },
    timezone: '+05:30', // for writing to database
  },
};
