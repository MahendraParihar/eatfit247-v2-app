import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CardComponent, ICardData } from '@shared-ui';
import { BlogService } from '../../core/services';

@Component({
  standalone: true,
  selector: 'app-common-blog',
  imports: [
    CommonModule,
    CardComponent
  ],
  templateUrl: './common-blog.component.html',
  styleUrl: './common-blog.component.scss'
})
export class CommonBlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  readonly loading = signal(false);
  readonly title = 'From Our Blog';
  readonly tagline =
    'A dream venture to lead you to your best self in the most natural way possible. Lead a healthy life without tweaking your lifestyle.';
  latestBlogs: ICardData[] = [];

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await this.loadLatestBlogs();
    } finally {
      this.loading.set(false);
    }
  }

  private async loadLatestBlogs(): Promise<void> {
    const response = await this.blogService.getBlogs(0, 3);
    const blogs = response?.tableData ?? [];
    this.latestBlogs = this.blogService.mapBlogsToCards(blogs);
  }
}


