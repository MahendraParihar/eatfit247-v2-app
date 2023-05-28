import { Component, Input, OnInit } from '@angular/core';
import { AdminShortInfoModel } from '../../../../models/admin-short-info.model';

@Component({
  selector: 'app-admin-short-info',
  templateUrl: './admin-short-info.component.html',
  styleUrls: ['./admin-short-info.component.scss'],
})
export class AdminShortInfoComponent implements OnInit {
  @Input()
  adminShortInfo: AdminShortInfoModel;

  constructor() {
  }

  ngOnInit(): void {
  }
}
