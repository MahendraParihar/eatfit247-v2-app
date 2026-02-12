import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BannerComponent, LoaderComponent } from '@shared-ui';
import { BannerService } from '../../core/services';
import { ProductService } from '../../core/services/product.service';
import { SEOService } from '../../core/services';
import {
  IMediaUpload,
  IPublicProduct,
  IProductFee,
  IProductIngredientSection,
  IProductReport,
  IProjectConsumptionInstructionSection,
  IProjectStarEndorsedSection,
  IOutcomeSection,
  IOutcomes,
  BannerForEnum
} from '@eatfit247-shared-library';

// Extended interface for size display with value and label
interface ISizeOption extends IProductFee {
  value: IProductFee;
  label: string;
  productId?: number | null;
  productVariantId?: number | null;
}

@Component({
  standalone: true,
  selector: 'app-product',
  imports: [CommonModule, FormsModule, BannerComponent, LoaderComponent, MatButtonModule, MatIconModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent implements OnInit, OnDestroy {
  private readonly bannerService = inject(BannerService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SEOService);
  // Banner media
  banners: IMediaUpload[] = [];
  // Product data
  product!: IPublicProduct;
  productName = '';
  productDescription = '';
  selectedSize: ISizeOption | null = null;
  quantity = 1;
  productId: number | null = null;
  productVariantId: number | null = null;
  loading = signal(true);
  error = signal<string | null>(null);
  // Product images
  productImages: string[] = [];
  productImages1: string[] = [];
  selectedImageIndex = 0;
  // Star powder image (fallback)
  starPowderImage = 'assets/images/products/start-powder.png';
  // Custom slider for the feature section
  featureSliderCurrentIndex = 0;
  private featureSliderTimer: any = null;
  private readonly featureSliderInterval = 5000; // 5 seconds
  productVideos: string[] = [];

  get sizes(): ISizeOption[] {
    const sizeOptions: ISizeOption[] = [];
    const defaultCurrency = 'INR';
    // Process variants - show only variants with INR prices (case-insensitive)
    if (this.product?.variants && this.product.variants.length > 0) {
      for (const variant of this.product.variants as any[]) {
        if (variant.prices && variant.prices.length > 0) {
          const inrPrice = (variant.prices as any[]).find((p) => {
            const currency = p.currency as string | undefined;
            const active = p.active as boolean | undefined;
            const currencyMatch =
              currency &&
              (currency.toUpperCase() === defaultCurrency.toUpperCase() ||
                currency === defaultCurrency);
            const activeMatch = active !== false || active === undefined;
            return currencyMatch && activeMatch;
          });
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
            } as ISizeOption);
          }
        }
      }
    }
    // Fallback: If no variants with INR found, check fees with INR currency
    if (sizeOptions.length === 0 && this.product?.fees && this.product.fees.length > 0) {
      const inrFees = this.product.fees.filter((fee) => {
        const currencyMatch =
          fee.currency &&
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
    return sizeOptions;
  }

  get currentPrice(): number {
    return this.getCurrentPrice();
  }

  get priceRange(): string {
    const defaultCurrency = 'INR';
    const allPrices: number[] = [];
    if (this.product?.variants && this.product.variants.length > 0) {
      for (const variant of this.product.variants as any[]) {
        if (variant.prices && variant.prices.length > 0) {
          const inrPrice = (variant.prices as any[]).find((p) => {
            const currency = p.currency as string | undefined;
            return (
              currency &&
              (currency.toUpperCase() === defaultCurrency.toUpperCase() ||
                currency === defaultCurrency)
            );
          });
          if (inrPrice) {
            allPrices.push(inrPrice.price);
          }
        }
      }
    }
    if (!allPrices.length) {
      return '';
    }
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    return `₹ ${min}.00 – ₹ ${max}.00`;
  }

  get productBenefits(): string[] {
    return this.product?.additionalInfo?.benefits || [];
  }

  get productDose(): string {
    return this.product?.additionalInfo?.dose || '';
  }

  get productHowToTake(): string {
    return this.product?.additionalInfo?.howToTake || '';
  }

  get productPrecautions(): string[] {
    return this.product?.additionalInfo?.precautions || [];
  }

  get productIngredients(): IProductIngredientSection {
    return (this.product?.additionalInfo?.ingredients || {}) as IProductIngredientSection;
  }

  get productConsumptionInstructions(): IProjectConsumptionInstructionSection {
    return (this.product?.additionalInfo
      ?.consumptionInstructions || {}) as IProjectConsumptionInstructionSection;
  }

  get productReportSection(): IProductReport {
    return (this.product?.additionalInfo?.report || {}) as IProductReport;
  }

  get outcomesObject(): IOutcomeSection {
    return (this.product?.additionalInfo?.outcomes || {}) as IOutcomeSection;
  }

  get productOutcomes(): IOutcomes[] {
    return this.outcomesObject?.outcome || [];
  }

  get productFeature(): any {
    return this.product?.additionalInfo?.feature;
  }

  get productStartEndorsed(): IProjectStarEndorsedSection {
    return (this.product?.additionalInfo?.startEndorsed ||
      {}) as IProjectStarEndorsedSection;
  }

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
    await this.loadProductData();
  }

  ngOnDestroy(): void {
    this.stopFeatureSliderAutoSwitch();
  }

  /**
   * Load banner media data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.PRODUCT
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load banner data for Product page:', error);
      this.banners = [];
    }
  }

  /**
   * Load product data from API
   */
  private async loadProductData(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);
      let product: IPublicProduct | null = null;
      const products = await this.productService.getAllProducts(0, 1);
      product = products.length > 0 ? products[0] : null;
      if (product) {
        this.initializeProductData(product);
      } else {
        this.error.set('Product not found');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load product data:', error);
      this.error.set('Failed to load product information. Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Normalize product data structure
   * Handles case where API returns flat array with both fees and variants mixed
   */
  private normalizeProductData(product: IPublicProduct): IPublicProduct {
    const anyProduct = product as any;
    if (anyProduct.fees && anyProduct.fees.length > 0) {
      const normalizedFees: IProductFee[] = [];
      const normalizedVariants: any[] = [];
      const variantMap = new Map<string, any>();
      for (const item of anyProduct.fees as any[]) {
        const isVariant =
          item.quantityValue !== undefined &&
          (Array.isArray(item.prices) ||
            (item.prices !== undefined && typeof item.prices === 'object') ||
            (item.price !== undefined && item.currency !== undefined));
        if (isVariant) {
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
          if (Array.isArray(item.prices) && item.prices.length > 0) {
            variant.prices.push(
              ...item.prices.map((p: any) => ({
                currency: p.currency,
                price: p.price,
                active: p.active !== false,
                validFrom: p.validFrom,
                validTo: p.validTo
              }))
            );
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
            const priceObj = {
              currency: item.currency,
              price: item.price,
              active: item.isActive !== false,
              validFrom: item.validFrom,
              validTo: item.validTo
            };
            variant.prices.push(priceObj);
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
      normalizedVariants.push(...Array.from(variantMap.values()));
      const existingVariants = (anyProduct.variants || []) as any[];
      const mergedVariants = [...existingVariants];
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
      return {
        ...(anyProduct as IPublicProduct),
        fees: normalizedFees.length > 0 ? normalizedFees : anyProduct.fees,
        variants:
          mergedVariants.length > 0 ? (mergedVariants as any) : anyProduct.variants
      };
    }
    return product;
  }

  /**
   * Initialize product data from API response
   */
  private initializeProductData(product: IPublicProduct): void {
    const normalizedProduct = this.normalizeProductData(product);
    this.product = normalizedProduct;
    this.productName = normalizedProduct.name as unknown as string;
    this.productDescription =
      (normalizedProduct as any).additionalInfo?.feature?.tagLine ||
      (normalizedProduct.name as unknown as string);
    this.productId = (normalizedProduct as any).productId || null;
    if ((normalizedProduct as any).imagePath && (normalizedProduct as any).imagePath.length > 0) {
      this.productImages = (normalizedProduct as any).imagePath.map(
        (img: IMediaUpload) => img.webUrl
      );
      this.productImages1 = [...this.productImages];
    }
    if ((normalizedProduct as any).additionalInfo?.feature?.images) {
      const featureImages = (normalizedProduct as any).additionalInfo.feature.images.map(
        (img: IMediaUpload) => img.webUrl
      );
      if (featureImages.length > 0) {
        this.productImages1 = featureImages;
      }
    }
    if (
      (normalizedProduct as any).additionalInfo?.consumptionInstructions?.mediaData
        ?.mediaLink
    ) {
      const videos =
        (normalizedProduct as any).additionalInfo.consumptionInstructions.mediaData.mediaLink.map(
          (media: IMediaUpload) => media.webUrl
        );
      if (videos.length > 0) {
        this.productVideos = videos;
      }
    }
    const defaultCurrency = 'INR';
    if (normalizedProduct.variants && normalizedProduct.variants.length > 0) {
      for (const variant of normalizedProduct.variants as any[]) {
        if (variant.prices && variant.prices.length > 0) {
          const inrPrice = (variant.prices as any[]).find((p) => {
            const currency = p.currency as string | undefined;
            const active = p.active as boolean | undefined;
            const currencyMatch =
              currency &&
              (currency.toUpperCase() === defaultCurrency.toUpperCase() ||
                currency === defaultCurrency);
            const activeMatch = active !== false || active === undefined;
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
            } as ISizeOption;
            this.productId = variant.productId || null;
            this.productVariantId = variant.productVariantId || null;
            break;
          }
        }
      }
    }
    if (!this.selectedSize && normalizedProduct.fees && normalizedProduct.fees.length > 0) {
      const inrFee = normalizedProduct.fees.find((f) => {
        const currencyMatch =
          f.currency &&
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
    if (this.productImages1.length > 1) {
      this.startFeatureSliderAutoSwitch();
    }
    // Update SEO meta data for this product
    this.seoService.updateSEO({
      title: this.productName,
      description: this.productDescription,
      url: this.router.url,
      type: 'product'
    });
  }

  getCurrentPrice(): number {
    if (!this.selectedSize) {
      const defaultCurrency = 'INR';
      if (this.product?.variants && this.product.variants.length > 0) {
        const firstVariant = (this.product.variants as any[])[0];
        if (firstVariant.prices && firstVariant.prices.length > 0) {
          const inrPrice = (firstVariant.prices as any[]).find((p) => {
            const currency = p.currency as string | undefined;
            const active = p.active as boolean | undefined;
            const currencyMatch =
              currency &&
              (currency.toUpperCase() === defaultCurrency.toUpperCase() ||
                currency === defaultCurrency);
            const activeMatch = active !== false || active === undefined;
            return currencyMatch && activeMatch;
          });
          return inrPrice ? inrPrice.price : 0;
        }
      }
      if (this.product?.fees && this.product.fees.length > 0) {
        const inrFee = this.product.fees.find((f) => {
          const currencyMatch =
            f.currency &&
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

  /**
   * Feature slider controls
   */
  featureSliderNext(): void {
    if (this.productImages1.length > 0) {
      this.featureSliderCurrentIndex =
        (this.featureSliderCurrentIndex + 1) % this.productImages1.length;
      this.resetFeatureSliderAutoSwitch();
    }
  }

  featureSliderPrevious(): void {
    if (this.productImages1.length > 0) {
      this.featureSliderCurrentIndex =
        this.featureSliderCurrentIndex === 0
          ? this.productImages1.length - 1
          : this.featureSliderCurrentIndex - 1;
      this.resetFeatureSliderAutoSwitch();
    }
  }

  featureSliderGoTo(index: number): void {
    if (index >= 0 && index < this.productImages1.length) {
      this.featureSliderCurrentIndex = index;
      this.resetFeatureSliderAutoSwitch();
    }
  }

  private startFeatureSliderAutoSwitch(): void {
    if (this.productImages1.length > 1) {
      this.stopFeatureSliderAutoSwitch();
      this.featureSliderTimer = setInterval(() => {
        this.featureSliderNext();
      }, this.featureSliderInterval);
    }
  }

  private stopFeatureSliderAutoSwitch(): void {
    if (this.featureSliderTimer) {
      clearInterval(this.featureSliderTimer);
      this.featureSliderTimer = null;
    }
  }

  private resetFeatureSliderAutoSwitch(): void {
    if (this.productImages1.length > 1) {
      this.stopFeatureSliderAutoSwitch();
      this.startFeatureSliderAutoSwitch();
    }
  }

  onFeatureSliderHover(): void {
    this.stopFeatureSliderAutoSwitch();
  }

  onFeatureSliderLeave(): void {
    if (this.productImages1.length > 1) {
      this.startFeatureSliderAutoSwitch();
    }
  }

  /**
   * Handle buy now action
   */
  onBuyNow(): void {
    if (!this.selectedSize) {
      // eslint-disable-next-line no-console
      console.error('Please select a product size');
      return;
    }
    const queryParams: any = {
      productName: encodeURIComponent(this.productName),
      productPrice: this.currentPrice.toString(),
      productQuantity: this.quantity.toString(),
      productSku: encodeURIComponent(this.selectedSize.sku || '')
    };
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
      this.productVariantId = size.productVariantId || null;
      this.productId = size.productId || this.productId;
    }
  }

  /**
   * Image selection
   */
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  get selectedImage(): string {
    if (this.productImages.length === 0) {
      return 'assets/images/products/debloat-main-1200x1200.jpg';
    }
    return this.productImages[this.selectedImageIndex] || this.productImages[0];
  }

  /**
   * Quantity controls
   */
  incrementQuantity(): void {
    if (this.quantity < 5) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  updateQuantity(value: string): void {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      this.quantity = Math.min(numValue, 5);
    }
  }

  /**
   * Video handlers
   */
  onVideoError(event: Event): void {
    // eslint-disable-next-line no-console
    console.error('Video error:', event);
    const video = event.target as HTMLVideoElement;
    // eslint-disable-next-line no-console
    console.error('Video src:', video?.src);
    // eslint-disable-next-line no-console
    console.error('Video error code:', video?.error?.code);
  }

  onVideoLoaded(): void {
  }
}

