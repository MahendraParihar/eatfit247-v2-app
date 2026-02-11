import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

/**
 * Button component with Angular Material variations support.
 * 
 * Note: Template uses ngSwitch instead of @switch for SSR compatibility.
 * The built-in @switch control flow can cause hydration errors during SSR,
 * so ngSwitch is used to ensure stable DOM structure for hydration.
 */
@Component({
  standalone: true,
  selector: 'app-button',
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  // Button style variants
  @Input() variant: 
    | 'primary' 
    | 'secondary' 
    | 'outline' 
    | 'text' 
    | 'raised' 
    | 'icon' 
    | 'fab' 
    | 'mini-fab' = 'primary';
  
  // Material color theme (primary, accent, warn)
  @Input() color?: 'primary' | 'accent' | 'warn';
  
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  
  // Icon support
  @Input() iconStart?: string;
  @Input() iconEnd?: string;
  @Input() icon?: string; // For icon-only buttons
  
  // Toggle button support
  @Input() toggle: boolean = false;
  @Input() checked: boolean = false;

  @Output() clicked = new EventEmitter<Event>();
  @Output() toggleChange = new EventEmitter<boolean>();

  onButtonClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      if (this.toggle) {
        this.checked = !this.checked;
        this.toggleChange.emit(this.checked);
      }
      this.clicked.emit(event);
    }
  }

  get buttonClass(): string {
    return `app-button app-button--${this.variant} app-button--${this.size} ${
      this.fullWidth ? 'app-button--full-width' : ''
    } ${this.disabled ? 'app-button--disabled' : ''} ${
      this.loading ? 'app-button--loading' : ''
    } ${this.toggle && this.checked ? 'app-button--checked' : ''} ${
      this.color ? `app-button--color-${this.color}` : ''
    }`;
  }

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get materialColor(): 'primary' | 'accent' | 'warn' | undefined {
    return this.color;
  }

  get isIconOnlyButton(): boolean {
    return this.variant === 'icon' || this.variant === 'fab' || this.variant === 'mini-fab';
  }

  get ariaLabel(): string {
    if (this.isIconOnlyButton) {
      return this.icon || `${this.variant} button`;
    }
    return '';
  }
}

