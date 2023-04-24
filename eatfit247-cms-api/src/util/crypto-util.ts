import * as CryptoJS from 'crypto-js';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

export class CryptoUtil {
  constructor() {}

  public static encryptUsingAES256(value: any): string {
    const cfgOptions = this.getConfigOptions();
    const cryptKey = CryptoJS.enc.Utf8.parse(process.env.CRYPTO_PASS);
    // Encrypt
    return CryptoJS.AES.encrypt(value, cryptKey, cfgOptions).toString();
  }

  // The get method is use for decrypt the value.
  public static decryptUsingAES256(cipherTxt: any): string {
    const cfgOptions = this.getConfigOptions();
    const cryptKey = CryptoJS.enc.Utf8.parse(process.env.CRYPTO_PASS);

    const bytes = CryptoJS.AES.decrypt(cipherTxt, cryptKey, cfgOptions);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static getConfigOptions(): any {
    return {
      iv: CryptoJS.enc.Utf8.parse(process.env.CRYPTO_IV),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    };
  }

  static async hashPassword(password: string | Buffer) {
    return await bcrypt.hash(password, 10);
  }
}
