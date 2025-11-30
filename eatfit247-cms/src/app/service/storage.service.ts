import { AESCryptoUtil } from '../utilites/crypto-aes';
import { Injectable } from '@angular/core';
import { IAuthUser } from 'shared-lib';
import { UserService } from 'src/app/service/user.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private static AUTH_USER = 'auth_user';
  private static AUTH_TOKEN = 'bToken';
  private static REFRESH_TOKEN = 'rToken';

  constructor(private userService: UserService) {
  }

  public static clearStorage(): void {
    localStorage.clear();
  }

  private static set(key: string, data: any): void {
    localStorage.setItem(key, data);
  }

  private static get(key: string): any {
    return localStorage.getItem(key);
  }

  private static delete(key: string): any {
    localStorage.removeItem(key);
  }

  // region user
  public setAuthUser(authUser: IAuthUser): void {
    this.userService.login(authUser);
    let userStr = JSON.stringify(authUser);
    userStr = AESCryptoUtil.encryptUsingAES256(userStr);
    StorageService.set(StorageService.AUTH_USER, userStr);
  }

  public getAuthUser(): any | null {
    const s = StorageService.get(StorageService.AUTH_USER);
    if (s) {
      const userStr = AESCryptoUtil.decryptUsingAES256(s);
      return <IAuthUser>JSON.parse(userStr);
    }
    return null;
  }

  public clearAuthUser(): void {
    StorageService.clearStorage();
  }

  public getAccessToken() {
    const t = StorageService.get(StorageService.AUTH_TOKEN) as string;
    if (t) {
      return t;
    }
    return null;
  }

  public setAccessToken(token: string) {
    StorageService.set(StorageService.AUTH_TOKEN, token);
  }

  public getRefreshToken() {
    const t = StorageService.get(StorageService.REFRESH_TOKEN) as string;
    if (t) {
      return t;
    }
    return null;
  }

  public setRefreshToken(token: string) {
    StorageService.set(StorageService.REFRESH_TOKEN, token);
  }

  //endregion
}
