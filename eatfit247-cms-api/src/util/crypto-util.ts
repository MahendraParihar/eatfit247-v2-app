import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as CryptoJS from 'crypto-js';

const secretKey = 'dsakl@740%knvsdkhrjsdcopimcnxz';
const secretIV = '589347fjljcm,ncvuf@iovxsd9082';
const encryptionMethod = 'aes-256-cbc';

export class CryptoUtil {
  // API encryption keys - must match frontend Constants.CH_PK and Constants.CH_IV_K
  // Frontend: CH_PK = 'FJK&SDFF%7$8EW50', CH_IV_K = 'FHA*HJK%U5U@TE87'
  // CryptoJS parses these as UTF-8 WordArrays and uses them directly
  private static apiSecretKey = 'FJK&SDFF%7$8EW50'; // Frontend CH_PK
  private static apiSecretIV = 'FHA*HJK%U5U@TE87'; // Frontend CH_IV_K
  // Generate secret hash with crypto to use for encryption
  static key = crypto.createHash('sha512').update(secretKey).digest('hex').substring(0, 32);
  static encryptionIV = crypto.createHash('sha512').update(secretIV).digest('hex').substring(0, 16);
  // Generate API key and IV from frontend keys (matching CryptoJS UTF-8 parse format)
  // CryptoJS.enc.Utf8.parse() converts string to WordArray, then pads/derives to required key size
  // For AES-256, CryptoJS derives 256-bit (32-byte) key from the provided key material
  // Using MD5 hash to match CryptoJS's EVP_BytesToKey-like derivation for explicit IV mode
  private static getApiKey(): Buffer {
    const key1 = crypto.createHash('md5').update(this.apiSecretKey).digest();
    const key2 = crypto.createHash('md5').update(this.apiSecretKey + this.apiSecretKey).digest();
    return Buffer.concat([key1, key2]); // 32 bytes for AES-256
  }
  static apiKey = CryptoUtil.getApiKey();
  static apiEncryptionIV = Buffer.from(this.apiSecretIV, 'utf8').slice(0, 16); // 16 bytes for IV (exact match)

  // Encrypt data
  static encryptData(data: string) {
    if (!secretKey || !secretIV || !encryptionMethod) {
      throw new Error('secretKey, secretIV, and ecnryptionMethod are required');
    }
    const cipher = crypto.createCipheriv(encryptionMethod, this.key, this.encryptionIV);
    return Buffer.from(cipher.update(data, 'utf8', 'hex') + cipher.final('hex')).toString('base64'); // Encrypts data and converts to hex and base64
  }

  // Decrypt API DATA - decrypts data sent from frontend (CryptoJS AES-256-CBC format)
  // Frontend uses: CryptoJS.AES.encrypt(value, key, {iv, mode: CBC, padding: Pkcs7})
  // Use crypto-js library to ensure exact compatibility with frontend encryption
  static decryptApiData(encryptedData: string): string {
    try {
      // Use CryptoJS to decrypt - matches frontend encryption exactly
      const cryptKey = CryptoJS.enc.Utf8.parse(this.apiSecretKey);
      const cryptIV = CryptoJS.enc.Utf8.parse(this.apiSecretIV);
      
      const cfgOptions = {
        iv: cryptIV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      };
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, cryptKey, cfgOptions);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption resulted in empty string - invalid encrypted data');
      }
      
      return decrypted;
    } catch (error) {
      throw new Error(`Failed to decrypt API data: ${error.message}`);
    }
  }

  // Decrypt data
  static decryptData(encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv(encryptionMethod, this.key, this.encryptionIV);
    return decipher.update(buff.toString('utf8'), 'hex', 'utf8') + decipher.final('utf8'); // Decrypts data and converts to utf8
  }

  static async generateHash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  static async compareHash(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
