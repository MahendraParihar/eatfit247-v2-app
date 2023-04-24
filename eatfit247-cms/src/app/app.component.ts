import {AfterContentChecked, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {StorageService} from "./service/storage.service";
import {SharedService} from "./service/shared.service";
import {NavigationService} from "./service/navigation.service";
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy, AfterContentChecked {
  loader = false;
  loaderSubscription: Subscription;

  constructor(private storageService: StorageService,
              private sharedService: SharedService,
              private navigationService: NavigationService,
              private cdr: ChangeDetectorRef) {

    this.sharedService.getLoader().subscribe((data: boolean) => {
      this.loader = data;
    });

    const authUser = this.storageService.getAuthUser();
    if (authUser) {
      this.sharedService.setLoginUser(authUser);
    } else {
      this.navigationService.navigateToLogin();
    }

  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
  }
}
