import { Injectable } from '@angular/core';

export interface PressMediaArticle {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  publishDate: Date;
  imageUrl?: string;
  articleUrl?: string;
  category: 'Blog' | 'News' | 'Interview' | 'Feature';
}

/**
 * Service to manage press and media articles
 */
@Injectable({
  providedIn: 'root',
})
export class PressMediaService {
  private readonly articles: PressMediaArticle[] = [
    {
      id: '1',
      title: "Katrina Kaif's real-life diet that keep her in top shape, according to her go-to nutritionist",
      excerpt:
        'Discover the diet secrets that help Katrina Kaif maintain her fitness and health, as revealed by celebrity nutritionist Shweta Shah.',
      source: 'Blog',
      publishDate: new Date('2023-01-15'),
      category: 'Blog',
      articleUrl: 'https://eatfit24by7.com/blog/katrina-kaif-real-life-diet',
    },
    {
      id: '2',
      title: 'Geeta Basra: "I realised the importance of following a mindful diet in my second pregnancy"',
      excerpt:
        'Geeta Basra shares her journey of discovering mindful eating during her second pregnancy with guidance from nutritionist Shweta Shah.',
      source: 'Blog',
      publishDate: new Date('2023-02-10'),
      category: 'Blog',
      articleUrl: 'https://eatfit24by7.com/blog/geeta-basra-pregnancy-diet',
    },
    {
      id: '3',
      title: 'Dietician Shweta Shah throws light on food antidotes for keeping healthy and fit life',
      excerpt:
        'Expert nutritionist Shweta Shah explains food antidotes and natural remedies for maintaining a healthy and fit lifestyle.',
      source: 'Blog',
      publishDate: new Date('2023-03-05'),
      category: 'Blog',
      articleUrl: 'https://eatfit24by7.com/blog/food-antidotes-healthy-life',
    },
    {
      id: '4',
      title: 'From zoodles to lettuce wraps, this is what Katrina Kaif\'s ideal meals look like.',
      excerpt:
        'Get an inside look at Katrina Kaif\'s ideal meal plans, featuring healthy alternatives like zoodles and lettuce wraps.',
      source: 'Blog',
      publishDate: new Date('2023-03-20'),
      category: 'Blog',
      articleUrl: 'https://eatfit24by7.com/blog/katrina-kaif-ideal-meals',
    },
    {
      id: '5',
      title: 'Shweta Shah on Covid-19 diet, Ayurveda, Katrina Kaif & Deepika Padukone\'s diet secrets & more',
      excerpt:
        'An exclusive interview with Shweta Shah covering Covid-19 nutrition, Ayurvedic principles, and diet secrets of Bollywood celebrities.',
      source: 'Blog',
      publishDate: new Date('2023-04-12'),
      category: 'Interview',
      articleUrl: 'https://eatfit24by7.com/blog/shweta-shah-covid-ayurveda-celeb-diets',
    },
    {
      id: '6',
      title: 'Deepika Padukone\'s Nutritionist Reveals the Actor\'s Diet Plan For Cannes 2019',
      excerpt:
        'Shweta Shah reveals the detailed diet plan that helped Deepika Padukone prepare for her stunning appearance at Cannes 2019.',
      source: 'Blog',
      publishDate: new Date('2023-05-01'),
      category: 'Feature',
      articleUrl: 'https://eatfit24by7.com/blog/deepika-padukone-cannes-diet-2019',
    },
    {
      id: '7',
      title: 'BOLLYWOOD FLOCKS TO NUTRITIONIST SHWETA SHAH. SHE SHARES THEIR DIETS HERE!',
      excerpt:
        'Discover why Bollywood celebrities trust Shweta Shah for their nutrition needs and get insights into their personalized diet plans.',
      source: 'Blog',
      publishDate: new Date('2023-05-15'),
      category: 'Feature',
      articleUrl: 'https://eatfit24by7.com/blog/bollywood-nutritionist-shweta-shah',
    },
    {
      id: '8',
      title: 'EXCLUSIVE: Katrina Kaif doesn\'t follow specific diet, prefers home cooked food: Celeb nutritionist Shweta Shah',
      excerpt:
        'Shweta Shah reveals that Katrina Kaif prefers home-cooked meals over strict diet plans, emphasizing the importance of mindful eating.',
      source: 'Blog',
      publishDate: new Date('2023-06-01'),
      category: 'Interview',
      articleUrl: 'https://eatfit24by7.com/blog/katrina-kaif-home-cooked-food',
    },
    {
      id: '9',
      title: 'We Got A Healthy Food Plan From A Nutritionist Who Has Bollywood Clients',
      excerpt:
        'Get expert nutrition advice and meal plans from Shweta Shah, the nutritionist trusted by Bollywood\'s biggest stars.',
      source: 'Blog',
      publishDate: new Date('2023-06-20'),
      category: 'Feature',
      articleUrl: 'https://eatfit24by7.com/blog/healthy-food-plan-bollywood-nutritionist',
    },
    {
      id: '10',
      title: 'Meet Shweta Shah, an entrepreneur and nutritionist to celebs like Katrina Kaif and Deepika Padukone',
      excerpt:
        'Learn about Shweta Shah\'s journey as an entrepreneur and celebrity nutritionist, working with stars like Katrina Kaif and Deepika Padukone.',
      source: 'Blog',
      publishDate: new Date('2023-07-05'),
      category: 'Feature',
      articleUrl: 'https://eatfit24by7.com/blog/meet-shweta-shah-entrepreneur-nutritionist',
    },
    {
      id: '11',
      title: 'Katrina Kaif\'s nutritionist reveals what the actor eats to stay healthy and fit',
      excerpt:
        'Shweta Shah shares insights into Katrina Kaif\'s daily nutrition routine and the foods that help her maintain her health and fitness.',
      source: 'Blog',
      publishDate: new Date('2023-07-25'),
      category: 'Blog',
      articleUrl: 'https://eatfit24by7.com/blog/katrina-kaif-nutritionist-diet-secrets',
    },
    {
      id: '12',
      title: 'Deepika Padukone\'s Nutritionist Reveals the Actor\'s Pre-Wedding Diet Plan!',
      excerpt:
        'Get exclusive details about Deepika Padukone\'s pre-wedding nutrition plan designed by Shweta Shah for her special day.',
      source: 'Blog',
      publishDate: new Date('2023-08-10'),
      category: 'Feature',
      articleUrl: 'https://eatfit24by7.com/blog/deepika-padukone-pre-wedding-diet',
    },
  ];

  /**
   * Get all press/media articles
   */
  getAllArticles(): PressMediaArticle[] {
    return [...this.articles].sort(
      (a, b) => b.publishDate.getTime() - a.publishDate.getTime()
    );
  }

  /**
   * Get articles by category
   */
  getArticlesByCategory(category: PressMediaArticle['category']): PressMediaArticle[] {
    return this.getAllArticles().filter((article) => article.category === category);
  }

  /**
   * Get article by ID
   */
  getArticleById(id: string): PressMediaArticle | undefined {
    return this.articles.find((article) => article.id === id);
  }

  /**
   * Get all categories
   */
  getAllCategories(): PressMediaArticle['category'][] {
    const categories = new Set(
      this.articles.map((article) => article.category)
    );
    return Array.from(categories).sort();
  }

  /**
   * Get recent articles
   */
  getRecentArticles(limit: number = 6): PressMediaArticle[] {
    return this.getAllArticles().slice(0, limit);
  }
}

