import { Component, Input, OnInit } from '@angular/core';
import { IAdminShortInfo } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-admin-short-info',
  templateUrl: './admin-short-info.component.html',
  styleUrls: ['./admin-short-info.component.scss']
})
export class AdminShortInfoComponent implements OnInit {
  @Input()
  adminShortInfo: IAdminShortInfo;

  constructor() {
  }

  ngOnInit(): void {
  }
}
