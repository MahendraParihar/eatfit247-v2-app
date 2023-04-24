import {Component, OnInit, ViewChild} from '@angular/core';
import {NavItem} from "../../interfaces/nav-item";
import {Subscription} from "rxjs";
import {filter, map} from "rxjs/operators";
import {NavigationService} from "../../service/navigation.service";
import {menuList} from "./menu-list";
import {MediaChange, MediaObserver} from "@angular/flex-layout";
import {StringResources} from "../../enum/string-resources";
import {AuthUserModel} from "../../models/auth-user.model";
import {SharedService} from "../../service/shared.service";
import {NavigationPathEnum} from "../../enum/navigation-path-enum";
import {BreadcrumbItem} from "../../interfaces/breadcrumb-item";
import {Router} from "@angular/router";
import {MatSidenav} from '@angular/material/sidenav';

@Component({
  selector: 'app-base-layout',
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.scss'],

})
export class BaseLayoutComponent implements OnInit {

  authUserObj?: AuthUserModel;

  stringRes = StringResources;
  appTitle = StringResources.APP_TITLE;

  public opened = false;
  public menu: NavItem[] = menuList;
  breadcrumbList: BreadcrumbItem[];
  @ViewChild('sidenav') sidenav: MatSidenav;
  private mediaWatcher: Subscription;

  constructor(private media: MediaObserver,
              private navService: NavigationService,
              private router: Router,
              private sharedService: SharedService) {

    this.mediaWatcher = this.media.asObservable().pipe(
      filter((changes: MediaChange[]) => changes.length > 0),
      map((changes: MediaChange[]) => changes[0])
    ).subscribe((mediaChange: MediaChange) => {
      this.handleMediaChange(mediaChange);
    });
    this.sharedService.loginUser.subscribe((authUser: AuthUserModel) => {
      if (!authUser) {
        this.signOut();
      }
      this.authUserObj = authUser;
    });
    this.sharedService.breadcrumb.subscribe((itemList: BreadcrumbItem[]) => {
      if (!itemList || itemList.length === 0) {
        this.breadcrumbList = [];
        this.breadcrumbList.push({title: StringResources.HOME});
      } else {
        this.breadcrumbList = itemList;
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.mediaWatcher) {
      this.mediaWatcher.unsubscribe();
    }
  }

  editProfile() {
    this.navService.navigateTo(NavigationPathEnum.ADMIN_EDIT_PROFILE);
  }

  changePassword() {
    this.navService.navigateTo(NavigationPathEnum.ADMIN_CHANGE_PASSWORD);
  }

  setting() {
    this.navService.navigateTo(NavigationPathEnum.ADMIN_SETTING);
  }

  signOut() {
    this.navService.signOut();
  }

  onItemClicked(item: BreadcrumbItem) {
    if (item.path) {
      if (item.id && item.id > 0) {
        this.navService.navigateToById(item.path, item.id);
      } else {
        this.navService.navigateTo(item.path);
      }
      this.closeDrawer();
    }
  }

  closeDrawer() {
    if (this.sidenav) {
      // this.sidenav.close();
    }
  }

  private handleMediaChange(mediaChange: MediaChange): void {
    this.opened = !this.media.isActive('lt-md');
  }

}

