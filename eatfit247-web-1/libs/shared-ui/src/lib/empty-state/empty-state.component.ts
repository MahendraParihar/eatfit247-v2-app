import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type EmptyStateVariant = 'hero' | 'inline' | 'center';

export interface EmptyStateAction {
  label: string;
  link?: string | unknown[];
  queryParams?: Record<string, unknown>;
  href?: string;
  variant?: 'filled' | 'outlined';
  icon?: string;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() variant: EmptyStateVariant = 'hero';
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No items found';
  @Input() description: string = 'There are no items available at the moment.';
  @Input() actions: EmptyStateAction[] = [];

  @Input() buttonText?: string;
  @Output() buttonClick = new EventEmitter<void>();

  onButtonClick(): void {
    this.buttonClick.emit();
  }
}
