import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateType } from './empty-state.enum';

interface EmptyStateConfig {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  backgroundColor: string;
}

@Component({
  selector: 'lib-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() type?: EmptyStateType;
  @Input() title?: string;
  @Input() description?: string;
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() backgroundColor?: string;

  get config(): EmptyStateConfig {
    // If custom title and description are provided, use them
    if (this.title && this.description) {
      return {
        title: this.title,
        description: this.description,
        icon: this.icon || 'info',
        iconColor: this.iconColor || '#9E9E9E',
        backgroundColor: this.backgroundColor || 'rgba(158, 158, 158, 0.1)',
      };
    }

    // Otherwise use the enum type with switch case
    switch (this.type) {
      case EmptyStateType.MEMBER_POCKET_GUIDE:
        return {
          title: 'No Pocket Guides Yet',
          description: 'This member doesn\'t have any pocket guides assigned at the moment.',
          icon: 'restaurant_menu',
          iconColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
        };

      case EmptyStateType.MEMBER_HEALTH_ISSUES:
        return {
          title: 'No Health Issues Recorded',
          description: 'This member doesn\'t have any health issues assigned at the moment.',
          icon: 'health_and_safety',
          iconColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
        };

      case EmptyStateType.MEMBER_ASSESSMENT:
        return {
          title: 'No Assessment Available',
          description: 'This member doesn\'t have any assessment records at the moment.',
          icon: 'assignment',
          iconColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
        };

      case EmptyStateType.MEMBER_CALL_LOGS:
        return {
          title: 'No Call Logs Found',
          description: 'This member doesn\'t have any call logs recorded at the moment.',
          icon: 'phone',
          iconColor: '#9C27B0',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
        };

      case EmptyStateType.MEMBER_PAYMENT_HISTORY:
        return {
          title: 'No Payment History',
          description: 'This member doesn\'t have any payment records at the moment.',
          icon: 'payments',
          iconColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
        };

      case EmptyStateType.MEMBER_DIET_HISTORY:
        return {
          title: 'No Diet History',
          description: 'This member doesn\'t have any diet plan history at the moment.',
          icon: 'restaurant_menu',
          iconColor: '#FF5722',
          backgroundColor: 'rgba(255, 87, 34, 0.1)',
        };

      case EmptyStateType.MEMBER_BODY_STATS:
        return {
          title: 'No Body Stats Recorded',
          description: 'This member doesn\'t have any body statistics recorded at the moment.',
          icon: 'fitness_center',
          iconColor: '#E91E63',
          backgroundColor: 'rgba(233, 30, 99, 0.1)',
        };

      case EmptyStateType.MEMBER_DASHBOARD:
        return {
          title: 'No Dashboard Data',
          description: 'There is no dashboard data available for this member at the moment.',
          icon: 'dashboard',
          iconColor: '#607D8B',
          backgroundColor: 'rgba(96, 125, 139, 0.1)',
        };

      default:
        return {
          title: 'No Data Available',
          description: 'There is no data available at the moment.',
          icon: 'info',
          iconColor: '#9E9E9E',
          backgroundColor: 'rgba(158, 158, 158, 0.1)',
        };
    }
  }
}
