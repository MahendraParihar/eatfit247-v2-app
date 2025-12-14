import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const secretKey = 'dsakl@740%knvsdkhrjsdcopimcnxz';
const secretIV = '589347fjljcm,ncvuf@iovxsd9082';
const encryptionMethod = 'aes-256-cbc';

export class CryptoUtil {
  readonly apiSecretKey = 'kjadhk asklad alsd';
  readonly apiSecretIV = 'kjadhk asklad alsd';
  // Generate secret hash with crypto to use for encryption
  key = crypto.createHash('sha512').update(secretKey).digest('hex').substring(0, 32);
  encryptionIV = crypto.createHash('sha512').update(secretIV).digest('hex').substring(0, 16);
  // Generate secret hash with crypto to use for encryption
  apiKey = crypto.createHash('sha512').update(this.apiSecretKey).digest('hex').substring(0, 32);
  apiEncryptionIV = crypto.createHash('sha512').update(this.apiSecretIV).digest('hex').substring(0, 16);

  // Encrypt data
  encryptData(data: string) {
    if (!secretKey || !secretIV || !encryptionMethod) {
      throw new Error('secretKey, secretIV, and ecnryptionMethod are required');
    }
    const cipher = crypto.createCipheriv(encryptionMethod, this.key, this.encryptionIV);
    return Buffer.from(cipher.update(data, 'utf8', 'hex') + cipher.final('hex')).toString('base64'); // Encrypts data and converts to hex and base64
  }

  // Encrypt Decrypt API DATA
  decryptApiData(data: string) {
    if (!secretKey || !secretIV || !encryptionMethod) {
      throw new Error('secretKey, secretIV, and ecnryptionMethod are required');
    }
    const cipher = crypto.createCipheriv(encryptionMethod, this.apiKey, this.apiEncryptionIV);
    return Buffer.from(cipher.update(data, 'utf8', 'hex') + cipher.final('hex')).toString('base64'); // Encrypts data and converts to hex and base64
  }

  // Decrypt data
  decryptData(encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv(encryptionMethod, this.key, this.encryptionIV);
    return decipher.update(buff.toString('utf8'), 'hex', 'utf8') + decipher.final('utf8'); // Decrypts data and converts to utf8
  }

  static async generateHash(password: string, round: number = 12): Promise<string> {
    if (!password) {
      throw new Error('Password is required for hashing');
    }
    if (round < 1 || round > 31) {
      throw new Error('Bcrypt rounds must be between 1 and 31');
    }
    const salt = await bcrypt.genSalt(round);
    return await bcrypt.hash(password, salt);
  }

  static async compareHash(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      throw new Error('Password and hash are required for comparison');
    }
    return await bcrypt.compare(password, hash);
  }
}

