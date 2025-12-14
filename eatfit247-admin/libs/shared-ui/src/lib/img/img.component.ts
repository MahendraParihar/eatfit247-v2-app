import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IMediaUpload } from '@eatfit247-shared-lib';

@Component({
  selector: 'app-img',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './img.component.html',
  styleUrl: './img.component.scss',
})
export class ImgComponent implements OnInit {
  @Input() webUrl!: IMediaUpload[] | string;
  @Input() isAvatar = false;
  @Input() alt = 'Image';
  @Input() mediaPath?: string;

  imageUrl = '';

  ngOnInit(): void {
    if (this.webUrl) {
      if (Array.isArray(this.webUrl) && this.webUrl.length > 0) {
        this.imageUrl = this.webUrl[0].webUrl;
      } else if (typeof this.webUrl === 'string') {
        this.imageUrl = this.webUrl;
      }
    }
    
    // If mediaPath is provided, prepend it to relative URLs
    if (this.mediaPath && this.imageUrl && !this.imageUrl.startsWith('http')) {
      this.imageUrl = `${this.mediaPath}${this.imageUrl}`;
    }
  }
}
