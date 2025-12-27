import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { LoaderComponent } from '@shared';
import { IMember } from '@eatfit247-shared-lib';
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
    LoaderComponent,
  ],
  templateUrl: './member-details.html',
  styleUrl: './member-details.scss',
})
export class MemberDetailsComponent implements OnInit, OnDestroy {
  memberId!: number;
  member: IMember | null = null;
  loading = false;
  private destroy$ = new Subject<void>();
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
    { label: 'Diet History', icon: 'restaurant_menu', route: 'diet-history' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: MembersApiService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadMemberDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadMemberDetails(): Promise<void> {
    this.loading = true;
    try {
      this.member = await this.apiService.getById(this.memberId);
    } catch (error) {
      console.error('Error loading member details:', error);
    } finally {
      this.loading = false;
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
