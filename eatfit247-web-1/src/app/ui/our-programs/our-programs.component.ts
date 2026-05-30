import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbsComponent, StoryCardComponent } from '@shared-ui';
import {
  ISuccessStory,
  SuccessStoryMediaType,
} from '@eatfit247-shared-library/core';
import { JsonLdService, SEOService } from '../../core/services';
import { SuccessStoriesService } from '../../core/services/success-stories.service';
import { WHATSAPP_LINK } from '../../core/utils/constants';
import { buildMediaUrl } from '../../core/utils/media-url.util';

interface HowWeWorkStep {
  readonly num: string;
  readonly stepColor: string;
  readonly title: string;
  readonly description: string;
}

interface VideoTestimonial {
  readonly name: string;
  readonly role: string;
  readonly description: string;
  readonly posterUrl?: string;
  readonly mediaType: SuccessStoryMediaType;
  readonly youtubeId?: string;
  readonly videoSrc?: string;
}

interface ExpertCard {
  readonly name: string;
  readonly image: string;
  readonly description: string;
  readonly link: string;
}

@Component({
  standalone: true,
  selector: 'app-our-programs',
  imports: [CommonModule, RouterLink, BreadcrumbsComponent, StoryCardComponent],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss',
})
export class OurProgramsComponent implements OnInit {
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);
  private readonly successStoriesService = inject(SuccessStoriesService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly whatsappLink = WHATSAPP_LINK;

  // ============== How We Work — 5 steps ==============
  readonly howWeWorkSteps: ReadonlyArray<HowWeWorkStep> = [
    {
      num: '01',
      stepColor: '#f4a23c',
      title: 'Understand You Deeply',
      description:
        'We begin with a detailed consultation, health history review & Ayurvedic Prakriti Analysis (Vata–Pitta–Kapha) to understand your body type, imbalances & root causes.',
    },
    {
      num: '02',
      stepColor: '#ee6f5d',
      title: 'Personalised Nutrition Plan',
      description:
        'No generic diets. We create a 100% customised food & lifestyle plan designed around your health goals, routine, preferences & body needs.',
    },
    {
      num: '03',
      stepColor: '#19b3b3',
      title: 'Ayurveda + Modern Nutrition',
      description:
        'We combine Ayurvedic wisdom with practical modern nutrition — focusing on gut health, metabolism, hormones, digestion, sleep & sustainable healing.',
    },
    {
      num: '04',
      stepColor: '#2378c3',
      title: 'Ongoing Guidance & Support',
      description:
        'Through follow-ups, expert guidance, WhatsApp support (depending on the plan), remedies, breathwork & exercise, we help you stay consistent.',
    },
    {
      num: '05',
      stepColor: '#3e5871',
      title: 'Heal the Root Cause',
      description:
        "We don't believe in shortcuts, harsh restrictions or symptom management. We work on the root cause to help you build habits that last a lifetime.",
    },
  ];

  // ============== Pick the Expert — 2 cards ==============
  readonly expertCards: ReadonlyArray<ExpertCard> = [
    {
      name: 'Exclusively with Shweta Shah',
      image: '/nutritionist/shweta-shah.png',
      description:
        'Celebrity Nutritionist, renowned for her innovative approach that merges the wisdom of Ayurveda with the precision of modern nutritional science.',
      link: '/our-programs/about-shweta-shah-nutritionist',
    },
    {
      name: 'Plan with Chief Nutritionist',
      image: '/nutritionist/birangi.png',
      description:
        'Experience of 16 years & trained under Shweta Shah, follows the same approach.',
      link: '/our-programs/about-chief-nutritionist',
    },
  ];

  // ============== Video testimonials ==============

  readonly videos = signal<ReadonlyArray<VideoTestimonial>>([]);

  readonly vtIndex = signal(0);
  readonly vtPerView = signal(4);

  readonly vtMaxIndex = computed(() =>
    Math.max(0, this.videos().length - this.vtPerView()),
  );
  readonly vtPageCount = computed(() => this.vtMaxIndex() + 1);
  readonly vtPages = computed(() =>
    Array.from({ length: this.vtPageCount() }, (_, i) => i),
  );
  readonly vtTrackStyle = computed(() => {
    const i = this.vtIndex();
    const pv = this.vtPerView();
    return {
      transform: `translateX(calc((-100% / ${pv} - var(--space-5)) * ${i}))`,
    };
  });

  vtPrev(): void {
    this.vtIndex.set(Math.max(0, this.vtIndex() - 1));
  }
  vtNext(): void {
    this.vtIndex.set(Math.min(this.vtMaxIndex(), this.vtIndex() + 1));
  }
  vtGoTo(i: number): void {
    this.vtIndex.set(Math.min(this.vtMaxIndex(), Math.max(0, i)));
  }

  @HostListener('window:resize')
  onResize(): void {
    this.recomputeVtPerView();
  }
  private recomputeVtPerView(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const w = window.innerWidth;
    let pv = 4;
    if (w <= 540) pv = 1;
    else if (w <= 820) pv = 2;
    else if (w <= 1100) pv = 3;
    this.vtPerView.set(pv);
    if (this.vtIndex() > this.vtMaxIndex()) {
      this.vtIndex.set(this.vtMaxIndex());
    }
  }

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'Our Nutrition & Wellness Programs',
      description:
        'Explore EatFit247 personalized nutrition programs for weight management, detox, PCOS, and holistic wellness.',
      url: '/our-programs',
    });
    await this.loadVideoTestimonials();
    this.recomputeVtPerView();
    this.jsonLdService.setPageSchema(
      this.jsonLdService.buildBreadcrumb([
        { name: 'Home', url: 'https://eatfit24by7.com/' },
        { name: 'Programs', url: 'https://eatfit24by7.com/our-programs' },
      ]),
    );
  }

  private async loadVideoTestimonials(): Promise<void> {
    try {
      const stories = await this.successStoriesService.loadStories();
      const mapped = stories
        .map((s) => this.toVideoTestimonial(s))
        .filter((v): v is VideoTestimonial => v !== null);
      if (mapped.length > 0) {
        this.videos.set(mapped);
      }
    } catch {
      // keep fallback
    }
  }

  private toVideoTestimonial(s: ISuccessStory): VideoTestimonial | null {
    const mediaType: SuccessStoryMediaType = s.mediaType ?? 'image';
    const media = s.imagePath ?? [];
    const posterItem = media.find((m) => m.mimetype?.startsWith('image/'));
    const videoItem = media.find((m) => m.mimetype?.startsWith('video/'));
    const posterUrl = buildMediaUrl(posterItem?.webUrl);
    const videoUrl = buildMediaUrl(videoItem?.webUrl ?? media[0]?.webUrl);

    if (mediaType === 'youtube') {
      const youtubeId = this.extractYoutubeId(s.youtubeUrl);
      if (!youtubeId && !posterUrl) return null;
      const thumb = posterUrl ||
        (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : '');
      return {
        name: s.name,
        role: s.title ?? '',
        description: s.description ?? '',
        posterUrl: thumb,
        mediaType,
        youtubeId,
      };
    }

    if (mediaType === 'video') {
      if (!videoUrl) return null;
      return {
        name: s.name,
        role: s.title ?? '',
        description: s.description ?? '',
        posterUrl,
        mediaType,
        videoSrc: videoUrl,
      };
    }

    const imageUrl = posterUrl || buildMediaUrl(media[0]?.webUrl);
    if (!imageUrl) return null;
    return {
      name: s.name,
      role: s.title ?? '',
      description: s.description ?? '',
      posterUrl: imageUrl,
      mediaType: 'image',
    };
  }

  private extractYoutubeId(url: string | undefined): string | undefined {
    if (!url) return undefined;
    const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : url;
  }

  trackByVideoName = (_: number, v: VideoTestimonial): string => v.name;
}
