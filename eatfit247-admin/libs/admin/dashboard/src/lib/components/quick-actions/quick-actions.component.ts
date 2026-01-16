import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lib-quick-actions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsComponent {
  constructor(private router: Router) {}

  actions = [
    { label: 'Add Member', icon: 'person_add', route: '/members/new', color: 'primary' },
    { label: 'Create Diet Plan', icon: 'restaurant_menu', route: '/diet-template', color: 'primary' },
    { label: 'Record Payment', icon: 'payments', route: '/payments/new', color: 'primary' },
    { label: 'Generate Payment Link', icon: 'link', route: '/payments/generate', color: 'primary' },
    { label: 'Send WhatsApp', icon: 'chat', action: 'whatsapp', color: 'primary' },
    { label: 'Send Email', icon: 'email', action: 'email', color: 'primary' },
  ];

  onActionClick(action: any): void {
    if (action.route) {
      this.router.navigate([action.route]);
    } else if (action.action === 'whatsapp') {
      // Handle WhatsApp action
      console.log('WhatsApp action');
    } else if (action.action === 'email') {
      // Handle Email action
      console.log('Email action');
    }
  }
}

