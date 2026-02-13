import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { BannerComponent, LoaderComponent } from '@shared-ui';
import { BannerService } from '../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner, ISuccessStory } from '@eatfit247-shared-library/core';
import { SuccessStoriesService } from '../../core/services/success-stories.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CommonBlogComponent } from '../common-blogs/common-blog.component';
import { CommonProgramComponent } from '../common-program/common-program.component';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    BannerComponent,
    LoaderComponent,
    MatIcon,
    MatButton,
    CommonBlogComponent,
    CommonProgramComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly successStoriesService = inject(SuccessStoriesService);
  readonly loading = signal(false);
  banners: IPublicBanner[] = [];
  stories: ISuccessStory[] = [];

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([this.loadBannerData(), this.loadStories()]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load banner images for Home page.
   * If no banners are returned, the banner section will stay hidden.
   */
  private async loadBannerData(): Promise<void> {
    this.banners = await this.bannerService.getBannerMediaForPage(
      BannerForEnum.HOME
    );
  }

  async loadStories(): Promise<void> {
    // Load stories from API
    this.stories = await this.successStoriesService.loadStories();
  }

  getStoryImage(story: ISuccessStory): string | unknown {
    return story.imagePath && story.imagePath.length > 0
      ? story.imagePath[0].webUrl
      : undefined;
  }
}


