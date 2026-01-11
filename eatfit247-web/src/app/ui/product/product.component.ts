import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerService } from '../../services/banner.service';
import { FaqService } from '../../services/faq.service';
import { BannerForEnum, IFaq } from 'eatfit247-shared-library';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { FaqItemComponent } from '../shared/faq-item/faq-item.component';
import { SectionFaqComponent } from '../shared/section-faq/section-faq.component';

interface ProductSize {
  value: string;
  label: string;
  price: number;
}

interface Ingredient {
  name: string;
  icon?: string;
  description?: string;
}

interface Benefit {
  title: string;
  description: string;
  icon?: string;
}

interface ProductData {
  name: string;
  priceRange: {
    min: number;
    max: number;
  };
  sizes: ProductSize[];
  benefits: string[];
  dose: string;
  howToTake: string;
  precautions: string[];
  ingredients: Ingredient[];
  consumptionInstructions: {
    amount: string;
    methods: string[];
    timing: {
      morning: string;
      evening: string;
    };
  };
  outcomes: Benefit[];
}

/**
 * Product Component
 * Displays product details page for De-bloat powder
 */
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
  // Banner items
  bannerItems: SliderItem[] = [];
  // Product data
  productName = 'De-bloat';
  productDescription = 'Debloat yourself within 3 months';
  selectedSize: string = '100gm';
  quantity: number = 1;
  // Product images
  productImages: string[] = [
    '/assets/images/products/debloat-main-1200x1200.jpg',
    '/assets/images/products/debloat-alt-1200x1205.jpg'
  ];
  productImages1: string[] = [
    '/assets/images/products/debloat-alt-1200x1205.jpg',
    '/assets/images/products/debloat-3.jpg'
  ];
  selectedImageIndex: number = 0;
  // Star powder image
  starPowderImage: string = '/assets/images/products/start-powder.png';
  // Custom slider for the 3rd section
  featureSliderCurrentIndex: number = 0;
  private featureSliderTimer: any = null;
  private readonly featureSliderInterval: number = 5000; // 5-second
  // Product feature bullet points for the 3rd section
  productFeatureBullets: string[] = [
    'Say Goodbye to bloating',
    'Reverse your gut issues and calms an upset stomach',
    'Bid farewell to IBS symptoms, including pain, gas acidity and constipation',
    'Discover the power of nature with our organic herbal ingredients'
  ];
  // Product tag line for 3rd section
  productTagLine = 'Promotes gut health and digestive comfort – try it today!';
  // Video links (MP4 files from the website)
  productVideos: string[] = ['/assets/videos/video-2.mp4'];
  // Tried and Tested Section
  triedAndTestedImage: string = '/assets/images/products/tried-and-tested.jpg';

  // Use product.sizes for sizes
  get sizes(): ProductSize[] {
    return this.product.sizes;
  }

  get currentPrice(): number {
    return this.getCurrentPrice();
  }

  get priceRange(): string {
    return `₹ ${this.product.priceRange.min}.00 – ₹ ${this.product.priceRange.max}.00`;
  }

  get consumeVideoUrl(): string {
    return this.productVideos[0] || '/assets/videos/video-2.mp4';
  }

  getCurrentPrice(): number {
    const selectedSizeObj = this.product.sizes.find((s) => s.value === this.selectedSize);
    return selectedSizeObj?.price || this.product.priceRange.min;
  }

  benefits: Benefit[] = [
    {
      title: 'Say Goodbye to bloating',
      description: 'Helps achieve long–term bloat reduction'
    },
    {
      title: 'Reverse your gut issues',
      description: 'Calms an upset stomach and restores lost energy'
    },
    {
      title: 'Bid farewell to IBS symptoms',
      description: 'Relieves pain, gas, acidity and constipation'
    },
    {
      title: '100% Natural',
      description: 'Discover the power of nature with our organic herbal ingredients'
    }
  ];
  // Product data structure matching showcase component
  product: ProductData = {
    name: 'De-bloat',
    priceRange: {
      min: 700,
      max: 1200
    },
    sizes: [
      { value: '100gm', label: '100gm', price: 700 },
      { value: '200gm', label: '200gm', price: 1200 }
    ],
    benefits: [
      'Helps achieve long–term bloat reduction',
      'Relives Hyperacidity',
      'Calms an upset stomach',
      'Restores lost energy',
      'Weight Loss'
    ],
    dose: '10 GMs of powder each day',
    howToTake:
      'With a glass of normal water, you can add it in smoothies, fruit juices, vegetable juices, coconut water, buttermilk, Mountain Dew.',
    precautions: [
      'Store in cool and dry place away from direct sunlight',
      'Keep out of reach of children',
      'Do not refrigerate',
      'Should be avoided by People with serious medical conditions',
      'Protect from moisture'
    ],
    ingredients: [
      { name: 'Curry Leaves', icon: '/assets/images/products/ingredients/curry-leaves.png' },
      { name: 'Haldi', icon: '/assets/images/products/ingredients/haldi.png' },
      { name: 'Jeera', icon: '/assets/images/products/ingredients/jira.png' },
      { name: 'Seasame Seeds', icon: '/assets/images/products/ingredients/seasame-seeds.png' },
      { name: 'Haritaki', icon: '/assets/images/products/ingredients/haritaki.webp' },
      { name: 'Saunf', icon: '/assets/images/products/ingredients/saunf.png' }
    ],
    consumptionInstructions: {
      amount: '10 grams (2tsp) powder daily',
      methods: ['water', 'juices', 'coconut water', 'buttermilk'],
      timing: {
        morning: '1 tsp in AM (morning)',
        evening: '1 tsp in PM (evening)'
      }
    },
    outcomes: [
      {
        icon: '/assets/images/speed-food-breakdown.png',
        title: 'SPEEDS FOOD BREAKDOWN',
        description: 'Enjoy your favorite foods without any discomfort'
      },
      {
        icon: '/assets/images/relieves-heartburn.jpg',
        title: 'RELIEVES HEARTBURN',
        description: 'So food can digest smoothly'
      },
      {
        icon: '/assets/images/prevent-gas.png',
        title: 'PREVENTS GAS',
        description: 'Have fun spend quality time with loved ones worry-free'
      }
    ]
  };
  // Keep existing properties for backward compatibility
  ingredients: Ingredient[] = this.product.ingredients;
  // Keep outcomes for backward compatibility
  outcomes: Benefit[] = this.product.outcomes;

  ngOnInit(): void {
    // Load banner data
    this.loadBannerData();
    // Start auto-switch for feature slider
    this.startFeatureSliderAutoSwitch();
    // Get product slug from route if available
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      // TODO: Load product data based on slug
      // For now, we'll use the default product data
    }
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
   * Get current feature slider image
   */
  get currentFeatureImage(): string {
    return this.productImages1[this.featureSliderCurrentIndex] || this.productImages1[0];
  }

  /**
   * Check if feature slider has multiple images
   */
  get hasMultipleFeatureImages(): boolean {
    return this.productImages1.length > 1;
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
  onSizeChange(size: string | null): void {
    if (size) {
      this.selectedSize = size;
    }
  }

  /**
   * Select product image by index
   */
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  /**
   * Get current selected image
   */
  get selectedImage(): string {
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

