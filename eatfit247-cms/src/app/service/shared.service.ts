import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {BreadcrumbItem} from "../interfaces/breadcrumb-item";

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  public loader = false;
  private loginUserSubject = new BehaviorSubject<any>(null);
  public loginUser = this.loginUserSubject.asObservable();
  private breadcrumbSubject = new BehaviorSubject<BreadcrumbItem[]>(null);
  public breadcrumb = this.breadcrumbSubject.asObservable();
  private loaderSource = new BehaviorSubject(this.loader);


  constructor() {
  }

  setLoginUser(memberObj: any) {
    this.loginUserSubject.next(memberObj);
  }

  setBreadcrumb(obj: BreadcrumbItem[]) {
    this.breadcrumbSubject.next(obj);
  }

  setLoader(flag: boolean): void {
    this.loaderSource.next(flag);
  }

  getLoader(): any {
    return this.loaderSource.asObservable();
  }

}
