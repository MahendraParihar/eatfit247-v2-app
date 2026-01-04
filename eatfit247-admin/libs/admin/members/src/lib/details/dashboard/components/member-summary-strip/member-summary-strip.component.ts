import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lib-member-summary-strip',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  templateUrl: './member-summary-strip.component.html',
  styleUrl: './member-summary-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberSummaryStripComponent {
  @Input() data: any;
  @Input() memberId!: number;

  getStatusColor(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'primary',
      inactive: 'warn',
      pending: 'accent',
    };
    return statusMap[status?.toLowerCase()] || 'primary';
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

