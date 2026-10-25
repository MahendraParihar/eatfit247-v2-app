import { Component, inject, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PermissionService } from '@core';
import { IFranchise, IFranchiseTurnover, TurnoverAlertLevel } from '@eatfit247-shared-lib';
import { FranchiseApiService } from '../api.service';

export const TURNOVER_LOWER_BOUND_NOTE = 'Platform sales only; include any other sales under the same PAN';

/**
 * GST registration-threshold warning (compliant invoice numbering, decision 12). `chip` shows an amber /
 * red chip only once the franchise reaches 80%; `card` always shows the FY turnover against the
 * threshold. Loads its own turnover, and only for a franchise with a threshold, no GSTIN and in the
 * user's franchise scope.
 */
@Component({
  selector: 'lib-turnover-badge',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, MatTooltipModule, MatProgressBarModule],
  templateUrl: './turnover-badge.component.html',
  styleUrl: './turnover-badge.component.scss',
})
export class TurnoverBadgeComponent {
  @Input() mode: 'chip' | 'card' = 'chip';

  @Input() set franchise(franchise: IFranchise | null | undefined) {
    const id = franchise?.franchiseId ?? null;
    if (id === this.loadedId) {
      return;
    }
    this.loadedId = id;
    this.turnover = null;
    if (franchise && TurnoverBadgeComponent.isTracked(franchise) && this.inScope(franchise.franchiseId)) {
      void this.load(franchise.franchiseId);
    }
  }

  readonly note = TURNOVER_LOWER_BOUND_NOTE;
  readonly levels = TurnoverAlertLevel;
  turnover: IFranchiseTurnover | null = null;

  private readonly api = inject(FranchiseApiService);
  private readonly permissionService = inject(PermissionService);
  private loadedId: number | null = null;

  /** The warning applies while a threshold is set and there is no active GST registration (from the API). */
  static isTracked(franchise: IFranchise): boolean {
    return Number(franchise.registrationThresholdAmount || 0) > 0 && !franchise.gstRegistered;
  }

  get levelClass(): string {
    switch (this.turnover?.level) {
      case TurnoverAlertLevel.RED:
        return 'level-red';
      case TurnoverAlertLevel.AMBER:
        return 'level-amber';
      default:
        return 'level-none';
    }
  }

  get progress(): number {
    return Math.min(100, this.turnover?.percent ?? 0);
  }

  private inScope(franchiseId: number): boolean {
    const scope = this.permissionService.getFranchiseIds();
    return scope.length === 0 || scope.includes(franchiseId);
  }

  private async load(franchiseId: number): Promise<void> {
    try {
      const turnover = await this.api.getTurnover(franchiseId);
      if (this.loadedId === franchiseId) {
        this.turnover = turnover;
      }
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    }
  }
}
