import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface QuickAction {
  label: string;
  icon: string;
  action: string;
  color: string;
}

@Component({
  selector: 'lib-quick-actions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsComponent {
  @Input() memberId!: number;
  @Output() actionClick = new EventEmitter<{ action: string; memberId: number }>();

  private router = inject(Router);

  actions: QuickAction[] = [
    { label: 'Update Assessment', icon: 'assignment', action: 'update-assessment', color: 'primary' },
    { label: 'Create Diet', icon: 'restaurant_menu', action: 'create-diet', color: 'primary' },
    { label: 'Log Call', icon: 'phone', action: 'log-call', color: 'primary' },
    { label: 'Add Payment', icon: 'payments', action: 'add-payment', color: 'primary' },
    { label: 'Reply to Issue', icon: 'reply', action: 'reply-issue', color: 'primary' },
  ];

  onActionClick(action: QuickAction): void {
    const routes: Record<string, string> = {
      'update-assessment': `/members/${this.memberId}/details/assessment`,
      'create-diet': `/members/${this.memberId}/details/diet-plan`,
      'log-call': `/members/${this.memberId}/details/call-logs`,
      'add-payment': `/members/${this.memberId}/details/payment-history`,
      'reply-issue': `/members/${this.memberId}/details/issues`,
    };

    if (routes[action.action]) {
      this.router.navigate([routes[action.action]]);
    } else {
      this.actionClick.emit({ action: action.action, memberId: this.memberId });
    }
  }
}

