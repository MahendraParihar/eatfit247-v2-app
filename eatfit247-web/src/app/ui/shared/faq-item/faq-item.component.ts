import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { IFaq } from 'eatfit247-shared-library';

/**
 * FAQ Item Component
 * Reusable component for displaying a single FAQ with expand/collapse functionality
 */
@Component({
  selector: 'app-faq-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule],
  templateUrl: './faq-item.component.html',
  styleUrl: './faq-item.component.scss',
})
export class FaqItemComponent {
  @Input() faq!: IFaq;
  @Input() showCategory: boolean = true;

  isExpanded = false;

  /**
   * Toggle expand/collapse state
   */
  toggle(): void {
    this.isExpanded = !this.isExpanded;
  }
}

