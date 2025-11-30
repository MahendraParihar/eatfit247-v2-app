import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IAuthUser } from 'shared-lib';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private loginUserSubject = new BehaviorSubject<IAuthUser | null>(null);
  public loginUser = this.loginUserSubject.asObservable();

  login(memberObj: any) {
    this.loginUserSubject.next(memberObj);
  }

  logout() {
    this.loginUserSubject.next(null);
  }
}
