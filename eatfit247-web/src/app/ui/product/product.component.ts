import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BannerService } from '../../services/banner.service';
import { BannerForEnum } from 'eatfit247-shared-library';

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
  faqs: Array<{
    question: string;
    answer: string;
  }>;
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
    MatExpansionModule,
    FormsModule,
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  
  // Product data
  productName = 'De-bloat';
  productDescription = 'Debloat yourself within 3 months';
  selectedSize: string = '100gms';
  quantity: number = 1;
  
  // Product images
  productImages: string[] = [
    '/assets/images/products/debloat-main-1200x1200.jpg',
    '/assets/images/products/debloat-alt-1200x1205.jpg',
    '/assets/images/products/debloat-3.jpg',
    '/assets/images/products/debloat-img-750x250.jpg',
  ];
  selectedImageIndex: number = 0;
  
  // Video links (MP4 files from the website)
  productVideos: string[] = [
    'https://eatfit24by7.com/wp-content/uploads/2023/11/InShot_20231101_151909624-2.mp4',
    'https://eatfit24by7.com/wp-content/uploads/2023/11/video-2.mp4',
  ];
  
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

  getCurrentPrice(): number {
    const selectedSizeObj = this.product.sizes.find(
      (s) => s.value === this.selectedSize
    );
    return selectedSizeObj?.price || this.product.priceRange.min;
  }

  benefits: Benefit[] = [
    {
      title: 'Say Goodbye to bloating',
      description: 'Helps achieve long–term bloat reduction',
    },
    {
      title: 'Reverse your gut issues',
      description: 'Calms an upset stomach and restores lost energy',
    },
    {
      title: 'Bid farewell to IBS symptoms',
      description: 'Relieves pain, gas, acidity and constipation',
    },
    {
      title: '100% Natural',
      description: 'Discover the power of nature with our organic herbal ingredients',
    },
  ];

  // Product data structure matching showcase component
  product: ProductData = {
    name: 'De-bloat',
    priceRange: {
      min: 700,
      max: 1200,
    },
    sizes: [
      { value: '100gms', label: '100gms', price: 700 },
      { value: '200gms', label: '200gms', price: 1200 },
    ],
    benefits: [
      'Helps achieve long–term bloat reduction',
      'Relives Hyperacidity',
      'Calms an upset stomach',
      'Restores lost energy',
      'Weight Loss',
    ],
    dose: '10 GMs of powder each day',
    howToTake: 'With a glass of normal water, you can add it in smoothies, fruit juices, vegetable juices, coconut water, buttermilk, Mountain Dew.',
    precautions: [
      'Store in cool and dry place away from direct sunlight',
      'Keep out of reach of children',
      'Do not refrigerate',
      'Should be avoided by People with serious medical conditions',
      'Protect from moisture',
    ],
    ingredients: [
      { name: 'Curry Leaves', icon: '🌿' },
      { name: 'Haldi', icon: '🟡' },
      { name: 'Jeera', icon: '🌾' },
      { name: 'Seasame Seeds', icon: '⚪' },
      { name: 'Haritaki', icon: '🍃' },
      { name: 'Saunf', icon: '🌱' },
    ],
    consumptionInstructions: {
      amount: '10 grams (2tsp) powder daily',
      methods: ['water', 'juices', 'coconut water', 'buttermilk'],
      timing: {
        morning: '1 tsp in AM (morning)',
        evening: '1 tsp in PM (evening)',
      },
    },
    outcomes: [
      {
        title: 'SPEEDS FOOD BREAKDOWN',
        description: 'Enjoy your favorite foods without any discomfort',
      },
      {
        title: 'RELIEVES HEARTBURN',
        description: 'So food can digest smoothly',
      },
      {
        title: 'PREVENTS GAS',
        description: 'Have fun spend quality time with loved ones worry-free',
      },
    ],
    faqs: [
      {
        question: 'How does Debloat Powder work?',
        answer:
          'Debloat Powder stimulates the digestive fire (Agni) and promotes the release of digestive enzymes for better food absorption. It also aids in maintaining a balanced pH level in the blood.',
      },
      {
        question: 'How soon can I expect to see results with Debloat Powder?',
        answer:
          'Many users report experiencing positive results within a few days of use. However, individual results may vary.',
      },
      {
        question: 'How do I take Debloat Powder?',
        answer:
          'The recommended dose is 5 grams (1 tsp) of powder daily. You can mix it with water, smoothies, fruit juices, vegetable juices, coconut water, buttermilk',
      },
      {
        question: 'Who can use Debloat Powder?',
        answer:
          'Debloat Powder is suitable for anyone looking to improve their digestion naturally. It is especially beneficial for those with digestive issues, PCOS, thyroid problems, high blood pressure, diabetes, hormonal imbalances, and those seeking weight loss.',
      },
      {
        question: 'Is Debloat Powder safe to use?',
        answer:
          'Yes, it is made from natural herbs and spices adhering to ayurvedic principles. However, it should be avoided by pregnant or lactating women and people with serious medical condition',
      },
      {
        question: 'When can I consume it?',
        answer:
          'Take 2 tsp a day. 1 tsp in the AM (morning) and 1tsp in the PM (evening)',
      },
      {
        question: 'Can Debloat Powder help with weight loss?',
        answer:
          'Yes, regular use of Debloat Powder can promote fat metabolism and may help with weight loss, along with inch loss.',
      },
      {
        question: 'How should I store Debloat Powder?',
        answer:
          'Store it in a cool, dry place away from direct sunlight. Do not refrigerate.',
      },
      {
        question: 'Is it the same as other pre-probiotic?',
        answer:
          "No, it's not a pre-pro biotic. Instead it's a magical formula to activate the bile juice, pancreatic juice and digestive fire which in turn sets the tone of digestion and enhance nutrient digestion",
      },
    ],
  };

  // Keep existing properties for backward compatibility
  ingredients: Ingredient[] = this.product.ingredients;

  // Keep outcomes for backward compatibility
  outcomes: Benefit[] = this.product.outcomes;

  ngOnInit(): void {
    // Get product slug from route if available
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      // TODO: Load product data based on slug
      // For now, we'll use the default product data
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
      price: this.currentPrice,
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
}

