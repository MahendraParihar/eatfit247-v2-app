import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PermissionService } from '@core';
import { AdminSubjectEnum } from '@eatfit247-shared-lib';

interface QuickAction {
  label: string;
  icon: string;
  route?: string;
  action?: string;
  requiredSubject: AdminSubjectEnum;
  requiredAction: string;
}

const ALL_ACTIONS: QuickAction[] = [
  {
    label: 'Add Member',
    icon: 'person_add',
    route: '/members/new',
    requiredSubject: AdminSubjectEnum.Member,
    requiredAction: 'create',
  },
  {
    label: 'Create Diet Plan',
    icon: 'restaurant_menu',
    route: '/diet-template',
    requiredSubject: AdminSubjectEnum.DietTemplate,
    requiredAction: 'read',
  },
  {
    label: 'Record Payment',
    icon: 'payments',
    route: '/payments/new',
    requiredSubject: AdminSubjectEnum.MemberPayment,
    requiredAction: 'create',
  },
  {
    label: 'Generate Payment Link',
    icon: 'link',
    route: '/payments/generate',
    requiredSubject: AdminSubjectEnum.MemberPayment,
    requiredAction: 'create',
  },
  {
    label: 'Send WhatsApp',
    icon: 'chat',
    action: 'whatsapp',
    requiredSubject: AdminSubjectEnum.Notification,
    requiredAction: 'create',
  },
  {
    label: 'Send Email',
    icon: 'email',
    action: 'email',
    requiredSubject: AdminSubjectEnum.Notification,
    requiredAction: 'create',
  },
];

@Component({
  selector: 'lib-quick-actions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './quick-actions.component.html',
  styleUrl: './quick-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly permissionService = inject(PermissionService);

  actions: QuickAction[] = [];

  ngOnInit(): void {
    this.actions = ALL_ACTIONS.filter((a) =>
      this.permissionService.hasPermission(a.requiredSubject, a.requiredAction),
    );
  }

  onActionClick(action: QuickAction): void {
    if (action.route) {
      this.router.navigate([action.route]);
    }
    // WhatsApp and Email actions - TODO: Implement
  }
}
