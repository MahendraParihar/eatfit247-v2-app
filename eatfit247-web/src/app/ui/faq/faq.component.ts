import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FaqService  } from '../../services/faq.service';
import { IFaqCategory, IFaq } from 'eatfit247-shared-library';
import { FaqItemComponent } from '../shared/faq-item/faq-item.component';

/**
 * FAQ Listing Component
 * Displays FAQs with categories and pagination
 */
@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    FaqItemComponent,
  ],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent implements OnInit {
  private readonly faqService = inject(FaqService);

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalFaqs = 0;
  totalPages = 0;

  // FAQ data
  faqs: IFaq[] = [];
  categories: IFaqCategory[] = [];
  selectedCategoryId: number | null = null; // null means "All FAQs" is selected

  // Loading states
  loading = false;
  loadingCategories = false;

  ngOnInit(): void {
    this.loadFaqs();
    this.loadCategories();
  }

  /**
   * Load FAQs with pagination
   */
  private async loadFaqs(): Promise<void> {
    this.loading = true;
    try {
      const result = await this.faqService.getPaginatedFaqs(
        this.currentPage - 1,
        this.pageSize,
        this.selectedCategoryId || undefined
      );
      this.faqs = result.faqs;
      this.totalFaqs = result.total;
      this.totalPages = result.totalPages;
    } catch (error) {
      console.error('Error loading FAQs:', error);
      this.faqs = [];
      this.totalFaqs = 0;
      this.totalPages = 0;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load all categories
   */
  private async loadCategories(): Promise<void> {
    this.loadingCategories = true;
    try {
      this.categories = await this.faqService.getAllCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
      this.categories = [];
    } finally {
      this.loadingCategories = false;
    }
  }

  /**
   * Handle page change event
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    // Reload FAQs with current category filter
    this.loadFaqs();

    // Scroll to top of FAQ section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Filter FAQs by category
   */
  async filterByCategory(categoryId: number | null): Promise<void> {
    this.selectedCategoryId = categoryId;
    this.currentPage = 1;
    await this.loadFaqs();
  }
}

