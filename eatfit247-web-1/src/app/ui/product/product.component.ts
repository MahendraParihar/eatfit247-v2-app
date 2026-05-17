import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BreadcrumbsComponent, LoaderComponent } from '@shared-ui';
import {
  FaqService,
  GoogleReviewService,
  JsonLdService,
  SEOService,
} from '../../core/services';
import { ProductService } from '../../core/services/product.service';
import {
  GoogleReviewEntityTypeEnum,
  IMediaUpload,
  IOutcomes,
  IOutcomeSection,
  IProductFee,
  IProductIngredientSection,
  IProductReport,
  IProjectConsumptionInstructionSection,
  IProjectStarEndorsedSection,
  IPublicFaq,
  IPublicGoogleReview,
  IPublicProduct,
} from '@eatfit247-shared-library';

// Extended interface for size display with value and label
interface ISizeOption extends IProductFee {
  value: IProductFee;
  label: string;
  productId?: number | null;
  productVariantId?: number | null;
}

/** Title + description pair used by the Benefits / Storage lists. */
interface IBenefitLine {
  title: string;
  description: string;
}

@Component({
  standalone: true,
  selector: 'app-product',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LoaderComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent implements OnInit, OnDestroy {
  private readonly faqService = inject(FaqService);
  private readonly googleReviewService = inject(GoogleReviewService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly seoService = inject(SEOService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly sanitizer = inject(DomSanitizer);
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
  starPowderImage = '/product_feature.jpg';
  // Custom slider for the feature section
  featureSliderCurrentIndex = 0;
  private featureSliderTimer: any = null;
  private readonly featureSliderInterval = 5000; // 5 seconds
  productVideos: string[] = [];
  // FAQ data
  productFaqs: IPublicFaq[] = [];

  /** Material symbol icons rotated for the Benefits list (per design). */
  private readonly benefitIcons: string[] = [
    'monitor_weight',
    'water_drop',
    'female',
    'air',
    'bolt',
    'trending_down',
  ];

  /** Material symbol icons rotated for the Storage/Precautions list. */
  private readonly precautionIcons: string[] = [
    'event',
    'ac_unit',
    'wb_sunny',
    'lock',
  ];

  /**
   * Canonical benefit copy from the design HTML. Acts as a fallback when
   * `additionalInfo.benefits` from the API is empty or returns a bare string[].
   */
  private readonly defaultBenefits: readonly IBenefitLine[] = [
    {
      title: 'Bloat reduction',
      description: 'Calms post-meal heaviness within 30 minutes.',
    },
    {
      title: 'Relieves hyperacidity',
      description: 'Soothes the stomach lining and balances pH.',
    },
    {
      title: 'Period bloating & cramps',
      description: 'Eases water retention and abdominal discomfort.',
    },
    {
      title: 'Relieves gas, burping & belching',
      description: 'Targets flatulence and post-meal discomfort at the source.',
    },
    {
      title: 'Restores lost energy',
      description:
        "Better digestion frees up energy you didn't know you were spending.",
    },
    {
      title: 'Supports weight loss',
      description: 'A balanced gut speeds up metabolism and curbs cravings.',
    },
  ];

  /** Canonical storage / precaution copy from the design HTML. */
  private readonly defaultPrecautions: readonly IBenefitLine[] = [
    {
      title: 'Shelf life',
      description: '7–8 months from the date of manufacture.',
    },
    {
      title: 'Store in a cool, dry place',
      description: 'Avoid humid spots like near the stove or sink.',
    },
    {
      title: 'Keep away from direct sunlight',
      description: 'Sunlight can degrade the natural ingredients.',
    },
    {
      title: 'Seal tightly after use',
      description: 'Press the zip-lock closed each time to preserve freshness.',
    },
  ];

  /** Step labels rotated through the How-to-use block when the API only
   *  returns plain instruction strings (so we don't lose the design's
   *  evocative "Measure / Mix / Sip" labels). */
  private readonly defaultHowToUseStepNames: readonly string[] = [
    'Measure',
    'Mix',
    'Sip',
  ];

  /** Product reviews loaded from txn_google_review for this product. */
  productReviews = signal<IPublicGoogleReview[]>([]);

  get reviewList(): ReadonlyArray<{
    initials: string;
    name: string;
    role?: string;
    quote: string;
  }> {
    return this.productReviews().map((r) => ({
      initials: this.buildInitials(r.reviewerName),
      name: r.reviewerName,
      role: r.reviewerRole ?? undefined,
      quote: r.reviewText ?? '',
    }));
  }

  private buildInitials(name: string): string {
    if (!name) {
      return '';
    }
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  benefitIcon(index: number): string {
    return this.benefitIcons[index % this.benefitIcons.length];
  }

  precautionIcon(index: number): string {
    return this.precautionIcons[index % this.precautionIcons.length];
  }

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
                validTo: inrPrice.validTo,
              },
              label: `${variant.quantityValue} ${variant.quantityUnit}`,
              productId: variant.productId,
              productVariantId: variant.productVariantId,
            } as ISizeOption);
          }
        }
      }
    }
    // Fallback: If no variants with INR found, check fees with INR currency
    if (
      sizeOptions.length === 0 &&
      this.product?.fees &&
      this.product.fees.length > 0
    ) {
      const inrFees = this.product.fees.filter((fee) => {
        const currencyMatch =
          fee.currency &&
          (fee.currency.toUpperCase() === defaultCurrency.toUpperCase() ||
            fee.currency === defaultCurrency);
        const activeMatch =
          fee.isActive !== false || fee.isActive === undefined;
        return currencyMatch && activeMatch;
      });
      for (const fee of inrFees) {
        sizeOptions.push({
          ...fee,
          value: fee,
          label: `${fee.quantity} ${fee.unit}`,
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

  /**
   * Benefits list as `{title, description}` pairs.
   * Accepts API shape of `string[]` (legacy) or `{title, description}[]` (new)
   * and falls back to the canonical design copy when both are missing.
   */
  get productBenefits(): IBenefitLine[] {
    const raw = this.product?.additionalInfo?.benefits as unknown;
    return this.normalizeBenefitLines(raw, this.defaultBenefits);
  }

  /** How-to-use step label for the given index. Falls back to `Step N`. */
  howToUseStepName(index: number, instruction?: unknown): string {
    if (instruction && typeof instruction === 'object') {
      const obj = instruction as { title?: string; name?: string };
      if (obj.title) return obj.title;
      if (obj.name) return obj.name;
    }
    return this.defaultHowToUseStepNames[index] ?? `Step ${index + 1}`;
  }

  /** How-to-use step body — handles both string instructions and object form. */
  howToUseStepBody(instruction: unknown): string {
    if (typeof instruction === 'string') {
      return instruction;
    }
    if (instruction && typeof instruction === 'object') {
      const obj = instruction as {
        description?: string;
        body?: string;
        text?: string;
      };
      return obj.description ?? obj.body ?? obj.text ?? '';
    }
    return '';
  }

  private normalizeBenefitLines(
    raw: unknown,
    fallback: readonly IBenefitLine[],
  ): IBenefitLine[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      return [...fallback];
    }
    return raw.map((entry, i): IBenefitLine => {
      if (typeof entry === 'string') {
        // String list — pair with the description from the canonical fallback when available.
        return {
          title: entry,
          description: fallback[i]?.description ?? '',
        };
      }
      if (entry && typeof entry === 'object') {
        const obj = entry as {
          title?: string;
          description?: string;
          name?: string;
        };
        return {
          title: obj.title ?? obj.name ?? '',
          description: obj.description ?? '',
        };
      }
      return { title: '', description: '' };
    });
  }

  get productDose(): string {
    return this.product?.additionalInfo?.dose || '';
  }

  get productHowToTake(): string {
    return this.product?.additionalInfo?.howToTake || '';
  }

  /** Storage / precaution list as `{title, description}` pairs (with fallback). */
  get productPrecautions(): IBenefitLine[] {
    const raw = this.product?.additionalInfo?.precautions as unknown;
    return this.normalizeBenefitLines(raw, this.defaultPrecautions);
  }

  /**
   * Extracts the YouTube video ID from a Shorts / watch / youtu.be URL,
   * so the design's iframe-based embed can render the right video.
   * Returns `null` when the input isn't a recognisable YouTube URL.
   */
  getYoutubeEmbedUrl(rawUrl?: string | null): string | null {
    if (!rawUrl) {
      return null;
    }
    const url = rawUrl.trim();
    // youtube.com/shorts/<id>
    const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
    if (shortsMatch) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0&modestbranding=1`;
    }
    // youtube.com/watch?v=<id>
    const watchMatch = url.match(/[?&]v=([\w-]{6,})/i);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`;
    }
    // youtu.be/<id>
    const shortMatch = url.match(/youtu\.be\/([\w-]{6,})/i);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`;
    }
    // Already an embed URL
    if (/youtube\.com\/embed\//i.test(url)) {
      return url;
    }
    return null;
  }

  /** YouTube link surfaced from the endorsement section, used for the
   *  "Watch on YouTube" outline CTA. Falls back to a sensible default. */
  get endorsementYoutubeUrl(): string {
    const link = (this.productStartEndorsed as any)?.mediaData?.mediaLink?.[0]
      ?.webUrl as string | undefined;
    if (link && /youtu/i.test(link)) {
      return link;
    }
    const externalUrl = (this.productStartEndorsed as any)?.externalUrl as
      | string
      | undefined;
    if (externalUrl && /youtu/i.test(externalUrl)) {
      return externalUrl;
    }
    return 'https://youtube.com/shorts/JfEkvT2csjE';
  }

  /** Sanitised embed URL ready to bind to an `<iframe [src]>`. */
  get endorsementYoutubeEmbedSafe(): SafeResourceUrl | null {
    const url = this.endorsementYoutubeEmbed;
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  }

  /** Embed URL for the trust-champions phone-frame player.
   *  Returns `null` when the source is a non-YouTube video (in which case
   *  the template renders the native `<video>` instead). */
  get endorsementYoutubeEmbed(): string | null {
    const link = (this.productStartEndorsed as any)?.mediaData?.mediaLink?.[0]
      ?.webUrl as string | undefined;
    const embed = this.getYoutubeEmbedUrl(link);
    if (embed) {
      return embed;
    }
    // If the API supplies no YouTube link at all, fall back to the design's default short.
    if (!link) {
      return this.getYoutubeEmbedUrl(this.endorsementYoutubeUrl);
    }
    return null;
  }

  /** Optional quote / figcaption for the endorser (Harbhajan Singh fallback). */
  get endorsementQuote(): { text: string; name: string; role?: string } {
    const additional = this.product?.additionalInfo as any;
    const quote = additional?.startEndorsed?.quote;
    const name = additional?.startEndorsed?.endorserName || 'Harbhajan Singh';
    const role =
      additional?.startEndorsed?.endorserRole || 'Former India cricketer';
    return {
      text:
        quote ||
        'A clean, honest product that actually does what it says — gentle, natural, and a part of my daily routine.',
      name,
      role,
    };
  }

  get productIngredients(): IProductIngredientSection {
    return (this.product?.additionalInfo?.ingredients ||
      {}) as IProductIngredientSection;
  }

  get productConsumptionInstructions(): IProjectConsumptionInstructionSection {
    return (this.product?.additionalInfo?.consumptionInstructions ||
      {}) as IProjectConsumptionInstructionSection;
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

  get reportStats(): { value: string; label: string }[] {
    const stats = (
      this.productReportSection as unknown as Record<string, unknown>
    )?.stats;
    if (Array.isArray(stats)) {
      return stats as { value: string; label: string }[];
    }
    return [];
  }

  async ngOnInit(): Promise<void> {
    await this.loadProductData();
    await Promise.all([this.loadFaqData(), this.loadProductReviews()]);
  }

  ngOnDestroy(): void {
    this.stopFeatureSliderAutoSwitch();
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
      this.error.set(
        'Failed to load product information. Please try again later.',
      );
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
              prices: [],
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
                validTo: p.validTo,
              })),
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
                validTo: price.validTo,
              });
            });
          } else if (item.price !== undefined && item.currency !== undefined) {
            const priceObj = {
              currency: item.currency,
              price: item.price,
              active: item.isActive !== false,
              validFrom: item.validFrom,
              validTo: item.validTo,
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
              validTo: item.validTo,
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
            validTo: item.validTo,
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
            v.quantityUnit === normalizedVariant.quantityUnit,
        );
        if (!exists) {
          mergedVariants.push(normalizedVariant);
        }
      }
      return {
        ...(anyProduct as IPublicProduct),
        fees: normalizedFees.length > 0 ? normalizedFees : anyProduct.fees,
        variants:
          mergedVariants.length > 0
            ? (mergedVariants as any)
            : anyProduct.variants,
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
    if (
      (normalizedProduct as any).imagePath &&
      (normalizedProduct as any).imagePath.length > 0
    ) {
      this.productImages = (normalizedProduct as any).imagePath.map(
        (img: IMediaUpload) => img.webUrl,
      );
      this.productImages1 = [...this.productImages];
    }
    if ((normalizedProduct as any).additionalInfo?.feature?.images) {
      const featureImages = (
        normalizedProduct as any
      ).additionalInfo.feature.images.map((img: IMediaUpload) => img.webUrl);
      if (featureImages.length > 0) {
        this.productImages1 = featureImages;
      }
    }
    if (
      (normalizedProduct as any).additionalInfo?.consumptionInstructions
        ?.mediaData?.mediaLink
    ) {
      const videos = (
        normalizedProduct as any
      ).additionalInfo.consumptionInstructions.mediaData.mediaLink.map(
        (media: IMediaUpload) => media.webUrl,
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
                validTo: inrPrice.validTo,
              },
              label: `${variant.quantityValue} ${variant.quantityUnit}`,
              productId: variant.productId,
              productVariantId: variant.productVariantId,
            } as ISizeOption;
            this.productId = variant.productId || null;
            this.productVariantId = variant.productVariantId || null;
            break;
          }
        }
      }
    }
    if (
      !this.selectedSize &&
      normalizedProduct.fees &&
      normalizedProduct.fees.length > 0
    ) {
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
          label: `${inrFee.quantity} ${inrFee.unit}`,
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
      type: 'product',
    });
    // Inject Product structured data
    this.jsonLdService.setPageSchema([
      {
        '@type': 'Product',
        name: this.productName,
        description: this.productDescription,
        image: this.productImages.length > 0 ? this.productImages : undefined,
        brand: { '@type': 'Brand', name: 'EatFit247' },
        offers: this.currentPrice
          ? {
              '@type': 'Offer',
              price: this.currentPrice.toString(),
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: `https://eatfit24by7.com${this.router.url}`,
            }
          : undefined,
      },
      this.jsonLdService.buildBreadcrumb([
        { name: 'Home', url: 'https://eatfit24by7.com/' },
        { name: 'Products', url: 'https://eatfit24by7.com/product' },
        {
          name: this.productName,
          url: `https://eatfit24by7.com${this.router.url}`,
        },
      ]),
    ]);
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
   * Load Google reviews for the currently loaded product from txn_google_review.
   */
  private async loadProductReviews(): Promise<void> {
    if (!this.productId) {
      this.productReviews.set([]);
      return;
    }
    const reviews = await this.googleReviewService.getReviewsByEntity(
      GoogleReviewEntityTypeEnum.Product,
      this.productId,
    );
    this.productReviews.set(reviews);
  }

  /**
   * Load FAQ data for product page (category id = 9)
   */
  private async loadFaqData(): Promise<void> {
    try {
      this.productFaqs = await this.faqService.getFaqsByCategoryId(9);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load FAQ data:', error);
      this.productFaqs = [];
    }
  }

  /**
   * Handle buy now action
   */
  onBuyNow(): void {
    if (!this.selectedSize) {
      return;
    }
    const queryParams: any = {
      productName: encodeURIComponent(this.productName),
      productPrice: this.currentPrice.toString(),
      productQuantity: this.quantity.toString(),
      productSku: encodeURIComponent(this.selectedSize.sku || ''),
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
      return '/product_feature.jpg';
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
    const video = event.target as HTMLVideoElement;
  }

  onVideoLoaded(): void {}
}
