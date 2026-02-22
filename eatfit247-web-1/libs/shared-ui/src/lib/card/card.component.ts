import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ICardData } from '../../interfaces';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIcon],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() data!: ICardData;

  /**
   * Format date for display
   */
  getFormattedDate(): string {
    if (this.data.formattedDate) {
      return this.data.formattedDate;
    }
    if (!this.data.date) {
      return '';
    }
    const date =
      typeof this.data.date === 'string'
        ? new Date(this.data.date)
        : this.data.date;
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Format read time for display
   */
  getReadTime(): string {
    if (!this.data.readTime) {
      return '';
    }
    return `${this.data.readTime} min read`;
  }
}


