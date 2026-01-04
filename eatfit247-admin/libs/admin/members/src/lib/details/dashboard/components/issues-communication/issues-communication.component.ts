import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { LoaderComponent, EmptyStateComponent, EmptyStateType } from '@shared';

@Component({
  selector: 'lib-issues-communication',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './issues-communication.component.html',
  styleUrl: './issues-communication.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssuesCommunicationComponent {
  @Input() data: any;
  @Input() memberId!: number;
  @Input() loading = false;

  EmptyStateType = EmptyStateType;

  formatTime(timeInHours: number | string | Date | null | undefined): string {
    if (!timeInHours && timeInHours !== 0) return 'N/A';
    
    let hours: number;
    if (typeof timeInHours === 'string' || timeInHours instanceof Date) {
      const now = new Date().getTime();
      const then = new Date(timeInHours).getTime();
      hours = (now - then) / (1000 * 60 * 60);
    } else {
      hours = timeInHours;
    }

    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    if (hours < 24) {
      return `${Math.round(hours)} hours`;
    }
    return `${Math.round(hours / 24)} days`;
  }

  getIssueStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      open: 'warn',
      in_progress: 'accent',
      resolved: 'primary',
      closed: 'primary',
    };
    return statusMap[status?.toLowerCase()] || 'primary';
  }
}

