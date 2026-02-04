import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderComponent } from '@shared';
import { IFranchise } from '@eatfit247-shared-lib';
import { FranchiseApiService } from '../api.service';
import { Subject, takeUntil } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'lib-franchise-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    LoaderComponent,
  ],
  templateUrl: './franchise-details.html',
  styleUrl: './franchise-details.scss',
})
export class FranchiseDetailsComponent implements OnInit, OnDestroy {
  franchiseId!: number;
  franchise: IFranchise | null = null;
  loading = false;
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(FranchiseApiService);
  private snackBar = inject(MatSnackBar);
  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
  ];

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.franchiseId = +params['id'];
      if (this.franchiseId) {
        this.loadFranchiseDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadFranchiseDetails(): Promise<void> {
    this.loading = true;
    try {
      this.franchise = await this.apiService.getById(this.franchiseId);
    } catch {
      this.snackBar.open('Failed to load franchise details. Please try again.', 'Close', {
        duration: 5000,
      });
      this.router.navigate(['/franchise']);
    } finally {
      this.loading = false;
    }
  }

  getFranchiseDisplayName(): string {
    if (!this.franchise) return '';
    return this.franchise.companyName || 'Franchise';
  }

  getContactPersonName(): string {
    if (!this.franchise) return '';
    const firstName = this.franchise.firstName || '';
    const lastName = this.franchise.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  }
}

