import * as dotenv from 'dotenv';
import { converterFactory, valueToBoolean, valueToNumber, valueToString } from './config.utils';

dotenv.config();
export const envExtractor = (key: string) => process.env[key];
const envToString = converterFactory(envExtractor, valueToString);
const envToBoolean = converterFactory(envExtractor, valueToBoolean);
const envToNumber = converterFactory(envExtractor, valueToNumber);

export class Env {
  public static databaseUsername = envToString('DB_USER');
  public static databasePassword = envToString('DB_PASSWORD');
  public static databaseName = envToString('DB_NAME');
  public static databaseHost = envToString('DB_HOST');
  public static databasePort = envToNumber('DB_PORT');
  public static databaseSchema = envToString('DB_SCHEMA', false, 'public');
  public static jwtSecret = envToString('JWT_ACCESS_SECRET');
  public static jwtRefreshSecret = envToString('JWT_REFRESH_SECRET', false);
  public static accessTokenTime = envToString('TOKEN_EXPIRATION', false, '15M');
  public static refreshTokenTime = envToString('REFRESH_TOKEN_TIME', false, '7D');
  public static maxLoginAttempts = envToNumber('MAX_LOGIN_ATTEMPTS', false, 5);
  public static lockoutDurationMinutes = envToNumber('LOCKOUT_DURATION_MINUTES', false, 30);
  public static apiPort = envToNumber('PORT', false, 3000);
  public static bcryptSaltRounds = envToNumber('BCRYPT_SALT_ROUNDS', true, 12);
  public static passwordResetExpirationMin = envToNumber('PASSWORD_RESET_EXPIRATION_MIN');
  public static readonly staticAssetPath = envToString('ASSET_PATH');
  public static readonly nodeEnv = envToString('NODE_ENV');
  public static readonly persistentStorageAssetPath = `${Env.staticAssetPath}`;
  public static readonly recaptchaSecretKey = envToString('RECAPTCHA_SECRET_KEY', false);

  public static get(key: string): string {
    return process.env[key] || '';
  }
}

