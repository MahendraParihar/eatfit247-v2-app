import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { StorageService } from './storage.service';
import { IAuthUser, IChangePassword, IResponse } from 'shared-lib';
import { ApiUrlEnum } from 'src/app/enum/api-url-enum';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private httpService: HttpService, private storageService: StorageService) {}

  async signIn(payload: { emailId: string; password: string }): Promise<boolean> {
    const res = (await this.httpService.postRequest<
      IResponse<{
        accessToken: string;
        refreshToken: string;
      }>
    >(ApiUrlEnum.LOGIN, payload)) as { accessToken: string; refreshToken: string };
    this.storageService.setAccessToken(res.accessToken);
    this.storageService.setRefreshToken(res.refreshToken);
    return true;
  }

  async refreshToken(): Promise<string> {
    const res = (await this.httpService.postRequest<IResponse<{ accessToken: string }>>(ApiUrlEnum.REFRESH_TOKEN, {
      refreshToken: this.storageService.getRefreshToken()
    })) as {
      accessToken: string;
    };
    this.storageService.setAccessToken(res.accessToken);
    return res.accessToken;
  }

  async changePassword(payload: IChangePassword): Promise<boolean> {
    const res = await this.httpService.postRequest<IResponse<boolean>>(ApiUrlEnum.CHANGE_PASSWORD, payload);
    if (res && res.data) {
      return res.data as boolean;
    }
    return false;
  }

  async getUserProfile(): Promise<IAuthUser> {
    return (await this.httpService.getRequest<IResponse<IAuthUser>>(ApiUrlEnum.PROFILE)) as IAuthUser;
  }
}
