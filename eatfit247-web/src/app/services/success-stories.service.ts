import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { ISuccessStory, ITableList } from 'eatfit247-shared-library';

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
  private readonly httpService = inject(HttpService);
  private readonly endpoint = 'public/success-story/list';
  private cachedStories: SuccessStory[] | null = null;

  /**
   * Load all success stories from API
   */
  async loadStories(): Promise<SuccessStory[]> {
    try {
      const response = await this.httpService.get<ITableList<ISuccessStory>>(
        this.endpoint,
        { active: true, limit: 1000 } // Get all active stories
      );

      if (!response || !response.tableData) {
        console.warn('No success stories data received from API');
        return [];
      }

      // Map API response to frontend interface
      this.cachedStories = response.tableData.map((story) => this.mapToSuccessStory(story));
      return this.cachedStories;
    } catch (error) {
      console.error('Failed to load success stories from API:', error);
      return [];
    }
  }

  /**
   * Map ISuccessStory from API to SuccessStory interface
   */
  private mapToSuccessStory(story: ISuccessStory): SuccessStory {
    // Extract year from date
    const date = new Date(story.date);
    const year = date.getFullYear();

    // Get first image URL if available
    const imageUrl = story.imagePath && story.imagePath.length > 0 
      ? story.imagePath[0].webUrl 
      : undefined;

    return {
      id: story.successStoryId.toString(),
      year: year,
      name: story.name,
      testimonial: story.description,
      imageUrl: imageUrl,
      imageAlt: story.name,
    };
  }

  /**
   * Get all success stories sorted by year
   */
  getAllStories(): SuccessStory[] {
    if (!this.cachedStories) {
      return [];
    }
    return [...this.cachedStories].sort((a, b) => {
      // Sort by year descending, then by name if same year
      if (a.year !== b.year) {
        return b.year - a.year;
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
    return this.getAllStories().find((story) => story.id === id);
  }

  /**
   * Get all unique years
   */
  getAllYears(): number[] {
    const years = new Set(this.getAllStories().map((story) => story.year));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }

  /**
   * Get total number of stories
   */
  getTotalStories(): number {
    return this.cachedStories?.length || 0;
  }
}

