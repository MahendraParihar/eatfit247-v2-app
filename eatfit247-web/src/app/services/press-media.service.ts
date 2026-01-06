import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

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

interface IPressMedia {
  pressMediaId: number;
  title?: string;
  type: 'youtube' | 'press';
  link: string;
  imagePath?: Array<{ url?: string; path?: string; [key: string]: any }>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ITableList<T> {
  tableData: T[];
  count: number;
}

/**
 * Service to manage press and media articles
 * Fetches press/media data from the public API
 */
@Injectable({
  providedIn: 'root',
})
export class PressMediaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Get all press/media articles
   */
  getAllArticles(): Observable<PressMediaArticle[]> {
    const params = new HttpParams().set('limit', '1000');
    const url = `${this.apiUrl}/public/press-media/list`;
    return this.http.get<ITableList<IPressMedia>>(url, { params }).pipe(
      map((response) => {
        return response.tableData
          .map((item) => this.mapPressMediaToArticle(item))
          .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
      }),
      catchError((error) => {
        console.error('Error fetching press/media articles:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get articles by category
   */
  getArticlesByCategory(category: PressMediaArticle['category']): Observable<PressMediaArticle[]> {
    return this.getAllArticles().pipe(
      map((articles) => articles.filter((article) => article.category === category)),
    );
  }

  /**
   * Get article by ID
   */
  getArticleById(id: string): Observable<PressMediaArticle | null> {
    return this.getAllArticles().pipe(
      map((articles) => articles.find((article) => article.id === id) || null),
    );
  }

  /**
   * Get all categories
   */
  getAllCategories(): Observable<PressMediaArticle['category'][]> {
    return this.getAllArticles().pipe(
      map((articles) => {
        const categories = new Set(articles.map((article) => article.category));
        return Array.from(categories).sort();
      }),
    );
  }

  /**
   * Get recent articles
   */
  getRecentArticles(limit: number = 6): Observable<PressMediaArticle[]> {
    return this.getAllArticles().pipe(
      map((articles) => articles.slice(0, limit)),
    );
  }

  /**
   * Map IPressMedia from API to PressMediaArticle
   */
  private mapPressMediaToArticle(item: IPressMedia): PressMediaArticle {
    // Get the first image from imagePath array
    const firstImage = item.imagePath && item.imagePath.length > 0
      ? item.imagePath[0]
      : null;
    const imageUrl = firstImage?.url || firstImage?.path || '';

    // Map type to category
    const category: PressMediaArticle['category'] = item.type === 'press' ? 'News' : 'Feature';

    // Use title or default
    const title = item.title || 'Press & Media Article';

    // Generate excerpt from title (first 150 characters)
    const excerpt = title.length > 150 ? title.substring(0, 150) + '...' : title;

    return {
      id: item.pressMediaId.toString(),
      title: title,
      excerpt: excerpt,
      source: item.type === 'press' ? 'Press' : 'YouTube',
      publishDate: item.createdAt ? new Date(item.createdAt) : new Date(),
      imageUrl: imageUrl,
      articleUrl: item.link,
      category: category,
    };
  }
}
