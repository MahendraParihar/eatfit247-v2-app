import * as os from 'os';
import * as path from 'path';

/**
 * Jest setupFiles entry for libs whose specs import @server_1/core: Env reads these at import
 * time, so tests get fixed dummy values instead of depending on a local .env.
 * PRIVATE_ASSET_PATH is a per-worker temp folder that specs may write files into.
 */
const testRoot = path.join(os.tmpdir(), `eatfit247-jest-${process.pid}`);

Object.assign(process.env, {
  NODE_ENV: 'test',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  JWT_ACCESS_SECRET: 'test-access-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  PASSWORD_RESET_EXPIRATION_MIN: '60',
  CHECKOUT_TOKEN_SECRET: 'test-checkout-secret',
  CRYPTO_SECRET_KEY: '0123456789abcdef0123456789abcdef',
  CRYPTO_SECRET_IV: '0123456789abcdef',
  CRYPTO_API_SECRET_KEY: '0123456789abcdef0123456789abcdef',
  CRYPTO_API_SECRET_IV: '0123456789abcdef',
  ASSET_PATH: path.join(testRoot, 'media-files'),
  PRIVATE_ASSET_PATH: path.join(testRoot, 'private-files'),
});
