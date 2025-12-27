import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent, EmptyStateType, LoaderComponent } from '@shared';
import { MembersApiService } from '../../api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-member-health-issues',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, EmptyStateComponent, LoaderComponent],
  templateUrl: './member-health-issues.component.html',
  styleUrl: './member-health-issues.component.scss'
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
