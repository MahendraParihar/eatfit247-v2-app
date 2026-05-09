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

interface WidgetEntry {
  config: WidgetConfig;
  component: Type<unknown>;
}

@Component({
  selector: 'lib-dashboard',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);
  private readonly cdr = inject(ChangeDetectorRef);

  widgetEntries: WidgetEntry[] = [];
  loading = true;

  async ngOnInit(): Promise<void> {
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
