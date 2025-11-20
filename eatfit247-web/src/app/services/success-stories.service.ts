import { Injectable } from '@angular/core';

export interface SuccessStory {
  id: string;
  year: number;
  name: string;
  role?: string;
  testimonial: string;
  imageUrl?: string;
  imageAlt?: string;
}

/**
 * Service to manage success stories
 */
@Injectable({
  providedIn: 'root',
})
export class SuccessStoriesService {
  private readonly baseImageUrl = 'https://eatfit24by7.com/wp-content/uploads';

  private readonly stories: SuccessStory[] = [
    {
      id: '1',
      year: 2016,
      name: 'Harbhajan Singh',
      role: 'Cricketer',
      testimonial:
        'To eat is a necessity but to eat intelligently is an art & this art is beautifully designed by Shweta Shah',
      imageUrl: `${this.baseImageUrl}/2016/01/harbhajan-singh.jpg`,
      imageAlt: 'Harbhajan Singh',
    },
    {
      id: '2',
      year: 2016,
      name: 'Sakshi Dhoni',
      role: 'Celebrity',
      testimonial:
        'Shweta has changed the way I think about the food & lifestyle. Her diet plans are so simple & easy to follow like her mantra "Simple is honest, Simple is powerful"',
      imageUrl: `${this.baseImageUrl}/2016/01/sakshi-dhoni.jpg`,
      imageAlt: 'Sakshi Dhoni',
    },
    {
      id: '3',
      year: 2017,
      name: 'Katrina Kaif',
      role: 'Actress',
      testimonial:
        'I always follow natural route & Shweta is my on go nutritionist. All natural decoctions & remedies are superb & shweta is champion of using ancient roots to our daily diet & balancing our "Body Doshas"',
      imageUrl: `${this.baseImageUrl}/2017/01/katrina-kaif.jpg`,
      imageAlt: 'Katrina Kaif',
    },
    {
      id: '4',
      year: 2018,
      name: 'Rakul Preet Singh',
      role: 'Actress',
      testimonial:
        'Who says you can\'t eat dal roti sabzi? Healthy means wholesome! That\'s all I learned from Shweta & Eatfit247',
      imageUrl: `${this.baseImageUrl}/2018/01/rakul-preet-singh.jpg`,
      imageAlt: 'Rakul Preet Singh',
    },
    {
      id: '5',
      year: 2019,
      name: 'Yasmin Karachiwala',
      role: 'Fitness Expert',
      testimonial:
        'Most people have no idea how good their body is designed to feel; Thanks shweta for understanding my prakiti & balance my body doshas. I loved your AI i.e. ancient intelligence and Vata, Pitta, kapha.',
      imageUrl: `${this.baseImageUrl}/2019/01/yasmin-karachiwala.jpg`,
      imageAlt: 'Yasmin Karachiwala',
    },
  ];

  /**
   * Get all success stories sorted by year
   */
  getAllStories(): SuccessStory[] {
    return [...this.stories].sort((a, b) => {
      // Sort by year, then by name if same year
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get stories by year
   */
  getStoriesByYear(year: number): SuccessStory[] {
    return this.getAllStories().filter((story) => story.year === year);
  }

  /**
   * Get story by ID
   */
  getStoryById(id: string): SuccessStory | undefined {
    return this.stories.find((story) => story.id === id);
  }

  /**
   * Get all unique years
   */
  getAllYears(): number[] {
    const years = new Set(this.stories.map((story) => story.year));
    return Array.from(years).sort((a, b) => a - b);
  }

  /**
   * Get total number of stories
   */
  getTotalStories(): number {
    return this.stories.length;
  }
}

