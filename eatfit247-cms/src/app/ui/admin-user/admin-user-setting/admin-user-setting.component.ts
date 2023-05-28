import { Component, OnInit } from '@angular/core';
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { NavigationService } from '../../../service/navigation.service';
import { StringResources } from '../../../enum/string-resources';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-user-setting',
  templateUrl: './admin-user-setting.component.html',
  styleUrls: ['./admin-user-setting.component.scss'],
})
export class AdminUserSettingComponent implements OnInit {
  stringRes = StringResources;
  activeTag = 0;

  constructor(private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute) {
  }

  ngOnInit(): void {
  }

  navigateTo(index: number): void {
    switch (index) {
      case 0:
        this.navigationService.navigateByStrPath(NavigationPathEnum.ADMIN_EDIT_PROFILE.toString());
        break;
      case 1:
        this.navigationService.navigateByStrPath(NavigationPathEnum.ADMIN_CHANGE_PASSWORD.toString());
        break;
    }
  }
}
