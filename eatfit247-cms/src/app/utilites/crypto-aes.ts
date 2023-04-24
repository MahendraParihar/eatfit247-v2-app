import * as CryptoJS from 'crypto-js';
import {Constants} from "../constants/Constants";

export class AESCryptoUtil {
  constructor() {

  }

  static encryptUsingAES256(value: any) {
    const cfgOptions = this.getConfigOptions();
    const cryptKey = CryptoJS.enc.Utf8.parse(Constants.CH_PK);
    // Encrypt
    return CryptoJS.AES.encrypt(value, cryptKey, cfgOptions).toString();
  }

  // The get method is use for decrypt the value.
  static decryptUsingAES256(cipherTxt: any) {

    const cfgOptions = this.getConfigOptions();
    const cryptKey = CryptoJS.enc.Utf8.parse(Constants.CH_PK);

    const bytes = CryptoJS.AES.decrypt(cipherTxt, cryptKey, cfgOptions);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static getConfigOptions() {
    return {
      iv: CryptoJS.enc.Utf8.parse(Constants.CH_IV_K),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    };
  }
}

