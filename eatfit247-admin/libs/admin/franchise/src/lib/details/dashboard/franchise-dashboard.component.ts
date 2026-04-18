import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { FranchiseApiService } from '../../api.service';

@Component({
  selector: 'lib-franchise-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './franchise-dashboard.component.html',
  styleUrl: './franchise-dashboard.component.scss',
})
export class FranchiseDashboardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private apiService = inject(FranchiseApiService);
  private destroy$ = new Subject<void>();

  franchiseId!: number;
  loading = true;
  error: string | null = null;
  franchise: any = null;

  ngOnInit(): void {
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.franchiseId = +params['id'];
      if (this.franchiseId) {
        this.loadDashboardData();
      }
    });
  }

  private async loadDashboardData(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      this.franchise = await this.apiService.getById(this.franchiseId);
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : 'Failed to load franchise data';
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRefresh(): void {
    this.loadDashboardData();
  }
}

