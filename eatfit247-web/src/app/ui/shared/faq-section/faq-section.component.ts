import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { FaqService, FaqItem } from '../../../services/faq.service';

/**
 * FAQ Section Component
 * Reusable component to display a section of FAQs with title and description
 * Displays FAQs in an accordion format
 */
@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
  ],
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss',
})
export class FaqSectionComponent implements OnInit {
  private readonly faqService = inject(FaqService);

  // Section configuration
  @Input() sectionTitle: string = 'Frequently Asked Questions';
  @Input() sectionDescription: string = 'Find answers to common questions about our services';
  @Input() faqsToShow: number = 5; // Number of FAQs to display
  @Input() faqs: FaqItem[] | null = null; // Optional: provide FAQs directly
  @Input() categoryId: number | null = null; // Optional: filter by category
  @Input() showViewAll: boolean = false; // Show "View All" button
  @Input() viewAllUrl: string = '/faq'; // URL for "View All" button

  displayedFaqs: FaqItem[] = [];
  loading = false;

  ngOnInit(): void {
    if (this.faqs) {
      // Use provided FAQs
      this.displayedFaqs = this.faqs.slice(0, this.faqsToShow);
    } else {
      // Fetch FAQs from service
      this.loadFaqs();
    }
  }

  /**
   * Load FAQs from service
   */
  private async loadFaqs(): Promise<void> {
    this.loading = true;
    try {
      if (this.categoryId) {
        const faqs = await this.faqService.getFaqsByCategory(this.categoryId);
        this.displayedFaqs = faqs.slice(0, this.faqsToShow);
      } else {
        const result = await this.faqService.getPaginatedFaqs(0, this.faqsToShow);
        this.displayedFaqs = result.faqs;
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
      this.displayedFaqs = [];
    } finally {
      this.loading = false;
    }
  }
}

