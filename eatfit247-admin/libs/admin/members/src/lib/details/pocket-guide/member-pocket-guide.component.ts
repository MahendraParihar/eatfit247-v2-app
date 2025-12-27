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
  selector: 'lib-member-pocket-guide',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, EmptyStateComponent, LoaderComponent],
  templateUrl: './member-pocket-guide.component.html',
  styleUrl: './member-pocket-guide.component.scss'
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
