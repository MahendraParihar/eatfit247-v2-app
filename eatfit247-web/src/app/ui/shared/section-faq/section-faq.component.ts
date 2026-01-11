import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FaqService } from '../../../services/faq.service';
import { IFaq, IFaqCategory } from 'eatfit247-shared-library';
import { FaqItemComponent } from '../faq-item/faq-item.component';

/**
 * Section FAQ Component
 * Displays FAQs - can show all FAQs or filter by category
 * If categories are provided, loads FAQs for that category
 * If no categories are provided, loads all FAQs
 */
@Component({
  selector: 'app-section-faq',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FaqItemComponent],
  templateUrl: './section-faq.component.html',
  styleUrl: './section-faq.component.scss'
})
export class SectionFaqComponent implements OnInit {
  private readonly faqService = inject(FaqService);
  private readonly router = inject(Router);
  /**
   * Categories input - can be array of category IDs or category objects
   */
  @Input() categories: string[] = [];
  /**
   * Section title (optional)
   */
  @Input() sectionTitle: string = 'Frequently Asked Questions';
  /**
   * Section description (optional)
   */
  @Input() sectionDescription: string = '';
  /**
   * Whether to show category headers when grouping
   */
  @Input() showCategory: boolean = true;
  allFaqs: IFaq[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadFaqs();
  }

  private async loadFaqs(): Promise<void> {
    this.loading = true;
    try {
      if (this.categories && this.categories.length > 0) {
        // Load FAQs by category URL if categories are provided
        this.allFaqs = await this.faqService.getFaqsByCategoryUrl(this.categories[0]);
      } else {
        // Load all FAQs if no categories are provided
        this.allFaqs = await this.faqService.getAllFaqs();
      }
    } catch (error) {
      console.error('Failed to load FAQs:', error);
      // Keep an empty array if loading fails
      this.allFaqs = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Navigate to FAQs page and scroll to top
   */
  navigateToFaqs(): void {
    this.router.navigate(['/faq']).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

