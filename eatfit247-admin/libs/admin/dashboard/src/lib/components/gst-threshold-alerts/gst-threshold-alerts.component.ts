import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PermissionService } from '@core';
import { AdminSubjectEnum, IFranchise } from '@eatfit247-shared-lib';
import { FranchiseApiService, TurnoverBadgeComponent } from 'franchise';

/**
 * Dashboard card listing every franchise tracked against its GST registration threshold (no GSTIN,
 * threshold set; compliant invoice numbering, decision 12). Renders nothing when none is tracked.
 */
@Component({
  selector: 'lib-gst-threshold-alerts',
  standalone: true,
  imports: [MatCardModule, TurnoverBadgeComponent],
  templateUrl: './gst-threshold-alerts.component.html',
  styleUrl: './gst-threshold-alerts.component.scss',
})
export class GstThresholdAlertsComponent implements OnInit {
  tracked: IFranchise[] = [];

  private readonly franchiseApi = inject(FranchiseApiService);
  private readonly permissionService = inject(PermissionService);

  async ngOnInit(): Promise<void> {
    if (!this.permissionService.hasPermission(AdminSubjectEnum.Franchise)) {
      return;
    }
    try {
      const list = await this.franchiseApi.getList({ page: 0, limit: 100 });
      this.tracked = (list.tableData || []).filter((franchise) => franchise.active && TurnoverBadgeComponent.isTracked(franchise));
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }
}
