import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

/**
 * Product Showcase Component
 * Displays the DE-BLOAT product section with image and product information
 */
@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './product-showcase.component.html',
  styleUrl: './product-showcase.component.scss',
})
export class ProductShowcaseComponent {
  private readonly router = inject(Router);

  // Product showcase data
  productTitle = 'DE-BLOAT';
  productSubtitle = 'Debloat yourself within 3 months';
  productFeatureBullets: string[] = [
    'Say Goodbye to bloating',
    'Reverse your gut issues and calms an upset stomach',
    'Bid farewell to IBS symptoms, including pain, gas acidity and constipation',
    'Discover the power of nature with our organic herbal ingredients',
  ];
  productTagLine = 'Promotes gut health and digestive comfort – try it today!';
  productImage = 'assets/images/products/debloat-alt-1200x1205.jpg';

  /**
   * Navigate to product page
   */
  navigateToProduct(): void {
    this.router.navigate(['/product']);
  }
}

