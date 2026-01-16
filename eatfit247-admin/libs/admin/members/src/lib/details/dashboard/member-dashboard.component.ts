import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { MembersApiService } from '../../api.service';
import { MemberSummaryStripComponent } from './components/member-summary-strip/member-summary-strip.component';
import { HealthProgressComponent } from './components/health-progress/health-progress.component';
import { DietEngagementComponent } from './components/diet-engagement/diet-engagement.component';
import { DietProgressComponent } from './components/diet-progress/diet-progress.component';
import { PaymentsProgramComponent } from './components/payments-program/payments-program.component';
import { IssuesCommunicationComponent } from './components/issues-communication/issues-communication.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';

interface DashboardData {
  summary: any;
  healthProgress: any;
  engagement: any;
  payments: any;
  issues: any;
}

@Component({
  selector: 'lib-member-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    LoaderComponent,
    EmptyStateComponent,
    MemberSummaryStripComponent,
    HealthProgressComponent,
    DietEngagementComponent,
    DietProgressComponent,
    PaymentsProgramComponent,
    IssuesCommunicationComponent,
    QuickActionsComponent,
  ],
  templateUrl: './member-dashboard.component.html',
  styleUrl: './member-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(MembersApiService);
  private cdr = inject(ChangeDetectorRef);

  memberId!: number;
  loading = true;
  error: string | null = null;
  dashboardData: DashboardData = {
    summary: null,
    healthProgress: null,
    engagement: null,
    payments: null,
    issues: null,
  };

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadDashboardData();
      }
    });
  }

  private async loadDashboardData(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const [summary, healthProgress, engagement, payments, issues] = await Promise.all([
        this.apiService.getDashboardSummary(this.memberId),
        this.apiService.getHealthProgress(this.memberId),
        this.apiService.getEngagement(this.memberId),
        this.apiService.getPaymentsSummary(this.memberId),
        this.apiService.getIssuesSummary(this.memberId),
      ]);

      this.dashboardData = {
        summary,
        healthProgress,
        engagement,
        payments,
        issues,
      };
    } catch (err: any) {
      this.error = err?.message || 'Failed to load dashboard data';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onRefresh(): void {
    this.loadDashboardData();
  }
}
