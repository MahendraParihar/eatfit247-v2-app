import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyStateComponent, EmptyStateType } from '@shared';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-member-health-issues',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatProgressSpinnerModule, EmptyStateComponent],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Member Health Issues</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        <mat-list *ngIf="!loading && healthIssues.length > 0">
          <mat-list-item *ngFor="let issue of healthIssues">
            <mat-icon matListItemIcon>local_hospital</mat-icon>
            <div matListItemTitle>{{ issue.healthIssue || issue.name }}</div>
          </mat-list-item>
        </mat-list>
        <lib-empty-state
          *ngIf="!loading && healthIssues.length === 0"
          [type]="EmptyStateType.MEMBER_HEALTH_ISSUES">
        </lib-empty-state>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px;
      min-height: 300px;
    }
  `]
})
export class MemberHealthIssuesComponent implements OnInit, OnDestroy {
  memberId!: number;
  healthIssues: any[] = [];
  loading = false;
  EmptyStateType = EmptyStateType;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private apiService: MembersApiService
  ) {}

  ngOnInit(): void {
    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.memberId = +params['id'];
      if (this.memberId) {
        this.loadHealthIssues();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadHealthIssues(): Promise<void> {
    this.loading = true;
    try {
      this.healthIssues = await this.apiService.getHealthIssues(this.memberId);
    } catch (error) {
      console.error('Error loading health issues:', error);
      this.healthIssues = [];
    } finally {
      this.loading = false;
    }
  }
}
