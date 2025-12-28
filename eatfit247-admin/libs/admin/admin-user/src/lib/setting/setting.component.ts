import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarIntegrationComponent } from '../calendar-integration/calendar-integration.component';

@Component({
  selector: 'lib-setting',
  standalone: true,
  imports: [
    CommonModule,
    CalendarIntegrationComponent
  ],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.scss'
})
export class SettingComponent {}
