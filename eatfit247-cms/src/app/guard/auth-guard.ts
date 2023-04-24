import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {StorageService} from '../service/storage.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router,
              private storageService: StorageService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.storageService.getAuthUser() != null;
  }
}
