import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EmptyStateType } from './empty-state.enum';

type IconVariant = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral';

interface EmptyStateConfig {
  title: string;
  description: string;
  icon: string;
  iconVariant: IconVariant;
}

@Component({
  selector: 'shared-ui-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() type?: EmptyStateType;
  @Input() title?: string;
  @Input() description?: string;
  @Input() icon?: string;
  @Input() iconVariant?: IconVariant;
  @Input() buttonLabel?: string;
  @Input() buttonIcon?: string;
  @Output() buttonClick = new EventEmitter<void>();

  get config(): EmptyStateConfig {
    if (this.title && this.description) {
      return {
        title: this.title,
        description: this.description,
        icon: this.icon || 'info',
        iconVariant: this.iconVariant || 'neutral',
      };
    }

    switch (this.type) {
      case EmptyStateType.MEMBER_POCKET_GUIDE:
        return {
          title: 'No Pocket Guides Yet',
          description: "This member doesn't have any pocket guides assigned at the moment.",
          icon: 'restaurant_menu',
          iconVariant: 'success',
        };

      case EmptyStateType.MEMBER_HEALTH_ISSUES:
        return {
          title: 'No Health Issues Recorded',
          description: "This member doesn't have any health issues assigned at the moment.",
          icon: 'health_and_safety',
          iconVariant: 'warning',
        };

      case EmptyStateType.MEMBER_HEALTH_PARAMETER_LOGS:
        return {
          title: 'No Health Parameter Logs',
          description: "This member doesn't have any health parameter logs recorded at the moment.",
          icon: 'fitness_center',
          iconVariant: 'error',
        };

      case EmptyStateType.MEMBER_ASSESSMENT:
        return {
          title: 'No Assessment Available',
          description: "This member doesn't have any assessment records at the moment.",
          icon: 'assignment',
          iconVariant: 'info',
        };

      case EmptyStateType.MEMBER_CALL_LOGS:
        return {
          title: 'No Call Logs Found',
          description: "This member doesn't have any call logs recorded at the moment.",
          icon: 'phone',
          iconVariant: 'primary',
        };

      case EmptyStateType.MEMBER_PAYMENT_HISTORY:
        return {
          title: 'No Payment History',
          description: "This member doesn't have any payment records at the moment.",
          icon: 'payments',
          iconVariant: 'success',
        };

      case EmptyStateType.MEMBER_DIET_HISTORY:
        return {
          title: 'No Diet History',
          description: "This member doesn't have any diet plan history at the moment.",
          icon: 'restaurant_menu',
          iconVariant: 'warning',
        };

      case EmptyStateType.MEMBER_ISSUES:
        return {
          title: 'No Issues Recorded',
          description: "This member doesn't have any issues recorded at the moment.",
          icon: 'report_problem',
          iconVariant: 'warning',
        };

      case EmptyStateType.MEMBER_DASHBOARD:
        return {
          title: 'No Dashboard Data',
          description: 'There is no dashboard data available for this member at the moment.',
          icon: 'dashboard',
          iconVariant: 'neutral',
        };

      default:
        return {
          title: 'No Data Available',
          description: 'There is no data available at the moment.',
          icon: 'info',
          iconVariant: 'neutral',
        };
    }
  }
}
