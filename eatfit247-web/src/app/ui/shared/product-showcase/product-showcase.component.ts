import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

/**
 * Product Showcase Component
 * Displays product information, features, and purchase options
 */
@Component({
  selector: 'app-product-showcase',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatExpansionModule,
  ],
  templateUrl: './product-showcase.component.html',
  styleUrl: './product-showcase.component.scss',
})
export class ProductShowcaseComponent {
  selectedSize: string = '100gms';
  quantity: number = 1;

  // Product data
  product = {
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

  getCurrentPrice(): number {
    const selectedSizeObj = this.product.sizes.find(
      (s) => s.value === this.selectedSize
    );
    return selectedSizeObj?.price || this.product.priceRange.min;
  }

  onSizeChange(size: string | null): void {
    if (size) {
      this.selectedSize = size;
    }
  }

  onBuyNow(): void {
    // Handle buy now action
    console.log('Buy Now clicked', {
      size: this.selectedSize,
      price: this.getCurrentPrice(),
      quantity: this.quantity,
    });
    // Navigate to checkout or add to cart
  }
}

