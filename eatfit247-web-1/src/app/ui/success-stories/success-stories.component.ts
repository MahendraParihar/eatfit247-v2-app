import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BannerComponent, BreadcrumbsComponent, LoaderComponent } from '@shared-ui';
import { BannerService, JsonLdService, SEOService } from '../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner, ISuccessStory } from '@eatfit247-shared-library/core';
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
  imports: [CommonModule, RouterLink, BannerComponent, LoaderComponent, BreadcrumbsComponent],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss',
})
export class SuccessStoriesComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly successStoriesService = inject(SuccessStoriesService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);

  readonly loading = signal(false);
  banners: IPublicBanner[] = [];

  private readonly fallbackCelebs: CelebView[] = [
    { id: 'c1', name: 'Priya Raghavan', date: 'May 2026', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80', quote: 'Shweta changed my relationship with food. No crash diets, no guilt — just a plan that actually fit my life.' },
    { id: 'c2', name: 'Ramesh Verma', date: 'Apr 2026', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', quote: 'I came in sceptical. Six months later my reports are the best they’ve been in a decade. Genuine gratitude.' },
    { id: 'c3', name: 'Anusha Kapoor', date: 'Mar 2026', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80', quote: 'Post-shoot, post-baby, back to myself. She built a plan around my schedule, not the other way around.' },
    { id: 'c4', name: 'Arjun Mehta', date: 'Feb 2026', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80', quote: 'Clean, science-backed, zero nonsense. My trainer and my nutritionist finally speak the same language.' },
    { id: 'c5', name: 'Nisha Tandon', date: 'Jan 2026', img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80', quote: 'She treats you like a person, not a case file. Every call felt like I was being properly heard.' },
    { id: 'c6', name: 'Sunita Apte', date: 'Dec 2025', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80', quote: 'At 63, I finally understand my body. My family eats better because I eat better. That’s the real win.' },
    { id: 'c7', name: 'Vikram Shah', date: 'Nov 2025', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', quote: 'I travel for tournaments half the year. Shweta’s protocol travels with me. Simple, portable, works.' },
    { id: 'c8', name: 'Geeta Padmanabhan', date: 'Oct 2025', img: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=600&q=80', quote: 'Honest, patient, and relentless in the best way. She will not let you quit on yourself.' },
    { id: 'c9', name: 'Kunal Desai', date: 'Sep 2025', img: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80', quote: 'The before/after isn’t just physical. I sleep better, I think clearer, I actually enjoy meals now.' },
    { id: 'c10', name: 'Ishita Rao', date: 'Aug 2025', img: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80', quote: 'For film prep she’s my first call. Nothing extreme, nothing faddish — just a real, workable plan.' },
    { id: 'c11', name: 'Dev Malhotra', date: 'Jul 2025', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', quote: 'I’ve worked with many experts. Shweta is the only one who stuck. The follow-through is what sets her apart.' },
    { id: 'c12', name: 'Rhea Nair', date: 'Jun 2025', img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80', quote: 'Warm, sharp and deeply knowledgeable. Recommending her is the easiest thing I do all year.' },
  ];

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
      await this.loadBannerData();
      await this.loadStories();
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.SUCCESS_STORIES,
      );
    } catch {
      this.banners = [];
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
      img:
        s.imagePath && s.imagePath.length > 0
          ? s.imagePath[0].webUrl
          : '',
      quote: s.description,
    }));

    this.celebs.set(mapped.length > 0 ? mapped : this.fallbackCelebs);

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
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
