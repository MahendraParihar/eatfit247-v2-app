import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  Type,
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { PermissionService } from '@core';
import { resolveWidgetsForUser, WidgetConfig } from './widget-registry';
import { AnnualDashboardComponent } from './components/annual-dashboard/annual-dashboard.component';

interface WidgetEntry {
  config: WidgetConfig;
  component: Type<unknown>;
}

const ANNUAL_DASHBOARD_ROLES = ['super_admin', 'admin', 'franchise_admin'];

@Component({
  selector: 'lib-dashboard',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, AnnualDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  widgetEntries: WidgetEntry[] = [];
  loading = true;
  useAnnualDashboard = false;

  async ngOnInit(): Promise<void> {
    const roleCodes = this.permissionService.getRoleCodes();
    this.useAnnualDashboard = roleCodes.some((code) => ANNUAL_DASHBOARD_ROLES.includes(code));

    if (this.useAnnualDashboard) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    const permissions = this.permissionService.getPermissions();
    const configs = resolveWidgetsForUser(permissions);

    const loaded = await Promise.all(
      configs.map(async (config) => ({
        config,
        component: await config.load(),
      })),
    );

    this.widgetEntries = loaded;
    this.loading = false;
    this.cdr.markForCheck();
  }
}
