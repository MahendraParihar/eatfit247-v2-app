import { Injectable } from '@angular/core';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  publishDate: Date;
  category: string;
  imageUrl?: string;
  imageAlt?: string;
  slug: string;
  readTime?: number; // in minutes
  tags?: string[];
}

/**
 * Service to manage blog data
 * Provides methods to fetch blog posts with pagination
 */
@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private readonly blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Meet Shweta Shah, an entrepreneur and nutritionist to celebs like Katrina Kaif and Deepika Padukone',
      excerpt:
        'Mumbai-based celebrity dietician and entrepreneur Shweta Shah encourages natural wellness through her service-based ventures, Eatfit247 and Fitza, and D2C brand Nutrolife. Shweta Shah was always fascinated by how food affects the shape when she...',
      content: `
        <p>Mumbai-based celebrity dietician and entrepreneur Shweta Shah encourages natural wellness through her service-based ventures, Eatfit247 and Fitza, and D2C brand Nutrolife. Shweta Shah was always fascinated by how food affects the shape when she started her journey in nutrition.</p>
        
        <p>With years of experience and expertise, Shweta has worked with some of Bollywood's biggest stars including Katrina Kaif and Deepika Padukone, helping them achieve their health and fitness goals through personalized nutrition plans.</p>
        
        <h2>Her Journey</h2>
        <p>Shweta's passion for nutrition began early in her career when she realized the transformative power of food. She believes in a holistic approach to wellness that combines traditional Ayurvedic principles with modern nutritional science.</p>
        
        <h2>Services Offered</h2>
        <p>Through Eatfit247, Shweta offers personalized nutrition consultations, meal planning, and wellness programs tailored to individual needs. Her D2C brand Nutrolife provides natural health supplements and products.</p>
        
        <h2>Philosophy</h2>
        <p>Shweta's philosophy centers around natural wellness, sustainable lifestyle changes, and empowering individuals to take control of their health through proper nutrition and mindful eating habits.</p>
      `,
      author: 'eatfit247',
      publishDate: new Date('2022-05-10'),
      category: 'Lifestyle',
      slug: 'meet-shweta-shah-entrepreneur-nutritionist-celebs-katrina-kaif-deepika-padukone',
      readTime: 5,
      tags: ['Celebrity', 'Nutrition', 'Wellness'],
    },
    {
      id: '2',
      title: 'Celebrity Nutritionist Shweta Shah, Nutritionist of Sakshi Dhoni reveals her diet plan.',
      excerpt:
        "The job of a nutritionist is no longer solely to feed one wholesome food, however additionally to encourage their purchasers to lead a totally healthful existence which consists of a superb mindset...",
      author: 'eatfit247',
      publishDate: new Date('2022-05-10'),
      category: 'Lifestyle',
      slug: 'celebrity-nutritionist-shweta-shah-sakshi-dhoni-diet-plan',
      readTime: 4,
      tags: ['Diet Plan', 'Celebrity', 'Nutrition'],
    },
    {
      id: '3',
      title: "Katrina's Nutritionist Shweta Shah spills beans on Bollywood celebrity's diets!",
      excerpt:
        'Celebrity dietician Shweta Shah from Eatfit24by7 helps many adopt an Ayurvedic (Satvik) lifestyle that addresses specific health-related issues and weight loss. She is predicated in Mumbai with a clientele that features leading...',
      author: 'eatfit247',
      publishDate: new Date('2022-04-14'),
      category: 'Lifestyle',
      slug: 'katrina-nutritionist-shweta-shah-bollywood-celebrity-diets',
      readTime: 6,
      tags: ['Bollywood', 'Ayurvedic', 'Weight Loss'],
    },
    {
      id: '4',
      title: 'Understanding Ayurvedic Principles for Modern Wellness',
      excerpt:
        'Discover how ancient Ayurvedic wisdom can be applied to modern lifestyle for optimal health and wellness. Learn about doshas, sattvic diet, and natural healing approaches.',
      author: 'eatfit247',
      publishDate: new Date('2022-06-15'),
      category: 'Wellness',
      slug: 'understanding-ayurvedic-principles-modern-wellness',
      readTime: 8,
      tags: ['Ayurvedic', 'Wellness', 'Natural Healing'],
    },
    {
      id: '5',
      title: 'PCOS Management Through Nutrition: A Complete Guide',
      excerpt:
        'Learn how proper nutrition can help manage PCOS symptoms naturally. Discover hormone-balancing foods, meal planning strategies, and lifestyle modifications for better reproductive health.',
      author: 'eatfit247',
      publishDate: new Date('2022-07-20'),
      category: 'Women Health',
      slug: 'pcos-management-through-nutrition-complete-guide',
      readTime: 10,
      tags: ['PCOS', 'Women Health', 'Hormones'],
    },
    {
      id: '6',
      title: 'Weight Loss Journey: Success Stories and Tips',
      excerpt:
        'Real success stories from individuals who transformed their lives through personalized nutrition plans. Get inspired and learn practical tips for your own weight loss journey.',
      author: 'eatfit247',
      publishDate: new Date('2022-08-10'),
      category: 'Weight Management',
      slug: 'weight-loss-journey-success-stories-tips',
      readTime: 7,
      tags: ['Weight Loss', 'Success Stories', 'Transformation'],
    },
    {
      id: '7',
      title: 'Gut Health: The Foundation of Overall Wellness',
      excerpt:
        'Explore the importance of gut health and how it impacts your overall well-being. Learn about probiotics, prebiotics, and gut-friendly foods for optimal digestive health.',
      author: 'eatfit247',
      publishDate: new Date('2022-09-05'),
      category: 'Wellness',
      slug: 'gut-health-foundation-overall-wellness',
      readTime: 6,
      tags: ['Gut Health', 'Digestion', 'Wellness'],
    },
    {
      id: '8',
      title: 'Pregnancy Nutrition: Essential Guide for Expecting Mothers',
      excerpt:
        'Complete nutrition guide for expecting mothers. Learn about essential nutrients, trimester-specific meal plans, and foods to avoid during pregnancy for a healthy baby and mother.',
      author: 'eatfit247',
      publishDate: new Date('2022-10-12'),
      category: 'Pregnancy Health Care',
      slug: 'pregnancy-nutrition-essential-guide-expecting-mothers',
      readTime: 9,
      tags: ['Pregnancy', 'Nutrition', 'Maternal Health'],
    },
    {
      id: '9',
      title: 'Skin and Hair Health: Nutrition from Within',
      excerpt:
        'Discover how nutrition affects your skin and hair health. Learn about foods that promote glowing skin, strong hair, and natural beauty from the inside out.',
      author: 'eatfit247',
      publishDate: new Date('2022-11-18'),
      category: 'Beauty',
      slug: 'skin-hair-health-nutrition-from-within',
      readTime: 5,
      tags: ['Skin Care', 'Hair Care', 'Beauty'],
    },
    {
      id: '10',
      title: 'Kids Nutrition: Building Healthy Eating Habits Early',
      excerpt:
        'Help your children develop healthy eating habits that will last a lifetime. Learn about kid-friendly nutritious meals, dealing with picky eaters, and making nutrition fun.',
      author: 'eatfit247',
      publishDate: new Date('2022-12-01'),
      category: 'Kids Nourish',
      slug: 'kids-nutrition-building-healthy-eating-habits-early',
      readTime: 6,
      tags: ['Kids', 'Nutrition', 'Healthy Habits'],
    },
    {
      id: '11',
      title: 'Detox and Cleanse: Natural Ways to Reset Your Body',
      excerpt:
        'Learn about natural detoxification methods and cleanse plans that help remove toxins, boost metabolism, and improve overall health without harsh chemicals or extreme diets.',
      author: 'eatfit247',
      publishDate: new Date('2023-01-15'),
      category: 'Wellness',
      slug: 'detox-cleanse-natural-ways-reset-body',
      readTime: 7,
      tags: ['Detox', 'Cleanse', 'Wellness'],
    },
    {
      id: '12',
      title: 'Muscle Gain Nutrition: Fuel Your Fitness Goals',
      excerpt:
        'Complete guide to nutrition for muscle building. Learn about optimal protein intake, meal timing, pre and post-workout nutrition, and supplements for effective muscle gain.',
      author: 'eatfit247',
      publishDate: new Date('2023-02-20'),
      category: 'Fitness',
      slug: 'muscle-gain-nutrition-fuel-fitness-goals',
      readTime: 8,
      tags: ['Muscle Gain', 'Fitness', 'Protein'],
    },
  ];

  /**
   * Get all blog posts
   */
  getAllPosts(): BlogPost[] {
    return [...this.blogPosts].sort(
      (a, b) => b.publishDate.getTime() - a.publishDate.getTime()
    );
  }

  /**
   * Get paginated blog posts
   */
  getPaginatedPosts(page: number, pageSize: number): {
    posts: BlogPost[];
    total: number;
    totalPages: number;
  } {
    const allPosts = this.getAllPosts();
    const total = allPosts.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const posts = allPosts.slice(startIndex, endIndex);

    return { posts, total, totalPages };
  }

  /**
   * Get blog post by ID
   */
  getPostById(id: string): BlogPost | undefined {
    return this.blogPosts.find((post) => post.id === id);
  }

  /**
   * Get blog post by slug
   */
  getPostBySlug(slug: string): BlogPost | undefined {
    return this.blogPosts.find((post) => post.slug === slug);
  }

  /**
   * Get recent posts (excluding current post)
   */
  getRecentPosts(excludeId?: string, limit: number = 5): BlogPost[] {
    const allPosts = this.getAllPosts();
    const filtered = excludeId
      ? allPosts.filter((post) => post.id !== excludeId)
      : allPosts;
    return filtered.slice(0, limit);
  }

  /**
   * Get posts by category
   */
  getPostsByCategory(category: string): BlogPost[] {
    return this.getAllPosts().filter(
      (post) => post.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get all categories
   */
  getAllCategories(): string[] {
    const categories = new Set(
      this.blogPosts.map((post) => post.category)
    );
    return Array.from(categories).sort();
  }
}

