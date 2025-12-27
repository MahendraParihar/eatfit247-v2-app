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
  selector: 'lib-member-pocket-guide',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatProgressSpinnerModule, EmptyStateComponent],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Member Pocket Guide</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        <mat-list *ngIf="!loading && pocketGuides.length > 0">
          <mat-list-item *ngFor="let guide of pocketGuides">
            <mat-icon matListItemIcon>menu_book</mat-icon>
            <div matListItemTitle>{{ guide.pocketGuide || guide.name }}</div>
            <div matListItemLine *ngIf="guide.description">{{ guide.description }}</div>
          </mat-list-item>
        </mat-list>
        <lib-empty-state
          *ngIf="!loading && pocketGuides.length === 0"
          [type]="EmptyStateType.MEMBER_POCKET_GUIDE">
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
export class MemberPocketGuideComponent implements OnInit, OnDestroy {
  memberId!: number;
  pocketGuides: any[] = [];
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
        this.loadPocketGuides();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPocketGuides(): Promise<void> {
    this.loading = true;
    try {
      this.pocketGuides = await this.apiService.getPocketGuides(this.memberId);
    } catch (error) {
      console.error('Error loading pocket guides:', error);
      this.pocketGuides = [];
    } finally {
      this.loading = false;
    }
  }
}
