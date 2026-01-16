import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent, EmptyStateType, LoaderComponent } from '@shared';

@Component({
  selector: 'lib-diet-progress',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './diet-progress.component.html',
  styleUrl: './diet-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietProgressComponent {
  @Input() data: any;
  @Input() memberId!: number;
  @Input() loading = false;

  EmptyStateType = EmptyStateType;

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

