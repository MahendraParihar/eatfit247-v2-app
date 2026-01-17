import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BannerService } from '../../services/banner.service';
import { ProductService } from '../../services/product.service';
import {
  BannerForEnum,
  IPublicProduct,
  IProductFee,
  IProductIngredientSection,
  IOutcomeSection, IOutcomes, IProjectConsumptionInstructionSection, IProductReport, IProjectStarEndorsedSection
} from 'eatfit247-shared-library';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { SectionFaqComponent } from '../shared/section-faq/section-faq.component';

// Extended interface for size display with value and label
interface ISizeOption extends IProductFee {
  value: IProductFee;
  label: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ImageSliderComponent,
    SectionFaqComponent
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly bannerService = inject(BannerService);
  private readonly productService = inject(ProductService);
  // Banner items
  bannerItems: SliderItem[] = [];
  // Product data
  product: IPublicProduct = {} as IPublicProduct;
  productName = '';
  productDescription = '';
  selectedSize: ISizeOption | null = null;
  quantity: number = 1;
  loading = true;
  error: string | null = null;
  // Product images
  productImages: string[] = [];
  productImages1: string[] = [];
  selectedImageIndex: number = 0;
  // Star powder image
  starPowderImage: string = '/assets/images/products/start-powder.png';
  // Custom slider for the 3rd section
  featureSliderCurrentIndex: number = 0;
  private featureSliderTimer: any = null;
  private readonly featureSliderInterval: number = 5000; // 5-second
  productVideos: string[] = [];

  get sizes(): ISizeOption[] {
    if (!this.product?.fees) return [];
    return this.product.fees.map((fee) => ({
      ...fee,
      value: fee,
      label: `${fee.quantity} ${fee.unit}`
    }));
  }

  get currentPrice(): number {
    return this.getCurrentPrice();
  }

  get priceRange(): string {
    if (!this.product?.additionalInfo?.priceRange) {
      if (this.product?.fees && this.product.fees.length > 0) {
        const prices = this.product.fees.map((f) => f.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return `₹ ${min}.00 – ₹ ${max}.00`;
      }
      return '';
    }
    return `₹ ${this.product.additionalInfo.priceRange.min}.00 – ₹ ${this.product.additionalInfo.priceRange.max}.00`;
  }

  getCurrentPrice(): number {
    if (!this.selectedSize) {
      return this.product.fees[0].price || 0;
    }
    return this.selectedSize.price;
  }

  // Helper getters for template compatibility
  get productBenefits(): string[] {
    return this.product.additionalInfo.benefits || [];
  }

  get productDose(): string {
    return this.product.additionalInfo.dose || '';
  }

  get productHowToTake(): string {
    return this.product.additionalInfo.howToTake || '';
  }

  get productPrecautions(): string[] {
    return this.product.additionalInfo.precautions || [];
  }

  get productIngredients(): IProductIngredientSection {
    return this.product.additionalInfo.ingredients as IProductIngredientSection;
  }

  get productConsumptionInstructions(): IProjectConsumptionInstructionSection {
    return this.product.additionalInfo.consumptionInstructions as IProjectConsumptionInstructionSection;
  }

  get productReportSection(): IProductReport {
    return this.product.additionalInfo.report as IProductReport;
  }

  get outcomesObject(): IOutcomeSection {
    return this.product.additionalInfo.outcomes as IOutcomeSection;
  }

  get productOutcomes(): IOutcomes[] {
    return this.outcomesObject.outcome || [];
  }

  get productFeature(): any {
    return this.product.additionalInfo.feature;
  }

  get productStartEndorsed(): IProjectStarEndorsedSection {
    return this.product.additionalInfo.startEndorsed as IProjectStarEndorsedSection;
  }

  /**
   * Get current feature slider image
   */
  get currentFeatureImage(): string {
    return this.productImages1[this.featureSliderCurrentIndex] || this.productImages1[0];
  }

  /**
   * Check if a feature slider has multiple images
   */
  get hasMultipleFeatureImages(): boolean {
    return this.productImages1.length > 1;
  }

  ngOnInit(): void {
    // Load banner data
    this.loadBannerData();
    // Load product data
    this.loadProductData();
  }

  ngOnDestroy(): void {
    this.stopFeatureSliderAutoSwitch();
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.bannerItems = await this.bannerService.getBannerSlidesForPage(BannerForEnum.PRODUCT);
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.bannerItems = [];
    }
  }

  /**
   * Load product data from API
   */
  private async loadProductData(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      let product: IPublicProduct | null = null;
      const products = await this.productService.getAllProducts(0, 1);
      product = products.length > 0 ? products[0] : null;
      if (product) {
        this.product = product;
        this.initializeProductData(product);
      } else {
        this.error = 'Product not found';
      }
    } catch (error) {
      console.error('Failed to load product data:', error);
      this.error = 'Failed to load product information. Please try again later.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Initialize product data from API response
   */
  private initializeProductData(product: IPublicProduct): void {
    // Set the product name and description
    this.productName = product.name;
    this.productDescription = product.additionalInfo?.feature?.tagLine || product.name;
    // Set product images from imagePath
    if (product.imagePath && product.imagePath.length > 0) {
      this.productImages = product.imagePath.map((img) => img.webUrl);
      this.productImages1 = [...this.productImages];
    }
    // Set feature images if available
    if (product.additionalInfo?.feature?.images) {
      const featureImages = product.additionalInfo.feature.images.map((img) => img.webUrl);
      if (featureImages.length > 0) {
        this.productImages1 = featureImages;
      }
    }
    // Set consumption video if available
    if (product.additionalInfo?.consumptionInstructions?.mediaData?.mediaLink) {
      const videos = product.additionalInfo.consumptionInstructions.mediaData.mediaLink.map(
        (media) => media.webUrl
      );
      if (videos.length > 0) {
        this.productVideos = videos;
      }
    }
    // Set the default selected size
    if (product.fees && product.fees.length > 0) {
      const firstSize = product.fees[0];
      this.selectedSize = {
        ...firstSize,
        value: firstSize,
        label: `${firstSize.quantity} ${firstSize.unit}`
      };
    }
    // Start auto-switch for feature slider if we have multiple images
    if (this.productImages1.length > 1) {
      this.startFeatureSliderAutoSwitch();
    }
  }

  /**
   * Navigate to next image in feature slider
   */
  featureSliderNext(): void {
    if (this.productImages.length > 0) {
      this.featureSliderCurrentIndex =
        (this.featureSliderCurrentIndex + 1) % this.productImages1.length;
      this.resetFeatureSliderAutoSwitch();
    }
  }

  /**
   * Navigate to previous image in feature slider
   */
  featureSliderPrevious(): void {
    if (this.productImages.length > 0) {
      this.featureSliderCurrentIndex =
        this.featureSliderCurrentIndex === 0
          ? this.productImages.length - 1
          : this.featureSliderCurrentIndex - 1;
      this.resetFeatureSliderAutoSwitch();
    }
  }

  /**
   * Go to specific image in feature slider
   */
  featureSliderGoTo(index: number): void {
    if (index >= 0 && index < this.productImages.length) {
      this.featureSliderCurrentIndex = index;
      this.resetFeatureSliderAutoSwitch();
    }
  }

  /**
   * Start auto-switch for feature slider
   */
  private startFeatureSliderAutoSwitch(): void {
    if (this.productImages.length > 1) {
      this.stopFeatureSliderAutoSwitch();
      this.featureSliderTimer = setInterval(() => {
        this.featureSliderNext();
      }, this.featureSliderInterval);
    }
  }

  /**
   * Stop auto-switch for feature slider
   */
  private stopFeatureSliderAutoSwitch(): void {
    if (this.featureSliderTimer) {
      clearInterval(this.featureSliderTimer);
      this.featureSliderTimer = null;
    }
  }

  /**
   * Reset auto-switch timer for feature slider
   */
  private resetFeatureSliderAutoSwitch(): void {
    if (this.productImages1.length > 1) {
      this.stopFeatureSliderAutoSwitch();
      this.startFeatureSliderAutoSwitch();
    }
  }

  /**
   * Pause auto-switch on hover
   */
  onFeatureSliderHover(): void {
    this.stopFeatureSliderAutoSwitch();
  }

  /**
   * Resume auto-switch on mouse leave
   */
  onFeatureSliderLeave(): void {
    if (this.productImages.length > 1) {
      this.startFeatureSliderAutoSwitch();
    }
  }

  /**
   * Handle buy now action
   */
  onBuyNow(): void {
    // Navigate to checkout with product details
    const productData = {
      name: this.productName,
      size: this.selectedSize,
      price: this.currentPrice
    };
    // TODO: Implement navigation to checkout with product data
    console.log('Buy Now:', productData);
  }

  /**
   * Handle size selection change
   */
  onSizeChange(size: ISizeOption | null): void {
    if (size) {
      this.selectedSize = size;
    }
  }

  /**
   * Select a product image by index
   */
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  /**
   * Get the current selected image
   */
  get selectedImage(): string {
    if (this.productImages.length === 0) {
      return '/assets/images/products/debloat-main-1200x1200.jpg'; // Fallback image
    }
    return this.productImages[this.selectedImageIndex] || this.productImages[0];
  }

  /**
   * Increment quantity
   */
  incrementQuantity(): void {
    if (this.quantity < 5) {
      this.quantity++;
    }
  }

  /**
   * Decrement quantity
   */
  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /**
   * Update quantity from input
   */
  updateQuantity(value: string): void {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      this.quantity = Math.min(numValue, 5);
    }
  }

  /**
   * Handle video error
   */
  onVideoError(event: Event): void {
    console.error('Video error:', event);
    const video = event.target as HTMLVideoElement;
    console.error('Video src:', video?.src);
    console.error('Video error code:', video?.error?.code);
  }

  /**
   * Handle video loaded
   */
  onVideoLoaded(): void {
    console.log('Video loaded successfully');
  }
}

