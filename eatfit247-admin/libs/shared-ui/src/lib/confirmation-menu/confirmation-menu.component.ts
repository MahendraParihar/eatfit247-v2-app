import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'shared-ui-confirmation-menu',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './confirmation-menu.component.html',
  styleUrl: './confirmation-menu.component.scss'
})
export class ConfirmationMenuComponent {
  @Input() positiveBtnLabel = 'Yes';
  @Input() negativeBtnLabel = 'No';
  @Input() title = 'Confirm Action';
  @Input() description = 'Are you sure you want to proceed?';
  @Input() icon = 'more_vert';
  @Output() positiveActionBtnClicked = new EventEmitter<Event>();
  @Output() negativeActionBtnClicked = new EventEmitter<Event>();

  onPositiveClick($event: Event): void {
    this.positiveActionBtnClicked.emit($event);
  }

  onNegativeClick($event: Event): void {
    this.negativeActionBtnClicked.emit($event);
  }
}
