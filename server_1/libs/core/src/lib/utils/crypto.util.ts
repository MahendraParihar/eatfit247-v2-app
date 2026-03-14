import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const ENCRYPTION_METHOD = 'aes-256-cbc';

/**
 * Ciphertext version tag.
 * New encryptions produce:  base64( "v2:<32-hex-iv>:<hex-ciphertext>" )
 * Legacy ciphertexts are:   base64( "<hex-ciphertext>" )  — static IV, kept for
 *                           backward-compat decryption of existing DB records.
 */
const CIPHER_VERSION = 'v2';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[CryptoUtil] Missing required environment variable: ${name}. ` +
        `Set it in your .env file and restart the server.`,
    );
  }
  return value;
}

function deriveKeyMaterial(secret: string, byteLength: number): string {
  return crypto.createHash('sha512').update(secret).digest('hex').substring(0, byteLength);
}

export class CryptoUtil {
  // Keys are read from env on every call so dotenv is guaranteed to be
  // loaded first (class-level statics initialise before dotenv.config()).
  private static get key(): string {
    return deriveKeyMaterial(requireEnv('CRYPTO_SECRET_KEY'), 32);
  }
  private static get legacyIV(): string {
    return deriveKeyMaterial(requireEnv('CRYPTO_SECRET_IV'), 16);
  }
  private static get apiKey(): string {
    return deriveKeyMaterial(requireEnv('CRYPTO_API_SECRET_KEY'), 32);
  }
  private static get legacyApiIV(): string {
    return deriveKeyMaterial(requireEnv('CRYPTO_API_SECRET_IV'), 16);
  }

  /**
   * Encrypt data with AES-256-CBC using a fresh random IV.
   * Output format: base64( "v2:<32-hex-iv>:<hex-ciphertext>" )
   */
  static encryptData(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_METHOD, this.key, new Uint8Array(iv));
    const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    return Buffer.from(`${CIPHER_VERSION}:${iv.toString('hex')}:${encrypted}`).toString('base64');
  }

  /**
   * Decrypt data.
   * Supports both the new v2 format (random IV prepended) and the legacy
   * format (static IV derived from CRYPTO_SECRET_IV) so existing DB records
   * are not broken.
   */
  static decryptData(encryptedData: string): string {
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');

    if (decoded.startsWith(`${CIPHER_VERSION}:`)) {
      const [, ivHex, cipherText] = decoded.split(':');
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_METHOD,
        this.key,
        new Uint8Array(Buffer.from(ivHex, 'hex')),
      );
      return decipher.update(cipherText, 'hex', 'utf8') + decipher.final('utf8');
    }

    // Legacy format — static IV
    const decipher = crypto.createDecipheriv(ENCRYPTION_METHOD, this.key, this.legacyIV);
    return decipher.update(decoded, 'hex', 'utf8') + decipher.final('utf8');
  }

  /**
   * Encrypt API credentials with a separate key pair.
   * Output format: base64( "v2:<32-hex-iv>:<hex-ciphertext>" )
   */
  static encryptApiData(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_METHOD, this.apiKey, new Uint8Array(iv));
    const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    return Buffer.from(`${CIPHER_VERSION}:${iv.toString('hex')}:${encrypted}`).toString('base64');
  }

  /**
   * Decrypt API credentials.
   * Supports both v2 (random IV) and legacy (static IV) formats.
   */
  static decryptApiData(encryptedData: string): string {
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');

    if (decoded.startsWith(`${CIPHER_VERSION}:`)) {
      const [, ivHex, cipherText] = decoded.split(':');
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_METHOD,
        this.apiKey,
        new Uint8Array(Buffer.from(ivHex, 'hex')),
      );
      return decipher.update(cipherText, 'hex', 'utf8') + decipher.final('utf8');
    }

    // Legacy format — static IV
    const decipher = crypto.createDecipheriv(ENCRYPTION_METHOD, this.apiKey, this.legacyApiIV);
    return decipher.update(decoded, 'hex', 'utf8') + decipher.final('utf8');
  }

  static async generateHash(password: string, round = 12): Promise<string> {
    if (!password) throw new Error('Password is required for hashing');
    if (round < 1 || round > 31) throw new Error('Bcrypt rounds must be between 1 and 31');
    const salt = await bcrypt.genSalt(round);
    return await bcrypt.hash(password, salt);
  }

  static async compareHash(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) throw new Error('Password and hash are required for comparison');
    return await bcrypt.compare(password, hash);
  }
}
