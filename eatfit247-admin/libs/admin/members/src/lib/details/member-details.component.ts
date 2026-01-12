import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderComponent } from '@shared';
import { IMember, IDropdownItem } from '@eatfit247-shared-lib';
import { MembersApiService } from '../api.service';
import { Subject, takeUntil } from 'rxjs';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'lib-member-details',
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
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LoaderComponent,
  ],
  templateUrl: './member-details.html',
  styleUrl: './member-details.scss',
})
export class MemberDetailsComponent implements OnInit, OnDestroy {
  memberId!: number;
  member: IMember | null = null;
  loading = false;
  updatingNutritionist = false;
  updatingFranchise = false;
  franchiseOptions: IDropdownItem[] = [];
  nutritionistOptions: IDropdownItem[] = [];
  selectedFranchiseId: number | null = null;
  selectedNutritionistId: number | null = null;
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(MembersApiService);
  private snackBar = inject(MatSnackBar);
  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
    { label: 'Assessment', icon: 'assignment', route: 'assessment' },
    { label: 'Pocket Guide', icon: 'menu_book', route: 'pocket-guide' },
    { label: 'Health Issues', icon: 'local_hospital', route: 'health-issues' },
    {
      label: 'Body Stats',
      icon: 'fitness_center',
      route: 'health-parameter-logs',
    },
    { label: 'Issues', icon: 'report_problem', route: 'issues' },
    { label: 'Call Logs', icon: 'phone', route: 'call-logs' },
    { label: 'Payment History', icon: 'payments', route: 'payment-history' },
    { label: 'Product Orders', icon: 'shopping_cart', route: 'product-orders' },
    { label: 'Diet Plan', icon: 'restaurant', route: 'diet-plan' },
    { label: 'Addresses', icon: 'location_on', route: 'addresses' },
  ];

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadDropdowns();
        this.loadMemberDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadDropdowns(): Promise<void> {
    try {
      [this.franchiseOptions, this.nutritionistOptions] = await Promise.all([
        this.apiService.getFranchiseDropdown(),
        this.apiService.getNutritionistDropdown(),
      ]);
    } catch (error) {
      console.error('Error loading dropdowns:', error);
    }
  }

  async loadMemberDetails(): Promise<void> {
    this.loading = true;
    try {
      this.member = await this.apiService.getById(this.memberId);
      if (this.member) {
        this.selectedFranchiseId = this.member.franchiseId || null;
        this.selectedNutritionistId = this.member.nutritionistId || null;
      }
    } catch (error) {
      console.error('Error loading member details:', error);
    } finally {
      this.loading = false;
    }
  }

  async updateNutritionist(): Promise<void> {
    if (!this.member || this.updatingNutritionist) return;

    this.updatingNutritionist = true;
    try {
      await this.apiService.updateNutritionist(
        this.memberId,
        this.selectedNutritionistId
      );
      await this.loadMemberDetails();
      this.snackBar.open(
        'Nutritionist updated successfully',
        'Close',
        { duration: 3000 }
      );
    } catch (error) {
      console.error('Error updating nutritionist:', error);
      this.snackBar.open(
        'Failed to update nutritionist',
        'Close',
        { duration: 3000 }
      );
    } finally {
      this.updatingNutritionist = false;
    }
  }

  async updateFranchise(): Promise<void> {
    if (!this.member || this.updatingFranchise) return;

    this.updatingFranchise = true;
    try {
      await this.apiService.updateFranchise(
        this.memberId,
        this.selectedFranchiseId
      );
      await this.loadMemberDetails();
      this.snackBar.open(
        'Franchise updated successfully',
        'Close',
        { duration: 3000 }
      );
    } catch (error) {
      console.error('Error updating franchise:', error);
      this.snackBar.open(
        'Failed to update franchise',
        'Close',
        { duration: 3000 }
      );
    } finally {
      this.updatingFranchise = false;
    }
  }

  getMemberDisplayName(): string {
    if (!this.member) return '';
    return (
      `${this.member.firstName || ''} ${this.member.lastName || ''}`.trim() ||
      'Member'
    );
  }
}
