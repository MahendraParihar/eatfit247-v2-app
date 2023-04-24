import { SequelizeOptions } from 'sequelize-typescript';

export interface IDatabaseConfig {
  development: SequelizeOptions;
  test: SequelizeOptions;
  production: SequelizeOptions;
}
