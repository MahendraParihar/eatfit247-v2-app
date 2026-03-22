import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderComponent } from '@shared';
import { IAdminUser } from '@eatfit247-shared-lib';
import { AdminUserApiService } from '../api.service';
import { Subject, takeUntil } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'lib-admin-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LoaderComponent,
  ],
  templateUrl: './admin-details.html',
  styleUrl: './admin-details.scss',
})
export class AdminDetailsComponent implements OnInit, OnDestroy {
  adminId!: number;
  admin: IAdminUser | null = null;
  loading = false;
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(AdminUserApiService);
  private snackBar = inject(MatSnackBar);
  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
  ];

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.adminId = +params['id'];
      if (this.adminId) {
        this.loadAdminDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadAdminDetails(): Promise<void> {
    this.loading = true;
    try {
      this.admin = await this.apiService.getById(this.adminId);
    } catch (error) {
      this.snackBar.open(
        'Failed to load admin details. Please try again.',
        'Close',
        {
          duration: 5000,
        }
      );
      this.router.navigate(['/admin-user']);
    } finally {
      this.loading = false;
    }
  }

  getAdminDisplayName(): string {
    if (!this.admin) return '';
    const firstName = this.admin.firstName || '';
    const lastName = this.admin.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Admin User';
  }
}
