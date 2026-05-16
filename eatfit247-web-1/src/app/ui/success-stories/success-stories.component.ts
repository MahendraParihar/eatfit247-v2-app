import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbsComponent, LoaderComponent } from '@shared-ui';
import { JsonLdService, SEOService } from '../../core/services';
import { ISuccessStory } from '@eatfit247-shared-library/core';
import { SuccessStoriesService } from '../../core/services/success-stories.service';

interface CelebView {
  id: string | number;
  name: string;
  date: string;
  img: string;
  quote: string;
}

@Component({
  standalone: true,
  selector: 'app-success-stories',
  imports: [CommonModule, RouterLink, LoaderComponent, BreadcrumbsComponent],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss',
})
export class SuccessStoriesComponent implements OnInit {
  private readonly successStoriesService = inject(SuccessStoriesService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);

  readonly loading = signal(false);

  readonly celebs = signal<CelebView[]>([]);
  readonly hasStories = computed(() => this.celebs().length > 0);

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'Celebrity Testimonials',
      description:
        'Real transformation stories from EatFit247 clients who achieved their health and wellness goals.',
      url: '/success-stories',
    });
    this.loading.set(true);
    try {
      await this.loadStories();
    } finally {
      this.loading.set(false);
    }
  }

  async loadStories(): Promise<void> {
    let allStories: ISuccessStory[] = [];
    try {
      allStories = await this.successStoriesService.loadStories();
    } catch {
      allStories = [];
    }

    const mapped: CelebView[] = allStories.map((s) => ({
      id: s.successStoryId,
      name: s.name,
      date: this.formatMonthYear(s.date),
      img: s.imagePath && s.imagePath.length > 0 ? s.imagePath[0].webUrl : '',
      quote: s.description,
    }));

    this.jsonLdService.setPageSchema({
      '@type': 'ItemList',
      name: 'Success Stories — EatFit247',
      itemListElement: this.celebs()
        .slice(0, 10)
        .map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
        })),
    } as Record<string, unknown>);
  }

  private formatMonthYear(d?: string | Date): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
}
