import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * A trigger button that opens a floating panel of filter controls.
 *
 * Deliberately a CDK overlay rather than a `mat-menu`: `mat-select` and
 * `mat-datepicker` open their own overlays, and `mat-menu` treats that click as
 * outside itself and closes — so a filter form inside a `mat-menu` is unusable.
 * `mat-menu` also traps arrow keys for item navigation, which fights form fields.
 *
 * Styled to match a menu surface so it still reads as one.
 */
@Component({
  selector: 'shared-ui-filter-popover',
  standalone: true,
  imports: [CommonModule, OverlayModule, MatButtonModule, MatIconModule],
  templateUrl: './filter-popover.component.html',
  styleUrl: './filter-popover.component.scss',
})
export class FilterPopoverComponent {
  @Input() label = 'Advanced Filters';
  @Input() icon = 'tune';
  /** Shown as a badge on the trigger so applied filters stay visible when closed. */
  @Input() activeCount = 0;
  @Input() applyLabel = 'Apply filters';
  @Input() clearLabel = 'Clear all';
  @Input() disabled = false;

  @Output() applied = new EventEmitter<void>();
  @Output() cleared = new EventEmitter<void>();
  @Output() openedChange = new EventEmitter<boolean>();

  isOpen = false;

  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
  ];

  toggle(): void {
    this.setOpen(!this.isOpen);
  }

  close(): void {
    this.setOpen(false);
  }

  onApply(): void {
    this.applied.emit();
    this.setOpen(false);
  }

  onClear(): void {
    this.cleared.emit();
  }

  private setOpen(open: boolean): void {
    if (this.isOpen === open) {
      return;
    }
    this.isOpen = open;
    this.openedChange.emit(open);
  }
}
