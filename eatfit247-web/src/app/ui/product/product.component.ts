import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
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
import { find } from 'lodash';

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
  private readonly bannerService = inject(BannerService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  // Banner items
  bannerItems: SliderItem[] = [];
  // Product data
  product!: IPublicProduct;
  productName = '';
  productDescription = '';
  selectedSize: ISizeOption | null = null;
  quantity: number = 1;
  productId: number | null = null;
  productVariantId: number | null = null;
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
    const sizeOptions: ISizeOption[] = [];
    // Default currency is INR - only show variants with INR prices
    const defaultCurrency = 'INR';
    // Debug logging
    console.log('Product data:', this.product);
    console.log('Variants:', this.product?.variants);
    console.log('Fees:', this.product?.fees);
    // Process variants - show only variants with INR currency prices
    if (this.product?.variants && this.product.variants.length > 0) {
      for (const variant of this.product.variants) {
        if (variant.prices && variant.prices.length > 0) {
          // Filter for INR currency only (case-insensitive comparison)
          const inrPrice = variant.prices.find(p => {
            const currencyMatch = p.currency &&
              (p.currency.toUpperCase() === defaultCurrency.toUpperCase() ||
                p.currency === defaultCurrency);
            const activeMatch = p.active !== false || p.active === undefined;
            return currencyMatch && activeMatch;
          });
          // Only add variant if it has an INR price
          if (inrPrice) {
            sizeOptions.push({
              quantity: variant.quantityValue,
              unit: variant.quantityUnit,
              currency: inrPrice.currency,
              price: inrPrice.price,
              sku: variant.sku,
              isActive: inrPrice.active,
              validFrom: inrPrice.validFrom,
              validTo: inrPrice.validTo,
              value: {
                quantity: variant.quantityValue,
                unit: variant.quantityUnit,
                currency: inrPrice.currency,
                price: inrPrice.price,
                sku: variant.sku,
                isActive: inrPrice.active,
                validFrom: inrPrice.validFrom,
                validTo: inrPrice.validTo
              },
              label: `${variant.quantityValue} ${variant.quantityUnit}`,
              productId: variant.productId,
              productVariantId: variant.productVariantId
            } as any);
          }
        }
      }
    }
    // Fallback: If no variants with INR found, check fees with INR currency
    if (sizeOptions.length === 0 && this.product?.fees && this.product.fees.length > 0) {
      const inrFees = this.product.fees.filter(fee => {
        const currencyMatch = fee.currency &&
          (fee.currency.toUpperCase() === defaultCurrency.toUpperCase() ||
            fee.currency === defaultCurrency);
        const activeMatch = fee.isActive !== false || fee.isActive === undefined;
        return currencyMatch && activeMatch;
      });
      for (const fee of inrFees) {
        sizeOptions.push({
          ...fee,
          value: fee,
          label: `${fee.quantity} ${fee.unit}`
        });
      }
    }
    console.log('Size options:', sizeOptions);
    return sizeOptions;
  }

  get currentPrice(): number {
    return this.getCurrentPrice();
  }

  get priceRange(): string {
    const defaultCurrency = 'INR';
    const allPrices: number[] = [];
    // Collect INR prices from variants (case-insensitive)
    if (this.product?.variants && this.product.variants.length > 0) {
      for (const variant of this.product.variants) {
        const fees = find(variant.prices, { currency: defaultCurrency });
        if (fees) {
          allPrices.push(fees.price);
        }
      }
    }
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    return `₹ ${min}.00 – ₹ ${max}.00`;
  }

  getCurrentPrice(): number {
    if (!this.selectedSize) {
      const defaultCurrency = 'INR';
      // Try to get the first INR price from variants (case-insensitive)
      if (this.product?.variants && this.product.variants.length > 0) {
        const firstVariant = this.product.variants[0];
        if (firstVariant.prices && firstVariant.prices.length > 0) {
          const inrPrice = firstVariant.prices.find(p => {
            const currencyMatch = p.currency &&
              (p.currency.toUpperCase() === defaultCurrency.toUpperCase() ||
                p.currency === defaultCurrency);
            const activeMatch = p.active !== false || p.active === undefined;
            return currencyMatch && activeMatch;
          });
          return inrPrice ? inrPrice.price : 0;
        }
      }
      // Fallback to fees
      if (this.product?.fees && this.product.fees.length > 0) {
        const inrFee = this.product.fees.find(f => {
          const currencyMatch = f.currency &&
            (f.currency.toUpperCase() === defaultCurrency.toUpperCase() ||
              f.currency === defaultCurrency);
          const activeMatch = f.isActive !== false || f.isActive === undefined;
          return currencyMatch && activeMatch;
        });
        return inrFee ? inrFee.price : 0;
      }
      return 0;
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
   * Normalize product data structure
   * Handles case where API returns flat array with both fees and variants mixed
   */
  private normalizeProductData(product: IPublicProduct): IPublicProduct {
    // Check if fees array contains variant objects mixed with fee objects
    // This handles the case where API returns a flat array with both fees and variants
    if (product.fees && product.fees.length > 0) {
      const normalizedFees: IProductFee[] = [];
      const normalizedVariants: any[] = [];
      const variantMap = new Map<string, any>();
      for (const item of product.fees as any[]) {
        // Check if this is a variant object (has quantityValue, and either prices array or price/currency properties)
        const isVariant = item.quantityValue !== undefined &&
          (Array.isArray(item.prices) ||
            (item.prices !== undefined && typeof item.prices === 'object') ||
            (item.price !== undefined && item.currency !== undefined));
        if (isVariant) {
          // This is a variant object
          const variantKey = `${item.quantityValue}_${item.quantityUnit || ''}`;
          if (!variantMap.has(variantKey)) {
            variantMap.set(variantKey, {
              productVariantId: item.productVariantId,
              productId: item.productId,
              quantityValue: item.quantityValue,
              quantityUnit: item.quantityUnit,
              sku: item.sku,
              prices: []
            });
          }
          const variant = variantMap.get(variantKey);
          // Extract price information from variant
          if (Array.isArray(item.prices) && item.prices.length > 0) {
            // Add prices to variant
            variant.prices.push(...item.prices.map((p: any) => ({
              currency: p.currency,
              price: p.price,
              active: p.active !== false,
              validFrom: p.validFrom,
              validTo: p.validTo
            })));
            // Also create fee entries for each price
            item.prices.forEach((price: any) => {
              normalizedFees.push({
                quantity: item.quantityValue,
                unit: item.quantityUnit,
                currency: price.currency,
                price: price.price,
                sku: item.sku,
                isActive: price.active !== false,
                validFrom: price.validFrom,
                validTo: price.validTo
              });
            });
          } else if (item.price !== undefined && item.currency !== undefined) {
            // Variant object with single price-like properties
            const priceObj = {
              currency: item.currency,
              price: item.price,
              active: item.isActive !== false,
              validFrom: item.validFrom,
              validTo: item.validTo
            };
            variant.prices.push(priceObj);
            // Also create a fee entry
            normalizedFees.push({
              quantity: item.quantityValue,
              unit: item.quantityUnit,
              currency: item.currency,
              price: item.price,
              sku: item.sku,
              isActive: item.isActive,
              validFrom: item.validFrom,
              validTo: item.validTo
            });
          }
        } else if (item.quantity !== undefined && item.price !== undefined) {
          // This is a fee object (not a variant)
          normalizedFees.push({
            quantity: item.quantity,
            unit: item.unit,
            currency: item.currency,
            price: item.price,
            sku: item.sku,
            isActive: item.isActive,
            validFrom: item.validFrom,
            validTo: item.validTo
          });
        }
      }
      // Convert variant map to array
      normalizedVariants.push(...Array.from(variantMap.values()));
      // Merge with existing variants if they exist
      const existingVariants = product.variants || [];
      const mergedVariants = [...existingVariants];
      // Add normalized variants that don't already exist
      for (const normalizedVariant of normalizedVariants) {
        const exists = mergedVariants.some(
          (v: any) =>
            v.quantityValue === normalizedVariant.quantityValue &&
            v.quantityUnit === normalizedVariant.quantityUnit
        );
        if (!exists) {
          mergedVariants.push(normalizedVariant);
        }
      }
      // Update product with normalized structure
      return {
        ...product,
        fees: normalizedFees.length > 0 ? normalizedFees : product.fees,
        variants: mergedVariants.length > 0 ? mergedVariants : product.variants
      };
    }
    return product;
  }

  /**
   * Initialize product data from API response
   */
  private initializeProductData(product: IPublicProduct): void {
    // Normalize product data structure first
    const normalizedProduct = this.normalizeProductData(product);
    this.product = normalizedProduct;
    // Set the product name and description
    this.productName = normalizedProduct.name;
    this.productDescription = normalizedProduct.additionalInfo?.feature?.tagLine || normalizedProduct.name;
    // Set product ID
    this.productId = (normalizedProduct as any).productId || null;
    // Set product images from imagePath
    if (normalizedProduct.imagePath && normalizedProduct.imagePath.length > 0) {
      this.productImages = normalizedProduct.imagePath.map((img) => img.webUrl);
      this.productImages1 = [...this.productImages];
    }
    // Set feature images if available
    if (normalizedProduct.additionalInfo?.feature?.images) {
      const featureImages = normalizedProduct.additionalInfo.feature.images.map((img) => img.webUrl);
      if (featureImages.length > 0) {
        this.productImages1 = featureImages;
      }
    }
    // Set consumption video if available
    if (normalizedProduct.additionalInfo?.consumptionInstructions?.mediaData?.mediaLink) {
      const videos = normalizedProduct.additionalInfo.consumptionInstructions.mediaData.mediaLink.map(
        (media) => media.webUrl
      );
      if (videos.length > 0) {
        this.productVideos = videos;
      }
    }
    // Set the default selected size - use INR currency from variants (case-insensitive)
    const defaultCurrency = 'INR';
    // Find first variant with INR price
    if (normalizedProduct.variants && normalizedProduct.variants.length > 0) {
      for (const variant of normalizedProduct.variants) {
        if (variant.prices && variant.prices.length > 0) {
          const inrPrice = variant.prices.find(p => {
            const currencyMatch = p.currency &&
              (p.currency.toUpperCase() === defaultCurrency.toUpperCase() ||
                p.currency === defaultCurrency);
            const activeMatch = p.active !== false || p.active === undefined;
            return currencyMatch && activeMatch;
          });
          if (inrPrice) {
            this.selectedSize = {
              quantity: variant.quantityValue,
              unit: variant.quantityUnit,
              currency: inrPrice.currency,
              price: inrPrice.price,
              sku: variant.sku,
              isActive: inrPrice.active,
              validFrom: inrPrice.validFrom,
              validTo: inrPrice.validTo,
              value: {
                quantity: variant.quantityValue,
                unit: variant.quantityUnit,
                currency: inrPrice.currency,
                price: inrPrice.price,
                sku: variant.sku,
                isActive: inrPrice.active,
                validFrom: inrPrice.validFrom,
                validTo: inrPrice.validTo
              },
              label: `${variant.quantityValue} ${variant.quantityUnit}`,
              productId: variant.productId,
              productVariantId: variant.productVariantId
            } as any;
            this.productId = variant.productId || null;
            this.productVariantId = variant.productVariantId || null;
            break; // Use first variant with INR price
          }
        }
      }
    }
    // Fallback to fees if no variant with INR found
    if (!this.selectedSize && normalizedProduct.fees && normalizedProduct.fees.length > 0) {
      const inrFee = normalizedProduct.fees.find(f => {
        const currencyMatch = f.currency &&
          (f.currency.toUpperCase() === defaultCurrency.toUpperCase() ||
            f.currency === defaultCurrency);
        const activeMatch = f.isActive !== false || f.isActive === undefined;
        return currencyMatch && activeMatch;
      });
      if (inrFee) {
        this.selectedSize = {
          ...inrFee,
          value: inrFee,
          label: `${inrFee.quantity} ${inrFee.unit}`
        };
      }
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
    if (!this.selectedSize) {
      console.error('Please select a product size');
      return;
    }

    // Navigate to checkout with product details
    const queryParams: any = {
      productName: encodeURIComponent(this.productName),
      productPrice: this.currentPrice.toString(),
      productQuantity: this.quantity.toString(),
      productSku: encodeURIComponent(this.selectedSize.sku || '')
    };

    // Add productId and variantId if available
    if (this.productId) {
      queryParams.productId = this.productId.toString();
    }
    if (this.productVariantId) {
      queryParams.productVariantId = this.productVariantId.toString();
    }

    this.router.navigate(['/checkout'], { queryParams });
  }

  /**
   * Handle size selection change
   */
  onSizeChange(size: ISizeOption | null): void {
    if (size) {
      this.selectedSize = size;
      // Update product and variant IDs from selected size
      this.productVariantId = (size as any).productVariantId || null;
      this.productId = (size as any).productId || this.productId;
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

