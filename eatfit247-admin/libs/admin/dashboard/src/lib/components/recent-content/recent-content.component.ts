import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { EmptyStateComponent, LoaderComponent } from '@shared';
import { IRecentContentActivity } from '@eatfit247-shared-lib';
import { DashboardApiService } from '../../api.service';

@Component({
  selector: 'lib-recent-content',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatListModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './recent-content.component.html',
  styleUrl: './recent-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentContentComponent implements OnInit {
  private readonly apiService = inject(DashboardApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  data: IRecentContentActivity[] = [];
  loading = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.data = await this.apiService.getRecentContentActivity();
    } catch {
      // Error handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      blog: 'article',
      recipe: 'restaurant',
      faq: 'help',
      success_story: 'star',
    };
    return icons[type] || 'description';
  }

  getActionClass(action: string): string {
    const classes: Record<string, string> = {
      created: 'badge-created',
      updated: 'badge-updated',
      published: 'badge-published',
    };
    return classes[action] || '';
  }
}
