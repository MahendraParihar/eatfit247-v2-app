import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoaderComponent } from '@shared';
import { EmptyStateComponent } from '@shared';
import { AdminUserApiService } from '../../api.service';

@Component({
  selector: 'lib-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(AdminUserApiService);

  adminId!: number;
  loading = true;
  error: string | null = null;
  admin: any = null;

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      this.adminId = +params['id'];
      if (this.adminId) {
        this.loadDashboardData();
      }
    });
  }

  private async loadDashboardData(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      this.admin = await this.apiService.getById(this.adminId);
    } catch (err: any) {
      this.error = err?.message || 'Failed to load admin data';
    } finally {
      this.loading = false;
    }
  }

  onRefresh(): void {
    this.loadDashboardData();
  }
}

