import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoaderComponent } from '@shared';
import { EmptyStateComponent } from '@shared';
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
export class FranchiseDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(FranchiseApiService);

  franchiseId!: number;
  loading = true;
  error: string | null = null;
  franchise: any = null;

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
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
    } catch (err: any) {
      this.error = err?.message || 'Failed to load franchise data';
    } finally {
      this.loading = false;
    }
  }

  onRefresh(): void {
    this.loadDashboardData();
  }
}

