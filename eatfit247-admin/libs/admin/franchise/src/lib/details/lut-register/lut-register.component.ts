import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { FranchiseLutStatus, IFranchiseLut } from '@eatfit247-shared-lib';
import { FranchiseApiService } from '../../api.service';
import { ManageLutDialogComponent, ManageLutDialogData } from './manage-lut-dialog.component';

/**
 * Letter of Undertaking register of a franchise (roadmap 4.6). The LUT valid on the supply date
 * makes an export 0%; without one, exports are charged IGST.
 */
@Component({
  selector: 'lib-lut-register',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './lut-register.component.html',
  styleUrl: './lut-register.component.scss',
})
export class LutRegisterComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private apiService = inject(FranchiseApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  franchiseId!: number;
  loading = signal(true);
  luts = signal<IFranchiseLut[]>([]);
  busyIds = signal<Set<number>>(new Set());
  displayedColumns = ['arn', 'financialYear', 'validFrom', 'validTo', 'status', 'actions'];

  readonly statusLabels: Record<FranchiseLutStatus, string> = {
    VALID: 'Valid',
    EXPIRING: 'Expires soon',
    EXPIRED: 'Expired',
    FUTURE: 'Not started',
    INCOMPLETE: 'Dates missing',
    INACTIVE: 'Inactive',
  };

  statusLabel(status: FranchiseLutStatus): string {
    return this.statusLabels[status] ?? status;
  }

  ngOnInit(): void {
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.franchiseId = +params['id'];
      if (this.franchiseId) {
        this.load();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.luts.set(await this.apiService.listLuts(this.franchiseId));
    } catch {
      // Error toast is handled by HttpErrorInterceptor
      this.luts.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async openDialog(lut?: IFranchiseLut): Promise<void> {
    const ref = this.dialog.open(ManageLutDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      data: { franchiseId: this.franchiseId, lut } as ManageLutDialogData,
    });
    if ((await firstValueFrom(ref.afterClosed())) === true) {
      await this.load();
    }
  }

  async toggleActive(lut: IFranchiseLut): Promise<void> {
    if (this.busyIds().has(lut.franchiseLutId)) {
      return;
    }
    this.busyIds.update((ids) => new Set(ids).add(lut.franchiseLutId));
    try {
      await this.apiService.setLutStatus(this.franchiseId, lut.franchiseLutId, !lut.active);
      this.snackBar.open(lut.active ? 'LUT deactivated' : 'LUT activated', 'Close', { duration: 3000 });
      await this.load();
    } catch {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.busyIds.update((ids) => {
        const next = new Set(ids);
        next.delete(lut.franchiseLutId);
        return next;
      });
    }
  }
}
